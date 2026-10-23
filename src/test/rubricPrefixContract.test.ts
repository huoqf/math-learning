import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { relative, resolve, sep } from "node:path";

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
 *
 * ── 2026-10-23 补漏：扫描必须递归子目录 ──
 * 原实现用 `readdirSync(BUILDERS_DIR)` 只扫顶层 80 个文件，`tangentScaling/` 下的
 * 4 个 builder（baseModel / paramKModel / secantModel / sandwichModel）从来没被扫过，
 * 于是 42 处 `rubric: "采分点：…（3分）"` 躺在门禁眼皮底下全绿通过。
 * 一门只认 827 个站点、实际有 869 个，等于「门禁在记录一个错误的事实」。
 * 现在改为递归，并让报错信息带相对路径（`tangentScaling/baseModel.ts:22`）。
 */

const BUILDERS_DIR = resolve(process.cwd(), "src/data/builders");
const PREFIX = "【高考采分点】";
const LEGACY_PREFIXES = ["[高考采分点]", "采分点：", "得分点：", "要点："];

/** 递归收集 builder 源文件（跳过 __tests__ 与 *.test.ts），返回相对路径 */
function collectBuilderFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__") continue;
      out.push(...collectBuilderFiles(full));
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      out.push(relative(BUILDERS_DIR, full).split(sep).join("/"));
    }
  }
  return out.sort();
}

const builderFiles = collectBuilderFiles(BUILDERS_DIR);

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
    // 2026-10-23 实测：顶层 827 + 子目录 42 = 869。低于此数说明扫描又漏了目录
    expect(sites.length).toBeGreaterThanOrEqual(860);
  });

  it("子目录 builder 必须在扫描范围内（回归：曾漏扫 tangentScaling/ 导致 42 处旧前缀漏网）", () => {
    const subDirFiles = builderFiles.filter((f) => f.includes("/"));
    expect(subDirFiles.length).toBeGreaterThanOrEqual(4);
    expect(subDirFiles).toContain("tangentScaling/baseModel.ts");
    expect(subDirFiles).toContain("tangentScaling/paramKModel.ts");
    expect(subDirFiles).toContain("tangentScaling/secantModel.ts");
    expect(subDirFiles).toContain("tangentScaling/sandwichModel.ts");
    // 子目录里的 rubric 必须真的被采集到
    expect(sites.filter((s) => s.file.includes("/")).length).toBeGreaterThan(0);
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

/**
 * 空壳 rubric 门禁（2026-10-23 补漏）。
 *
 * 前缀统一只解决了「能不能搜到」，没解决「搜到之后有没有内容」。实测有 90 处
 * 形如 `rubric: "【高考采分点】计算弦心距"` 的空壳：只有动作名，没有分值，也没有
 * 得分依据。学生拿它对照答题卡时，既不知道这一步值几分，也不知道写到什么程度才算
 * 拿到——比没有 rubric 更误导，因为它看上去是完整的。
 *
 * ── 合法分值形态（四套并存，都只要求「数字紧跟分字」）──
 * 1. `得 2 分`            —— 本轮 90 处统一采用；
 * 2. `（3分）`            —— tangentScaling/ 子目录；
 * 3. `(3分)` / `(采分点 +4分)` —— conicParam / constantSingle / derivativeShift；
 * 4. `【审题定法 · 2分】`  —— sequence.ts 的步骤内嵌式；
 * 5. 模板插值 `得 ${MARKOV_STEP_SCORES[0]} 分` —— probabilityMarkov 的分值表集中维护。
 *
 * 不强行统一成一种写法：那属于排版口径问题，与本门禁要防的「无分值」是两回事。
 */
describe("rubric 必须携带可见分值（防止空壳复发）", () => {
  /** 五套形态的公共内核：数字紧跟「分」，或模板插值紧跟「分」 */
  const SCORE = /\d+\s*分|\$\{[^}]*\}\s*分/;

  it("字符串字面量形态的 rubric 全部含分值", () => {
    const offenders: string[] = [];
    let literal = 0;
    for (const s of sites) {
      const raw = s.body.trim();
      if (!/^["'`]/.test(raw)) continue;
      const inner = raw.replace(/^["'`]/, "");
      if (!inner.startsWith(PREFIX)) continue;
      literal++;
      if (!SCORE.test(inner)) {
        offenders.push(`${s.file}:${s.line} ${inner.slice(0, 70)}`);
      }
    }
    expect(offenders).toEqual([]);
    // 2026-10-23 实测 818 处；低于此数说明采集口径又漏了目录
    expect(literal).toBeGreaterThanOrEqual(810);
  });

  it("ballRubric 生成的分值不由调用方重复书写", async () => {
    const { getBallPaperRef, ballRubric } =
      await import("@/data/builders/solidBallPaperRef");
    const text = ballRubric(
      getBallPaperRef("circum:cuboid"),
      0,
      "写出体对角线公式",
    );
    // 分值由 ballRubric 内部拼装，what 参数里再写一遍会造成「(+2分) (+2分)」
    expect(text.match(/\+\d+分/g)).toHaveLength(1);
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
