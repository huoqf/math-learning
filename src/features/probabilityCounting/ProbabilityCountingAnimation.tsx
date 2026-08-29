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
  TipCard,
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
  evaluateAssignments,
  calculateGroupingAllocation,
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
  // 子模式切换 (0, 1, 2)
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
      if (subMode === 1) {
        const assignments = evaluateAssignments(n, a, b);
        const assignKeys = [
          "sum_all",
          "sum_alt",
          "sum_even",
          "sum_odd",
          "derivative",
          "constant",
        ];
        const curKey = assignKeys[params.assignmentType ?? 0] || "sum_all";
        return assignments[curKey]?.latexExpr ?? `(${a}x+${b})^{${n}}`;
      }

      const info = getBinomialTerm(n, k, a, b);
      const aColorStr = `\\color{${MATH_COLORS.paramPrimary}}{${a}}`;
      const bColorStr = `\\color{${MATH_COLORS.paramSecondary}}{${b}}`;
      const nColorStr = `\\color{${MATH_COLORS.paramPrimary}}{${n}}`;
      const kColorStr = `\\color{${MATH_COLORS.paramSecondary}}{${k}}`;

      if (subMode === 2) {
        return `T_{${k + 1}} = \\underbrace{\\color{${MATH_COLORS.paramPrimary}}{C_{${n}}^{${k}}}}_{\\text{二项式系数 } ${info.binomialCoeff}} \\cdot (${aColorStr}x)^{${n - k}} (${bColorStr})^{${k}} = \\underbrace{\\color{${MATH_COLORS.functionTransformed}}{${info.termCoeff}}}_{\\text{项系数}} x^{${info.powerA}}`;
      }

      return `(${aColorStr}x + ${bColorStr})^{${nColorStr}} \\implies T_{${kColorStr}+1} = \\binom{${nColorStr}}{${kColorStr}} (${aColorStr}x)^{${
        n - k
      }} (${bColorStr})^{${kColorStr}} = ${
        Number.isInteger(info.termCoeff)
          ? info.termCoeff
          : info.termCoeff.toFixed(2)
      }x^{${info.powerA}}`;
    }

    if (activeMode === "perm_comb") {
      if (subMode === 1) {
        const groupTotal = Math.floor(params.groupTotal ?? 6);
        const groupCount = Math.floor(params.groupCount ?? 3);
        const gInfo = calculateGroupingAllocation(groupTotal, groupCount);
        return `N_{\\text{均分}} = \\frac{${gInfo.directCombinationWays}}{\\color{${MATH_COLORS.paramSecondary}}{${gInfo.groupCount}!}} = \\color{${MATH_COLORS.paramPrimary}}{${gInfo.groupedWays}} \\quad (\\text{除以消去虚假顺序})`;
      }
      if (subMode === 2) {
        const bindWays = factorial(Math.max(0, n - 1)) * 2;
        const insertWays =
          factorial(Math.max(0, n - 2)) * perm(Math.max(0, n - 1), 2);
        return `N_{\\text{捆绑}} = A_{${Math.max(1, n - 1)}}^{${Math.max(1, n - 1)}} \\times A_2^2 = ${bindWays}, \\quad N_{\\text{插空}} = A_{${Math.max(1, n - 2)}}^{${Math.max(1, n - 2)}} \\times A_{${Math.max(1, n - 1)}}^2 = ${insertWays}`;
      }
      return `A_{\\color{${MATH_COLORS.paramPrimary}}{${n}}}^{\\color{${
        MATH_COLORS.paramSecondary
      }}{${k}}} = \\frac{${n}!}{\\left(${n}-${k}\\right)!}, \\quad C_{\\color{${
        MATH_COLORS.paramPrimary
      }}{${n}}}^{\\color{${MATH_COLORS.paramSecondary}}{${k}}} = \\frac{${n}!}{\\color{${
        MATH_COLORS.paramSecondary
      }}{${k}}!\\left(${n}-${k}\\right)!}`;
    }

    // principles
    if (subMode === 2) {
      const gm = Math.floor(params.gridM ?? 4);
      const gn = Math.floor(params.gridN ?? 3);
      return `N_{\\text{路径}} = C_{\\color{${MATH_COLORS.paramPrimary}}{${gm + gn}}}^{\\color{${MATH_COLORS.paramSecondary}}{${gm}}} = \\frac{(${gm}+${gn})!}{${gm}!${gn}!} = ${comb(gm + gn, gm)}`;
    }
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

  // 4.5. 左屏教学提示与题设导引 (说明初始条件与核心设问)
  const tipConfig = useMemo(() => {
    if (activeMode === "binomial") {
      if (subMode === 0) {
        return {
          variant: "primary" as const,
          badge: "高考核心 · 二项式展开与通项公式",
          condition: "已知二项式 (ax+b)ⁿ，各项幂次与组合数遵循杨辉三角规律。",
          question:
            "求展开式中第 k+1 项通项公式 T_{k+1}=C_n^k (ax)^{n-k} b^k、常数项或指定次项系数。",
        };
      }
      if (subMode === 1) {
        return {
          variant: "warning" as const,
          badge: "高考秒杀 · 赋值法动态沙盘",
          condition: "已知展开式 f(x)=a₀ + a₁x + a₂x² + ... + aₙxⁿ。",
          question:
            "快速求各项系数总和 f(1)、交错和 f(-1)、奇数项和、偶数项和以及加权求和 f'(1)。",
        };
      }
      return {
        variant: "accent" as const,
        badge: "高考考点辨析 · 二项式系数 vs 项系数",
        condition:
          "对比展开式第 k+1 项的组合数 C_n^k 与项系数 A_k = C_n^k a^{n-k} b^k。",
        question:
          "辨析二项式系数的最大项（仅由 n 决定，居中取得）与项系数的最大项（与 a,b 大小相关）。",
      };
    }

    if (activeMode === "perm_comb") {
      if (subMode === 0) {
        return {
          variant: "primary" as const,
          badge: "高考基础 · 排列数与组合数区别",
          condition: "从 n 个不同元素中取出 k 个元素 (k ≤ n)。",
          question: "探究有序排列 A_n^k 与无序组合 C_n^k 的数理关系。",
        };
      }
      if (subMode === 1) {
        return {
          variant: "danger" as const,
          badge: "高考高频 · 均匀分组消序模型",
          condition:
            "将总数 n 个不同元素均分为 k 组，每组分配 m 个元素 (n = k·m)。",
          question:
            "求均匀分组（无指定对象）与定向分配（有指定对象如甲乙丙车间）的种数差异。",
        };
      }
      return {
        variant: "success" as const,
        badge: "高考经典 · 捆绑法与插空法",
        condition: "多元素排队，部分特殊元素要求相邻或要求互不相邻。",
        question:
          "计算相邻限制（捆绑法）与不相邻限制（插空法）的排列方案总数。",
      };
    }

    // principles
    if (subMode === 0) {
      return {
        variant: "primary" as const,
        badge: "高考基础 · 分步乘法计数原理",
        condition: "完成一件事需要连续经过多道步骤，各步骤之间相互依存。",
        question: "求完成整件事的全部方案数 N = m₁ × m₂ × ... × mₖ。",
      };
    }
    if (subMode === 1) {
      return {
        variant: "info" as const,
        badge: "高考基础 · 分类加法计数原理",
        condition: "完成一件事有多种互斥的独立途径，每种途径均可独立完成目标。",
        question: "求完成整件事的方案总数 N = m₁ + m₂ + ... + mₖ。",
      };
    }
    return {
      variant: "accent" as const,
      badge: "高考创新 · 网格最短路径与标数法",
      condition: "在 m × n 的二维网格中，质点只能沿网格线向右或向上移动。",
      question: "求从左下角起点到右上角终点的最短路径总数。",
    };
  }, [activeMode, subMode]);

  // 5. 左屏声明式参数过滤 (按 activeMode 与 subMode 过滤)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    let keys: string[] = [];

    if (activeMode === "binomial") {
      if (subMode === 1) {
        keys = ["n", "a", "b"];
      } else {
        keys = ["n", "k", "a", "b"];
      }
    } else if (activeMode === "perm_comb") {
      if (subMode === 1) {
        keys = ["groupTotal", "groupCount"];
      } else if (subMode === 2) {
        keys = ["n"];
      } else {
        keys = ["n", "k"];
      }
    } else if (activeMode === "principles") {
      if (subMode === 0) {
        keys = ["m1", "m2", "m3"];
      } else if (subMode === 1) {
        keys = ["m1", "m2"];
      } else {
        keys = ["gridM", "gridN"];
      }
    }

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
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, activeMode, subMode]);

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
          {/* 主题模式选择区 */}
          <LeftPanelSection title="核心主题" subtitle="切换新高考专题模块">
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

          {/* 子模式 / 模型选择网格 */}
          {activeMode === "binomial" && (
            <LeftPanelSection title="二项式探索视图">
              <SelectGrid
                items={[
                  {
                    key: "0",
                    label: "杨辉三角与恒等式",
                    fullWidth: true,
                  },
                  {
                    key: "1",
                    label: "赋值法动态沙盘",
                    fullWidth: true,
                  },
                  {
                    key: "2",
                    label: "双轨系数对比",
                    fullWidth: true,
                  },
                ]}
                value={String(subMode)}
                onChange={(k) => setSubMode(Number(k))}
                columns={1}
              />
            </LeftPanelSection>
          )}

          {activeMode === "perm_comb" && (
            <LeftPanelSection title="解题模型">
              <SelectGrid
                items={[
                  {
                    key: "0",
                    label: "排列与组合对比",
                    fullWidth: true,
                  },
                  {
                    key: "1",
                    label: "均匀分组消序模型",
                    fullWidth: true,
                  },
                  {
                    key: "2",
                    label: "捆绑法与插空法",
                    fullWidth: true,
                  },
                ]}
                value={String(subMode)}
                onChange={(k) => setSubMode(Number(k))}
                columns={1}
              />
            </LeftPanelSection>
          )}

          {activeMode === "principles" && (
            <LeftPanelSection title="原理类型与模型">
              <SelectGrid
                items={[
                  {
                    key: "0",
                    label: "分步乘法决策树",
                    fullWidth: true,
                  },
                  {
                    key: "1",
                    label: "分类加法独立通道",
                    fullWidth: true,
                  },
                  {
                    key: "2",
                    label: "网格路径与标数法",
                    fullWidth: true,
                  },
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

          {/* 教学导引与题设背景 */}
          <LeftPanelSection title="教学导引与题设背景" compact>
            <TipCard variant={tipConfig.variant}>
              <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1">
                <span>{tipConfig.badge}</span>
              </div>
              <div className="space-y-1.5 text-[11px] leading-relaxed">
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
                    【核心设问】
                  </span>
                  <span className="text-neutral-600">{tipConfig.question}</span>
                </div>
              </div>
            </TipCard>
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full flex flex-col bg-white overflow-hidden">
          {/* 顶部固定 Header */}
          <div className="h-12 shrink-0 border-b border-neutral-200 bg-neutral-50/80 px-4 flex items-center justify-between gap-4 shadow-2xs z-10">
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              <span className="text-xs font-semibold text-neutral-500 bg-white border border-neutral-200 px-2 py-0.5 rounded shadow-2xs">
                {activeMode === "binomial"
                  ? "二项式展开与赋值通项"
                  : activeMode === "perm_comb"
                    ? "排列组合与经典模型"
                    : "计数原理与网格模型"}
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
