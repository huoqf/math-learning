import type { MathPanelData } from "../types";
import { solveBisection } from "@/math/function";
import { MATH_COLORS } from "@/theme";

export function buildFuncZeroPanel(
  params: Record<string, number>,
): MathPanelData {
  const m = params.intervalM ?? -1.0;
  const n = params.intervalN ?? 2.5;
  const steps = Math.max(1, Math.round(params.bisectionSteps ?? 3));

  const targetFn = (x: number) => x * x * x - x - 2;
  const bisectionRes = solveBisection(targetFn, m, n, steps);

  const quantities: MathPanelData["quantities"] = [
    { label: "研究区间", value: `[${m.toFixed(1)}, ${n.toFixed(1)}]` },
    {
      label: "迭代次数 Step",
      symbol: "k",
      value: steps,
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "近似零点根",
      symbol: "x*",
      value: Number.isFinite(bisectionRes.approxRoot)
        ? bisectionRes.approxRoot.toFixed(4)
        : "未收敛",
      color: MATH_COLORS.function,
    },
    {
      label: "最大误差界",
      symbol: "ε",
      value: Number.isFinite(bisectionRes.errorBound)
        ? `±${bisectionRes.errorBound.toFixed(4)}`
        : "未知",
      color: MATH_COLORS.paramSecondary,
    },
    {
      label: "零点定理满足",
      value: bisectionRes.hasZero ? "满足 (f(a)·f(b) < 0)" : "不满足同号",
      highlight: bisectionRes.hasZero ? "extreme" : "negative",
    },
  ];

  const theorems: MathPanelData["theorems"] = [
    {
      name: "零点存在性定理 (Bolzano 定理)",
      latex:
        "f(a) \\cdot f(b) < 0 \\implies \\exists c \\in (a, b), \\, f(c) = 0",
      level: "core",
      prerequisites: ["f(x) 在 [a, b] 上连续"],
    },
    {
      name: "二分法误差缩小公式",
      latex: "|x^* - x_k| \\le \\frac{b - a}{2^k}",
      level: "important",
      prerequisites: ["迭代 k 次", "每步区间长度减半"],
    },
  ];

  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
    {
      text: "零点定理注意事项：定理只是\u201C充分条件\u201D而非\u201C必要条件\u201D！若 f(a)·f(b) > 0，在 (a, b) 内仍可能有偶数个零点；若 f(x) 不连续，异号也不一定有零点。",
      importance: "gaokao",
    },
    {
      text: "单调函数零点唯一性：若连续函数 f(x) 在 [a, b] 上单调且 f(a)·f(b) < 0，则在 (a, b) 上有且仅有一个零点。",
      importance: "gaokao",
    },
  ];

  const warnings: MathPanelData["warnings"] = [];
  if (bisectionRes.warningMessage) {
    warnings.push({
      text: bisectionRes.warningMessage,
      level: "warning",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic: "连续异号有零点，二分切半误差减；单调保证唯一根。",
  };
}
