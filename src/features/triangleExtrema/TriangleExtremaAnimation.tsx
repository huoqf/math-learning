import { useState, useMemo, useCallback } from "react";
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
import { TriangleExtremaScene } from "./components/TriangleExtremaScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/triangleExtrema";
import {
  solveAngleTransform,
  solveSideIneq,
  solveApollonius,
  solvePolarization,
  radToDeg,
} from "@/math/triangleExtrema";

export function TriangleExtremaAnimation() {
  // 四大解三角形研究模式
  const [studyMode, setStudyMode] = useState<
    "angle-transform" | "side-ineq" | "apollonius" | "polarization"
  >("angle-transform");

  // 典型构型预设状态 (默认自由探究)
  const [preset, setPreset] = useState<string>("free");

  // 三角形形态约束（任意三角形 vs 锐角三角形）
  const [triangleConstraint, setTriangleConstraint] = useState<"any" | "acute">(
    "any",
  );
  const isAcuteOnly = triangleConstraint === "acute";

  // 参数状态
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 视口测量
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 比例尺缩放
  const scale = useSceneScale({
    vp,
    xRange: [-9, 9],
    yRange: [-6, 7],
  });

  // 模式切换
  const handleModeChange = (modeKey: string) => {
    setStudyMode(modeKey as typeof studyMode);
    setPreset("free");
  };

  // 预设切换
  const handlePresetChange = (presetKey: string) => {
    setPreset(presetKey);
    if (presetKey === "free") return;

    if (studyMode === "angle-transform") {
      if (presetKey === "equilateral_max")
        setParams((p) => ({ ...p, angleA: 60, sideA: 6, angleB: 60 }));
      if (presetKey === "rt_edge")
        setParams((p) => ({ ...p, angleA: 60, sideA: 6, angleB: 90 }));
      if (presetKey === "obtuse_flat")
        setParams((p) => ({ ...p, angleA: 120, sideA: 6, angleB: 30 }));
    } else if (studyMode === "side-ineq") {
      if (presetKey === "equilateral_area")
        setParams((p) => ({ ...p, angleA: 60, sideA: 6, sideB: 6 }));
      if (presetKey === "rt_pythagorean")
        setParams((p) => ({ ...p, angleA: 90, sideA: 5, sideB: 3 }));
      if (presetKey === "narrow_flat")
        setParams((p) => ({ ...p, angleA: 30, sideA: 4, sideB: 7 }));
    } else if (studyMode === "apollonius") {
      if (presetKey === "top_max")
        setParams((p) => ({ ...p, sideA: 6, ratioK: 2, thetaDeg: 90 }));
      if (presetKey === "left_sharp")
        setParams((p) => ({ ...p, sideA: 6, ratioK: 2, thetaDeg: 45 }));
      if (presetKey === "ratio_large")
        setParams((p) => ({ ...p, sideA: 6, ratioK: 3, thetaDeg: 90 }));
    } else if (studyMode === "polarization") {
      if (presetKey === "vertical_max")
        setParams((p) => ({ ...p, sideA: 6, medianM: 5, thetaDeg: 90 }));
      if (presetKey === "slanted_mid")
        setParams((p) => ({ ...p, sideA: 6, medianM: 4.5, thetaDeg: 60 }));
      if (presetKey === "long_median")
        setParams((p) => ({ ...p, sideA: 6, medianM: 7, thetaDeg: 90 }));
    }
  };

  // 典型构型 2x2 预设定义
  const presetItems = useMemo(() => {
    if (studyMode === "angle-transform") {
      return [
        { key: "free", label: "自由探究", description: "全参数开放" },
        {
          key: "equilateral_max",
          label: "等腰最大值",
          description: "B=(180°-A)/2",
        },
        { key: "rt_edge", label: "直角临界点", description: "B=90°边界" },
        {
          key: "obtuse_flat",
          label: "钝角外心构型",
          description: "A=120°广角",
        },
      ];
    }
    if (studyMode === "side-ineq") {
      return [
        { key: "free", label: "自由探究", description: "全参数开放" },
        {
          key: "equilateral_area",
          label: "均值等号",
          description: "b=c 面积最大",
        },
        {
          key: "rt_pythagorean",
          label: "直角勾股",
          description: "A=90°特殊角",
        },
        { key: "narrow_flat", label: "狭长逼近", description: "A=30°极端比例" },
      ];
    }
    if (studyMode === "apollonius") {
      return [
        { key: "free", label: "自由探究", description: "全参数开放" },
        { key: "top_max", label: "圆心正上方", description: "θ=90° 高度最大" },
        { key: "left_sharp", label: "斜角动点", description: "θ=45° 锐角构型" },
        {
          key: "ratio_large",
          label: "大比值 k=3",
          description: "轨迹圆半径缩小",
        },
      ];
    }
    return [
      { key: "free", label: "自由探究", description: "全参数开放" },
      { key: "vertical_max", label: "中线垂直", description: "θ=90° 面积最大" },
      { key: "slanted_mid", label: "斜向中线", description: "θ=60° 典型倾斜" },
      { key: "long_median", label: "长中线模型", description: "m=7 高考大题" },
    ];
  }, [studyMode]);

  // 纯数学状态计算
  const calcState = useMemo(() => {
    switch (studyMode) {
      case "angle-transform":
        return solveAngleTransform(
          params.angleA,
          params.sideA,
          params.angleB,
          isAcuteOnly,
        );
      case "side-ineq":
        return solveSideIneq(
          params.angleA,
          params.sideA,
          params.sideB,
          isAcuteOnly,
        );
      case "apollonius":
        return solveApollonius(params.sideA, params.ratioK, params.thetaDeg);
      case "polarization":
        return solvePolarization(params.sideA, params.medianM, params.thetaDeg);
    }
  }, [studyMode, params, isAcuteOnly]);

  // 数学量看板数据
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-triangle-extrema", params, {
      studyMode,
      calcState,
      isAcuteOnly,
    });
  }, [params, studyMode, calcState, isAcuteOnly]);

  // 参数修改回调
  const handleParamChange = (key: string, value: number) => {
    setPreset("free");
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 重置参数
  const handleReset = () => {
    setPreset("free");
    setParams({ ...defaultParams });
  };

  // 根据模式过滤左屏参数配置
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      "angle-transform": ["angleA", "sideA", "angleB"],
      "side-ineq": ["angleA", "sideA", "sideB"],
      apollonius: ["sideA", "ratioK", "thetaDeg"],
      polarization: ["sideA", "medianM", "thetaDeg"],
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
          group: meta.group,
          value: params[key] ?? meta.defaultValue ?? 0,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 0.1,
          unit: meta.unit,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, studyMode]);

  // 顶点 B 拖拽回调（反向更新角 B 参数）
  const handleDragB = useCallback(
    (mathPos: { x: number; y: number }) => {
      setPreset("free");
      const sideA = params.sideA;
      const dx = mathPos.x - -sideA / 2;
      const dy = mathPos.y;
      if (Math.abs(dy) > 0.1) {
        let angleB = radToDeg(Math.atan2(Math.abs(dy), Math.max(0.1, dx)));
        angleB = Math.min(
          180 - params.angleA - 5,
          Math.max(5, Math.round(angleB)),
        );
        setParams((prev) => ({ ...prev, angleB }));
      }
    },
    [params.sideA, params.angleA],
  );

  // 顶点 A 拖拽回调（反向更新 thetaDeg 或相关参数）
  const handleDragA = useCallback(
    (mathPos: { x: number; y: number }) => {
      setPreset("free");
      if (studyMode === "apollonius") {
        const k = params.ratioK;
        const a = params.sideA;
        const x0 = ((k * k + 1) / (2 * (k * k - 1))) * a;
        const theta = radToDeg(Math.atan2(Math.abs(mathPos.y), mathPos.x - x0));
        setParams((prev) => ({ ...prev, thetaDeg: Math.round(theta) }));
      } else if (studyMode === "polarization") {
        const theta = radToDeg(Math.atan2(Math.abs(mathPos.y), mathPos.x));
        setParams((prev) => ({ ...prev, thetaDeg: Math.round(theta) }));
      }
    },
    [studyMode, params.ratioK, params.sideA],
  );

  // 教学引导与探究提示
  const guidanceInfo = useMemo(() => {
    switch (studyMode) {
      case "angle-transform":
        return {
          condition: "已知对角 A 和对边 a，内角 B 为自变量",
          question:
            "观察顶点 A 在外接圆上滑动时，何时周长 P 与两边和 b+c 达到最大值？开启锐角限制后取值范围如何被截断？",
        };
      case "side-ineq":
        return {
          condition: "已知对角 A 和对边 a，结合余弦定理与均值不等式",
          question:
            "改变边 b 的长短，观察两边积 bc 与面积 S 在何时取得最大值？均值不等式等号成立条件是什么？",
        };
      case "apollonius":
        return {
          condition: "底边 BC=a 固定，动点 A 满足 c/b = k (定比)",
          question:
            "拖拽动点 A 沿阿氏圆轨迹运动，何时三角形面积 S 达到最大值？圆半径与最大高有何对应关系？",
        };
      case "polarization":
        return {
          condition: "底边 BC=a 固定，中线长 ma 为定值",
          question:
            "观察动点 A 沿中线圆旋转时，数量积 向量AB·向量AC 是否恒为定值？何时三角形面积达到最大？",
        };
    }
  }, [studyMode]);

  // 中屏 KaTeX 浮动最值公式展示（遵循铁律4C三位一体色彩绑定，动态Token指令）
  const floatingFormula = useMemo(() => {
    const { extrema, sides, angles } = calcState;
    if (!calcState.isValid) return "";

    const cA = MATH_COLORS.paramPrimary;
    const cB = MATH_COLORS.paramSecondary;
    const cC = MATH_COLORS.paramTertiary;

    if (studyMode === "angle-transform") {
      const prefix = isAcuteOnly ? "\\text{[锐角限制]} \\quad " : "";
      return `${prefix}P = \\color{${cA}}{a} + \\color{${cB}}{b} + \\color{${cC}}{c} = ${extrema.perimeter.toFixed(2)} \\le P_{\\max} = ${extrema.maxPerimeter.toFixed(2)} \\quad (\\text{当 } B = C = ${((180 - angles.A) / 2).toFixed(1)}^\\circ \\text{ 时, } b=c)`;
    }
    if (studyMode === "side-ineq") {
      return `\\color{${cB}}{b} + \\color{${cC}}{c} = ${(sides.b + sides.c).toFixed(2)} \\le \\frac{\\color{${cA}}{a}}{\\sin(A/2)} = ${extrema.maxSideSum.toFixed(2)} \\quad S = ${extrema.area.toFixed(2)} \\le S_{\\max} = ${extrema.maxArea.toFixed(2)}`;
    }
    if (studyMode === "apollonius") {
      return `\\text{阿氏圆轨迹 } h_{\\max} = R_A = ${calcState.apolloniusCircle?.radius.toFixed(2)} \\implies S_{\\max} = \\frac{1}{2}\\color{${cA}}{a} h_{\\max} = ${extrema.maxArea.toFixed(2)}`;
    }
    if (studyMode === "polarization") {
      return `\\vec{AB} \\cdot \\vec{AC} = m_a^2 - \\left(\\frac{\\color{${cA}}{a}}{2}\\right)^2 = ${params.medianM}^2 - ${(params.sideA / 2).toFixed(2)}^2 = ${extrema.dotProduct.toFixed(2)} \\quad (\\text{定值})`;
    }
    return "";
  }, [calcState, studyMode, params, isAcuteOnly]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 核心专题模式 (2x2 网格) */}
          <LeftPanelSection
            title="最值研究模型"
            subtitle="选择高考四大极值与范围母题"
          >
            <SelectGrid
              items={[
                { key: "angle-transform", label: "正弦角化边" },
                { key: "side-ineq", label: "余弦均值式" },
                { key: "apollonius", label: "阿波罗尼斯圆" },
                { key: "polarization", label: "极化恒等式" },
              ]}
              value={studyMode}
              onChange={handleModeChange}
              variant="filled"
              columns={2}
            />
          </LeftPanelSection>

          {/* 2. 典型构型预设 (黄金 2x2 网格) */}
          <LeftPanelSection
            title="典型构型预设"
            subtitle="一键切换高考经典三角形构型"
          >
            <SelectGrid
              items={presetItems}
              value={preset}
              onChange={handlePresetChange}
              variant="outline"
              columns={2}
            />
          </LeftPanelSection>

          {/* 3. 模式 1 和 2 专属：锐角三角形约束条件切换 */}
          {(studyMode === "angle-transform" || studyMode === "side-ineq") && (
            <LeftPanelSection
              title="三角形形态限定"
              subtitle="探究锐角条件下的定义域截断"
            >
              <SelectGrid
                items={[
                  {
                    key: "any",
                    label: "任意三角形",
                    description: "内角 ∈ (0, 180°)",
                  },
                  {
                    key: "acute",
                    label: "锐角三角形",
                    description: "三内角均 < 90° (高考常考)",
                  },
                ]}
                value={triangleConstraint}
                onChange={(val) =>
                  setTriangleConstraint(val as "any" | "acute")
                }
                columns={2}
              />
            </LeftPanelSection>
          )}

          {/* 4. 参数调节 Section (支持 group 聚合) */}
          <LeftPanelSection
            title="参数调节"
            subtitle="拖动滑块或图形顶点探究变化"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 5. 底部教学引导卡片 */}
          <LeftPanelSection title="探究指引" subtitle="数形结合思考">
            <div className="bg-neutral-50 rounded-lg p-3 text-xs space-y-2 border border-neutral-200/60">
              <div>
                <span className="font-semibold text-neutral-700">
                  【基础条件】
                </span>
                <p className="text-neutral-600 mt-0.5">
                  {guidanceInfo.condition}
                </p>
              </div>
              <div>
                <span className="font-semibold text-blue-600">
                  【探究问题】
                </span>
                <p className="text-neutral-600 mt-0.5">
                  {guidanceInfo.question}
                </p>
              </div>
            </div>
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative bg-white overflow-hidden">
          {/* 顶端悬浮动态 LaTeX 公式面板 */}
          {floatingFormula && (
            <div className="absolute top-3 left-4 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-neutral-200 shadow-sm text-sm">
              <KatexFormula formula={floatingFormula} />
            </div>
          )}

          {/* SVG 动画画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <TriangleExtremaScene
              state={calcState}
              studyMode={studyMode}
              scale={scale}
              vp={vp}
              fontScale={canvasSize.font}
              isAcuteOnly={isAcuteOnly}
              onDragVertexA={handleDragA}
              onDragVertexB={handleDragB}
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
          title="解三角形最值看板"
        />
      }
    />
  );
}
