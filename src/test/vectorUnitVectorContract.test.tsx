/**
 * src/test/vectorUnitVectorContract.test.tsx
 * 「单位向量化」专题（vectorLinear · 加减与数乘模式）的跨层一致性契约
 *
 * 背景：本轮为该页新增了「单位向量化」典型预设 + 单位圆叠加图层 + 右屏单位向量数学量。
 * 这类"一次改动横跨四层"的增量有一个结构性陷阱——**既有门禁看不见它**：
 *   · corePagesSmoke.test.tsx 只断言页面能挂载、右屏标题存在；
 *   · presetParamsDomainSafety / autoRegistryFuzz 按 animId 的默认 config 驱动，
 *     既不点预设、也不开 showUnitVectors 图层；
 *   · 中屏 Scene 的渲染结果在 jsdom 里没有任何结构性断言。
 * 于是「预设参数把关键点送出可见视口」「图层开了却没画 / 关了还在画」
 * 「看板数值与 math 层脱节」三类缺陷都能在全绿门禁下静默发生。
 *
 * 断言分四组：
 *   ① 数值同源 —— 预设参数 × math 层，单位向量必须严格可算（3-4-5 直角三角形）；
 *   ② 可见视口 —— 预设加载后 a / b / s / e_a / e_b 全部落在中屏可见域内（视口现算）；
 *   ③ 渲染契约 —— showUnitVectors 开关必须真的改变元素树，零向量时不得画出不存在的 e_a；
 *   ④ 源码锁定 —— 注册表 SSOT → Scene prop → Animation 预设的三层接线不得被绕过。
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { mockVp } from "@/test/mocks";

import { calculateSceneScale } from "@/hooks/useSceneScale";
import { CANVAS_PRESETS } from "@/theme";
import { unitVectorPresetParams } from "@/data/registries/vectorLinear";
import { computeVectorLinear } from "@/math/vectorLinear";
import { buildMathQuantities } from "@/data/mathQuantities";
import { VectorLinearScene } from "@/features/vectorLinear/components/VectorLinearScene";

// 与 VectorLinearAnimation 的 useSceneScale({ xRange, yRange }) 保持同一组视口参数
const PAGE_X_RANGE: [number, number] = [-6, 6];
const PAGE_Y_RANGE: [number, number] = [-4.5, 4.5];

/** 可见域现算（不手抄 ±6 / ±4.64 之类的常数，改视口即自动跟随） */
const pageScale = calculateSceneScale({
  designVisibleW: CANVAS_PRESETS.full.width,
  designVisibleH: CANVAS_PRESETS.full.height,
  designLeft: 0,
  designTop: 0,
  xRange: PAGE_X_RANGE,
  yRange: PAGE_Y_RANGE,
});

/* ================================================================== *
 * ① 数值同源：预设参数 × math 层
 * ================================================================== */

describe("① 单位向量化预设与 math 层数值同源", () => {
  const res = computeVectorLinear(unitVectorPresetParams);

  it("a = (3, 4) 的单位向量必须精确为 (0.6, 0.8)，b = (0, −4) 的为 (0, −1)", () => {
    // 推导：|a| = √(3²+4²) = 5 ⇒ e_a = a/|a| = (0.6, 0.8)；这是高考最常用的单位化实例
    expect(res.normA).toBeCloseTo(5);
    expect(res.normB).toBeCloseTo(4);
    expect(res.isUnitADefined && res.isUnitBDefined).toBe(true);
    expect(res.unitA.x).toBeCloseTo(0.6, 10);
    expect(res.unitA.y).toBeCloseTo(0.8, 10);
    expect(res.unitB.x).toBeCloseTo(0, 10);
    expect(res.unitB.y).toBeCloseTo(-1, 10);
    // 单位向量的定义就是模长为 1：任何预设都不得违反
    expect(Math.hypot(res.unitA.x, res.unitA.y)).toBeCloseTo(1, 10);
    expect(Math.hypot(res.unitB.x, res.unitB.y)).toBeCloseTo(1, 10);
  });

  it("还原关系 a = |a|·e_a 成立：单位化只改长度、不改方向", () => {
    expect(res.unitA.x * res.normA).toBeCloseTo(res.a.x, 10);
    expect(res.unitA.y * res.normA).toBeCloseTo(res.a.y, 10);
    expect(res.unitB.x * res.normB).toBeCloseTo(res.b.x, 10);
    expect(res.unitB.y * res.normB).toBeCloseTo(res.b.y, 10);
  });

  it("两单位向量内积恒等于夹角余弦（右屏推导链第 4 步的数学依据）", () => {
    expect(res.unitDotProduct).toBeCloseTo(Math.cos(res.angleRad), 10);
    expect(res.unitDotProduct).toBeCloseTo(
      res.dotProduct / (res.normA * res.normB),
      10,
    );
  });
});

