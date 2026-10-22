import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fitViewRange, isPointInsideRange } from "@/math/viewRange";
import { collectTangentScalingKeyPoints as collectTangentScalingPoints } from "@/math/tangentScaling";

/**
 * 视口自适应门禁（核查报告 §4.3「P1 类 1：视口与参数域失配」）。
 *
 * ── 要防的是什么 ──
 * `useSceneScale` 取 `scale = min(840/Δx, 650/Δy)`。参数域放宽后视口没跟着走，
 * 关键点就会落到画布外——不是「画面丑」，而是教学对象直接消失：
 * `/nike-standard` 取 a=3,b=9 时最值点在 y=10.39，可见区只到 4.64，
 * 学生拖到那一帧看到的是「曲线冲出屏幕、极值点不见了」。
 *
 * ── 定案机制 ──
 * 纯函数 `fitViewRange` 算 range，再**单向派发**给 `useSceneScale` 与各绘图组件；
 * 不在 `useSceneScale` 内部隐式 autoFit——否则 CoordinateGrid、FunctionGraph、
 * IntervalShadow 会各自感知不同的动态区间，出现网格与曲线比例撕裂。
 * 三条防护：Floor Clamp（基准视口保底，参数正常时绝不反向收缩）、
 * 非数防御（渐近线除零产生的 Infinity/NaN 直接剔除）、Padding（关键点不贴边）。
 *
 * ── 本文件的三层断言 ──
 * 1. 机制层：报告实测的 12 处越界点，逐页代入该页真实基准视口后必须落框；
 * 2. 接线层：9 个页面必须把 `fitViewRange` 的结果喂给 `useSceneScale`，
 *    且不得同时保留写死的 range（否则两条来源并存，谁生效看运气）；
 * 3. 采集层（第 9 页特例）：`derivative-tangent-scaling` 的子模型曲线分散在
 *    多个场景组件里，关键点由数学层 `collectTangentScalingKeyPoints` 统一采集，
 *    这里按参数极值组合实测「采到的点全在框内」。
 */

const ROOT = process.cwd();

/** 报告 §4.3 落地的 9 个页面（另 7 页由各自专题报告单独处理） */
interface PageCase {
  /** 页面文件（静态扫描对象） */
  file: string;
  route: string;
  /** 该页基准视口 defaultXRange / defaultYRange */
  baseX: [number, number];
  baseY: [number, number];
  /** 报告实测的越界关键点（代入值） */
  overrun: Array<{ x: number; y: number }>;
  /** 该点为何必须在框内的说明 */
  note: string;
}

const PAGE_CASES: PageCase[] = [
  {
    file: "src/features/quadratic/QuadraticAnimation.tsx",
    route: "/quadratic",
    baseX: [-6, 6],
    baseY: [-4.5, 4.5],
    // a=2,b=4,c=-4 ⇒ 顶点 (-b/2a, -Δ/4a) = (-1, -6)
    overrun: [
      { x: -1, y: -6 },
      { x: 1, y: 0 },
    ],
    note: "顶点是配方结论的落点，出框等于「最值」这件事没被画出来",
  },
  {
    file: "src/features/nike/StandardPage.tsx",
    route: "/nike-standard",
    baseX: [-6, 6],
    baseY: [-4.5, 4.5],
    // a=3,b=9 ⇒ (±√3, ±2√ab) = (±1.73, ±10.39)
    overrun: [
      { x: 1.732, y: 10.392 },
      { x: -1.732, y: -10.392 },
    ],
    note: "对勾函数两个极值点是均值不等式取等的位置",
  },
  {
    file: "src/features/inequalityBasic/InequalityBasicAnimation.tsx",
    route: "/inequality-basic",
    baseX: [-6, 6],
    baseY: [-2.2, 5.8],
    // a=b=10 ⇒ 半圆半径 10；k=16 ⇒ 最值点 y=8
    overrun: [
      { x: 0, y: 10 },
      { x: 4, y: 8 },
    ],
    note: "半圆切点与最值对应点，是均值不等式的几何载体",
  },
  {
    file: "src/features/derivative/DerivativeAnimation.tsx",
    route: "/derivative",
    baseX: [-5, 5],
    baseY: [-4, 4],
    // cubic x₀=3 ⇒ f=18；exp x₀=2 ⇒ e²=7.389
    overrun: [
      { x: 3, y: 18 },
      { x: 2, y: 7.389 },
    ],
    note: "切点必须在切线上，出框后「切线斜率」失去可读的几何对象",
  },
  {
    file: "src/features/derivative-monotonicity/DerivativeMonotonicityAnimation.tsx",
    route: "/derivative-monotonicity",
    baseX: [0.05, 7],
    baseY: [-1.5, 1.5],
    // ln_x_ratio, a=-1 ⇒ 极值点 x=e²=7.389
    overrun: [{ x: 7.389, y: 0.135 }],
    note: "极值点即导函数变号点，是「单调性」这一页唯一的结论位置",
  },
  {
    file: "src/features/parabola/ParabolaAnimation.tsx",
    route: "/conic-parabola",
    baseX: [-7, 7],
    baseY: [-5.5, 5.5],
    // p=0.5, tP=5 ⇒ P(2pt², 2pt) = (25, 5)
    overrun: [{ x: 25, y: 5 }],
    note: "动点 P 与焦点 F 的比较是抛物线定义的观察对象",
  },
  {
    file: "src/features/parabolaArchimedes/ParabolaArchimedesAnimation.tsx",
    route: "/parabola-archimedes",
    baseX: [-7, 7],
    baseY: [-5.5, 5.5],
    // yQ=5, p=2 ⇒ 切点 yA=10.385
    overrun: [{ x: 4, y: 10.385 }],
    note: "阿基米德三角形的两个切点是面积结论的顶点",
  },
  {
    file: "src/features/circle-circle/CircleCircleAnimation.tsx",
    route: "/circle-circle",
    baseX: [-7, 7],
    baseY: [-5, 5],
    // x₁=-5, r₁=5 ⇒ 最左 -10；圆心距判定要用到整圆
    overrun: [
      { x: -10, y: 0 },
      { x: 5, y: 0 },
    ],
    note: "两圆位置关系的判定靠边界相切，圆被裁掉一半就判不出来了",
  },
  {
    file: "src/features/derivativeTangentScaling/TangentScalingAnimation.tsx",
    route: "/derivative-tangent-scaling",
    baseX: [-4, 5],
    baseY: [-3, 6],
    // evalX>2.79 ⇒ e^2.5=12.18（报告实测出上界 446px）
    overrun: [{ x: 3.5, y: 12.182 }],
    note: "放缩卡位的观察点 P₁ 出框后，「夹逼」这件事无法验证",
  },
];

