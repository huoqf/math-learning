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
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  defaultParams,
  paramMeta,
} from "@/data/registries/probabilityDistribution";
import {
  computeBinomialDistribution,
  computeHypergeometricDistribution,
  computeGeneralDiscreteDistribution,
  computeLinearTransformedDistribution,
} from "@/math/probabilityDistribution";
import { ProbabilityDistributionScene } from "./components/ProbabilityDistributionScene";

export function ProbabilityDistributionAnimation() {
  // 研究模式：'binomial' | 'hypergeometric' | 'general' | 'linear'
  const [studyMode, setStudyMode] = useState<
    "binomial" | "hypergeometric" | "general" | "linear"
  >("binomial");

  // 参数状态保存
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 1. 视口尺寸测量与自适应
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 2. 参数改动处理 (带超几何分布参数联动防越界)
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "N") {
        next.M = Math.min(next.M, value);
        next.sampleN = Math.min(next.sampleN, value);
      }
      return next;
    });
  };

  const handleReset = () => {
    setParams({ ...defaultParams });
  };

  // 3. 计算数学模型分布结果
  const distResult = useMemo(() => {
    if (studyMode === "binomial") {
      return computeBinomialDistribution(params.n, params.p);
    }
    if (studyMode === "hypergeometric") {
      return computeHypergeometricDistribution(
        params.N,
        params.M,
        params.sampleN,
      );
    }
    if (studyMode === "linear") {
      return computeBinomialDistribution(params.n, params.p);
    }
    // 一般离散分布: p0, p1, p2 可自由调节，p3 = 1 - (p0+p1+p2) 自动概率归一化
    const sum3 = params.p1 + params.p2 + params.p3;
    const p0 = params.p1;
    const p1 = params.p2;
    const p2 = params.p3;
    const p3 = Math.max(0, Number((1 - sum3).toFixed(2)));

    return computeGeneralDiscreteDistribution([
      { x: 0, p: p0 },
      { x: 1, p: p1 },
      { x: 2, p: p2 },
      { x: 3, p: p3 },
    ]);
  }, [studyMode, params]);

  // 线性变换分布
  const transformedDist = useMemo(() => {
    if (studyMode === "linear") {
      return computeLinearTransformedDistribution(
        distResult,
        params.linearA,
        params.linearB,
      ).transformed;
    }
    return undefined;
  }, [studyMode, distResult, params.linearA, params.linearB]);

  // 4. 按预设分辨率 (840x650) 分配视口 (线性模式单独抬升画布基线 116px 并收紧 Y 轴 20%，防止与底部表格打架)
  const scale = useSceneScale({
    vp,
    xRange: [-1.2, 16.8],
    yRange: studyMode === "linear" ? [-0.92, 1.48] : [-0.35, 1.35],
    keepAspectRatio: false,
  });

  // 5. 右屏看板数据 (根据 studyMode 动态刷新)
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-probability-distribution", params, {
      studyMode,
      distResult,
      transformedDist,
    });
  }, [params, studyMode, distResult, transformedDist]);

  // 6. 按模式精准过滤左屏参数配置 (线性模式 n 限制在 2~8 保证节点适中清爽)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      binomial: ["n", "p"],
      hypergeometric: ["N", "M", "sampleN"],
      general: ["p1", "p2", "p3"], // 精简为前3项独立调节，第四项由公理自动闭合
      linear: ["n", "p", "linearA", "linearB"], // 线性变换模式: n∈[2,8] 支持 3~9 个节点演示
    };

    const keys = keysByMode[studyMode] || ["n", "p"];

    return keys
      .filter((key) => key in paramMeta)
      .map((key) => {
        const meta = paramMeta[key];
        let maxVal = meta.max;
        let minVal = meta.min;

        if (studyMode === "linear" && key === "n") {
          minVal = 2;
          maxVal = 8;
        }

        if (
          studyMode === "hypergeometric" &&
          (key === "M" || key === "sampleN")
        ) {
          maxVal = Math.min(meta.max, params.N);
        }

        return {
          key,
          label: meta.label,
          labelFormula: meta.labelFormula,
          value: params[key] ?? meta.defaultValue ?? 0,
          min: minVal,
          max: maxVal,
          step: meta.step ?? 0.1,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, studyMode]);

  // 当前主要模型的 KaTeX 悬浮公式 (优雅处理 b<0 的符号拼接，防止出现 + - 连写)
  const topFormulaLatex = useMemo(() => {
    if (studyMode === "binomial") {
      return `X \\sim B(${params.n}, ${params.p}) \\quad P(X=k) = C_{${
        params.n
      }}^k (${params.p})^k (${(1 - params.p).toFixed(2)})^{${params.n}-k}`;
    }
    if (studyMode === "hypergeometric") {
      return `X \\sim H(${params.N}, ${params.M}, ${params.sampleN}) \\quad P(X=k) = \\frac{C_{${params.M}}^k C_{${params.N - params.M}}^{${params.sampleN}-k}}{C_{${params.N}}^{${params.sampleN}}}`;
    }
    if (studyMode === "linear") {
      const aStr = params.linearA === 1 ? "" : `${params.linearA}`;
      const bVal = params.linearB;
      const bStr =
        bVal > 0 ? ` + ${bVal}` : bVal < 0 ? ` - ${Math.abs(bVal)}` : "";
      const exprY = `Y = ${aStr}X${bStr}`;
      return `${exprY} \\implies E(Y) = ${params.linearA} E(X) ${bStr}, \\; D(Y) = ${params.linearA}^2 D(X)`;
    }
    return `\\sum_{i=0}^3 p_i = 1 \\quad E(X) = \\sum x_i p_i = ${distResult.mean.toFixed(
      2,
    )}`;
  }, [studyMode, params, distResult]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择 */}
          <LeftPanelSection
            title="概率模型与性质"
            subtitle="选择高中高考核心随机变量模型"
          >
            <SelectGrid
              items={[
                { key: "binomial", label: "二项分布 B(n,p)" },
                { key: "hypergeometric", label: "超几何分布 H(N,M,n)" },
                { key: "general", label: "一般分布列" },
                { key: "linear", label: "线性变换 Y=aX+b" },
              ]}
              value={studyMode}
              onChange={(k) => setStudyMode(k)}
              variant="filled"
            />
          </LeftPanelSection>

          {/* 参数调节 */}
          <LeftPanelSection title="模型参数" subtitle="拖动滑块调节分布参数">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 左屏参数使用指南卡片 */}
          <LeftPanelSection
            title="参数使用指南"
            subtitle="模型参数含义与调节说明"
          >
            {studyMode === "binomial" && (
              <div className="bg-blue-50/80 border border-blue-200/90 rounded-xl p-3 text-xs text-blue-900 flex flex-col gap-1.5 shadow-sm">
                <div className="font-bold flex items-center gap-1.5 text-blue-800">
                  <span>⚙️</span>
                  <span>二项分布参数调节说明</span>
                </div>
                <ul className="leading-relaxed text-blue-800/90 list-disc list-inside space-y-1">
                  <li>
                    <strong>
                      试验次数 <KatexFormula formula="n" mode="inline" />
                    </strong>
                    ：独立重复试验总次数，控制取值点个数{" "}
                    <KatexFormula formula="k \in [0, n]" mode="inline" />。
                  </li>
                  <li>
                    <strong>
                      成功概率 <KatexFormula formula="p" mode="inline" />
                    </strong>
                    ：调节 <KatexFormula formula="p=0.5" mode="inline" />{" "}
                    呈对称分布，
                    <KatexFormula formula="p<0.5" mode="inline" />{" "}
                    概率集中在左侧，
                    <KatexFormula formula="p>0.5" mode="inline" /> 集中在右侧。
                  </li>
                </ul>
              </div>
            )}

            {studyMode === "hypergeometric" && (
              <div className="bg-indigo-50/80 border border-indigo-200/90 rounded-xl p-3 text-xs text-indigo-900 flex flex-col gap-1.5 shadow-sm">
                <div className="font-bold flex items-center gap-1.5 text-indigo-800">
                  <span>⚙️</span>
                  <span>超几何分布参数调节说明</span>
                </div>
                <ul className="leading-relaxed text-indigo-800/90 list-disc list-inside space-y-1">
                  <li>
                    <strong>
                      总体数 <KatexFormula formula="N" mode="inline" /> & 特征数{" "}
                      <KatexFormula formula="M" mode="inline" />
                    </strong>
                    ：总体中目标元素的比例决定了概率集中区。
                  </li>
                  <li>
                    <strong>
                      样本数{" "}
                      <KatexFormula formula="n_{\text{抽}}" mode="inline" />
                    </strong>
                    ：控制抽取数量。滑块已开启联动防越界（自动限制{" "}
                    <KatexFormula formula="M, n \le N" mode="inline" />
                    ）。
                  </li>
                </ul>
              </div>
            )}

            {studyMode === "general" && (
              <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-3 text-xs text-emerald-900 flex flex-col gap-1.5 shadow-sm">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <span>⚙️</span>
                  <span>一般分布列参数调节说明</span>
                </div>
                <ul className="leading-relaxed text-emerald-800/90 list-disc list-inside space-y-1">
                  <li>
                    <strong>前 3 项概率自由分配</strong>：拖动{" "}
                    <KatexFormula formula="P_0, P_1, P_2" mode="inline" />{" "}
                    滑块自定义分布形态。
                  </li>
                  <li>
                    <strong>自动闭合归一化</strong>：第四项{" "}
                    <KatexFormula
                      formula="P(X=3) = 1 - (P_0+P_1+P_2)"
                      mode="inline"
                    />{" "}
                    自动算齐补余，恒满足概率和为 1。
                  </li>
                </ul>
              </div>
            )}

            {studyMode === "linear" && (
              <div className="bg-purple-50/80 border border-purple-200/90 rounded-xl p-3 text-xs text-purple-900 flex flex-col gap-1.5 shadow-sm">
                <div className="font-bold flex items-center gap-1.5 text-purple-800">
                  <span>⚙️</span>
                  <span>线性变换参数调节说明</span>
                </div>
                <ul className="leading-relaxed text-purple-800/90 list-disc list-inside space-y-1">
                  <li>
                    <strong>
                      基准参数 <KatexFormula formula="n, p" mode="inline" />
                    </strong>
                    ：控制原变量 <KatexFormula formula="X" mode="inline" />{" "}
                    的节点数与形态。
                  </li>
                  <li>
                    <strong>
                      缩放 <KatexFormula formula="a" mode="inline" /> & 平移{" "}
                      <KatexFormula formula="b" mode="inline" />
                    </strong>
                    ：观察下轨道 <KatexFormula formula="Y=aX+b" mode="inline" />{" "}
                    节点的伸缩拉伸与整体平移。
                  </li>
                </ul>
              </div>
            )}
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative bg-white overflow-hidden">
          {/* 1. 顶部通透悬浮 HUD (KaTeX 公式 + 高考矩阵概览) */}
          <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-3 pointer-events-none">
            {/* 左侧：KaTeX 模型主公式卡片 */}
            <div className="bg-white/95 backdrop-blur-md border border-neutral-200/90 rounded-xl px-3.5 py-2 shadow-sm pointer-events-auto max-w-[62%]">
              <KatexFormula formula={topFormulaLatex} mode="inline" />
            </div>

            {/* 右侧：高考分布列校验概览 badge */}
            <div className="bg-white/95 backdrop-blur-md border border-neutral-200/90 rounded-xl px-3 py-1.5 shadow-sm pointer-events-auto flex items-center gap-2 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-neutral-500 font-bold">高考公理校验:</span>
              <span className="text-primary-700 font-bold">
                ∑P = {distResult.sumP.toFixed(3)}
              </span>
            </div>
          </div>

          {/* 2. 底部高考规范分布矩阵表 (在线性模式下呈现 X -> Y 规范对照矩阵) */}
          <div className="absolute bottom-3 left-4 right-4 z-10 bg-white/95 backdrop-blur-md border border-neutral-200/90 rounded-xl p-2.5 shadow-md flex flex-col gap-1 max-h-[140px] transition-all">
            <div className="text-[11px] font-bold text-neutral-700 flex items-center justify-between px-1">
              <span className="text-primary-800 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-600" />
                {studyMode === "linear"
                  ? "高考规范矩阵表 (X → Y 线性变换对照表)"
                  : "高考分布列规范矩阵表"}
              </span>
              <span className="text-[10px] text-neutral-400 font-normal">
                {studyMode === "linear"
                  ? "新变量 Y=aX+b 保持对应事件概率不变"
                  : "X 与 P(X=x) 规范对应表"}
              </span>
            </div>

            <div className="overflow-x-auto max-w-full">
              <table className="min-w-full text-center border-collapse bg-neutral-50/90 rounded border border-neutral-200 text-xs font-mono">
                <thead>
                  <tr className="bg-neutral-100/80 text-neutral-700 font-bold border-b border-neutral-200">
                    <th className="px-2.5 py-0.5 border-r border-neutral-200 text-primary-700 font-bold">
                      x_i
                    </th>
                    {distResult.outcomes.map((o) => (
                      <th
                        key={`th-x-${o.x}`}
                        className="px-2 py-0.5 border-r border-neutral-200 min-w-[32px]"
                      >
                        {o.x}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {studyMode === "linear" && (
                    <tr className="bg-amber-50/70 text-amber-900 font-bold border-b border-neutral-200">
                      <td className="px-2.5 py-0.5 font-bold text-amber-800 border-r border-neutral-200 bg-amber-100/60">
                        y_i
                      </td>
                      {distResult.outcomes.map((o) => (
                        <td
                          key={`td-y-${o.x}`}
                          className="px-2 py-0.5 border-r border-neutral-200 text-amber-900 font-bold"
                        >
                          {(params.linearA * o.x + params.linearB).toFixed(1)}
                        </td>
                      ))}
                    </tr>
                  )}
                  <tr>
                    <td className="px-2.5 py-0.5 font-bold text-primary-700 border-r border-neutral-200 bg-neutral-100/50">
                      P_i
                    </td>
                    {distResult.outcomes.map((o) => (
                      <td
                        key={`td-p-${o.x}`}
                        className="px-2 py-0.5 border-r border-neutral-200 text-neutral-600 font-medium"
                      >
                        {o.p.toFixed(3)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. SVG 自适应画布 占据 100% 中屏高度 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <ProbabilityDistributionScene
              distResult={distResult}
              transformedDist={transformedDist}
              studyMode={studyMode}
              scale={scale}
              vp={vp}
              fontScale={canvasSize.font}
              linearA={params.linearA}
              linearB={params.linearB}
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
          title={
            studyMode === "binomial"
              ? "二项分布 B(n,p) 指标看板"
              : studyMode === "hypergeometric"
                ? "超几何分布 H(N,M,n) 指标看板"
                : studyMode === "linear"
                  ? "线性变换 Y=aX+b 指标看板"
                  : "一般离散分布列指标看板"
          }
        />
      }
    />
  );
}
