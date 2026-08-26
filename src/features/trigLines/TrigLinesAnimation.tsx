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
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { TrigLinesScene } from "./components/TrigLinesScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/trigLines";
import type { TrigInequalityKind } from "./math/trigLines";

export function TrigLinesAnimation() {
  // 3 大核心研究模式：'lines' | 'comparison' | 'inequality'
  const [studyMode, setStudyMode] = useState<
    "lines" | "comparison" | "inequality"
  >("lines");

  // 不等式类型
  const [ineqKind, setIneqKind] = useState<TrigInequalityKind>("sin_gt");

  // 参数状态
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 视口与尺寸测量
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.square,
  });

  // 数学坐标系比例尺：正方形比例尺 [-1.6, 1.6]
  const scale = useSceneScale({
    vp,
    xRange: [-1.6, 1.6],
    yRange: [-1.6, 1.6],
  });

  // 数学量看板组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-trig-lines", params, {
      studyMode,
      ineqKind,
    });
  }, [params, studyMode, ineqKind]);

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

  // 左屏声明式参数配置 (按当前研究模式严格过滤)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      lines: ["alphaDeg"],
      comparison: ["compAlphaDeg"],
      inequality: ["ineqThreshold", "alphaDeg"],
    };

    const keys = keysByMode[studyMode] ?? ["alphaDeg"];
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

  // 动态拼装三位一体公式 (使用 MATH_COLORS Token 色彩)
  const equationLatex = useMemo(() => {
    if (studyMode === "lines") {
      const alpha = params.alphaDeg ?? 45;
      const rad = (alpha * Math.PI) / 180;
      const sinV = Math.sin(rad).toFixed(3);
      const cosV = Math.cos(rad).toFixed(3);
      const isTanDef = Math.abs(Math.cos(rad)) > 1e-7;
      const tanV = isTanDef ? Math.tan(rad).toFixed(3) : "\\text{无意义}";
      return `\\sin\\alpha = \\color{${MATH_COLORS.paramPrimary}}{${sinV}}, \\quad \\cos\\alpha = \\color{${MATH_COLORS.paramSecondary}}{${cosV}}, \\quad \\tan\\alpha = \\color{${MATH_COLORS.paramTertiary}}{${tanV}}`;
    }

    if (studyMode === "comparison") {
      const xDeg = params.compAlphaDeg ?? 40;
      const xRad = (xDeg * Math.PI) / 180;
      const sinV = Math.sin(xRad).toFixed(3);
      const xV = xRad.toFixed(3);
      const tanV = Math.tan(xRad).toFixed(3);
      return `\\color{${MATH_COLORS.paramPrimary}}{S_{\\triangle OMP}} < \\color{${MATH_COLORS.function}}{S_{\\text{扇形}OAP}} < \\color{${MATH_COLORS.paramTertiary}}{S_{\\triangle OAT}} \\implies \\color{${MATH_COLORS.paramPrimary}}{\\sin x} < \\color{${MATH_COLORS.function}}{x} < \\color{${MATH_COLORS.paramTertiary}}{\\tan x} \\quad (${sinV} < ${xV} < ${tanV})`;
    }

    // inequality
    const ineqLabels: Record<TrigInequalityKind, string> = {
      sin_gt: `\\sin x > ${params.ineqThreshold?.toFixed(2)}`,
      sin_lt: `\\sin x < ${params.ineqThreshold?.toFixed(2)}`,
      cos_gt: `\\cos x > ${params.ineqThreshold?.toFixed(2)}`,
      cos_lt: `\\cos x < ${params.ineqThreshold?.toFixed(2)}`,
      tan_gt: `\\tan x > ${params.ineqThreshold?.toFixed(2)}`,
      tan_lt: `\\tan x < ${params.ineqThreshold?.toFixed(2)}`,
    };
    return `\\text{目标不等式：} \\color{${MATH_COLORS.function}}{${ineqLabels[ineqKind]}} \\quad (\\text{测试角 } \\alpha = ${params.alphaDeg}^\\circ)`;
  }, [
    studyMode,
    params.alphaDeg,
    params.compAlphaDeg,
    params.ineqThreshold,
    ineqKind,
  ]);

  // 标题
  const panelTitle = useMemo(() => {
    if (studyMode === "lines") return "三角函数线定义看板";
    if (studyMode === "comparison") return "面积逼近与不等式放缩看板";
    return "单位圆解三角不等式看板";
  }, [studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择 Section */}
          <LeftPanelSection title="研究模式" subtitle="选择教学研讨视角">
            <TabSwitcher
              tabs={[
                { key: "lines", label: "定义演化" },
                { key: "comparison", label: "面积放缩" },
                { key: "inequality", label: "三角不等式" },
              ]}
              value={studyMode}
              onChange={(k) => {
                setStudyMode(k as typeof studyMode);
              }}
            />
          </LeftPanelSection>

          {/* 模式 1：函数线显隐开关（紧凑 2 列） */}
          {studyMode === "lines" && (
            <LeftPanelSection
              title="函数线显隐"
              subtitle="选择展示的三大有向线段"
            >
              <SelectGrid
                items={[
                  {
                    key: "all",
                    label: "全部显示",
                  },
                  {
                    key: "sin",
                    label: "正弦线",
                    formula: "\\overrightarrow{MP}",
                  },
                  {
                    key: "cos",
                    label: "余弦线",
                    formula: "\\overrightarrow{OM}",
                  },
                  {
                    key: "tan",
                    label: "正切线",
                    formula: "\\overrightarrow{AT}",
                  },
                ]}
                value={
                  params.showSine && params.showCosine && params.showTangent
                    ? "all"
                    : params.showSine
                      ? "sin"
                      : params.showCosine
                        ? "cos"
                        : "tan"
                }
                onChange={(k) => {
                  if (k === "sin") {
                    handleParamChange("showSine", 1);
                    handleParamChange("showCosine", 0);
                    handleParamChange("showTangent", 0);
                  } else if (k === "cos") {
                    handleParamChange("showSine", 0);
                    handleParamChange("showCosine", 1);
                    handleParamChange("showTangent", 0);
                  } else if (k === "tan") {
                    handleParamChange("showSine", 0);
                    handleParamChange("showCosine", 0);
                    handleParamChange("showTangent", 1);
                  } else {
                    handleParamChange("showSine", 1);
                    handleParamChange("showCosine", 1);
                    handleParamChange("showTangent", 1);
                  }
                }}
                variant="filled"
                color="primary"
                columns={2}
              />
            </LeftPanelSection>
          )}

          {/* 模式 3：不等式类型选择 */}
          {studyMode === "inequality" && (
            <LeftPanelSection
              title="不等式结构"
              subtitle="选择待求解的三角不等式"
            >
              <SelectGrid
                items={[
                  { key: "sin_gt", formula: "\\sin x > c" },
                  { key: "sin_lt", formula: "\\sin x < c" },
                  { key: "cos_gt", formula: "\\cos x > c" },
                  { key: "cos_lt", formula: "\\cos x < c" },
                  { key: "tan_gt", formula: "\\tan x > k" },
                  { key: "tan_lt", formula: "\\tan x < k" },
                ]}
                value={ineqKind}
                onChange={(k) => {
                  setIneqKind(k as TrigInequalityKind);
                }}
                variant="filled"
                columns={2}
              />
            </LeftPanelSection>
          )}

          {/* 统一声明式参数调节 Section（内置 marks 快捷点击跳转） */}
          <LeftPanelSection
            title="参数控制"
            subtitle="拖动滑块或点击刻度快速定位"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 教学启发引导卡片 (置于底部辅助区) */}
          <LeftPanelSection title="教学探究启发" subtitle="数形结合思考引导">
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs text-neutral-600 space-y-2">
              <div>
                <span className="font-semibold text-neutral-800">
                  【基础条件】
                </span>
                {studyMode === "lines" &&
                  " 单位圆半径 r=1，P(cosα, sinα)，过 A(1,0) 作切线交终边于 T。"}
                {studyMode === "comparison" &&
                  " 锐角 x ∈ (0, π/2)，△OMP ⊂ 扇形 OAP ⊂ △OAT。"}
                {studyMode === "inequality" &&
                  " 终边扫过单位圆弧，函数线有向长度需越过基准阈值。"}
              </div>
              <div>
                <span className="font-semibold text-neutral-800">
                  【探究问题】
                </span>
                {studyMode === "lines" &&
                  " 拖拽点 P 观察：当终边进入第二、三象限时，正切线 AT 为何交在反向延长线上？"}
                {studyMode === "comparison" &&
                  " 改变锐角 x，观察三者面积比值如何逼近极限值 1？"}
                {studyMode === "inequality" &&
                  " 观察交点界值与圆弧旋转方向，如何逆时针规范书写解集区间？"}
              </div>
            </div>
          </LeftPanelSection>
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
            <TrigLinesScene
              params={
                params as {
                  alphaDeg: number;
                  compAlphaDeg?: number;
                  ineqThreshold?: number;
                  showSine?: number;
                  showCosine?: number;
                  showTangent?: number;
                  showArc?: number;
                  showAuxTriangle?: number;
                }
              }
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              studyMode={studyMode}
              ineqKind={ineqKind}
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
          title={panelTitle}
        />
      }
    />
  );
}
