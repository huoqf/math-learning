import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  LeftPanel,
  LeftPanelSection,
  TabSwitcher,
  SelectGrid,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import { ConicPropertiesScene } from "./components/ConicPropertiesScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/conicProperties";
import {
  deriveBFromEccentricity,
  calculateConicProperties,
  type ConicType,
} from "./math/conicProperties";

export function ConicPropertiesAnimation() {
  // 1. 研究模式
  const [studyMode, setStudyMode] = useState<
    "basicProperties" | "eccentricity" | "focusTriangle"
  >("basicProperties");

  // 2. 曲线类型
  const [conicType, setConicType] = useState<ConicType>("ellipse");

  // 3. 典型预设
  const [presetKey, setPresetKey] = useState<string>("free");

  // 4. 参数状态
  const [params, setParams] = useState({
    a: defaultParams.a,
    b: defaultParams.b,
    e: defaultParams.e,
    t: defaultParams.t,
  });

  // 5. 视口尺寸 Hook
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 6. 坐标映射比例尺: X [-6, 6], Y [-4.5, 4.5]
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 7. 右屏看板数据
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-conic-properties", params, {
      studyMode,
      conicType,
    });
  }, [params, studyMode, conicType]);

  // 8. 参数回调处理
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => {
      const next = { ...prev, [key]: value };

      if (presetKey !== "free") {
        setPresetKey("free");
      }

      if (studyMode === "eccentricity") {
        // 离心率模式下 a 和 e 为主控探究量
        if (key === "a") {
          next.b = deriveBFromEccentricity(conicType, value, next.e);
        } else if (key === "e") {
          next.b = deriveBFromEccentricity(conicType, next.a, value);
        }
      } else {
        // 几何性质或焦点三角形模式下 a 和 b 为主控参数
        if (key === "a" || key === "b") {
          if (conicType === "ellipse") {
            // 椭圆高中课标安全契约：严格保证 a > b > 0
            if (key === "a" && next.b >= value) {
              next.b = Math.max(0.5, Number((value - 0.2).toFixed(1)));
            } else if (key === "b" && value >= next.a) {
              next.b = Math.max(0.5, Number((next.a - 0.2).toFixed(1)));
            }
          }
          const calc = calculateConicProperties(
            conicType,
            next.a,
            next.b,
            next.t,
          );
          next.e = calc.e;
        }
      }

      return next;
    });
  };

  // 9. 典型预设切换（按研究模式与曲线类型特化）
  const handlePresetChange = (key: string) => {
    setPresetKey(key);
    if (key === "free") return;

    if (conicType === "ellipse") {
      switch (key) {
        case "featureTriangle": {
          const a = 3;
          const b = 2;
          const calc = calculateConicProperties("ellipse", a, b, Math.PI / 4);
          setParams({ a, b, e: calc.e, t: Math.PI / 4 });
          break;
        }
        case "nearCircle": {
          const a = 3;
          const e = 0.15;
          const b = a * Math.sqrt(1 - e * e);
          setParams({ a, b, e, t: Math.PI / 4 });
          break;
        }
        case "rightCritical": {
          const a = 3;
          const e = Math.SQRT1_2;
          const b = a * Math.sqrt(1 - e * e);
          setParams({ a, b, e, t: Math.PI / 4 });
          break;
        }
        case "flatLimit": {
          const a = 3.5;
          const e = 0.92;
          const b = a * Math.sqrt(1 - e * e);
          setParams({ a, b, e, t: Math.PI / 4 });
          break;
        }
        case "maxAngle": {
          const a = 3;
          const b = 2;
          const calc = calculateConicProperties("ellipse", a, b, Math.PI / 2);
          setParams({ a, b, e: calc.e, t: Math.PI / 2 });
          break;
        }
        case "rightTriangle": {
          const a = 3;
          const e = Math.SQRT1_2;
          const b = a * Math.sqrt(1 - e * e);
          setParams({ a, b, e, t: Math.PI / 2 });
          break;
        }
        case "latusRectum": {
          const a = 3;
          const b = 2;
          const c = Math.sqrt(a * a - b * b);
          const t = Math.acos(c / a);
          const e = c / a;
          setParams({ a, b, e, t });
          break;
        }
        default:
          break;
      }
    } else {
      // 双曲线
      switch (key) {
        case "equilateral": {
          const a = 2.5;
          const b = 2.5;
          const calc = calculateConicProperties("hyperbola", a, b, 0.6);
          setParams({ a, b, e: calc.e, t: 0.6 });
          break;
        }
        case "wideAngle": {
          const a = 2;
          const e = 2.0;
          const b = a * Math.sqrt(e * e - 1);
          setParams({ a, b, e, t: 0.5 });
          break;
        }
        case "narrowAngle": {
          const a = 3;
          const e = 1.15;
          const b = a * Math.sqrt(e * e - 1);
          setParams({ a, b, e, t: 0.6 });
          break;
        }
        case "rightTriangle": {
          const a = 2.5;
          const b = 2;
          const c = Math.sqrt(a * a + b * b);
          const t = Math.atan(b / c);
          const calc = calculateConicProperties("hyperbola", a, b, t);
          setParams({ a, b, e: calc.e, t });
          break;
        }
        case "latusRectum": {
          const a = 2.5;
          const b = 2;
          const c = Math.sqrt(a * a + b * b);
          const t = Math.acos(a / c);
          const calc = calculateConicProperties("hyperbola", a, b, t);
          setParams({ a, b, e: calc.e, t });
          break;
        }
        case "vertexLimit": {
          const a = 2.5;
          const b = 2;
          const calc = calculateConicProperties("hyperbola", a, b, 0.05);
          setParams({ a, b, e: calc.e, t: 0.05 });
          break;
        }
        default:
          break;
      }
    }
  };

  // 10. 重置参数
  const handleReset = () => {
    setPresetKey("free");
    setParams({
      a: defaultParams.a,
      b: defaultParams.b,
      e: defaultParams.e,
      t: defaultParams.t,
    });
  };

  // 11. 切换圆锥曲线类型 handler
  const handleConicTypeChange = (newType: ConicType) => {
    setConicType(newType);
    setPresetKey("free");
    setParams((prev) => {
      let nextB = prev.b;
      if (newType === "ellipse" && prev.b >= prev.a) {
        nextB = Math.max(0.5, Number((prev.a - 0.5).toFixed(1)));
      }
      const calc = calculateConicProperties(newType, prev.a, nextB, prev.t);
      return {
        ...prev,
        b: nextB,
        e: calc.e,
      };
    });
  };

  // 12. 典型预设选项（按 studyMode 和 conicType 精准分流）
  const presetItems = useMemo(() => {
    const isEllipse = conicType === "ellipse";

    if (studyMode === "basicProperties") {
      if (isEllipse) {
        return [
          { key: "free", label: "自由探究", description: "任意半轴参数" },
          {
            key: "featureTriangle",
            label: "特征直角三角形",
            description: "三边长为 c, b, a",
          },
          {
            key: "latusRectum",
            label: "通径垂直端点",
            description: "过焦点垂直于长轴",
          },
        ];
      }
      return [
        { key: "free", label: "自由探究", description: "任意半轴参数" },
        {
          key: "equilateral",
          label: "等轴双曲线",
          description: "实虚轴相等 a = b",
        },
        {
          key: "latusRectum",
          label: "通径垂直端点",
          description: "过焦点垂直于实轴",
        },
      ];
    }

    if (studyMode === "eccentricity") {
      if (isEllipse) {
        return [
          { key: "free", label: "自由探究", description: "任意离心率" },
          {
            key: "nearCircle",
            label: "近圆退化极限",
            description: "e 趋向于 0，b 趋向于 a",
          },
          {
            key: "rightCritical",
            label: "直角三角形临界",
            description: "e = √2/2，c = b",
          },
          {
            key: "flatLimit",
            label: "高扁平极限",
            description: "e 趋向于 1，b 趋向于 0",
          },
        ];
      }
      return [
        { key: "free", label: "自由探究", description: "任意离心率" },
        {
          key: "equilateral",
          label: "等轴双曲线",
          description: "e = √2，渐近线互相垂直",
        },
        {
          key: "wideAngle",
          label: "广角渐近构型",
          description: "e = 2，渐近线夹角 120°",
        },
        {
          key: "narrowAngle",
          label: "狭角渐近构型",
          description: "e = 1.15，渐近线夹角约 60°",
        },
      ];
    }

    // focusTriangle 模式
    if (isEllipse) {
      return [
        { key: "free", label: "自由探究", description: "自由拖拽动点 P" },
        {
          key: "maxAngle",
          label: "短轴端点最大角",
          description: "tan(θ/2) = c/b 取得最大值",
        },
        {
          key: "rightTriangle",
          label: "直角焦点三角形",
          description: "顶角为直角 θ = 90°",
        },
        {
          key: "latusRectum",
          label: "通径垂直三角形",
          description: "过焦点垂直弦三角形",
        },
      ];
    }
    return [
      { key: "free", label: "自由探究", description: "自由拖拽动点 P" },
      {
        key: "rightTriangle",
        label: "直角焦点三角形",
        description: "顶角为直角 θ = 90°, S = b²",
      },
      {
        key: "latusRectum",
        label: "通径垂直三角形",
        description: "过焦点垂直弦三角形",
      },
      {
        key: "vertexLimit",
        label: "顶点极限平角",
        description: "P 趋近顶点，θ 趋向于 180°",
      },
    ];
  }, [conicType, studyMode]);

  // 13. 左屏声明式参数配置按 activeMode 与学科约束过滤
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    let activeKeys: string[] = [];
    if (studyMode === "basicProperties") {
      activeKeys = ["a", "b", "t"];
    } else if (studyMode === "eccentricity") {
      activeKeys = ["a", "e", "t"];
    } else {
      activeKeys = ["a", "b", "t"];
    }

    const ellipseMarks = [
      {
        value: 0.15,
        label: "近圆",
        labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{e \\to 0}`,
      },
      {
        value: 0.707,
        label: "直角临界",
        labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{e = \\frac{\\sqrt{2}}{2}}`,
      },
    ];
    const hyperbolaMarks = [
      {
        value: 1.414,
        label: "等轴",
        labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{e = \\sqrt{2}}`,
      },
      {
        value: 2.0,
        label: "广角",
        labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{e = 2}`,
      },
    ];

    return activeKeys
      .filter((key) => key in paramMeta)
      .map((key) => {
        const meta = paramMeta[key];
        const isA = key === "a";
        const isB = key === "b";
        const isE = key === "e";

        let label = meta.label;
        let labelFormula = meta.labelFormula;
        if (isA) {
          label = conicType === "ellipse" ? "长半轴 a" : "实半轴 a";
          labelFormula = `\\text{${conicType === "ellipse" ? "长半轴 " : "实半轴 "}}\\color{${MATH_COLORS.paramPrimary}}{a}`;
        } else if (isB) {
          label = conicType === "ellipse" ? "短半轴 b" : "虚半轴 b";
          labelFormula = `\\text{${conicType === "ellipse" ? "短半轴 " : "虚半轴 "}}\\color{${MATH_COLORS.paramSecondary}}{b}`;
        } else if (isE) {
          label = "离心率 e";
          labelFormula = `\\text{离心率 }\\color{${MATH_COLORS.primary}}{e}`;
        } else if (key === "t") {
          label = "动点位置角 t";
          labelFormula = "\\text{动点角 }\\theta_P";
        }

        const maxVal =
          isB && conicType === "ellipse"
            ? Math.max(0.6, Number((params.a - 0.1).toFixed(1)))
            : isE
              ? conicType === "ellipse"
                ? 0.98
                : 2.8
              : meta.max;

        return {
          key,
          label,
          labelFormula,
          value:
            (params as Record<string, number>)[key] ?? meta.defaultValue ?? 0,
          min: isE ? (conicType === "ellipse" ? 0.05 : 1.05) : meta.min,
          max: maxVal,
          step: meta.step ?? 0.1,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: isE
            ? conicType === "ellipse"
              ? ellipseMarks
              : hyperbolaMarks
            : meta.marks,
        };
      });
  }, [params, studyMode, conicType]);

  // 左屏教学提示与题设导引（带入具体方程与核心高考设问）
  const tipConfig = useMemo(() => {
    const isEllipse = conicType === "ellipse";
    const aVal = params.a.toFixed(1);
    const bVal = params.b.toFixed(1);
    const a2 = (params.a * params.a).toFixed(1);
    const b2 = (params.b * params.b).toFixed(1);

    if (presetKey !== "free") {
      if (presetKey === "featureTriangle") {
        return {
          variant: "primary" as const,
          badge: "课标核心 · 特征直角三角形",
          condition: `椭圆标准方程中，半焦距 $c$、短半轴 $b$ 与长半轴 $a$ 构成以 $a$ 为斜边的直角三角形。`,
          question: `如何根据勾股关系 $a^2 = b^2 + c^2$ 直观推演焦距与长短半轴的代数联系？`,
        };
      }
      if (presetKey === "rightTriangle") {
        return {
          variant: "warning" as const,
          badge: "高考经典 · 直角焦点三角形",
          condition: isEllipse
            ? `椭圆短轴端点处顶角 $\\angle F_1PF_2 = 90^\\circ$（直角临界构型）。`
            : `双曲线上动点 $P$ 满足焦点三角形顶角 $\\angle F_1PF_2 = 90^\\circ$。`,
          question: isEllipse
            ? `求证：椭圆曲线上存在直角焦点三角形的充要条件为离心率 $e \\ge \\frac{\\sqrt{2}}{2}$。`
            : `如何根据双曲线焦点三角形面积公式，证明直角焦点三角形面积恒为定值 $S = b^2$？`,
        };
      }
      if (presetKey === "maxAngle") {
        return {
          variant: "danger" as const,
          badge: "高考真题 · 顶角极值模型",
          condition: `动点 $P$ 位于椭圆短轴端点 $(0, \\pm ${bVal})$，顶角 $\\theta$ 取得最大值。`,
          question: `如何通过半角公式证明 $\\tan\\frac{\\theta_{\\max}}{2} = \\frac{c}{b}$，并求解顶角最大值？`,
        };
      }
      if (presetKey === "equilateral") {
        return {
          variant: "primary" as const,
          badge: "高考经典 · 等轴双曲线",
          condition: `双曲线实半轴与虚半轴相等 ($a = b = ${aVal}$)，方程为 $x^2 - y^2 = ${(params.a * params.a).toFixed(1)}$。`,
          question: `如何证明等轴双曲线的离心率恒为定值 $\\sqrt{2}$，且渐近线互相垂直？`,
        };
      }
      if (presetKey === "latusRectum") {
        return {
          variant: "primary" as const,
          badge: "教材通法 · 通径垂直端点",
          condition: `过焦点作垂直于${isEllipse ? "长轴" : "实轴"}的弦，交曲线于通径端点。`,
          question: `如何由圆锥曲线方程快速推导出通径长度公式 $L = \\frac{2b^2}{a}$？`,
        };
      }
      if (presetKey === "wideAngle") {
        return {
          variant: "danger" as const,
          badge: "高考经典 · 广角双曲线",
          condition: `双曲线离心率 $e = 2.0$，渐近线方程为 $y = \\pm \\sqrt{3}x$。`,
          question: `如何利用公式 $\\cos\\frac{\\alpha}{2} = \\frac{1}{e}$ 求解两渐近线的夹角 $\\alpha$？`,
        };
      }
      if (presetKey === "narrowAngle") {
        return {
          variant: "info" as const,
          badge: "高考经典 · 狭角双曲线",
          condition: `双曲线离心率 $e = 1.15$，渐近线张角较小。`,
          question: `探究双曲线离心率 $e \\to 1$ 时渐近线与双曲线分支的形态变化趋势。`,
        };
      }
      if (presetKey === "nearCircle") {
        return {
          variant: "info" as const,
          badge: "几何极限 · 近圆退化",
          condition: `椭圆短半轴 $b \\to a$，焦距 $c \\to 0$，离心率 $e = ${params.e.toFixed(3)} \\to 0$。`,
          question: `当离心率 $e \\to 0$ 时，准线方程与焦点坐标呈现怎样的几何极限？`,
        };
      }
      if (presetKey === "flatLimit") {
        return {
          variant: "warning" as const,
          badge: "几何极限 · 扁平线段化",
          condition: `椭圆短半轴 $b \\to 0$，焦距 $c \\to a$，离心率 $e = ${params.e.toFixed(3)} \\to 1$。`,
          question: `当离心率 $e \\to 1$ 时，椭圆图形向线段 $F_1F_2$ 退化的几何实质是什么？`,
        };
      }
      if (presetKey === "vertexLimit") {
        return {
          variant: "warning" as const,
          badge: "极限退化 · 顶点平角",
          condition: `动点 $P$ 沿双曲线右支无限趋近于实轴顶点 $A_2(${aVal}, 0)$。`,
          question: `当动点趋近顶点时，焦点三角形面积与顶角 $\\theta$ 的极限分别为何值？`,
        };
      }
    }

    if (studyMode === "basicProperties") {
      return {
        variant: "info" as const,
        badge: `${isEllipse ? "椭圆" : "双曲线"}标准方程与基本性质`,
        condition: isEllipse
          ? `当前椭圆标准方程为 $\\frac{x^2}{${a2}} + \\frac{y^2}{${b2}} = 1$ ($a=${aVal}, b=${bVal}$)。`
          : `当前双曲线标准方程为 $\\frac{x^2}{${a2}} - \\frac{y^2}{${b2}} = 1$ ($a=${aVal}, b=${bVal}$)。`,
        question: isEllipse
          ? `如何由半轴参数确定焦点坐标、准线方程、顶点坐标与通径长？`
          : `如何由特征矩形确定渐近线方程 $y = \\pm \\frac{b}{a}x$、焦点与通径长？`,
      };
    }
    if (studyMode === "eccentricity") {
      return {
        variant: "primary" as const,
        badge: `${isEllipse ? "椭圆" : "双曲线"}离心率与形态构造`,
        condition: isEllipse
          ? `椭圆长半轴 $a = ${aVal}$，离心率 $e = ${params.e.toFixed(3)}$，短半轴 $b = ${bVal}$。`
          : `双曲线实半轴 $a = ${aVal}$，离心率 $e = ${params.e.toFixed(3)}$，虚半轴 $b = ${bVal}$。`,
        question: isEllipse
          ? `离心率数值的大小如何直观决定椭圆的扁平程度与通径长度？`
          : `离心率数值的大小如何决定渐近线斜率 $k = \\pm\\sqrt{e^2-1}$ 与张角大小？`,
      };
    }
    return {
      variant: "danger" as const,
      badge: `${isEllipse ? "椭圆" : "双曲线"}焦点三角形综合探究`,
      condition: `动点 $P$ 位于曲线右侧，与两焦点 $F_1, F_2$ 形成顶角 $\\theta$ 的焦点三角形。`,
      question: isEllipse
        ? `如何结合第一定义与余弦定理，求解焦点三角形面积 $S = b^2\\tan\\frac{\\theta}{2}$ 与最大顶角？`
        : `如何结合第一定义与余弦定理，推导双曲线焦点三角形面积公式 $S = \\frac{b^2}{\\tan(\\theta/2)}$？`,
    };
  }, [studyMode, conicType, presetKey, params]);

  // 14. 中屏几何图例配置 (SceneLegend)
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    const isEllipse = conicType === "ellipse";
    const legendList: SceneLegendItem[] = [
      {
        colorKey: "primary",
        label: isEllipse ? "椭圆曲线" : "双曲线",
        formula: isEllipse
          ? "\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1"
          : "\\frac{x^2}{a^2} - \\frac{y^2}{b^2} = 1",
        style: "solid",
      },
    ];

    if (!isEllipse) {
      legendList.push({
        colorKey: "paramSecondary",
        label: "渐近线",
        formula: "y = \\pm \\frac{b}{a}x",
        style: "dash",
      });
    }

    if (studyMode === "basicProperties") {
      if (isEllipse) {
        legendList.push({
          colorKey: "paramPrimary",
          label: "特征直角三角形",
          formula: "a^2 = b^2 + c^2",
          style: "dash",
        });
      } else {
        legendList.push({
          colorKey: "paramSecondary",
          label: "特征矩形",
          formula: "2a \\times 2b",
          style: "dash",
        });
        legendList.push({
          colorKey: "paramTertiary",
          label: "外接辅助圆",
          formula: "r = c",
          style: "dash",
        });
      }
    } else if (studyMode === "eccentricity") {
      legendList.push({
        colorKey: "primary",
        label: "准线",
        formula: "x = \\pm \\frac{a^2}{c}",
        style: "dash",
      });
      legendList.push({
        colorKey: "paramPrimary",
        label: "通径",
        formula: "L = \\frac{2b^2}{a}",
        style: "solid",
      });
    } else {
      // focusTriangle legend
      legendList.push({
        colorKey: "paramPrimary",
        label: "焦半径 r₁",
        formula: "|PF_1|",
        style: "solid",
      });
      legendList.push({
        colorKey: "primary",
        label: "焦半径 r₂",
        formula: "|PF_2|",
        style: "solid",
      });
      legendList.push({
        colorKey: "paramTertiary",
        label: "内切圆与内心",
        formula: "I, r_{\\text{in}}",
        style: "dash",
      });
    }

    return legendList;
  }, [conicType, studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="研究模式">
            <TabSwitcher
              tabs={[
                { key: "basicProperties", label: "几何性质" },
                { key: "eccentricity", label: "离心率构造" },
                { key: "focusTriangle", label: "焦点三角形" },
              ]}
              value={studyMode}
              onChange={(key) => {
                setStudyMode(key as typeof studyMode);
                setPresetKey("free");
              }}
            />

            <div className="mt-3">
              <SelectGrid
                items={[
                  {
                    key: "ellipse",
                    label: "椭圆",
                    description: "焦点在 x 轴",
                  },
                  {
                    key: "hyperbola",
                    label: "双曲线",
                    description: "焦点在 x 轴",
                  },
                ]}
                value={conicType}
                onChange={(key) =>
                  handleConicTypeChange(key as typeof conicType)
                }
                columns={2}
              />
            </div>
          </LeftPanelSection>

          <LeftPanelSection title="典型预设">
            <SelectGrid
              items={presetItems}
              value={presetKey}
              onChange={handlePresetChange}
              columns={2}
            />
          </LeftPanelSection>

          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 教学提示与题设导引（置于最底部） */}
          <TipCard
            variant={tipConfig.variant}
            badge={tipConfig.badge}
            condition={tipConfig.condition}
            question={tipConfig.question}
          />
        </LeftPanel>
      }
      center={
        <div className="relative w-full h-full">
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <ConicPropertiesScene
              params={params}
              scale={scale}
              vp={vp}
              fontScale={canvasSize.font}
              studyMode={studyMode}
              conicType={conicType}
              onParamChange={handleParamChange}
            />
          </AnimationSvgCanvas>
          <SceneLegend items={legendItems} title="几何图元图例" />
        </div>
      }
      right={
        <MathPanel
          examAnchor={mathData.examAnchor}
          reasoningSteps={mathData.reasoningSteps}
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title="数学解析看板"
        />
      }
    />
  );
}
