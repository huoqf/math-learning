/**
 * src/test/pointComponentCoordinate.test.ts
 * 「点组件坐标系」全库静态契约（2026-09-30 新增，2026-10-01 补回第三条规则）
 *
 * 本项目有两个语义**正好相反**的点组件，是全库最隐蔽的坐标系陷阱：
 *   · `MathPoint`       —— `cx/cy` 是**数学坐标**（且必须同时给 `scale`），`x/y` 才是**设计像素**；
 *                          只给 `cx/cy` 而漏 `scale` 会走到 `ptX = ptY = 0`，点被静默画到画布左上角。
 *   · `InteractivePoint` —— `cx/cy` **才是**数学坐标（内部无条件 `mathToDesign(cx, cy, scale)`），
 *                          传已换算过的设计像素 ⇒ **二次变换**，手柄飞到 (10³~10⁴, …) 量级、
 *                          连同光环与命中区一起落到画布外，**整页拖拽实际失效**却看不出"坏了"。
 *
 * 两个真实事故（2026-09-30 实测，均为同一根因）：
 *   1. `line-circle`：6 处 `<MathPoint cx={footDesign.x} …>`（漏 scale）+ 5 处
 *      `<InteractivePoint cx={centerDesign.x|mathToDesign(...).x} …>`（二次变换）⇒ 该页
 *      全部 11 个特征点/手柄位置错误。`corePagesSmoke` 把点组件 mock 成 null，结构上测不出来。
 *   2. 历史上 `vectorBasis` 的 10 处手柄坐标错位（09-19 报告 N2）同理。
 *
 * 本文件用**纯静态扫描**把三条契约钉死（不依赖 `cx/cy` 命名是否带 `Design` 后缀这种运气）：
 *   ① 每个 `<MathPoint>` 必须满足 `(cx & cy & scale)` 或 `(x & y)`；
 *   ② 每个 `<MathPoint>` **一旦传了 `scale`**，就必须用 `cx/cy`，**严禁**把 `x/y` 与 `scale` 混用
 *      （`x/y` 分支会忽略 `scale`，故"设计像素 + scale"= 数学坐标被丢进像素槽，即 P0-1 的写法）；
 *   ③ 每个 `<InteractivePoint>` 必须含 `scale`，且 `cx/cy` 不得是
 *      `mathToDesign(...)` 的直接调用、也不得是 `*Design.*` 这类已换算变量。
 *
 * ⚠ ① 与 ② 是**互补**而非包含关系，缺一不可：
 *   · `<MathPoint cx={..} cy={..} />`（漏 scale）→ 只有 ① 能拦；
 *   · `<MathPoint x={..} y={..} scale={..} />`（即 P0-1）→ ① 误判为"设计坐标合法"而放行，
 *     只有 ② 能拦。
 *
 * ⚠ 这是**结构守卫**，不是行为测试：它只能拦住上述几类已知写法，拦不住"变量名叫 e1 但其实
 *   装的是设计像素"这类改名式错误（见 09-19 N2）。真正的行为覆盖仍需渲染层断言。
 */

import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const FEATURES_DIR = join(process.cwd(), "src", "features");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry.endsWith(".tsx")) out.push(full);
  }
  return out;
}

interface Block {
  file: string;
  line: number;
  body: string;
}

/** 抽取某组件标签的**自闭合**开头块（这些点组件都是 `<X … />`，取到首个 `/>` 即可） */
function collectBlocks(files: string[], tag: string): Block[] {
  const blocks: Block[] = [];
  for (const file of files) {
    const src = readFileSync(file, "utf-8");
    let idx = 0;
    for (;;) {
      const at = src.indexOf(`<${tag}`, idx);
      if (at < 0) break;
      const end = src.indexOf("/>", at);
      blocks.push({
        file: relative(process.cwd(), file),
        line: src.slice(0, at).split("\n").length,
        body: src.slice(at, end < 0 ? src.length : end + 2),
      });
      idx = at + tag.length + 1;
    }
  }
  return blocks;
}

const tsxFiles = walk(FEATURES_DIR);

describe("点组件坐标系静态契约（全库 src/features/**/*.tsx）", () => {
  it("扫描面非空（防止 walk 路径写错导致空跑绿灯）", () => {
    expect(tsxFiles.length).toBeGreaterThan(50);
  });

  it("每个 <MathPoint> 必须给足 (cx & cy & scale)，或改用设计坐标 (x & y)", () => {
    const violations = collectBlocks(tsxFiles, "MathPoint")
      .filter(({ body }) => {
        const mathOk =
          /\bcx=/.test(body) && /\bcy=/.test(body) && /\bscale=/.test(body);
        const designOk = /\bx=/.test(body) && /\by=/.test(body);
        return !(mathOk || designOk);
      })
      .map(
        ({ file, line, body }) =>
          `${file}:${line} —— ${body.split("\n")[0].trim()}（缺 scale 且未给 x/y，点会落到画布左上角 (0,0)）`,
      );

    expect(
      violations,
      "MathPoint 的 cx/cy 需与 scale 同时传入（src/components/Math/MathPoint.tsx:89）；" +
        "若手上已是 mathToDesign 结果，请改传 x/y",
    ).toEqual([]);
  });

  it("每个 <MathPoint> 使用 scale 时必须用 cx/cy，严禁把 x/y 与 scale 混用", () => {
    // x/y 分支会**忽略** scale（MathPoint.tsx:89）。故 "设计像素 + scale" 等价于
    // 把数学坐标灌进像素槽 ⇒ 点塌到画布左上角。这是 P0-1 的确切写法，而规则 ① 拦不住它
    // （① 看到 x/y 就认为"设计坐标合法"）。
    const violations = collectBlocks(tsxFiles, "MathPoint")
      .filter(({ body }) => {
        const hasScale = /\bscale\s*=/.test(body);
        const hasDirectX = /\bx\s*=/.test(body) && !/\bcx\s*=/.test(body);
        const hasDirectY = /\by\s*=/.test(body) && !/\bcy\s*=/.test(body);
        return hasScale && (hasDirectX || hasDirectY);
      })
      .map(
        ({ file, line, body }) =>
          `${file}:${line} —— ${body.split("\n")[0].trim()}（x/y 与 scale 混用，scale 会被忽略）`,
      );

    expect(
      violations,
      "发现 MathPoint 误用 x/y 搭配 scale（应改用 cx/cy 传数学坐标）",
    ).toEqual([]);
  });

  it("每个 <InteractivePoint> 的 cx/cy 必须是数学坐标，不得是 mathToDesign 结果或 *Design 变量", () => {
    const violations = collectBlocks(tsxFiles, "InteractivePoint")
      .map(({ file, line, body }) => {
        const problems: string[] = [];
        if (!/\bscale=/.test(body)) problems.push("缺 scale");
        if (/\bc[xy]=\{mathToDesign\(/.test(body))
          problems.push("cx/cy 直接传 mathToDesign(...) ⇒ 二次变换");
        if (/\bc[xy]=\{[A-Za-z]*Design\./.test(body))
          problems.push("cx/cy 传 *Design 变量 ⇒ 二次变换");
        return problems.length > 0
          ? `${file}:${line} —— ${problems.join("；")}`
          : null;
      })
      .filter((v): v is string => v !== null);

    expect(
      violations,
      "InteractivePoint 的 cx/cy 是数学坐标（src/components/Math/InteractivePoint.tsx:203 会再调 mathToDesign）；" +
        "传设计像素会让手柄飞到画布外，整页拖拽静默失效",
    ).toEqual([]);
  });
});
