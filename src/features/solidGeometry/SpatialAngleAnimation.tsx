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
  TipCard,
  KatexFormula,
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
type ModelPreset = "standard" | "cube" | "tallPrism";

export default function SpatialAngleAnimation() {
  const location = useLocation();
  const defaultMode: AngleMode = location.pathname.includes("distance")
    ? "distance"
    : "skewLines";

  const [activeMode, setActiveMode] = useState<AngleMode>(defaultMode);
  const [modelPreset, setModelPreset] = useState<ModelPreset>("standard");
  const [interactionMode, setInteractionMode] = useState<"orbit" | "drag">(
    "orbit",
  );

  // 数学分类图层控制开关 (彼此解耦，符合高中教学)
  const [showAuxiliary, setShowAuxiliary] = useState<boolean>(true); // 几何辅助线 (平移线/射影/垂线高)
  const [showRightAngles, setShowRightAngles] = useState<boolean>(true); // 空间垂直与直角符号
  const [showAngles, setShowAngles] = useState<boolean>(true); // 特征空间角弧 θ
  const [showNormals, setShowNormals] = useState<boolean>(true); // 空间法向量 (唯一代数向量箭头)

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

  // 组装右屏看板数据
  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-solid-angle", params, {
        mode: activeMode,
      }),
    [params, activeMode],
  );

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setParams({ a: 3, b: 2, c: 2, lambda: 0.6 });
    setModelPreset("standard");
  };

  // 高考模型预设切换 (铁律：仅调参数，严禁篡改 activeMode)
  const handleModelPresetChange = (pKey: string) => {
    const key = pKey as ModelPreset;
    setModelPreset(key);
    if (key === "standard") {
      setParams({ a: 3, b: 2, c: 2, lambda: 0.6 });
    } else if (key === "cube") {
      setParams({ a: 2.5, b: 2.5, c: 2.5, lambda: 0.5 });
    } else if (key === "tallPrism") {
      setParams({ a: 2, b: 2, c: 3.5, lambda: 0.6 });
    }
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

  // 按模式精准过滤左屏参数配置 (铁律 8)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<AngleMode, string[]> = {
      skewLines: ["a", "b", "c"],
      linePlane: ["a", "b", "c", "lambda"],
      dihedral: ["a", "b", "c", "lambda"],
      distance: ["a", "b", "c", "lambda"],
    };
    const activeKeys = keysByMode[activeMode] ?? ["a", "b", "c", "lambda"];

    return spatialAngleMeta
      .filter((meta) => activeKeys.includes(meta.key))
      .map((meta) => ({
        key: meta.key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        value: params[meta.key] ?? meta.defaultValue ?? 0,
        min: meta.min,
        max: meta.max,
        step: meta.step ?? 0.05,
        description: meta.description,
        descriptionFormula: meta.descriptionFormula,
        importance: meta.importance,
        marks: meta.marks,
      }));
  }, [params, activeMode]);

  // 教学提示内容配置
  const tipConfig = useMemo(() => {
    switch (activeMode) {
      case "skewLines":
        return {
          variant: "warning" as const,
          formula:
            "\\cos\\theta = \\frac{|\\vec{u}\\cdot\\vec{v}|}{|\\vec{u}||\\vec{v}|} \\in (0, 1]",
          text: "平移法 D₁C // A₁B 将异面直线角转化为平面相交角 ∠ACD₁，余弦绝对值保证取锐角/直角。",
        };
      case "linePlane":
        return {
          variant: "danger" as const,
          formula:
            "\\sin\\theta = |\\cos\\langle\\vec{u}, \\vec{n}\\rangle| = \\frac{|\\vec{u}\\cdot\\vec{n}|}{|\\vec{u}||\\vec{n}|}",
          text: "高考黄金考点：线面角公式求出的是正弦值 sinθ！直角三角形 △EAC 中 sinθ = EA / EC。",
        };
      case "dihedral":
        return {
          variant: "primary" as const,
          formula: "\\text{同进同出互补，一进一出相等}",
          text: "三垂线定理在交线 BD 垂足 M 处构造平面角 ∠AME；法向量指向相同侧时与二面角互补。",
        };
      case "distance":
        return {
          variant: "success" as const,
          formula:
            "d = \\frac{|\\vec{AP}\\cdot\\vec{n}|}{|\\vec{n}|} = \\frac{3V}{S_{\\text{底}}}",
          text: "等体积法换底对照：以 △ABD 为底高为 EA，以截面 △BDE 为底高为 d，反解距离最简捷。",
        };
    }
  }, [activeMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* Step 1: 探究模式 (纯净紧凑 2x2 控制卡片，三屏职责分明) */}
          <LeftPanelSection title="探究模式">
            <SelectGrid
              items={[
                {
                  key: "skewLines",
                  label: "异面直线角",
                  description: "平移法与向量法",
                },
                {
                  key: "linePlane",
                  label: "直线与平面角",
                  description: "斜线与射影直角",
                },
                {
                  key: "dihedral",
                  label: "二面角",
                  description: "三垂线与双法向量",
                },
                {
                  key: "distance",
                  label: "点面距与体积",
                  description: "等体积法与极值",
                },
              ]}
              value={activeMode}
              onChange={(m) => setActiveMode(m as AngleMode)}
              columns={2}
            />
          </LeftPanelSection>

          {/* Step 2: 高考场景预设 (精炼 3 字标签，彻底消除省略号) */}
          <LeftPanelSection title="高考模型预设">
            <SelectGrid
              items={[
                { key: "standard", label: "长方体", description: "3×2×2" },
                { key: "cube", label: "正方体", description: "2.5³" },
                { key: "tallPrism", label: "四棱柱", description: "2×2×3.5" },
              ]}
              value={modelPreset}
              onChange={handleModelPresetChange}
              columns={3}
            />
          </LeftPanelSection>

          {/* Step 3: 参数调节 (按当前模式过滤，纯净滑块) */}
          <LeftPanelSection
            title="参数调节"
            subtitle="调节空间各轴棱长与动点 E 分点比例 λ"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* Step 4: 几何图层与标注控制 (按数学分类解耦) */}
          <LeftPanelSection title="几何图层与标注控制" compact>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setShowAuxiliary((prev) => !prev)}
                className={`py-1.5 px-2 rounded text-xs font-medium border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  showAuxiliary
                    ? "bg-primary-50 text-primary-700 border-primary-300 font-semibold"
                    : "bg-neutral-50 text-neutral-500 border-neutral-200"
                }`}
              >
                <span>{showAuxiliary ? "✓" : "○"} 几何辅助线</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRightAngles((prev) => !prev)}
                className={`py-1.5 px-2 rounded text-xs font-medium border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  showRightAngles
                    ? "bg-primary-50 text-primary-700 border-primary-300 font-semibold"
                    : "bg-neutral-50 text-neutral-500 border-neutral-200"
                }`}
              >
                <span>{showRightAngles ? "✓" : "○"} 垂直直角符号</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAngles((prev) => !prev)}
                className={`py-1.5 px-2 rounded text-xs font-medium border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  showAngles
                    ? "bg-primary-50 text-primary-700 border-primary-300 font-semibold"
                    : "bg-neutral-50 text-neutral-500 border-neutral-200"
                }`}
              >
                <span>{showAngles ? "✓" : "○"} 空间角弧 θ</span>
              </button>

              {(activeMode === "linePlane" || activeMode === "dihedral") && (
                <button
                  type="button"
                  onClick={() => setShowNormals((prev) => !prev)}
                  className={`py-1.5 px-2 rounded text-xs font-medium border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    showNormals
                      ? "bg-primary-50 text-primary-700 border-primary-300 font-semibold"
                      : "bg-neutral-50 text-neutral-500 border-neutral-200"
                  }`}
                >
                  <span>{showNormals ? "✓" : "○"} 空间法向量</span>
                </button>
              )}
            </div>
          </LeftPanelSection>

          {/* Step 5: 教学提示 (TipCard) */}
          <LeftPanelSection title="教学提示与避坑指南" compact>
            <TipCard variant={tipConfig.variant}>
              <div className="font-semibold text-xs mb-1">
                <KatexFormula mode="inline" formula={tipConfig.formula} />
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {tipConfig.text}
              </p>
            </TipCard>
          </LeftPanelSection>

          {/* Step 6: 视图与视角 */}
          <LeftPanelSection title="3D 视角与观察方向">
            <TabSwitcher
              layout="horizontal"
              tabs={[
                { key: "iso", label: "轴测" },
                { key: "front", label: "主视" },
                { key: "top", label: "俯视" },
                { key: "side", label: "左视" },
              ]}
              value={preset}
              onChange={(p) => setCameraPreset(p as CameraPreset)}
            />
            {activeMode === "dihedral" && (
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={handleAlignAlongEdge}
                  className="w-full py-1.5 px-3 rounded text-xs font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>📐 沿棱直视 (视线沿 BD 判定钝锐角)</span>
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
            legend={
              <Legend3D
                title="图例标注"
                items={[
                  {
                    colorKey: "primary",
                    swatch: "line",
                    label: "主直线 / 斜线 (线段)",
                  },
                  {
                    colorKey: "accent",
                    swatch: "line",
                    label: "目标直线 / 垂线 (线段)",
                  },
                  {
                    colorKey: "paramTertiary",
                    swatch: "area",
                    label: "截面 / 射影 / 垂足",
                  },
                  {
                    colorKey: "highlight",
                    swatch: "line",
                    label: "特征角弧 / 距离 d",
                  },
                ]}
              />
            }
          >
            <CameraRig
              ref={controlsRef}
              enabled={interactionMode === "orbit"}
            />
            {/* 纯净直角坐标系 A-xyz（固定基准尺寸 5.5，彻底移除地面方格网格） */}
            <Scene3DGrid size={5.5} showGrid={false} />

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
                  onDrag={(next) =>
                    setParams((prev) => ({
                      ...prev,
                      lambda: Number(
                        Math.min(1.0, Math.max(0.1, next.z / c)).toFixed(2),
                      ),
                    }))
                  }
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
                      position={{ x: a / 2 + 0.15, y: b / 2, z: 1.9 }}
                      tex="\vec{n_0}"
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
                  onDrag={(next) =>
                    setParams((prev) => ({
                      ...prev,
                      lambda: Number(
                        Math.min(1.0, Math.max(0.1, next.z / c)).toFixed(2),
                      ),
                    }))
                  }
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
                    {/* 垂足 M 处 AM ⊥ BD 直角标记 */}
                    <AngleArc3D
                      vertex={dihedralData.edgeFootM}
                      dirA={{
                        x: A.x - dihedralData.edgeFootM.x,
                        y: A.y - dihedralData.edgeFootM.y,
                        z: 0,
                      }}
                      dirB={{
                        x: D.x - dihedralData.edgeFootM.x,
                        y: D.y - dihedralData.edgeFootM.y,
                        z: 0,
                      }}
                      radius={0.22}
                      colorKey="secondary"
                      isRight
                    />

                    {/* 垂足 M 处 EM ⊥ BD 直角标记 */}
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
                      radius={0.25}
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
                          <FormulaLabel3D position={n2Target} tex="\vec{n_2}" />
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
                          <FormulaLabel3D position={n1Target} tex="\vec{n_1}" />
                        </>
                      );
                    })()}
                  </>
                )}
              </>
            )}

            {/* ═════════ 模式四：点到平面的距离 (纯几何棱线与高线) ═════════ */}
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
                  onDrag={(next) =>
                    setParams((prev) => ({
                      ...prev,
                      lambda: Number(
                        Math.min(1.0, Math.max(0.1, next.z / c)).toFixed(2),
                      ),
                    }))
                  }
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
                    {/* 竖直高线 h1 = EA */}
                    <Segment3D
                      from={A}
                      to={E}
                      dashed
                      colorKey="accent"
                      lineWidth={2.5}
                    />

                    {/* 原点 A 到截面 BDE 的垂线段 AH (几何线段，无箭头) */}
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
                  </>
                )}

                {/* 垂直直角符号 */}
                {showRightAngles && showAuxiliary && (
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
                    radius={0.2}
                    colorKey="highlight"
                    isRight
                  />
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
          title="空间角与坐标系高考看板"
        />
      }
    />
  );
}
