import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { SequenceScene } from "./components/SequenceScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/sequence";

import {
  calcArithGeoSplit,
  calcAbsSumSequence,
  calcGroupedSequence,
} from "@/math/sequence";

type ModelType =
  "arith-geo" | "telescoping" | "abs-sum" | "grouped" | "odd-even";

export function ModelsPage() {
  const [modelType, setModelType] = useState<ModelType>("arith-geo");
  const [highlightN, setHighlightN] = useState<number>(1);
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const a1 = params.a1 ?? 5;
  const d = params.d ?? -1.5;
  const q = params.q ?? 0.5;
  const N = Math.max(4, Math.min(12, Math.round(params.N ?? 8)));
  const teleGap = params.teleGap ?? 1;

  const { xRange, yRange } = useMemo<{
    xRange: [number, number];
    yRange: [number, number];
  }>(() => {
    let xR: [number, number] = [-1, N + 1.5];
    let yR: [number, number] = [-4, 16];

    if (modelType === "arith-geo") {
      xR = [-1, N + 2];
      const res = calcArithGeoSplit(a1, d, q, N);
      const allVals = res.terms.flatMap((t) => [t.cn, t.cn * q, t.an, t.bn]);
      const minV = Math.min(0, ...allVals);
      const maxV = Math.max(3, ...allVals);
      yR = [Math.floor(minV - 1.5), Math.ceil(maxV + 2.5)];
      if (yR[1] - yR[0] < 6) yR = [yR[0], yR[0] + 6];
    } else if (modelType === "telescoping") {
      xR = [-1, N + 1.5];
      if (teleGap === 3) {
        const maxRad = Math.sqrt(N + 1);
        yR = [-Math.ceil(maxRad + 0.5), Math.ceil(maxRad + 1.5)];
      } else if (teleGap === 2) {
        yR = [-0.8, 1.2];
      } else {
        yR = [-1.2, 1.5];
      }
    } else if (modelType === "abs-sum") {
      const res = calcAbsSumSequence(a1, d, N);
      const zP = res.zeroPoint ?? 0;
      xR = [-1, Math.max(N + 1.5, Math.ceil(zP + 1.5))];
      const allVals = res.terms.flatMap((t) => [t.an, t.absAn]);
      const minV = Math.min(0, ...allVals);
      const maxV = Math.max(3, ...allVals);
      yR = [Math.floor(minV - 1.5), Math.ceil(maxV + 2.5)];
      if (yR[1] - yR[0] < 6) yR = [yR[0], yR[0] + 6];
    } else if (modelType === "grouped") {
      xR = [-1, N + 1.5];
      const res = calcGroupedSequence(a1, d, q, N);
      const allVals = res.terms.flatMap((t) => [t.an, t.bn, t.cn]);
      const minV = Math.min(0, ...allVals);
      const maxV = Math.max(3, ...allVals);
      yR = [Math.floor(minV - 2), Math.ceil(maxV + 3)];
      if (yR[1] - yR[0] < 6) yR = [yR[0], yR[0] + 6];
    } else if (modelType === "odd-even") {
      xR = [-1, N + 1.5];
      yR = [-(N + 2), N + 2];
    }

    return { xRange: xR, yRange: yR };
  }, [modelType, a1, d, q, N, teleGap]);

  const scale = useSceneScale({
    vp,
    xRange,
    yRange,
    keepAspectRatio: false,
  });

  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-sequence", params, {
        activeMode: "models",
        geometricViewType: "points",
        modelType,
        subModel: modelType,
      }),
    [params, modelType],
  );

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByModel: Record<ModelType, string[]> = {
      "arith-geo": ["a1", "d", "q", "N"],
      telescoping: ["N"],
      "abs-sum": ["a1", "d", "N"],
      grouped: ["a1", "d", "q", "N"],
      "odd-even": ["N"],
    };

    const keys = keysByModel[modelType] ?? ["N"];
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
          step: meta.step ?? 0.1,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, modelType]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const tipConfig = useMemo(() => {
    const a1 = params.a1 ?? 5;
    const d = params.d ?? -1.5;
    const q = params.q ?? 0.5;
    const N = Math.max(4, Math.min(12, Math.round(params.N ?? 8)));
    const common = `参数基准：$a_1 = ${a1}$，公差 $d = ${d}$，公比 $q = ${q}$，考察前 $N = ${N}$ 项。`;
    switch (modelType) {
      case "arith-geo":
        return {
          variant: "primary" as const,
          badge: "高考核心 · 差比数列错位相减法",
          condition:
            common +
            " 通项 $c_n = a_n \\cdot b_n = (a_1 + (n-1)d) \\cdot q^{n-1}$，求前 $n$ 项和 $T_n$。",
          question:
            "两式错位相减 $(1-q)T_n$ 后中间 $n-1$ 项如何转化为等比求和？如何规范讨论 $q=1$ 临界情形？",
        };
      case "telescoping":
        return {
          variant: "info" as const,
          badge: "巧算化简 · 裂项相消法",
          condition:
            "通项可拆裂为两项差 $\\frac{1}{n(n+\\Delta)} = \\frac{1}{\\Delta}(\\frac{1}{n} - \\frac{1}{n+\\Delta})$，各项首尾伸缩对消。",
          question:
            "裂项相消后正负抵消链条最终残留哪些首末项？跨度 $\\Delta$ 对残留项数有何决定性影响？",
        };
      case "abs-sum":
        return {
          variant: "warning" as const,
          badge: "分段讨论 · 绝对值变号求和",
          condition: `等差通项 $a_n = ${a1} + (n-1)(${d})$，求绝对值和 $T_n = \\sum_{k=1}^n |a_k|$ ($n = 1 \\dots ${N}$)。`,
          question:
            "如何由公差符号与变号零点 $x_0 = 1 - a_1/d$ 确定非负项与负项分界项 $n_0$，进而分段去绝对值？",
        };
      case "grouped":
        return {
          variant: "success" as const,
          badge: "分流转化 · 分组转化求和",
          condition:
            common + " 通项由等差与等比两项线性叠加 $c_n = a_n + b_n$。",
          question:
            "将通项拆为等差与等比两部分分别求和，如何联立等差前 $n$ 项和公式与等比前 $n$ 项和公式？",
        };
      case "odd-even":
        return {
          variant: "accent" as const,
          badge: "配对并项 · 奇偶并项求和",
          condition:
            "通项含符号交替因子 $(-1)^n$ 或奇偶分段定义，前 $n$ 项和需对项数 $n$ 的奇偶性分类讨论。",
          question:
            "当项数 $n$ 为偶数与奇数时，$T_n$ 表达式有何区别？相邻两两配对成组后公差或公比如何确定？",
        };
      default:
        return {
          variant: "primary" as const,
          badge: "高考核心求和模型",
          condition: common,
          question:
            "探究典型求和模型中离散通项与前 $n$ 项和 $T_n$ 之间的代数转化与裂相对消机理。",
        };
    }
  }, [modelType, params.a1, params.d, params.q, params.N]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection
            title="高考核心求和模型"
            subtitle="覆盖高考解答题必考求和思想与转化技巧"
          >
            <SelectGrid
              items={[
                {
                  key: "arith-geo",
                  label: "错位相减法",
                  description: "差比相乘型 (4步推导)",
                },
                {
                  key: "telescoping",
                  label: "裂项相消法",
                  description: "差1/差2跨项/根式",
                },
                {
                  key: "abs-sum",
                  label: "绝对值变号求和",
                  description: "零点分段/最值转折",
                },
                {
                  key: "grouped",
                  label: "分组转化求和",
                  description: "差比混合分流",
                },
                {
                  key: "odd-even",
                  label: "奇偶并项求和",
                  description: "摆动序列与配对",
                },
              ]}
              value={modelType}
              onChange={(val) => setModelType(val as ModelType)}
            />
          </LeftPanelSection>

          {/* 错位相减专属：推导步骤选择卡片 */}
          {modelType === "arith-geo" && (
            <LeftPanelSection
              title="推导演化步骤"
              subtitle="分步展示错位相减标准答题过程"
            >
              <SelectGrid
                items={[
                  {
                    key: "1",
                    label: "Step 1: 原式列出",
                    description: "列出原始求和表达式 Tₙ",
                  },
                  {
                    key: "2",
                    label: "Step 2: 乘公比错位",
                    description: "同乘 q 整体向右平移 1 格",
                  },
                  {
                    key: "3",
                    label: "Step 3: 两式相减",
                    description: "首项直落，中间等比，尾项带负号",
                  },
                  {
                    key: "4",
                    label: "Step 4: 求和化简",
                    description: "代入等比求和公式完成化简",
                  },
                ]}
                value={String(params.sumStep ?? 1)}
                onChange={(k) => handleParamChange("sumStep", Number(k))}
                columns={1}
              />
            </LeftPanelSection>
          )}

          {/* 裂项相消专属：裂项题型选择卡片 */}
          {modelType === "telescoping" && (
            <LeftPanelSection
              title="裂项相消题型"
              subtitle="覆盖新高考 3 大典型裂项构造"
            >
              <SelectGrid
                items={[
                  {
                    key: "1",
                    label: "标准差 1 型",
                    formula: "\\frac{1}{n(n+1)}",
                    description: "相邻抵消，留首尾各 1 项",
                  },
                  {
                    key: "2",
                    label: "跨项差 2 型",
                    formula: "\\frac{1}{n(n+2)}",
                    description: "提系数 1/2，留首尾各 2 项",
                  },
                  {
                    key: "3",
                    label: "根式有理化型",
                    formula: "\\frac{1}{\\sqrt{n}+\\sqrt{n+1}}",
                    description: "分子有理化，前后伸缩抵消",
                  },
                ]}
                value={String(params.teleGap ?? 1)}
                onChange={(k) => handleParamChange("teleGap", Number(k))}
                columns={1}
              />
            </LeftPanelSection>
          )}

          <LeftPanelSection
            title="数值参数调节"
            subtitle="拖动滑块探索参数对数列图像与求和的影响"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() => setParams({ ...defaultParams })}
            />
          </LeftPanelSection>

          <LeftPanelSection title="教学导引与题设背景" compact>
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
        <AnimationSvgCanvas
          containerRef={containerRef}
          transform={vp.transform}
        >
          <SequenceScene
            params={params}
            scale={scale}
            vp={vp}
            fontScale={canvasSize.font}
            activeMode="models"
            modelType={modelType}
            highlightN={highlightN}
            onSelectN={setHighlightN}
          />
        </AnimationSvgCanvas>
      }
      right={<MathPanel {...mathData} title="高考求和模型看板" />}
    />
  );
}
