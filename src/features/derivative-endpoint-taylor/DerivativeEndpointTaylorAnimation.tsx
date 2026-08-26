/**
 * src/features/derivative-endpoint-taylor/DerivativeEndpointTaylorAnimation.tsx
 * 端点效应与洛必达/泰勒拟合放缩 编排层组件 (左右屏选项实时同步)
 */

import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  TabSwitcher,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { SceneLegend } from "@/components/Math";
import type { SceneLegendItem } from "@/components/Math";
import { DerivativeEndpointTaylorScene } from "./components/DerivativeEndpointTaylorScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  defaultParams,
  paramMeta,
} from "@/data/registries/derivativeEndpointTaylor";
import type {
  EndpointFuncType,
  TaylorBaseType,
} from "@/math/derivativeEndpointTaylor";

export function DerivativeEndpointTaylorAnimation() {
  // 1. 研究模式状态：'endpoint' | 'lhopital' | 'taylor'
  const [activeMode, setActiveMode] = useState<
    "endpoint" | "lhopital" | "taylor"
  >("endpoint");

  // 2. 端点模式子类型
  const [endpointType, setEndpointType] = useState<EndpointFuncType>("exp");

  // 3. 泰勒拟合基底与阶数
  const [taylorBase, setTaylorBase] = useState<TaylorBaseType>("exp");
  const [taylorOrder, setTaylorOrder] = useState<number>(2);

  // 4. 参数状态 (a, xCurr, x0)
  const [params, setParams] = useState(() => ({
    a: defaultParams.a,
    xCurr: defaultParams.xCurr,
    x0: defaultParams.x0,
  }));

  // 5. 测量视口与防抖
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 6. 直角坐标系比例尺：数学范围 X [-4.5, 4.5]，Y [-3.5, 4.5]
  const scale = useSceneScale({
    vp,
    xRange: [-4.5, 4.5],
    yRange: [-3.5, 4.5],
  });

  // 7. 右屏 MathPanel 数据构建 (完全同步左屏选中的模式与子选项)
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-derivative-endpoint", params, {
      activeMode,
      endpointType,
      taylorBase,
      taylorOrder,
    });
  }, [params, activeMode, endpointType, taylorBase, taylorOrder]);

  // 8. 参数变更
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 9. 参数重置
  const handleReset = () => {
    setParams({
      a: defaultParams.a,
      xCurr: defaultParams.xCurr,
      x0: defaultParams.x0,
    });
  };

  // 10. 按当前模式过滤声明式参数配置 (遵守铁律8与铁律3)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      endpoint: ["a"],
      lhopital: ["xCurr"],
      taylor: ["x0"],
    };

    const keys = keysByMode[activeMode] ?? ["a"];

    return keys
      .filter((k) => k in paramMeta)
      .map((key) => {
        const meta = paramMeta[key as keyof typeof paramMeta];
        return {
          key,
          label: meta.label,
          labelFormula: meta.labelFormula,
          value: params[key as keyof typeof params] ?? meta.defaultValue ?? 0,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 0.05,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, activeMode]);

  // 11. 悬浮 KaTeX 公式构造
  const headerFormulaLatex = useMemo(() => {
    if (activeMode === "endpoint") {
      if (endpointType === "exp") {
        return `f(x) = e^x - \\color{#EF4444}{${params.a.toFixed(2)}} x - 1 \\ge 0 \\quad (x \\ge 0)`;
      } else if (endpointType === "ln") {
        return `f(x) = \\ln(x+1) - \\color{#EF4444}{${params.a.toFixed(2)}} x \\le 0 \\quad (x \\ge 0)`;
      } else {
        return `f(x) = x\\ln x - \\color{#EF4444}{${params.a.toFixed(2)}}(x-1) \\ge 0 \\quad (x \\ge 1)`;
      }
    } else if (activeMode === "lhopital") {
      return `\\lim_{x \\to 0} \\frac{e^x - 1 - x}{x^2} \\xrightarrow{\\text{L'Hôpital}} \\lim_{x \\to 0} \\frac{e^x - 1}{2x} = \\frac{1}{2}`;
    } else {
      if (taylorBase === "exp") {
        return `e^x \\ge P_{${taylorOrder}}(x) \\quad (x \\ge 0)`;
      } else if (taylorBase === "ln") {
        return `\\ln(1+x) \\le P_{${taylorOrder}}(x) \\quad (x \\ge 0)`;
      } else if (taylorBase === "sin") {
        return `\\sin x \\ge P_{${taylorOrder}}(x) \\quad (x \\ge 0)`;
      } else {
        return `\\cos x \\ge P_{${taylorOrder}}(x) \\quad (x \\in \\mathbb{R})`;
      }
    }
  }, [activeMode, endpointType, taylorBase, taylorOrder, params]);

  // 12. 右屏看板标题 (与左屏模式/子选项实时精准同步)
  const panelTitle = useMemo(() => {
    if (activeMode === "endpoint") {
      const typeMap: Record<EndpointFuncType, string> = {
        exp: "指数切线模型",
        ln: "对数切线模型",
        xln: "超越混合模型",
      };
      return `${typeMap[endpointType]} 端点效应看板`;
    }
    if (activeMode === "lhopital") return "洛必达法则 0/0 未定式极限看板";

    const baseMap: Record<TaylorBaseType, string> = {
      exp: "e^x",
      ln: "ln(1+x)",
      sin: "sin x",
      cos: "cos x",
    };
    return `${baseMap[taylorBase]} 泰勒 ${taylorOrder} 阶拟合放缩看板`;
  }, [activeMode, endpointType, taylorBase, taylorOrder]);

  // 教学导引与题设背景配置
  const tipConfig = useMemo(() => {
    switch (activeMode) {
      case "endpoint": {
        const typeName =
          endpointType === "exp"
            ? "指数切线"
            : endpointType === "ln"
              ? "对数切线"
              : "超越混合";
        return {
          variant: "primary" as const,
          badge: `高考压轴 · 端点效应与恒成立 (${typeName})`,
          condition:
            "不等式在区间端点处取等号，要求在定义域半区间内 f(x) ≥ 0 恒成立。",
          question: "求实数参数 a 的取值范围，使得不等式在半区间上恒成立。",
        };
      }
      case "lhopital":
        return {
          variant: "info" as const,
          badge: "高考压轴 · 0/0 型未定式极限逼近",
          condition: "当自变量 x 趋向端点时，分式极限呈现 0/0 未定式形态。",
          question:
            "求自变量逼近端点时分式函数的极限值，确定不等式临界放缩边界。",
        };
      case "taylor":
        return {
          variant: "warning" as const,
          badge: `高考压轴 · 泰勒 ${taylorOrder} 阶拟合放缩`,
          condition: `考察超越基底函数 ${taylorBase} 在原点附近的 ${taylorOrder} 阶多项式逼近。`,
          question: `探究多项式 P_${taylorOrder}(x) 在原点附近的逼近程度，求证对应的多项式放缩不等式。`,
        };
      default:
        return {
          variant: "primary" as const,
          badge: "高考压轴 · 端点效应与放缩",
          condition: "考察函数在端点处的导数性态与极限逼近。",
          question: "求参数范围并验证放缩不等式。",
        };
    }
  }, [activeMode, endpointType, taylorBase, taylorOrder]);

  // 右下角图例配置 (模式专属)
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    if (activeMode === "endpoint") {
      return [
        {
          color: MATH_COLORS.function,
          formula:
            endpointType === "exp"
              ? "f(x) = e^x - ax - 1"
              : endpointType === "ln"
                ? "f(x) = \\ln(x+1) - ax"
                : "f(x) = x - a\\sin x",
          style: "solid",
        },
        {
          color: MATH_COLORS.paramSecondary,
          formula: "y = f'(0)x \\;(\\text{端点切线})",
          style: "dash",
        },
        {
          color: MATH_COLORS.focusPoint,
          formula: "P_0(0, 0) \\;(\\text{端点})",
          style: "point",
        },
        {
          color: MATH_COLORS.paramPrimary,
          formula: "T(1, f'(0)) \\;(\\text{切线控制点})",
          style: "point",
        },
        {
          color: MATH_COLORS.vectorResult,
          label: "必要条件失效区 f'(0) < 0",
          style: "area",
        },
      ];
    } else if (activeMode === "lhopital") {
      return [
        {
          color: MATH_COLORS.function,
          formula: "y = \\frac{f(x)}{g(x)} \\;(\\text{函数比值})",
          style: "solid",
        },
        {
          color: MATH_COLORS.derivative,
          formula: "y = \\frac{f'(x)}{g'(x)} \\;(\\text{导数比值})",
          style: "dash",
        },
        {
          color: MATH_COLORS.focusPoint,
          formula: "L(0, 1) \\;(\\text{极限点})",
          style: "hollow-point",
        },
        {
          color: MATH_COLORS.paramPrimary,
          formula: "P(x, \\text{比值}) \\;(\\text{逼近动点})",
          style: "point",
        },
      ];
    } else {
      return [
        {
          color: MATH_COLORS.function,
          formula: "f(x) \\;(\\text{原函数})",
          style: "solid",
        },
        {
          color: MATH_COLORS.paramPrimary,
          formula: `T_{${taylorOrder}}(x) \\;(\\text{${taylorOrder}阶泰勒拟合})`,
          style: "dash",
        },
        {
          color: MATH_COLORS.focusPoint,
          formula: "P_0(x_0, f(x_0)) \\;(\\text{展开中心})",
          style: "point",
        },
        {
          color: MATH_COLORS.paramSecondary,
          formula: "P(x, f(x)) \\;(\\text{测试点})",
          style: "point",
        },
      ];
    }
  }, [activeMode, endpointType, taylorOrder]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 研究模式切换 */}
          <LeftPanelSection
            title="研究模式"
            subtitle="选择新高考导数压轴研究对象"
          >
            <TabSwitcher
              tabs={[
                { key: "endpoint", label: "端点效应" },
                { key: "lhopital", label: "洛必达逼近" },
                { key: "taylor", label: "泰勒拟合" },
              ]}
              value={activeMode}
              onChange={(k) => setActiveMode(k as typeof activeMode)}
            />
          </LeftPanelSection>

          {/* 子模式配置：端点类型 */}
          {activeMode === "endpoint" && (
            <LeftPanelSection
              title="端点函数构造"
              subtitle="选择常见新高考压轴端点类型"
            >
              <SelectGrid
                items={[
                  {
                    key: "exp",
                    label: "指数切线模型",
                    formula: "f(x) = e^x - ax - 1",
                  },
                  {
                    key: "ln",
                    label: "对数切线模型",
                    formula: "f(x) = \\ln(x+1) - ax",
                  },
                  {
                    key: "xln",
                    label: "超越混合模型",
                    formula: "f(x) = x\\ln x - a(x-1)",
                    fullWidth: true,
                  },
                ]}
                value={endpointType}
                onChange={(k) => setEndpointType(k as EndpointFuncType)}
                variant="filled"
              />
            </LeftPanelSection>
          )}

          {/* 子模式配置：泰勒基底与阶数 */}
          {activeMode === "taylor" && (
            <>
              <LeftPanelSection
                title="超越基底函数"
                subtitle="选择拟合放缩的超越函数"
              >
                <SelectGrid
                  items={[
                    { key: "exp", label: "指数函数", formula: "f(x) = e^x" },
                    {
                      key: "ln",
                      label: "对数函数",
                      formula: "f(x) = \\ln(1+x)",
                    },
                    {
                      key: "sin",
                      label: "正弦函数",
                      formula: "f(x) = \\sin x",
                    },
                    {
                      key: "cos",
                      label: "余弦函数",
                      formula: "f(x) = \\cos x",
                    },
                  ]}
                  value={taylorBase}
                  onChange={(k) => setTaylorBase(k as TaylorBaseType)}
                  variant="filled"
                  columns={2}
                />
              </LeftPanelSection>

              <LeftPanelSection
                title="拟合多项式阶数"
                subtitle="选择泰勒展开多项式阶数"
              >
                <SelectGrid
                  items={[
                    { key: "1", label: "1阶切线放缩", formula: "P_1(x)" },
                    { key: "2", label: "2阶抛物线拟合", formula: "P_2(x)" },
                    { key: "3", label: "3阶三次多项式", formula: "P_3(x)" },
                  ]}
                  value={String(taylorOrder)}
                  onChange={(k) => setTaylorOrder(Number(k))}
                  variant="filled"
                  columns={3}
                />
              </LeftPanelSection>
            </>
          )}

          {/* 参数调节区 */}
          <LeftPanelSection
            title="动态参数控制"
            subtitle="拖动滑块或画布控制点实时交互"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 教学导引与题设背景 */}
          <LeftPanelSection title="教学导引与题设背景" compact>
            <TipCard variant={tipConfig.variant}>
              <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1">
                <span>{tipConfig.badge}</span>
              </div>
              <div className="space-y-1.5 text-[11px] leading-relaxed">
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
                    【核心设问】
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
          {/* 顶栏悬浮 KaTeX 公式 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={headerFormulaLatex} mode="inline" />
          </div>

          {/* 右下角图例 */}
          <SceneLegend items={legendItems} />

          {/* SVG 动画画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <DerivativeEndpointTaylorScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              activeMode={activeMode}
              endpointType={endpointType}
              taylorBase={taylorBase}
              taylorOrder={taylorOrder}
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
          mnemonic={mathData.mnemonic}
          title={panelTitle}
        />
      }
    />
  );
}
