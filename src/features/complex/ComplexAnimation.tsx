import { useState, useMemo, useCallback } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { ComplexScene } from "./components/ComplexScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/complex";
import {
  createComplex,
  formatComplexLatex,
  mulComplex,
  powerOfI,
} from "@/math/complex";
import {
  COMPLEX_ALGEBRAIC_PRESETS,
  resolveComplexViewport,
  type ComplexAlgebraicSubModel,
  type ComplexLocusSubModel,
  type ComplexSubModel,
  type ComplexStudyMode,
} from "./sceneConfig";

type StudyMode = ComplexStudyMode;
type LocusSubModel = ComplexLocusSubModel;
type AlgebraicSubModel = ComplexAlgebraicSubModel;

/**
 * 左屏教学引导卡文案：按「模式 × 子情景」解析。
 *
 * 纯函数、模块级：文案只由三个选择变量决定，无需挂在组件里做 memo。
 * 设问一律直击高考核心目标（写出代数形式 / 求最值 / 证明取等），
 * 不使用「拖动…观察」这类低阶空泛句式（`audit:strict` 的
 * `left/tipcard-quality` 规则会拦截此类表述）。
 */
function resolveTipContent(
  studyMode: StudyMode,
  subModel: LocusSubModel,
  algebraicSub: AlgebraicSubModel,
): { badge: string; condition: string; question: string } {
  if (studyMode === "plane-operations") {
    return {
      badge: "复平面向量运算",
      condition:
        "复数 $z = a + bi$ 与复平面向量 $\\vec{OZ} = (a, b)$ 一一对应。",
      question:
        "已知 $z_1$、$z_2$ 的代数形式，能否不解方程直接写出两点距离 $|z_1 - z_2|$ 与对角线长 $|z_1 + z_2|$？当 $z_1$、$z_2$ 满足什么条件时，平行四边形 $OZ_1ZZ_2$ 会退化为菱形、矩形或正方形？",
    };
  }
  if (studyMode === "multiplication-rotation") {
    return {
      badge: "复数乘法与几何旋转",
      condition:
        "复数乘法满足“模长相乘，辐角相加”：$z_1 z_2 = (r_1 r_2)\\left[\\cos(\\theta_1+\\theta_2) + i\\sin(\\theta_1+\\theta_2)\\right]$。（复数的三角表示属选学拓展内容）",
      question:
        "当乘数模长 $r_2=1$ 时，复数乘法退化为什么刚体变换？连续乘以虚数单位 $i$ 会产生什么周期性循环？",
    };
  }
  if (studyMode === "algebraic-operations") {
    if (algebraicSub === "power-cycle") {
      return {
        badge: "i 的幂周期与分组求和",
        condition:
          "$i$ 的幂以 $4$ 为周期循环：$i$、$-1$、$-i$、$1$，故 $i^n$ 只由 $n$ 除以 $4$ 的余数决定。",
        question:
          "计算 $i^{2026}$ 需要连乘多少次 $i$？若要求 $i + i^2 + i^3 + \\cdots + i^{2026}$，能否利用「连续四项之和为零」把它化成不超过三项的求和？",
      };
    }
    if (algebraicSub === "conjugate-rationalize") {
      return {
        badge: "共轭分母实数化",
        condition:
          "分母乘其共轭必得实数：$(c+di)(c-di) = c^2 + d^2 = |z_2|^2$。",
        question:
          "化简 $\\dfrac{z_1}{z_2}$ 时，为什么必须同乘 $\\overline{z_2}$ 而不是 $z_2$？$z_2 \\cdot \\overline{z_2}$ 为什么必然是非负实数，它等于 $|z_2|$ 的几次方？",
      };
    }
    return {
      badge: "复数代数乘除展开",
      condition:
        "乘法按多项式展开：$(a+bi)(c+di) = (ac-bd) + (ad+bc)i$，其中 $bd\\,i^2 = -bd$ 并入实部。",
      question:
        "能否直接口算出 $(3+2i)(1+3i)$ 与 $\\dfrac{3+2i}{1+3i}$ 的代数形式？为什么乘积的模长总等于两模长之积，而交换两个因式后乘积却不变？",
    };
  }
  if (subModel === "circle") {
    return {
      badge: "圆轨迹与定点最值",
      condition:
        "方程 $|z - z_0| = R$ 刻画以 $z_0$ 为圆心、$R$ 为半径的圆周动点集合。",
      question:
        "动点满足 $|z - z_0| = R$ 时，能否不解方程直接写出 $|z - w|$ 的最大值与最小值？取到最值的那一刻，$Z$、$Z_0$、$w$ 三点为什么必然共线？",
    };
  }
  if (subModel === "perp-bisector") {
    return {
      badge: "垂直平分线轨迹",
      condition:
        "方程 $|z - z_1| = |z - z_2|$ 刻画到两定点欧几里得距离相等的动点轨迹。",
      question:
        "由 $|z - z_1| = |z - z_2|$ 如何直接写出垂直平分线的方程？当两定点关于虚轴或原点对称时，这条中垂线会退化成哪一条特殊直线？",
    };
  }
  return {
    badge: "模的三角不等式",
    condition:
      "向量和与差满足三角不等式：$||z_1| - |z_2|| \\le |z_1 + z_2| \\le |z_1| + |z_2|$。",
    question:
      "$z_1$、$z_2$ 满足什么位置关系时 $|z_1 + z_2|$ 取到上界 $|z_1| + |z_2|$、什么关系时取到下界 $\\bigl||z_1| - |z_2|\\bigr|$？请给出取等条件并说明理由。",
  };
}

