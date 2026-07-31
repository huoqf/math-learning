import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
import { colorize } from "../types";
import { MATH_COLORS } from "@/theme";

export function buildConicDefinitionPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const a = params.a ?? 3.0;
  const c = params.c ?? 2.0;
  const e = params.e ?? 0.66;
  const p = params.p ?? 2.0;
  const theta = params.theta ?? 0.8;

  const studyMode = (config?.studyMode as string) || "firstDef";
  const conicType = (config?.conicType as string) || "ellipse";

  const col = colorize;
  const cPrimary = MATH_COLORS.paramPrimary; // #EF4444
  const cSecondary = MATH_COLORS.paramSecondary; // #D97706
  const cTertiary = MATH_COLORS.paramTertiary; // #059669

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];
  let mnemonic =
    "焦半径求和看椭圆，求差绝对双曲线，到焦点准线抛物线，比值e统领三曲线。";

  if (studyMode === "firstDef") {
    if (conicType === "ellipse") {
      const isDegenerate = a <= c;
      const b = isDegenerate ? 0 : Math.sqrt(a * a - c * c);
      const curE = (c / a).toFixed(3);
      // P 坐标
      const px = a * Math.cos(theta);
      const py = b * Math.sin(theta);
      const d1 = Math.hypot(px - -c, py);
      const d2 = Math.hypot(px - c, py);
      const sumD = d1 + d2;

      quantities.push(
        {
          label: "动点 P 坐标",
          value: `(${px.toFixed(2)}, ${py.toFixed(2)})`,
        },
        {
          label: "焦半径 d₁ = |PF₁|",
          value: d1.toFixed(2),
          color: cPrimary,
        },
        {
          label: "焦半径 d₂ = |PF₂|",
          value: d2.toFixed(2),
          color: cSecondary,
        },
        {
          label: "距离之和 d₁ + d₂",
          value: `${sumD.toFixed(2)} (2a = ${(2 * a).toFixed(2)})`,
        },
        {
          label: "离心率 e",
          value: curE,
          color: cPrimary,
        },
      );

      theorems.push({
        name: "椭圆第一定义",
        latex: "|PF_1| + |PF_2| = 2a \\quad (2a > 2c > 0)",
        note: `平面内到两定点 ${col("F_1", cSecondary)}, ${col("F_2", cSecondary)} 距离之和等于常数 ${col("2a", cPrimary)} 的动点轨迹`,
        prerequisites: ["2a > 2c > 0", "定点 F₁, F₂ 距离为 2c"],
        level: "core",
      });

      if (a === c) {
        warnings.push({
          text: "退化警示 (2a = 2c)：当 2a = 2c 时，动点 P 的轨迹退化为线段 F₁F₂，不再是椭圆。",
          level: "danger",
        });
      } else if (a < c) {
        warnings.push({
          text: "退化警示 (2a < 2c)：当 2a < 2c 时，平面内无任何点满足轨迹条件。",
          level: "danger",
        });
      }

      gaokaoPoints.push({
        text: "高考考点：椭圆焦点三角形 ΔF₁PF₂ 面积 S = b²·tan(θ/2)，考查频次极高。",
        importance: "gaokao",
      });
    } else if (conicType === "hyperbola") {
      const isDegenerate = a >= c;
      const b = isDegenerate ? 0 : Math.sqrt(c * c - a * a);
      const curE = (c / a).toFixed(3);
      // P 在右支上
      const secT = 1 / Math.cos(theta * 0.4);
      const px = a * secT;
      const py = b * Math.tan(theta * 0.4);
      const d1 = Math.hypot(px - -c, py);
      const d2 = Math.hypot(px - c, py);
      const diffD = Math.abs(d1 - d2);

      quantities.push(
        {
          label: "动点 P 坐标",
          value: `(${px.toFixed(2)}, ${py.toFixed(2)})`,
        },
        {
          label: "焦半径 d₁ = |PF₁|",
          value: d1.toFixed(2),
          color: cPrimary,
        },
        {
          label: "焦半径 d₂ = |PF₂|",
          value: d2.toFixed(2),
          color: cSecondary,
        },
        {
          label: "距离之差绝对值 |d₁ - d₂|",
          value: `${diffD.toFixed(2)} (2a = ${(2 * a).toFixed(2)})`,
        },
        {
          label: "离心率 e",
          value: curE,
          color: cPrimary,
        },
      );

      theorems.push({
        name: "双曲线第一定义",
        latex: "||PF_1| - |PF_2|| = 2a \\quad (0 < 2a < 2c)",
        note: `平面内到两定点 ${col("F_1", cSecondary)}, ${col("F_2", cSecondary)} 距离之差绝对值等于常数 ${col("2a", cPrimary)} 的动点轨迹`,
        prerequisites: ["0 < 2a < 2c"],
        level: "core",
      });

      if (a === c) {
        warnings.push({
          text: "退化警示 (2a = 2c)：轨迹退化为以 F₁, F₂ 为端点向外延伸的两条射线。",
          level: "danger",
        });
      } else if (a > c) {
        warnings.push({
          text: "退化警示 (2a > 2c)：到两焦点距离差绝对值大于焦距，无满足条件轨迹。",
          level: "danger",
        });
      }

      gaokaoPoints.push({
        text: "高考考点：双曲线渐近线方程 y = ±(b/a)x，离心率 e = √(1 + (b/a)²)。",
        importance: "gaokao",
      });
    } else {
      // 抛物线 y^2 = 2px
      const px = (p / 2) * Math.pow(theta - 3.14, 2);
      const py = p * (theta - 3.14);
      const dF = Math.hypot(px - p / 2, py);
      const dL = px + p / 2;

      quantities.push(
        {
          label: "动点 P 坐标",
          value: `(${px.toFixed(2)}, ${py.toFixed(2)})`,
        },
        {
          label: "焦点距离 d_F = |PF|",
          value: dF.toFixed(2),
          color: cPrimary,
        },
        {
          label: "到准线距离 d_l",
          value: dL.toFixed(2),
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
        },
      );

      theorems.push({
        name: "抛物线第一定义",
        latex: "|PF| = d_l",
        note: `平面内到定焦点 ${col("F(p/2, 0)", cSecondary)} 与定准线 ${col("x = -p/2", cPrimary)} 距离相等的动点轨迹`,
        prerequisites: ["p > 0", "焦点不在准线上"],
        level: "core",
      });

      gaokaoPoints.push({
        text: "高考考点：对于抛物线 y² = 2px，焦半径 |PF| = x₀ + p/2 极其常用。",
        importance: "gaokao",
      });
    }
  } else if (studyMode === "unifiedDef") {
    // 统一定义 e
    let curveName = "椭圆 (0 < e < 1)";
    if (Math.abs(e - 1.0) < 1e-4) curveName = "抛物线 (e = 1)";
    else if (e > 1.0) curveName = "双曲线 (e > 1)";

    const dlVal = 2.5 + Math.cos(theta) * 1.2;
    const dfVal = e * dlVal;

    quantities.push(
      {
        label: "当前曲线类型",
        value: curveName,
        color: e < 1 ? cPrimary : e === 1 ? cSecondary : cTertiary,
      },
      {
        label: "离心率 e",
        value: e.toFixed(2),
        color: cPrimary,
      },
      {
        label: "到焦点距离 d_F",
        value: dfVal.toFixed(2),
        color: cSecondary,
      },
      {
        label: "到准线距离 d_l",
        value: dlVal.toFixed(2),
        color: cTertiary,
      },
      {
        label: "比值实时验算 d_F / d_l",
        value: (dfVal / dlVal).toFixed(3),
      },
    );

    theorems.push({
      name: "圆锥曲线统一定义 (焦准距比值法)",
      latex: "\\frac{d_F}{d_l} = e \\quad (e > 0)",
      note: `平面内到定焦点 ${col("F", cSecondary)} 的距离与到定准线 ${col("L", cPrimary)} 的距离之比等于常数 ${col("e", cPrimary)} 的点的轨迹`,
      prerequisites: ["焦点 F 不在准线 L 上"],
      level: "important",
    });

    if (Math.abs(e - 1.0) < 0.03) {
      warnings.push({
        text: "临界状态 (e = 1)：椭圆右端无限延伸变开弧，在 e = 1 演变为抛物线。",
        level: "warning",
      });
    }

    gaokaoPoints.push({
      text: "高考考点：利用第二定义可实现“焦半径与到准线距离”的等价转化。",
      importance: "gaokao",
    });
  } else {
    // 动圆生成法
    quantities.push(
      {
        label: "动圆半径 R",
        value: (2 * a).toFixed(2),
        color: cPrimary,
      },
      {
        label: "定圆圆心 F₁",
        value: `(${(-c).toFixed(1)}, 0)`,
        color: cSecondary,
      },
      {
        label: "定圆圆心 F₂",
        value: `(${c.toFixed(1)}, 0)`,
        color: cSecondary,
      },
      {
        label: "动圆圆心 M 轨迹",
        value: conicType === "ellipse" ? "椭圆轨迹" : "双曲线轨迹",
        color: cTertiary,
      },
    );

    theorems.push({
      name: "动圆相切轨迹定理",
      latex: "|MF_1| \\pm |MF_2| = R",
      note: `过定点 ${col("F_2", cSecondary)} 且与已知圆 ${col("(x+c)^2+y^2=R^2", cPrimary)} 相切的动圆圆心 ${col("M", cTertiary)} 的轨迹`,
      prerequisites: ["F₂ 在圆内 -> 椭圆", "F₂ 在圆外 -> 双曲线"],
      level: "derived",
    });

    gaokaoPoints.push({
      text: "高考考点：高考解析几何解答题常考“动圆相切”几何背景求轨迹方程。",
      importance: "core",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic,
  };
}
