import { useState, useMemo } from "react";
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
  Vector3DArrow,
  Plane3D,
  Point3D,
  CompoundLabel3D,
  FormulaLabel3D,
  AngleArc3D,
  Legend3D,
  CameraRig,
  ModeSwitchOverlay3D,
} from "@/components/Math3D";
import type { LegendItem, InteractionMode3D } from "@/components/Math3D";
import { use3DViewport } from "@/hooks/use3DViewport";
import type { CameraPreset } from "@/hooks/use3DViewport";
import { buildMathQuantities } from "@/data/mathQuantities";
import { linePlaneRelationMeta } from "@/data/registries/solidGeometry";
import { getLineDirection } from "@/math3d/lineRelation";
import type { Vec3 } from "@/math3d/vector3";
import { PyramidModelScene } from "./components/PyramidModelScene";

type TeachingMode = "parallel" | "perpendicular" | "gaokaoPyramid" | "vector";

export default function LinePlaneRelationAnimation() {
  const [activeMode, setActiveMode] = useState<TeachingMode>("parallel");
  const [subTheorem, setSubTheorem] = useState<"judge" | "prop">("judge");
  const [showAxes, setShowAxes] = useState<boolean>(false);
  const [interactionMode, setInteractionMode] =
    useState<InteractionMode3D>("orbit");
  const [params, setParams] = useState<Record<string, number>>({
    zHeight: 2,
    thetaDeg: 0,
    phiDeg: 0,
    intersectType: 1, // 1: 相交, 0: 平行(反例)
    inPlaneType: 1, // 1: 面外, 0: 面内(反例)
    lambdaE: 0.5,
    lambdaF: 0.5,
    pyramidA: 3.6,
    pyramidB: 2.8,
    pyramidH: 3.5,
    step: 1,
  });

  const { preset, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  const zHeight = params.zHeight ?? 2;
  const thetaDeg = params.thetaDeg ?? 0;
  const phiDeg = params.phiDeg ?? 0;
  const intersectType = params.intersectType ?? 1;
  const inPlaneType = params.inPlaneType ?? 1;
  const lambdaE = params.lambdaE ?? 0.5;
  const lambdaF = params.lambdaF ?? 0.5;
  const pyramidA = params.pyramidA ?? 3.6;
  const pyramidB = params.pyramidB ?? 2.8;
  const pyramidH = params.pyramidH ?? 3.5;
  const step = params.step ?? 1;

  // 组装右屏看板数据
  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-solid-position", params, {
        mode: activeMode,
        subTheorem,
      }),
    [params, activeMode, subTheorem],
  );

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  // 模式切换统一调度
  const handleModeChange = (mode: TeachingMode) => {
    setActiveMode(mode);
    setSubTheorem("judge");
    setShowAxes(mode === "vector");
    if (mode === "perpendicular") {
      setParams((p) => ({
        ...p,
        thetaDeg: 90,
        zHeight: 0,
        phiDeg: 45,
        intersectType: 1,
      }));
    } else if (mode === "parallel") {
      setParams((p) => ({
        ...p,
        thetaDeg: 0,
        zHeight: 2,
        phiDeg: 0,
        inPlaneType: 1,
        step: 1,
      }));
    }
  };

  // 智能重置
  const handleReset = () => {
    switch (activeMode) {
      case "parallel":
        setParams((p) => ({
          ...p,
          zHeight: 2,
          thetaDeg: 0,
          phiDeg: 0,
          inPlaneType: 1,
          step: 1,
        }));
        break;
      case "perpendicular":
        setParams((p) => ({
          ...p,
          zHeight: 0,
          thetaDeg: 90,
          phiDeg: 45,
          intersectType: 1,
        }));
        break;
      case "gaokaoPyramid":
        setParams((p) => ({
          ...p,
          lambdaE: 0.5,
          lambdaF: 0.5,
          pyramidA: 3.6,
          pyramidB: 2.8,
          pyramidH: 3.5,
        }));
        break;
      case "vector":
        setParams((p) => ({ ...p, thetaDeg: 30, phiDeg: 30, zHeight: 1.5 }));
        break;
    }
  };

  // 按模式精准过滤参数
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysMap: Record<TeachingMode, string[]> = {
      parallel:
        subTheorem === "judge" ? ["zHeight", "phiDeg"] : ["zHeight", "step"],
      perpendicular:
        subTheorem === "judge" ? ["thetaDeg", "phiDeg"] : ["phiDeg"],
      gaokaoPyramid: ["lambdaE", "lambdaF", "pyramidH", "pyramidA", "pyramidB"],
      vector: ["thetaDeg", "phiDeg", "zHeight"],
    };

    return keysMap[activeMode]
      .map((k) => linePlaneRelationMeta.find((m) => m.key === k))
      .filter((m): m is NonNullable<typeof m> => Boolean(m))
      .map((meta) => ({
        key: meta.key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        value: params[meta.key] ?? meta.defaultValue ?? 0,
        min: meta.min,
        max: meta.max,
        step: meta.step ?? 0.1,
        description: meta.description,
        descriptionFormula: meta.descriptionFormula,
        importance: meta.importance,
        marks: meta.marks,
      }));
  }, [params, activeMode, subTheorem]);

  // 3D 几何向量解算
  const effectiveZ = inPlaneType === 0 ? 0 : zHeight;
  const lineDir = getLineDirection(thetaDeg, phiDeg);
  const lineLen = 2.6;
  const startPoint: Vec3 = {
    x: -lineDir.x * lineLen,
    y: -lineDir.y * lineLen,
    z: effectiveZ - lineDir.z * lineLen,
  };
  const endPoint: Vec3 = {
    x: lineDir.x * lineLen,
    y: lineDir.y * lineLen,
    z: effectiveZ + lineDir.z * lineLen,
  };
  const midPoint: Vec3 = { x: 0, y: 0, z: effectiveZ };

  const lineMStart: Vec3 = { x: -2.6, y: 0, z: 0 };
  const lineMEnd: Vec3 = { x: 2.6, y: 0, z: 0 };

  const phiRadB = (phiDeg * Math.PI) / 180;
  const lineBStart: Vec3 =
    intersectType === 1
      ? { x: -2.6 * Math.cos(phiRadB), y: -2.6 * Math.sin(phiRadB), z: 0 }
      : { x: -2.6, y: 1.5, z: 0 };
  const lineBEnd: Vec3 =
    intersectType === 1
      ? { x: 2.6 * Math.cos(phiRadB), y: 2.6 * Math.sin(phiRadB), z: 0 }
      : { x: 2.6, y: 1.5, z: 0 };

  const testMRad = (phiDeg * Math.PI) / 180;
  const testMEnd: Vec3 = {
    x: 2.5 * Math.cos(testMRad),
    y: 2.5 * Math.sin(testMRad),
    z: 0,
  };

  const normalEnd: Vec3 = { x: 0, y: 0, z: 2.5 };
  const projPoint: Vec3 = { x: endPoint.x, y: endPoint.y, z: effectiveZ };

  // 精准图例
  const legendItems = useMemo<LegendItem[]>(() => {
    let items: LegendItem[] = [];
    switch (activeMode) {
      case "parallel":
        items =
          subTheorem === "judge"
            ? [
                {
                  colorKey: "paramPrimary",
                  swatch: "line",
                  label: "空间直线 l",
                },
                { colorKey: "secondary", swatch: "area", label: "基准平面 α" },
                {
                  colorKey: "paramSecondary",
                  swatch: "line",
                  label: "面内平行线 m",
                },
              ]
            : [
                {
                  colorKey: "paramPrimary",
                  swatch: "line",
                  label: "平行直线 l",
                },
                { colorKey: "secondary", swatch: "area", label: "基准平面 α" },
                {
                  colorKey: "paramTertiary",
                  swatch: "area",
                  label: "辅助截面 β",
                },
                {
                  colorKey: "paramSecondary",
                  swatch: "line",
                  label: "两面交线 m",
                },
              ];
        break;
      case "perpendicular":
        items =
          subTheorem === "judge"
            ? [
                {
                  colorKey: "paramPrimary",
                  swatch: "line",
                  label: "空间垂线 l",
                },
                { colorKey: "secondary", swatch: "area", label: "基准平面 α" },
                {
                  colorKey: "paramSecondary",
                  swatch: "line",
                  label: "面内直线 a, b",
                },
              ]
            : [
                {
                  colorKey: "paramPrimary",
                  swatch: "line",
                  label: "垂线 l ⊥ α",
                },
                { colorKey: "secondary", swatch: "area", label: "基准平面 α" },
                {
                  colorKey: "paramSecondary",
                  swatch: "line",
                  label: "面内任意直线 m",
                },
                {
                  colorKey: "highlight",
                  swatch: "line",
                  label: "直角 ∠(l, m) = 90°",
                },
              ];
        break;
      case "gaokaoPyramid":
        items = [
          {
            colorKey: "paramPrimary",
            swatch: "line",
            label: "垂直侧棱 PA ⊥ 底面",
          },
          { colorKey: "highlight", swatch: "line", label: "动点连线 EF" },
          { colorKey: "secondary", swatch: "area", label: "矩形底面 ABCD" },
          { colorKey: "paramTertiary", swatch: "area", label: "平行侧面 PAD" },
        ];
        break;
      case "vector":
        items = [
          { colorKey: "paramPrimary", swatch: "line", label: "方向向量 l" },
          {
            colorKey: "highlight",
            swatch: "line",
            label: "法向量 n = (0,0,1)",
          },
          { colorKey: "secondary", swatch: "area", label: "基准平面 α" },
          { colorKey: "paramSecondary", swatch: "line", label: "线面角 θ" },
        ];
        break;
    }
    if (showAxes) {
      items.push({
        colorKey: "grid",
        swatch: "line",
        label: "坐标轴 (x红/y绿/z蓝)",
      });
    }
    return items;
  }, [activeMode, subTheorem, showAxes]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 探究模式选择 */}
          <LeftPanelSection title="探究模式">
            <SelectGrid
              items={[
                {
                  key: "parallel",
                  formula: "l \\parallel \\alpha",
                  label: "线面平行",
                },
                {
                  key: "perpendicular",
                  formula: "l \\perp \\alpha",
                  label: "线面垂直",
                },
                {
                  key: "gaokaoPyramid",
                  formula: "P\\text{-}ABCD",
                  label: "高考母题",
                },
                {
                  key: "vector",
                  formula: "\\vec{l} \\cdot \\vec{n}",
                  label: "空间向量",
                },
              ]}
              value={activeMode}
              onChange={(m) => handleModeChange(m as TeachingMode)}
              columns={2}
            />
          </LeftPanelSection>

          {/* 2. 定理与模型分支 */}
          {activeMode === "parallel" && (
            <LeftPanelSection title="定理与分支">
              <div className="space-y-2">
                <TabSwitcher
                  tabs={[
                    { key: "judge", label: "判定定理" },
                    { key: "prop", label: "性质定理" },
                  ]}
                  value={subTheorem}
                  onChange={(val) => setSubTheorem(val as "judge" | "prop")}
                />
                <SelectGrid
                  items={[
                    { key: "1", label: "面外直线 (l ⊄ α)" },
                    { key: "0", label: "面内直线 (l ⊂ α 反例)" },
                  ]}
                  value={String(inPlaneType)}
                  onChange={(v) => handleParamChange("inPlaneType", Number(v))}
                  columns={2}
                />
              </div>
            </LeftPanelSection>
          )}

          {activeMode === "perpendicular" && (
            <LeftPanelSection title="定理与分支">
              <div className="space-y-2">
                <TabSwitcher
                  tabs={[
                    { key: "judge", label: "判定定理" },
                    { key: "prop", label: "性质定理" },
                  ]}
                  value={subTheorem}
                  onChange={(val) => setSubTheorem(val as "judge" | "prop")}
                />
                {subTheorem === "judge" && (
                  <SelectGrid
                    items={[
                      { key: "1", label: "两线相交 (成立)" },
                      { key: "0", label: "两线平行 (反例)" },
                    ]}
                    value={String(intersectType)}
                    onChange={(v) =>
                      handleParamChange("intersectType", Number(v))
                    }
                    columns={2}
                  />
                )}
              </div>
            </LeftPanelSection>
          )}

          {activeMode === "gaokaoPyramid" && (
            <LeftPanelSection title="动点位置预设">
              <SelectGrid
                items={[
                  { key: "mid", label: "中点平行 (λ = 0.5)" },
                  { key: "third", label: "三分之一点 (λ = 1/3)" },
                  { key: "diff", label: "相交反例 (λ_E ≠ λ_F)" },
                ]}
                value={
                  lambdaE === 0.5 && lambdaF === 0.5
                    ? "mid"
                    : Math.abs(lambdaE - 0.33) < 0.05 &&
                        Math.abs(lambdaF - 0.33) < 0.05
                      ? "third"
                      : Math.abs(lambdaE - 0.3) < 0.02 &&
                          Math.abs(lambdaF - 0.7) < 0.02
                        ? "diff"
                        : ""
                }
                onChange={(val) => {
                  if (val === "mid")
                    setParams((p) => ({ ...p, lambdaE: 0.5, lambdaF: 0.5 }));
                  else if (val === "third")
                    setParams((p) => ({ ...p, lambdaE: 0.33, lambdaF: 0.33 }));
                  else if (val === "diff")
                    setParams((p) => ({ ...p, lambdaE: 0.3, lambdaF: 0.7 }));
                }}
                columns={1}
              />
            </LeftPanelSection>
          )}

          {/* 3. 参数调节 */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 4. 教学提示 */}
          <LeftPanelSection title="教学提示" compact>
            {activeMode === "parallel" && inPlaneType === 0 && (
              <TipCard variant="danger">
                <span className="font-bold">易错反例</span>：当直线在面内时（
                <KatexFormula formula="l \subset \alpha" mode="inline" />
                ），即使与面内直线平行，也不构成线面平行。必须满足
                <span className="font-bold">面外直线</span>前提（
                <KatexFormula formula="l \not\subset \alpha" mode="inline" />
                ）。
              </TipCard>
            )}
            {activeMode === "parallel" && inPlaneType === 1 && (
              <TipCard variant="info">
                <span className="font-bold">线面平行转化</span>：线线平行（
                <KatexFormula formula="l \parallel m" mode="inline" />
                ）且面外（
                <KatexFormula formula="l \not\subset \alpha" mode="inline" />）
                <KatexFormula formula="\Rightarrow" mode="inline" /> 线面平行（
                <KatexFormula formula="l \parallel \alpha" mode="inline" />
                ）。
              </TipCard>
            )}
            {activeMode === "perpendicular" &&
              subTheorem === "judge" &&
              intersectType === 0 && (
                <TipCard variant="danger">
                  <span className="font-bold">易错反例</span>
                  ：若仅垂直于面内两条平行线，直线可绕其倾斜旋转，无法确定垂面。必须垂直于两条
                  <span className="font-bold">相交直线</span>。
                </TipCard>
              )}
            {activeMode === "perpendicular" &&
              (subTheorem === "prop" ||
                (subTheorem === "judge" && intersectType === 1)) && (
                <TipCard variant="success">
                  <span className="font-bold">线面垂直核心</span>
                  ：垂直于面内两条相交直线{" "}
                  <KatexFormula formula="\Rightarrow" mode="inline" />{" "}
                  垂直于平面内任意一条直线。
                </TipCard>
              )}
            {activeMode === "gaokaoPyramid" && (
              <TipCard variant="warning">
                <span className="font-bold">高考母题转化链</span>：中位线 /
                平行线分线段成比例定理（
                <KatexFormula formula="\lambda_E = \lambda_F" mode="inline" />）
                <KatexFormula
                  formula="\Rightarrow EF \parallel BC \Rightarrow EF \parallel"
                  mode="inline"
                />{" "}
                平面 ABCD。
              </TipCard>
            )}
            {activeMode === "vector" && (
              <TipCard variant="primary">
                <span className="font-bold">空间向量法</span>：方向向量{" "}
                <KatexFormula formula="\vec{l}" mode="inline" /> 垂直于法向量{" "}
                <KatexFormula formula="\vec{n}" mode="inline" />（
                <KatexFormula
                  formula="\vec{l} \cdot \vec{n} = 0"
                  mode="inline"
                />
                ）判定平行；线面角{" "}
                <KatexFormula
                  formula="\sin\theta = |\cos\langle\vec{l}, \vec{n}\rangle|"
                  mode="inline"
                />
                。
              </TipCard>
            )}
          </LeftPanelSection>

          {/* 5. 视图与视角 */}
          <LeftPanelSection title="视图与视角">
            <div className="space-y-2">
              {activeMode === "gaokaoPyramid" && (
                <TabSwitcher
                  layout="horizontal"
                  tabs={[
                    { key: "orbit", label: "🔄 视角漫游" },
                    { key: "drag", label: "👆 动点交互" },
                  ]}
                  value={interactionMode}
                  onChange={(m) => setInteractionMode(m as InteractionMode3D)}
                />
              )}
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
              <SelectGrid
                items={[
                  { key: "0", label: "隐藏坐标轴" },
                  { key: "1", label: "显示坐标轴" },
                ]}
                value={showAxes ? "1" : "0"}
                onChange={(v) => setShowAxes(v === "1")}
                columns={2}
              />
            </div>
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <ThreeDCanvas
          cameraPosition={cameraPosition}
          legend={<Legend3D title="图例" items={legendItems} />}
          overlay={
            activeMode === "gaokaoPyramid" ? (
              <ModeSwitchOverlay3D
                mode={interactionMode}
                onModeChange={setInteractionMode}
                pointCount={2}
              />
            ) : undefined
          }
        >
          <CameraRig
            ref={controlsRef}
            enabled={
              interactionMode === "orbit" || activeMode !== "gaokaoPyramid"
            }
          />
          <Scene3DGrid size={5} showLabels={showAxes} />

          {/* 模式 1：高考四棱锥母题 */}
          {activeMode === "gaokaoPyramid" && (
            <PyramidModelScene
              lambdaE={lambdaE}
              lambdaF={lambdaF}
              a={pyramidA}
              b={pyramidB}
              h={pyramidH}
              draggable={interactionMode === "drag"}
              onDragE={(val) => handleParamChange("lambdaE", val)}
              onDragF={(val) => handleParamChange("lambdaF", val)}
            />
          )}

          {/* 模式 2：非四棱锥通用场景 */}
          {activeMode !== "gaokaoPyramid" && (
            <>
              {/* 基准平面 α */}
              <Plane3D
                origin={{ x: 0, y: 0, z: 0 }}
                uAxis={{ x: 1, y: 0, z: 0 }}
                vAxis={{ x: 0, y: 1, z: 0 }}
                width={5.6}
                height={5.6}
                colorKey="secondary"
                opacity={0.22}
              />
              <FormulaLabel3D
                position={{ x: 2.3, y: 2.3, z: 0.05 }}
                tex="\alpha"
              />

              {/* 空间直线 l */}
              <Vector3DArrow
                from={startPoint}
                to={endPoint}
                colorKey="paramPrimary"
              />
              <FormulaLabel3D
                position={{
                  x: endPoint.x + 0.15,
                  y: endPoint.y + 0.15,
                  z: endPoint.z + 0.1,
                }}
                tex="l"
              />

              {/* 线面平行 */}
              {activeMode === "parallel" && (
                <>
                  <Vector3DArrow
                    from={lineMStart}
                    to={lineMEnd}
                    colorKey="paramSecondary"
                  />
                  <FormulaLabel3D
                    position={{
                      x: lineMEnd.x + 0.15,
                      y: lineMEnd.y + 0.15,
                      z: 0.05,
                    }}
                    tex="m"
                  />
                  {subTheorem === "prop" && step > 0.05 && (
                    <>
                      <Plane3D
                        origin={{ x: 0, y: 0, z: (effectiveZ * step) / 2 }}
                        uAxis={{ x: 1, y: 0, z: 0 }}
                        vAxis={{ x: 0, y: 0, z: 1 }}
                        width={5.6}
                        height={Math.max(0.5, effectiveZ * step)}
                        colorKey="paramTertiary"
                        opacity={0.22}
                      />
                      <FormulaLabel3D
                        position={{
                          x: 2.3,
                          y: 0.1,
                          z: (effectiveZ * step) / 2,
                        }}
                        tex="\beta"
                      />
                    </>
                  )}
                </>
              )}

              {/* 线面垂直 */}
              {activeMode === "perpendicular" && (
                <>
                  {subTheorem === "judge" ? (
                    <>
                      {/* 直线 a */}
                      <Vector3DArrow
                        from={lineMStart}
                        to={lineMEnd}
                        colorKey="paramSecondary"
                      />
                      <FormulaLabel3D
                        position={{
                          x: lineMEnd.x + 0.15,
                          y: lineMEnd.y + 0.15,
                          z: 0.05,
                        }}
                        tex="a"
                      />

                      {/* 直线 b */}
                      <Vector3DArrow
                        from={lineBStart}
                        to={lineBEnd}
                        colorKey="paramSecondary"
                      />
                      <FormulaLabel3D
                        position={{
                          x: lineBEnd.x + 0.15,
                          y: lineBEnd.y + 0.15,
                          z: 0.05,
                        }}
                        tex="b"
                      />

                      {/* 交点 P 与两条直角标记 */}
                      {intersectType === 1 && (
                        <>
                          <Point3D
                            position={{ x: 0, y: 0, z: 0 }}
                            colorKey="paramPrimary"
                            radius={0.05}
                          />
                          <CompoundLabel3D
                            position={{ x: 0, y: 0, z: 0 }}
                            base="P"
                            colorKey="paramPrimary"
                            offset={[-0.2, -0.2, 0]}
                          />

                          {/* 直角标记 1: l ⊥ a */}
                          <AngleArc3D
                            vertex={{ x: 0, y: 0, z: 0 }}
                            dirA={{ x: 0, y: 0, z: 1 }}
                            dirB={{ x: 1, y: 0, z: 0 }}
                            radius={0.45}
                            colorKey="paramPrimary"
                          />

                          {/* 直角标记 2: l ⊥ b */}
                          <AngleArc3D
                            vertex={{ x: 0, y: 0, z: 0 }}
                            dirA={{ x: 0, y: 0, z: 1 }}
                            dirB={{
                              x: Math.cos(Math.PI / 4),
                              y: Math.sin(Math.PI / 4),
                              z: 0,
                            }}
                            radius={0.6}
                            colorKey="paramSecondary"
                          />
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {/* 垂足 O */}
                      <Point3D
                        position={{ x: 0, y: 0, z: 0 }}
                        colorKey="paramPrimary"
                        radius={0.05}
                      />
                      <CompoundLabel3D
                        position={{ x: 0, y: 0, z: 0 }}
                        base="O"
                        colorKey="paramPrimary"
                        offset={[-0.2, -0.2, 0]}
                      />

                      {/* 面内任意直线 m */}
                      <Vector3DArrow
                        from={{ x: -testMEnd.x, y: -testMEnd.y, z: 0 }}
                        to={testMEnd}
                        colorKey="paramSecondary"
                      />
                      <FormulaLabel3D
                        position={{
                          x: testMEnd.x + 0.15,
                          y: testMEnd.y + 0.15,
                          z: 0.05,
                        }}
                        tex="m"
                      />

                      {/* 直角标记 l ⊥ m */}
                      <AngleArc3D
                        vertex={{ x: 0, y: 0, z: 0 }}
                        dirA={{ x: 0, y: 0, z: 2.5 }}
                        dirB={{ x: testMEnd.x, y: testMEnd.y, z: 0 }}
                        radius={0.55}
                        colorKey="highlight"
                      />
                    </>
                  )}
                </>
              )}

              {/* 空间向量法 */}
              {activeMode === "vector" && (
                <>
                  <Vector3DArrow
                    from={{ x: 0, y: 0, z: 0 }}
                    to={normalEnd}
                    colorKey="highlight"
                  />
                  <FormulaLabel3D
                    position={{ x: 0.15, y: 0.15, z: 2.6 }}
                    tex="\vec{n}"
                  />
                  {thetaDeg > 0 && thetaDeg < 90 && (
                    <AngleArc3D
                      vertex={midPoint}
                      dirA={{
                        x: endPoint.x - midPoint.x,
                        y: endPoint.y - midPoint.y,
                        z: endPoint.z - midPoint.z,
                      }}
                      dirB={{
                        x: projPoint.x - midPoint.x,
                        y: projPoint.y - midPoint.y,
                        z: 0,
                      }}
                      radius={0.8}
                      colorKey="paramSecondary"
                    />
                  )}
                </>
              )}
            </>
          )}
        </ThreeDCanvas>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title="空间位置关系与判定定理看板"
        />
      }
    />
  );
}
