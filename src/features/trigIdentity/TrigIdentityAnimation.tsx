import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { TrigIdentityScene } from "./components/TrigIdentityScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/trigIdentity";
import { calculateInduction, type FormulaType } from "./math/trigIdentity";

export function TrigIdentityAnimation() {
  // 研究模式：'identity' | 'induction'
  const [studyMode, setStudyMode] = useState<"identity" | "induction">(
    "identity",
  );
  // 诱导公式类型选择
  const [formulaType, setFormulaType] = useState<FormulaType>("pi_plus");

  // 本地参数状态
  const [params, setParams] = useState<Record<string, number>>(() => ({
    alphaDeg: defaultParams.alphaDeg,
    homoA: defaultParams.homoA,
    homoB: defaultParams.homoB,
  }));

  // 视口尺寸测量与防抖
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 单位圆与直角坐标系比例尺：数学范围 X [-1.8, 1.8]，Y [-1.4, 1.4]
  const scale = useSceneScale({
    vp,
    xRange: [-1.8, 1.8],
    yRange: [-1.4, 1.4],
  });

  // 数学量看板数据组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-trig-identity", params, {
      studyMode,
      formulaType,
    });
  }, [params, studyMode, formulaType]);

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
      alphaDeg: defaultParams.alphaDeg,
      homoA: defaultParams.homoA,
      homoB: defaultParams.homoB,
    });
  };

  // 按研究模式过滤参数配置
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      identity: ["alphaDeg", "homoA", "homoB"],
      induction: ["alphaDeg"],
    };
    const activeKeys = keysByMode[studyMode] ?? ["alphaDeg"];

    return activeKeys
      .filter((key) => key in paramMeta)
      .map((key) => {
        const meta = paramMeta[key];
        return {
          key,
          label: meta.label,
          labelFormula: meta.labelFormula,
          value: params[key] ?? meta.defaultValue ?? 0,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 1,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, studyMode]);

  // 顶端悬浮 KaTeX 公式
  const headerFormulaLatex = useMemo(() => {
    if (studyMode === "identity") {
      return "\\sin^2\\alpha + \\cos^2\\alpha = 1 \\quad \\vert \\quad \\tan\\alpha = \\frac{\\sin\\alpha}{\\cos\\alpha}";
    } else {
      const ind = calculateInduction(params.alphaDeg ?? 30, formulaType);
      return `${ind.formulaTitle}: \\quad ${ind.sinFormulaTex} \\quad \\vert \\quad ${ind.cosFormulaTex}`;
    }
  }, [studyMode, formulaType, params.alphaDeg]);

  // 看板标题
  const panelTitle = useMemo(() => {
    return studyMode === "identity"
      ? "同角三角函数关系看板"
      : "诱导公式动态对称看板";
  }, [studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 研究模式选择 */}
          <LeftPanelSection title="研究模式" subtitle="选择探索的专题内容">
            <SelectGrid
              items={[
                { key: "identity", label: "同角基本关系" },
                { key: "induction", label: "诱导公式对称" },
              ]}
              value={studyMode}
              onChange={(k) => setStudyMode(k as "identity" | "induction")}
              variant="filled"
            />
          </LeftPanelSection>

          {/* 诱导公式类型选择 (仅在 induction 模式) */}
          {studyMode === "induction" && (
            <LeftPanelSection
              title="诱导公式类型"
              subtitle="选择6大组高考诱导公式"
            >
              <SelectGrid
                items={[
                  { key: "pi_plus", label: "π + α", formula: "\\pi + \\alpha" },
                  { key: "neg", label: "-α", formula: "-\\alpha" },
                  {
                    key: "pi_minus",
                    label: "π - α",
                    formula: "\\pi - \\alpha",
                  },
                  {
                    key: "half_pi_minus",
                    label: "π/2 - α",
                    formula: "\\frac{\\pi}{2} - \\alpha",
                  },
                  {
                    key: "half_pi_plus",
                    label: "π/2 + α",
                    formula: "\\frac{\\pi}{2} + \\alpha",
                  },
                  {
                    key: "period",
                    label: "α + 2kπ",
                    formula: "\\alpha + 2\\pi",
                  },
                ]}
                value={formulaType}
                onChange={(k) => setFormulaType(k as FormulaType)}
                variant="filled"
                color="primary"
                columns={2}
              />
            </LeftPanelSection>
          )}

          {/* 参数调节 */}
          <LeftPanelSection
            title="参数调节"
            subtitle="拖动滑块改变角 α 或齐次式系数"
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
          {/* 顶端 KaTeX 公式悬浮框 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={headerFormulaLatex} mode="inline" />
          </div>

          {/* SVG 自适应画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <TrigIdentityScene
              params={params as any}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              studyMode={studyMode}
              formulaType={formulaType}
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
          title={panelTitle}
        />
      }
    />
  );
}
