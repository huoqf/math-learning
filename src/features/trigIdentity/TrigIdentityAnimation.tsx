import { useState, useMemo } from "react";
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
import { TrigIdentityScene } from "./components/TrigIdentityScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/trigIdentity";
import {
  calculateTrigIdentity,
  calculateInduction,
  calculateUniversalInduction,
  calculateComplementaryModel,
  type FormulaType,
  type IdentitySubMode,
  type InductionSubMode,
} from "./math/trigIdentity";

export function TrigIdentityAnimation() {
  // 主研究模式：'identity' | 'induction'
  const [studyMode, setStudyMode] = useState<"identity" | "induction">(
    "identity",
  );

  // 同角子模式：'geometry' | 'known_one' | 'homogeneous'
  const [identitySubMode, setIdentitySubMode] =
    useState<IdentitySubMode>("geometry");

  // 诱导子模式：'standard6' | 'universal_k' | 'complementary'
  const [inductionSubMode, setInductionSubMode] =
    useState<InductionSubMode>("standard6");

  // 诱导公式 6 组分类
  const [formulaType, setFormulaType] = useState<FormulaType>("pi_plus");

  // 本地参数状态
  const [params, setParams] = useState<Record<string, number>>(() => ({
    alphaDeg: defaultParams.alphaDeg,
    homoA: defaultParams.homoA,
    homoB: defaultParams.homoB,
    homoC: defaultParams.homoC,
    homoD: defaultParams.homoD,
    quadA: defaultParams.quadA,
    quadB: defaultParams.quadB,
    quadC: defaultParams.quadC,
    universalK: defaultParams.universalK,
    universalSign: defaultParams.universalSign,
    thetaDeg: defaultParams.thetaDeg,
  }));

  // 视口尺寸测量与防抖
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 单位圆与直角坐标系比例尺：数学范围 X [-2.0, 2.0]，Y [-1.5, 1.5]
  const scale = useSceneScale({
    vp,
    xRange: [-2.0, 2.0],
    yRange: [-1.5, 1.5],
  });

  // 数学量看板数据组算
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-trig-identity", params, {
      studyMode,
      identitySubMode,
      inductionSubMode,
      formulaType,
    });
  }, [params, studyMode, identitySubMode, inductionSubMode, formulaType]);

  // 参数更新处理器
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 重置参数
  const handleReset = () => {
    setParams({
      alphaDeg: defaultParams.alphaDeg,
      homoA: defaultParams.homoA,
      homoB: defaultParams.homoB,
      homoC: defaultParams.homoC,
      homoD: defaultParams.homoD,
      quadA: defaultParams.quadA,
      quadB: defaultParams.quadB,
      quadC: defaultParams.quadC,
      universalK: defaultParams.universalK,
      universalSign: defaultParams.universalSign,
      thetaDeg: defaultParams.thetaDeg,
    });
  };

  // 按模式精确过滤参数配置
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    let activeKeys: string[] = ["alphaDeg"];

    if (studyMode === "identity") {
      if (identitySubMode === "geometry") {
        activeKeys = ["alphaDeg"];
      } else if (identitySubMode === "known_one") {
        activeKeys = ["alphaDeg"];
      } else if (identitySubMode === "homogeneous") {
        activeKeys = [
          "alphaDeg",
          "homoA",
          "homoB",
          "homoC",
          "homoD",
          "quadA",
          "quadB",
          "quadC",
        ];
      }
    } else {
      // induction 模式
      if (inductionSubMode === "standard6") {
        activeKeys = ["alphaDeg"];
      } else if (inductionSubMode === "universal_k") {
        activeKeys = ["alphaDeg", "universalK", "universalSign"];
      } else if (inductionSubMode === "complementary") {
        activeKeys = ["alphaDeg", "thetaDeg"];
      }
    }

    return activeKeys
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
          group: meta.group,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, studyMode, identitySubMode, inductionSubMode]);

  // 顶端悬浮 KaTeX 公式
  const headerFormulaLatex = useMemo(() => {
    const alphaVal = params.alphaDeg ?? 30;
    if (studyMode === "identity") {
      if (identitySubMode === "geometry") {
        return `\\sin^2\\alpha + \\cos^2\\alpha = 1 \\quad \\vert \\quad \\tan\\alpha = \\frac{\\sin\\alpha}{\\cos\\alpha}`;
      } else if (identitySubMode === "known_one") {
        const trig = calculateTrigIdentity(alphaVal);
        return `S = \\sin\\alpha+\\cos\\alpha = ${trig.sumSC.toFixed(2)} \\quad \\implies \\quad P = \\sin\\alpha\\cos\\alpha = \\frac{S^2-1}{2} = ${trig.prodSC.toFixed(2)}`;
      } else {
        const trig = calculateTrigIdentity(
          alphaVal,
          params.homoA,
          params.homoB,
          params.homoC,
          params.homoD,
          params.quadA,
          params.quadB,
          params.quadC,
        );
        const homoValText =
          trig.isHomoDefined && trig.homoVal !== undefined
            ? trig.homoVal.toFixed(2)
            : "\\text{无意义}";
        return `${trig.homoFormulaTex} = ${trig.homoStepTex} = ${homoValText}`;
      }
    } else {
      // induction 模式
      if (inductionSubMode === "standard6") {
        const ind = calculateInduction(alphaVal, formulaType);
        return `${ind.formulaTitle}: \\quad ${ind.sinFormulaTex} \\quad \\vert \\quad ${ind.cosFormulaTex}`;
      } else if (inductionSubMode === "universal_k") {
        const u = calculateUniversalInduction(
          alphaVal,
          params.universalK ?? 1,
          (params.universalSign ?? 1) as 1 | -1,
        );
        return `${u.formulaTitle}: \\quad ${u.sinFormulaTex} \\quad \\vert \\quad ${u.cosFormulaTex}`;
      } else {
        const c = calculateComplementaryModel(alphaVal, params.thetaDeg ?? 30);
        return `\\cos\\left[\\frac{\\pi}{2} - (\\alpha + ${c.thetaDeg}^\\circ)\\right] = \\sin(\\alpha + ${c.thetaDeg}^\\circ)`;
      }
    }
  }, [
    studyMode,
    identitySubMode,
    inductionSubMode,
    formulaType,
    params.alphaDeg,
    params.homoA,
    params.homoB,
    params.homoC,
    params.homoD,
    params.quadA,
    params.quadB,
    params.quadC,
    params.universalK,
    params.universalSign,
    params.thetaDeg,
  ]);

  // 看板标题
  const panelTitle = useMemo(() => {
    if (studyMode === "identity") {
      if (identitySubMode === "geometry") return "同角三角函数线与基本关系";
      if (identitySubMode === "known_one") return "知一求二与符号决策看板";
      return "新高考齐次式化切与代换看板";
    } else {
      if (inductionSubMode === "standard6") return "诱导公式6大组动态对称看板";
      if (inductionSubMode === "universal_k")
        return "万能法则奇变偶不变推演看板";
      return "新高考配角与互余互补看板";
    }
  }, [studyMode, identitySubMode, inductionSubMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 主研究模式 TabSwitcher 顶层轻量切换 */}
          <LeftPanelSection title="主研究模式" subtitle="选择探索的专题体系">
            <TabSwitcher
              tabs={[
                { key: "identity", label: "同角基本关系" },
                { key: "induction", label: "诱导公式对称" },
              ]}
              value={studyMode}
              onChange={(k) => {
                setStudyMode(k as "identity" | "induction");
              }}
              layout="horizontal"
            />
          </LeftPanelSection>

          {/* 同角子模式切换 */}
          {studyMode === "identity" && (
            <LeftPanelSection
              title="同角探究专题"
              subtitle="选择同角三角函数核心模型"
            >
              <SelectGrid
                items={[
                  {
                    key: "geometry",
                    label: "几何三角线",
                    description: "正弦/余弦/正切线",
                  },
                  {
                    key: "known_one",
                    label: "知一求二",
                    description: "和/差/积与象限",
                  },
                  {
                    key: "homogeneous",
                    label: "齐次化切",
                    description: "弦化切与“1”的代换",
                  },
                ]}
                value={identitySubMode}
                onChange={(k) => {
                  setIdentitySubMode(k as IdentitySubMode);
                }}
                variant="outline"
                color="primary"
                columns={1}
              />
            </LeftPanelSection>
          )}

          {/* 诱导公式子模式切换 */}
          {studyMode === "induction" && (
            <LeftPanelSection
              title="诱导探究专题"
              subtitle="选择诱导公式探索视角"
            >
              <SelectGrid
                items={[
                  {
                    key: "standard6",
                    label: "高考常用6大组",
                    description: "对称几何图形联动",
                  },
                  {
                    key: "universal_k",
                    label: "万能法则 (k·π/2)",
                    description: "奇变偶不变三步法",
                  },
                  {
                    key: "complementary",
                    label: "互余互补配角模型",
                    description: "新高考角变换技巧",
                  },
                ]}
                value={inductionSubMode}
                onChange={(k) => {
                  setInductionSubMode(k as InductionSubMode);
                }}
                variant="outline"
                color="primary"
                columns={1}
              />
            </LeftPanelSection>
          )}

          {/* 常用 6 组诱导公式类型选择 */}
          {studyMode === "induction" && inductionSubMode === "standard6" && (
            <LeftPanelSection
              title="6 组诱导公式"
              subtitle="点击查看不同对称性几何推演"
            >
              <SelectGrid
                items={[
                  {
                    key: "pi_plus",
                    formula: "\\pi + \\alpha",
                    description: "关于原点对称",
                  },
                  {
                    key: "neg",
                    formula: "-\\alpha",
                    description: "关于 x 轴对称",
                  },
                  {
                    key: "pi_minus",
                    formula: "\\pi - \\alpha",
                    description: "关于 y 轴对称",
                  },
                  {
                    key: "half_pi_minus",
                    formula: "\\frac{\\pi}{2} - \\alpha",
                    description: "关于 y=x 对称",
                  },
                  {
                    key: "half_pi_plus",
                    formula: "\\frac{\\pi}{2} + \\alpha",
                    description: "逆时针旋转 90°",
                  },
                  {
                    key: "period",
                    formula: "\\alpha + 2k\\pi",
                    description: "终边重合(周期)",
                  },
                ]}
                value={formulaType}
                onChange={(k) => {
                  setFormulaType(k as FormulaType);
                }}
                variant="outline"
                color="primary"
                columns={2}
              />
            </LeftPanelSection>
          )}

          {/* 万能法则模式下的快速 k 选择器 */}
          {studyMode === "induction" && inductionSubMode === "universal_k" && (
            <LeftPanelSection
              title="快速设定 k 值"
              subtitle="快速测试奇变与偶不变"
            >
              <SelectGrid
                items={[
                  {
                    key: "1",
                    formula: "k=1 (\\frac{\\pi}{2})",
                    description: "奇变",
                  },
                  { key: "2", formula: "k=2 (\\pi)", description: "偶不变" },
                  {
                    key: "3",
                    formula: "k=3 (\\frac{3\\pi}{2})",
                    description: "奇变",
                  },
                  { key: "4", formula: "k=4 (2\\pi)", description: "偶不变" },
                ]}
                value={String(params.universalK ?? 1)}
                onChange={(kStr) => {
                  handleParamChange("universalK", Number(kStr));
                }}
                variant="outline"
                color="primary"
                columns={2}
              />
            </LeftPanelSection>
          )}

          {/* 参数调节区 */}
          <LeftPanelSection
            title="参数精细调节"
            subtitle="拖动滑块探索动态数形变化"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 教学引导与探究提示（置于底部辅助区） */}
          <LeftPanelSection
            title="教学引导与思考"
            subtitle="带着问题观察数形变化"
          >
            <div className="text-xs text-neutral-600 bg-neutral-50 rounded-lg p-3 border border-neutral-200 space-y-2">
              <div>
                <span className="font-semibold text-neutral-800">
                  【基础条件】：
                </span>
                单位圆动点 $P(\cos\alpha, \sin\alpha)$，正切线交于 $T(1,
                \tan\alpha)$。
              </div>
              <div>
                <span className="font-semibold text-neutral-800">
                  【探究思考】：
                </span>
                拖动动点 $P$，观察直角三角形边长平方和如何始终恒等于
                1；切换诱导公式观察对应三角形的对称位置关系。
              </div>
            </div>
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 顶端 KaTeX 公式悬浮框 */}
          <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm max-w-[90%] overflow-x-auto">
            <KatexFormula formula={headerFormulaLatex} mode="inline" />
          </div>

          {/* SVG 自适应画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <TrigIdentityScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              studyMode={studyMode}
              identitySubMode={identitySubMode}
              inductionSubMode={inductionSubMode}
              formulaType={formulaType}
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
