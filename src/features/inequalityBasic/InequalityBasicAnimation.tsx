import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  TipCard,
} from "@/components/UI";
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { InequalityBasicScene } from "./components/InequalityBasicScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/inequalityBasic";

export function InequalityBasicAnimation() {
  // 研究模式：'semicircle' (半圆证明) | 'square' (赵爽弦图) | 'nike' (最值应用)
  const [studyMode, setStudyMode] = useState<"semicircle" | "square" | "nike">(
    "semicircle",
  );

  // 1. 本地状态 a, b, k
  const [params, setParams] = useState(() => ({
    a: defaultParams.a,
    b: defaultParams.b,
    k: defaultParams.k,
  }));

  // 2. 视口尺寸测量与防抖
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 3. 根据研究模式动态自适应 Y 轴范围，确保几何图形与标注完整显示不被裁切
  const yRange = useMemo<[number, number]>(() => {
    if (studyMode === "semicircle") return [-2.2, 5.8];
    if (studyMode === "square") return [-4.8, 4.8];
    return [-1.5, 6.5];
  }, [studyMode]);

  // 构建直角坐标系比例尺
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange,
  });

  // 4. 数学量看板数据计算与组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-ineq-basic", params, { studyMode });
  }, [params, studyMode]);

  // 参数更新处理器
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 重置参数
  const handleReset = () => {
    setParams({
      a: defaultParams.a,
      b: defaultParams.b,
      k: defaultParams.k,
    });
  };

  // 根据模式过滤参数，在 nike 模式下特化参数 a 为自变量 x
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      semicircle: ["a", "b"],
      square: ["a", "b"],
      nike: ["k", "a"],
    };
    const keys = keysByMode[studyMode] ?? ["a", "b"];
    return keys
      .filter((key) => key in paramMeta)
      .map((key) => {
        const meta = paramMeta[key];
        const isNikeX = studyMode === "nike" && key === "a";
        return {
          key,
          label: isNikeX ? "自变量 x" : meta.label,
          labelFormula: isNikeX ? "x" : meta.labelFormula,
          value: params[key as keyof typeof params] ?? meta.defaultValue ?? 0,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 0.1,
          description: isNikeX ? "动点探针的横坐标 x" : meta.description,
          descriptionFormula: isNikeX ? "x > 0" : meta.descriptionFormula,
          importance: meta.importance,
          marks: isNikeX ? undefined : meta.marks,
        };
      });
  }, [params, studyMode]);

  // 图例配置
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    if (studyMode === "semicircle") {
      return [
        {
          label: "算术平均半径 OC (AM)",
          color: MATH_COLORS.paramPrimary,
          style: "solid",
        },
        {
          label: "几何平均半弦 PC (GM)",
          color: MATH_COLORS.focusPoint,
          style: "solid",
        },
        {
          label: "调和平均投影段 CD (HM)",
          color: MATH_COLORS.paramTertiary,
          style: "solid",
        },
        {
          label: "分比段 AP(a), PB(b)",
          color: MATH_COLORS.paramSecondary,
          style: "solid",
        },
      ];
    }
    if (studyMode === "square") {
      return [
        {
          label: "大正方形边长 (a+b)",
          color: MATH_COLORS.function,
          style: "solid",
        },
        {
          label: "矩形乘积项 a×b",
          color: MATH_COLORS.paramPrimary,
          style: "solid",
        },
        {
          label: "中心差值小正方形 (a-b)²",
          color: MATH_COLORS.focusPoint,
          style: "dash",
        },
      ];
    }
    return [
      {
        label: "对勾曲线 y = x + k/x",
        color: MATH_COLORS.function,
        style: "solid",
      },
      {
        label: "最小值水平线 y = 2√k",
        color: MATH_COLORS.asymptote,
        style: "dash",
      },
      {
        label: "极小值驻点 (√k, 2√k)",
        color: MATH_COLORS.focusPoint,
        style: "point",
      },
      {
        label: "当前探针动点 P(x, f(x))",
        color: MATH_COLORS.paramPrimary,
        style: "point",
      },
    ];
  }, [studyMode]);

  // 三位一体公式渲染 (使用参数语义色着色)
  const topFormulaLatex = useMemo(() => {
    if (studyMode === "semicircle" || studyMode === "square") {
      const colorA = MATH_COLORS.paramPrimary;
      const colorB = MATH_COLORS.paramSecondary;
      return `\\frac{\\color{${colorA}}{a} + \\color{${colorB}}{b}}{2} \\ge \\sqrt{\\color{${colorA}}{a} \\color{${colorB}}{b}} \\quad (a, b > 0)`;
    } else {
      const colorK = MATH_COLORS.paramTertiary;
      return `x + \\frac{\\color{${colorK}}{k}}{x} \\ge 2\\sqrt{\\color{${colorK}}{k}} \\quad (x > 0)`;
    }
  }, [studyMode]);

  // 教学导引动态联动
  const tipConfig = useMemo(() => {
    if (studyMode === "semicircle") {
      return {
        badge: "高考基石 · 半圆射影几何均值模型",
        condition: `以 $AB = a + b$ 为直径作半圆，$O$ 为圆心，满足正实数 $a = ${params.a.toFixed(1)} > 0, b = ${params.b.toFixed(1)} > 0$。`,
        question:
          "(1) 应用射影定理证明半弦长 $PC = \\sqrt{ab}$；(2) 由直角边不大于斜边证明四均值链 $HM \\le GM \\le AM$，指出等号成立条件。",
      };
    }
    if (studyMode === "square") {
      return {
        badge: "高考基石 · 赵爽弦图面积割补模型",
        condition: `大正方形边长为 $a + b = ${(params.a + params.b).toFixed(1)}$，分割为 4 个直角边为 $a, b$ 的矩形与中央差值小正方形。`,
        question:
          "(1) 写出大正方形的面积恒等展开式；(2) 利用实数平方非负性 $(a-b)^2 \\ge 0$ 证明基本不等式 $a^2 + b^2 \\ge 2ab$。",
      };
    }
    return {
      badge: "高考重点 · 积定和最小对勾最值模型",
      condition: `自变量 $x > 0$，两项乘积为定值 $x \\cdot \\frac{k}{x} = ${params.k.toFixed(1)}$。`,
      question:
        "(1) 应用基本不等式求解函数 $f(x) = x + \\frac{k}{x}$ 的理论最小值；(2) 求解等号成立时自变量 $x$ 的极小值驻点坐标。",
    };
  }, [studyMode, params]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择 Section */}
          <LeftPanelSection title="探究场景">
            <SelectGrid
              items={[
                { key: "semicircle", label: "半圆四均值" },
                { key: "square", label: "弦图面积法" },
                { key: "nike", label: "对勾函数配凑最值", fullWidth: true },
              ]}
              value={studyMode}
              onChange={(k) => setStudyMode(k as typeof studyMode)}
              columns={2}
              variant="filled"
            />
          </LeftPanelSection>

          {/* 参数调节 Section */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 教学导引 */}
          <LeftPanelSection title="教学导引" compact>
            <TipCard
              variant="primary"
              badge={tipConfig.badge}
              condition={tipConfig.condition}
              question={tipConfig.question}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 顶部悬浮公式说明 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={topFormulaLatex} mode="inline" />
          </div>

          {/* SVG 自适应画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <InequalityBasicScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              studyMode={studyMode}
            />
          </AnimationSvgCanvas>
          <SceneLegend items={legendItems} />
        </div>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          reasoningSteps={mathData.reasoningSteps}
          title="基本不等式看板"
        />
      }
    />
  );
}
