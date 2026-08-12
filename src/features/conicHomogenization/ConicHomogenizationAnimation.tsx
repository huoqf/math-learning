import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { computeConicHomogenization } from "@/math/conicHomogenization";
import type { CurveType, StudyMode } from "@/math/conicHomogenization";
import { ConicHomogenizationScene } from "./components/ConicHomogenizationScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  defaultParams,
  paramMeta,
} from "@/data/registries/conicHomogenization";

export function ConicHomogenizationAnimation() {
  // 1. 模式与曲线类型
  const [studyMode, setStudyMode] = useState<StudyMode>("shift");
  const [curveType, setCurveType] = useState<CurveType>("ellipse");

  // 2. 参数状态
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 3. 视口与自适应 scale (preset: full)
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 4. 计算齐次化数学解算结果
  const result = useMemo(() => {
    return computeConicHomogenization({
      curveType,
      studyMode,
      a: params.a ?? defaultParams.a,
      b: params.b ?? defaultParams.b,
      P: { x: params.px ?? defaultParams.px, y: params.py ?? defaultParams.py },
      lineA: params.lineA ?? defaultParams.lineA,
      lineB: params.lineB ?? defaultParams.lineB,
      lambda: params.lambda ?? defaultParams.lambda,
      mu: params.mu ?? defaultParams.mu,
    });
  }, [params, studyMode, curveType]);

  // 5. 右屏 MathPanel 看板数据组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-conic-homogenization", params, {
      curveType,
      studyMode,
    });
  }, [params, studyMode, curveType]);

  // 参数更新处理器
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 拖拽定点 P
  const handlePointPDrag = (nx: number, ny: number) => {
    setParams((prev) => ({
      ...prev,
      px: Math.round(nx * 10) / 10,
      py: Math.round(ny * 10) / 10,
    }));
  };

  // 重置参数
  const handleReset = () => {
    setParams({ ...defaultParams });
  };

  // 声明式参数配置按 activeMode 过滤 (铁律 3 / 8)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<StudyMode, string[]> = {
      origin: ["a", "b", "lineA", "lineB"],
      shift: ["a", "b", "px", "py", "lineA", "lineB"],
      asymmetric: ["a", "b", "px", "lineA", "lineB", "lambda", "mu"],
    };

    const keys = keysByMode[studyMode] ?? Object.keys(paramMeta);

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
          marks: meta.marks,
        };
      });
  }, [params, studyMode]);

  // 顶部 KaTeX 展示公式
  const topFormulaLatex = useMemo(() => {
    const sumText =
      result.theoreticalSum !== null
        ? result.theoreticalSum.toFixed(3)
        : "\\text{无}";
    const prodText =
      result.theoreticalProduct !== null
        ? result.theoreticalProduct.toFixed(3)
        : "\\text{无}";
    return `\\text{齐次二次方程: } ${result.homoEqLatex} \\quad \\implies \\quad k_1 + k_2 = ${sumText}, \\; k_1 k_2 = ${prodText}`;
  }, [result]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 研究模式 Section */}
          <LeftPanelSection
            title="研究模式"
            subtitle="选择齐次化平移与求解模式"
          >
            <SelectGrid
              columns={1}
              items={[
                {
                  key: "origin",
                  label: "原点齐次化 (标准型)",
                  fullWidth: true,
                },
                {
                  key: "shift",
                  label: "平移齐次化 (顶点/定点)",
                  fullWidth: true,
                },
                {
                  key: "asymmetric",
                  label: "非对称斜率和求定点",
                  fullWidth: true,
                },
              ]}
              value={studyMode}
              onChange={(k) => {
                setStudyMode(k as StudyMode);
                if (k === "origin") {
                  setParams((prev) => ({ ...prev, px: 0, py: 0 }));
                } else if (k === "shift") {
                  setParams((prev) => ({ ...prev, px: -prev.a, py: 0 }));
                }
              }}
              variant="filled"
            />
          </LeftPanelSection>

          {/* 曲线类型 Section */}
          <LeftPanelSection title="曲线类型" subtitle="选择二次曲线几何类型">
            <SelectGrid
              items={[
                {
                  key: "ellipse",
                  label: "椭圆",
                  formula: "\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1",
                },
                {
                  key: "hyperbola",
                  label: "双曲线",
                  formula: "\\frac{x^2}{a^2} - \\frac{y^2}{b^2} = 1",
                },
              ]}
              value={curveType}
              onChange={(k) => setCurveType(k as CurveType)}
              variant="filled"
              color="primary"
            />
          </LeftPanelSection>

          {/* 参数调节 Section */}
          <LeftPanelSection
            title="参数调节"
            subtitle="拖动滑块改变割线与曲线系数"
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
          {/* 齐次二次方程与韦达定理悬浮展示 */}
          <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={topFormulaLatex} mode="inline" />
          </div>

          {/* SVG 画布容器 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <ConicHomogenizationScene
              result={result}
              scale={scale}
              vp={vp}
              fontScale={canvasSize.font}
              onPointPDrag={handlePointPDrag}
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
          title="非对称齐次化压轴看板"
        />
      }
    />
  );
}
