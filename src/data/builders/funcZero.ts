import type { MathPanelData } from "../types";
import { solveBisection } from "@/math/function";
import { MATH_COLORS } from "@/theme";
import { FUNC_ZERO_MODELS } from "../registries/funcZero";

const MODEL_KEYS = ["cubic", "logMixed", "expMixed", "counterExample"];

export function buildFuncZeroPanel(
  params: Record<string, number>,
): MathPanelData {
  const modelIdx = Math.max(
    0,
    Math.min(MODEL_KEYS.length - 1, Math.round(params.modelKey ?? 0)),
  );
  const modelKey = MODEL_KEYS[modelIdx] ?? "cubic";
  const model = FUNC_ZERO_MODELS[modelKey] ?? FUNC_ZERO_MODELS.cubic;

  const m = params.intervalM ?? model.defaultM;
  const n = params.intervalN ?? model.defaultN;
  const steps = Math.max(1, Math.round(params.bisectionSteps ?? 3));

  const targetFn = model.fn;
  const bisectionRes = solveBisection(targetFn, m, n, steps);

  const fA = Number.isFinite(m) ? targetFn(m) : NaN;
  const fB = Number.isFinite(n) ? targetFn(n) : NaN;
  const prod = fA * fB;

  const currentLeft = bisectionRes.currentStep
    ? bisectionRes.currentStep.left
    : m;
  const currentRight = bisectionRes.currentStep
    ? bisectionRes.currentStep.right
    : n;

  const quantities: MathPanelData["quantities"] = [
    {
      label: "端点异号判定",
      symbol: "f(a) \\cdot f(b)",
      value: Number.isFinite(prod)
        ? prod < 0
          ? `${prod.toFixed(2)} < 0 (满足)`
          : prod > 0
            ? `${prod.toFixed(2)} > 0 (同号)`
            : "0 (含根)"
        : "无定义",
      highlight: bisectionRes.hasZero ? "extreme" : "negative",
    },
    {
      label: "当前收敛区间",
      symbol: `[a_{${steps}}, b_{${steps}}]`,
      value: bisectionRes.hasZero
        ? `[${currentLeft.toFixed(4)}, ${currentRight.toFixed(4)}]`
        : `[${m.toFixed(2)}, ${n.toFixed(2)}]`,
      color: MATH_COLORS.paramTertiary,
    },
    {
      label: "近似零点根",
      symbol: `x^* \\approx c_{${steps}}`,
      value: Number.isFinite(bisectionRes.approxRoot)
        ? bisectionRes.approxRoot.toFixed(4)
        : "未收敛",
      color: MATH_COLORS.function,
    },
    {
      label: "最大绝对误差",
      symbol: "\\varepsilon_k",
      value: Number.isFinite(bisectionRes.errorBound)
        ? `\\le ${bisectionRes.errorBound.toFixed(4)}`
        : "未知",
      color: MATH_COLORS.paramSecondary,
    },
    {
      label: "区间折半收缩率",
      symbol: "\\frac{1}{2^k}",
      value: `\\frac{1}{${Math.pow(2, steps)}} = ${(1 / Math.pow(2, steps)).toFixed(4)}`,
      color: MATH_COLORS.paramPrimary,
    },
  ];

  const theorems: MathPanelData["theorems"] = [
    {
      name: "零点存在性定理 (Bolzano 定理)",
      latex:
        "f(a) \\cdot f(b) < 0 \\implies \\exists c \\in (a, b), \\, f(c) = 0",
      level: "core",
      prerequisites: ["f(x) 在 [a, b] 上连续不断", "端点函数值严格异号"],
    },
    {
      name: "二分法误差收敛公式",
      latex: "|x^* - c_k| \\le \\frac{b - a}{2^k}",
      level: "important",
      prerequisites: [
        "迭代 k 次",
        "每步区间长度折半: l_k = \\frac{b - a}{2^k}",
      ],
    },
    {
      name: "单调函数零点唯一性",
      latex:
        "f(x) \\text{ 严格单调} \\land f(a)f(b) < 0 \\implies \\text{在 } (a, b) \\text{ 内有且仅有 1 个零点}",
      level: "core",
      prerequisites: ["函数在 [a, b] 上连续且严格单调"],
    },
  ];

  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
    {
      text: "【充分非必要辨析】f(a)·f(b) < 0 是连续函数存在零点的充分非必要条件。若同号 f(a)·f(b) > 0，区间内可能仍存在偶数个零点（见反例模型）。",
      importance: "gaokao",
    },
    {
      text: "【新高考指对混合模型】形如 ln x + 2x - 6 = 0 或 2^x + 3x - 7 = 0 的零点求解：先由增+增=增锁定严格单调性，再代入整数端点找到异号区间 [a, a+1]，最后二分逼近估值。",
      importance: "gaokao",
    },
    {
      text: "【数形转化通法】方程 f(x) = 0 的根 ⟺ 函数 y = f(x) 的零点 ⟺ 拆分曲线 y = g(x) 与 y = h(x) 的交点横坐标。",
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

  if (modelKey === "counterExample" && !bisectionRes.hasZero) {
    warnings.push({
      text: "当前端点同号 f(-1)>0, f(3)>0，不满足定理前提，但区间内实际有两个零点 x=0 与 x=2！印证定理只是充分条件。",
      level: "info",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic:
      "连续异号必有根，二分切半误差减；单调保证唯一解，同号反例莫等闲。",
  };
}
