import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  LeftPanel,
  LeftPanelSection,
  TabSwitcher,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { SequenceScene } from "./components/SequenceScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/sequence";
import { calcArithmeticSequence } from "@/math/sequence";

export function ArithmeticPage() {
  const [arithmeticSubMode, setArithmeticSubMode] = useState<
    "linear" | "gauss" | "quadratic" | "segment" | "absSum"
  >("linear");
  const [highlightN, setHighlightN] = useState<number>(1);
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const a1 = params.a1 ?? 5;
  const d = params.d ?? -1.5;
  const N = Math.max(4, Math.min(12, Math.round(params.N ?? 8)));
  const kSegment = params.kSegment ?? 3;

  const { xRange, yRange } = useMemo(() => {
    const res = calcArithmeticSequence(a1, d, N, kSegment);
    const allAn = res.terms.map((t) => t.an);
    const allSn = res.terms.map((t) => t.Sn);
    const allTn = res.terms.map((t) => t.Tn);

    const minAn = Math.min(0, ...allAn);
    const maxAn = Math.max(0, ...allAn);
    const minSn = Math.min(0, ...allSn);
    const maxSn = Math.max(0, ...allSn);
    const maxTn = Math.max(0, ...allTn);

    const xR: [number, number] = [-0.8, N + 0.8];
    let yR: [number, number] = [-6, 10];

    if (arithmeticSubMode === "linear") {
      yR = [Math.floor(minAn - 1.5), Math.ceil(maxAn + 1.5)];
    } else if (arithmeticSubMode === "gauss") {
      const sumH = a1 + (res.terms[N - 1]?.an ?? 0);
      const minH = Math.min(0, ...allAn, sumH);
      const maxH = Math.max(0, ...allAn, sumH);
      yR = [Math.floor(minH - 1.2), Math.ceil(maxH + 2.5)];
    } else if (arithmeticSubMode === "quadratic") {
      const vertexY =
        res.continuousAxis !== null ? res.parabolaFn(res.continuousAxis) : 0;
      const minY = Math.min(0, minSn, vertexY);
      const maxY = Math.max(0, maxSn, vertexY);
      yR = [Math.floor(minY - 2.0), Math.ceil(maxY + 2.5)];
    } else if (arithmeticSubMode === "segment") {
      yR = [Math.floor(minAn - 1.5), Math.ceil(maxAn + 3.0)];
    } else if (arithmeticSubMode === "absSum") {
      const minY = Math.min(0, minAn, minSn);
      const maxY = Math.max(0, maxTn);
      yR = [Math.floor(minY - 1.5), Math.ceil(maxY + 2.0)];
    }

    if (yR[1] - yR[0] < 6) {
      const mid = (yR[0] + yR[1]) / 2;
      yR = [Math.floor(mid - 3), Math.ceil(mid + 3)];
    }

    return { xRange: xR, yRange: yR };
  }, [a1, d, N, kSegment, arithmeticSubMode]);

  const scale = useSceneScale({ vp, xRange, yRange });

  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-sequence", params, {
        activeMode: "arithmetic",
        arithmeticSubMode,
        geometricViewType: "points",
        modelType: "arith-geo",
        subModel: "arith-geo",
      }),
    [params, arithmeticSubMode],
  );

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      linear: ["a1", "d", "N"],
      gauss: ["a1", "d", "N", "gaussRatio"],
      quadratic: ["a1", "d", "N"],
      segment: ["a1", "d", "N", "kSegment"],
      absSum: ["a1", "d", "N"],
    };

    const keys = keysByMode[arithmeticSubMode] ?? ["a1", "d", "N"];
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
  }, [params, arithmeticSubMode]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  // 切换子模式时提供针对该教学目标的经典适配参数
  const handleModeChange = (mode: typeof arithmeticSubMode) => {
    setArithmeticSubMode(mode);
    if (mode === "gauss" && (params.d ?? -1) <= 0) {
      setParams((prev) => ({ ...prev, a1: 1, d: 1, N: 6, gaussRatio: 1 }));
    } else if (mode === "quadratic" && (params.d ?? 1) >= 0) {
      setParams((prev) => ({ ...prev, a1: 5, d: -1.5, N: 8 }));
    } else if (
      mode === "segment" &&
      Math.floor((params.N ?? 8) / (params.kSegment ?? 3)) < 2
    ) {
      setParams((prev) => ({ ...prev, N: 8, kSegment: 3 }));
    } else if (mode === "absSum" && (params.d ?? 1) >= 0) {
      setParams((prev) => ({ ...prev, a1: 5, d: -1.5, N: 8 }));
    }
  };

  // 左屏教学提示与题设导引（按子模型差异化地说明初始条件与探究设问，内联符号严格包裹 $...$）
  const tipConfig = useMemo(() => {
    const common = `等差数列 $a_1 = ${a1}$，公差 $d = ${d}$，前 $N = ${N}$ 项。`;
    switch (arithmeticSubMode) {
      case "linear":
        return {
          variant: "primary" as const,
          badge: "核心基准 · 通项是一次函数",
          condition: common,
          question:
            "通项 $a_n = a_1 + (n-1)d$ 在坐标图上为何离散点均精确落在同一直线上？",
        };
      case "gauss":
        return {
          variant: "primary" as const,
          badge: "高考经典 · 高斯倒序相加",
          condition:
            common +
            " 正序柱与倒序柱扣合，首末项配对 $(a_1 + a_n) \\times n$。",
          question:
            "高斯几何拼图为何能把 $n$ 个阶梯柱的面积和转化为一个完整长方形的一半？",
        };
      case "quadratic":
        return {
          variant: "warning" as const,
          badge: "高考难点 · 前 n 项和二次函数最值",
          condition:
            common +
            " 前 $n$ 项和 $S_n = \\frac{d}{2}n^2 + (a_1 - \\frac{d}{2})n$ 是过原点的二次函数。",
          question:
            "公差 $d < 0$ 时抛物线开口向下，如何结合连续对称轴 $x_0$ 与离散变号项确定 $S_n$ 最大值？",
        };
      case "segment":
        return {
          variant: "info" as const,
          badge: "高考综合 · 等长片段和成等差",
          condition:
            common + ` 按每组 $k = ${kSegment}$ 项连续分段，考察连续片段和。`,
          question:
            "连续等长片段和 $S_k, S_{2k}-S_k, S_{3k}-S_{2k}$ 为何仍成等差数列，新公差与 $d$ 有何代数联系？",
        };
      case "absSum":
        return {
          variant: "warning" as const,
          badge: "核心考点 · 绝对值和折线几何",
          condition: common,
          question:
            "求 $|a_n|$ 前 $n$ 项和 $T_n$ 时，折线在变号零点 $x_0$ 处的斜率增量如何从负变正？",
        };
      default:
        return {
          variant: "info" as const,
          badge: "等差数列探究",
          condition: common,
          question:
            "探究等差数列通项公式 $a_n$ 与前 $n$ 项和 $S_n$ 之间离散与连续二次函数最值的对应关系。",
        };
    }
  }, [arithmeticSubMode, a1, d, N, kSegment]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection
            title="教学与新高考专题"
            subtitle="选择数形结合核心认知模型"
          >
            <TabSwitcher
              tabs={[
                { key: "linear", label: "一次函数" },
                { key: "gauss", label: "高斯拼图" },
                { key: "quadratic", label: "二次最值" },
                { key: "segment", label: "片段和" },
                { key: "absSum", label: "绝对值和" },
              ]}
              value={arithmeticSubMode}
              onChange={(val) =>
                handleModeChange(val as typeof arithmeticSubMode)
              }
            />
          </LeftPanelSection>
          <LeftPanelSection
            title="参数调节"
            subtitle="拖动滑块实时观察几何变化"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() => setParams({ ...defaultParams })}
            />
          </LeftPanelSection>

          {/* 教学提示与题设导引（置于最底部） */}
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
            activeMode="arithmetic"
            arithmeticSubMode={arithmeticSubMode}
            highlightN={highlightN}
            onSelectN={setHighlightN}
          />
        </AnimationSvgCanvas>
      }
      right={<MathPanel {...mathData} title="等差数列看板" />}
    />
  );
}
