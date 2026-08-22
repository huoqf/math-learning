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
                  { key: "standard", label: "两条相交直线 (判定成立)" },
                  { key: "counterExample", label: "两条平行直线 (反例相交)" },
                ]}
                value={subType}
                onChange={(val) => setSubType(val)}
                columns={1}
              />
            </LeftPanelSection>
          )}

          {activeMode === "perpProp" && (
            <LeftPanelSection title="定理与分支">
              <SelectGrid
                items={[
                  { key: "standard", label: "交线垂线 (推出 a ⊥ α)" },
                  { key: "dualPerp", label: "双垂直面交线定理" },
                ]}
                value={subType}
                onChange={(val) => setSubType(val)}
                columns={1}
              />
            </LeftPanelSection>
          )}

          {activeMode === "gaokaoModel" && (
            <LeftPanelSection title="几何体模型">
              <SelectGrid
                items={[
                  { key: "pyramid", label: "四棱锥侧面垂直与作高" },
                  { key: "cube", label: "正方体平行对角截面" },
                ]}
                value={subType === "cube" ? "cube" : "pyramid"}
                onChange={(val) => setSubType(val)}
                columns={1}
              />
            </LeftPanelSection>
          )}

          {/* 3. 参数调节 */}
          {paramConfigs.length > 0 && (
            <LeftPanelSection title="参数调节">
              <ParamControl
                params={paramConfigs}
                onParamChange={handleParamChange}
                onReset={handleReset}
              />
            </LeftPanelSection>
          )}

          {/* 4. 教学提示 */}
          <LeftPanelSection title="教学提示" compact>
            {activeMode === "parallelJudge" && subType === "counterExample" && (
              <TipCard variant="danger">
                <span className="font-bold">易错反例</span>
                ：仅平行于两条平行线时，待判平面可绕平行线转动而与基准面相交。定理必须满足
                <span className="font-bold">两条相交直线</span>。
              </TipCard>
            )}
            {activeMode === "parallelJudge" && subType !== "counterExample" && (
              <TipCard variant="info">
                <span className="font-bold">面面平行证明链</span>：线线平行{" "}
                <KatexFormula formula="\Rightarrow" mode="inline" /> 线面平行{" "}
                <KatexFormula formula="\Rightarrow" mode="inline" />{" "}
                两条相交线平行于另一平面{" "}
                <KatexFormula formula="\Rightarrow" mode="inline" /> 面面平行。
              </TipCard>
            )}
            {activeMode === "parallelProp" && (
              <TipCard variant="success">
                <span className="font-bold">面面平行性质</span>
                ：两平行平面同时被第三平面所截，交线必平行（
                <KatexFormula
                  formula="\alpha \parallel \beta, \gamma \cap \alpha = a, \gamma \cap \beta = b \Rightarrow a \parallel b"
                  mode="inline"
                />
                ）。
              </TipCard>
            )}
            {activeMode === "perpJudge" && (
              <TipCard variant="warning">
                <span className="font-bold">面面垂直判定</span>
                ：面过垂线则面面垂直（
                <KatexFormula
                  formula="l \perp \alpha, l \subset \beta \Rightarrow \beta \perp \alpha"
                  mode="inline"
                />
                ）。二面角为 <KatexFormula formula="90^\circ" mode="inline" />。
              </TipCard>
            )}
            {activeMode === "perpProp" && subType === "dualPerp" && (
              <TipCard variant="primary">
                <span className="font-bold">双垂直面交线定理</span>
                ：若两相交平面均垂直于第三平面，则其交线垂直于第三平面（
                <KatexFormula
                  formula="\alpha \perp \gamma, \beta \perp \gamma, \alpha \cap \beta = l \Rightarrow l \perp \gamma"
                  mode="inline"
                />
                ）。
              </TipCard>
            )}
            {activeMode === "perpProp" && subType !== "dualPerp" && (
              <TipCard variant="success">
                <span className="font-bold">面面垂直性质</span>
                ：面面垂直时，在其中一个面内垂直于交线的直线必垂直于另一个平面（
                <KatexFormula
                  formula="\alpha \perp \beta, \alpha \cap \beta = l, a \subset \beta, a \perp l \Rightarrow a \perp \alpha"
                  mode="inline"
                />
                ）。
              </TipCard>
            )}
            {activeMode === "gaokaoModel" && subType === "cube" && (
              <TipCard variant="info">
                <span className="font-bold">正方体平行截面</span>：截面{" "}
                <KatexFormula formula="AB_1D_1 \parallel" mode="inline" /> 截面{" "}
                <KatexFormula formula="C_1BD" mode="inline" />
                ，把体对角线 <KatexFormula formula="AC_1" mode="inline" />{" "}
                三等分。
              </TipCard>
            )}
            {activeMode === "gaokaoModel" && subType !== "cube" && (
              <TipCard variant="warning">
                <span className="font-bold">四棱锥作高模型</span>：侧面{" "}
                <KatexFormula formula="PAD \perp" mode="inline" /> 底面{" "}
                <KatexFormula formula="ABCD" mode="inline" /> 时，在侧面内作{" "}
                <KatexFormula formula="PO \perp AD" mode="inline" />
                ，由性质定理可得{" "}
                <KatexFormula formula="PO \perp" mode="inline" /> 底面。
              </TipCard>
            )}
          </LeftPanelSection>

          {/* 5. 视图与视角 */}
          <LeftPanelSection title="视图与视角">
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
