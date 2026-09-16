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
import {
  getCombinedExtremaAngles,
  getOrthogonalAngle,
} from "@/math/vectorPolarizationApollonius";
import { SceneLegend, type SceneLegendItem } from "@/components/Math";

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

  // 参数更新（手动调节滑块时自动回归自由探究，防止虚假高亮）
  const handleParamChange = useCallback((key: string, value: number) => {
    setPreset("free");
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
      // combined 模式: 根据 lambda 动态自适应最值极角，杜绝倒置 Bug
      const targetLambda = 2.0;
      const { minAngle, maxAngle } = getCombinedExtremaAngles(targetLambda);
      if (presetKey === "minPoint") {
        setParams((prev) => ({
          ...prev,
          bcLength: 6.0,
          lambda: targetLambda,
          pointAngle: minAngle,
        }));
      } else if (presetKey === "maxPoint") {
        setParams((prev) => ({
          ...prev,
          bcLength: 6.0,
          lambda: targetLambda,
          pointAngle: maxAngle,
        }));
      } else if (presetKey === "orthogonal") {
        // 动态解算正交垂直极角 (PA · PB = 0 <=> |PM| = c)
        const orthoAngle = getOrthogonalAngle(6.0, 2.0);
        setParams((prev) => ({
          ...prev,
          bcLength: 6.0,
          lambda: 2.0,
          pointAngle: orthoAngle,
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
        description: "数量积为零构型",
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

  // 图例项动态生成 (SceneLegend)
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    if (studyMode === "polarization") {
      return [
        {
          label: "中线 $AM$",
          color: MATH_COLORS.paramPrimary,
          style: "dashed",
        },
        {
          label: "向量 $\\vec{AB}$",
          color: MATH_COLORS.vectorPrimary,
          style: "line",
        },
        {
          label: "向量 $\\vec{AC}$",
          color: MATH_COLORS.vectorSecondary,
          style: "line",
        },
        {
          label: "底边 $BC$",
          color: MATH_COLORS.paramSecondary,
          style: "solid",
        },
      ];
    }
    if (studyMode === "apollonius") {
      return [
        {
          label: "阿氏圆轨迹",
          color: MATH_COLORS.function,
          style: "solid",
        },
        {
          label: "向量 $\\vec{PA}$",
          color: MATH_COLORS.vectorPrimary,
          style: "line",
        },
        {
          label: "向量 $\\vec{PB}$",
          color: MATH_COLORS.vectorSecondary,
          style: "line",
        },
        {
          label: "直径端点 $D, E$",
          color: MATH_COLORS.paramPrimary,
          style: "point",
        },
      ];
    }
    return [
      {
        label: "中线 $PM$",
        color: MATH_COLORS.paramPrimary,
        style: "dashed",
      },
      {
        label: "阿氏圆轨迹",
        color: MATH_COLORS.function,
        style: "solid",
      },
      {
        label: "极小值点 $P_{\\min}$",
        color: MATH_COLORS.paramTertiary,
        style: "point",
      },
      {
        label: "极大值点 $P_{\\max}$",
        color: MATH_COLORS.degeneracy,
        style: "point",
      },
    ];
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
              columns={1}
              items={[
                {
                  key: "polarization",
                  label: "极化恒等式",
                  description: "双矢数量积的中线降维模型",
                },
                {
                  key: "apollonius",
                  label: "阿波罗尼斯圆",
                  description: "两点距离比为定值的动点轨迹",
                },
                {
                  key: "combined",
                  label: "极化恒等式 × 阿圆综合",
                  description: "圆周动点数量积的最值压轴模型",
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
                ? "中线降维 · 极化恒等式"
                : studyMode === "apollonius"
                  ? "距离定比 · 阿波罗尼斯圆"
                  : "新高考压轴 · 极化恒等式 × 阿圆"
            }
            condition={
              studyMode === "polarization"
                ? "取定底边 $BC$ 的中点 $M$，将 $\\vec{AB}$ 与 $\\vec{AC}$ 分别用 $\\vec{AM}$ 与 $\\vec{MB}$ 线性表示。"
                : studyMode === "apollonius"
                  ? "平面内动点 $P$ 到两定点 $A, B$ 的距离比为常数 $\\frac{|PA|}{|PB|} = \\lambda$（$\\lambda > 0, \\lambda \\neq 1$）。"
                  : "动点 $P$ 在阿波罗尼斯圆上运动，求解向量数量积 $\\vec{PA}\\cdot\\vec{PB}$ 的取值范围。"
            }
            question={
              studyMode === "polarization"
                ? "底边长 $|BC|$ 固定时，数量积 $\\vec{AB}\\cdot\\vec{AC}$ 与中线长 $|\\vec{AM}|$ 有怎样的关系？动点 $A$ 位于何处时数量积取得极值？"
                : studyMode === "apollonius"
                  ? "初高中几何桥梁：线段 $AB$ 的内分点 $D$ 与外分点 $E$ 分别平分 $\\angle APB$ 的内角与外角，为什么必有 $\\angle DPE = 90^\\circ$ 且 $DE$ 为圆直径？当 $\\lambda \\to 1$ 时为何退化为中垂线？"
                  : "动点 $P$ 在阿圆上运动时，数量积 $\\vec{PA}\\cdot\\vec{PB}$ 的取值范围如何确定？取到最值的位置与 $P, M, O_A$ 三点的相对位置有何关系？"
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

          {/* 中屏右下角毛玻璃图例 (SceneLegend) */}
          <SceneLegend items={legendItems} title="图元与特征指示" />
        </div>
      }
      right={<MathPanel {...mathData} title={panelTitle} />}
    />
  );
}
