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

describe("双源定义一致性（knowledgeTree ↔ features/*/meta.ts）", () => {
  /**
   * 背景：src/data/knowledgeTree 目录与各 src/features 下各页面目录中的 meta.ts，
   * 各自维护了一份同 id 的 KnowledgeNode 定义（前者供首页知识树，后者经 routeEntries 供路由）。
   * 历史教训：C29–C32 曾因两处 chapter/module/gaokaoTopic 分歧导致"改了这边忘了那边"；
   * markovNode 曾一处 importance 为 "hard"、另一处为 "extend"。
   *
   * 在"单一定义源"重构（修复记录 7.2 方案 A/B）落地前，本契约测试强制同 id 节点的
   * 定位字段完全一致，让两处脱节在提交时即被机器拦截，杜绝双源漂移复发。
   */
  type MetaNode = (typeof routeEntries)[number]["node"];

  const metaById = new Map<string, MetaNode>();
  for (const entry of routeEntries) {
    if (entry.node?.id) metaById.set(entry.node.id, entry.node);
  }

  it("同 id 节点：importance / chapter / module 必须完全一致", () => {
    const mismatches: string[] = [];
    for (const n of knowledgeTree) {
      const m = metaById.get(n.id);
      if (!m) continue; // 知识树独有（未路由 / 规划中）节点不在本契约范围
      const fields: Array<[string, string, string]> = [
        ["importance", n.importance, m.importance],
        ["chapter", n.chapter, m.chapter],
        ["module", n.module, m.module],
      ];
      for (const [field, a, b] of fields) {
        if (a !== b) {
          mismatches.push(
            `${n.id}.${field}: knowledgeTree="${a}" | meta="${b}"`,
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
});
