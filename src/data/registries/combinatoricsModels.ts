import type { ParamMeta } from "../types";
import { MATH_COLORS } from "@/theme";
import type { ScenarioSpec } from "@/types/scenario";
import type { CombinatoricsModelMode } from "@/math/combinatoricsModels";

export const defaultParams = {
  n: 5,
  k: 2,
  m: 4,
  r: 3,
} as const;

export type CombinatoricsParams = {
  n: number;
  k: number;
  m: number;
  r: number;
};

export const GROUPING_PRESET_SIZES: Record<string, number[]> = {
  equal2: [3, 3],
  equal3: [2, 2, 2],
  partial: [2, 2, 1],
  distinct: [3, 2, 1],
};

export const COMBINATORICS_SCENARIOS: Record<
  CombinatoricsModelMode,
  Record<string, ScenarioSpec<CombinatoricsParams>>
> = {
  bundle: {
    free: {
      id: "free",
      name: "自由探索",
      badge: "捆绑模型 · 自主设参",
      background:
        "校运会入场式排成一排，指定若干名队员必须紧挨在一起走过主席台。",
      condition: "共有 $n$ 个不同元素排成一列，其中指定的 $k$ 个元素必须相邻。",
      question:
        "求满足相邻约束的排列总数，并验证内部排列与外部大元素排列的乘积关系。",
      variant: "primary",
    },
    pair: {
      id: "pair",
      name: "两人绑定",
      badge: "经典母题 · 甲乙必须相邻",
      background: "高三合影站位问题：甲、乙两位同学要求站在一起。",
      condition: "总人数 $n = 6$，其中 $k = 2$ 人必须相邻站位。",
      question: "求站成一排时甲乙相邻的方案总数，并比较不加限制时的缩减比例。",
      presetParams: { n: 6, k: 2 },
      variant: "primary",
    },
    triple: {
      id: "triple",
      name: "三人成团",
      badge: "真题变式 · 连续绑定体",
      background: "文艺晚会节目单编排：三个同类曲艺节目需要连续演出。",
      condition: "共 $n = 6$ 个节目，其中 $k = 3$ 个同类节目捆绑为一个整体。",
      question: "计算节目单编排总方案数，说明捆绑后整体元素个数的变化规律。",
      presetParams: { n: 6, k: 3 },
      variant: "accent",
    },
  },
  gap: {
    free: {
      id: "free",
      name: "自由探索",
      badge: "插空模型 · 自主设参",
      background: "停车场或排队通道中，几辆特型车不能相邻停靠的排布问题。",
      condition:
        "先排 $m$ 个无限制元素形成 $m+1$ 个空位，再插入 $k$ 个互不相邻元素。",
      question:
        "求满足互不相邻条件的排列总数，并分析为什么必须限制 $k \\le m + 1$。",
      variant: "primary",
    },
    standard: {
      id: "standard",
      name: "四插二母题",
      badge: "高考高频 · 男女生不相邻",
      background: "实验室值日排班：要求两位带队老师不相邻安排值班顺序。",
      condition:
        "先排 $m = 4$ 名同学，再将 $k = 2$ 位老师插入形成的 $5$ 个空隙。",
      question: "求所有合法值班序列的方案数及空位排列数 $A_5^2$。",
      presetParams: { m: 4, k: 2 },
      variant: "primary",
    },
    critical: {
      id: "critical",
      name: "满空插满",
      badge: "临界满员 · 首尾交替排列",
      background: "路口红绿灯交替或男女生严格间隔排队场景。",
      condition: "底座元素 $m = 3$，形成 $4$ 个空位且插入元素恰满 $k = 4$。",
      question: "判断此时是否构成严格交替排列，并求合法排法总数。",
      presetParams: { m: 3, k: 4 },
      variant: "warning",
    },
  },
  starsBars: {
    free: {
      id: "free",
      name: "自由探索",
      badge: "隔板模型 · 自主设参",
      background: "学校将完全相同的若干个名额或经费指标分配给不同班级。",
      condition: "共有 $n$ 个相同名额，分给 $r$ 个不同组。",
      question:
        "求满足每组至少 $1$ 个名额的分配方案数，并对比允许空组时的公式转换。",
      variant: "primary",
    },
    positive: {
      id: "positive",
      name: "名额至少为一",
      badge: "基础原型 · 正整数解",
      background: "竞赛推荐名额分配：将 $8$ 个相同的保送名额分到 $3$ 所分校。",
      condition:
        "共 $n = 8$ 个相同名额，$r = 3$ 个不同接收组，每组至少 $1$ 个。",
      question: "求相当于方程 $x_1+x_2+x_3=8$ 正整数解的隔板分配方案数。",
      presetParams: { n: 8, r: 3 },
      variant: "primary",
    },
    allowEmpty: {
      id: "allowEmpty",
      name: "允许空组借一法",
      badge: "高考变形 · 非负整数解",
      background:
        "将 $5$ 本相同的科普读物放进 $3$ 个不同的书架，允许书架空着。",
      condition: "共 $n = 5$ 个相同元素，$r = 3$ 个不同组，允许出现空组。",
      question: "利用先借后还转化思想求出 $x_1+x_2+x_3=5$ 的非负整数解个数。",
      presetParams: { n: 5, r: 3 },
      variant: "accent",
    },
  },
  grouping: {
    free: {
      id: "free",
      name: "自由探索",
      badge: "分组分配 · 消序机制",
      background: "志愿服务队抽调人员编成若干小组后再指派到不同社区服务。",
      condition: "按既定各组人数规模拆分组合，并控制是否定向分配给不同对象。",
      question:
        "求无序分组方案数与定向分配总数，揭示除以重复组数阶乘 $A_c^c$ 的消序本质。",
      variant: "primary",
    },
    equal3: {
      id: "equal3",
      name: "三组全均分",
      badge: "易错高危 · 6人分2-2-2",
      background:
        "科研课题组将 $6$ 名成员平均划分为 $3$ 个规模均为 $2$ 的小组。",
      condition: "总人数 $n = 6$，各组人数分别为 $2, 2, 2$。",
      question:
        "计算无序分堆数，解释为何连乘 $C_6^2 C_4^2 C_2^2$ 会重复 $A_3^3$ 倍。",
      variant: "danger",
    },
    partial: {
      id: "partial",
      name: "局部均分2-2-1",
      badge: "选填压轴 · 仅对等组消序",
      background: "将 $5$ 名医疗队员分成人数为 $2, 2, 1$ 的三个支援分队。",
      condition: "总人数 $n = 5$，规模为 $2, 2, 1$，其中两组人数相等。",
      question: "求分堆数与分派到 $3$ 个不同点位的总方案数。",
      variant: "warning",
    },
    distinct: {
      id: "distinct",
      name: "全不等分3-2-1",
      badge: "对照基准 · 无消序因子",
      background: "将 $6$ 名学生按 $3, 2, 1$ 人数分配到三个不同项目组。",
      condition: "总人数 $n = 6$，各组人数 $3, 2, 1$ 互不相等。",
      question: "说明为何各组人数互异时无序分堆无需再除以任何阶乘。",
      variant: "primary",
    },
  },
};

