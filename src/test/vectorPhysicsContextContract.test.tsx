/**
 * src/test/vectorPhysicsContextContract.test.tsx
 * 「实际背景」专题（vectorLinear · 必修二 6.4.2 向量在物理中的应用）的跨层一致性契约
 *
 * 背景：本轮为「加减与数乘」模式新增了三个物理情景预设
 * （力的合成 / 三力平衡 / 速度的合成），并与「单位向量化」同样是**一次改动横跨四层**：
 *   registry（VECTOR_PHYSICS_PRESETS + model 文案 + 类型守卫）
 *   → math（closingVec）
 *   → builder（physics 分支的数学量 / 定理 / 考点 / 推导链 / 口诀）
 *   → Scene（标签替换 + 闭合三角形第三边）
 *   → Animation（预设项、physicsContext 派生、顶部公式、看板标题、TipCard）。
 *
 * 与「单位向量化」同源的覆盖陷阱：
 *   · corePagesSmoke 把 @/components/Math 整包 mock，看不见 Scene 内部；
 *   · presetParamsDomainSafety / autoRegistryFuzz 按默认 config 驱动，既点不到预设、
 *     也不会传 physicsContext，因此物理分支在这两套守卫里**一次都不会被执行**；
 *   · Scene 的渲染结果在 jsdom 里没有结构性断言。
 *   于是「三情景预设把关键点送出视口」「F₃ 与合力箭头重合抢标签」
 *   「左屏选了力的合成、中屏还写着 a + b」这类缺陷都能在全绿门禁下静默发生。
 *
 * 断言分五组：
 *   ① 数值同源 —— 三情景预设 × math 层（合力 / 实际速度恰为整数 5；闭合向量严格抵消）；
 *   ② 可见视口 —— 每个情景的关键点都落在中屏可见域内（视口现算，不手抄常数）；
 *   ③ 渲染契约 —— jsdom 里逐情景核对画布标签，物理层不得泄漏到数学情景、反之亦然；
 *   ④ 右屏看板 —— builder 的物理分支必须真的按 physicsContext 分化；
 *   ⑤ 源码锁定 —— registry SSOT → builder → Scene prop → Animation 的四层接线不得被绕过。
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { mockVp } from "@/test/mocks";

import { calculateSceneScale } from "@/hooks/useSceneScale";
import { CANVAS_PRESETS } from "@/theme";
import {
  defaultParams,
  VECTOR_PHYSICS_PRESETS,
  VECTOR_PHYSICS_PRESET_KEYS,
  resolveVectorPhysicsContext,
  isVectorPhysicsContext,
  type VectorPhysicsContext,
} from "@/data/registries/vectorLinear";
import { computeVectorLinear } from "@/math/vectorLinear";
import { buildMathQuantities } from "@/data/mathQuantities";
import { VectorLinearScene } from "@/features/vectorLinear/components/VectorLinearScene";

// 与 VectorLinearAnimation 的 useSceneScale({ xRange, yRange }) 保持同一组视口参数
const PAGE_X_RANGE: [number, number] = [-6, 6];
const PAGE_Y_RANGE: [number, number] = [-4.5, 4.5];

/** 可见域现算（改视口即自动跟随，不手抄 ±6 / ±4.64 之类的常数） */
const pageScale = calculateSceneScale({
  designVisibleW: CANVAS_PRESETS.full.width,
  designVisibleH: CANVAS_PRESETS.full.height,
  designLeft: 0,
  designTop: 0,
  xRange: PAGE_X_RANGE,
  yRange: PAGE_Y_RANGE,
});

/* ================================================================== *
 * ① 数值同源：三情景预设 × math 层
 * ================================================================== */

