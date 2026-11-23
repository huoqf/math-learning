import { useState, useMemo, useCallback, useRef } from "react";
import { ThreePanel } from "@/components/Layout/ThreePanel";
import { ThreeDCanvas } from "@/components/Layout/ThreeDCanvas";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  ParamPlayBar,
  MathPanel,
  TabSwitcher,
  SelectGrid,
  Toggle,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { CameraFit, Legend3D, type LegendItem } from "@/components/Math3D";
import { use3DViewport, type CameraPreset } from "@/hooks/use3DViewport";
import { useParamPlay } from "@/hooks/useParamPlay";
import { useScenario } from "@/hooks/useScenario";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  defaultParams,
  SOLID_DYNAMIC_LOCUS_META,
  SOLID_DYNAMIC_LOCUS_SCENARIOS,
  type SolidDynamicLocusParams,
} from "@/data/registries/solidDynamicLocus";
import {
  getSolidDynamicLocusBounds,
  type SolidDynamicLocusMode,
} from "@/math3d/solidDynamicLocus";
import { SolidDynamicLocusScene3D } from "./components/SolidDynamicLocusScene3D";

const MODE_TABS = [
  { key: "perpLineLocus", label: "线面垂直垂面" },
  { key: "constDistCircle", label: "定距球截圆弧" },
  { key: "constAngleConic", label: "定角圆锥截线" },
];

