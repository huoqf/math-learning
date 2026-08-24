/**
 * src/features/vectorPolarizationApollonius/VectorPolarizationApolloniusAnimation.tsx
 * 向量极化恒等式与阿波罗尼斯圆动画编排主页面
 */

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
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  defaultParams,
  paramMeta,
  type VectorPolarizationApolloniusParams,
} from "@/data/registries/vectorPolarizationApollonius";
import { VectorPolarizationApolloniusScene } from "./components/VectorPolarizationApolloniusScene";

export function VectorPolarizationApolloniusAnimation() {
  // 研究模式：'polarization' | 'apollonius' | 'combined'
  const [studyMode, setStudyMode] = useState<
    "polarization" | "apollonius" | "combined"
  >("polarization");

  // 典型预设状态
  const [preset, setPreset] = useState<string>("free");

  // 本地参数状态
  const [params, setParams] = useState<VectorPolarizationApolloniusParams>(
    () => ({ ...defaultParams }),
  );

  // 视口尺寸测量与自适应 Hook
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 数学坐标系 Scale: X [-8, 12], Y [-6.5, 6.5]
  const scale = useSceneScale({
    vp,
    xRange: [-8, 12],
    yRange: [-6.5, 6.5],
  });

  // 统一构建右屏看板数据
  const mathData = useMemo(() => {
    return buildMathQuantities(
      "anim-vector-polarization-apollonius",
      params as unknown as Record<string, number>,
      { studyMode },
    );
  }, [params, studyMode]);

  // 模式切换
  const handleModeChange = (
    mode: "polarization" | "apollonius" | "combined",
  ) => {
    setStudyMode(mode);
    setPreset("free");
  };

  // 参数更新（手动调节或拖拽时自动回归自由探究）
  const handleParamChange = (key: string, value: number) => {
    setPreset("free");
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 典型预设切换处理器（黄金 2×2）
  const handlePresetSelect = (presetKey: string) => {
    setPreset(presetKey);
    if (presetKey === "free") return;

    if (studyMode === "polarization") {
      if (presetKey === "equilateral") {
        // 正三角形: bcLength = 6.0 => c = 3.0, h = 3 * sqrt(3) ≈ 5.2
        setParams((prev) => ({
          ...prev,
          bcLength: 6.0,
          pointX: 0.0,
          pointY: 5.2,
        }));
      } else if (presetKey === "rightAngle") {
        // 直角三角形: A(0, 3.0), c = 3.0 => |AM| = |BM| = 3.0, 点积为 0
        setParams((prev) => ({
          ...prev,
          bcLength: 6.0,
          pointX: 0.0,
          pointY: 3.0,
        }));
      } else if (presetKey === "obtuseExtrema") {
        // 钝角极小值: A(0, 1.5)
        setParams((prev) => ({
          ...prev,
          bcLength: 6.0,
          pointX: 0.0,
          pointY: 1.5,
        }));
      }
    } else if (studyMode === "apollonius") {
      if (presetKey === "doubleRatio") {
        // 2 倍比标准阿圆
        setParams((prev) => ({
          ...prev,
          bcLength: 6.0,
          lambda: 2.0,
          pointAngle: 45,
        }));
      } else if (presetKey === "degenerate") {
        // 退化中垂线 λ = 1.0
        setParams((prev) => ({
          ...prev,
          bcLength: 6.0,
          lambda: 1.0,
          pointAngle: 90,
        }));
      } else if (presetKey === "halfRatio") {
        // 0.5 倍比阿圆
        setParams((prev) => ({
          ...prev,
          bcLength: 6.0,
          lambda: 0.5,
          pointAngle: 45,
        }));
      }
    } else {
      // combined 模式
      if (presetKey === "minPoint") {
        // 数量积最小值点 (内分点 D, 角度 0° 或 180°)
        setParams((prev) => ({
          ...prev,
          bcLength: 6.0,
          lambda: 2.0,
          pointAngle: 0,
        }));
      } else if (presetKey === "maxPoint") {
        // 数量积最大值点 (外分点 E, 角度 180° 或 0°)
        setParams((prev) => ({
          ...prev,
          bcLength: 6.0,
          lambda: 2.0,
          pointAngle: 180,
        }));
      } else if (presetKey === "orthogonal") {
        // 正交状态 (θ 处于垂直上方)
        setParams((prev) => ({
          ...prev,
          bcLength: 6.0,
          lambda: 2.0,
          pointAngle: 90,
        }));
      }
    }
  };

  // 重置参数
  const handleReset = () => {
    setPreset("free");
    setParams({ ...defaultParams });
  };

  // 典型预设选项（黄金 2×2 对称网格）
  const presetItems = useMemo(() => {
    if (studyMode === "polarization") {
      return [
        { key: "free", label: "自由探究", formula: "\\text{全参数开放}" },
        { key: "equilateral", label: "正三角形", formula: "\\triangle ABC" },
        {
          key: "rightAngle",
          label: "直角正交",
          formula: "\\vec{a} \\perp \\vec{b}",
        },
        { key: "obtuseExtrema", label: "钝角构型", formula: "|AM| < |BM|" },
      ];
    }
    if (studyMode === "apollonius") {
      return [
        { key: "free", label: "自由探究", formula: "\\text{全参数开放}" },
        { key: "doubleRatio", label: "2倍比阿圆", formula: "\\lambda = 2.0" },
        { key: "degenerate", label: "中垂线退化", formula: "\\lambda = 1.0" },
        { key: "halfRatio", label: "0.5倍比圆", formula: "\\lambda = 0.5" },
      ];
    }
    return [
      { key: "free", label: "自由探究", formula: "\\text{全参数开放}" },
      { key: "minPoint", label: "数量积最小", formula: "P = D" },
      { key: "maxPoint", label: "数量积最大", formula: "P = E" },
      {
        key: "orthogonal",
        label: "零数量积",
        formula: "\\vec{PA} \\perp \\vec{PB}",
      },
    ];
  }, [studyMode]);

  // 声明式参数配置 (按模式动态过滤参数，铁律 3 & 铁律 8)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<
      string,
      (keyof VectorPolarizationApolloniusParams)[]
    > = {
      polarization: ["bcLength", "pointX", "pointY"],
      apollonius: ["bcLength", "lambda", "pointAngle"],
      combined: ["bcLength", "lambda", "pointAngle"],
    };

    const activeKeys = keysByMode[studyMode] ?? Object.keys(paramMeta);

    return activeKeys.map((key) => {
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
        group: meta.group,
        marks: meta.marks,
      };
    });
  }, [params, studyMode]);

  // 悬浮公式动态生成（三位一体色彩绑定，铁律 4C）
  const formulaLatex = useMemo(() => {
    if (studyMode === "polarization") {
      return `\\vec{AB} \\cdot \\vec{AC} = \\color{${MATH_COLORS.paramPrimary}}{\\|\\vec{AM}\\|^2} - \\color{${MATH_COLORS.paramSecondary}}{\\|\\vec{BM}\\|^2}`;
    }
    if (studyMode === "apollonius") {
      return `\\frac{|PA|}{|PB|} = \\color{${MATH_COLORS.paramPrimary}}{\\lambda} \\quad (\\text{轨迹为阿波罗尼斯圆})`;
    }
    return `\\vec{PA} \\cdot \\vec{PB} = \\color{${MATH_COLORS.paramPrimary}}{\\|\\vec{PM}\\|^2} - \\color{${MATH_COLORS.paramSecondary}}{\\|\\vec{MB}\\|^2}`;
  }, [studyMode]);

  // 看板标题
  const panelTitle = useMemo(() => {
    if (studyMode === "polarization") return "向量极化恒等式看板";
    if (studyMode === "apollonius") return "阿波罗尼斯圆轨迹看板";
    return "极化恒等式 × 阿圆最值压轴看板";
  }, [studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 模式选择 Section */}
          <LeftPanelSection title="研究模式" subtitle="选择数形结合探讨维度">
            <SelectGrid
              items={[
                {
                  key: "polarization",
                  label: "向量极化恒等式",
                  formula: "\\vec{a} \\cdot \\vec{b}",
                },
                {
                  key: "apollonius",
                  label: "阿波罗尼斯圆",
                  formula: "\\frac{|PA|}{|PB|}=\\lambda",
                },
                {
                  key: "combined",
                  label: "新高考压轴最值模型",
                  formula: "\\min / \\max (\\vec{PA} \\cdot \\vec{PB})",
                  fullWidth: true,
                },
              ]}
              value={studyMode}
              onChange={(k) => handleModeChange(k as typeof studyMode)}
              variant="filled"
            />
          </LeftPanelSection>

          {/* 2. 典型预设 Section (黄金 2×2 网格) */}
          <LeftPanelSection
            title="典型构型预设"
            subtitle="一键切换高考经典特值与极值状态"
          >
            <SelectGrid
              items={presetItems}
              value={preset}
              onChange={handlePresetSelect}
              columns={2}
              variant="outline"
            />
          </LeftPanelSection>

          {/* 3. 参数调节 Section */}
          <LeftPanelSection
            title="参数控制台"
            subtitle="拖动滑块或画布控制点探究规律"
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
          {/* 中屏顶部悬浮 LaTeX 公式 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={formulaLatex} mode="inline" />
          </div>

          {/* SVG 自适应画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <VectorPolarizationApolloniusScene
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
