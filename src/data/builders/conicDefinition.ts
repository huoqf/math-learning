import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
  ReasoningStep,
} from "../types";
import { colorize } from "../types";
import { MATH_COLORS } from "@/theme";
import { getFirstDefData, getUnifiedDefData } from "@/math/conicDefinition";

export function buildConicDefinitionPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const a = params.a ?? 3.0;
  const c = params.c ?? 2.0;
  const e = params.e ?? 0.66;
  const p = params.p ?? 2.0;
  const theta = params.theta ?? 0.8;

  const studyMode =
    (config?.studyMode as "firstDef" | "unifiedDef") || "firstDef";
  const conicType =
    (config?.conicType as "ellipse" | "hyperbola" | "parabola") || "ellipse";

  const col = colorize;
  const cPrimary = MATH_COLORS.paramPrimary; // #EF4444
  const cSecondary = MATH_COLORS.paramSecondary; // #D97706
  const cTertiary = MATH_COLORS.paramTertiary; // #059669

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];
  const reasoningSteps: ReasoningStep[] = [];
  let mnemonic =
    "焦半径求和看椭圆，求差绝对双曲线，到焦点准线抛物线，比值e统领三曲线。";

  if (studyMode === "firstDef") {
    const sceneData = getFirstDefData(conicType, a, c, p, theta);

    if (conicType === "ellipse") {
      const isDegenerate = sceneData.isDegenerate;
      const b = a > c ? Math.sqrt(a * a - c * c) : 0;
      const curE = (c / a).toFixed(3);
      const sumD = sceneData.d1 + (sceneData.d2 ?? 0);

      // 焦点三角形面积计算: S = 1/2 * |F1F2| * |y_P| = c * |y_P|
      const triArea = (c * Math.abs(sceneData.pPoint.y)).toFixed(2);

      quantities.push(
        {
          label: "动点 P 坐标",
          value: `(${sceneData.pPoint.x.toFixed(2)}, ${sceneData.pPoint.y.toFixed(2)})`,
        },
        {
          label: "短半轴 b = √(a²-c²)",
          value: isDegenerate ? "0.00 (退化)" : b.toFixed(2),
          color: cTertiary,
        },
        {
          label: "焦半径 d₁ = |PF₁|",
          value: sceneData.d1.toFixed(2),
          color: cPrimary,
        },
        {
          label: "焦半径 d₂ = |PF₂|",
          value: (sceneData.d2 ?? 0).toFixed(2),
          color: cSecondary,
        },
        {
          label: "距离之和 d₁ + d₂",
          value: `${sumD.toFixed(2)} (理论 2a = ${(2 * a).toFixed(2)})`,
          color: cPrimary,
        },
        {
          label: "离心率 e = c/a",
          value: curE,
          color: cPrimary,
        },
        {
          label: "焦点三角形 ΔF₁PF₂ 面积",
          value: isDegenerate ? "0.00 (退化)" : triArea,
        },
      );

      theorems.push({
        name: "椭圆第一定义",
        latex: "|PF_1| + |PF_2| = 2a \\quad (2a > 2c > 0)",
        note: `平面内到两定点 ${col("F_1", cSecondary)}, ${col("F_2", cSecondary)} 的距离之和等于常数 ${col("2a", cPrimary)} 的动点轨迹`,
        prerequisites: ["$2a > 2c > 0$", "定点 $F_1, F_2$ 间距为 $2c$"],
        level: "core",
      });

      if (a === c) {
        warnings.push({
          text: "退化警示 ($2a = 2c$)：动点 $P$ 到两焦点距离之和等于焦距，轨迹退化为线段 $F_1F_2$。",
          level: "danger",
        });
      } else if (a < c) {
        warnings.push({
          text: "退化警示 ($2a < 2c$)：三角形两边之和小于第三边，平面内不存在任何点满足轨迹条件。",
          level: "danger",
        });
      }

      reasoningSteps.push(
        {
          step: 1,
          title: "审题建系与定义建模",
          detail:
            "以两定点 $F_1(-c, 0), F_2(c, 0)$ 所在直线为 $x$ 轴，线段 $F_1F_2$ 垂直平分线为 $y$ 轴建系。动点 $P(x, y)$ 满足几何等式：",
          latex: "|PF_1| + |PF_2| = 2a \\quad (2a > 2c > 0)",
          rubric: "审题定法与设点",
        },
        {
          step: 2,
          title: "坐标代入与双重平方消元",
          detail:
            "代入距离公式 $\\sqrt{(x+c)^2+y^2} + \\sqrt{(x-c)^2+y^2} = 2a$。移项平方整理：",
          latex: "a\\sqrt{(x-c)^2+y^2} = a^2 - cx",
          rubric: "移项平方化简",
        },
        {
          step: 3,
          title: "二次平方与标准方程确立",
          detail:
            "再次两边平方得 $(a^2-c^2)x^2 + a^2y^2 = a^2(a^2-c^2)$。令 $b^2 = a^2 - c^2 > 0$，两边同除以 $a^2b^2$：",
          latex: "\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1 \\quad (a > b > 0)",
          rubric: "换元确立标准方程",
        },
      );

      gaokaoPoints.push(
        {
          text: "高考核心考点：焦点三角形面积公式 $S = b^2\\tan\\frac{\\theta}{2}$（$\\theta = \\angle F_1PF_2$），在高考定值与极值题中秒杀率极高。",
          importance: "gaokao",
        },
        {
          text: "高考轨迹模型（动圆相切）：若动圆 $M$ 与定圆 $C_1: (x+c)^2+y^2=4a^2$ 内切且过定点 $F_2(c, 0)$，则 $|MC_1| + |MF_2| = 2a$，动圆心 $M$ 的轨迹必为椭圆。",
          importance: "gaokao",
        },
        {
          text: "高考大招：若设问涉及焦半径乘积 $|PF_1|\\cdot|PF_2|$，首选联立余弦定理 $|F_1F_2|^2 = d_1^2 + d_2^2 - 2d_1d_2\\cos\\theta$ 与定义式 $(d_1+d_2)^2 = 4a^2$。",
          importance: "core",
        },
      );
    } else if (conicType === "hyperbola") {
      const isDegenerate = sceneData.isDegenerate;
      const b = c > a ? Math.sqrt(c * c - a * a) : 0;
      const curE = (c / a).toFixed(3);
      const diffD = Math.abs(sceneData.d1 - (sceneData.d2 ?? 0));
      const branchSide =
        sceneData.pPoint.x >= 0
          ? "右支 (|PF₁| - |PF₂| = 2a)"
          : "左支 (|PF₂| - |PF₁| = 2a)";

      quantities.push(
        {
          label: "动点 P 坐标",
          value: `(${sceneData.pPoint.x.toFixed(2)}, ${sceneData.pPoint.y.toFixed(2)})`,
        },
        {
          label: "虚半轴 b = √(c²-a²)",
          value: isDegenerate ? "0.00 (退化)" : b.toFixed(2),
          color: cTertiary,
        },
        {
          label: "所在分支",
          value: branchSide,
          color: cSecondary,
        },
        {
          label: "焦半径 d₁ = |PF₁|",
          value: sceneData.d1.toFixed(2),
          color: cPrimary,
        },
        {
          label: "焦半径 d₂ = |PF₂|",
          value: (sceneData.d2 ?? 0).toFixed(2),
          color: cSecondary,
        },
        {
          label: "距离差绝对值 ||d₁ - d₂||",
          value: `${diffD.toFixed(2)} (理论 2a = ${(2 * a).toFixed(2)})`,
          color: cPrimary,
        },
        {
          label: "离心率 e = c/a",
          value: curE,
          color: cPrimary,
        },
      );

      theorems.push({
        name: "双曲线第一定义",
        latex: "||PF_1| - |PF_2|| = 2a \\quad (0 < 2a < 2c)",
        note: `平面内到两定点 ${col("F_1", cSecondary)}, ${col("F_2", cSecondary)} 距离之差的绝对值等于常数 ${col("2a", cPrimary)} 的动点轨迹`,
        prerequisites: [
          "$0 < 2a < 2c$",
          "带绝对值对应双分支，不带绝对值仅对应单分支",
        ],
        level: "core",
      });

      if (a === c) {
        warnings.push({
          text: "退化警示 ($2a = 2c$)：轨迹退化为以 $F_1, F_2$ 为端点且向外延伸的两条反向射线。",
          level: "danger",
        });
      } else if (a > c) {
        warnings.push({
          text: "退化警示 ($2a > 2c$)：三角形两边之差大于第三边，平面内无任何点满足轨迹条件。",
          level: "danger",
        });
      }

      reasoningSteps.push(
        {
          step: 1,
          title: "审题建系与绝对值几何建模",
          detail:
            "两焦点为 $F_1(-c, 0), F_2(c, 0)$，常数 $0 < 2a < 2c$。由于动点可能更靠近 $F_1$ 或 $F_2$，必须使用绝对值统摄：",
          latex:
            "||PF_1| - |PF_2|| = 2a \\iff \\sqrt{(x+c)^2+y^2} - \\sqrt{(x-c)^2+y^2} = \\pm 2a",
          rubric: "审题定法与双支建模",
        },
        {
          step: 2,
          title: "代数消元与双支对应性",
          detail:
            "移项平方整理得 $\\pm a\\sqrt{(x-c)^2+y^2} = a^2 - cx$。其中“$+$”号对应左支（$x \\le -a$），“$-$”号对应右支（$x \\ge a$）。再次平方：",
          latex: "(c^2-a^2)x^2 - a^2y^2 = a^2(c^2-a^2)",
          rubric: "双重平方展开消元",
        },
        {
          step: 3,
          title: "换元与双曲线标准方程",
          detail:
            "因 $c > a > 0$，令 $b^2 = c^2 - a^2 > 0$，两边同除以 $a^2b^2$，得到双曲线标准方程：",
          latex:
            "\\frac{x^2}{a^2} - \\frac{y^2}{b^2} = 1 \\quad (a > 0, b > 0)",
          rubric: "换元确立标准方程",
        },
      );

      gaokaoPoints.push(
        {
          text: "高考易错点：双曲线第一定义极易遗漏“绝对值”，不带绝对值仅代表双曲线的一支（左支或右支）。",
          importance: "gaokao",
        },
        {
          text: "高考模型（动圆外切）：若动圆 $M$ 与定圆 $C_1: (x+c)^2+y^2=4a^2$ 外切且过定点 $F_2(c, 0)$，则 $||MC_1| - |MF_2|| = 2a$，动圆心 $M$ 的轨迹必为双曲线。",
          importance: "gaokao",
        },
        {
          text: "高考大招：双曲线焦点三角形面积公式 $S = \\frac{b^2}{\\tan(\\theta/2)}$，与椭圆面积公式互为倒数对称。",
          importance: "core",
        },
      );
    } else {
      // 抛物线
      const sceneDataP = getFirstDefData("parabola", a, c, p, theta);
      const px = sceneDataP.pPoint.x;
      const py = sceneDataP.pPoint.y;
      const df = sceneDataP.d1;
      const dl = sceneDataP.dl ?? 0;

      quantities.push(
        {
          label: "动点 P 坐标",
          value: `(${px.toFixed(2)}, ${py.toFixed(2)})`,
        },
        {
          label: "焦半径 |PF|",
          value: df.toFixed(2),
          color: cPrimary,
        },
        {
          label: "到准线距离 d_l",
          value: dl.toFixed(2),
          color: cSecondary,
        },
        {
          label: "焦准距 p",
          value: p.toFixed(2),
          color: cTertiary,
        },
        {
          label: "离心率 e",
          value: "1.000",
          color: cPrimary,
        },
      );

      theorems.push({
        name: "抛物线第一定义",
        latex: "|PF| = d_l \\iff |PF| = x_P + \\frac{p}{2}",
        note: `平面内到定焦点 ${col("F(p/2, 0)", cSecondary)} 与定准线 ${col("x = -p/2", cPrimary)} 距离相等的动点轨迹`,
        prerequisites: ["$p > 0$", "焦点 $F$ 不在准线 $l$ 上"],
        level: "core",
      });

      if (p <= 0.2) {
        warnings.push({
          text: "临界警示 ($p \\to 0$)：当焦点逼近准线时，抛物线急剧变窄退化为过焦点的射线。",
          level: "warning",
        });
      }

      reasoningSteps.push(
        {
          step: 1,
          title: "审题建系与定义建模",
          detail:
            "取过焦点 $F$ 垂直于准线 $l$ 的直线为 $x$ 轴，垂足与焦点连线中点为原点。焦点 $F\\left(\\frac{p}{2}, 0\\right)$，准线 $l: x = -\\frac{p}{2}$。由定义：",
          latex: "|PF| = d_l",
          rubric: "建系与列定义式",
        },
        {
          step: 2,
          title: "代入坐标距离表达式",
          detail:
            "设动点 $P(x, y)$（$x \\ge 0$），代入两点间距离与点到直线距离公式：",
          latex:
            "\\sqrt{\\left(x - \\frac{p}{2}\\right)^2 + y^2} = x + \\frac{p}{2}",
          rubric: "坐标化代入",
        },
        {
          step: 3,
          title: "平方化简求得标准方程",
          detail:
            "两边平方展开：$x^2 - px + \\frac{p^2}{4} + y^2 = x^2 + px + \\frac{p^2}{4}$。移项化简得抛物线标准方程：",
          latex: "y^2 = 2px \\quad (p > 0)",
          rubric: "平方化简确立方程",
        },
      );

      gaokaoPoints.push(
        {
          text: "高考核心大招：对于抛物线 $y^2 = 2px$ 上的点 $P(x_0, y_0)$，焦半径必有 $|PF| = x_0 + \\frac{p}{2}$，遇焦点弦/焦半径首选化为准线垂线段。",
          importance: "gaokao",
        },
        {
          text: "高考焦点弦长公式：若焦点弦 $AB$ 倾斜角为 $\\alpha$，则 $|AB| = x_1 + x_2 + p = \\frac{2p}{\\sin^2\\alpha}$。",
          importance: "core",
        },
      );
    }
  } else if (studyMode === "unifiedDef") {
    const sceneDataU = getUnifiedDefData(e, p, theta);
    let curveName = "椭圆 (0 < e < 1)";
    if (Math.abs(e - 1.0) < 1e-4) curveName = "抛物线 (e = 1)";
    else if (e > 1.0) curveName = "双曲线 (e > 1)";

    const dfVal = sceneDataU.d1;
    const dlVal = sceneDataU.dl ?? 1;
    const ratio = dfVal / dlVal;

    quantities.push(
      {
        label: "当前曲线形态",
        value: curveName,
        color: e < 1 ? cPrimary : e === 1 ? cTertiary : cSecondary,
      },
      {
        label: "离心率 e (设定值)",
        value: e.toFixed(2),
        color: cPrimary,
      },
      {
        label: "动点 P 坐标",
        value: `(${sceneDataU.pPoint.x.toFixed(2)}, ${sceneDataU.pPoint.y.toFixed(2)})`,
      },
      {
        label: "到焦点真实距离 d_F",
        value: dfVal.toFixed(2),
        color: cSecondary,
      },
      {
        label: "到准线真实距离 d_l",
        value: dlVal.toFixed(2),
        color: cTertiary,
      },
      {
        label: "实时比值验算 d_F / d_l",
        value: `${ratio.toFixed(3)} ≡ e`,
        color: cPrimary,
      },
    );

    theorems.push({
      name: "圆锥曲线统一定义 (第二定义 / 焦准比法)",
      latex: "\\frac{d_F}{d_l} = e \\quad (e > 0)",
      note: `动点到定焦点 ${col("F", cSecondary)} 的距离与到定准线 ${col("l", cPrimary)} 的距离之比等于常数 ${col("e", cPrimary)}：$0<e<1$ 椭圆，$e=1$ 抛物线，$e>1$ 双曲线`,
      prerequisites: [
        "焦点 $F$ 不在准线 $l$ 上",
        "$p$ 为焦点到准线距离（$p > 0$）",
      ],
      level: "core",
    });

    if (Math.abs(e - 1.0) < 0.05) {
      warnings.push({
        text: "临界突变 ($e \\to 1$)：当离心率 $e$ 从小于 $1$ 增大到 $1$ 时，闭合椭圆右端破开延伸至无穷远，突变为抛物线开弧。",
        level: "warning",
      });
    }

    reasoningSteps.push(
      {
        step: 1,
        title: "焦准比几何条件列式",
        detail:
          "定焦点取为 $F\\left(\\frac{p}{2}, 0\\right)$，对应定准线为 $l: x = -\\frac{p}{2}$。动点 $P(x, y)$ 满足焦准距比值恒为 $e$：",
        latex:
          "\\frac{\\sqrt{\\left(x - \\frac{p}{2}\\right)^2 + y^2}}{\\left|x + \\frac{p}{2}\\right|} = e",
        rubric: "焦准比列式",
      },
      {
        step: 2,
        title: "二次去分母与代数方程展开",
        detail:
          "两边平方去分母：$\\left(x - \\frac{p}{2}\\right)^2 + y^2 = e^2\\left(x + \\frac{p}{2}\\right)^2$。合并同类项展开整理为关于 $x, y$ 的二次方程：",
        latex: "(1 - e^2)x^2 - p(1 + e^2)x + y^2 + \\frac{p^2(1 - e^2)}{4} = 0",
        rubric: "展开整理二次方程",
      },
      {
        step: 3,
        title: "离心率 e 判别三大圆锥曲线形态",
        detail:
          "二次项系数 $(1-e^2)$ 与 $1$ 符号决定曲线类型：当 $0 < e < 1$ 时两项同号配方得椭圆；当 $e = 1$ 时二次项抵消得抛物线；当 $e > 1$ 时两项异号配方得包含左右两支的双曲线：",
        latex:
          "e \\in (0, 1) \\implies \\text{椭圆}, \\quad e = 1 \\implies \\text{抛物线}, \\quad e > 1 \\implies \\text{双曲线}",
        rubric: "分类讨论与形态判定",
      },
    );

    gaokaoPoints.push(
      {
        text: "高考折线最值核心大招：统一定义主要用于将“含系数折线距离”转化，将 $|PA| + e\\cdot|PF|$ 中的 $|PF|$ 转化为到准线的距离 $d_l$，即可直接引垂线段求得几何最小值！",
        importance: "gaokao",
      },
      {
        text: "高考准线几何公式：椭圆/双曲线的准线方程为 $x = \\pm \\frac{a^2}{c}$，焦准距 $p = \\frac{b^2}{c}$，满足焦准比 $e = \\frac{c}{a}$ 且 $e\\cdot p = \\frac{b^2}{a}$（半通径）。",
        importance: "core",
      },
    );
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    mnemonic,
  };
}
