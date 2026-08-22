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
  Toggle,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { Legend3D, CameraRig, ModeSwitchOverlay3D } from "@/components/Math3D";
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
  buildFoldingPolyhedron,
  type FoldingModelKind,
} from "@/math3d/folding";
import { projectPolyhedron } from "@/math3d/orthographicProjection";
import { FoldingModelScene3D } from "./FoldingModelScene3D";

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

  // 3. 真实折叠体正投影/三视图组装
  const solidViews = useMemo(() => {
    const poly = buildFoldingPolyhedron(foldingData);
    return {
      views: {
        front: projectPolyhedron(poly, "front"),
        side: projectPolyhedron(poly, "side"),
        top: projectPolyhedron(poly, "top"),
      },
      extent: Math.max(a, b, h) * 1.3,
    };
  }, [foldingData, a, b, h]);

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

          {/* 第 4 步：辅助图层开关 */}
          <LeftPanelSection
            title="图层开关"
            subtitle="辅助几何与向量建系"
            compact
          >
            <div className="space-y-2">
              <Toggle
                label="二面角平面角弧线"
                checked={showDihedralArc}
                onChange={setShowDihedralArc}
              />
              <Toggle
                label="空间向量直角坐标系"
                checked={showVectorBasis}
                onChange={setShowVectorBasis}
              />
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

            <FoldingModelScene3D
              model={model}
              foldingData={foldingData}
              foldState={foldState}
              interactionMode={interactionMode}
              showVectorBasis={showVectorBasis}
              showDihedralArc={showDihedralArc}
              alphaDeg={alphaDeg}
              a={a}
              b={b}
              onPointDrag={handlePointDrag}
            />
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
