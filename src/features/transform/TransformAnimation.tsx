import { useState, useMemo } from "react";
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
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS, withAlpha } from "@/theme";
import { TransformScene } from "./components/TransformScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/transform";
import {
  buildTransformLatex,
  type BaseFnType,
  type FoldMode,
} from "@/math/transform";

export function TransformAnimation() {
  const [params, setParams] = useState(() => ({ ...defaultParams }));
  const [fnType, setFnType] = useState<BaseFnType>("quadratic");
  const [foldMode, setFoldMode] = useState<FoldMode>("none");

  // Step 1: 自适应视口
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // Step 2: 比例尺
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // Step 3: 右屏数学数据组装
  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-func-transform", params, { fnType, foldMode }),
    [params, fnType, foldMode],
  );

  // 严格标准消元与色彩绑定的 KaTeX 公式
  const formulaLatex = useMemo(() => {
    return buildTransformLatex(
      fnType,
      {
        h: params.h ?? 1.0,
        k: params.k ?? 0.5,
        A: params.A ?? 1.5,
        omega: params.omega ?? 1.0,
        foldMode,
      },
      {
        colorPrimary: MATH_COLORS.paramPrimary,
        colorSecondary: MATH_COLORS.paramSecondary,
      },
    );
  }, [fnType, foldMode, params]);

  // Step 4: 声明式参数配置 (按水平与竖直对象化分组)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    return Object.keys(paramMeta).map((key) => {
      const meta = paramMeta[key];
      return {
        key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        value: params[key] ?? meta.defaultValue ?? 0,
        min: meta.min,
        max: meta.max,
        step: meta.step ?? 0.1,
        group: meta.group,
        description: meta.description,
        descriptionFormula: meta.descriptionFormula,
        importance: meta.importance,
        marks: meta.marks,
      };
    });
  }, [params]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  // 中屏右下角图例卡片
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    const baseNames: Record<BaseFnType, string> = {
      quadratic: "y = x^2",
      log: "y = \\log_2 x",
      sine: "y = \\sin x",
      cubic: "y = x^3",
      exp: "y = 2^x",
    };

    return [
      {
        label: `母函数 ${baseNames[fnType]}`,
        color: withAlpha(MATH_COLORS.function, 0.6),
        style: "dash",
      },
      {
        label: "目标图象 y = T[f](x)",
        color: MATH_COLORS.paramPrimary,
        style: "solid",
      },
      {
        label: "特征点迁移轨迹",
        color: withAlpha(MATH_COLORS.paramSecondary, 0.8),
        style: "dot",
      },
    ];
  }, [fnType]);

  // 动态教学提示 (落实初始条件+核心高考设问，杜绝空泛词，随母函数与翻折模式全动态联动)
  const tipContent = useMemo(() => {
    const { h, k, A, omega } = params;

    if (foldMode === "global") {
      return {
        variant: "warning" as const,
        badge: "整体绝对值翻折变换",
        conditionNode: (
          <span>
            目标函数由基准图象经整体绝对值变换得到{" "}
            <KatexFormula formula={formulaLatex} mode="inline" />。
          </span>
        ),
        questionNode: (
          <span>
            (1) 求解图象与 <KatexFormula formula="x" mode="inline" />{" "}
            轴交点及不可导尖点坐标；(2) 探究方程{" "}
            <KatexFormula formula="|f(x)| = m" mode="inline" />{" "}
            实根个数的分类讨论分界点。
          </span>
        ),
      };
    }

    if (foldMode === "input") {
      return {
        variant: "info" as const,
        badge: "自变量绝对值翻折变换",
        conditionNode: (
          <span>
            目标函数由基准图象经自变量绝对值变换得到{" "}
            <KatexFormula formula={formulaLatex} mode="inline" />。
          </span>
        ),
        questionNode: (
          <span>
            (1) 验证偶函数性质{" "}
            <KatexFormula formula="f(|-x|) = f(|x|)" mode="inline" /> 及对称轴{" "}
            <KatexFormula formula="x = 0" mode="inline" />
            ；(2) 求解函数在区间{" "}
            <KatexFormula formula="[-3, 3]" mode="inline" /> 上的最值与极值点。
          </span>
        ),
      };
    }

    const hDesc =
      h >= 0 ? `右移 ${h.toFixed(1)}` : `左移 ${Math.abs(h).toFixed(1)}`;
    const kDesc =
      k >= 0 ? `上移 ${k.toFixed(1)}` : `下移 ${Math.abs(k).toFixed(1)}`;

    if (fnType === "log") {
      return {
        variant: "primary" as const,
        badge: "对数函数图象变换",
        conditionNode: (
          <span>
            基准对数函数经历水平位移 ({hDesc})、竖直位移 ({kDesc})，横缩{" "}
            <KatexFormula
              formula={`\\omega = ${omega.toFixed(1)}`}
              mode="inline"
            />
            ，纵缩{" "}
            <KatexFormula formula={`A = ${A.toFixed(1)}`} mode="inline" />。
          </span>
        ),
        questionNode: (
          <span>
            (1) 求解变换后对数函数的定义域与铅垂渐近线方程；(2) 探究定点{" "}
            <KatexFormula formula="P_0(1, 0)" mode="inline" /> 迁移后的新坐标。
          </span>
        ),
      };
    }

    if (fnType === "sine") {
      return {
        variant: "primary" as const,
        badge: "正弦型函数图象变换",
        conditionNode: (
          <span>
            正弦母函数经历周期横向缩放{" "}
            <KatexFormula
              formula={`\\omega = ${omega.toFixed(1)}`}
              mode="inline"
            />
            、振幅纵缩{" "}
            <KatexFormula formula={`A = ${A.toFixed(1)}`} mode="inline" />{" "}
            及双向平移 ({hDesc}, {kDesc})。
          </span>
        ),
        questionNode: (
          <span>
            (1) 求解目标函数的最小正周期{" "}
            <KatexFormula formula="T" mode="inline" /> 与值域；(2)
            写出“先移后缩”与“先缩后移”公因式提法的严格推导式。
          </span>
        ),
      };
    }

    if (fnType === "exp") {
      return {
        variant: "primary" as const,
        badge: "指数函数图象变换",
        conditionNode: (
          <span>
            基准指数函数经历水平位移 ({hDesc})、竖直位移 ({kDesc})，纵缩{" "}
            <KatexFormula formula={`A = ${A.toFixed(1)}`} mode="inline" />。
          </span>
        ),
        questionNode: (
          <span>
            (1) 求解变换后指数函数的水平渐近线方程与必过定点；(2)
            探究单调性随参数 <KatexFormula formula="A" mode="inline" />{" "}
            符号的镜像反转。
          </span>
        ),
      };
    }

    return {
      variant: "primary" as const,
      badge: "幂函数/多项式图象变换",
      conditionNode: (
        <span>
          基准母函数经历水平平移 ({hDesc})、竖直平移 ({kDesc})，横向伸缩{" "}
          <KatexFormula
            formula={`\\omega = ${omega.toFixed(1)}`}
            mode="inline"
          />
          ，纵向伸缩{" "}
          <KatexFormula formula={`A = ${A.toFixed(1)}`} mode="inline" />。
        </span>
      ),
      questionNode: (
        <span>
          (1) 求解变换后曲线的对称中心/顶点坐标；(2)
          对比并验证先平移后伸缩与先伸缩后平移两类路径的自变量代换等价性。
        </span>
      ),
    };
  }, [fnType, foldMode, formulaLatex, params]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 母函数模型选择 */}
          <LeftPanelSection title="基准母函数">
            <SelectGrid
              items={[
                { key: "quadratic", formula: "y = x^2" },
                { key: "log", formula: "y = \\log_2 x" },
                { key: "sine", formula: "y = \\sin x" },
                { key: "exp", formula: "y = 2^x" },
                { key: "cubic", formula: "y = x^3" },
              ]}
              value={fnType}
              onChange={(k) => setFnType(k as BaseFnType)}
              variant="outline"
              columns={2}
            />
          </LeftPanelSection>

          {/* 绝对值翻折模式 */}
          <LeftPanelSection title="绝对值翻折">
            <SelectGrid
              items={[
                { key: "none", formula: "\\text{无翻折}" },
                { key: "global", formula: "y = |f(x)|" },
                { key: "input", formula: "y = f(|x|)" },
              ]}
              value={foldMode}
              onChange={(k) => setFoldMode(k as FoldMode)}
              variant="outline"
              columns={3}
            />
          </LeftPanelSection>

          {/* 参数调节 */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() => setParams({ ...defaultParams })}
            />
          </LeftPanelSection>

          {/* 教学导引 */}
          <LeftPanelSection title="教学导引" compact>
            <TipCard
              variant={tipContent.variant}
              badge={tipContent.badge}
              condition={tipContent.conditionNode}
              question={tipContent.questionNode}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* Katex 公式浮标：精简消元与三位一体色彩绑定 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3.5 py-2 shadow-sm">
            <KatexFormula formula={formulaLatex} mode="inline" />
          </div>

          {/* 中屏右下角图例 */}
          <SceneLegend items={legendItems} />

          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <TransformScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              fnType={fnType}
              foldMode={foldMode}
            />
          </AnimationSvgCanvas>
        </div>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          reasoningSteps={mathData.reasoningSteps}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title="图象变换看板"
        />
      }
    />
  );
}
