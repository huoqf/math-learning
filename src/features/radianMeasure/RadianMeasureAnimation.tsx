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
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { RadianMeasureScene } from "./components/RadianMeasureScene";
import { RADIAN_MEASURE_XRANGE, RADIAN_MEASURE_YRANGE } from "./sceneGeometry";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  defaultParams,
  paramMeta,
  resolveSceneRadius,
} from "@/data/registries/radianMeasure";
import { arcLength, radToDeg, sectorArea } from "@/math/radianMeasure";
import { formatPiFraction, formatPiFractionLatex } from "@/utils/mathFormat";

type StudyMode = "definition" | "conversion" | "arcSector";

export function RadianMeasureAnimation() {
  // 3 大核心研究模式：'definition' | 'conversion' | 'arcSector'
  const [studyMode, setStudyMode] = useState<StudyMode>("definition");

  // 参数状态
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 视口与尺寸测量（正方形画布，容纳半径 r ≤ 3 的整圆）
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.square,
  });

  // 数学坐标系比例尺：与 Scene 的标注几何、契约测试共用同一组区间（单一真源）
  const scale = useSceneScale({
    vp,
    xRange: RADIAN_MEASURE_XRANGE,
    yRange: RADIAN_MEASURE_YRANGE,
  });

  // 数学量看板组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-radian-measure", params, { studyMode });
  }, [params, studyMode]);

  // 参数变更
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 重置参数
  const handleReset = () => {
    setParams({ ...defaultParams });
  };

  // 左屏声明式参数配置（按当前研究模式严格过滤）
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<StudyMode, string[]> = {
      // 定义模式：圆心角为唯一自变量，半径固定为 1 才能凸显「比值与半径无关」的对照
      definition: ["alphaRad"],
      // 互化模式：只关心角的两种读数，半径不参与换算
      conversion: ["alphaRad"],
      // 弧长扇形模式：角与半径都是公式自变量，动参数 alphaRad 置顶、底模 radius 沉底
      arcSector: ["alphaRad", "radius"],
    };

    const keys = keysByMode[studyMode] ?? ["alphaRad"];
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
          step: meta.step ?? 1,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, studyMode]);

  // 悬浮三位一体公式（使用 MATH_COLORS Token 色彩）
  const equationLatex = useMemo(() => {
    const alphaRad = params.alphaRad ?? Math.PI / 3;
    const r = resolveSceneRadius(studyMode, params.radius ?? 1.5);
    // π 的有理倍读数走 SSOT：能写成 kπ/n 就用分数形式，否则退回小数读数
    const alphaText =
      alphaRad > 1e-9 && formatPiFraction(alphaRad) !== null
        ? `${formatPiFractionLatex(alphaRad)}\\ \\text{rad}`
        : `${alphaRad.toFixed(3)}\\ \\text{rad}`;

    if (studyMode === "definition") {
      const l = arcLength(alphaRad, r);
      const ratio = r > 0 ? l / r : 0;
      return `\\color{${MATH_COLORS.paramTertiary}}{l} = ${l.toFixed(3)}, \\quad \\color{${MATH_COLORS.paramSecondary}}{r} = ${r.toFixed(2)}, \\quad \\color{${MATH_COLORS.paramPrimary}}{|\\alpha|} = \\dfrac{l}{r} = ${ratio.toFixed(4)}\\ \\text{rad}`;
    }

    if (studyMode === "conversion") {
      const alphaDeg = radToDeg(alphaRad);
      return `\\pi\\ \\text{rad} = 180^{\\circ} \\implies \\color{${MATH_COLORS.paramPrimary}}{\\alpha} = ${alphaRad.toFixed(4)}\\ \\text{rad} = ${alphaDeg.toFixed(2)}^{\\circ}`;
    }

    const l = arcLength(alphaRad, r);
    const area = sectorArea(alphaRad, r);
    return `\\color{${MATH_COLORS.paramTertiary}}{l} = |\\alpha| r = ${l.toFixed(4)}, \\quad \\color{${MATH_COLORS.sequenceHighlight}}{S} = \\dfrac{1}{2}|\\alpha| r^{2} = ${area.toFixed(4)} \\quad (\\alpha = ${alphaText})`;
  }, [studyMode, params.alphaRad, params.radius]);

  // 标题
  const panelTitle = useMemo(() => {
    if (studyMode === "definition") return "弧度定义与比值不变性看板";
    if (studyMode === "conversion") return "角度制与弧度制互化看板";
    return "弧长与扇形面积公式看板";
  }, [studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择 Section */}
          <LeftPanelSection title="研究模式">
            <SelectGrid
              items={[
                {
                  key: "definition",
                  label: "弧度定义",
                  description: "弧长与半径之比",
                },
                {
                  key: "conversion",
                  label: "度弧互化",
                  description: "π rad = 180°",
                },
                {
                  key: "arcSector",
                  label: "弧长面积",
                  description: "弧长与扇形面积公式",
                },
              ]}
              value={studyMode}
              onChange={(k) => {
                setStudyMode(k as StudyMode);
              }}
              variant="outline"
              columns={1}
            />
          </LeftPanelSection>

          {/* 统一声明式参数调节 Section（内置 marks 快捷点击跳转） */}
          <LeftPanelSection title="参数控制">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 教学启发引导卡片（置于底部辅助区） */}
          <TipCard
            badge={
              studyMode === "definition"
                ? "基础定义 · 弧长与半径之比"
                : studyMode === "conversion"
                  ? "两套度量 · 度与弧度的换算"
                  : "公式推导 · 弧长与扇形面积"
            }
            condition={
              studyMode === "definition"
                ? "圆心 $O$ 处的角 $\\alpha$ 所对圆弧长为 $l$，所在圆半径为 $r$，虚线弧为「弧长恰等于 $r$」的 $1\\text{ rad}$ 参照。"
                : studyMode === "conversion"
                  ? "半圆的弧长为 $\\pi r$，所对圆心角为 $180^\\circ$，这一基准等式同时定义了 $1\\text{ rad}$ 与 $1^\\circ$ 的换算比例。"
                  : "半径为 $r$、圆心角为 $\\alpha$ 的扇形，边界由两条半径与一段圆弧构成，面积为 $S$。"
            }
            question={
              studyMode === "definition"
                ? "若把半径 $r$ 放大一倍而圆心角 $\\alpha$ 保持不变，弧长 $l$ 与半径 $r$ 的比值会变成多少？由此说明比值 $\\frac{l}{r}$ 能否作为与半径无关的角的统一度量？"
                : studyMode === "conversion"
                  ? "$1\\text{ rad}$ 与 $1^\\circ$ 哪一个更大？把圆心角分别按乘 $\\frac{\\pi}{180}$ 与乘 $\\frac{180}{\\pi}$ 两个方向换算，验证两次结果能否回到原值？"
                  : "扇形周长由哪几段线构成？把弧长 $l$ 看作「曲边底」，面积公式 $S = \\frac{1}{2}lr$ 与三角形面积公式在结构上有什么相同之处？"
            }
          />
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 三位一体 LaTeX 公式悬浮窗口 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm max-w-[90%] overflow-x-auto">
            <KatexFormula formula={equationLatex} mode="inline" />
          </div>

          {/* SVG 自适应画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <RadianMeasureScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              studyMode={studyMode}
            />
          </AnimationSvgCanvas>
        </div>
      }
      right={<MathPanel {...mathData} title={panelTitle} />}
    />
  );
}
