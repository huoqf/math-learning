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
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
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
  const [params, setParams] = useState<Record<string, number>>(() => ({
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
          value: params[key] ?? meta.defaultValue ?? 0,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 0.05,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance as any,
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
              onChange={(k) => setActiveMode(k as any)}
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
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 顶栏悬浮 KaTeX 公式 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={headerFormulaLatex} mode="inline" />
          </div>

          {/* SVG 动画画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <DerivativeEndpointTaylorScene
              params={params as any}
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
