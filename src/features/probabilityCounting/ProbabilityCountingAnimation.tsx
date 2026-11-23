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
import {
  useAnimationViewport,
  useSceneScale,
  useGaokaoView,
} from "../../hooks";
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
  formatLinearBinomialLatex,
  formatXPowerLatex,
} from "../../math/probabilityCounting";

export function ProbabilityCountingAnimation() {
  const isGaokao = useGaokaoView();
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 1. 当前活动模式 ('binomial' | 'perm_comb' | 'principles')
  const [activeMode, setActiveMode] = useState<string>("binomial");
  // 子模式切换 (0, 1, 2)
  const [subMode, setSubMode] = useState<number>(isGaokao ? 1 : 0);

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
        return (
          assignments[curKey]?.latexExpr ?? formatLinearBinomialLatex(a, b, n)
        );
      }

      const info = getBinomialTerm(n, k, a, b);
      const aColorStr = `\\color{${MATH_COLORS.paramPrimary}}{${a}}`;
      const bColorStr = `\\color{${MATH_COLORS.paramSecondary}}{${b}}`;
      const nColorStr = `\\color{${MATH_COLORS.paramPrimary}}{${n}}`;
      const kColorStr = `\\color{${MATH_COLORS.paramSecondary}}{${k}}`;
      const lhsColored = formatLinearBinomialLatex(a, b, n, {
        aColor: MATH_COLORS.paramPrimary,
        bColor: MATH_COLORS.paramSecondary,
        nColor: MATH_COLORS.paramPrimary,
      });
      const xPowLatex = formatXPowerLatex(info.powerA);
      if (n === 0) {
        return `T_{1} = C_{0}^{0} = 1 \\quad ((ax+b)^0 \\equiv 1)`;
      }
      const axFactorColored =
        info.powerA === 0
          ? ""
          : a === 1
            ? xPowLatex
            : a === -1
              ? `(\\color{${MATH_COLORS.paramPrimary}}{-}x)${info.powerA === 1 ? "" : `^{${info.powerA}}`}`
              : `(${aColorStr}x)${info.powerA === 1 ? "" : `^{${info.powerA}}`}`;
      const bFactorColored =
        info.powerB === 0
          ? ""
          : b < 0
            ? `(${bColorStr})${info.powerB === 1 ? "" : `^{${info.powerB}}`}`
            : `${bColorStr}${info.powerB === 1 ? "" : `^{${info.powerB}}`}`;
      const factorChain = [axFactorColored, bFactorColored]
        .filter(Boolean)
        .join(" \\cdot ");
      const coeffFmt = Number.isInteger(info.termCoeff)
        ? String(info.termCoeff)
        : info.termCoeff.toFixed(2);
      const rhsTerm = xPowLatex
        ? info.termCoeff === 1
          ? xPowLatex
          : info.termCoeff === -1
            ? `-${xPowLatex}`
            : info.termCoeff === 0
              ? "0"
              : `${coeffFmt}${xPowLatex}`
        : coeffFmt;

      if (subMode === 2) {
        return `T_{${k + 1}} = \\underbrace{\\color{${MATH_COLORS.paramPrimary}}{C_{${n}}^{${k}}}}_{\\text{二项式系数 } ${info.binomialCoeff}}${factorChain ? ` \\cdot ${factorChain}` : ""} = \\underbrace{\\color{${MATH_COLORS.functionTransformed}}{${coeffFmt}}}_{\\text{项系数}}${xPowLatex ? ` ${xPowLatex}` : ""}`;
      }

      return `${lhsColored} \\implies T_{${kColorStr}+1} = \\binom{${nColorStr}}{${kColorStr}}${factorChain ? ` \\cdot ${factorChain}` : ""} = ${rhsTerm}`;
    }

    if (activeMode === "perm_comb") {
      if (subMode === 1) {
        const groupTotal = Math.floor(params.groupTotal ?? 6);
        const groupCount = Math.floor(params.groupCount ?? 3);
        const gInfo = calculateGroupingAllocation(groupTotal, groupCount);
        // 不可整除时三个计数一律为 0，印成「0 ÷ 3! = 0」等于把无定义伪装成结论
        if (!gInfo.isDivisible) {
          return `\\text{均分前提不成立：} ${gInfo.totalItems} \\text{ 除以 } ${gInfo.groupCount} \\text{ 余 } ${gInfo.remainder} \\text{，均分方案不存在}`;
        }
        return `N_{\\text{均分}} = \\frac{${gInfo.directCombinationWays}}{\\color{${MATH_COLORS.paramSecondary}}{${gInfo.groupCount}!}} = \\color{${MATH_COLORS.paramPrimary}}{${gInfo.groupedWays}} \\quad (\\text{除以消去虚假顺序})`;
      }
      if (subMode === 2) {
        // 与右屏 builder 及中屏 Scene 三方同源：受限元素固定 m = 2，主体数 n - 2，空档数 n - 1
        const bindCount = 2;
        const freeCount = Math.max(0, n - bindCount);
        const bindWays = factorial(Math.max(0, n - 1)) * factorial(bindCount);
        const insertWays =
          factorial(freeCount) * perm(freeCount + 1, bindCount);
        if (n < bindCount) {
          return `\\text{排队模型需 } n \\ge ${bindCount} \\text{，当前 } n = ${n}`;
        }
        return `N_{\\text{捆绑}} = A_{${freeCount + 1}}^{${freeCount + 1}} \\times A_{${bindCount}}^{${bindCount}} = ${bindWays}, \\quad N_{\\text{插空}} = A_{${freeCount}}^{${freeCount}} \\times A_{${freeCount + 1}}^{${bindCount}} = ${insertWays}`;
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
          background:
            "新高考多以选填压轴或中档题形式考察特定次幂项、常数项及有理项求解。",
          condition:
            "已知二项式 $(ax+b)^n$，各项幂次与组合数遵循杨辉三角规律。",
          question:
            "求展开式中第 $k+1$ 项通项公式 $T_{k+1}=C_n^k (ax)^{n-k} b^k$、常数项或指定次项系数。",
        };
      }
      if (subMode === 1) {
        const assignTips: Record<
          number,
          { condition: string; question: string }
        > = {
          0: {
            condition:
              "已知恒等式 $f(x) = (ax+b)^n = a_nx^n + \\dots + a_1x + a_0$，当前选取赋值 $x = 1$。",
            question:
              "如何通过代入 $x = 1$ 直接消除变量幂次，求出全部展开项系数之和 $f(1) = a_0 + a_1 + \\dots + a_n$？",
          },
          1: {
            condition:
              "已知恒等式 $f(x) = (ax+b)^n$，当前选取赋值 $x = -1$ 产生 $(-1)^k$ 正负交错号。",
            question:
              "如何利用 $x = -1$ 构造奇偶交错系数和 $f(-1) = a_0 - a_1 + a_2 - \\dots$？",
          },
          2: {
            condition:
              "联立赋值表达式 $f(1) = \\sum a_k$ 与 $f(-1) = \\sum (-1)^k a_k$ 进行相加消元。",
            question:
              "为何将两式相加除以 $2$ 即可精准消去奇次项，直接求得偶次项系数之和 $\\frac{f(1)+f(-1)}{2}$？",
          },
          3: {
            condition:
              "联立赋值表达式 $f(1) = \\sum a_k$ 与 $f(-1) = \\sum (-1)^k a_k$ 进行作差消元。",
            question:
              "为何将两式相减除以 $2$ 即可消除偶次项，求得奇次项系数之和 $\\frac{f(1)-f(-1)}{2}$？",
          },
          4: {
            condition:
              "对展开恒等式两边关于 $x$ 求导得 $f'(x) = \\sum_{k=1}^n k a_k x^{k-1}$，再代入 $x = 1$。",
            question:
              "如何利用求导降幂规律得到带下标权重的系数加权和 $f'(1) = n a (a+b)^{n-1}$？",
          },
          5: {
            condition:
              "在展开恒等式 $f(x) = a_nx^n + \\dots + a_1x + a_0$ 中直接令自变量 $x = 0$。",
            question:
              "为何所有含 $x$ 的高次项同步归零，从而瞬间分离出展开式常数项 $a_0 = f(0) = b^n$？",
          },
        };
        const curAssignTip =
          assignTips[Math.floor(params.assignmentType ?? 0)] ?? assignTips[0];
        return {
          variant: "warning" as const,
          badge: "高考秒杀 · 赋值法动态沙盘",
          background:
            "在求复杂多项式或乘积式展开后的系数总和、奇偶项和时，直接展开往往繁琐。",
          condition: curAssignTip.condition,
          question: curAssignTip.question,
        };
      }
      return {
        variant: "accent" as const,
        badge: "高考考点辨析 · 二项式系数 vs 项系数",
        background:
          "新高考常将“二项式系数最大”与“项系数最大”混置考查，概念混淆极易失分。",
        condition:
          "对比展开式第 $k+1$ 项的组合数 $C_n^k$ 与项系数 $A_k = C_n^k a^{n-k} b^k$。",
        question:
          "辨析二项式系数最大项（仅由 $n$ 决定、居中取得）与项系数最大项（与 $a,b$ 符号量级相关）的求解条件。",
      };
    }

    if (activeMode === "perm_comb") {
      if (subMode === 0) {
        return {
          variant: "primary" as const,
          badge: "高考基础 · 排列数与组合数区别",
          background:
            "从选出代表参加会议或依次排定演出顺序等生活问题中抽象“无序选取”与“有序入座”。",
          condition: "从 $n$ 个不同元素中取出 $k$ 个元素 ($k \\le n$)。",
          question: "探究有序排列 $A_n^k$ 与无序组合 $C_n^k$ 的数理转化关系。",
        };
      }
      if (subMode === 1) {
        return {
          variant: "danger" as const,
          badge: "高考高频 · 均匀分组消序模型",
          background:
            "物资分配、志愿者派驻或图书分堆问题中，平均分堆常隐含分步选出带来的重复排序。",
          condition:
            "将总数 $n$ 个不同元素均分为 $k$ 组，每组分配 $m$ 个元素 ($n = k \\times m$)。",
          question:
            "求均匀分组（消序除 $k!$）与定向分配（乘回 $k!$）两类方案数的差异与整除成立条件。",
        };
      }
      return {
        variant: "success" as const,
        badge: "高考经典 · 捆绑法与插空法",
        background:
          "人物合影站位、节目编排或车辆停放常出现指定对象紧邻或彼此隔离的约束。",
        condition:
          "共 $n$ 个不同元素排成一列，部分特殊元素要求必须相邻或互不相邻。",
        question:
          "计算相邻限制（捆绑成大元）与不相邻限制（先排他元再插空）的排列方案总数。",
      };
    }

    // principles
    if (subMode === 0) {
      return {
        variant: "primary" as const,
        badge: "高考基础 · 分步乘法计数原理",
        background:
          "日常穿搭搭配、流水线多道工序或选科组合均需连续经历多个关联步骤完成。",
        condition:
          "完成一件事需要连续经过多道步骤，分别有 $m_1, m_2, \\dots$ 种选法，各步骤相互依存。",
        question:
          "求完成整件事的全部方案数 $N = m_1 \\times m_2 \\times \\dots \\times m_k$。",
      };
    }
    if (subMode === 1) {
      return {
        variant: "info" as const,
        badge: "高考基础 · 分类加法计数原理",
        background:
          "跨城出行可在直达高铁、航空或多条互不重合的公路通道中任选一条独立成行。",
        condition:
          "完成一件事有两类独立互斥途径，各含 $m_1, m_2$ 种方法，任选其一即可完成目标。",
        question: "求完成整件事的方案总数 $N = m_1 + m_2$。",
      };
    }
    return {
      variant: "accent" as const,
      badge: "高考创新 · 网格最短路径与标数法",
      background:
        "城市街区路口导航规划最短路线时，质点仅沿水平与竖直网格正向移动，无折返。",
      condition:
        "在 $m \\times n$ 的二维网格中，从左下角 $(0,0)$ 只能向右 $R$ 或向上 $U$ 走至 $(m,n)$。",
      question:
        "求从起点到终点的最短路径总数，并证明其与组合数 $C_{m+n}^m$ 及加法递推的一致性。",
    };
  }, [activeMode, subMode, params.assignmentType]);

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

    const currentN = Math.max(0, Math.floor(params.n ?? 5));
    return keys
      .filter((key) => key in paramMeta)
      .map((key) => {
        const meta = paramMeta[key];
        const maxVal = key === "k" ? currentN : meta.max;
        return {
          key,
          label: meta.label,
          labelFormula: meta.labelFormula,
          value: Math.min(params[key] ?? meta.defaultValue ?? 0, maxVal),
          min: meta.min,
          max: maxVal,
          step: meta.step ?? 1,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, activeMode, subMode]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => {
      if (key === "n" && (prev.k ?? 0) > value) {
        return { ...prev, n: value, k: value };
      }
      if (key === "k") {
        const clampedK = Math.min(value, prev.n ?? 5);
        return { ...prev, k: clampedK };
      }
      return { ...prev, [key]: value };
    });
  };

  const handleReset = () => {
    setParams({ ...defaultParams });
  };

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 主题模式选择区 */}
          <LeftPanelSection title="核心主题">
            <TabSwitcher
              tabs={[
                { key: "binomial", label: "二项式定理" },
                {
                  key: "perm_comb",
                  label: "排列与组合",
                },
                {
                  key: "principles",
                  label: "计数原理",
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
                    label: "杨辉三角恒等式",
                  },
                  {
                    key: "1",
                    label: "赋值法动态沙盘",
                  },
                  {
                    key: "2",
                    label: "双轨系数对比",
                  },
                ]}
                value={String(subMode)}
                onChange={(k) => setSubMode(Number(k))}
                columns={2}
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
                  },
                  {
                    key: "1",
                    label: "均匀分组消序",
                  },
                  {
                    key: "2",
                    label: "捆绑法与插空法",
                  },
                ]}
                value={String(subMode)}
                onChange={(k) => setSubMode(Number(k))}
                columns={2}
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
                  },
                  {
                    key: "1",
                    label: "分类加法通道",
                  },
                  {
                    key: "2",
                    label: "网格路径标数",
                  },
                ]}
                value={String(subMode)}
                onChange={(k) => setSubMode(Number(k))}
                columns={2}
              />
            </LeftPanelSection>
          )}

          {/* 参数调节区 */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 教学导引与题设背景 */}
          <div className="mt-auto">
            <TipCard
              variant={tipConfig.variant}
              badge={tipConfig.badge}
              background={tipConfig.background}
              condition={tipConfig.condition}
              question={tipConfig.question}
            />
          </div>
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
      right={<MathPanel {...mathData} title="计数原理与二项式定理看板" />}
    />
  );
}
