/**
 * 立体几何 12 页「3D 真渲染」契约测试（P1-14 收口）
 *
 * ## 背景
 * 历史测试把 `@/components/Math3D` 与 `ThreeDCanvas` **整包 mock 成 `null`**，
 * 导致这 12 页的 **3D 元素树在测试里永不渲染** ⇒「手柄位置 / 切点 / 半径线 / 相机」
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
import { render } from "@testing-library/react";
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

describe("立体几何 12 页 3D 真渲染契约（P1-14）", () => {
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
});
