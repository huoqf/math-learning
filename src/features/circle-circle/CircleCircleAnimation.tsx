/**
 * src/features/circle-circle/CircleCircleAnimation.tsx
 * 两圆几何关系与公共弦/公切线动画编排层
 * 严格遵循系统公理：SSOT 纯净领域模型、useScenario 驱动、规范 SceneLegend 与三屏闭环
 */

import { useState, useMemo, useCallback } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  TipCard,
  Toggle,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import {
  SceneLegend,
  type SceneLegendItem,
} from "@/components/Math/SceneLegend";
import { useAnimationViewport, useSceneScale, useScenario } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import {
  CircleCircleScene,
  type CircleLayerOptions,
} from "./components/CircleCircleScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/circleCircle";
import { circleCircleScenarios } from "./meta";

type StudyMode = "position" | "commonChord" | "commonTangent";

export function CircleCircleAnimation() {
  // 1. 研究模式状态 (位置关系 / 公共弦 / 公切线系统)
  const [studyMode, setStudyMode] = useState<StudyMode>("commonChord");

  // 2. 当前典型情景激活 key
  const [activeScenarioId, setActiveScenarioId] =
    useState<string>("intersectStandard");

  // 3. 图层显隐状态
  const [layers, setLayers] = useState<CircleLayerOptions>({
    showCenterLine: true,
    showChord: true,
    showTangents: true,
  });

  // 4. 几何参数状态
  const [params, setParams] = useState<Record<string, number>>(() => ({
    x1: defaultParams.x1,
    y1: defaultParams.y1,
    r1: defaultParams.r1,
    x2: defaultParams.x2,
    y2: defaultParams.y2,
    r2: defaultParams.r2,
  }));

  // 5. useScenario 统一管理情景驱动、TipCard 题设与预设联动
  const { tipProps, selectScenario } = useScenario({
    scenarios: circleCircleScenarios,
    activeKey: activeScenarioId,
    params,
    onParamsChange: (newParams) => {
      setParams((prev) => ({ ...prev, ...newParams }));
    },
  });

  // 6. 视口尺寸 Hook
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 7. 坐标系比例尺 [-7, 7] x [-5, 5]
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

  // 8. 右屏看板数据 (纯领域模型计算与数据装配)
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-circle-circle", params, { studyMode });
  }, [params, studyMode]);

  // 参数滑块更新处理器
  const handleParamChange = useCallback((key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // 场景切换处理器
  const handleScenarioChange = useCallback(
    (scenarioId: string) => {
      setActiveScenarioId(scenarioId);
      selectScenario(scenarioId);
      // 若切换到公共弦专题情景，自动同步对应探究模式
      if (scenarioId === "intersectStandard") {
        setStudyMode("commonChord");
      } else if (scenarioId === "disjoint") {
        setStudyMode("commonTangent");
      }
    },
    [selectScenario],
  );

  // 拖拽圆心 O1
  const handleCenter1Drag = useCallback((nx: number, ny: number) => {
    setParams((prev) => ({
      ...prev,
      x1: Math.round(nx * 10) / 10,
      y1: Math.round(ny * 10) / 10,
    }));
  }, []);

  // 拖拽圆心 O2
  const handleCenter2Drag = useCallback((nx: number, ny: number) => {
    setParams((prev) => ({
      ...prev,
      x2: Math.round(nx * 10) / 10,
      y2: Math.round(ny * 10) / 10,
    }));
  }, []);

  // 分组参数配置：圆 O1 参数
  const circle1Configs = useMemo<ParamConfig[]>(() => {
    const keys = ["x1", "y1", "r1"];
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
  }, [params]);

  // 分组参数配置：圆 O2 参数
  const circle2Configs = useMemo<ParamConfig[]>(() => {
    const keys = ["x2", "y2", "r2"];
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
  }, [params]);

  const allParamConfigs = useMemo<ParamConfig[]>(() => {
    return [...circle1Configs, ...circle2Configs];
  }, [circle1Configs, circle2Configs]);

  // 中屏毛玻璃图例
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    const items: SceneLegendItem[] = [
      {
        color: MATH_COLORS.paramPrimary,
        label: "圆 O₁",
        style: "solid",
      },
      {
        color: MATH_COLORS.paramSecondary,
        label: "圆 O₂",
        style: "solid",
      },
    ];

    if (layers.showCenterLine) {
      items.push({
        color: MATH_COLORS.primary,
        label: "连心线 O₁O₂",
        style: "dashed",
      });
    }

    if (layers.showChord) {
      items.push({
        color: MATH_COLORS.paramTertiary,
        label: "公共弦 / 根轴",
        style: "line",
      });
    }

    if (studyMode === "commonTangent" && layers.showTangents) {
      items.push(
        {
          color: MATH_COLORS.primary,
          label: "外公切线",
          style: "line",
        },
        {
          color: MATH_COLORS.accent,
          label: "内公切线",
          style: "dashed",
        },
      );
    }

    return items;
  }, [layers, studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 探究主题模式选择 (2+1 标准布局) */}
          <LeftPanelSection title="探究主题">
            <SelectGrid<StudyMode>
              items={[
                { key: "commonChord", label: "公共弦专题" },
                { key: "position", label: "位置关系判定" },
                {
                  key: "commonTangent",
                  label: "公切线系统",
                  fullWidth: true,
                },
              ]}
              value={studyMode}
              onChange={(val) => setStudyMode(val)}
              columns={2}
            />
          </LeftPanelSection>

          {/* 2. 高考典型情景 (通过 ScenarioSpec 驱动) */}
          <LeftPanelSection title="高考典型情景">
            <SelectGrid<string>
              items={circleCircleScenarios.map((sc) => ({
                key: sc.id,
                label: sc.name,
              }))}
              value={activeScenarioId}
              onChange={handleScenarioChange}
              columns={2}
            />
          </LeftPanelSection>

          {/* 3. 两圆几何参数调节 */}
          <LeftPanelSection title="两圆几何参数">
            <ParamControl
              params={allParamConfigs}
              onParamChange={handleParamChange}
            />
          </LeftPanelSection>

          {/* 4. 辅助图层开关 (双列紧凑并排) */}
          <LeftPanelSection title="辅助图层">
            <div className="grid grid-cols-2 gap-2">
              <Toggle
                label="连心线 O₁O₂"
                checked={layers.showCenterLine}
                onChange={(checked) =>
                  setLayers((prev) => ({ ...prev, showCenterLine: checked }))
                }
                size="compact"
              />
              <Toggle
                label="公共弦/根轴"
                checked={layers.showChord}
                onChange={(checked) =>
                  setLayers((prev) => ({ ...prev, showChord: checked }))
                }
                size="compact"
              />
              {studyMode === "commonTangent" && (
                <div className="col-span-2">
                  <Toggle
                    label="公切线系统"
                    checked={layers.showTangents}
                    onChange={(checked) =>
                      setLayers((prev) => ({ ...prev, showTangents: checked }))
                    }
                    size="compact"
                  />
                </div>
              )}
            </div>
          </LeftPanelSection>

          {/* 5. 教学提示与题设导引（由 useScenario 统一输出） */}
          {tipProps && (
            <TipCard
              variant={tipProps.variant}
              badge={tipProps.badge}
              condition={tipProps.condition}
              question={tipProps.question}
            />
          )}
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

          {/* 中屏规范图例 (位于右下角，避免遮挡中央几何图形) */}
          <SceneLegend items={legendItems} title="几何图例" />
        </div>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          reasoningSteps={mathData.reasoningSteps}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title="圆与圆几何看板"
        />
      }
    />
  );
}
