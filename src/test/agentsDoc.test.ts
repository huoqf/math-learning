import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
// @ts-expect-error -- importing internal mjs audit script
import * as auditRulesModule from "../../.agents/skills/math-page-audit/scripts/rules/index.mjs";
import { MATH_COLORS } from "../theme/math/colors";

/**
 * AGENTS.md 契约测试 —— 把「工作区宪法」本身纳入机器门禁
 *
 * 缘起（2026-10-01 审查）：本仓库的哲学是「拒绝教条式规则堆砌，依托 DSL + 类型系统 +
 * 自动化静态门禁」。但 AGENTS.md 恰恰是全库**唯一没有门禁的产物**，于是发生了三类漂移：
 *   ① 门禁表把人工评审项写成"自动化拦截标准"（预设参数数学安全 / 立体几何垂足标记）；
 *   ② 文档把零消费的 box-shadow 令牌 `glowRing.activeStep` 当成 SVG 描边色 SSOT；
 *   ③ 门禁表的判定链顺序与 `discipline.mjs` 的真实短路序相反。
 * 本测试把这三类漂移变成 **import 即失败** 的硬约束，防止宪法继续漂移。
 */

const ROOT = process.cwd();
const AGENTS_DOC = resolve(ROOT, "AGENTS.md");

interface AuditRule {
  id: string;
  type: string;
  severity: string;
}

const allRules = auditRulesModule.allRules as AuditRule[];
const ruleIds = new Set(allRules.map((r) => r.id));

/** 允许出现在「执行者」列里的执行者种类（与 AGENTS.md 表头下方的图例保持一致） */
const EXECUTOR_KINDS = ["audit", "vitest", "tsc", "人工评审"];

/** 把一行表格按「未转义的 `|`」切成单元格（`\|` 是 Markdown 表格内的转义竖线，不可当分隔符） */
function splitRow(line: string): string[] {
  const PLACEHOLDER = "\u0001";
  return line
    .replace(/\\\|/g, PLACEHOLDER)
    .split("|")
    .map((cell) => cell.replace(new RegExp(PLACEHOLDER, "g"), "\\|").trim());
}

interface GateRow {
  lineNum: number;
  name: string;
  standard: string;
  executor: string;
}

/** 解析 AGENTS.md 第三节的门禁表（三列：检查项 / 判定标准 / 执行者） */
function parseGateTable(lines: string[]): GateRow[] {
  const rows: GateRow[] = [];
  let sawHeader = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim().startsWith("|")) continue;
    const cells = splitRow(line);
    // split 后首尾各有一个空串
    const body = cells.slice(1, -1);
    if (body.length !== 3) continue;
    if (body[0] === "门禁检查项") {
      expect(body[2], "门禁表缺少第三列「执行者」").toBe("执行者");
      sawHeader = true;
      continue;
    }
    if (/^:?-{2,}:?$/.test(body[0])) continue;
    if (!sawHeader) continue;
    rows.push({
      lineNum: i + 1,
      name: body[0].replace(/\*\*/g, "").trim(),
      standard: body[1],
      executor: body[2],
    });
  }
  return rows;
}

