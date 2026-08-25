import { useState, useMemo, useCallback } from "react";
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
import { ComplexScene } from "./components/ComplexScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/complex";
import { createComplex, formatComplexLatex } from "@/math/complex";

type StudyMode =
  "plane-operations" | "multiplication-rotation" | "locus-extrema";

export function ComplexAnimation() {
  const [studyMode, setStudyMode] = useState<StudyMode>("plane-operations");
  const [activePreset, setActivePreset] = useState<string>("free");

  // 参数状态控制
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 视口尺寸测量与自适应
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 比例尺坐标系：[-6, 6] x [-4.5, 4.5]
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 状态变化更新处理器（若手动调参或拖拽，解耦切回 free）
  const handleParamChange = useCallback((key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // 拖拽动点时的解耦处理器：更新参数并将预设切回 free
  const handleDragParamChange = useCallback((key: string, value: number) => {
    setActivePreset("free");
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // 模式切换
  const handleModeChange = (mode: StudyMode) => {
    setStudyMode(mode);
    setActivePreset("free");
  };

  // 重置参数
  const handleReset = () => {
    setActivePreset("free");
    setParams({ ...defaultParams });
  };

  // 典型预设切换
  const handlePresetSelect = (presetKey: string) => {
    setActivePreset(presetKey);
    if (presetKey === "free") return;

    if (studyMode === "plane-operations") {
      if (presetKey === "pure-real-imag") {
        setParams((prev) => ({ ...prev, a1: 3.0, b1: 0.0, a2: 0.0, b2: 3.0 }));
      } else if (presetKey === "conjugate-pair") {
        setParams((prev) => ({ ...prev, a1: 3.0, b1: 2.0, a2: 3.0, b2: -2.0 }));
      } else if (presetKey === "orthogonal") {
        setParams((prev) => ({ ...prev, a1: 3.0, b1: 1.0, a2: -1.0, b2: 3.0 }));
      }
    } else if (studyMode === "multiplication-rotation") {
      if (presetKey === "rot-90") {
        setParams((prev) => ({ ...prev, r2: 1.0, deg2: 90 }));
      } else if (presetKey === "rot-180") {
        setParams((prev) => ({ ...prev, r2: 1.0, deg2: 180 }));
      } else if (presetKey === "rot-45") {
        setParams((prev) => ({ ...prev, r2: 1.0, deg2: 45 }));
      }
    } else if (studyMode === "locus-extrema") {
      if (presetKey === "origin-outside") {
        setParams((prev) => ({
          ...prev,
          z0x: 3.0,
          z0y: 4.0,
          radius: 2.0,
          wx: 0.0,
          wy: 0.0,
        }));
      } else if (presetKey === "target-inside") {
        setParams((prev) => ({
          ...prev,
          z0x: 2.0,
          z0y: 2.0,
          radius: 3.0,
          wx: 2.0,
          wy: 1.0,
        }));
      } else if (presetKey === "target-on-circle") {
        setParams((prev) => ({
          ...prev,
          z0x: 0.0,
          z0y: 0.0,
          radius: 3.0,
          wx: 3.0,
          wy: 0.0,
        }));
      }
    }
  };

  // 声明式参数配置（按复数代数形式/三角极坐标形式进行对象化分组）
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    let modeKeyGroups: Array<{ group: string; keys: string[] }> = [];

    if (studyMode === "plane-operations") {
      modeKeyGroups = [
        { group: "复数 z₁ = a₁ + b₁i (实部与虚部)", keys: ["a1", "b1"] },
        { group: "复数 z₂ = a₂ + b₂i (实部与虚部)", keys: ["a2", "b2"] },
      ];
    } else if (studyMode === "multiplication-rotation") {
      modeKeyGroups = [
        { group: "基准复数 z₁ (模长与辐角)", keys: ["r1", "deg1"] },
        { group: "旋转算子 z₂ (缩放与转角)", keys: ["r2", "deg2"] },
      ];
    } else {
      modeKeyGroups = [
        { group: "圆心定点 z₀ (实部与虚部)", keys: ["z0x", "z0y"] },
        { group: "轨迹圆半径 R", keys: ["radius"] },
        { group: "参考定点 w (实部与虚部)", keys: ["wx", "wy"] },
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

  // 典型预设 2x2 网格项
  const presetItems = useMemo(() => {
    if (studyMode === "plane-operations") {
      return [
        { key: "free", label: "自由探究", description: "全参数开放" },
        {
          key: "pure-real-imag",
          label: "实数与纯虚数",
          description: "轴上点对照",
        },
        {
          key: "conjugate-pair",
          label: "共轭复数对",
          description: "实轴镜像对称",
        },
        { key: "orthogonal", label: "正交垂直对", description: "内积为0" },
      ];
    }
    if (studyMode === "multiplication-rotation") {
      return [
        { key: "free", label: "自由探究", description: "全参数开放" },
        {
          key: "rot-90",
          label: "乘以 i",
          formula: "\\times i",
          description: "逆时针90°",
        },
        {
          key: "rot-180",
          label: "乘以 -1",
          formula: "\\times (-1)",
          description: "中心对称180°",
        },
        {
          key: "rot-45",
          label: "乘以 (1+i)/√2",
          formula: "e^{i\\frac{\\pi}{4}}",
          description: "45°等模旋转",
        },
      ];
    }
    return [
      { key: "free", label: "自由探究", description: "全参数开放" },
      {
        key: "origin-outside",
        label: "定点在圆外",
        description: "经典高考三步法",
      },
      {
        key: "target-inside",
        label: "定点在圆内",
        description: "内部最近最远",
      },
      {
        key: "target-on-circle",
        label: "定点在圆周",
        description: "最小值退化为0",
      },
    ];
  }, [studyMode]);

  // 数学量看板数据计算与组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-complex-geometry", params, {
      mode: studyMode,
    });
  }, [params, studyMode]);

  // 实时悬浮公式计算（严格使用色彩 Token）
  const equationLatex = useMemo(() => {
    if (studyMode === "plane-operations") {
      const z1Str = formatComplexLatex(createComplex(params.a1, params.b1));
      const z2Str = formatComplexLatex(createComplex(params.a2, params.b2));
      return `z_1 = \\color{${MATH_COLORS.paramPrimary}}{${z1Str}}, \\quad z_2 = \\color{${MATH_COLORS.paramSecondary}}{${z2Str}}`;
    }
    if (studyMode === "multiplication-rotation") {
      return `z_1 z_2 = (\\color{${MATH_COLORS.paramPrimary}}{r_1} \\color{${MATH_COLORS.paramSecondary}}{r_2}) \\cdot e^{i (\\color{${MATH_COLORS.paramPrimary}}{\\theta_1} + \\color{${MATH_COLORS.paramSecondary}}{\\theta_2})}`;
    }
    return `|z - (\\color{${MATH_COLORS.paramPrimary}}{${params.z0x} + ${params.z0y}i})| = \\color{${MATH_COLORS.paramPrimary}}{${params.radius}}`;
  }, [params, studyMode]);

  // 看板标题
  const panelTitle = useMemo(() => {
    if (studyMode === "plane-operations") return "复平面与加减法指标";
    if (studyMode === "multiplication-rotation") return "乘法旋转与缩放指标";
    return "复数圆轨迹与最值指标";
  }, [studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 模式选择 Section */}
          <LeftPanelSection
            title="探究模式"
            subtitle="选择复数几何与代数探究维度"
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
              onChange={(k) => handleModeChange(k as StudyMode)}
              variant="filled"
            />
          </LeftPanelSection>

          {/* 2. 典型预设 2x2 网格 */}
          <LeftPanelSection
            title="典型构型预设"
            subtitle="一键加载高考典型复数模型"
          >
            <SelectGrid
              columns={2}
              items={presetItems}
              value={activePreset}
              onChange={handlePresetSelect}
              variant="filled"
              color="primary"
            />
          </LeftPanelSection>

          {/* 3. 动态参数调节 Section */}
          <LeftPanelSection
            title="参数调节"
            subtitle="拖动滑块改变几何代数参数"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 4. 底部教学引导卡片 */}
          <LeftPanelSection
            title="教学探究引导"
            subtitle="带着问题在画布中探索"
          >
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xs space-y-2 text-neutral-600">
              {studyMode === "plane-operations" && (
                <>
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【基础条件】：
                    </span>
                    复数 z = a + bi 与复平面向量 OZ = (a, b) 一一对应。
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【探究问题】：
                    </span>
                    拖动 Z₁ 与 Z₂，观察和向量与差向量的几何特征，为什么 |z₁ -
                    z₂| 能够直接表示两点间距离？
                  </div>
                </>
              )}
              {studyMode === "multiplication-rotation" && (
                <>
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【基础条件】：
                    </span>
                    复数乘法满足“模长相乘，辐角相加”。
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【探究问题】：
                    </span>
                    当模长 $r_2=1$ 时，复数乘法退化为什么刚体几何变换？连续乘以
                    $i$ 会发生什么周期性循环？
                  </div>
                </>
              )}
              {studyMode === "locus-extrema" && (
                <>
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【基础条件】：
                    </span>
                    方程 |z - z₀| = R 刻画以 z₀ 为圆心、R 为半径的圆周。
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【探究问题】：
                    </span>
                    拖动定点 w 和圆心 z₀，观察极值点 Z_min 与 Z_max
                    是否始终落在连线 w-z₀ 所在直线上？
                  </div>
                </>
              )}
            </div>
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
              onParamChange={handleDragParamChange}
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
