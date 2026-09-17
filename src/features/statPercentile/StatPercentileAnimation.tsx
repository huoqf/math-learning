import { useState, useMemo, useCallback } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  KatexFormula,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { SceneLegend } from "@/components/Math";
import type { SceneLegendItem } from "@/components/Math/SceneLegend";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { StatPercentileScene } from "./components/StatPercentileScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  defaultParams,
  paramMeta,
  MODE_SCENARIOS,
} from "@/data/registries/statPercentile";
import type { StudyMode } from "@/data/registries/statPercentile";

export function StatPercentileAnimation() {
  // 一级探究模式：'histogram' | 'cumulative' | 'stratified'
  const [studyMode, setStudyMode] = useState<StudyMode>("histogram");

  // 二级典型高考情景预设（首选为 'free' 自由探索）
  const [activeScenario, setActiveScenario] = useState<string>("free");

  // 参数状态保存
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  const groupCount = params.groupCount ?? 6;

  // 视口尺寸测量与防抖
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 坐标系横轴区间：根据组数自适应扩展（6 组高考模型 [40, 100]、5 组课本模型 [50, 100]、8 组 [30, 110]）
  const xRange: [number, number] = useMemo(() => {
    if (studyMode === "stratified") return [42, 108];
    if (groupCount === 5) return [42, 108];
    if (groupCount === 8) return [22, 118];
    return [32, 108]; // 6 组标准高考模型
  }, [studyMode, groupCount]);

  // 坐标系比例尺
  const scale = useSceneScale({
    vp,
    xRange,
    yRange:
      studyMode === "stratified"
        ? [-0.15, 1.15]
        : studyMode === "cumulative"
          ? [-0.12, 1.15]
          : [-0.007, 0.054],
    keepAspectRatio: false,
  });

  // 数学量看板数据计算与组装（带二级情景特化）
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-stat-percentile", params, {
      studyMode,
      activeScenario,
    });
  }, [params, studyMode, activeScenario]);

  // 参数更新处理器（学生主动调参或中屏拖拽动点时，切回相应探索状态）
  const handleParamChange = useCallback(
    (key: string, value: number) => {
      // 若当前在两层合并情景下调参，保持两层结构（N3=0），不弹回三层
      if (activeScenario === "twoStrata") {
        setParams((prev) => ({
          ...prev,
          N3: 0,
          var3: 0,
          [key]: value,
        }));
      } else {
        setActiveScenario("free");
        setParams((prev) => ({
          ...prev,
          [key]: value,
        }));
      }
    },
    [activeScenario],
  );

  // 切换一级研究模式（单模式闭环：重置二级情景为 'free'）
  const handleStudyModeChange = (newMode: string) => {
    const m = newMode as StudyMode;
    setStudyMode(m);
    setActiveScenario("free");
  };

  // 载入二级情景预设（参数题设锁定与降维）
  const handleScenarioSelect = (scenarioKey: string) => {
    setActiveScenario(scenarioKey);
    const scenarioList = MODE_SCENARIOS[studyMode];
    const scenario = scenarioList.find((s) => s.key === scenarioKey);
    if (scenario?.params) {
      setParams((prev) => ({
        ...prev,
        ...scenario.params,
      }));
    }
  };

  // 重置参数
  const handleReset = () => {
    setActiveScenario("free");
    setParams({ ...defaultParams });
  };

  // 根据当前 activeMode 与 activeScenario 进行声明式参数裁剪（参数降维核心初衷）
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const scenarioList = MODE_SCENARIOS[studyMode];
    const currentScenario =
      scenarioList.find((s) => s.key === activeScenario) ?? scenarioList[0];

    const defaultKeysByMode: Record<StudyMode, string[]> = {
      histogram: ["groupCount", "shift"],
      cumulative: ["groupCount", "percentileP", "shift"],
      stratified: [
        "sampleN",
        "N1",
        "N2",
        "N3",
        "mean1",
        "mean2",
        "mean3",
        "var1",
        "var2",
        "var3",
      ],
    };

    // 如果当前情景定义了可见参数白名单 visibleKeys，则仅展示白名单参数
    const allowedKeys =
      currentScenario.visibleKeys ?? defaultKeysByMode[studyMode];

    return allowedKeys
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
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
          group: meta.group,
        };
      });
  }, [params, studyMode, activeScenario]);

  // 看板标题
  const panelTitle = useMemo(() => {
    if (studyMode === "histogram") return "直方图与数字特征看板";
    if (studyMode === "cumulative") return "百分位数与累积频率看板";
    return "分层抽样与总体方差看板";
  }, [studyMode]);

  // 顶部悬浮公式（铁律 4C 色彩绑定）
  const topFormulaLatex = useMemo(() => {
    if (studyMode === "histogram") {
      return `\\text{矩形面积 } f_i = h_i \\cdot d, \\quad \\color{${MATH_COLORS.function}}{\\bar{x} = \\sum x_{\\text{mid}, i} \\cdot f_i} \\quad (\\text{力矩重心})`;
    }
    if (studyMode === "cumulative") {
      return `x_p = a + \\frac{\\color{${MATH_COLORS.paramPrimary}}{\\frac{p}{100} - F_{\\text{prev}}}}{\\color{${MATH_COLORS.function}}{h}} \\quad (\\text{面积线性插值})`;
    }
    return `s^2 = \\sum \\color{${MATH_COLORS.function}}{w_i s_i^2} + \\sum \\color{${MATH_COLORS.paramSecondary}}{w_i (\\bar{x}_i - \\bar{x})^2} \\quad (\\text{组内方差} + \\text{组间离差})`;
  }, [studyMode]);

  // 中屏右下角图例配置 (SceneLegend)
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    if (studyMode === "histogram") {
      return [
        {
          color: MATH_COLORS.function,
          label: "直方图各组频率矩形",
          style: "area",
        },
        {
          color: MATH_COLORS.paramTertiary,
          formula: "\\text{估算众数 } M_o \\text{ (最高组中点)}",
          style: "dash",
        },
        {
          color: MATH_COLORS.paramSecondary,
          formula: "\\text{中位数 } M_e \\text{ (平分面积线)}",
          style: "dash",
        },
        {
          color: MATH_COLORS.function,
          formula: "\\text{估算均值 } \\bar{x} \\text{ (力矩重心 ▲)}",
          style: "dash",
        },
      ];
    }
    if (studyMode === "cumulative") {
      return [
        {
          color: MATH_COLORS.paramPrimary,
          formula: `\\text{已累积 } ${params.percentileP}\\% \\text{ 面积}`,
          style: "area",
        },
        {
          color: MATH_COLORS.paramSecondary,
          label: "累积频率 S 型折线",
          style: "solid",
        },
        {
          color: MATH_COLORS.paramPrimary,
          formula: `P_{${params.percentileP}} \\text{ 投影插值}`,
          style: "dash",
        },
        {
          color: MATH_COLORS.paramSecondary,
          label: "四分位箱线图 (五数概括)",
          style: "solid",
        },
      ];
    }
    // stratified
    return [
      {
        color: MATH_COLORS.paramPrimary,
        formula: "\\text{层 1 均值 } \\bar{x}_1 \\text{ 与波动区间}",
        style: "solid",
      },
      {
        color: MATH_COLORS.paramSecondary,
        formula: "\\text{层 2 均值 } \\bar{x}_2 \\text{ 与波动区间}",
        style: "solid",
      },
      {
        color: MATH_COLORS.paramTertiary,
        formula: "\\text{层 3 均值 } \\bar{x}_3 \\text{ 与波动区间}",
        style: "solid",
      },
      {
        color: MATH_COLORS.function,
        formula: "\\text{总体加权均值 } \\bar{x}",
        style: "dash",
      },
      {
        color: MATH_COLORS.function,
        formula: "\\sum w_i s_i^2 \\text{ (组内方差贡献)}",
        style: "area",
      },
      {
        color: MATH_COLORS.paramSecondary,
        formula: "\\sum w_i (\\bar{x}_i - \\bar{x})^2 \\text{ (组间离差贡献)}",
        style: "area",
      },
    ];
  }, [studyMode, params.percentileP]);

  // 左屏教学提示与题设导引 (说明背景、初始条件与核心设问，随二级情景 100% 动态特化)
  const tipConfig = useMemo(() => {
    if (studyMode === "histogram") {
      if (activeScenario === "gaokao6") {
        return {
          variant: "primary" as const,
          badge: "新高考真题 · 6 组百分制标准模型",
          background:
            "某市高一年级期末统考数学成绩抽样调查，满分 100 分，有效成绩自 40 分起算。",
          condition:
            "样本数据划分为 6 组 $[40, 50), [50, 60), \\dots, [90, 100]$，组距为 $10$。",
          question:
            "在全国卷经典的 100 分制成绩分布中，按面积加权求解估算均值、众数与平分面积中位数。",
        };
      }
      if (activeScenario === "textbook5") {
        return {
          variant: "primary" as const,
          badge: "课本经典 · 5 组基础例题模型",
          background:
            "人教 A 版必修二教材典型例题：某校 100 名高一学生体质健康综合测试得分统计。",
          condition:
            "样本数据划分为 5 组 $[50, 60), \\dots, [90, 100]$，组距为 $10$。",
          question:
            "计算各组频率并验证面积之和恒等于 $1$，结合杠杆天平观察平均数的物理重心位置。",
        };
      }
      if (activeScenario === "rightSkewed") {
        return {
          variant: "warning" as const,
          badge: "高考高频 · 正偏态分布与极端值拉扯",
          background:
            "某高新科技园区从业人员年收入抽样调研，绝大部分员工处于中等薪资，极少数高管持有高额分红。",
          condition:
            "样本数据呈正偏态（右偏长尾），高分段存在少数极大值拉长右侧尾部。",
          question:
            "比较众数、中位数与平均数的大小关系，探究高收入/高分调研中为何中位数比平均数更具稳健性？",
        };
      }
      if (activeScenario === "leftSkewed") {
        return {
          variant: "warning" as const,
          badge: "高考高频 · 负偏态分布与左偏长尾",
          background:
            "某重点高中特长生专项测试，试题难度适中且学生准备充分，高分云集但极少数缺考或失常者得分极低。",
          condition:
            "样本数据呈负偏态（左偏长尾），低分段存在少数极小值拉低分布重心。",
          question:
            "求解三大数字特征，证明平均数受极端值影响显著而中位数保持稳定的代数逻辑。",
        };
      }
      if (activeScenario === "bimodal") {
        return {
          variant: "danger" as const,
          badge: "新高考创新 · 双峰分布与两极分化",
          background:
            "文理分流前夕高一数学综合统考，试题兼顾基础与拔尖压轴，不同层次班级学生成绩出现显著分化。",
          condition:
            "样本数据在两端各出现一个峰值，中间频数明显凹陷（如分流考试成绩）。",
          question:
            "识别双峰分布的两个局部众数，分析平均数落于低谷时作为代表值的局限性。",
        };
      }
      return {
        variant: "primary" as const,
        badge: "高考核心 · 直方图数字特征与杠杆平衡",
        background:
          "物理力矩与统计平衡跨学科情境：将直方图频率矩形抽象为轻质杠杆上的离散质点系。",
        condition: `样本划分为 ${params.groupCount ?? 6} 组，纵轴为频率/组距 $h$，矩形面积 $f = h \\cdot d$ 代表组频率。`,
        question:
          "在中屏直接拖拽重心支点 ▲ 或在左屏切换组数，观察平均数如何充当物理力矩平衡支点，众数与中位数如何随偏斜位移。",
      };
    }

    if (studyMode === "cumulative") {
      if (activeScenario === "q1") {
        return {
          variant: "warning" as const,
          badge: "高考重点 · 下四分位数 $Q_1$ (第 25 百分位数)",
          background:
            "高一期末学业水平达标评估：评定前 25% 基础预警线，用于实施学业针对性帮扶。",
          condition:
            "目标百分位锁定 $p = 25\\%$（下四分位数 $Q_1$，箱线图左箱界）。",
          question:
            "在直方图前两组中定位目标区间，利用组内面积插值求解前 $25\\%$ 数据的上限阈值。",
        };
      }
      if (activeScenario === "median") {
        return {
          variant: "primary" as const,
          badge: "高考必考 · 中位数 $M_e$ (第 50 百分位数)",
          background:
            "高校招生综合素质评价排位：寻找样本容量正中间的基准水平，不受极端分数拉扯。",
          condition:
            "目标百分位锁定 $p = 50\\%$（中位数 $M_e$，面积严格二等分点）。",
          question:
            "寻找将直方图左右总面积二等分（各占 $0.50$）的分界线横坐标，并在折线上观察 $50\\%$ 投影点。",
        };
      }
      if (activeScenario === "q3") {
        return {
          variant: "warning" as const,
          badge: "高考重点 · 上四分位数 $Q_3$ 与四分位距 IQR",
          background:
            "年级期末表彰评优排位：划定前 75%（后 25% 优秀段）门槛，并分析核心 50% 学生的成绩跨度 IQR。",
          condition:
            "目标百分位锁定 $p = 75\\%$（上四分位数 $Q_3$，箱线图右箱界）。",
          question:
            "计算 $Q_3$ 并结合 $Q_1$ 求解四分位距 $\\text{IQR} = Q_3 - Q_1$，探究中间 $50\\%$ 数据的离散程度。",
        };
      }
      if (activeScenario === "p90") {
        return {
          variant: "danger" as const,
          badge: "高考拔尖 · 第 90 百分位数与前沿准入门槛",
          background:
            "重点高校强基计划校测选拔报名资格审查：按全省统考成绩分布筛选前 10% 拔尖考生。",
          condition:
            "目标百分位锁定 $p = 90\\%$（优秀分界线，前 $10\\%$ 顶尖数据）。",
          question:
            "在最高分段区间内按剩余频率补齐插值，计算排名前 $10\\%$ 的准入门槛分数线。",
        };
      }
      return {
        variant: "warning" as const,
        badge: "课标核心 · 任意百分位数线性插值",
        background:
          "高考成绩排位与赋分制转换模型：利用累积频率分布曲线（Ogive）将原始分转换为百分位排名。",
        condition: `数据已划分为直方图，当前目标百分位 $p = ${params.percentileP ?? 50}\\%$。`,
        question:
          "在直方图与累积折线上定位区间，通过公式 $x_p = a + \\frac{p\\% - F_{\\text{prev}}}{h}$ 精确估算横坐标值。",
      };
    }

    // stratified 模式
    if (activeScenario === "twoStrata") {
      return {
        variant: "danger" as const,
        badge: "高考压轴必考 · 男女两层合并总方差",
        background:
          "新高考最经典高频真题背景：某高中生体质健康调研，男生与女生体能测试存在显著性别差异。",
        condition: `某校男生 $N_1=${params.N1 ?? 400}$ 人，女生 $N_2=${params.N2 ?? 600}$ 人，按比例抽取样本容量 $n=${params.sampleN ?? 80}$。`,
        question:
          "利用两层合并方差极速公式 $s^2 = w_1 s_1^2 + w_2 s_2^2 + w_1 w_2 (\\bar{x}_1 - \\bar{x}_2)^2$ 快速口算总方差，探究组间离差对总方差的贡献。",
      };
    }
    if (activeScenario === "equalMean") {
      return {
        variant: "primary" as const,
        badge: "高考模型 · 各层均值相等与组间离差消除",
        background:
          "平行班级教研对比实验：三个平行班由同一教研组授课，各班平均分严格一致但班内分化程度各异。",
        condition:
          "总体划分为 3 层，各层样本均值严格相等 ($\\bar{x}_1 = \\bar{x}_2 = \\bar{x}_3 = 75$)。",
        question:
          "观察当各层中心无差异时，组间均值离差项是否严格归零？总方差是否退化为单纯的组内方差加权？",
      };
    }
    if (activeScenario === "largeMeanDiff") {
      return {
        variant: "danger" as const,
        badge: "高考难点 · 均值悬殊主导总方差暴增",
        background:
          "集团化办学校区综合评估：优质老校区与新建分校学生均分悬殊，但各校区内部方差控制极严。",
        condition:
          "各层内方差极小 ($s_i^2 \\le 12$)，但各层均值相差巨大 ($60, 80, 95$)。",
        question:
          "探究组间离差项 $\\sum w_i (\\bar{x}_i - \\bar{x})^2$ 为何成为决定总方差绝对主导项（$>70\\%$），揭示分层差异对离散度的放大效应。",
      };
    }
    return {
      variant: "danger" as const,
      badge: "高考重点 · 三层抽样总均值与方差分解",
      background:
        "按比例分层随机抽样调研：当总体由差异明显的子群体组成时，采用分层抽样保障估计的无偏性与高精度。",
      condition: `总体分为 3 层，按比例抽取容量为 $n = ${params.sampleN ?? 100}$ 的样本。`,
      question:
        "求解分层抽样总样本均值 $\\bar{x}$ 与总样本方差 $s^2$ 的组内+组间两项分解合成。",
    };
    // 依赖中保留二级选项变量：TipCard 教学提示须随二级选项切换同步特化（项目纪律 left/tipcard-secondary-sync）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    studyMode,
    activeScenario,
    params.groupCount,
    params.percentileP,
    params.sampleN,
    params.shift,
    params.N1,
    params.N2,
  ]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择 Section：单列 3 行布局 */}
          <LeftPanelSection title="研究模式">
            <SelectGrid
              columns={1}
              items={[
                {
                  key: "histogram",
                  label: "直方图与数字特征",
                  description: "众数、中位数、均值与物理力矩支点",
                },
                {
                  key: "cumulative",
                  label: "百分位数线性插值",
                  description: "S 型累积折线与面积补齐插值",
                },
                {
                  key: "stratified",
                  label: "分层抽样与总方差",
                  description: "各层高斯分布、离差拉扯与总方差分解",
                },
              ]}
              value={studyMode}
              onChange={handleStudyModeChange}
              variant="filled"
            />
          </LeftPanelSection>

          {/* 高考典型题型预设（严格模式级二级隔离） */}
          <LeftPanelSection title="典型高考情境">
            <SelectGrid
              columns={1}
              items={MODE_SCENARIOS[studyMode].map((s) => ({
                key: s.key,
                label: s.label,
                description: s.description,
              }))}
              value={activeScenario}
              onChange={handleScenarioSelect}
              variant="outline"
            />
          </LeftPanelSection>

          {/* 参数调节 Section（按情景降维展开） */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 教学导引与题设背景 */}
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
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 顶部悬浮 Katex 公式 */}
          <div className="absolute top-3 left-16 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={topFormulaLatex} mode="inline" />
          </div>

          {/* 右上角毛玻璃图例 (SceneLegend)，彻底避免右下角遮挡中央及底部图元 */}
          <SceneLegend
            items={legendItems}
            title="图元与特征指示"
            position="top-right"
          />

          {/* SVG 画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <StatPercentileScene
              params={
                params as {
                  groupCount?: number;
                  percentileP: number;
                  shift: number;
                  sampleN: number;
                  N1: number;
                  N2: number;
                  N3: number;
                  mean1: number;
                  mean2: number;
                  mean3: number;
                  var1: number;
                  var2: number;
                  var3: number;
                }
              }
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              studyMode={studyMode}
            />
          </AnimationSvgCanvas>
        </div>
      }
      right={<MathPanel {...mathData} title={panelTitle} />}
    />
  );
}

export default StatPercentileAnimation;
