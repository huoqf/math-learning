import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { TrigModelScene } from "./components/TrigModelScene";
import { TRIG_MODEL_XRANGE, TRIG_MODEL_YRANGE } from "./viewport";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/trigModel";
import {
  formatMathNumber,
  formatPiFraction,
  formatPiFractionLatex,
} from "@/utils/mathFormat";
import {
  TRIG_SCENARIOS,
  buildHarmonicModel,
  getScenario,
  harmonicValue,
} from "@/math/trigModel";

type StudyMode = "harmonic" | "fromGraph" | "modeling";

/**
 * 三角函数模型应用（人教A版必修一 5.7）。
 *
 * 三大研究模式的分工：
 *   harmonic  —— 简谐运动模型：$h = A\\sin(\\omega t + \\varphi) + k$ 四个量各管什么；
 *   fromGraph —— 由图象求解析式：最值定 $A,k$ → 周期定 $\\omega$ → 波峰定 $\\varphi$ 的读数顺序；
 *   modeling  —— 实际情境应用：把「最高最低 / 一次变化用时 / 初始状态」翻译成四个量并作预测。
 *
 * 参数的**输入量**刻意取周期 $T$ 而不是角频率 $\\omega$：实际问题的条件几乎都写成
 * 「转一周用 12 分钟」「半日潮周期约 12.5 小时」这类周期，先输入 $T$ 再由 $\\omega = 2\\pi/T$
 * 派生，比要求学生在两个量之间来回心算更贴近题意，也少了一层出错机会。
 */
