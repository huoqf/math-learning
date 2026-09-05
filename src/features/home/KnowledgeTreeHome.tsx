import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lock,
  ArrowRight,
  GraduationCap,
  Compass,
  Calculator,
  Activity,
  Flame,
  Layers,
  Sparkles,
  Award,
  BookOpen,
  Target,
  Box,
} from "lucide-react";
import { knowledgeTree } from "@/data/knowledgeTree";
import { ANIMATION_ROUTE_MAP, PATH_TO_LABEL } from "@/data/routeEntries";
import type {
  KnowledgeNode,
  GaokaoTopicKey,
  QuestionCategory,
} from "@/data/types";

// 教材传统三大板块映射（一轮基础视角）
const SECTION_MAP: Record<string, "algebra" | "geometry" | "trig_prob"> = {
  集合与常用逻辑: "algebra",
  不等式: "algebra",
  函数概念与性质: "algebra",
  导数及其应用: "algebra",
  数列: "algebra",
  平面向量与复数: "geometry",
  立体几何与空间向量: "geometry",
  解析几何: "geometry",
  三角函数: "trig_prob",
  概率与统计: "trig_prob",
};

// 章节到新高考六大专题的健壮回退映射
const CHAPTER_TO_GAOKAO_TOPIC: Record<string, GaokaoTopicKey> = {
  集合与常用逻辑: "func_derivative",
  不等式: "func_derivative",
  函数概念与性质: "func_derivative",
  导数及其应用: "func_derivative",
  数列: "sequence_series",
  平面向量与复数: "vector_triangle",
  立体几何与空间向量: "solid_geometry",
  解析几何: "conic_geometry",
  三角函数: "vector_triangle",
  概率与统计: "probability_statistics",
};

// 教材基础板块配置
const SECTIONS = [
  {
    key: "algebra" as const,
    title: "代数与函数",
    description: "数集、不等式与函数的动态变化及极限逼近",
    icon: Calculator,
    gradient: "from-blue-600 to-indigo-600",
    bgLight: "bg-blue-50/50",
    borderLight: "border-blue-100",
    textColor: "text-blue-700",
  },
  {
    key: "geometry" as const,
    title: "几何与向量",
    description: "解析几何、空间几何与向量投影的数形直观",
    icon: Compass,
    gradient: "from-emerald-600 to-teal-600",
    bgLight: "bg-emerald-50/50",
    borderLight: "border-emerald-100",
    textColor: "text-emerald-700",
  },
  {
    key: "trig_prob" as const,
    title: "三角与统计",
    description: "任意角、单位圆变换与频率分布的几何呈现",
    icon: Activity,
    gradient: "from-amber-600 to-orange-600",
    bgLight: "bg-amber-50/50",
    borderLight: "border-amber-100",
    textColor: "text-amber-700",
  },
];

