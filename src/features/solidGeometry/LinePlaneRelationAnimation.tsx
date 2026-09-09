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
import type { ParamConfig, SelectGridItem } from "@/components/UI";
import { Legend3D, CameraRig, ModeSwitchOverlay3D } from "@/components/Math3D";
import type { LegendItem, InteractionMode3D } from "@/components/Math3D";
import { use3DViewport } from "@/hooks/use3DViewport";
import type { CameraPreset } from "@/hooks/use3DViewport";
import { buildMathQuantities } from "@/data/mathQuantities";
import { linePlaneRelationMeta } from "@/data/registries/solidGeometry";
import { LinePlaneRelationScene } from "./LinePlaneRelationScene";
import type { LinePlaneTeachingMode } from "./LinePlaneRelationScene";

export default function LinePlaneRelationAnimation() {
  const [activeMode, setActiveMode] =
    useState<LinePlaneTeachingMode>("parallel");
  const [activePreset, setActivePreset] = useState<string>("free");
  const [subTheorem, setSubTheorem] = useState<"judge" | "prop">("judge");
  const [showAxes, setShowAxes] = useState<boolean>(false);
  const [showAuxPlane, setShowAuxPlane] = useState<boolean>(true);
  const [showAngleArc, setShowAngleArc] = useState<boolean>(true);
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
    setActivePreset("free");
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  // 模式切换统一调度
  const handleModeChange = (mode: LinePlaneTeachingMode) => {
    setActiveMode(mode);
    setActivePreset("free");
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
    } else if (mode === "vector") {
      setParams((p) => ({
        ...p,
        thetaDeg: 30,
        phiDeg: 30,
        zHeight: 1.5,
      }));
    } else if (mode === "gaokaoPyramid") {
      setParams((p) => ({
        ...p,
        lambdaE: 0.5,
        lambdaF: 0.5,
        pyramidA: 3.6,
        pyramidB: 2.8,
        pyramidH: 3.5,
      }));
    }
  };

  // 典型预设切换（黄金 2×2 规范）
  const handlePresetSelect = (key: string) => {
    setActivePreset(key);
    if (key === "free") return;

    if (activeMode === "parallel") {
      if (key === "judgeStandard") {
        setSubTheorem("judge");
        setParams((p) => ({
          ...p,
          zHeight: 2,
          inPlaneType: 1,
          thetaDeg: 0,
          phiDeg: 0,
          step: 1,
        }));
      } else if (key === "counterInPlane") {
        setSubTheorem("judge");
        setParams((p) => ({
          ...p,
          zHeight: 0,
          inPlaneType: 0,
          thetaDeg: 0,
          phiDeg: 0,
          step: 1,
        }));
      } else if (key === "propInter") {
        setSubTheorem("prop");
        setParams((p) => ({
          ...p,
          zHeight: 2,
          inPlaneType: 1,
          thetaDeg: 0,
          phiDeg: 0,
          step: 2,
        }));
      }
    } else if (activeMode === "perpendicular") {
      if (key === "judgeIntersect") {
        setSubTheorem("judge");
        setParams((p) => ({
          ...p,
          thetaDeg: 90,
          phiDeg: 45,
          zHeight: 0,
          intersectType: 1,
        }));
      } else if (key === "counterParallel") {
        setSubTheorem("judge");
        setParams((p) => ({
          ...p,
          thetaDeg: 90,
          phiDeg: 0,
          zHeight: 0,
          intersectType: 0,
        }));
      } else if (key === "propAll") {
        setSubTheorem("prop");
        setParams((p) => ({
          ...p,
          thetaDeg: 90,
          phiDeg: 45,
          zHeight: 0,
          intersectType: 1,
        }));
      }
    } else if (activeMode === "gaokaoPyramid") {
      if (key === "midParallel") {
        setParams((p) => ({ ...p, lambdaE: 0.5, lambdaF: 0.5 }));
      } else if (key === "thirdParallel") {
        setParams((p) => ({ ...p, lambdaE: 0.33, lambdaF: 0.33 }));
      } else if (key === "intersectCross") {
        setParams((p) => ({ ...p, lambdaE: 0.3, lambdaF: 0.7 }));
      }
    } else if (activeMode === "vector") {
      if (key === "vecParallel") {
        setParams((p) => ({ ...p, thetaDeg: 0, phiDeg: 0, zHeight: 1.5 }));
      } else if (key === "vecPerp") {
        setParams((p) => ({ ...p, thetaDeg: 90, phiDeg: 0, zHeight: 0 }));
      } else if (key === "vecAngle45") {
        setParams((p) => ({ ...p, thetaDeg: 45, phiDeg: 0, zHeight: 1.5 }));
      }
    }
  };

  // 各模式下的 2×2 典型预设配置项（纯净单行加粗学术标题，纯粹自解释，等高对称，杜绝折行与冗余描述）
  const presetItems = useMemo<SelectGridItem[]>(() => {
    switch (activeMode) {
      case "parallel":
        return [
          { key: "free", label: "自由探索" },
          { key: "judgeStandard", label: "标准线面平行" },
          { key: "counterInPlane", label: "面内落入反例" },
          { key: "propInter", label: "性质定理交线" },
        ];
      case "perpendicular":
        return [
          { key: "free", label: "自由探索" },
          { key: "judgeIntersect", label: "垂线相交判定" },
          { key: "counterParallel", label: "平行两线反例" },
          { key: "propAll", label: "性质定理垂线" },
        ];
      case "gaokaoPyramid":
        return [
          { key: "free", label: "自由探索" },
          { key: "midParallel", label: "中位线平行" },
          { key: "thirdParallel", label: "等比分点平行" },
          { key: "intersectCross", label: "不等比相交" },
        ];
      case "vector":
        return [
          { key: "free", label: "自由探索" },
          { key: "vecParallel", label: "向量平行构型" },
          { key: "vecPerp", label: "向量垂直构型" },
          { key: "vecAngle45", label: "45° 特殊线面角" },
        ];
    }
  }, [activeMode]);

  // 智能重置
  const handleReset = () => {
    setActivePreset("free");
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

  // 按模式精准过滤参数（参数降维铁律：特定预设锁定参数）
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    if (activePreset !== "free") {
      return [];
    }

    const keysMap: Record<LinePlaneTeachingMode, string[]> = {
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
        importance: meta.importance,
        marks: meta.marks,
      }));
  }, [params, activeMode, subTheorem, activePreset]);

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
                  label: "截线交线 m",
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
                  label: "垂线 l",
                },
                { colorKey: "secondary", swatch: "area", label: "基准平面 α" },
                {
                  colorKey: "paramSecondary",
                  swatch: "line",
                  label: "面内直线 a",
                },
                {
                  colorKey: "paramTertiary",
                  swatch: "line",
                  label: intersectType === 1 ? "相交线 b" : "平行线 b (反例)",
                },
              ]
            : [
                {
                  colorKey: "paramPrimary",
                  swatch: "line",
                  label: "垂线 l",
                },
                { colorKey: "secondary", swatch: "area", label: "基准平面 α" },
                {
                  colorKey: "highlight",
                  swatch: "line",
                  label: "面内任意直线 m",
                },
              ];
        break;
      case "gaokaoPyramid":
        items = [
          { colorKey: "primary", swatch: "point", label: "四棱锥顶点 P" },
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
        label: "空间坐标系 (x/y/z)",
      });
    }
    return items;
  }, [activeMode, subTheorem, showAxes, intersectType]);

  // 左屏教学提示与题设导引（说明初始条件与探究设问）
  const tipConfig = useMemo(() => {
    switch (activeMode) {
      case "parallel":
        return subTheorem === "judge"
          ? {
              variant: "primary" as const,
              badge: "必修二 · 线面平行判定定理",
              condition:
                "平面 α 外一条直线 l，平面 α 内一条直线 m，且满足 l ∥ m。",
              question:
                "求证 l ∥ α。探究证明链“线线平行 ⇒ 线面平行”，观察若 l ⊂ α（面内直线）则定理失效的退化反例。",
            }
          : {
              variant: "success" as const,
              badge: "必修二 · 线面平行性质定理",
              condition:
                "已知直线 l ∥ 平面 α，过直线 l 作辅助截面 β 与平面 α 相交于交线 m。",
              question:
                "求证 l ∥ m。探究证明链“线面平行 ⇒ 线线平行”，在立体几何截面与辅助线作图中作为关键依据。",
            };
      case "perpendicular":
        return subTheorem === "judge"
          ? {
              variant: "warning" as const,
              badge: "必修二 · 线面垂直判定定理",
              condition:
                "直线 l 与平面 α 内的两条相交直线 a, b 均垂直 (l ⊥ a, l ⊥ b, a ∩ b = P)。",
              question:
                "求证 l ⊥ α。探究两条直线必须“相交”的关键防错条件（若 a ∥ b 平行则直线 l 可绕其转动，不能保证垂直于平面）。",
            }
          : {
              variant: "danger" as const,
              badge: "必修二 · 线面垂直性质定理",
              condition:
                "已知直线 l ⊥ 平面 α，直线 m ⊂ 平面 α 为面内任意直线。",
              question:
                "求证 l ⊥ m。理解“线面垂直定义为垂直于面内所有直线”，探究空间直角标记与正投影性质。",
            };
      case "gaokaoPyramid":
        return {
          variant: "primary" as const,
          badge: "高考大题母题 · 四棱锥动点线面平行",
          condition:
            "四棱锥 P-ABCD 底面为矩形 ABCD，侧面 PAD ⊥ 底面 ABCD。动点 E ∈ PB (分比 λ_E)，动点 F ∈ PC (分比 λ_F)。",
          question:
            "当 λ_E = λ_F（如同为中点）时，求证 EF ∥ 面 PAD；探究动点在线段上滑动时满足 EF ∥ 面 PAD 的充要几何条件。",
        };
      case "vector":
        return {
          variant: "accent" as const,
          badge: "选修一 · 空间向量法求解线面角",
          condition:
            "直线 l 的方向向量为 l⃗=(x, y, z)，基准平面 α 的法向量为 n⃗=(0, 0, 1)。",
          question:
            "探究直线与法向量夹角 〈l⃗, n⃗〉 与线面角 θ 的互余关系：sinθ = |cos〈l⃗, n⃗〉| = |l⃗·n⃗| / (|l⃗||n⃗|)。",
        };
    }
  }, [activeMode, subTheorem, activePreset]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* Step 1: 探究模式选择 */}
          <LeftPanelSection title="探究模式">
            <SelectGrid
              items={[
                {
                  key: "parallel",
                  label: "线面平行",
                },
                {
                  key: "perpendicular",
                  label: "线面垂直",
                },
                {
                  key: "gaokaoPyramid",
                  label: "高考母题",
                },
                {
                  key: "vector",
                  label: "空间向量",
                },
              ]}
              value={activeMode}
              onChange={(m) => handleModeChange(m as LinePlaneTeachingMode)}
              columns={2}
            />
          </LeftPanelSection>

          {/* Step 2: 典型模型预设 (黄金 2×2 对称网格) */}
          <LeftPanelSection title="典型模型预设">
            <SelectGrid
              items={presetItems}
              value={activePreset}
              onChange={handlePresetSelect}
              columns={2}
            />
          </LeftPanelSection>

          {/* Step 3: 参数调节 */}
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
                  onClick={() => setActivePreset("free")}
                  className="text-blue-600 font-medium hover:underline text-[11px] cursor-pointer"
                >
                  切为自由探索
                </button>
              </div>
            )}
          </LeftPanelSection>

          {/* Step 4: 图层控制 (双列网格并排) */}
          <LeftPanelSection title="图层控制" compact>
            <div className="grid grid-cols-2 gap-2">
              <Toggle
                label="空间坐标系"
                checked={showAxes}
                onChange={setShowAxes}
                size="compact"
              />
              {activeMode === "parallel" && subTheorem === "prop" && (
                <Toggle
                  label="辅助平面 β"
                  checked={showAuxPlane}
                  onChange={setShowAuxPlane}
                  size="compact"
                />
              )}
              {(activeMode === "vector" || activeMode === "perpendicular") && (
                <Toggle
                  label="线面角/垂标"
                  checked={showAngleArc}
                  onChange={setShowAngleArc}
                  size="compact"
                />
              )}
            </div>
          </LeftPanelSection>

          {/* Step 5: 3D 空间视角预设 */}
          <LeftPanelSection title="视角预设">
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
            </div>
          </LeftPanelSection>

          {/* Step 6: 教学提示与题设导引（置于最底部） */}
          <TipCard
            variant={tipConfig.variant}
            badge={tipConfig.badge}
            condition={tipConfig.condition}
            question={tipConfig.question}
          />
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
          <LinePlaneRelationScene
            activeMode={activeMode}
            subTheorem={subTheorem}
            showAxes={showAxes}
            showAuxPlane={showAuxPlane}
            showAngleArc={showAngleArc}
            draggable={interactionMode === "drag"}
            thetaDeg={thetaDeg}
            phiDeg={phiDeg}
            zHeight={zHeight}
            intersectType={intersectType}
            inPlaneType={inPlaneType}
            step={step}
            lambdaE={lambdaE}
            lambdaF={lambdaF}
            pyramidA={pyramidA}
            pyramidB={pyramidB}
            pyramidH={pyramidH}
            onDragE={(val) => handleParamChange("lambdaE", val)}
            onDragF={(val) => handleParamChange("lambdaF", val)}
          />
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