/* ================================================================== *
 * ② 预设 × 可见视口
 * ================================================================== */

describe("② 单位向量化预设的关键点必须全部可见", () => {
  const res = computeVectorLinear(unitVectorPresetParams);

  it("本页视口保持等比（否则单位圆会被画成椭圆，「单位圆」三个字就成了假话）", () => {
    expect(pageScale.scaleX).toBeCloseTo(pageScale.scaleY, 10);
  });

  it("a、b、和向量 s 与两个单位向量的终点都落在可见域内", () => {
    const points: [string, { x: number; y: number }][] = [
      ["a", res.a],
      ["b", res.b],
      ["s = a + b", res.sumVec],
      ["e_a", res.unitA],
      ["e_b", res.unitB],
    ];
    for (const [name, p] of points) {
      expect(p.x, `${name} 的横坐标越出可见视口`).toBeGreaterThanOrEqual(
        pageScale.xMin,
      );
      expect(p.x, `${name} 的横坐标越出可见视口`).toBeLessThanOrEqual(
        pageScale.xMax,
      );
      expect(p.y, `${name} 的纵坐标越出可见视口`).toBeGreaterThanOrEqual(
        pageScale.yMin,
      );
      expect(p.y, `${name} 的纵坐标越出可见视口`).toBeLessThanOrEqual(
        pageScale.yMax,
      );
    }
  });

  it("和向量恰落在横轴上——平行四边形对角线一眼可读", () => {
    expect(res.sumVec.x).toBeCloseTo(3, 10);
    expect(res.sumVec.y).toBeCloseTo(0, 10);
  });
});

/* ================================================================== *
 * ③ 中屏渲染契约
 * ================================================================== */

function renderScene(params: Record<string, number>, showUnitVectors: boolean) {
  const { container } = render(
    <svg>
      <VectorLinearScene
        params={params}
        scale={pageScale}
        vp={mockVp}
        onParamChange={() => {}}
        fontScale={(v) => v}
        studyMode="linearCombo"
        showUnitVectors={showUnitVectors}
      />
    </svg>,
  );
  return container;
}

const textsOf = (container: HTMLElement) =>
  [...container.querySelectorAll("text")].map((n) => n.textContent);

describe("③ 中屏「单位向量化」叠加图层的渲染契约", () => {
  it("开启图层：必须画出单位圆（半径恰为 1 个数学单位）与两个单位向量标签", () => {
    const container = renderScene(unitVectorPresetParams, true);

    const ellipses = container.querySelectorAll("ellipse");
    expect(ellipses).toHaveLength(1);
    // 半径 = 1 个数学单位，必须由比例尺现算，不得硬编码像素
    expect(Number(ellipses[0].getAttribute("rx"))).toBeCloseTo(
      pageScale.scaleX,
      6,
    );
    expect(Number(ellipses[0].getAttribute("ry"))).toBeCloseTo(
      pageScale.scaleY,
      6,
    );

    const texts = textsOf(container);
    expect(texts).toContain("单位圆");
    expect(texts).toContain("e_a");
    expect(texts).toContain("e_b");
  });

  it("关闭图层：单位圆与 e_a / e_b 一律不得出现（默认状态即纯向量图）", () => {
    const container = renderScene(unitVectorPresetParams, false);
    expect(container.querySelectorAll("ellipse")).toHaveLength(0);
    const texts = textsOf(container);
    expect(texts).not.toContain("单位圆");
    expect(texts).not.toContain("e_a");
    expect(texts).not.toContain("e_b");
  });

  it("零向量不得画出单位向量（e_a 无定义；e_b 仍须成立，两个判据相互独立）", () => {
    const container = renderScene(
      { ...unitVectorPresetParams, xa: 0, ya: 0 },
      true,
    );
    const texts = textsOf(container);
    expect(texts).not.toContain("e_a");
    expect(texts).toContain("e_b");
  });
});

