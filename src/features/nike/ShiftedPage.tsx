import { useState, useMemo, useCallback } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  TipCard,
} from "@/components/UI";
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { NikeScene } from "./components/NikeScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/nike";

export function ShiftedPage() {
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
    a: 1.0,
    b: 4.0,
    h: 1.0,
    c: 2.0,
    x0: 3.0,
  }));

  const [preset, setPreset] = useState<string>("shifted_quad");

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });
  const scale = useSceneScale({ vp, xRange: [-6, 6], yRange: [-4.5, 4.5] });

  const mathData = useMemo(
    () => buildMathQuantities("anim-nike", params, { activeMode: "shifted" }),
    [params],
  );

  const equationLatex = useMemo(() => {
    const { a, b, h, c } = params;
    const colA = `\\color{${MATH_COLORS.paramPrimary}}{${a.toFixed(1)}}`;
    const colB = `\\color{${MATH_COLORS.paramSecondary}}{${Math.abs(b).toFixed(1)}}`;
    const colH = `\\color{${MATH_COLORS.paramTertiary}}{${Math.abs(h).toFixed(1)}}`;
    const colC = `\\color{${MATH_COLORS.paramTertiary}}{${Math.abs(c).toFixed(1)}}`;

    const hPart =
      Math.abs(h) < 1e-4 ? "x" : h > 0 ? `(x - ${colH})` : `(x + ${colH})`;

    const fracSign = b >= 0 ? "+" : "-";
    const fracTerm = `${fracSign} \\frac{${colB}}{${hPart}}`;

    if (Math.abs(a) < 1e-4) {
      if (Math.abs(c) < 1e-4) {
        return b >= 0
          ? `y = \\frac{${colB}}{${hPart}}`
          : `y = -\\frac{${colB}}{${hPart}}`;
      }
      const cSigned = c > 0 ? colC : `-${colC}`;
      return `y = ${cSigned} ${fracTerm}`;
    }

    const aTerm = `${colA}${hPart}`;
    const cTerm = Math.abs(c) < 1e-4 ? "" : c > 0 ? `+ ${colC}` : `- ${colC}`;

    return `y = ${aTerm} ${cTerm} ${fracTerm}`.replace(/\s+/g, " ");
  }, [params.a, params.b, params.h, params.c]);

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keys = ["a", "b", "h", "c", "x0"];
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
          group: meta.group,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params]);

  const handleParamChange = useCallback((key: string, value: number) => {
    setPreset("free");
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handlePresetChange = (key: string) => {
    setPreset(key);
    if (key === "shifted_quad") {
      setParams((p) => ({ ...p, a: 1.0, b: 4.0, h: 1.0, c: 2.0, x0: 3.0 }));
    } else if (key === "shifted_linear") {
      setParams((p) => ({ ...p, a: 0.0, b: 3.0, h: 2.0, c: 1.0, x0: 4.0 }));
    } else if (key === "shifted_streamer") {
      setParams((p) => ({ ...p, a: 1.0, b: -4.0, h: 2.0, c: 0.0, x0: 4.0 }));
    }
  };

  // 图例配置：严格区分斜渐近线与水平渐近线
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    const { a, b, h, c } = params;
    const isNike = a * b > 0;
    const isLinear = Math.abs(a) < 1e-4;

    const asymptoteItem: SceneLegendItem = isLinear
      ? {
          label: `水平渐近线 y = ${c.toFixed(1)}`,
          color: MATH_COLORS.asymptote,
          style: "dash",
        }
      : {
          label: `斜渐近线 y = ${a.toFixed(1)}(x - ${h.toFixed(1)}) + ${c.toFixed(1)}`,
          color: MATH_COLORS.asymptote,
          style: "dash",
        };

    return [
      {
        label: isNike
          ? "平移对勾曲线"
          : a * b < 0
            ? "平移飘带曲线"
            : "平移退化曲线",
        color: isNike
          ? MATH_COLORS.function
          : a * b < 0
            ? MATH_COLORS.functionTransformed
            : MATH_COLORS.degeneracy,
        style: "solid",
      },
      {
        label: `垂直渐近线 x = ${h.toFixed(1)}`,
        color: MATH_COLORS.asymptote,
        style: "dash",
      },
      asymptoteItem,
      {
        label: `对称中心 C(${h.toFixed(1)}, ${c.toFixed(1)})`,
        color: MATH_COLORS.focusPoint,
        style: "point",
      },
    ];
  }, [params]);

  // 教学导引动态特化
  const tipConfig = useMemo(() => {
    const { a, b, h, c } = params;
    if (Math.abs(a) < 1e-4 || preset === "shifted_linear") {
      return {
        variant: "warning" as const,
        badge: "高考模型 · 分式线性反比例平移",
        condition: (
          <span>
            满足参数 <KatexFormula formula="a = 0" mode="inline" />
            ，对称中心为{" "}
            <KatexFormula
              formula={`C(${h.toFixed(1)}, ${c.toFixed(1)})`}
              mode="inline"
            />
            ，垂直渐近线{" "}
            <KatexFormula formula={`x = ${h.toFixed(1)}`} mode="inline" />
            ，水平渐近线{" "}
            <KatexFormula formula={`y = ${c.toFixed(1)}`} mode="inline" />。
          </span>
        ),
        question:
          "(1) 求反比例平移函数的单调递减区间；(2) 探究曲线上的动点 P 到两条垂直渐近线距离乘积的定值性。",
      };
    }
    if (a * b < 0 || preset === "shifted_streamer") {
      return {
        variant: "primary" as const,
        badge: "高考模型 · 二次分式双曲飘带",
        condition: (
          <span>
            满足系数异号 <KatexFormula formula="ab < 0" mode="inline" />
            ，定义域去心{" "}
            <KatexFormula formula={`x \\ne ${h.toFixed(1)}`} mode="inline" />
            ，对称中心为{" "}
            <KatexFormula
              formula={`C(${h.toFixed(1)}, ${c.toFixed(1)})`}
              mode="inline"
            />
            。
          </span>
        ),
        question:
          "(1) 求导分析导数恒号性质，判定全域单调性；(2) 探究方程 f(x) = m 的实根个数与零点存在性分布。",
      };
    }
    return {
      variant: "primary" as const,
      badge: "高考模型 · 二次分式化归平移对勾",
      condition: (
        <span>
          满足同号 <KatexFormula formula="ab > 0" mode="inline" />
          ，对称中心为{" "}
          <KatexFormula
            formula={`C(${h.toFixed(1)}, ${c.toFixed(1)})`}
            mode="inline"
          />
          ，令{" "}
          <KatexFormula formula={`u = x - ${h.toFixed(1)}`} mode="inline" />{" "}
          可化为标准对勾模型。
        </span>
      ),
      question:
        "(1) 设 u = x - h，求函数在 (h, +∞) 上的极小值点坐标与极小值；(2) 证明两极值点连线中点恒与中心点 C 重合。",
    };
  }, [params, preset]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 高考典型真题预设 */}
          <LeftPanelSection title="模型预设">
            <SelectGrid
              items={[
                {
                  key: "shifted_quad",
                  label: "二次分式对勾型",
                  description: "分离常数化对勾模型 (ab > 0)",
                },
                {
                  key: "shifted_linear",
                  label: "分式线性平移型",
                  description: "反比例平移双曲线 (a = 0)",
                },
                {
                  key: "shifted_streamer",
                  label: "二次分式飘带型",
                  description: "分离常数化飘带模型 (ab < 0)",
                  fullWidth: true,
                },
              ]}
              value={preset}
              onChange={handlePresetChange}
              columns={2}
            />
          </LeftPanelSection>

          {/* 2. 参数调节 */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() => {
                setPreset("shifted_quad");
                setParams({
                  ...defaultParams,
                  a: 1.0,
                  b: 4.0,
                  h: 1.0,
                  c: 2.0,
                  x0: 3.0,
                });
              }}
            />
          </LeftPanelSection>

          {/* 3. 教学导引 */}
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
        <div className="w-full h-full relative flex flex-col bg-white overflow-hidden">
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={equationLatex} mode="inline" />
          </div>
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <NikeScene
              params={params}
              scale={scale}
              vp={vp}
              activeMode="shifted"
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
            />
          </AnimationSvgCanvas>
          <SceneLegend items={legendItems} />
        </div>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          reasoningSteps={mathData.reasoningSteps}
          title="平移双曲线看板"
        />
      }
    />
  );
}
