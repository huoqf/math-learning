/**
 * 课标覆盖差集自动化门禁契约测试 (Syllabus Coverage Contract Gate)
 *
 * 依据《知识树完整性与全站 89 页动画核查报告》§2.2 课标主条目对照（71 条）固化。
 * 目的：
 * 1. 锁死高中数学课标 71 个主条目的教学承载基线，防范后续重构无意丢失承载页面（No Silent Regression）；
 * 2. 严格受控 G1~G7 缺口清单与白名单，杜绝未登记的课标条目发生退化；
 * 3. 校验课标条目与全库实际 routeEntries / knowledgeTree 节点的一致性。
 */

import { describe, expect, it } from "vitest";
import { routeEntries } from "@/data/routeEntries";
import { knowledgeTree } from "@/data/knowledgeTree";

export interface SyllabusItem {
  id: string;
  book: "必修一" | "必修二" | "选择性必修一" | "选择性必修二" | "选择性必修三";
  chapter: string;
  itemTitle: string;
  status: "covered" | "partial" | "gap";
  pages: string[];
  gapCode?: "G1" | "G2" | "G3" | "G4" | "G5" | "G6" | "G7";
  gapReason?: string;
}

export const SYLLABUS_CORE_ITEMS: SyllabusItem[] = [
  // ── 必修一（15 项）──
  {
    id: "syl-comp1-set-concept",
    book: "必修一",
    chapter: "集合与常用逻辑",
    itemTitle: "集合的概念与元素三性",
    status: "partial",
    pages: ["/set"],
    gapCode: "G6",
    gapReason: "/set 仅以考点提示呈现，缺少元素-集合归属直观层级",
  },
  {
    id: "syl-comp1-set-relation",
    book: "必修一",
    chapter: "集合与常用逻辑",
    itemTitle: "集合间的基本关系（子集/真子集）",
    status: "partial",
    pages: ["/set-logic"],
    gapCode: "G6",
    gapReason: "/set-logic 讲包含关系服务于充要条件，缺少独立子集真子集演示",
  },
  {
    id: "syl-comp1-set-op",
    book: "必修一",
    chapter: "集合与常用逻辑",
    itemTitle: "集合的基本运算（并交补）",
    status: "covered",
    pages: ["/set"],
  },
  {
    id: "syl-comp1-logic-condition",
    book: "必修一",
    chapter: "集合与常用逻辑",
    itemTitle: "充分条件与必要条件",
    status: "covered",
    pages: ["/set-logic"],
  },
  {
    id: "syl-comp1-quantifiers",
    book: "必修一",
    chapter: "集合与常用逻辑",
    itemTitle: "全称量词与存在量词",
    status: "covered",
    pages: ["/set-quantifiers"],
  },
  {
    id: "syl-comp1-ineq-properties",
    book: "必修一",
    chapter: "不等式",
    itemTitle: "等式性质与不等式的性质（2.1）",
    status: "gap",
    pages: [],
    gapCode: "G4",
    gapReason: "选填不等式性质判断高频，全库尚无独立作差法与同向可加可乘演示",
  },
  {
    id: "syl-comp1-amgm",
    book: "必修一",
    chapter: "不等式",
    itemTitle: "基本不等式（均值不等式）",
    status: "covered",
    pages: ["/inequality-basic", "/nike-amgm"],
  },
  {
    id: "syl-comp1-quadratic",
    book: "必修一",
    chapter: "不等式",
    itemTitle: "二次函数与一元二次不等式",
    status: "covered",
    pages: ["/quadratic"],
  },
  {
    id: "syl-comp1-func-concept",
    book: "必修一",
    chapter: "函数概念与性质",
    itemTitle: "函数概念、定义域与值域、图像变换",
    status: "covered",
    pages: ["/transform", "/composite"],
  },
  {
    id: "syl-comp1-func-properties",
    book: "必修一",
    chapter: "函数概念与性质",
    itemTitle: "函数的单调性与奇偶性、对称性",
    status: "covered",
    pages: ["/function-parity", "/function-domain", "/function-symmetry"],
  },
  {
    id: "syl-comp1-power-func",
    book: "必修一",
    chapter: "函数概念与性质",
    itemTitle: "幂函数性质与图像",
    status: "covered",
    pages: ["/function-power"],
  },
  {
    id: "syl-comp1-exp-func",
    book: "必修一",
    chapter: "指数函数与对数函数",
    itemTitle: "指数函数及其性质与图像",
    status: "covered",
    pages: ["/function-exponential"],
  },
  {
    id: "syl-comp1-log-func",
    book: "必修一",
    chapter: "指数函数与对数函数",
    itemTitle: "对数函数及其性质与运算律",
    status: "covered",
    pages: ["/function-logarithmic"],
  },
  {
    id: "syl-comp1-zero-bisection",
    book: "必修一",
    chapter: "函数应用",
    itemTitle: "函数的零点与二分法",
    status: "covered",
    pages: ["/function-zero"],
  },
  {
    id: "syl-comp1-model-basic",
    book: "必修一",
    chapter: "函数应用",
    itemTitle: "函数的应用（一）建模（3.4）",
    status: "gap",
    pages: [],
    gapCode: "G7",
    gapReason: "高考已不单独考查该条目，与导数优化建模共用叙事",
  },

  // ── 必修二（22 项：三角、向量、解三角形、复数、立几初步、统计概率初步）──
  {
    id: "syl-comp2-radian",
    book: "必修二",
    chapter: "三角函数",
    itemTitle: "弧度制与任意角的概念",
    status: "covered",
    pages: ["/radian-measure"],
  },
  {
    id: "syl-comp2-trig-lines",
    book: "必修二",
    chapter: "三角函数",
    itemTitle: "三角函数概念与三角函数线",
    status: "covered",
    pages: ["/trig-lines"],
  },
  {
    id: "syl-comp2-trig-formulas",
    book: "必修二",
    chapter: "三角函数",
    itemTitle: "同角三角函数基本关系与诱导公式",
    status: "covered",
    pages: ["/trig-formulas"],
  },
  {
    id: "syl-comp2-trig-identity",
    book: "必修二",
    chapter: "三角函数",
    itemTitle: "三角恒等变换（和差倍角）",
    status: "covered",
    pages: ["/trig-identity"],
  },
  {
    id: "syl-comp2-trig-transform",
    book: "必修二",
    chapter: "三角函数",
    itemTitle: "正余弦函数与 y=Asin(wx+phi) 变换",
    status: "covered",
    pages: ["/trig-transform"],
  },
  {
    id: "syl-comp2-trig-tan",
    book: "必修二",
    chapter: "三角函数",
    itemTitle: "正切函数性质与图像",
    status: "covered",
    pages: ["/trig-tangent"],
  },
  {
    id: "syl-comp2-trig-model",
    book: "必修二",
    chapter: "三角函数",
    itemTitle: "三角函数模型简单应用",
    status: "covered",
    pages: ["/trig-model"],
  },
  {
    id: "syl-comp2-vector-linear",
    book: "必修二",
    chapter: "平面向量与复数",
    itemTitle: "平面向量概念与线性运算（加减数乘）",
    status: "covered",
    pages: ["/vector-linear"],
  },
  {
    id: "syl-comp2-vector-basis",
    book: "必修二",
    chapter: "平面向量与复数",
    itemTitle: "平面向量基本定理与基底分解",
    status: "covered",
    pages: ["/vector-basis"],
  },
  {
    id: "syl-comp2-vector-dot",
    book: "必修二",
    chapter: "平面向量与复数",
    itemTitle: "数量积几何定义与投影向量",
    status: "covered",
    pages: ["/vector-dot-product"],
  },
  {
    id: "syl-comp2-vector-coord-ops",
    book: "必修二",
    chapter: "平面向量与复数",
    itemTitle: "平面向量的坐标表示与坐标运算（6.3）",
    status: "partial",
    pages: ["/vector-dot-product"],
    gapCode: "G5",
    gapReason: "仅有数量积坐标，缺加减数乘坐标运算与共线坐标判据 x1y2-x2y1=0",
  },
  {
    id: "syl-comp2-triangle-solve",
    book: "必修二",
    chapter: "平面向量与复数",
    itemTitle: "正弦定理、余弦定理与解三角形最值",
    status: "covered",
    pages: ["/triangle-solve", "/triangle-extrema"],
  },
  {
    id: "syl-comp2-complex-basic",
    book: "必修二",
    chapter: "平面向量与复数",
    itemTitle: "复数概念、四则代数运算与几何意义",
    status: "covered",
    pages: ["/complex-geometric"],
  },
  {
    id: "syl-comp2-complex-trig",
    book: "必修二",
    chapter: "平面向量与复数",
    itemTitle: "复数三角表示（7.3 选学）",
    status: "partial",
    pages: ["/complex-geometric"],
    gapReason: "以几何旋转缩放呈现，未单独标出拓展选学徽标",
  },
  {
    id: "syl-comp2-solid-concept",
    book: "必修二",
    chapter: "立体几何初步",
    itemTitle: "基本立体图形与直观图画法（斜二测画法）",
    status: "covered",
    pages: ["/solid-oblique-drawing", "/solid-axioms"],
  },
  {
    id: "syl-comp2-solid-rotation",
    book: "必修二",
    chapter: "立体几何初步",
    itemTitle: "旋转体（圆柱/圆锥/圆台/球）特征与表面积体积",
    status: "covered",
    pages: ["/solid-rotation-body", "/solid-ball"],
  },
  {
    id: "syl-comp2-solid-position",
    book: "必修二",
    chapter: "立体几何初步",
    itemTitle: "空间公理与基本事实（点线面位置关系）",
    status: "covered",
    pages: ["/solid-position"],
  },
  {
    id: "syl-comp2-solid-parallel-perp",
    book: "必修二",
    chapter: "立体几何初步",
    itemTitle: "直线与平面、平面与平面的平行与垂直判定与性质",
    status: "covered",
    pages: ["/solid-position", "/solid-surface-relation"],
  },
  {
    id: "syl-comp2-stat-sample",
    book: "必修二",
    chapter: "统计",
    itemTitle: "随机抽样方法与样本特征",
    status: "covered",
    pages: ["/stat-percentile"],
  },
  {
    id: "syl-comp2-stat-distribution",
    book: "必修二",
    chapter: "统计",
    itemTitle: "用样本估计总体（直方图/百分位数/均值方差）",
    status: "covered",
    pages: ["/stat-percentile"],
  },
  {
    id: "syl-comp2-prob-classical",
    book: "必修二",
    chapter: "概率",
    itemTitle: "随机事件、古典概型与事件独立性",
    status: "covered",
    pages: ["/probability-classical", "/probability-independence"],
  },
  {
    id: "syl-comp2-prob-frequency",
    book: "必修二",
    chapter: "概率",
    itemTitle: "频率与概率（10.3 频率的稳定性）",
    status: "gap",
    pages: [],
    gapCode: "G3",
    gapReason: "大样本频率逼近概率的稳定性探究全库缺独立承载",
  },

  // ── 选择性必修一（13 项：空间向量、直线与圆、圆锥曲线）──
  {
    id: "syl-sel1-vector3d-basis",
    book: "选择性必修一",
    chapter: "空间向量与立体几何",
    itemTitle: "空间向量线性运算、空间基底与坐标运算",
    status: "covered",
    pages: ["/vector3d-basis"],
  },
  {
    id: "syl-sel1-spatial-angle-dist",
    book: "选择性必修一",
    chapter: "空间向量与立体几何",
    itemTitle: "空间向量应用（空间角与空间距离建系计算）",
    status: "covered",
    pages: ["/solid-angle", "/solid-distance"],
  },
  {
    id: "syl-sel1-line-equation",
    book: "选择性必修一",
    chapter: "直线和圆的方程",
    itemTitle: "直线的倾斜角、斜率与直线方程形式",
    status: "covered",
    pages: ["/line-equation"],
  },
  {
    id: "syl-sel1-line-relation",
    book: "选择性必修一",
    chapter: "直线和圆的方程",
    itemTitle: "两条直线的位置关系、夹角与点到直线距离",
    status: "covered",
    pages: ["/line-equation"],
  },
  {
    id: "syl-sel1-circle-equation",
    book: "选择性必修一",
    chapter: "直线和圆的方程",
    itemTitle: "圆的标准方程与一般方程",
    status: "covered",
    pages: ["/circle-equation"],
  },
  {
    id: "syl-sel1-line-circle",
    book: "选择性必修一",
    chapter: "直线和圆的方程",
    itemTitle: "直线与圆的位置关系（几何法与代数法）",
    status: "covered",
    pages: ["/line-circle"],
  },
  {
    id: "syl-sel1-circle-circle",
    book: "选择性必修一",
    chapter: "直线和圆的方程",
    itemTitle: "圆与圆的位置关系及公共弦",
    status: "covered",
    pages: ["/circle-circle"],
  },
  {
    id: "syl-sel1-ellipse",
    book: "选择性必修一",
    chapter: "圆锥曲线的方程",
    itemTitle: "椭圆的标准方程与几何性质",
    status: "covered",
    pages: ["/conic-properties"],
  },
  {
    id: "syl-sel1-hyperbola",
    book: "选择性必修一",
    chapter: "圆锥曲线的方程",
    itemTitle: "双曲线的标准方程与渐近线性质",
    status: "covered",
    pages: ["/conic-properties"],
  },
  {
    id: "syl-sel1-parabola",
    book: "选择性必修一",
    chapter: "圆锥曲线的方程",
    itemTitle: "抛物线的标准方程与焦半径性质",
    status: "covered",
    pages: ["/conic-parabola"],
  },
  {
    id: "syl-sel1-conic-line",
    book: "选择性必修一",
    chapter: "圆锥曲线的方程",
    itemTitle: "直线与圆锥曲线联立韦达、中点弦与弦长通法",
    status: "covered",
    pages: ["/conic-line"],
  },
  {
    id: "syl-sel1-conic-eccentricity",
    book: "选择性必修一",
    chapter: "圆锥曲线的方程",
    itemTitle: "圆锥曲线离心率与高考压轴构型",
    status: "covered",
    pages: ["/conic-definition", "/conic-properties"],
  },
  {
    id: "syl-sel1-conic-opt",
    book: "选择性必修一",
    chapter: "圆锥曲线的方程",
    itemTitle: "圆锥曲线单参数设点与代数降维",
    status: "covered",
    pages: ["/conic-param"],
  },

  // ── 选择性必修二（11 项：数列、一元导数及其应用）──
  {
    id: "syl-sel2-seq-concept",
    book: "选择性必修二",
    chapter: "数列",
    itemTitle: "数列的概念与通项公式、Sn与an互化（4.1）",
    status: "gap",
    pages: [],
    gapCode: "G1",
    gapReason: "已知 Sn 求 an 逆向考法全库尚无独立教学模型",
  },
  {
    id: "syl-sel2-seq-arithmetic",
    book: "选择性必修二",
    chapter: "数列",
    itemTitle: "等差数列的通项与前n项和",
    status: "covered",
    pages: ["/sequence-arithmetic"],
  },
  {
    id: "syl-sel2-seq-geometric",
    book: "选择性必修二",
    chapter: "数列",
    itemTitle: "等比数列的通项与前n项和",
    status: "covered",
    pages: ["/sequence-geometric"],
  },
  {
    id: "syl-sel2-seq-sum",
    book: "选择性必修二",
    chapter: "数列",
    itemTitle: "数列求和通法（错位相减法与裂项相消法）",
    status: "covered",
    pages: ["/sequence-models"],
  },
  {
    id: "syl-sel2-seq-recurrence",
    book: "选择性必修二",
    chapter: "数列",
    itemTitle: "数列递推与辅助构造",
    status: "covered",
    pages: ["/sequence-recurrence"],
  },
  {
    id: "syl-sel2-induction",
    book: "选择性必修二",
    chapter: "数列",
    itemTitle: "数学归纳法（4.4）",
    status: "gap",
    pages: [],
    gapCode: "G2",
    gapReason: "课标选学条目，当前仅注释提及，无独立教学演示",
  },
  {
    id: "syl-sel2-deriv-tangent",
    book: "选择性必修二",
    chapter: "一元函数的导数及其应用",
    itemTitle: "导数概念、几何意义与切线方程",
    status: "covered",
    pages: ["/derivative"],
  },
  {
    id: "syl-sel2-deriv-rules",
    book: "选择性必修二",
    chapter: "一元函数的导数及其应用",
    itemTitle: "求导公式表与导数四则运算法则",
    status: "covered",
    pages: ["/derivative-formulas", "/derivative-operations"],
  },
  {
    id: "syl-sel2-deriv-chain",
    book: "选择性必修二",
    chapter: "一元函数的导数及其应用",
    itemTitle: "复合函数求导法则",
    status: "covered",
    pages: ["/derivative-chain"],
  },
  {
    id: "syl-sel2-deriv-mono-extrema",
    book: "选择性必修二",
    chapter: "一元函数的导数及其应用",
    itemTitle: "导数研究单调性、极值最值与生活优化建模",
    status: "covered",
    pages: ["/derivative-monotonicity", "/derivative-optimization"],
  },
  {
    id: "syl-sel2-deriv-advanced",
    book: "选择性必修二",
    chapter: "一元函数的导数及其应用",
    itemTitle: "导数压轴通法（极值点偏移、隐零点与双变量）",
    status: "covered",
    pages: ["/derivative-shift"],
  },

  // ── 选择性必修三（10 项：计数原理、条件概率与分布列、成对数据分析）──
  {
    id: "syl-sel3-counting",
    book: "选择性必修三",
    chapter: "计数原理",
    itemTitle: "两类基本计数原理、排列与组合、二项式定理",
    status: "covered",
    pages: ["/probability-counting"],
  },
  {
    id: "syl-sel3-bayes",
    book: "选择性必修三",
    chapter: "随机变量及其分布",
    itemTitle: "条件概率、全概率公式与贝叶斯公式",
    status: "covered",
    pages: ["/probability-bayes"],
  },
  {
    id: "syl-sel3-distribution",
    book: "选择性必修三",
    chapter: "随机变量及其分布",
    itemTitle: "离散型随机变量分布列与期望方差",
    status: "covered",
    pages: ["/probability-distribution"],
  },
  {
    id: "syl-sel3-binomial-hyper",
    book: "选择性必修三",
    chapter: "随机变量及其分布",
    itemTitle: "二项分布与超几何分布模型辨析",
    status: "covered",
    pages: ["/probability-distribution"],
  },
  {
    id: "syl-sel3-markov",
    book: "选择性必修三",
    chapter: "随机变量及其分布",
    itemTitle: "概率递推模型与马尔可夫状态转移",
    status: "covered",
    pages: ["/probability-markov"],
  },
  {
    id: "syl-sel3-normal",
    book: "选择性必修三",
    chapter: "随机变量及其分布",
    itemTitle: "正态分布规律与 3sigma 原则",
    status: "covered",
    pages: ["/statistics-normal"],
  },
  {
    id: "syl-sel3-regression",
    book: "选择性必修三",
    chapter: "成对数据分析",
    itemTitle: "样本相关系数与一元线性回归模型",
    status: "covered",
    pages: ["/paired-data-regression"],
  },
  {
    id: "syl-sel3-contingency",
    book: "选择性必修三",
    chapter: "成对数据分析",
    itemTitle: "2x2 列联表与独立性检验",
    status: "covered",
    pages: ["/paired-data-independence"],
  },
  {
    id: "syl-sel3-non-linear",
    book: "选择性必修三",
    chapter: "成对数据分析",
    itemTitle: "非线性回归经验模型转化",
    status: "covered",
    pages: ["/paired-data-regression"],
  },
  {
    id: "syl-sel3-stats-review",
    book: "选择性必修三",
    chapter: "成对数据分析",
    itemTitle: "成对数据决策分析与反思",
    status: "covered",
    pages: ["/paired-data-independence"],
  },
];