export function TrigModelAnimation() {
  const [studyMode, setStudyMode] = useState<StudyMode>("harmonic");

  // 建模模式下的情境选择（其余模式不读取该状态）
  const [scenarioKey, setScenarioKey] = useState<string>(TRIG_SCENARIOS[0].key);

  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 固定视口：横向覆盖一个完整周期长度（T ≤ 13），纵向覆盖值域极值包络
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const scale = useSceneScale({
    vp,
    xRange: TRIG_MODEL_XRANGE,
    yRange: TRIG_MODEL_YRANGE,
  });

  const A = params.A ?? 2;
  const period = params.period ?? 2;
  const phi = params.phi ?? Math.PI / 2;
  const k = params.k ?? 0;

  const model = useMemo(
    () => buildHarmonicModel(A, period, phi, k),
    [A, period, phi, k],
  );

  const scenario = getScenario(scenarioKey) ?? TRIG_SCENARIOS[0];

  // 数学量看板组装（scenarioKey 一并透传，供建模分支给出情境化文案）
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-trig-model", params, {
      studyMode,
      scenarioKey,
    });
  }, [params, studyMode, scenarioKey]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleReset = () => {
    setParams({ ...defaultParams });
  };

  /**
   * 选中情境：四个模型参数取自情境单一真源，同时把观测点对准该情境的设问时刻，
   * 使学生一进模式就看到「设问时刻上的那个点」，而不是还要自己先找位置。
   */
  const handleScenarioChange = (key: string) => {
    const next = getScenario(key);
    if (!next) return;
    setScenarioKey(next.key);
    setParams((prev) => ({
      ...prev,
      ...next.params,
      tRatio: next.probeTime / next.params.period,
    }));
  };

  /**
   * 切换研究模式：进入「实际情境应用」时必须同时把参数对齐到当前已选情境。
   *
   * 否则会出现本仓最忌讳的「文字与画面脱节」：左屏已勾选「弹簧振子」、
   * 徽章写着「设问于 t = 1」，曲线与观测点却还停在上一个模式的参数上（t = 1.5），
   * 右屏第 3 步也会把 t = 1.5 当成设问时刻 —— 一处不同步，三屏互相打架。
   */
  const handleStudyModeChange = (key: string) => {
    const next = key as StudyMode;
    setStudyMode(next);
    if (next === "modeling") handleScenarioChange(scenarioKey);
  };

  // 左屏声明式参数配置（按研究模式严格过滤，动参数在前、观测点在后）
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<StudyMode, string[]> = {
      harmonic: ["A", "period", "phi", "k", "tRatio"],
      fromGraph: ["A", "period", "phi", "k", "tRatio"],
      // 建模模式：周期是「一次完整变化用时」的直接输入，故紧随振幅之后
      modeling: ["A", "period", "phi", "k", "tRatio"],
    };
    const keys = keysByMode[studyMode] ?? [];
    return keys
      .filter((key) => key in paramMeta)
      .map((key) => {
        const meta = paramMeta[key];
        return {
          key,
          label: meta.label,
          labelFormula: meta.labelFormula,
          group: meta.group,
          value: params[key] ?? meta.defaultValue ?? 0,
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

  // 悬浮解析式（色彩绑定 MATH_COLORS Token，与右屏看板同源）
  const equationLatex = useMemo(() => {
    const aStr = formatMathNumber(model.amplitude);
    const omegaLatex =
      formatPiFraction(model.omega) !== null
        ? formatPiFractionLatex(model.omega)
        : formatMathNumber(model.omega);
    const phiAbsLatex =
      formatPiFraction(model.phi) !== null
        ? formatPiFractionLatex(Math.abs(model.phi))
        : formatMathNumber(Math.abs(model.phi));

    const phiTerm =
      Math.abs(model.phi) < 1e-9
        ? ""
        : ` ${model.phi > 0 ? "+" : "-"} \\color{${MATH_COLORS.paramTertiary}}{${phiAbsLatex}}`;
    const kTerm =
      Math.abs(model.balance) < 1e-9
        ? ""
        : ` ${model.balance > 0 ? "+" : "-"} \\color{${MATH_COLORS.functionSecondary}}{${formatMathNumber(Math.abs(model.balance))}}`;

    const core = `\\color{${MATH_COLORS.function}}{h} = \\color{${MATH_COLORS.paramPrimary}}{${aStr}}\\sin\\!\\left(\\color{${MATH_COLORS.paramSecondary}}{${omegaLatex}}\\, t${phiTerm}\\right)${kTerm}`;

    if (studyMode === "fromGraph") {
      return `${core},\\quad h_{max},\\, h_{min} \\to A,\\, k;\\quad T \\to \\omega;\\quad t_{max} \\to \\varphi`;
    }

    if (studyMode === "modeling") {
      const tProbe = (params.tRatio ?? 0) * model.period;
      return `${core},\\quad \\color{${MATH_COLORS.paramPrimary}}{h(${formatMathNumber(tProbe)})} = ${formatMathNumber(harmonicValue(model, tProbe))}`;
    }

    return `${core},\\quad \\color{${MATH_COLORS.paramSecondary}}{T} = ${formatMathNumber(model.period)}`;
  }, [model, studyMode, params.tRatio]);

  const panelTitle = useMemo(() => {
    if (studyMode === "fromGraph") return "由图象求解析式看板";
    if (studyMode === "modeling") return "三角函数实际建模看板";
    return "简谐运动四量看板";
  }, [studyMode]);

  // 中屏右上角状态徽章
  const badgeText = useMemo(() => {
    if (studyMode === "fromGraph") return "读数顺序：最值 → 周期 → 特殊点";
    if (studyMode === "modeling") {
      return `${scenario.name} · ${scenario.quantity}（设问于 t = ${formatMathNumber(scenario.probeTime)}）`;
    }
    return "平衡线 h = k · 振幅 A 定摆幅 · 周期 T 定疏密";
  }, [studyMode, scenario]);

  const tipConfig = useMemo(() => {
    if (studyMode === "harmonic") {
      return {
        variant: "info" as const,
        badge: "四量各司其职 · 简谐运动",
        condition:
          "小球在平衡线 $h = k$ 上下做简谐运动：振幅 $A$ 决定摆幅，周期 $T$ 决定一次全振动的时长，初相 $\\varphi$ 决定 $t = 0$ 时处于什么位置。",
        question:
          "若把初相由 $\\dfrac{\\pi}{2}$ 改为 $-\\dfrac{\\pi}{2}$，图象沿时间轴发生了什么变化？此时 $t = 0$ 的小球又位于何处？",
      };
    }
    if (studyMode === "fromGraph") {
      return {
        variant: "accent" as const,
        badge: "读图定四量 · 顺序不可颠倒",
        condition:
          "图象给出一个完整周期的波形，波峰与波谷的纵坐标、以及一个波峰的横坐标都可直接量出。",
        question:
          "为什么 $\\varphi$ 不能只由周期确定，必须借助一个具体点的坐标？若改用零点代替波峰来定 $\\varphi$，相位方程该怎么写？",
      };
    }
    return {
      variant: "primary" as const,
      badge: `${scenario.name} · 文字条件翻译成四量`,
      condition: scenario.background,
      question: scenario.probeQuestion,
    };
    // 依赖中保留二级选项变量 scenarioKey：TipCard 教学提示须随情境切换同步特化
    // （项目纪律 left/tipcard-secondary-sync —— 该门禁按字面校验依赖数组，故 key 必须显式列出）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyMode, scenario, scenarioKey]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 研究模式选择（模式选择置顶） */}
          <LeftPanelSection title="研究模式">
            <SelectGrid
              items={[
                {
                  key: "harmonic",
                  label: "简谐运动模型",
                  description: "四个量各管什么",
                },
                {
                  key: "fromGraph",
                  label: "由图象求式",
                  description: "最值 → 周期 → 波峰",
                },
                {
                  key: "modeling",
                  label: "实际情境应用",
                  description: "文字条件 → 解析式 → 预测",
                },
              ]}
              value={studyMode}
              onChange={handleStudyModeChange}
              variant="outline"
              columns={1}
            />
          </LeftPanelSection>

          {/* 建模模式下的情境选择（二级选项） */}
          {studyMode === "modeling" && (
            <LeftPanelSection title="实际情境">
              <SelectGrid
                items={TRIG_SCENARIOS.map((s) => ({
                  key: s.key,
                  label: s.name,
                  description: `${s.quantity} · ${s.timeAxis}`,
                }))}
                value={scenarioKey}
                onChange={handleScenarioChange}
                variant="outline"
                columns={1}
              />
            </LeftPanelSection>
          )}

          {/* 统一声明式参数调节 */}
          <LeftPanelSection title="参数控制">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 教学启发引导卡片（置于底部辅助区） */}
          <TipCard
            variant={tipConfig.variant}
            badge={tipConfig.badge}
            condition={tipConfig.condition}
            question={tipConfig.question}
          />
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 左上角：解析式悬浮窗口 */}
          <div className="absolute top-3.5 left-4 z-10 max-w-[88%] overflow-x-auto bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={equationLatex} mode="inline" />
          </div>

          {/* 右上角：模式与情境状态徽章 */}
          <div className="absolute top-3.5 right-4 z-10 bg-white/95 border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm text-xs font-medium text-neutral-700">
            {badgeText}
          </div>

          {/* SVG 自适应画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <TrigModelScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              studyMode={studyMode}
            />
          </AnimationSvgCanvas>
        </div>
      }
      right={<MathPanel {...mathData} title={panelTitle} />}
    />
  );
}
