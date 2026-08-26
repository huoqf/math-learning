import type { MathPanelData } from "../types";
import {
  calculateTransform,
  type BaseFnType,
  type FoldMode,
} from "@/math/transform";
import { MATH_COLORS } from "@/theme";

export function buildFuncTransformPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const fnType = (config?.fnType as BaseFnType) || "quadratic";
  const foldMode = (config?.foldMode as FoldMode) || "none";
  const h = params.h ?? 1.0;
  const k = params.k ?? 0.5;
  const A = params.A ?? 1.5;
  const omega = params.omega ?? 1.0;

  const res = calculateTransform(fnType, { h, k, A, omega, foldMode });

  // 1. 导出数学特征量 (精简提炼，杜绝与左屏输入滑块纯数值简单重复)
  const quantities: MathPanelData["quantities"] = [
    {
      label: "几何位移向量",
      symbol: "\\vec{v} = (h, k)",
      value: `(${h > 0 ? "+" : ""}${h.toFixed(1)}, \\; ${k > 0 ? "+" : ""}${k.toFixed(1)})`,
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "图象伸缩比例",
      symbol: "\\left(\\frac{1}{\\omega}, A\\right)",
      value: `\\text{横向 } ${(1 / omega).toFixed(2)}, \\; \\text{纵向 } ${A.toFixed(1)}`,
      color: MATH_COLORS.paramSecondary,
    },
    {
      label: "对称性特征",
      value: res.symmetryInfo.description,
      color: MATH_COLORS.function,
    },
    {
      label: "基准特征点映射",
      value: res.keyPoints[0] ? res.keyPoints[0].description : "—",
    },
  ];

  // 2. 核心定理与高考通法
  const theorems: MathPanelData["theorems"] = [
    {
      name: "图象平移与伸缩提公因式法则 (先平移 vs 先伸缩)",
      latex:
        "f(x) \\xrightarrow{\\text{平移 } h} f(x - h) \\xrightarrow{\\text{伸缩 } \\omega} f(\\omega(x - h)) = f(\\omega x - \\omega h)",
      level: "core",
      prerequisites: [
        "路线一(先移后缩)：向右平移 h 个单位，再将自变量 x 变为 ωx",
        "路线二(先缩后移)：自变量 x 变为 ωx 得 f(ωx)，再向右平移 h 个单位得 f(ω(x - h)) = f(ωx - ωh)",
        "【核心铁律】平移只针对自变量 x 自身，严禁将 f(ωx + φ) 中的 φ 误认为整体平移量！",
      ],
    },
    {
      name: "绝对值翻折法则与不可导尖点",
      latex: "y = |f(x)| \\quad \\text{与} \\quad y = f(|x|)",
      level: "important",
      prerequisites: [
        "整体绝对值 y = |f(x)|：保留 x 轴及上方图象不动，将 x 轴下方图象以 x 轴为轴翻折到上方 (值域 [0, +∞)，原相交零点处易出现导数不存在的尖点)",
        "自变量绝对值 y = f(|x|)：保留 y 轴及右侧 (x ≥ 0) 图象不动，擦除左侧并以 y 轴为轴对称复制 (所得图象恒为偶函数)",
      ],
    },
    {
      name: "高中对称性与周期性判定通法",
      latex:
        "f(a + x) = f(a - x) \\iff x = a \\text{ 轴对称}; \\quad f(a + x) + f(b - x) = 2c \\iff \\left(\\frac{a+b}{2}, c\\right) \\text{ 中心对称}",
      level: "derived",
      prerequisites: [
        "若括号内两项 x 的系数一正一负且和为定值，则图象具有轴对称或中心对称性",
        "若两项系数同号且差为定值 (如 f(x + T) = f(x))，则图象具有周期性",
      ],
    },
  ];

  // 3. 高考考点与秒杀思维
  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
    {
      text: "【高考经典陷阱 · 平移只对 x 变】：由 y = f(2x) 变换到 y = f(2x + 1)，解析式变形为 y = f(2(x + 1/2))，因此是向左平移 1/2 个单位，而非 1 个单位！",
      importance: "gaokao",
    },
    {
      text: "【数形结合破题 · 绝对值零点问题】：对于方程 |f(x)| = kx + b 的实根个数问题，转化为 y = |f(x)| 翻折图象与动直线交点个数，切线斜率与尖点坐标是分类讨论的临界分界点。",
      importance: "gaokao",
    },
    {
      text: "【奇偶性与对称性代数秒杀】：f(|x|) 恒为偶函数且导数在 x=0 处若存在则必为 0；f(x) 为奇函数时 |f(x)| 变为偶函数。",
      importance: "core",
    },
  ];

  // 4. 临界退化警示
  const warnings: MathPanelData["warnings"] = [];
  if (res.isDegenerate && res.warningMessage) {
    warnings.push({ text: res.warningMessage, level: "warning" });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic:
      "左加右减平移定，上加下减纵向移；伸缩平移提因式，整体翻上自翻偶。",
  };
}
