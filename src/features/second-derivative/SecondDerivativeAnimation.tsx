/**
 * src/features/second-derivative/SecondDerivativeAnimation.tsx
 * 二阶导数、拐点与函数凹凸性交互实验室主编排组件
 */

import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  TabSwitcher,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { SceneLegend } from "@/components/Math";
import type { SceneLegendItem } from "@/components/Math";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/secondDerivative";
import { SecondDerivativeScene } from "./components/SecondDerivativeScene";
import { evalFunction, evalJensen, type FnKey } from "@/math/secondDerivative";

import { getSecondDerivativeLegendItems } from "./constants";

export function SecondDerivativeAnimation() {
  // 1. 探究模式：'concavity' | 'inflection' | 'jensen'
  const [studyMode, setStudyMode] = useState<
    "concavity" | "inflection" | "jensen"
  >("concavity");

  // 2. 函数模型选择：'cubic' | 'mixed' | 'quartic'
  const [fnKey, setFnKey] = useState<FnKey>("cubic");

  // 切换 studyMode
  const handleStudyModeChange = (
    mode: "concavity" | "inflection" | "jensen",
  ) => {
    setStudyMode(mode);
    if (mode === "concavity") {
      setParams((prev) => ({ ...prev, x0: 1.0 }));
    } else if (mode === "jensen") {
      setParams((prev) => ({ ...prev, x1: -1.5, x2: 1.5 }));
    }
  };

  // 3. 参数状态
  const [params, setParams] = useState(() => ({
    a: defaultParams.a,
    b: defaultParams.b,
    c: defaultParams.c,
    d: defaultParams.d,
    x0: defaultParams.x0,
    x1: defaultParams.x1,
    x2: defaultParams.x2,
  }));

  // 4. 视口测量 hook
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 5. 场景比例尺
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 6. 数学量看板数据组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-derivative-inflection", params, {
      studyMode,
      fnKey,
    });
  }, [params, studyMode, fnKey]);

  // 7. 参数改变处理器
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 重置参数
  const handleReset = () => {
    setParams({
      ...defaultParams,
    });
  };

  // 8. 声明式参数配置按当前研究模式与函数模型过滤
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    // 根据 fnKey 过滤有效系数参数
    let allowedKeys = ["a", "b", "c", "d"];
    if (fnKey === "cubic") {
      allowedKeys = ["a", "b", "c", "d"];
    } else if (fnKey === "mixed") {
      allowedKeys = ["a", "b", "c"];
    } else {
      allowedKeys = ["a", "b", "c", "d"];
    }

    // 根据 studyMode 决定包含的探针参数
    if (studyMode === "concavity") {
      allowedKeys.push("x0");
    } else if (studyMode === "jensen") {
      allowedKeys.push("x1", "x2");
    }

    return allowedKeys
      .filter((key) => key in paramMeta)
      .map((key) => {
        const meta = paramMeta[key];
        return {
          key,
          label: meta.label,
          labelFormula: meta.labelFormula,
          value: params[key as keyof typeof params] ?? meta.defaultValue ?? 0,
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
  }, [params, studyMode, fnKey]);

  // 9. 拼装顶端悬浮 LaTeX 动态公式（严格色彩 Token 绑定与模式自适应）
  const topFormulaLatex = useMemo(() => {
    const { a, b, c, d, x0, x1, x2 } = params;

    const buildTerm = (
      val: number,
      varStr: string,
      isFirst: boolean,
      colorHex?: string,
    ) => {
      if (Math.abs(val) < 1e-6) return "";
      const sign = val > 0 ? (isFirst ? "" : " + ") : isFirst ? "-" : " - ";
      const absVal = Math.abs(val);
      let termBody = "";
      if (varStr === "") {
        // 常数项
        const numStr = absVal.toFixed(1);
        termBody = colorHex ? `\\color{${colorHex}}{${numStr}}` : numStr;
      } else if (Math.abs(absVal - 1) < 1e-6) {
        // 系数绝对值为 1
        termBody = colorHex ? `\\color{${colorHex}}{${varStr}}` : varStr;
      } else {
        const numStr = absVal.toFixed(1);
        termBody = colorHex
          ? `\\color{${colorHex}}{${numStr}}${varStr}`
          : `${numStr}${varStr}`;
      }
      return `${sign}${termBody}`;
    };

    let fStr = "";
    if (fnKey === "cubic") {
      const termA = buildTerm(a, "x^3", true, MATH_COLORS.paramPrimary);
      const termB = buildTerm(
        b,
        "x^2",
        termA === "",
        MATH_COLORS.paramSecondary,
      );
      const termC = buildTerm(
        c,
        "x",
        termA === "" && termB === "",
        MATH_COLORS.paramTertiary,
      );
      const termD = buildTerm(
        d,
        "",
        termA === "" && termB === "" && termC === "",
      );
      const poly = termA + termB + termC + termD || "0";
      fStr = `f(x) = ${poly}`;
    } else if (fnKey === "mixed") {
      const termA = buildTerm(a, "x e^x", true, MATH_COLORS.paramPrimary);
      const termB = buildTerm(b, "x", termA === "", MATH_COLORS.paramSecondary);
      const termC = buildTerm(
        c,
        "",
        termA === "" && termB === "",
        MATH_COLORS.paramTertiary,
      );
      const poly = termA + termB + termC || "0";
      fStr = `f(x) = ${poly}`;
    } else {
      const termA = buildTerm(a, "x^4", true, MATH_COLORS.paramPrimary);
      const termB = buildTerm(
        b,
        "x^2",
        termA === "",
        MATH_COLORS.paramSecondary,
      );
      const termC = buildTerm(
        c,
        "x",
        termA === "" && termB === "",
        MATH_COLORS.paramTertiary,
      );
      const termD = buildTerm(
        d,
        "",
        termA === "" && termB === "" && termC === "",
      );
      const poly = termA + termB + termC + termD || "0";
      fStr = `f(x) = ${poly}`;
    }

    if (studyMode === "concavity") {
      const eval0 = evalFunction(fnKey, params, x0);
      const dfStr = `f'(\\color{${MATH_COLORS.paramPrimary}}{${x0.toFixed(1)}}) = ${eval0.dy.toFixed(2)}`;
      const ddfStr = `f''(\\color{${MATH_COLORS.paramPrimary}}{${x0.toFixed(1)}}) = ${eval0.ddy.toFixed(2)}`;
      let statusStr = "";
      if (eval0.ddy > 1e-4) {
        statusStr = "\\implies \\text{下凸 (切线在下方)}"; // latex: 动态公式
      } else if (eval0.ddy < -1e-4) {
        statusStr = "\\implies \\text{上凸 (切线在上方)}"; // latex: 动态公式
      } else {
        statusStr = "\\implies \\text{二阶导为0 (拐点临界)}"; // latex: 动态公式
      }
      return `${fStr} \\quad | \\quad ${dfStr}, \\, ${ddfStr} \\quad ${statusStr}`;
    } else if (studyMode === "inflection") {
      if (fnKey === "cubic") {
        if (Math.abs(a) > 1e-6) {
          const xInf = -b / (3 * a);
          const yInf = evalFunction(fnKey, params, xInf).y;
          return `${fStr} \\quad | \\quad \\text{拐点/对称中心 } I(${xInf.toFixed(2)}, ${yInf.toFixed(2)})`; // latex: 动态公式
        }
        return `${fStr} \\quad | \\quad a=0 \\text{ (退化为二次，无拐点)}`; // latex: 动态公式
      } else if (fnKey === "mixed") {
        if (Math.abs(a) > 1e-6) {
          const yInf = evalFunction(fnKey, params, -2).y;
          return `${fStr} \\quad | \\quad f''(x) = a(x+2)e^x \\implies \\text{拐点 } I(-2.00, ${yInf.toFixed(2)})`; // latex: 动态公式
        }
        return `${fStr} \\quad | \\quad a=0 \\text{ (退化为一次，无拐点)}`; // latex: 动态公式
      } else {
        // quartic: 12ax^2 + 2b = 0 => x^2 = -b / (6a)
        if (Math.abs(a) > 1e-6) {
          const val = -b / (6 * a);
          if (val > 1e-5) {
            const xInf = Math.sqrt(val);
            const yInf = evalFunction(fnKey, params, xInf).y;
            return `${fStr} \\quad | \\quad \\text{双拐点 } x_{\\text{inf}} = \\pm ${xInf.toFixed(2)} \\; (y=${yInf.toFixed(2)})`; // latex: 动态公式
          } else if (Math.abs(b) < 1e-5) {
            return `${fStr} \\quad | \\quad b=0 \\implies f''(0)=0 \\text{ (极小值点，非拐点反例)}`; // latex: 动态公式
          } else if (a > 0) {
            return `${fStr} \\quad | \\quad f''(x) > 0 \\text{ 恒成立 (全域下凸，无拐点)}`; // latex: 动态公式
          } else {
            return `${fStr} \\quad | \\quad f''(x) < 0 \\text{ 恒成立 (全域上凸，无拐点)}`; // latex: 动态公式
          }
        }
        return `${fStr} \\quad | \\quad a=0 \\text{ (退化为二次，无拐点)}`; // latex: 动态公式
      }
    } else {
      const jensen = evalJensen(fnKey, params, x1, x2);
      const sign = jensen.diff >= 0 ? "\\ge" : "<";
      const relationStr =
        jensen.diff >= 0
          ? "\\text{ (弦在弧上方/下凸)}" // latex: 动态公式
          : "\\text{ (弧在弦上方/上凸)}"; // latex: 动态公式
      return `${fStr} \\quad | \\quad \\frac{f(x_1)+f(x_2)}{2} ${sign} f\\left(\\frac{x_1+x_2}{2}\\right) \\; (\\Delta y = ${jensen.diff.toFixed(2)}) \\quad ${relationStr}`;
    }
  }, [params, fnKey, studyMode]);

  // 教学导引与题设背景配置（深度联动研究模式 studyMode 与函数模型 fnKey，说透题设条件与核心设问）
  const tipConfig = useMemo(() => {
    if (studyMode === "concavity") {
      if (fnKey === "cubic") {
        return {
          variant: "primary" as const,
          badge: "高考大招 · 三次曲线凹凸性与切线放缩",
          condition:
            "三次多项式 $f(x) = ax^3 + bx^2 + cx + d$，探针切点位于 $x_0$ 处，二阶导为 $f''(x) = 6ax + 2b$。",
          question:
            "探究二阶导数 $f''(x_0)$ 符号与切线相对位置：下凸时切线为何恒在曲线下方？上凸时切线为何恒在曲线上方？",
        };
      }
      if (fnKey === "mixed") {
        return {
          variant: "primary" as const,
          badge: "高考压轴 · 超越混合函数凹凸性与局部放缩",
          condition:
            "超越函数 $f(x) = axe^x + bx + c$，一阶导为 $f'(x) = a(x+1)e^x + b$，二阶导为 $f''(x) = a(x+2)e^x$。",
          question:
            "移动探针 $x_0$，观察 $x > -2$ 与 $x < -2$ 两侧凹凸性转换，探究切线放缩法证明不等式的几何充要条件。",
        };
      }
      return {
        variant: "primary" as const,
        badge: "高考难点 · 四次对称曲线的分区凹凸性",
        condition:
          "四次函数 $f(x) = ax^4 + bx^2 + cx + d$，二阶导数为二次式 $f''(x) = 12ax^2 + 2b$。",
        question:
          "调节参数 $b$，观察双拐点将定义域分为三个凹凸区间的几何特征，辨析切线与曲线的局部穿插与整体上下关系。",
      };
    }

    if (studyMode === "inflection") {
      if (fnKey === "cubic") {
        return {
          variant: "warning" as const,
          badge: "高考秒杀 · 三次函数中心对称与极值中点",
          condition:
            "三次曲线具有唯一二阶导变号拐点 $x_{\\text{inf}} = -\\frac{b}{3a}$，且当 $\\Delta > 0$ 时存在两极值点 $x_1, x_2$。",
          question:
            "验证拐点为何必然是三次函数的中心对称点？拐点与两极值点满足怎样的中点关系（$x_{\\text{inf}} = \\frac{x_1+x_2}{2}$）？",
        };
      }
      if (fnKey === "mixed") {
        return {
          variant: "warning" as const,
          badge: "概念辨析 · 超越函数极值点与拐点分离",
          condition:
            "函数 $f(x) = axe^x + bx + c$。一阶导驻点决定单调性与极值，二阶导变号点 $x=-2$ 决定凹凸性与拐点。",
          question:
            "当 $b=0$ 时极值点在 $x=-1$，而拐点在 $x=-2$。探究极值点与拐点在定义域中的分离现象与几何本质。",
        };
      }
      return {
        variant: "warning" as const,
        badge: "易错警示 · 二阶导为零的充要性反例",
        condition:
          "高次函数 $f(x) = ax^4 + bx^2 + cx + d$。当 $b=0$ 时，在原点处 $f''(0) = 0$。",
        question:
          "导数 $f''(x_0)=0$ 为何不是拐点的充分条件？为何 $f(x)=x^4$ 在原点二阶导为 0 却是极小值点而非拐点？",
      };
    }

    // jensen 模式
    if (fnKey === "cubic") {
      return {
        variant: "info" as const,
        badge: "高考压轴 · 割线中点与弧中点（琴生不等式）",
        condition:
          "在三次曲线上选取相异自变量 $x_1, x_2$，考察割线中点 $M$ 与对应弧中点 $P$ 的纵坐标差值。",
        question:
          "在下凸区间内比较弦与弧的中点高低；当区间 $[x_1, x_2]$ 跨越拐点时，探究琴生不等式前提为何失效？",
      };
    }
    if (fnKey === "mixed") {
      return {
        variant: "info" as const,
        badge: "极值点偏移 · 超越函数割弧中点不等式",
        condition:
          "在超越函数单侧下凸区间（$x > -2$）内选取两端点 $x_1, x_2$，割线中点为 $M$，曲线上中点为 $P$。",
        question:
          "探究琴生差值 $\\Delta y = \\frac{f(x_1)+f(x_2)}{2} - f\\left(\\frac{x_1+x_2}{2}\\right) \\ge 0$ 在新高考极值点偏移大题中的降维应用。",
      };
    }
    return {
      variant: "info" as const,
      badge: "双变量不等式 · 对称双峰与凹凸割线判定",
      condition:
        "在四次曲线不同凹凸区间内选取两点 $x_1, x_2$，连结割线段 $S_1S_2$。",
      question:
        "比较下凸区间（弦在弧上）与上凸区间（弧在弦上）的中点差值正负号，探究凹凸性对不等式方向的决定性作用。",
    };
  }, [studyMode, fnKey]);

  // 右下角图例配置 (模式专属，严格使用 MATH_COLORS)
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    return getSecondDerivativeLegendItems(studyMode);
  }, [studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 研究模式切换 Section */}
          <LeftPanelSection title="研究模式">
            <TabSwitcher
              tabs={[
                { key: "concavity", label: "凹凸性与切线" },
                { key: "inflection", label: "拐点与极值点" },
                { key: "jensen", label: "琴生不等式" },
              ]}
              value={studyMode}
              onChange={(k) => handleStudyModeChange(k as typeof studyMode)}
            />
          </LeftPanelSection>

          {/* 函数模型选择 Section */}
          <LeftPanelSection title="函数模型">
            <SelectGrid
              columns={2}
              items={[
                {
                  key: "cubic",
                  label: "三次多项式模型",
                },
                {
                  key: "mixed",
                  label: "指数乘积复合型",
                },
                {
                  key: "quartic",
                  label: "四次双峰/对称型",
                  fullWidth: true,
                },
              ]}
              value={fnKey}
              onChange={(k) => setFnKey(k as FnKey)}
              variant="filled"
            />
          </LeftPanelSection>

          {/* 参数调节 Section */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 教学导引与题设背景 */}
          <TipCard
            variant={tipConfig.variant}
            badge={tipConfig.badge}
            condition={tipConfig.condition}
            question={tipConfig.question}
          />
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 顶端悬浮 KaTeX 动态公式 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={topFormulaLatex} mode="inline" />
          </div>

          {/* 右下角图例 */}
          <SceneLegend items={legendItems} />

          {/* SVG 自适应画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <SecondDerivativeScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              studyMode={studyMode}
              fnKey={fnKey}
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
          title="二阶导数与拐点看板"
        />
      }
    />
  );
}
