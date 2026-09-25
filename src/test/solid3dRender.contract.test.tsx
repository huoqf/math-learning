/**
 * 立体几何 13 页「3D 真渲染」契约测试（P1-14 收口）
 *
 * ## 背景
 * 历史测试把 `@/components/Math3D` 与 `ThreeDCanvas` **整包 mock 成 `null`**，
 * 导致这 13 页的 **3D 元素树在测试里永不渲染** ⇒「手柄位置 / 切点 / 半径线 / 相机」
 * 这类结构性缺陷在测试层面**根本无法被发现**。
 *
 * 本套测试用 `@/test/harness/threeTestLayer` 只替身「必须 WebGL / 必须 R3F 上下文」的边界，
 * 让 **Math3D/* 与各 Scene 真实执行**，并直接在**渲染出的 DOM** 上做两类断言：
 *
 * 1. **结构有守护**：3D 容器存在、元素树非空、所有几何数值属性有限（NaN/Infinity 不得进入 3D 层）；
 * 2. **几何有守护**（外接球三页）：把 `<group renderorder="10">` 认作球体，
 *    读出**渲染出的半径 R 与球心 O**，再读所有点位标记，断言：
 *    - 球心处确实有标记（球心被标出）；
 *    - **没有顶点跑到球外**（∀ d(P,O) ≤ R + ε）；
 *    - **至少一个顶点落在球面上**（max d(P,O) = R）—— 这正是"切点到球心距离恒等于半径"。
 *
 * > 注：jsdom 无 WebGL，故光照/纹理不生效；但 React 元素树与全部几何 props
 * > 都会真实落到 DOM（React 19 会把数组 props 串成 `position="1,1,1.5"` 这类属性），
 * > 因此上述几何断言是**对真实渲染结果**的断言，而非对 mock 的断言。
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import "@/test/mocks";

vi.mock("@react-three/fiber", async () => {
  const h = await import("@/test/harness/threeTestLayer");
  return h.fiberMock;
});

vi.mock("@react-three/drei", async () => {
  const h = await import("@/test/harness/threeTestLayer");
  return h.dreiMock;
});

import { countR3fElements } from "@/test/harness/threeTestLayer";

import { SphereDerivationScene } from "@/features/solidSphereDerivation/SphereDerivationScene";
import { calculateSphereMicroPyramids } from "@/math3d/sphereDerivation";
import { mathToThree } from "@/math3d/coordinateConvention";

import RotationBodyAnimation from "@/features/solidGeometry/RotationBodyAnimation";
import LinePlaneRelationAnimation from "@/features/solidGeometry/LinePlaneRelationAnimation";
import SurfaceRelationAnimation from "@/features/solidGeometry/SurfaceRelationAnimation";
import SectionCuboidDemo from "@/features/solidGeometry/section/SectionCuboidDemo";
import FoldingAnimation from "@/features/solidGeometry/FoldingAnimation";
import Vector3DBasisAnimation from "@/features/vector3d/Vector3DBasisAnimation";
import SpatialAngleAnimation from "@/features/solidGeometry/SpatialAngleAnimation";
import SpatialDistanceAnimation from "@/features/solidGeometry/SpatialDistanceAnimation";
import ParametricPointAnimation from "@/features/solidGeometry/ParametricPointAnimation";
import CircumInSphereAnimation from "@/features/solidGeometry/CircumInSphereAnimation";
import PolyhedronCircumSphereAnimation from "@/features/solidGeometry/PolyhedronCircumSphereAnimation";
import AdvancedSphereAnimation from "@/features/solidGeometry/AdvancedSphereAnimation";
import SphereDerivationAnimation from "@/features/solidSphereDerivation/SphereDerivationAnimation";

/** 知识点节点 key 与页面组件的对应（`src/data/knowledgeTree/solid.ts` 13 节点） */
const PAGES: {
  key: string;
  name: string;
  Component: () => React.ReactElement;
}[] = [
  {
    key: "know-solid-rotation-body",
    name: "旋转体的结构特征",
    Component: RotationBodyAnimation,
  },
  {
    key: "know-solid-sphere-derivation",
    name: "祖暅原理与球公式推导",
    Component: SphereDerivationAnimation,
  },
  {
    key: "know-solid-position",
    name: "空间线面平行与垂直判定",
    Component: LinePlaneRelationAnimation,
  },
  {
    key: "know-solid-surface-relation",
    name: "面面平行与面面垂直",
    Component: SurfaceRelationAnimation,
  },
  {
    key: "know-solid-section",
    name: "多面体的截面作图与截面积",
    Component: SectionCuboidDemo,
  },
  {
    key: "know-solid-folding",
    name: "平面图形折叠与翻折二面角",
    Component: FoldingAnimation,
  },
  {
    key: "know-vector3d-basis",
    name: "空间向量基本定理与基底分解",
    Component: Vector3DBasisAnimation,
  },
  {
    key: "know-solid-angle",
    name: "空间直角坐标系与求空间角",
    Component: SpatialAngleAnimation,
  },
  {
    key: "know-solid-distance",
    name: "异面直线公垂线与空间距离",
    Component: SpatialDistanceAnimation,
  },
  {
    key: "know-solid-parametric",
    name: "空间向量与动点存在性、最值",
    Component: ParametricPointAnimation,
  },
  {
    key: "know-solid-ball",
    name: "多面体与旋转体的外接球、内切球",
    Component: CircumInSphereAnimation,
  },
  {
    key: "know-solid-ball-models",
    name: "四大模型（墙角/侧棱垂直/补形/内切）",
    Component: PolyhedronCircumSphereAnimation,
  },
  {
    key: "know-solid-advanced-sphere",
    name: "进阶切接球（双外心/三球同心/旋转体）",
    Component: AdvancedSphereAnimation,
  },
];

