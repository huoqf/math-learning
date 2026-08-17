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
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import {
  Scene3DGrid,
  Vector3DArrow,
  Point3D,
  PointLabel3D,
  CompoundLabel3D,
  Polygon3DFace,
  Legend3D,
  CameraRig,
} from "@/components/Math3D";
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
  // 当切换到 2D 展平状态时，视角和翻折角设为 0°/展平状态
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

  // 4. 左屏按 model 过滤参数配置
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByModel: Record<FoldingModelKind, string[]> = {
      trapezoid: ["a", "b", "h", "alphaDeg"],
      rectangleDiagonal: ["a", "b", "alphaDeg"],
      triangleAltitude: ["a", "h", "alphaDeg"],
      rhombus: ["a", "alphaDeg"],
    };
    const validKeys = keysByModel[model] ?? ["alphaDeg"];
    return validKeys.map((key) => {
      const meta = solidFoldingMeta.find((m) => m.key === key);
      return {
        key,
        label: meta?.label ?? key,
        labelFormula: meta?.labelFormula,
        value: params[key] ?? meta?.defaultValue ?? 0,
        min: meta?.min ?? 0,
        max: meta?.max ?? 180,
        step: meta?.step ?? 1,
        description: meta?.description,
        descriptionFormula: meta?.descriptionFormula,
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
          <LeftPanelSection
            title="高考折叠模型选择"
            subtitle="点击选择高中数学 4 大经典平面折叠模型"
          >
            <SelectGrid
              columns={2}
              items={[
                {
                  key: "trapezoid",
                  label: "1. 直角梯形翻折",
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

          <LeftPanelSection
            title="原平面图形与 3D 折叠对比"
            subtitle="对比展平前 2D 几何原图与翻折后 3D 几何体"
          >
            <TabSwitcher
              tabs={[
                { key: "both", label: "3D 折叠 + 虚线原图形对比" },
                { key: "folded", label: "纯 3D 折叠" },
                { key: "unfolded", label: "2D 展平原图" },
              ]}
              value={foldState}
              onChange={(s) => setFoldState(s as typeof foldState)}
            />
          </LeftPanelSection>

          <LeftPanelSection title="视图模式选择">
            <TabSwitcher
              tabs={[
                { key: "3d", label: "3D 动态直观图" },
                { key: "threeViews", label: "正投影/三视图" },
              ]}
              value={viewMode}
              onChange={(m) => setViewMode(m as typeof viewMode)}
            />
          </LeftPanelSection>

          <LeftPanelSection
            title="几何尺寸与折叠二面角"
            subtitle="调节边长尺寸与翻折二面角 α"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          <LeftPanelSection title="3D 视角预设">
            <TabSwitcher
              tabs={[
                { key: "iso", label: "轴测" },
                { key: "front", label: "主视" },
                { key: "top", label: "俯视" },
                { key: "side", label: "左视" },
              ]}
              value={preset}
              onChange={(p) => setCameraPreset(p as CameraPreset)}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        viewMode === "3d" ? (
          <ThreeDCanvas
            cameraPosition={cameraPosition}
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
                    label: "折痕轴线 EC/BD/AD",
                  },
                  {
                    colorKey: "accent",
                    swatch: "line",
                    label: `变动线段 ${foldingData.movingSegmentName}`,
                  },
                ]}
              />
            }
          >
            <CameraRig ref={controlsRef} />
            <Scene3DGrid size={5} />

            {/* ── 1. 直角梯形翻折 ── */}
            {model === "trapezoid" &&
              (() => {
                const { A, B, C, E, "D'": D_prime } = foldingData.points;
                // 展平状态下的原始顶点 D_0 (a, 0, 0)
                const D_0: Vec3 = { x: a, y: 0, z: 0 };
                const showUnfolded =
                  foldState === "both" || foldState === "unfolded";

                return (
                  <>
                    {/* (A) 静态底面矩形 ABCE 实体填充面 (A -> B -> C -> E) */}
                    <Polygon3DFace
                      points={[A, B, C, E]}
                      colorKey="primary"
                      opacity={0.25}
                    />
                    <Vector3DArrow from={A} to={B} colorKey="primary" />
                    <Vector3DArrow from={B} to={C} colorKey="primary" />
                    <Vector3DArrow from={A} to={E} colorKey="primary" />
                    {/* 折痕轴 CE (垂直于 AD) */}
                    <Vector3DArrow from={E} to={C} colorKey="secondary" />

                    {/* (B) 展平状态下的整块直角梯形 ABCD_0 虚线/全量对比面 */}
                    {showUnfolded && (
                      <>
                        {/* 整块直角梯形 ABCD_0 填充面 */}
                        <Polygon3DFace
                          points={[A, B, C, D_0]}
                          colorKey="circle"
                          opacity={0.15}
                        />
                        {/* 直角梯形 4 条外边框：AD_0, BC, AB, CD_0 */}
                        <Vector3DArrow from={E} to={D_0} colorKey="circle" />
                        <Vector3DArrow from={C} to={D_0} colorKey="circle" />
                        <PointLabel3D
                          position={D_0}
                          text="D (展平点)"
                          offset={[0.2, -0.2, 0]}
                        />
                      </>
                    )}

                    {/* (C) 翻折三角形 △CD'E 实体填充面与 3D 棱 */}
                    {foldState !== "unfolded" && (
                      <>
                        <Polygon3DFace
                          points={[E, C, D_prime]}
                          colorKey="highlight"
                          opacity={0.35}
                        />
                        <Vector3DArrow
                          from={E}
                          to={D_prime}
                          colorKey="highlight"
                        />
                        <Vector3DArrow
                          from={C}
                          to={D_prime}
                          colorKey="highlight"
                        />
                        {/* 跨面变动线段 D'A */}
                        <Vector3DArrow
                          from={D_prime}
                          to={A}
                          colorKey="accent"
                        />

                        <Point3D
                          position={D_prime}
                          draggable
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
                          text="D' (翻折点)"
                          offset={[0.1, 0.1, 0.2]}
                        />
                      </>
                    )}

                    {/* 顶点 3D 文本标签 */}
                    <PointLabel3D
                      position={A}
                      text="A (原点)"
                      offset={[-0.2, -0.2, 0]}
                    />
                    <PointLabel3D
                      position={B}
                      text="B"
                      offset={[-0.2, 0.2, 0]}
                    />
                    <PointLabel3D
                      position={E}
                      text="E (折痕底)"
                      offset={[0, -0.3, 0]}
                    />
                    <PointLabel3D
                      position={C}
                      text="C (折痕顶)"
                      offset={[0, 0.3, 0]}
                    />
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
                    {/* (A) 静态底面 △CBD 实体填充面 */}
                    <Polygon3DFace
                      points={[B, C, D]}
                      colorKey="primary"
                      opacity={0.25}
                    />
                    <Vector3DArrow from={B} to={D} colorKey="secondary" />
                    <Vector3DArrow from={B} to={C} colorKey="primary" />
                    <Vector3DArrow from={D} to={C} colorKey="primary" />

                    {/* (B) 展平状态下的整块矩形 ABCD 虚线/全量对比面 */}
                    {showUnfolded && (
                      <>
                        {/* 整块标准矩形 ABCD 填充面 (A -> B -> C -> D) */}
                        <Polygon3DFace
                          points={[A, B, C, D]}
                          colorKey="circle"
                          opacity={0.15}
                        />
                        {/* 矩形 4 条外边框：AB, BC, CD, DA */}
                        <Vector3DArrow from={A} to={B} colorKey="circle" />
                        <Vector3DArrow from={D} to={A} colorKey="circle" />
                        <Vector3DArrow from={HA} to={A} colorKey="circle" />
                        <PointLabel3D
                          position={A}
                          text="A (展平点)"
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
                        <Vector3DArrow
                          from={B}
                          to={A_prime}
                          colorKey="highlight"
                        />
                        <Vector3DArrow
                          from={D}
                          to={A_prime}
                          colorKey="highlight"
                        />
                        <Vector3DArrow
                          from={HA}
                          to={A_prime}
                          colorKey="highlight"
                        />
                        <Vector3DArrow
                          from={A_prime}
                          to={C}
                          colorKey="accent"
                        />

                        <Point3D
                          position={A_prime}
                          draggable
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
                          text="A' (翻折点)"
                          offset={[-0.2, 0, 0.2]}
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
                    {/* (A) 静态底面 △ABD 实体填充面 */}
                    <Polygon3DFace
                      points={[A, B, D]}
                      colorKey="primary"
                      opacity={0.25}
                    />
                    <Vector3DArrow from={D} to={A} colorKey="secondary" />
                    <Vector3DArrow from={D} to={B} colorKey="primary" />
                    <Vector3DArrow from={A} to={B} colorKey="primary" />

                    {/* (B) 展平状态下的整块等腰三角形 ABC_0 虚线/全量对比面 */}
                    {showUnfolded && (
                      <>
                        <Polygon3DFace
                          points={[B, A, C_0]}
                          colorKey="circle"
                          opacity={0.15}
                        />
                        <Vector3DArrow from={B} to={C_0} colorKey="circle" />
                        <Vector3DArrow from={A} to={C_0} colorKey="circle" />
                        <Vector3DArrow from={D} to={C_0} colorKey="circle" />
                        <PointLabel3D
                          position={C_0}
                          text="C (展平点)"
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
                        <Vector3DArrow
                          from={D}
                          to={C_prime}
                          colorKey="highlight"
                        />
                        <Vector3DArrow
                          from={A}
                          to={C_prime}
                          colorKey="highlight"
                        />
                        <Vector3DArrow
                          from={B}
                          to={C_prime}
                          colorKey="accent"
                        />

                        <Point3D
                          position={C_prime}
                          draggable
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
                          text="C' (翻折点)"
                          offset={[0.2, 0, 0.2]}
                        />
                      </>
                    )}

                    {/* 静态顶点标签 */}
                    <PointLabel3D
                      position={D}
                      text="D (底边中点)"
                      offset={[0, -0.3, -0.2]}
                    />
                    <PointLabel3D
                      position={A}
                      text="A (顶角)"
                      offset={[0, 0.2, 0]}
                    />
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
                    {/* (A) 静态底面 △BCD 实体填充面 */}
                    <Polygon3DFace
                      points={[B, C, D]}
                      colorKey="primary"
                      opacity={0.25}
                    />
                    <Vector3DArrow from={B} to={D} colorKey="secondary" />
                    <Vector3DArrow from={B} to={C} colorKey="primary" />
                    <Vector3DArrow from={D} to={C} colorKey="primary" />
                    <Vector3DArrow from={O} to={C} colorKey="paramTertiary" />

                    {/* (B) 展平状态下的整块菱形 A_0BCD 虚线/全量对比面 */}
                    {showUnfolded && (
                      <>
                        <Polygon3DFace
                          points={[A_0, B, C, D]}
                          colorKey="circle"
                          opacity={0.15}
                        />
                        <Vector3DArrow from={A_0} to={B} colorKey="circle" />
                        <Vector3DArrow from={D} to={A_0} colorKey="circle" />
                        <Vector3DArrow from={O} to={A_0} colorKey="circle" />
                        <Vector3DArrow from={A_0} to={C} colorKey="circle" />
                        <PointLabel3D
                          position={A_0}
                          text="A (展平点)"
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
                        <Vector3DArrow
                          from={B}
                          to={A_prime}
                          colorKey="highlight"
                        />
                        <Vector3DArrow
                          from={D}
                          to={A_prime}
                          colorKey="highlight"
                        />
                        <Vector3DArrow
                          from={O}
                          to={A_prime}
                          colorKey="highlight"
                        />
                        <Vector3DArrow
                          from={A_prime}
                          to={C}
                          colorKey="accent"
                        />

                        <Point3D
                          position={A_prime}
                          draggable
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
                          text="A' (翻折点)"
                          offset={[-0.2, 0, 0.2]}
                        />
                      </>
                    )}

                    {/* 静态顶点标签 */}
                    <PointLabel3D
                      position={O}
                      text="O (对角线交点)"
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
          title="翻折二面角看板"
        />
      }
    />
  );
}
