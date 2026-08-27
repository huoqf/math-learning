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
import { ComplexScene } from "./components/ComplexScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/complex";
import { createComplex, formatComplexLatex } from "@/math/complex";

type StudyMode =
  "plane-operations" | "multiplication-rotation" | "locus-extrema";

type LocusSubModel = "circle" | "perp-bisector" | "triangle-ineq";

export function ComplexAnimation() {
  const [studyMode, setStudyMode] = useState<StudyMode>("plane-operations");
  const [activePreset, setActivePreset] = useState<string>("free");
  const [subModel, setSubModel] = useState<LocusSubModel>("circle");

  // 参数状态控制
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 视口尺寸测量与自适应
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 比例尺坐标系：[-6, 6] x [-4.5, 4.5]
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 状态变化更新处理器（若在约束预设下，联动更新约束参数）
  const handleParamChange = useCallback(
    (key: string, value: number) => {
      setParams((prev) => {
        const next = { ...prev, [key]: value };
        if (studyMode === "plane-operations") {
          if (activePreset === "conjugate-pair") {
            if (key === "a1") next.a2 = value;
            if (key === "b1") next.b2 = -value;
          } else if (activePreset === "opposite") {
            if (key === "a1") next.a2 = -value;
            if (key === "b1") next.b2 = -value;
          }
        }
        return next;
      });
    },
    [studyMode, activePreset],
  );

  // 拖拽动点时的解耦处理器：更新参数并将预设切回 free（保障完全自由探索）
  const handleDragParamChange = useCallback((key: string, value: number) => {
    setActivePreset("free");
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // 模式切换
  const handleModeChange = (mode: StudyMode) => {
    setStudyMode(mode);
    setActivePreset("free");
  };

  // 子模型切换
  const handleSubModelChange = (model: LocusSubModel) => {
    setSubModel(model);
    setActivePreset("free");
  };

  // 重置参数
  const handleReset = () => {
    setActivePreset("free");
    setParams({ ...defaultParams });
  };

  // 典型预设切换（根据学科模型进行参数约束锁定）
  const handlePresetSelect = (presetKey: string) => {
    setActivePreset(presetKey);
    if (presetKey === "free") return;

    if (studyMode === "plane-operations") {
      if (presetKey === "pure-real-imag") {
        setParams((prev) => ({ ...prev, a1: 3.0, b1: 0.0, a2: 0.0, b2: 3.0 }));
      } else if (presetKey === "conjugate-pair") {
        setParams((prev) => ({ ...prev, a1: 3.0, b1: 2.0, a2: 3.0, b2: -2.0 }));
      } else if (presetKey === "opposite") {
        setParams((prev) => ({
          ...prev,
          a1: 3.0,
          b1: 2.0,
          a2: -3.0,
          b2: -2.0,
        }));
      }
    } else if (studyMode === "multiplication-rotation") {
      if (presetKey === "rot-90") {
        setParams((prev) => ({ ...prev, r2: 1.0, deg2: 90 }));
      } else if (presetKey === "rot-180") {
        setParams((prev) => ({ ...prev, r2: 1.0, deg2: 180 }));
      } else if (presetKey === "rot-45") {
        setParams((prev) => ({ ...prev, r2: 1.0, deg2: 45 }));
      }
    } else if (studyMode === "locus-extrema") {
      if (subModel === "circle") {
        if (presetKey === "origin-outside") {
          setParams((prev) => ({
            ...prev,
            z0x: 3.0,
            z0y: 4.0,
            radius: 2.0,
            wx: 0.0,
            wy: 0.0,
          }));
        } else if (presetKey === "target-inside") {
          setParams((prev) => ({
            ...prev,
            z0x: 2.0,
            z0y: 2.0,
            radius: 3.0,
            wx: 2.0,
            wy: 1.0,
          }));
        } else if (presetKey === "target-on-circle") {
          setParams((prev) => ({
            ...prev,
            z0x: 0.0,
            z0y: 0.0,
            radius: 3.0,
            wx: 3.0,
            wy: 0.0,
          }));
        }
      } else if (subModel === "perp-bisector") {
        if (presetKey === "horizontal-sym") {
          setParams((prev) => ({
            ...prev,
            a1: 3.0,
            b1: 2.0,
            a2: -3.0,
            b2: 2.0,
          }));
        } else if (presetKey === "origin-sym") {
          setParams((prev) => ({
            ...prev,
            a1: 2.0,
            b1: 3.0,
            a2: -2.0,
            b2: -3.0,
          }));
        }
      } else if (subModel === "triangle-ineq") {
        if (presetKey === "collinear-same") {
          setParams((prev) => ({
            ...prev,
            a1: 2.0,
            b1: 1.0,
            a2: 4.0,
            b2: 2.0,
          }));
        } else if (presetKey === "collinear-opposite") {
          setParams((prev) => ({
            ...prev,
            a1: 3.0,
            b1: 2.0,
            a2: -1.5,
            b2: -1.0,
          }));
        } else if (presetKey === "orthogonal") {
          setParams((prev) => ({
            ...prev,
            a1: 3.0,
            b1: 0.0,
            a2: 0.0,
            b2: 3.0,
          }));
        }
      }
    }
  };

  // 声明式参数配置（根据模式和预设实现严格参数降维与隐藏）
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    let modeKeyGroups: Array<{ group: string; keys: string[] }> = [];

    if (studyMode === "plane-operations") {
      if (activePreset === "conjugate-pair") {
        modeKeyGroups = [
          {
            group: "基准复数 z₁ (实部与虚部，z₂ 自动锁定为共轭)",
            keys: ["a1", "b1"],
          },
        ];
      } else if (activePreset === "opposite") {
        modeKeyGroups = [
          {
            group: "基准复数 z₁ (实部与虚部，z₂ 自动锁定为相反数)",
            keys: ["a1", "b1"],
          },
        ];
      } else if (activePreset === "pure-real-imag") {
        modeKeyGroups = [
          { group: "实数 z₁ = a₁ (虚部锁定为0)", keys: ["a1"] },
          { group: "纯虚数 z₂ = b₂i (实部锁定为0)", keys: ["b2"] },
        ];
      } else {
        modeKeyGroups = [
          { group: "复数 z₁ = a₁ + b₁i (实部与虚部)", keys: ["a1", "b1"] },
          { group: "复数 z₂ = a₂ + b₂i (实部与虚部)", keys: ["a2", "b2"] },
        ];
      }
    } else if (studyMode === "multiplication-rotation") {
      if (activePreset !== "free") {
        // 算子锁定，仅开放被乘复数 z1 的调节
        modeKeyGroups = [
          {
            group: "基准复数 z₁ (模长与辐角，算子 z₂ 已锁定)",
            keys: ["r1", "deg1"],
          },
        ];
      } else {
        modeKeyGroups = [
          { group: "基准复数 z₁ (模长与辐角)", keys: ["r1", "deg1"] },
          { group: "旋转算子 z₂ (缩放与转角)", keys: ["r2", "deg2"] },
        ];
      }
    } else {
      if (subModel === "circle") {
        modeKeyGroups = [
          { group: "圆心定点 z₀ (实部与虚部)", keys: ["z0x", "z0y"] },
          { group: "轨迹圆半径 R", keys: ["radius"] },
          { group: "参考定点 w (实部与虚部)", keys: ["wx", "wy"] },
        ];
      } else if (subModel === "perp-bisector") {
        modeKeyGroups = [
          { group: "第一定点 z₁ (实部与虚部)", keys: ["a1", "b1"] },
          { group: "第二定点 z₂ (实部与虚部)", keys: ["a2", "b2"] },
        ];
      } else {
        modeKeyGroups = [
          { group: "复数 z₁ 向量分量", keys: ["a1", "b1"] },
          { group: "复数 z₂ 向量分量", keys: ["a2", "b2"] },
        ];
      }
    }

    const configs: ParamConfig[] = [];
    modeKeyGroups.forEach(({ group, keys }) => {
      keys.forEach((key) => {
        if (key in paramMeta) {
          const meta = paramMeta[key];
          configs.push({
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
          });
        }
      });
    });

    return configs;
  }, [params, studyMode, activePreset, subModel]);

  // 典型预设项
  const presetItems = useMemo(() => {
    if (studyMode === "plane-operations") {
      return [
        { key: "free", label: "自由探究", description: "全参数开放" },
        {
          key: "conjugate-pair",
          label: "共轭复数对",
          formula: "z_2 = \\bar{z}_1",
          description: "锁定实轴对称",
        },
        {
          key: "pure-real-imag",
          label: "实数与纯虚数",
          formula: "z_1 \\in \\mathbb{R}, z_2 \\in i\\mathbb{R}",
          description: "轴上点对照",
        },
        {
          key: "opposite",
          label: "相反数对",
          formula: "z_2 = -z_1",
          description: "原点中心对称",
        },
      ];
    }
    if (studyMode === "multiplication-rotation") {
      return [
        { key: "free", label: "自由探究", description: "全参数开放" },
        {
          key: "rot-90",
          label: "乘以 i",
          formula: "\\times i",
          description: "锁定逆时针90°",
        },
        {
          key: "rot-180",
          label: "乘以 -1",
          formula: "\\times (-1)",
          description: "锁定中心对称180°",
        },
        {
          key: "rot-45",
          label: "乘以 (1+i)/√2",
          formula: "e^{i\\frac{\\pi}{4}}",
          description: "锁定45°等模旋转",
        },
      ];
    }

    if (subModel === "circle") {
      return [
        { key: "free", label: "自由探究", description: "全参数开放" },
        {
          key: "origin-outside",
          label: "定点在圆外",
          description: "经典高考三步法",
        },
        {
          key: "target-inside",
          label: "定点在圆内",
          description: "内部最近最远",
        },
        {
          key: "target-on-circle",
          label: "定点在圆周",
          description: "最小值退化为0",
        },
      ];
    }

    if (subModel === "perp-bisector") {
      return [
        { key: "free", label: "自由探究", description: "全参数开放" },
        {
          key: "horizontal-sym",
          label: "关于 y 轴对称",
          formula: "x = 0",
          description: "中垂线为虚轴",
        },
        {
          key: "origin-sym",
          label: "关于原点对称",
          formula: "M = (0,0)",
          description: "中垂线过原点",
        },
      ];
    }

    return [
      { key: "free", label: "自由探究", description: "全参数开放" },
      {
        key: "collinear-same",
        label: "同向共线取等",
        formula: "|z_1+z_2|=|z_1|+|z_2|",
        description: "最大值状态",
      },
      {
        key: "collinear-opposite",
        label: "反向共线取等",
        formula: "|z_1+z_2|=||z_1|-|z_2||",
        description: "最小值状态",
      },
      {
        key: "orthogonal",
        label: "正交垂直状态",
        formula: "|z_1+z_2|=\\sqrt{|z_1|^2+|z_2|^2}",
        description: "勾股定理",
      },
    ];
  }, [studyMode, subModel]);

  // 数学量看板数据计算与组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-complex-geometry", params, {
      mode: studyMode,
      subModel,
    });
  }, [params, studyMode, subModel]);

  // 实时悬浮公式计算（严格使用色彩 Token）
  const equationLatex = useMemo(() => {
    if (studyMode === "plane-operations") {
      const z1Str = formatComplexLatex(createComplex(params.a1, params.b1));
      const z2Str = formatComplexLatex(createComplex(params.a2, params.b2));
      return `z_1 = \\color{${MATH_COLORS.paramPrimary}}{${z1Str}}, \\quad z_2 = \\color{${MATH_COLORS.paramSecondary}}{${z2Str}}`;
    }
    if (studyMode === "multiplication-rotation") {
      return `z_1 z_2 = (\\color{${MATH_COLORS.paramPrimary}}{r_1} \\color{${MATH_COLORS.paramSecondary}}{r_2}) \\cdot e^{i (\\color{${MATH_COLORS.paramPrimary}}{\\theta_1} + \\color{${MATH_COLORS.paramSecondary}}{\\theta_2})}`;
    }
    if (subModel === "circle") {
      return `|z - (\\color{${MATH_COLORS.paramPrimary}}{${params.z0x} + ${params.z0y}i})| = \\color{${MATH_COLORS.paramPrimary}}{${params.radius}}`;
    }
    if (subModel === "perp-bisector") {
      return `|z - z_1| = |z - z_2| \\quad (\\text{垂直平分线轨迹})`;
    }
    return `||z_1| - |z_2|| \\le |z_1 + z_2| \\le |z_1| + |z_2|`;
  }, [params, studyMode, subModel]);

  // 看板标题
  const panelTitle = useMemo(() => {
    if (studyMode === "plane-operations") return "复平面与代数运算看板";
    if (studyMode === "multiplication-rotation") return "乘法旋转与伸缩看板";
    if (subModel === "circle") return "复数圆轨迹与最值看板";
    if (subModel === "perp-bisector") return "垂直平分线轨迹看板";
    return "模的三角不等式看板";
  }, [studyMode, subModel]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 模式选择 Section */}
          <LeftPanelSection
            title="探究专题模式"
            subtitle="选择复数几何与代数探究维度"
          >
            <SelectGrid
              columns={1}
              items={[
                {
                  key: "plane-operations",
                  label: "复平面与向量加减",
                  fullWidth: true,
                },
                {
                  key: "multiplication-rotation",
                  label: "乘法旋转与伸缩",
                  fullWidth: true,
                },
                {
                  key: "locus-extrema",
                  label: "复数轨迹与模长最值",
                  fullWidth: true,
                },
              ]}
              value={studyMode}
              onChange={(k) => handleModeChange(k as StudyMode)}
              variant="filled"
            />
          </LeftPanelSection>

          {/* 1.1 轨迹模式下的子模型选择 */}
          {studyMode === "locus-extrema" && (
            <LeftPanelSection
              title="轨迹与最值模型"
              subtitle="选择高考经典几何模型"
            >
              <SelectGrid
                columns={1}
                items={[
                  { key: "circle", label: "圆轨迹与定点距离 (|z - z₀| = R)" },
                  {
                    key: "perp-bisector",
                    label: "垂直平分线轨迹 (|z - z₁| = |z - z₂|)",
                  },
                  { key: "triangle-ineq", label: "模的三角不等式夹逼" },
                ]}
                value={subModel}
                onChange={(k) => handleSubModelChange(k as LocusSubModel)}
                variant="filled"
                color="primary"
              />
            </LeftPanelSection>
          )}

          {/* 2. 典型构型预设 (实现参数降维) */}
          <LeftPanelSection
            title="典型构型与约束"
            subtitle="一键加载几何约束并聚焦主控参数"
          >
            <SelectGrid
              columns={2}
              items={presetItems}
              value={activePreset}
              onChange={handlePresetSelect}
              variant="filled"
              color="primary"
            />
          </LeftPanelSection>

          {/* 3. 动态参数调节 Section */}
          <LeftPanelSection
            title="参数调节"
            subtitle="拖动滑块改变几何代数参数"
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
            subtitle="带着核心问题在画布中探索"
          >
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xs space-y-2 text-neutral-600 leading-relaxed">
              {studyMode === "plane-operations" && (
                <>
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【基础条件】：
                    </span>
                    复数 <KatexFormula formula="z = a + bi" mode="inline" />{" "}
                    与复平面向量{" "}
                    <KatexFormula formula="\vec{OZ} = (a, b)" mode="inline" />{" "}
                    一一对应。
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【探究问题】：
                    </span>
                    拖动 <KatexFormula formula="Z_1" mode="inline" /> 与{" "}
                    <KatexFormula formula="Z_2" mode="inline" />
                    ，观察和向量与差向量的几何特征，为什么{" "}
                    <KatexFormula formula="|z_1 - z_2|" mode="inline" />{" "}
                    能够直接表示两点间欧氏距离？
                  </div>
                </>
              )}
              {studyMode === "multiplication-rotation" && (
                <>
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【基础条件】：
                    </span>
                    复数乘法满足“模长相乘，辐角相加”：
                    <KatexFormula
                      formula="z_1 z_2 = (r_1 r_2)e^{i(\theta_1+\theta_2)}"
                      mode="inline"
                    />
                    。
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【探究问题】：
                    </span>
                    当模长 <KatexFormula formula="r_2=1" mode="inline" />{" "}
                    时，复数乘法退化为什么刚体几何变换？连续乘以{" "}
                    <KatexFormula formula="i" mode="inline" />{" "}
                    会发生什么周期性循环？
                  </div>
                </>
              )}
              {studyMode === "locus-extrema" && subModel === "circle" && (
                <>
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【基础条件】：
                    </span>
                    方程 <KatexFormula formula="|z - z_0| = R" mode="inline" />{" "}
                    刻画以 <KatexFormula formula="z_0" mode="inline" /> 为圆心、
                    <KatexFormula formula="R" mode="inline" /> 为半径的圆周。
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【探究问题】：
                    </span>
                    拖动定点 <KatexFormula formula="w" mode="inline" /> 和圆心{" "}
                    <KatexFormula formula="z_0" mode="inline" />
                    ，观察极值点{" "}
                    <KatexFormula formula="Z_{\min}" mode="inline" /> 与{" "}
                    <KatexFormula formula="Z_{\max}" mode="inline" />{" "}
                    是否始终落在连线所在直线上？
                  </div>
                </>
              )}
              {studyMode === "locus-extrema" &&
                subModel === "perp-bisector" && (
                  <>
                    <div>
                      <span className="font-semibold text-neutral-800">
                        【基础条件】：
                      </span>
                      方程{" "}
                      <KatexFormula
                        formula="|z - z_1| = |z - z_2|"
                        mode="inline"
                      />{" "}
                      刻画到两定点距离相等的动点轨迹。
                    </div>
                    <div>
                      <span className="font-semibold text-neutral-800">
                        【探究问题】：
                      </span>
                      改变两定点位置，观察中垂线与线段{" "}
                      <KatexFormula formula="Z_1 Z_2" mode="inline" />{" "}
                      的垂直平分几何关系。
                    </div>
                  </>
                )}
              {studyMode === "locus-extrema" &&
                subModel === "triangle-ineq" && (
                  <>
                    <div>
                      <span className="font-semibold text-neutral-800">
                        【基础条件】：
                      </span>
                      三角形两边之和大于第三边，两边之差小于第三边。
                    </div>
                    <div>
                      <span className="font-semibold text-neutral-800">
                        【探究问题】：
                      </span>
                      在什么几何构型下{" "}
                      <KatexFormula
                        formula="|z_1 + z_2| = |z_1| + |z_2|"
                        mode="inline"
                      />{" "}
                      取得最大值？什么构型下取得最小值？
                    </div>
                  </>
                )}
            </div>
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 公式悬浮展示卡片 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={equationLatex} mode="inline" />
          </div>

          {/* SVG 自适应画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <ComplexScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleDragParamChange}
              fontScale={canvasSize.font}
              studyMode={studyMode}
              subModel={subModel}
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
