import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * 巡检覆盖门禁（结构性，而非手工自觉）
 *
 * ## 它解决什么
 * `presetParamsDomainSafety` 与 `autoRegistryFuzz` 的用例清单都是**手工维护的数组**。
 * 后果是：任何新页面只要作者忘了回来加一行，就会**静默脱离全部数值安全巡检**，
 * 而两道门禁依旧全绿 —— 这正是"四道门禁全绿、但新页面仍有问题"的共同根因之一。
 *
 * 本门禁把这条隐含约定变成会**大声失败**的断言：
 * `mathQuantities.ts` 分派表里出现的每一个 `animId`，都必须至少出现在
 * 某个巡检清单里。新页面若不登记，构建立刻红。
 *
 * ## 为什么读源码而不是 import
 * 两个巡检清单是各测试文件内部的局部数组，没有对外导出；
 * 这里直接解析它们的源码文本，拿到的就是"实际会被巡检的 animId 集合"本身，
 * 不会因为中间加一层导出而与真实情况脱节。
 */

const ROOT = resolve(__dirname, "../..");
const read = (rel: string) => readFileSync(resolve(ROOT, rel), "utf-8");

/** 分派表所在的源码（单一入口，所有右屏看板数据都由它路由） */
const DISPATCH_FILE = "src/data/mathQuantities.ts";

/** 承载巡检清单的测试文件（新增清单文件时必须加入本数组） */
const INSPECTION_FILES = [
  "src/test/presetParamsDomainSafety.test.ts",
  "src/test/autoRegistryFuzz.test.ts",
];

/** 从源码里收集 `case "anim-xxx":` 形式的 animId */
function collectDispatchIds(source: string): Set<string> {
  const ids = new Set<string>();
  for (const m of source.matchAll(/case\s+"(anim-[a-z0-9-]+)"\s*:/g)) {
    ids.add(m[1]);
  }
  return ids;
}

/** 从巡检文件源码里收集 `animId: "anim-xxx"` 形式的 animId */
function collectInspectedIds(source: string): Set<string> {
  const ids = new Set<string>();
  for (const m of source.matchAll(/animId:\s*"(anim-[a-z0-9-]+)"/g)) {
    ids.add(m[1]);
  }
  return ids;
}

describe("右屏看板巡检覆盖门禁 (Domain Inspection Coverage)", () => {
  const dispatchIds = collectDispatchIds(read(DISPATCH_FILE));
  const inspectedIds = new Set<string>();
  for (const file of INSPECTION_FILES) {
    for (const id of collectInspectedIds(read(file))) inspectedIds.add(id);
  }

  it("分派表能被正确解析（防止正则失效后门禁静默变成空集）", () => {
    expect(dispatchIds.size).toBeGreaterThan(80);
  });

  it("巡检清单能被正确解析（防止正则失效后门禁静默变成空集）", () => {
    expect(inspectedIds.size).toBeGreaterThan(80);
  });

  it("分派表里的每一个 animId 都至少被一个巡检清单覆盖", () => {
    const uncovered = [...dispatchIds]
      .filter((id) => !inspectedIds.has(id))
      .sort();

    if (uncovered.length > 0) {
      throw new Error(
        `以下 animId 出现在 ${DISPATCH_FILE} 的分派表中，却没有进入任何数值安全巡检清单：\n` +
          uncovered.map((id) => `  - ${id}`).join("\n") +
          `\n\n请把它们加入 ${INSPECTION_FILES.join(" 或 ")} 的用例数组` +
          `（并按页面实际模式/构型补充边界参数），否则新页面会静默脱离 NaN/定义域巡检。`,
      );
    }

    expect(uncovered).toEqual([]);
  });
});