describe("① 物理三情景的数值口径与 math 层同源", () => {
  it("力的合成：4 与 3 互相垂直 ⇒ 合力必为整数 5", () => {
    const res = computeVectorLinear(
      VECTOR_PHYSICS_PRESETS["force-resultant"].params,
    );
    expect(res.normA).toBeCloseTo(4, 10);
    expect(res.normB).toBeCloseTo(3, 10);
    expect(res.sumVec.x).toBeCloseTo(4, 10);
    expect(res.sumVec.y).toBeCloseTo(3, 10);
    expect(res.normSum).toBeCloseTo(5, 10);
    // 两力不共线：闭合三角形才成立，退化文案不得被触发
    expect(res.isCollinearAB).toBe(false);
  });

  it("速度的合成：船速 4 与水流 3 互相垂直 ⇒ 实际速度必为整数 5", () => {
    const res = computeVectorLinear(
      VECTOR_PHYSICS_PRESETS["velocity-compose"].params,
    );
    expect(res.normA).toBeCloseTo(3, 10);
    expect(res.normB).toBeCloseTo(4, 10);
    expect(res.sumVec.x).toBeCloseTo(3, 10);
    expect(res.sumVec.y).toBeCloseTo(4, 10);
    expect(res.normSum).toBeCloseTo(5, 10);
    expect(res.isCollinearAB).toBe(false);
  });

  it("三力平衡：闭合向量 = −(λa + μb)，三力首尾相接必回到起点", () => {
    const res = computeVectorLinear(
      VECTOR_PHYSICS_PRESETS["force-balance"].params,
    );
    expect(res.sumVec.x).toBeCloseTo(4, 10);
    expect(res.sumVec.y).toBeCloseTo(0, 10);
    expect(res.closingVec.x).toBeCloseTo(-4, 10);
    expect(res.closingVec.y).toBeCloseTo(0, 10);
    // 首尾相接的代数表达：λa + μb + closingVec = 0
    expect(res.sumVec.x + res.closingVec.x).toBeCloseTo(0, 10);
    expect(res.sumVec.y + res.closingVec.y).toBeCloseTo(0, 10);
    // 平衡力与合力等大反向
    expect(Math.hypot(res.closingVec.x, res.closingVec.y)).toBeCloseTo(
      res.normSum,
      10,
    );
    // 闭合三角形恰为 3-4-5 直角三角形：F₁ 的模 5、F₂ 的模 3、合力与 F₃ 的模 4
    expect(res.normA).toBeCloseTo(5, 10);
    expect(res.normB).toBeCloseTo(3, 10);
    expect(res.normSum).toBeCloseTo(4, 10);
  });

  it("三情景一律把 λ、μ 钉在 1（物理上没有「力的倍数」这一说）", () => {
    for (const key of VECTOR_PHYSICS_PRESET_KEYS) {
      const p = VECTOR_PHYSICS_PRESETS[key].params;
      expect(p.lambda, `${key} 的 λ 必须为 1`).toBe(1);
      expect(p.mu, `${key} 的 μ 必须为 1`).toBe(1);
    }
  });

  it("physicsContext 只在「加减与数乘」模式下成立（模式二/三的 a、b 不是力或速度）", () => {
    expect(resolveVectorPhysicsContext("linearCombo", "force-balance")).toBe(
      "force-balance",
    );
    expect(
      resolveVectorPhysicsContext("collinear", "force-balance"),
    ).toBeNull();
    expect(resolveVectorPhysicsContext("basis", "velocity-compose")).toBeNull();
    expect(resolveVectorPhysicsContext("linearCombo", "free")).toBeNull();
    // 类型守卫与解析函数必须同源：守卫为真才可能被解析出来
    for (const key of VECTOR_PHYSICS_PRESET_KEYS) {
      expect(isVectorPhysicsContext(key)).toBe(true);
    }
    expect(isVectorPhysicsContext("unit-vector")).toBe(false);
  });
});

/* ================================================================== *
 * ② 预设 × 可见视口
 * ================================================================== */

