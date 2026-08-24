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
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
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
  const [curveType, setCurveType] = useState<CurveType>("ellipse");
  const [studyMode, setStudyMode] = useState<StudyMode>("shift");
  const [presetKey, setPresetKey] = useState<string>("free");

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

  // 参数更新处理器 (画布或滑块变动自动回归 free 预设)
  const handleParamChange = (key: string, value: number) => {
    setPresetKey("free");
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 拖拽定点 P
  const handlePointPDrag = (nx: number, ny: number) => {
    setPresetKey("free");
    setParams((prev) => ({
      ...prev,
      px: Math.round(nx * 10) / 10,
      py: Math.round(ny * 10) / 10,
    }));
  };

  // 重置参数
  const handleReset = () => {
    setPresetKey("free");
    setParams({ ...defaultParams });
  };

  // 典型预设切换 (黄金 2×2 规范)
  const handlePresetSelect = (key: string) => {
    setPresetKey(key);
    if (key === "free") {
      // 保持当前
    } else if (key === "left_vertex_perpendicular") {
      // 左顶点直角弦
      setStudyMode("shift");
      setCurveType("ellipse");
      setParams((prev) => ({
        ...prev,
        a: 2.5,
        b: 1.5,
        px: -2.5,
        py: 0,
        lineA: 0.4,
        lineB: 0,
      }));
    } else if (key === "origin_symmetric_sum") {
      // 原点中心对称斜率和为 0
      setStudyMode("origin");
      setCurveType("ellipse");
      setParams((prev) => ({
        ...prev,
        a: 3.0,
        b: 2.0,
        px: 0,
        py: 0,
        lineA: 0,
        lineB: 0.5,
      }));
    } else if (key === "asymmetric_slope_explore") {
      // 非对称斜率关系 k_PA + 2k_PB = 0 探究
      setStudyMode("asymmetric");
      setCurveType("ellipse");
      setParams((prev) => ({
        ...prev,
        a: 2.5,
        b: 1.5,
        px: -2.5,
        py: 0,
        lineA: 0.3,
        lineB: 0.4,
        lambda: 1,
        mu: 2,
      }));
    }
  };

  // 声明式参数配置按 activeMode 过滤
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<StudyMode, string[]> = {
      origin: ["a", "b", "lineA", "lineB"],
      shift: ["a", "b", "px", "py", "lineA", "lineB"],
      asymmetric: ["a", "b", "px", "py", "lineA", "lineB", "lambda", "mu"],
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
          importance: meta.importance,
          marks: meta.marks,
          group: meta.group,
        };
      });
  }, [params, studyMode]);

  // 顶部 KaTeX 展示公式（三位一体色彩 Token 绑定）
  const topFormulaLatex = useMemo(() => {
    const sumVal =
      result.theoreticalSum !== null
        ? result.theoreticalSum.toFixed(2)
        : "\\text{无}";
    const prodVal =
      result.theoreticalProduct !== null
        ? result.theoreticalProduct.toFixed(2)
        : "\\text{无}";

    return `\\text{齐次方程: } ${result.homoEqLatex} \\quad \\implies \\quad \\color{${MATH_COLORS.paramPrimary}}{k_{PA}} + \\color{${MATH_COLORS.paramSecondary}}{k_{PB}} = ${sumVal}, \\quad \\color{${MATH_COLORS.paramPrimary}}{k_{PA}} \\cdot \\color{${MATH_COLORS.paramSecondary}}{k_{PB}} = ${prodVal}`;
  }, [result]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 曲线类型：顶部轻量 TabSwitcher */}
          <div className="px-1 pt-1 pb-2">
            <TabSwitcher
              layout="horizontal"
              tabs={[
                { key: "ellipse", label: "椭圆" },
                { key: "hyperbola", label: "双曲线" },
              ]}
              value={curveType}
              onChange={(key) => {
                setPresetKey("free");
                setCurveType(key as CurveType);
              }}
            />
          </div>

          {/* 第一级：探究模式 Section */}
          <LeftPanelSection
            title="探究模式"
            subtitle="选择齐次化平移与求解模式"
          >
            <SelectGrid
              columns={1}
              items={[
                {
                  key: "origin",
                  label: "原点对称齐次化",
                  description: "定点为原点 O(0,0)，中心对称",
                  fullWidth: true,
                },
                {
                  key: "shift",
                  label: "顶点/定点平移齐次化",
                  description: "定点 P(x₀,y₀) 平移换元升次",
                  fullWidth: true,
                },
                {
                  key: "asymmetric",
                  label: "非对称斜率代数剖析",
                  description: "分析 λk_{PA} + μk_{PB} 与消元二次型",
                  fullWidth: true,
                },
              ]}
              value={studyMode}
              onChange={(k) => {
                setPresetKey("free");
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

          {/* 第二级：典型预设 Section (黄金 2×2 规范) */}
          <LeftPanelSection
            title="典型高考预设"
            subtitle="精选圆锥曲线典型定点与斜率模型"
          >
            <SelectGrid
              columns={2}
              items={[
                {
                  key: "free",
                  label: "自由探究",
                  description: "全参数开放",
                },
                {
                  key: "left_vertex_perpendicular",
                  label: "左顶点直角弦",
                  description: "k_PA·k_PB=定值",
                },
                {
                  key: "origin_symmetric_sum",
                  label: "对称斜率和零",
                  description: "k_PA+k_PB=0",
                },
                {
                  key: "asymmetric_slope_explore",
                  label: "非对称和探究",
                  description: "k_PA+2k_PB=0",
                },
              ]}
              value={presetKey}
              onChange={handlePresetSelect}
              variant="filled"
              color="primary"
            />
          </LeftPanelSection>

          {/* 第三级：参数调节 Section */}
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
          {/* 齐次二次方程与韦达定理悬浮展示 (色彩 Token 绑定) */}
          <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm text-xs">
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
          title="圆锥曲线齐次化考向看板"
        />
      }
    />
  );
}