const POINT_MARKER_RE = /^0\.0(42|75),/;
const EPS = 1e-9;

/** 从 "x,y,z" 形式属性解析为数字数组；非法即抛（用于暴露 NaN 泄漏） */
const parseVec = (raw: string | null): number[] => {
  if (!raw) throw new Error("缺少几何属性");
  return raw.split(",").map((t) => Number(t.trim()));
};

/** 取页面 DOM 中所有「点位标记」的世界坐标 */
const readPointMarkers = (root: ParentNode): number[][] =>
  Array.from(root.querySelectorAll("group"))
    .filter((g) => {
      const args = g.querySelector("sphereGeometry")?.getAttribute("args");
      return !!args && POINT_MARKER_RE.test(args);
    })
    .map((g) => g.getAttribute("position"))
    .filter((p): p is string => !!p)
    .map(parseVec);

/** 取球体（`group[renderorder="10"]`）的球心与渲染半径 */
const readSphere = (root: ParentNode): { center: number[]; radius: number } => {
  const g = root.querySelector('group[renderorder="10"]');
  if (!g) throw new Error("未找到球体渲染组 (group[renderorder='10'])");
  const center = parseVec(g.getAttribute("position"));
  const args = g.querySelector("sphereGeometry")?.getAttribute("args") ?? null;
  const radius = parseVec(args)[0];
  return { center, radius };
};

const dist = (a: number[], b: number[]): number =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