describe("② 三个物理情景的关键点必须全部可见", () => {
  it("本页视口保持等比（合力与分力同尺度，学生才能直接比长短）", () => {
    expect(pageScale.scaleX).toBeCloseTo(pageScale.scaleY, 10);
  });

  it("每个情景的 a / b / 合成结果端点都落在可见域内", () => {
    for (const key of VECTOR_PHYSICS_PRESET_KEYS) {
      const res = computeVectorLinear(VECTOR_PHYSICS_PRESETS[key].params);
      const points: [string, { x: number; y: number }][] = [
        ["第一向量终点", res.a],
        ["第二向量终点", res.b],
        ["合成结果终点", res.sumVec],
        // 平衡力的起点是合成结果终点、终点是原点，故原点也必须可见
        ["原点 O", { x: 0, y: 0 }],
      ];
      for (const [name, p] of points) {
        const where = `${key} · ${name}`;
        expect(p.x, `${where} 的横坐标越出可见视口`).toBeGreaterThanOrEqual(
          pageScale.xMin,
        );
        expect(p.x, `${where} 的横坐标越出可见视口`).toBeLessThanOrEqual(
          pageScale.xMax,
        );
        expect(p.y, `${where} 的纵坐标越出可见视口`).toBeGreaterThanOrEqual(
          pageScale.yMin,
        );
        expect(p.y, `${where} 的纵坐标越出可见视口`).toBeLessThanOrEqual(
          pageScale.yMax,
        );
      }
    }
  });
});

/* ================================================================== *
 * ③ 中屏渲染契约
 * ================================================================== */

function renderScene(
  params: Record<string, number>,
  physicsContext: VectorPhysicsContext | null,
  studyMode: "linearCombo" | "collinear" | "basis" = "linearCombo",
) {
  const { container } = render(
    <svg>
      <VectorLinearScene
        params={params}
        scale={pageScale}
        vp={mockVp}
        onParamChange={() => {}}
        fontScale={(v) => v}
        studyMode={studyMode}
        physicsContext={physicsContext}
      />
    </svg>,
  );
  return container;
}

const textsOf = (container: HTMLElement) =>
  [...container.querySelectorAll("text")].map((n) => n.textContent);

describe("③ 物理情景的中屏标签契约", () => {
  it("力的合成：三支箭头换成 F₁ / F₂ / F，且不再出现数学记号 a - b", () => {
    const texts = textsOf(
      renderScene(
        VECTOR_PHYSICS_PRESETS["force-resultant"].params,
        "force-resultant",
      ),
    );
    expect(texts).toContain("F₁");
    expect(texts).toContain("F₂");
    expect(texts).toContain("F");
    // 两力之差没有物理对应量，必须整支隐藏
    expect(texts).not.toContain("a - b");
    expect(texts).not.toContain("a + b");
    // 非三力平衡情景不得出现第三力
    expect(texts).not.toContain("F₃");
  });

  it("三力平衡：必须出现 F₃ 与平移后的 F₂，且合力箭头让位（不得出现 F₁+F₂）", () => {
    const texts = textsOf(
      renderScene(
        VECTOR_PHYSICS_PRESETS["force-balance"].params,
        "force-balance",
      ),
    );
    expect(texts).toContain("F₁");
    expect(texts).toContain("F₂");
    // 闭合三角形的第二条边（平移像）与第三边
    expect(texts).toContain("F₂(平移)");
    expect(texts).toContain("F₃");
    // 合力与 F₃ 必然重合，必须整支让位，否则两条反向箭头叠在一起还抢标签
    expect(texts).not.toContain("F₁+F₂");
    expect(texts).not.toContain("a - b");
  });

  it("速度的合成：标签换成 v水 / v船 / v，且不画差向量", () => {
    const texts = textsOf(
      renderScene(
        VECTOR_PHYSICS_PRESETS["velocity-compose"].params,
        "velocity-compose",
      ),
    );
    expect(texts).toContain("v水");
    expect(texts).toContain("v船");
    expect(texts).toContain("v");
    expect(texts).not.toContain("a - b");
    expect(texts).not.toContain("F₁");
  });

  it("非物理情景（回归）：a - b 与 a + b 必须原样保留，物理标签一律不得出现", () => {
    const texts = textsOf(renderScene({ ...defaultParams }, null));
    expect(texts).toContain("a - b");
    expect(texts).toContain("a + b");
    expect(texts).toContain("a");
    expect(texts).toContain("b");
    expect(texts).not.toContain("F₁");
    expect(texts).not.toContain("F₃");
  });

  it("模式不是「加减与数乘」时，即使传了 physicsContext 也不得套用物理命名", () => {
    const texts = textsOf(
      renderScene({ ...defaultParams }, "force-balance", "basis"),
    );
    expect(texts).not.toContain("F₃");
    expect(texts).not.toContain("F₁");
    // 基本定理模式的基底标签必须完好
    expect(texts).toContain("e₁");
    expect(texts).toContain("e₂");
  });
});

