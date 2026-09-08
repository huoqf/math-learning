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
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { Legend3D, CameraRig, ModeSwitchOverlay3D } from "@/components/Math3D";
import type { InteractionMode3D } from "@/components/Math3D";
import { use3DViewport } from "@/hooks/use3DViewport";
import type { CameraPreset } from "@/hooks/use3DViewport";
import { solidFoldingMeta } from "@/data/registries/solidGeometry";
import { MATH_COLORS } from "@/theme";
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
      Record<string, { label: string; labelFormula: string }>
    > = {
      trapezoid: {
        alphaDeg: {
          label: "翻折角 α",
          labelFormula: `\\text{翻折角 } \\color{${MATH_COLORS.paramPrimary}}{\\alpha}`,
        },
        a: {
          label: "下底长 a",
          labelFormula: `\\text{下底长 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
        },
        b: {
          label: "上底长 b",
          labelFormula: `\\text{上底长 } \\color{${MATH_COLORS.paramSecondary}}{b}`,
        },
        h: {
          label: "垂直腰 h",
          labelFormula: `\\text{垂直腰 } \\color{${MATH_COLORS.paramTertiary}}{h}`,
        },
      },
      rectangleDiagonal: {
        alphaDeg: {
          label: "翻折角 α",
          labelFormula: `\\text{翻折角 } \\color{${MATH_COLORS.paramPrimary}}{\\alpha}`,
        },
        a: {
          label: "矩形长 a",
          labelFormula: `\\text{矩形长 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
        },
        b: {
          label: "矩形宽 b",
          labelFormula: `\\text{矩形宽 } \\color{${MATH_COLORS.paramSecondary}}{b}`,
        },
      },
      triangleAltitude: {
        alphaDeg: {
          label: "翻折角 α",
          labelFormula: `\\text{翻折角 } \\color{${MATH_COLORS.paramPrimary}}{\\alpha}`,
        },
        a: {
          label: "底边长 a",
          labelFormula: `\\text{底边长 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
        },
        h: {
          label: "高线长 h",
          labelFormula: `\\text{高线长 } \\color{${MATH_COLORS.paramTertiary}}{h}`,
        },
      },
      rhombus: {
        alphaDeg: {
          label: "翻折角 α",
          labelFormula: `\\text{翻折角 } \\color{${MATH_COLORS.paramPrimary}}{\\alpha}`,
        },
        a: {
          label: "菱形边长 a",
          labelFormula: `\\text{菱形边长 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
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
        labelFormula: customDesc?.labelFormula ?? meta?.labelFormula,
        value: params[key] ?? meta?.defaultValue ?? 0,
        min: meta?.min ?? 0,
        max: meta?.max ?? 180,
        step: meta?.step ?? 1,
        description: meta?.description,
        importance: meta?.importance,
        marks: meta?.marks,
        group: meta?.group,
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

  // 左屏教学提示与题设导引（说明初始条件与探究设问）
  const tipConfig = useMemo(() => {
    switch (model) {
      case "trapezoid":
        return {
          variant: "primary" as const,
          badge: "高考母题 · 直角梯形翻折",
          condition:
            "直角梯形 ABCD 中 AB ⊥ AD, BC ∥ AD, AD=a, BC=b, AB=h。E 在 AD 上且 AE=BC，沿折痕 EC 将 △CDE 翻折，二面角为 α。",
          question:
            "探究翻折过程中面内垂直性（EC ⊥ D'E, EC ⊥ AE）的不变性，当 α=90° 时求证 D'E ⊥ 底面 ABCE 并求解空间线面角与异面直线角。",
        };
      case "rectangleDiagonal":
        return {
          variant: "warning" as const,
          badge: "高考经典 · 矩形对角线翻折",
          condition:
            "矩形 ABCD 长 AB=a、宽 AD=b，沿对角线 BD 翻折 △ABD 至 △A'BD，二面角为 α。",
          question:
            "探究翻折过程中 A'B ⊥ A'D 的不变性，求解二面角 α 变化时空间两动点间距 A'C 与三棱锥 A'-BCD 体积的极值规律。",
        };
      case "triangleAltitude":
        return {
          variant: "success" as const,
          badge: "高考母题 · 等腰三角形高线翻折",
          condition:
            "等腰三角形 ABC 底边 BC=a，高 AD=h。沿高线 AD 将 △ACD 翻折至 △AC'D，二面角为 α。",
          question:
            "探究折痕 AD ⊥ 底面 BDC' 的垂直不变性，当 α=90° 时求证 C'D ⊥ BD 并计算三棱锥 A-BC'D 外接球半径。",
        };
      case "rhombus":
        return {
          variant: "accent" as const,
          badge: "高考压轴 · 菱形短对角线翻折",
          condition:
            "菱形 ABCD 边长为 a，∠BAD=60°。沿短对角线 BD 翻折 △ABD 至 △A'BD，二面角为 α。",
          question:
            "探究二面角 α 与空间二面角 A'-BD-C 的等价性，当面 A'BD ⊥ 面 CBD 时求解点 A' 到底面距离与体对角线长。",
        };
    }
  }, [model]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 第 1 步：探究模式与高考折叠模型选择 */}
          <LeftPanelSection title="探究模型">
            <SelectGrid
              columns={2}
              items={[
                {
                  key: "trapezoid",
                  label: "直角梯形翻折",
                },
                {
                  key: "rectangleDiagonal",
                  label: "矩形对角线翻折",
                },
                {
                  key: "triangleAltitude",
                  label: "等腰高线翻折",
                },
                {
                  key: "rhombus",
                  label: "菱形对角线翻折",
                },
              ]}
              value={model}
              onChange={(m) => setModel(m as FoldingModelKind)}
            />
          </LeftPanelSection>

          {/* 第 2 步：原平面图形与 3D 折叠对比 */}
          <LeftPanelSection title="几何对比模式">
            <TabSwitcher
              layout="horizontal"
              tabs={[
                { key: "both", label: "3D折叠+虚线原图" },
                { key: "folded", label: "纯3D折叠" },
                { key: "unfolded", label: "2D展平原图" },
              ]}
              value={foldState}
              onChange={(s) => setFoldState(s as typeof foldState)}
            />
          </LeftPanelSection>

          {/* 第 3 步：参数调节 */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 第 4 步：视图与图层控制（开关并排 + 视角预设） */}
          <LeftPanelSection title="视图与图层控制" compact>
            <div className="space-y-2">
              {/* 开关双列并排 */}
              <div className="grid grid-cols-2 gap-2">
                <Toggle
                  label="二面角弧"
                  checked={showDihedralArc}
                  onChange={setShowDihedralArc}
                  size="compact"
                />
                <Toggle
                  label="空间基底"
                  checked={showVectorBasis}
                  onChange={setShowVectorBasis}
                  size="compact"
                />
              </div>

              {/* 3D / 三视图切换 */}
              <TabSwitcher
                layout="horizontal"
                size="compact"
                tabs={[
                  { key: "3d", label: "3D直观图" },
                  { key: "threeViews", label: "2D三视图" },
                ]}
                value={viewMode}
                onChange={(m) => setViewMode(m as typeof viewMode)}
              />

              {/* 3D 方位预设 */}
              {viewMode === "3d" && (
                <TabSwitcher
                  layout="horizontal"
                  size="compact"
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

          {/* 第 5 步：教学提示与题设导引 */}
          <LeftPanelSection title="教学导引" compact>
            <TipCard
              variant={tipConfig.variant}
              badge={tipConfig.badge}
              condition={tipConfig.condition}
              question={tipConfig.question}
            />
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
