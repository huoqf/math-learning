import { describe, it, expect } from "vitest";
import { buildSphereDerivationPanel } from "../solidSphereDerivation";
import { calculateSphereMicroPyramids } from "@/math3d/sphereDerivation";

const R = 2;
const BASE = { radius: R, heightCut: 1, subdivisions: 16 };
/** 模式经第二个参数 `config` 传入（与页面调用一致，无需把字符串塞进数值映射） */
const zuxuan = (overrides: Partial<typeof BASE> = {}) =>
  buildSphereDerivationPanel({ ...BASE, ...overrides }, { mode: "zuxuan" });
const micro = (overrides: Partial<typeof BASE> = {}) =>
  buildSphereDerivationPanel(
    { ...BASE, ...overrides },
    { mode: "micropyramid" },
  );

const textOf = (data: ReturnType<typeof buildSphereDerivationPanel>) =>
  [
    ...data.quantities.map((q) => `${q.label} ${q.symbol ?? ""} ${q.value}`),
    ...data.theorems.map((t) => `${t.name} ${t.latex} ${t.note ?? ""}`),
    ...data.gaokaoPoints.map((g) => g.text),
    ...data.warnings.map((w) => w.text),
    ...(data.reasoningSteps ?? []).map((s) => `${s.title} ${s.detail}`),
  ].join("\n");

describe("buildSphereDerivationPanel 单元测试", () => {
  it("祖暅档：使用默认参数能构建完整右屏看板数据", () => {
    const data = zuxuan();
    expect(data.quantities.length).toBeGreaterThan(0);
    expect(data.theorems.length).toBeGreaterThan(0);
    expect(data.gaokaoPoints.length).toBeGreaterThan(0);
    expect(data.reasoningSteps?.length).toBe(3);
  });

  it("祖暅档：体积相减各量数值自洽（V挖 = V柱 − V锥 = V半球，V球 = 2V半球）", () => {
    const data = zuxuan();
    const pick = (symbol: string) =>
      Number(data.quantities.find((q) => q.symbol === symbol)?.value);
    const cylinder = pick("V_{\\text{柱}}");
    const cone = pick("V_{\\text{锥}}");
    const hollow = pick("V_{\\text{挖}}");
    const hemisphere = pick("V_{\\text{半球}}");
    const sphere = pick("V_{\\text{球}}");

    expect(cylinder - cone).toBeCloseTo(hollow, 1);
    expect(hollow).toBeCloseTo(hemisphere, 1);
    expect(sphere).toBeCloseTo(2 * hemisphere, 1);
    expect(sphere).toBeCloseTo((4 / 3) * Math.PI * R ** 3, 1);
  });

  it("祖暅档：h = R 与 h = 0 的退化情形各自给出预警/提示", () => {
    expect(zuxuan({ heightCut: R }).warnings.length).toBeGreaterThan(0);
    expect(
      zuxuan({ heightCut: 0 }).warnings.some((w) => w.level === "info"),
    ).toBe(true);
  });

  it("微锥档：相对误差率只保留一个动态读数，不得再塞回静态阶梯", () => {
    const data = micro();
    const deltaCards = data.quantities.filter((q) =>
      (q.symbol ?? "").includes("\\delta"),
    );

    // 该读数由左屏「球面网格细分密度」滑块连续驱动 ⇒ 唯一的 δ 卡片
    expect(deltaCards).toHaveLength(1);
    expect(deltaCards[0].label).toContain("当前细分");
    // 与纯数学层实算一致，不允许另立口径
    expect(deltaCards[0].value).toBe(
      `${(calculateSphereMicroPyramids(R, BASE.subdivisions).surfaceAreaError * 100).toFixed(2)}%`,
    );

    // 反回归：δ(8)/δ(16)/δ(32) 这类"固定档位"曾把连续探究降格成静态数据表，
    // 并挤占采样微锥 ΔS / ΔV 的展示位 ⇒ 任何带参数的 δ(数字) 读数都不允许存在。
    expect(
      data.quantities.some(
        (q) => /\d/.test(q.symbol ?? "") && (q.symbol ?? "").includes("delta"),
      ),
      `右屏又出现静态误差档位：${deltaCards.map((q) => q.symbol ?? "").join(" / ")}`,
    ).toBe(false);
  });

  it("微锥档：取极限结论以课标内定理给出，不得出现大学渐近记号", () => {
    const data = micro();
    const theorem = data.theorems.find((t) => t.name.includes("取极限"));
    expect(theorem).toBeTruthy();
    // 定理名不得含超纲词「微元」（该词已在 audit 超纲词表内）
    expect(theorem?.name).not.toContain("微元");
    expect(theorem?.latex).toContain("\\to");
    expect(theorem?.note).toContain("分割");
    expect(theorem?.note).toContain("取极限");

    // 大 O 渐近记号与「收敛阶 / 二阶收敛」属大学内容，不得出现在右屏任何文本里。
    // 注：audit 超纲词表只覆盖"收敛阶 / 二阶收敛"等词，符号记法本身要由本用例兜住。
    const allLatex = data.theorems.map((t) => t.latex).join("\n");
    expect(allLatex).not.toContain("O\\!\\left");
    expect(allLatex).not.toMatch(/=\s*O\s*\(/);
    expect(textOf(data)).not.toMatch(/收敛阶|二阶收敛|三阶收敛|渐近记号/);
  });

  it("反回归：右屏文本不得出现裸 ASCII 下划线（P1-3），且不含 NaN / undefined", () => {
    for (const data of [zuxuan(), micro()]) {
      data.quantities.forEach((q) => {
        // label / value 走纯文本或 `$...$` 混排通道，`_` 不会被解析成下标
        expect(q.label, `label 含裸下划线：${q.label}`).not.toMatch(
          /[A-Za-z0-9]_/,
        );
        expect(q.value, `value 含裸下划线：${q.value}`).not.toMatch(
          /[A-Za-z0-9]_/,
        );
      });
      expect(textOf(data)).not.toContain("NaN");
      expect(textOf(data)).not.toContain("undefined");
    }
  });
});