function readSource(file: string): string {
  return readFileSync(resolve(ROOT, file), "utf-8");
}

/** 取出 `useSceneScale({...})` 调用的实参文本（按花括号配平） */
function extractUseSceneScaleArgs(source: string): string | null {
  const start = source.indexOf("useSceneScale({");
  if (start < 0) return null;
  let depth = 0;
  for (let i = start + "useSceneScale".length; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return null;
}

describe("视口自适应 · 机制层：报告实测越界点必须落框", () => {
  for (const page of PAGE_CASES) {
    it(`${page.route}：${page.note}`, () => {
      const range = fitViewRange(page.overrun, {
        defaultXRange: page.baseX,
        defaultYRange: page.baseY,
      });

      // 采集到的每个关键点都要在框内，且不贴边（padding 生效）
      for (const p of page.overrun) {
        expect(
          isPointInsideRange(p, range),
          `${page.route} 关键点 (${p.x}, ${p.y}) 落在 ${JSON.stringify(range)} 之外`,
        ).toBe(true);
        expect(
          isPointInsideRange(p, range, 0.02),
          `${page.route} 关键点 (${p.x}, ${p.y}) 贴边，缺少安全距离`,
        ).toBe(true);
      }

      // 这些点都超出了基准视口，故必然发生扩张——若 expanded 为假，
      // 说明基准视口被写大了，本用例就不再验证任何东西
      expect(range.expanded).toBe(true);
      expect(range.droppedCount).toBe(0);
    });
  }

  it("基准视口是下限而非目标：参数正常时不反向收缩", () => {
    // 关键点全部挤在原点附近（共面退化帧），视口必须保持基准尺寸
    const range = fitViewRange(
      [
        { x: 0, y: 0 },
        { x: 0.1, y: 0.1 },
      ],
      { defaultXRange: [-4, 5], defaultYRange: [-3, 6] },
    );
    expect(range.xRange).toEqual([-4, 5]);
    expect(range.yRange).toEqual([-3, 6]);
    expect(range.expanded).toBe(false);
  });
});

describe("视口自适应 · 接线层：9 页必须单向派发 fitViewRange 的结果", () => {
  for (const page of PAGE_CASES) {
    it(`${page.route} 的 useSceneScale 消费 viewRange，且不再保留写死 range`, () => {
      const source = readSource(page.file);

      expect(source, "缺少 fitViewRange 调用").toContain("fitViewRange(");

      const args = extractUseSceneScaleArgs(source);
      expect(args, "找不到 useSceneScale 调用").not.toBeNull();
      expect(args!).toContain("xRange: viewRange.xRange");
      expect(args!).toContain("yRange: viewRange.yRange");

      // 反回归：useSceneScale 实参里不得再出现数字字面量区间，
      // 否则动态 range 与写死 range 并存，谁生效取决于字段书写顺序
      expect(
        /xRange:\s*\[\s*-?\d/.test(args!),
        `${page.route}: useSceneScale 仍写死 xRange 数字区间`,
      ).toBe(false);
      expect(
        /yRange:\s*\[\s*-?\d/.test(args!),
        `${page.route}: useSceneScale 仍写死 yRange 数字区间`,
      ).toBe(false);
    });
  }
});

describe("视口自适应 · 采集层：切线放缩页的关键点来自数学层单源", () => {
  const SUBS = {
    baseSubModel: "exp_x_plus_1",
    sandwichSubModel: "common_tangent",
    paramKSubModel: "exp_log_k",
    secantSubModel: "exp_secant_tangent",
  } as const;

  const BASE = {
    defaultXRange: [-4, 5] as [number, number],
    defaultYRange: [-3, 6] as [number, number],
  };

  /** 逐点断言：采集到的关键点全部落在自适应后的框内 */
  function expectAllInside(
    label: string,
    points: Array<{ x: number; y: number }>,
  ): void {
    expect(points.length, `${label}: 未采到关键点`).toBeGreaterThan(0);
    const range = fitViewRange(points, BASE);
    for (const p of points) {
      expect(
        isPointInsideRange(p, range),
        `${label}: 关键点 (${p.x}, ${p.y}) 落在 ${JSON.stringify(range)} 之外`,
      ).toBe(true);
    }
  }

  it("基准放缩：切点拖到滑块上限（exp 移轴 x₀=2.8 ⇒ e^1.8=6.05）仍落框", () => {
    const params = {
      x0: 2.8,
      evalX: 1.8,
      k: 1,
      intervalA: 0.5,
      intervalB: 2.5,
    };
    expectAllInside(
      "base/exp_shift_x 上限",
      collectTangentScalingPoints(params, "base", {
        ...SUBS,
        baseSubModel: "exp_shift_x",
      }),
    );
  });

  it("双切线卡位：观察点推到 3.5（e^2.5=12.18）仍落框", () => {
    const params = { x0: 0, evalX: 3.5, k: 1, intervalA: 0.5, intervalB: 2.5 };
    expectAllInside(
      "sandwich/common_tangent 上限",
      collectTangentScalingPoints(params, "sandwich", SUBS),
    );
    expectAllInside(
      "sandwich/parallel_bands 上限",
      collectTangentScalingPoints(params, "sandwich", {
        ...SUBS,
        sandwichSubModel: "parallel_bands",
      }),
    );
  });

  it("过定点求参：k 与观察点同时取上限（kx=10.5、e^x=20.09）仍落框", () => {
    const params = {
      x0: 0,
      evalX: 3.0,
      k: 3.5,
      intervalA: 0.5,
      intervalB: 2.5,
    };
    for (const sub of [
      "exp_log_k",
      "exp_kx_origin",
      "log_kx_origin",
    ] as const) {
      expectAllInside(
        `param_k/${sub} 上限`,
        collectTangentScalingPoints(params, "param_k", {
          ...SUBS,
          paramKSubModel: sub,
        }),
      );
    }
  });

  it("割切双向：指数区间右端点推到 3.5（e^3.5=33.1）仍落框", () => {
    const params = { x0: 0, evalX: 1.0, k: 1, intervalA: 0.1, intervalB: 3.5 };
    expectAllInside(
      "secant/exp_secant_tangent 上限",
      collectTangentScalingPoints(params, "secant", SUBS),
    );
    expectAllInside(
      "secant/log_secant_tangent 上限",
      collectTangentScalingPoints(params, "secant", {
        ...SUBS,
        secantSubModel: "log_secant_tangent",
      }),
    );
    expectAllInside(
      "secant/taylor_quadratic 上限",
      collectTangentScalingPoints(params, "secant", {
        ...SUBS,
        secantSubModel: "taylor_quadratic",
      }),
    );
  });

  it("四个模式四种极端帧都必须真的触发扩张（否则用例空跑）", () => {
    const extreme = {
      x0: 2.8,
      evalX: 3.5,
      k: 3.5,
      intervalA: 0.1,
      intervalB: 3.5,
    };
    const modes = ["base", "sandwich", "param_k", "secant"] as const;
    for (const mode of modes) {
      const points = collectTangentScalingPoints(extreme, mode, {
        ...SUBS,
        baseSubModel: "exp_shift_x",
      });
      expect(fitViewRange(points, BASE).expanded, `${mode} 未触发扩张`).toBe(
        true,
      );
    }
  });
});
