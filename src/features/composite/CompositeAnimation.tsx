import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  TabSwitcher,
  SelectGrid,
  TipCard,
  ParamPlayBar,
} from "@/components/UI";
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale, useParamPlay } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { CompositeScene } from "./components/CompositeScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/composite";

type SubMode = "piecewise" | "composite";
type OuterType = "exp" | "log" | "quadratic";
type PiecewiseScenarioKey = "custom" | "tiered_tariff";

export function CompositeAnimation() {
  const [params, setParams] = useState(() => ({ ...defaultParams }));
  const [subMode, setSubMode] = useState<SubMode>("piecewise");
  const [outerType, setOuterType] = useState<OuterType>("exp");
  const [pwScenario, setPwScenario] = useState<PiecewiseScenarioKey>("custom");

  // Step 1: 自适应视口
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // Step 2: 比例尺
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // Step 3: 右屏数学数据组装
  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-func-composite", params, {
        subMode,
        outerType,
      }),
    [params, subMode, outerType],
  );

  // 动态拼装 LateX 公式浮标 (使用动态色彩 Token，杜绝硬编码 Hex)
  const formulaLatex = useMemo(() => {
    if (subMode === "piecewise") {
      const x0Val = (params.x0 ?? 1.0).toFixed(1);
      const k1 = (params.leftSlope ?? 1.0).toFixed(1);
      const b1 = (params.leftConst ?? 0.0).toFixed(1);
      const k2 = (params.rightSlope ?? -0.5).toFixed(1);
      const b2 = (params.rightConst ?? 1.5).toFixed(1);
      return `f(x) = \\begin{cases} ${k1}x + ${b1}, & x \\le \\color{${MATH_COLORS.paramPrimary}}{${x0Val}} \\\\[6pt] ${k2}x + ${b2}, & x > \\color{${MATH_COLORS.paramPrimary}}{${x0Val}} \\end{cases}`;
    } else {
      const bVal = (params.innerB ?? -2.0).toFixed(1);
      const cVal = (params.innerC ?? 2.0).toFixed(1);
      const innerStr = `g(x) = x^2 + (\\color{${MATH_COLORS.paramPrimary}}{${bVal}})x + \\color{${MATH_COLORS.paramSecondary}}{${cVal}}`;
      if (outerType === "exp") {
        return `y = f(g(x)) = 2^{${innerStr}}`;
      } else if (outerType === "log") {
        return `y = f(g(x)) = \\log_2(${innerStr})`;
      } else {
        return `y = f(g(x)) = -(${innerStr} - 2)^2 + 4`;
      }
    }
  }, [
    subMode,
    outerType,
    params.x0,
    params.leftSlope,
    params.leftConst,
    params.rightSlope,
    params.rightConst,
    params.innerB,
    params.innerC,
  ]);

  // 中屏右下角图例：聚焦图元语义，精简去除长公式机械重复
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    if (subMode === "piecewise") {
      return [
        {
          color: MATH_COLORS.function,
          label: "左段图象 f₁(x) (实心闭端点)",
          style: "solid",
        },
        {
          color: MATH_COLORS.paramPrimary,
          label: "右段图象 f₂(x) (空心开端点)",
          style: "solid",
        },
        {
          color: MATH_COLORS.asymptote,
          label: "分界线 x = x₀",
          style: "dash",
        },
      ];
    } else {
      return [
        {
          color: MATH_COLORS.function,
          label: "复合终态 y = f(g(x))",
          style: "solid",
        },
        {
          color: MATH_COLORS.paramSecondary,
          label: "内层二次曲线 u = g(x)",
          style: "dash",
        },
        {
          color: MATH_COLORS.functionSecondary,
          label: "外层映射 f(u)（左下小图）",
          style: "solid",
        },
        {
          color: MATH_COLORS.paramTertiary,
          label: "传导路径 (x, u) → (x, y)",
          style: "dot",
        },
      ];
    }
  }, [subMode]);

  // 参数对象化分组配置
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const configMap: Record<SubMode, Array<{ key: string; group?: string }>> = {
      piecewise: [
        { key: "x0", group: "分界参数" },
        { key: "leftSlope", group: "左段直线 f₁(x)" },
        { key: "leftConst", group: "左段直线 f₁(x)" },
        { key: "rightSlope", group: "右段直线 f₂(x)" },
        { key: "rightConst", group: "右段直线 f₂(x)" },
      ],
      composite: [
        { key: "xSample", group: "自变量动点" },
        { key: "innerB", group: "内层函数 g(x) = x² + bx + c" },
        { key: "innerC", group: "内层函数 g(x) = x² + bx + c" },
      ],
    };

    const items = configMap[subMode] ?? [];
    return items
      .filter(({ key }) => key in paramMeta)
      .map(({ key, group }) => {
        const meta = paramMeta[key];
        return {
          key,
          label: meta.label,
          labelFormula: meta.labelFormula,
          value: params[key] ?? meta.defaultValue ?? 0,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 0.1,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
          group,
        };
      });
  }, [params, subMode]);

  const playKey = subMode === "piecewise" ? "x0" : "xSample";
  const playMeta = paramMeta[playKey];
  const playCtrl = useParamPlay({
    min: playMeta?.min ?? -2.5,
    max: playMeta?.max ?? 3.5,
    ratePerSecond: subMode === "piecewise" ? 0.7 : 1.0,
    step: playMeta?.step ?? 0.1,
    mode: "bounce",
    getValue: () => params[playKey] ?? playMeta?.defaultValue ?? 1.0,
    onChange: (val) => {
      if (subMode === "piecewise") setPwScenario("custom");
      setParams((prev) => ({ ...prev, [playKey]: Number(val.toFixed(2)) }));
    },
  });

  const handleParamChange = (key: string, value: number) => {
    playCtrl.pause();
    if (subMode === "piecewise") {
      setPwScenario("custom");
    }
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handlePiecewiseScenarioChange = (key: string) => {
    playCtrl.pause();
    const sc = key as PiecewiseScenarioKey;
    setPwScenario(sc);
    if (sc === "tiered_tariff") {
      setParams((prev) => ({
        ...prev,
        x0: 2.0,
        leftSlope: 0.5,
        leftConst: 0.0,
        rightSlope: 1.5,
        rightConst: -2.0,
      }));
    }
  };

  // 动态教学提示配置（严格遵循 SKILL 结构化三要素：badge + condition + question + $...$ 定界符）
  const tipConfig = useMemo(() => {
    if (subMode === "piecewise") {
      const x0 = params.x0 ?? 1.0;
      const k1 = params.leftSlope ?? 1.0;
      const k2 = params.rightSlope ?? -0.5;
      const yLeft = k1 * x0 + (params.leftConst ?? 0.0);
      const yRight = k2 * x0 + (params.rightConst ?? 1.5);
      const isContinuous = Math.abs(yLeft - yRight) < 1e-4;
      const isGlobalInc = k1 >= 0 && k2 >= 0 && yLeft <= yRight;

      if (pwScenario === "tiered_tariff") {
        return {
          variant: "success" as const,
          badge: "生活应用建模 · 阶梯水电费分段计费",
          condition: `某户居民阶梯计费以 $x_0 = ${x0.toFixed(1)}$ 为分界阈值：第一档单价 $${k1.toFixed(1)}$，第二档单价 $${k2.toFixed(1)}$，分界点处左右费用同为 $${yLeft.toFixed(2)}$。`,
          question:
            "求解当月费用关于用水量的连续单调分段解析式，并验证为何阶梯费率上升时仍须满足分界点搭接连续条件。",
        };
      }

      return {
        variant: isGlobalInc ? ("success" as const) : ("danger" as const),
        badge: "高考高频 · 分段函数单调性充要条件",
        condition: `分界点 $x_0 = ${x0.toFixed(1)}$，左段在分界点的取值 $f_1(x_0) = ${yLeft.toFixed(2)}$，右段在分界点的取值 $f_2(x_0) = ${yRight.toFixed(2)}$。`,
        question: isGlobalInc
          ? "两段均单调递增且满足搭接不等式 $f_1(x_0) \\le f_2(x_0)$，求证该函数在 $\\mathbb{R}$ 上全域单调递增。"
          : !isContinuous && k1 >= 0 && k2 >= 0
            ? "两段虽各自单增，但在分界点向下跳跃（$f_1(x_0) > f_2(x_0)$），说明为何全域单调性会失效。"
            : "求参数斜率与截距应满足的充要不等式，使分段函数在 $\\mathbb{R}$ 上严格单调递增。",
      };
    } else {
      const symAxis = (-(params.innerB ?? -2.0) / 2).toFixed(2);
      const outerFormula =
        outerType === "exp"
          ? "y = 2^u"
          : outerType === "log"
            ? "y = \\log_2 u \\; (u > 0)"
            : "y = -(u-2)^2+4";

      return {
        variant: "primary" as const,
        badge: "高考难点 · 复合函数单调性与定义域优先",
        condition: `内层二次函数对称轴 $x = ${symAxis}$，外层映射法则 $${outerFormula}$。`,
        question:
          "比较中间量 $u = g(x)$ 与终值 $y = f(u)$ 的单调方向，运用“同增异减”求复合函数 $y = f(g(x))$ 的单调区间，并说明为何必须先确保 $u = g(x)$ 落在外层函数定义域内。",
      };
    }
  }, [
    subMode,
    outerType,
    pwScenario,
    params.x0,
    params.leftSlope,
    params.leftConst,
    params.rightSlope,
    params.rightConst,
    params.innerB,
  ]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 一级研究模式（TabSwitcher 标准动线） */}
          <LeftPanelSection title="研究主题">
            <TabSwitcher
              tabs={[
                { key: "piecewise", label: "分段函数临界与单调" },
                { key: "composite", label: "复合函数同增异减" },
              ]}
              value={subMode}
              onChange={(k) => {
                playCtrl.pause();
                setSubMode(k as SubMode);
              }}
              layout="vertical"
              className="mb-2"
            />
          </LeftPanelSection>

          {/* 分段函数真实生活情景或复合函数外层模型 */}
          {subMode === "piecewise" ? (
            <LeftPanelSection title="分段典型情景">
              <SelectGrid
                items={[
                  { key: "custom", label: "自由参数调节" },
                  { key: "tiered_tariff", label: "阶梯水电费建模" },
                ]}
                value={pwScenario}
                onChange={handlePiecewiseScenarioChange}
                variant="outline"
                columns={2}
              />
            </LeftPanelSection>
          ) : (
            <LeftPanelSection title="外层函数模型 f(u)">
              <SelectGrid
                items={[
                  { key: "exp", label: "指数型" },
                  { key: "log", label: "对数型" },
                  {
                    key: "quadratic",
                    label: "二次型",
                    fullWidth: true,
                  },
                ]}
                value={outerType}
                onChange={(k) => {
                  playCtrl.pause();
                  setOuterType(k as OuterType);
                }}
                variant="outline"
                columns={2}
              />
            </LeftPanelSection>
          )}

          {/* 参数调节区 */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() => {
                playCtrl.pause();
                setPwScenario("custom");
                setParams({ ...defaultParams });
              }}
            />
            <div className="mt-2">
              <ParamPlayBar
                isPlaying={playCtrl.isPlaying}
                onToggle={playCtrl.toggle}
                label={
                  subMode === "piecewise"
                    ? "分界点 x₀ 平移临界演示"
                    : "信号流 x → u → y 动态传导"
                }
                speed={playCtrl.speed}
                onSpeedChange={playCtrl.setSpeed}
              />
            </div>
          </LeftPanelSection>

          {/* 底部教学导引卡片（结构化 badge / condition / question） */}
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
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* LateX 主公式浮标（增大字号与增加行间距，显著提升清晰度） */}
          <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md border border-neutral-200/90 rounded-xl px-4 py-3 shadow-md pointer-events-none select-none text-[17px] sm:text-[19px]">
            <KatexFormula
              formula={formulaLatex}
              mode="inline"
              className="!text-[17px] sm:!text-[19px] font-medium leading-relaxed"
            />
          </div>

          {/* 右下角精简语义图例 */}
          <SceneLegend items={legendItems} />

          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <CompositeScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              subMode={subMode}
              outerType={outerType}
            />
          </AnimationSvgCanvas>
        </div>
      }
      right={
        <MathPanel
          {...mathData}
          title={subMode === "piecewise" ? "分段函数看板" : "复合函数看板"}
        />
      }
    />
  );
}
