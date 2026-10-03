import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  ReasoningStep,
  WarningItem,
} from "../types";
import {
  DEG_PER_RAD,
  SPECIAL_ANGLES,
  arcLength,
  radToDeg,
  sectorArea,
  sectorPerimeter,
} from "@/math/radianMeasure";
import { formatPiFraction } from "@/utils/mathFormat";
import { MATH_COLORS } from "@/theme";
import { resolveSceneRadius } from "../registries/radianMeasure";

/**
 * 「弧度制、弧长与扇形面积」右屏看板。
 *
 * 三种探究模式与左屏一致：
 *   definition —— 弧度的定义（|α| = l / r，l = r 时 α = 1 rad）
 *   conversion —— 角度与弧度互化（π rad = 180°）
 *   arcSector  —— 弧长与扇形面积公式（l = |α|r，S = ½lr = ½|α|r²）
 *
 * 考纲边界：本页只涉及人教A版必修一 5.1.2 内容，扇形面积不引入积分/极限表述。
 */
export function buildRadianMeasurePanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const studyMode = (config?.studyMode as string) ?? "definition";

  const alphaRad = Math.max(0, params.alphaRad ?? Math.PI / 3);
  // 与中屏画布、悬浮公式同源解析半径：定义模式恒为 1，其余模式跟随滑块
  const r = resolveSceneRadius(studyMode, params.radius ?? 1.5);

  const l = arcLength(alphaRad, r);
  const area = sectorArea(alphaRad, r);
  const perimeter = sectorPerimeter(alphaRad, r);
  const alphaDeg = radToDeg(alphaRad);
  // 右屏 value 为混合文本槽：一律用纯文本 Unicode 读数（SSOT：formatPiFraction），
  // 避免 LaTeX 反斜杠暴露、或被渲染层整串当公式误编译
  const piText = formatPiFraction(alphaRad);
  // α = 0 时 formatPiFraction 会返回 "0"，但「即 0 rad」属冗余表述，故显式排除零角
  const isPiMultiple = alphaRad > 1e-9 && piText !== null;

  const alphaText = isPiMultiple
    ? `${alphaRad.toFixed(4)} rad（即 ${piText} rad）`
    : `${alphaRad.toFixed(4)} rad`;

  const warnings: WarningItem[] = [];
  if (alphaRad <= 1e-9) {
    warnings.push({
      text: "当前圆心角 α = 0，扇形退化为一条半径（弧长与面积均为 0）。拖动滑块使 α > 0 才有意义。",
      level: "warning",
    });
  }

  if (studyMode === "conversion") {
    const quantities: MathQuantity[] = [
      {
        label: "圆心角 α（弧度制）",
        symbol: "\\alpha",
        value: alphaText,
        color: MATH_COLORS.paramPrimary,
        highlight: "positive",
      },
      {
        label: "圆心角 α（角度制）",
        symbol: "\\alpha^\\circ",
        value: `${alphaDeg.toFixed(2)}°`,
        color: MATH_COLORS.paramSecondary,
        highlight: "positive",
      },
      {
        label: "换算关系（度与弧度）",
        symbol: "\\pi\\ \\text{rad} = 180^\\circ",
        value: `1° ≈ ${(Math.PI / 180).toFixed(5)} rad，1 rad ≈ ${DEG_PER_RAD.toFixed(4)}°`,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "与 π 的关系",
        symbol: "\\alpha = k\\pi",
        value: isPiMultiple
          ? `α = ${piText}（π 的简单有理倍）`
          : `α ≈ ${alphaRad.toFixed(4)}（非 π 的简单有理倍）`,
        color: MATH_COLORS.function,
      },
    ];

    const theorems: Theorem[] = [
      {
        name: "角度与弧度的换算关系",
        latex:
          "\\pi\\ \\text{rad} = 180^\\circ \\implies 1^\\circ = \\frac{\\pi}{180}\\ \\text{rad}, \\quad 1\\ \\text{rad} = \\left(\\frac{180}{\\pi}\\right)^\\circ",
        condition:
          "同一圆心角的两种度量方式，换算比例由「π rad = 180°」唯一确定",
        note: "换算方向口诀：度化弧度乘 $\\frac{\\pi}{180}$，弧度化度乘 $\\frac{180}{\\pi}$。注意 1 rad 与 1° 完全不同：1 rad ≈ 57.3°。",
        level: "core",
      },
      {
        name: "特殊角的度—弧度对照",
        latex: SPECIAL_ANGLES.map(
          (a) => `${a.deg}^\\circ \\leftrightarrow ${a.radLatex}`,
        ).join(", \\;"),
        condition: "高中阶段必须熟记的特殊角对照",
        note: "记忆主线：把 $180^\\circ$ 换成 $\\pi$，其余角按比例折算。$30^\\circ \\to \\frac{\\pi}{6}$、$45^\\circ \\to \\frac{\\pi}{4}$、$60^\\circ \\to \\frac{\\pi}{3}$、$90^\\circ \\to \\frac{\\pi}{2}$。",
        level: "core",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "高考中三角函数的自变量必须使用弧度制：正弦型函数 $y = A\\sin(\\omega x + \\varphi)$ 的周期 $T = \\frac{2\\pi}{|\\omega|}$、对称轴与单调区间的端点都按弧度数书写，代入角度值会直接算错。",
        importance: "gaokao",
      },
      {
        text: "弧度制与角度制的互化是解三角形、三角函数图象、向量旋转等题目的第一步运算，属必拿分的基础环节。",
        importance: "core",
      },
    ];

    const reasoningSteps: ReasoningStep[] = [
      {
        step: 1,
        title: "审题定法 · 锁定换算比例",
        detail:
          "两个方向的换算都由同一个等式派生：半圆的弧长是 $\\pi r$，所对圆心角是 $180^\\circ$，故 $\\pi\\ \\text{rad} = 180^\\circ$。",
        rubric: "要点：写出 π rad = 180° 这一基准等式",
      },
      {
        step: 2,
        title: "建模联立 · 建立互化式",
        detail:
          "把基准等式两边同时除以 180 与 π，分别得到「度化弧度」与「弧度化度」两个方向的乘数。",
        latex:
          "1^\\circ = \\frac{\\pi}{180}\\ \\text{rad}, \\qquad 1\\ \\text{rad} = \\frac{180^\\circ}{\\pi}",
        rubric: "要点：明确乘 $\\frac{\\pi}{180}$ 还是乘 $\\frac{180}{\\pi}$",
      },
      {
        step: 3,
        title: "代入求解 · 当前角的两种读法",
        detail: `当前圆心角 $\\alpha = ${alphaRad.toFixed(4)}$ rad，换算为角度为 $${alphaDeg.toFixed(2)}^\\circ$；反向验证应回到原值。`,
        latex: `${alphaRad.toFixed(4)} \\times \\frac{180}{\\pi} = ${alphaDeg.toFixed(2)}^\\circ`,
        rubric: "要点：代入并双向验证换算结果",
      },
    ];

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      reasoningSteps,
      mnemonic:
        "π 对 180 记心间，度化弧度乘 π/180；弧度化度乘 180/π，1 弧度约等于 57 度 3。",
    };
  }

  if (studyMode === "arcSector") {
    const quantities: MathQuantity[] = [
      {
        label: "圆心角 α",
        symbol: "\\alpha",
        value: alphaText,
        color: MATH_COLORS.paramPrimary,
        highlight: "positive",
      },
      {
        label: "半径 r",
        symbol: "r",
        value: r.toFixed(2),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "弧长 l = |α| r",
        symbol: "l = |\\alpha|\\,r",
        value: `${l.toFixed(4)}`,
        color: MATH_COLORS.paramTertiary,
        highlight: "positive",
      },
      {
        label: "扇形面积 S = ½|α| r²",
        symbol: "S = \\frac{1}{2}|\\alpha|\\,r^2",
        value: `${area.toFixed(4)}`,
        color: MATH_COLORS.sequenceHighlight,
        highlight: "positive",
      },
      {
        label: "扇形面积 S = ½ l r（对照）",
        symbol: "S = \\frac{1}{2} l r",
        value: `${(0.5 * l * r).toFixed(4)}（与上式恒等）`,
        color: MATH_COLORS.function,
      },
      {
        label: "扇形周长（两半径 + 弧）",
        symbol: "C = 2r + l",
        value: `${perimeter.toFixed(4)}（= ${(2 * r).toFixed(2)} + ${l.toFixed(4)}）`,
        color: MATH_COLORS.tangentLine,
      },
    ];

    const theorems: Theorem[] = [
      {
        name: "弧长公式",
        latex: "l = |\\alpha|\\,r",
        condition:
          "$\\alpha$ 为圆心角的弧度数，$r$ 为半径；角度制下对应 $l = \\frac{n\\pi r}{180}$",
        note: "弧度制下弧长公式是最简形式（无 $\\frac{\\pi}{180}$ 系数），这正是引入弧度制的核心价值。",
        level: "core",
      },
      {
        name: "扇形面积公式（两个等价形式）",
        latex: "S = \\frac{1}{2}|\\alpha|\\,r^2 = \\frac{1}{2} l r",
        condition: "$\\alpha$ 为圆心角弧度数，$l$ 为弧长，$r$ 为半径",
        note: "第二式与三角形面积 $\\frac{1}{2}\\times$ 底 $\\times$ 高 形式完全平行（把弧长看作「曲边底」），是记忆锚点。",
        level: "core",
      },
      {
        name: "扇形周长",
        latex: "C = 2r + l = 2r + |\\alpha| r",
        condition: "扇形边界由两条半径与一段圆弧构成",
        note: "易错点：扇形周长**不是** $2\\pi r$，必须加上两条半径。",
        level: "important",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "扇形弧长与面积是高考三角函数小题与解析几何结合题的常见载体；解题第一步必须把已知的**角度换成弧度**再代入 $l = |\\alpha|r$。",
        importance: "gaokao",
      },
      {
        text: "常见最值题型：周长 $C = 2r + |\\alpha|r$ 固定时求面积最大值，或面积固定时求周长最小值，取等条件均为「弧长恰好等于 $2r$」（即 $|\\alpha| = 2$）。",
        importance: "hard",
      },
    ];

    const reasoningSteps: ReasoningStep[] = [
      {
        step: 1,
        title: "审题定法 · 统一到弧度制",
        detail:
          "弧长与扇形面积的弧度制公式不含换算系数，运算最简。故先确认圆心角是否为弧度数，必要时先做度化弧度。",
        rubric: "要点：先统一角度单位再套公式",
      },
      {
        step: 2,
        title: "建模联立 · 选定公式形式",
        detail:
          "弧长用 $l = |\\alpha|r$；面积有 $\\frac{1}{2}|\\alpha|r^2$ 与 $\\frac{1}{2}lr$ 两式，已知 $\\alpha$ 用前者，已知弧长用后者。",
        latex: `l = ${alphaRad.toFixed(3)} \\times ${r.toFixed(2)} = ${l.toFixed(4)}`,
        rubric: "要点：按已知量选择面积公式形式",
      },
      {
        step: 3,
        title: "代入求解 · 面积与周长闭环",
        detail: `代入 $\\alpha = ${alphaRad.toFixed(4)}$、$r = ${r.toFixed(2)}$：面积 $S = \\frac{1}{2}\\times ${l.toFixed(4)} \\times ${r.toFixed(2)} = ${area.toFixed(4)}$；周长 $C = 2r + l = ${perimeter.toFixed(4)}$。`,
        latex: `S = \\frac{1}{2}|\\alpha|r^2 = ${area.toFixed(4)}, \\quad C = 2r + |\\alpha|r = ${perimeter.toFixed(4)}`,
        rubric: "要点：求出 l、S、C 并检查单位",
      },
    ];

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      reasoningSteps,
      mnemonic:
        "弧长等于角乘半径，面积两式记分明：半角乘方再取半，半弧乘半径同形。",
    };
  }

  // ── definition：弧度的定义 ──
  const ratio = r > 0 ? l / r : 0;
  const isUnitRadian = Math.abs(alphaRad - 1) < 0.005;

  const quantities: MathQuantity[] = [
    {
      label: "弧长 l",
      symbol: "l",
      value: `${l.toFixed(4)}`,
      color: MATH_COLORS.paramTertiary,
    },
    {
      label: "半径 r",
      symbol: "r",
      value: `${r.toFixed(2)}`,
      color: MATH_COLORS.paramSecondary,
    },
    {
      label: "弧长与半径之比 l / r",
      symbol: "\\frac{l}{r}",
      value: `${ratio.toFixed(4)}${isUnitRadian ? "  ← 恰为 1 rad" : ""}`,
      color: MATH_COLORS.paramPrimary,
      highlight: "positive",
    },
    {
      label: "圆心角 α（弧度制读数）",
      symbol: "|\\alpha| = \\frac{l}{r}",
      value: alphaText,
      color: MATH_COLORS.paramPrimary,
      highlight: "positive",
    },
    {
      label: "圆心角 α（角度制约数）",
      symbol: "\\alpha^\\circ",
      value: `${alphaDeg.toFixed(2)}°`,
      color: MATH_COLORS.function,
    },
  ];

  const theorems: Theorem[] = [
    {
      name: "弧度制的定义（1 弧度的角）",
      latex: "l = r \\implies \\alpha = 1\\ \\text{rad}",
      condition: "长度等于半径长的圆弧所对的圆心角，叫做 1 弧度的角",
      note: "弧度是一个**纯比值**（长度比长度），与半径大小无关，因此同一圆心角的弧度数在任意半径的圆上读数一致 —— 这是弧度制能成为统一度量的根本原因。",
      level: "core",
    },
    {
      name: "圆心角的弧度数公式",
      latex: "|\\alpha| = \\frac{l}{r}",
      condition:
        "$l$ 为圆心角 $\\alpha$ 所对圆弧的长，$r$ 为所在圆的半径；$\\alpha$ 的正负由旋转方向决定",
      note: "由此式反解即得弧长公式 $l = |\\alpha| r$。正角弧度数为正、负角为负、零角为 0。",
      level: "core",
    },
  ];

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "弧度制把「角」与「实数」建立一一对应，使三角函数成为真正以实数为自变量的函数 —— 正弦型函数 $y = A\\sin(\\omega x + \\varphi)$ 的周期写成 $T = \\frac{2\\pi}{|\\omega|}$ 而不是含 $360^\\circ$ 的形式，正因为自变量必须是弧度数。",
      importance: "core",
    },
    {
      text: "1 rad ≈ 57.3°（大于 1° 而小于 60°）；与半径大小无关这一性质，常用于判别「弧长等于半径」类几何题。",
      importance: "gaokao",
    },
  ];

  const reasoningSteps: ReasoningStep[] = [
    {
      step: 1,
      title: "审题定法 · 从「长度比长度」出发",
      detail:
        "用角度制度量角，本质是把圆周分成 360 份；改用「弧长与半径之比」度量，则这个比值与半径无关，只由张开程度决定。",
      rubric: "要点：理解比值度量与半径无关",
    },
    {
      step: 2,
      title: "建模联立 · 定义 1 弧度",
      detail:
        "约定「弧长恰等于半径」时该圆心角为 1 rad，于是任意圆心角的弧度数就定义为 l 与 r 的比值。",
      latex: "|\\alpha| = \\frac{l}{r}",
      rubric: "要点：写出比值定义式",
    },
    {
      step: 3,
      title: "代入求解 · 当前图形的读数",
      detail: `当前弧长 $l = ${l.toFixed(4)}$、半径 $r = ${r.toFixed(2)}$，比值 $\\frac{l}{r} = ${ratio.toFixed(4)}$，即圆心角为 $${alphaRad.toFixed(4)}$ rad（约 $${alphaDeg.toFixed(2)}^\\circ$）。`,
      latex: `\\frac{${l.toFixed(4)}}{${r.toFixed(2)}} = ${ratio.toFixed(4)}\\ \\text{rad}`,
      rubric: "要点：代入求出弧度读数并与角度制对照",
    },
  ];

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    mnemonic:
      "弧长比半径，弧度自生成；半径那样长的一段弧，所对圆心角就是 1 弧度。",
  };
}
