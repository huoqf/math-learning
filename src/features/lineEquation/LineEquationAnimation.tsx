/**
 * src/features/lineEquation/LineEquationAnimation.tsx
 * 直线方程与点到直线的距离 动画编排层
 */

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
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { LineEquationScene } from "./components/LineEquationScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/lineEquation";

export function LineEquationAnimation() {
  // 1. 研究模式状态
  const [studyMode, setStudyMode] = useState<
    "forms" | "distance" | "relation" | "family"
  >("forms");

  // 2. 直线方程形式子模式状态
  const [form, setForm] = useState<
    "general" | "pointSlope" | "slopeIntercept" | "twoPoint" | "intercept"
  >("general");

  // 3. 本地参数状态 (数字键值对)
  const [params, setParams] = useState<Record<string, number>>(() => ({
    A: defaultParams.A,
    B: defaultParams.B,
    C: defaultParams.C,
    k: defaultParams.k,
    x0: defaultParams.x0,
    y0: defaultParams.y0,
    b: defaultParams.b,
    x1: defaultParams.x1,
    y1: defaultParams.y1,
    x2: defaultParams.x2,
    y2: defaultParams.y2,
    a: defaultParams.a,
    A2: defaultParams.A2,
    B2: defaultParams.B2,
    C2: defaultParams.C2,
    lambda: defaultParams.lambda,
  }));

  // 4. 视口尺寸测量
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 5. 坐标系缩放比例尺 [-6, 6], [-4.5, 4.5]
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 6. 组装右屏 MathPanel 看板数据
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-line-equation", params, {
      studyMode,
      form,
    });
  }, [params, studyMode, form]);

  // 参数改变处理器
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 重置参数
  const handleReset = () => {
    setParams({
      A: defaultParams.A,
      B: defaultParams.B,
      C: defaultParams.C,
      k: defaultParams.k,
      x0: defaultParams.x0,
      y0: defaultParams.y0,
      b: defaultParams.b,
      x1: defaultParams.x1,
      y1: defaultParams.y1,
      x2: defaultParams.x2,
      y2: defaultParams.y2,
      a: defaultParams.a,
      A2: defaultParams.A2,
      B2: defaultParams.B2,
      C2: defaultParams.C2,
      lambda: defaultParams.lambda,
    });
  };

  // 7. 声明式参数配置 (按模式与形式进行过滤)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    let keys: string[] = [];

    if (studyMode === "forms") {
      switch (form) {
        case "pointSlope":
          keys = ["k", "x0", "y0"];
          break;
        case "slopeIntercept":
          keys = ["k", "b"];
          break;
        case "twoPoint":
          keys = ["x1", "y1", "x2", "y2"];
          break;
        case "intercept":
          keys = ["a", "b"];
          break;
        case "general":
        default:
          keys = ["A", "B", "C"];
          break;
      }
    } else if (studyMode === "distance") {
      keys = ["A", "B", "C", "x0", "y0"];
    } else if (studyMode === "relation") {
      keys = ["A", "B", "C", "A2", "B2", "C2"];
    } else if (studyMode === "family") {
      keys = ["A", "B", "C", "A2", "B2", "C2", "lambda"];
    }

    return keys
      .filter((key) => key in paramMeta)
      .map((key) => {
        const meta = paramMeta[key];
        return {
          key,
          label: meta.label,
          labelFormula: meta.labelFormula,
          value: params[key] ?? meta.defaultValue ?? 0,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 0.1,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance as any,
          marks: meta.marks as any,
        };
      });
  }, [params, studyMode, form]);

  // 8. 计算中屏悬浮 LaTeX 表达式 (带色彩绑定)
  const formulaLatex = useMemo(() => {
    const c1 = MATH_COLORS.paramPrimary; // #EF4444
    const c2 = MATH_COLORS.paramSecondary; // #D97706
    const c3 = MATH_COLORS.paramTertiary; // #059669

    if (studyMode === "forms") {
      switch (form) {
        case "pointSlope":
          return `y - \\color{${c2}}{${(params.y0 ?? 0).toFixed(1)}} = \\color{${c1}}{${(params.k ?? 1).toFixed(1)}}(x - \\color{${c1}}{${(params.x0 ?? 0).toFixed(1)}})`;
        case "slopeIntercept":
          return `y = \\color{${c1}}{${(params.k ?? 1).toFixed(1)}}x + \\color{${c2}}{${(params.b ?? 0).toFixed(1)}}`;
        case "intercept":
          return `\\frac{x}{\\color{${c1}}{${(params.a ?? 3).toFixed(1)}}} + \\frac{y}{\\color{${c2}}{${(params.b ?? 2).toFixed(1)}}} = 1`;
        case "twoPoint":
          return `\\frac{y - ${(params.y1 ?? -1).toFixed(1)}}{${(params.y2 ?? 3).toFixed(1)} - ${(params.y1 ?? -1).toFixed(1)}} = \\frac{x - ${(params.x1 ?? -2).toFixed(1)}}{${(params.x2 ?? 2).toFixed(1)} - ${(params.x1 ?? -2).toFixed(1)}}`;
        case "general":
        default:
          return `\\color{${c1}}{${(params.A ?? 1).toFixed(1)}}x + \\color{${c2}}{${(params.B ?? -1).toFixed(1)}}y + \\color{${c3}}{${(params.C ?? -1).toFixed(1)}} = 0`;
      }
    } else if (studyMode === "distance") {
      const A = params.A ?? 1;
      const B = params.B ?? -1;
      const C = params.C ?? -1;
      const x0 = params.x0 ?? 2;
      const y0 = params.y0 ?? 3;
      const d = Math.abs(A * x0 + B * y0 + C) / Math.hypot(A, B);

      return `d = \\frac{|\\color{${c1}}{${A.toFixed(1)}} \\cdot \\color{${c3}}{${x0.toFixed(1)}} + \\color{${c2}}{${B.toFixed(1)}} \\cdot \\color{${c3}}{${y0.toFixed(1)}} + (${C.toFixed(1)})|}{\\sqrt{\\color{${c1}}{${A.toFixed(1)}}^2 + (\\color{${c2}}{${B.toFixed(1)}})^2}} = \\mathbf{${d.toFixed(2)}}`;
    } else if (studyMode === "relation") {
      return `L_1: ${(params.A ?? 1).toFixed(1)}x + ${(params.B ?? -1).toFixed(1)}y + ${(params.C ?? -1).toFixed(1)} = 0 \\quad \\text{与} \\quad L_2: ${(params.A2 ?? 1).toFixed(1)}x + ${(params.B2 ?? 1).toFixed(1)}y + ${(params.C2 ?? -2).toFixed(1)} = 0`;
    } else {
      const lam = params.lambda ?? 1;
      return `L(\\lambda): L_1 + \\color{${c3}}{${lam.toFixed(1)}} L_2 = 0`;
    }
  }, [params, studyMode, form]);

  const panelTitleMap = {
    forms: "直线方程形式看板",
    distance: "点到直线距离看板",
    relation: "两条直线位置关系看板",
    family: "直线系方程看板",
  };

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择 Section */}
          <LeftPanelSection title="研究模式" subtitle="选择解析几何探究主题">
            <TabSwitcher
              tabs={[
                { key: "forms", label: "方程形式" },
                { key: "distance", label: "点到距离" },
                { key: "relation", label: "两线关系" },
                { key: "family", label: "直线系" },
              ]}
              value={studyMode}
              onChange={(key) => setStudyMode(key as any)}
            />
          </LeftPanelSection>

          {/* 直线方程形式子选择 (仅在 forms 模式下) */}
          {studyMode === "forms" && (
            <LeftPanelSection title="方程表达形式" subtitle="选择五种经典表达形式">
              <SelectGrid
                items={[
                  { key: "general", label: "一般式", formula: "Ax+By+C=0" },
                  { key: "slopeIntercept", label: "斜截式", formula: "y=kx+b" },
                  { key: "pointSlope", label: "点斜式", formula: "y-y_0=k(x-x_0)" },
                  { key: "intercept", label: "截距式", formula: "\\frac{x}{a}+\\frac{y}{b}=1" },
                  { key: "twoPoint", label: "两点式", fullWidth: true },
                ]}
                value={form}
                onChange={(k) => setForm(k as any)}
                variant="filled"
              />
            </LeftPanelSection>
          )}

          {/* 参数调节 Section */}
          <LeftPanelSection title="参数调节" subtitle="拖动滑块改变参数数值">
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
          {/* 直线方程 / 距离公式 KaTeX 悬浮框 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={formulaLatex} mode="inline" />
          </div>

          {/* SVG 几何画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <LineEquationScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              studyMode={studyMode}
              form={form}
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
          title={panelTitleMap[studyMode]}
        />
      }
    />
  );
}
