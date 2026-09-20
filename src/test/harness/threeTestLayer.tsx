/**
 * jsdom 环境下的「3D 层渲染替身」（**仅测试用**，不进入生产包）。
 *
 * ## 背景（P1-14）
 * 真实 3D 层链路是 `ThreeDCanvas` → R3F `Canvas` → WebGL。jsdom 没有 WebGL，
 * 因此历史测试把 `@/components/Math3D` 与 `ThreeDCanvas` **整包 mock 成 `null`**，
 * 后果是 **3D 元素树在测试里永不渲染** —— 「手柄位置 / 切点 / 半径线 / 相机」
 * 这类结构性缺陷在测试层面**根本无法被发现**。
 *
 * ## 本替身的原则：只替「必须 WebGL / 必须 R3F 上下文」的边界，其余全部真实执行
 * - `Canvas`      → 普通 `<div>`，**保留 children**（子树照常渲染）；
 * - `useThree()`  → 最小可用上下文（`camera` / `gl.domElement` / `invalidate` / `size`）；
 * - `useFrame()`  → 空实现（测试中不跑逐帧回调，避免依赖时钟的不稳定）；
 * - drei 的 `PerspectiveCamera` / `OrbitControls` → `null`；
 *   `Line` / `Edges` → 渲染 `<lineSegments />`、`Text` → 渲染 `<sprite />`（**占位**，
 *   使线/文字类结构仍留在元素树里可被计数）；`Html` / `Billboard` → 透传 children。
 *
 * 于是 `Math3D/*` 组件**真实执行**（几何换算、配色解析、结构装配都在跑），
 * R3F 内建元素（`mesh` / `group` / `sphereGeometry` / `meshStandardMaterial` / …）
 * 在 React DOM 下渲染为**同名自定义元素**，测试即可对元素树做结构断言。
 *
 * > React 对这类"非 HTML 标签名"会发 unrecognized / incorrect-casing 告警，
 * > 已在 `src/test/setup.ts` 按**R3F 内建标签白名单**屏蔽（见该文件注释）。
 */

/* eslint-disable react-refresh/only-export-components -- 本文件是 jsdom 环境下 R3F 层的模块替身 harness，需同时导出替身组件与纯函数/对象 mock；React Fast Refresh (HMR) 不适用于测试 mock，拆分文件反增混乱。 */
import type { ReactNode } from "react";

/** 3D 场景容器替身：保留 children，使 3D 元素树真实进入 DOM。 */
export const CanvasMock = ({ children }: { children?: ReactNode }) => (
  <div data-testid="r3f-canvas">{children}</div>
);

/** 渲染为 null 的替身（drei 的相机 / 控制器 / 文本 / 线 / 描边）。 */
export const NullMock = () => null;

/** 透传 children 的替身（drei `Html` / `Billboard`）。 */
export const ChildrenMock = ({ children }: { children?: ReactNode }) => (
  <>{children}</>
);

/**
 * drei `Line` / `Edges` 替身：真实 drei 会渲染出 `<line>` / `<lineSegments>`，
 * 这里用**同名 R3F 内建元素**占位，使「线」类结构在元素树中**可被计数与断言**
 * （否则该页的线全被抹掉，元素树计数会虚低）。
 */
export const LineMock = () => <lineSegments />;

/** drei `Text` 替身：真实 drei 会渲染出带文字几何的 `<mesh>`，这里用 `<sprite />` 占位。 */
export const TextMock = () => <sprite />;

/**
 * `gl.domElement` 替身：`Point3D` 会在 hover 时写 `style.cursor`、
 * 拖拽时读 `getBoundingClientRect()`，故两者必须存在。
 */
const fakeCanvasElement = {
  style: { cursor: "" },
  getBoundingClientRect: () => ({
    left: 0,
    top: 0,
    width: 840,
    height: 650,
    right: 840,
    bottom: 650,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  }),
  addEventListener: () => {},
  removeEventListener: () => {},
  setPointerCapture: () => {},
  releasePointerCapture: () => {},
  setAttribute: () => {},
  ownerDocument: typeof document === "undefined" ? undefined : document,
} as unknown as HTMLCanvasElement;

/** `useThree()` 替身：只提供渲染期与回调期真正会被读到的字段。 */
export const useThreeMock = () => ({
  camera: {
    position: { x: 6, y: 5, z: 8 },
    getWorldDirection: (v: unknown) => v,
    updateProjectionMatrix: () => {},
  },
  gl: {
    domElement: fakeCanvasElement,
    setClearColor: () => {},
    getPixelRatio: () => 1,
    setPixelRatio: () => {},
  },
  scene: { add: () => {}, remove: () => {} },
  size: { width: 840, height: 650, top: 0, left: 0, updateStyle: false },
  viewport: {
    width: 840,
    height: 650,
    factor: 1,
    distance: 1,
    aspect: 840 / 650,
  },
  invalidate: () => {},
  advance: () => {},
  set: () => {},
  get: () => ({}),
});

/** `useFrame()` 替身：测试中不推进逐帧回调。 */
export const useFrameMock = () => {};

/** `@react-three/fiber` 的模块替身。 */
export const fiberMock = {
  Canvas: CanvasMock,
  useThree: useThreeMock,
  useFrame: useFrameMock,
};

/** `@react-three/drei` 的模块替身。 */
export const dreiMock = {
  PerspectiveCamera: NullMock,
  OrbitControls: NullMock,
  Text: TextMock,
  Line: LineMock,
  Edges: LineMock,
  Html: ChildrenMock,
  Billboard: ChildrenMock,
};

/**
 * 统计 DOM 中 R3F 内建元素的数量，用于「3D 元素树是否真的渲染出来了」的断言。
 * 返回一个 `元素名 → 个数` 的普通对象，便于 `expect(...).toBeGreaterThan(0)`。
 */
export const countR3fElements = (root: ParentNode): Record<string, number> => {
  const tally: Record<string, number> = {};
  root.querySelectorAll("*").forEach((el) => {
    const tag = el.tagName.toLowerCase();
    // HTML 里绝不存在的标签名（R3F 内建元素），排除标准 HTML/SVG
    if (
      /^(mesh|group|sphereGeometry|cylinderGeometry|coneGeometry|boxGeometry|planeGeometry|bufferGeometry|meshStandardMaterial|meshBasicMaterial|meshPhongMaterial|lineBasicMaterial|line|sprite|points|torusGeometry|ringGeometry|circleGeometry|edgesGeometry|lineSegments|instancedMesh|pointLight|spotLight|ambientLight|directionalLight|orthographicCamera|perspectiveCamera)$/.test(
        tag,
      )
    ) {
      tally[tag] = (tally[tag] ?? 0) + 1;
    }
  });
  return tally;
};
