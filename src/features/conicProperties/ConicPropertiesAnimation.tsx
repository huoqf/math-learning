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
import { CANVAS_PRESETS } from "@/theme";
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
    setPresetKey("free");
    setParams((prev) => {
      const next = { ...prev, [key]: value };
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
          // 等轴双曲线: a = b = 3, e = sqrt(2) ≈ 1.414
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
        { key: "free", label: "自由探究", description: "全参数开放" },
        {
          key: "rightTriangle",
          label: "直角焦点三角形",
          formula: "e=\\frac{\\sqrt{2}}{2}",
          description: "短轴顶角90°",
        },
        {
          key: "latusRectum",
          label: "通径垂直端点",
          formula: "L=\\frac{2b^2}{a}",
          description: "最小焦点弦",
        },
        {
          key: "nearCircle",
          label: "近圆退化极限",
          formula: "e \\to 0",
          description: "短半轴b→a",
        },
      ];
    }
    return [
      { key: "free", label: "自由探究", description: "全参数开放" },
      {
        key: "equilateral",
        label: "等轴双曲线",
        formula: "e=\\sqrt{2}",
        description: "渐近线垂直",
      },
      {
        key: "latusRectum",
        label: "通径垂直端点",
        formula: "L=\\frac{2b^2}{a}",
        description: "焦点垂直弦",
      },
      {
        key: "wideAngle",
        label: "广角渐近构型",
        formula: "e=2",
        description: "渐近线夹角120°",
      },
    ];
  }, [conicType]);

  // 13. 左屏声明式参数配置按 activeMode 过滤
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      basicProperties: ["a", "b", "t"],
      eccentricity: ["a", "e", "t"],
      focusTriangle: ["a", "b", "t"],
    };

    const activeKeys = keysByMode[studyMode] ?? Object.keys(paramMeta);

    // 动态 marks 过滤
    const ellipseMarks = [
      { value: 0.01, label: "圆", labelFormula: "e \\to 0" },
      {
        value: 0.707,
        label: "直角焦点三角形",
        labelFormula: "e = \\frac{\\sqrt{2}}{2}",
      },
    ];
    const hyperbolaMarks = [
      {
        value: 1.414,
        label: "等轴双曲线",
        labelFormula: "e = \\sqrt{2}",
      },
      {
        value: 2.0,
        label: "广角双曲线",
        labelFormula: "e = 2",
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
  }, [params, studyMode, conicType]);

  // 左屏教学提示与题设导引（说明初始条件与探究设问）
  const tipConfig = useMemo(() => {
    if (studyMode === "basicProperties") {
      return {
        variant: "info" as const,
        badge: "圆锥曲线基本几何性质",
        condition: `${conicType === "ellipse" ? "椭圆半轴 a, b 满足 a > b > 0，c = √(a²-b²)" : "双曲线半轴 a, b > 0，c = √(a²+b²)"}。`,
        question: "求解焦点坐标、准线方程、通径长度与渐近线。",
      };
    }
    if (studyMode === "eccentricity") {
      return {
        variant: "primary" as const,
        badge: "离心率 e 与几何形态",
        condition: `${conicType === "ellipse" ? "椭圆离心率 e = c/a = √(1 - b²/a²) ∈ (0, 1)" : "双曲线离心率 e = c/a = √(1 + b²/a²) > 1"}。`,
        question: "离心率 e 的大小如何决定曲线的扁平度与张角？",
      };
    }
    return {
      variant: "danger" as const,
      badge: "焦点三角形与面积秒杀",
      condition: "P 为曲线上动点，F₁, F₂ 为左右焦点，顶角 ∠F₁PF₂ = θ。",
      question: "求解焦点三角形 △PF₁F₂ 的面积与顶角最值范围。",
    };
  }, [studyMode, conicType]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection
            title="研究模式"
            subtitle="选择圆锥曲线特征研究范畴"
          >
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
                    formula: "\\frac{x^2}{a^2}+\\frac{y^2}{b^2}=1",
                  },
                  {
                    key: "hyperbola",
                    label: "双曲线",
                    formula: "\\frac{x^2}{a^2}-\\frac{y^2}{b^2}=1",
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

          <LeftPanelSection
            title="典型预设"
            subtitle="高考高频几何构型一键切换"
          >
            <SelectGrid
              items={presetItems}
              value={presetKey}
              onChange={handlePresetChange}
              columns={2}
            />
          </LeftPanelSection>

          <LeftPanelSection
            title="参数调节"
            subtitle="拖动滑块观察图形与量值响应"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 教学提示与题设导引（置于参数调节下方） */}
          <LeftPanelSection title="教学导引与题设背景" compact>
            <TipCard variant={tipConfig.variant}>
              <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1">
                <span>{tipConfig.badge}</span>
              </div>
              <div className="space-y-1 text-[11px] leading-relaxed">
                <div>
                  <span className="font-semibold text-neutral-800">
                    【初始条件】
                  </span>
                  <span className="text-neutral-600">
                    {tipConfig.condition}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-800">
                    【探究设问】
                  </span>
                  <span className="text-neutral-600">{tipConfig.question}</span>
                </div>
              </div>
            </TipCard>
          </LeftPanelSection>
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