// 新高考六大攻坚大专题配置（严格对接 2024-2026 新课标 19 题制命题结构）
const GAOKAO_TOPIC_CONFIGS: Array<{
  key: GaokaoTopicKey;
  title: string;
  badge: string;
  description: string;
  icon: typeof Flame;
  gradient: string;
  borderLight: string;
  bgLight: string;
  textColor: string;
}> = [
  {
    key: "func_derivative",
    title: "函数性质与导数压轴通法",
    badge: "17/18 题大题 · 17分",
    description: "指对同构化简、极值点偏移、隐零点虚设代换与端点效应",
    icon: Flame,
    gradient: "from-rose-500 to-red-600",
    borderLight: "border-rose-200",
    bgLight: "bg-rose-50/60",
    textColor: "text-rose-700",
  },
  {
    key: "conic_geometry",
    title: "解析几何四大几何破题工具",
    badge: "17/18 题大题 · 17分",
    description: "非对称齐次化、极化恒等式与阿氏圆、点差中点弦与参数 t 割线",
    icon: Compass,
    gradient: "from-indigo-500 to-blue-600",
    borderLight: "border-indigo-200",
    bgLight: "bg-indigo-50/60",
    textColor: "text-indigo-700",
  },
  {
    key: "solid_geometry",
    title: "立体几何空间直观与代数建系",
    badge: "15/16 题大题 · 15分",
    description: "四大外接球模型、二面角动态翻折、空间截面与法向量空间角/距",
    icon: Box,
    gradient: "from-emerald-500 to-teal-600",
    borderLight: "border-emerald-200",
    bgLight: "bg-emerald-50/60",
    textColor: "text-emerald-700",
  },
  {
    key: "probability_statistics",
    title: "概率统计与马尔可夫递推",
    badge: "16/17 题大题 · 15分",
    description: "全概贝叶斯诊断、马尔可夫链转移递推、正态分布与列联表检验",
    icon: Target,
    gradient: "from-amber-500 to-orange-600",
    borderLight: "border-amber-200",
    bgLight: "bg-amber-50/60",
    textColor: "text-amber-700",
  },
  {
    key: "sequence_series",
    title: "数列递推与新定义探索",
    badge: "19 题压轴探索 · 17分",
    description: "不动点特征方程构造等比、错位裂项求和与高阶新定义数学探究",
    icon: Layers,
    gradient: "from-cyan-500 to-sky-600",
    borderLight: "border-cyan-200",
    bgLight: "bg-cyan-50/60",
    textColor: "text-cyan-700",
  },
  {
    key: "vector_triangle",
    title: "平面向量与解三角形综合",
    badge: "15 题首选解答 · 13分",
    description: "正余弦定理与结构不良题型、投影向量数量积与斜基底分解",
    icon: Award,
    gradient: "from-purple-500 to-fuchsia-600",
    borderLight: "border-purple-200",
    bgLight: "bg-purple-50/60",
    textColor: "text-purple-700",
  },
];

// 重要性标签映射
const IMPORTANCE_MAP: Record<
  KnowledgeNode["importance"],
  { label: string; className: string }