/* ================================================================== *
 * ④ 右屏看板：builder 必须按 physicsContext 真的分化
 * ================================================================== */

const buildPanel = (
  key: VectorPhysicsContext,
  studyMode: "linearCombo" | "collinear" | "basis" = "linearCombo",
) =>
  buildMathQuantities(
    "anim-vector-linear",
    VECTOR_PHYSICS_PRESETS[key].params,
    {
      studyMode,
      lockCollinear: false,
      physicsContext: key,
    },
  );

describe("④ 右屏看板按物理情景分化", () => {
  it("力的合成：看板报「合力」的坐标与大小，且大小为整数 5", () => {
    const data = buildPanel("force-resultant");
    const coord = data.quantities.find((q) => q.label.includes("合力的坐标"));
    const size = data.quantities.find((q) => q.label.includes("合力的大小"));
    expect(coord?.value).toBe("(4.0, 3.0)");
    expect(size?.value).toBe("5.00");
    // 符号列绝不能是「F₁」这种裸记号——必须走 KaTeX 向量符号
    expect(coord?.symbol).toBe("\\vec{F}");
    expect(size?.symbol).toBe("|\\vec{F}|");
    // 数学情景的 a / b 模长行不得出现（口径已整体换成物理量）
    expect(data.quantities.some((q) => q.label.includes("向量 a 的模长"))).toBe(
      false,
    );
    // 定理必须置顶为物理应用，并明确标为课标内
    expect(data.theorems[0].name).toContain("力的合成与三力平衡");
    expect(data.theorems[0].isExtension).toBeFalsy();
  });

  it("三力平衡：看板补出第三力，推导链末步收口到「平衡条件」", () => {
    const data = buildPanel("force-balance");
    const third = data.quantities.find((q) => q.label.includes("平衡力的大小"));
    // 平衡力与合力等大反向 ⇒ 大小同为 |F₁ + F₂| = 4
    expect(third?.value).toBe("4.00");

    const steps = data.reasoningSteps ?? [];
    expect(steps.map((s) => s.step)).toEqual([1, 2, 3]);
    expect(steps[2].title).toContain("平衡条件");
    // 末步必须给出闭合三角形的向量判据，而不是又来一遍合力公式
    expect(steps[2].latex).toContain("\\vec{0}");
    // 口诀要跟着换口径（物理情景不能再讲「三点共线、基底分解」）
    expect(data.mnemonic).toContain("等大反向");
    expect(data.mnemonic).not.toContain("基底不共线");
    for (const s of steps) {
      expect(s.latex ?? "").not.toContain("NaN");
      expect(s.detail ?? "").not.toContain("undefined");
    }
  });

  it("速度的合成：看板报「实际速度」的大小为整数 5，推导链三步收口到向量和的平方", () => {
    const data = buildPanel("velocity-compose");
    const size = data.quantities.find((q) =>
      q.label.includes("实际速度的大小"),
    );
    expect(size?.value).toBe("5.00");
    const steps = data.reasoningSteps ?? [];
    expect(steps.map((s) => s.step)).toEqual([1, 2, 3]);
    expect(steps[2].title).toContain("合成结果收口");
    // 口诀走的是「合成」分叉（不是三力平衡那一支）
    expect(data.mnemonic).toContain("差与和");
    expect(data.mnemonic).not.toContain("第三力");
  });

  it("未传 physicsContext 时物理分支必须完全不生效（数学情景零回归）", () => {
    const data = buildMathQuantities(
      "anim-vector-linear",
      { ...VECTOR_PHYSICS_PRESETS["force-balance"].params },
      { studyMode: "linearCombo", lockCollinear: false },
    );
    expect(data.quantities.some((q) => q.label.includes("平衡力"))).toBe(false);
    expect(data.quantities.some((q) => q.label.includes("向量 a 的模长"))).toBe(
      true,
    );
    // 数学情景仍是 4 步推导链
    expect((data.reasoningSteps ?? []).map((s) => s.step)).toEqual([
      1, 2, 3, 4,
    ]);
    expect(data.mnemonic).toContain("基底不共线");
  });

  it("模式不是「加减与数乘」时 physicsContext 不得生效（防串味）", () => {
    const data = buildPanel("force-balance", "basis");
    expect(data.quantities.some((q) => q.label.includes("平衡力"))).toBe(false);
    expect(data.theorems[0].name).toContain("平面向量基本定理");
  });
});

