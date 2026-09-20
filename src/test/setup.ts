import "@testing-library/jest-dom";
import { vi } from "vitest";

// ResizeObserver polyfill for jsdom
class ResizeObserverMock {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(_cb: ResizeObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(globalThis, "ResizeObserver", {
  writable: true,
  value: ResizeObserverMock,
});

// 静默 Three.js ESM/CJS 双构建误报：物理上只有一份 three.js（npm overrides 已收敛），
// 但 Vite 为源码解析 ESM 构建、Node 为非 inline 的 r3f/drei 加载 CJS 构建，
// 两者共享同一 jsdom window 导致 window.__THREE__ 被写两次而误报。
const _warn = console.warn.bind(console);
vi.spyOn(console, "warn").mockImplementation((...args: unknown[]) => {
  if (
    typeof args[0] === "string" &&
    args[0].includes("Multiple instances of Three.js")
  )
    return;
  _warn(...args);
});

// 注：`src/test/harness/threeTestLayer.tsx` 用 React DOM 渲染 R3F 内建元素时，
// React 会发出 "The tag <mesh> is unrecognized" / "is using incorrect casing" 告警。
// 该告警**不经**可被 `vi.spyOn(console, "error")` 拦截的路径（实测），
// 故统一在 runner 层过滤 —— 见 `vite.config.ts` 的 `test.onConsoleLog`。