> = {
  basic: {
    label: "基础",
    className: "bg-success-50 text-success-700 border-success-200",
  },
  core: {
    label: "核心",
    className: "bg-primary-50 text-primary-700 border-primary-200",
  },
  gaokao: {
    label: "高考高频",
    className: "bg-warning-50 text-warning-700 border-warning-200",
  },
  hard: {
    label: "重难点",
    className: "bg-danger-50 text-danger-700 border-danger-200",
  },
  extend: {
    label: "拓展",
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
};

// 试卷题型定位标签
const QUESTION_CATEGORY_MAP: Record<
  QuestionCategory,
  { label: string; className: string }
> = {
  foundation: {
    label: "客观基础",
    className: "bg-neutral-100 text-neutral-600 border-neutral-200",
  },
  solution_first: {
    label: "解答必得",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  multi_select_hard: {
    label: "客观压轴",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  solution_final: {
    label: "大题压轴",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

export function KnowledgeTreeHome() {
  const navigate = useNavigate();
  // 视图模式：新高考专题地图 (gaokao) vs 教材同步一览 (textbook)
  const [viewMode, setViewMode] = useState<"gaokao" | "textbook">("gaokao");

  // 1. 检查节点是否激活并返回对应路由
  const getNodeRoute = (node: KnowledgeNode): string | null => {
    if (node.route && PATH_TO_LABEL[node.route]) {
      return node.route;
    }

    for (const animId of node.animationIds) {
      if (ANIMATION_ROUTE_MAP[animId]) {
        return ANIMATION_ROUTE_MAP[animId];
      }
    }
    return null;
  };

  // 2. 统计数据
  const stats = useMemo(() => {
    let activeCount = 0;
    let methodCount = 0;
    knowledgeTree.forEach((node) => {
      if (getNodeRoute(node)) {
        activeCount++;
      }
      if (node.examMethod) {
        methodCount++;
      }
    });
    return {
      total: knowledgeTree.length,
      active: activeCount,
      methods: methodCount,
    };
  }, []);

  // 3. 教材章节聚合（三大板块 -> 章节）
  const textbookGroupedData = useMemo(() => {
    const result: Record<
      "algebra" | "geometry" | "trig_prob",
      Record<string, KnowledgeNode[]>
    > = {
      algebra: {},
      geometry: {},
      trig_prob: {},
    };

    knowledgeTree.forEach((node) => {
      const sectionKey = SECTION_MAP[node.chapter] || "algebra";
      const chapterName = node.chapter;

      if (!result[sectionKey][chapterName]) {
        result[sectionKey][chapterName] = [];
      }
      result[sectionKey][chapterName].push(node);
    });

    return result;
  }, []);

  // 4. 新高考六大专题聚合
  const gaokaoGroupedData = useMemo(() => {
    const result: Record<GaokaoTopicKey, KnowledgeNode[]> = {
      func_derivative: [],
      conic_geometry: [],
      solid_geometry: [],
      probability_statistics: [],
      sequence_series: [],
      vector_triangle: [],
    };

    knowledgeTree.forEach((node) => {
      const topicKey =
        node.gaokaoTopic ||
        CHAPTER_TO_GAOKAO_TOPIC[node.chapter] ||
        "func_derivative";
      result[topicKey].push(node);
    });

    return result;
  }, []);

  // 渲染单一知识节点卡片
  const renderNodeCard = (node: KnowledgeNode) => {
    const route = getNodeRoute(node);
    const isActive = !!route;
    const imp = IMPORTANCE_MAP[node.importance] || IMPORTANCE_MAP.core;
    const qCategory = node.questionCategory
      ? QUESTION_CATEGORY_MAP[node.questionCategory]
      : null;

    return (
      <div key={node.id} className="relative">
        {/* 树干节点指示点 */}
        <div className="absolute -left-[21px] top-4 flex items-center justify-center w-2.5 h-2.5">
          {isActive ? (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-500" />
            </span>
          ) : (
            <span className="h-2 w-2 rounded-full bg-neutral-200" />
          )}
        </div>

        {isActive ? (
          <div
            onClick={() => navigate(route)}
            className="group border border-neutral-200 hover:border-primary-400 bg-white p-3.5 rounded-xl cursor-pointer hover:shadow-[0_6px_20px_rgba(59,130,246,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex items-start justify-between gap-3"
          >
            <div className="flex-1 min-w-0">
              {/* 顶部状态与高考题型标签 */}
              <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${imp.className}`}
                >
                  {imp.label}
                </span>
                {qCategory && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${qCategory.className}`}
                  >
                    {qCategory.label}
                  </span>
                )}
                {node.examWeight && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    考频 {"★".repeat(node.examWeight)}
                  </span>
                )}
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold border border-success-200 bg-success-50 text-success-700">
                  实验室已开放
                </span>
              </div>

              {/* 标题 */}
              <h4 className="text-xs font-bold text-neutral-800 group-hover:text-primary-600 transition-colors leading-tight">
                {node.title}
              </h4>

              {/* 高考核心通法大招提示 */}
              {node.examMethod && (
                <div className="mt-2 text-[10px] text-rose-700 bg-rose-50/70 border border-rose-100 rounded px-2 py-1 flex items-center gap-1">
                  <Sparkles size={11} className="shrink-0 text-rose-500" />
                  <span className="truncate">
                    <strong className="font-semibold">通法模型：</strong>
                    {node.examMethod}
                  </span>
                </div>
              )}

              <p className="text-[10px] text-neutral-400 mt-1.5">
                章节模块：{node.chapter} · {node.module}
              </p>
            </div>
            <div className="w-6 h-6 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors shrink-0 self-center">
              <ArrowRight size={12} />
            </div>
          </div>
        ) : (
          <div
            className="border border-dashed border-neutral-200 bg-neutral-50/50 p-3.5 rounded-xl opacity-75 hover:opacity-90 transition-opacity flex items-start justify-between gap-3"
            title="实验室正在加紧构建中，敬请期待！"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold border opacity-60 ${imp.className}`}
                >
                  {imp.label}
                </span>
                {qCategory && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium border opacity-70 ${qCategory.className}`}
                  >
                    {qCategory.label}
                  </span>
                )}
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium border border-neutral-200 bg-neutral-100 text-neutral-500">
                  规划中
                </span>
              </div>
              <h4 className="text-xs font-bold text-neutral-500 leading-tight">
                {node.title}
              </h4>
              {node.examMethod && (
                <div className="mt-1.5 text-[10px] text-neutral-500 bg-neutral-100/60 rounded px-2 py-0.5 truncate">
                  待探究模型：{node.examMethod}
                </div>
              )}
              <p className="text-[10px] text-neutral-400 mt-1">
                模块：{node.module}
              </p>
            </div>
            <div className="w-5 h-5 rounded-full border border-neutral-200 text-neutral-400 flex items-center justify-center shrink-0 self-center bg-white">
              <Lock size={10} />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-neutral-50 relative pb-16">
      {/* 科技感大背景光晕 */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-200/20 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-secondary-200/10 rounded-full filter blur-3xl pointer-events-none" />

      {/* 头部与系统概览看板 */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-6">
        <div className="relative overflow-hidden bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-50 text-primary-600">
                <GraduationCap size={18} className="animate-bounce" />
              </span>
              <span className="text-sm font-semibold text-primary-600 uppercase tracking-wider">
                高中数学新高考全真考向交互系统
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-neutral-800 tracking-tight sm:text-4xl mb-3">
              高中数学{" "}
              <span className="bg-gradient-to-r from-primary-600 via-indigo-600 to-rose-600 bg-clip-text text-transparent">
                知识地图实验室
              </span>
            </h1>
            <p className="text-neutral-500 max-w-2xl text-sm sm:text-base leading-relaxed">
              融合新高考命题导向与“数形结合”认知网络。以动态交互动画直击极值点偏移、非对称齐次化、外接球四大模型等高考核心通法，点击进入深度探究。
            </p>

            {/* 宏观学科领域标签（保持测试兼容与学科全局感） */}
            <div className="flex items-center gap-2 mt-4 text-xs font-medium text-neutral-500">
              <span>核心领域体系：</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                <Calculator size={13} />
                代数与函数
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                <Compass size={13} />
                几何与向量
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                <Activity size={13} />
                三角与统计
              </span>
            </div>
          </div>

          {/* 统计看板 */}
          <div className="flex flex-wrap gap-3 sm:gap-4 shrink-0">
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 sm:px-5 sm:py-4 min-w-[100px] text-center">
              <div className="text-2xl font-bold text-primary-600">
                {stats.active}
              </div>
              <div className="text-xs text-neutral-400 font-medium mt-1">
                已激活实验
              </div>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 sm:px-5 sm:py-4 min-w-[100px] text-center">
              <div className="text-2xl font-bold text-neutral-700">
                {stats.total}
              </div>
              <div className="text-xs text-neutral-400 font-medium mt-1">
                总规划节点
              </div>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 sm:px-5 sm:py-4 min-w-[100px] text-center">
              <div className="text-2xl font-bold text-rose-600">
                {stats.methods}
              </div>
              <div className="text-xs text-neutral-400 font-medium mt-1">
                通法秒杀模型
              </div>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 sm:px-5 sm:py-4 min-w-[100px] text-center">
              <div className="text-2xl font-bold text-neutral-700">10</div>
              <div className="text-xs text-neutral-400 font-medium mt-1">
                数学核心章
              </div>
            </div>
          </div>
        </div>

        {/* 双轨视角切换控制栏 */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-neutral-200/80 p-2.5 rounded-xl shadow-xs">
          <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode("gaokao")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${
                viewMode === "gaokao"
                  ? "bg-white text-rose-600 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <Flame
                size={14}
                className={
                  viewMode === "gaokao" ? "text-rose-500 animate-pulse" : ""
                }
              />
              新高考大专题通法地图（二轮与压轴导向）
            </button>
            <button
              type="button"
              onClick={() => setViewMode("textbook")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${
                viewMode === "textbook"
                  ? "bg-white text-primary-600 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <BookOpen size={14} />
              教材同步章节一览（一轮基础打底）
            </button>
          </div>

          <div className="text-xs text-neutral-500 flex items-center gap-2 pr-2">
            <span className="w-2 h-2 rounded-full bg-success-500" />
            <span>当前视角：</span>
            <strong className="text-neutral-800 font-semibold">
              {viewMode === "gaokao"
                ? "聚焦新高考六大专题与秒杀模型"
                : "按必修/选修传统章节递进"}
            </strong>
          </div>
        </div>
      </div>

      {/* 视图呈现区 */}
      <div className="max-w-7xl mx-auto px-6">
        {viewMode === "gaokao" ? (
          /* 轨道 A：新高考六大专题攻坚视图 */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
            {GAOKAO_TOPIC_CONFIGS.map((topic) => {
              const nodes = gaokaoGroupedData[topic.key] || [];
              const activeCount = nodes.filter((n) => getNodeRoute(n)).length;

              return (
                <div key={topic.key} className="flex flex-col gap-5">
                  {/* 专题头部卡片 */}
                  <div
                    className={`p-4 rounded-xl border ${topic.borderLight} ${topic.bgLight} shadow-sm`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${topic.gradient} text-white shadow-xs`}
                        >
                          <topic.icon size={17} />
                        </div>
                        <h2 className="text-base font-bold text-neutral-800">
                          {topic.title}
                        </h2>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white text-rose-600 border border-rose-200 shrink-0">
                        {topic.badge}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 font-medium pl-10 leading-snug">
                      {topic.description}
                    </p>
                    <div className="mt-3 pt-2.5 border-t border-black/5 flex items-center justify-between text-[11px] text-neutral-500">
                      <span>
                        已开放探索：{activeCount} / {nodes.length} 个节点
                      </span>
                      <span className="font-semibold text-neutral-700">
                        专题完备度{" "}
                        {Math.round((activeCount / (nodes.length || 1)) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* 节点垂直流 */}
                  <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
                    <div className="relative pl-4 flex flex-col gap-4 border-l border-neutral-100 ml-1">
                      {nodes.map(renderNodeCard)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* 轨道 B：教材基础同步章节视图 */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {SECTIONS.map((section) => {
              const chapters = textbookGroupedData[section.key];
              return (
                <div key={section.key} className="flex flex-col gap-6">
                  {/* 板块头部 */}
                  <div
                    className={`p-4 rounded-xl border ${section.borderLight} ${section.bgLight} shadow-sm`}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${section.gradient} text-white`}
                      >
                        <section.icon size={18} />
                      </div>
                      <h2 className="text-lg font-bold text-neutral-800">
                        {section.title}
                      </h2>
                    </div>
                    <p className="text-xs text-neutral-500 font-medium pl-11">
                      {section.description}
                    </p>
                  </div>

                  {/* 章节与节点列表 */}
                  <div className="flex flex-col gap-6">
                    {Object.entries(chapters).map(([chapterName, nodes]) => (
                      <div
                        key={chapterName}
                        className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <h3 className="text-sm font-bold text-neutral-700 border-b border-neutral-100 pb-2 mb-4 flex items-center gap-2">
                          <span
                            className={`w-1.5 h-3 rounded-full bg-gradient-to-b ${section.gradient}`}
                          />
                          {chapterName}
                        </h3>

                        <div className="relative pl-4 flex flex-col gap-4 border-l border-neutral-100 ml-1">
                          {nodes.map(renderNodeCard)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
