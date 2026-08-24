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
import {
  Scene3DGrid,
  Segment3D,
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
  const handleModeChange = (mode: TeachingMode) => {
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

  // 各模式下的 2×2 典型预设配置项
  const presetItems = useMemo<SelectGridItem[]>(() => {
    switch (activeMode) {
      case "parallel":
        return [
          { key: "free", label: "自由探究", description: "全参开放" },
          {
            key: "judgeStandard",
            label: "判定成立",
            description: "面外h=2平行",
          },
          {
            key: "counterInPlane",
            label: "面内反例",
            description: "h=0落入面内",
          },
          { key: "propInter", label: "性质交线", description: "辅助面截交线" },
        ];
      case "perpendicular":
        return [
          { key: "free", label: "自由探究", description: "全参开放" },
          {
            key: "judgeIntersect",
            label: "相交判定",
            description: "垂直相交两线",
          },
          {
            key: "counterParallel",
            label: "平行反例",
            description: "垂直平行两线",
          },
          { key: "propAll", label: "性质垂线", description: "垂直面内任意" },
        ];
      case "gaokaoPyramid":
        return [
          { key: "free", label: "自由探究", description: "动点自由拖拽" },
          { key: "midParallel", label: "中点平行", description: "λE=λF=0.5" },
          {
            key: "thirdParallel",
            label: "三分点平行",
            description: "λE=λF=0.33",
          },
          {
            key: "intersectCross",
            label: "相交反例",
            description: "λE≠λF相交",
          },
        ];
      case "vector":
        return [
          { key: "free", label: "自由探究", description: "全参可调" },
          { key: "vecParallel", label: "向量平行", description: "l·n=0" },
          { key: "vecPerp", label: "向量垂直", description: "l∥n成比例" },
          { key: "vecAngle45", label: "45°线面角", description: "sinθ=√2/2" },
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
  }, [activeMode, subTheorem]);

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
                  formula: "l \\parallel \\alpha",
                  label: "线面平行",
                  description: "平行判定/性质",
                },
                {
                  key: "perpendicular",
                  formula: "l \\perp \\alpha",
                  label: "线面垂直",
                  description: "垂直判定/性质",
                },
                {
                  key: "gaokaoPyramid",
                  formula: "P\\text{-}ABCD",
                  label: "高考母题",
                  description: "四棱锥动点模型",
                },
                {
                  key: "vector",
                  formula: "\\vec{l} \\cdot \\vec{n}",
                  label: "空间向量",
                  description: "法向量求线面角",
                },
              ]}
              value={activeMode}
              onChange={(m) => handleModeChange(m as TeachingMode)}
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
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* Step 4: 图层与标注显示控制 (Toggle 单列流式) */}
          <LeftPanelSection title="图层与标注显示控制" compact>
            <div className="space-y-2.5">
              <Toggle
                label="显示空间直角坐标系 (Scene3DGrid)"
                checked={showAxes}
                onChange={setShowAxes}
              />
              {activeMode === "parallel" && subTheorem === "prop" && (
                <Toggle
                  label="显示辅助相交平面 β"
                  checked={showAuxPlane}
                  onChange={setShowAuxPlane}
                />
              )}
              {(activeMode === "vector" || activeMode === "perpendicular") && (
                <Toggle
                  label="显示线面角 / 垂直标记"
                  checked={showAngleArc}
                  onChange={setShowAngleArc}
                />
              )}
            </div>
          </LeftPanelSection>

          {/* Step 5: 3D 空间视角预设 */}
          <LeftPanelSection title="3D 空间视角预设">
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

          {/* Step 6: 教学提示与题设导引（置于左屏底部） */}
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
          {/* 真实响应 showAxes 状态！ */}
          {showAxes && <Scene3DGrid size={5} showGrid={false} />}

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

              {/* 空间直线 l (空间几何直线无箭头) */}
              <Segment3D
                from={startPoint}
                to={endPoint}
                colorKey="paramPrimary"
                lineWidth={3}
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
                  <Segment3D
                    from={lineMStart}
                    to={lineMEnd}
                    colorKey="paramSecondary"
                    lineWidth={2.5}
                  />
                  <FormulaLabel3D
                    position={{
                      x: lineMEnd.x + 0.15,
                      y: lineMEnd.y + 0.15,
                      z: 0.05,
                    }}
                    tex="m"
                  />
                  {subTheorem === "prop" && step > 0.05 && showAuxPlane && (
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
                          z: Math.max(0.5, effectiveZ * step) + 0.1,
                        }}
                        tex="\beta"
                      />
                      {/* 截线 m */}
                      <Segment3D
                        from={{ x: -2.6, y: 0, z: effectiveZ * step }}
                        to={{ x: 2.6, y: 0, z: effectiveZ * step }}
                        colorKey="paramSecondary"
                        lineWidth={2.5}
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
                      <Segment3D
                        from={lineMStart}
                        to={lineMEnd}
                        colorKey="paramSecondary"
                        lineWidth={2.5}
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
                      <Segment3D
                        from={lineBStart}
                        to={lineBEnd}
                        colorKey="paramSecondary"
                        lineWidth={2.5}
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

                          {showAngleArc && (
                            <>
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
                      <Segment3D
                        from={{ x: -testMEnd.x, y: -testMEnd.y, z: 0 }}
                        to={testMEnd}
                        colorKey="paramSecondary"
                        lineWidth={2.5}
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
                      {showAngleArc && (
                        <AngleArc3D
                          vertex={{ x: 0, y: 0, z: 0 }}
                          dirA={{ x: 0, y: 0, z: 2.5 }}
                          dirB={{ x: testMEnd.x, y: testMEnd.y, z: 0 }}
                          radius={0.55}
                          colorKey="highlight"
                        />
                      )}
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
                    tex="\\vec{n}"
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
