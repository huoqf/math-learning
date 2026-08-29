/**
 * src/features/circle-circle/CircleCircleAnimation.tsx
 * 两圆几何关系与公共弦/公切线动画编排层
 */

import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  KatexFormula,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import {
  CircleCircleScene,
  type CircleLayerOptions,
} from "./components/CircleCircleScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/circleCircle";
import { calculateCircleCircle } from "@/math/circleCircle";

type StudyMode = "position" | "commonChord" | "commonTangent";
type PresetKey = "free" | "outerTangent" | "intersectStandard" | "innerTangent";

export function CircleCircleAnimation() {
  // 1. 研究模式状态
  const [studyMode, setStudyMode] = useState<StudyMode>("position");
  // 2. 典型预设状态
  const [preset, setPreset] = useState<PresetKey>("free");

  // 3. 图层显隐状态
  const [layers, setLayers] = useState<CircleLayerOptions>({
    showCenterLine: true,
    showChord: true,
    showTangents: true,
  });

  // 4. 参数状态
  const [params, setParams] = useState<Record<string, number>>(() => ({
    x1: defaultParams.x1,
    y1: defaultParams.y1,
    r1: defaultParams.r1,
    x2: defaultParams.x2,
    y2: defaultParams.y2,
    r2: defaultParams.r2,
  }));

  // 5. 视口尺寸 Hook
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 6. 坐标系比例尺 [-7, 7] x [-5, 5]
  const scale = useSceneScale({
    vp,
    xRange: [-7, 7],
    yRange: [-5, 5],
  });

  const parsedCircleParams = useMemo(
    () => ({
      x1: params.x1 ?? -1.5,
      y1: params.y1 ?? 0.0,
      r1: params.r1 ?? 2.5,
      x2: params.x2 ?? 2.0,
      y2: params.y2 ?? 0.0,
      r2: params.r2 ?? 2.0,
    }),
    [params],
  );

  // 7. 纯数学解算
  const calcRes = useMemo(
    () => calculateCircleCircle(parsedCircleParams),
    [parsedCircleParams],
  );

  // 8. 右屏看板数据
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-circle-circle", params, { studyMode });
  }, [params, studyMode]);

  // 参数更新处理器
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => {
      const next = {
        ...prev,
        [key]: value,
      };

      if (preset === "outerTangent") {
        const x1 = key === "x1" ? value : next.x1;
        const r1 = key === "r1" ? value : next.r1;
        const r2 = key === "r2" ? value : next.r2;
        next.x2 = Number((x1 + r1 + r2).toFixed(1));
        next.y1 = 0;
        next.y2 = 0;
      } else if (preset === "innerTangent") {
        const x1 = key === "x1" ? value : next.x1;
        const r1 = key === "r1" ? value : next.r1;
        const r2 = key === "r2" ? value : next.r2;
        next.x2 = Number((x1 + Math.max(0.1, r1 - r2)).toFixed(1));
        next.y1 = 0;
        next.y2 = 0;
      } else {
        setPreset("free");
      }

      return next;
    });
  };

  // 典型预设切换
  const handlePresetChange = (pKey: PresetKey) => {
    setPreset(pKey);
    if (pKey === "free") return;

    if (pKey === "outerTangent") {
      setParams({ x1: -2, y1: 0, r1: 2, x2: 2, y2: 0, r2: 2 });
    } else if (pKey === "intersectStandard") {
      setParams({ x1: -1.5, y1: 0, r1: 2.5, x2: 1.5, y2: 0, r2: 2.0 });
    } else if (pKey === "innerTangent") {
      setParams({ x1: -0.5, y1: 0, r1: 3.5, x2: 1.5, y2: 0, r2: 1.5 });
    }
  };

  // 拖拽圆心 O1
  const handleCenter1Drag = (nx: number, ny: number) => {
    setPreset("free");
    setParams((prev) => ({
      ...prev,
      x1: Math.round(nx * 10) / 10,
      y1: Math.round(ny * 10) / 10,
    }));
  };

  // 拖拽圆心 O2
  const handleCenter2Drag = (nx: number, ny: number) => {
    setPreset("free");
    setParams((prev) => ({
      ...prev,
      x2: Math.round(nx * 10) / 10,
      y2: Math.round(ny * 10) / 10,
    }));
  };

  // 分组参数配置：圆 O1 参数（圆心坐标与半径对象化分组，预设下锁定降维）
  const circle1Configs = useMemo<ParamConfig[]>(() => {
    const isTangetPreset =
      preset === "outerTangent" || preset === "innerTangent";
    const keys = isTangetPreset ? ["r1"] : ["x1", "y1", "r1"];
    return keys
      .filter((key) => key in paramMeta)
      .map((key) => {
        const meta = paramMeta[key];
        const group = key === "r1" ? "圆 O₁ 半径" : "圆心 O₁(x₁, y₁) 坐标";
        return {
          key,
          label: meta.label,
          labelFormula: meta.labelFormula,
          value: params[key] ?? meta.defaultValue ?? 0,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 0.1,
          group,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, preset]);

  // 分组参数配置：圆 O2 参数（圆心坐标与半径对象化分组，预设下锁定降维）
  const circle2Configs = useMemo<ParamConfig[]>(() => {
    const isTangetPreset =
      preset === "outerTangent" || preset === "innerTangent";
    const keys = isTangetPreset ? ["r2"] : ["x2", "y2", "r2"];
    return keys
      .filter((key) => key in paramMeta)
      .map((key) => {
        const meta = paramMeta[key];
        const group = key === "r2" ? "圆 O₂ 半径" : "圆心 O₂(x₂, y₂) 坐标";
        return {
          key,
          label: meta.label,
          labelFormula: meta.labelFormula,
          value: params[key] ?? meta.defaultValue ?? 0,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 0.1,
          group,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, preset]);

  // 左屏教学提示与题设导引（说明初始条件与探究设问）
  const tipConfig = useMemo(() => {
    if (preset === "outerTangent") {
      return {
        variant: "primary" as const,
        badge: "高考经典 · 典型外切",
        condition: "两圆处于外离与相交之间的外切临界状态。",
        question:
          "两圆外切时圆心距与两半径满足什么等量关系？此时共有几条公切线？",
      };
    }
    if (preset === "intersectStandard") {
      return {
        variant: "warning" as const,
        badge: "高考经典 · 相交公共弦",
        condition: "两圆相交于两个不同的实数交点，存在公共弦。",
        question: "如何由两圆方程快速求解公共弦所在直线方程及相交弦长？",
      };
    }
    if (preset === "innerTangent") {
      return {
        variant: "danger" as const,
        badge: "高考经典 · 典型内切",
        condition: "两圆处于相交与内含之间的内切临界状态。",
        question:
          "两圆内切时圆心距与两半径满足什么等量关系？此时共有几条公切线？",
      };
    }

    if (studyMode === "position") {
      return {
        variant: "info" as const,
        badge: "两圆位置关系判定",
        condition: "平面内给定两已知圆的圆心坐标与半径。",
        question: "如何通过圆心距与两圆半径的和、差关系，判定五种位置关系？",
      };
    }
    if (studyMode === "commonChord") {
      return {
        variant: "warning" as const,
        badge: "公共弦与根轴方程",
        condition: "两相交圆的方程已知，交点连线构成公共弦。",
        question: "如何通过两圆二次方程作差消元，快速导出公共弦直线方程？",
      };
    }
    return {
      variant: "danger" as const,
      badge: "公切线长与几何系统",
      condition: "两圆在不同位置关系下的外公切线与内公切线系统。",
      question: "如何构造直角梯形与勾股定理，求解外公切线与内公切线的切线长？",
    };
  }, [studyMode, preset]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 探究主题模式选择 (2+1 标准布局) */}
          <LeftPanelSection title="探究主题">
            <SelectGrid<StudyMode>
              items={[
                {
                  key: "position",
                  label: "位置关系",
                  description: "5种关系判定",
                },
                {
                  key: "commonChord",
                  label: "公共弦",
                  description: "方程相减与弦长",
                },
                {
                  key: "commonTangent",
                  label: "公切线系统",
                  description: "内外公切线判定与方程",
                  fullWidth: true,
                },
              ]}
              value={studyMode}
              onChange={(val) => setStudyMode(val)}
              columns={2}
            />
          </LeftPanelSection>

          {/* 2. 典型预设 (黄金 2x2 对称网格) */}
          <LeftPanelSection title="典型预设">
            <SelectGrid<PresetKey>
              items={[
                {
                  key: "free",
                  label: "自由探究",
                  description: "全参数开放",
                },
                {
                  key: "outerTangent",
                  label: "典型外切",
                  description: "d = r1 + r2",
                },
                {
                  key: "intersectStandard",
                  label: "相交弦长",
                  description: "公共弦垂径",
                },
                {
                  key: "innerTangent",
                  label: "经典内切",
                  description: "d = |r1 - r2|",
                },
              ]}
              value={preset}
              onChange={handlePresetChange}
              columns={2}
            />
          </LeftPanelSection>

          {/* 3. 圆 O1 参数调节（红） */}
          <LeftPanelSection
            title={
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: MATH_COLORS.paramPrimary }}
                />
                <span>圆 O₁ 参数 (x₁, y₁, r₁)</span>
              </div>
            }
          >
            <ParamControl
              params={circle1Configs}
              onParamChange={handleParamChange}
            />
          </LeftPanelSection>

          {/* 4. 圆 O2 参数调节（橙） */}
          <LeftPanelSection
            title={
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: MATH_COLORS.paramSecondary }}
                />
                <span>圆 O₂ 参数 (x₂, y₂, r₂)</span>
              </div>
            }
          >
            <ParamControl
              params={circle2Configs}
              onParamChange={handleParamChange}
            />
          </LeftPanelSection>

          {/* 5. 辅助图层开关 */}
          <LeftPanelSection title="辅助图层">
            <div className="flex flex-col gap-2 text-xs text-neutral-700">
              <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-neutral-50 cursor-pointer">
                <span>连心线 O₁O₂</span>
                <input
                  type="checkbox"
                  checked={layers.showCenterLine}
                  onChange={(e) =>
                    setLayers((prev) => ({
                      ...prev,
                      showCenterLine: e.target.checked,
                    }))
                  }
                  className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-neutral-50 cursor-pointer">
                <span>公共弦 / 根轴</span>
                <input
                  type="checkbox"
                  checked={layers.showChord}
                  onChange={(e) =>
                    setLayers((prev) => ({
                      ...prev,
                      showChord: e.target.checked,
                    }))
                  }
                  className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                />
              </label>
              {studyMode === "commonTangent" && (
                <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-neutral-50 cursor-pointer">
                  <span>公切线系统</span>
                  <input
                    type="checkbox"
                    checked={layers.showTangents}
                    onChange={(e) =>
                      setLayers((prev) => ({
                        ...prev,
                        showTangents: e.target.checked,
                      }))
                    }
                    className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                  />
                </label>
              )}
            </div>
          </LeftPanelSection>

          {/* 教学提示与题设导引（置于最底部） */}
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
        <div className="w-full h-full relative">
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <CircleCircleScene
              params={parsedCircleParams}
              studyMode={studyMode}
              scale={scale}
              vp={vp}
              fontScale={canvasSize.font}
              layers={layers}
              onCenter1Drag={handleCenter1Drag}
              onCenter2Drag={handleCenter2Drag}
            />
          </AnimationSvgCanvas>

          {/* 悬浮公式指示牌 (中屏上方) */}
          <div className="absolute top-4 left-4 pointer-events-none bg-white/90 backdrop-blur px-3.5 py-2.5 rounded-xl border border-neutral-200 shadow-sm flex flex-col gap-1.5 text-xs">
            <div className="text-neutral-500 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
              <span>两圆实时几何状态：</span>
            </div>
            <div className="flex items-center gap-3 font-semibold text-neutral-800">
              <KatexFormula
                formula={`d = ${calcRes.d.toFixed(2)}, \\quad r_1+r_2 = ${calcRes.sumR.toFixed(2)}, \\quad |r_1-r_2| = ${calcRes.diffR.toFixed(2)}`}
              />
            </div>
            {calcRes.commonChord && studyMode === "commonChord" && (
              <div className="text-emerald-700 font-medium border-t border-neutral-100 pt-1">
                <KatexFormula
                  formula={`\\text{公共弦/根轴: } ${calcRes.commonChord.line.latex}`}
                />
              </div>
            )}
          </div>
        </div>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title="圆与圆几何看板"
        />
      }
    />
  );
}
