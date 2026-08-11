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
import { LineCircleScene } from "./components/LineCircleScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/lineCircle";
import { calculateLineCircle } from "@/math/lineCircle";

export function LineCircleAnimation() {
  // 4种研究模式：位置关系与判定 | 相交弦长 | 切线与切线长 | 垂径定理与弦中点
  const [studyMode, setStudyMode] = useState<
    "relation" | "chord" | "tangent" | "midpoint"
  >("relation");

  // 1. 本地状态管理
  const [params, setParams] = useState<Record<string, number>>(() => ({
    a: defaultParams.a,
    b: defaultParams.b,
    r: defaultParams.r,
    k: defaultParams.k,
    m: defaultParams.m,
    px: defaultParams.px,
    py: defaultParams.py,
  }));

  // 2. 视口尺寸测量
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 3. 直角坐标系比例尺 X [-7, 7], Y [-5, 5]
  const scale = useSceneScale({
    vp,
    xRange: [-7, 7],
    yRange: [-5, 5],
  });

  // 4. 数学量看板数据组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-line-circle", params, { studyMode });
  }, [params, studyMode]);

  // 5. 纯数学模型中间量（用于悬浮卡片）
  const calcRes = useMemo(() => calculateLineCircle(params as any), [params]);

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
      r: defaultParams.r,
      k: defaultParams.k,
      m: defaultParams.m,
      px: defaultParams.px,
      py: defaultParams.py,
    });
  };

  // 动态过滤参数列表
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      relation: ["a", "b", "r", "k", "m"],
      chord: ["a", "b", "r", "k", "m"],
      tangent: ["a", "b", "r", "px", "py"],
      midpoint: ["a", "b", "r", "k", "m"],
    };

    const keys = keysByMode[studyMode] ?? ["a", "b", "r", "k", "m"];
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
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, studyMode]);

  // 悬浮公式 KaTeX
  const formulaLatex = useMemo(() => {
    const lineStr = `y = ${params.k}x ${params.m >= 0 ? `+ ${params.m}` : `- ${Math.abs(params.m)}`}`;
    const circleStr = `(x ${params.a >= 0 ? `- ${params.a}` : `+ ${Math.abs(params.a)}`})^2 + (y ${params.b >= 0 ? `- ${params.b}` : `+ ${Math.abs(params.b)}`})^2 = ${params.r}^2`;

    if (studyMode === "relation") {
      return `\\begin{cases} C: ${circleStr} \\\\ L: ${lineStr} \\end{cases} \\quad d = ${calcRes.distance.toFixed(2)}, \\; r = ${params.r}`;
    } else if (studyMode === "chord") {
      if (calcRes.relation === "disjoint") {
        return `\\text{相离状态，无实数弦长} \\quad d = ${calcRes.distance.toFixed(2)} > r = ${params.r}`;
      }
      return `L_{\\text{弦长}} = 2\\sqrt{r^2 - d^2} = 2\\sqrt{${params.r}^2 - ${calcRes.distance.toFixed(2)}^2} = ${calcRes.chordLengthGeom.toFixed(2)}`;
    } else if (studyMode === "tangent") {
      if (calcRes.tangentLength !== undefined) {
        return `P(${params.px}, ${params.py}), \\; PT = \\sqrt{d_{PC}^2 - r^2} = ${calcRes.tangentLength.toFixed(2)}`;
      }
      return `P(${params.px}, ${params.py}) \\text{ 在圆内或圆上，无切线长}`;
    } else {
      return `\\text{垂径定理: } CH \\perp AB \\implies H \\text{ 为弦 } AB \\text{ 中点 } (${calcRes.midpoint.x.toFixed(1)}, ${calcRes.midpoint.y.toFixed(1)})`;
    }
  }, [params, studyMode, calcRes]);

  const panelTitle = useMemo(() => {
    switch (studyMode) {
      case "relation":
        return "位置关系判定看板";
      case "chord":
        return "相交弦长计算看板";
      case "tangent":
        return "切线与切线长看板";
      case "midpoint":
        return "垂径定理与弦中点看板";
    }
  }, [studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择 Section */}
          <LeftPanelSection title="研究模式" subtitle="选择直线与圆探讨主题">
            <SelectGrid
              items={[
                { key: "relation", label: "位置关系判定" },
                { key: "chord", label: "相交弦长计算" },
                { key: "tangent", label: "切线与切线长" },
                { key: "midpoint", label: "垂径定理与弦中点" },
              ]}
              value={studyMode}
              onChange={(k) =>
                setStudyMode(k as "relation" | "chord" | "tangent" | "midpoint")
              }
              variant="filled"
            />
          </LeftPanelSection>

          {/* 参数调节 Section */}
          <LeftPanelSection title="参数调节" subtitle="拖动滑块改变几何参数">
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
          {/* KaTeX 悬浮公式展示 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm max-w-[90%] overflow-x-auto">
            <KatexFormula formula={formulaLatex} mode="inline" />
          </div>

          {/* SVG 自适应画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <LineCircleScene
              params={params as any}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              studyMode={studyMode}
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
