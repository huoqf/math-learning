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
import {
  computeConicHomogenization,
  getPerpendicularChordLineA,
} from "@/math/conicHomogenization";
import type { CurveType, StudyMode } from "@/math/conicHomogenization";
import { SceneLegend } from "@/components/Math";
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

  // 参数更新处理器 (智能联动与预设状态保护)
  const handleParamChange = (key: string, value: number) => {
    if (presetKey === "left_vertex_perpendicular") {
      if (key === "a") {
        const curB = params.b ?? defaultParams.b;
        const newLineA = getPerpendicularChordLineA(value, curB);
        setParams((prev) => ({
          ...prev,
          a: value,
          px: -value,
          lineA: newLineA,
        }));
        return;
      } else if (key === "b") {
        const curA = params.a ?? defaultParams.a;
        const newLineA = getPerpendicularChordLineA(curA, value);
        setParams((prev) => ({
          ...prev,
          b: value,
          lineA: newLineA,
        }));
        return;
      } else if (key === "lineB") {
        setParams((prev) => ({
          ...prev,
          lineB: value,
        }));
        return;
      }
    }

    setPresetKey("free");
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 拖拽定点 P (仅在非原点模式下有效)
  const handlePointPDrag = (nx: number, ny: number) => {
    if (studyMode === "origin") return;
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
      // 左顶点直角弦真实高考参数 (理论求解 m = (a^2+b^2)/(2ab^2))
      const a = 2.5;
      const b = 1.5;
      const exactLineA = getPerpendicularChordLineA(a, b);
      setStudyMode("shift");
      setCurveType("ellipse");
      setParams((prev) => ({
        ...prev,
        a,
        b,
        px: -a,
        py: 0,
        lineA: exactLineA,
        lineB: 0.3, // 稍微倾斜，直角三角形特征更清晰
      }));
    } else if (key === "origin_symmetric_sum") {
      // 原点中心对称斜率和为 0 (平行于坐标轴割线)
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
      // 非对称斜率约束 k_PA + 2 k_PB = 0 探究
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

  // 声明式参数配置按 activeMode 与预设降维过滤
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    let keys: string[] = [];

    if (presetKey === "left_vertex_perpendicular") {
      // 左顶点直角弦：定点锁定为 P(-a, 0)，lineA 锁定为满足 k1*k2=-1 的理论值，仅调节椭圆与割线转角
      keys = ["a", "b", "lineB"];
    } else if (presetKey === "origin_symmetric_sum") {
      // 原点对称：定点锁定为 (0, 0)，隐藏 px, py
      keys = ["a", "b", "lineA", "lineB"];
    } else if (presetKey === "asymmetric_slope_explore") {
      // 非对称探究：定点与权重锁定，调节曲线与割线
      keys = ["a", "b", "lineA", "lineB"];
    } else {
      const keysByMode: Record<StudyMode, string[]> = {
        origin: ["a", "b", "lineA", "lineB"],
        shift: ["a", "b", "px", "py", "lineA", "lineB"],
        asymmetric: ["a", "b", "px", "py", "lineA", "lineB", "lambda", "mu"],
      };
      keys = keysByMode[studyMode] ?? Object.keys(paramMeta);
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
          importance: meta.importance,
          marks: meta.marks,
          group: meta.group,
        };
      });
  }, [params, studyMode, presetKey]);

  // 顶部 KaTeX 展示公式（三位一体色彩 Token 绑定）
  const topFormulaLatex = useMemo(() => {
    const sumVal =
      result.theoreticalSum !== null ? result.theoreticalSum.toFixed(2) : "-";
    const prodVal =
      result.theoreticalProduct !== null
        ? result.theoreticalProduct.toFixed(2)
        : "-";

    const isPerp =
      result.theoreticalProduct !== null &&
      Math.abs(result.theoreticalProduct - -1) < 0.05 &&
      result.fixedPointQ;

    const perpSuffix = isPerp
      ? ` \\quad \\implies \\quad \\color{${MATH_COLORS.tangentLine}}{\\text{割线 } l \\text{ 恒过定点 } Q(${result.fixedPointQ!.x.toFixed(2)}, 0)}`
      : "";

    return `\\text{齐次二次方程: } ${result.homoEqLatex} \\quad \\implies \\quad \\color{${MATH_COLORS.paramPrimary}}{k_{PA}} + \\color{${MATH_COLORS.paramSecondary}}{k_{PB}} = ${sumVal}, \\quad \\color{${MATH_COLORS.paramPrimary}}{k_{PA}} \\cdot \\color{${MATH_COLORS.paramSecondary}}{k_{PB}} = ${prodVal}${perpSuffix}`;
  }, [result]);

  // 左屏教学提示与题设导引（说明初始条件与探究设问）
  const tipConfig = useMemo(() => {
    if (presetKey === "left_vertex_perpendicular") {
      return {
        variant: "primary" as const,
        badge: "高考经典 · 左顶点直角弦",
        condition:
          "已知椭圆及左顶点 $P(-a, 0)$，割线 $AB$ 与曲线相交且满足 $PA \\perp PB$。",
        question: "如何通过齐次化升次建立斜率方程，证明动割线 $AB$ 恒过定点？",
      };
    }
    if (presetKey === "origin_symmetric_sum") {
      return {
        variant: "warning" as const,
        badge: "高考经典 · 对称斜率和为零",
        condition:
          "中心对称曲线与割线相交，以原点 $O$ 为弦角顶点，两动弦斜率满足 $k_1 + k_2 = 0$。",
        question:
          "如何利用齐次二次方程一次项系数为零，判定动割线在坐标轴截距的几何对称特征？",
      };
    }
    if (presetKey === "asymmetric_slope_explore") {
      return {
        variant: "danger" as const,
        badge: "高考压轴 · 非对称斜率消参",
        condition:
          "割线交曲线于 $A, B$，两动弦斜率满足非对称约束 $k_{PA} + 2 k_{PB} = 0$。",
        question:
          "在非对称斜率约束下，如何联立齐次韦达对称式消元，求割线参数的二次型方程？",
      };
    }

    if (studyMode === "origin") {
      return {
        variant: "info" as const,
        badge: "原点齐次化模型",
        condition:
          "中心对称曲线与割线相交于 $A, B$ 两点，弦角顶点取在坐标原点 $O$。",
        question:
          "如何将割线方程构造为 $mx + ny = 1$ 代入曲线升次，导出关于斜率 $k$ 的一元二次方程？",
      };
    }
    if (studyMode === "shift") {
      return {
        variant: "primary" as const,
        badge: "顶点/定点平移齐次化",
        condition: "定点 $P(x_0, y_0)$ 位于坐标原点之外的定点或曲线顶点。",
        question:
          "如何通过坐标平移换元 $X=x-x_0, Y=y-y_0$，将非原点定点齐次化问题转化为标准齐次化？",
      };
    }
    return {
      variant: "accent" as const,
      badge: "非对称斜率代数消参",
      condition: "动弦两斜率满足已知非对称约束 $\\lambda k_1 + \\mu k_2 = 0$。",
      question:
        "如何结合齐次韦达定理对称式消去斜率 $k_1, k_2$，求解割线系参数的代数约束与几何轨迹？",
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
          <LeftPanelSection title="探究模式">
            <SelectGrid
              columns={2}
              items={[
                { key: "origin", label: "原点对称" },
                { key: "shift", label: "定点平移" },
                {
                  key: "asymmetric",
                  label: "非对称消参",
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
          <LeftPanelSection title="典型预设">
            <SelectGrid
              columns={2}
              items={[
                { key: "free", label: "自由探究", description: "全参数开放" },
                {
                  key: "left_vertex_perpendicular",
                  label: "左顶点直角弦",
                  description: "斜率积为定值",
                },
                {
                  key: "origin_symmetric_sum",
                  label: "对称斜率和零",
                  description: "直线过横轴定点",
                },
                {
                  key: "asymmetric_slope_explore",
                  label: "非对称消参",
                  description: "斜率约束消元",
                },
              ]}
              value={presetKey}
              onChange={handlePresetSelect}
              variant="filled"
              color="primary"
            />
          </LeftPanelSection>

          {/* 第三级：参数调节 Section */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 教学提示与题设导引（置于最底部） */}
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

          {/* 中屏右下角毛玻璃图例 */}
          <SceneLegend
            items={[
              {
                label: curveType === "ellipse" ? "椭圆曲线" : "双曲线",
                color: MATH_COLORS.function,
              },
              {
                label: "动割线 l",
                color: MATH_COLORS.tangentLine,
              },
              {
                label: "动弦 PA",
                color: MATH_COLORS.paramPrimary,
              },
              {
                label: "动弦 PB",
                color: MATH_COLORS.paramSecondary,
              },
              {
                label: studyMode === "origin" ? "原点 O" : "基准定点 P",
                color: MATH_COLORS.paramTertiary,
              },
              ...(result.fixedPointQ &&
              result.theoreticalProduct !== null &&
              Math.abs(result.theoreticalProduct - -1) < 0.05
                ? [
                    {
                      label: "恒过定点 Q",
                      color: MATH_COLORS.tangentLine,
                    },
                  ]
                : []),
            ]}
            title="图元几何语义"
          />
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
