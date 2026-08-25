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
import { VectorBasisScene } from "./components/VectorBasisScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  defaultParams,
  paramMeta,
  presetsByMode,
} from "@/data/registries/vectorBasis";

type StudyMode = "basisDecomp" | "orthogonal" | "collinear" | "triangleGeom";

export function VectorBasisAnimation() {
  // 教学研究模式
  const [studyMode, setStudyMode] = useState<StudyMode>("basisDecomp");

  // 典型构型预设状态
  const [activePreset, setActivePreset] = useState<string>("free");

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

  // 切换模式处理
  const handleModeChange = (mode: string) => {
    setStudyMode(mode as StudyMode);
    setActivePreset("free");
  };

  // 切换典型预设
  const handlePresetSelect = (presetKey: string) => {
    setActivePreset(presetKey);
    const modePresets = presetsByMode[studyMode] ?? [];
    const targetPreset = modePresets.find((p) => p.key === presetKey);
    if (targetPreset && Object.keys(targetPreset.params).length > 0) {
      setParams((prev) => ({
        ...prev,
        ...targetPreset.params,
      }));
    }
  };

  // 参数更新处理器（拖拽或滑块调节时自动解除锁定，切回自由探究）
  const handleParamChange = (key: string, value: number) => {
    if (activePreset !== "free") {
      setActivePreset("free");
    }
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 重置参数
  const handleReset = () => {
    setActivePreset("free");
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
          group: meta.group,
          marks: meta.marks,
        };
      });
  }, [params, studyMode]);

  // 模式 Tab 选项配置
  const modeTabs = [
    { key: "basisDecomp", label: "任意基底分解" },
    { key: "orthogonal", label: "正交分解与建系" },
    { key: "collinear", label: "三点共线与等和线" },
    { key: "triangleGeom", label: "三角形爪子模型" },
  ];

  // 当前模式的预设选项 (黄金 2x2)
  const currentPresets = presetsByMode[studyMode] ?? [];
  const presetItems = currentPresets.map((p) => ({
    key: p.key,
    label: p.label,
    description: p.description,
  }));

  // 教学引导内容
  const guideInfo: Record<StudyMode, { condition: string; question: string }> =
    {
      basisDecomp: {
        condition: "基底 {e₁, e₂} 不共线（行列式 D ≠ 0）且为非零向量。",
        question:
          "拖动基底端点改变夹角，观察目标向量在斜坐标网格中的分解系数 λ 与 μ 是否唯一确定？",
      },
      orthogonal: {
        condition: "基底 {e₁', e₂'} 模长均为 1 且互相垂直（e₁' ⊥ e₂'）。",
        question:
          "旋转坐标轴角度 θ，观察正交投影系数平方和 x'² + y'² 是否始终等于模长平方 |a|²？",
      },
      collinear: {
        condition: "P = x·OA + y·OB，基准点 O 位于原点。",
        question:
          "当改变权重使 x + y = 1 时，点 P 是否严格落在直线 AB 上？当 x + y > 1 时 P 点向哪侧偏离？",
      },
      triangleGeom: {
        condition: "P 为线段 AB 上的内分点，G 为 △OAB 的重心。",
        question:
          "滑动分点比率 t，观察分点向量 OP 的系数之和是否恒等于 1？重心 G 对应的两系数各为多少？",
      },
    };

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 模式选择区 */}
          <LeftPanelSection
            title="探究专题模式"
            subtitle="探究平面向量基本定理的核心应用视角"
          >
            <TabSwitcher
              tabs={modeTabs}
              value={studyMode}
              onChange={handleModeChange}
            />
          </LeftPanelSection>

          {/* 2. 典型预设区 (2x2) */}
          <LeftPanelSection
            title="典型几何构型"
            subtitle="选择高考经典模型或自由调整参数"
          >
            <SelectGrid
              items={presetItems}
              value={activePreset}
              onChange={handlePresetSelect}
              columns={2}
            />
          </LeftPanelSection>

          {/* 3. 参数调节区 */}
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

          {/* 4. 底部教学引导卡片 */}
          <LeftPanelSection
            title="教学探究引导"
            subtitle="数形结合思考与探究任务"
          >
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs space-y-2">
              <div>
                <span className="font-semibold text-neutral-700">
                  【基础条件】
                </span>
                <p className="text-neutral-600 mt-0.5 leading-relaxed">
                  {guideInfo[studyMode].condition}
                </p>
              </div>
              <div>
                <span className="font-semibold text-blue-700">
                  【探究问题】
                </span>
                <p className="text-neutral-600 mt-0.5 leading-relaxed">
                  {guideInfo[studyMode].question}
                </p>
              </div>
            </div>
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
