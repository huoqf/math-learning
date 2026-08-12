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
import { ComplexScene } from "./components/ComplexScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/complex";
import { createComplex, formatComplexLatex } from "@/math/complex";

type StudyMode =
  "plane-operations" | "multiplication-rotation" | "locus-extrema";

export function ComplexAnimation() {
  const [studyMode, setStudyMode] = useState<StudyMode>("plane-operations");

  // 参数状态控制
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 视口尺寸测量与防抖
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 比例尺坐标系：[-6, 6] x [-4.5, 4.5]
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 状态变化更新处理器
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

  // 按研究模式过滤参数配置（符合 AGENTS.md 左屏参数过滤铁律）
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<StudyMode, string[]> = {
      "plane-operations": ["a1", "b1", "a2", "b2"],
      "multiplication-rotation": ["r1", "deg1", "r2", "deg2"],
      "locus-extrema": ["z0x", "z0y", "radius", "wx", "wy"],
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
          importance: meta.importance as any,
          marks: meta.marks,
        };
      });
  }, [params, studyMode]);

  // 数学量看板数据计算与组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-complex-geometry", params, {
      mode: studyMode,
    });
  }, [params, studyMode]);

  // 实时悬浮公式计算
  const equationLatex = useMemo(() => {
    if (studyMode === "plane-operations") {
      const z1Str = formatComplexLatex(createComplex(params.a1, params.b1));
      const z2Str = formatComplexLatex(createComplex(params.a2, params.b2));
      return `z_1 = \\color{#EF4444}{${z1Str}}, \\quad z_2 = \\color{#D97706}{${z2Str}}`;
    }
    if (studyMode === "multiplication-rotation") {
      return `z_1 z_2 = (\\color{#EF4444}{r_1} \\color{#D97706}{r_2}) \\cdot e^{i (\\color{#EF4444}{\\theta_1} + \\color{#D97706}{\\theta_2})}`;
    }
    return `|z - (\\color{#EF4444}{${params.z0x} + ${params.z0y}i})| = \\color{#EF4444}{${params.radius}}`;
  }, [params, studyMode]);

  // 看板标题
  const panelTitle = useMemo(() => {
    if (studyMode === "plane-operations") return "复平面与加减法指标";
    if (studyMode === "multiplication-rotation") return "乘法旋转与缩放指标";
    return "复数圆轨迹与最值指标";
  }, [studyMode]);

  // 旋转模式下快速预设
  const applyPresetRotation = (type: "i" | "-1" | "-i" | "45deg") => {
    if (type === "i") {
      setParams((prev) => ({ ...prev, r2: 1.0, deg2: 90 }));
    } else if (type === "-1") {
      setParams((prev) => ({ ...prev, r2: 1.0, deg2: 180 }));
    } else if (type === "-i") {
      setParams((prev) => ({ ...prev, r2: 1.0, deg2: -90 }));
    } else if (type === "45deg") {
      setParams((prev) => ({ ...prev, r2: 1.0, deg2: 45 }));
    }
  };

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 模式选择 Section */}
          <LeftPanelSection
            title="研究模式"
            subtitle="探索复数的几何表达与运算"
          >
            <SelectGrid
              columns={1}
              items={[
                {
                  key: "plane-operations",
                  label: "复平面与向量加减",
                  fullWidth: true,
                },
                {
                  key: "multiplication-rotation",
                  label: "乘法旋转与伸缩",
                  fullWidth: true,
                },
                {
                  key: "locus-extrema",
                  label: "复数轨迹与最值",
                  fullWidth: true,
                },
              ]}
              value={studyMode}
              onChange={(k) => setStudyMode(k as StudyMode)}
              variant="filled"
            />
          </LeftPanelSection>

          {/* 2. 乘法旋转模式特例预设 */}
          {studyMode === "multiplication-rotation" && (
            <LeftPanelSection
              title="常见旋转算子"
              subtitle="点击一键加载经典高考旋转算子"
            >
              <SelectGrid
                items={[
                  { key: "i", label: "乘以 i (逆90°)", formula: "\\times i" },
                  {
                    key: "-1",
                    label: "乘以 -1 (180°)",
                    formula: "\\times (-1)",
                  },
                  {
                    key: "-i",
                    label: "乘以 -i (顺90°)",
                    formula: "\\times (-i)",
                  },
                  {
                    key: "45deg",
                    label: "乘以 (1+i)/√2",
                    formula: "e^{i\\frac{\\pi}{4}}",
                  },
                ]}
                value=""
                onChange={(k) => applyPresetRotation(k as any)}
                variant="filled"
                color="primary"
              />
            </LeftPanelSection>
          )}

          {/* 3. 动态参数调节 Section */}
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
          {/* 公式悬浮展示卡片 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={equationLatex} mode="inline" />
          </div>

          {/* SVG 自适应画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <ComplexScene
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
