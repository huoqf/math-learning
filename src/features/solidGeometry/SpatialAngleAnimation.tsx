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
import {
  Scene3DGrid,
  Point3D,
  AngleArc3D,
  PointLabel3D,
  FormulaLabel3D,
  CompoundLabel3D,
  Vector3DArrow,
  Segment3D,
  Polygon3DFace,
  Legend3D,
  CameraRig,
  ModeSwitchOverlay3D,
} from "@/components/Math3D";
import type { LegendItem } from "@/components/Math3D";
import { Cuboid } from "@/components/Math3D/solids";
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
  const [showAuxiliary, setShowAuxiliary] = useState<boolean>(true); // 几何辅助线 (平移线/射影/垂线高)
  const [showRightAngles, setShowRightAngles] = useState<boolean>(true); // 空间垂直与直角符号
  const [showAngles, setShowAngles] = useState<boolean>(true); // 特征空间角弧 θ
  const [showNormals, setShowNormals] = useState<boolean>(false); // 空间法向量 (选修一向量法，按需开启)

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
  const { A, B, C, D, A1, B1, C1, D1, E } = vertices;

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
          description: "三边长可调",
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
          description: "连续变倾角",
          params: { a: 3, b: 2, c: 2.5, lambda: 0.6 },
        },
        {
          key: "midpoint",
          label: "中点斜线",
          description: "λ=0.5固定",
          params: { a: 3, b: 2, c: 2.5, lambda: 0.5 },
        },
        {
          key: "bodyDiag",
          label: "体对角线",
          description: "正方体模型",
          params: { a: 2.5, b: 2.5, c: 2.5, lambda: 1.0 },
        },
        {
          key: "tallPrismMid",
          label: "正棱柱中点",
          description: "λ=0.5正棱柱",
          params: { a: 2.5, b: 2.5, c: 3.5, lambda: 0.5 },
        },
      ],
      dihedral: [
        {
          key: "free",
          label: "自由探究",
          description: "连续变二面角",
          params: { a: 3, b: 2, c: 2, lambda: 0.7 },
        },
        {
          key: "cubeSection",
          label: "正方体截面",
          description: "cosθ=√3/3",
          params: { a: 2.5, b: 2.5, c: 2.5, lambda: 1.0 },
        },
        {
          key: "midSection",
          label: "中点截面",
          description: "λ=0.5固定",
          params: { a: 3, b: 2, c: 2, lambda: 0.5 },
        },
        {
          key: "tallPrismSection",
          label: "正棱柱截面",
          description: "λ=1.0正棱柱",
          params: { a: 2.5, b: 2.5, c: 3.5, lambda: 1.0 },
        },
      ],
      distance: [
        {
          key: "free",
          label: "自由探究",
          description: "连续变体积",
          params: { a: 3, b: 2, c: 2, lambda: 0.6 },
        },
        {
          key: "maxVolume",
          label: "顶点极值",
          description: "V_max=1/6 abc",
          params: { a: 3, b: 2, c: 2, lambda: 1.0 },
        },
        {
          key: "cubeThird",
          label: "正方体距",
          description: "d=√3/3 a",
          params: { a: 2.5, b: 2.5, c: 2.5, lambda: 1.0 },
        },
        {
          key: "midVolume",
          label: "中点半体积",
          description: "V=1/12 abc",
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
                  {activeMode !== "skewLines" && (
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
            {/* 纯净直角坐标系 A-xyz（受左屏开关控制，动态适配长方体尺寸，正半轴实线箭头，负半轴细虚线） */}
            {showAxes && (
              <Scene3DGrid
                size={[a + 1.2, b + 1.2, c + 1.2]}
                showGrid={false}
              />
            )}

            {/* 基础长方体 */}
            <Cuboid a={a} b={b} c={c} opacity={0.1} colorKey="primary" />

            {/* 顶点文本标号 (纯矢量 3D 文字，严格使用 CompoundLabel3D 消除豆腐块) */}
            <PointLabel3D
              position={A}
              text="A"
              offset={[-0.15, -0.15, -0.15]}
            />
            <PointLabel3D position={B} text="B" offset={[0.15, -0.15, -0.15]} />
            <PointLabel3D position={C} text="C" offset={[0.15, 0.15, -0.15]} />
            <PointLabel3D position={D} text="D" offset={[-0.15, 0.15, -0.15]} />
            <CompoundLabel3D
              position={A1}
              base="A"
              subscript="1"
              offset={[-0.15, -0.15, 0.15]}
            />
            <CompoundLabel3D
              position={B1}
              base="B"
              subscript="1"
              offset={[0.15, -0.15, 0.15]}
            />
            <CompoundLabel3D
              position={C1}
              base="C"
              subscript="1"
              offset={[0.15, 0.15, 0.15]}
            />
            <CompoundLabel3D
              position={D1}
              base="D"
              subscript="1"
              offset={[-0.15, 0.15, 0.15]}
            />

            {/* ═════════ 模式一：异面直线所成的角 (纯几何线段，无箭头误导) ═════════ */}
            {activeMode === "skewLines" && (
              <>
                {/* 异面直线 1: A1B (几何线段，无箭头) */}
                <Segment3D from={A1} to={B} colorKey="primary" lineWidth={3} />

                {/* 异面直线 2: AC (几何线段，无箭头) */}
                <Segment3D from={A} to={C} colorKey="accent" lineWidth={3} />

                {/* 平移法辅助线与公垂线段 */}
                {showAuxiliary && (
                  <>
                    {/* 长方体侧面上 D1C // A1B (辅助线段) */}
                    <Segment3D
                      from={D1}
                      to={C}
                      dashed
                      colorKey="secondary"
                      lineWidth={2.5}
                    />

                    {/* 公垂线段 P1P2 (几何线段，无箭头) */}
                    <Segment3D
                      from={skewData.P1}
                      to={skewData.P2}
                      colorKey="paramPrimary"
                      lineWidth={2.5}
                    />
                    <CompoundLabel3D
                      position={skewData.P1}
                      base="P"
                      subscript="1"
                      offset={[-0.15, 0.1, 0.1]}
                    />
                    <CompoundLabel3D
                      position={skewData.P2}
                      base="P"
                      subscript="2"
                      offset={[0.15, -0.1, 0.1]}
                    />
                  </>
                )}

                {/* 垂直直角符号 */}
                {showRightAngles && showAuxiliary && (
                  <>
                    {/* P1 处直角标记 */}
                    <AngleArc3D
                      vertex={skewData.P1}
                      dirA={{
                        x: skewData.u.x,
                        y: skewData.u.y,
                        z: skewData.u.z,
                      }}
                      dirB={{
                        x: skewData.P2.x - skewData.P1.x,
                        y: skewData.P2.y - skewData.P1.y,
                        z: skewData.P2.z - skewData.P1.z,
                      }}
                      radius={0.18}
                      colorKey="paramPrimary"
                      isRight
                    />
                    {/* P2 处直角标记 */}
                    <AngleArc3D
                      vertex={skewData.P2}
                      dirA={{
                        x: skewData.v.x,
                        y: skewData.v.y,
                        z: skewData.v.z,
                      }}
                      dirB={{
                        x: skewData.P1.x - skewData.P2.x,
                        y: skewData.P1.y - skewData.P2.y,
                        z: skewData.P1.z - skewData.P2.z,
                      }}
                      radius={0.18}
                      colorKey="paramPrimary"
                      isRight
                    />
                  </>
                )}

                {/* 空间特征角弧 θ */}
                {showAngles && showAuxiliary && (
                  <>
                    <AngleArc3D
                      vertex={C}
                      dirA={{ x: -a, y: -b, z: 0 }}
                      dirB={{ x: -a, y: 0, z: c }}
                      radius={0.7}
                      colorKey="highlight"
                    />
                    <FormulaLabel3D
                      position={{ x: a - 0.3, y: b - 0.3, z: 0.15 }}
                      tex="\theta"
                    />
                  </>
                )}
              </>
            )}

            {/* ═════════ 模式二：直线与平面所成的角 (几何斜线与射影) ═════════ */}
            {activeMode === "linePlane" && (
              <>
                {/* 底面 ABCD 半透明填充 */}
                <Polygon3DFace
                  points={[A, B, C, D]}
                  colorKey="secondary"
                  opacity={0.18}
                />

                {/* 动点 E 在侧棱 AA1 上 */}
                <PointLabel3D
                  position={E}
                  text="E"
                  offset={[-0.2, -0.2, 0.1]}
                />
                <Point3D
                  position={E}
                  draggable={interactionMode === "drag"}
                  constrain={(raw) => ({
                    x: 0,
                    y: 0,
                    z: Math.min(c, Math.max(0.1 * c, raw.z)),
                  })}
                  onDrag={(next) => {
                    setModelPreset("free");
                    setParams((prev) => ({
                      ...prev,
                      lambda: Number(
                        Math.min(1.0, Math.max(0.1, next.z / c)).toFixed(2),
                      ),
                    }));
                  }}
                  colorKey="highlight"
                />

                {/* 空间斜线 EC (几何线段，无箭头) */}
                <Segment3D
                  from={linePlaneData.E}
                  to={linePlaneData.C}
                  colorKey="primary"
                  lineWidth={3}
                />

                {/* 几何辅助线：垂线段 EA 与底面射影 AC */}
                {showAuxiliary && (
                  <>
                    <Segment3D
                      from={linePlaneData.E}
                      to={linePlaneData.A}
                      dashed
                      colorKey="accent"
                      lineWidth={2.5}
                    />
                    <Segment3D
                      from={linePlaneData.A}
                      to={linePlaneData.C}
                      dashed
                      colorKey="secondary"
                      lineWidth={2}
                    />
                  </>
                )}

                {/* 垂直直角符号 */}
                {showRightAngles && showAuxiliary && (
                  <AngleArc3D
                    vertex={linePlaneData.A}
                    dirA={{ x: 0, y: 0, z: linePlaneData.zE }}
                    dirB={{ x: C.x - A.x, y: C.y - A.y, z: 0 }}
                    radius={0.3}
                    colorKey="accent"
                    isRight
                  />
                )}

                {/* 空间角弧 θ */}
                {showAngles && showAuxiliary && (
                  <>
                    <AngleArc3D
                      vertex={linePlaneData.C}
                      dirA={{ x: -a, y: -b, z: 0 }}
                      dirB={{ x: -a, y: -b, z: linePlaneData.zE }}
                      radius={0.7}
                      colorKey="highlight"
                    />
                    <FormulaLabel3D
                      position={{ x: a - 0.35, y: b - 0.35, z: 0.15 }}
                      tex="\theta"
                    />
                  </>
                )}

                {/* 底面法向量 n_0 (唯一代数向量箭头) */}
                {showNormals && (
                  <>
                    <Vector3DArrow
                      from={{ x: a / 2, y: b / 2, z: 0 }}
                      to={{ x: a / 2, y: b / 2, z: 1.8 }}
                      colorKey="secondary"
                    />
                    <FormulaLabel3D
                      position={{ x: a / 2, y: b / 2, z: 1.8 }}
                      tex="\\vec{n}_0"
                      offset={[0.1, 0.1, 0.1]}
                    />
                  </>
                )}
              </>
            )}

            {/* ═════════ 模式三：二面角 (三垂线几何角与重心法向量) ═════════ */}
            {activeMode === "dihedral" && (
              <>
                {/* 动点 E 在 AA1 上 */}
                <PointLabel3D
                  position={E}
                  text="E"
                  offset={[-0.2, -0.2, 0.1]}
                />
                <Point3D
                  position={E}
                  draggable={interactionMode === "drag"}
                  constrain={(raw) => ({
                    x: 0,
                    y: 0,
                    z: Math.min(c, Math.max(0.1 * c, raw.z)),
                  })}
                  onDrag={(next) => {
                    setModelPreset("free");
                    setParams((prev) => ({
                      ...prev,
                      lambda: Number(
                        Math.min(1.0, Math.max(0.1, next.z / c)).toFixed(2),
                      ),
                    }));
                  }}
                  colorKey="highlight"
                />

                {/* 底面 ABD 与 截面 BDE */}
                <Polygon3DFace
                  points={[A, B, D]}
                  colorKey="secondary"
                  opacity={0.15}
                />
                <Polygon3DFace
                  points={[B, D, E]}
                  colorKey="paramTertiary"
                  opacity={0.28}
                />

                {/* 二面角的棱 BD (几何线段) */}
                <Segment3D from={B} to={D} colorKey="highlight" lineWidth={3} />

                {/* 几何辅助线：三垂线定理垂足 M 及垂线 AM ⊥ BD, EM ⊥ BD */}
                {showAuxiliary && (
                  <>
                    <Segment3D
                      from={A}
                      to={dihedralData.edgeFootM}
                      dashed
                      colorKey="secondary"
                      lineWidth={2}
                    />
                    <Segment3D
                      from={E}
                      to={dihedralData.edgeFootM}
                      dashed
                      colorKey="paramTertiary"
                      lineWidth={2}
                    />
                    <Point3D
                      position={dihedralData.edgeFootM}
                      colorKey="paramTertiary"
                    />
                    <PointLabel3D
                      position={dihedralData.edgeFootM}
                      text="M"
                      offset={[0.1, 0.1, 0.05]}
                    />
                  </>
                )}

                {/* 垂直直角符号 */}
                {showRightAngles && showAuxiliary && (
                  <>
                    {/* 垂足 M 处 AM ⊥ BD 直角标记 (落在底面 △ABD 内，朝向点 B) */}
                    <AngleArc3D
                      vertex={dihedralData.edgeFootM}
                      dirA={{
                        x: A.x - dihedralData.edgeFootM.x,
                        y: A.y - dihedralData.edgeFootM.y,
                        z: 0,
                      }}
                      dirB={{
                        x: B.x - dihedralData.edgeFootM.x,
                        y: B.y - dihedralData.edgeFootM.y,
                        z: 0,
                      }}
                      radius={0.25}
                      colorKey="secondary"
                      isRight
                    />

                    {/* 垂足 M 处 EM ⊥ BD 直角标记 (落在截面 △BDE 内，朝向点 D) */}
                    <AngleArc3D
                      vertex={dihedralData.edgeFootM}
                      dirA={{
                        x: E.x - dihedralData.edgeFootM.x,
                        y: E.y - dihedralData.edgeFootM.y,
                        z: dihedralData.zE,
                      }}
                      dirB={{
                        x: D.x - dihedralData.edgeFootM.x,
                        y: D.y - dihedralData.edgeFootM.y,
                        z: 0,
                      }}
                      radius={0.28}
                      colorKey="paramTertiary"
                      isRight
                    />
                  </>
                )}

                {/* 空间特征角弧 θ (二面角平面角) */}
                {showAngles && showAuxiliary && (
                  <>
                    <AngleArc3D
                      vertex={dihedralData.edgeFootM}
                      dirA={{
                        x: A.x - dihedralData.edgeFootM.x,
                        y: A.y - dihedralData.edgeFootM.y,
                        z: 0,
                      }}
                      dirB={{
                        x: E.x - dihedralData.edgeFootM.x,
                        y: E.y - dihedralData.edgeFootM.y,
                        z: dihedralData.zE,
                      }}
                      radius={0.55}
                      colorKey="highlight"
                    />
                    <FormulaLabel3D
                      position={{
                        x: dihedralData.edgeFootM.x - 0.15,
                        y: dihedralData.edgeFootM.y - 0.15,
                        z: 0.25,
                      }}
                      tex="\theta"
                    />
                  </>
                )}

                {/* 截面法向量 n_2 与底面法向量 n_1 (代数向量箭头) */}
                {showNormals && (
                  <>
                    {(() => {
                      const G2 = dihedralData.centroidSection;
                      const n2Target: Vec3 = {
                        x: G2.x + dihedralData.n2.x * 1.6,
                        y: G2.y + dihedralData.n2.y * 1.6,
                        z: G2.z + dihedralData.n2.z * 1.6,
                      };
                      return (
                        <>
                          <Vector3DArrow
                            from={G2}
                            to={n2Target}
                            colorKey="primary"
                          />
                          <FormulaLabel3D
                            position={n2Target}
                            tex="\\vec{n}_2"
                            offset={[0.1, 0.1, 0.1]}
                          />
                        </>
                      );
                    })()}

                    {(() => {
                      const G1 = dihedralData.centroidBase;
                      const n1Target: Vec3 = { x: G1.x, y: G1.y, z: 1.6 };
                      return (
                        <>
                          <Vector3DArrow
                            from={G1}
                            to={n1Target}
                            colorKey="secondary"
                          />
                          <FormulaLabel3D
                            position={n1Target}
                            tex="\\vec{n}_1"
                            offset={[0.1, 0.1, 0.1]}
                          />
                        </>
                      );
                    })()}
                  </>
                )}
              </>
            )}

            {/* ═════════ 模式四：点到平面的距离 (纯几何棱线与高线 + 空间法向量) ═════════ */}
            {activeMode === "distance" && (
              <>
                {/* 动点 E 在 AA1 上 */}
                <PointLabel3D
                  position={E}
                  text="E"
                  offset={[-0.2, -0.2, 0.1]}
                />
                <Point3D
                  position={E}
                  draggable={interactionMode === "drag"}
                  constrain={(raw) => ({
                    x: 0,
                    y: 0,
                    z: Math.min(c, Math.max(0.1 * c, raw.z)),
                  })}
                  onDrag={(next) => {
                    setModelPreset("free");
                    setParams((prev) => ({
                      ...prev,
                      lambda: Number(
                        Math.min(1.0, Math.max(0.1, next.z / c)).toFixed(2),
                      ),
                    }));
                  }}
                  colorKey="highlight"
                />

                {/* 底面 ABD 与 截面 BDE */}
                <Polygon3DFace
                  points={[A, B, D]}
                  colorKey="secondary"
                  opacity={0.15}
                />
                <Polygon3DFace
                  points={[B, D, E]}
                  colorKey="paramTertiary"
                  opacity={0.28}
                />

                {/* 三棱锥 E-ABD 棱线 (几何线段，绝无箭头) */}
                <Segment3D from={E} to={B} colorKey="accent" lineWidth={2} />
                <Segment3D from={E} to={D} colorKey="accent" lineWidth={2} />
                <Segment3D from={B} to={D} colorKey="accent" lineWidth={2} />

                {/* 几何辅助线：双高线 EA 与 AH */}
                {showAuxiliary && (
                  <>
                    {/* 竖直高线 h1 = EA (底面 ABD 对应的高) */}
                    <Segment3D
                      from={A}
                      to={E}
                      dashed
                      colorKey="paramPrimary"
                      lineWidth={2.5}
                    />

                    {/* 原点 A 到截面 BDE 的垂线段 AH (截面 BDE 对应的高 d) */}
                    <Segment3D
                      from={A}
                      to={distanceData.footH}
                      colorKey="highlight"
                      lineWidth={3}
                    />
                    <Point3D
                      position={distanceData.footH}
                      colorKey="highlight"
                    />
                    <PointLabel3D
                      position={distanceData.footH}
                      text="H"
                      offset={[0.1, 0.1, 0.1]}
                    />
                    <FormulaLabel3D
                      position={{
                        x: (A.x + distanceData.footH.x) / 2 + 0.1,
                        y: (A.y + distanceData.footH.y) / 2 + 0.1,
                        z: (A.z + distanceData.footH.z) / 2 + 0.1,
                      }}
                      tex="d"
                    />
                  </>
                )}

                {/* 垂直双直角符号 (AH ⊥ HE 与 AH ⊥ HB，凸显线面垂直严格定义) */}
                {showRightAngles && showAuxiliary && (
                  <>
                    <AngleArc3D
                      vertex={distanceData.footH}
                      dirA={{
                        x: A.x - distanceData.footH.x,
                        y: A.y - distanceData.footH.y,
                        z: A.z - distanceData.footH.z,
                      }}
                      dirB={{
                        x: E.x - distanceData.footH.x,
                        y: E.y - distanceData.footH.y,
                        z: distanceData.zE - distanceData.footH.z,
                      }}
                      radius={0.22}
                      colorKey="highlight"
                      isRight
                    />
                    <AngleArc3D
                      vertex={distanceData.footH}
                      dirA={{
                        x: A.x - distanceData.footH.x,
                        y: A.y - distanceData.footH.y,
                        z: A.z - distanceData.footH.z,
                      }}
                      dirB={{
                        x: B.x - distanceData.footH.x,
                        y: B.y - distanceData.footH.y,
                        z: B.z - distanceData.footH.z,
                      }}
                      radius={0.28}
                      colorKey="secondary"
                      isRight
                    />
                  </>
                )}

                {/* 截面法向量 n (空间代数向量，展示向量投影法求距离 d = |BA·n| / |n|) */}
                {showNormals && (
                  <>
                    {(() => {
                      const G2 = distanceData.centroidSection;
                      const nTarget: Vec3 = {
                        x: G2.x + distanceData.nUnit.x * 1.6,
                        y: G2.y + distanceData.nUnit.y * 1.6,
                        z: G2.z + distanceData.nUnit.z * 1.6,
                      };
                      return (
                        <>
                          <Vector3DArrow
                            from={G2}
                            to={nTarget}
                            colorKey="primary"
                          />
                          <FormulaLabel3D
                            position={nTarget}
                            tex="\\vec{n}"
                            offset={[0.1, 0.1, 0.1]}
                          />
                        </>
                      );
                    })()}
                  </>
                )}
              </>
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
