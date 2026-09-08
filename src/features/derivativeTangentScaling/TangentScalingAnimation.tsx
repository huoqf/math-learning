import { useState, useMemo, useCallback } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  LeftPanel,
  LeftPanelSection,
  TabSwitcher,
  SelectGrid,
  TipCard,
  renderMixedLatex,
} from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { SceneLegend } from "@/components/Math";
import type { SceneLegendItem } from "@/components/Math";
import { TangentScalingScene } from "./components/TangentScalingScene";
import { buildTangentScalingPanel } from "@/data/builders/tangentScaling";
import {
  defaultParams,
  modeTabs,
  baseSubModels,
  sandwichSubModels,
  paramKSubModels,
  secantSubModels,
  getTangentScalingParamConfigs,
  subModelDefaultPointMap,
} from "@/data/registries/tangentScaling";
import type {
  TangentScalingMode,
  BaseSubModel,
  SandwichSubModel,
  ParamKSubModel,
  SecantSubModel,
  TangentScalingParams,
} from "@/data/registries/tangentScaling";

export function TangentScalingAnimation() {
  const [params, setParams] = useState<TangentScalingParams>(() => ({
    ...defaultParams,
  }));
  const [mode, setMode] = useState<TangentScalingMode>("base");
  const [baseSubModel, setBaseSubModel] =
    useState<BaseSubModel>("exp_x_plus_1");
  const [sandwichSubModel, setSandwichSubModel] =
    useState<SandwichSubModel>("common_tangent");
  const [paramKSubModel, setParamKSubModel] =
    useState<ParamKSubModel>("exp_log_k");
  const [secantSubModel, setSecantSubModel] =
    useState<SecantSubModel>("exp_secant_tangent");

  // 1. Viewport 与比例尺 (840x650 full preset)
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const scale = useSceneScale({
    vp,
    xRange: [-4, 5],
    yRange: [-3, 6],
  });

  // 2. 参数变更分发
  const handleParamChange = useCallback((key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  // 二级子模型切换联动
  const handleBaseSubChange = useCallback((key: BaseSubModel) => {
    setBaseSubModel(key);
    const defX0 = subModelDefaultPointMap[key] ?? 0;
    setParams((prev) => ({ ...prev, x0: defX0 }));
  }, []);

  const handleSandwichSubChange = useCallback((key: SandwichSubModel) => {
    setSandwichSubModel(key);
    setParams((prev) => ({
      ...prev,
      evalX: key === "origin_sandwich" ? 0 : 1.0,
    }));
  }, []);

  const handleParamKSubChange = useCallback((key: ParamKSubModel) => {
    setParamKSubModel(key);
    if (key === "exp_kx_origin") {
      setParams((prev) => ({ ...prev, k: 2.0 }));
    } else if (key === "log_kx_origin") {
      setParams((prev) => ({ ...prev, k: 0.6 }));
    } else {
      setParams((prev) => ({ ...prev, k: 1.0 }));
    }
  }, []);

  const handleSecantSubChange = useCallback((key: SecantSubModel) => {
    setSecantSubModel(key);
    if (key === "taylor_quadratic") {
      setParams((prev) => ({ ...prev, evalX: 1.0 }));
    } else if (key === "log_secant_tangent") {
      setParams((prev) => ({ ...prev, intervalA: 0.5, intervalB: 3.0 }));
    } else {
      setParams((prev) => ({ ...prev, intervalA: 0.5, intervalB: 2.0 }));
    }
  }, []);

  // 3. 右屏纯数据驱动看板
  const mathData = useMemo(() => {
    return buildTangentScalingPanel(params, {
      mode,
      baseSubModel,
      sandwichSubModel,
      paramKSubModel,
      secantSubModel,
    });
  }, [
    params,
    mode,
    baseSubModel,
    sandwichSubModel,
    paramKSubModel,
    secantSubModel,
  ]);

  // 4. 左屏参数控件配置 (动态传递 options)
  const paramConfigs = useMemo(() => {
    return getTangentScalingParamConfigs(mode, params, {
      baseSubModel,
      sandwichSubModel,
      paramKSubModel,
      secantSubModel,
    });
  }, [
    mode,
    params,
    baseSubModel,
    sandwichSubModel,
    paramKSubModel,
    secantSubModel,
  ]);

  // 5. 中屏右下角毛玻璃图例 (100% 动态特化)
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    if (mode === "base") {
      const isLog = baseSubModel.startsWith("log");
      return [
        {
          label: isLog ? "对数曲线 $f(x)$" : "指数曲线 $f(x)$",
          color: MATH_COLORS.primary,
          style: "solid",
        },
        {
          label: "动切线 $y = f'(x_0)(x - x_0) + f(x_0)$",
          color: MATH_COLORS.paramPrimary,
          style: "dash",
        },
        {
          label: "切点 $P_0$",
          color: MATH_COLORS.paramPrimary,
          style: "point",
        },
      ];
    }
    if (mode === "sandwich") {
      if (sandwichSubModel === "parallel_bands") {
        return [
          {
            label: "指数函数 $e^x$",
            color: MATH_COLORS.primary,
            style: "solid",
          },
          {
            label: "对数函数 $\\ln x$",
            color: MATH_COLORS.secondary,
            style: "solid",
          },
          {
            label: "平行切线带 $y = x \\pm 1$",
            color: MATH_COLORS.line,
            style: "dash",
          },
          {
            label: "间距指示 $\\Delta y$",
            color: MATH_COLORS.accent,
            style: "dash",
          },
        ];
      }
      return [
        {
          label: "上界函数 $f(x)$",
          color: MATH_COLORS.primary,
          style: "solid",
        },
        {
          label: "下界函数 $g(x)$",
          color: MATH_COLORS.secondary,
          style: "solid",
        },
        {
          label: "公切中介线 $y = x$",
          color: MATH_COLORS.paramTertiary,
          style: "solid",
        },
        {
          label: "垂直卡位指示 $\\Delta y$",
          color: MATH_COLORS.accent,
          style: "dash",
        },
      ];
    }
    if (mode === "param_k") {
      if (paramKSubModel === "exp_kx_origin") {
        return [
          {
            label: "指数曲线 $e^x$",
            color: MATH_COLORS.primary,
            style: "solid",
          },
          {
            label: "旋转动直线 $y = kx$",
            color: MATH_COLORS.paramTertiary,
            style: "solid",
          },
          {
            label: "临界切线 $y = ex$",
            color: MATH_COLORS.line,
            style: "dash",
          },
          { label: "临界切点 $A$", color: MATH_COLORS.primary, style: "point" },
        ];
      }
      if (paramKSubModel === "log_kx_origin") {
        return [
          {
            label: "对数曲线 $\\ln x$",
            color: MATH_COLORS.secondary,
            style: "solid",
          },
          {
            label: "旋转动直线 $y = kx$",
            color: MATH_COLORS.paramTertiary,
            style: "solid",
          },
          {
            label: "临界切线 $y = \\frac{1}{e}x$",
            color: MATH_COLORS.line,
            style: "dash",
          },
          {
            label: "临界切点 $B$",
            color: MATH_COLORS.secondary,
            style: "point",
          },
        ];
      }
      return [
        { label: "指数曲线 $e^x$", color: MATH_COLORS.primary, style: "solid" },
        {
          label: "对数曲线 $\\ln x$",
          color: MATH_COLORS.secondary,
          style: "solid",
        },
        {
          label: "旋转动直线 $y = kx$",
          color: MATH_COLORS.paramTertiary,
          style: "solid",
        },
        {
          label: "临界公切线 ($k = e, \\frac{1}{e}$)",
          color: MATH_COLORS.line,
          style: "dash",
        },
      ];
    }
    if (secantSubModel === "taylor_quadratic") {
      return [
        {
          label: "原函数 $\\ln(1+x)$",
          color: MATH_COLORS.primary,
          style: "solid",
        },
        {
          label: "一阶切线上界 $y = x$",
          color: MATH_COLORS.paramTertiary,
          style: "dash",
        },
        {
          label: "二阶多项式下界 $y = x - \\frac{1}{2}x^2$",
          color: MATH_COLORS.accent,
          style: "solid",
        },
        {
          label: "展开原点 $O$",
          color: MATH_COLORS.paramTertiary,
          style: "point",
        },
      ];
    }
    const isLog = secantSubModel === "log_secant_tangent";
    return [
      {
        label: isLog ? "对数曲线 $\\ln x$" : "指数曲线 $e^x$",
        color: isLog ? MATH_COLORS.secondary : MATH_COLORS.primary,
        style: "solid",
      },
      {
        label: "端点割线 (弦线) $L_{AB}$",
        color: MATH_COLORS.accent,
        style: "solid",
      },
      {
        label: isLog
          ? "切线上界 $L_{\\text{tan}}$"
          : "切线下界 $L_{\\text{tan}}$",
        color: MATH_COLORS.paramPrimary,
        style: "dash",
      },
      {
        label: "端点 $A, B$",
        color: MATH_COLORS.paramSecondary,
        style: "point",
      },
    ];
  }, [mode, baseSubModel, sandwichSubModel, paramKSubModel, secantSubModel]);

  // 6. 教学导引题设双要素配置
  const tipCardContent = useMemo(() => {
    switch (mode) {
      case "base": {
        let name = "e^x \\ge x+1";
        let pt = "x_0 = 0";
        if (baseSubModel === "exp_shift_x") {
          name = "e^{x-1} \\ge x";
          pt = "x_0 = 1";
        } else if (baseSubModel === "exp_ex") {
          name = "e^x \\ge ex";
          pt = "x_0 = 1";
        } else if (baseSubModel === "log_x_minus_1") {
          name = "\\ln x \\le x-1";
          pt = "x_0 = 1";
        } else if (baseSubModel === "log_shift_0") {
          name = "\\ln(x+1) \\le x";
          pt = "x_0 = 0";
        } else if (baseSubModel === "log_x_div_e") {
          name = "\\ln x \\le x/e";
          pt = "x_0 = e";
        }

        return {
          conditions: [
            `考查新高考基准切线放缩模型 $${name}$`,
            `对应切点横坐标为 $${pt}$`,
          ],
          questions: [
            "拖动切点滑块，观察动切线如何紧贴曲线并提供单向线性定界",
            `验证只有在基准切点 $${pt}$ 处差值才为 0 并达成等号成立`,
          ],
        };
      }
      case "sandwich":
        return {
          conditions: [
            sandwichSubModel === "parallel_bands"
              ? "考查指数曲线 $e^x$ 与对数曲线 $\\ln x$ 的平行切线缓冲带"
              : "考查指对函数在公共切线处的对称夹逼卡位",
            sandwichSubModel === "parallel_bands"
              ? "两平行切线分别为 $y = x + 1$ 与 $y = x - 1$"
              : "中介过渡公切线为 $y = x$",
          ],
          questions: [
            sandwichSubModel === "parallel_bands"
              ? "体会两切线纵向差值恒为 2，如何秒杀高考大题 $e^x - \\ln x > 2$"
              : "如何通过引入一次公切线中轴，将高阶综合不等式化解为两个独立基准命题？",
            "观察观察点横坐标变化时，上函数与下函数的垂直间距变化",
          ],
        };
      case "param_k":
        return {
          conditions: [
            paramKSubModel === "exp_kx_origin"
              ? "已知 $e^x \\ge kx$ 对于一切 $x > 0$ 恒成立，直线过原点"
              : paramKSubModel === "log_kx_origin"
                ? "已知 $\\ln x \\le kx$ 对于一切 $x > 0$ 恒成立，直线过原点"
                : "已知 $e^x \\ge kx \\ge \\ln x$ 对于一切 $x > 0$ 恒成立，动直线过原点",
            "动直线围绕原点 $O(0,0)$ 连续旋转，斜率为 $k$",
          ],
          questions: [
            paramKSubModel === "exp_kx_origin"
              ? "求解与指数曲线相切的临界斜率 $k = e$ 及允许取值范围 $k \\le e$"
              : paramKSubModel === "log_kx_origin"
                ? "求解与对数曲线相切的临界斜率 $k = 1/e$ 及允许取值范围 $k \\ge 1/e$"
                : "探究动直线同时卡在指数与对数之间的双切线斜率安全闭区间 $[1/e, e]$",
            "调节 $k$ 越过临界值，观察动直线如何在切点附近穿透曲线造成命题失效",
          ],
        };
      case "secant":
        return {
          conditions: [
            secantSubModel === "taylor_quadratic"
              ? "考查对数函数 $\\ln(1+x)$ 在 $x \\ge 0$ 处的二阶泰勒多项式局部卡位"
              : secantSubModel === "log_secant_tangent"
                ? "在区间 $[a,b]$ 上考查上凸对数函数 $\\ln x$ 的割线与切线"
                : "在区间 $[a,b]$ 上考查下凸指数函数 $e^x$ 的割线与切线",
            "割线连接端点 $A, B$，切线取于区间内",
          ],
          questions: [
            secantSubModel === "taylor_quadratic"
              ? "观察一阶上界 $x$ 与二阶下界 $x - 0.5x^2$ 对对数曲线的精确双向钳制"
              : secantSubModel === "log_secant_tangent"
                ? "验证上凸函数具有『割线在下（下界）、切线在上（上界）』的反向包围几何特征"
                : "验证下凸函数『切线在下、割线在上』的闭区间定界原理",
            "拖拽区间端点 $A, B$，观察割线斜率变化及双向定界区间的收紧过程",
          ],
        };
    }
  }, [mode, baseSubModel, sandwichSubModel, paramKSubModel, secantSubModel]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 一级维度 Tab 切换 */}
          <LeftPanelSection title="放缩与卡位模型">
            <TabSwitcher
              tabs={modeTabs}
              value={mode}
              onChange={(key) => setMode(key as TangentScalingMode)}
            />
          </LeftPanelSection>

          {/* 二级典型情景 / 高考题型预设 (双列紧凑排版) */}
          <LeftPanelSection title="典型高考构型">
            {mode === "base" && (
              <SelectGrid
                items={baseSubModels}
                value={baseSubModel}
                onChange={(key) => handleBaseSubChange(key as BaseSubModel)}
                columns={2}
              />
            )}
            {mode === "sandwich" && (
              <SelectGrid
                items={sandwichSubModels}
                value={sandwichSubModel}
                onChange={(key) =>
                  handleSandwichSubChange(key as SandwichSubModel)
                }
                columns={2}
              />
            )}
            {mode === "param_k" && (
              <SelectGrid
                items={paramKSubModels}
                value={paramKSubModel}
                onChange={(key) => handleParamKSubChange(key as ParamKSubModel)}
                columns={2}
              />
            )}
            {mode === "secant" && (
              <SelectGrid
                items={secantSubModels}
                value={secantSubModel}
                onChange={(key) => handleSecantSubChange(key as SecantSubModel)}
                columns={2}
              />
            )}
          </LeftPanelSection>

          {/* 核心参数控制 */}
          <LeftPanelSection title="核心交互参数">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() => setParams({ ...defaultParams })}
            />
          </LeftPanelSection>

          {/* 底部题设与教学导引 TipCard */}
          <div className="mt-auto">
            <TipCard
              variant="primary"
              badge="高考放缩定界探究"
              condition={
                <ul className="list-disc list-inside space-y-0.5 text-neutral-600">
                  {tipCardContent.conditions.map((c, i) => (
                    <li key={i}>{renderMixedLatex(c)}</li>
                  ))}
                </ul>
              }
              question={
                <ul className="list-disc list-inside space-y-0.5 text-neutral-600">
                  {tipCardContent.questions.map((q, i) => (
                    <li key={i}>{renderMixedLatex(q)}</li>
                  ))}
                </ul>
              }
            />
          </div>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative bg-white overflow-hidden select-none">
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <TangentScalingScene
              params={params}
              mode={mode}
              baseSubModel={baseSubModel}
              sandwichSubModel={sandwichSubModel}
              paramKSubModel={paramKSubModel}
              secantSubModel={secantSubModel}
              scale={scale}
              vp={vp}
              fontScale={canvasSize.font}
              onParamChange={handleParamChange}
            />
          </AnimationSvgCanvas>

          {/* 右下角毛玻璃图例 */}
          <SceneLegend items={legendItems} />
        </div>
      }
      right={<MathPanel {...mathData} />}
    />
  );
}

export default TangentScalingAnimation;