export default function SolidDynamicLocusAnimation() {
  const [mode, setMode] = useState<SolidDynamicLocusMode>("perpLineLocus");
  const [scenarioId, setScenarioId] = useState<string>("standardPerp");
  const [params, setParams] = useState<SolidDynamicLocusParams>(() => ({
    ...defaultParams,
  }));
  const [showRightAngles, setShowRightAngles] = useState(true);
  const { preset, viewToken, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  const tRef = useRef(params.t);
  tRef.current = params.t;

  const modeScenarios = SOLID_DYNAMIC_LOCUS_SCENARIOS[mode];

  const { tipProps, selectScenario } = useScenario<
    string,
    SolidDynamicLocusParams
  >({
    scenarios: modeScenarios,
    activeKey: scenarioId,
    params,
    onParamsChange: (next) =>
      setParams((prev) => ({
        ...prev,
        ...next,
      })),
  });

  const handleModeChange = useCallback((next: string) => {
    const nextMode = next as SolidDynamicLocusMode;
    const firstId = Object.keys(SOLID_DYNAMIC_LOCUS_SCENARIOS[nextMode])[0];
    const spec = SOLID_DYNAMIC_LOCUS_SCENARIOS[nextMode][firstId];
    setMode(nextMode);
    setScenarioId(firstId);
    if (spec?.presetParams) {
      setParams({ ...defaultParams, ...spec.presetParams });
    } else {
      setParams({ ...defaultParams });
    }
  }, []);

  const handleScenarioChange = useCallback(
    (key: string) => {
      setScenarioId(key);
      selectScenario(key);
    },
    [selectScenario],
  );

  const handleParamChange = useCallback((key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const handleReset = useCallback(() => {
    const firstId = Object.keys(SOLID_DYNAMIC_LOCUS_SCENARIOS[mode])[0];
    const spec = SOLID_DYNAMIC_LOCUS_SCENARIOS[mode][firstId];
    setScenarioId(firstId);
    setParams(
      spec?.presetParams
        ? { ...defaultParams, ...spec.presetParams }
        : { ...defaultParams },
    );
  }, [mode]);

  const scenarioItems = useMemo(
    () =>
      Object.values(modeScenarios).map((s) => ({
        key: s.id,
        label: s.name,
      })),
    [modeScenarios],
  );

  const activeParamConfigs: ParamConfig[] = useMemo(() => {
    const keys: (keyof SolidDynamicLocusParams)[] = ["a", "t"];
    if (mode === "constDistCircle") keys.push("rFactor");
    if (mode === "constAngleConic") keys.push("tiltDeg");

    return keys.map((k) => {
      const m = SOLID_DYNAMIC_LOCUS_META[k];
      return {
        key: m.key,
        label: m.label,
        labelFormula: m.labelFormula,
        value: params[k],
        min: m.min,
        max: m.max,
        step: m.step,
        group: m.group,
        description: m.description,
      };
    });
  }, [mode, params]);

  const { isPlaying, speed, setSpeed, toggle } = useParamPlay({
    min: 0,
    max: 1,
    step: 0.02,
    mode: "loop",
    getValue: () => tRef.current,
    onChange: (nextVal) =>
      setParams((prev) => ({
        ...prev,
        t: nextVal,
      })),
  });

  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-solid-dynamic-locus", params, {
        mode,
      }),
    [params, mode],
  );

  const sceneBounds = useMemo(
    () => getSolidDynamicLocusBounds(params.a, mode),
    [params.a, mode],
  );

  const legendItems = useMemo<LegendItem[]>(() => {
    if (mode === "perpLineLocus") {
      return [
        {
          colorKey: "paramSecondary",
          swatch: "line",
          tex: "\\text{定体对角线 } BD_1 \\text{ 与垂足 } H",
        },
        {
          colorKey: "paramTertiary",
          swatch: "area",
          tex: "\\text{垂面截面 } \\triangle AB_1C",
        },
        {
          colorKey: "paramPrimary",
          swatch: "point",
          tex: "\\text{动点 } P \\text{ 及连线 } AP",
        },
      ];
    }
    if (mode === "constDistCircle") {
      return [
        {
          colorKey: "paramSecondary",
          swatch: "line",
          tex: "\\text{高线 } A_1A \\text{ 与垂直标记}",
        },
        {
          colorKey: "paramTertiary",
          swatch: "line",
          label: "底面轨迹圆弧",
        },
        {
          colorKey: "paramPrimary",
          swatch: "point",
          tex: "\\text{定长斜线 } A_1P \\text{ 与动点 } P",
        },
      ];
    }
    return [
      {
        colorKey: "paramPrimary",
        swatch: "line",
        tex: "\\text{圆锥轴线 } A_1A \\text{ 与母线 } A_1P",
      },
      {
        colorKey: "paramSecondary",
        swatch: "area",
        tex: "\\text{斜截平面（倾角 } \\beta\\text{）}",
      },
      {
        colorKey: "paramTertiary",
        swatch: "line",
        label: "圆锥曲线截交轨迹",
      },
    ];
  }, [mode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="轨迹模型切换">
            <TabSwitcher
              tabs={MODE_TABS}
              value={mode}
              onChange={handleModeChange}
            />
          </LeftPanelSection>

          <LeftPanelSection title="典型题型情景">
            <SelectGrid
              items={scenarioItems}
              value={scenarioId}
              onChange={handleScenarioChange}
              columns={2}
            />
          </LeftPanelSection>

          <LeftPanelSection title="几何与轨迹参数调节">
            <div className="space-y-3">
              <ParamControl
                params={activeParamConfigs}
                onParamChange={handleParamChange}
                onReset={handleReset}
              />
              <ParamPlayBar
                isPlaying={isPlaying}
                onToggle={toggle}
                speed={speed}
                onSpeedChange={setSpeed}
                label="连续播放动点 P 沿轨迹运动"
              />
            </div>
          </LeftPanelSection>

          <LeftPanelSection title="辅助标注与视角">
            <div className="space-y-2">
              <Toggle
                label="空间垂足与直角标记"
                checked={showRightAngles}
                onChange={setShowRightAngles}
                size="compact"
              />
              <TabSwitcher
                layout="horizontal"
                tabs={[
                  { key: "iso", label: "立体" },
                  { key: "front", label: "正视" },
                  { key: "top", label: "俯视" },
                  { key: "side", label: "侧视" },
                ]}
                value={preset}
                onChange={(p) => setCameraPreset(p as CameraPreset)}
              />
            </div>
          </LeftPanelSection>

          {tipProps && (
            <LeftPanelSection title="题设与探究目标" compact>
              <TipCard
                variant={tipProps.variant}
                badge={tipProps.badge}
                background={tipProps.background}
                condition={tipProps.condition}
                question={tipProps.question}
              />
            </LeftPanelSection>
          )}
        </LeftPanel>
      }
      center={
        <ThreeDCanvas
          cameraPosition={cameraPosition}
          legend={<Legend3D title="空间轨迹图例" items={legendItems} />}
        >
          <CameraFit bounds={sceneBounds} token={viewToken} />
          <SolidDynamicLocusScene3D
            mode={mode}
            a={params.a}
            t={params.t}
            rFactor={params.rFactor}
            tiltDeg={params.tiltDeg}
            preset={preset}
            controlsRef={controlsRef}
            showRightAngles={showRightAngles}
          />
        </ThreeDCanvas>
      }
      right={
        <MathPanel
          title="空间轨迹破题与推演看板"
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          warnings={mathData.warnings}
          reasoningSteps={mathData.reasoningSteps}
          gaokaoPoints={mathData.gaokaoPoints}
          examAnchor={mathData.examAnchor}
          mnemonic={mathData.mnemonic}
        />
      }
    />
  );
}
