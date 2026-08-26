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
} from "@/components/UI";
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { CompositeScene } from "./components/CompositeScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/composite";

type SubMode = "piecewise" | "composite";
type OuterType = "exp" | "log" | "quadratic";

export function CompositeAnimation() {
  const [params, setParams] = useState(() => ({ ...defaultParams }));
  const [subMode, setSubMode] = useState<SubMode>("piecewise");
  const [outerType, setOuterType] = useState<OuterType>("exp");

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

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  // 动态教学提示配置（严格遵循 SKILL 双要素架构：基础条件 + 启发式探究设问）
  const tipConfig = useMemo(() => {
    if (subMode === "piecewise") {
      const x0 = params.x0 ?? 1.0;
      const k1 = params.leftSlope ?? 1.0;
      const k2 = params.rightSlope ?? -0.5;
      const yLeft = k1 * x0 + (params.leftConst ?? 0.0);
      const yRight = k2 * x0 + (params.rightConst ?? 1.5);
      const isContinuous = Math.abs(yLeft - yRight) < 1e-4;
      const isGlobalInc = k1 >= 0 && k2 >= 0 && yLeft <= yRight;

      return {
        variant: isGlobalInc ? ("success" as const) : ("danger" as const),
        badge: "高考高频 · 分段函数单调性充要条件",
        conditionNode: (
          <span>
            分界点{" "}
            <KatexFormula formula={`x_0 = ${x0.toFixed(1)}`} mode="inline" />
            ，左端点极限{" "}
            <KatexFormula
              formula={`f_1(x_0) = ${yLeft.toFixed(2)}`}
              mode="inline"
            />
            ，右端点极限{" "}
            <KatexFormula
              formula={`f_2(x_0) = ${yRight.toFixed(2)}`}
              mode="inline"
            />
            。
          </span>
        ),
        questionNode: isGlobalInc ? (
          <span>
            两段均单调递增且满足搭接不等式{" "}
            <KatexFormula formula="f_1(x_0) \le f_2(x_0)" mode="inline" />
            ，函数在 <KatexFormula formula="\mathbb{R}" mode="inline" />{" "}
            上是否处处单调？
          </span>
        ) : !isContinuous && k1 >= 0 && k2 >= 0 ? (
          <span>
            两段虽各自单增，但在分界点向下跳跃（
            <KatexFormula formula="f_1(x_0) > f_2(x_0)" mode="inline" />
            ），为何导致全域单调性失效？
          </span>
        ) : (
          <span>
            如何调节斜率与截距，使分段函数满足在{" "}
            <KatexFormula formula="\mathbb{R}" mode="inline" />{" "}
            上严格单调递增的充要条件？
          </span>
        ),
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
        conditionNode: (
          <span>
            内层二次函数对称轴{" "}
            <KatexFormula formula={`x = ${symAxis}`} mode="inline" />
            ，外层映射法则 <KatexFormula formula={outerFormula} mode="inline" />
            。
          </span>
        ),
        questionNode: (
          <span>
            拖动自变量动点 <KatexFormula formula="x" mode="inline" />
            ，观察中间量 <KatexFormula formula="u = g(x)" mode="inline" />{" "}
            与终值 <KatexFormula formula="y = f(u)" mode="inline" />{" "}
            的单调方向，如何运用“同增异减”确定整体单调区间？
          </span>
        ),
      };
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
  ]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 一级研究模式（TabSwitcher 标准动线） */}
          <LeftPanelSection title="研究主题" subtitle="选择函数探究模块">
            <TabSwitcher
              tabs={[
                { key: "piecewise", label: "分段函数临界与单调" },
                { key: "composite", label: "复合函数同增异减" },
              ]}
              value={subMode}
              onChange={(k) => setSubMode(k as SubMode)}
              layout="vertical"
              className="mb-2"
            />
          </LeftPanelSection>

          {/* 复合函数模式下选择外层函数模型 */}
          {subMode === "composite" && (
            <LeftPanelSection
              title="外层函数模型 f(u)"
              subtitle="选择外层映射类型"
            >
              <SelectGrid
                items={[
                  { key: "exp", formula: "y = 2^u" },
                  { key: "log", formula: "y = \\log_2 u" },
                  {
                    key: "quadratic",
                    formula: "y = -(u-2)^2+4",
                    fullWidth: true,
                  },
                ]}
                value={outerType}
                onChange={(k) => setOuterType(k as OuterType)}
                variant="outline"
                columns={2}
              />
            </LeftPanelSection>
          )}

          {/* 参数调节区 */}
          <LeftPanelSection title="参数调节" subtitle="调节临界点与模型系数">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() => setParams({ ...defaultParams })}
            />
          </LeftPanelSection>

          {/* 底部教学导引卡片（严格遵循 SKILL 规范：双要素架构 + KatexFormula 渲染） */}
          <LeftPanelSection title="教学导引与高考设问" compact>
            <TipCard variant={tipConfig.variant}>
              <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1">
                <span>{tipConfig.badge}</span>
              </div>
              <div className="space-y-1.5 text-[11px] leading-relaxed">
                <div>
                  <span className="font-semibold text-neutral-800">
                    【基础条件】
                  </span>
                  <span className="text-neutral-600 ml-1">
                    {tipConfig.conditionNode}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-800">
                    【探究设问】
                  </span>
                  <span className="text-neutral-600 ml-1">
                    {tipConfig.questionNode}
                  </span>
                </div>
              </div>
            </TipCard>
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
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title={subMode === "piecewise" ? "分段函数看板" : "复合函数看板"}
        />
      }
    />
  );
}
