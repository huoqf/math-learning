import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  TabSwitcher,
  SelectGrid,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/lineParamT";
import { LineParamTScene } from "./components/LineParamTScene";
import { calcLineConicIntersection, type ConicType } from "@/math/lineParamT";
import { formatMathNumber, formatSignedTerm } from "@/utils/mathFormat";

/**
 * 经典高考情景预设库 (Scenario Preset Params)
 * 确保学生切换模式、曲线类型或模型时，参数立即自适应到该情景最佳构型，杜绝无交点或未平分弦等体验断层
 */
function getScenarioPresetParams(
  mode: "definition" | "secant" | "gaokao",
  conicType: ConicType,
  gaokaoModel: "midpoint" | "reciprocal",
): Record<string, number> {
  if (mode === "definition") {
    return {
      x0: 0.5,
      y0: 0.8,
      alpha: 45,
      t: 2.5,
      kNorm: 1.5,
    };
  }

  if (mode === "secant") {
    if (conicType === "circle") {
      return { x0: 1.5, y0: 1.0, alpha: 45, R: 3.0 };
    }
    if (conicType === "ellipse") {
      return { x0: 1.0, y0: 0.5, alpha: 45, a: 3.5, b: 2.0 };
    }
    if (conicType === "parabola") {
      return { x0: 1.5, y0: 0.5, alpha: 45, p: 2.0 };
    }
    // 双曲线 (过原点且 alpha 避开渐近线)
    return { x0: 0.0, y0: 0.0, alpha: 30, a: 2.5, b: 2.0 };
  }

  // mode === "gaokao"
  if (gaokaoModel === "midpoint") {
    if (conicType === "circle") {
      // 垂直于 OP0 的中点弦
      return { x0: 1.0, y0: 1.0, alpha: 135, R: 3.0 };
    }
    if (conicType === "ellipse") {
      // 满足点差法斜率 k = -b²x0 / (a²y0) = -4*1/(9*0.5) = -8/9 => alpha ≈ 138°
      return { x0: 1.0, y0: 0.5, alpha: 138, a: 3.0, b: 2.0 };
    }
    if (conicType === "parabola") {
      // 满足点差法斜率 k = p / y0 = 2 / 1 = 2 => alpha ≈ 63°
      return { x0: 2.0, y0: 1.0, alpha: 63, p: 2.0 };
    }
    // 双曲线中点弦
    return { x0: 3.0, y0: 1.0, alpha: 59, a: 2.0, b: 1.5 };
  }

  // reciprocal (焦点弦倒数和定值模型)
  if (conicType === "parabola") {
    // 抛物线焦点 F(p/2, 0) = (1.0, 0) 当 p = 2.0
    return { x0: 1.0, y0: 0.0, alpha: 60, p: 2.0 };
  }
  if (conicType === "ellipse") {
    // 椭圆焦点 F1(c, 0): a=3.0, b=2.0 => c = sqrt(5) ≈ 2.24
    return { x0: 2.24, y0: 0.0, alpha: 60, a: 3.0, b: 2.0 };
  }
  if (conicType === "hyperbola") {
    // 双曲线焦点 F1(c, 0): a=2.0, b=1.5 => c = 2.5
    return { x0: 2.5, y0: 0.0, alpha: 60, a: 2.0, b: 1.5 };
  }
  // 圆内定点割线模型
  return { x0: 1.0, y0: 0.0, alpha: 45, R: 3.0 };
}

