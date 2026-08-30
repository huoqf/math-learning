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
  Toggle,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { Legend3D, CameraRig, ModeSwitchOverlay3D } from "@/components/Math3D";
import type { LegendItem, InteractionMode3D } from "@/components/Math3D";
import { use3DViewport } from "@/hooks/use3DViewport";
import type { CameraPreset } from "@/hooks/use3DViewport";
import { buildMathQuantities } from "@/data/mathQuantities";
import { surfaceRelationMeta } from "@/data/registries/solidGeometry";
import { SurfaceParallelJudgeScene } from "./components/SurfaceParallelJudgeScene";
import { SurfaceParallelPropScene } from "./components/SurfaceParallelPropScene";
import { SurfacePerpJudgeScene } from "./components/SurfacePerpJudgeScene";
import { SurfacePerpPropScene } from "./components/SurfacePerpPropScene";
import { SurfaceGaokaoModelScene } from "./components/SurfaceGaokaoModelScene";

type TeachingMode =
  "parallelJudge" | "parallelProp" | "perpJudge" | "perpProp" | "gaokaoModel";

export default function SurfaceRelationAnimation() {
  const [activeMode, setActiveMode] = useState<TeachingMode>("parallelJudge");
  const [subType, setSubType] = useState<string>("standard");
  const [showAxes, setShowAxes] = useState<boolean>(false);
  const [interactionMode, setInteractionMode] =
    useState<InteractionMode3D>("orbit");
  const [params, setParams] = useState<Record<string, number>>({
    zHeight: 2.2,
    tiltDeg: 0,
    azimuthDeg: 30,
    planeRotDeg: 45,
    lineThetaDeg: 90,
    pyramidA: 3.6,
    pyramidB: 2.8,
    pyramidH: 3.2,
    posO: 0.5,
    step: 1,
  });

  const { preset, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  const zHeight = params.zHeight ?? 2.2;
  const tiltDeg = params.tiltDeg ?? 0;
  const azimuthDeg = params.azimuthDeg ?? 30;
  const planeRotDeg = params.planeRotDeg ?? 45;
  const lineThetaDeg = params.lineThetaDeg ?? 90;
  const pyramidA = params.pyramidA ?? 3.6;
  const pyramidB = params.pyramidB ?? 2.8;
  const pyramidH = params.pyramidH ?? 3.2;
  const posO = params.posO ?? 0.5;
  const step = params.step ?? 1;

  // 组装右屏看板数据
  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-solid-surface-relation", params, {
        mode: activeMode,
        subType,
      }),
    [params, activeMode, subType],
  );

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleModeChange = (mode: TeachingMode) => {
    setActiveMode(mode);
    setSubType("standard");
    if (mode === "parallelJudge") {
      setParams((p) => ({ ...p, zHeight: 2.2, tiltDeg: 0 }));
    } else if (mode === "parallelProp") {
      setParams((p) => ({ ...p, zHeight: 2.2, azimuthDeg: 30, step: 1 }));
    } else if (mode === "perpJudge") {
      setParams((p) => ({ ...p, planeRotDeg: 45 }));
    } else if (mode === "perpProp") {
      setParams((p) => ({ ...p, lineThetaDeg: 90 }));
    }
  };

  const handleReset = () => {
    switch (activeMode) {
      case "parallelJudge":
        setParams((p) => ({ ...p, zHeight: 2.2, tiltDeg: 0 }));
        break;
      case "parallelProp":
        setParams((p) => ({ ...p, zHeight: 2.2, azimuthDeg: 30, step: 1 }));
        break;
      case "perpJudge":
        setParams((p) => ({ ...p, planeRotDeg: 45 }));
        break;
      case "perpProp":
        setParams((p) => ({ ...p, lineThetaDeg: 90 }));
        break;
      case "gaokaoModel":
        setParams((p) => ({
          ...p,
          pyramidA: 3.6,
          pyramidB: 2.8,
          pyramidH: 3.2,
          posO: 0.5,
        }));
        break;
    }
  };

  // 按模式精准过滤参数
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysMap: Record<TeachingMode, string[]> = {
      parallelJudge:
        subType === "counterExample" ? ["zHeight", "tiltDeg"] : ["zHeight"],
      parallelProp: ["zHeight", "azimuthDeg", "step"],
      perpJudge: ["planeRotDeg"],
      perpProp: subType === "dualPerp" ? [] : ["lineThetaDeg"],
      gaokaoModel:
        subType === "cube" ? [] : ["pyramidH", "posO", "pyramidA", "pyramidB"],
    };

    return keysMap[activeMode]
      .map((k) => surfaceRelationMeta.find((m) => m.key === k))
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
  }, [params, activeMode, subType]);

  // 精准图例
  const legendItems = useMemo<LegendItem[]>(() => {
    let items: LegendItem[] = [];
    switch (activeMode) {
      case "parallelJudge":
        items = [
          { colorKey: "secondary", swatch: "area", label: "基准平面 β" },
          { colorKey: "paramTertiary", swatch: "area", label: "待判平面 α" },
          { colorKey: "paramPrimary", swatch: "line", label: "面内直线 a" },
          { colorKey: "paramSecondary", swatch: "line", label: "面内直线 b" },
        ];
        break;
      case "parallelProp":
        items = [
          { colorKey: "secondary", swatch: "area", label: "下基准面 β" },
          {
            colorKey: "paramTertiary",
            swatch: "area",
            label: "上平行面 α ∥ β",
          },
          { colorKey: "primary", swatch: "area", label: "第三截面 γ" },
          { colorKey: "paramPrimary", swatch: "line", label: "截线 a ∥ b" },
        ];
        break;
      case "perpJudge":
        items = [
          { colorKey: "secondary", swatch: "area", label: "基准平面 α" },
          { colorKey: "paramPrimary", swatch: "line", label: "底面垂线 l ⊥ α" },
          {
            colorKey: "paramTertiary",
            swatch: "area",
            label: "过垂线之面 β ⊥ α",
          },
          { colorKey: "highlight", swatch: "line", label: "二面角直角 90°" },
        ];
        break;
      case "perpProp":
        items = [
          { colorKey: "secondary", swatch: "area", label: "基准平面 α" },
          {
            colorKey: "paramTertiary",
            swatch: "area",
            label: "垂直平面 β ⊥ α",
          },
          { colorKey: "secondary", swatch: "line", label: "两面交线 l" },
          { colorKey: "paramPrimary", swatch: "line", label: "面内直线 a" },
        ];
        break;
      case "gaokaoModel":
        items = [
          { colorKey: "secondary", swatch: "area", label: "矩形底面 ABCD" },
          { colorKey: "paramTertiary", swatch: "area", label: "垂直侧面 PAD" },
          { colorKey: "paramPrimary", swatch: "line", label: "高线 PO ⊥ 底面" },
          { colorKey: "highlight", swatch: "line", label: "空间建系轴" },
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
  }, [activeMode, showAxes]);

  // 左屏教学提示与题设导引（说明初始条件与探究设问）
  const tipConfig = useMemo(() => {
    if (activeMode === "parallelJudge") {
      return subType === "counterExample"
        ? {
            variant: "danger" as const,
            badge: "易错反例 · 面面平行判定中的平行线失效",
            condition:
              "待判平面 α 内存在两条互相平行的直线 a ∥ b，且 a ∥ β, b ∥ β。",
            question:
              "平面 α 可绕平行线转动而与平面 β 相交！判定定理必须满足两条直线“相交”：a ∩ b = P, a ∥ β, b ∥ β ⇒ α ∥ β。",
          }
        : {
            variant: "primary" as const,
            badge: "必修二 · 面面平行判定定理",
            condition:
              "平面 α 内的两条相交直线 a, b 分别平行于平面 β (a ∥ β, b ∥ β, a ∩ b = P)。",
            question:
              "求证 α ∥ β。掌握高考标准证明链：线线平行 ⇒ 线面平行 ⇒ 面面平行。",
          };
    }
    if (activeMode === "parallelProp") {
      return {
        variant: "success" as const,
        badge: "必修二 · 面面平行性质定理",
        condition:
          "已知两平面平行 α ∥ β，第三个平面 γ 与它们同时相交于交线 a, b (γ ∩ α = a, γ ∩ β = b)。",
        question:
          "求证 a ∥ b。利用性质定理将面面平行转化为截线平行，常用于几何体截面构造与线面角转化。",
      };
    }
    if (activeMode === "perpJudge") {
      return {
        variant: "warning" as const,
        badge: "必修二 · 面面垂直判定定理",
        condition:
          "直线 l 垂直于平面 α (l ⊥ α)，且直线 l 包含在平面 β 内 (l ⊂ β)。",
        question:
          "求证 β ⊥ α。直观观察二面角平面角为 90°，理解“面过垂线则两面垂直”的核心思想。",
      };
    }
    if (activeMode === "perpProp") {
      return subType === "dualPerp"
        ? {
            variant: "primary" as const,
            badge: "高考定理 · 双垂直平面交线定理",
            condition:
              "两相交平面 α, β 均垂直于第三个平面 γ (α ⊥ γ, β ⊥ γ, α ∩ β = l)。",
            question:
              "求证交线 l ⊥ γ。在直角三棱柱或四棱锥建系中用于快速寻找 z 轴竖直基准。",
          }
        : {
            variant: "success" as const,
            badge: "必修二 · 面面垂直性质定理",
            condition:
              "两平面垂直 α ⊥ β，交线为 l，在平面 β 内作直线 a 垂直于交线 l (a ⊂ β, a ⊥ l)。",
            question:
              "求证 a ⊥ α。高考立体几何第一问“作高建系”的核心依据：面面垂直时在面内作交线的垂线必为底面高。",
          };
    }
    // gaokaoModel
    return subType === "cube"
      ? {
          variant: "info" as const,
          badge: "高考经典 · 正方体平行对角截面模型",
          condition:
            "正方体 ABCD-A₁B₁C₁D₁ 中，截面 AB₁D₁ 与截面 C₁BD 均垂直于体对角线 AC₁。",
          question:
            "求证截面 AB₁D₁ ∥ 截面 C₁BD，且两平行截面将体对角线 AC₁ 准确三等分。",
        }
      : {
          variant: "primary" as const,
          badge: "高考母题 · 四棱锥侧面垂直作高建系",
          condition:
            "四棱锥 P-ABCD 中侧面 PAD ⊥ 底面 ABCD，交线为 AD，在侧面 PAD 内作 PO ⊥ AD。",
          question:
            "由面面垂直性质定理得 PO ⊥ 底面 ABCD，以点 O 为坐标原点建立空间直角坐标系求解二面角。",
        };
  }, [activeMode, subType]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 探究模式选择 */}
          <LeftPanelSection title="探究模式">
            <SelectGrid
              items={[
                {
                  key: "parallelJudge",
                  formula:
                    "a \\cap b \\;\\Rightarrow\\; \\alpha \\parallel \\beta",
                  label: "面面平行判定",
                },
                {
                  key: "parallelProp",
                  formula:
                    "\\gamma \\cap \\alpha, \\beta \\;\\Rightarrow\\; a \\parallel b",
                  label: "面面平行性质",
                },
                {
                  key: "perpJudge",
                  formula:
                    "l \\perp \\alpha \\;\\Rightarrow\\; \\beta \\perp \\alpha",
                  label: "面面垂直判定",
                },
                {
                  key: "perpProp",
                  formula: "a \\perp l \\;\\Rightarrow\\; a \\perp \\alpha",
                  label: "面面垂直性质",
                },
                {
                  key: "gaokaoModel",
                  formula: "P\\text{-}ABCD \\; / \\; \\text{Cube}",
                  label: "高考综合母题",
                  fullWidth: true,
                },
              ]}
              value={activeMode}
              onChange={(m) => handleModeChange(m as TeachingMode)}
              columns={2}
            />
          </LeftPanelSection>

          {/* 2. 定理与模型分支 */}
          {activeMode === "parallelJudge" && (
            <LeftPanelSection title="定理与分支">
              <SelectGrid
                items={[
                  { key: "standard", label: "相交直线判定" },
                  { key: "counterExample", label: "平行直线反例" },
                ]}
                value={subType}
                onChange={(val) => setSubType(val)}
                columns={2}
              />
            </LeftPanelSection>
          )}

          {activeMode === "perpProp" && (
            <LeftPanelSection title="定理与分支">
              <SelectGrid
                items={[
                  { key: "standard", label: "交线垂线定理" },
                  { key: "dualPerp", label: "双垂直交线定理" },
                ]}
                value={subType}
                onChange={(val) => setSubType(val)}
                columns={2}
              />
            </LeftPanelSection>
          )}

          {activeMode === "gaokaoModel" && (
            <LeftPanelSection title="几何体模型">
              <SelectGrid
                items={[
                  { key: "pyramid", label: "垂直侧面四棱锥" },
                  { key: "cube", label: "正方体平行截面" },
                ]}
                value={subType === "cube" ? "cube" : "pyramid"}
                onChange={(val) => setSubType(val)}
                columns={2}
              />
            </LeftPanelSection>
          )}

          {/* 3. 参数调节 */}
          <LeftPanelSection title="参数调节">
            {paramConfigs.length > 0 ? (
              <ParamControl
                params={paramConfigs}
                onParamChange={handleParamChange}
                onReset={handleReset}
              />
            ) : (
              <div className="rounded-xl bg-neutral-50/80 border border-neutral-200/80 p-3 text-xs text-neutral-600 flex items-center justify-between shadow-xs">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
                  题设基准数据已锁定
                </span>
                <button
                  type="button"
                  onClick={() => setSubType("pyramid")}
                  className="text-blue-600 font-medium hover:underline text-[11px] cursor-pointer"
                >
                  切为可调模型
                </button>
              </div>
            )}
          </LeftPanelSection>

          {/* 4. 图层与标注显示控制 */}
          <LeftPanelSection title="图层与标注显示控制" compact>
            <div className="space-y-2">
              <Toggle
                label="显示空间直角坐标系"
                checked={showAxes}
                onChange={setShowAxes}
              />
            </div>
          </LeftPanelSection>

          {/* 5. 3D 空间视角预设 */}
          <LeftPanelSection title="3D 空间视角预设">
            <div className="space-y-2">
              {activeMode === "gaokaoModel" && subType !== "cube" && (
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
                  { key: "iso", label: "轴测直观" },
                  { key: "front", label: "主视正投" },
                  { key: "top", label: "俯视底面" },
                  { key: "side", label: "左视侧面" },
                ]}
                value={preset}
                onChange={(p) => setCameraPreset(p as CameraPreset)}
              />
            </div>
          </LeftPanelSection>

          {/* 5. 教学提示与题设导引（置于左屏底部） */}
          <LeftPanelSection title="教学导引与题设背景" compact>
            <TipCard variant={tipConfig.variant}>
              <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1">
                <span>{tipConfig.badge}</span>
              </div>
              <div className="space-y-1 text-[11px] leading-relaxed">
                <div>
                  <span className="font-semibold text-neutral-800">
                    【初始条件】
                  </span>
                  <span className="text-neutral-600">
                    {tipConfig.condition}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-800">
                    【探究设问】
                  </span>
                  <span className="text-neutral-600">{tipConfig.question}</span>
                </div>
              </div>
            </TipCard>
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <ThreeDCanvas
          cameraPosition={cameraPosition}
          legend={<Legend3D title="图例" items={legendItems} />}
          overlay={
            activeMode === "gaokaoModel" && subType !== "cube" ? (
              <ModeSwitchOverlay3D
                mode={interactionMode}
                onModeChange={setInteractionMode}
                pointCount={1}
              />
            ) : undefined
          }
        >
          <CameraRig
            ref={controlsRef}
            enabled={
              interactionMode === "orbit" ||
              activeMode !== "gaokaoModel" ||
              subType === "cube"
            }
          />

          {/* 模式 1：面面平行判定 */}
          {activeMode === "parallelJudge" && (
            <SurfaceParallelJudgeScene
              isIntersect={subType !== "counterExample"}
              tiltDeg={tiltDeg}
              zHeight={zHeight}
            />
          )}

          {/* 模式 2：面面平行性质 */}
          {activeMode === "parallelProp" && (
            <SurfaceParallelPropScene
              zHeight={zHeight}
              tiltDeg={tiltDeg}
              azimuthDeg={azimuthDeg}
              step={step}
            />
          )}

          {/* 模式 3：面面垂直判定 */}
          {activeMode === "perpJudge" && (
            <SurfacePerpJudgeScene planeRotDeg={planeRotDeg} />
          )}

          {/* 模式 4：面面垂直性质 */}
          {activeMode === "perpProp" && (
            <SurfacePerpPropScene
              lineThetaDeg={lineThetaDeg}
              subType={subType as "standard" | "counterExample" | "dualPerp"}
            />
          )}

          {/* 模式 5：高考综合母题 */}
          {activeMode === "gaokaoModel" && (
            <SurfaceGaokaoModelScene
              modelType={subType === "cube" ? "cube" : "pyramid"}
              pyramidA={pyramidA}
              pyramidB={pyramidB}
              pyramidH={pyramidH}
              posO={posO}
              draggable={interactionMode === "drag" && subType !== "cube"}
              onDragO={(v) => handleParamChange("posO", v)}
            />
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
          title="面面关系指标看板"
        />
      }
    />
  );
}
