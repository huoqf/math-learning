import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  TabSwitcher,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { ParabolaScene } from "./components/ParabolaScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/parabola";
import type { ParabolaDirection } from "@/math/parabola";

export function ParabolaAnimation() {
  // 抛物线开口方向：'right' | 'left' | 'up' | 'down'
  const [direction, setDirection] = useState<ParabolaDirection>("right");

  // 研究模式：'definition' | 'focalChord' | 'tangentOptical'
  const [studyMode, setStudyMode] = useState<
    "definition" | "focalChord" | "tangentOptical"
  >("definition");

  // 参数状态
  const [params, setParams] = useState(() => ({
    p: defaultParams.p,
    tP: defaultParams.tP,
    thetaDeg: defaultParams.thetaDeg,
    yQ: defaultParams.yQ,
  }));

  // 视口尺寸测量与防抖
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 数学视图坐标范围 [-7, 7] x [-5.5, 5.5]
  const scale = useSceneScale({
    vp,
    xRange: [-7, 7],
    yRange: [-5.5, 5.5],
  });

  // 数学量看板数据组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-conic-parabola", params, {
      direction,
      studyMode,
    });
  }, [params, direction, studyMode]);

  // 参数更新处理器
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 重置参数
  const handleReset = () => {
    setParams({
      p: defaultParams.p,
      tP: defaultParams.tP,
      thetaDeg: defaultParams.thetaDeg,
      yQ: defaultParams.yQ,
    });
  };

  // 按 current studyMode 过滤参数配置
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      definition: ["p", "tP"],
      focalChord: ["p", "thetaDeg"],
      tangentOptical: ["p", "tP", "yQ"],
    };

    const activeKeys = keysByMode[studyMode] ?? Object.keys(paramMeta);

    return activeKeys
      .filter((key) => key in paramMeta)
      .map((key) => {
        const meta = paramMeta[key];
        return {
          key,
          label: meta.label,
          labelFormula: meta.labelFormula,
          value: params[key as keyof typeof params] ?? meta.defaultValue ?? 0,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 0.1,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, studyMode]);

  // 抛物线标准方程 LaTeX 字符串
  const equationLatex = useMemo(() => {
    const pStr = params.p > 0 ? (2 * params.p).toFixed(1) : "2p";
    switch (direction) {
      case "right":
        return `y^2 = \\color{#EF4444}{${pStr}} x`;
      case "left":
        return `y^2 = -\\color{#EF4444}{${pStr}} x`;
      case "up":
        return `x^2 = \\color{#EF4444}{${pStr}} y`;
      case "down":
        return `x^2 = -\\color{#EF4444}{${pStr}} y`;
    }
  }, [params.p, direction]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 开口方向选择 Section */}
          <LeftPanelSection
            title="抛物线开向"
            subtitle="选择四种标准抛物线姿态"
          >
            <TabSwitcher
              tabs={[
                { key: "right", label: "向右 y²=2px" },
                { key: "left", label: "向左 y²=-2px" },
                { key: "up", label: "向上 x²=2py" },
                { key: "down", label: "向下 x²=-2py" },
              ]}
              value={direction}
              onChange={(key) => setDirection(key as ParabolaDirection)}
            />
          </LeftPanelSection>

          {/* 研究模式 Section */}
          <LeftPanelSection
            title="高考焦点与准线几何"
            subtitle="选择深入研究范畴"
          >
            <SelectGrid
              items={[
                { key: "definition", label: "第一定义与焦半径" },
                { key: "focalChord", label: "焦点弦与相切圆" },
                { key: "tangentOptical", label: "切线光学与准线几何" },
              ]}
              value={studyMode}
              onChange={(k) => setStudyMode(k as typeof studyMode)}
              variant="filled"
              columns={1}
            />
          </LeftPanelSection>

          {/* 参数调节 Section */}
          <LeftPanelSection
            title="参数调节"
            subtitle="拖动滑块探索动态几何规律"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 方程公式悬浮框 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={equationLatex} mode="inline" />
          </div>

          {/* SVG 画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <ParabolaScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              direction={direction}
              studyMode={studyMode}
            />
          </AnimationSvgCanvas>
        </div>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title="抛物线几何指标看板"
        />
      }
    />
  );
}
