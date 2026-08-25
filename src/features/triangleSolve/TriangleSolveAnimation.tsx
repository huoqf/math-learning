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
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { TriangleSolveScene } from "./components/TriangleSolveScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/triangleSolve";
import {
  solveTriangleFromSAS,
  solveSSA,
  solveBisectorAndMedian,
} from "@/math/triangleSolve";

export function TriangleSolveAnimation() {
  // 研究模式: 'sine' | 'ssa' | 'cosine' | 'area' | 'bisector'
  const [studyMode, setStudyMode] = useState<
    "sine" | "ssa" | "cosine" | "area" | "bisector"
  >("sine");

  // 典型构型预设状态 (默认自由探究)
  const [preset, setPreset] = useState<string>("free");

  // 参数状态
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 视口尺寸测量
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 直角坐标系比例尺: X [-8, 8], Y [-6, 6]
  const scale = useSceneScale({
    vp,
    xRange: [-8, 8],
    yRange: [-6, 6],
  });

  // 数学量看板数据计算与组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-triangle-solve", params, { studyMode });
  }, [params, studyMode]);

  // 模式切换
  const handleModeChange = (modeKey: string) => {
    setStudyMode(modeKey as typeof studyMode);
    setPreset("free");
  };

  // 参数变更 (手动调节滑块时自动切回自由探究)
  const handleParamChange = (key: string, value: number) => {
    setPreset("free");
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 预设切换
  const handlePresetChange = (presetKey: string) => {
    setPreset(presetKey);
    if (presetKey === "free") return;

    if (studyMode === "sine") {
      if (presetKey === "equilateral")
        setParams((p) => ({ ...p, angleA: 60, b: 6, c: 6 }));
      if (presetKey === "rt_special")
        setParams((p) => ({ ...p, angleA: 30, b: 6, c: 10.4 }));
      if (presetKey === "obtuse")
        setParams((p) => ({ ...p, angleA: 120, b: 5, c: 5 }));
    } else if (studyMode === "ssa") {
      if (presetKey === "tangent_one")
        setParams((p) => ({ ...p, angleA: 60, b: 5, a: 4.33 }));
      if (presetKey === "double_sol")
        setParams((p) => ({ ...p, angleA: 60, b: 5, a: 4.6 }));
      if (presetKey === "no_sol")
        setParams((p) => ({ ...p, angleA: 60, b: 5, a: 3.5 }));
    } else if (studyMode === "cosine") {
      if (presetKey === "pythagorean")
        setParams((p) => ({ ...p, angleA: 90, b: 3, c: 4 }));
      if (presetKey === "obtuse_spread")
        setParams((p) => ({ ...p, angleA: 120, b: 4, c: 5 }));
      if (presetKey === "acute_min")
        setParams((p) => ({ ...p, angleA: 60, b: 5, c: 5 }));
    } else if (studyMode === "area") {
      if (presetKey === "equilateral_area")
        setParams((p) => ({ ...p, angleA: 60, b: 6, c: 6 }));
      if (presetKey === "rt_area")
        setParams((p) => ({ ...p, angleA: 90, b: 6, c: 8 }));
      if (presetKey === "flat_area")
        setParams((p) => ({ ...p, angleA: 25, b: 8, c: 8 }));
    } else if (studyMode === "bisector") {
      if (presetKey === "isosceles_mid")
        setParams((p) => ({ ...p, angleA: 60, b: 6, c: 6 }));
      if (presetKey === "scaled_split")
        setParams((p) => ({ ...p, angleA: 60, b: 4, c: 8 }));
      if (presetKey === "rt_bisect")
        setParams((p) => ({ ...p, angleA: 90, b: 6, c: 8 }));
    }
  };

  // 重置参数
  const handleReset = () => {
    setPreset("free");
    setParams({ ...defaultParams });
  };

  // 典型构型 2x2 预设网格定义
  const presetItems = useMemo(() => {
    if (studyMode === "sine") {
      return [
        { key: "free", label: "自由探究", description: "全参数开放" },
        { key: "equilateral", label: "正三角形", description: "A=60°,b=c" },
        {
          key: "rt_special",
          label: "30°特殊角",
          description: "A=30°,对边 half",
        },
        { key: "obtuse", label: "钝角外接", description: "A=120°,外心在形外" },
      ];
    }
    if (studyMode === "ssa") {
      return [
        { key: "free", label: "自由探究", description: "全参数开放" },
        { key: "tangent_one", label: "相切单解", description: "a=h (直角)" },
        { key: "double_sol", label: "双解构型", description: "h < a < b" },
        { key: "no_sol", label: "短边无解", description: "a < h (交点0)" },
      ];
    }
    if (studyMode === "cosine") {
      return [
        { key: "free", label: "自由探究", description: "全参数开放" },
        {
          key: "pythagorean",
          label: "勾股定理",
          description: "A=90°,a²=b²+c²",
        },
        {
          key: "obtuse_spread",
          label: "钝角扩散",
          description: "A=120°,a²>b²+c²",
        },
        { key: "acute_min", label: "对称锐角", description: "A=60°,b=c均值" },
      ];
    }
    if (studyMode === "area") {
      return [
        { key: "free", label: "自由探究", description: "全参数开放" },
        {
          key: "equilateral_area",
          label: "正三角形",
          description: "切接圆同心",
        },
        {
          key: "rt_area",
          label: "直角面积",
          description: "S=½ab, r=(a+b-c)/2",
        },
        { key: "flat_area", label: "狭长构型", description: "A=25°面积骤降" },
      ];
    }
    // bisector
    return [
      { key: "free", label: "自由探究", description: "全参数开放" },
      { key: "isosceles_mid", label: "三线合一", description: "b=c, M与D重合" },
      {
        key: "scaled_split",
        label: "1:2分角",
        description: "c:b=2:1 分割底边",
      },
      { key: "rt_bisect", label: "直角平分", description: "A=90°直角分角" },
    ];
  }, [studyMode]);

  // 按研究模式过滤参数项 (铁律要求)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      sine: ["angleA", "b", "c"],
      ssa: ["angleA", "b", "a"],
      cosine: ["angleA", "b", "c"],
      area: ["angleA", "b", "c"],
      bisector: ["angleA", "b", "c"],
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
          group: meta.group,
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

  // 教学引导与探究提示文本
  const guidanceInfo = useMemo(() => {
    switch (studyMode) {
      case "sine":
        return {
          condition: "在任意 △ABC 中，已知两角一边或两边及对角",
          question:
            "观察外接圆直径 2R 与正弦比值 a/sinA 是否恒等？拖动顶点 A 观察同弧圆周角 ∠C' 的恒等性。",
        };
      case "ssa":
        return {
          condition: "已知两边 b, a 及对角 A（SSA 条件）",
          question:
            "调节对边 a 的长短，观察它何时与射线相切（单解）、相交于两点（双解）或无交点（无解）？",
        };
      case "cosine":
        return {
          condition: "在任意 △ABC 中，已知两边及夹角或三边长",
          question:
            "当 A 从锐角变为钝角时，余弦修正项 -2bc·cosA 的正负号如何改变 a² 与 b²+c² 的大小关系？",
        };
      case "area":
        return {
          condition: "已知边角参数或三边长计算面积与切接圆半径",
          question:
            "观察内切圆半径 r = S/p 与高线 ha = 2S/a 如何随顶角 A 的张合动态变化？",
        };
      case "bisector":
        return {
          condition: "AD 为 ∠A 的角平分线，AM 为底边 BC 的中线",
          question:
            "当改变两邻边 b 与 c 的比例时，分角交点 D 与中点 M 会发生什么位置分离？何时三线合一？",
        };
    }
  }, [studyMode]);

  // 悬浮公式动态生成（遵循铁律4C三位一体色彩绑定，动态Token指令）
  const floatFormulaLatex = useMemo(() => {
    const cA = MATH_COLORS.paramPrimary;
    const cB = MATH_COLORS.paramSecondary;
    const cC = MATH_COLORS.paramTertiary;

    if (studyMode === "sine") {
      const sas = solveTriangleFromSAS(params.b, params.c, params.angleA);
      const ratio = sas.sineRatios.ratioA.toFixed(2);
      const r = sas.circumcircle.radius.toFixed(2);
      return `\\frac{\\color{${cA}}{a}}{\\sin \\color{${cA}}{A}} = \\frac{\\color{${cB}}{b}}{\\sin B} = \\frac{\\color{${cC}}{c}}{\\sin C} = 2R \\approx ${ratio} = 2 \\times ${r}`;
    }
    if (studyMode === "ssa") {
      const ssa = solveSSA(params.a, params.b, params.angleA);
      const countStr = ssa.solutionCount;
      const hStr = ssa.h.toFixed(2);
      return `\\color{${cA}}{a} = ${params.a.toFixed(1)}, \\; h = \\color{${cB}}{b} \\sin \\color{${cA}}{A} = ${hStr} \\implies \\text{解的个数: } ${countStr}`;
    }
    if (studyMode === "cosine") {
      const sas = solveTriangleFromSAS(params.b, params.c, params.angleA);
      const aVal = sas.sides.a.toFixed(2);
      const aSq = (sas.sides.a ** 2).toFixed(2);
      return `\\color{${cA}}{a}^2 = \\color{${cB}}{b}^2 + \\color{${cC}}{c}^2 - 2\\color{${cB}}{b}\\color{${cC}}{c} \\cos \\color{${cA}}{A} \\implies \\color{${cA}}{a}^2 = ${aSq} \\quad (\\color{${cA}}{a} = ${aVal})`;
    }
    if (studyMode === "bisector") {
      const bm = solveBisectorAndMedian(params.b, params.c, params.angleA);
      const taStr = bm.bisectorLength.toFixed(2);
      const maStr = bm.medianLength.toFixed(2);
      const lam = bm.vectorWeights.lambda.toFixed(2);
      const mu = bm.vectorWeights.mu.toFixed(2);
      return `t_a = \\frac{2\\color{${cB}}{b}\\color{${cC}}{c}\\cos\\frac{\\color{${cA}}{A}}{2}}{\\color{${cB}}{b}+\\color{${cC}}{c}} = ${taStr}, \\quad \\vec{AD} = ${lam}\\vec{AB} + ${mu}\\vec{AC}, \\quad m_a = ${maStr}`;
    }
    // area
    const sas = solveTriangleFromSAS(params.b, params.c, params.angleA);
    const areaVal = sas.area.toFixed(2);
    return `S = \\frac{1}{2}\\color{${cB}}{b}\\color{${cC}}{c} \\sin \\color{${cA}}{A} = r \\cdot p = ${areaVal}`;
  }, [params, studyMode]);

  const panelTitle = useMemo(() => {
    switch (studyMode) {
      case "sine":
        return "正弦定理与外接圆看板";
      case "ssa":
        return "SSA 边角条件与双解看板";
      case "cosine":
        return "余弦定理与投影定理看板";
      case "area":
        return "三角形面积与切接圆看板";
      case "bisector":
        return "角平分线与中线模型看板";
      default:
        return "解三角形指标看板";
    }
  }, [studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 核心专题模式 (2列网格 + 第5项独占一行) */}
          <LeftPanelSection
            title="解三角形专题模式"
            subtitle="选择高考核心探讨机制"
          >
            <SelectGrid
              items={[
                { key: "sine", label: "正弦与外接圆" },
                { key: "ssa", label: "SSA双解探究" },
                { key: "cosine", label: "余弦与射影" },
                { key: "area", label: "面积与切接圆" },
                {
                  key: "bisector",
                  label: "角平分线与中线模型",
                  fullWidth: true,
                },
              ]}
              value={studyMode}
              onChange={handleModeChange}
              variant="filled"
              columns={2}
            />
          </LeftPanelSection>

          {/* 2. 典型构型预设 (黄金 2x2 网格) */}
          <LeftPanelSection
            title="典型构型预设"
            subtitle="一键切换高考经典三角形"
          >
            <SelectGrid
              items={presetItems}
              value={preset}
              onChange={handlePresetChange}
              variant="outline"
              columns={2}
            />
          </LeftPanelSection>

          {/* 3. 参数调节 Section (支持 group 聚合) */}
          <LeftPanelSection
            title="参数调节"
            subtitle="拖动滑块探索解的连续演化"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 4. 底部教学引导卡片 */}
          <LeftPanelSection title="探究指引" subtitle="数形结合思考">
            <div className="bg-neutral-50 rounded-lg p-3 text-xs space-y-2 border border-neutral-200/60">
              <div>
                <span className="font-semibold text-neutral-700">
                  【基础条件】
                </span>
                <p className="text-neutral-600 mt-0.5">
                  {guidanceInfo.condition}
                </p>
              </div>
              <div>
                <span className="font-semibold text-blue-600">
                  【探究问题】
                </span>
                <p className="text-neutral-600 mt-0.5">
                  {guidanceInfo.question}
                </p>
              </div>
            </div>
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 顶端悬浮动态 KaTeX 公式 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={floatFormulaLatex} mode="inline" />
          </div>

          {/* SVG 画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <TriangleSolveScene
              params={params}
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
