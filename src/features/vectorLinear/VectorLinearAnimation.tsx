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
import { VectorLinearScene } from "./components/VectorLinearScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  defaultParams,
  paramMeta,
  unitVectorPresetParams,
  VECTOR_PHYSICS_PRESETS,
  resolveVectorPhysicsContext,
  isVectorPhysicsContext,
  type VectorPhysicsContext,
} from "@/data/registries/vectorLinear";
import { computeVectorLinear } from "@/math/vectorLinear";

/** 教学研究模式：加减与数乘 / 三点共线 / 平面向量基本定理 */
type StudyMode = "linearCombo" | "collinear" | "basis";

/**
 * 物理实际背景（必修二 6.4.2 向量在物理中的应用）的左屏导引文案。
 *
 * 与数学情景同理，必须落在**对象字面量**里：审计规则 `left/tipcard-quality`
 * 只扫 `question: "…"` 这类可达的字面量，写成 JSX 内联三元会重新躲进审计盲区。
 * 三个设问一律直击高考采分动作（求取值范围 / 由合力为零推第三力 / 判断渡河时间由谁决定），
 * 而不是「拖一拖、看一看」式的空泛套话。
 */
const PHYSICS_TIP: Record<
  VectorPhysicsContext,
  { badge: string; condition: string; question: string }
> = {
  "force-resultant": {
    badge: "向量的物理应用 · 力的合成",
    condition:
      "两力共点、夹角为 $\\theta$：由 $|\\vec{F}_1| - |\\vec{F}_2| \\le |\\vec{F}| \\le |\\vec{F}_1| + |\\vec{F}_2|$ 可知，夹角越大合力越小。",
    question:
      "已知 $|\\vec{F}_1| = 4$、$|\\vec{F}_2| = 3$，合力的大小一定等于 5 吗？写出 $|\\vec{F}|$ 的取值范围，并说明取到两个端点时两力的夹角。",
  },
  "force-balance": {
    badge: "向量的物理应用 · 三力平衡",
    condition:
      "三个共点力使物体保持平衡，则 $\\vec{F}_1 + \\vec{F}_2 + \\vec{F}_3 = \\vec{0}$，三力首尾相接构成闭合三角形。",
    question:
      "已知其中两个力，能否不做受力分析就写出第三个力？$\\vec{F}_3$ 与 $\\vec{F}_1 + \\vec{F}_2$ 的大小、方向各满足什么关系？",
  },
  "velocity-compose": {
    badge: "向量的物理应用 · 速度的合成",
    condition:
      "小船渡河时同时参与划行与漂移，实际速度 $\\vec{v} = \\vec{v}_{\\text{水}} + \\vec{v}_{\\text{船}}$。",
    question:
      "水流速度增大时，船渡到对岸的时间会变长吗？实际速度的大小、渡河时间各由哪一个分量决定？",
  },
};

/**
 * 左屏教学导引文案（模块级纯函数）。
 *
 * 历史缺陷：这里的设问原本写成 JSX 内联三元字符串，而审计规则 `left/tipcard-quality`
 * 只扫 `question: "…"` 这类对象字面量，于是「调节标量观察合成向量对角线变化」
 * 这种低阶空泛套话长期躲在审计视野之外。改为纯函数后文案重新进入审计范围，
 * 也倒逼设问必须直击高考目标（写出坐标形式 / 判断取值 / 证明唯一性），
 * 而不是"拖一拖、看一看"。
 */
