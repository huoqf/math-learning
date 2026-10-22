import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * rubric 采分点前缀统一门禁（报告 §11.5 债务 #5）。
 *
 * ── 改前的乱象 ──
 * 同一条「采分点」链路上并存五套写法：`采分点：` 314 处、`【高考采分点】` 125 处、
 * `[高考采分点]` 122 处、`要点：` 18 处、`得分点：` 15 处，另有 230 处干脆没有前缀。
 * 跨页复习时分步卡失去统一的扫描锚点——学生在 A 页学会搜「高考采分点」，
 * 到 B 页就搜不到。这不是排版美观问题，是「同一个概念有五个名字」。
 *
 * ── 定案口径 ──
 * 一律 `【高考采分点】`（全角方括号，中文语境下与正文最协调；且原有 125 处已是此形）。
 * 前缀与内容之间不加空格。分值仍留在句内（`（3 分）` / `(+2 分)` / `得 2 分`），
 * 因为那是自然语言的一部分，强行抽成结构化字段会让「得 3 分」这类句子读不通。
 *
 * ── 三种合法形态 ──
 * 1. 字符串字面量以 `【高考采分点】` 开头；
 * 2. `ballRubric(...)` 调用——前缀由其内部统一生成（见 solidBallPaperRef.ts）；
 * 3. 三元表达式——两个分支各自以 `【高考采分点】` 开头。
 */

const BUILDERS_DIR = resolve(process.cwd(), "src/data/builders");
const PREFIX = "【高考采分点】";
const LEGACY_PREFIXES = ["[高考采分点]", "采分点：", "得分点：", "要点："];

const builderFiles = readdirSync(BUILDERS_DIR)
  .filter((f) => f.endsWith(".ts"))
  .sort();

interface RubricSite {
  file: string;
  line: number;
  /** rubric: 之后的原始文本（可能跨到下一行） */
  body: string;
}

function collectRubricSites(): RubricSite[] {
  const sites: RubricSite[] = [];
  for (const file of builderFiles) {
    const lines = readFileSync(resolve(BUILDERS_DIR, file), "utf-8").split(
      "\n",
    );
    lines.forEach((ln, i) => {
      if (!ln.includes("rubric:")) return;
      const after = ln.slice(ln.indexOf("rubric:") + "rubric:".length);
      const body = after.trim() ? after : (lines[i + 1] ?? "");
      sites.push({ file, line: i + 1, body });
    });
  }
  return sites;
}

const sites = collectRubricSites();

describe("rubric 前缀统一为 【高考采分点】", () => {
  it("全库 rubric 字段规模足以支撑结论（防止扫描逻辑失效后空跑变绿）", () => {
    expect(sites.length).toBeGreaterThanOrEqual(800);
  });

  it("旧前缀（[高考采分点] / 采分点： / 得分点： / 要点：）不得再作为 rubric 开头", () => {
    const offenders = sites
      .filter((s) => {
        const body = s.body
          .trim()
          .replace(/^["'`]/, "")
          .trim();
        return LEGACY_PREFIXES.some((p) => body.startsWith(p));
      })
      .map((s) => `${s.file}:${s.line} ${s.body.trim().slice(0, 60)}`);
    expect(offenders).toEqual([]);
  });

  it("字符串字面量形态的 rubric 必须带统一前缀（无前缀者不得蒙混过关）", () => {
    const offenders: string[] = [];
    for (const s of sites) {
      const raw = s.body.trim();
      // 非字面量形态交给下一条用例判定
      if (!/^["'`]/.test(raw)) continue;
      const inner = raw.replace(/^["'`]/, "");
      if (!inner.startsWith(PREFIX)) {
        offenders.push(`${s.file}:${s.line} ${inner.slice(0, 60)}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("非字面量形态只允许 ballRubric 调用与三元表达式，且三元各分支都带前缀", () => {
    const allowed = sites.filter((s) => !/^["'`]/.test(s.body.trim()));
    const unexpected = allowed
      .filter(
        (s) =>
          !/^\s*ballRubric\(/.test(s.body) &&
          !/^\s*[A-Za-z_$][\w$.]*\s*$/.test(s.body.trim()),
      )
      .map((s) => `${s.file}:${s.line} ${s.body.trim().slice(0, 70)}`);
    expect(unexpected).toEqual([]);

    // 三元表达式：其分支字符串同样要带前缀
    const ternaryFiles = ["conicHomogenization.ts", "constantSingle.ts"];
    for (const file of ternaryFiles) {
      const src = readFileSync(resolve(BUILDERS_DIR, file), "utf-8");
      const branches = src.match(/rubric:\s*\w+\s*\n\s*\?\s*"([^"]*)"/g) ?? [];
      expect(branches.length, `${file} 未找到三元 rubric 分支`).toBeGreaterThan(
        0,
      );
      branches.forEach((b) => {
        expect(b, `${file} 的三元分支漏了前缀：${b}`).toContain(PREFIX);
      });
    }
  });

  it("前缀后不跟空格（保持 `【高考采分点】正确写出…` 的紧凑排版）", () => {
    const offenders = sites
      .filter((s) => s.body.includes(`${PREFIX} `))
      .map((s) => `${s.file}:${s.line}`);
    expect(offenders).toEqual([]);
  });
});

describe("ballRubric 是「球」类两页的唯一前缀来源", () => {
  it("ballRubric 内部生成的前缀与全库口径一致", async () => {
    const { getBallPaperRef, ballRubric } =
      await import("@/data/builders/solidBallPaperRef");
    const ref = getBallPaperRef("circum:cuboid");
    const text = ballRubric(ref, 0, "写出体对角线公式");
    expect(text.startsWith(PREFIX)).toBe(true);
    expect(text).toContain("(+2分)");
  });

  it("调用处不得自己在 what 参数里再写一遍前缀（会造成双前缀）", () => {
    for (const file of ["solidCircumSphere.ts", "solidPolyhedronSphere.ts"]) {
      const src = readFileSync(resolve(BUILDERS_DIR, file), "utf-8");
      const doubled = src.match(/ballRubric\([^)]*"【高考采分点】/g) ?? [];
      expect(doubled, `${file} 出现双前缀调用`).toEqual([]);
    }
  });
});
