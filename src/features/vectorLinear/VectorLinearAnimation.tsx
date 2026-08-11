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

  // 参数更新处理器
  const handleParamChange = (key: string, value: number) => {
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

  // 重置参数
  const handleReset = () => {
    setParams({ ...defaultParams });
  };

  // 按研究模式过滤参数
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      linearCombo: ["xa", "ya", "xb", "yb", "lambda", "mu"],
      collinear: ["xa", "ya", "xb", "yb", "xCoeff", "yCoeff"],
      basis: ["xa", "ya", "xb", "yb", "xv", "yv"],
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
        return `\\text{基底共线 } x_1 y_2 - x_2 y_1 = 0 \\quad (\\text{无法分解})`;
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
              onChange={(k) => setStudyMode(k as any)}
              variant="filled"
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