describe("AGENTS.md 契约测试（工作区宪法不得漂移）", () => {
  const doc = readFileSync(AGENTS_DOC, "utf-8");
  const lines = doc.split(/\r?\n/);
  const gateRows = parseGateTable(lines);

  it("门禁表可被解析且行数合理（结构未被破坏）", () => {
    expect(gateRows.length).toBeGreaterThanOrEqual(18);
    for (const row of gateRows) {
      expect(
        row.name.length,
        `第 ${row.lineNum} 行检查项名为空`,
      ).toBeGreaterThan(0);
      expect(
        row.standard.length,
        `第 ${row.lineNum} 行判定标准为空`,
      ).toBeGreaterThan(0);
    }
  });

  // ── 铁律 1：执行者真实性 ────────────────────────────────────────────────
  describe("铁律 1 · 执行者真实性（严禁伪自动化标准）", () => {
    it("每行都必须标注执行者，且种类在图例允许范围内", () => {
      const offenders: string[] = [];
      for (const row of gateRows) {
        if (row.executor.length === 0) {
          offenders.push(`${row.name}：执行者列为空`);
          continue;
        }
        const kinds = EXECUTOR_KINDS.filter((k) => row.executor.includes(k));
        if (kinds.length === 0) {
          offenders.push(`${row.name}：执行者「${row.executor}」不是合法种类`);
        }
      }
      expect(offenders).toEqual([]);
    });

    it("凡是声称自动化拦截的行，必须给出 audit 规则或 vitest 测试（否则须显式标为人工评审）", () => {
      const offenders: string[] = [];
      for (const row of gateRows) {
        const hasMachine =
          /`audit:/.test(row.executor) ||
          /`vitest:/.test(row.executor) ||
          /\btsc\b/.test(row.executor);
        if (!hasMachine && !row.executor.includes("人工评审")) {
          offenders.push(`${row.name}：无机器执行者却未标注「人工评审」`);
        }
      }
      expect(offenders).toEqual([]);
    });

    it("所有 `audit:<rule-id>` 必须真实存在于审计规则表", () => {
      const offenders: string[] = [];
      for (const row of gateRows) {
        for (const m of row.executor.matchAll(/`audit:([^`]+)`/g)) {
          const id = m[1].trim();
          // 元规则行允许写成脚本路径
          if (id.endsWith(".mjs")) {
            if (!existsSync(resolve(ROOT, id))) {
              offenders.push(`${row.name}：执行者脚本不存在 ${id}`);
            }
            continue;
          }
          if (!ruleIds.has(id)) offenders.push(`${row.name}：规则不存在 ${id}`);
        }
      }
      expect(offenders).toEqual([]);
    });

    it("所有 `vitest:<相对路径>` 必须真实存在于工作区", () => {
      const offenders: string[] = [];
      for (const row of gateRows) {
        for (const m of row.executor.matchAll(/`vitest:([^`]+)`/g)) {
          const rel = m[1].trim();
          const abs = resolve(ROOT, rel);
          if (!existsSync(abs) || !statSync(abs).isFile()) {
            offenders.push(`${row.name}：测试文件不存在 ${rel}`);
          }
        }
      }
      expect(offenders).toEqual([]);
    });

    it("审计规则覆盖面：门禁表至少引用 12 条不同的 audit 规则", () => {
      const cited = new Set<string>();
      for (const row of gateRows) {
        for (const m of row.executor.matchAll(/`audit:([^`]+)`/g))
          cited.add(m[1].trim());
      }
      expect(cited.size).toBeGreaterThanOrEqual(12);
    });
  });

  // ── 铁律 2：色值令牌一致性 ──────────────────────────────────────────────
  describe("铁律 2 · 色值令牌一致性（禁用裸 Hex 注解）", () => {
    const HEX = /#[0-9A-Fa-f]{6}\b/g;
    const TOKEN_REF = /(MATH_COLORS|CANVAS_COLORS)\.([A-Za-z0-9_]+)/g;

    /** 解析 `MATH_COLORS.<key>` / `CANVAS_COLORS.<key>` 的真实取值 */
    const resolveToken = (group: string, key: string): string | undefined => {
      if (group === "MATH_COLORS") {
        return (MATH_COLORS as Record<string, string>)[key];
      }
      // CANVAS_COLORS 已并入 MATH_COLORS 的聚合导出，但保留独立命名空间时的兜底
      return (MATH_COLORS as Record<string, string>)[key];
    };

    it("文档中出现的每个 Hex 都必须由同行令牌解释，且取值严格恒等", () => {
      const offenders: string[] = [];
      lines.forEach((line, idx) => {
        for (const hit of line.matchAll(HEX)) {
          const hex = hit[0];
          const refs = [...line.matchAll(TOKEN_REF)];
          if (refs.length === 0) {
            offenders.push(`L${idx + 1}：裸 Hex ${hex} 未伴随任何颜色令牌名`);
            continue;
          }
          const matched = refs.some(([, group, key]) => {
            const value = resolveToken(group, key);
            return (
              typeof value === "string" &&
              value.toUpperCase() === hex.toUpperCase()
            );
          });
          if (!matched) {
            offenders.push(
              `L${idx + 1}：Hex ${hex} 与同行令牌取值不一致（同行令牌 ${refs
                .map(([, g, k]) => `${g}.${k}=${resolveToken(g, k)}`)
                .join(", ")}）`,
            );
          }
        }
      });
      expect(offenders).toEqual([]);
    });

    it("反面举例不得使用真实色值（应写 #RRGGBB 占位，避免与真实令牌混淆）", () => {
      const banned = "3B82F6";
      const offenders: number[] = [];
      lines.forEach((line, idx) => {
        // 允许「令牌 (取值)」形式的注解，禁止脱离令牌的裸色值再次出现
        if (!line.includes(`#${banned}`)) return;
        if (!/(MATH_COLORS|CANVAS_COLORS)\./.test(line))
          offenders.push(idx + 1);
      });
      expect(offenders).toEqual([]);
    });
  });

  // ── 铁律 3：路径与引用有效性 ────────────────────────────────────────────
  describe("铁律 3 · 路径与引用有效性（消灭死链与幽灵文件）", () => {
    const MARKDOWN_LINK =
      /\]\(file:\/\/\/[a-zA-Z]:\/code\/math\/math-learning\/([^)#\s]+)/g;
    const PATH_CHARSET = /^[A-Za-z0-9_@.\-/]+$/;

    /** 反引号内的路径型 token：去掉执行者前缀后，须带扩展名或以 / 结尾 */
    function pathLikeTokens(line: string): string[] {
      const out: string[] = [];
      for (const m of line.matchAll(/`([^`\n]+)`/g)) {
        const raw = m[1].trim().replace(/^(?:audit|vitest|tsc):/, "");
        if (!PATH_CHARSET.test(raw)) continue;
        if (!raw.includes("/")) continue;
        if (/\.(?:tsx?|mjs|md|json)$/.test(raw) || raw.endsWith("/"))
          out.push(raw);
      }
      return out;
    }

    it("文档内所有 Markdown 链接指向的文件必须存在", () => {
      const offenders: string[] = [];
      lines.forEach((line, idx) => {
        for (const m of line.matchAll(MARKDOWN_LINK)) {
          const rel = m[1];
          if (!existsSync(resolve(ROOT, rel)))
            offenders.push(`L${idx + 1}：死链 ${rel}`);
        }
      });
      expect(offenders).toEqual([]);
    });

    it("文档内所有反引号路径（含 audit/vitest 执行者）必须真实存在", () => {
      const offenders: string[] = [];
      let checked = 0;
      lines.forEach((line, idx) => {
        for (const rel of pathLikeTokens(line)) {
          checked++;
          const abs = resolve(ROOT, rel);
          if (!existsSync(abs)) {
            offenders.push(`L${idx + 1}：幽灵路径 ${rel}`);
            continue;
          }
          // 以 / 结尾者必须是目录；带扩展名者必须是文件
          if (rel.endsWith("/") && !statSync(abs).isDirectory()) {
            offenders.push(`L${idx + 1}：${rel} 声明为目录但实际不是`);
          }
          if (/\.(?:tsx?|mjs|md|json)$/.test(rel) && !statSync(abs).isFile()) {
            offenders.push(`L${idx + 1}：${rel} 声明为文件但实际不是`);
          }
        }
      });
      expect(offenders).toEqual([]);
      // 防"提取器失效导致永远绿灯"
      expect(checked).toBeGreaterThanOrEqual(8);
    });

    it("文档引用的审计规则 ID 必须存在（正文提及的 rule-id 与表格同等校验）", () => {
      const offenders: string[] = [];
      const MENTION =
        /(?:discipline|arch|center|left|right|style)\/[a-z0-9-]+/g;
      lines.forEach((line, idx) => {
        for (const m of line.matchAll(MENTION)) {
          if (!ruleIds.has(m[0]))
            offenders.push(`L${idx + 1}：提及了不存在的规则 ${m[0]}`);
        }
      });
      expect(offenders).toEqual([]);
    });
  });
});
