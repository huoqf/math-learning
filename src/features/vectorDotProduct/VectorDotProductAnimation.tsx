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

  // 本地参数状态
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

  // 典型预设定义
  const presetsByMode = useMemo(() => {
    return {
      defProj: [
        { key: "free", label: "自由探究", description: "全参数开放" },
        {
          key: "perpendicular",
          label: "正交垂直 (90°)",
          formula: "\\vec{a} \\perp \\vec{b}",
          description: "投影数量为0",
        },
        {
          key: "collinearSame",
          label: "同向共线 (0°)",
          formula: "\\vec{a} \\uparrow\\!\\uparrow \\vec{b}",
          description: "投影等于模长",
        },
        {
          key: "obtuseAngle",
          label: "钝角投影 (120°)",
          formula: "\\theta = 120^\\circ",
          description: "投影数量为负",
        },
      ],
      properties: [
        { key: "free", label: "自由探究", description: "全参数开放" },
        {
          key: "orthogonalTest",
          label: "垂直充要判定",
          formula: "x_1x_2+y_1y_2=0",
          description: "法向正交",
        },
        {
          key: "equalNorm60",
          label: "等模夹角 (60°)",
          formula: "|a|=|b|",
          description: "a·b=|a|²/2",
        },
        {
          key: "oppositeCollinear",
          label: "反向共线 (180°)",
          formula: "a·b = -|a||b|",
          description: "取极小值",
        },
      ],
      polarization: [
        { key: "free", label: "自由探究", description: "全参数开放" },
        {
          key: "equalSides",
          label: "等腰中线垂直",
          formula: "|OA|=|OB|",
          description: "中线与底边垂直",
        },
        {
          key: "rightHypotenuse",
          label: "直角斜边中线",
          formula: "|OM|=|MA|",
          description: "数量积为0",
        },
        {
          key: "collinearExtrema",
          label: "共线极值构型",
          formula: "A, O, B \\text{ 共线}",
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

  // 应用典型预设（支持参数降维锁定）
  const handlePresetChange = (key: string) => {
    setPresetKey(key);
    if (key === "free") return;

    if (studyMode === "defProj") {
      if (key === "perpendicular") {
        setParams((p) => ({ ...p, normA: 4, normB: 3, thetaDeg: 90 }));
      } else if (key === "collinearSame") {
        setParams((p) => ({ ...p, normA: 4, normB: 2.5, thetaDeg: 0 }));
      } else if (key === "obtuseAngle") {
        setParams((p) => ({ ...p, normA: 4, normB: 3.5, thetaDeg: 120 }));
      }
    } else if (studyMode === "properties") {
      if (key === "orthogonalTest") {
        setParams((p) => ({ ...p, xa: 3, ya: 2, xb: -2, yb: 3 }));
      } else if (key === "equalNorm60") {
        setParams((p) => ({ ...p, xa: 4, ya: 0, xb: 2, yb: 3.46 }));
      } else if (key === "oppositeCollinear") {
        setParams((p) => ({ ...p, xa: 4, ya: 0, xb: -3, yb: 0 }));
      }
    } else if (studyMode === "polarization") {
      if (key === "equalSides") {
        setParams((p) => ({ ...p, xa: 3, ya: 2, xb: 2, yb: 3 }));
      } else if (key === "rightHypotenuse") {
        setParams((p) => ({ ...p, xa: 4, ya: 0, xb: 0, yb: 3 }));
      } else if (key === "collinearExtrema") {
        setParams((p) => ({ ...p, xa: 4, ya: 0, xb: -2, yb: 0 }));
      }
    }
  };

  // 参数更新（切回 free）
  const handleParamChange = useCallback(
    (key: string, value: number) => {
      setParams((prev) => {
        const next = { ...prev, [key]: value };
        // 如果在 defProj 模式下调节极坐标参数，同步更新笛卡尔坐标
        if (studyMode === "defProj") {
          const rA = next.normA ?? 4;
          const rB = next.normB ?? 3.5;
          const th = ((next.thetaDeg ?? 60) * Math.PI) / 180;
          next.xa = rA;
          next.ya = 0;
          next.xb = Math.round(rB * Math.cos(th) * 10) / 10;
          next.yb = Math.round(rB * Math.sin(th) * 10) / 10;
        }
        return next;
      });
    },
    [studyMode],
  );

  // 批量更新（画布拖拽时使用）
  const handleBatchParamsChange = useCallback(
    (updates: Record<string, number>) => {
      if (presetKey !== "free") {
        setPresetKey("free");
      }
      setParams((prev) => {
        const next = { ...prev, ...updates };
        if (
          studyMode === "defProj" &&
          (updates.xa !== undefined || updates.xb !== undefined)
        ) {
          const rA = Math.hypot(next.xa, next.ya);
          const rB = Math.hypot(next.xb, next.yb);
          const dot = next.xa * next.xb + next.ya * next.yb;
          const cosVal =
            rA > 1e-4 && rB > 1e-4
              ? Math.max(-1, Math.min(1, dot / (rA * rB)))
              : 1;
          next.normA = Math.round(rA * 10) / 10;
          next.normB = Math.round(rB * 10) / 10;
          next.thetaDeg = Math.round((Math.acos(cosVal) * 180) / Math.PI);
        }
        return next;
      });
    },
    [presetKey, studyMode],
  );

  // 重置参数
  const handleReset = () => {
    setParams({ ...defaultParams });
    setPresetKey("free");
  };

  // 教学启发引导卡片内容
  const currentGuidance = useMemo(() => {
    switch (studyMode) {
      case "defProj":
        return {
          condition: "两共起点向量 a 与 b，夹角 θ ∈ [0, π]。",
          question:
            "拖动夹角滑块观察：当 θ 分别为锐角、直角、钝角时，垂足 H 与投影数量正负有什么规律？",
        };
      case "properties":
        return {
          condition: "由坐标定义 a=(x₁, y₁), b=(x₂, y₂)。",
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

  // 左屏 ParamControl 参数配置 (根据模式实现真正降维)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    let activeKeys: string[] = [];

    if (studyMode === "defProj") {
      if (presetKey !== "free") {
        // 预设锁定角度，仅开放模长调节
        activeKeys = ["normA", "normB"];
      } else {
        activeKeys = ["normA", "normB", "thetaDeg"];
      }
    } else {
      activeKeys = ["xa", "ya", "xb", "yb"];
    }

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
          group: meta.group,
        };
      });
  }, [params, studyMode, presetKey]);

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
            title="探究专题模式"
            subtitle="选择平面向量数量积研讨主题"
          >
            <SelectGrid
              items={[
                { key: "defProj", label: "几何定义与投影 (|a|, |b|, θ)" },
                { key: "properties", label: "坐标运算与垂直 (x₁, y₁, x₂, y₂)" },
                { key: "polarization", label: "极化恒等式 (高考极值模型)" },
              ]}
              value={studyMode}
              onChange={(k) =>
                handleModeChange(k as "defProj" | "properties" | "polarization")
              }
              variant="filled"
              columns={1}
            />
          </LeftPanelSection>

          {/* 2. 典型构型预设 (实现参数降维) */}
          <LeftPanelSection
            title="典型构型预设"
            subtitle="一键切换高考经典构型"
          >
            <SelectGrid
              items={presetsByMode[studyMode]}
              value={presetKey}
              onChange={handlePresetChange}
              variant="filled"
              color="primary"
              columns={2}
            />
          </LeftPanelSection>

          {/* 3. 参数调节 Section (按 group 对象化聚合) */}
          <LeftPanelSection title="参数调节" subtitle="拖动滑块或画布控制点">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 4. 教学引导与探究问题 (规范排版，接入 KatexFormula) */}
          <LeftPanelSection
            title="教学探究引导"
            subtitle="带着核心问题动手实验"
          >
            <div className="bg-neutral-50/90 border border-neutral-200/80 rounded-lg p-2.5 text-xs space-y-2 text-neutral-600 leading-relaxed">
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