describe("课标覆盖差集自动化门禁契约 (Syllabus Coverage Contract)", () => {
  const registeredRoutes = new Set(
    routeEntries
      .map((e) => e.node.route)
      .filter((r): r is string => Boolean(r)),
  );
  const treeRoutes = new Set(
    knowledgeTree.map((n) => n.route).filter((r): r is string => Boolean(r)),
  );

  it("契约基线完整性：课标 71 个核心条目全量纳入守卫", () => {
    expect(SYLLABUS_CORE_ITEMS.length).toBe(71);
    const coveredCount = SYLLABUS_CORE_ITEMS.filter(
      (i) => i.status === "covered",
    ).length;
    const partialCount = SYLLABUS_CORE_ITEMS.filter(
      (i) => i.status === "partial",
    ).length;
    const gapCount = SYLLABUS_CORE_ITEMS.filter(
      (i) => i.status === "gap",
    ).length;

    expect(coveredCount).toBe(62);
    expect(partialCount).toBe(4);
    expect(gapCount).toBe(5);
    // 覆盖 + 部分覆盖 = 66 项（92.9% 课标覆盖率）
    expect(coveredCount + partialCount).toBe(66);
  });

  it("防静默退化（No Silent Regression）：所有已覆盖条目的声明路由必须在全库真实注册", () => {
    const unresolvablePages: string[] = [];
    for (const item of SYLLABUS_CORE_ITEMS) {
      if (item.status === "covered" || item.status === "partial") {
        for (const page of item.pages) {
          if (!registeredRoutes.has(page) || !treeRoutes.has(page)) {
            unresolvablePages.push(`${item.id} -> ${page}`);
          }
        }
      }
    }
    expect(unresolvablePages).toEqual([]);
  });

  it("缺口受控闭环：G1~G7 七大缺口必须严格登记 gapCode 与 gapReason，禁止未登记缺口扩散", () => {
    const validGapCodes = new Set(["G1", "G2", "G3", "G4", "G5", "G6", "G7"]);

    for (const item of SYLLABUS_CORE_ITEMS) {
      if (item.status === "gap") {
        expect(
          item.gapCode,
          `条目 [${item.id}] 为 gap 状态，必须绑定具体 gapCode`,
        ).toBeDefined();
        expect(validGapCodes.has(item.gapCode!)).toBe(true);
        expect(
          item.gapReason,
          `条目 [${item.id}] 为 gap 状态，必须详述 gapReason`,
        ).toBeDefined();
        expect(item.gapReason!.length).toBeGreaterThan(5);
      } else if (item.status === "covered") {
        expect(
          item.gapCode,
          `条目 [${item.id}] 已声明 covered，严禁残留 gapCode`,
        ).toBeUndefined();
      } else if (item.status === "partial") {
        expect(
          item.gapReason,
          `条目 [${item.id}] 为 partial 状态，必须详述 gapReason`,
        ).toBeDefined();
        expect(item.gapReason!.length).toBeGreaterThan(5);
        if (item.gapCode !== undefined) {
          expect(validGapCodes.has(item.gapCode)).toBe(true);
        }
      }
    }

    const allWithGap = SYLLABUS_CORE_ITEMS.filter(
      (i) => i.gapCode !== undefined,
    );
    const gapCodesFound = new Set(allWithGap.map((i) => i.gapCode!));
    expect(gapCodesFound.size).toBe(7);
    expect([...gapCodesFound].sort()).toEqual(
      ["G1", "G2", "G3", "G4", "G5", "G6", "G7"].sort(),
    );
  });

  it("课标条目分册归属拓扑一致性：条目所挂载路由的节点分册不得迟于条目所属分册", () => {
    const bookOrder: Record<string, number> = {
      必修一: 1,
      必修二: 2,
      选择性必修一: 3,
      选择性必修二: 4,
      选择性必修三: 5,
    };

    const nodeByRoute = new Map<string, (typeof knowledgeTree)[number]>();
    for (const node of knowledgeTree) {
      if (node.route) nodeByRoute.set(node.route, node);
    }

    const topoViolations: string[] = [];
    for (const item of SYLLABUS_CORE_ITEMS) {
      const itemBookRank = bookOrder[item.book];
      for (const page of item.pages) {
        const node = nodeByRoute.get(page);
        expect(
          node,
          `条目 [${item.id}] 引用的页面 [${page}] 必须在 knowledgeTree 中存在`,
        ).toBeDefined();
        const nodeBook = node?.syllabus?.book;
        expect(
          nodeBook,
          `节点 [${node?.id}] 承载课标条目 [${item.id}]，必须声明 syllabus.book`,
        ).toBeDefined();
        const nodeBookRank = nodeBook ? bookOrder[nodeBook] : 0;
        // 允许先修页面承载后修专题（例如用必修二三角讲选修），但不允许倒流（必修条目由后修分册节点单独冒充）
        if (
          nodeBookRank &&
          nodeBookRank > itemBookRank &&
          item.status === "covered"
        ) {
          topoViolations.push(
            `条目 [${item.book}] ${item.itemTitle} 挂载在后序分册节点 [${nodeBook}] (${page})`,
          );
        }
      }
    }
    expect(topoViolations).toEqual([]);
  });
});