export const paramMeta: Record<string, ParamMeta> = {
  n: {
    key: "n",
    label: "元素总数 n",
    labelFormula: `\\text{元素总数 } \\color{${MATH_COLORS.paramPrimary}}{n}`,
    min: 2,
    max: 12,
    step: 1,
    defaultValue: 5,
    group: "主体规模参数",
    importance: "core",
    description: "待排列或待分配的元素总个数",
  },
  k: {
    key: "k",
    label: "约束个数 k",
    labelFormula: `\\text{约束个数 } \\color{${MATH_COLORS.paramSecondary}}{k}`,
    min: 1,
    max: 7,
    step: 1,
    defaultValue: 2,
    group: "约束条件参数",
    importance: "core",
    description: "必须相邻捆绑或必须互不相邻插空的元素个数",
  },
  m: {
    key: "m",
    label: "底座元素 m",
    labelFormula: `\\text{底座元素 } \\color{${MATH_COLORS.paramPrimary}}{m}`,
    min: 1,
    max: 6,
    step: 1,
    defaultValue: 4,
    group: "主体规模参数",
    importance: "core",
    description: "先排的无限制元素个数，决定可插空位数 m+1",
  },
  r: {
    key: "r",
    label: "目标组数 r",
    labelFormula: `\\text{目标组数 } \\color{${MATH_COLORS.paramTertiary}}{r}`,
    min: 2,
    max: 6,
    step: 1,
    defaultValue: 3,
    group: "约束条件参数",
    importance: "core",
    description: "接受分配的不同组别数，隔板数为 r-1",
  },
};
