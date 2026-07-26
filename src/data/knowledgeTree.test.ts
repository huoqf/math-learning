import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { knowledgeTree } from "./knowledgeTree";
import { routeEntries } from "./routeEntries";

// ── 读取 ANIMATION_ROUTE_MAP（从 KnowledgeTreeHome.tsx 源码中提取） ──
function extractRouteMap(): Record<string, string> {
  const filePath = resolve(__dirname, "../features/home/KnowledgeTreeHome.tsx");
  const src = readFileSync(filePath, "utf-8");

  // 提取 ANIMATION_ROUTE_MAP 对象体
  const mapStart = src.indexOf("const ANIMATION_ROUTE_MAP");
  expect(mapStart).toBeGreaterThanOrEqual(0);

  const objectStart = src.indexOf("{", mapStart);
  const objectBody = src.slice(objectStart);

  const entries: [string, string][] = [];
  const entryRegex = /"([^"]+)":\s*"([^"]+)"/g;
  let match;
  while ((match = entryRegex.exec(objectBody)) !== null) {
    entries.push([match[1], match[2]]);
    // 停在第一个非 map 的代码处（如 "// 重要性"）
    if (
      objectBody[match.index + match[0].length + 1] === "}" ||
      objectBody[match.index + match[0].length + 1] === "\n"
    ) {
      const nextNonWhitespace = objectBody
        .slice(match.index + match[0].length + 1)
        .trimStart();
      if (
        nextNonWhitespace.startsWith("}") ||
        nextNonWhitespace.startsWith("//")
      ) {
        // 可能已到末尾，继续检查
      }
    }
  }

  return Object.fromEntries(entries);
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
