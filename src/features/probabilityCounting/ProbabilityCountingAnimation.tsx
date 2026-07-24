import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "../../components/Layout";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  MathPanel,
  KatexFormula,
  TabSwitcher,
  SelectGrid,
} from "../../components/UI";
import type { ParamConfig } from "../../components/UI";
import { useAnimationViewport, useSceneScale } from "../../hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "../../theme";
import { ProbabilityCountingScene } from "./components/ProbabilityCountingScene";
import { buildMathQuantities } from "../../data/mathQuantities";
import {
  defaultParams,
  paramMeta,
} from "../../data/registries/probabilityCounting";
import {
  getBinomialTerm,
  comb,
  perm,
  factorial,
} from "../../math/probabilityCounting";

export function ProbabilityCountingAnimation() {
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 1. 当前活动模式 ('binomial' | 'perm_comb' | 'principles')
  const [activeMode, setActiveMode] = useState<string>("binomial");
  // 子模式切换 (0 或 1)
  const [subMode, setSubMode] = useState<number>(0);

  // 2. Viewport 适应与比例尺
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const scale = useSceneScale({
    vp,
    xRange: [-10, 10],
    yRange: [-8, 8],
  });

  // 3. 右屏数据组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-probability-counting", params, {
      activeMode,
      subMode,
    });
  }, [params, activeMode, subMode]);

  // 4. 顶部 Header 动态公式
  const equationLatex = useMemo(() => {
    const n = Math.floor(params.n ?? 5);
    const k = Math.min(Math.floor(params.k ?? 2), n);
    const a = params.a ?? 1;
    const b = params.b ?? 1;

    if (activeMode === "binomial") {
      const info = getBinomialTerm(n, k, a, b);
      const aColorStr = `\\color{${MATH_COLORS.paramPrimary}}{${a}}`;
      const bColorStr = `\\color{${MATH_COLORS.paramSecondary}}{${b}}`;
      const nColorStr = `\\color{${MATH_COLORS.paramPrimary}}{${n}}`;
      const kColorStr = `\\color{${MATH_COLORS.paramSecondary}}{${k}}`;

      return `(${aColorStr}x + ${bColorStr})^{${nColorStr}} \\implies T_{${kColorStr}+1} = \\binom{${nColorStr}}{${kColorStr}} (${aColorStr}x)^{${
        n - k
      }} (${bColorStr})^{${kColorStr}} = ${
        Number.isInteger(info.termCoeff)
          ? info.termCoeff
          : info.termCoeff.toFixed(2)
      }x^{${info.powerA}}`;
    }

    if (activeMode === "perm_comb") {
      return `A_{\\color{${MATH_COLORS.paramPrimary}}{${n}}}^{\\color{${
        MATH_COLORS.paramSecondary
      }}{${k}}} = \\frac{${n}!}{\\left(${n}-${k}\\right)!}, \\quad C_{\\color{${
        MATH_COLORS.paramPrimary
      }}{${n}}}^{\\color{${MATH_COLORS.paramSecondary}}{${k}}} = \\frac{${n}!}{\\color{${
        MATH_COLORS.paramSecondary
      }}{${k}}!\\left(${n}-${k}\\right)!}`;
    }

    // principles
    const m1 = Math.floor(params.m1 ?? 3);
    const m2 = Math.floor(params.m2 ?? 2);
    const m3 = Math.floor(params.m3 ?? 2);
    if (subMode === 0) {
      return `N_{\\text{乘}} = \\color{${MATH_COLORS.paramPrimary}}{${m1}} \\times \\color{${
        MATH_COLORS.paramSecondary
      }}{${m2}} ${
        m3 > 0 ? `\\times \\color{${MATH_COLORS.paramTertiary}}{${m3}}` : ""
      } = ${m1 * m2 * (m3 > 0 ? m3 : 1)}`;
    }
    return `N_{\\text{加}} = \\color{${MATH_COLORS.paramPrimary}}{${m1}} + \\color{${
      MATH_COLORS.paramSecondary
    }}{${m2}} = ${m1 + m2}`;
  }, [params, activeMode, subMode]);

  // 5. 左屏声明式参数过滤 (按 activeMode 过滤)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      binomial: ["n", "k", "a", "b"],
      perm_comb: ["n", "k"],
      principles: ["m1", "m2", "m3"],
    };

    const keys = keysByMode[activeMode] ?? Object.keys(paramMeta);

    return keys
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
          importance: meta.importance as any,
          marks: meta.marks,
        };
      });
  }, [params, activeMode]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setParams({ ...defaultParams });
  };

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择区 */}
          <LeftPanelSection title="模式选择" subtitle="切换计数与定理探索主题">
            <TabSwitcher
              tabs={[
                { key: "binomial", label: "二项式定理", formula: "(a+b)^n" },
                {
                  key: "perm_comb",
                  label: "排列与组合",
                  formula: "A_n^k / C_n^k",
                },
                {
                  key: "principles",
                  label: "计数原理",
                  formula: "N_\\text{乘} / N_\\text{加}",
                },
              ]}
              value={activeMode}
              onChange={(k) => {
                setActiveMode(k);
                setSubMode(0);
              }}
            />
          </LeftPanelSection>

          {/* 子模式 / 关系选择网格 (计数原理模式时) */}
          {activeMode === "principles" && (
            <LeftPanelSection title="原理类型" subtitle="对比分步与分类机制">
              <SelectGrid
                items={[
                  {
                    key: "0",
                    label: "分步乘法原理",
                    formula: "N = m_1 \\times m_2",
                  },
                  { key: "1", label: "分类加法原理", formula: "N = m_1 + m_2" },
                ]}
                value={String(subMode)}
                onChange={(k) => setSubMode(Number(k))}
                columns={1}
              />
            </LeftPanelSection>
          )}

          {/* 参数调节区 */}
          <LeftPanelSection title="参数调节" subtitle="拖动滑块探索数形响应">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full flex flex-col bg-white overflow-hidden">
          {/* 顶部固定 Header（独立于 SVG，彻底解决公式遮挡与冲突） */}
          <div className="h-12 shrink-0 border-b border-neutral-200 bg-neutral-50/80 px-4 flex items-center justify-between gap-4 shadow-2xs z-10">
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              <span className="text-xs font-semibold text-neutral-500 bg-white border border-neutral-200 px-2 py-0.5 rounded shadow-2xs">
                {activeMode === "binomial"
                  ? "二项展开通项"
                  : activeMode === "perm_comb"
                    ? "排列与组合公式"
                    : "计数原理表达式"}
              </span>
              <div className="bg-white border border-neutral-200 rounded px-2.5 py-0.5 shadow-2xs">
                <KatexFormula formula={equationLatex} mode="inline" />
              </div>
            </div>
            <span className="text-xs text-neutral-400 font-medium shrink-0 hidden sm:inline">
              点击/拖动参数可实时数形联动
            </span>
          </div>

          {/* SVG 动画画布 */}
          <div className="flex-1 relative overflow-hidden">
            {/* HTML 覆盖层：带公式的标签（与 SVG 同步 vp.transform） */}
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                transform: `translate(${vp.tx}px, ${vp.ty}px) scale(${vp.scale})`,
                transformOrigin: "0 0",
              }}
            >
              {/* 二项式模式标签 */}
              {activeMode === "binomial" && (
                <>
                  {/* 金字塔标题 */}
                  <div
                    className="absolute whitespace-nowrap"
                    style={{
                      left: 40,
                      top: 25,
                      fontSize: 12,
                      fontWeight: "bold",
                      color: MATH_COLORS.labelTextLight,
                    }}
                  >
                    金字塔递推节点 (高亮当前项{" "}
                    <KatexFormula
                      formula="T_{k+1}"
                      mode="inline"
                      className="!text-xs !my-0"
                    />{" "}
                    )
                  </div>
                  {/* 展开项系数分布标题 */}
                  <div
                    className="absolute whitespace-nowrap"
                    style={{
                      left: 40,
                      top: 442,
                      fontSize: 12,
                      fontWeight: "bold",
                      color: MATH_COLORS.labelTextLight,
                    }}
                  >
                    展开项系数分布 (
                    <KatexFormula
                      formula="C_n^k"
                      mode="inline"
                      className="!text-xs !my-0"
                    />{" "}
                    湖蓝 vs 实际系数{" "}
                    <KatexFormula
                      formula="A_k"
                      mode="inline"
                      className="!text-xs !my-0"
                    />{" "}
                    粉红/红)
                  </div>
                </>
              )}

              {/* 排列组合模式标签 */}
              {activeMode === "perm_comb" &&
                (() => {
                  const n = Math.floor(params.n ?? 5);
                  const k = Math.min(Math.floor(params.k ?? 2), n);
                  const C = comb(n, k);
                  const P = perm(n, k);
                  return (
                    <>
                      {/* 组合标题 */}
                      <div
                        className="absolute whitespace-nowrap"
                        style={{
                          left: 115,
                          top: 182,
                          fontSize: 15,
                          fontWeight: "bold",
                          color: MATH_COLORS.combHeader,
                        }}
                      >
                        组合{" "}
                        <KatexFormula
                          formula="C_n^k"
                          mode="inline"
                          className="!text-base !my-0"
                        />{" "}
                        = {C} (无序分组)
                      </div>
                      {/* 排列标题 */}
                      <div
                        className="absolute whitespace-nowrap"
                        style={{
                          left: 490,
                          top: 182,
                          fontSize: 15,
                          fontWeight: "bold",
                          color: MATH_COLORS.permHeader,
                        }}
                      >
                        排列{" "}
                        <KatexFormula
                          formula="A_n^k"
                          mode="inline"
                          className="!text-base !my-0"
                        />{" "}
                        = {P} (有序槽位)
                      </div>
                      {/* 与组合关系 */}
                      <div
                        className="absolute whitespace-nowrap"
                        style={{
                          left: 125,
                          top: 267,
                          fontSize: 11,
                          color: MATH_COLORS.labelTextLight,
                        }}
                      >
                        与组合关系：
                        <KatexFormula
                          formula="A_n^k"
                          mode="inline"
                          className="!text-xs !my-0"
                        />{" "}
                        ={" "}
                        <KatexFormula
                          formula="C_n^k"
                          mode="inline"
                          className="!text-xs !my-0"
                        />{" "}
                        × k! = {C} × {factorial(k)}
                      </div>
                    </>
                  );
                })()}
            </div>

            <AnimationSvgCanvas
              containerRef={containerRef}
              transform={vp.transform}
            >
              <ProbabilityCountingScene
                params={params}
                scale={scale}
                vp={vp}
                activeMode={activeMode}
                subMode={subMode}
                onParamChange={handleParamChange}
                fontScale={canvasSize.font}
              />
            </AnimationSvgCanvas>
          </div>
        </div>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title="计数原理与二项式定理看板"
        />
      }
    />
  );
}
