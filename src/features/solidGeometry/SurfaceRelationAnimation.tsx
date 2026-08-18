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
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { Scene3DGrid, Legend3D, CameraRig } from "@/components/Math3D";
import type { LegendItem } from "@/components/Math3D";
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
          {/* 1. 核心模式选择 */}
          <LeftPanelSection title="面面位置关系体系">
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

          {/* 2. 当前模式探究与反例辨析 */}
          {activeMode === "parallelJudge" && (
            <LeftPanelSection title="定理探究与反例辨析">
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
            <LeftPanelSection title="性质探究与高考易错点">
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
            <LeftPanelSection title="高考经典几何体模型">
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

          {/* 4. 3D 观察设置 */}
          <LeftPanelSection title="3D 视角切换">
            <div className="space-y-2.5">
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
        >
          <CameraRig ref={controlsRef} />
          <Scene3DGrid size={5} showLabels={showAxes} />

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