/* ================================================================== *
 * ⑤ 源码锁定：registry → builder → Scene → Animation
 * ================================================================== */

const readSource = (relPath: string) =>
  readFileSync(resolve(process.cwd(), relPath), "utf8");

describe("⑤ 四层接线与 SSOT 的源码锁定", () => {
  it("registry 必须持有情景文案（model）与类型守卫，且 Animation 不得内联字面量", () => {
    const registry = readSource("src/data/registries/vectorLinear.ts");
    expect(registry).toContain("export const VECTOR_PHYSICS_PRESETS");
    expect(registry).toContain("export function isVectorPhysicsContext");
    expect(registry).toContain("model:");
    for (const key of VECTOR_PHYSICS_PRESET_KEYS) {
      expect(registry).toContain(`"${key}"`);
    }
  });

  it("builder 的物理分支由 config.physicsContext 驱动，并按情景给出第三步", () => {
    const builder = readSource("src/data/builders/vectorLinear.ts");
    expect(builder).toContain("config?.physicsContext");
    expect(builder).toContain("physicsVectorApplication");
    expect(builder).toContain("closingVec");
  });

  it("Scene 消费 physicsContext，并实现「第三力让位合力箭头」的闭合三角形", () => {
    const scene = readSource(
      "src/features/vectorLinear/components/VectorLinearScene.tsx",
    );
    expect(scene).toContain("physicsContext?: VectorPhysicsContext | null");
    expect(scene).toContain("closeTriangle");
    // 合力箭头必须在三力平衡情景被隐藏
    expect(scene).toContain("{!closeTriangle &&");
    // 差向量必须在所有物理情景被隐藏
    expect(scene).toContain("{!labels &&");
  });

  it("Animation 必须把 physicsContext 同时透给 Scene 与数据层，并保留预设高亮", () => {
    const anim = readSource(
      "src/features/vectorLinear/VectorLinearAnimation.tsx",
    );
    expect(anim).toContain("resolveVectorPhysicsContext(studyMode, presetKey)");
    expect(anim).toContain("physicsContext={physicsContext}");
    expect(anim).toContain("physicsContext: physicsContext ??");
    // 拖拽动点时不得掉回「自由探究」，否则中屏命名与右屏口径同时失去物理语境
    expect(anim).toContain("!isVectorPhysicsContext(presetKey)");
    for (const key of VECTOR_PHYSICS_PRESET_KEYS) {
      expect(anim).toContain(`key: "${key}"`);
    }
  });
});
