import { describe, it } from "vitest";
import katex from "katex";
import { solidDistanceMeta } from "@/data/registries/solidGeometry";
import { buildSpatialDistancePanel } from "@/data/builders/solidSpatialDistance";

function validateLatex(formula: string, context: string) {
  try {
    katex.renderToString(formula, {
      throwOnError: true,
      displayMode: false,
      strict: false,
    });
  } catch (err) {
    throw new Error(
      `[KaTeX 校验失败] 位于 ${context}: 公式 "${formula}" 报错: ${(err as Error).message}`,
    );
  }
}

function validateMixedText(text: string, context: string) {
  if (!text.includes("$")) return;
  const parts = text.split(/(\$[^$]+\$)/g);
  for (const part of parts) {
    if (part.startsWith("$") && part.endsWith("$")) {
      const formula = part.slice(1, -1).trim();
      if (formula) {
        validateLatex(formula, `${context} (混合文本 "${part}")`);
      }
    }
  }
}

describe("空间距离页面左右屏所有 LaTeX 公式合法性全量检测", () => {
  it("左屏 ParamControl 参数标签与 marks 的 KaTeX 公式全部合法", () => {
    for (const meta of solidDistanceMeta) {
      if (meta.labelFormula) {
        validateLatex(
          meta.labelFormula,
          `solidDistanceMeta[${meta.key}].labelFormula`,
        );
      }
      if (meta.marks) {
        for (const mark of meta.marks) {
          if (mark.labelFormula) {
            validateLatex(
              mark.labelFormula,
              `solidDistanceMeta[${meta.key}].mark[${mark.value}]`,
            );
          }
        }
      }
    }
  });

  const modes = [
    {
      mode: "skewDistance",
      presets: ["free", "cube", "sideEdge", "goldenPerp"],
    },
    {
      mode: "pointPlaneDistance",
      presets: ["free", "cubeThird", "midSection"],
    },
    { mode: "volumeExtrema", presets: ["free", "maxVolume", "midVolume"] },
  ];

  it("右屏 MathPanel 的所有模式与典型情景下，所有公式与混合文本全部合法", () => {
    const testParams = { a: 3, b: 2, c: 2, lambda: 0.5, mu: 0.4 };

    for (const { mode, presets } of modes) {
      for (const preset of presets) {
        const panel = buildSpatialDistancePanel(testParams, { mode, preset });

        // 1. 检查 quantities
        for (const q of panel.quantities) {
          if (q.symbol) {
            validateLatex(
              q.symbol,
              `[${mode}/${preset}] quantity.symbol: ${q.label}`,
            );
          }
        }

        // 2. 检查 theorems
        for (const t of panel.theorems) {
          if (t.latex) {
            validateLatex(
              t.latex,
              `[${mode}/${preset}] theorem.latex: ${t.name}`,
            );
          }
          if (t.note) {
            validateMixedText(
              t.note,
              `[${mode}/${preset}] theorem.note: ${t.name}`,
            );
          }
          if (t.condition) {
            validateMixedText(
              t.condition,
              `[${mode}/${preset}] theorem.condition: ${t.name}`,
            );
          }
        }

        // 3. 检查 reasoningSteps
        if (panel.reasoningSteps) {
          for (const s of panel.reasoningSteps) {
            if (s.latex) {
              validateLatex(
                s.latex,
                `[${mode}/${preset}] reasoningStep[${s.step}].latex`,
              );
            }
            if (s.detail) {
              validateMixedText(
                s.detail,
                `[${mode}/${preset}] reasoningStep[${s.step}].detail`,
              );
            }
          }
        }

        // 4. 检查 gaokaoPoints
        for (const g of panel.gaokaoPoints) {
          validateMixedText(g.text, `[${mode}/${preset}] gaokaoPoint.text`);
        }

        // 5. 检查 warnings
        for (const w of panel.warnings) {
          validateMixedText(w.text, `[${mode}/${preset}] warning.text`);
        }
      }
    }
  });

  it("左屏 TipCard 中的题设设问文本中的所有 $...$ 公式全部合法", () => {
    const tipTexts = [
      "【初始条件】在直棱柱/长方体 $ABCD-A_1B_1C_1D_1$ 中，动点 $P$ 在异面直线 $l_1$ 上移动，动点 $Q$ 在异面直线 $l_2$ 上移动。\n\n【核心设问】\n(1) 动线段 $PQ$ 的长度在何时取得最小值？证明此时线段 $PQ$ 垂直于两直线且恰为公垂线段；\n(2) 如何过直线 $AC$ 作平行于 $A_1B$ 的截面，将异面直线距离转化为线面距离与点面距离？",
      "【初始条件】长方体底面尺寸为 $a, b$，侧棱高为 $c$，动点 $E$ 在侧棱 $AA_1$ 上滑动（$AE = \\lambda c$）。\n\n【核心设问】\n(1) 建立空间直角坐标系，求平面 $BDE$ 的法向量 $\\vec{n}$ 与原点 $A$ 到平面的垂线距离 $d$；\n(2) 利用三棱锥等体积公式 $V_{A-BDE} = V_{E-ABD}$ 反求高线 $d$，验证向量法与等体积法的对账一致性。",
      "【初始条件】三棱锥 $E-ABD$ 的底面 $\\triangle ABD$ 位于长方体底面，顶点 $E$ 沿棱 $AA_1$ 滑动。\n\n【核心设问】\n(1) 探究当分点比例 $\\lambda$ 为何值时，三棱锥的体积取得最大值？\n(2) 分析底面积不变情况下，棱锥体积与动点空间距离的单调性本质。",
    ];

    tipTexts.forEach((text, i) => {
      validateMixedText(text, `TipCard[${i}]`);
    });
  });
});
