import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
  ReasoningStep,
} from "../types";
import { MATH_COLORS } from "@/theme";
import {
  judgeLinePlane,
  getLineDirection,
  calcLinePlaneAngle,
} from "@/math3d/lineRelation";
import type { Vec3 } from "@/math3d/vector3";
import type { Plane } from "@/math3d/plane";

// ── know-solid-position: 线面与面面位置关系 ──

export function buildLinePlaneRelationPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = (config?.mode as string) ?? "parallel";
  const subTheorem = (config?.subTheorem as string) ?? "judge"; // "judge" | "prop"
  const zHeight = params.zHeight ?? 2;
  const thetaDeg = params.thetaDeg ?? 0;
  const phiDeg = params.phiDeg ?? 30;
  const intersectType = params.intersectType ?? 1;
  const inPlaneType = params.inPlaneType ?? 1;
  const lambdaE = params.lambdaE ?? 0.5;
  const lambdaF = params.lambdaF ?? 0.5;

  // 1. 高考四棱锥经典母题模式
  if (mode === "gaokaoPyramid") {
    const isParallel = Math.abs(lambdaE - lambdaF) < 1e-3;
    const quantities: MathQuantity[] = [
      {
        label: "动点 E 比例 PE/PB",
        symbol: "\\lambda_E",
        value: lambdaE.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "动点 F 比例 PF/PC",
        symbol: "\\lambda_F",
        value: lambdaF.toFixed(2),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "EF 与底面位置关系",
        value: isParallel ? "EF ∥ 平面 ABCD" : "EF 截底面 (相交)",
        color: isParallel ? MATH_COLORS.highlight : MATH_COLORS.textMuted,
      },
      {
        label: "EF 与侧面 PAD 位置关系",
        value: isParallel ? "EF ∥ 平面 PAD" : "相交",
        color: isParallel ? MATH_COLORS.highlight : MATH_COLORS.textMuted,
      },
      {
        label: "线面平行充要状态",
        symbol: "EF \\parallel \\text{面 }PAD",
        value: isParallel ? "严格平行 ✓" : "不平行 ✗",
        color: isParallel
          ? MATH_COLORS.paramTertiary
          : MATH_COLORS.paramPrimary,
      },
    ];

    const theorems: Theorem[] = [
      {
        name: "直线与平面平行判定定理",
        latex:
          "l \\not\\subset \\alpha, \\; m \\subset \\alpha, \\; l \\parallel m \\;\\Rightarrow\\; l \\parallel \\alpha",
        level: "core",
        condition: "平面外一条直线平行于平面内的一条直线，则该直线与此平面平行",
      },
      {
        name: "线面垂直与面面垂直判定定理",
        latex: `PA \\perp \\text{平面 }ABCD, \\; PA \\subset \\text{平面 }PAD \\;\\Rightarrow\\; \\text{平面 }PAD \\perp \\text{平面 }ABCD`,
        level: "core",
        condition: "一条直线垂直于底面，则包含该直线的侧面必垂直于底面",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "【高考真题高频模型】四棱锥中证明“动直线 ∥ 平面”，第一步利用比例相似/中位线证线线平行，第二步说明一条在面外、一条在面内，第三步下结论。三步书写缺一不可！",
        importance: "gaokao",
      },
      {
        text: "【向量建系得分点】以 A 为原点，AB, AD, AP 为 x, y, z 轴建立空间直角坐标系，求出面 PAD（即 x=0）法向量 n=(1,0,0)，计算向量 EF·n = 0 即可向量法获满分。",
        importance: "gaokao",
      },
    ];

    const reasoningSteps: ReasoningStep[] = [
      {
        step: 1,
        title: "审题定法 · 建立空间坐标系设动点",
        detail:
          "以 A 为坐标原点，分别以 AB, AD, AP 方向为 x, y, z 轴建立空间直角坐标系。设各棱长及比例参数求出各顶点与动点坐标：",
        latex: `A(0,0,0), \\; P(0,0,h), \\; B(a,0,0), \\; C(a,b,0), \\; D(0,b,0) \\implies \\vec{EF} = \\left((\\lambda_F - \\lambda_E)a, \\; \\lambda_F b, \\; (\\lambda_E - \\lambda_F)h\\right)`,
        rubric: "[高考采分点] 正确建立空间直角坐标系并给出动点坐标向量 (+4分)",
      },
      {
        step: 2,
        title: "建模联立 · 求面法向量并计算数量积",
        detail:
          "平面 PAD 即为 yz 坐标面 (方程为 x = 0)，易得其单位法向量。当 λ_E = λ_F 时，动向量化简为 (0, λ_E b, 0)，计算数量积：",
        latex: `\\vec{n}_{PAD} = (1, 0, 0), \\; \\lambda_E = \\lambda_F \\implies \\vec{EF} \\cdot \\vec{n}_{PAD} = 0 \\cdot 1 + \\lambda_E b \\cdot 0 + 0 \\cdot 0 = 0`,
        rubric: "[高考采分点] 正确求出法向量并完成数量积垂直证明 (+5分)",
      },
      {
        step: 3,
        title: "求解反思 · 检验面外条件书写结论",
        detail:
          "确认动直线 EF 位于平面 PAD 外，结合数量积为零即可下结论。若用几何法，必须补出“中转直线”：当且仅当 λ_E = λ_F 时 EF ∥ BC，但 BC 不在面 PAD 内（BC 上各点 x = a ≠ 0），不能直接用它下结论，须改取与 BC 平行且落在面 PAD 内的 AD —— 线面平行判定定理要求的是“平面外一条直线与此平面内的一条直线平行”：",
        latex: `\\lambda_E = \\lambda_F \\iff \\vec{EF} = \\lambda_E \\overrightarrow{BC} \\implies EF \\parallel BC; \\quad BC \\parallel AD, \\; AD \\subset \\text{面 }PAD, \\; EF \\not\\subset \\text{面 }PAD \\implies EF \\parallel \\text{平面 }PAD`,
        rubric: "[高考采分点] 严密声明直线在面外条件并给出充分必要结论 (+4分)",
      },
    ];

    const warnings: WarningItem[] = [];
    if (!isParallel) {
      warnings.push({
        text: `当前 λ_E (${lambdaE}) ≠ λ_F (${lambdaF})，EF 与底面边 BC 不平行，无法构成线面平行！调节滑块使 λ_E = λ_F。`,
        level: "warning",
      });
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      reasoningSteps,
      warnings,
      mnemonic: "动点探平行，比例先对齐；中位平行线，三步定线面。",
    };
  }

  // 2. 面面平行与面面垂直模式
  if (mode === "surfaceParallel" || mode === "surfacePerp") {
    const isParallelMode = mode === "surfaceParallel";
    const quantities: MathQuantity[] = [
      {
        label: "平面 α 法向量 n₁",
        symbol: "\\vec{n_1}",
        value: "(0, 0, 1)",
        color: MATH_COLORS.primary,
      },
      {
        label: "平面 β 法向量 n₂",
        symbol: "\\vec{n_2}",
        value: isParallelMode ? "(0, 0, 1)" : "(1, 0, 0)",
        color: MATH_COLORS.secondary,
      },
      {
        label: "两平面位置关系",
        value: isParallelMode ? "面面平行 (α ∥ β)" : "面面垂直 (α ⊥ β)",
        color: MATH_COLORS.highlight,
      },
    ];

    const theorems: Theorem[] = isParallelMode
      ? [
          {
            name: "面面平行判定定理 (几何法)",
            latex: `\\begin{cases} a \\subset \\alpha, \\; b \\subset \\alpha \\\\ a \\cap b = P \\\\ a \\parallel \\beta, \\; b \\parallel \\beta \\end{cases} \\;\\Rightarrow\\; \\alpha \\parallel \\beta`,
            level: "core",
            condition: "一个平面内有两条相交直线分别平行于另一个平面",
          },
          {
            name: "面面平行性质定理 (交线平行)",
            latex: `\\begin{cases} \\alpha \\parallel \\beta \\\\ \\gamma \\cap \\alpha = a \\\\ \\gamma \\cap \\beta = b \\end{cases} \\;\\Rightarrow\\; a \\parallel b`,
            level: "core",
            condition: "第三个平面与两个平行平面相交，交线平行",
          },
          {
            name: "面面平行向量法判定",
            latex: `\\vec{n_1} \\parallel \\vec{n_2} \\;\\Leftrightarrow\\; \\exists\\, k \\ne 0 : \\vec{n_1} = k \\vec{n_2} \\;\\Rightarrow\\; \\alpha \\parallel \\beta`,
            level: "core",
            condition:
              "两平面法向量共线（存在非零比例系数 k）。分量比值式 A₁/A₂ = B₁/B₂ = C₁/C₂ 仅在三分量都非零时可用；出现 0 分量（如本页 n₂=(0,0,1)）时该比值式无定义，必须改写成 n₁ = k·n₂",
          },
        ]
      : [
          {
            name: "面面垂直判定定理 (几何法)",
            latex: `l \\perp \\alpha, \\; l \\subset \\beta \\;\\Rightarrow\\; \\alpha \\perp \\beta`,
            level: "core",
            condition: "一个平面经过另一个平面的一条垂线",
          },
          {
            name: "面面垂直性质定理 (高考极易扣分点)",
            latex: `\\begin{cases} \\alpha \\perp \\beta \\\\ \\alpha \\cap \\beta = l \\\\ a \\subset \\alpha \\\\ a \\perp l \\end{cases} \\;\\Rightarrow\\; a \\perp \\beta`,
            level: "core",
            condition: "两面垂直，在其中一个面内作交线的垂线必垂直于另一个面",
          },
          {
            name: "面面垂直向量法判定",
            latex: `\\vec{n_1} \\cdot \\vec{n_2} = 0 \\;\\Leftrightarrow\\; A_1A_2 + B_1B_2 + C_1C_2 = 0 \\;\\Rightarrow\\; \\alpha \\perp \\beta`,
            level: "core",
            condition: "两平面的法向量数量积为 0 (相互垂直)",
          },
        ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: isParallelMode
          ? "【面面平行证明转化链】线线平行 ➔ 线面平行 ➔ 面面平行。注意必须在面内找到两条【相交】直线分别平行。"
          : "【面面垂直满分答题注意】使用面面垂直性质定理时，必须写明4大条件：① 面面垂直；② 交线是谁；③ 直线在该面内；④ 直线垂直于交线。漏写任一条件扣1分！",
        importance: "gaokao",
      },
    ];

    const warnings: WarningItem[] = [];
    if (!isParallelMode && thetaDeg !== 90) {
      warnings.push({
        text: `🚨【高考面面垂直易错反例】当前面内直线 a 与交线夹角为 θ = ${thetaDeg}° (≠ 90°)。面面垂直性质定理的核心前提是【面内直线垂直于交线】！若不垂直于交线，无法推出 a ⊥ α。`,
        level: "danger",
      });
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic: isParallelMode
        ? "相交两线平行面，面面平行定无疑；第三平面截交线，两线平行又复返。"
        : "过垂线之面必垂直；面面垂直找交线，面内垂交垂直面。",
    };
  }

  // 3. 空间向量法模式
  if (mode === "vector") {
    const lineDir = getLineDirection(thetaDeg, phiDeg);
    const planeNormal: Vec3 = { x: 0, y: 0, z: 1 };
    const angleInfo = calcLinePlaneAngle(lineDir, planeNormal);

    const isParallel = Math.abs(angleInfo.sinTheta) < 1e-3;

    const quantities: MathQuantity[] = [
      {
        label: "方向向量 l",
        symbol: "\\vec{l}",
        value: `(${lineDir.x.toFixed(2)}, ${lineDir.y.toFixed(2)}, ${lineDir.z.toFixed(2)})`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "平面法向量 n",
        symbol: "\\vec{n}",
        value: "(0.00, 0.00, 1.00)",
        color: MATH_COLORS.secondary,
      },
      {
        label: "数量积 l·n",
        symbol: "\\vec{l} \\cdot \\vec{n}",
        value: lineDir.z.toFixed(3),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "线面角正弦 sinθ",
        symbol: "\\sin\\theta",
        value: Number(angleInfo.sinTheta.toFixed(3)),
        color: MATH_COLORS.highlight,
      },
    ];

    const theorems: Theorem[] = [
      {
        name: "向量法线面角公式",
        latex: `\\sin\\theta = |\\cos\\langle\\vec{l}, \\vec{n}\\rangle| = \\frac{|\\vec{l} \\cdot \\vec{n}|}{|\\vec{l}| \\cdot |\\vec{n}|}`,
        level: "core",
        condition:
          "直线方向向量 l 与平面法向量 n 的夹角余弦绝对值即为线面角正弦",
      },
      {
        name: "向量法判定平行与垂直",
        latex: `\\begin{cases} \\vec{l} \\cdot \\vec{n} = 0 \\;(l \\not\\subset \\alpha) \\;\\Rightarrow\\; l \\parallel \\alpha \\\\ \\vec{l} = k\\vec{n} \\;\\Rightarrow\\; l \\perp \\alpha \\end{cases}`,
        level: "core",
        condition: "垂直判共线，平行判点积为零",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "【高考二轮解答题第(2)问满分解法】先建立空间直角坐标系，写出各点坐标；设出法向量 n=(x,y,z)，由 n·v1=0 和 n·v2=0 求出特解；最后代入 sinθ = |l·n| / (|l||n|) 求解。",
        importance: "gaokao",
      },
    ];

    const warnings: WarningItem[] = [];
    if (isParallel && (zHeight === 0 || inPlaneType === 0)) {
      warnings.push({
        text: "当前 l·n = 0 且直线位于平面内 (h=0)，此时直线在面内 (l ⊂ α)，不属于线面平行。",
        level: "warning",
      });
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic:
        "向量法求线面角，法向量点乘方向；余弦绝对取正弦，几何二问稳拿分。",
    };
  }

  // 4. 线面平行与线面垂直主线
  const plane: Plane = {
    point: { x: 0, y: 0, z: 0 },
    normal: { x: 0, y: 0, z: 1 },
  };

  const effectiveZ = inPlaneType === 0 ? 0 : zHeight;
  const lineDir = getLineDirection(thetaDeg, phiDeg);
  const pointOnLine: Vec3 = { x: 0, y: 0, z: effectiveZ };
  const relation = judgeLinePlane(lineDir, plane, pointOnLine);
  const angleInfo = calcLinePlaneAngle(lineDir, plane.normal);

  const relationText =
    inPlaneType === 0
      ? "线在面内 (l ⊂ α) 【反例】"
      : relation === "parallel"
        ? "线面平行 (l ∥ α)"
        : relation === "perpendicular"
          ? "线面垂直 (l ⊥ α)"
          : relation === "inPlane"
            ? "线在面内 (l ⊂ α)"
            : "线面相交 (l ∩ α = P)";

  const quantities: MathQuantity[] = [
    {
      label: "线面角正弦 sinθ",
      symbol: "\\sin\\theta",
      value: Number(angleInfo.sinTheta.toFixed(3)),
      color: MATH_COLORS.paramTertiary,
    },
    {
      label: "空间位置关系",
      value: relationText,
      color:
        relation === "perpendicular" ||
        (relation === "parallel" && inPlaneType !== 0)
          ? MATH_COLORS.highlight
          : inPlaneType === 0
            ? MATH_COLORS.highlight
            : MATH_COLORS.primary,
    },
    {
      label: "直线方向向量 l",
      symbol: "\\vec{l}",
      value: `(${lineDir.x.toFixed(2)}, ${lineDir.y.toFixed(2)}, ${lineDir.z.toFixed(2)})`,
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "法向量与方向向量数量积",
      symbol: "\\vec{l} \\cdot \\vec{n}",
      value: lineDir.z.toFixed(3),
      color: MATH_COLORS.secondary,
    },
  ];

  const isParallelMode = mode === "parallel";
  const isPerpMode = mode === "perpendicular";

  const theorems: Theorem[] = isParallelMode
    ? subTheorem === "prop"
      ? [
          {
            name: "线面平行性质定理 (几何法)",
            latex: `\\begin{cases} l \\parallel \\alpha \\\\ l \\subset \\beta \\\\ \\alpha \\cap \\beta = m \\end{cases} \\;\\Rightarrow\\; l \\parallel m`,
            level: "core",
            condition:
              "一条直线平行于平面，过该直线的平面与该平面相交，则直线平行于交线",
          },
          {
            name: "性质定理的高考转化模型",
            latex: `\\text{线面平行 } \\xrightarrow{\\text{过线作辅助平面}} \\text{ 获得交线 } \\xrightarrow{} \\text{ 线线平行}`,
            level: "core",
            condition: "高考解答题求空间线段平行或点坐标的核心桥梁",
          },
        ]
      : [
          {
            name: "线面平行判定定理 (几何法)",
            latex: `\\begin{cases} l \\not\\subset \\alpha \\\\ m \\subset \\alpha \\\\ l \\parallel m \\end{cases} \\;\\Rightarrow\\; l \\parallel \\alpha`,
            level: "core",
            condition: "平面外一条直线与平面内一条直线平行",
          },
          {
            name: "线面平行向量法判定",
            latex: `\\vec{l} \\cdot \\vec{n} = 0 \\; (l \\not\\subset \\alpha) \\;\\Rightarrow\\; l \\parallel \\alpha`,
            level: "core",
            condition: "直线的方向向量与平面的法向量数量积为 0 (互相垂直)",
          },
        ]
    : isPerpMode && subTheorem === "prop"
      ? [
          {
            name: "线面垂直性质定理 1 (定义性质)",
            latex: `l \\perp \\alpha, \\; m \\subset \\alpha \\;\\Rightarrow\\; l \\perp m`,
            level: "core",
            condition: "一条直线垂直于平面，则垂直于平面内所有直线 (任意性)",
          },
          {
            name: "线面垂直性质定理 2 (平行传递)",
            latex: `a \\perp \\alpha, \\; b \\perp \\alpha \\;\\Rightarrow\\; a \\parallel b`,
            level: "core",
            condition: "垂直于同一个平面的两条直线互相平行",
          },
        ]
      : [
          {
            name: "线面垂直判定定理 (几何法)",
            latex: `\\begin{cases} l \\perp a, \\; l \\perp b \\\\ a \\subset \\alpha, \\; b \\subset \\alpha \\\\ a \\cap b = P \\end{cases} \\;\\Rightarrow\\; l \\perp \\alpha`,
            level: "core",
            condition: "直线与平面内两条相交直线都垂直 (相交是关键充要前提)",
          },
          {
            name: "线面垂直向量法判定",
            latex: `\\vec{l} \\parallel \\vec{n} \\; (\\vec{l} = k\\vec{n}) \\;\\Rightarrow\\; l \\perp \\alpha`,
            level: "core",
            condition: "直线的方向向量与平面的法向量共线 (成比例)",
          },
        ];

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: isParallelMode
        ? "【高考答题规范4步法】① 写出已知线线平行 (l ∥ m)；② 声明 l ⊄ α；③ 声明 m ⊂ α；④ 由判定定理得 l ∥ α。缺步骤 ② 或 ③ 扣 1-2 分！"
        : "【高考线面垂直关键得分点】证明 l ⊥ α 时，必须找到面内两条相交直线 a, b 并写明 a ∩ b = P。很多考生漏写相交导致失分！",
      importance: "gaokao",
    },
    {
      text: "【数形结合二轮通法】几何法通常用于第(1)问判定证明；第(2)问建立空间直角坐标系，利用法向量 n 计算线面角 sinθ = |cos<l, n>| = |l·n| / (|l||n|)。",
      importance: "gaokao",
    },
  ];

  const warnings: WarningItem[] = [];

  // 模式反例与退化警示
  if (isPerpMode && intersectType === 0) {
    warnings.push({
      text: "🚨【高考相交陷阱反例】当前面内两条直线 a ∥ b。即使直线 l 分别垂直于 a 和 b，l 仍可在垂直于该方向的平面内自由晃动倾斜，无法导出 l ⊥ α！线面垂直判定必须强调【相交直线】。",
      level: "danger",
    });
  }

  if (isParallelMode && inPlaneType === 0) {
    warnings.push({
      text: "🚨【高考面外陷阱反例】当前直线位于平面内 (l ⊂ α)。虽然 l ∥ m，但此时 l ⊂ α 而不是 l ∥ α！线面平行判定必须严格满足【平面外一条直线 (l ⊄ α)】。",
      level: "danger",
    });
  }

  const reasoningSteps: ReasoningStep[] = isParallelMode
    ? [
        {
          step: 1,
          title: "审题定法 · 提取直线方向与面外要件",
          detail: `考查直线与平面平行判定。分析直线 l 与平面 α 的几何相对位置，当前线面高度 h = ${zHeight.toFixed(2)}，倾角 θ = ${thetaDeg}°：`,
          latex: `l \\not\\subset \\alpha, \\quad \\vec{l} = (${Math.cos((thetaDeg * Math.PI) / 180).toFixed(2)}, \\, 0, \\, ${Math.sin((thetaDeg * Math.PI) / 180).toFixed(2)})`,
          rubric: "[高考采分点] 明确说明直线位于平面外部并给出方向特征 (+4分)",
        },
        {
          step: 2,
          title: "建模联立 · 面内寻找平行线或法向量垂直",
          detail:
            "平面 α 的法向量为 n = (0, 0, 1)。判定线面平行的充要条件即为方向向量与法向量垂直：",
          latex: `\\vec{l} \\cdot \\vec{n} = \\sin\\theta = 0 \\iff \\theta = 0^\\circ \\implies l \\parallel \\alpha`,
          rubric: "[高考采分点] 正确列出数量积方程或平面内平行线判定式 (+5分)",
        },
        {
          step: 3,
          title: "求解反思 · 线面平行判定定理标准书写",
          detail:
            "综合判定定理三要件（面外、面内、线线平行），书写高考标准证明格式：",
          latex: `\\begin{cases} l \\not\\subset \\alpha \\\\ m \\subset \\alpha \\\\ l \\parallel m \\end{cases} \\implies l \\parallel \\alpha`,
          rubric: "[高考采分点] 规范书写三段论判定格式并下达结论 (+4分)",
        },
      ]
    : [
        {
          step: 1,
          title: "审题定法 · 线面垂直相交要件提取",
          detail:
            "考查直线与平面垂直判定定理。平面内必须存在两条相交直线 a 与 b（交于一点 P）：",
          latex: `a \\subset \\alpha, \\quad b \\subset \\alpha, \\quad a \\cap b = P`,
          rubric: "[高考采分点] 准确指出平面内两条直线相交的核心要件 (+4分)",
        },
        {
          step: 2,
          title: "建模联立 · 双垂直条件联立证明",
          detail:
            "若直线 l 同时垂直于平面内两条相交直线 a 与 b，则方向向量满足联立垂直方程：",
          latex: `\\vec{l} \\cdot \\vec{a} = 0 \\quad \\text{且} \\quad \\vec{l} \\cdot \\vec{b} = 0 \\implies \\vec{l} \\parallel \\vec{n}_\\alpha`,
          rubric: "[高考采分点] 列出双垂直数量积方程并证明与法向量共线 (+5分)",
        },
        {
          step: 3,
          title: "求解反思 · 线面垂直判定结论与反例规避",
          detail:
            "若 a ∥ b 则无法唯一确定法平面（可能产生晃动反例）。相交条件满足时垂直结论成立：",
          latex: `l \\perp a, \\; l \\perp b, \\; a \\cap b = P \\implies l \\perp \\alpha`,
          rubric:
            "[高考采分点] 完整写出线面垂直判定结论并规避平行线反例 (+4分)",
        },
      ];

  const mnemonic = isParallelMode
    ? "线线平行变线面，面外线内不可漏；过线作面得交线，线面又转线线行。"
    : "相交两线定垂直，面内任意皆垂直；同垂直于一平面，两线平行永不偏。";

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    mnemonic,
  };
}
