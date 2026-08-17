import { useState, useMemo, useCallback } from "react";
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
import { CANVAS_PRESETS } from "@/theme";
import { TriangleExtremaScene } from "./components/TriangleExtremaScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/triangleExtrema";
import {
  solveAngleTransform,
  solveSideIneq,
  solveApollonius,
  solvePolarization,
  radToDeg,
} from "@/math/triangleExtrema";

export function TriangleExtremaAnimation() {
  // 四大解三角形研究模式
  const [studyMode, setStudyMode] = useState<
    "angle-transform" | "side-ineq" | "apollonius" | "polarization"
  >("angle-transform");

  // 三角形形态约束（任意三角形 vs 锐角三角形）
  const [triangleConstraint, setTriangleConstraint] = useState<"any" | "acute">(
    "any",
  );
  const isAcuteOnly = triangleConstraint === "acute";

  // 参数状态
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 视口测量
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 比例尺缩放
  const scale = useSceneScale({
    vp,
    xRange: [-9, 9],
    yRange: [-6, 7],
  });

  // 纯数学状态计算
  const calcState = useMemo(() => {
    switch (studyMode) {
      case "angle-transform":
        return solveAngleTransform(
          params.angleA,
          params.sideA,
          params.angleB,
          isAcuteOnly,
        );
      case "side-ineq":
        return solveSideIneq(
          params.angleA,
          params.sideA,
          params.sideB,
          isAcuteOnly,
        );
      case "apollonius":
        return solveApollonius(params.sideA, params.ratioK, params.thetaDeg);
      case "polarization":
        return solvePolarization(params.sideA, params.medianM, params.thetaDeg);
    }
  }, [studyMode, params, isAcuteOnly]);

  // 数学量看板数据（由 buildMathQuantities 统一输出）
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-triangle-extrema", params, {
      studyMode,
      calcState,
      isAcuteOnly,
    });
  }, [params, studyMode, calcState, isAcuteOnly]);

  // 参数修改回调
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 重置参数
  const handleReset = () => {
    setParams({ ...defaultParams });
  };

  // 根据模式过滤左屏参数配置（铁律 3 / 铁律 8）
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      "angle-transform": ["angleA", "sideA", "angleB"],
      "side-ineq": ["angleA", "sideA", "sideB"],
      apollonius: ["sideA", "ratioK", "thetaDeg"],
      polarization: ["sideA", "medianM", "thetaDeg"],
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
          unit: meta.unit,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, studyMode]);

  // 顶点 B 拖拽回调（反向更新角 B 参数）
  const handleDragB = useCallback(
    (mathPos: { x: number; y: number }) => {
      const sideA = params.sideA;
      const dx = mathPos.x - -sideA / 2;
      const dy = mathPos.y;
      if (Math.abs(dy) > 0.1) {
        let angleB = radToDeg(Math.atan2(Math.abs(dy), Math.max(0.1, dx)));
        angleB = Math.min(
          180 - params.angleA - 5,
          Math.max(5, Math.round(angleB)),
        );
        setParams((prev) => ({ ...prev, angleB }));
      }
    },
    [params.sideA, params.angleA],
  );

  // 顶点 A 拖拽回调（反向更新 thetaDeg 或相关参数）
  const handleDragA = useCallback(
    (mathPos: { x: number; y: number }) => {
      if (studyMode === "apollonius") {
        const k = params.ratioK;
        const a = params.sideA;
        const x0 = ((k * k + 1) / (2 * (k * k - 1))) * a;
        const theta = radToDeg(Math.atan2(Math.abs(mathPos.y), mathPos.x - x0));
        setParams((prev) => ({ ...prev, thetaDeg: Math.round(theta) }));
      } else if (studyMode === "polarization") {
        const theta = radToDeg(Math.atan2(Math.abs(mathPos.y), mathPos.x));
        setParams((prev) => ({ ...prev, thetaDeg: Math.round(theta) }));
      }
    },
    [studyMode, params.ratioK, params.sideA],
  );

  // 中屏 KaTeX 浮动最值公式展示（带色彩绑定）
  const floatingFormula = useMemo(() => {
    const { extrema, sides, angles } = calcState;
    if (!calcState.isValid) return "";

    if (studyMode === "angle-transform") {
      const prefix = isAcuteOnly ? "\\text{[锐角限制]} \\quad " : "";
      return `${prefix}P = \\color{#EF4444}{a} + \\color{#D97706}{b} + \\color{#059669}{c} = ${extrema.perimeter.toFixed(2)} \\le P_{\\max} = ${extrema.maxPerimeter.toFixed(2)} \\quad (\\text{当 } B = C = ${((180 - angles.A) / 2).toFixed(1)}^\\circ \\text{ 时, } b=c)`;
    }
    if (studyMode === "side-ineq") {
      return `\\color{#D97706}{b} + \\color{#059669}{c} = ${(sides.b + sides.c).toFixed(2)} \\le \\frac{\\color{#EF4444}{a}}{\\sin(A/2)} = ${extrema.maxSideSum.toFixed(2)} \\quad S = ${extrema.area.toFixed(2)} \\le S_{\\max} = ${extrema.maxArea.toFixed(2)}`;
    }
    if (studyMode === "apollonius") {
      return `\\text{阿氏圆轨迹 } h_{\\max} = R_A = ${calcState.apolloniusCircle?.radius.toFixed(2)} \\implies S_{\\max} = \\frac{1}{2}\\color{#EF4444}{a} h_{\\max} = ${extrema.maxArea.toFixed(2)}`;
    }
    if (studyMode === "polarization") {
      return `\\overrightarrow{AB} \\cdot \\overrightarrow{AC} = m_a^2 - \\left(\\frac{\\color{#EF4444}{a}}{2}\\right)^2 = ${params.medianM}^2 - ${params.sideA / 2}^2 = ${extrema.dotProduct.toFixed(2)} \\quad (\\text{定值})`;
    }
    return "";
  }, [calcState, studyMode, params, isAcuteOnly]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection
            title="高考变换模式"
            subtitle="选择解三角形的最值求法模型"
          >
            <TabSwitcher
              tabs={[
                { key: "angle-transform", label: "正弦角化边" },
                { key: "side-ineq", label: "余弦均值式" },
                { key: "apollonius", label: "阿波罗尼斯圆" },
                { key: "polarization", label: "极化恒等式" },
              ]}
              value={studyMode}
              onChange={(val) => setStudyMode(val as typeof studyMode)}
            />
          </LeftPanelSection>

          {/* 模式 1 和 2 专属：锐角三角形约束条件切换 */}
          {(studyMode === "angle-transform" || studyMode === "side-ineq") && (
            <LeftPanelSection
              title="三角形形态限定"
              subtitle="探究锐角条件下的定义域截断"
            >
              <SelectGrid
                items={[
                  {
                    key: "any",
                    label: "任意三角形",
                    description: "内角 ∈ (0, 180°)",
                  },
                  {
                    key: "acute",
                    label: "锐角三角形",
                    description: "三内角均 < 90° (高考常考)",
                  },
                ]}
                value={triangleConstraint}
                onChange={(val) =>
                  setTriangleConstraint(val as "any" | "acute")
                }
                columns={2}
              />
            </LeftPanelSection>
          )}

          <LeftPanelSection
            title="参数调节"
            subtitle="拖动滑块或图形顶点探究变化"
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
        <div className="w-full h-full relative bg-white overflow-hidden">
          {/* SVG 动画画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <TriangleExtremaScene
              state={calcState}
              studyMode={studyMode}
              scale={scale}
              vp={vp}
              fontScale={canvasSize.font}
              isAcuteOnly={isAcuteOnly}
              onDragVertexA={handleDragA}
              onDragVertexB={handleDragB}
            />
          </AnimationSvgCanvas>

          {/* 顶端悬浮动态 LaTeX 公式面板 */}
          {floatingFormula && (
            <div className="absolute top-3 left-4 right-4 pointer-events-none flex justify-center">
              <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-lg border border-neutral-200 shadow-sm text-sm">
                <KatexFormula formula={floatingFormula} />
              </div>
            </div>
          )}
        </div>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title="解三角形最值看板"
        />
      }
    />
  );
}
