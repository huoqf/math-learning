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
  TipCard,
} from "@/components/UI";
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { NikeScene } from "./components/NikeScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/nike";

export function NikeAnimation() {
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  const [activeMode, setActiveMode] = useState<"standard" | "amgm" | "shifted">(
    "standard",
  );

  const [preset, setPreset] = useState<string>("nike_std");

  // 1. Viewport 与自适应画布 (Preset: full)
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 2. 比例尺 (数学坐标 x: [-6, 6], y: [-4.5, 4.5])
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 3. 右屏数学量组装 (根据 anim-nike 与 activeMode)
  const mathData = useMemo(
    () => buildMathQuantities("anim-nike", params, { activeMode }),
    [params, activeMode],
  );

  // 4. 中屏悬浮公式字符串拼接 (参数 a, b 应用三位一体语义色)
  const equationLatex = useMemo(() => {
    const aVal = params.a.toFixed(1);
    const bVal = params.b.toFixed(1);

    const colA = `\\color{${MATH_COLORS.paramPrimary}}{${aVal}}`;
    const colB = `\\color{${MATH_COLORS.paramSecondary}}{${Math.abs(params.b).toFixed(1)}}`;
    const colH = `\\color{${MATH_COLORS.paramTertiary}}{${Math.abs(params.h).toFixed(1)}}`;
    const colC = `\\color{${MATH_COLORS.paramTertiary}}{${Math.abs(params.c).toFixed(1)}}`;

    if (activeMode === "shifted") {
      const hPart =
        Math.abs(params.h) < 1e-4
          ? "x"
          : params.h > 0
            ? `(x - ${colH})`
            : `(x + ${colH})`;

      const fracSign = params.b >= 0 ? "+" : "-";
      const fracTerm = `${fracSign} \\frac{${colB}}{${hPart}}`;

      if (Math.abs(params.a) < 1e-4) {
        if (Math.abs(params.c) < 1e-4) {
          return params.b >= 0
            ? `y = \\frac{${colB}}{${hPart}}`
            : `y = -\\frac{${colB}}{${hPart}}`;
        }
        const cSigned = params.c > 0 ? colC : `-${colC}`;
        return `y = ${cSigned} ${fracTerm}`;
      }

      const aTerm = `${colA}${hPart}`;
      const cTerm =
        Math.abs(params.c) < 1e-4
          ? ""
          : params.c > 0
            ? `+ ${colC}`
            : `- ${colC}`;

      return `y = ${aTerm} ${cTerm} ${fracTerm}`.replace(/\s+/g, " ");
    }
    if (activeMode === "amgm") {
      return `f(x) = ${colA}x + \\frac{\\color{${MATH_COLORS.paramSecondary}}{${bVal}}}{x} \\ge 2\\sqrt{${colA} \\cdot \\color{${MATH_COLORS.paramSecondary}}{${bVal}}}`;
    }
    const bSign = params.b >= 0 ? "+" : "-";
    const fracTerm = `${bSign} \\frac{${colB}}{x}`;
    if (Math.abs(params.a) < 1e-4) {
      return params.b >= 0
        ? `y = \\frac{${colB}}{x}`
        : `y = -\\frac{${colB}}{x}`;
    }
    return `y = ${colA}x ${fracTerm}`;
  }, [params.a, params.b, params.h, params.c, activeMode]);

  // 5. 左屏参数过滤与配置 (声明式ParamControl，支持动态定义域保护)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      standard: ["a", "b", "x0"],
      amgm: ["a", "b", "x0"],
      shifted: ["a", "b", "h", "c", "x0"],
    };
    const keys = keysByMode[activeMode] ?? Object.keys(paramMeta);
    return keys
      .filter((key) => key in paramMeta)
      .map((key) => {
        const meta = paramMeta[key];
        let minVal = meta.min;
        let maxVal = meta.max;
        let marks = meta.marks;

        if (activeMode === "amgm") {
          marks = undefined;
          if (key === "a") {
            minVal = 0.2;
            maxVal = 3.0;
          } else if (key === "b") {
            minVal = 0.5;
            maxVal = 9.0;
          } else if (key === "x0") {
            minVal = 0.2;
            maxVal = 6.0;
          }
        }

        return {
          key,
          label: meta.label,
          labelFormula: meta.labelFormula,
          value: params[key] ?? meta.defaultValue ?? 0,
          min: minVal,
          max: maxVal,
          step: meta.step ?? 0.1,
          group: meta.group,
          importance: meta.importance,
          marks,
        };
      });
  }, [params, activeMode]);

  // 6. 模式与预设联动
  const handleModeChange = (newMode: string) => {
    const m = newMode as "standard" | "amgm" | "shifted";
    setActiveMode(m);
    if (m === "standard") {
      setPreset("nike_std");
      setParams((p) => ({ ...p, a: 1.0, b: 4.0, h: 0, c: 0, x0: 3.0 }));
    } else if (m === "amgm") {
      setPreset("amgm_std");
      setParams((p) => ({ ...p, a: 1.0, b: 4.0, h: 0, c: 0, x0: 2.0 }));
    } else if (m === "shifted") {
      setPreset("shifted_quad");
      setParams((p) => ({ ...p, a: 1.0, b: 4.0, h: 1.0, c: 2.0, x0: 3.0 }));
    }
  };

  const handlePresetChange = (key: string) => {
    setPreset(key);
    if (key === "nike_std") {
      setParams((p) => ({ ...p, a: 1.0, b: 4.0, h: 0, c: 0, x0: 3.0 }));
    } else if (key === "streamer_std") {
      setParams((p) => ({ ...p, a: 1.0, b: -4.0, h: 0, c: 0, x0: 3.0 }));
    } else if (key === "inverse_std") {
      setParams((p) => ({ ...p, a: 0.0, b: 4.0, h: 0, c: 0, x0: 3.0 }));
    } else if (key === "amgm_std") {
      setParams((p) => ({ ...p, a: 1.0, b: 4.0, h: 0, c: 0, x0: 2.0 }));
    } else if (key === "amgm_double") {
      setParams((p) => ({ ...p, a: 2.0, b: 8.0, h: 0, c: 0, x0: 2.0 }));
    } else if (key === "amgm_unit") {
      setParams((p) => ({ ...p, a: 1.0, b: 1.0, h: 0, c: 0, x0: 1.0 }));
    } else if (key === "shifted_quad") {
      setParams((p) => ({ ...p, a: 1.0, b: 4.0, h: 1.0, c: 2.0, x0: 3.0 }));
    } else if (key === "shifted_linear") {
      setParams((p) => ({ ...p, a: 0.0, b: 3.0, h: 2.0, c: 1.0, x0: 4.0 }));
    } else if (key === "shifted_streamer") {
      setParams((p) => ({ ...p, a: 1.0, b: -4.0, h: 2.0, c: 0.0, x0: 4.0 }));
    }
  };

  const handleParamChange = useCallback((key: string, value: number) => {
    setPreset("free");
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleReset = () => {
    handleModeChange(activeMode);
  };

  // 图例配置
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    const { a, b, h, c } = params;
    const isNike = a * b > 0;
    if (activeMode === "shifted") {
      const isLinear = Math.abs(a) < 1e-4;
      const asymptoteItem: SceneLegendItem = isLinear
        ? {
            label: `水平渐近线 y = ${c.toFixed(1)}`,
            color: MATH_COLORS.asymptote,
            style: "dash",
          }
        : {
            label: `斜渐近线 y = ${a.toFixed(1)}(x - ${h.toFixed(1)}) + ${c.toFixed(1)}`,
            color: MATH_COLORS.asymptote,
            style: "dash",
          };

      return [
        {
          label: isNike
            ? "平移对勾曲线"
            : a * b < 0
              ? "平移飘带曲线"
              : "平移退化曲线",
          color: isNike
            ? MATH_COLORS.function
            : a * b < 0
              ? MATH_COLORS.functionTransformed
              : MATH_COLORS.degeneracy,
          style: "solid",
        },
        {
          label: `垂直渐近线 x = ${h.toFixed(1)}`,
          color: MATH_COLORS.asymptote,
          style: "dash",
        },
        asymptoteItem,
        {
          label: `中心 C(${h.toFixed(1)}, ${c.toFixed(1)})`,
          color: MATH_COLORS.focusPoint,
          style: "point",
        },
      ];
    }
    if (activeMode === "amgm") {
      return [
        {
          label: "和函数 f(x)=ax+b/x",
          color: MATH_COLORS.function,
          style: "solid",
        },
        {
          label: `y1 = ${a.toFixed(1)}x`,
          color: MATH_COLORS.paramPrimary,
          style: "dash",
        },
        {
          label: `y2 = ${b.toFixed(1)}/x`,
          color: MATH_COLORS.paramSecondary,
          style: "dash",
        },
        {
          label: "均值等号极小点",
          color: MATH_COLORS.vertexPoint,
          style: "point",
        },
      ];
    }
    return [
      {
        label: isNike
          ? "对勾函数曲线"
          : a * b < 0
            ? "双曲飘带曲线"
            : "退化函数图象",
        color: isNike
          ? MATH_COLORS.function
          : a * b < 0
            ? MATH_COLORS.functionTransformed
            : MATH_COLORS.degeneracy,
        style: "solid",
      },
      {
        label: "垂直渐近线 x = 0",
        color: MATH_COLORS.asymptote,
        style: "dash",
      },
      {
        label: `斜渐近线 y = ${a.toFixed(1)}x`,
        color: MATH_COLORS.asymptote,
        style: "dash",
      },
      {
        label: "特征极值点",
        color: MATH_COLORS.vertexPoint,
        style: "point",
      },
    ];
  }, [params, activeMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 模式选择区 (TabSwitcher) */}
          <LeftPanelSection title="探究模式">
            <TabSwitcher
              layout="horizontal"
              tabs={[
                { key: "standard", label: "基本性质" },
                { key: "amgm", label: "均值不等式" },
                { key: "shifted", label: "平移双曲线" },
              ]}
              value={activeMode}
              onChange={handleModeChange}
            />
          </LeftPanelSection>

          {/* 2. 随模式动态切换典型真题形态预设 */}
          <LeftPanelSection title="典型形态预设">
            {activeMode === "standard" && (
              <SelectGrid
                items={[
                  {
                    key: "nike_std",
                    label: "经典对勾型",
                    description: "同号象限双极值",
                  },
                  {
                    key: "streamer_std",
                    label: "双曲飘带型",
                    description: "异号象限单调增",
                  },
                  {
                    key: "inverse_std",
                    label: "反比例退化",
                    description: "斜渐近线水平退化",
                    fullWidth: true,
                  },
                ]}
                value={preset}
                onChange={handlePresetChange}
                columns={2}
              />
            )}
            {activeMode === "amgm" && (
              <SelectGrid
                items={[
                  {
                    key: "amgm_std",
                    label: "标准对勾配凑",
                    description: "积为定值求极值",
                  },
                  {
                    key: "amgm_double",
                    label: "倍数系数模型",
                    description: "系数调整配凑均值",
                  },
                  {
                    key: "amgm_unit",
                    label: "单位系数模型",
                    description: "最简基本不等式",
                    fullWidth: true,
                  },
                ]}
                value={preset}
                onChange={handlePresetChange}
                columns={2}
              />
            )}
            {activeMode === "shifted" && (
              <SelectGrid
                items={[
                  {
                    key: "shifted_quad",
                    label: "二次分式对勾",
                    description: "分离常数法化对勾",
                  },
                  {
                    key: "shifted_linear",
                    label: "分式线性平移",
                    description: "反比例函数整体平移",
                  },
                  {
                    key: "shifted_streamer",
                    label: "二次分式飘带",
                    description: "分离常数法化飘带",
                    fullWidth: true,
                  },
                ]}
                value={preset}
                onChange={handlePresetChange}
                columns={2}
              />
            )}
          </LeftPanelSection>

          {/* 3. 参数调节 */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 4. 教学导引 */}
          <LeftPanelSection title="教学导引" compact>
            {activeMode === "standard" && (
              <TipCard
                variant={
                  params.a * params.b > 0
                    ? "primary"
                    : params.a * params.b < 0
                      ? "warning"
                      : "danger"
                }
                badge={
                  params.a * params.b > 0
                    ? "高考母题 · 经典对勾函数模型 (ab > 0)"
                    : params.a * params.b < 0
                      ? "高考延伸 · 双曲飘带型函数 (ab < 0)"
                      : "退化模型 · 反比例函数"
                }
                condition={
                  <span>
                    定义域去心 <KatexFormula formula="x \ne 0" mode="inline" />
                    ，奇函数{" "}
                    <KatexFormula formula="f(-x) = -f(x)" mode="inline" />
                    ，渐近线为{" "}
                    <KatexFormula
                      formula={
                        Math.abs(params.a) < 1e-4
                          ? "y = 0"
                          : `y = ${params.a.toFixed(1)}x`
                      }
                      mode="inline"
                    />{" "}
                    与 <KatexFormula formula="x = 0" mode="inline" />。
                  </span>
                }
                question={
                  params.a * params.b > 0
                    ? params.a > 0
                      ? "(1) 求导解驻点并确定单调递减区间；(2) 探究第一象限极小值点与第三象限极大值点的中心对称关系。"
                      : "(1) 分析导函数符号，确定倒对勾函数的单调递增区间；(2) 求解第四象限极大值点与第二象限极小值点坐标。"
                    : "(1) 求导证明导函数在去心定义域上恒号；(2) 分析为何双曲飘带形态全域单调且无极值点。"
                }
              />
            )}

            {activeMode === "amgm" && (
              <TipCard
                variant="success"
                badge="高考重点 · 均值不等式配凑最值 (AM-GM)"
                condition={
                  <span>
                    满足前提“一正、二定”，乘积为定值{" "}
                    <KatexFormula
                      formula={`(ax)(\\frac{b}{x}) = ${(params.a * params.b).toFixed(1)}`}
                      mode="inline"
                    />
                    。
                  </span>
                }
                question="(1) 验证两项乘积为定值的前提下，应用基本不等式求 $f(x)$ 最小值；(2) 求解等号成立时动点 $P$ 的横坐标，验证 $ax = \\frac{b}{x}$ 的充要条件。"
              />
            )}

            {activeMode === "shifted" && (
              <TipCard
                variant={
                  Math.abs(params.a) < 1e-4
                    ? "warning"
                    : params.a * params.b < 0
                      ? "primary"
                      : "primary"
                }
                badge={
                  Math.abs(params.a) < 1e-4
                    ? "高考模型 · 分式线性反比例平移"
                    : params.a * params.b < 0
                      ? "高考模型 · 二次分式双曲飘带"
                      : "高考模型 · 二次分式平移对勾"
                }
                condition={
                  <span>
                    对称中心为{" "}
                    <KatexFormula
                      formula={`C(${params.h.toFixed(1)}, ${params.c.toFixed(1)})`}
                      mode="inline"
                    />
                    ，渐近线为{" "}
                    <KatexFormula
                      formula={`x = ${params.h.toFixed(1)}`}
                      mode="inline"
                    />
                    {Math.abs(params.a) < 1e-4 ? (
                      <span>
                        {" "}
                        与水平渐近线{" "}
                        <KatexFormula
                          formula={`y = ${params.c.toFixed(1)}`}
                          mode="inline"
                        />
                      </span>
                    ) : (
                      <span>
                        。令{" "}
                        <KatexFormula
                          formula={`u = x - ${params.h.toFixed(1)}`}
                          mode="inline"
                        />{" "}
                        可化为标准型
                      </span>
                    )}
                    。
                  </span>
                }
                question={
                  Math.abs(params.a) < 1e-4
                    ? "(1) 求分式线性函数的单调递减区间；(2) 证明动点 $P$ 到两条渐近线距离之积为定值 $|b|$。"
                    : params.a * params.b < 0
                      ? "(1) 求导分析导数恒号性质，判定全域单调性；(2) 探究方程 $f(x) = m$ 的实根个数与零点分布。"
                      : "(1) 设 $u = x - h$，求函数在 $(h, +\\infty)$ 上的极小值点坐标与极小值；(2) 证明两极值点连线中点恒与对称中心 $C$ 重合。"
                }
              />
            )}
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white overflow-hidden">
          {/* 顶部悬浮公式卡片 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={equationLatex} mode="inline" />
          </div>

          {/* SVG 交互画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <NikeScene
              params={params}
              scale={scale}
              vp={vp}
              activeMode={activeMode}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
            />
          </AnimationSvgCanvas>
          <SceneLegend items={legendItems} />
        </div>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          reasoningSteps={mathData.reasoningSteps}
          title="对勾与双曲型看板"
        />
      }
    />
  );
}
