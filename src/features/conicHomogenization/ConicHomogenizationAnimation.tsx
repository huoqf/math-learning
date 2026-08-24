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

  // 左屏教学提示与题设导引（说明初始条件、设问目标与高考通法）
  const tipConfig = useMemo(() => {
    if (presetKey === "left_vertex_perpendicular") {
      return {
        variant: "primary" as const,
        badge: "高考经典 · 左顶点直角弦",
        condition:
          "已知椭圆及左顶点 P(-a, 0)，割线 AB 过 x 轴上定点且 PA ⊥ PB。",
        question:
          "探究直线 AB 恒过定点的坐标与斜率乘积 k_{PA} · k_{PB} 的定值规律。",
        method:
          "以 P 为新原点平移换元，齐次化后由 k_{PA} · k_{PB} = -1 建立方程，秒求割线定点横坐标。",
      };
    }
    if (presetKey === "origin_symmetric_sum") {
      return {
        variant: "warning" as const,
        badge: "高考经典 · 对称斜率和为零",
        condition:
          "割线 AB 与椭圆相交，原点 O(0,0) 为弦角顶点，k_{OA} + k_{OB} = 0。",
        question: "探究动弦 AB 斜率与割线在坐标轴截距的几何对称特征。",
        method:
          "割线 Ax+By=1 齐次化代入二次曲线，一次项系数为 0 对应斜率和为 0，割线必平行于对称轴。",
      };
    }
    if (presetKey === "asymmetric_slope_explore") {
      return {
        variant: "danger" as const,
        badge: "压轴大招 · 非对称斜率齐次化",
        condition:
          "过定点 P(x₀,y₀) 的割线交曲线于 A, B，满足 λk_{PA} + μk_{PB} = 0 (λ ≠ μ)。",
        question: "探究在非对称加权斜率条件下，割线 AB 是否仍恒过定点？",
        method:
          "设而不求设割线方程，代入齐次化二次型韦达定理，分离参数法求出割线所恒过的固定点坐标。",
      };
    }

    if (studyMode === "origin") {
      return {
        variant: "info" as const,
        badge: "原点对称齐次化模型",
        condition:
          "中心曲线 C 与割线 l: Ax+By=1 交于 A, B 两点，定点为原点 O(0,0)。",
        question:
          "求证动弦 OA, OB 的斜率和 k_{OA}+k_{OB} 与斜率乘积 k_{OA}·k_{OB} 为定值。",
        method:
          "将割线常数项 1 齐次升次代入曲线，两边同除 x² 转化为关于 k 的一元二次方程，韦达定理秒出解。",
      };
    }
    if (studyMode === "shift") {
      return {
        variant: "primary" as const,
        badge: "顶点/定点平移齐次化",
        condition:
          "已知定点 P(x₀,y₀) 在曲线上或轴上，割线 AB 绕定点旋转或与 PA, PB 联动。",
        question:
          "探究动角 ∠APB 与动弦 AB 恒过定点、斜率定值之间的等价代数关系。",
        method:
          "平移坐标系 X=x-x₀, Y=y-y₀ 将定点移至新原点，用割线方程消去常数项与一次项进行齐次化求解。",
      };
    }
    return {
      variant: "accent" as const,
      badge: "非对称斜率代数剖析",
      condition:
        "割线交曲线于 A, B，且动弦斜率满足 λk_{PA} + μk_{PB} = 0 (如 k₁ + 2k₂ = 0)。",
      question: "探究非对称关系下直线 AB 恒过定点的存在性与坐标解。",
      method:
        "联立齐次化二次型方程，利用非对称韦达关系消除参数，推导直线 AB 的定点与定值结论。",
    };
  }, [studyMode, presetKey]);

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

          {/* 教学提示与题设导引（置于参数调节下方） */}
          <LeftPanelSection title="教学导引与题设背景" compact>
            <TipCard variant={tipConfig.variant}>
              <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1">
                <span>{tipConfig.badge}</span>
              </div>
              <div className="space-y-1 text-[11px] leading-relaxed">
                <div>
                  <span className="font-semibold text-neutral-800">
                    【初始条件】
                  </span>
                  <span className="text-neutral-600">
                    {tipConfig.condition}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-800">
                    【探究设问】
                  </span>
                  <span className="text-neutral-600">{tipConfig.question}</span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-800">
                    【秒杀通法】
                  </span>
                  <span className="text-neutral-600">{tipConfig.method}</span>
                </div>
              </div>
            </TipCard>
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
