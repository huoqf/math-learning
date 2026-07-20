import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lock,
  ArrowRight,
  GraduationCap,
  Compass,
  Calculator,
  Activity,
} from "lucide-react";
import { knowledgeTree } from "@/data/knowledgeTree";
import type { KnowledgeNode } from "@/data/types";

// 板块归类映射
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

// 板块配置信息
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

// 动画路由映射
const ANIMATION_ROUTE_MAP: Record<string, string> = {
  "anim-set-venn": "/set",
  "anim-logic-conditions": "/set",
  "anim-func-properties": "/function",
  "anim-func-explog": "/function",
  "anim-func-zero": "/function",
  "anim-quadratic": "/quadratic",
  "anim-derivative-tangent": "/derivative",
  "anim-constant-single": "/constant",
  "anim-constant-double": "/constant",
};

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

export function KnowledgeTreeHome() {
  const navigate = useNavigate();

  // 1. 检查节点是否激活并返回对应路由
  const getNodeRoute = (node: KnowledgeNode): string | null => {
    for (const animId of node.animationIds) {
      if (ANIMATION_ROUTE_MAP[animId]) {
        return ANIMATION_ROUTE_MAP[animId];
      }
    }
    return null;
  };

  // 2. 统计已开放节点和总节点数
  const stats = useMemo(() => {
    let activeCount = 0;
    knowledgeTree.forEach((node) => {
      if (getNodeRoute(node)) {
        activeCount++;
      }
    });
    return {
      total: knowledgeTree.length,
      active: activeCount,
    };
  }, []);

  // 3. 将节点按“大板块” -> “章节”进行两级聚类
  const groupedData = useMemo(() => {
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

  return (
    <div className="w-full h-full overflow-y-auto bg-neutral-50 relative pb-12">
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
                高中数学一轮复习交互系统
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-neutral-800 tracking-tight sm:text-4xl mb-3">
              高中数学{" "}
              <span className="bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
                知识地图实验室
              </span>
            </h1>
            <p className="text-neutral-500 max-w-2xl text-sm sm:text-base leading-relaxed">
              这里是用“数形结合”绘制的高中数学知识树。我们以动态交互动画展示抽象代数和几何概念的演化本质。点击激活节点，开启深度探究之旅。
            </p>
          </div>

          {/* 统计卡片 */}
          <div className="flex gap-4 sm:gap-6 shrink-0">
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-5 py-4 min-w-[110px] text-center">
              <div className="text-2xl font-bold text-primary-600">
                {stats.active}
              </div>
              <div className="text-xs text-neutral-400 font-medium mt-1">
                已激活实验
              </div>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-5 py-4 min-w-[110px] text-center">
              <div className="text-2xl font-bold text-neutral-700">
                {stats.total}
              </div>
              <div className="text-xs text-neutral-400 font-medium mt-1">
                总规划节点
              </div>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-5 py-4 min-w-[110px] text-center">
              <div className="text-2xl font-bold text-neutral-700">10</div>
              <div className="text-xs text-neutral-400 font-medium mt-1">
                数学核心章
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 知识板块网格 */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {SECTIONS.map((section) => {
            const chapters = groupedData[section.key];
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

                      {/* 节点垂直流（带树状连线） */}
                      <div className="relative pl-4 flex flex-col gap-4 border-l border-neutral-100 ml-1">
                        {nodes.map((node) => {
                          const route = getNodeRoute(node);
                          const isActive = !!route;
                          const imp = IMPORTANCE_MAP[node.importance];

                          return (
                            <div key={node.id} className="relative">
                              {/* 树干上的节点标志小圆点 */}
                              <div className="absolute -left-[21px] top-4 flex items-center justify-center w-2.5 h-2.5">
                                {isActive ? (
                                  <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-500"></span>
                                  </span>
                                ) : (
                                  <span className="h-2 w-2 rounded-full bg-neutral-200" />
                                )}
                              </div>

                              {/* 节点卡片 */}
                              {isActive ? (
                                <div
                                  onClick={() => navigate(route)}
                                  className="group border border-neutral-200 hover:border-primary-400 bg-white p-3 rounded-lg cursor-pointer hover:shadow-[0_4px_16px_rgba(59,130,246,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex items-start justify-between gap-3"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                      <span
                                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${imp.className}`}
                                      >
                                        {imp.label}
                                      </span>
                                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold border border-success-200 bg-success-50 text-success-700 animate-pulse">
                                        实验室已开放
                                      </span>
                                    </div>
                                    <h4 className="text-xs font-bold text-neutral-800 group-hover:text-primary-600 transition-colors leading-tight">
                                      {node.title}
                                    </h4>
                                    <p className="text-[10px] text-neutral-400 mt-1">
                                      模块：{node.module}
                                    </p>
                                  </div>
                                  <div className="w-6 h-6 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors shrink-0 self-center">
                                    <ArrowRight size={12} />
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className="border border-dashed border-neutral-200 bg-neutral-50/50 p-3 rounded-lg opacity-70 hover:opacity-90 transition-opacity flex items-start justify-between gap-3"
                                  title="实验室正在加紧构建中，敬请期待！"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                      <span
                                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold border opacity-60 ${imp.className}`}
                                      >
                                        {imp.label}
                                      </span>
                                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium border border-neutral-200 bg-neutral-100 text-neutral-500">
                                        规划中
                                      </span>
                                    </div>
                                    <h4 className="text-xs font-bold text-neutral-500 leading-tight">
                                      {node.title}
                                    </h4>
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
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
