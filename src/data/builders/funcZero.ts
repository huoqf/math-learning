import type { MathPanelData, ReasoningStep } from "../types";
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
      label: "中点截断误差",
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
      prerequisites: [
        "$f(x)$ 在 $[a, b]$ 上连续不断",
        "端点函数值严格异号 $f(a)f(b) < 0$",
      ],
    },
    {
      name: "二分法误差收敛公式",
      latex:
        "|x^* - c_k| \\le \\frac{b - a}{2^{k+1}}, \\quad |b_k - a_k| = \\frac{b - a}{2^k}",
      level: "important",
      prerequisites: [
        "迭代 $k$ 次",
        "每步区间长度折半: $l_k = \\frac{b - a}{2^k}$",
        "取区间中点作为近似根",
      ],
    },
    {
      name: "单调函数零点唯一性",
      latex:
        "f(x) \\text{ 严格单调} \\land f(a)f(b) < 0 \\implies \\text{在 } (a, b) \\text{ 内有且仅有 1 个零点}",
      level: "core",
      prerequisites: ["函数在 $[a, b]$ 上连续且严格单调"],
    },
  ];

  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
    {
      text: "【充分非必要辨析】$f(a) \\cdot f(b) < 0$ 是连续函数存在零点的充分非必要条件。若端点同号 $f(a) \\cdot f(b) > 0$，区间内可能仍存在偶数个零点（见反例模型）。",
      importance: "gaokao",
    },
    {
      text: "【二分法适用范围红线】二分法仅适用于求【变号零点】（零点两侧函数值异号）。对于【不变号零点】（如 $f(x)=(x-1)^2$ 在 $x=1$ 处切于 $x$ 轴但不穿过），二分法无法通过异号缩小区间，方法失效！",
      importance: "gaokao",
    },
    {
      text: "【新高考指对混合模型】形如 $\\ln x + 2x - 6 = 0$ 或 $2^x + 3x - 7 = 0$ 的零点求解：先由增函数加增函数锁定严格单调性，再代入整数端点找到异号区间 $[a, a+1]$，最后二分逼近估值。",
      importance: "gaokao",
    },
    {
      text: "【数形转化通法】方程 $f(x) = 0$ 的根 $\\iff$ 函数 $y = f(x)$ 的零点 $\\iff$ 拆分曲线 $y = g(x)$ 与 $y = h(x)$ 的交点横坐标。",
      importance: "core",
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
      text: "当前端点同号 $f(-1)>0, f(3)>0$，不满足定理前提，但区间内实际有两个零点 $x=0$ 与 $x=2$！印证定理只是充分条件而非必要条件。",
      level: "info",
    });
  }

  warnings.push({
    text: "二分法局限性提示：二分法仅能求解变号零点；若图象在零点处不变号（与 $x$ 轴相切），二分区间无法判定缩向，不可使用二分法。",
    level: "info",
  });

  // 破题推演链（高中数学解答题标准答题闭环）
  const reasoningSteps: ReasoningStep[] = [
    {
      step: 1,
      title: "审题定法 · 确定区间与单调性",
      rubric: "采分点：检验定义域与图象连续性，指出单调性（2分）",
      latex: `f(x) = ${model.formula.replace(" = 0", "")} \\quad x \\in [${m.toFixed(1)}, ${n.toFixed(1)}]`,
      detail: `函数在初始闭区间 $[${m.toFixed(1)}, ${n.toFixed(1)}]$ 上连续不断，具备运用零点存在性定理的基础前提。`,
    },
    {
      step: 2,
      title: "定理验证 · 检验端点函数值异号",
      rubric: "采分点：代入端点计算函数值并验证 f(a)·f(b) < 0（4分）",
      latex: `f(${m.toFixed(1)}) = ${Number.isFinite(fA) ? fA.toFixed(2) : "\\text{无定义}"}, \\quad f(${n.toFixed(1)}) = ${Number.isFinite(fB) ? fB.toFixed(2) : "\\text{无定义}"} \\implies f(a) \\cdot f(b) ${prod < 0 ? "< 0" : "> 0"}`,
      detail:
        prod < 0
          ? `由 $f(a) \\cdot f(b) < 0$，由零点存在性定理知区间 $(${m.toFixed(1)}, ${n.toFixed(1)})$ 内必存在零点。结合严格单调性，零点唯一。`
          : `当前端点同号 $f(a) \\cdot f(b) > 0$，不满足定理前提，无法启动标准二分缩小流程。`,
    },
    {
      step: 3,
      title: "二分迭代 · 逐次折半收缩误差",
      rubric: "采分点：写出中点坐标与新区间更替逻辑，输出近似值与误差界（4分）",
      latex: bisectionRes.hasZero
        ? `c_{${steps}} = ${bisectionRes.approxRoot.toFixed(4)}, \\quad |x^* - c_{${steps}}| \\le ${bisectionRes.errorBound.toFixed(4)}`
        : `\\text{端点未异号，未收敛}`,
      detail: bisectionRes.hasZero
        ? `经过 $k = ${steps}$ 步折半迭代，当前锁定区间为 $[${currentLeft.toFixed(4)}, ${currentRight.toFixed(4)}]$，取区间中点作为近似根 $x^* \\approx ${bisectionRes.approxRoot.toFixed(4)}$，截断误差不超过 $${bisectionRes.errorBound.toFixed(4)}$。`
        : `请调整区间端点使 $f(a) \\cdot f(b) < 0$ 后再进行二分逼近。`,
    },
  ];

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    examAnchor: "人教A版必修第一册 · 函数与方程及二分法 (必考基础/解答通法)",
    mnemonic:
      "连续异号必有根，二分切半误差减；单调保证唯一解，同号切点莫等闲。",
  };
}
