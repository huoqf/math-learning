/**
 * Canvas3DErrorBoundary 行为契约测试。
 *
 * 只断言与 React 内部调度无关的确定性契约：
 *  1. componentDidCatch 必须把**完整 Error 对象（含 stack）**交给 console.error，
 *     而不是拍平成 message 字符串 —— 否则线上永远无法定位崩溃来源；
 *  2. 首次崩溃（key === 0）自动重建：key 递增、crashed 回落，且只记录一次；
 *  3. 重建后再次崩溃（key > 0）不重建、不重复记录，保留降级 UI；
 *  4. 能力边界：事件回调中抛出的错误**不被捕获**（不记录、不进降级）。
 *
 * 刻意不断言「子组件前 N 次渲染抛错」的行为：该序列与 React 19 的
 * recoverFromConcurrentError 重试次数耦合（N=1 时 React 自行恢复、边界完全不介入），
 * 且单独跑与合跑结果不一致。断言它会让整个套件变得不稳定。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, createRef } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Canvas3DErrorBoundary } from "../components/Layout/Canvas3DErrorBoundary";

const LOG_PREFIX = "[Canvas3DErrorBoundary]";

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
let boundaryLogs: unknown[][];

beforeEach(() => {
  boundaryLogs = [];
  consoleErrorSpy = vi
    .spyOn(console, "error")
    .mockImplementation((...args: unknown[]) => {
      // 只收集边界自身的日志；React 为已捕获错误打印的告警一律吞掉，保持输出干净
      if (typeof args[0] === "string" && args[0].startsWith(LOG_PREFIX)) {
        boundaryLogs.push(args);
      }
    });
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

describe("Canvas3DErrorBoundary 行为契约", () => {
  it("首次崩溃：自动重建，并把完整 Error（含 stack）原样交给 console.error", () => {
    const ref = createRef<Canvas3DErrorBoundary>();
    render(
      <Canvas3DErrorBoundary ref={ref}>
        <div data-testid="child">child</div>
      </Canvas3DErrorBoundary>,
    );
    expect(ref.current).toBeTruthy();

    const err = new Error("boom-first");
    act(() => {
      ref.current!.componentDidCatch(err);
    });

    // 只记录一次
    expect(boundaryLogs.length).toBe(1);

    // 关键：第二参数必须是**同一个 Error 引用**，而非被拍平的 message 字符串
    const detail = boundaryLogs[0][1];
    expect(detail).toBe(err);
    expect(detail).toBeInstanceOf(Error);
    expect((detail as Error).message).toBe("boom-first");
    expect(typeof (detail as Error).stack).toBe("string");
    expect((detail as Error).stack!.length).toBeGreaterThan(10);

    // 自动重建：key 递增 → 子树销毁重挂载；crashed 回落 → 恢复渲染子节点
    expect(ref.current!.state.key).toBe(1);
    expect(ref.current!.state.crashed).toBe(false);
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("重建后再次崩溃：不再重建、不重复记录，保留降级 UI", () => {
    const ref = createRef<Canvas3DErrorBoundary>();
    render(
      <Canvas3DErrorBoundary ref={ref}>
        <div data-testid="child">child</div>
      </Canvas3DErrorBoundary>,
    );

    // 第一次崩溃 → 重建
    act(() => {
      ref.current!.componentDidCatch(new Error("boom-1"));
    });
    expect(boundaryLogs.length).toBe(1);
    expect(ref.current!.state.key).toBe(1);

    // 第二次崩溃：真实流程会先走 getDerivedStateFromError 置 crashed，再调 componentDidCatch
    act(() => {
      ref.current!.setState((s) => ({
        ...s,
        ...Canvas3DErrorBoundary.getDerivedStateFromError(),
      }));
    });
    act(() => {
      ref.current!.componentDidCatch(new Error("boom-2"));
    });

    expect(boundaryLogs.length).toBe(1); // 未重复记录
    expect(ref.current!.state.key).toBe(1); // 未再次重建（防无限重建循环）
    expect(ref.current!.state.crashed).toBe(true);
  });

  it("降级 UI：crashed 时只渲染提示文案，不再渲染子节点", () => {
    const ref = createRef<Canvas3DErrorBoundary>();
    render(
      <Canvas3DErrorBoundary ref={ref}>
        <div data-testid="child">child</div>
      </Canvas3DErrorBoundary>,
    );

    act(() => {
      ref.current!.setState((s) => ({
        ...s,
        ...Canvas3DErrorBoundary.getDerivedStateFromError(),
      }));
    });

    expect(screen.getByText(/3D 渲染出现异常/)).toBeInTheDocument();
    expect(screen.queryByTestId("child")).toBeNull();
  });

  it("能力边界：事件回调抛错不被捕获（不记录、不进降级）", async () => {
    const ref = createRef<Canvas3DErrorBoundary>();
    // React 会把未被边界接管的错误重抛给宿主 → 临时吞掉 window 的 error 事件，
    // 避免污染测试进程的退出码（这不改变"边界未捕获"这一事实）
    const swallow = (e: Event) => {
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    window.addEventListener("error", swallow, true);

    try {
      render(
        <Canvas3DErrorBoundary ref={ref}>
          <button
            data-testid="boom-btn"
            onClick={() => {
              throw new Error("handler-boom");
            }}
          >
            boom
          </button>
        </Canvas3DErrorBoundary>,
      );

      const btn = screen.getByTestId("boom-btn");
      try {
        act(() => {
          btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });
      } catch {
        // React 向宿主重抛，属预期行为
      }
      await new Promise((r) => setTimeout(r, 0));

      expect(boundaryLogs.length).toBe(0);
      expect(ref.current!.state.crashed).toBe(false);
      expect(ref.current!.state.key).toBe(0);
      expect(screen.getByTestId("boom-btn")).toBeInTheDocument();
    } finally {
      window.removeEventListener("error", swallow, true);
    }
  });
});
