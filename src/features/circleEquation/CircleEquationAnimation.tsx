import React, { useState, useMemo, useCallback } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  LeftPanel,
  MathPanel,
  TabSwitcher,
  SelectGrid,
  ParamControl,
  TipCard,
} from "@/components/UI";
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import { useAnimationViewport } from "@/hooks";
import { useSceneScale } from "@/hooks/useSceneScale";
import { MATH_COLORS, CANVAS_PRESETS } from "@/theme";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  circleEquationDefaultParams,
  circleEquationParamMeta,
  CIRCLE_EQUATION_PRESETS,
  type CircleEquationParams,
} from "@/data/registries/circleEquation";
import { CircleEquationScene } from "./components/CircleEquationScene";
import type { CircleStudyMode } from "@/math/circleEquation";

export const CircleEquationAnimation: React.FC = () => {
  // 1. 核心模式：标准方程与点圆关系 / 一般方程与配方法 / 待定系数法求圆
  const [studyMode, setStudyMode] = useState<CircleStudyMode>("standard");

  // 2. 参数状态
  const [params, setParams] = useState<CircleEquationParams>(
    circleEquationDefaultParams,
  );

  // 3. 当前激活预设
  const [activePreset, setActivePreset] = useState<string>("standard_origin");

  // 4. 视口尺寸测量 (默认 840x650 full preset)
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 5. 视图坐标映射
  const scale = useSceneScale({
    vp,
    xRange: [-7, 7],
    yRange: [-5.5, 5.5],
  });

  // 6. 右屏数据组装
  const mathData = useMemo(() => {
    return buildMathQuantities(
      "anim-circle-equation",
      params as unknown as Record<string, number>,
      {
        studyMode,
      },
    );
  }, [params, studyMode]);

  // 7. 参数变更回调
  const handleParamChange = useCallback((key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
    setActivePreset("free");
  }, []);

  // 8. 模式切换处理
  const handleModeChange = useCallback((modeKey: string) => {
    const nextMode = modeKey as CircleStudyMode;
    setStudyMode(nextMode);
    const presets = CIRCLE_EQUATION_PRESETS[nextMode];
    if (presets && presets.length > 0) {
      setActivePreset(presets[0].key);
      setParams((prev) => ({ ...prev, ...presets[0].params }));
    }
  }, []);

  // 9. 预设切换处理
  const handlePresetSelect = useCallback(
    (presetKey: string) => {
      setActivePreset(presetKey);
      const presets = CIRCLE_EQUATION_PRESETS[studyMode];
      const found = presets.find((p) => p.key === presetKey);
      if (found && found.params) {
        setParams((prev) => ({ ...prev, ...found.params }));
      }
    },
    [studyMode],
  );

  // 10. 根据模式动态展示参数控制项 (参数降维)
  const activeParamKeys = useMemo(() => {
    if (studyMode === "standard") return ["a", "b", "r", "px", "py"];
    if (studyMode === "general") return ["D", "E", "F"];
    return ["x1", "y1", "x2", "y2", "x3", "y3"];
  }, [studyMode]);

  const paramConfigs = useMemo(() => {
    return activeParamKeys.map((k) => {
      const meta = circleEquationParamMeta[k];
      return {
        key: k,
        label: meta.label,
        labelFormula: meta.labelFormula,
        value: params[k as keyof CircleEquationParams],
        min: meta.min,
        max: meta.max,
        step: meta.step,
        marks: meta.marks,
      };
    });
  }, [activeParamKeys, params]);

  // 11. 题设三要素闭环 (TipCard)
  const tipData = useMemo(() => {
    if (studyMode === "standard") {
      return {
        background:
          "2019人教A版选必一第2.4.1节：圆的标准方程是解析几何中研究圆的基本模型，由圆的几何定义推导而来。",
        condition: `已知圆心为 $C(${params.a}, ${params.b})$，半径为 $r = ${params.r}$；动点 $P(${params.px}, ${params.py})$。`,
        question:
          "探究点 $P$ 到圆心的距离 $|PC|$ 与半径 $r$ 的代数大小关系，判定点在圆外、圆上还是圆内？",
      };
    }
    if (studyMode === "general") {
      return {
        background:
          "2019人教A版选必一第2.4.2节：二元二次方程 $x^2+y^2+Dx+Ey+F=0$ 是圆的一般方程，通过配方法探究其几何意义。",
        condition: `方程系数 $D = ${params.D}, E = ${params.E}, F = ${params.F}$，判别式 $\\Delta_c = D^2 + E^2 - 4F$。`,
        question:
          "运用配方法求解圆心坐标与半径，讨论判别式 $\\Delta_c$ 的正负如何决定图形的几何形态？",
      };
    }
    return {
      background:
        "2019人教A版选必一第2.4节例题与高考真题：不在同一直线上的三点确定一个圆，待定系数法是求曲线方程的核心通法。",
      condition: `已知平面上三点 $A(${params.x1}, ${params.y1})$、$B(${params.x2}, ${params.y2})$、$C(${params.x3}, ${params.y3})$。`,
      question:
        "将三点坐标代入圆的一般方程建立三元一次方程组，求系数 $D, E, F$ 与外接圆圆心半径。",
    };
  }, [studyMode, params]);

  // 12. 图例
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    if (studyMode === "standard") {
      return [
        { label: "圆曲线", color: MATH_COLORS.paramPrimary, style: "line" },
        { label: "圆心 C", color: MATH_COLORS.paramPrimary, style: "point" },
        { label: "半径 r", color: MATH_COLORS.paramTertiary, style: "line" },
        {
          label: "探究点 P",
          color: MATH_COLORS.paramSecondary,
          style: "point",
        },
      ];
    }
    if (studyMode === "general") {
      return [
        { label: "配方圆", color: MATH_COLORS.paramSecondary, style: "line" },
        {
          label: "配方圆心 C",
          color: MATH_COLORS.paramPrimary,
          style: "point",
        },
      ];
    }
    return [
      { label: "三角形 ABC", color: MATH_COLORS.paramTertiary, style: "line" },
      { label: "顶点 A, B, C", color: MATH_COLORS.accent, style: "point" },
      { label: "外接圆", color: MATH_COLORS.paramPrimary, style: "dashed" },
    ];
  }, [studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择器 */}
          <TabSwitcher
            tabs={[
              { key: "standard", label: "标准方程与点圆关系" },
              { key: "general", label: "一般方程配方互化" },
              { key: "threePoints", label: "待定系数法求圆" },
            ]}
            value={studyMode}
            onChange={handleModeChange}
          />

          {/* 典型预设 (SelectGrid) */}
          <SelectGrid
            items={CIRCLE_EQUATION_PRESETS[studyMode].map((p) => ({
              key: p.key,
              label: p.label,
            }))}
            value={activePreset}
            onChange={handlePresetSelect}
          />

          {/* 参数控制 */}
          <ParamControl
            params={paramConfigs}
            onParamChange={handleParamChange}
          />

          {/* 教学导引题设 (TipCard) */}
          <TipCard
            background={tipData.background}
            condition={tipData.condition}
            question={tipData.question}
          />
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative">
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <CircleEquationScene
              params={params as unknown as Record<string, number>}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              studyMode={studyMode}
            />
          </AnimationSvgCanvas>
          <SceneLegend items={legendItems} position="bottom-right" />
        </div>
      }
      right={<MathPanel {...mathData} title="圆的方程探究看板" />}
    />
  );
};

export default CircleEquationAnimation;
