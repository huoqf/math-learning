import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildSolidFoldingPanel } from "@/data/builders/solidFolding";

/**
 * solid-folding 术语与符号口径门禁（报告 §11.5 债务 #7）。
 *
 * ── 改前的真问题 ──
 * 中屏题干写「…翻折，**二面角为 α**」，右屏看板却写「翻折旋转角 α / 空间二面角 β = 180° − α」。
 * 同一个符号 α 在中屏是二面角、在右屏是旋转角，两处定义**相反**：
 * 学生看到中屏「二面角为 120°」、右屏「β = 60°」，无从判断该信哪个。
 *
 * ── 定案口径 ──
 * α = 翻折旋转角（绕折痕的旋转偏角），β = 两半平面所成二面角的平面角，β = 180° − α。
 * 依据：α = 0 时两半平面共面成平角 ⇒ β = 180°；α = 90° 时两者同值，故「α = 90° ⇒ 面面垂直」
 * 在两种口径下都成立，不影响原有设问。全库 α 只保留这一个定义。
 *
 * 附带澄清：法向量 n₁=(0,0,1)、n₂=(−sin α,0,cos α) 的点积即 cos α ⇒ **法向量夹角恒等于 α 而非 β**，
 * 这正是「用 |cos〈n₁,n₂〉| 求二面角要按图补负号」的代数根据。
 */

const MODELS = [
  "trapezoid",
  "rectangleDiagonal",
  "triangleAltitude",
  "rhombus",
] as const;
/** α 取 120°：与 β = 60° 不同值，任何混用都会被抓出来 */
const ALPHA = 120;
const BETA = 180 - ALPHA;

const panel = (model: string) =>
  buildSolidFoldingPanel({ a: 4, b: 3, h: 3, alphaDeg: ALPHA }, { model });

const readSrc = (rel: string) =>
  readFileSync(resolve(process.cwd(), rel), "utf-8");

describe("α / β 符号口径", () => {
  it.each(MODELS.map((m) => [m, m] as const))(
    "%s：凡 α 读数一律称「翻折」，不得称「二面角」",
    (model) => {
      const qs = panel(model).quantities.filter((q) =>
        (q.symbol ?? "").includes("alpha"),
      );
      expect(qs.length, `${model} 缺翻折角 α 读数`).toBeGreaterThan(0);
      qs.forEach((q) => {
        expect(q.label, `α 读数标签混用二面角：${q.label}`).toContain("翻折");
        expect(q.label, `α 读数标签混用二面角：${q.label}`).not.toContain(
          "二面角",
        );
        expect(q.value, `${model} 的 α 读数不再是滑块值`).toBe(`${ALPHA}°`);
      });
    },
  );

  it.each(["trapezoid", "triangleAltitude", "rhombus"] as const)(
    "%s：β 读数必须是 180° − α，不能等于 α",
    (model) => {
      const beta = panel(model).quantities.find((q) =>
        (q.symbol ?? "").includes("beta"),
      );
      expect(beta, `${model} 缺二面角 β 读数`).toBeDefined();
      expect(beta!.label).toContain("二面角");
      expect(beta!.value).toBe(`${BETA}°`);
      expect(beta!.value, `${model} 把 β 写成了 α`).not.toBe(`${ALPHA}°`);
    },
  );
});

describe("法向量夹角不得冒充二面角", () => {
  it("trapezoid 的法向量夹角读数需点明它等于 α、不等于 β", () => {
    const q = panel("trapezoid").quantities.find((x) =>
      (x.symbol ?? "").includes("langle"),
    );
    expect(q, "缺法向量夹角读数").toBeDefined();
    // 值确实等于 α（n₁·n₂ = cos α），但标签必须交代清楚，否则会被当成二面角
    expect(q!.value).toBe(`${ALPHA}°`);
    expect(q!.label).toContain("非 β");
  });

  it("定理必须给出「法向量夹角 = α」的点积推导，而不只是一句 β = 180° − α", () => {
    const theorem = panel("trapezoid").theorems.find((t) =>
      t.name.includes("二面角平面角与翻折角"),
    );
    expect(theorem).toBeTruthy();
    const note = theorem!.note ?? "";
    expect(note).toContain("点积");
    expect(note).toContain("恒等于 α 而非 β");
    expect(note, "缺负号提醒").toContain("取负号");
  });
});

describe("反回归：这些旧写法不许回来", () => {
  it("右屏 builder 不得再出现「翻折二面角」这个自相矛盾的名称", () => {
    const src = readSrc("src/data/builders/solidFolding.ts");
    expect(src).not.toContain("翻折二面角");
    expect(src).not.toContain("面面法向量夹角");
  });

  it("中屏题干不得再把 α 直接定义成二面角", () => {
    const src = readSrc("src/features/solidGeometry/FoldingAnimation.tsx");
    expect(src, "题干又把 α 定义成二面角了").not.toContain("二面角为 α");
    // 四个模型的设问都必须交代 β 与 α 的互补关系
    const matches = src.match(/翻折旋转角为 α（对应二面角/g) ?? [];
    expect(matches).toHaveLength(4);
    // 菱形原写「二面角 α 与 … 的等价性」，在 α = 旋转角口径下不成立
    expect(src).not.toContain("与空间二面角 A'-BD-C 的等价性");
    expect(src).toContain("互补关系 β = 180°−α");
  });
});