export function ComplexAnimation() {
  const [studyMode, setStudyMode] = useState<StudyMode>("plane-operations");
  const [activePreset, setActivePreset] = useState<string>("free");
  const [subModel, setSubModel] = useState<LocusSubModel>("circle");
  const [algebraicSub, setAlgebraicSub] =
    useState<AlgebraicSubModel>("multiply-divide");

  // 当前生效的子情景：两个模式族各自保留选择记忆，切换模式不丢选择。
  const activeSubModel: ComplexSubModel =
    studyMode === "algebraic-operations" ? algebraicSub : subModel;

  // 参数状态控制
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 视口尺寸测量与自适应
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 比例尺坐标系：默认 [-6, 6] × [-4.5, 4.5]；
  // 代数运算模式的落点是「乘积 / 商」，模长可达输入模长之积，须放大视口才装得下
  // （见 sceneConfig 中 COMPLEX_VIEWPORT_ALGEBRAIC 的说明）。
  const sceneViewport = useMemo(
    () => resolveComplexViewport(studyMode, activeSubModel),
    [studyMode, activeSubModel],
  );
  const scale = useSceneScale({
    vp,
    xRange: sceneViewport.xRange,
    yRange: sceneViewport.yRange,
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

  // 代数运算子情景切换
  const handleAlgebraicSubChange = (model: AlgebraicSubModel) => {
    setAlgebraicSub(model);
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
    } else if (studyMode === "algebraic-operations") {
      const preset = COMPLEX_ALGEBRAIC_PRESETS[algebraicSub].find(
        (item) => item.key === presetKey,
      );
      if (preset) setParams((prev) => ({ ...prev, ...preset.params }));
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
    } else if (studyMode === "locus-extrema") {
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
    } else if (studyMode === "algebraic-operations") {
      if (algebraicSub === "power-cycle") {
        modeKeyGroups = [
          { group: "幂指数 n（i 的幂以 4 为周期循环）", keys: ["powerN"] },
        ];
      } else {
        modeKeyGroups = [
          { group: "复数 z₁ = a₁ + b₁i (实部与虚部)", keys: ["a1", "b1"] },
          { group: "复数 z₂ = a₂ + b₂i (实部与虚部)", keys: ["a2", "b2"] },
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
  }, [params, studyMode, activePreset, subModel, algebraicSub]);

  // 典型预设项
  const presetItems = useMemo(() => {
    if (studyMode === "plane-operations") {
      return [
        { key: "free", label: "自由探究", description: "全参数开放" },
        {
          key: "conjugate-pair",
          label: "共轭复数对",
          description: "锁定实轴对称",
        },
        {
          key: "pure-real-imag",
          label: "实轴与虚轴",
          description: "轴上点对照",
        },
        {
          key: "opposite",
          label: "相反数对",
          description: "原点中心对称",
        },
      ];
    }
    if (studyMode === "multiplication-rotation") {
      return [
        { key: "free", label: "自由探究", description: "全参数开放" },
        {
          key: "rot-90",
          label: "逆时针九十度",
          description: "锁定逆时针90度",
        },
        {
          key: "rot-180",
          label: "中心对称旋转",
          description: "锁定中心对称180度",
        },
        {
          key: "rot-45",
          label: "四十五度旋转",
          description: "锁定45度等模旋转",
        },
      ];
    }

    if (studyMode === "locus-extrema" && subModel === "circle") {
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

    if (studyMode === "locus-extrema" && subModel === "perp-bisector") {
      return [
        { key: "free", label: "自由探究", description: "全参数开放" },
        {
          key: "horizontal-sym",
          label: "关于虚轴对称",
          description: "中垂线为虚轴",
        },
        {
          key: "origin-sym",
          label: "关于原点对称",
          description: "中垂线过原点",
        },
      ];
    }

    if (studyMode === "algebraic-operations") {
      return COMPLEX_ALGEBRAIC_PRESETS[algebraicSub].map(
        ({ key, label, description }) => ({ key, label, description }),
      );
    }

    return [
      { key: "free", label: "自由探究", description: "全参数开放" },
      {
        key: "collinear-same",
        label: "同向共线取等",
        description: "最大值状态",
      },
      {
        key: "collinear-opposite",
        label: "反向共线取等",
        description: "最小值状态",
      },
      {
        key: "orthogonal",
        label: "正交垂直状态",
        description: "勾股定理",
      },
    ];
  }, [studyMode, subModel, algebraicSub]);

  // 数学量看板数据计算与组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-complex-geometry", params, {
      mode: studyMode,
      subModel: activeSubModel,
    });
  }, [params, studyMode, activeSubModel]);

  // 实时悬浮公式计算（严格使用色彩 Token）
  const equationLatex = useMemo(() => {
    if (studyMode === "plane-operations") {
      const z1Str = formatComplexLatex(createComplex(params.a1, params.b1));
      const z2Str = formatComplexLatex(createComplex(params.a2, params.b2));
      return `z_1 = \\color{${MATH_COLORS.paramPrimary}}{${z1Str}}, \\quad z_2 = \\color{${MATH_COLORS.paramSecondary}}{${z2Str}}`;
    }
    if (studyMode === "multiplication-rotation") {
      return `z_1 z_2 = (\\color{${MATH_COLORS.paramPrimary}}{r_1} \\color{${MATH_COLORS.paramSecondary}}{r_2}) \\cdot \\left[\\cos(\\color{${MATH_COLORS.paramPrimary}}{\\theta_1} + \\color{${MATH_COLORS.paramSecondary}}{\\theta_2}) + i\\sin(\\color{${MATH_COLORS.paramPrimary}}{\\theta_1} + \\color{${MATH_COLORS.paramSecondary}}{\\theta_2})\\right]`;
    }
    if (studyMode === "algebraic-operations") {
      if (algebraicSub === "power-cycle") {
        const n = params.powerN ?? 1;
        const cur = powerOfI(n);
        return `n = ${n}, \\quad n \\bmod 4 = ${cur.residue}, \\quad i^{n} = \\color{${MATH_COLORS.paramPrimary}}{${cur.latex}}`;
      }
      const z1Str = formatComplexLatex(createComplex(params.a1, params.b1));
      const z2Str = formatComplexLatex(createComplex(params.a2, params.b2));
      if (algebraicSub === "conjugate-rationalize") {
        return `\\dfrac{z_1}{z_2} = \\dfrac{z_1 \\overline{z_2}}{|z_2|^2}, \\quad z_1 = \\color{${MATH_COLORS.paramPrimary}}{${z1Str}}, \\quad z_2 = \\color{${MATH_COLORS.paramSecondary}}{${z2Str}}`;
      }
      const prodStr = formatComplexLatex(
        mulComplex(
          createComplex(params.a1, params.b1),
          createComplex(params.a2, params.b2),
        ),
      );
      return `z_1 z_2 = (\\color{${MATH_COLORS.paramPrimary}}{${z1Str}}) (\\color{${MATH_COLORS.paramSecondary}}{${z2Str}}) = \\color{${MATH_COLORS.paramTertiary}}{${prodStr}}`;
    }
    if (subModel === "circle") {
      return `|z - (\\color{${MATH_COLORS.paramPrimary}}{${params.z0x} + ${params.z0y}i})| = \\color{${MATH_COLORS.paramPrimary}}{${params.radius}}`;
    }
    if (subModel === "perp-bisector") {
      return `|z - z_1| = |z - z_2|`;
    }
    return `||z_1| - |z_2|| \\le |z_1 + z_2| \\le |z_1| + |z_2|`;
  }, [params, studyMode, algebraicSub, subModel]);

  // 看板标题
  const panelTitle = useMemo(() => {
    if (studyMode === "plane-operations") return "复平面与代数运算看板";
    if (studyMode === "multiplication-rotation") return "乘法旋转与伸缩看板";
    if (studyMode === "algebraic-operations") {
      if (algebraicSub === "power-cycle") return "i 的周期幂看板";
      if (algebraicSub === "conjugate-rationalize") return "共轭分母实数化看板";
      return "复数代数乘除展开看板";
    }
    if (subModel === "circle") return "复数圆轨迹与最值看板";
    if (subModel === "perp-bisector") return "垂直平分线轨迹看板";
    return "模的三角不等式看板";
  }, [studyMode, subModel, algebraicSub]);

  // 左屏教学引导卡文案（纯函数派生，定义见文件顶部 resolveTipContent）
  const tipContent = resolveTipContent(studyMode, subModel, algebraicSub);

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
                {
                  key: "algebraic-operations",
                  label: "复数代数运算与 i 的幂",
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
                  { key: "circle", label: "圆周轨迹与定点最值" },
                  {
                    key: "perp-bisector",
                    label: "垂直平分线距离轨迹",
                  },
                  { key: "triangle-ineq", label: "模的三角不等式放缩" },
                ]}
                value={subModel}
                onChange={(k) => handleSubModelChange(k as LocusSubModel)}
                variant="filled"
                color="primary"
              />
            </LeftPanelSection>
          )}

          {/* 1.2 代数运算模式下的子情景选择 */}
          {studyMode === "algebraic-operations" && (
            <LeftPanelSection
              title="代数运算情景"
              subtitle="选择高考必考的代数运算专项"
            >
              <SelectGrid
                columns={1}
                items={[
                  { key: "multiply-divide", label: "乘除展开与共轭实数化" },
                  { key: "conjugate-rationalize", label: "分母实数化专项" },
                  { key: "power-cycle", label: "i 的幂周期与分组求和" },
                ]}
                value={algebraicSub}
                onChange={(k) =>
                  handleAlgebraicSubChange(k as AlgebraicSubModel)
                }
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

          {/* 4. 底部教学引导卡片 */}
          <LeftPanelSection
            title="教学探究引导"
            subtitle="带着核心问题在画布中探索"
          >
            <TipCard
              badge={tipContent.badge}
              condition={tipContent.condition}
              question={tipContent.question}
            />
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
              subModel={activeSubModel}
            />
          </AnimationSvgCanvas>
        </div>
      }
      right={<MathPanel {...mathData} title={panelTitle} />}
    />
  );
}