function resolveTipContent(
  studyMode: StudyMode,
  showUnitVectors: boolean,
  physicsContext: VectorPhysicsContext | null,
) {
  if (studyMode === "linearCombo") {
    // 物理情景优先：它同时改写了中屏标签与右屏口径，导引文案必须跟着换
    if (physicsContext) return PHYSICS_TIP[physicsContext];
    return showUnitVectors
      ? {
          badge: "单位向量与向量单位化",
          condition:
            "非零向量 $\\vec{a}$、$\\vec{b}$ 与它们的单位向量共起点 $O$，单位向量的终点始终落在单位圆上。",
          question:
            "已知 $\\vec{a} = (3, 4)$，能否不解方程、直接用坐标写出与 $\\vec{a}$ 同向的单位向量？为什么它的长度恒为 1，与 $|\\vec{a}|$ 的大小无关？",
        }
      : {
          badge: "向量加减与数乘运算",
          condition: "基准向量 a, b 共起点 O，实数标量 λ, μ 连续可调。",
          question:
            "已知 $\\vec{a} = (x_a, y_a)$、$\\vec{b} = (x_b, y_b)$，能否只用坐标写出 $\\lambda\\vec{a} + \\mu\\vec{b}$ 与 $\\vec{a} - \\vec{b}$？当 $\\lambda = \\mu = 1$ 时和向量为何恰是平行四边形的对角线？",
        };
  }
  if (studyMode === "collinear") {
    return {
      badge: "三点共线与分点定理",
      condition: "点 C 满足向量 OC = xOA + yOB。",
      question:
        "当且仅当 x + y = 1 时，动点 C 的轨迹为何必然是一条过 A, B 的直线？",
    };
  }
  return {
    badge: "平面向量基本定理",
    condition: "基底向量 a, b 不共线，v 为平面内的任意目标向量。",
    question: "任意向量 v 沿不共线基底的分解系数 (x, y) 是否存在且唯一？",
  };
}

