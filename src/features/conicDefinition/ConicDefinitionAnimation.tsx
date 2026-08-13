import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  LeftPanel,
  LeftPanelSection,
  TabSwitcher,
  SelectGrid,
  KatexFormula,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { ConicDefinitionScene } from "./components/ConicDefinitionScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/conicDefinition";

export function ConicDefinitionAnimation() {
  // 研究模式: 'firstDef' (第一定义) | 'unifiedDef' (统一定义 e) | 'locusGen' (动圆/几何生成)
  const [studyMode, setStudyMode] = useState<
    "firstDef" | "unifiedDef" | "locusGen"
  >("firstDef");

  // 圆锥曲线子类型: 'ellipse' | 'hyperbola' | 'parabola'
  const [conicType, setConicType] = useState<
    "ellipse" | "hyperbola" | "parabola"
  >("ellipse");

  // 参数状态
  const [params, setParams] = useState({
    a: defaultParams.a as number,
    c: defaultParams.c as number,
    e: defaultParams.e as number,
    p: defaultParams.p as number,
    theta: defaultParams.theta as number,
  });

  // 视口尺寸测量与 Hook
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 数学坐标系比例尺: X [-6, 6], Y [-4.5, 4.5]
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 右屏看板数据组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-conic-definition", params, {
      studyMode,
      conicType,
    });
  }, [params, studyMode, conicType]);

  // 参数更新
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 参数重置
  const handleReset = () => {
    setParams({
      a: defaultParams.a,
      c: defaultParams.c,
      e: defaultParams.e,
      p: defaultParams.p,
      theta: defaultParams.theta,
    });
  };

  // 左屏声明式参数过滤 (根据 activeMode 过滤)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      firstDef: conicType === "parabola" ? ["p", "theta"] : ["a", "c", "theta"],
      unifiedDef: ["e", "p", "theta"],
      locusGen: ["a", "c", "theta"],
    };

    const activeKeys = keysByMode[studyMode] ?? Object.keys(paramMeta);

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
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 0.1,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, studyMode, conicType]);

  // 三位一体参数 LaTeX 渲染
  const latexFormula = useMemo(() => {
    const c1 = MATH_COLORS.paramPrimary;
    const c2 = MATH_COLORS.paramSecondary;
    if (studyMode === "firstDef") {
      if (conicType === "ellipse") {
        return `|PF_1| + |PF_2| = 2\\color{${c1}}{a} = ${(2 * params.a).toFixed(1)}`;
      } else if (conicType === "hyperbola") {
        return `||PF_1| - |PF_2|| = 2\\color{${c1}}{a} = ${(2 * params.a).toFixed(1)}`;
      } else {
        return `|PF| = d_l \\quad (\\color{${c2}}{p} = ${params.p.toFixed(1)})`;
      }
    } else if (studyMode === "unifiedDef") {
      return `\\frac{d_F}{d_l} = \\color{${c1}}{e} = ${params.e.toFixed(2)}`;
    } else {
      return `|MF_1| \\pm |MF_2| = 2\\color{${c1}}{a}`;
    }
  }, [studyMode, conicType, params]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection
            title="定义与研究模式"
            subtitle="选择圆锥曲线与定义视角"
          >
            <TabSwitcher
              tabs={[
                { key: "firstDef", label: "第一定义" },
                { key: "unifiedDef", label: "统一定义(e)" },
                { key: "locusGen", label: "动圆生成法" },
              ]}
              value={studyMode}
              onChange={(key) => setStudyMode(key as typeof studyMode)}
            />

            {studyMode !== "unifiedDef" && (
              <div className="mt-3">
                <SelectGrid
                  items={[
                    { key: "ellipse", label: "椭圆", formula: "PF_1+PF_2=2a" },
                    {
                      key: "hyperbola",
                      label: "双曲线",
                      formula: "|PF_1-PF_2|=2a",
                    },
                    ...(studyMode === "firstDef"
                      ? [
                          {
                            key: "parabola",
                            label: "抛物线",
                            formula: "PF=d_l",
                          },
                        ]
                      : []),
                  ]}
                  value={conicType}
                  onChange={(key) => setConicType(key as typeof conicType)}
                  columns={2}
                />
              </div>
            )}

            <div className="mt-3 p-2 bg-neutral-50 rounded border border-neutral-200 text-center">
              <KatexFormula formula={latexFormula} className="text-sm" />
            </div>
          </LeftPanelSection>

          <LeftPanelSection title="参数调节" subtitle="拖动滑块联动图形变化">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <AnimationSvgCanvas
          containerRef={containerRef}
          transform={vp.transform}
        >
          <ConicDefinitionScene
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
          title="圆锥曲线定义与轨迹看板"
        />
      }
    />
  );
}
