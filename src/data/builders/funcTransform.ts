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
      name: "图象平移与伸缩公因式法则 (先平移 vs 先伸缩)",
      latex:
        "f(x) \\xrightarrow{\\text{平移 } \\omega h} f(x - \\omega h) \\xrightarrow{x \\to \\omega x} f(\\omega x - \\omega h) = f(\\omega(x - h))",
      level: "core",
      prerequisites: [
        "路线一(先移后缩)：先向右平移 ωh 个单位得 f(x - ωh)，再将自变量 x 缩放为 ωx 得 f(ωx - ωh)",
        "路线二(先缩后移)：先将自变量 x 缩放为 ωx 得 f(ωx)，再向右平移 h 个单位得 f(ω(x - h))",
        "【核心铁律】平移与伸缩只针对自变量 x 自身！从 f(ωx) 到 f(ωx + φ) 必先提公因式 f(ω(x + φ/ω))，平移量为 |φ/ω|！",
      ],
    },
    {
      name: "绝对值翻折法则与不可导折点 (尖点)",
      latex: "y = |f(x)| \\quad \\text{与} \\quad y = f(|x|)",
      level: "important",
      prerequisites: [
        "整体绝对值 y = |f(x)|：保留 x 轴及上方图象，将 x 轴下方图象沿 x 轴翻折至上方；原相交零点处导数左右符号突变，形成不可导尖点",
        "自变量绝对值 y = f(|x|)：保留 y 轴右侧 (x ≥ 0) 图象并擦除左侧，以 y 轴为对称轴镜像复制到左侧，恒为偶函数",
      ],
    },
    {
      name: "高中函数对称性与周期性判定通法",
      latex:
        "f(a + x) = f(a - x) \\iff x = a \\text{ 轴对称}; \\quad f(a + x) + f(b - x) = 2c \\iff \\left(\\frac{a+b}{2}, c\\right) \\text{ 中心对称}",
      level: "derived",
      prerequisites: [
        "若自变量系数一正一负且和为定值，图象关于直线 x = (a+b)/2 轴对称或关于点 ((a+b)/2, c) 中心对称",
        "若两项系数同号且差为定值 (如 f(x + T) = f(x))，则图象具有周期性 T",
      ],
    },
  ];

  // 3. 高考标准破题推导链 (审题定标 -> 建模代换 -> 求解反思)
  const baseNameMap: Record<BaseFnType, string> = {
    quadratic: "二次函数 f(x) = x^2",
    sine: "正弦函数 f(x) = \\sin x",
    cubic: "三次函数 f(x) = x^3",
    exp: "指数函数 f(x) = 2^x",
    log: "对数函数 f(x) = \\log_2 x",
  };

  const domainDesc =
    fnType === "log"
      ? foldMode === "input"
        ? `x \\in (-\\infty, -${Math.abs(h).toFixed(1)}) \\cup (${Math.abs(h).toFixed(1)}, +\\infty)`
        : `x > ${h.toFixed(1)}`
      : "x \\in \\mathbb{R}";

  const reasoningSteps: MathPanelData["reasoningSteps"] = [
    {
      step: 1,
      title: "审题定标 · 标定母函数基准特征",
      latex: `${baseNameMap[fnType]}, \\quad \\text{定义域: } ${domainDesc}`,
      detail:
        fnType === "log"
          ? `基准定点 $P_0(1, 0)$，原渐近线 $x = 0$；平移后铅垂渐近线迁移至 $x = ${h.toFixed(1)}$。`
          : fnType === "exp"
            ? `基准定点 $P_0(0, 1)$，原水平渐近线 $y = 0$；竖直平移后渐近线为 $y = ${k.toFixed(1)}$。`
            : fnType === "quadratic"
              ? `顶点原在 $(0, 0)$，对称轴为 $y$ 轴；平移伸缩后顶点迁移至 $(${h.toFixed(1)}, ${k.toFixed(1)})$。`
              : "标定核心特征点与对称中心，确立代数自变量代换边界。",
    },
    {
      step: 2,
      title: "建模演化 · 路径一 (先平移后伸缩)",
      latex: res.routes.shiftFirst,
      detail:
        "【先移后缩规范】必须先平移 $|\\omega h|$ 个单位得到 $f(x - \\omega h)$，再对自变量进行伸缩 $x \\to \\omega x$，平移量绝非孤立的 $|h|$！",
    },
    {
      step: 3,
      title: "建模演化 · 路径二 (先伸缩后平移)",
      latex: res.routes.scaleFirst,
      detail:
        "【先缩后移规范】先对自变量进行伸缩得到 $f(\\omega x)$，再提公因式整体平移 $|h|$ 个单位得到 $f(\\omega(x - h))$。",
    },
    {
      step: 4,
      title: "求解反思 · 几何特征量与翻折性质",
      latex: res.formattedLatex,
      detail: `目标解析式为 $${res.formattedLatex}$，${res.symmetryInfo.description}。${
        foldMode === "global"
          ? "整体翻折将图象限定在 $y \\ge 0$，与 $x$ 轴交点处左右导数变号，构成高考典型的不可导尖点。"
          : foldMode === "input"
            ? "自变量绝对值翻折保留 $x \\ge 0$ 并对称复制，所得函数恒满足 $f(|-x|) = f(|x|)$，对称轴必为 $x = 0$。"
            : "综合水平与竖直方向位移与伸缩倍率，完成数形特征完全闭环。"
      }`,
    },
  ];

  // 4. 高考考点与秒杀思维
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

  // 5. 临界退化警示
  const warnings: MathPanelData["warnings"] = [];
  if (res.isDegenerate && res.warningMessage) {
    warnings.push({ text: res.warningMessage, level: "warning" });
  }

  return {
    quantities,
    theorems,
    reasoningSteps,
    gaokaoPoints,
    warnings,
    mnemonic:
      "左加右减平移定，上加下减纵向移；伸缩平移提因式，整体翻上自翻偶。",
  };
}