/* ================================================================== *
 * ④ 源码锁定：注册表 SSOT → Scene prop → Animation 预设
 * ================================================================== */

const readSource = (relPath: string) =>
  readFileSync(resolve(process.cwd(), relPath), "utf8");

describe("④ 三层接线与右屏看板的源码锁定", () => {
  it("Scene 消费 showUnitVectors，且单位圆半径与圆心取自比例尺", () => {
    const code = readSource(
      "src/features/vectorLinear/components/VectorLinearScene.tsx",
    );
    expect(code).toContain("showUnitVectors?: boolean");
    expect(code).toContain("showUnitVectors &&");
    expect(code).toMatch(/rx=\{scale\.scaleX\}/);
    expect(code).toMatch(/ry=\{scale\.scaleY\}/);
    expect(code).toMatch(/cx=\{originDesign\.x\}/);
    expect(code).toMatch(/cy=\{originDesign\.y\}/);
  });

  it("Animation 必须把图层开关透传给 Scene，且与预设 key 严格绑定", () => {
    const code = readSource(
      "src/features/vectorLinear/VectorLinearAnimation.tsx",
    );
    expect(code).toContain('key: "unit-vector"');
    expect(code).toContain("showUnitVectors={showUnitVectors}");
    expect(code).toContain('setShowUnitVectors(preset === "unit-vector")');
    // 拖拽动点时不得关掉图层（否则学生一动 a，正要观察的单位圆就消失了）
    expect(code).toContain('presetKey !== "unit-vector"');
    // 预设参数必须取自 registry SSOT，不得内联字面量
    expect(code).toContain("unitVectorPresetParams");
  });

  it("右屏看板：加减与数乘模式必须产出单位向量数学量 + 单位化定理 + 4 步推导链", () => {
    const data = buildMathQuantities(
      "anim-vector-linear",
      { ...unitVectorPresetParams },
      { studyMode: "linearCombo", lockCollinear: false },
    );

    // 数学量：e_a / e_b 必须存在，且数值与 math 层同源（不得各算一份）
    const unitRows = data.quantities.filter((q) =>
      q.label.includes("单位向量"),
    );
    expect(unitRows).toHaveLength(2);
    const rowA = data.quantities.find((q) => q.symbol?.includes("\\vec{e}_a"));
    const rowB = data.quantities.find((q) => q.symbol?.includes("\\vec{e}_b"));
    expect(rowA).toBeDefined();
    expect(rowB).toBeDefined();
    expect(String(rowA?.value)).toBe("(0.60, 0.80)");
    expect(String(rowB?.value)).toBe("(0.00, -1.00)");

    // 定理：单位化属课标内（必修二 6.2.3），不得被标成拓展
    const theorem = data.theorems.find((t) => t.name.includes("单位向量"));
    expect(theorem).toBeDefined();
    expect(theorem?.isExtension).toBeFalsy();

    // 推导链：步号必须 1..4 连续，末步是单位化收口
    const steps = data.reasoningSteps ?? [];
    expect(steps.map((s) => s.step)).toEqual([1, 2, 3, 4]);
    expect(steps[3].title).toContain("单位化收口");
    for (const s of steps) {
      expect(s.latex ?? "").not.toContain("NaN");
      expect(s.detail ?? "").not.toContain("undefined");
    }
  });

  it("零向量下看板必须显式给出「无定义」而非假的单位向量坐标", () => {
    const data = buildMathQuantities(
      "anim-vector-linear",
      { ...unitVectorPresetParams, xa: 0, ya: 0 },
      { studyMode: "linearCombo", lockCollinear: false },
    );
    const rowA = data.quantities.find((q) => q.symbol?.includes("\\vec{e}_a"));
    expect(String(rowA?.value)).toContain("无定义");
    expect(
      data.warnings.some((w) => w.text.includes("不可单位化")),
      "零向量时右屏必须警示「不可单位化」",
    ).toBe(true);
  });
});