describe("立体几何 13 页 3D 真渲染契约（P1-14）", () => {
  describe("通用：3D 元素树真实渲染且几何数值有限", () => {
    PAGES.forEach(({ key, name, Component }) => {
      it(`${name}（${key}）渲染出非空 3D 树，且所有几何数值属性有限`, () => {
        const { container } = render(<Component />);

        // 1) 3D 容器必须存在（说明 3D 层真的被渲染，而不是被 mock 掉）
        expect(
          container.querySelector('[data-testid="r3f-canvas"]'),
        ).not.toBeNull();

        // 2) 元素树必须非空（Scene 静默不渲染 = 缺陷）
        const tally = countR3fElements(container);
        const total = Object.values(tally).reduce((a, b) => a + b, 0);
        expect(total).toBeGreaterThanOrEqual(3);

        // 3) 几何数值属性必须有限 —— 拦下 "NaN/Infinity 泄漏进 3D 层"。
        //    注意：R3F 允许 `position={THREE.Vector3}`，这种对象 prop 在 DOM 里会被
        //    React 串成 "[object Object]"（renderer 侧合法），故只对**能解析为数值列表**
        //    的值逐项校验有限性；对象型 prop 退化为"不得含 NaN/Infinity 子串"。
        const GEOM_ATTRS = ["position", "args", "scale", "rotation"];
        const NUM_LIST_RE =
          /^-?\d*\.?\d+(?:e[+-]?\d+)?(?:\s*,\s*-?\d*\.?\d+(?:e[+-]?\d+)?)*$/i;
        container.querySelectorAll("*").forEach((el) => {
          GEOM_ATTRS.forEach((attr) => {
            const raw = el.getAttribute(attr);
            if (!raw) return;
            const tag = `<${el.tagName.toLowerCase()} ${attr}="${raw}">`;
            if (NUM_LIST_RE.test(raw.trim())) {
              raw.split(",").forEach((token) => {
                const n = Number(token.trim());
                expect(Number.isFinite(n), `${tag} 出现非有限数值`).toBe(true);
              });
            } else {
              expect(raw, `${tag} 含 NaN/Infinity`).not.toMatch(/NaN|Infinity/);
            }
          });
        });

        // 4) 页面文本不得出现 NaN / undefined
        const text = container.textContent ?? "";
        expect(text).not.toContain("NaN");
        expect(text).not.toContain("undefined");
      });
    });
  });

  describe("外接球三页：球必须包住所有顶点、且至少一顶点落在球面上", () => {
    const SPHERE_PAGES = PAGES.filter((p) =>
      [
        "know-solid-ball",
        "know-solid-ball-models",
        "know-solid-advanced-sphere",
      ].includes(p.key),
    );

    SPHERE_PAGES.forEach(({ key, name, Component }) => {
      it(`${name}（${key}）渲染出的球半径与顶点距离自洽`, () => {
        const { container } = render(<Component />);
        const { center, radius } = readSphere(container);
        const markers = readPointMarkers(container);

        // 半径必须是有限正数（拦下半径类 NaN）
        expect(Number.isFinite(radius)).toBe(true);
        expect(radius).toBeGreaterThan(0);
        // 至少要有 3 个可辨点位（真实页面远多于 3）
        expect(markers.length).toBeGreaterThanOrEqual(3);

        const dists = markers.map((m) => dist(m, center));

        // a) 球心处必须被标出（存在与球心重合的标记点）
        expect(Math.min(...dists)).toBeLessThan(EPS);

        // b) 没有任何顶点跑到球外 —— 球真的把几何体包住了
        dists.forEach((d) => {
          expect(d).toBeLessThanOrEqual(radius + EPS);
        });

        // c) 至少一个顶点恰落在球面上 —— "切点到球心距离恒等于半径"
        expect(Math.max(...dists)).toBeCloseTo(radius, 8);
      });
    });
  });

  /**
   * 祖暅页「探究阶段」二档（等高切片 / 柱锥相减）的**接线契约**。
   *
   * 该二档曾长期是「假联动」：`zuxuanStep` 由左屏选择器写入，却没有任何消费方，
   * 点第二档只有左屏 TipCard 问句变、中屏画面一动不动 —— 学生以为看的是"体积相减"，
   * 实际仍是"等高截面比较"。因此这里直接断言**两档画布必须不同**，
   * 把"真接线"钉成可回归的结构事实，而不是停留在代码审查结论上。
   */
  describe("祖暅页探究阶段二档：中屏必须真正切换（P1-4 接线契约）", () => {
    const renderStep = (zuxuanStep: "slice" | "subtract") =>
      render(
        <SphereDerivationScene
          mode="zuxuan"
          radius={2}
          heightCut={1}
          subdivisions={16}
          zuxuanStep={zuxuanStep}
        />,
      );

    it("第二档收起「等高截面比较」装置 ⇒ 元素树严格小于第一档", () => {
      const sliceTotal = Object.values(
        countR3fElements(renderStep("slice").container),
      ).reduce((a, b) => a + b, 0);
      const subtractTotal = Object.values(
        countR3fElements(renderStep("subtract").container),
      ).reduce((a, b) => a + b, 0);

      expect(sliceTotal).toBeGreaterThan(0);
      expect(subtractTotal).toBeGreaterThan(0);
      // 截面圆盘/圆环/量线/辅助线在第二档全部不渲染
      expect(subtractTotal).toBeLessThan(sliceTotal);
    });

    it("两档的结论徽标互斥：s₁≡s₂ 只属第一档，柱锥相减等式只属第二档", () => {
      const sliceText = renderStep("slice").container.textContent ?? "";
      const subtractText = renderStep("subtract").container.textContent ?? "";

      // 第一档：截面积恒等结论 + 两个截面对照体的命名徽标
      expect(sliceText).toContain("等高截面：S₁(h) = S₂(h)");
      // 第二档的结论徽标（"… = 2/3·πR³ = V半球"）在第一档不得出现
      expect(sliceText).not.toContain("2/3·πR³");

      // 第二档：截面比较结论收起，改为交代"挖锥柱体 = 圆柱 − 圆锥"并落到半球体积
      expect(subtractText).not.toContain("等高截面");
      expect(subtractText).toContain("V挖 = V柱 − V锥");
      expect(subtractText).toContain("2/3·πR³ = V半球");
    });
  });

  /**
   * 上一条是「Scene 层的 prop 契约」；这一条补上**左屏控件 → 中屏画面**的端到端链路，
   * 确保接线没有在中途断掉（例如 zuxuanStep 被提升到 Scene 却没从页面传下去）。
   * 断言一律**限定在 3D 画布子树内**：右屏定理里也有"等高截面"字样，
   * 若对整个 container 断言文本会把右屏与中屏混为一谈，测不出真正的联动。
   */
  describe("祖暅页左屏控件 → 中屏画面端到端联动（P1-4 端到端契约）", () => {
    const canvasText = (container: HTMLElement) =>
      container.querySelector('[data-testid="r3f-canvas"]')?.textContent ?? "";

    it("左屏切到第二档 ⇒ 3D 画布同步换成体积相减视图", () => {
      const { container } = render(<SphereDerivationAnimation />);

      expect(canvasText(container)).toContain("等高截面：S₁(h) = S₂(h)");
      expect(canvasText(container)).not.toContain("2/3·πR³");

      fireEvent.click(screen.getByText("柱锥体积反向相减"));

      expect(canvasText(container)).not.toContain("等高截面：S₁(h) = S₂(h)");
      expect(canvasText(container)).toContain("2/3·πR³ = V半球");
    });

    it("自动扫掠开关：开启后 h 读数随时间连续推进，手动编辑即接管并停机", () => {
      vi.useFakeTimers();
      try {
        const { container } = render(<SphereDerivationAnimation />);
        const hInput = () =>
          container.querySelector<HTMLInputElement>(
            'input[aria-label="截面高度 h数值"]',
          );
        const sweepBtn = () => screen.getByText(/自动扫掠截面 h|暂停自动扫掠/);

        // 第一档才有扫掠入口（第二档与 h 无关，不提供死交互）
        expect(hInput()).not.toBeNull();
        const before = Number(hInput()?.value);
        expect(Number.isFinite(before)).toBe(true);

        fireEvent.click(sweepBtn());
        expect(screen.getByText("⏸ 暂停自动扫掠")).toBeInTheDocument();

        act(() => {
          vi.advanceTimersByTime(70 * 15);
        });

        const after = Number(hInput()?.value);
        expect(after).toBeGreaterThan(before);

        // 手动编辑（聚焦 → 改值 → 失焦提交）立即接管：扫掠停机、按钮回到"自动扫掠"
        const input = hInput()!;
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: "0.50" } });
        fireEvent.blur(input);

        expect(
          screen.getByText("▶ 自动扫掠截面 h（0 ⇄ R）"),
        ).toBeInTheDocument();
        expect(Number(hInput()?.value)).toBeCloseTo(0.5, 2);

        // 停机后不再被扫掠覆盖
        act(() => {
          vi.advanceTimersByTime(70 * 20);
        });
        expect(Number(hInput()?.value)).toBeCloseTo(0.5, 2);
      } finally {
        vi.useRealTimers();
      }
    });

    it("切到第二档后扫掠入口消失（与 h 无关的档位不留下空转按钮）", () => {
      render(<SphereDerivationAnimation />);
      fireEvent.click(screen.getByText("柱锥体积反向相减"));
      expect(screen.queryByText(/自动扫掠截面 h|暂停自动扫掠/)).toBeNull();
      expect(screen.queryByRole("button", { name: "显示截面" })).toBeNull();
    });
  });

  /**
   * 模式二「以锥积球求表面积」的**数形同源契约**。
   *
   * 历史缺陷：中屏按 φ≈50°/θ≈35° 自算一个球面网格单元，数学层（右屏数据的来源）
   * 按另一套规则另算一格 ⇒ 中屏画出来的那个微锥与右屏标题为"采样微锥"的 ΔS、ΔV
   * **不是同一个格子**（底面面积相差 8.76% ~ 20.88%）。门禁、单测、真渲染契约测试全都看不出来。
   * 这里直接在渲染出的底面顶点上做逐位比对：中屏底座印记必须等于数学层采样单元的
   * 4 个顶点（经 coordinateConvention 换算）。
   */
  describe("祖暅页模式二：中屏抽出的微锥与右屏采样微锥必须同源（数形同源契约）", () => {
    /**
     * 读出所有「12 个坐标 + itemSize=3」的缓冲。
     * React 把 `args={[Float32Array, 3]}` 串成 "x,y,z,…,3"，故末位是 itemSize。
     */
    const readPointBuffers = (container: HTMLElement): number[][] =>
      Array.from(container.querySelectorAll("bufferAttribute"))
        .map((el) => el.getAttribute("args") ?? "")
        .map((raw) => raw.split(",").map((t) => Number(t.trim())))
        .filter((nums) => nums.length === 13 && nums[12] === 3)
        .map((nums) => nums.slice(0, 12));

    const renderSphere = (radius: number, subdivisions: number) =>
      render(
        <SphereDerivationScene
          mode="micropyramid"
          radius={radius}
          heightCut={1}
          subdivisions={subdivisions}
        />,
      );

    it("底座印记 4 顶点逐位等于数学层采样单元的 4 顶点（经坐标约定换算）", () => {
      const R = 2;
      const subdivisions = 16;
      const { container } = renderSphere(R, subdivisions);

      const { cell } = calculateSphereMicroPyramids(
        R,
        subdivisions,
      ).samplePyramid;
      const expected = cell.vertices
        .map((v) => mathToThree({ x: v[0], y: v[1], z: v[2] }))
        .flat();

      const buffers = readPointBuffers(container);
      // 恰好两个 12 数缓冲：抽取前的原位印记、抽取后的底面
      expect(buffers.length).toBe(2);

      const matched = buffers.some((nums) =>
        nums.every((v, i) => Math.abs(v - expected[i]) < 1e-5),
      );
      expect(
        matched,
        `中屏底座印记与数学层采样单元不一致\n中屏: ${buffers
          .map((b) => b.join(","))
          .join(" | ")}\n期望: ${expected.join(",")}`,
      ).toBe(true);

      // 抽离必须是**刚体平移**：两个缓冲的逐点差向量应完全一致（形状不变、长度不变）
      const others = buffers.filter((buf) => buf !== buffers[0]);
      const deltas = others[0].map((v, i) => v - buffers[0][i]);
      for (let k = 0; k < 4; k++) {
        for (let axis = 0; axis < 3; axis++) {
          expect(deltas[k * 3 + axis]).toBeCloseTo(deltas[axis], 5);
        }
      }
    });

    it("采样密度变化时，中屏与数学层仍指向同一格（顶点点集逐位一致）", () => {
      for (const subdivisions of [8, 16, 32]) {
        const R = 2;
        const { cell } = calculateSphereMicroPyramids(
          R,
          subdivisions,
        ).samplePyramid;
        const expected = cell.vertices
          .map((v) => mathToThree({ x: v[0], y: v[1], z: v[2] }))
          .flat();
        const buffers = readPointBuffers(
          renderSphere(R, subdivisions).container,
        );

        expect(
          buffers.some((nums) =>
            nums.every((v, i) => Math.abs(v - expected[i]) < 1e-5),
          ),
          `n=${subdivisions} 时中屏与数学层采样单元不一致`,
        ).toBe(true);
      }
    });

    it("微锥抽离比例 popRatio 驱动连续平移：λ=0 严格归位与印记重合，λ=1 刚体抽出", () => {
      const R = 2;
      const n = 16;
      const renderWithRatio = (ratio: number) =>
        render(
          <SphereDerivationScene
            mode="micropyramid"
            radius={R}
            heightCut={1}
            subdivisions={n}
            popRatio={ratio}
          />,
        );

      // λ = 0: 原位嵌于球体内，底面与印记完全重合
      const zeroBuffers = readPointBuffers(renderWithRatio(0).container);
      expect(zeroBuffers.length).toBe(2);
      for (let i = 0; i < 12; i++) {
        expect(zeroBuffers[0][i]).toBeCloseTo(zeroBuffers[1][i], 4);
      }

      // λ = 1: 完全抽出特写，平移距离严格大于 0
      const fullBuffers = readPointBuffers(renderWithRatio(1).container);
      expect(fullBuffers.length).toBe(2);
      const shiftFull = Math.hypot(
        fullBuffers[1][0] - fullBuffers[0][0],
        fullBuffers[1][1] - fullBuffers[0][1],
        fullBuffers[1][2] - fullBuffers[0][2],
      );
      expect(shiftFull).toBeCloseTo(R * 0.45, 2);
    });
  });
});
