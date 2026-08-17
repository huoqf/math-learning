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
            <LeftPanelSection
              title="二项式探索视图"
              subtitle="多维探究展开与性质"
            >
              <SelectGrid
                items={[
                  {
                    key: "0",
                    label: "杨辉三角与恒等式",
                    formula: "C_n^k = C_{n-1}^{k-1}+C_{n-1}^k",
                  },
                  {
                    key: "1",
                    label: "赋值法动态沙盘",
                    formula: "f(1), f(-1), f'(1)",
                  },
                  {
                    key: "2",
                    label: "双轨系数对比",
                    formula: "C_n^k \\text{ vs } A_k",
                  },
                ]}
                value={String(subMode)}
                onChange={(k) => setSubMode(Number(k))}
                columns={1}
              />
            </LeftPanelSection>
          )}

          {activeMode === "perm_comb" && (
            <LeftPanelSection title="解题模型" subtitle="高考高频思维模型">
              <SelectGrid
                items={[
                  {
                    key: "0",
                    label: "基础排列与组合对比",
                    formula: "A_n^k \\text{ vs } C_n^k",
                  },
                  {
                    key: "1",
                    label: "均匀分组消序模型",
                    formula: "\\frac{\\prod C}{k!}",
                  },
                  {
                    key: "2",
                    label: "捆绑法与插空法",
                    formula: "\\text{相邻 / 不相邻}",
                  },
                ]}
                value={String(subMode)}
                onChange={(k) => setSubMode(Number(k))}
                columns={1}
              />
            </LeftPanelSection>
          )}

          {activeMode === "principles" && (
            <LeftPanelSection
              title="原理类型与模型"
              subtitle="对比分步、分类与网格"
            >
              <SelectGrid
                items={[
                  {
                    key: "0",
                    label: "分步乘法决策树",
                    formula: "N = m_1 \\times m_2",
                  },
                  {
                    key: "1",
                    label: "分类加法独立通道",
                    formula: "N = m_1 + m_2",
                  },
                  {
                    key: "2",
                    label: "网格路径与标数法",
                    formula: "C_{m+n}^m",
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
