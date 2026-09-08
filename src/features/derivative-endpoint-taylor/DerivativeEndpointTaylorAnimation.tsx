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

  // 4. 参数状态 (a, xCurr, xTest)
  const [params, setParams] = useState(() => ({
    a: defaultParams.a,
    xCurr: defaultParams.xCurr,
    xTest: defaultParams.xTest,
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
      xTest: defaultParams.xTest,
    });
  };

  // 10. 按当前模式过滤声明式参数配置 (遵守铁律8与铁律3)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      endpoint: ["a"],
      lhopital: ["xCurr"],
      taylor: ["xTest"],
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
        return `f(x) = e^x - \\color{${MATH_COLORS.paramPrimary}}{${params.a.toFixed(2)}} x - 1 \\ge 0 \\quad (x \\ge 0)`;
      } else if (endpointType === "ln") {
        return `f(x) = \\ln(x+1) - \\color{${MATH_COLORS.paramPrimary}}{${params.a.toFixed(2)}} x \\le 0 \\quad (x \\ge 0)`;
      } else {
        return `f(x) = x\\ln x - \\color{${MATH_COLORS.paramPrimary}}{${params.a.toFixed(2)}}(x-1) \\ge 0 \\quad (x \\ge 1)`;
      }
    } else if (activeMode === "lhopital") {
      return `\\lim_{x \\to 0} \\frac{e^x - 1 - x}{x^2} \\xrightarrow{\\text{L'Hôpital}} \\lim_{x \\to 0} \\frac{e^x - 1}{2x} = \\frac{1}{2}`;
    } else {
      const expPoly =
        taylorOrder === 1
          ? "1+x"
          : taylorOrder === 2
            ? "1+x+\\frac{1}{2}x^2"
            : "1+x+\\frac{1}{2}x^2+\\frac{1}{6}x^3";
      if (taylorBase === "exp") {
        return `e^x \\ge P_{${taylorOrder}}(x) = ${expPoly} \\quad (x \\ge 0)`;
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
    return `${baseMap[taylorBase]} 麦克劳林 ${taylorOrder} 阶拟合放缩看板`;
  }, [activeMode, endpointType, taylorBase, taylorOrder]);

  // 教学导引与题设背景配置 (精准严密对齐高中题设与新高考评分标准)
  const tipConfig = useMemo(() => {
    switch (activeMode) {
      case "endpoint": {
        const isLn = endpointType === "ln";
        const isExp = endpointType === "exp";
        return {
          variant: "primary" as const,
          badge: `新高考导数压轴 · 端点效应 (${isExp ? "指数切线模型" : isLn ? "对数切线模型" : "超越混合模型"})`,
          condition: isLn
            ? "已知函数 $f(x) = \\ln(x+1) - ax$ 在区间 $[0, +\\infty)$ 上恒满足 $f(x) \\le 0$。"
            : isExp
              ? "已知函数 $f(x) = e^x - ax - 1$ 在区间 $[0, +\\infty)$ 上恒满足 $f(x) \\ge 0$。"
              : "已知函数 $f(x) = x\\ln x - a(x-1)$ 在区间 $[1, +\\infty)$ 上恒满足 $f(x) \\ge 0$。",
          question:
            "探究端点处的导数保号性以锁定参数 $a$ 的必要取值，并完成大题充分性证明。",
        };
      }
      case "lhopital":
        return {
          variant: "info" as const,
          badge: "高考解题通法 · 0/0 型未定式极限逼近",
          condition:
            "在参数分离求解恒成立问题时，遇端点未定式极限 $\\lim_{x \\to 0} \\frac{e^x - 1 - x}{x^2}$。",
          question:
            "草稿纸如何用洛必达法则快速锁定参数临界？卷面如何用导数定义规范证明？",
        };
      case "taylor": {
        const baseName =
          taylorBase === "exp"
            ? "指数基底 $e^x$"
            : taylorBase === "ln"
              ? "对数基底 $\\ln(1+x)$"
              : taylorBase === "sin"
                ? "正弦基底 $\\sin x$"
                : "余弦基底 $\\cos x$";
        return {
          variant: "warning" as const,
          badge: `高考命题溯源 · 麦克劳林 ${taylorOrder} 阶拟合放缩`,
          condition: `考察${baseName}在原点附近截断的 ${taylorOrder} 阶麦克劳林多项式 $P_{${taylorOrder}}(x)$。`,
          question: `调节测试动点 $x$ 观察残差 $|R_n(x)|$ 的收敛效果，掌握差函数逐阶求导证明通法。`,
        };
      }
      default:
        return {
          variant: "primary" as const,
          badge: "高考压轴 · 端点效应与放缩",
          condition: "考察函数在端点处的导数性态与极限逼近。",
          question: "求参数范围并验证放缩不等式。",
        };
    }
  }, [activeMode, endpointType, taylorBase, taylorOrder]);

  // 右下角图例配置 (模式专属，严格规范 KaTeX 与色彩绑定)
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    if (activeMode === "endpoint") {
      return [
        {
          color: MATH_COLORS.function,
          label:
            endpointType === "exp"
              ? "原函数 $f(x) = e^x - ax - 1$"
              : endpointType === "ln"
                ? "原函数 $f(x) = \\ln(x+1) - ax$"
                : "原函数 $f(x) = x\\ln x - a(x-1)$",
          style: "solid",
        },
        {
          color: MATH_COLORS.paramSecondary,
          label: "端点切线 $y = f'(x_0)(x-x_0)$",
          style: "dash",
        },
        {
          color: MATH_COLORS.focusPoint,
          label: "端点 $P_0$",
          style: "point",
        },
        {
          color: MATH_COLORS.paramPrimary,
          label: "切线控制点 $T$",
          style: "point",
        },
        {
          color: MATH_COLORS.vectorResult,
          label: "必要条件失效区 (导数反向穿透)",
          style: "area",
        },
      ];
    } else if (activeMode === "lhopital") {
      return [
        {
          color: MATH_COLORS.function,
          label: "原式函数 $y = N(x)/D(x)$",
          style: "solid",
        },
        {
          color: MATH_COLORS.derivative,
          label: "导数之比 $y = N'(x)/D'(x)$",
          style: "dash",
        },
        {
          color: MATH_COLORS.focusPoint,
          label: "极限点 $L(0, 1/2)$",
          style: "hollow-point",
        },
        {
          color: MATH_COLORS.paramPrimary,
          label: "逼近动点 $P$",
          style: "point",
        },
      ];
    } else {
      return [
        {
          color: MATH_COLORS.function,
          label: "超越基底函数 $f(x)$",
          style: "solid",
        },
        {
          color: MATH_COLORS.paramPrimary,
          label: `${taylorOrder} 阶拟合曲线 $P_{${taylorOrder}}(x)$`,
          style: "dash",
        },
        {
          color: MATH_COLORS.vectorResult,
          label: "截断绝对残差 $|R_n(x)|$",
          style: "dash",
        },
        {
          color: MATH_COLORS.focusPoint,
          label: "展开基准原点 $O(0,0)$",
          style: "point",
        },
        {
          color: MATH_COLORS.paramPrimary,
          label: "测试动点 $P(x, P_n(x))$",
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
          <LeftPanelSection title="研究模式">
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

          {/* 子模式配置：端点类型 (纯净加粗中文标题，杜绝选项堆砌公式) */}
          {activeMode === "endpoint" && (
            <LeftPanelSection title="端点函数模型">
              <SelectGrid
                items={[
                  {
                    key: "exp",
                    label: "指数切线模型",
                  },
                  {
                    key: "ln",
                    label: "对数切线模型",
                  },
                  {
                    key: "xln",
                    label: "超越混合模型",
                    fullWidth: true,
                  },
                ]}
                value={endpointType}
                onChange={(k) => setEndpointType(k as EndpointFuncType)}
                variant="filled"
                columns={2}
              />
            </LeftPanelSection>
          )}

          {/* 子模式配置：泰勒基底与阶数 (纯净加粗中文标题) */}
          {activeMode === "taylor" && (
            <>
              <LeftPanelSection title="超越基底函数">
                <SelectGrid
                  items={[
                    { key: "exp", label: "指数函数" },
                    { key: "ln", label: "对数函数" },
                    { key: "sin", label: "正弦函数" },
                    { key: "cos", label: "余弦函数" },
                  ]}
                  value={taylorBase}
                  onChange={(k) => setTaylorBase(k as TaylorBaseType)}
                  variant="filled"
                  columns={2}
                />
              </LeftPanelSection>

              <LeftPanelSection title="拟合多项式阶数">
                <SelectGrid
                  items={[
                    { key: "1", label: "1阶切线" },
                    { key: "2", label: "2阶抛物线" },
                    { key: "3", label: "3阶曲线" },
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
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 教学导引与题设背景 */}
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
