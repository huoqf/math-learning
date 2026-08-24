import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
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
    (config?.studyMode as "firstDef" | "unifiedDef" | "locusGen") || "firstDef";
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
        prerequisites: ["2a > 2c > 0", "定点 F₁, F₂ 距离为 2c"],
        level: "core",
      });

      if (a === c) {
        warnings.push({
          text: "退化警示 (2a = 2c)：动点 P 的轨迹退化为线段 F₁F₂，不再是椭圆。",
          level: "danger",
        });
      } else if (a < c) {
        warnings.push({
          text: "退化警示 (2a < 2c)：三角形两边之和小于第三边，平面内无任何点满足轨迹条件。",
          level: "danger",
        });
      }

      gaokaoPoints.push(
        {
          text: "高考考点：焦点三角形面积公式 S = b²·tan(θ/2)（θ为∠F₁PF₂顶角），在高考极值与几何题中秒杀率极高。",
          importance: "gaokao",
        },
        {
          text: "高考核心模型（动圆相切）：已知定圆 C₁:(x+c)²+y²=4a² 与定点 F₂(c,0)，动圆 M 与圆 C₁ 内切且过 F₂ ⟹ |MC₁| + |MF₂| = 2a ⟹ 动圆心 M 轨迹必为标准椭圆。",
          importance: "gaokao",
        },
        {
          text: "高考大招：若 |PF₁|·|PF₂| 出现，立即联立余弦定理 |F₁F₂|² = d₁² + d₂² - 2d₁d₂cosθ 与定义式 (d₁+d₂)² = 4a²。",
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
          "0 < 2a < 2c",
          "带绝对值对应双支，不带绝对值仅对应单支",
        ],
        level: "core",
      });

      if (a === c) {
        warnings.push({
          text: "退化警示 (2a = 2c)：轨迹退化为以 F₁, F₂ 为端点向外延伸的两条反向射线。",
          level: "danger",
        });
      } else if (a > c) {
        warnings.push({
          text: "退化警示 (2a > 2c)：三角形两边之差大于第三边，平面内无满足条件轨迹。",
          level: "danger",
        });
      }

      gaokaoPoints.push(
        {
          text: "高考考点：双曲线第一定义极易遗漏“绝对值”，不带绝对值仅代表双曲线的一支（左支或右支）。",
          importance: "gaokao",
        },
        {
          text: "高考核心模型（动圆外切）：若动圆 M 与定圆 C₁:(x+c)²+y²=4a² 外切且过定点 F₂(c,0) ⟹ ||MC₁| - |MF₂|| = 2a ⟹ 动圆心 M 轨迹必为双曲线分支。",
          importance: "gaokao",
        },
        {
          text: "高考大招：双曲线焦点三角形面积公式 S = b² / tan(θ/2)，与椭圆面积公式互为倒数对称。",
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
        prerequisites: ["p > 0", "焦点不在准线上"],
        level: "core",
      });

      gaokaoPoints.push(
        {
          text: "高考核心大招：对于抛物线 y² = 2px 上的点 P(x₀, y₀)，焦半径必有 |PF| = x₀ + p/2，遇焦点弦/焦半径首选化为准线距离。",
          importance: "gaokao",
        },
        {
          text: "高考焦点弦长公式：若焦点弦倾斜角为 α，则 |AB| = x₁ + x₂ + p = 2p / sin²α。",
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
        color: e < 1 ? cPrimary : e === 1 ? cSecondary : cTertiary,
      },
      {
        label: "离心率 e (设定值)",
        value: e.toFixed(2),
        color: cPrimary,
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
      note: `动点到定焦点 ${col("F", cSecondary)} 的距离与到定准线 ${col("L", cPrimary)} 的距离之比等于常数 ${col("e", cPrimary)}：e<1椭圆，e=1抛物线，e>1双曲线`,
      prerequisites: ["焦点 F 不在准线 L 上", "p 为焦点到准线距离"],
      level: "core",
    });

    if (Math.abs(e - 1.0) < 0.05) {
      warnings.push({
        text: "临界突变 (e → 1)：当离心率 e 从小于 1 增大到 1 时，闭合椭圆右端破开延伸至无穷远，突变为抛物线开弧。",
        level: "warning",
      });
    }

    gaokaoPoints.push(
      {
        text: "高考大招：统一定义核心用于“折线最值问题”，将 |PA| + |PF| 转化为 |PA| + e·d_l，作垂直于准线的垂线段即可求得几何最小值！",
        importance: "gaokao",
      },
      {
        text: "高考考点：椭圆/双曲线的准线方程为 x = ±a²/c，焦准距 p = b²/c，满足 e·p = b²/a（通径之半）。",
        importance: "core",
      },
    );
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic,
  };
}
