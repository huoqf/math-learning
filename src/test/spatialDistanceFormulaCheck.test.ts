import { describe, it, expect } from "vitest";
import katex from "katex";
import { solidDistanceMeta } from "@/data/registries/solidGeometry";
import { buildSpatialDistancePanel } from "@/data/builders/solidSpatialDistance";
import {
  getSpatialDistancePresets,
  getSpatialDistanceTip,
  type DistanceMode,
} from "@/features/solidGeometry/spatialDistancePresets";

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

  // SSOT：模式与典型情景清单直接取自页面模块，测试侧不得另抄一份 key 清单
  const DISTANCE_MODES: DistanceMode[] = [
    "skewDistance",
    "pointPlaneDistance",
    "volumeExtrema",
  ];
  const PROBE_OPTIMAL = { lambda: 0.5, mu: 0.4 };
  const modes = DISTANCE_MODES.map((mode) => ({
    mode,
    presets: getSpatialDistancePresets(mode, PROBE_OPTIMAL).map((p) => p.key),
  }));

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
    // 直接引用页面模块的同一份文案（SSOT），杜绝"测试内复制一份文案"的假覆盖：
    // 历史上此处曾硬编码三份旧文案，源文案几经改写后测试仍全绿。
    for (const { mode, presets } of modes) {
      for (const preset of presets) {
        validateMixedText(
          getSpatialDistanceTip(mode, preset),
          `TipCard[${mode}/${preset}]`,
        );
      }
    }
  });

  it("推导步骤严格符合高中数学工程落地规范（无裸代码代号、无超长单行未折行连缀等式）", () => {
    const testParams = { a: 3, b: 2, c: 2, lambda: 0.5, mu: 0.4 };
    for (const { mode, presets } of modes) {
      for (const preset of presets) {
        const panel = buildSpatialDistancePanel(testParams, { mode, preset });
        if (!panel.reasoningSteps) continue;

        for (const s of panel.reasoningSteps) {
          // 1. 严格禁止裸文本代码代号（必须用 LaTeX 包裹）
          if (s.detail) {
            expect(s.detail).not.toMatch(/\bvecPQ\b/);
            expect(s.detail).not.toMatch(/\bBB₁\b/);
          }
          // 2. 采分点必须明确标注
          expect(s.rubric).toBeDefined();
          expect(s.rubric?.length).toBeGreaterThan(5);

          // 3. 检查单行等号数量：单行内等号不得超过 2 个（超过必须使用 \\ 换行）
          if (s.latex) {
            const rawLines = s.latex.split(/\\\\/g);
            for (const line of rawLines) {
              const equalsCount = (line.match(/=/g) || []).length;
              expect(
                equalsCount,
                `[${mode}/${preset}] Step ${s.step} 单行内等号数量过多(${equalsCount})，应分行对齐: "${line.trim()}"`,
              ).toBeLessThanOrEqual(2);
            }
          }
        }
      }
    }
  });
});
