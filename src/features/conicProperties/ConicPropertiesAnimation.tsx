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

      if (presetKey === "rightTriangle") {
        if (key === "a") {
          const aVal = value;
          const eVal = Math.SQRT1_2;
          next.a = aVal;
          next.e = eVal;
          next.b = Number((aVal * Math.sqrt(1 - eVal * eVal)).toFixed(2));
          next.t = Math.PI / 2;
        }
      } else if (presetKey === "equilateral") {
        if (key === "a") {
          next.a = value;
          next.b = value;
          next.e = Number(Math.SQRT2.toFixed(2));
        }
      } else if (presetKey === "wideAngle") {
        if (key === "a") {
          next.a = value;
          next.b = Number((value * Math.sqrt(3)).toFixed(2));
          next.e = 2;
        }
      } else {
        setPresetKey("free");
        if (key === "e") {
          next.b = deriveBFromEccentricity(conicType, next.a, value);
        } else if (key === "a" || key === "b") {
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

  // 9. 预设切换
  const handlePresetChange = (key: string) => {
    setPresetKey(key);
    if (conicType === "ellipse") {
      switch (key) {
        case "rightTriangle": {
          // 直角焦点三角形: e = sqrt(2)/2 ≈ 0.707, 顶角在短轴端点 t = PI/2
          const a = 3;
          const e = Math.SQRT1_2;
          const b = a * Math.sqrt(1 - e * e);
          setParams({ a, b, e, t: Math.PI / 2 });
          break;
        }
        case "latusRectum": {
          // 通径端点: x_P = c, t = acos(c/a)
          const a = 3;
          const b = 2;
          const c = Math.sqrt(a * a - b * b);
          const t = Math.acos(c / a);
          const e = c / a;
          setParams({ a, b, e, t });
          break;
        }
        case "nearCircle": {
          // 近圆退化: e -> 0.1, b -> a
          const a = 3;
          const b = 2.9;
          const calc = calculateConicProperties("ellipse", a, b, Math.PI / 4);
          setParams({ a, b, e: calc.e, t: Math.PI / 4 });
          break;
        }
        default:
          break;
      }
    } else {
      switch (key) {
        case "equilateral": {
          // 等轴双曲线: a = b = 2.5, e = sqrt(2) ≈ 1.414
          const a = 2.5;
          const b = 2.5;
          const calc = calculateConicProperties("hyperbola", a, b, 0.6);
          setParams({ a, b, e: calc.e, t: 0.6 });
          break;
        }
        case "latusRectum": {
          // 通径端点: x_P = c, sec(t) = c/a => cos(t) = a/c
          const a = 2.5;
          const b = 2.5;
          const c = Math.sqrt(a * a + b * b);
          const t = Math.acos(a / c);
          const calc = calculateConicProperties("hyperbola", a, b, t);
          setParams({ a, b, e: calc.e, t });
          break;
        }
        case "wideAngle": {
          // 渐近线夹角 120 度: b/a = sqrt(3), e = 2
          const a = 2;
          const bVal = 2 * Math.sqrt(3); // 2 * sqrt(3) ≈ 3.464
          const calc = calculateConicProperties("hyperbola", a, bVal, 0.5);
          setParams({ a, b: bVal, e: calc.e, t: 0.5 });
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
        nextB = prev.a - 0.5;
      }
      const calc = calculateConicProperties(newType, prev.a, nextB, prev.t);
      return {
        ...prev,
        b: nextB,
        e: calc.e,
      };
    });
  };

  // 12. 典型预设选项
  const presetItems = useMemo(() => {
    if (conicType === "ellipse") {
      return [
        { key: "free", label: "自由探究", description: "任意半轴与离心率" },
        {
          key: "rightTriangle",
          label: "直角焦点三角形",
          description: "短轴端点张角为直角",
        },
        {
          key: "latusRectum",
          label: "通径垂直端点",
          description: "过焦点垂直于长轴",
        },
        {
          key: "nearCircle",
          label: "近圆退化极限",
          description: "离心率趋近于零",
        },
      ];
    }
    return [
      { key: "free", label: "自由探究", description: "任意半轴与离心率" },
      {
        key: "equilateral",
        label: "等轴双曲线",
        description: "渐近线互相垂直",
      },
      {
        key: "latusRectum",
        label: "通径垂直端点",
        description: "过焦点垂直于实轴",
      },
      {
        key: "wideAngle",
        label: "广角渐近构型",
        description: "渐近线张角趋于钝角",
      },
    ];
  }, [conicType]);

  // 13. 左屏声明式参数配置按 activeMode 与预设降维过滤
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
        value: 0.01,
        label: "近圆极限",
        labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{e \\to 0}`,
      },
      {
        value: 0.707,
        label: "直角焦点三角形",
        labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{e = \\frac{\\sqrt{2}}{2}}`,
      },
    ];
    const hyperbolaMarks = [
      {
        value: 1.414,
        label: "等轴双曲线",
        labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{e = \\sqrt{2}}`,
      },
      {
        value: 2.0,
        label: "广角双曲线",
        labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{e = 2}`,
      },
    ];

    return activeKeys
      .filter((key) => key in paramMeta)
      .map((key) => {
        const meta = paramMeta[key];
        return {
          key,
          label: meta.label,
          labelFormula: meta.labelFormula,
          value:
            (params as Record<string, number>)[key] ?? meta.defaultValue ?? 0,
          min: key === "e" ? (conicType === "ellipse" ? 0.05 : 1.05) : meta.min,
          max: key === "e" ? (conicType === "ellipse" ? 0.98 : 2.8) : meta.max,
          step: meta.step ?? 0.1,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks:
            key === "e"
              ? conicType === "ellipse"
                ? ellipseMarks
                : hyperbolaMarks
              : meta.marks,
        };
      });
  }, [params, studyMode, conicType, presetKey]);

  // 左屏教学提示与题设导引
  const tipConfig = useMemo(() => {
    const isEllipse = conicType === "ellipse";
    if (presetKey !== "free") {
      if (presetKey === "rightTriangle") {
        return {
          variant: "warning" as const,
          badge: "高考经典 · 直角焦点三角形",
          condition:
            "动点 $P$ 位于椭圆短轴端点，焦点三角形顶角 $\\angle F_1PF_2$ 为直角。",
          question:
            "探究椭圆存在直角焦点三角形对离心率的范围要求，以及焦点三角形的最大面积。",
        };
      }
      if (presetKey === "equilateral") {
        return {
          variant: "primary" as const,
          badge: "高考经典 · 等轴双曲线",
          condition: "双曲线实半轴与虚半轴长度相等，渐近线互相垂直。",
          question:
            "如何证明等轴双曲线的离心率为定值 $\\sqrt{2}$，且两渐近线夹角为直角？",
        };
      }
      if (presetKey === "latusRectum") {
        return {
          variant: "primary" as const,
          badge: "高考经典 · 通径垂直端点",
          condition: `过焦点的弦垂直于${isEllipse ? "椭圆长轴" : "双曲线实轴"}（通径）。`,
          question: "如何由曲线方程快速求解通径长度及通径端点到准线的距离？",
        };
      }
      if (presetKey === "wideAngle") {
        return {
          variant: "danger" as const,
          badge: "高考经典 · 广角双曲线",
          condition: "双曲线离心率增大，渐近线张角趋于钝角。",
          question:
            "探究双曲线开口张角与渐近线斜率随离心率增大的单调变化规律。",
        };
      }
      if (presetKey === "nearCircle") {
        return {
          variant: "info" as const,
          badge: "几何极限 · 近圆退化",
          condition: "短半轴 $b \\to a$，焦距 $c \\to 0$，椭圆趋向于圆周。",
          question: "观察离心率 $e \\to 0$ 时焦点与准线的退化极限。",
        };
      }
    }

    if (studyMode === "basicProperties") {
      return {
        variant: "info" as const,
        badge: `${isEllipse ? "椭圆" : "双曲线"}基本几何性质`,
        condition: `平面内给定${isEllipse ? "椭圆" : "双曲线"}的标准方程与基本半轴参数。`,
        question: "如何由半轴参数确定焦点坐标、准线方程、顶点坐标与对称轴？",
      };
    }
    if (studyMode === "eccentricity") {
      return {
        variant: "primary" as const,
        badge: `${isEllipse ? "椭圆" : "双曲线"}离心率与形态`,
        condition: `${isEllipse ? "椭圆焦距与长半轴比值" : "双曲线焦距与实半轴比值"}为离心率 $e$。`,
        question: isEllipse
          ? "离心率数值的大小如何直观决定椭圆的扁平程度？"
          : "离心率数值的大小如何直观决定双曲线的开口张角与渐近线斜率？",
      };
    }
    return {
      variant: "danger" as const,
      badge: `${isEllipse ? "椭圆" : "双曲线"}焦点三角形`,
      condition: `曲线上动点 $P$ 与两焦点 $F_1, F_2$ 相连构成焦点三角形 $\\triangle PF_1F_2$。`,
      question:
        "如何结合圆锥曲线定义与余弦定理，求解焦点三角形的面积与顶角最值？",
    };
  }, [studyMode, conicType, presetKey]);

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
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title="高考解析几何看板"
        />
      }
    />
  );
}
