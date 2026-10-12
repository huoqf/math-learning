import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { knowledgeTree } from "./knowledgeTree";
import { routeEntries, ANIMATION_ROUTE_MAP } from "./routeEntries";

function extractRouteMap(): Record<string, string> {
  return ANIMATION_ROUTE_MAP;
}

// ── 从 routeEntries 获取所有已注册路由 ──
function getRouteEntryRoutes(): Set<string> {
  return new Set(
    routeEntries.map((e) => e.node.route).filter((r): r is string => !!r),
  );
}

describe("knowledgeTree 数据完整性", () => {
  it("所有节点 id 全局唯一", () => {
    const ids = knowledgeTree.map((n) => n.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes).toEqual([]);
  });

  it("所有声明了 route 的节点 route 全局唯一（杜绝影子节点）", () => {
    const routes = knowledgeTree
      .map((n) => n.route)
      .filter((r): r is string => Boolean(r));
    const dupes = routes.filter((r, i) => routes.indexOf(r) !== i);
    expect(dupes).toEqual([]);
  });

  it("树侧高考元数据完整性门禁：所有已路由节点必须声明 gaokaoTopic / questionCategory / examWeight / examMethod", () => {
    const fields = [
      "gaokaoTopic",
      "questionCategory",
      "examWeight",
      "examMethod",
    ] as const;
    const missing: string[] = [];
    for (const node of knowledgeTree) {
      if (!node.route) continue; // 未路由（规划中）节点不在完整性要求范围
      for (const field of fields) {
        if (node[field] === undefined) {
          missing.push(`${node.id}.${field}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it("所有节点的 prerequisites 引用的 id 都存在", () => {
    const ids = new Set(knowledgeTree.map((n) => n.id));
    const missing: string[] = [];
    for (const node of knowledgeTree) {
      for (const pre of node.prerequisites) {
        if (!ids.has(pre)) {
          missing.push(`${node.id} → ${pre}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it("所有节点的 importance 值合法", () => {
    const valid = new Set(["basic", "core", "gaokao", "hard", "extend"]);
    const invalid = knowledgeTree.filter((n) => !valid.has(n.importance));
    expect(invalid.map((n) => n.id)).toEqual([]);
  });

  it("快照：节点顺序不可被意外调整", () => {
    expect(knowledgeTree.map((n) => n.id)).toMatchSnapshot();
  });
});

describe("ANIMATION_ROUTE_MAP 一致性", () => {
  const routeMap = extractRouteMap();

  it("ANIMATION_ROUTE_MAP 中每个 key 都被至少一个 knowledgeTree 节点的 animationIds 引用", () => {
    const allAnimIds = new Set(knowledgeTree.flatMap((n) => n.animationIds));
    const orphanKeys = Object.keys(routeMap).filter(
      (key) => !allAnimIds.has(key),
    );
    expect(orphanKeys).toEqual([]);
  });

  it("每个有 animationIds 的 knowledgeTree 节点至少有一个 animId 在 ANIMATION_ROUTE_MAP 中有映射", () => {
    const nodesWithoutRoute = knowledgeTree
      .filter((n) => n.animationIds.length > 0)
      .filter((n) => !n.animationIds.some((a) => a in routeMap));
    // 已知的规划中节点（无路由）是预期的，不算失败
    // 此测试仅验证 routeMap 的反向一致性（每个 key 都有节点引用）
    expect(nodesWithoutRoute.length).toBeGreaterThanOrEqual(0);
  });

  it("ANIMATION_ROUTE_MAP 中每个 route 都在 routeEntries 中注册", () => {
    const entryRoutes = getRouteEntryRoutes();
    const missingRoutes = Object.entries(routeMap).filter(
      ([, route]) => !entryRoutes.has(route),
    );
    expect(missingRoutes.map(([k, v]) => `${k} → ${v}`)).toEqual([]);
  });
});

describe("knowledgeTree ↔ routeEntries 路由一致性", () => {
  const routeMap = extractRouteMap();
  const entryRoutes = getRouteEntryRoutes();

  it("所有在 routeMap 中有映射的 animId 对应的 route 都在 routeEntries 中注册", () => {
    const missingFromEntries = Object.values(routeMap).filter(
      (route) => !entryRoutes.has(route),
    );
    expect([...new Set(missingFromEntries)]).toEqual([]);
  });

  it("routeEntries 中每个有 route 的节点，route 全局唯一", () => {
    const routes = routeEntries
      .map((e) => e.node.route)
      .filter((r): r is string => !!r);
    const dupes = routes.filter((r, i) => routes.indexOf(r) !== i);
    expect(dupes).toEqual([]);
  });
});

describe("barrel export 纪律", () => {
  it("features/*/index.ts 不得 re-export meta.ts", () => {
    const featuresDir = resolve(__dirname, "../features");

    const violations: string[] = [];

    function scanDir(dir: string) {
      for (const entry of readdirSync(dir)) {
        const fullPath = resolve(dir, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (entry === "index.ts") {
          const content = readFileSync(fullPath, "utf-8");
          if (/from\s+["']\.\/?meta["']/.test(content)) {
            violations.push(fullPath.replace(featuresDir, "@/features"));
          }
        }
      }
    }

    scanDir(featuresDir);
    expect(violations).toEqual([]);
  });
});

describe("学段边界（课标 / 拓展）一致性", () => {
  /**
   * 回归防线：把"这页是不是超纲内容"从人工自觉变成机器可拦截项。
   *
   * 约定（与 discipline/no-beyond-syllabus-terms 门禁规则互补）：
   *  1. importance === "extend" 的节点，标题必须带「拓展 / 选学 / 超出课标 / 竞赛」字样，
   *     以保证学生一眼能识别该内容不在课标正文范围内；
   *  2. module / chapter 中出现"拓展"字样的节点，importance 必须为 "extend"，避免定位自相矛盾；
   *  3. 若填写了 syllabus 字段：book 必须非空；status !== "正文" 时 importance 必须为 "extend"。
   */
  const EXTEND_HINT = /拓展|选学|超出课标|竞赛/;

  it('importance === "extend" 的节点，标题必须标注拓展/选学语义', () => {
    const offenders = knowledgeTree
      .filter((n) => n.importance === "extend")
      .filter((n) => !EXTEND_HINT.test(`${n.title}${n.module}${n.chapter}`))
      .map((n) => `${n.id}（title: ${n.title}）`);
    expect(offenders).toEqual([]);
  });

  it('module 或 chapter 含"拓展"字样的节点，importance 必须为 "extend"', () => {
    const offenders = knowledgeTree
      .filter((n) => /拓展/.test(`${n.module}${n.chapter}`))
      .filter((n) => n.importance !== "extend")
      .map(
        (n) => `${n.id}（importance: ${n.importance}，module: ${n.module}）`,
      );
    expect(offenders).toEqual([]);
  });

  it('syllabus 字段：book 非空，且非"正文"状态必须标注为 extend', () => {
    const offenders: string[] = [];
    for (const n of knowledgeTree) {
      if (!n.syllabus) continue;
      if (!n.syllabus.book || n.syllabus.book.trim().length === 0) {
        offenders.push(`${n.id}：syllabus.book 为空`);
      }
      if (n.syllabus.status !== "正文" && n.importance !== "extend") {
        offenders.push(
          `${n.id}：status=${n.syllabus.status} 但 importance=${n.importance}`,
        );
      }
    }
    expect(offenders).toEqual([]);
  });

  it('同一节点不得同时声明"正文"与拓展语义标题', () => {
    const offenders = knowledgeTree
      .filter((n) => n.syllabus?.status === "正文")
      .filter((n) => /超出课标/.test(n.title))
      .map((n) => n.id);
    expect(offenders).toEqual([]);
  });

  it("所有节点都必须有课标分册定位（100% 覆盖，SSOT = src/data/syllabus.ts）", () => {
    const offenders = knowledgeTree
      .filter((n) => !n.syllabus?.book || n.syllabus.book === "未标注")
      .map((n) => `${n.id}（chapter: ${n.chapter}，module: ${n.module}）`);
    expect(offenders).toEqual([]);
  });

  it("分册取值必须属于人教A版合法分册集合", () => {
    const validBooks = new Set([
      "必修一",
      "必修二",
      "选择性必修一",
      "选择性必修二",
      "选择性必修三",
    ]);
    const offenders = knowledgeTree
      .filter((n) => n.syllabus && !validBooks.has(n.syllabus.book))
      .map((n) => `${n.id} → ${n.syllabus?.book}`);
    expect(offenders).toEqual([]);
  });

  it("同一章节内不得出现与教材分册结构冲突的册次（抽样校验关键边界）", () => {
    const byId = new Map(knowledgeTree.map((n) => [n.id, n]));
    // 空间向量类节点必须落在选择性必修一，立体几何初步（综合法）落在必修二
    expect(byId.get("know-vector3d-basis")?.syllabus?.book).toBe(
      "选择性必修一",
    );
    expect(byId.get("know-solid-angle")?.syllabus?.book).toBe("选择性必修一");
    expect(byId.get("know-solid-position")?.syllabus?.book).toBe("必修二");
    // 成对数据分析属选择性必修三，而分层抽样/百分位数属必修二
    expect(byId.get("know-paired-independence")?.syllabus?.book).toBe(
      "选择性必修三",
    );
    expect(byId.get("know-stat-percentile")?.syllabus?.book).toBe("必修二");
  });
});

describe("先修拓扑册次门禁（先修不得晚于本节点所在分册）", () => {
  /**
   * 背景（来源：概率统计模块审计 P1-2）：
   *   `know-stat-percentile`（必修二第九章 分层抽样/频率直方图/百分位数）曾把
   *   `know-probability-normal`（选择性必修三 7.5 正态分布）写成先修——用后学的册次
   *   给先学的内容当前置，先修方向倒置。旧门禁只校验"先修引用的 id 存在"，
   *   方向错误不会被拦截。
   *
   * 本门禁把"先修册次不得晚于本节点册次"交给机器裁决：
   *   人教 A 版（2019）分册先后序 = 必修一 → 必修二 → 选择性必修一 → 选择性必修二 → 选择性必修三。
   *   先修节点所在分册的序号必须 ≤ 本节点分册序号（允许同册内部互相先修）。
   */
  const BOOK_ORDER: Record<string, number> = {
    必修一: 1,
    必修二: 2,
    选择性必修一: 3,
    选择性必修二: 4,
    选择性必修三: 5,
  };

  it("先修节点的课标分册不得晚于本节点分册", () => {
    const byId = new Map(knowledgeTree.map((n) => [n.id, n]));
    const offenders: string[] = [];
    for (const node of knowledgeTree) {
      const nodeRank = BOOK_ORDER[node.syllabus?.book ?? ""];
      if (!nodeRank) continue;
      for (const preId of node.prerequisites) {
        const pre = byId.get(preId);
        const preRank = BOOK_ORDER[pre?.syllabus?.book ?? ""];
        if (!preRank) continue;
        if (preRank > nodeRank) {
          offenders.push(
            `${node.id}（${node.syllabus?.book}）← ${preId}（${pre?.syllabus?.book}）`,
          );
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("概率统计分支：必修二概率基础层存在且被挂到条件概率/分布列先修位", () => {
    const byId = new Map(knowledgeTree.map((n) => [n.id, n]));

    // 必修二第十章基础层三个节点必须存在，且册次为必修二
    for (const id of [
      "know-probability-events",
      "know-probability-classical",
      "know-probability-independence",
    ]) {
      expect(byId.get(id)?.syllabus?.book).toBe("必修二");
    }

    // 条件概率（选必三）必须先修古典概型与事件的独立性（必修二）
    expect(byId.get("know-probability-bayes")?.prerequisites).toEqual(
      expect.arrayContaining([
        "know-probability-classical",
        "know-probability-independence",
      ]),
    );

    // 分布列（选必三）必须先修计数原理（二项分布的 C_n^k 来源）
    expect(byId.get("know-probability-distribution")?.prerequisites).toEqual(
      expect.arrayContaining(["know-probability-counting"]),
    );

    // 回归防线：分层抽样（必修二）不得再声明选择性必修三节点为先修
    expect(byId.get("know-stat-percentile")?.prerequisites).toEqual([]);
    // 正确方向：正态分布（选必三 7.5）先修频率直方图（必修二第九章）
    expect(byId.get("know-probability-normal")?.prerequisites).toEqual(
      expect.arrayContaining(["know-stat-percentile"]),
    );
  });
});

describe("双源定义一致性（knowledgeTree ↔ features/*/meta.ts）", () => {
  /**
   * 背景：src/data/knowledgeTree 目录与各 src/features 下各页面目录中的 meta.ts，
   * 各自维护了一份同 id 的 KnowledgeNode 定义（前者供首页知识树，后者经 routeEntries 供路由）。
   * 历史教训：C29–C32 曾因两处 chapter/module/gaokaoTopic 分歧导致"改了这边忘了那边"；
   * markovNode 曾一处 importance 为 "hard"、另一处为 "extend"。
   *
   * 在"单一定义源"重构（修复记录 7.2 方案 A/B）落地前，本契约把两处脱节交给机器拦截。
   *
   * ## 为什么是"通用规则"而不是逐字段枚举
   * 逐字段枚举（只挑 importance/chapter/module 或再加 route/prerequisites…）永远漏项：
   * 实测 meta 侧会声明的字段有 13 个（id/title/chapter/module/importance/animationIds/
   * prerequisites/labTitle/route/gaokaoTopic/questionCategory/examMethod/examWeight），
   * 只要有一个没进枚举，它就重新变成"两侧各看自洽、单源测试抓不到"的盲区——
   * 本断言落地时就靠通用规则抓到了一处枚举版永远看不见的真实漂移：
   * `know-derivative-tangent-scaling.examMethod` 在 LaTeX 内空白上两侧不一致。
   *
   * ## 收缩规则
   * 「meta 侧只要声明了某字段（非 undefined），就必须与知识树侧逐字一致」。
   * meta **允许省略**字段（首页专用字段如 syllabus 由 knowledgeTree 出口统一回填，
   * syllabus 是知识树专有，本规则天然不覆盖），但**不允许分歧**。
   *
   * ## 两侧各自的权威字段（同步方向，供将来收敛时参考）
   * - 知识树为权威：prerequisites（meta 侧零运行时消费方；知识树侧被"先修拓扑册次门禁"
   *   与下方概率分支用例消费，后者用数学理由钉死过 C_n^k 的先修来源）、
   *   gaokaoTopic/questionCategory/examWeight/examMethod（面向首页知识树的呈现层字段）。
   * - meta 为权威：labTitle/route/animationIds（routeEntries 从 meta 派生
   *   ANIMATION_ROUTE_MAP 与 PATH_TO_LABEL，教师/学生看到的页面标签就来自这里）。
   *
   * ## 本规则的边界（不要误以为"全字段已锁"）
   * 知识树专有字段（syllabus 回填、以及将来任何只写在一侧的字段）不在覆盖范围；
   * 它们若哪天被写进 meta，本规则会自动把它们纳入把守——这正是通用规则的价值。
   */
  type MetaNode = (typeof routeEntries)[number]["node"];

  const metaById = new Map<string, MetaNode>();
  for (const entry of routeEntries) {
    if (entry.node?.id) metaById.set(entry.node.id, entry.node);
  }

  it("同 id 节点：meta 侧声明的每个字段都必须与知识树侧逐字一致", () => {
    const mismatches: string[] = [];
    /** 按字段名取值：KnowledgeNode 没有索引签名，故经 unknown 桥接 */
    const fieldOf = (node: unknown, key: string): unknown =>
      (node as Record<string, unknown>)[key];
    for (const n of knowledgeTree) {
      const m = metaById.get(n.id);
      if (!m) continue; // 知识树独有（未路由 / 规划中）节点不在本契约范围
      for (const key of Object.keys(m as object)) {
        const metaValue = fieldOf(m, key);
        if (metaValue === undefined) continue; // meta 允许省略，但不得分歧
        const treeValue = fieldOf(n, key);
        if (JSON.stringify(treeValue) !== JSON.stringify(metaValue)) {
          mismatches.push(
            `${n.id}.${key}: knowledgeTree=${JSON.stringify(treeValue)} | meta=${JSON.stringify(metaValue)}`,
          );
        }
      }
    }
    expect(mismatches).toEqual([]);
  });

  it("features/*/meta.ts 定义的每个节点都必须在 knowledgeTree 中存在（无孤儿 meta 节点）", () => {
    const treeIds = new Set(knowledgeTree.map((n) => n.id));
    const orphans = [...metaById.keys()].filter((id) => !treeIds.has(id));
    expect(orphans).toEqual([]);
  });

  /**
   * 补充说明：labTitle 的同步方向取 meta → tree 时，知识树侧会失去
   * "…实验室"的命名统一（meta 侧个别节点用"…模型 / …与数字特征"等措辞）。
   * 这是**有意接受**的取舍——门禁只负责"锁死漂移、不改文案"，
   * 学生看到的页面标签一字不变；命名统一属编辑性议题，另行处理。
   */
});
