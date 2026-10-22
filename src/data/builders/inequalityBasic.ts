import type { MathPanelData, ReasoningStep } from "../types";
import { calcMeans } from "@/features/inequalityBasic/math/inequalityBasic";
import { analyzeInequalityProperties } from "@/math/inequalityProperties";
import { formatMathNumber } from "@/utils/mathFormat";

export function buildInequalityBasicPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const a = params.a ?? 4.0;
  const b = params.b ?? 2.0;
  const k = params.k ?? 4.0;
  const studyMode = (config?.studyMode as string) ?? "semicircle";

  const { am, gm, hm, qm, isEqual, diffAmGm } = calcMeans(a, b);

  if (studyMode === "properties") {
    /**
     * 等式与不等式的性质（必修一 2.1）。
     *
     * 本模式不画面积、不比均值，只做一件事：用**差（或积）的符号**判定大小。
     * 三条性质都由符号推出，因此看板只呈现「运算前后的大小关系」与「是否变向」，
     * 让学生看到「加同一个数不变向、乘同一个负数必变向」的机器级证据。
     */
    const pa = params.pA ?? 3;
    const pb = params.pB ?? -1;
    const c = params.pC ?? -2;
    const res = analyzeInequalityProperties(pa, pb, c);
    const f = formatMathNumber;

    const relationLabel = (r: string) =>
      r === "gt" ? ">" : r === "lt" ? "<" : r === "eq" ? "=" : "无法比较";

    return {
      quantities: [
        {
          label: "作差结果 $a - b$",
          symbol: "a-b",
          value: f(res.diff),
          highlight: res.relation === "eq" ? "extreme" : undefined,
        },
        {
          label: "由差的符号得大小关系",
          symbol: "a \\lessgtr b",
          value: `a ${relationLabel(res.relation)} b`,
        },
        {
          label: "同加 $c$ 后 $(a+c) - (b+c)$",
          symbol: "(a+c)-(b+c)",
          value: `a ${relationLabel(res.sumRelation)} b（差仍为 ${f(res.sumA - res.sumB)}）`,
        },
        {
          label: "同乘 $c$ 后 $ac$ 与 $bc$",
          symbol: "ac,\\ bc",
          value: `${f(res.prodA)} ${relationLabel(res.prodRelation)} ${f(res.prodB)}`,
          highlight: res.isProdReversed ? "extreme" : undefined,
        },
      ],
      theorems: [
        {
          name: "作差比较法",
          latex: `a - b > 0 \\iff a > b, \\quad a - b = 0 \\iff a = b, \\quad a - b < 0 \\iff a < b`,
          level: "core",
          condition: "比较两实数大小的通法：先作差、再变形、最后判符号",
          prerequisites: [
            "比较大小的本质是判断差（或商）的符号",
            "作差后通常因式分解或配方，才能定出符号",
          ],
        },
        {
          name: "不等式的可加性",
          latex: `a > b \\iff a + c > b + c`,
          level: "important",
          condition: "两边同加（减）同一个实数，不等号方向不变",
          prerequisites: [
            "$(a + c) - (b + c) = a - b$：平移不改变两数的差",
            "因此可加性对任意实数 $c$ 都成立，无需讨论正负",
          ],
        },
        {
          name: "不等式的可乘性",
          latex: `a > b, \\ c > 0 \\implies ac > bc; \\quad a > b, \\ c < 0 \\implies ac < bc`,
          level: "core",
          condition: "两边同乘一个数时，必须按该数的正负分情况讨论",
          prerequisites: [
            "$a > b > 0$ 且 $c > 0$ 时乘积保持同向",
            "乘以负数相当于把数轴关于原点翻转，大小关系必然反向",
            "$c = 0$ 时两边同为 0，不等式退化为等式",
          ],
        },
      ],
      gaokaoPoints: [
        {
          text: "作差法是万能的，但要「变形到能定符号」为止：差式若还含有参数，通常要因式分解或配方成平方和的形式，才能判断符号——停在 $a - b$ 这一步不给分。",
          importance: "gaokao",
        },
        {
          text: `乘负数变向是最高频失分点：本题 $c = ${f(c)}$，$a ${relationLabel(res.relation)} b$ 但 $ac ${relationLabel(res.prodRelation)} bc$。凡不等式两边同乘含参数的式子，必须先判断该式子的符号，符号不定就要分类讨论。`,
          importance: "hard",
        },
        {
          text: "同向可加性只能「相加」，不能「相减」：$a > b,\\ c > d \\implies a + c > b + d$ 成立，但 $a - c > b - d$ 不一定成立（$c > d$ 时相当于加了一个更小的数）。",
          importance: "gaokao",
        },
      ],
      warnings:
        res.c === 0
          ? [
              {
                text: "同乘 $c = 0$ 退化警告：两边同乘 0 后都变成 0，不等式退化为等式，此时不能再写不等号。",
                level: "warning",
              },
            ]
          : res.isProdReversed
            ? [
                {
                  text: `同乘负数变向：$c = ${f(c)} < 0$，两侧同乘后不等号方向翻转，由 $a ${relationLabel(res.relation)} b$ 变为 $ac ${relationLabel(res.prodRelation)} bc$。`,
                  level: "info",
                },
              ]
            : [],
      mnemonic: "比较大小先作差，符号一定结论出；同加不变向，乘负必变向！",
      reasoningSteps: [
        {
          step: 1,
          title: "审题定法 · 作差并写成可判符号的形式",
          detail: `要比较 $a = ${f(pa)}$ 与 $b = ${f(pb)}$ 的大小，作差得 $a - b = ${f(pa)} - (${f(pb)}) = ${f(res.diff)}$。作差法的第一步永远是「作差」，而不是凭数轴上的位置目测。`,
          latex: `a - b = ${f(pa)} - (${f(pb)}) = ${f(res.diff)}`,
          rubric: "采分点：作差并正确算出差的值（2分）",
        },
        {
          step: 2,
          title: "代入求解 · 由差的符号判定大小",
          detail: `差为${res.relation === "gt" ? "正" : res.relation === "lt" ? "负" : "零"}，故 $a ${relationLabel(res.relation)} b$。符号是唯一判据：差大于零即 $a > b$，差小于零即 $a < b$，差等于零即两数相等。`,
          latex: `a - b = ${f(res.diff)} ${res.relation === "gt" ? ">" : res.relation === "lt" ? "<" : "="} 0 \\implies a ${relationLabel(res.relation)} b`,
          rubric: "采分点：由差的符号写出大小关系（2分）",
        },
        {
          step: 3,
          title: "结果检验 · 同加与同乘的变向判断",
          detail: `同加 $c = ${f(c)}$：$(a + c) - (b + c) = ${f(res.sumA - res.sumB)}$，与 $a - b$ 同号，不等号不变向。同乘 $c$：$ac = ${f(res.prodA)}$、$bc = ${f(res.prodB)}$，故 $ac ${relationLabel(res.prodRelation)} bc$——${
            res.c < 0
              ? "乘以负数使数轴翻转，大小关系反向了。"
              : res.c > 0
                ? "乘以正数大小关系保持不变。"
                : "乘数为零时两边同为零，不等式退化为等式。"
          }`,
          latex: `(a+c)-(b+c) = a-b = ${f(res.diff)}, \\quad ac ${relationLabel(res.prodRelation)} bc`,
          rubric: "采分点：分情况讨论同乘正负数对不等号方向的影响（3分）",
        },
      ],
    };
  }

  if (studyMode === "nike") {
    const minX = Math.sqrt(k);
    const minY = 2 * minX;
    const currentX = a;
    const currentY = currentX + k / currentX;
    const isAtMin = Math.abs(currentX - minX) < 0.05;

    const reasoningSteps: ReasoningStep[] = [
      {
        step: 1,
        title: "审题定法 · 检验一正与乘积定值",
        detail: `由题设 $x > 0, k = ${k.toFixed(1)} > 0$，验证两正数项之积为定值 $x \\cdot \\frac{k}{x} = ${k.toFixed(1)}$。`,
        latex: `x > 0, \\; \\frac{k}{x} > 0 \\implies x \\cdot \\frac{k}{x} = k = ${k.toFixed(1)}`,
        rubric: "准确验证正数定义域与乘积定值条件得 2 分",
      },
      {
        step: 2,
        title: "建模联立 · 应用基本不等式放缩",
        detail: `由基本不等式 $u + v \\ge 2\\sqrt{uv}$，代入项得 $x + \\frac{k}{x} \\ge 2\\sqrt{k}$。`,
        latex: `f(x) = x + \\frac{${k.toFixed(1)}}{x} \\ge 2\\sqrt{${k.toFixed(1)}} = ${minY.toFixed(2)}`,
        rubric: "规范写出基本不等式公式与数值代入得 2 分",
      },
      {
        step: 3,
        title: "求解反思 · 检验等号成立条件",
        detail: `当且仅当两项相等 $x = \\frac{k}{x}$ 即 $x^2 = k$ 时取等号，因 $x > 0$ 解得最小值点 $x = \\sqrt{k} = ${minX.toFixed(2)}$。`,
        latex: `x = \\frac{k}{x} \\iff x = \\sqrt{k} = ${minX.toFixed(2)} \\implies f_{\\min} = ${minY.toFixed(2)}`,
        rubric: "解出最小值点并完成闭环反思得 2 分",
      },
    ];

    return {
      quantities: [
        {
          label: "积定值 k",
          symbol: "k",
          value: k.toFixed(2),
        },
        {
          label: "最小值点 x",
          symbol: "x_{\\min}",
          value: minX.toFixed(2),
          highlight: isAtMin ? "extreme" : undefined,
        },
        {
          label: "函数最小值 $f_min$",
          symbol: "y_{\\min}",
          value: minY.toFixed(2),
          highlight: isAtMin ? "extreme" : undefined,
        },
        {
          label: "当前探针自变量 x",
          symbol: "x",
          value: currentX.toFixed(2),
        },
        {
          label: "当前函数值 f(x)",
          symbol: "f(x)",
          value: currentY.toFixed(2),
        },
      ],
      theorems: [
        {
          name: "对勾函数与基本不等式最值定理",
          latex: "x + \\frac{k}{x} \\ge 2\\sqrt{k} \\quad (x > 0, k > 0)",
          prerequisites: ["x > 0", "k > 0"],
          condition:
            "当且仅当 $x = \\sqrt{k}$ 时取等号，最小值 $y_{\\min} = 2\\sqrt{k}$",
        },
      ],
      gaokaoPoints: [
        {
          text: "积定和最小原则：当两项之积为定值 $k$ 时，两项之和 $x + \\frac{k}{x}$ 在 $x = \\sqrt{k}$ 处取得最小值 $2\\sqrt{k}$。",
          importance: "gaokao",
        },
        {
          text: "拼凑拆项技巧：高考求 $f(x) = x + \\frac{b}{x-a} \\ (x>a)$ 最小值时，拆项拼凑为 $(x-a) + \\frac{b}{x-a} + a$ 满足“积为定值”前提。",
          importance: "core",
        },
      ],
      warnings: [
        {
          text: "定义域正数限制：当 $x < 0$ 时，$y = x + \\frac{k}{x}$ 为奇函数，无最小值，仅有最大值 $-2\\sqrt{k}$。",
          level: "danger",
        },
      ],
      mnemonic: "积定和最小，和定积最大；一正二定三相等！",
      reasoningSteps,
    };
  }

  const reasoningSteps: ReasoningStep[] =
    studyMode === "square"
      ? [
          {
            step: 1,
            title: "审题定法 · 边长与面积代数建模",
            detail: `大正方形边长为 $a + b = ${(a + b).toFixed(1)}$，总面积为 $(a+b)^2 = ${((a + b) ** 2).toFixed(2)}$。`,
            latex: `S_{\\text{大}} = (a + b)^2 = a^2 + 2ab + b^2`,
            rubric: "准确写出组合图形与边长面积关系得 2 分",
          },
          {
            step: 2,
            title: "建模联立 · 面积分割恒等分解",
            detail: `大正方形由 4 个直角边为 $a, b$ 的矩形与中央小正方形拼成，中央小正方形边长为 $|a - b| = ${Math.abs(a - b).toFixed(1)}$。`,
            latex: `(a + b)^2 = 4ab + (a - b)^2 = ${(4 * a * b).toFixed(2)} + ${(Math.abs(a - b) ** 2).toFixed(2)}`,
            rubric: "列出完全平方面积恒等分解式得 2 分",
          },
          {
            step: 3,
            title: "求解反思 · 平方非负性证明不等式",
            detail: `因实数平方差非负 $(a - b)^2 \\ge 0$，故 $(a+b)^2 \\ge 4ab$，两边开方得 $\\frac{a+b}{2} \\ge \\sqrt{ab}$，当且仅当 $a = b$ 时中央小正方形缩为一点取等号。`,
            latex: `(a - b)^2 \\ge 0 \\implies a^2 + b^2 \\ge 2ab \\iff \\frac{a+b}{2} \\ge \\sqrt{ab}`,
            rubric: "由平方非负性导出基本不等式并明确取等充要条件得 2 分",
          },
        ]
      : [
          {
            step: 1,
            title: "审题定法 · 直径与圆半径几何建模",
            detail: `直径为 $AB = a + b = ${(a + b).toFixed(1)}$，圆心为 $O$，半圆半径为算术平均 $OC = \\frac{a+b}{2} = ${am.toFixed(2)}$。`,
            latex: `R = OC = \\frac{a+b}{2} = AM`,
            rubric: "准确建立半圆直径与算术平均半径对应得 2 分",
          },
          {
            step: 2,
            title: "建模联立 · 射影定理推导几何平均半弦",
            detail: `过分点 $P$ 作直径垂线交半圆于 $C$，由射影定理得 $PC^2 = AP \\cdot PB = ab$，故垂线半弦长 $PC = \\sqrt{ab} = ${gm.toFixed(2)}$。`,
            latex: `PC \\perp AB \\implies PC^2 = AP \\cdot PB = ab \\implies PC = \\sqrt{ab} = GM`,
            rubric: "应用射影定理推导半弦长几何意义得 2 分",
          },
          {
            step: 3,
            title: "求解反思 · 直角边不大于斜边证明不等式",
            detail: `在直角三角形 $OPC$ 中，直角边不大于斜边 $PC \\le OC$，即 $\\sqrt{ab} \\le \\frac{a+b}{2}$。过 $P$ 向 $OC$ 作垂线截得 $CD = \\frac{2ab}{a+b} = HM$。当且仅当 $P$ 与 $O$ 重合（$a = b$）时取等号。`,
            latex: `PC \\le OC \\iff \\sqrt{ab} \\le \\frac{a+b}{2}, \\quad HM \\le GM \\le AM`,
            rubric: "由直角边斜边几何关系完成不等式证明与四均值链闭环得 2 分",
          },
        ];

  return {
    quantities: [
      {
        label: "算术平均 AM",
        symbol: "\\frac{a+b}{2}",
        value: am.toFixed(2),
        highlight: "positive",
      },
      {
        label: "几何平均 GM",
        symbol: "\\sqrt{ab}",
        value: gm.toFixed(2),
        highlight: "positive",
      },
      {
        label: "调和平均 HM",
        symbol: "\\frac{2ab}{a+b}",
        value: hm.toFixed(2),
      },
      {
        label: "平方平均 QM",
        symbol: "\\sqrt{\\frac{a^2+b^2}{2}}",
        value: qm.toFixed(2),
      },
      {
        label: "均值差 AM - GM",
        symbol: "\\Delta",
        value: diffAmGm.toFixed(4),
        highlight: isEqual ? "zero" : undefined,
      },
      {
        label: "等号成立状态",
        symbol: "a = b",
        value: isEqual ? "已取等 (a = b)" : "未取等 (a ≠ b)",
        highlight: isEqual ? "extreme" : undefined,
      },
    ],
    theorems: [
      {
        name: "基本不等式 (均值不等式)",
        latex: "\\frac{a+b}{2} \\ge \\sqrt{ab} \\quad (a>0,\\ b>0)",
        prerequisites: ["a > 0", "b > 0 (一正)"],
        condition: "当且仅当 a = b 时取等号 (三相等)",
      },
      {
        name: "四均值不等式链",
        latex: "HM \\le GM \\le AM \\le QM",
        prerequisites: ["a > 0", "b > 0"],
        condition: "当且仅当 a = b 时所有不等号同时取等",
      },
    ],
    gaokaoPoints: [
      {
        text: "“一正二定三相等”法则：高考最值解题三要素：① 变量必须为正；② 和或积为定值；③ 取等号条件必须在变量取值范围内可达。",
        importance: "gaokao",
      },
      {
        text: "乘“1”妙用（常数代换法）：已知 $ax + by = 1$，求 $\\frac{1}{x} + \\frac{1}{y}$ 最小值时，乘以 $(ax+by)$ 展开后再用基本不等式。",
        importance: "core",
      },
      {
        text: "双变量消元与范围分析：利用 $a + b \\ge 2\\sqrt{ab}$ 实现“和”与“积”互相转化，求解最值与范围。",
        importance: "core",
      },
    ],
    warnings: [
      {
        text: "负数条件失效警示：若 $a, b$ 中含有负数，基本不等式不成立！如 $(-2)+(-8)=-10 < 2\\sqrt{(-2)(-8)}=8$。",
        level: "danger",
      },
      {
        text: "虚假最值警示：若取等条件 $a = b$ 不在自变量定义域内，则套用基本不等式求得的值非最值，需使用单调性分析。",
        level: "warning",
      },
    ],
    mnemonic: "一正二定三相等，和定积最大，积定和最小！",
    reasoningSteps,
  };
}
