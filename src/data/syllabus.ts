/**
 * src/data/syllabus.ts
 * 课标分册定位 SSOT（单一事实来源）
 *
 * 背景（对应审查报告 C34）：
 *   此前"必修一 / 必修二 / 选择性必修一…"的册次信息以手写 badge 的形式零散分布在
 *   各个 builder 中，仅覆盖约 20/72 个节点，其余节点无册次信息，且一旦教材调整
 *   口径便无从统一维护。
 *
 * 方案（根本性修复）：
 *   以「章节 → 分册」为默认映射，对章节内部跨分册的模块（如"立体几何与空间向量"
 *   同时含必修二"立体几何初步"与选择性必修一"空间向量"）以及个别例外节点做
 *   module / id 级覆盖；`resolveSyllabus()` 为每个 KnowledgeNode 推导出唯一的
 *   { book, status }，再由知识树构建入口统一回填，页面集中渲染徽标。
 *
 * 依据：人教 A 版（2019）普通高中数学教科书分册结构
 *   必修第一册：集合与常用逻辑用语 / 一元二次函数、方程和不等式 / 函数概念与性质 /
 *               指数函数与对数函数 / 三角函数
 *   必修第二册：平面向量及其应用 / 复数 / 立体几何初步 / 统计 / 概率
 *   选择性必修第一册：空间向量与立体几何 / 直线和圆的方程 / 圆锥曲线的方程
 *   选择性必修第二册：数列 / 一元函数的导数及其应用
 *   选择性必修第三册：计数原理 / 随机变量及其分布 / 成对数据的统计分析
 */
import type { KnowledgeNode } from "./types";

export type SyllabusStatus = "正文" | "选学" | "拓展" | "竞赛";

/** 章节 → 默认分册 */
const CHAPTER_BOOK: Record<string, string> = {
  集合与常用逻辑: "必修一",
  不等式: "必修一",
  函数概念与性质: "必修一",
  三角函数: "必修一",
  解三角形: "必修二",
  平面向量与复数: "必修二",
  数列: "选择性必修二",
  导数及其应用: "选择性必修二",
  解析几何: "选择性必修一",
  立体几何与空间向量: "必修二",
  概率与统计: "必修二",
};

/**
 * 章节内跨分册的模块 → 目标分册覆盖。
 * 优先于 CHAPTER_BOOK，晚于 NODE_BOOK。
 */
const MODULE_BOOK: Record<string, string> = {
  // 立体几何与空间向量：空间向量部分属选择性必修一
  空间向量: "选择性必修一",
  空间向量应用: "选择性必修一",
  空间向量压轴: "选择性必修一",
  // 概率与统计：计数原理、随机变量、条件概率、成对数据分析属选择性必修三
  排列组合: "选择性必修三",
  随机变量及其分布: "选择性必修三",
  条件概率与贝叶斯: "选择性必修三",
  概率压轴: "选择性必修三",
  统计分析: "选择性必修三",
  // 必修二第十章（随机事件与概率 / 古典概型 / 事件的相互独立性）为课标正文基础层，
  // 独立成模块以免与选择性必修三的"条件概率"混在同一册次徽标下
  概率基础: "必修二",
};

/**
 * 个别节点级覆盖（粒度最细，优先级最高）。
 * 用于同一模块下仍跨分册的例外：如"统计分析"模块中，
 * 分层抽样 / 频率直方图 / 百分位数属必修二第九章，
 * 而一元线性回归、2×2 独立性检验属选择性必修三第八章。
 */
const NODE_BOOK: Record<string, string> = {
  "know-stat-percentile": "必修二",
  // 跨册交汇节点：极化恒等式（必修二 平面向量数量积）与阿波罗尼斯圆（选必一 直线和圆的方程）
  // 合体建模。其先修落在选择性必修一，故定位取"较晚册次"以保证先修册次不倒置
  // （knowledgeTree.test.ts 的先修拓扑册次门禁会拦截反向声明）。
  "know-conic-polarization": "选择性必修一",
};

/**
 * 由节点属性推导课标分册与学段状态。
 * status 判定：importance === "extend" 或标题显式标注拓展/选学/竞赛 → 相应状态，否则"正文"。
 */
export function resolveSyllabus(node: KnowledgeNode): {
  book: string;
  status: SyllabusStatus;
} {
  const book =
    NODE_BOOK[node.id] ??
    MODULE_BOOK[node.module] ??
    CHAPTER_BOOK[node.chapter] ??
    "未标注";

  let status: SyllabusStatus = "正文";
  if (node.importance === "extend") {
    status = "拓展";
  } else if (/竞赛/.test(node.title)) {
    status = "竞赛";
  } else if (/选学/.test(node.title)) {
    status = "选学";
  } else if (/拓展|超出课标/.test(node.title)) {
    status = "拓展";
  }

  return { book, status };
}