export function LineParamTAnimation() {
  // 核心交互模式：'definition' ($t$的几何意义) | 'secant' (割线与二次曲线) | 'gaokao' (高考模型)
  const [mode, setMode] = useState<"definition" | "secant" | "gaokao">(
    "definition",
  );
  // 二次曲线类型
  const [conicType, setConicType] = useState<ConicType>("circle");
  // 高考探究模型
  const [gaokaoModel, setGaokaoModel] = useState<"midpoint" | "reciprocal">(
    "midpoint",
  );

  // 1. 本地状态管理
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 2. 视口尺寸测量与自适应
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 3. 构建 2D 直角坐标系比例尺：数学范围 X [-6, 6], Y [-4.5, 4.5]
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 4. 求解二次方程代入数值 (用于中屏悬浮 KaTeX)
  const intersect = useMemo(
    () =>
      calcLineConicIntersection(params.x0, params.y0, params.alpha, conicType, {
        R: params.R,
        a: params.a,
        b: params.b,
        p: params.p,
      }),
    [params, conicType],
  );

  // 5. 组装右屏 MathPanel 看板数据
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-conic-param-t", params, {
      mode,
      conicType,
      gaokaoModel,
    });
  }, [params, mode, conicType, gaokaoModel]);

  // 6. 按当前模式过滤并结构化分组 ParamControl 配置
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    let modeKeyGroups: Array<{ group: string; keys: string[] }> = [];

    const curveShapeGroupName =
      conicType === "circle"
        ? "圆半径 (R)"
        : conicType === "ellipse"
          ? "椭圆半轴 (a, b)"
          : conicType === "hyperbola"
            ? "双曲线半轴 (a, b)"
            : "抛物线焦准距 (p)";

    const curveShapeKeys =
      conicType === "circle"
        ? ["R"]
        : conicType === "ellipse" || conicType === "hyperbola"
          ? ["a", "b"]
          : ["p"];

    if (mode === "definition") {
      modeKeyGroups = [
        { group: "定点 P₀(x₀, y₀) 坐标", keys: ["x0", "y0"] },
        { group: "方向向量与动点参数", keys: ["alpha", "t", "kNorm"] },
      ];
    } else {
      modeKeyGroups = [
        { group: "割线定点 P₀(x₀, y₀)", keys: ["x0", "y0"] },
        { group: "割线倾斜角 α", keys: ["alpha"] },
        { group: curveShapeGroupName, keys: curveShapeKeys },
      ];
    }

    const configs: ParamConfig[] = [];
    modeKeyGroups.forEach(({ group, keys }) => {
      keys.forEach((key) => {
        if (key in paramMeta) {
          const meta = paramMeta[key as keyof typeof paramMeta];
          const rawValue = params[key] ?? meta.defaultValue ?? 0;
          // 参数安全契约：椭圆必须满足 a > b > 0，滑块上限随 a 动态收紧
          const isEllipseB = key === "b" && conicType === "ellipse";
          const dynamicMax = isEllipseB
            ? Math.max(
                meta.min ?? 0.1,
                (params.a ?? meta.defaultValue ?? 1) - 0.01,
              )
            : meta.max;
          configs.push({
            key,
            label: meta.label,
            labelFormula: meta.labelFormula,
            value:
              dynamicMax !== undefined && rawValue > dynamicMax
                ? dynamicMax
                : rawValue,
            min: meta.min,
            max: dynamicMax,
            step: meta.step ?? 0.1,
            group,
            description: meta.description,
            descriptionFormula: isEllipseB
              ? `椭圆需满足 $a > b > 0$，当前 $a = ${formatMathNumber(params.a ?? meta.defaultValue ?? 1)}$`
              : meta.descriptionFormula,
            importance: meta.importance,
            marks: meta.marks,
          });
        }
      });
    });

    return configs;
  }, [params, mode, conicType]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleModeChange = (newMode: typeof mode) => {
    setMode(newMode);
    const preset = getScenarioPresetParams(newMode, conicType, gaokaoModel);
    setParams((prev) => ({ ...prev, ...preset }));
  };

  const handleConicTypeChange = (newType: ConicType) => {
    setConicType(newType);
    const preset = getScenarioPresetParams(mode, newType, gaokaoModel);
    setParams((prev) => ({ ...prev, ...preset }));
  };

  const handleGaokaoModelChange = (newModel: "midpoint" | "reciprocal") => {
    setGaokaoModel(newModel);
    const preset = getScenarioPresetParams(mode, conicType, newModel);
    setParams((prev) => ({ ...prev, ...preset }));
  };

  const handleReset = () => {
    const preset = getScenarioPresetParams(mode, conicType, gaokaoModel);
    setParams((prev) => ({ ...prev, ...preset }));
  };

  // 左上角悬浮动态 KaTeX 公式 (精确代入 A t^2 + B t + C = 0)
  const equationLatex = useMemo(() => {
    const rad = (params.alpha * Math.PI) / 180;
    const cosStr = formatMathNumber(Math.cos(rad));
    const sinStr = formatMathNumber(Math.sin(rad));

    if (mode === "definition") {
      return `\\begin{cases} x = \\color{${MATH_COLORS.paramPrimary}}{${formatMathNumber(
        params.x0,
      )}} + t (${cosStr}) \\\\ y = \\color{${MATH_COLORS.paramPrimary}}{${formatMathNumber(
        params.y0,
      )}} + t (${sinStr}) \\end{cases}`;
    }

    const quadTerm = formatSignedTerm(intersect.A, "t^2", true);
    const linTerm = formatSignedTerm(intersect.B, "t");
    const constTerm = formatSignedTerm(intersect.C, "");

    return `${quadTerm} ${linTerm} ${constTerm} = 0 \\quad (t_1+t_2 = ${formatMathNumber(
      intersect.tSum,
    )}, \\: t_1 t_2 = ${formatMathNumber(intersect.tProd)})`;
  }, [params, mode, intersect]);

  // 中屏毛玻璃图例 (SceneLegend) 数据
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    if (mode === "definition") {
      const items: SceneLegendItem[] = [
        {
          color: MATH_COLORS.paramPrimary,
          label: "基准定点 $P_0$",
          style: "point",
        },
        {
          color: MATH_COLORS.vectorPrimary,
          label: "单位方向向量 $\\vec{e}$",
          style: "solid",
        },
        {
          color: MATH_COLORS.paramSecondary,
          label: "标准动点 $P(|t|)$",
          style: "point",
        },
      ];
      if (Math.abs(params.kNorm - 1.0) > 1e-2) {
        items.push({
          color: MATH_COLORS.paramTertiary,
          label: "非标准点 $P'(k_{\\text{norm}}|m|)$",
          style: "hollow-point",
        });
      }
      return items;
    }

    const conicColor =
      conicType === "circle"
        ? MATH_COLORS.circle
        : conicType === "ellipse"
          ? MATH_COLORS.ellipse
          : conicType === "hyperbola"
            ? MATH_COLORS.hyperbola
            : MATH_COLORS.parabola;

    const conicName =
      conicType === "circle"
        ? "圆 $(C)$"
        : conicType === "ellipse"
          ? "椭圆 $(C)$"
          : conicType === "hyperbola"
            ? "双曲线 $(C)$"
            : "抛物线 $(C)$";

    return [
      { color: conicColor, label: conicName, style: "solid" },
      { color: MATH_COLORS.line, label: "割线直线 $l$", style: "dash" },
      {
        color: MATH_COLORS.paramPrimary,
        label: "相交动弦 $AB$",
        style: "solid",
      },
      {
        color: MATH_COLORS.paramPrimary,
        label: "基准定点 $P_0$",
        style: "point",
      },
      {
        color: MATH_COLORS.paramSecondary,
        label: "弦中点 $M$",
        style: "point",
      },
    ];
  }, [mode, conicType, params.kNorm]);

  // 左屏教学提示与题设导引（说明初始条件与探究设问）
  const tipConfig = useMemo(() => {
    if (mode === "definition") {
      return {
        variant: "info" as const,
        badge: "拓展 · 参数 $t$ 的几何意义",
        condition: "直线标准参数方程以定点 $P_0$ 为基准点建立。",
        question:
          "参数 $t$ 的正负号与动点 $P$ 到基点 $P_0$ 的几何有向距离有何对应规律？",
      };
    }
    if (mode === "secant") {
      const curveName =
        conicType === "circle"
          ? "圆"
          : conicType === "ellipse"
            ? "椭圆"
            : conicType === "hyperbola"
              ? "双曲线"
              : "抛物线";
      return {
        variant: "primary" as const,
        badge:
          conicType === "circle"
            ? "割线定理与圆幂 (定值)"
            : "二次曲线割线方幂 (随 $\\alpha$ 变化)",
        condition: `过定点 $P_0$ 的割线与${curveName}相交于 $A, B$ 两点。`,
        question:
          conicType === "circle"
            ? "转动倾斜角 $\\alpha$，观察线段乘积 $|P_0A| \\cdot |P_0B|$ 为何保持定值不变？"
            : "如何利用二次方程韦达定理求解线段乘积 $|P_0A| \\cdot |P_0B|$，并探究其随倾斜角 $\\alpha$ 的变化规律？",
      };
    }
    if (gaokaoModel === "midpoint") {
      return {
        variant: "warning" as const,
        badge: "高考模型 · 中点弦条件",
        condition: "割线过定点 $P_0$，且 $P_0$ 恰好为相交动弦 $AB$ 的中点。",
        question:
          "定点为弦中点时，参数二次方程一次项系数满足什么充要代数条件？",
      };
    }
    const isFocus =
      conicType === "parabola" ||
      conicType === "ellipse" ||
      conicType === "hyperbola";
    return {
      variant: "danger" as const,
      badge: isFocus ? "拓展 · 焦点弦倒数和定值" : "拓展 · 割线线段倒数和",
      condition: isFocus
        ? "割线过焦点 $F$（内部定点），与二次曲线交于 $A, B$ 两点。"
        : "割线过定点 $P_0$，与曲线交于 $A, B$ 两点。",
      question: isFocus
        ? "转动割线倾斜角 $\\alpha$，验证焦半径倒数和为何恒等于定值？"
        : "如何利用参数方程韦达定理求解线段倒数和，并探究同异号分类规律？",
    };
  }, [mode, conicType, gaokaoModel]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择 */}
          <LeftPanelSection title="研究主题">
            <TabSwitcher
              tabs={[
                { key: "definition", label: "几何意义" },
                { key: "secant", label: "割线方幂" },
                { key: "gaokao", label: "高考专题" },
              ]}
              value={mode}
              onChange={(key) => handleModeChange(key as typeof mode)}
            />
          </LeftPanelSection>

          {/* 曲线类型选择（割线与高考模式） */}
          {mode !== "definition" && (
            <LeftPanelSection title="二次曲线类型">
              <SelectGrid
                items={[
                  { key: "circle", label: "圆", description: "圆的标准方程" },
                  {
                    key: "ellipse",
                    label: "椭圆",
                    description: "标准椭圆方程",
                  },
                  {
                    key: "parabola",
                    label: "抛物线",
                    description: "开口向右标准型",
                  },
                  {
                    key: "hyperbola",
                    label: "双曲线",
                    description: "标准双曲线方程",
                  },
                ]}
                value={conicType}
                onChange={(k) => handleConicTypeChange(k as ConicType)}
                variant="filled"
                columns={2}
              />
            </LeftPanelSection>
          )}

          {/* 高考专项模型选择 */}
          {mode === "gaokao" && (
            <LeftPanelSection title="高考专题模型">
              <SelectGrid
                items={[
                  {
                    key: "midpoint",
                    label: "中点弦模型",
                    description: "定点为弦中点",
                  },
                  {
                    key: "reciprocal",
                    label: "线段倒数和",
                    description: "过焦点定值定理",
                  },
                ]}
                value={gaokaoModel}
                onChange={(k) =>
                  handleGaokaoModelChange(k as "midpoint" | "reciprocal")
                }
                variant="filled"
                columns={2}
              />
            </LeftPanelSection>
          )}

          {/* 参数调节 */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 教学提示与题设导引（置于最底部） */}
          <TipCard
            variant={tipConfig.variant}
            badge={tipConfig.badge}
            condition={tipConfig.condition}
            question={tipConfig.question}
          />
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 左上角悬浮 KaTeX 动态代入方程 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={equationLatex} mode="inline" />
          </div>

          {/* SVG 自适应画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <LineParamTScene
              params={params}
              scale={scale}
              vp={vp}
              fontScale={canvasSize.font}
              onParamChange={handleParamChange}
              mode={mode}
              conicType={conicType}
              gaokaoModel={gaokaoModel}
            />
          </AnimationSvgCanvas>

          {/* 右下角 SceneLegend 毛玻璃图例 */}
          <SceneLegend items={legendItems} title="几何图例" />
        </div>
      }
      right={
        <MathPanel
          {...mathData}
          title={
            mode === "definition"
              ? "直线参数 t 几何意义看板"
              : mode === "secant"
                ? conicType === "circle"
                  ? "割线定理与圆幂看板"
                  : "二次曲线割线方幂看板"
                : "拓展 · 直线参数方程看板"
          }
        />
      }
    />
  );
}
