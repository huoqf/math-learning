import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  ParamPlayBar,
  StepNavigator,
  TabSwitcher,
  SelectGrid,
  TipCard,
  MathPanel,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import { useAnimationViewport, useSceneScale, useParamPlay } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  defaultParams,
  paramMeta,
  getConicLocusAnswerSteps,
} from "@/data/registries/conicLocusInvariants";
import type {
  LocusStudyMode,
  ThirdDefCurveType,
} from "@/math/conicLocusInvariants";
import { ConicLocusInvariantsScene } from "./components/ConicLocusInvariantsScene";

export function ConicLocusInvariantsAnimation() {
  const [studyMode, setStudyMode] = useState<LocusStudyMode>("locusTransfer");
  const [curveType, setCurveType] = useState<ThirdDefCurveType>("ellipse");
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));
  const [answerStep, setAnswerStep] = useState<number>(1);
  const [isStepFocusOn, setIsStepFocusOn] = useState<boolean>(false);

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const scale = useSceneScale({
    vp,
    xRange: [-6.5, 6.5],
    yRange: [-5, 5],
  });

  const answerSteps = useMemo(
    () => getConicLocusAnswerSteps(studyMode),
    [studyMode],
  );

  const isAnglePlay = studyMode !== "fixedPoint";
  const animPlay = useParamPlay({
    min: isAnglePlay ? 15 : -1.5,
    max: isAnglePlay ? 345 : 1.5,
    step: isAnglePlay ? 1 : 0.02,
    mode: isAnglePlay ? "loop" : "bounce",
    getValue: () =>
      isAnglePlay ? (params.thetaDeg ?? 50) : (params.slopeInvM ?? 0.45),
    onChange: (val) => {
      const key = isAnglePlay ? "thetaDeg" : "slopeInvM";
      setParams((prev) => ({ ...prev, [key]: val }));
    },
  });

  const handleParamChange = (key: string, value: number) => {
    animPlay.pause();
    setParams((prev) => {
      const next = { ...prev, [key]: value };
      const enforceEllipse =
        studyMode !== "thirdDefinition" || curveType === "ellipse";
      if (enforceEllipse) {
        if (key === "a" && next.b >= value) {
          next.b = Math.max(0.6, Number((value - 0.2).toFixed(1)));
        } else if (key === "b" && value >= next.a) {
          next.b = Math.max(0.6, Number((next.a - 0.2).toFixed(1)));
        }
      }
      return next;
    });
  };

  const handleReset = () => {
    animPlay.pause();
    setParams({ ...defaultParams });
  };

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keys =
      studyMode === "fixedPoint"
        ? ["slopeInvM", "a", "b"]
        : ["thetaDeg", "a", "b"];
    const enforceEllipse =
      studyMode !== "thirdDefinition" || curveType === "ellipse";
    return keys
      .filter((k) => k in paramMeta)
      .map((k) => {
        const meta = paramMeta[k];
        const maxVal =
          enforceEllipse && k === "b"
            ? Math.max(meta.min, Number(((params.a ?? 3.5) - 0.1).toFixed(1)))
            : meta.max;
        return {
          key: k,
          label: meta.label,
          labelFormula: meta.labelFormula,
          value: Math.min(maxVal, params[k] ?? meta.defaultValue ?? 0),
          min: meta.min,
          max: maxVal,
          step: meta.step,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
          group: meta.group,
        };
      });
  }, [params, studyMode, curveType]);

  const tipConfig = useMemo(() => {
    if (studyMode === "locusTransfer") {
      return {
        variant: "primary" as const,
        badge: "课标母题 · 相关点转移法",
        background:
          "2019人教A版选必一第3.1.1节例2：向已知圆按纵横比例做垂向压缩变换求轨迹。",
        condition:
          "圆 $x_0^2 + y_0^2 = a^2$ 上动点 $P_0(x_0, y_0)$ 保持横坐标不变，纵坐标按比例 $\\frac{b}{a}$ 压缩至 $P(x, y)$。",
        question:
          "如何通过反解 $(x_0, y_0)$ 并代入已知圆方程，证明动点 $P$ 的轨迹是椭圆并确定规范定义域？",
      };
    }
    if (studyMode === "thirdDefinition") {
      return {
        variant: "info" as const,
        badge: "新高考必考 · 第三定义斜率积",
        background:
          "新高考圆锥曲线小题与第(1)问轨迹判定核心规律：中心对称弦两端点与动点连线斜率之积。",
        condition:
          curveType === "ellipse"
            ? "椭圆 $\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1$ 长轴端点 $A(-a,0), B(a,0)$ 与曲面上任意非顶点 $P$ 相连。"
            : "双曲线 $\\frac{x^2}{a^2} - \\frac{y^2}{b^2} = 1$ 实轴端点 $A(-a,0), B(a,0)$ 与曲面上任意非顶点 $P$ 相连。",
        question:
          "求证斜率积 $k_{PA} \\cdot k_{PB}$ 为定值，并求出其与曲线离心率 $e$ 的恒等关系式。",
      };
    }
    return {
      variant: "warning" as const,
      badge: "标内大题通法 · 常规联立过定点",
      background:
        "新高考解答题第18题常规满分方案：不依赖拓展升次巧技，依托对称性猜测定点与常规韦达求解。",
      condition:
        "过椭圆左顶点 $A_0(-a, 0)$ 引两条互相垂直的弦 $A_0A \\perp A_0B$ 交椭圆于 $A, B$ 两点。",
      question:
        "如何采用反设直线 $x = my + n$ 结合普通联立消元证明直线 $AB$ 恒过 $x$ 轴定点 $Q$？",
    };
  }, [studyMode, curveType]);

  const legendItems = useMemo<SceneLegendItem[]>(() => {
    if (studyMode === "locusTransfer") {
      return [
        { colorKey: "paramTertiary", label: "基准圆 P₀", style: "dash" },
        { colorKey: "paramSecondary", label: "纵向压缩投影", style: "dash" },
        { colorKey: "paramPrimary", label: "转移椭圆轨迹 P", style: "solid" },
      ];
    }
    if (studyMode === "thirdDefinition") {
      return [
        { colorKey: "primary", label: "圆锥曲线本体", style: "solid" },
        { colorKey: "paramPrimary", label: "连线 PA", style: "solid" },
        { colorKey: "paramSecondary", label: "连线 PB", style: "solid" },
      ];
    }
    return [
      { colorKey: "primary", label: "椭圆本体", style: "solid" },
      { colorKey: "paramSecondary", label: "动割线 x=my+n", style: "dash" },
      { colorKey: "paramPrimary", label: "直角弦对 A₀A, A₀B", style: "solid" },
    ];
  }, [studyMode]);

  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-conic-locus-invariants", params, {
        studyMode,
        curveType,
      }),
    [params, studyMode, curveType],
  );

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="标内破题通法">
            <SelectGrid
              columns={2}
              items={[
                { key: "locusTransfer", label: "相关点转移法" },
                { key: "thirdDefinition", label: "第三定义斜率积" },
                { key: "fixedPoint", label: "常规联立过定点", fullWidth: true },
              ]}
              value={studyMode}
              onChange={(k) => {
                animPlay.pause();
                setStudyMode(k as LocusStudyMode);
                setAnswerStep(1);
              }}
            />
            {studyMode === "thirdDefinition" && (
              <div className="mt-2">
                <TabSwitcher
                  layout="horizontal"
                  size="compact"
                  tabs={[
                    { key: "ellipse", label: "椭圆" },
                    { key: "hyperbola", label: "双曲线" },
                  ]}
                  value={curveType}
                  onChange={(k) => {
                    animPlay.pause();
                    setCurveType(k as ThirdDefCurveType);
                  }}
                />
              </div>
            )}
          </LeftPanelSection>

          <LeftPanelSection
            title="高考标准解答分步走"
            action={
              <button
                type="button"
                onClick={() => setIsStepFocusOn((prev) => !prev)}
                className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
                  isStepFocusOn
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-neutral-50 text-neutral-500 border-neutral-200 hover:text-neutral-700"
                }`}
              >
                {isStepFocusOn ? "聚光开" : "全图亮"}
              </button>
            }
          >
            <StepNavigator
              steps={answerSteps}
              active={answerStep}
              onChange={(step) => {
                setAnswerStep(step);
                setIsStepFocusOn(true);
              }}
              hint="联动右屏采分步与中屏对应图形分区"
            />
          </LeftPanelSection>

          <LeftPanelSection title="参数调节">
            <div className="mb-2.5">
              <ParamPlayBar
                isPlaying={animPlay.isPlaying}
                onToggle={animPlay.toggle}
                speed={animPlay.speed}
                onSpeedChange={animPlay.setSpeed}
                label={
                  studyMode === "locusTransfer"
                    ? "轨迹压缩同步扫描"
                    : studyMode === "thirdDefinition"
                      ? "动点验证斜率积定值"
                      : "割线绕定点 Q 旋转"
                }
              />
            </div>
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          <div className="mt-auto">
            <TipCard
              variant={tipConfig.variant}
              badge={tipConfig.badge}
              background={tipConfig.background}
              condition={tipConfig.condition}
              question={tipConfig.question}
            />
          </div>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative">
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <ConicLocusInvariantsScene
              params={params}
              scale={scale}
              vp={vp}
              fontScale={canvasSize.font}
              studyMode={studyMode}
              curveType={curveType}
              activeStep={isStepFocusOn ? answerStep : undefined}
              onParamChange={handleParamChange}
            />
          </AnimationSvgCanvas>
          <SceneLegend items={legendItems} position="bottom-right" />
        </div>
      }
      right={
        <MathPanel
          {...mathData}
          title="标内通法破题看板"
          focusStep={isStepFocusOn ? answerStep : undefined}
          focusTarget="reasoning"
        />
      }
    />
  );
}

export default ConicLocusInvariantsAnimation;
