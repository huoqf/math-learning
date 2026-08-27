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

  // 是否处于三点共线严格锁定状态 (由预设决定，无需外挂多余开关)
  const isCollinearLocked =
    studyMode === "collinear" && presetKey !== "plane-free";

  // 典型预设定义
  const presetsByMode = useMemo(() => {
    return {
      linearCombo: [
        { key: "free", label: "自由探究", description: "全参数开放" },
        {
          key: "parallelogram",
          label: "平行四边形法则",
          formula: "\\vec{a} + \\vec{b}",
          description: "λ=1, μ=1 合成",
        },
        {
          key: "subtraction",
          label: "三角形减法法则",
          formula: "\\vec{a} - \\vec{b}",
          description: "λ=1, μ=-1 差向量",
        },
        {
          key: "scaleUp",
          label: "数乘伸缩倍数",
          formula: "2\\vec{a} + 0.5\\vec{b}",
          description: "λ=2, μ=0.5",
        },
      ],
      collinear: [
        {
          key: "collinear-line",
          label: "三点共线约束",
          formula: "x + y = 1",
          description: "单滑块内分外分",
        },
        {
          key: "midpoint",
          label: "线段 AB 中点",
          formula: "x = 0.5, y = 0.5",
          description: "中点向量公式",
        },
        {
          key: "trisection",
          label: "三等分内分点",
          formula: "x = \\frac{2}{3}, y = \\frac{1}{3}",
          description: "2:1 分点比",
        },
        {
          key: "plane-free",
          label: "全平面自由验证",
          formula: "x + y \\ne 1",
          description: "开放双滑块看偏离",
        },
      ],
      basis: [
        { key: "free", label: "自由探究", description: "全参数开放" },
        {
          key: "orthogonal",
          label: "标准正交基底",
          formula: "\\vec{e}_1 \\perp \\vec{e}_2",
          description: "笛卡尔坐标系",
        },
        {
          key: "oblique",
          label: "一般斜坐标基底",
          formula: "\\text{任意不共线}",
          description: "唯一分解定理",
        },
        {
          key: "degenerate",
          label: "基底共线退化",
          formula: "D = 0",
          description: "无法张成空间",
        },
      ],
    };
  }, []);

  // 切换模式时重置预设
  const handleModeChange = (mode: "linearCombo" | "collinear" | "basis") => {
    setStudyMode(mode);
    setPresetKey(mode === "collinear" ? "collinear-line" : "free");
  };

  // 应用典型预设
  const handlePresetChange = (preset: string) => {
    setPresetKey(preset);
    if (preset === "free") return;

    if (studyMode === "linearCombo") {
      if (preset === "parallelogram") {
        setParams((p) => ({ ...p, lambda: 1, mu: 1 }));
      } else if (preset === "subtraction") {
        setParams((p) => ({ ...p, lambda: 1, mu: -1 }));
      } else if (preset === "scaleUp") {
        setParams((p) => ({ ...p, lambda: 2, mu: 0.5 }));
      }
    } else if (studyMode === "collinear") {
      if (preset === "collinear-line") {
        setParams((p) => ({ ...p, xCoeff: 0.4, yCoeff: 0.6 }));
      } else if (preset === "midpoint") {
        setParams((p) => ({ ...p, xCoeff: 0.5, yCoeff: 0.5 }));
      } else if (preset === "trisection") {
        setParams((p) => ({ ...p, xCoeff: 0.67, yCoeff: 0.33 }));
      } else if (preset === "plane-free") {
        setParams((p) => ({ ...p, xCoeff: 0.8, yCoeff: 0.8 }));
      }
    } else if (studyMode === "basis") {
      if (preset === "orthogonal") {
        setParams((p) => ({ ...p, xa: 3, ya: 0, xb: 0, yb: 3, xv: 3, yv: 2 }));
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
    () => computeVectorLinear({ ...params, lockCollinear: isCollinearLocked }),
    [params, isCollinearLocked],
  );

  // 看板数据
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-vector-linear", params, {
      studyMode,
      lockCollinear: isCollinearLocked,
    });
  }, [params, studyMode, isCollinearLocked]);

  // 参数单项更新处理器
  const handleParamChange = useCallback(
    (key: string, value: number) => {
      setParams((prev) => {
        const next = { ...prev, [key]: value };
        if (isCollinearLocked && key === "xCoeff") {
          next.yCoeff = Math.round((1 - value) * 100) / 100;
        } else if (isCollinearLocked && key === "yCoeff") {
          next.xCoeff = Math.round((1 - value) * 100) / 100;
        }
        return next;
      });
    },
    [isCollinearLocked],
  );

  // 参数批量原子更新处理器（画布直接拖拽动点时使用，自动切回自由模式）
  const handleBatchParamsChange = useCallback(
    (updates: Record<string, number>) => {
      if (presetKey !== "free" && presetKey !== "collinear-line") {
        setPresetKey(studyMode === "collinear" ? "collinear-line" : "free");
      }
      setParams((prev) => ({ ...prev, ...updates }));
    },
    [presetKey, studyMode],
  );

  // 重置参数
  const handleReset = () => {
    setParams({ ...defaultParams });
    setPresetKey(studyMode === "collinear" ? "collinear-line" : "free");
  };

  // 按研究模式过滤参数并实现真正降维
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    let activeKeys: string[] = [];

    if (studyMode === "linearCombo") {
      if (presetKey === "parallelogram" || presetKey === "subtraction") {
        activeKeys = ["xa", "ya", "xb", "yb"];
      } else {
        activeKeys = ["lambda", "mu", "xa", "ya", "xb", "yb"];
      }
    } else if (studyMode === "collinear") {
      if (isCollinearLocked) {
        // 锁定 x+y=1：仅需一个 xCoeff 分点滑块，实现极致降维
        activeKeys = ["xCoeff", "xa", "ya", "xb", "yb"];
      } else {
        // 全平面自由：开放两个滑块
        activeKeys = ["xCoeff", "yCoeff", "xa", "ya", "xb", "yb"];
      }
    } else {
      activeKeys = ["xv", "yv", "xa", "ya", "xb", "yb"];
    }

    return activeKeys
      .filter((key) => key in paramMeta)
      .map((key) => {
        const meta = paramMeta[key];
        return {
          key,
          label:
            isCollinearLocked && key === "xCoeff"
              ? "共线分点系数 x (y=1-x)"
              : meta.label,
          labelFormula: meta.labelFormula,
          value: params[key] ?? meta.defaultValue ?? 0,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 0.1,
          description:
            isCollinearLocked && key === "xCoeff"
              ? "0~1为内分点，0.5为中点，<0或>1为外分点"
              : meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
          group: meta.group,
        };
      });
  }, [params, studyMode, presetKey, isCollinearLocked]);

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
        return `\\text{基底共线退化 } x_1 y_2 - x_2 y_1 = 0 \\quad (\\text{无法张成基底})`;
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
    if (studyMode === "collinear") return "三点共线与分点定理看板";
    return "平面向量基本定理看板";
  }, [studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择 Section */}
          <LeftPanelSection
            title="探究专题模式"
            subtitle="选择平面向量研究切入点"
          >
            <SelectGrid
              items={[
                { key: "linearCombo", label: "加减与数乘运算" },
                { key: "collinear", label: "三点共线与分点定理" },
                { key: "basis", label: "平面向量基本定理", fullWidth: true },
              ]}
              value={studyMode}
              onChange={(k) =>
                handleModeChange(k as "linearCombo" | "collinear" | "basis")
              }
              variant="filled"
            />
          </LeftPanelSection>

          {/* 典型预设 (实现参数降维) */}
          <LeftPanelSection
            title="典型构型预设"
            subtitle="一键切换高考经典探究场景"
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

          {/* 教学引导与探究问题 (规范排版，接入 KatexFormula) */}
          <LeftPanelSection
            title="教学探究引导"
            subtitle="带着核心问题动手实验"
          >
            <div className="bg-neutral-50/90 border border-neutral-200/80 rounded-lg p-2.5 text-xs space-y-2 text-neutral-600 leading-relaxed">
              {studyMode === "linearCombo" && (
                <>
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【基础条件】：
                    </span>
                    基准向量{" "}
                    <KatexFormula formula="\vec{a}, \vec{b}" mode="inline" />{" "}
                    共起点 O，标量{" "}
                    <KatexFormula
                      formula="\lambda, \mu \in [-3, 3]"
                      mode="inline"
                    />
                    。
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【探究问题】：
                    </span>
                    调节 <KatexFormula formula="\lambda, \mu" mode="inline" />{" "}
                    观察合成向量{" "}
                    <KatexFormula
                      formula="\vec{s} = \lambda\vec{a} + \mu\vec{b}"
                      mode="inline"
                    />{" "}
                    的对角线变化；思考差向量{" "}
                    <KatexFormula
                      formula="\vec{d} = \vec{a} - \vec{b}"
                      mode="inline"
                    />{" "}
                    为何始终从 B 点指向 A 点？
                  </div>
                </>
              )}
              {studyMode === "collinear" && (
                <>
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【基础条件】：
                    </span>
                    点 <KatexFormula formula="C" mode="inline" /> 满足{" "}
                    <KatexFormula
                      formula="\vec{OC} = x\vec{OA} + y\vec{OB}"
                      mode="inline"
                    />
                    。
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【探究问题】：
                    </span>
                    滑动系数 <KatexFormula formula="x" mode="inline" />
                    ，观察点 <KatexFormula
                      formula="C"
                      mode="inline"
                    /> 在线段 <KatexFormula formula="AB" mode="inline" />{" "}
                    内外的分点比例；切换到“全平面自由验证”观察偏离直线时{" "}
                    <KatexFormula formula="x+y" mode="inline" /> 为何不再等于
                    1？
                  </div>
                </>
              )}
              {studyMode === "basis" && (
                <>
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【基础条件】：
                    </span>
                    不共线向量{" "}
                    <KatexFormula
                      formula="\{\vec{e}_1, \vec{e}_2\}"
                      mode="inline"
                    />{" "}
                    构成一组基底，
                    <KatexFormula
                      formula="\det(\vec{e}_1, \vec{e}_2) \neq 0"
                      mode="inline"
                    />
                    。
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【探究问题】：
                    </span>
                    拖拽目标向量{" "}
                    <KatexFormula formula="\vec{v}" mode="inline" />
                    ，观察过 <KatexFormula
                      formula="\vec{v}"
                      mode="inline"
                    />{" "}
                    作两基底平行线所唯一确定的分解系数对{" "}
                    <KatexFormula
                      formula="(\lambda_1, \lambda_2)"
                      mode="inline"
                    />
                    ；基底共线时为何无解？
                  </div>
                </>
              )}
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
              lockCollinear={isCollinearLocked}
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
