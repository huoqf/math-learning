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
import { VectorDotProductScene } from "./components/VectorDotProductScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/vectorDotProduct";
import { computeVectorDotProduct } from "@/math/vectorDotProduct";

export function VectorDotProductAnimation() {
  // 研究模式：'defProj' | 'properties' | 'polarization'
  const [studyMode, setStudyMode] = useState<
    "defProj" | "properties" | "polarization"
  >("defProj");

  // 典型预设 key
  const [presetKey, setPresetKey] = useState<string>("free");

  // 本地参数状态 (xa, ya, xb, yb)
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 视口测量与防抖
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 直角坐标系比例尺：数学范围 X [-6, 6]，Y [-4.5, 4.5]
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 典型预设黄金 2x2 定义
  const presetsByMode = useMemo(() => {
    return {
      defProj: [
        { key: "free", label: "自由探究", description: "全参数开放" },
        {
          key: "perpendicular",
          label: "正交垂直 (90°)",
          description: "投影数量为0",
        },
        {
          key: "collinearSame",
          label: "同向共线 (0°)",
          description: "投影等于模长",
        },
        {
          key: "obtuseAngle",
          label: "钝角投影 (120°)",
          description: "投影数量为负",
        },
      ],
      properties: [
        { key: "free", label: "自由探究", description: "全参数开放" },
        {
          key: "orthogonalTest",
          label: "垂直判定",
          description: "x1x2+y1y2=0",
        },
        {
          key: "equalNorm60",
          label: "等模夹角 (60°)",
          description: "a·b=|a|²/2",
        },
        {
          key: "oppositeCollinear",
          label: "反向共线 (180°)",
          description: "a·b=-|a||b|",
        },
      ],
      polarization: [
        { key: "free", label: "自由探究", description: "全参数开放" },
        {
          key: "equalSides",
          label: "等腰中线垂直",
          description: "|OA|=|OB|",
        },
        {
          key: "rightHypotenuse",
          label: "直角斜边中线",
          description: "|OM|=|MA|",
        },
        {
          key: "collinearExtrema",
          label: "共线极值构型",
          description: "中线与边重合",
        },
      ],
    };
  }, []);

  // 模式切换时重置预设
  const handleModeChange = (
    mode: "defProj" | "properties" | "polarization",
  ) => {
    setStudyMode(mode);
    setPresetKey("free");
  };

  // 应用典型预设
  const handlePresetChange = (key: string) => {
    setPresetKey(key);
    if (key === "free") return;

    if (studyMode === "defProj") {
      if (key === "perpendicular") {
        setParams({ xa: 4, ya: 0, xb: 0, yb: 3 });
      } else if (key === "collinearSame") {
        setParams({ xa: 4, ya: 0, xb: 2.5, yb: 0 });
      } else if (key === "obtuseAngle") {
        setParams({ xa: 4, ya: 0, xb: -2, yb: 3.46 });
      }
    } else if (studyMode === "properties") {
      if (key === "orthogonalTest") {
        setParams({ xa: 3, ya: 2, xb: -2, yb: 3 });
      } else if (key === "equalNorm60") {
        setParams({ xa: 4, ya: 0, xb: 2, yb: 3.46 });
      } else if (key === "oppositeCollinear") {
        setParams({ xa: 4, ya: 0, xb: -3, yb: 0 });
      }
    } else if (studyMode === "polarization") {
      if (key === "equalSides") {
        setParams({ xa: 3, ya: 2, xb: 2, yb: 3 });
      } else if (key === "rightHypotenuse") {
        setParams({ xa: 4, ya: 0, xb: 0, yb: 3 });
      } else if (key === "collinearExtrema") {
        setParams({ xa: 4, ya: 0, xb: -2, yb: 0 });
      }
    }
  };

  // 参数更新（切回 free）
  const handleParamChange = (key: string, value: number) => {
    setPresetKey("free");
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 批量更新（拖拽时使用）
  const handleBatchParamsChange = (updates: Record<string, number>) => {
    setPresetKey("free");
    setParams((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  // 重置参数
  const handleReset = () => {
    setParams({
      ...defaultParams,
    });
    setPresetKey("free");
  };

  // 教学启发引导卡片内容
  const currentGuidance = useMemo(() => {
    switch (studyMode) {
      case "defProj":
        return {
          condition: "两共起点向量 a 与 b，夹角 θ ∈ [0, π]。",
          question:
            "拖动向量 b 观察：当 θ 分别为锐角、直角、钝角时，垂足 H 与投影数量正负有什么规律？",
        };
      case "properties":
        return {
          condition: "由坐标定义 a=(x1, y1), b=(x2, y2)。",
          question:
            "两向量垂直时坐标满足什么等式？与向量共线的坐标充要条件有何本质区别？",
        };
      case "polarization":
        return {
          condition: "线段 AB 中点为 M，向量 OA 与 OB 构成三角形两边。",
          question:
            "当线段 AB 长度固定时，数量积 OA·OB 仅由中线长 |OM| 决定，如何用它秒杀高考极值？",
        };
    }
  }, [studyMode]);

  // 右屏看板数据构建
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-vector-dot-product", params, {
      studyMode,
    });
  }, [params, studyMode]);

  // 左屏 ParamControl 参数配置
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    return Object.entries(paramMeta).map(([key, meta]) => ({
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
    }));
  }, [params]);

  // 计算中屏顶端悬浮的 KaTeX 动态公式（带色彩 Token 绑定）
  const topFormulaLatex = useMemo(() => {
    const mathRes = computeVectorDotProduct(params);
    const {
      a,
      b,
      normA,
      normB,
      dotProduct,
      cosTheta,
      scalarProjBtoA,
      polarizationVal,
    } = mathRes;

    const colA = MATH_COLORS.paramPrimary;
    const colB = MATH_COLORS.paramSecondary;
    const colP = MATH_COLORS.paramTertiary;

    if (studyMode === "defProj") {
      return `\\color{${colA}}{\\vec{a}} \\cdot \\color{${colB}}{\\vec{b}} = |\\vec{a}||\\vec{b}|\\cos\\theta = ${normA.toFixed(1)} \\times ${normB.toFixed(1)} \\times (${cosTheta.toFixed(2)}) = \\mathbf{${dotProduct.toFixed(2)}}, \\quad \\text{投影数量} = \\mathbf{${scalarProjBtoA.toFixed(2)}}`;
    } else if (studyMode === "properties") {
      return `\\color{${colA}}{\\vec{a}} \\cdot \\color{${colB}}{\\vec{b}} = x_1 x_2 + y_1 y_2 = (${a.x.toFixed(1)})(${b.x.toFixed(1)}) + (${a.y.toFixed(1)})(${b.y.toFixed(1)}) = \\mathbf{${dotProduct.toFixed(2)}}`;
    } else {
      return `\\color{${colA}}{\\vec{OA}} \\cdot \\color{${colB}}{\\vec{OB}} = \\frac{1}{4}(|\\vec{a}+\\vec{b}|^2 - |\\vec{a}-\\vec{b}|^2) = |\\color{${colP}}{\\vec{OM}}|^2 - |\\vec{MB}|^2 = \\mathbf{${polarizationVal.toFixed(2)}}`;
    }
  }, [params, studyMode]);

  // 看板标题
  const panelTitle = useMemo(() => {
    if (studyMode === "defProj") return "数量积与几何投影看板";
    if (studyMode === "properties") return "坐标运算与模长垂直看板";
    return "极化恒等式与中点公式看板";
  }, [studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 模式选择 Section */}
          <LeftPanelSection
            title="研究模式"
            subtitle="选择平面向量数量积研讨主题"
          >
            <SelectGrid
              items={[
                { key: "defProj", label: "几何定义与投影" },
                { key: "properties", label: "坐标与模长垂直" },
                { key: "polarization", label: "极化恒等式 (高考极值)" },
              ]}
              value={studyMode}
              onChange={(k) =>
                handleModeChange(k as "defProj" | "properties" | "polarization")
              }
              variant="filled"
              columns={1}
            />
          </LeftPanelSection>

          {/* 2. 典型构型预设 (2x2 黄金规范) */}
          <LeftPanelSection
            title="典型构型预设"
            subtitle="一键切换高考经典构型"
          >
            <SelectGrid
              items={presetsByMode[studyMode]}
              value={presetKey}
              onChange={handlePresetChange}
              variant="filled"
              columns={2}
            />
          </LeftPanelSection>

          {/* 3. 参数调节 Section (按 group 对象化聚合) */}
          <LeftPanelSection
            title="向量坐标调节"
            subtitle="拖动滑块或画布点 A、B"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 4. 教学引导与探究问题 (置于左屏最底部辅助区) */}
          <LeftPanelSection
            title="教学引导与探究"
            subtitle="带着核心问题动手实验"
          >
            <div className="bg-neutral-50/90 border border-neutral-200/80 rounded-lg p-2.5 text-[11px] space-y-1.5 leading-relaxed">
              <div className="flex items-start gap-1.5">
                <span className="inline-block px-1.5 py-0.5 rounded bg-primary-100 text-primary-700 font-semibold text-[10px] shrink-0">
                  基础条件
                </span>
                <span className="text-neutral-700">
                  {currentGuidance.condition}
                </span>
              </div>
              <div className="flex items-start gap-1.5 pt-0.5">
                <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold text-[10px] shrink-0">
                  探究问题
                </span>
                <span className="text-neutral-700">
                  {currentGuidance.question}
                </span>
              </div>
            </div>
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 顶端 KaTeX 悬浮公式 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={topFormulaLatex} mode="inline" />
          </div>

          {/* SVG 自适应画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <VectorDotProductScene
              params={params}
              scale={scale}
              vp={vp}
              onBatchParamsChange={handleBatchParamsChange}
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
