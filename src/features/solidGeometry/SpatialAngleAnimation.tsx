import { useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { ThreePanel } from "@/components/Layout/ThreePanel";
import { ThreeDCanvas } from "@/components/Layout/ThreeDCanvas";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  MathPanel,
  TabSwitcher,
  SelectGrid,
  Toggle,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { Legend3D, CameraRig, ModeSwitchOverlay3D } from "@/components/Math3D";
import type { LegendItem } from "@/components/Math3D";
import { use3DViewport } from "@/hooks/use3DViewport";
import type { CameraPreset } from "@/hooks/use3DViewport";
import { buildMathQuantities } from "@/data/mathQuantities";
import { spatialAngleMeta } from "@/data/registries/solidGeometry";
import {
  solveCuboidVertices,
  solveSkewLines,
  solveLinePlaneAngle,
  solveDihedralAngle,
  solvePointToPlaneDistance,
} from "@/math3d/spatialAngle";
import type { Vec3 } from "@/math3d/vector3";
import CuboidBaseScene from "./CuboidBaseScene";
import SkewLinesModeScene from "./modes/SkewLinesModeScene";
import LinePlaneModeScene from "./modes/LinePlaneModeScene";
import DihedralModeScene from "./modes/DihedralModeScene";
import DistanceModeScene from "./modes/DistanceModeScene";

type AngleMode = "skewLines" | "linePlane" | "dihedral" | "distance";

export default function SpatialAngleAnimation() {
  const location = useLocation();
  const defaultMode: AngleMode = location.pathname.includes("distance")
    ? "distance"
    : "skewLines";

  const [activeMode, setActiveMode] = useState<AngleMode>(defaultMode);
  const [modelPreset, setModelPreset] = useState<string>("free");
  const [interactionMode, setInteractionMode] = useState<"orbit" | "drag">(
    "orbit",
  );

  // 数学分类图层控制开关 (解耦必修二综合法与选修一向量法，默认纯几何优先)
  const [showAxes, setShowAxes] = useState<boolean>(false); // 空间直角坐标系 A-xyz (默认关闭，符合高中综合几何习惯)
  const [showCoordinates, setShowCoordinates] = useState<boolean>(true); // 空间点坐标数值标注 (建系后生效)
  const [showAuxiliary, setShowAuxiliary] = useState<boolean>(true); // 几何辅助线 (平移线/射影/垂线高)
  const [showRightAngles, setShowRightAngles] = useState<boolean>(true); // 空间垂直与直角符号
  const [showAngles, setShowAngles] = useState<boolean>(true); // 特征空间角弧 θ
  const [showNormals, setShowNormals] = useState<boolean>(false); // 空间法向量/方向向量 (选修一向量法，按需开启)

  const [params, setParams] = useState<Record<string, number>>({
    a: 3,
    b: 2,
    c: 2,
    lambda: 0.6,
  });

  const { preset, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  const { a, b, c, lambda } = params;

  // 长方体及动点坐标解算
  const vertices = useMemo(
    () => solveCuboidVertices(a, b, c, lambda),
    [a, b, c, lambda],
  );

  // 动点 E 沿侧棱 AA1 拖拽反向求参回调 (同步切回自由探究预设)
  const handleEPointDrag = (next: Vec3) => {
    setModelPreset("free");
    setParams((prev) => ({
      ...prev,
      lambda: Number(Math.min(1.0, Math.max(0.1, next.z / c)).toFixed(2)),
    }));
  };

  // 异面直线模型计算
  const skewData = useMemo(
    () => solveSkewLines(a, b, c, lambda),
    [a, b, c, lambda],
  );

  // 空间斜线线面角模型计算
  const linePlaneData = useMemo(
    () => solveLinePlaneAngle(a, b, c, lambda),
    [a, b, c, lambda],
  );

  // 二面角模型计算
  const dihedralData = useMemo(
    () => solveDihedralAngle(a, b, c, lambda),
    [a, b, c, lambda],
  );

  // 距离与极值模型计算
  const distanceData = useMemo(
    () => solvePointToPlaneDistance(a, b, c, lambda),
    [a, b, c, lambda],
  );

  // 组装右屏看板数据 (精准同步左屏探究模式与典型预设)
  const animId =
    activeMode === "distance" ? "anim-solid-distance" : "anim-solid-angle";
  const mathData = useMemo(
    () =>
      buildMathQuantities(animId, params, {
        mode: activeMode,
        preset: modelPreset,
      }),
    [params, activeMode, modelPreset, animId],
  );

  // 探究模式对应的典型模型预设 (2x2 对称布局：自由探究 + 3大典型母题)
  const currentPresets = useMemo(() => {
    const presetsByMode: Record<
      AngleMode,
      {
        key: string;
        label: string;
        description: string;
        params: Record<string, number>;
      }[]
    > = {
      skewLines: [
        {
          key: "free",
          label: "自由探究",
          description: "全参数开放",
          params: { a: 3, b: 2, c: 2, lambda: 0.5 },
        },
        {
          key: "cube",
          label: "正方体",
          description: "60°秒杀",
          params: { a: 2.5, b: 2.5, c: 2.5, lambda: 0.5 },
        },
        {
          key: "tallPrism",
          label: "直四棱柱",
          description: "正方形底",
          params: { a: 2.5, b: 2.5, c: 3.5, lambda: 0.5 },
        },
        {
          key: "standard",
          label: "经典长方体",
          description: "3:2:2算例",
          params: { a: 3, b: 2, c: 2, lambda: 0.5 },
        },
      ],
      linePlane: [
        {
          key: "free",
          label: "自由探究",
          description: "全参数开放",
          params: { a: 3, b: 2, c: 2.5, lambda: 0.6 },
        },
        {
          key: "midpoint",
          label: "中点斜线",
          description: "λ=0.5中点",
          params: { a: 3, b: 2, c: 2.5, lambda: 0.5 },
        },
        {
          key: "bodyDiag",
          label: "体对角线",
          description: "正方体对角",
          params: { a: 2.5, b: 2.5, c: 2.5, lambda: 1.0 },
        },
        {
          key: "tallPrismMid",
          label: "正棱柱中点",
          description: "正棱柱中点",
          params: { a: 2.5, b: 2.5, c: 3.5, lambda: 0.5 },
        },
      ],
      dihedral: [
        {
          key: "free",
          label: "自由探究",
          description: "全参数开放",
          params: { a: 3, b: 2, c: 2, lambda: 0.7 },
        },
        {
          key: "cubeSection",
          label: "正方体截面",
          description: "正方体截面",
          params: { a: 2.5, b: 2.5, c: 2.5, lambda: 1.0 },
        },
        {
          key: "midSection",
          label: "中点截面",
          description: "λ=0.5中点",
          params: { a: 3, b: 2, c: 2, lambda: 0.5 },
        },
        {
          key: "tallPrismSection",
          label: "正棱柱截面",
          description: "正棱柱截面",
          params: { a: 2.5, b: 2.5, c: 3.5, lambda: 1.0 },
        },
      ],
      distance: [
        {
          key: "free",
          label: "自由探究",
          description: "全参数开放",
          params: { a: 3, b: 2, c: 2, lambda: 0.6 },
        },
        {
          key: "maxVolume",
          label: "顶点极值",
          description: "顶点极值",
          params: { a: 3, b: 2, c: 2, lambda: 1.0 },
        },
        {
          key: "cubeThird",
          label: "正方体距",
          description: "正方体距",
          params: { a: 2.5, b: 2.5, c: 2.5, lambda: 1.0 },
        },
        {
          key: "midVolume",
          label: "中点半体积",
          description: "中点半体积",
          params: { a: 3, b: 2, c: 2, lambda: 0.5 },
        },
      ],
    };
    return presetsByMode[activeMode] ?? presetsByMode.skewLines;
  }, [activeMode]);

  // 高考模型预设切换 (铁律：仅调参数，严禁篡改 activeMode)
  const handleModelPresetChange = (pKey: string) => {
    setModelPreset(pKey);
    const target = currentPresets.find((p) => p.key === pKey);
    if (target) {
      setParams(target.params);
    }
  };

  const handleParamChange = (key: string, value: number) => {
    // 智能联动逻辑：根据当前模型预设的几何特征约束自动同步关联尺寸
    if (
      modelPreset === "cube" ||
      modelPreset === "cubeSection" ||
      modelPreset === "bodyDiag" ||
      modelPreset === "cubeThird"
    ) {
      // 正方体约束：a=b=c 同步联动
      if (key === "a" || key === "b" || key === "c") {
        setParams((prev) => ({ ...prev, a: value, b: value, c: value }));
        return;
      }
    } else if (
      modelPreset === "tallPrism" ||
      modelPreset === "tallPrismMid" ||
      modelPreset === "tallPrismSection"
    ) {
      // 直四棱柱约束：底面正方形 a=b 同步联动
      if (key === "a" || key === "b") {
        setParams((prev) => ({ ...prev, a: value, b: value }));
        return;
      }
    }
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setModelPreset("free");
    setParams({ a: 3, b: 2, c: 2, lambda: 0.6 });
  };

  // 沿棱直视视角触发
  const handleAlignAlongEdge = () => {
    const controls = controlsRef.current;
    if (controls) {
      const eyeX = a + a * 1.8;
      const eyeY = -b * 1.8;
      const eyeZ = c * 0.8;
      controls.object.position.set(eyeX, eyeY, eyeZ);
      controls.target.set(a / 2, b / 2, c / 4);
      controls.update();
    }
  };

  // 核心参数过滤与可见性决策系统 (自由探究全开放，典型预设精准隐藏无关参数)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const isCubePreset =
      modelPreset === "cube" ||
      modelPreset === "cubeSection" ||
      modelPreset === "bodyDiag" ||
      modelPreset === "cubeThird";

    const isPrismPreset =
      modelPreset === "tallPrism" ||
      modelPreset === "tallPrismMid" ||
      modelPreset === "tallPrismSection";

    const isFixedLambdaPreset =
      modelPreset === "midpoint" ||
      modelPreset === "bodyDiag" ||
      modelPreset === "tallPrismMid" ||
      modelPreset === "cubeSection" ||
      modelPreset === "midSection" ||
      modelPreset === "tallPrismSection" ||
      modelPreset === "maxVolume" ||
      modelPreset === "cubeThird" ||
      modelPreset === "midVolume";

    // 1. 决定当前探究模式下需要呈现的参数集合
    let activeKeys: string[];

    if (activeMode === "skewLines") {
      // 异面直线角只由长方体尺寸决定，彻底排除动点 lambda
      if (modelPreset === "free" || modelPreset === "standard") {
        activeKeys = ["a", "b", "c"]; // 自由探究：三边自由
      } else if (isCubePreset) {
        activeKeys = ["a"]; // 正方体：单棱长 (联动 b=a, c=a)
      } else if (isPrismPreset) {
        activeKeys = ["a", "c"]; // 直四棱柱：底边 a (联动 b=a) + 侧棱高 c
      } else {
        activeKeys = ["a", "b", "c"];
      }
    } else {
      // linePlane / dihedral / distance 模式
      if (modelPreset === "free") {
        // 自由探究：全部参数开放可调
        activeKeys = ["a", "b", "c", "lambda"];
      } else if (isCubePreset) {
        // 正方体预设：隐藏 b, c；若动点固定则同时隐藏 lambda
        activeKeys = isFixedLambdaPreset ? ["a"] : ["a", "lambda"];
      } else if (isPrismPreset) {
        // 直四棱柱预设：隐藏 b；若动点固定则同时隐藏 lambda
        activeKeys = isFixedLambdaPreset ? ["a", "c"] : ["a", "c", "lambda"];
      } else if (isFixedLambdaPreset) {
        // 特征动点固定预设：隐藏 lambda，仅展示尺寸参数
        activeKeys = ["a", "b", "c"];
      } else {
        activeKeys = ["a", "b", "c", "lambda"];
      }
    }

    return spatialAngleMeta
      .filter((meta) => activeKeys.includes(meta.key))
      .map((meta) => {
        // 在正方体预设下，将 label 描述提升为“正方体棱长 a”
        const label =
          isCubePreset && meta.key === "a" ? "正方体棱长 a" : meta.label;
        const description =
          isCubePreset && meta.key === "a"
            ? "长宽高同步 a=b=c"
            : isPrismPreset && meta.key === "a"
              ? "底面正方形 a=b"
              : meta.description;

        return {
          key: meta.key,
          label,
          labelFormula:
            isCubePreset && meta.key === "a" ? undefined : meta.labelFormula,
          value: params[meta.key] ?? meta.defaultValue ?? 0,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 0.05,
          description,
          descriptionFormula: undefined, // 彻底消除重复公式
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, activeMode, modelPreset]);

  // 中屏图例按探究模式与图层开关精准动态同步
  const legendItems = useMemo<LegendItem[]>(() => {
    switch (activeMode) {
      case "skewLines":
        return [
          { colorKey: "primary", swatch: "line", label: "异面直线 A₁B 与 AC" },
          {
            colorKey: "accent",
            swatch: "line",
            label: "辅助平移线 D₁C // A₁B",
          },
          { colorKey: "highlight", swatch: "line", label: "夹角 θ (∠ACD₁)" },
          ...(showNormals
            ? [
                {
                  colorKey: "primary" as const,
                  swatch: "line" as const,
                  label: "方向向量 u⃗ (A₁B)",
                },
                {
                  colorKey: "accent" as const,
                  swatch: "line" as const,
                  label: "方向向量 v⃗ (AC)",
                },
              ]
            : []),
        ];
      case "linePlane":
        return [
          { colorKey: "primary", swatch: "line", label: "空间斜线 EC" },
          { colorKey: "accent", swatch: "line", label: "垂线 EA 与射影 AC" },
          { colorKey: "secondary", swatch: "area", label: "底面 ABCD" },
          { colorKey: "highlight", swatch: "line", label: "线面角 θ (∠ECA)" },
          ...(showNormals
            ? [
                {
                  colorKey: "secondary" as const,
                  swatch: "line" as const,
                  label: "底面法向量 n⃗",
                },
              ]
            : []),
        ];
      case "dihedral":
        return [
          { colorKey: "primary", swatch: "line", label: "截面交线 BD" },
          {
            colorKey: "accent",
            swatch: "line",
            label: "三垂线 AM⊥BD 与 EM⊥BD",
          },
          { colorKey: "secondary", swatch: "area", label: "截面 BDE 与底面" },
          {
            colorKey: "highlight",
            swatch: "line",
            label: "二面角平面角 θ (∠AME)",
          },
          ...(showNormals
            ? [
                {
                  colorKey: "secondary" as const,
                  swatch: "line" as const,
                  label: "底面法向量 n⃗₁",
                },
                {
                  colorKey: "primary" as const,
                  swatch: "line" as const,
                  label: "截面法向量 n⃗₂",
                },
              ]
            : []),
        ];
      case "distance":
        return [
          { colorKey: "primary", swatch: "line", label: "三棱锥棱线与截面边" },
          {
            colorKey: "highlight",
            swatch: "line",
            label: "点 A 到截面高线 AH (距离 d)",
          },
          {
            colorKey: "secondary",
            swatch: "area",
            label: "底面 ABD 与截面 BDE",
          },
          {
            colorKey: "accent",
            swatch: "line",
            label: "竖直侧高 EA (等体积换底)",
          },
          ...(showNormals
            ? [
                {
                  colorKey: "primary" as const,
                  swatch: "line" as const,
                  label: "截面法向量 n⃗",
                },
              ]
            : []),
        ];
    }
  }, [activeMode, showNormals]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* Step 1: 探究模式 (纯净紧凑 2x2 控制卡片) */}
          <LeftPanelSection title="探究模式">
            <SelectGrid
              items={[
                {
                  key: "skewLines",
                  label: "异面直线角",
                  description: "平移转化",
                },
                {
                  key: "linePlane",
                  label: "线面夹角",
                  description: "垂线射影",
                },
                {
                  key: "dihedral",
                  label: "空间二面角",
                  description: "三垂线法",
                },
                {
                  key: "distance",
                  label: "点面距离",
                  description: "等体积法",
                },
              ]}
              value={activeMode}
              onChange={(m) => {
                setActiveMode(m as AngleMode);
                setModelPreset("free");
              }}
              columns={2}
            />
          </LeftPanelSection>

          {/* Step 2: 典型模型预设 (2x2 黄金对称布局：自由探究 + 3大典型母题) */}
          <LeftPanelSection title="典型模型预设">
            <SelectGrid
              items={currentPresets}
              value={modelPreset}
              onChange={handleModelPresetChange}
              columns={2}
            />
          </LeftPanelSection>

          {/* Step 3: 参数调节 (按当前模式与预设过滤) */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* Step 4: 几何与向量图层控制 (按高中两大体系分类) */}
          <LeftPanelSection title="图层与标注显示控制" compact>
            <div className="space-y-2.5">
              {/* 必修二：综合几何法图层 */}
              <div className="bg-neutral-50/80 p-2.5 rounded-lg border border-neutral-200/70">
                <div className="text-[11px] font-semibold text-neutral-600 mb-2 flex items-center gap-1.5">
                  <span className="text-xs">📐</span>
                  <span>综合几何法（必修二）</span>
                </div>
                <div className="space-y-2">
                  <Toggle
                    label="几何辅助线（平移/射影/垂线）"
                    checked={showAuxiliary}
                    onChange={setShowAuxiliary}
                  />
                  <Toggle
                    label="垂直直角符号（⊥）"
                    checked={showRightAngles}
                    onChange={setShowRightAngles}
                  />
                  <Toggle
                    label="空间特征角弧（θ）"
                    checked={showAngles}
                    onChange={setShowAngles}
                  />
                </div>
              </div>

              {/* 选修一：空间向量法图层 */}
              <div className="bg-blue-50/40 p-2.5 rounded-lg border border-blue-100/80">
                <div className="text-[11px] font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
                  <span className="text-xs">🧭</span>
                  <span>空间向量法（选修一）</span>
                </div>
                <div className="space-y-2">
                  <Toggle
                    label="空间直角坐标系（A-xyz）"
                    checked={showAxes}
                    onChange={setShowAxes}
                  />
                  {showAxes && (
                    <Toggle
                      label="空间点坐标标注（x, y, z）"
                      checked={showCoordinates}
                      onChange={setShowCoordinates}
                    />
                  )}
                  {activeMode === "skewLines" ? (
                    <Toggle
                      label="方向向量（代数向量 u⃗, v⃗）"
                      checked={showNormals}
                      onChange={setShowNormals}
                    />
                  ) : (
                    <Toggle
                      label="空间法向量（代数向量 n⃗）"
                      checked={showNormals}
                      onChange={setShowNormals}
                    />
                  )}
                </div>
              </div>
            </div>
          </LeftPanelSection>

          {/* Step 5: 3D 空间视角预设 */}
          <LeftPanelSection title="3D 空间视角预设">
            <TabSwitcher
              layout="horizontal"
              tabs={[
                { key: "iso", label: "轴测直观" },
                { key: "front", label: "主视正投" },
                { key: "top", label: "俯视底面" },
                { key: "side", label: "左视侧面" },
              ]}
              value={preset}
              onChange={(p) => setCameraPreset(p as CameraPreset)}
            />
            {activeMode === "dihedral" && (
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={handleAlignAlongEdge}
                  className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/80 rounded-md text-xs text-blue-700 font-medium flex items-center justify-center gap-1.5 transition-colors active:scale-[0.99]"
                >
                  <span>📐</span>
                  <span>沿棱对齐直视（视线沿交线 BD 判定平面角 ∠AME）</span>
                </button>
              </div>
            )}
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative">
          <ThreeDCanvas
            cameraPosition={cameraPosition}
            legend={<Legend3D title="图例标注" items={legendItems} />}
          >
            <CameraRig
              ref={controlsRef}
              enabled={interactionMode === "orbit"}
            />
            {/* 基础长方体 + 顶点标号（建系后切换为坐标标注）共享骨架 */}
            <CuboidBaseScene
              a={a}
              b={b}
              c={c}
              vertices={vertices}
              showAxes={showAxes}
              showCoordinates={showCoordinates}
            />

            {/* ═════════ 模式一：异面直线所成的角 (纯几何线段，无箭头误导) ═════════ */}
            {activeMode === "skewLines" && (
              <SkewLinesModeScene
                a={a}
                b={b}
                c={c}
                vertices={vertices}
                skewData={skewData}
                showAuxiliary={showAuxiliary}
                showRightAngles={showRightAngles}
                showAngles={showAngles}
                showNormals={showNormals}
              />
            )}

            {/* ═════════ 模式二：直线与平面所成的角 (几何斜线与射影) ═════════ */}
            {activeMode === "linePlane" && (
              <LinePlaneModeScene
                a={a}
                b={b}
                c={c}
                lambda={lambda}
                vertices={vertices}
                linePlaneData={linePlaneData}
                showAxes={showAxes}
                showCoordinates={showCoordinates}
                showAuxiliary={showAuxiliary}
                showRightAngles={showRightAngles}
                showAngles={showAngles}
                showNormals={showNormals}
                interactionMode={interactionMode}
                onEPointDrag={handleEPointDrag}
              />
            )}

            {/* ═════════ 模式三：二面角 (三垂线几何角与重心法向量) ═════════ */}
            {activeMode === "dihedral" && (
              <DihedralModeScene
                c={c}
                lambda={lambda}
                vertices={vertices}
                dihedralData={dihedralData}
                showAxes={showAxes}
                showCoordinates={showCoordinates}
                showAuxiliary={showAuxiliary}
                showRightAngles={showRightAngles}
                showAngles={showAngles}
                showNormals={showNormals}
                interactionMode={interactionMode}
                onEPointDrag={handleEPointDrag}
              />
            )}

            {/* ═════════ 模式四：点到平面的距离 (纯几何棱线与高线 + 空间法向量) ═════════ */}
            {activeMode === "distance" && (
              <DistanceModeScene
                c={c}
                lambda={lambda}
                vertices={vertices}
                distanceData={distanceData}
                showAxes={showAxes}
                showCoordinates={showCoordinates}
                showAuxiliary={showAuxiliary}
                showRightAngles={showRightAngles}
                showNormals={showNormals}
                interactionMode={interactionMode}
                onEPointDrag={handleEPointDrag}
              />
            )}
          </ThreeDCanvas>

          {/* 右上角漫游/交互切换浮层 */}
          <ModeSwitchOverlay3D
            mode={interactionMode}
            onModeChange={setInteractionMode}
          />
        </div>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          title={
            activeMode === "skewLines"
              ? "异面直线角与公垂线高考看板"
              : activeMode === "linePlane"
                ? "直线与平面所成角高考看板"
                : activeMode === "dihedral"
                  ? "空间二面角与截面平面角高考看板"
                  : "点到平面距离与体积极值高考看板"
          }
        />
      }
    />
  );
}
