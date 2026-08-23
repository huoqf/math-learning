/**
 * src/features/lineEquation/LineEquationAnimation.tsx
 * 直线方程与点到直线的距离 动画编排层
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
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { LineEquationScene } from "./components/LineEquationScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/lineEquation";
import { formatGeneralEquationLatex } from "@/math/lineEquation";

export function LineEquationAnimation() {
  // 1. 研究模式状态
  const [studyMode, setStudyMode] = useState<
    "forms" | "distance" | "relation" | "family"
  >("forms");

  // 2. 直线方程形式子模式状态
  const [form, setForm] = useState<
    "general" | "pointSlope" | "slopeIntercept" | "twoPoint" | "intercept"
  >("general");

  // 2.5 典型预设状态
  const [preset, setPreset] = useState<string>("free");

  // 3. 本地参数状态 (数字键值对)
  const [params, setParams] = useState<Record<string, number>>(() => ({
    A: defaultParams.A,
    B: defaultParams.B,
    C: defaultParams.C,
    k: defaultParams.k,
    x0: defaultParams.x0,
    y0: defaultParams.y0,
    b: defaultParams.b,
    x1: defaultParams.x1,
    y1: defaultParams.y1,
    x2: defaultParams.x2,
    y2: defaultParams.y2,
    a: defaultParams.a,
    A2: defaultParams.A2,
    B2: defaultParams.B2,
    C2: defaultParams.C2,
    lambda: defaultParams.lambda,
  }));

  // 4. 视口尺寸测量
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 5. 坐标系缩放比例尺 [-6, 6], [-4.5, 4.5]
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 6. 组装右屏 MathPanel 看板数据
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-line-equation", params, {
      studyMode,
      form,
    });
  }, [params, studyMode, form]);

  // 参数改变处理器
  const handleParamChange = (key: string, value: number) => {
    setPreset("free");
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 典型预设切换处理器
  const handlePresetChange = (pKey: string) => {
    setPreset(pKey);
    if (pKey === "free") return;

    if (studyMode === "forms") {
      if (pKey === "standard") {
        setParams((p) => ({
          ...p,
          A: 1,
          B: -1,
          C: 1,
          k: 1,
          b: 1,
          x0: 0,
          y0: 1,
          a: -1,
          x1: -1,
          y1: 0,
          x2: 1,
          y2: 2,
        }));
      } else if (pKey === "horizontal") {
        setParams((p) => ({
          ...p,
          A: 0,
          B: 1,
          C: -2,
          k: 0,
          b: 2,
          x0: 0,
          y0: 2,
          a: 3,
          x1: -3,
          y1: 2,
          x2: 3,
          y2: 2,
        }));
      } else if (pKey === "vertical") {
        setParams((p) => ({
          ...p,
          A: 1,
          B: 0,
          C: -3,
          k: 1,
          b: 0,
          x0: 3,
          y0: 0,
          a: 3,
          x1: 3,
          y1: -2,
          x2: 3,
          y2: 3,
        }));
      }
    } else if (studyMode === "distance") {
      if (pKey === "onLine") {
        setParams((p) => ({ ...p, A: 1, B: -1, C: -1, x0: 3, y0: 2 }));
      } else if (pKey === "axisParallel") {
        setParams((p) => ({ ...p, A: 0, B: 1, C: -1, x0: 2, y0: 4 }));
      } else if (pKey === "pythagorean") {
        setParams((p) => ({ ...p, A: 3, B: 4, C: -12, x0: 0, y0: 0 }));
      }
    } else if (studyMode === "relation") {
      if (pKey === "perpendicular") {
        setParams((p) => ({ ...p, A: 1, B: -1, C: 0, A2: 1, B2: 1, C2: -2 }));
      } else if (pKey === "parallel") {
        setParams((p) => ({ ...p, A: 2, B: -1, C: 2, A2: 2, B2: -1, C2: -4 }));
      } else if (pKey === "coincident") {
        setParams((p) => ({ ...p, A: 1, B: 2, C: -3, A2: 1, B2: 2, C2: -3 }));
      }
    } else if (studyMode === "family") {
      if (pKey === "lambda0") {
        setParams((p) => ({ ...p, lambda: 0 }));
      } else if (pKey === "lambda1") {
        setParams((p) => ({ ...p, lambda: 1 }));
      } else if (pKey === "lambdaNeg1") {
        setParams((p) => ({ ...p, lambda: -1 }));
      }
    }
  };

  // 重置参数
  const handleReset = () => {
    setPreset("free");
    setParams({
      A: defaultParams.A,
      B: defaultParams.B,
      C: defaultParams.C,
      k: defaultParams.k,
      x0: defaultParams.x0,
      y0: defaultParams.y0,
      b: defaultParams.b,
      x1: defaultParams.x1,
      y1: defaultParams.y1,
      x2: defaultParams.x2,
      y2: defaultParams.y2,
      a: defaultParams.a,
      A2: defaultParams.A2,
      B2: defaultParams.B2,
      C2: defaultParams.C2,
      lambda: defaultParams.lambda,
    });
  };

  // 7. 声明式参数配置 (按模式与形式进行过滤)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    let keys: string[] = [];

    if (studyMode === "forms") {
      switch (form) {
        case "pointSlope":
          keys = ["k", "x0", "y0"];
          break;
        case "slopeIntercept":
          keys = ["k", "b"];
          break;
        case "twoPoint":
          keys = ["x1", "y1", "x2", "y2"];
          break;
        case "intercept":
          keys = ["a", "b"];
          break;
        case "general":
        default:
          keys = ["A", "B", "C"];
          break;
      }
    } else if (studyMode === "distance") {
      keys = ["A", "B", "C", "x0", "y0"];
    } else if (studyMode === "relation") {
      keys = ["A", "B", "C", "A2", "B2", "C2"];
    } else if (studyMode === "family") {
      keys = ["A", "B", "C", "A2", "B2", "C2", "lambda"];
    }

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
        };
      });
  }, [params, studyMode, form]);

  // 典型预设配置项
  const presetItems = useMemo(() => {
    if (studyMode === "forms") {
      return [
        { key: "free", label: "自由探究", description: "全参数开放" },
        { key: "standard", label: "经典斜截", description: "y = x + 1" },
        { key: "horizontal", label: "水平直线", description: "k = 0" },
        { key: "vertical", label: "铅垂直线", description: "斜率不存在" },
      ];
    } else if (studyMode === "distance") {
      return [
        { key: "free", label: "自由探究", description: "全参数开放" },
        { key: "onLine", label: "点在线上", description: "d = 0" },
        { key: "axisParallel", label: "水平投影", description: "垂直 y 轴" },
        { key: "pythagorean", label: "勾股经典", description: "3-4-5 经典" },
      ];
    } else if (studyMode === "relation") {
      return [
        { key: "free", label: "自由探究", description: "全参数开放" },
        { key: "perpendicular", label: "垂直相交", description: "L1 ⊥ L2" },
        { key: "parallel", label: "平行不重合", description: "L1 ∥ L2" },
        { key: "coincident", label: "两线重合", description: "L1 = L2" },
      ];
    } else {
      return [
        { key: "free", label: "自由探究", description: "全参数开放" },
        { key: "lambda0", label: "基准直线 L₁", description: "λ = 0" },
        { key: "lambda1", label: "对称直线", description: "λ = 1" },
        { key: "lambdaNeg1", label: "差系方向", description: "λ = -1" },
      ];
    }
  }, [studyMode]);

  // 8. 计算中屏悬浮 LaTeX 表达式 (带色彩绑定与规范符号)
  const formulaLatex = useMemo(() => {
    const c1 = MATH_COLORS.paramPrimary; // #EF4444
    const c2 = MATH_COLORS.paramSecondary; // #D97706
    const c3 = MATH_COLORS.paramTertiary; // #059669

    if (studyMode === "forms") {
      switch (form) {
        case "pointSlope": {
          const k = params.k ?? 1;
          const x0 = params.x0 ?? 0;
          const y0 = params.y0 ?? 1;
          const yTerm =
            y0 >= 0
              ? `y - \\color{${c2}}{${y0.toFixed(1)}}`
              : `y + \\color{${c2}}{${Math.abs(y0).toFixed(1)}}`;
          const xTerm =
            x0 >= 0
              ? `x - \\color{${c1}}{${x0.toFixed(1)}}`
              : `x + \\color{${c1}}{${Math.abs(x0).toFixed(1)}}`;
          return `${yTerm} = \\color{${c1}}{${k.toFixed(1)}}(${xTerm})`;
        }
        case "slopeIntercept": {
          const k = params.k ?? 1;
          const b = params.b ?? 1;
          const bTerm =
            b >= 0
              ? `+ \\color{${c2}}{${b.toFixed(1)}}`
              : `- \\color{${c2}}{${Math.abs(b).toFixed(1)}}`;
          return `y = \\color{${c1}}{${k.toFixed(1)}}x ${bTerm}`;
        }
        case "intercept": {
          const a = params.a ?? 3;
          const b = params.b ?? 2;
          return `\\frac{x}{\\color{${c1}}{${a.toFixed(1)}}} + \\frac{y}{\\color{${c2}}{${b.toFixed(1)}}} = 1`;
        }
        case "twoPoint": {
          const x1 = params.x1 ?? -2;
          const y1 = params.y1 ?? -1;
          const x2 = params.x2 ?? 2;
          const y2 = params.y2 ?? 3;
          return `\\frac{y - (${y1.toFixed(1)})}{${(y2 - y1).toFixed(1)}} = \\frac{x - (${x1.toFixed(1)})}{${(x2 - x1).toFixed(1)}}`;
        }
        case "general":
        default:
          return formatGeneralEquationLatex(
            params.A ?? 1,
            params.B ?? -1,
            params.C ?? -1,
            { cA: c1, cB: c2, cC: c3 },
          );
      }
    } else if (studyMode === "distance") {
      const A = params.A ?? 1;
      const B = params.B ?? -1;
      const C = params.C ?? -1;
      const x0 = params.x0 ?? 2;
      const y0 = params.y0 ?? 3;
      const d = Math.abs(A * x0 + B * y0 + C) / Math.hypot(A, B);

      return `d = \\frac{|\\color{${c1}}{${A.toFixed(1)}} \\cdot (${x0.toFixed(1)}) + \\color{${c2}}{${B.toFixed(1)}} \\cdot (${y0.toFixed(1)}) + (${C.toFixed(1)})|}{\\sqrt{\\color{${c1}}{${A.toFixed(1)}}^2 + (\\color{${c2}}{${B.toFixed(1)}})^2}} = \\mathbf{${d.toFixed(2)}}`;
    } else if (studyMode === "relation") {
      const eq1 = formatGeneralEquationLatex(
        params.A ?? 1,
        params.B ?? -1,
        params.C ?? 1,
      );
      const eq2 = formatGeneralEquationLatex(
        params.A2 ?? 1,
        params.B2 ?? 1,
        params.C2 ?? -2,
      );
      return `L_1: ${eq1} \\quad \\text{与} \\quad L_2: ${eq2}`;
    } else {
      const lam = params.lambda ?? 1;
      const A = params.A ?? 1;
      const B = params.B ?? -1;
      const C = params.C ?? 1;
      const A2 = params.A2 ?? 1;
      const B2 = params.B2 ?? 1;
      const C2 = params.C2 ?? -2;
      const famEq = formatGeneralEquationLatex(
        A + lam * A2,
        B + lam * B2,
        C + lam * C2,
      );
      return `L(\\lambda): L_1 + \\color{${c3}}{${lam.toFixed(1)}} L_2 = 0 \\implies ${famEq}`;
    }
  }, [params, studyMode, form]);

  const panelTitleMap = {
    forms: "直线方程形式看板",
    distance: "点到直线距离看板",
    relation: "两条直线位置关系看板",
    family: "直线系方程看板",
  };

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 研究主题模式选择 (2x2 对称网格) */}
          <LeftPanelSection title="研究模式" subtitle="选择解析几何探究主题">
            <SelectGrid
              items={[
                { key: "forms", label: "方程形式", description: "5种表达形式" },
                {
                  key: "distance",
                  label: "点到距离",
                  description: "垂线与距离公式",
                },
                {
                  key: "relation",
                  label: "两线关系",
                  description: "平行/垂直/夹角",
                },
                { key: "family", label: "直线系", description: "定点与旋转系" },
              ]}
              value={studyMode}
              onChange={(key) => {
                setStudyMode(key as typeof studyMode);
                setPreset("free");
              }}
              columns={2}
            />
          </LeftPanelSection>

          {/* 2. 方程形式模式下的二级选择：方程表达形式 */}
          {studyMode === "forms" ? (
            <LeftPanelSection
              title="方程表达形式"
              subtitle="选择五种经典表达形式"
            >
              <SelectGrid
                items={[
                  { key: "general", label: "一般式", formula: "Ax+By+C=0" },
                  { key: "slopeIntercept", label: "斜截式", formula: "y=kx+b" },
                  {
                    key: "pointSlope",
                    label: "点斜式",
                    formula: "y-y_0=k(x-x_0)",
                  },
                  {
                    key: "intercept",
                    label: "截距式",
                    formula: "\\frac{x}{a}+\\frac{y}{b}=1",
                  },
                  {
                    key: "twoPoint",
                    label: "两点式",
                    formula: "\\frac{y-y_1}{y_2-y_1}=\\frac{x-x_1}{x_2-x_1}",
                    fullWidth: true,
                  },
                ]}
                value={form}
                onChange={(k) => setForm(k as typeof form)}
                variant="filled"
              />
            </LeftPanelSection>
          ) : (
            /* 其余模式下的二级选择：典型预设 */
            <LeftPanelSection title="典型预设" subtitle="快速切换典型构型">
              <SelectGrid
                items={presetItems}
                value={preset}
                onChange={handlePresetChange}
                columns={2}
              />
            </LeftPanelSection>
          )}

          {/* 3. 参数调节 Section */}
          <LeftPanelSection title="参数调节" subtitle="拖动滑块改变参数数值">
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
          {/* 直线方程 / 距离公式 KaTeX 悬浮框 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={formulaLatex} mode="inline" />
          </div>

          {/* SVG 几何画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <LineEquationScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              studyMode={studyMode}
              form={form}
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
          title={panelTitleMap[studyMode]}
        />
      }
    />
  );
}
