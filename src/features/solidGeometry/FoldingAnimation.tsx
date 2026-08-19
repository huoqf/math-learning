import { useState, useMemo } from "react";
import { ThreePanel } from "@/components/Layout/ThreePanel";
import { ThreeDCanvas } from "@/components/Layout/ThreeDCanvas";
import { ThreeViewsPanel } from "@/components/Math3D/ThreeViewsPanel";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  MathPanel,
  TabSwitcher,
  SelectGrid,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import {
  Scene3DGrid,
  Segment3D,
  Vector3DArrow,
  Point3D,
  PointLabel3D,
  CompoundLabel3D,
  Polygon3DFace,
  AngleArc3D,
  Legend3D,
  CameraRig,
  ModeSwitchOverlay3D,
} from "@/components/Math3D";
import type { InteractionMode3D } from "@/components/Math3D";
import { use3DViewport } from "@/hooks/use3DViewport";
import type { CameraPreset } from "@/hooks/use3DViewport";
import { solidFoldingMeta } from "@/data/registries/solidGeometry";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  calculateRightTrapezoidFolding,
  calculateRectangleDiagonalFolding,
  calculateTriangleAltitudeFolding,
  calculateRhombusFolding,
  type FoldingModelKind,
} from "@/math3d/folding";
import { buildSolidViews } from "./threeViews/buildSolidViews";
import type { Vec3 } from "@/math3d/vector3";

