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
  getPresetParams,
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

  // 2. 参数变更与模式/预设智能同步分发
  const handleParamChange = useCallback((key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  // 一级模式切换：自动同步平滑重置至目标模式的典型基准参数
  const handleModeChange = useCallback(
    (nextMode: TangentScalingMode) => {
      setMode(nextMode);
      const preset = getPresetParams(nextMode, {
        baseSubModel,
        sandwichSubModel,
        paramKSubModel,
        secantSubModel,
      });
      setParams((prev) => ({ ...prev, ...preset }));
    },
    [baseSubModel, sandwichSubModel, paramKSubModel, secantSubModel],
  );

  // 参数重置：依据当前激活模式及子模型，重置到安全合规的定义域预设值
  const handleReset = useCallback(() => {
    const preset = getPresetParams(mode, {
      baseSubModel,
      sandwichSubModel,
      paramKSubModel,
      secantSubModel,
    });
    setParams((prev) => ({ ...prev, ...preset }));
  }, [mode, baseSubModel, sandwichSubModel, paramKSubModel, secantSubModel]);

  // 二级子模型切换联动
  const handleBaseSubChange = useCallback((key: BaseSubModel) => {
    setBaseSubModel(key);
    const defX0 = subModelDefaultPointMap[key] ?? 0;
    setParams((prev) => ({ ...prev, x0: defX0 }));
  }, []);

  const handleSandwichSubChange = useCallback((key: SandwichSubModel) => {
    setSandwichSubModel(key);
    const preset = getPresetParams("sandwich", { sandwichSubModel: key });
    setParams((prev) => ({ ...prev, ...preset }));
  }, []);

  const handleParamKSubChange = useCallback((key: ParamKSubModel) => {
    setParamKSubModel(key);
    const preset = getPresetParams("param_k", { paramKSubModel: key });
    setParams((prev) => ({ ...prev, ...preset }));
  }, []);

  const handleSecantSubChange = useCallback((key: SecantSubModel) => {
    setSecantSubModel(key);
    const preset = getPresetParams("secant", { secantSubModel: key });
    setParams((prev) => ({ ...prev, ...preset }));
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
          label: "基准目标切线",
          color: MATH_COLORS.line,
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
            label: "指数曲线 $e^x$",
            color: MATH_COLORS.primary,
            style: "solid",
          },
          {
            label: "指数切线 $y = x + 1$",
            color: MATH_COLORS.primary,
            style: "dash",
          },
          {
            label: "对数曲线 $\\ln x$",
            color: MATH_COLORS.secondary,
            style: "solid",
          },
          {
            label: "对数切线 $y = x - 1$",
            color: MATH_COLORS.secondary,
            style: "dash",
          },
          {
            label: "平行缓冲间距 $\\Delta y$",
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
            color: MATH_COLORS.primary,
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
            color: MATH_COLORS.secondary,
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
          label: "指数临界切线 $y = ex$",
          color: MATH_COLORS.primary,
          style: "dash",
        },
        {
          label: "对数临界切线 $y = \\frac{1}{e}x$",
          color: MATH_COLORS.secondary,
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
      {
        label: "中点切点 $M$",
        color: MATH_COLORS.paramPrimary,
        style: "point",
      },
    ];
  }, [mode, baseSubModel, sandwichSubModel, paramKSubModel, secantSubModel]);

  // 6. 教学导引题设双要素配置（严格落实高考设问词 + 左问右解闭环，杜绝空泛观察词）
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
            `已知基准切线放缩模型 $${name}$，切点横坐标为 $${pt}$`,
            "切线方程为一阶切线展开式，在定义域内对曲线提供单向线性定界",
          ],
          questions: [
            `(1) 构造辅助差函数并求导，严格证明不等式 $${name}$ 恒成立`,
            `(2) 探究不等式等号成立的充要条件，说明为什么极值点必须取在 $${pt}$`,
          ],
        };
      }
      case "sandwich":
        if (sandwichSubModel === "parallel_bands") {
          return {
            conditions: [
              "已知指数函数 $e^x$ 与对数函数 $\\ln x$ 在 $(0,1)$ 与 $(1,0)$ 处具有平行切线",
              "两平行切线分别为 $y = x + 1$ 与 $y = x - 1$",
            ],
            questions: [
              "(1) 分别写出两曲线的切线放缩式，并利用同向不等式相加证明 $e^x - \\ln x \\ge 2$",
              "(2) 论证为什么取等条件不能同步满足，从而证明严格不等式 $e^x - \\ln x > 2$ 恒成立",
            ],
          };
        }
        return {
          conditions: [
            "已知指对函数在公共切点处具有公切线 $y = x$",
            "公切线充当上界与下界之间的线性中介过渡轴",
          ],
          questions: [
            "(1) 求解两曲线在相切点处的公切线方程，并验证在切点处函数值与导数值均相等",
            "(2) 利用基准放缩拆解综合不等式，证明双侧夹逼不等式及等号同步条件",
          ],
        };
      case "param_k":
        return {
          conditions: [
            paramKSubModel === "exp_kx_origin"
              ? "已知动直线 $y = kx$ 绕原点 $O(0,0)$ 旋转，要求对一切 $x > 0$ 恒有 $e^x \\ge kx$"
              : paramKSubModel === "log_kx_origin"
                ? "已知动直线 $y = kx$ 绕原点 $O(0,0)$ 旋转，要求对一切 $x > 0$ 恒有 $\\ln x \\le kx$"
                : "已知动直线 $y = kx$ 绕原点 $O(0,0)$ 旋转，要求对一切 $x > 0$ 恒有 $e^x \\ge kx \\ge \\ln x$",
            "直线必须介于曲线单侧或双侧之间，全区间无穿透",
          ],
          questions: [
            paramKSubModel === "exp_kx_origin"
              ? "(1) 求解过原点与指数曲线 $e^x$ 相切的切点坐标与临界斜率"
              : paramKSubModel === "log_kx_origin"
                ? "(1) 求解过原点与对数曲线 $\\ln x$ 相切的切点坐标与临界斜率"
                : "(1) 分别求解过原点与指数、对数曲线相切的两个临界切点与临界斜率",
            paramKSubModel === "exp_kx_origin"
              ? "(2) 结合下凸性与旋转几何特征，求实数 $k$ 的允许取值范围"
              : paramKSubModel === "log_kx_origin"
                ? "(2) 转化为函数 $g(x) = \\frac{\\ln x}{x}$ 的最值，求参数 $k$ 的取值范围"
                : "(2) 取两单侧条件的交集，确定使动直线无穿透的安全闭区间 $[1/e, e]$",
          ],
        };
      case "secant":
        if (secantSubModel === "taylor_quadratic") {
          return {
            conditions: [
              "已知对数函数 $\\ln(1+x)$ 在 $x \\ge 0$ 处的局部多项式逼近",
              "一阶线性切线 $y = x$ 与二阶下界多项式 $y = x - \\frac{1}{2}x^2$",
            ],
            questions: [
              "(1) 构造辅助函数 $h(x) = \\ln(1+x) - (x - \\frac{1}{2}x^2)$，通过导数证明其在 $[0, +\\infty)$ 上的单调性",
              "(2) 证明卡位不等式 $x - \\frac{1}{2}x^2 \\le \\ln(1+x) \\le x$ 并指明其在数列放缩中的应用场景",
            ],
          };
        }
        if (secantSubModel === "log_secant_tangent") {
          return {
            conditions: [
              "在闭区间 $[a,b]$ 上考查上凸对数函数 $\\ln x$ 的割线与中点切线",
              "割线连接端点 $A(a, \\ln a)$ 与 $B(b, \\ln b)$",
            ],
            questions: [
              "(1) 求端点割线方程与区间中点切线方程，并计算割线斜率",
              "(2) 利用二阶导上凸性证明在 $[a,b]$ 上割线在下（下界）、切线在上（上界）",
            ],
          };
        }
        return {
          conditions: [
            "在闭区间 $[a,b]$ 上考查下凸指数函数 $e^x$ 的割线与中点切线",
            "割线连接端点 $A(a, e^a)$ 与 $B(b, e^b)$",
          ],
          questions: [
            "(1) 求端点割线方程与区间中点切线方程，并计算割线斜率",
            "(2) 利用二阶导下凸性证明在 $[a,b]$ 上切线在下（下界）、割线在上（上界）",
          ],
        };
    }
  }, [mode, baseSubModel, sandwichSubModel, paramKSubModel, secantSubModel]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 一级维度 Tab 切换 (2x2 四宫格紧凑排版) */}
          <LeftPanelSection title="放缩与卡位模型">
            <TabSwitcher
              tabs={modeTabs}
              value={mode}
              onChange={(key) => handleModeChange(key as TangentScalingMode)}
              layout="horizontal"
            />
          </LeftPanelSection>

          {/* 二级典型情景 / 高考题型预设 (基准2列对称，长不等式单列整齐展开) */}
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
                columns={1}
              />
            )}
            {mode === "param_k" && (
              <SelectGrid
                items={paramKSubModels}
                value={paramKSubModel}
                onChange={(key) => handleParamKSubChange(key as ParamKSubModel)}
                columns={1}
              />
            )}
            {mode === "secant" && (
              <SelectGrid
                items={secantSubModels}
                value={secantSubModel}
                onChange={(key) => handleSecantSubChange(key as SecantSubModel)}
                columns={1}
              />
            )}
          </LeftPanelSection>

          {/* 核心参数控制 */}
          <LeftPanelSection title="核心交互参数">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
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