export function VectorLinearAnimation() {
  const [studyMode, setStudyMode] = useState<StudyMode>("linearCombo");

  // 典型预设状态
  const [presetKey, setPresetKey] = useState<string>("free");

  // 「单位向量化」叠加图层开关：由同名预设开启，拖拽动点时保持开启（切换预设/模式/重置即关闭）
  const [showUnitVectors, setShowUnitVectors] = useState(false);

  // 参数状态
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 视口尺寸测量
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 坐标系比例尺范围 X [-6, 6]，Y [-4.5, 4.5]
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 是否处于三点共线严格锁定状态 (由预设决定，无需外挂多余开关)
  const isCollinearLocked =
    studyMode === "collinear" && presetKey !== "plane-free";

  /**
   * 物理实际背景情景（必修二 6.4.2）：由「模式 + 预设 key」派生，非物理预设为 null。
   *
   * 只有一个来源（presetKey），不另设开关 —— 左屏预设高亮、中屏箭头标签、右屏看板口径
   * 若各记一个状态，迟早会出现「左屏选着力的合成、中屏却还写着 a + b」的错位。
   */
  const physicsContext = useMemo(
    () => resolveVectorPhysicsContext(studyMode, presetKey),
    [studyMode, presetKey],
  );

  // 典型预设定义
  const presetsByMode = useMemo(() => {
    return {
      linearCombo: [
        { key: "free", label: "自由探究", description: "全参数开放" },
        {
          key: "parallelogram",
          label: "平行四边形合成",
          description: "系数均为1向量加法",
        },
        {
          key: "subtraction",
          label: "三角形差向量",
          description: "系数反号差向量",
        },
        {
          key: "scaleUp",
          label: "数乘伸缩倍数",
          description: "数乘缩放与方向倍数",
        },
        {
          key: "unit-vector",
          label: "单位向量化",
          description: "方向归一、落在单位圆",
          // 整块布局 2 + 2 + 1 + 2 + 1：每个 fullWidth 项各起一行，
          // 数学情景与物理情景之间不出现半行空位。
          fullWidth: true,
        },
        // —— 实际背景（必修二 6.4.2）：同一套向量加法，三件物理外衣 ——
        // 仍按「2 + 1」收尾，使物理三情景自成一块、不与上面的数学情景混行。
        {
          key: "force-resultant",
          label: "力的合成",
          description: "两共点力求合力",
        },
        {
          key: "force-balance",
          label: "三力平衡",
          description: "三力闭合三角形",
        },
        {
          key: "velocity-compose",
          label: "速度的合成",
          description: "船渡河：船速与水流",
          fullWidth: true,
        },
      ],
      collinear: [
        {
          key: "collinear-line",
          label: "三点共线约束",
          description: "系数之和严格为一",
        },
        {
          key: "midpoint",
          label: "线段中点向量",
          description: "等权中点向量合成",
        },
        {
          key: "trisection",
          label: "三等分内分点",
          description: "二比一定比分点",
        },
        {
          key: "plane-free",
          label: "全平面自由验证",
          description: "系数和不为一验证偏离",
        },
      ],
      basis: [
        { key: "free", label: "自由探究", description: "全参数开放" },
        {
          key: "orthogonal",
          label: "标准正交基底",
          description: "笛卡尔坐标系正交",
        },
        {
          key: "oblique",
          label: "一般斜坐标基底",
          description: "唯一分解定理验证",
        },
        {
          key: "degenerate",
          label: "基底共线退化",
          description: "共线无法张成平面",
        },
      ],
    };
  }, []);

  // 切换模式时重置预设
  const handleModeChange = (mode: StudyMode) => {
    setStudyMode(mode);
    setPresetKey(mode === "collinear" ? "collinear-line" : "free");
    // 单位向量图层只在加减与数乘模式下成立（模式二/三以 OA、OB 与 e₁、e₂ 命名，叠加会撞名）
    setShowUnitVectors(false);
  };

  // 应用典型预设
  const handlePresetChange = (preset: string) => {
    setPresetKey(preset);
    // 单位向量图层随预设开关（拖拽动点时由 handleBatchParamsChange 保留）
    setShowUnitVectors(preset === "unit-vector");
    if (preset === "free") return;

    if (studyMode === "linearCombo") {
      if (preset === "parallelogram") {
        setParams((p) => ({ ...p, lambda: 1, mu: 1 }));
      } else if (preset === "subtraction") {
        setParams((p) => ({ ...p, lambda: 1, mu: -1 }));
      } else if (preset === "scaleUp") {
        setParams((p) => ({ ...p, lambda: 2, mu: 0.5 }));
      } else if (preset === "unit-vector") {
        // 3-4-5 直角三角形：|a| = 5 ⇒ e_a = (0.6, 0.8)（SSOT 见 registries/vectorLinear.ts）
        setParams((p) => ({ ...p, ...unitVectorPresetParams }));
      } else if (isVectorPhysicsContext(preset)) {
        // 物理三情景：参数同样取自 registry SSOT，且一律把 λ、μ 钉在 1
        // （力的合成与平衡都是纯向量加法，混进数乘系数物理上就说不通了）
        setParams((p) => ({ ...p, ...VECTOR_PHYSICS_PRESETS[preset].params }));
      }
    } else if (studyMode === "collinear") {
      if (preset === "collinear-line") {
        setParams((p) => ({ ...p, xCoeff: 0.4, yCoeff: 0.6 }));
      } else if (preset === "midpoint") {
        setParams((p) => ({ ...p, xCoeff: 0.5, yCoeff: 0.5 }));
      } else if (preset === "trisection") {
        setParams((p) => ({ ...p, xCoeff: 0.67, yCoeff: 0.33 }));
      } else if (preset === "plane-free") {
        setParams((p) => ({ ...p, xCoeff: 0.8, yCoeff: 0.8 }));
      }
    } else if (studyMode === "basis") {
      if (preset === "orthogonal") {
        setParams((p) => ({ ...p, xa: 3, ya: 0, xb: 0, yb: 3, xv: 3, yv: 2 }));
      } else if (preset === "oblique") {
        setParams((p) => ({
          ...p,
          xa: 3,
          ya: 1,
          xb: 1,
          yb: 3,
          xv: 4,
          yv: 3.5,
        }));
      } else if (preset === "degenerate") {
        setParams((p) => ({ ...p, xa: 2, ya: 1, xb: 4, yb: 2, xv: 3, yv: 3 }));
      }
    }
  };

  // 数学计算结果
  const mathRes = useMemo(
    () => computeVectorLinear({ ...params, lockCollinear: isCollinearLocked }),
    [params, isCollinearLocked],
  );

  // 看板数据
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-vector-linear", params, {
      studyMode,
      lockCollinear: isCollinearLocked,
      // 物理情景需透传给数据层：builder 只认语义化的 physicsContext，不认识左屏 preset key
      physicsContext: physicsContext ?? "",
    });
  }, [params, studyMode, isCollinearLocked, physicsContext]);

  // 参数单项更新处理器
  const handleParamChange = useCallback(
    (key: string, value: number) => {
      setParams((prev) => {
        const next = { ...prev, [key]: value };
        if (isCollinearLocked && key === "xCoeff") {
          next.yCoeff = Math.round((1 - value) * 100) / 100;
        } else if (isCollinearLocked && key === "yCoeff") {
          next.xCoeff = Math.round((1 - value) * 100) / 100;
        }
        return next;
      });
    },
    [isCollinearLocked],
  );

  // 参数批量原子更新处理器（画布直接拖拽动点时使用，自动切回自由模式）
  const handleBatchParamsChange = useCallback(
    (updates: Record<string, number>) => {
      // 「unit-vector」不是参数锁而是叠加图层：拖拽动点时图层与预设高亮都必须保留，
      // 否则学生一动 a，正要观察的单位圆就消失了。
      // 物理三情景同理：拖动力向量看合力怎么变，正是它们要让学生做的事；
      // 一旦掉回「自由探究」，中屏箭头命名与右屏看板会同时丢失物理语境。
      if (
        presetKey !== "free" &&
        presetKey !== "collinear-line" &&
        presetKey !== "unit-vector" &&
        !isVectorPhysicsContext(presetKey)
      ) {
        setPresetKey(studyMode === "collinear" ? "collinear-line" : "free");
      }
      setParams((prev) => ({ ...prev, ...updates }));
    },
    [presetKey, studyMode],
  );

  // 重置参数
  const handleReset = () => {
    setParams({ ...defaultParams });
    setPresetKey(studyMode === "collinear" ? "collinear-line" : "free");
    setShowUnitVectors(false);
  };

  // 按研究模式过滤参数并实现真正降维
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    let activeKeys: string[] = [];

    if (studyMode === "linearCombo") {
      // 这几个预设把 λ、μ 钉死在具体值上，探究重点是基向量（力向量）本身
      // → 收起标量滑块降维。物理三情景尤甚：力的合成与平衡都是纯向量加法，
      // 露出 λ、μ 会让学生把「力的倍数」当成一个真的物理量。
      if (
        presetKey === "parallelogram" ||
        presetKey === "subtraction" ||
        presetKey === "unit-vector" ||
        physicsContext !== null
      ) {
        activeKeys = ["xa", "ya", "xb", "yb"];
      } else {
        activeKeys = ["lambda", "mu", "xa", "ya", "xb", "yb"];
      }
    } else if (studyMode === "collinear") {
      if (isCollinearLocked) {
        // 锁定 x+y=1：仅需一个 xCoeff 分点滑块，实现极致降维
        activeKeys = ["xCoeff", "xa", "ya", "xb", "yb"];
      } else {
        // 全平面自由：开放两个滑块
        activeKeys = ["xCoeff", "yCoeff", "xa", "ya", "xb", "yb"];
      }
    } else {
      activeKeys = ["xv", "yv", "xa", "ya", "xb", "yb"];
    }

    return activeKeys
      .filter((key) => key in paramMeta)
      .map((key) => {
        const meta = paramMeta[key];
        return {
          key,
          label:
            isCollinearLocked && key === "xCoeff"
              ? "共线分点系数 x (y=1-x)"
              : meta.label,
          labelFormula: meta.labelFormula,
          value: params[key] ?? meta.defaultValue ?? 0,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 0.1,
          description:
            isCollinearLocked && key === "xCoeff"
              ? "0~1为内分点，0.5为中点，<0或>1为外分点"
              : meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
          group: meta.group,
        };
      });
  }, [params, studyMode, presetKey, isCollinearLocked, physicsContext]);

  // 渲染顶端悬浮 LaTeX 表达式
  const equationLatex = useMemo(() => {
    if (studyMode === "linearCombo") {
      // 物理情景：顶部悬浮公式给出「符号式 = 坐标式」，与中屏箭头、右屏看板同源。
      // 三力平衡时坐标给的是平衡力 F₃（= −(F₁ + F₂)），其余情景给合力 / 实际速度。
      if (physicsContext) {
        const preset = VECTOR_PHYSICS_PRESETS[physicsContext];
        const third = preset.naming.third;
        if (third) {
          return `${third.vecLatex} = -(${preset.naming.first.vecLatex} + ${preset.naming.second.vecLatex}) = (${mathRes.closingVec.x.toFixed(1)}, ${mathRes.closingVec.y.toFixed(1)})`;
        }
        return `${preset.equation} = (${mathRes.sumVec.x.toFixed(1)}, ${mathRes.sumVec.y.toFixed(1)})`;
      }
      // 单位向量化预设下，顶部悬浮公式改为「单位化」主推结论（与左屏预设、右屏看板同源）
      if (showUnitVectors && mathRes.isUnitADefined) {
        return `\\vec{e}_a = \\frac{\\vec{a}}{|\\vec{a}|} = (${mathRes.unitA.x.toFixed(
          2,
        )}, ${mathRes.unitA.y.toFixed(2)})`;
      }
      const lambdaStr = `\\color{${MATH_COLORS.paramPrimary}}{${params.lambda ?? 1}}\\vec{a}`;
      const muStr = `\\color{${MATH_COLORS.paramSecondary}}{${params.mu ?? 1}}\\vec{b}`;
      return `\\vec{s} = ${lambdaStr} + ${muStr} = (${mathRes.sumVec.x.toFixed(
        1,
      )}, ${mathRes.sumVec.y.toFixed(1)})`;
    } else if (studyMode === "collinear") {
      const sumStr = mathRes.coeffSum.toFixed(2);
      return `\\vec{OC} = x\\vec{OA} + y\\vec{OB} \\quad (x+y = ${sumStr})`;
    } else {
      if (!mathRes.isBasisValid) {
        return `x_1 y_2 - x_2 y_1 = 0 \\quad (\\vec{e}_1 \\parallel \\vec{e}_2)`;
      }
      return `\\vec{v} = \\color{${MATH_COLORS.paramPrimary}}{${mathRes.lambda1.toFixed(
        2,
      )}}\\vec{e}_1 + \\color{${MATH_COLORS.paramSecondary}}{${mathRes.lambda2.toFixed(
        2,
      )}}\\vec{e}_2`;
    }
  }, [studyMode, params, mathRes, showUnitVectors, physicsContext]);

  // 看板标题
  const panelTitle = useMemo(() => {
    // 物理情景自带标题（力的合成 / 三力平衡 / 速度的合成看板），
    // 否则右屏会顶着「向量加减与数乘看板」讲力的平衡，文不对题。
    if (studyMode === "linearCombo") {
      return physicsContext
        ? `${VECTOR_PHYSICS_PRESETS[physicsContext].label}看板`
        : "向量加减与数乘看板";
    }
    if (studyMode === "collinear") return "三点共线与分点定理看板";
    return "平面向量基本定理看板";
  }, [studyMode, physicsContext]);

  // 左屏教学导引文案（与当前模式 / 单位向量图层 / 物理情景同步特化）
  const tipContent = resolveTipContent(
    studyMode,
    showUnitVectors,
    physicsContext,
  );

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择 Section */}
          <LeftPanelSection title="探究主题">
            <SelectGrid
              items={[
                { key: "linearCombo", label: "加减与数乘" },
                { key: "collinear", label: "三点共线" },
                { key: "basis", label: "基本定理", fullWidth: true },
              ]}
              value={studyMode}
              onChange={(k) => handleModeChange(k as StudyMode)}
              variant="filled"
              columns={2}
            />
          </LeftPanelSection>

          {/* 典型预设 (实现参数降维) */}
          <LeftPanelSection title="典型预设">
            <SelectGrid
              items={presetsByMode[studyMode]}
              value={presetKey}
              onChange={handlePresetChange}
              variant="filled"
              color="primary"
              columns={2}
            />
          </LeftPanelSection>

          {/* 参数调节 Section */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>
          {/* 教学引导与探究问题（置于最底部） */}
          <TipCard
            variant="primary"
            badge={tipContent.badge}
            condition={tipContent.condition}
            question={tipContent.question}
          />
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 实时公式悬浮卡片 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={equationLatex} mode="inline" />
          </div>

          {/* SVG Canvas 画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <VectorLinearScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              onBatchParamsChange={handleBatchParamsChange}
              fontScale={canvasSize.font}
              studyMode={studyMode}
              lockCollinear={isCollinearLocked}
              showUnitVectors={showUnitVectors}
              physicsContext={physicsContext}
            />
          </AnimationSvgCanvas>
        </div>
      }
      right={<MathPanel {...mathData} title={panelTitle} />}
    />
  );
}
