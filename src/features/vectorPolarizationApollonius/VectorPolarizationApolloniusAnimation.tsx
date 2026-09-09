import { useState, useMemo, useCallback } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  TipCard,
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
  const handleParamChange = useCallback((key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // 拖拽动点时的解耦回调
  const handleDragParamChange = useCallback((key: string, value: number) => {
    setPreset("free");
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // 典型预设切换处理器（实现参数降维与锁定）
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
        setParams((prev) => ({
          ...prev,
          bcLength: 6.0,
          lambda: 2.0,
          pointAngle: 45,
        }));
      } else if (presetKey === "degenerate") {
        setParams((prev) => ({
          ...prev,
          bcLength: 6.0,
          lambda: 1.0,
          pointAngle: 90,
        }));
      } else if (presetKey === "halfRatio") {
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
        setParams((prev) => ({
          ...prev,
          bcLength: 6.0,
          lambda: 2.0,
          pointAngle: 0,
        }));
      } else if (presetKey === "maxPoint") {
        setParams((prev) => ({
          ...prev,
          bcLength: 6.0,
          lambda: 2.0,
          pointAngle: 180,
        }));
      } else if (presetKey === "orthogonal") {
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

  // 典型预设选项
  const presetItems = useMemo(() => {
    if (studyMode === "polarization") {
      return [
        { key: "free", label: "自由探究", description: "任意动点与底边" },
        {
          key: "equilateral",
          label: "正三角形",
          description: "对称正三边构型",
        },
        {
          key: "rightAngle",
          label: "直角正交",
          description: "数量积为零构型",
        },
        {
          key: "obtuseExtrema",
          label: "钝角构型",
          description: "负数量积与钝角",
        },
      ];
    }
    if (studyMode === "apollonius") {
      return [
        { key: "free", label: "自由探究", description: "连续比例调节" },
        {
          key: "doubleRatio",
          label: "二倍比阿圆",
          description: "定比为2的阿氏圆",
        },
        {
          key: "degenerate",
          label: "中垂线退化",
          description: "比值为1退化为垂直平分线",
        },
        {
          key: "halfRatio",
          label: "半倍比阿圆",
          description: "定比为0.5的阿氏圆",
        },
      ];
    }
    return [
      { key: "free", label: "自由探究", description: "沿圆周自由探索" },
      {
        key: "minPoint",
        label: "数量积最小",
        description: "内侧最近交点",
      },
      {
        key: "maxPoint",
        label: "数量积最大",
        description: "外侧最远交点",
      },
      {
        key: "orthogonal",
        label: "正交垂直状态",
        description: "夹角为直角",
      },
    ];
  }, [studyMode]);

  // 声明式参数配置 (按模式动态降维与过滤参数)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    let activeKeys: (keyof VectorPolarizationApolloniusParams)[] = [];

    if (studyMode === "polarization") {
      activeKeys = ["bcLength", "pointX", "pointY"];
    } else if (studyMode === "apollonius") {
      activeKeys = ["bcLength", "lambda", "pointAngle"];
    } else {
      if (preset === "minPoint" || preset === "maxPoint") {
        // 极值状态锁定动点位置，仅开放底边长与比值
        activeKeys = ["bcLength", "lambda"];
      } else {
        activeKeys = ["bcLength", "lambda", "pointAngle"];
      }
    }

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
  }, [params, studyMode, preset]);

  // 悬浮公式动态生成（三位一体色彩绑定）
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
          <LeftPanelSection
            title="探究专题模式"
            subtitle="选择数形结合探讨维度"
          >
            <SelectGrid
              items={[
                {
                  key: "polarization",
                  label: "向量极化恒等式",
                  description: "中线模长与底边数量积",
                },
                {
                  key: "apollonius",
                  label: "阿波罗尼斯圆轨迹",
                  description: "定比分点距离轨迹",
                },
                {
                  key: "combined",
                  label: "高考压轴综合模型",
                  description: "圆上动点数量积最值",
                  fullWidth: true,
                },
              ]}
              value={studyMode}
              onChange={(k) => handleModeChange(k as typeof studyMode)}
              variant="filled"
            />
          </LeftPanelSection>

          {/* 2. 典型预设 Section (实现参数降维) */}
          <LeftPanelSection title="典型预设">
            <SelectGrid
              items={presetItems}
              value={preset}
              onChange={handlePresetSelect}
              columns={2}
              variant="filled"
              color="primary"
            />
          </LeftPanelSection>

          {/* 3. 参数调节 Section */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 4. 教学引导卡片（置于最底部） */}
          <TipCard
            variant="primary"
            badge={
              studyMode === "polarization"
                ? "极化恒等式与中线模长"
                : studyMode === "apollonius"
                  ? "阿波罗尼斯圆轨迹"
                  : "阿圆上的数量积最值"
            }
            condition={
              studyMode === "polarization"
                ? "M 为底边 BC 中点，AB·AC = |AM|² - |BM|²。"
                : studyMode === "apollonius"
                  ? "动点 P 满足到两定点距离比 |PA|/|PB| = λ (λ ≠ 1)。"
                  : "动点 P 在阿波罗尼斯圆上运动，求解向量 PA·PB 的最值。"
            }
            question={
              studyMode === "polarization"
                ? "当底边长固定时，数量积仅由中线长 |AM| 决定，如何用它快速求解最值？"
                : studyMode === "apollonius"
                  ? "圆直径端点 D, E 分别为线段 AB 的内分点与外分点，当 λ→1 时轨迹如何退化？"
                  : "利用极化恒等式转化后，动点 P 取在内分点 D 或外分点 E 时如何分别取得极小与极大值？"
            }
          />
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
