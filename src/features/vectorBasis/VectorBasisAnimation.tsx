import { useState, useMemo, useCallback } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
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

  // 切换典型预设（支持参数约束与模型聚焦）
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

  // 参数更新处理器
  const handleParamChange = useCallback((key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // 画布拖拽回调（自动回归 free 模式保证完全探索）
  const handleDragParamChange = useCallback(
    (key: string, value: number) => {
      if (activePreset !== "free") {
        setActivePreset("free");
      }
      setParams((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [activePreset],
  );

  // 重置参数
  const handleReset = () => {
    setActivePreset("free");
    setParams({ ...defaultParams });
  };

  // 按研究模式过滤左屏参数配置（实现真正降维与分组）
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<StudyMode, string[]> = {
      basisDecomp: ["ax", "ay", "e1x", "e1y", "e2x", "e2y"],
      orthogonal: ["thetaDeg", "ax", "ay"],
      collinear: ["xCoeff", "yCoeff", "e1x", "e1y", "e2x", "e2y"],
      triangleGeom: ["ratioT", "e1x", "e1y", "e2x", "e2y"],
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
    { key: "triangleGeom", label: "三角形爪子与重心" },
  ];

  // 当前模式的预设选项
  const currentPresets = presetsByMode[studyMode] ?? [];
  const presetItems = currentPresets.map((p) => ({
    key: p.key,
    label: p.label,
    description: p.description,
  }));

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

          {/* 2. 典型预设区 (实现参数降维) */}
          <LeftPanelSection
            title="典型几何构型"
            subtitle="选择高考经典模型或自由探索"
          >
            <SelectGrid
              items={presetItems}
              value={activePreset}
              onChange={handlePresetSelect}
              columns={2}
              variant="filled"
              color="primary"
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

          {/* 4. 底部教学引导卡片 (规范排版，接入 KatexFormula) */}
          <LeftPanelSection
            title="教学探究引导"
            subtitle="数形结合思考与探究任务"
          >
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs space-y-2 text-neutral-600 leading-relaxed">
              {studyMode === "basisDecomp" && (
                <>
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【基础条件】：
                    </span>
                    基底{" "}
                    <KatexFormula
                      formula="\{\vec{e}_1, \vec{e}_2\}"
                      mode="inline"
                    />{" "}
                    不共线（
                    <KatexFormula formula="\det \neq 0" mode="inline" />
                    ）且为非零向量。
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【探究问题】：
                    </span>
                    拖动基底端点改变夹角，观察目标向量在斜坐标网格中的分解系数{" "}
                    <KatexFormula formula="\lambda" mode="inline" /> 与{" "}
                    <KatexFormula formula="\mu" mode="inline" /> 是否唯一确定？
                  </div>
                </>
              )}
              {studyMode === "orthogonal" && (
                <>
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【基础条件】：
                    </span>
                    基底{" "}
                    <KatexFormula
                      formula="\{\vec{e}_1', \vec{e}_2'\}"
                      mode="inline"
                    />{" "}
                    模长均为 1 且互相垂直（
                    <KatexFormula
                      formula="\vec{e}_1' \perp \vec{e}_2'"
                      mode="inline"
                    />
                    ）。
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【探究问题】：
                    </span>
                    旋转坐标轴角度{" "}
                    <KatexFormula formula="\theta" mode="inline" />
                    ，观察正交投影系数平方和{" "}
                    <KatexFormula formula="x'^2 + y'^2" mode="inline" />{" "}
                    是否始终等于模长平方{" "}
                    <KatexFormula formula="|\vec{a}|^2" mode="inline" />？
                  </div>
                </>
              )}
              {studyMode === "collinear" && (
                <>
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【基础条件】：
                    </span>
                    <KatexFormula
                      formula="\vec{OP} = x\vec{OA} + y\vec{OB}"
                      mode="inline"
                    />
                    ，基准点 <KatexFormula formula="O" mode="inline" />{" "}
                    位于原点。
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【探究问题】：
                    </span>
                    当改变权重使{" "}
                    <KatexFormula formula="x + y = 1" mode="inline" /> 时，点{" "}
                    <KatexFormula formula="P" mode="inline" /> 是否严格落在直线{" "}
                    <KatexFormula formula="AB" mode="inline" /> 上？观察等和线族{" "}
                    <KatexFormula formula="x+y=k" mode="inline" />{" "}
                    平行移动规律。
                  </div>
                </>
              )}
              {studyMode === "triangleGeom" && (
                <>
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【基础条件】：
                    </span>
                    <KatexFormula formula="P" mode="inline" /> 为线段{" "}
                    <KatexFormula formula="AB" mode="inline" /> 上的内分点，
                    <KatexFormula formula="G" mode="inline" /> 为{" "}
                    <KatexFormula formula="\triangle OAB" mode="inline" />{" "}
                    的重心。
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【探究问题】：
                    </span>
                    滑动分点比率 <KatexFormula formula="t" mode="inline" />
                    ，观察分点向量{" "}
                    <KatexFormula formula="\vec{OP}" mode="inline" />{" "}
                    的系数之和是否恒等于 1？重心{" "}
                    <KatexFormula formula="G" mode="inline" />{" "}
                    对应的两系数各为多少？
                  </div>
                </>
              )}
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
            onParamChange={handleDragParamChange}
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
