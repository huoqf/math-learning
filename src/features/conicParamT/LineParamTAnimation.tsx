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
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/lineParamT";
import { LineParamTScene } from "./components/LineParamTScene";
import { calcLineConicIntersection, type ConicType } from "@/math/lineParamT";

export function LineParamTAnimation() {
  // 核心交互模式：'definition' ($t$的几何意义) | 'secant' (割线与二次曲线) | 'gaokao' (高考模型)
  const [mode, setMode] = useState<"definition" | "secant" | "gaokao">(
    "definition",
  );
  // 二次曲线类型
  const [conicType, setConicType] = useState<ConicType>("circle");
  // 高考探究模型
  const [gaokaoModel, setGaokaoModel] = useState<
    "midpoint" | "product" | "reciprocal"
  >("midpoint");

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
          configs.push({
            key,
            label: meta.label,
            labelFormula: meta.labelFormula,
            value: params[key] ?? meta.defaultValue ?? 0,
            min: meta.min,
            max: meta.max,
            step: meta.step ?? 0.1,
            group,
            description: meta.description,
            descriptionFormula: meta.descriptionFormula,
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

  const handleReset = () => {
    setParams({ ...defaultParams });
  };

  // 左上角悬浮动态 KaTeX 公式 (精确代入 A t^2 + B t + C = 0)
  const equationLatex = useMemo(() => {
    const rad = (params.alpha * Math.PI) / 180;
    const cosStr = Math.cos(rad).toFixed(2);
    const sinStr = Math.sin(rad).toFixed(2);

    if (mode === "definition") {
      return `\\begin{cases} x = \\color{#EF4444}{${params.x0.toFixed(
        1,
      )}} + t (${cosStr}) \\\\ y = \\color{#EF4444}{${params.y0.toFixed(
        1,
      )}} + t (${sinStr}) \\end{cases}`;
    }

    const aStr = intersect.A.toFixed(2);
    const bSign = intersect.B >= 0 ? "+" : "";
    const bStr = intersect.B.toFixed(2);
    const cSign = intersect.C >= 0 ? "+" : "";
    const cStr = intersect.C.toFixed(2);

    return `${aStr} t^2 ${bSign}${bStr} t ${cSign}${cStr} = 0 \\quad (t_1+t_2 = ${intersect.tSum.toFixed(
      2,
    )}, \\: t_1 t_2 = ${intersect.tProd.toFixed(2)})`;
  }, [params, mode, intersect]);

  // 左屏教学提示与题设导引（说明初始条件与探究设问）
  const tipConfig = useMemo(() => {
    if (mode === "definition") {
      return {
        variant: "info" as const,
        badge: "参数 t 的几何意义本质",
        condition: "直线标准参数方程以定点 P₀ 为基准点建立。",
        question:
          "参数 t 的正负号与动点 P 到基点 P₀ 的几何有向距离有何对应规律？",
      };
    }
    if (mode === "secant") {
      return {
        variant: "primary" as const,
        badge: "割线定理与几何方幂",
        condition: `过定点 P₀ 的割线与${conicType === "circle" ? "圆" : conicType === "ellipse" ? "椭圆" : conicType === "hyperbola" ? "双曲线" : "抛物线"}相交于 A, B 两点。`,
        question:
          "如何利用参数方程的根与系数关系，快速求解相交弦长与两线段距离乘积？",
      };
    }
    if (gaokaoModel === "midpoint") {
      return {
        variant: "warning" as const,
        badge: "高考模型 · 中点弦条件",
        condition: "割线过定点 P₀，且 P₀ 恰好为相交动弦 AB 的中点。",
        question:
          "定点为弦中点时，参数二次方程一次项系数满足什么充要代数条件？",
      };
    }
    return {
      variant: "danger" as const,
      badge: "高考模型 · 焦半径与割线倒数和",
      condition:
        "割线过定点 P₀（如焦点或轴上定点），与二次曲线交于 A, B 两点。",
      question: "如何利用参数方程韦达定理求解线段倒数和，并探究其定值与极值？",
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
                { key: "definition", label: "t的几何意义" },
                { key: "secant", label: "割线定理与方幂" },
                { key: "gaokao", label: "中点弦与倒数和" },
              ]}
              value={mode}
              onChange={(key) => setMode(key as typeof mode)}
            />
          </LeftPanelSection>

          {/* 曲线类型选择（割线与高考模式） */}
          {mode !== "definition" && (
            <LeftPanelSection title="二次曲线类型">
              <SelectGrid
                items={[
                  { key: "circle", label: "圆", formula: "x^2+y^2=R^2" },
                  {
                    key: "ellipse",
                    label: "椭圆",
                    formula: "\\frac{x^2}{a^2}+\\frac{y^2}{b^2}=1",
                  },
                  { key: "parabola", label: "抛物线", formula: "y^2=2px" },
                  {
                    key: "hyperbola",
                    label: "双曲线",
                    formula: "\\frac{x^2}{a^2}-\\frac{y^2}{b^2}=1",
                  },
                ]}
                value={conicType}
                onChange={(k) => setConicType(k as ConicType)}
                variant="filled"
                columns={2}
              />
            </LeftPanelSection>
          )}

          {/* 高考专项模型选择（精简为 2 列紧凑网格，去除与割线定理重复的选项） */}
          {mode === "gaokao" && (
            <LeftPanelSection title="高考专题模型">
              <SelectGrid
                items={[
                  {
                    key: "midpoint",
                    label: "中点弦模型",
                    formula: "t_1+t_2=0",
                  },
                  {
                    key: "reciprocal",
                    label: "线段倒数和",
                    formula: "\\left|\\frac{1}{t_1}+\\frac{1}{t_2}\\right|",
                  },
                ]}
                value={gaokaoModel === "product" ? "midpoint" : gaokaoModel}
                onChange={(k) => setGaokaoModel(k as "midpoint" | "reciprocal")}
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

          {/* 教学提示与题设导引（置于参数调节下方） */}
          <LeftPanelSection title="教学导引与题设背景" compact>
            <TipCard variant={tipConfig.variant}>
              <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1">
                <span>{tipConfig.badge}</span>
              </div>
              <div className="space-y-1 text-[11px] leading-relaxed">
                <div>
                  <span className="font-semibold text-neutral-800">
                    【初始条件】
                  </span>
                  <span className="text-neutral-600">
                    {tipConfig.condition}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-800">
                    【探究设问】
                  </span>
                  <span className="text-neutral-600">{tipConfig.question}</span>
                </div>
              </div>
            </TipCard>
          </LeftPanelSection>
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
        </div>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          title={
            mode === "definition"
              ? "直线参数 t 几何意义看板"
              : mode === "secant"
                ? "割线定理与交点韦达看板"
                : "高考直线参数方程压轴看板"
          }
        />
      }
    />
  );
}
