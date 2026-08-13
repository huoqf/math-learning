import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  LeftPanel,
  LeftPanelSection,
  TabSwitcher,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { VectorBasisScene } from "./components/VectorBasisScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/vectorBasis";

type StudyMode = "basisDecomp" | "orthogonal" | "collinear" | "triangleGeom";

export function VectorBasisAnimation() {
  // 教学研究模式
  const [studyMode, setStudyMode] = useState<StudyMode>("basisDecomp");

  // 参数状态
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 视口尺寸测量 (CANVAS_PRESETS.full)
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 坐标系比例尺范围 X [-6, 6]，Y [-4.5, 4.5]
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 右屏 MathPanel 看板数据组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-vector-basis", params, {
      studyMode,
    });
  }, [params, studyMode]);

  // 参数更新处理器
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

  // 按研究模式过滤左屏参数配置
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<StudyMode, string[]> = {
      basisDecomp: ["e1x", "e1y", "e2x", "e2y", "ax", "ay"],
      orthogonal: ["thetaDeg", "ax", "ay"],
      collinear: ["e1x", "e1y", "e2x", "e2y", "xCoeff", "yCoeff"],
      triangleGeom: ["e1x", "e1y", "e2x", "e2y", "ratioT"],
    };

    const keys = keysByMode[studyMode] ?? Object.keys(paramMeta);

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
  }, [params, studyMode]);

  // 模式 Tab 选项配置
  const modeTabs = [
    { key: "basisDecomp", label: "任意基底分解" },
    { key: "orthogonal", label: "正交分解与建系" },
    { key: "collinear", label: "三点共线与等系数线" },
    { key: "triangleGeom", label: "三角形几何应用" },
  ];

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择区 */}
          <LeftPanelSection
            title="研究模式"
            subtitle="探究平面向量基本定理的核心视角"
          >
            <TabSwitcher
              tabs={modeTabs}
              value={studyMode}
              onChange={(val) => setStudyMode(val as StudyMode)}
            />
          </LeftPanelSection>

          {/* 参数调节区 */}
          <LeftPanelSection
            title="基底与向量控制"
            subtitle="拖动滑块或中屏控制点实时改变几何坐标"
          >
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
          <VectorBasisScene
            params={{
              e1x: params.e1x ?? defaultParams.e1x,
              e1y: params.e1y ?? defaultParams.e1y,
              e2x: params.e2x ?? defaultParams.e2x,
              e2y: params.e2y ?? defaultParams.e2y,
              ax: params.ax ?? defaultParams.ax,
              ay: params.ay ?? defaultParams.ay,
              thetaDeg: params.thetaDeg ?? defaultParams.thetaDeg,
              xCoeff: params.xCoeff ?? defaultParams.xCoeff,
              yCoeff: params.yCoeff ?? defaultParams.yCoeff,
              ratioT: params.ratioT ?? defaultParams.ratioT,
            }}
            scale={scale}
            vp={vp}
            onParamChange={handleParamChange}
            fontScale={canvasSize.font}
            studyMode={studyMode}
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
          title="向量基底分解看板"
        />
      }
    />
  );
}
