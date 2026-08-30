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

  // 左屏教学提示与题设导引（按子模型差异化地说明初始条件与探究设问）
  const tipConfig = useMemo(() => {
    const common = `等差数列 a₁ = ${a1}，公差 d = ${d}，前 N = ${N} 项。`;
    switch (arithmeticSubMode) {
      case "linear":
        return {
          variant: "primary" as const,
          badge: "核心基准 · 通项是 x 的一次函数",
          condition: common,
          question:
            "通项 aₙ = a₁ + (n-1)d 在坐标图上为何恰好落于同一条直线上？",
        };
      case "gauss":
        return {
          variant: "primary" as const,
          badge: "高考经典 · 首尾配对求和",
          condition: common + " 首末项配对 (首项 + 末项) × 配对数。",
          question: "高斯配对法为何能把 N 项求和转化为 N/2 个相等的和？",
        };
      case "quadratic":
        return {
          variant: "warning" as const,
          badge: "高考难点 · 前 n 项和的二次最值",
          condition: common + " 前 n 项和 Sₙ 关于 n 是开口向上的二次函数。",
          question:
            "公差 d < 0 时，Sₙ 在何处取得最大值？如何由判别式与对称轴判断？",
        };
      case "segment":
        return {
          variant: "info" as const,
          badge: "高考综合 · 绝对值分段求和",
          condition:
            common + ` 先由 k = ${kSegment} 找出 aₙ 的变号临界项再分段求和。`,
          question: "求 |aₙ| 前 n 项和时，如何确定非负项与负项的分界项 n₀？",
        };
      case "absSum":
        return {
          variant: "warning" as const,
          badge: "核心考点 · 绝对值和的几何折线",
          condition: common,
          question: "｜aₙ｜前 n 项和 Tₙ 的折线在变号项处为何出现极小值尖点？",
        };
      default:
        return {
          variant: "info" as const,
          badge: "等差数列探究",
          condition: common,
          question: "观察 aₙ 与 Sₙ 的图象关系，体会通项到求和的桥梁作用。",
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
                setArithmeticSubMode(val as typeof arithmeticSubMode)
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
            <TipCard variant={tipConfig.variant}>
              <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1">
                <span>{tipConfig.badge}</span>
              </div>
              <div className="space-y-1 text-[11px] leading-relaxed">
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
                    【探究设问】
                  </span>
                  <span className="text-neutral-600">{tipConfig.question}</span>
                </div>
              </div>
            </TipCard>
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
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title="等差数列看板"
        />
      }
    />
  );
}
