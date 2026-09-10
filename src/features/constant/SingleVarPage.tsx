import { useState, useMemo, useCallback } from "react";
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
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import { useAnimationViewport, useSceneScale, useScenario } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/constant";
import type { TransModelKey } from "@/math/constant";
import type { ScenarioSpec } from "@/types/scenario";
import { SingleVarScene } from "./components/SingleVarScene";

export function SingleVarPage() {
  const [funModel, setFunModel] = useState<"transcendent" | "quadratic">(
    "transcendent",
  );
  const [transModel, setTransModel] = useState<TransModelKey>("ln_x_over_x");
  const [subMode, setSubMode] = useState<"sep" | "direct">("sep");
  const [logic, setLogic] = useState<"always" | "exist">("always");
  const [presetKey, setPresetKey] = useState<string>("free");
  const [showDerivative, setShowDerivative] = useState<boolean>(false);
  const [showTangent, setShowTangent] = useState<boolean>(false);

  const [params, setParams] = useState<Record<string, number>>(() => ({
    a: defaultParams.a,
    a_axis: defaultParams.a_axis,
    m: defaultParams.m,
    n: defaultParams.n,
  }));

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const scale = useSceneScale({ vp, xRange: [-2, 6], yRange: [-1, 5.5] });

  // 1. 统一场景模型规格声明 (ScenarioSpec DSL)
  // 根据解题方法 (subMode: 参变分离 vs 直接讨论) 与 函数模型 (funModel) 自适应组织典型预设
  const scenarios = useMemo<Record<string, ScenarioSpec>>(() => {
    const isAlways = logic === "always";
    const map: Record<string, ScenarioSpec> = {};

    if (subMode === "sep") {
      // 参变分离法场景体系 (研究目标为水平直线 y = a 与 函数最值的空间相对位置)
      if (funModel === "transcendent") {
        let fnName = "\\frac{\\ln x}{x}";
        if (transModel === "exp_minus_ax") fnName = "\\frac{e^x}{x}";
        else if (transModel === "a_ln_x_minus_x") fnName = "\\ln x - x + 1";
        else if (transModel === "exp_minus_a_x_plus_1")
          fnName = "\\frac{e^x}{x+1}";

        map.free = {
          id: "free",
          name: "自由探究",
          badge: isAlways
            ? "参变分离 · 超越函数恒成立"
            : "参变分离 · 超越函数存在性",
          condition: `已知超越函数 $f(x) = ${fnName}$，采用【参变分离法】将未知参数 $a$ 孤立，研究区间为 $[m, n]$。`,
          question: isAlways
            ? `求实数参数 $a$ 的取值范围，使得不等式 $f(x) \\ge a$ 在区间上对任意 $x$ 恒成立（$a \\le f(x)_{\\min}$）。`
            : `求实数参数 $a$ 的取值范围，使得不等式 $f(x) \\ge a$ 在区间内存在实数解（$a \\le f(x)_{\\max}$）。`,
          variant: isAlways ? "primary" : "warning",
        };
        map.critical_touch = {
          id: "critical_touch",
          name: "极值相切",
          badge: "高考临界 · 极值公切线构型",
          condition: `超越函数 $f(x) = ${fnName}$ 在驻点处取得极值，水平直线 $y = a$ 刚好与曲线相切。`,
          question:
            "观察水平线 $y = a$ 与极值点相切时的临界位置，分析为何此时构成恒成立与存在性的关键分水岭？",
          presetParams:
            transModel === "ln_x_over_x"
              ? { a: 0.37, m: 0.5, n: 3.5 }
              : transModel === "exp_minus_ax"
                ? { a: 2.72, m: 0.5, n: 2.0 }
                : transModel === "a_ln_x_minus_x"
                  ? { a: 0.0, m: 0.2, n: 3.0 }
                  : { a: 1.0, m: 0.1, n: 2.5 },
          variant: "primary",
        };
        map.mono_increase = {
          id: "mono_increase",
          name: "左偏增区",
          badge: "单调构型 · 严格单调增区间",
          condition: `研究区间 $[m, n]$ 位于驻点左侧，导函数 $f'(x) > 0$，函数在区间上严格单调递增。`,
          question:
            "在严格单调递增区间上，函数最小值与最大值分别在哪个端点取得？如何利用端点值直接求出参数 $a$ 的范围？",
          presetParams: { m: 0.2, n: 1.5 },
          variant: "info",
        };
        map.mono_decrease = {
          id: "mono_decrease",
          name: "右偏减区",
          badge: "单调构型 · 严格单调减区间",
          condition: `研究区间 $[m, n]$ 位于驻点右侧，导函数 $f'(x) < 0$，函数在区间上严格单调递减。`,
          question:
            "在严格单调递减区间上，函数最值分布如何逆转？如何利用右端点值建立不等式？",
          presetParams: { m: 2.8, n: 5.0 },
          variant: "info",
        };
      } else {
        // 二次函数 · 参变分离法
        map.free = {
          id: "free",
          name: "自由探究",
          badge: isAlways
            ? "参变分离 · 抛物线恒成立"
            : "参变分离 · 抛物线存在性",
          condition:
            "二次函数 $f(x) = x^2 - 2x + 2$，采用【参变分离法】，自变量限定在区间 $[m, n]$ 内。",
          question: isAlways
            ? "求实数参数 $a$ 的取值范围，使得抛物线在区间内始终位于水平直线 $y = a$ 上方（恒成立）。"
            : "求实数参数 $a$ 的取值范围，使得抛物线在区间内至少有一点位于水平直线 $y = a$ 上方（存在解）。",
          variant: isAlways ? "primary" : "warning",
        };
        map.critical_touch = {
          id: "critical_touch",
          name: "顶点相切",
          badge: "临界构型 · 水平线切于抛物线顶点",
          condition:
            "抛物线顶点坐标为 $(1, 1)$，水平直线 $y = a$ 刚好切于顶点最低处 ($a = 1$)。",
          question:
            "此时 $f(x)_{\\min} = 1$，分析参数 $a$ 稍有增大或减小时，恒成立与存在性状态如何发生突变？",
          presetParams: { a: 1.0, m: 0.0, n: 2.5 },
          variant: "primary",
        };
        map.mono_increase = {
          id: "mono_increase",
          name: "增区间段",
          badge: "单调构型 · 对称轴右侧递增段",
          condition:
            "研究区间 $[m, n]$ 完全位于对称轴 $x = 1$ 右侧，函数在区间上单调递增。",
          question:
            "抛物线单调递增，函数最小值在左端点 $f(m)$ 取得，求参数 $a$ 的取值范围。",
          presetParams: { a: 1.5, m: 1.2, n: 3.0 },
          variant: "info",
        };
        map.mono_decrease = {
          id: "mono_decrease",
          name: "减区间段",
          badge: "单调构型 · 对称轴左侧递减段",
          condition:
            "研究区间 $[m, n]$ 完全位于对称轴 $x = 1$ 左侧，函数在区间上单调递减。",
          question:
            "抛物线单调递减，函数最小值在右端点 $f(n)$ 取得，求参数 $a$ 的取值范围。",
          presetParams: { a: 1.5, m: -1.0, n: 0.8 },
          variant: "info",
        };
      }
    } else {
      // 直接最值讨论法场景体系 (轴动区间定 / 驻点动态偏移)
      if (funModel === "transcendent") {
        map.free = {
          id: "free",
          name: "自由探究",
          badge: "直接讨论 · 超越函数分类讨论",
          condition:
            "含参超越函数直接求导，极值点随参数 $a$ 动态平移，研究区间为 $[m, n]$。",
          question:
            "根据导数零点 $\\ln a$ 与研究区间 $[m, n]$ 的位置关系，分类讨论求函数最小值并列出不等式。",
          variant: "primary",
        };
        map.axis_left = {
          id: "axis_left",
          name: "驻点在左",
          badge: "单调构型 · 极值点在区间左侧",
          condition:
            "驻点位于研究区间左侧 ($\\ln a < m$)，函数在区间 $[m, n]$ 上严格单调递增。",
          question:
            "根据单调性，函数最小值在左端点 $f(m)$ 取得，如何代入左端点求参数 $a$ 的充要解集？",
          presetParams: { a_axis: 0.3, m: 0.5, n: 2.5 },
          variant: "info",
        };
        map.axis_inside = {
          id: "axis_inside",
          name: "驻点在内",
          badge: "极值构型 · 极小值点在区间内部",
          condition:
            "驻点落在研究区间内部 ($m \\le \\ln a \\le n$)，函数先减后增，极小值为最小值。",
          question:
            "函数在驻点处取得极小值，如何利用 $f(\\ln a) \\ge 0$ 列出含参不等式求解参数？",
          presetParams: { a_axis: 1.5, m: 0.1, n: 2.0 },
          variant: "warning",
        };
        map.axis_right = {
          id: "axis_right",
          name: "驻点在右",
          badge: "单调构型 · 极值点在区间右侧",
          condition:
            "驻点位于研究区间右侧 ($\\ln a > n$)，函数在区间 $[m, n]$ 上严格单调递减。",
          question:
            "根据单调性，函数最小值在右端点 $f(n)$ 取得，如何代入右端点列出参数不等式？",
          presetParams: { a_axis: 4.0, m: 0.2, n: 1.2 },
          variant: "info",
        };
      } else {
        // 二次函数 · 轴动区间定
        map.free = {
          id: "free",
          name: "自由探究",
          badge: "轴动区间定 · 经典分类讨论",
          condition:
            "二次函数 $f(x) = x^2 - 2ax + 2$，对称轴 $x = a$ 动态移动，研究区间为 $[m, n]$。",
          question:
            "对称轴 $x = a$ 相对区间位置分为三类，分别求各类别下的最小值并求参数 $a$ 的范围。",
          variant: "primary",
        };
        map.axis_left = {
          id: "axis_left",
          name: "轴在区间左",
          badge: "单调构型 · 对称轴在区间左侧",
          condition:
            "对称轴位于研究区间左侧 ($a < m$)，抛物线在区间 $[m, n]$ 上严格单调递增。",
          question:
            "函数单调递增，最小值在左端点取得，由 $f(m) \\ge 0$ 求实数 $a$ 的充要范围。",
          presetParams: { a_axis: 0.0, m: 1.0, n: 3.0 },
          variant: "info",
        };
        map.axis_inside = {
          id: "axis_inside",
          name: "轴在区间内",
          badge: "顶点构型 · 对称轴在区间内部",
          condition:
            "对称轴落在研究区间内部 ($m \\le a \\le n$)，抛物线顶点为区间内的绝对最小值点。",
          question:
            "顶点在区间内，最小值为 $f(a) = 2 - a^2$，由 $2 - a^2 \\ge 0$ 解出对应参数范围。",
          presetParams: { a_axis: 2.0, m: 1.0, n: 3.0 },
          variant: "warning",
        };
        map.axis_right = {
          id: "axis_right",
          name: "轴在区间右",
          badge: "单调构型 · 对称轴在区间右侧",
          condition:
            "对称轴位于研究区间右侧 ($a > n$)，抛物线在区间 $[m, n]$ 上严格单调递减。",
          question:
            "函数单调递减，最小值在右端点取得，由 $f(n) \\ge 0$ 求实数 $a$ 的充要范围。",
          presetParams: { a_axis: 4.0, m: 1.0, n: 3.0 },
          variant: "info",
        };
      }
    }

    return map;
  }, [subMode, funModel, transModel, logic]);

  // 2. 接入 useScenario 驱动三屏联动
  const { tipProps } = useScenario({
    scenarios,
    activeKey: presetKey,
    params,
  });

  // 切换函数模型时的定义域安全性保障
  const handleFunModelChange = (model: "transcendent" | "quadratic") => {
    setFunModel(model);
    setPresetKey("free");
    // 若从二次函数切至超越函数，需强制校准定义域 (m >= 0.1, n >= 0.5)
    if (model === "transcendent") {
      setParams((prev) => ({
        ...prev,
        m: Math.max(0.1, prev.m < 0.1 ? 0.5 : prev.m),
        n: Math.max(0.5, prev.n <= prev.m ? 2.5 : prev.n),
      }));
    }
  };

  const handleParamChange = useCallback(
    (key: string, value: number) => {
      // 拖拽或手动调参时，自动切回自由探究
      setPresetKey("free");
      setParams((prev) => {
        if (funModel === "transcendent") {
          if (key === "m") {
            const clampedVal = Math.max(0.1, value);
            return {
              ...prev,
              m: clampedVal >= prev.n ? prev.n - 0.1 : clampedVal,
            };
          }
          if (key === "n") {
            const clampedVal = Math.max(0.2, value);
            return {
              ...prev,
              n: clampedVal <= prev.m ? prev.m + 0.1 : clampedVal,
            };
          }
        }
        if (key === "m" && value >= prev.n) {
          return { ...prev, m: prev.n - 0.1 };
        }
        if (key === "n" && value <= prev.m) {
          return { ...prev, n: prev.m + 0.1 };
        }
        return { ...prev, [key]: value };
      });
    },
    [funModel],
  );

  // 典型预设切换响应
  const handlePresetChange = (key: string) => {
    setPresetKey(key);
    if (key === "free") return;

    const targetScenario = scenarios[key];
    if (targetScenario?.presetParams) {
      setParams((prev) => {
        const next = { ...prev };
        Object.entries(targetScenario.presetParams!).forEach(([k, v]) => {
          if (v !== undefined) {
            next[k] = v;
          }
        });
        return next;
      });
    }

    // 特定放缩切线场景自动开启放缩图层
    if (funModel === "transcendent" && key === "critical_touch") {
      if (
        transModel === "a_ln_x_minus_x" ||
        transModel === "exp_minus_a_x_plus_1"
      ) {
        setShowTangent(true);
      }
    }
  };

  const handleReset = () => {
    setPresetKey("free");
    setParams({
      a: defaultParams.a,
      a_axis: defaultParams.a_axis,
      m: funModel === "transcendent" ? 0.5 : defaultParams.m,
      n: funModel === "transcendent" ? 2.5 : defaultParams.n,
    });
  };

  const mathData = useMemo(() => {
    return buildMathQuantities("anim-constant-single", params, {
      subMode,
      logic,
      funModel,
      transModel,
    });
  }, [params, subMode, logic, funModel, transModel]);

  // 滑块配置：满足公理 3 标签三位一体 (\text{含义 } \color{Token}{代号}) 与参数分组
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keys = subMode === "sep" ? ["a", "m", "n"] : ["a_axis", "m", "n"];
    return keys.map((key) => {
      const meta = paramMeta[key];
      let min = meta.min;
      let max = meta.max;
      let step = meta.step ?? 0.05;
      let description = meta.description;
      let marks = meta.marks;
      // 标签三位一体注入
      let label = meta.label;
      let labelFormula = meta.labelFormula;
      if (key === "a") {
        label = "水平线高度 a";
        labelFormula = `\\text{水平线高度 } \\color{${MATH_COLORS.paramPrimary}}{a}`;
      } else if (key === "a_axis") {
        label = "讨论参数 a";
        labelFormula = `\\text{讨论参数 } \\color{${MATH_COLORS.paramPrimary}}{a}`;
      } else if (key === "m") {
        label = "区间左界 m";
        labelFormula = `\\text{区间左界 } \\color{${MATH_COLORS.paramSecondary}}{m}`;
      } else if (key === "n") {
        label = "区间右界 n";
        labelFormula = `\\text{区间右界 } \\color{${MATH_COLORS.paramSecondary}}{n}`;
      }

      if (funModel === "transcendent") {
        if (key === "m") {
          min = 0.1;
          max = 3.0;
          description = "超越函数定义域 x > 0，左边界大等于 0.1";
        } else if (key === "n") {
          min = 0.5;
          max = 5.0;
          description = "超越函数研究区间的右端点";
        } else if (key === "a") {
          min = -0.5;
          max = 3.0;
          step = 0.02;
          description = "目标水平直线 y = a";
        } else if (key === "a_axis") {
          min = 0.1;
          max = 5.0;
          description = "超越函数讨论参数 a";
        }
      } else {
        if (key === "a") {
          description = "代表水平直线 y = a";
        } else if (key === "a_axis") {
          description = "抛物线对称轴 x = a";
          marks = [
            {
              value: params.m,
              variant: "critical",
              label: `m=${params.m.toFixed(1).replace(/\\.0$/, "")}`,
            },
            {
              value: params.n,
              variant: "critical",
              label: `n=${params.n.toFixed(1).replace(/\\.0$/, "")}`,
            },
          ];
        }
      }

      return {
        key,
        label,
        labelFormula,
        value: params[key] ?? meta.defaultValue ?? 0,
        min,
        max,
        step,
        description,
        importance: meta.importance,
        marks,
      };
    });
  }, [params, subMode, funModel]);

  const formulasLatex = useMemo(() => {
    const mStr = `\\color{${MATH_COLORS.paramSecondary}}{${params.m.toFixed(2).replace(/\\.?0+$/, "")}}`;
    const nStr = `\\color{${MATH_COLORS.paramTertiary}}{${params.n.toFixed(2).replace(/\\.?0+$/, "")}}`;
    const rangeStr = `x \\in [${mStr}, ${nStr}]`;

    if (subMode === "sep") {
      if (funModel === "transcendent") {
        let polyStr = "";
        if (transModel === "ln_x_over_x") {
          polyStr = `f(x) = \\frac{\\ln x}{x}`;
        } else if (transModel === "exp_minus_ax") {
          polyStr = `f(x) = \\frac{e^x}{x}`;
        } else if (transModel === "a_ln_x_minus_x") {
          polyStr = `f(x) = \\frac{x-1}{\\ln x}`;
        } else if (transModel === "exp_minus_a_x_plus_1") {
          polyStr = `f(x) = \\frac{e^x}{x+1}`;
        }
        const lineStr = `y = \\color{${MATH_COLORS.paramPrimary}}{${params.a.toFixed(2).replace(/\\.?0+$/, "")}}`;
        return { line1: `${polyStr} \\quad ${rangeStr}`, line2: lineStr };
      } else {
        const polyStr = `f(x) = x^2 - 2x + 2 \\quad ${rangeStr}`;
        const lineStr = `y = \\color{${MATH_COLORS.paramPrimary}}{${params.a.toFixed(2).replace(/\\.?0+$/, "")}}`;
        return { line1: polyStr, line2: lineStr };
      }
    } else {
      if (funModel === "transcendent") {
        let line1 = "";
        if (transModel === "ln_x_over_x" || transModel === "exp_minus_ax") {
          line1 = `f(x) = e^x - \\color{${MATH_COLORS.paramPrimary}}{${params.a_axis.toFixed(2).replace(/\\.?0+$/, "")}}x`;
        } else if (transModel === "a_ln_x_minus_x") {
          line1 = `f(x) = \\color{${MATH_COLORS.paramPrimary}}{${params.a_axis.toFixed(2).replace(/\\.?0+$/, "")}}\\ln x - x + 1`;
        } else if (transModel === "exp_minus_a_x_plus_1") {
          line1 = `f(x) = e^x - \\color{${MATH_COLORS.paramPrimary}}{${params.a_axis.toFixed(2).replace(/\\.?0+$/, "")}}(x+1)`;
        }
        return { line1, line2: rangeStr };
      } else {
        const line1 = `f(x) = x^2 - 2\\color{${MATH_COLORS.paramPrimary}}{(${params.a_axis.toFixed(2).replace(/\\.?0+$/, "")})}x + 2`;
        return { line1, line2: rangeStr };
      }
    }
  }, [subMode, funModel, transModel, params]);

  const legendItems = useMemo<SceneLegendItem[]>(() => {
    const items: SceneLegendItem[] = [
      {
        label: subMode === "sep" ? "目标函数 f(x)" : "含参函数 f(x)",
        color: MATH_COLORS.function,
        style: "solid",
      },
      {
        label:
          subMode === "sep"
            ? "目标水平线 y = a"
            : funModel === "transcendent"
              ? "驻点/极小值 x = ln a"
              : "对称轴 x = a",
        color: MATH_COLORS.paramPrimary,
        style: "dash",
      },
      {
        label: "区间左界 x = m",
        color: MATH_COLORS.paramSecondary,
        style: "dash",
      },
      {
        label: "区间右界 x = n",
        color: MATH_COLORS.paramTertiary,
        style: "dash",
      },
    ];

    if (showDerivative) {
      items.push({
        label: "导函数 f'(x)",
        color: MATH_COLORS.derivative,
        style: "dash",
      });
    }

    if (showTangent) {
      items.push({
        label: "放缩切线",
        color: MATH_COLORS.tangentLine,
        style: "dash",
      });
    }

    return items;
  }, [subMode, funModel, showDerivative, showTangent]);

  // 当前是否支持切线放缩模型
  const isTangentSupported =
    funModel === "transcendent" &&
    (transModel === "a_ln_x_minus_x" || transModel === "exp_minus_a_x_plus_1");

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 模式维度：核心函数专题 */}
          <LeftPanelSection title="核心函数专题">
            <TabSwitcher
              tabs={[
                { key: "transcendent", label: "超越函数压轴" },
                { key: "quadratic", label: "二次函数模型" },
              ]}
              value={funModel}
              onChange={(k) =>
                handleFunModelChange(k as "transcendent" | "quadratic")
              }
            />

            {funModel === "transcendent" && (
              <div className="pt-2">
                <SelectGrid
                  items={[
                    {
                      key: "ln_x_over_x",
                      label: "对数分式模型",
                      description: "极值点 x=e",
                    },
                    {
                      key: "exp_minus_ax",
                      label: "指数线性模型",
                      description: "驻点 x=ln a",
                    },
                    {
                      key: "a_ln_x_minus_x",
                      label: "对数线性放缩",
                      description: "x=1 切线放缩",
                    },
                    {
                      key: "exp_minus_a_x_plus_1",
                      label: "指数切线下界",
                      description: "x=0 切线下界",
                    },
                  ]}
                  value={transModel}
                  onChange={(k) => {
                    setTransModel(k as TransModelKey);
                    setPresetKey("free");
                  }}
                  variant="filled"
                  columns={2}
                />
              </div>
            )}
          </LeftPanelSection>

          {/* 2. 模式维度：探究目标与求解方法 */}
          <LeftPanelSection title="探究目标与解法">
            <div className="space-y-2.5">
              <div>
                <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                  探索目标 (量词)
                </label>
                <SelectGrid
                  items={[
                    {
                      key: "always",
                      label: "恒成立 (∀x)",
                      description: "抓最小值守底线",
                    },
                    {
                      key: "exist",
                      label: "存在性 (∃x)",
                      description: "抓最大值求突破",
                    },
                  ]}
                  value={logic}
                  onChange={(k) => setLogic(k as "always" | "exist")}
                  variant="filled"
                  columns={2}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                  核心解题方法
                </label>
                <SelectGrid
                  items={[
                    {
                      key: "sep",
                      label: "参变分离法",
                      description: "孤立参数看极值",
                    },
                    {
                      key: "direct",
                      label: "直接分类讨论",
                      description: "含参极值定区间",
                    },
                  ]}
                  value={subMode}
                  onChange={(k) => {
                    setSubMode(k as "sep" | "direct");
                    setPresetKey("free");
                  }}
                  variant="filled"
                  columns={2}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                  辅助分析图层
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowDerivative((prev) => !prev)}
                    className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-all duration-200 text-center select-none cursor-pointer ${
                      showDerivative
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                        : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    {showDerivative ? "✓ 导数 f'(x)" : "+ 导数 f'(x)"}
                  </button>
                  <button
                    type="button"
                    disabled={!isTangentSupported}
                    onClick={() => setShowTangent((prev) => !prev)}
                    title={
                      isTangentSupported
                        ? "显示切线放缩辅助线"
                        : "当前函数模型无需切线放缩"
                    }
                    className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-all duration-200 text-center select-none ${
                      !isTangentSupported
                        ? "bg-neutral-100 text-neutral-300 border-neutral-200 cursor-not-allowed opacity-60"
                        : showTangent
                          ? "bg-amber-500 text-white border-amber-500 shadow-sm cursor-pointer"
                          : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 cursor-pointer"
                    }`}
                  >
                    {showTangent ? "✓ 切线放缩" : "+ 切线放缩"}
                  </button>
                </div>
              </div>
            </div>
          </LeftPanelSection>

          {/* 3. 典型情景：根据求解方法自适应特化 */}
          <LeftPanelSection title="典型构型预设">
            {subMode === "sep" ? (
              <SelectGrid
                items={[
                  {
                    key: "free",
                    label: "自由探究",
                    description: "全参数开放",
                  },
                  {
                    key: "critical_touch",
                    label:
                      funModel === "transcendent" ? "极值相切" : "顶点相切",
                    description: "临界点等号成立",
                  },
                  {
                    key: "mono_increase",
                    label: "增区间段",
                    description: "严格单调递增",
                  },
                  {
                    key: "mono_decrease",
                    label: "减区间段",
                    description: "严格单调递减",
                  },
                ]}
                value={presetKey}
                onChange={handlePresetChange}
                variant="filled"
                columns={2}
              />
            ) : (
              <SelectGrid
                items={[
                  {
                    key: "free",
                    label: "自由探究",
                    description: "全参数开放",
                  },
                  {
                    key: "axis_left",
                    label:
                      funModel === "transcendent" ? "驻点在左" : "轴在区间左",
                    description: "区间严格单调增",
                  },
                  {
                    key: "axis_inside",
                    label:
                      funModel === "transcendent" ? "驻点在内" : "轴在区间内",
                    description: "顶点极值在区间",
                  },
                  {
                    key: "axis_right",
                    label:
                      funModel === "transcendent" ? "驻点在右" : "轴在区间右",
                    description: "区间严格单调减",
                  },
                ]}
                value={presetKey}
                onChange={handlePresetChange}
                variant="filled"
                columns={2}
              />
            )}
          </LeftPanelSection>

          {/* 4. 参数与区间调节 */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 5. 教学导引 (TipCard 结构化呈现) */}
          {tipProps && (
            <LeftPanelSection title="教学导引" compact>
              <TipCard
                badge={tipProps.badge}
                condition={tipProps.condition}
                question={tipProps.question}
                variant={tipProps.variant}
              />
            </LeftPanelSection>
          )}
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white select-none">
          <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur border border-neutral-250 rounded-xl px-4 py-2.5 shadow-md flex flex-col gap-1 font-mono">
            <div className="text-xs text-neutral-400 font-bold mb-0.5">
              高考数学方程
            </div>
            <div className="text-sm">
              <KatexFormula formula={formulasLatex.line1} mode="inline" />
            </div>
            {formulasLatex.line2 && (
              <div className="text-sm border-t border-neutral-100 pt-1 mt-0.5">
                <KatexFormula formula={formulasLatex.line2} mode="inline" />
              </div>
            )}
          </div>

          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <SingleVarScene
              subMode={subMode}
              logic={logic}
              funModel={funModel}
              transModel={transModel}
              showDerivative={showDerivative}
              showTangent={showTangent}
              params={params}
              scale={scale}
              vp={vp}
              fontScale={canvasSize.font}
              onParamChange={handleParamChange}
            />
          </AnimationSvgCanvas>
          <SceneLegend items={legendItems} title="图例说明" />
        </div>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          reasoningSteps={mathData.reasoningSteps}
          mnemonic={mathData.mnemonic}
          title="单变量恒成立与存在性看板"
        />
      }
    />
  );
}
