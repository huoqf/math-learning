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
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { ConicParamScene } from "./components/ConicParamScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  defaultParams,
  paramMeta,
  presetsByMode,
} from "@/data/registries/conicParam";
import { calculateLineConicParam } from "@/math/conicParam";

export function ConicParamAnimation() {
  // 研究模式: 'lineParam' (直线参数方程与t意义) | 'ellipseParam' (椭圆参数方程与三角设点) | 'tSimplify' (高考t1,t2设点化简)
  const [studyMode, setStudyMode] = useState<
    "lineParam" | "ellipseParam" | "tSimplify"
  >("lineParam");

  // 典型预设 key
  const [activePreset, setActivePreset] = useState<string>("free");

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

  // 参数更新处理器（拖拽或微调时自动切回 free）
  const handleParamChange = (key: string, value: number) => {
    setActivePreset("free");
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 预设切换处理器
  const handlePresetSelect = (presetKey: string) => {
    setActivePreset(presetKey);
    const presets = presetsByMode[studyMode] ?? [];
    const target = presets.find((p) => p.key === presetKey);
    if (target && Object.keys(target.params).length > 0) {
      setParams((prev) => {
        const next = { ...prev };
        Object.entries(target.params).forEach(([k, v]) => {
          if (typeof v === "number") {
            next[k] = v;
          }
        });
        return next;
      });
    }
  };

  // 模式切换处理器
  const handleModeChange = (mode: typeof studyMode) => {
    setStudyMode(mode);
    setActivePreset("free");
  };

  // 重置参数
  const handleReset = () => {
    setActivePreset("free");
    setParams({ ...defaultParams });
  };

  // 当前模式下的预设列表
  const currentPresets = useMemo(() => {
    const list = presetsByMode[studyMode] ?? [];
    return list.map((item) => ({
      key: item.key,
      label: item.label,
      description: item.description,
    }));
  }, [studyMode]);

  // 按 studyMode 过滤并结构化分组参数列表
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    let modeKeyGroups: Array<{ group: string; keys: string[] }> = [];

    if (studyMode === "lineParam") {
      modeKeyGroups = [
        { group: "定点 P₀(x₀, y₀) 坐标", keys: ["x0", "y0"] },
        { group: "直线方向与动点参数", keys: ["alpha", "t"] },
        { group: "椭圆几何底模", keys: ["a", "b"] },
      ];
    } else if (studyMode === "ellipseParam") {
      modeKeyGroups = [
        { group: "动点离心角参数", keys: ["theta"] },
        { group: "椭圆几何半轴", keys: ["a", "b"] },
      ];
    } else {
      modeKeyGroups = [
        { group: "割线定点 P₀(x₀, y₀)", keys: ["x0", "y0"] },
        { group: "割线倾斜角 α", keys: ["alpha"] },
        { group: "椭圆几何底模", keys: ["a", "b"] },
      ];
    }

    const configs: ParamConfig[] = [];
    modeKeyGroups.forEach(({ group, keys }) => {
      keys.forEach((key) => {
        if (key in paramMeta) {
          const meta = paramMeta[key];
          configs.push({
            key,
            label: meta.label,
            labelFormula: meta.labelFormula,
            value: params[key] ?? meta.defaultValue ?? 0,
            min: meta.min,
            max: meta.max,
            step: meta.step ?? 0.1,
            group,
            description: meta.description,
            descriptionFormula: meta.descriptionFormula,
            importance: meta.importance,
            marks: meta.marks,
          });
        }
      });
    });

    return configs;
  }, [params, studyMode]);

  // 构建中屏悬浮 LaTeX 方程
  const equationLatex = useMemo(() => {
    if (studyMode === "lineParam") {
      const cosA = Math.cos((params.alpha * Math.PI) / 180).toFixed(2);
      const sinA = Math.sin((params.alpha * Math.PI) / 180).toFixed(2);
      return `\\begin{cases} x = \\color{${MATH_COLORS.paramPrimary}}{${params.x0.toFixed(1)}} + \\color{${MATH_COLORS.paramSecondary}}{t} \\cdot (${cosA}) \\\\ y = \\color{${MATH_COLORS.paramSecondary}}{${params.y0.toFixed(1)}} + \\color{${MATH_COLORS.paramSecondary}}{t} \\cdot (${sinA}) \\end{cases}`;
    } else if (studyMode === "ellipseParam") {
      return `\\begin{cases} x = \\color{${MATH_COLORS.paramPrimary}}{${params.a.toFixed(1)}}\\cos\\color{${MATH_COLORS.paramTertiary}}{\\theta} \\\\ y = \\color{${MATH_COLORS.paramSecondary}}{${params.b.toFixed(1)}}\\sin\\color{${MATH_COLORS.paramTertiary}}{\\theta} \\end{cases} \\quad (\\theta = ${params.theta}^\\circ)`;
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
              onChange={(v) => handleModeChange(v as typeof studyMode)}
            />
          </LeftPanelSection>

          {/* 案例预设 (2x2 对称网格) */}
          <LeftPanelSection
            title="典型几何预设"
            subtitle="一键复现高考经典构型"
          >
            <SelectGrid
              items={currentPresets}
              value={activePreset}
              onChange={handlePresetSelect}
              variant="filled"
              columns={2}
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
