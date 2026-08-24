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
import { VectorLinearScene } from "./components/VectorLinearScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/vectorLinear";
import { computeVectorLinear } from "@/math/vectorLinear";

export function VectorLinearAnimation() {
  // 教学研究模式：'linearCombo' | 'collinear' | 'basis'
  const [studyMode, setStudyMode] = useState<
    "linearCombo" | "collinear" | "basis"
  >("linearCombo");

  // 典型预设状态
  const [presetKey, setPresetKey] = useState<string>("free");

  // 模式二是否锁定 x + y = 1 三点共线
  const [lockCollinear, setLockCollinear] = useState<boolean>(true);

  // 参数状态
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 视口尺寸测量
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 坐标系比例尺范围 X [-6, 6]，Y [-4.5, 4.5]
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 典型预设定义
  const presetsByMode = useMemo(() => {
    return {
      linearCombo: [
        { key: "free", label: "自由探究", description: "全参数开放" },
        {
          key: "parallelogram",
          label: "平行四边形和向量",
          description: "λ=1, μ=1 合成",
        },
        {
          key: "subtraction",
          label: "差向量与反向",
          description: "λ=1, μ=-1",
        },
        {
          key: "scaleUp",
          label: "倍数与伸缩",
          description: "λ=2, μ=0.5",
        },
      ],
      collinear: [
        { key: "free", label: "自由探究", description: "全参数开放" },
        {
          key: "midpoint",
          label: "线段 AB 中点",
          description: "x=0.5, y=0.5",
        },
        {
          key: "trisection",
          label: "三等分内分点",
          description: "x=2/3, y=1/3",
        },
        {
          key: "extension",
          label: "AB 延长线外分点",
          description: "x=1.5, y=-0.5",
        },
      ],
      basis: [
        { key: "free", label: "自由探究", description: "全参数开放" },
        {
          key: "orthogonal",
          label: "标准正交基底",
          description: "e1=(1,0), e2=(0,1)",
        },
        {
          key: "oblique",
          label: "一般斜坐标基底",
          description: "e1=(3,1), e2=(1,3)",
        },
        {
          key: "degenerate",
          label: "基底共线退化",
          description: "e1与e2平行失效",
        },
      ],
    };
  }, []);

  // 切换模式时重置预设
  const handleModeChange = (mode: "linearCombo" | "collinear" | "basis") => {
    setStudyMode(mode);
    setPresetKey("free");
  };

  // 应用典型预设
  const handlePresetChange = (preset: string) => {
    setPresetKey(preset);
    if (preset === "free") return;

    if (studyMode === "linearCombo") {
      if (preset === "parallelogram") {
        setParams((p) => ({
          ...p,
          xa: 3,
          ya: 1,
          xb: 1,
          yb: 3,
          lambda: 1,
          mu: 1,
        }));
      } else if (preset === "subtraction") {
        setParams((p) => ({
          ...p,
          xa: 3,
          ya: 1,
          xb: 1,
          yb: 3,
          lambda: 1,
          mu: -1,
        }));
      } else if (preset === "scaleUp") {
        setParams((p) => ({
          ...p,
          xa: 2,
          ya: 1,
          xb: 1,
          yb: 2,
          lambda: 2,
          mu: 0.5,
        }));
      }
    } else if (studyMode === "collinear") {
      setLockCollinear(true);
      if (preset === "midpoint") {
        setParams((p) => ({
          ...p,
          xa: 3,
          ya: 1,
          xb: -1,
          yb: 3,
          xCoeff: 0.5,
          yCoeff: 0.5,
        }));
      } else if (preset === "trisection") {
        setParams((p) => ({
          ...p,
          xa: 3,
          ya: 1,
          xb: -1,
          yb: 3,
          xCoeff: 0.67,
          yCoeff: 0.33,
        }));
      } else if (preset === "extension") {
        setParams((p) => ({
          ...p,
          xa: 3,
          ya: 1,
          xb: -1,
          yb: 3,
          xCoeff: 1.5,
          yCoeff: -0.5,
        }));
      }
    } else if (studyMode === "basis") {
      if (preset === "orthogonal") {
        setParams((p) => ({ ...p, xa: 1, ya: 0, xb: 0, yb: 1, xv: 3, yv: 2 }));
      } else if (preset === "oblique") {
        setParams((p) => ({
          ...p,
          xa: 3,
          ya: 1,
          xb: 1,
          yb: 3,
          xv: 4,
          yv: 3.5,
        }));
      } else if (preset === "degenerate") {
        setParams((p) => ({ ...p, xa: 2, ya: 1, xb: 4, yb: 2, xv: 3, yv: 3 }));
      }
    }
  };

  // 数学计算结果
  const mathRes = useMemo(
    () => computeVectorLinear({ ...params, lockCollinear }),
    [params, lockCollinear],
  );

  // 看板数据
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-vector-linear", params, {
      studyMode,
      lockCollinear,
    });
  }, [params, studyMode, lockCollinear]);

  // 参数单项更新处理器（拖拽或滑块改变自动回归 free）
  const handleParamChange = (key: string, value: number) => {
    setPresetKey("free");
    setParams((prev) => {
      const next = { ...prev, [key]: value };
      // 若锁定 x+y=1，改变 xCoeff 联动改变 yCoeff
      if (lockCollinear && key === "xCoeff") {
        next.yCoeff = Math.round((1 - value) * 100) / 100;
      } else if (lockCollinear && key === "yCoeff") {
        next.xCoeff = Math.round((1 - value) * 100) / 100;
      }
      return next;
    });
  };

  // 参数批量原子更新处理器（画布直接拖拽动点时使用，保障数学严格同步）
  const handleBatchParamsChange = (updates: Record<string, number>) => {
    setPresetKey("free");
    setParams((prev) => ({ ...prev, ...updates }));
  };

  // 重置参数
  const handleReset = () => {
    setParams({ ...defaultParams });
    setPresetKey("free");
  };

  // 按研究模式过滤参数（核心参数置顶，底模参数在后；模式二锁定时裁剪从属参数）
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      linearCombo: ["lambda", "mu", "xa", "ya", "xb", "yb"],
      collinear: lockCollinear
        ? ["xCoeff", "xa", "ya", "xb", "yb"]
        : ["xCoeff", "yCoeff", "xa", "ya", "xb", "yb"],
      basis: ["xv", "yv", "xa", "ya", "xb", "yb"],
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
          importance: meta.importance,
          marks: meta.marks,
          group: meta.group,
        };
      });
  }, [params, studyMode, lockCollinear]);

  // 渲染顶端悬浮 LaTeX 表达式
  const equationLatex = useMemo(() => {
    if (studyMode === "linearCombo") {
      const lambdaStr = `\\color{#EF4444}{${params.lambda ?? 1}}\\vec{a}`;
      const muStr = `\\color{#D97706}{${params.mu ?? 1}}\\vec{b}`;
      return `\\vec{s} = ${lambdaStr} + ${muStr} = (${mathRes.sumVec.x.toFixed(
        1,
      )}, ${mathRes.sumVec.y.toFixed(1)})`;
    } else if (studyMode === "collinear") {
      const sumStr = mathRes.coeffSum.toFixed(2);
      return `\\vec{OC} = x\\vec{OA} + y\\vec{OB} \\quad (x+y = ${sumStr})`;
    } else {
      if (!mathRes.isBasisValid) {
        return `\\text{基底共线退化 } x_1 y_2 - x_2 y_1 = 0 \\quad (\\text{无法分解})`;
      }
      return `\\vec{v} = \\color{#EF4444}{${mathRes.lambda1.toFixed(
        2,
      )}}\\vec{e}_1 + \\color{#D97706}{${mathRes.lambda2.toFixed(
        2,
      )}}\\vec{e}_2`;
    }
  }, [studyMode, params, mathRes]);

  // 看板标题
  const panelTitle = useMemo(() => {
    if (studyMode === "linearCombo") return "向量加减与数乘看板";
    if (studyMode === "collinear") return "向量共线与三点共线看板";
    return "平面向量基本定理看板";
  }, [studyMode]);

  // 教学引导与探究问题（左屏专属，符合高中数学课标，不与右屏看板重复）
  const guidanceByMode = useMemo(() => {
    return {
      linearCombo: {
        condition: "基准向量 a, b 从同一起点 O 出发，标量 λ, μ ∈ [-3, 3]。",
        question:
          "调节 λ, μ 观察合成向量 s = λa + μb 的平行四边形对角线变化；思考差向量 d = a - b 为何始终从 B 点指向 A 点？",
      },
      collinear: {
        condition: "基准定点 O 与基准线 AB，动点 C 满足 OC = x·OA + y·OB。",
        question:
          "锁定 x+y=1 拖动点 C，观察其在线段 AB 内外滑动及分点比例；解除锁定观察偏离直线时 x+y 为何偏离 1？",
      },
      basis: {
        condition:
          "平面内任意两个不共线向量 {e₁, e₂} 构成一组基底，det(e₁, e₂) ≠ 0。",
        question:
          "任意拖拽目标向量 V，观察过 V 作两基底轴平行线所唯一确定的分解系数对 (λ₁, λ₂)；思考基底共线时为何无解？",
      },
    };
  }, []);

  const currentGuidance = guidanceByMode[studyMode];

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择 Section */}
          <LeftPanelSection
            title="核心专题模式"
            subtitle="选择平面向量研究切入点"
          >
            <SelectGrid
              items={[
                { key: "linearCombo", label: "加减与数乘" },
                { key: "collinear", label: "共线与三点共线" },
                { key: "basis", label: "平面向量基本定理", fullWidth: true },
              ]}
              value={studyMode}
              onChange={(k) =>
                handleModeChange(k as "linearCombo" | "collinear" | "basis")
              }
              variant="filled"
            />
          </LeftPanelSection>

          {/* 典型预设 2x2 网格 */}
          <LeftPanelSection
            title="典型构型预设"
            subtitle="一键切换典型高考探究场景"
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

          {/* 模式二锁定量配置 */}
          {studyMode === "collinear" && (
            <LeftPanelSection
              title="三点共线条件锁定"
              subtitle="验证 x + y = 1 是否落在直线 AB 上"
            >
              <SelectGrid
                items={[
                  { key: "lock", label: "锁定 x + y = 1 (直线 AB 上)" },
                  { key: "free", label: "自由滑动 (检验全平面)" },
                ]}
                value={lockCollinear ? "lock" : "free"}
                onChange={(k) => setLockCollinear(k === "lock")}
                variant="filled"
                color="success"
              />
            </LeftPanelSection>
          )}

          {/* 参数调节 Section */}
          <LeftPanelSection
            title="参数与坐标调节"
            subtitle="拖动滑块或画布控制点"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 教学引导与探究问题 (置于左屏底部辅助阅读区) */}
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
          {/* 实时公式悬浮卡片 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={equationLatex} mode="inline" />
          </div>

          {/* SVG Canvas 画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <VectorLinearScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              onBatchParamsChange={handleBatchParamsChange}
              fontScale={canvasSize.font}
              studyMode={studyMode}
              lockCollinear={lockCollinear}
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