export default function FoldingAnimation() {
  const [model, setModel] = useState<FoldingModelKind>("trapezoid");
  const [foldState, setFoldState] = useState<"both" | "folded" | "unfolded">(
    "both",
  );
  const [interactionMode, setInteractionMode] =
    useState<InteractionMode3D>("orbit");
  const [showVectorBasis, setShowVectorBasis] = useState<boolean>(false);
  const [showDihedralArc, setShowDihedralArc] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<"3d" | "threeViews">("3d");
  const [params, setParams] = useState<Record<string, number>>({
    a: 4,
    b: 3,
    h: 3,
    alphaDeg: 90,
  });

  const { preset, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  const a = params.a ?? 4;
  const b = params.b ?? 3;
  const h = params.h ?? 3;
  // 当切换到 2D 展平状态时，视角和翻折角设为 0°
  const alphaDeg = foldState === "unfolded" ? 0 : (params.alphaDeg ?? 90);

  // 1. 求解 3D 折叠数学模型（顶点坐标绝对精准无错位）
  const foldingData = useMemo(() => {
    switch (model) {
      case "trapezoid":
        return calculateRightTrapezoidFolding(a, b, h, alphaDeg);
      case "rectangleDiagonal":
        return calculateRectangleDiagonalFolding(a, b, alphaDeg);
      case "triangleAltitude":
        return calculateTriangleAltitudeFolding(a, h, alphaDeg);
      case "rhombus":
        return calculateRhombusFolding(a, alphaDeg);
    }
  }, [model, a, b, h, alphaDeg]);

  // 2. 右屏 MathPanel 看板数据组装
  const mathData = useMemo(
    () => buildMathQuantities("anim-solid-folding", params, { model }),
    [params, model],
  );

  // 3. 正投影/三视图组装
  const solidViews = useMemo(
    () =>
      buildSolidViews("cuboid", {
        width: a,
        depth: b,
        height: h,
      }),
    [a, b, h],
  );

  // 4. 左屏按 model 过滤参数配置并注入高中数学几何边长描述
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByModel: Record<FoldingModelKind, string[]> = {
      trapezoid: ["a", "b", "h", "alphaDeg"],
      rectangleDiagonal: ["a", "b", "alphaDeg"],
      triangleAltitude: ["a", "h", "alphaDeg"],
      rhombus: ["a", "alphaDeg"],
    };

    const descMap: Record<
      FoldingModelKind,
      Record<string, { label: string; descFormula: string }>
    > = {
      trapezoid: {
        a: { label: "下底长 a", descFormula: "\\text{下底 } AD" },
        b: { label: "上底长 b", descFormula: "\\text{上底 } BC = AE" },
        h: { label: "垂直腰 h", descFormula: "\\text{垂直腰 } AB = CE" },
        alphaDeg: { label: "二面角 α", descFormula: "\\text{二面角 } D'-EC-A" },
      },
      rectangleDiagonal: {
        a: { label: "矩形长 a", descFormula: "\\text{长 } AB = CD" },
        b: { label: "矩形宽 b", descFormula: "\\text{宽 } AD = BC" },
        alphaDeg: { label: "二面角 α", descFormula: "\\text{二面角 } A'-BD-C" },
      },
      triangleAltitude: {
        a: { label: "底边长 a", descFormula: "\\text{底边 } BC" },
        h: { label: "高线长 h", descFormula: "\\text{高 } AD \\perp BC" },
        alphaDeg: { label: "二面角 α", descFormula: "\\text{二面角 } B-AD-C'" },
      },
      rhombus: {
        a: {
          label: "菱形边长 a (∠BAD=60°)",
          descFormula: "\\text{边长 } AB = BC,\\; \\angle BAD = 60^\\circ",
        },
        alphaDeg: {
          label: "二面角 α",
          descFormula:
            "\\text{翻折旋转角 } \\alpha\\;(\\angle A'OA_0 = \\alpha)",
        },
      },
    };

    const validKeys = keysByModel[model] ?? ["alphaDeg"];
    return validKeys.map((key) => {
      const meta = solidFoldingMeta.find((m) => m.key === key);
      const customDesc = descMap[model]?.[key];
      return {
        key,
        label: customDesc?.label ?? meta?.label ?? key,
        labelFormula: meta?.labelFormula,
        value: params[key] ?? meta?.defaultValue ?? 0,
        min: meta?.min ?? 0,
        max: meta?.max ?? 180,
        step: meta?.step ?? 1,
        description: meta?.description,
        descriptionFormula: customDesc?.descFormula ?? meta?.descriptionFormula,
        importance: meta?.importance,
        marks: meta?.marks,
      };
    });
  }, [params, model]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setParams({ a: 4, b: 3, h: 3, alphaDeg: 90 });
  };

  // 拖拽 3D 点时反向解算二面角 α
  const handlePointDrag = (newZ: number, maxRadius: number) => {
    const clampedZ = Math.max(0, Math.min(maxRadius, newZ));
    const sinA = clampedZ / maxRadius;
    const newAlphaDeg = Math.round((Math.asin(sinA) * 180) / Math.PI);
    setParams((prev) => ({ ...prev, alphaDeg: newAlphaDeg }));
  };

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 第 1 步：探究模式与高考折叠模型选择 */}
          <LeftPanelSection
            title="探究模式"
            subtitle="点击选择高中数学 4 大经典平面折叠母题模型"
          >
            <SelectGrid
              columns={2}
              items={[
                {
                  key: "trapezoid",
                  label: "1. 直角梯形",
                  formula: "\\text{折痕 } EC",
                },
                {
                  key: "rectangleDiagonal",
                  label: "2. 矩形对角线",
                  formula: "\\text{折痕 } BD",
                },
                {
                  key: "triangleAltitude",
                  label: "3. 等腰三角形高",
                  formula: "\\text{折痕 } AD",
                },
                {
                  key: "rhombus",
                  label: "4. 菱形对角线",
                  formula: "\\text{短对角线 } BD",
                },
              ]}
              value={model}
              onChange={(m) => setModel(m as FoldingModelKind)}
            />
          </LeftPanelSection>

          {/* 第 2 步：原平面图形与 3D 折叠对比 */}
          <LeftPanelSection
            title="几何对比模式"
            subtitle="对比展平前 2D 原图形与翻折后 3D 空间几何体"
          >
            <TabSwitcher
              tabs={[
                { key: "both", label: "3D折叠+虚线原图" },
                { key: "folded", label: "纯 3D 折叠" },
                { key: "unfolded", label: "2D 展平原图" },
              ]}
              value={foldState}
              onChange={(s) => setFoldState(s as typeof foldState)}
            />
          </LeftPanelSection>

          {/* 第 3 步：参数调节 */}
          <LeftPanelSection
            title="参数调节"
            subtitle="调节边长尺寸与翻折二面角 α"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 第 4 步：教学提示 */}
          <LeftPanelSection title="教学提示" compact>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowDihedralArc((prev) => !prev)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    showDihedralArc
                      ? "bg-primary-50 border-primary-300 text-primary-700"
                      : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  {showDihedralArc ? "✓ 二面角平面角" : "显示二面角"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowVectorBasis((prev) => !prev)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    showVectorBasis
                      ? "bg-primary-50 border-primary-300 text-primary-700"
                      : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  {showVectorBasis ? "✓ 空间向量建系" : "空间向量建系"}
                </button>
              </div>

              {/* 动态教学提示卡 */}
              <TipCard variant="primary">
                {model === "trapezoid" && (
                  <span>
                    💡 <b>直角梯形折叠破题核心</b>：折痕 EC ⊥ AD 且 EC ⊥
                    BC。折后 EC ⊥ EA 且 EC ⊥ ED'，因此{" "}
                    <b>EC ⊥ 面 D'EA 恒成立</b>！
                  </span>
                )}
                {model === "rectangleDiagonal" && (
                  <span>
                    💡 <b>矩形对角线折叠核心</b>：△A'BD 与 △CBD 均为直角三角形，
                    <b>外接球球心始终为 BD 中点</b>，半径 R 恒定不变！
                  </span>
                )}
                {model === "triangleAltitude" && (
                  <span>
                    💡 <b>等腰三角形折叠核心</b>：折痕 AD 垂直于底边两半段 DB 与
                    DC'，两侧垂线夹角 ∠BDC' = 180°−α（α 为翻折旋转角）。α = 90°
                    时 ∠BDC' = 90°，构成标准墙角模型，DA⊥DB，DA⊥DC'，DB⊥DC'。
                  </span>
                )}
                {model === "rhombus" && (
                  <span>
                    💡 <b>菱形短对角线折叠核心</b>：折痕 BD ⊥ A'O 且 BD ⊥ CO，故{" "}
                    <b>BD ⊥ 面 A'OC</b>，异面直线 <b>BD ⊥ A'C 恒成立</b>！
                  </span>
                )}
              </TipCard>
            </div>
          </LeftPanelSection>

          {/* 第 5 步：视图与视角 */}
          <LeftPanelSection title="视图与视角">
            <div className="space-y-2">
              <TabSwitcher
                layout="horizontal"
                tabs={[
                  { key: "3d", label: "3D 直观图" },
                  { key: "threeViews", label: "2D 三视图" },
                ]}
                value={viewMode}
                onChange={(m) => setViewMode(m as typeof viewMode)}
              />
              {viewMode === "3d" && (
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
              )}
            </div>
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        viewMode === "3d" ? (
          <ThreeDCanvas
            cameraPosition={cameraPosition}
            overlay={
              <ModeSwitchOverlay3D
                mode={interactionMode}
                onModeChange={setInteractionMode}
                pointCount={1}
              />
            }
            legend={
              <Legend3D
                title="图例"
                items={[
                  {
                    colorKey: "primary",
                    swatch: "area",
                    label: "静态底面",
                  },
                  {
                    colorKey: "highlight",
                    swatch: "area",
                    label: "翻折平面 (绕折痕旋转)",
                  },
                  {
                    colorKey: "secondary",
                    swatch: "line",
                    label: showVectorBasis
                      ? "折痕轴 / 底面法向量 n₁"
                      : "折痕轴线",
                  },
                  {
                    colorKey: "accent",
                    swatch: "line",
                    label: `变动线段 ${foldingData.movingSegmentName}`,
                  },
                  {
                    colorKey: "paramPrimary",
                    swatch: "line",
                    label: showVectorBasis
                      ? "二面角垂线 / 坐标轴"
                      : "二面角垂线与角弧",
                  },
                ]}
              />
            }
          >
            <CameraRig
              ref={controlsRef}
              enabled={interactionMode === "orbit"}
            />
            <Scene3DGrid size={5} />

            {/* ── 1. 直角梯形翻折 ── */}
            {model === "trapezoid" &&
              (() => {
                const { A, B, C, E, "D'": D_prime } = foldingData.points;
                const D_0: Vec3 = { x: a, y: 0, z: 0 };
                const showUnfolded =
                  foldState === "both" || foldState === "unfolded";

                return (
                  <>
                    {/* (A) 静态底面矩形 ABCE 实体填充面与无箭头几何棱 */}
                    <Polygon3DFace
                      points={[A, B, C, E]}
                      colorKey="primary"
                      opacity={0.25}
                    />
                    <Segment3D from={A} to={B} colorKey="primary" />
                    <Segment3D from={B} to={C} colorKey="primary" />
                    <Segment3D from={A} to={E} colorKey="primary" />
                    {/* 折痕轴 CE */}
                    <Segment3D
                      from={E}
                      to={C}
                      colorKey="secondary"
                      lineWidth={3}
                    />

                    {/* (B) 展平状态下的直角梯形 ABCD_0 柔和半透明参考轮廓 */}
                    {showUnfolded && (
                      <>
                        <Polygon3DFace
                          points={[A, B, C, D_0]}
                          colorKey="circle"
                          opacity={0.12}
                        />
                        <Segment3D
                          from={E}
                          to={D_0}
                          colorKey="circle"
                          opacity={0.6}
                          lineWidth={1.5}
                        />
                        <Segment3D
                          from={C}
                          to={D_0}
                          colorKey="circle"
                          opacity={0.6}
                          lineWidth={1.5}
                        />
                        <CompoundLabel3D
                          position={D_0}
                          base="D"
                          subscript="0"
                          offset={[0.2, -0.2, 0]}
                        />
                      </>
                    )}

                    {/* (C) 翻折三角形 △CD'E 实体填充面与 3D 几何棱 */}
                    {foldState !== "unfolded" && (
                      <>
                        <Polygon3DFace
                          points={[E, C, D_prime]}
                          colorKey="highlight"
                          opacity={0.35}
                        />
                        <Segment3D
                          from={E}
                          to={D_prime}
                          colorKey="highlight"
                          lineWidth={2.5}
                        />
                        <Segment3D
                          from={C}
                          to={D_prime}
                          colorKey="highlight"
                          lineWidth={2.5}
                        />
                        <Segment3D
                          from={D_prime}
                          to={A}
                          colorKey="accent"
                          lineWidth={2}
                        />

                        {/* 二面角平面角构造垂线对：ED' ⊥ EC 与 EA ⊥ EC */}
                        {showDihedralArc && alphaDeg > 0 && alphaDeg < 180 && (
                          <>
                            <Segment3D
                              from={E}
                              to={A}
                              colorKey="paramPrimary"
                              lineWidth={2.5}
                            />
                            <Segment3D
                              from={E}
                              to={D_prime}
                              colorKey="paramPrimary"
                              lineWidth={2.5}
                            />
                            <AngleArc3D
                              vertex={E}
                              dirA={{ x: -1, y: 0, z: 0 }}
                              dirB={{
                                x: D_prime.x - E.x,
                                y: 0,
                                z: D_prime.z - E.z,
                              }}
                              radius={0.8}
                              colorKey="paramPrimary"
                            />
                          </>
                        )}

                        <Point3D
                          position={D_prime}
                          draggable={interactionMode === "drag"}
                          constrain={(raw) => {
                            const lenED = a - b;
                            return {
                              x:
                                b +
                                lenED * Math.cos((alphaDeg * Math.PI) / 180),
                              y: 0,
                              z: Math.max(0, Math.min(lenED, raw.z)),
                            };
                          }}
                          onDrag={(next) => handlePointDrag(next.z, a - b)}
                          colorKey="highlight"
                        />
                        <PointLabel3D
                          position={D_prime}
                          text="D'"
                          offset={[0.1, 0.1, 0.2]}
                        />
                      </>
                    )}

                    {/* 向量建系与两半平面法向量可视化 (带箭头空间向量) */}
                    {showVectorBasis && (
                      <>
                        <Vector3DArrow
                          from={A}
                          to={{ x: 2.2, y: 0, z: 0 }}
                          colorKey="paramPrimary"
                        />
                        <Vector3DArrow
                          from={A}
                          to={{ x: 0, y: 2.2, z: 0 }}
                          colorKey="paramSecondary"
                        />
                        <Vector3DArrow
                          from={A}
                          to={{ x: 0, y: 0, z: 2.2 }}
                          colorKey="paramTertiary"
                        />
                        <PointLabel3D
                          position={{ x: 2.3, y: 0, z: 0 }}
                          text="x"
                        />
                        <PointLabel3D
                          position={{ x: 0, y: 2.3, z: 0 }}
                          text="y"
                        />
                        <PointLabel3D
                          position={{ x: 0, y: 0, z: 2.3 }}
                          text="z"
                        />

                        <Vector3DArrow
                          from={E}
                          to={{ x: E.x, y: E.y, z: 1.6 }}
                          colorKey="secondary"
                        />
                        <CompoundLabel3D
                          position={{ x: E.x, y: E.y, z: 1.7 }}
                          base="n"
                          subscript="1"
                        />
                        {alphaDeg > 0 && alphaDeg < 180 && (
                          <>
                            <Vector3DArrow
                              from={E}
                              to={{
                                x:
                                  E.x -
                                  1.6 * Math.sin((alphaDeg * Math.PI) / 180),
                                y: E.y,
                                z: 1.6 * Math.cos((alphaDeg * Math.PI) / 180),
                              }}
                              colorKey="highlight"
                            />
                            <CompoundLabel3D
                              position={{
                                x:
                                  E.x -
                                  1.7 * Math.sin((alphaDeg * Math.PI) / 180),
                                y: E.y,
                                z: 1.7 * Math.cos((alphaDeg * Math.PI) / 180),
                              }}
                              base="n"
                              subscript="2"
                            />
                          </>
                        )}
                      </>
                    )}

                    {/* 顶点 3D 文本标签 */}
                    <PointLabel3D
                      position={A}
                      text="A"
                      offset={[-0.2, -0.2, 0]}
                    />
                    <PointLabel3D
                      position={B}
                      text="B"
                      offset={[-0.2, 0.2, 0]}
                    />
                    <PointLabel3D
                      position={E}
                      text="E"
                      offset={[0, -0.25, 0]}
                    />
                    <PointLabel3D position={C} text="C" offset={[0, 0.25, 0]} />
                  </>
                );
              })()}

            {/* ── 2. 矩形沿对角线翻折 ── */}
            {model === "rectangleDiagonal" &&
              (() => {
                const { A, B, C, D, HA, "A'": A_prime } = foldingData.points;
                const showUnfolded =
                  foldState === "both" || foldState === "unfolded";
                const rA = Math.sqrt((A.x - HA.x) ** 2 + (A.y - HA.y) ** 2);

                return (
                  <>
                    {/* (A) 静态底面 △CBD 实体填充面与无箭头棱 */}
                    <Polygon3DFace
                      points={[B, C, D]}
                      colorKey="primary"
                      opacity={0.25}
                    />
                    <Segment3D
                      from={B}
                      to={D}
                      colorKey="secondary"
                      lineWidth={3}
                    />
                    <Segment3D from={B} to={C} colorKey="primary" />
                    <Segment3D from={D} to={C} colorKey="primary" />

                    {/* (B) 展平状态下的整块矩形 ABCD 柔和半透明参考轮廓 */}
                    {showUnfolded && (
                      <>
                        <Polygon3DFace
                          points={[A, B, C, D]}
                          colorKey="circle"
                          opacity={0.12}
                        />
                        <Segment3D
                          from={A}
                          to={B}
                          colorKey="circle"
                          opacity={0.6}
                          lineWidth={1.5}
                        />
                        <Segment3D
                          from={D}
                          to={A}
                          colorKey="circle"
                          opacity={0.6}
                          lineWidth={1.5}
                        />
                        <Segment3D
                          from={HA}
                          to={A}
                          colorKey="circle"
                          opacity={0.6}
                          lineWidth={1.5}
                        />
                        <CompoundLabel3D
                          position={A}
                          base="A"
                          subscript="0"
                          offset={[-0.2, -0.2, 0]}
                        />
                      </>
                    )}

                    {/* (C) 翻折三角形 △A'BD 实体填充面与 3D 棱 */}
                    {foldState !== "unfolded" && (
                      <>
                        <Polygon3DFace
                          points={[B, A_prime, D]}
                          colorKey="highlight"
                          opacity={0.35}
                        />
                        <Segment3D
                          from={B}
                          to={A_prime}
                          colorKey="highlight"
                          lineWidth={2.5}
                        />
                        <Segment3D
                          from={D}
                          to={A_prime}
                          colorKey="highlight"
                          lineWidth={2.5}
                        />
                        <Segment3D
                          from={HA}
                          to={A_prime}
                          colorKey="highlight"
                          lineWidth={2}
                        />
                        <Segment3D
                          from={A_prime}
                          to={C}
                          colorKey="accent"
                          lineWidth={2}
                        />

                        {/* 二面角平面角构造垂线对：HA A ⊥ BD 与 HA A' ⊥ BD */}
                        {showDihedralArc && alphaDeg > 0 && alphaDeg < 180 && (
                          <>
                            <Segment3D
                              from={HA}
                              to={A}
                              colorKey="paramPrimary"
                              lineWidth={2.5}
                            />
                            <Segment3D
                              from={HA}
                              to={A_prime}
                              colorKey="paramPrimary"
                              lineWidth={2.5}
                            />
                            <AngleArc3D
                              vertex={HA}
                              dirA={{
                                x: A.x - HA.x,
                                y: A.y - HA.y,
                                z: 0,
                              }}
                              dirB={{
                                x: A_prime.x - HA.x,
                                y: A_prime.y - HA.y,
                                z: A_prime.z - HA.z,
                              }}
                              radius={0.8}
                              colorKey="paramPrimary"
                            />
                          </>
                        )}

                        <Point3D
                          position={A_prime}
                          draggable={interactionMode === "drag"}
                          constrain={(raw) => ({
                            x: A_prime.x,
                            y: A_prime.y,
                            z: Math.max(0, Math.min(rA, raw.z)),
                          })}
                          onDrag={(next) => handlePointDrag(next.z, rA)}
                          colorKey="highlight"
                        />
                        <PointLabel3D
                          position={A_prime}
                          text="A'"
                          offset={[-0.2, 0, 0.2]}
                        />
                      </>
                    )}

                    {/* 向量建系与法向量可视化 (带箭头空间向量) */}
                    {showVectorBasis && (
                      <>
                        <Vector3DArrow
                          from={HA}
                          to={{ x: HA.x + 2, y: HA.y, z: 0 }}
                          colorKey="paramPrimary"
                        />
                        <Vector3DArrow
                          from={HA}
                          to={{ x: HA.x, y: HA.y + 2, z: 0 }}
                          colorKey="paramSecondary"
                        />
                        <Vector3DArrow
                          from={HA}
                          to={{ x: HA.x, y: HA.y, z: 2 }}
                          colorKey="paramTertiary"
                        />
                        <PointLabel3D
                          position={{ x: HA.x + 2.1, y: HA.y, z: 0 }}
                          text="x"
                        />
                        <PointLabel3D
                          position={{ x: HA.x, y: HA.y + 2.1, z: 0 }}
                          text="y"
                        />
                        <PointLabel3D
                          position={{ x: HA.x, y: HA.y, z: 2.1 }}
                          text="z"
                        />

                        <Vector3DArrow
                          from={HA}
                          to={{ x: HA.x, y: HA.y, z: 1.6 }}
                          colorKey="secondary"
                        />
                        <CompoundLabel3D
                          position={{ x: HA.x, y: HA.y, z: 1.7 }}
                          base="n"
                          subscript="1"
                        />
                      </>
                    )}

                    {/* 静态顶点标签 */}
                    <CompoundLabel3D
                      position={HA}
                      base="H"
                      subscript="A"
                      offset={[0, -0.3, -0.2]}
                    />
                    <PointLabel3D
                      position={B}
                      text="B"
                      offset={[0.2, -0.2, 0]}
                    />
                    <PointLabel3D
                      position={D}
                      text="D"
                      offset={[-0.2, 0.2, 0]}
                    />
                    <PointLabel3D
                      position={C}
                      text="C"
                      offset={[0.2, 0.2, 0]}
                    />
                  </>
                );
              })()}

            {/* ── 3. 等腰三角形沿高翻折 ── */}
            {model === "triangleAltitude" &&
              (() => {
                const { A, B, D, "C'": C_prime } = foldingData.points;
                const halfA = a / 2;
                const C_0: Vec3 = { x: halfA, y: 0, z: 0 };
                const showUnfolded =
                  foldState === "both" || foldState === "unfolded";

                return (
                  <>
                    {/* (A) 静态底面 △ABD 实体填充面与无箭头棱 */}
                    <Polygon3DFace
                      points={[A, B, D]}
                      colorKey="primary"
                      opacity={0.25}
                    />
                    <Segment3D
                      from={D}
                      to={A}
                      colorKey="secondary"
                      lineWidth={3}
                    />
                    <Segment3D from={D} to={B} colorKey="primary" />
                    <Segment3D from={A} to={B} colorKey="primary" />

                    {/* (B) 展平状态下的整块等腰三角形 ABC_0 柔和半透明参考轮廓 */}
                    {showUnfolded && (
                      <>
                        <Polygon3DFace
                          points={[B, A, C_0]}
                          colorKey="circle"
                          opacity={0.12}
                        />
                        <Segment3D
                          from={B}
                          to={C_0}
                          colorKey="circle"
                          opacity={0.6}
                          lineWidth={1.5}
                        />
                        <Segment3D
                          from={A}
                          to={C_0}
                          colorKey="circle"
                          opacity={0.6}
                          lineWidth={1.5}
                        />
                        <Segment3D
                          from={D}
                          to={C_0}
                          colorKey="circle"
                          opacity={0.6}
                          lineWidth={1.5}
                        />
                        <CompoundLabel3D
                          position={C_0}
                          base="C"
                          subscript="0"
                          offset={[0.2, 0, 0]}
                        />
                      </>
                    )}

                    {/* (C) 翻折三角形 △AC'D 实体填充面与 3D 棱 */}
                    {foldState !== "unfolded" && (
                      <>
                        <Polygon3DFace
                          points={[A, C_prime, D]}
                          colorKey="highlight"
                          opacity={0.35}
                        />
                        <Segment3D
                          from={D}
                          to={C_prime}
                          colorKey="highlight"
                          lineWidth={2.5}
                        />
                        <Segment3D
                          from={A}
                          to={C_prime}
                          colorKey="highlight"
                          lineWidth={2.5}
                        />
                        <Segment3D
                          from={B}
                          to={C_prime}
                          colorKey="accent"
                          lineWidth={2}
                        />

                        {/* 二面角平面角构造垂线对：DB ⊥ AD 与 DC' ⊥ AD */}
                        {showDihedralArc && alphaDeg > 0 && alphaDeg < 180 && (
                          <>
                            <Segment3D
                              from={D}
                              to={B}
                              colorKey="paramPrimary"
                              lineWidth={2.5}
                            />
                            <Segment3D
                              from={D}
                              to={C_prime}
                              colorKey="paramPrimary"
                              lineWidth={2.5}
                            />
                            <AngleArc3D
                              vertex={D}
                              dirA={{ x: -1, y: 0, z: 0 }}
                              dirB={{
                                x: C_prime.x,
                                y: 0,
                                z: C_prime.z,
                              }}
                              radius={0.8}
                              colorKey="paramPrimary"
                            />
                          </>
                        )}

                        <Point3D
                          position={C_prime}
                          draggable={interactionMode === "drag"}
                          constrain={(raw) => ({
                            x: halfA * Math.cos((alphaDeg * Math.PI) / 180),
                            y: 0,
                            z: Math.max(0, Math.min(halfA, raw.z)),
                          })}
                          onDrag={(next) => handlePointDrag(next.z, halfA)}
                          colorKey="highlight"
                        />
                        <PointLabel3D
                          position={C_prime}
                          text="C'"
                          offset={[0.2, 0, 0.2]}
                        />
                      </>
                    )}

                    {/* 向量建系与法向量可视化 (带箭头空间向量，以 D 为原点) */}
                    {showVectorBasis && (
                      <>
                        <Vector3DArrow
                          from={D}
                          to={{ x: 2, y: 0, z: 0 }}
                          colorKey="paramPrimary"
                        />
                        <Vector3DArrow
                          from={D}
                          to={{ x: 0, y: 2.2, z: 0 }}
                          colorKey="paramSecondary"
                        />
                        <Vector3DArrow
                          from={D}
                          to={{ x: 0, y: 0, z: 2 }}
                          colorKey="paramTertiary"
                        />
                        <PointLabel3D
                          position={{ x: 2.1, y: 0, z: 0 }}
                          text="x"
                        />
                        <PointLabel3D
                          position={{ x: 0, y: 2.3, z: 0 }}
                          text="y"
                        />
                        <PointLabel3D
                          position={{ x: 0, y: 0, z: 2.1 }}
                          text="z"
                        />

                        <Vector3DArrow
                          from={D}
                          to={{ x: 0, y: 0, z: 1.6 }}
                          colorKey="secondary"
                        />
                        <CompoundLabel3D
                          position={{ x: 0, y: 0, z: 1.7 }}
                          base="n"
                          subscript="1"
                        />
                        {alphaDeg > 0 && alphaDeg < 180 && (
                          <>
                            <Vector3DArrow
                              from={D}
                              to={{
                                x: -1.6 * Math.sin((alphaDeg * Math.PI) / 180),
                                y: 0,
                                z: 1.6 * Math.cos((alphaDeg * Math.PI) / 180),
                              }}
                              colorKey="highlight"
                            />
                            <CompoundLabel3D
                              position={{
                                x: -1.7 * Math.sin((alphaDeg * Math.PI) / 180),
                                y: 0,
                                z: 1.7 * Math.cos((alphaDeg * Math.PI) / 180),
                              }}
                              base="n"
                              subscript="2"
                            />
                          </>
                        )}
                      </>
                    )}

                    {/* 静态顶点标签 */}
                    <PointLabel3D
                      position={D}
                      text="D"
                      offset={[0, -0.3, -0.2]}
                    />
                    <PointLabel3D position={A} text="A" offset={[0, 0.2, 0]} />
                    <PointLabel3D
                      position={B}
                      text="B"
                      offset={[-0.2, -0.2, 0]}
                    />
                  </>
                );
              })()}

            {/* ── 4. 菱形沿短对角线翻折 ── */}
            {model === "rhombus" &&
              (() => {
                const { O, B, C, D, "A'": A_prime } = foldingData.points;
                const hAO = (Math.sqrt(3) / 2) * a;
                const A_0: Vec3 = { x: -hAO, y: 0, z: 0 };
                const showUnfolded =
                  foldState === "both" || foldState === "unfolded";

                return (
                  <>
                    {/* (A) 静态底面 △BCD 实体填充面与无箭头棱 */}
                    <Polygon3DFace
                      points={[B, C, D]}
                      colorKey="primary"
                      opacity={0.25}
                    />
                    <Segment3D
                      from={B}
                      to={D}
                      colorKey="secondary"
                      lineWidth={3}
                    />
                    <Segment3D from={B} to={C} colorKey="primary" />
                    <Segment3D from={D} to={C} colorKey="primary" />
                    <Segment3D from={O} to={C} colorKey="paramTertiary" />

                    {/* (B) 展平状态下的整块菱形 A_0BCD 柔和半透明参考轮廓 */}
                    {showUnfolded && (
                      <>
                        <Polygon3DFace
                          points={[A_0, B, C, D]}
                          colorKey="circle"
                          opacity={0.12}
                        />
                        <Segment3D
                          from={A_0}
                          to={B}
                          colorKey="circle"
                          opacity={0.6}
                          lineWidth={1.5}
                        />
                        <Segment3D
                          from={D}
                          to={A_0}
                          colorKey="circle"
                          opacity={0.6}
                          lineWidth={1.5}
                        />
                        <Segment3D
                          from={O}
                          to={A_0}
                          colorKey="circle"
                          opacity={0.6}
                          lineWidth={1.5}
                        />
                        <Segment3D
                          from={A_0}
                          to={C}
                          colorKey="circle"
                          opacity={0.6}
                          lineWidth={1.5}
                        />
                        <CompoundLabel3D
                          position={A_0}
                          base="A"
                          subscript="0"
                          offset={[-0.2, 0, 0]}
                        />
                      </>
                    )}

                    {/* (C) 翻折三角形 △A'BD 实体填充面与 3D 棱 */}
                    {foldState !== "unfolded" && (
                      <>
                        <Polygon3DFace
                          points={[B, A_prime, D]}
                          colorKey="highlight"
                          opacity={0.35}
                        />
                        <Segment3D
                          from={B}
                          to={A_prime}
                          colorKey="highlight"
                          lineWidth={2.5}
                        />
                        <Segment3D
                          from={D}
                          to={A_prime}
                          colorKey="highlight"
                          lineWidth={2.5}
                        />
                        <Segment3D
                          from={O}
                          to={A_prime}
                          colorKey="highlight"
                          lineWidth={2}
                        />
                        <Segment3D
                          from={A_prime}
                          to={C}
                          colorKey="accent"
                          lineWidth={2}
                        />

                        {/* 二面角平面角构造垂线对：OA_0 ⊥ BD 与 OA' ⊥ BD */}
                        {showDihedralArc && alphaDeg > 0 && alphaDeg < 180 && (
                          <>
                            <Segment3D
                              from={O}
                              to={A_0}
                              colorKey="paramPrimary"
                              lineWidth={2.5}
                            />
                            <Segment3D
                              from={O}
                              to={A_prime}
                              colorKey="paramPrimary"
                              lineWidth={2.5}
                            />
                            <AngleArc3D
                              vertex={O}
                              dirA={{ x: -1, y: 0, z: 0 }}
                              dirB={{
                                x: A_prime.x,
                                y: 0,
                                z: A_prime.z,
                              }}
                              radius={0.8}
                              colorKey="paramPrimary"
                            />
                          </>
                        )}

                        <Point3D
                          position={A_prime}
                          draggable={interactionMode === "drag"}
                          constrain={(raw) => ({
                            x: -(hAO * Math.cos((alphaDeg * Math.PI) / 180)),
                            y: 0,
                            z: Math.max(0, Math.min(hAO, raw.z)),
                          })}
                          onDrag={(next) => handlePointDrag(next.z, hAO)}
                          colorKey="highlight"
                        />
                        <PointLabel3D
                          position={A_prime}
                          text="A'"
                          offset={[-0.2, 0, 0.2]}
                        />
                      </>
                    )}

                    {/* 向量建系与法向量可视化 (带箭头空间向量，以 O 为原点) */}
                    {showVectorBasis && (
                      <>
                        <Vector3DArrow
                          from={O}
                          to={{ x: 2, y: 0, z: 0 }}
                          colorKey="paramPrimary"
                        />
                        <Vector3DArrow
                          from={O}
                          to={{ x: 0, y: 2, z: 0 }}
                          colorKey="paramSecondary"
                        />
                        <Vector3DArrow
                          from={O}
                          to={{ x: 0, y: 0, z: 2 }}
                          colorKey="paramTertiary"
                        />
                        <PointLabel3D
                          position={{ x: 2.1, y: 0, z: 0 }}
                          text="x"
                        />
                        <PointLabel3D
                          position={{ x: 0, y: 2.1, z: 0 }}
                          text="y"
                        />
                        <PointLabel3D
                          position={{ x: 0, y: 0, z: 2.1 }}
                          text="z"
                        />

                        <Vector3DArrow
                          from={O}
                          to={{ x: 0, y: 0, z: 1.6 }}
                          colorKey="secondary"
                        />
                        <CompoundLabel3D
                          position={{ x: 0, y: 0, z: 1.7 }}
                          base="n"
                          subscript="1"
                        />
                        {alphaDeg > 0 && alphaDeg < 180 && (
                          <>
                            <Vector3DArrow
                              from={O}
                              to={{
                                x: 1.6 * Math.sin((alphaDeg * Math.PI) / 180),
                                y: 0,
                                z: 1.6 * Math.cos((alphaDeg * Math.PI) / 180),
                              }}
                              colorKey="highlight"
                            />
                            <CompoundLabel3D
                              position={{
                                x: 1.7 * Math.sin((alphaDeg * Math.PI) / 180),
                                y: 0,
                                z: 1.7 * Math.cos((alphaDeg * Math.PI) / 180),
                              }}
                              base="n"
                              subscript="2"
                            />
                          </>
                        )}
                      </>
                    )}

                    {/* 静态顶点标签 */}
                    <PointLabel3D
                      position={O}
                      text="O"
                      offset={[0, -0.3, -0.2]}
                    />
                    <PointLabel3D position={B} text="B" offset={[0, -0.2, 0]} />
                    <PointLabel3D position={D} text="D" offset={[0, 0.2, 0]} />
                    <PointLabel3D position={C} text="C" offset={[0.2, 0, 0]} />
                  </>
                );
              })()}
          </ThreeDCanvas>
        ) : (
          <ThreeViewsPanel
            views={solidViews.views}
            extent={solidViews.extent}
          />
        )
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title="翻折二面角看板"
        />
      }
    />
  );
}
