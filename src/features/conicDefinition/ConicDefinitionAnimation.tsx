/**
 * src/features/conicDefinition/ConicDefinitionAnimation.tsx
 * 高中数学圆锥曲线定义与特征实验室
 * 严格遵循项目规范：
 * - 仅聚焦高考核心两大范式：第一定义 (和/差/准线) 与 统一定义 (离心率 e 焦准比法)
 * - 左屏纯净声明式控制，杜绝冗余嵌套与杂乱线条
 * - 中屏纯净 SVG 画布，零多余虚线干扰
 * - 右屏标准 MathPanel 数据看板
 */

import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  LeftPanel,
  LeftPanelSection,
  TabSwitcher,
  SelectGrid,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { ConicDefinitionScene } from "./components/ConicDefinitionScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  defaultParams,
  paramMeta,
  conicPresetsByMode,
  firstDefPresetsByType,
} from "@/data/registries/conicDefinition";

export function ConicDefinitionAnimation() {
  // 研究模式: 'firstDef' (第一定义) | 'unifiedDef' (统一定义 e)
  const [studyMode, setStudyMode] = useState<"firstDef" | "unifiedDef">(
    "firstDef",
  );

  // 圆锥曲线子类型 (仅在第一定义下展开): 'ellipse' | 'hyperbola' | 'parabola'
  const [conicType, setConicType] = useState<
    "ellipse" | "hyperbola" | "parabola"
  >("ellipse");

  // 典型预设 key (默认 'free')
  const [activePreset, setActivePreset] = useState<string>("free");

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

  // 当前模式的预设列表
  const currentPresets = useMemo(() => {
    if (studyMode === "firstDef") {
      return firstDefPresetsByType[conicType] || [];
    }
    return conicPresetsByMode[studyMode] || [];
  }, [studyMode, conicType]);

  // 右屏看板数据组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-conic-definition", params, {
      studyMode,
      conicType,
    });
  }, [params, studyMode, conicType]);

  // 参数更新 (当手动修改参数或拖拽时，自动切回 free)
  const handleParamChange = (key: string, value: number) => {
    setActivePreset("free");
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 典型预设切换
  const handlePresetSelect = (presetKey: string) => {
    setActivePreset(presetKey);
    const target = currentPresets.find((p) => p.key === presetKey);
    if (target) {
      if (target.conicType) {
        setConicType(target.conicType);
      }
      setParams((prev) => ({
        ...prev,
        ...target.params,
      }));
    }
  };

  // 模式切换
  const handleModeChange = (modeKey: string) => {
    const newMode = modeKey as typeof studyMode;
    setStudyMode(newMode);
    setActivePreset("free");
  };

  // 参数重置
  const handleReset = () => {
    setActivePreset("free");
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

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection
            title="定义与研究模式"
            subtitle="选择圆锥曲线核心定义视角"
          >
            <TabSwitcher
              tabs={[
                { key: "firstDef", label: "第一定义 (距离和差)" },
                { key: "unifiedDef", label: "统一定义 (离心率e)" },
              ]}
              value={studyMode}
              onChange={handleModeChange}
            />

            {/* 仅在第一定义下展示曲线类型切换 */}
            {studyMode === "firstDef" && (
              <div className="mt-3">
                <SelectGrid
                  items={[
                    { key: "ellipse", label: "椭圆" },
                    { key: "hyperbola", label: "双曲线" },
                    { key: "parabola", label: "抛物线" },
                  ]}
                  value={conicType}
                  onChange={(key) => {
                    const newType = key as typeof conicType;
                    setConicType(newType);
                    setActivePreset("free");
                    if (newType === "ellipse" && params.a <= params.c) {
                      setParams((prev) => ({ ...prev, a: 3.0, c: 2.0 }));
                    } else if (
                      newType === "hyperbola" &&
                      params.c <= params.a
                    ) {
                      setParams((prev) => ({ ...prev, a: 2.0, c: 3.0 }));
                    }
                  }}
                  columns={3}
                />
              </div>
            )}
          </LeftPanelSection>

          {/* 黄金 2×2 典型预设 */}
          <LeftPanelSection
            title="典型教学预设"
            subtitle="一键定位特征构型与临界状态"
          >
            <SelectGrid
              items={currentPresets.map((p) => ({
                key: p.key,
                label: p.label,
                formula: p.formula,
                description: p.description,
              }))}
              value={activePreset}
              onChange={handlePresetSelect}
              columns={2}
            />
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
          title="圆锥曲线定义看板"
        />
      }
    />
  );
}
