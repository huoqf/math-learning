import { useState, useMemo, useCallback } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/constant";
import { DoubleVarScene } from "./components/DoubleVarScene";

export function DoubleVarPage() {
  const [selectedLogic, setSelectedLogic] = useState<
    "all_all" | "all_exist" | "exist_all" | "exist_exist" | "same_var"
  >("all_all");
  const [presetKey, setPresetKey] = useState<string>("free");

  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const scale = useSceneScale({
    vp,
    xRange: [-0.5, 4],
    yRange: [-3, 7],
  });

  const mathData = useMemo(() => {
    return buildMathQuantities("anim-constant-double", params, {
      selectedLogic,
    });
  }, [params, selectedLogic]);

  const handleParamsBatchChange = useCallback(
    (patch: Record<string, number>) => {
      setPresetKey("free");
      setParams((prev) => ({ ...prev, ...patch }));
    },
    [],
  );

  const handleParamChange = useCallback((key: string, value: number) => {
    setPresetKey("free");
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  // 典型构型一键预设（根据五大博弈模式自适应匹配数学精确临界值）
  const handlePresetChange = (key: string) => {
    setPresetKey(key);
    if (key === "free") return;

    if (selectedLogic === "same_var") {
      if (key === "critical_touch") {
        // 同自变量公切临界：h_min = 0 (在 x=1.75 处两曲线相切公切)
        setParams((prev) => ({
          ...prev,
          xf: 1.25,
          yf: 1.5,
          xg: 2.25,
          yg: 2.0,
        }));
      } else if (key === "safe_isolate") {
        // 同自变量严格高于：h(x) > 0 全域成立
        setParams((prev) => ({
          ...prev,
          xf: 1.25,
          yf: 2.2,
          xg: 2.25,
          yg: 1.5,
        }));
      } else if (key === "partial_overlap") {
        // 同自变量交叉穿透：两曲线相交产生违背区间
        setParams((prev) => ({
          ...prev,
          xf: 1.25,
          yf: 1.0,
          xg: 2.25,
          yg: 2.2,
        }));
      }
    } else if (selectedLogic === "all_all") {
      if (key === "critical_touch") {
        // 任意对任意外切临界：f_min = g_max = 2.00
        setParams((prev) => ({
          ...prev,
          xf: 1.0,
          yf: 2.0,
          xg: 2.0,
          yg: 2.0,
        }));
      } else if (key === "safe_isolate") {
        // 任意对任意安全隔离：f_min = 3.00 > g_max = 2.00
        setParams((prev) => ({
          ...prev,
          xf: 1.0,
          yf: 3.0,
          xg: 2.0,
          yg: 2.0,
        }));
      } else if (key === "partial_overlap") {
        // 任意对任意值域交错：f_min = 1.40 < g_max = 2.00
        setParams((prev) => ({
          ...prev,
          xf: 1.0,
          yf: 1.4,
          xg: 2.0,
          yg: 2.0,
        }));
      }
    } else if (selectedLogic === "all_exist") {
      if (key === "critical_touch") {
        // 任意对存在保底临界：f_min = g_min = 1.00
        setParams((prev) => ({
          ...prev,
          xf: 1.0,
          yf: 1.0,
          xg: 2.0,
          yg: 2.0,
        }));
      } else if (key === "safe_isolate") {
        // 任意对存在稳固保底：f_min = 1.80 > g_min = 1.00
        setParams((prev) => ({
          ...prev,
          xf: 1.0,
          yf: 1.8,
          xg: 2.0,
          yg: 2.0,
        }));
      } else if (key === "partial_overlap") {
        // 任意对存在击穿底线：f_min = 0.40 < g_min = 1.00
        setParams((prev) => ({
          ...prev,
          xf: 1.0,
          yf: 0.4,
          xg: 2.0,
          yg: 2.0,
        }));
      }
    } else if (selectedLogic === "exist_all") {
      if (key === "critical_touch") {
        // 存在对任意顶峰临界：f_max = g_max = 2.00 (yf = 1.00 => f_max = 1.00 + 1.00 = 2.00)
        setParams((prev) => ({
          ...prev,
          xf: 1.0,
          yf: 1.0,
          xg: 2.0,
          yg: 2.0,
        }));
      } else if (key === "safe_isolate") {
        // 存在对任意突破压制：f_max = 2.60 > g_max = 2.00
        setParams((prev) => ({
          ...prev,
          xf: 1.0,
          yf: 1.6,
          xg: 2.0,
          yg: 2.0,
        }));
      } else if (key === "partial_overlap") {
        // 存在对任意全域受压：f_max = 1.40 < g_max = 2.00
        setParams((prev) => ({
          ...prev,
          xf: 1.0,
          yf: 0.4,
          xg: 2.0,
          yg: 2.0,
        }));
      }
    } else if (selectedLogic === "exist_exist") {
      if (key === "critical_touch") {
        // 存在对存在门槛临界：f_max = g_min = 1.00 (yf = 0.00 => f_max = 0.00 + 1.00 = 1.00)
        setParams((prev) => ({
          ...prev,
          xf: 1.0,
          yf: 0.0,
          xg: 2.0,
          yg: 2.0,
        }));
      } else if (key === "safe_isolate") {
        // 存在对存在跨越门槛：f_max = 1.80 > g_min = 1.00
        setParams((prev) => ({
          ...prev,
          xf: 1.0,
          yf: 0.8,
          xg: 2.0,
          yg: 2.0,
        }));
      } else if (key === "partial_overlap") {
        // 存在对存在门槛落空：f_max = 0.20 < g_min = 1.00
        setParams((prev) => ({
          ...prev,
          xf: 1.0,
          yf: -0.8,
          xg: 2.0,
          yg: 2.0,
        }));
      }
    }
  };

  const handleReset = () => {
    setPresetKey("free");
    setParams({ ...defaultParams });
  };

  // 动态解算当前模式下主控参数 y_f 的数学临界点 (SSOT)
  const criticalYf = useMemo(() => {
    if (selectedLogic === "same_var") {
      const sym = (params.xf + params.xg) / 2;
      const xClamped = Math.max(1.5, Math.min(2.0, sym));
      return (
        params.yg -
        (xClamped - params.xg) * (xClamped - params.xg) -
        (xClamped - params.xf) * (xClamped - params.xf)
      );
    }
    const gVal1 = -((1.5 - params.xg) ** 2) + params.yg;
    const gVal2 = -((3.0 - params.xg) ** 2) + params.yg;
    const gMax =
      params.xg >= 1.5 && params.xg <= 3.0 ? params.yg : Math.max(gVal1, gVal2);
    const gMin = Math.min(gVal1, gVal2);
    const fDeltaMax = Math.max((0.5 - params.xf) ** 2, (2.0 - params.xf) ** 2);

    switch (selectedLogic) {
      case "all_all":
        return gMax;
      case "all_exist":
        return gMin;
      case "exist_all":
        return gMax - fDeltaMax;
      case "exist_exist":
        return gMin - fDeltaMax;
    }
  }, [params.xf, params.xg, params.yg, selectedLogic]);

  // 三位一体参数标签与临界分水岭 Marks
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keys = ["yf", "xf", "yg", "xg"];

    return keys.map((key) => {
      const meta = paramMeta[key];
      const isPrimary = key === "xf" || key === "yf";
      const colorToken = isPrimary
        ? MATH_COLORS.paramPrimary
        : MATH_COLORS.paramSecondary;
      const group = isPrimary
        ? "抛物线 f(x) (开口向上)"
        : "抛物线 g(x) (开口向下)";

      // 三位一体公式标签：\text{含义 } \color{Token}{代号}
      const labelFormula = `\\text{${meta.label.replace(/\s*[xy]_[fg]/, "")} } \\color{${colorToken}}{${meta.labelFormula}}`;

      let marks = meta.marks;
      if (
        key === "yf" &&
        criticalYf !== undefined &&
        criticalYf >= -1.0 &&
        criticalYf <= 5.0
      ) {
        let critLabel = "临界点";
        let critFormula = `y_f = ${criticalYf.toFixed(2)}`;
        if (selectedLogic === "same_var") {
          critLabel = "公切相触";
          critFormula = `h_{\\min}=0: \\; ${criticalYf.toFixed(2)}`;
        } else if (selectedLogic === "all_all") {
          critLabel = "外切临界";
          critFormula = `f_{\\min}=g_{\\max}: \\; ${criticalYf.toFixed(2)}`;
        } else if (selectedLogic === "all_exist") {
          critLabel = "保底临界";
          critFormula = `f_{\\min}=g_{\\min}: \\; ${criticalYf.toFixed(2)}`;
        } else if (selectedLogic === "exist_all") {
          critLabel = "顶峰临界";
          critFormula = `f_{\\max}=g_{\\max}: \\; ${criticalYf.toFixed(2)}`;
        } else if (selectedLogic === "exist_exist") {
          critLabel = "门槛临界";
          critFormula = `f_{\\max}=g_{\\min}: \\; ${criticalYf.toFixed(2)}`;
        }

        marks = [
          {
            value: Number(criticalYf.toFixed(2)),
            variant: "critical",
            label: critLabel,
            labelFormula: critFormula,
          },
        ];
      }

      return {
        key,
        label: meta.label,
        labelFormula,
        value: params[key] ?? meta.defaultValue ?? 0,
        min: meta.min,
        max: meta.max,
        step: meta.step ?? 0.1,
        group,
        description: meta.description,
        descriptionFormula: meta.descriptionFormula,
        importance: meta.importance,
        marks,
      };
    });
  }, [params, selectedLogic, criticalYf]);

  // 教学导引与双要素设问（联动 selectedLogic 与 presetKey 典型构型）
  const tipConfig = useMemo(() => {
    if (selectedLogic === "same_var") {
      if (presetKey === "critical_touch") {
        return {
          variant: "primary" as const,
          badge: "同变量公切 · 差函数恰好相切",
          condition:
            "同自变量 $x \\in [1.5, 2.0]$，抛物线 $f(x)$ 与 $g(x)$ 在对称轴处公切相触，差函数极小值 $h_{\\min} = 0.00$。",
          question:
            "(1) 思考两函数顶点：为什么在极值严重交错 ($f_{\\min} < g_{\\max}$) 的情况下，同变量不等式依然全域恒成立？(2) 探究差函数相切触零与两曲线公共切线的内在代数联系。",
        };
      }
      if (presetKey === "safe_isolate") {
        return {
          variant: "primary" as const,
          badge: "同变量严格高于 · 全程无交点",
          condition:
            "在公共交集区间 $[1.5, 2.0]$ 内，$f(x)$ 全程严格高于 $g(x)$，差函数极小值 $h_{\\min} > 0$。",
          question:
            "(1) 求解对称轴处两曲线的最危险高度差；(2) 对比同自变量恒成立与双动点极值隔离在参数要求上的宽严程度。",
        };
      }
      if (presetKey === "partial_overlap") {
        return {
          variant: "warning" as const,
          badge: "同变量交叉穿透 · 产生违背区间",
          condition:
            "两曲线在公共交集内相交穿透，$f(x)$ 局部跌破 $g(x)$，差函数出现 $h(x) < 0$ 的违背区间。",
          question:
            "(1) 联立两曲线方程求出交点坐标，解出违背区间的准确端点；(2) 求解要消除违背区间使得不等式恒成立，主参数 $y_f$ 需向上平移的最小量。",
        };
      }
      return {
        variant: "primary" as const,
        badge: "同自变量对垒 · 差函数法",
        condition:
          "自变量为同一动点，定义域严格限定在两函数公共交集区间 $x \\in I_1 \\cap I_2 = [1.50, 2.00]$ 内。",
        question:
          "(1) 构造差函数 $h(x) = f(x) - g(x)$ 并分析其二次对称轴；(2) 求解保证 $h(x) \\ge 0$ 恒成立的充要条件及最危险点位置。",
      };
    }

    if (selectedLogic === "all_all") {
      if (presetKey === "critical_touch") {
        return {
          variant: "primary" as const,
          badge: "外切构型 · 双动点极值相切",
          condition:
            "处于 $f_{\\min} = g_{\\max} = 2.00$ 的极值相切临界状态，两动点极值接触且高度差 $\\Delta y = 0.00$。",
          question:
            "(1) 判定此时全称博弈不等式的真假状态；(2) 探究当 $y_f$ 发生微扰时全称博弈命题真假的突变分界。",
        };
      }
      if (presetKey === "safe_isolate") {
        return {
          variant: "primary" as const,
          badge: "隔离构型 · 双动点极值完全分离",
          condition:
            "$f(x)$ 最小值 $3.00$ 严格高于 $g(x)$ 最大值 $2.00$，高度差 $\\Delta y = 1.00 > 0$，两函数值域完全无交集。",
          question:
            "(1) 证明在当前极值隔离状态下所有四类双动点量词不等式均恒成立；(2) 求解使得全称博弈依然成立的最大允许下移量。",
        };
      }
      if (presetKey === "partial_overlap") {
        return {
          variant: "warning" as const,
          badge: "交错构型 · 双动点值域局部重叠",
          condition:
            "两函数值域出现部分重合：$f_{\\min} = 1.40 < g_{\\max} = 2.00$，全称隔离条件被破坏。",
          question:
            "(1) 分析为何此时“任意对任意”已被违背而“任意对存在”依然成立；(2) 求解消除重叠达到隔离所需的垂直调整量。",
        };
      }
      return {
        variant: "primary" as const,
        badge: "任意对任意 · 极值完全隔离",
        condition:
          "给定函数 $f(x)$ ($x_1 \\in [0.5, 2.0]$) 与 $g(x)$ ($x_2 \\in [1.5, 3.0]$)，双动点独立自由滑动，无任何绑定约束。",
        question:
          "(1) 分别求解两函数在闭区间上的极值 $f_{\\min}$ 与 $g_{\\max}$；(2) 探究使不等式 $f(x_1) \\ge g(x_2)$ 全域恒成立的充要条件。",
      };
    }

    if (selectedLogic === "all_exist") {
      if (presetKey === "critical_touch") {
        return {
          variant: "primary" as const,
          badge: "保底临界 · 极小值底线持平",
          condition:
            "处于 $f_{\\min} = g_{\\min} = 1.00$ 的临界保底状态，$f$ 的最弱底线恰好抵住 $g$ 的全域最低点。",
          question:
            "(1) 证明为何在两曲线图象存在大幅重叠时，“任意对存在”依然能刚好处于临界成立；(2) 探究 $f_{\\min}$ 略微跌破 $g_{\\min}$ 时的量词失效。",
        };
      }
      if (presetKey === "safe_isolate") {
        return {
          variant: "primary" as const,
          badge: "充足保底 · 极小值全面覆盖",
          condition:
            "$f_{\\min} = 1.80$ 明显高于 $g_{\\min} = 1.00$，高度差 $\\Delta y = 0.80 > 0$，保底条件充分满足。",
          question:
            "(1) 解释对任意 $x_1$，如何在区间 $I_2$ 中挑选出满足不等式的动点 $x_2$；(2) 求解允许 $y_f$ 向下平移的最大保底裕度。",
        };
      }
      if (presetKey === "partial_overlap") {
        return {
          variant: "warning" as const,
          badge: "击穿底线 · 存在量词保底失效",
          condition:
            "$f_{\\min} = 0.40 < g_{\\min} = 1.00$，高度差 $\\Delta y = -0.60 < 0$，$f(x)$ 最低点跌破了 $g$ 的全域底线。",
          question:
            "(1) 找出使得不等式失效的具体反例自变量 $x_1$；(2) 求解使得命题恢复成立所需的最小提升量。",
        };
      }
      return {
        variant: "info" as const,
        badge: "任意对存在 · 极小保底支撑",
        condition:
          "要求对每一个 $x_1 \\in [0.5, 2.0]$，在 $[1.5, 3.0]$ 内总能找到至少一个满足 $f(x_1) \\ge g(x_2)$ 的动点 $x_2$。",
        question:
          "(1) 将全称对存在量词转化为两函数极小值的代数关系；(2) 探究两函数值域局部相交但博弈依然成立的充要条件。",
      };
    }

    if (selectedLogic === "exist_all") {
      if (presetKey === "critical_touch") {
        return {
          variant: "primary" as const,
          badge: "顶峰临界 · 极大值峰顶持平",
          condition:
            "处于 $f_{\\max} = g_{\\max} = 2.00$ 的临界状态，$f(x)$ 的最高峰顶恰好持平 $g(x)$ 的最高点。",
          question:
            "(1) 判定此时能实现顶峰压制的唯一最优动点 $x_1$ 所在位置；(2) 探究当 $f_{\\max} < g_{\\max}$ 时为何全域压制立即崩溃。",
        };
      }
      if (presetKey === "safe_isolate") {
        return {
          variant: "primary" as const,
          badge: "突破压制 · 峰顶高度全面超越",
          condition:
            "$f_{\\max} = 2.60 > g_{\\max} = 2.00$，高度差 $\\Delta y = 0.60 > 0$，$f$ 峰顶已成功突破并压制 $g$。",
          question:
            "(1) 确定能压制 $g$ 全部取值的合格动点 $x_1$ 的区间范围；(2) 求解保持顶峰压制有效的临界参数解集。",
        };
      }
      if (presetKey === "partial_overlap") {
        return {
          variant: "warning" as const,
          badge: "全域受压 · 极大值压制失败",
          condition:
            "$f_{\\max} = 1.40 < g_{\\max} = 2.00$，高度差 $\\Delta y = -0.60 < 0$，$f$ 最高峰顶依然处于 $g$ 最高点下方。",
          question:
            "(1) 说明为何即便两函数值域有重叠，存在对全称依然完全失败；(2) 求解使得命题成立的参数下限。",
        };
      }
      return {
        variant: "warning" as const,
        badge: "存在对任意 · 极大顶峰压制",
        condition:
          "要求在区间 $[0.5, 2.0]$ 内至少存在一个动点 $x_1$，使其函数值不低于 $g(x)$ 在整个区间上的所有取值。",
        question:
          "(1) 提炼出存在量词所对应的核心优势极值点；(2) 求解实现顶峰压制所对应的参数解集。",
      };
    }

    if (selectedLogic === "exist_exist") {
      if (presetKey === "critical_touch") {
        return {
          variant: "primary" as const,
          badge: "门槛临界 · 极限门槛接触",
          condition:
            "处于 $f_{\\max} = g_{\\min} = 1.00$ 的准入接触临界状态，$f$ 的最高峰恰好触及 $g$ 的最低谷。",
          question:
            "(1) 说明此时满足不等式的唯一解点对 $(x_1, x_2)$；(2) 探究当 $f_{\\max} < g_{\\min}$ 时两函数解集的几何空集本质。",
        };
      }
      if (presetKey === "safe_isolate") {
        return {
          variant: "primary" as const,
          badge: "跨越门槛 · 局部优势明显",
          condition:
            "$f_{\\max} = 1.80 > g_{\\min} = 1.00$，高度差 $\\Delta y = 0.80 > 0$，解集非空且有丰富点对。",
          question:
            "(1) 求解满足不等式的点对在平面区域上的分布特征；(2) 求解保证解集非空的最宽松参数边界。",
        };
      }
      if (presetKey === "partial_overlap") {
        return {
          variant: "warning" as const,
          badge: "门槛落空 · 两函数值域完全背离",
          condition:
            "$f_{\\max} = 0.20 < g_{\\min} = 1.00$，高度差 $\\Delta y = -0.80 < 0$，$f$ 的最高点都够不到 $g$ 的最低底线。",
          question:
            "(1) 证明在此状态下不等式恒无解；(2) 求解实现解对破零所需的参数提升量。",
        };
      }
      return {
        variant: "warning" as const,
        badge: "存在对存在 · 门槛局部超越",
        condition:
          "只需在各自区间内存在一组点对 $(x_1, x_2)$ 满足 $f(x_1) \\ge g(x_2)$，考察最宽松的准入门槛。",
        question:
          "(1) 判定两函数解集非空的极值比较准则；(2) 求解使得解集非空的最弱最值不等式方程与参数边界。",
      };
    }

    return {
      variant: "primary" as const,
      badge: "双变量博弈问题",
      condition: "考察两抛物线在特定量词约束下的数值博弈关系与恒成立边界。",
      question: "探究满足不同量词关系不等式的实数参数取值范围。",
    };
  }, [selectedLogic, presetKey]);

  // 典型构型选项（根据博弈量词模式特化）
  const presetItems = useMemo(() => {
    if (selectedLogic === "same_var") {
      return [
        {
          key: "free",
          label: "自由探究",
          description: "全参数自主探索",
        },
        {
          key: "critical_touch",
          label: "曲线公切",
          description: "差函数恰好相切触零",
        },
        {
          key: "safe_isolate",
          label: "严格高于",
          description: "全域无交点严格大于",
        },
        {
          key: "partial_overlap",
          label: "交叉穿透",
          description: "曲线相交产生违背",
        },
      ];
    }
    if (selectedLogic === "all_all") {
      return [
        { key: "free", label: "自由探究", description: "全参数自主探索" },
        {
          key: "critical_touch",
          label: "外切临界",
          description: "极小与极大相切接触",
        },
        {
          key: "safe_isolate",
          label: "完全隔离",
          description: "极值完全分离无交集",
        },
        {
          key: "partial_overlap",
          label: "值域交错",
          description: "值域重叠导致违背",
        },
      ];
    }
    if (selectedLogic === "all_exist") {
      return [
        { key: "free", label: "自由探究", description: "全参数自主探索" },
        {
          key: "critical_touch",
          label: "保底临界",
          description: "极小底线接触持平",
        },
        {
          key: "safe_isolate",
          label: "充分保底",
          description: "极小高于底线成立",
        },
        {
          key: "partial_overlap",
          label: "击穿底线",
          description: "跌破底线导致失效",
        },
      ];
    }
    if (selectedLogic === "exist_all") {
      return [
        { key: "free", label: "自由探究", description: "全参数自主探索" },
        {
          key: "critical_touch",
          label: "顶峰临界",
          description: "两峰顶持平接触",
        },
        {
          key: "safe_isolate",
          label: "突破压制",
          description: "峰顶突围成功压制",
        },
        {
          key: "partial_overlap",
          label: "全域受压",
          description: "峰顶受限压制失败",
        },
      ];
    }
    return [
      { key: "free", label: "自由探究", description: "全参数自主探索" },
      {
        key: "critical_touch",
        label: "门槛临界",
        description: "峰顶触及谷底接触",
      },
      {
        key: "safe_isolate",
        label: "跨越门槛",
        description: "峰顶超越谷底有解",
      },
      {
        key: "partial_overlap",
        label: "门槛落空",
        description: "未及门槛完全无解",
      },
    ];
  }, [selectedLogic]);

  // 中屏右下角图例配置 (SceneLegend)
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    const isSameVar = selectedLogic === "same_var";
    return [
      {
        label: "f(x) 开口向上二次曲线",
        color: MATH_COLORS.function,
        style: "solid",
      },
      {
        label: "g(x) 开口向下二次曲线",
        color: MATH_COLORS.functionSecondary,
        style: "solid",
      },
      {
        label: "$P_1(x_f, y_f)$ 顶点控制动点",
        color: MATH_COLORS.paramPrimary,
        style: "point",
      },
      {
        label: "$P_2(x_g, y_g)$ 顶点控制动点",
        color: MATH_COLORS.paramSecondary,
        style: "point",
      },
      isSameVar
        ? {
            label: "差函数最值与违背区间",
            color: MATH_COLORS.inequality,
            style: "area",
          }
        : {
            label: "双动点极值投影与高度差标尺",
            color: MATH_COLORS.inequality,
            style: "dash",
          },
    ];
  }, [selectedLogic]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 双变量博弈量词模式 */}
          <LeftPanelSection
            title="博弈量词关系"
            subtitle="选择全称/存在量词或同变量差函数"
          >
            <SelectGrid
              items={[
                {
                  key: "all_all",
                  label: "任意对任意",
                  description: "∀x₁, ∀x₂ 极值完全隔离",
                },
                {
                  key: "all_exist",
                  label: "任意对存在",
                  description: "∀x₁, ∃x₂ 极小保底支撑",
                },
                {
                  key: "exist_all",
                  label: "存在对任意",
                  description: "∃x₁, ∀x₂ 极大顶峰压制",
                },
                {
                  key: "exist_exist",
                  label: "存在对存在",
                  description: "∃x₁, ∃x₂ 门槛局部超越",
                },
                {
                  key: "same_var",
                  label: "同自变量对垒",
                  description: "∀x ∈ I₁ ∩ I₂ 差函数法",
                  fullWidth: true,
                },
              ]}
              value={selectedLogic}
              onChange={(k) => {
                setSelectedLogic(k);
                setPresetKey("free");
              }}
              variant="filled"
              columns={2}
            />
          </LeftPanelSection>

          {/* 2. 黄金 2x2 典型构型预设 */}
          <LeftPanelSection
            title="典型构型预设"
            subtitle={
              selectedLogic === "same_var"
                ? "一键直达同变量差函数临界构型"
                : "一键直达双动点临界与博弈构型"
            }
          >
            <SelectGrid
              items={presetItems}
              value={presetKey}
              onChange={handlePresetChange}
              variant="filled"
              columns={2}
            />
          </LeftPanelSection>

          {/* 3. 参数调节 (按 group 分组) */}
          <LeftPanelSection
            title="顶点参数调节"
            subtitle="拖动滑块改变两抛物线位置"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 4. 教学导引与双要素设问（由 TipCard 内部自动解析 KaTeX 混合公式） */}
          <LeftPanelSection title="教学导引与启发思考" compact>
            <TipCard
              variant={tipConfig.variant}
              badge={tipConfig.badge}
              condition={tipConfig.condition}
              question={tipConfig.question}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white select-none">
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <DoubleVarScene
              selectedLogic={selectedLogic}
              params={params}
              scale={scale}
              vp={vp}
              fontScale={canvasSize.font}
              onParamChange={handleParamChange}
              onParamsBatchChange={handleParamsBatchChange}
            />
          </AnimationSvgCanvas>

          {/* 中屏右下角标准毛玻璃图例 (SceneLegend) */}
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
          examAnchor={mathData.examAnchor}
          title={
            selectedLogic === "same_var" ? "同变量差函数看板" : "双动点博弈看板"
          }
        />
      }
    />
  );
}
