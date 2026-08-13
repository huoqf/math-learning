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
import { CANVAS_PRESETS } from "@/theme";
import { ConicParamScene } from "./components/ConicParamScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/conicParam";
import { calculateLineConicParam } from "@/math/conicParam";

export function ConicParamAnimation() {
  // 研究模式: 'lineParam' (直线参数方程与t意义) | 'ellipseParam' (椭圆参数方程与三角设点) | 'tSimplify' (高考t1,t2设点化简)
  const [studyMode, setStudyMode] = useState<
    "lineParam" | "ellipseParam" | "tSimplify"
  >("lineParam");

  // 参数状态
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 视口尺寸测量
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 直角坐标系比例尺：数学范围 X [-8, 8]，Y [-6, 6]
  const scale = useSceneScale({
    vp,
    xRange: [-8, 8],
    yRange: [-6, 6],
  });

  // 右屏看板数据计算
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-conic-param", params, { studyMode });
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
    setParams({ ...defaultParams });
  };

  // 按 studyMode 过滤参数列表
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      lineParam: ["alpha", "t", "x0", "y0", "a", "b"],
      ellipseParam: ["theta", "a", "b"],
      tSimplify: ["alpha", "x0", "y0", "a", "b"],
    };
    const activeKeys = keysByMode[studyMode] ?? Object.keys(paramMeta);

    return activeKeys
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

  // 构建中屏悬浮 LaTeX 方程
  const equationLatex = useMemo(() => {
    if (studyMode === "lineParam") {
      const cosA = Math.cos((params.alpha * Math.PI) / 180).toFixed(2);
      const sinA = Math.sin((params.alpha * Math.PI) / 180).toFixed(2);
      return `\\begin{cases} x = \\color{#059669}{${params.x0}} + \\color{#D97706}{t} \\cdot (${cosA}) \\\\ y = \\color{#059669}{${params.y0}} + \\color{#D97706}{t} \\cdot (${sinA}) \\end{cases}`;
    } else if (studyMode === "ellipseParam") {
      return `\\begin{cases} x = \\color{#059669}{${params.a}}\\cos\\color{#EF4444}{\\theta} \\\\ y = \\color{#059669}{${params.b}}\\sin\\color{#EF4444}{\\theta} \\end{cases} \\quad (\\theta = ${params.theta}^\\circ)`;
    } else {
      const res = calculateLineConicParam(
        params.x0,
        params.y0,
        params.alpha,
        params.t,
        params.a,
        params.b,
      );
      if (!res.valid)
        return "\\text{判别式 } \\Delta < 0 \\text{ (直线与椭圆无交点)}";
      return `${res.A.toFixed(2)}t^2 ${res.B >= 0 ? "+" : ""}${res.B.toFixed(2)}t ${res.C >= 0 ? "+" : ""}${res.C.toFixed(2)} = 0 \\quad (\\Delta = ${res.discriminant.toFixed(1)})`;
    }
  }, [studyMode, params]);

  // 案例预设快速切换
  const handlePresetSelect = (presetKey: string) => {
    if (presetKey === "focusLine") {
      const c = Math.sqrt(
        Math.max(0, params.a * params.a - params.b * params.b),
      );
      setParams((prev) => ({
        ...prev,
        x0: Number(c.toFixed(2)),
        y0: 0,
        alpha: 60,
      }));
    } else if (presetKey === "centerLine") {
      setParams((prev) => ({ ...prev, x0: 0, y0: 0, alpha: 45 }));
    } else if (presetKey === "tangentPt") {
      setParams((prev) => ({ ...prev, theta: 45 }));
    }
  };

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 研究模式选择 */}
          <LeftPanelSection title="研究模式" subtitle="探索参数方程与解题化简">
            <TabSwitcher
              tabs={[
                { key: "lineParam", label: "直线参数方程" },
                { key: "ellipseParam", label: "椭圆三角参数" },
                { key: "tSimplify", label: "高考设点化简" },
              ]}
              value={studyMode}
              onChange={(v) => setStudyMode(v as typeof studyMode)}
            />
          </LeftPanelSection>

          {/* 案例预设 */}
          <LeftPanelSection
            title="典型几何案例"
            subtitle="快速预设经典解析几何位置"
          >
            <SelectGrid
              items={[
                { key: "focusLine", label: "过焦点割线" },
                { key: "centerLine", label: "过中心割线" },
                { key: "tangentPt", label: "椭圆45°切线" },
              ]}
              value=""
              onChange={handlePresetSelect}
              variant="outline"
            />
          </LeftPanelSection>

          {/* 参数调节 Section */}
          <LeftPanelSection
            title="参数调节"
            subtitle="拖动滑块改变几何位置与参数"
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
          {/* 方程公式 KaTeX 悬浮展示 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={equationLatex} mode="inline" />
          </div>

          {/* SVG 自适应画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <ConicParamScene
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
          title={
            studyMode === "lineParam"
              ? "直线参数方程与t物理几何意义看板"
              : studyMode === "ellipseParam"
                ? "椭圆参数方程与三角化简看板"
                : "高考设点化简与根代换看板"
          }
        />
      }
    />
  );
}
