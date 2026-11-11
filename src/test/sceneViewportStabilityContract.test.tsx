/**
 * src/test/sceneViewportStabilityContract.test.tsx
 *
 * P0 / P1 视口稳定性、比例尺防萎缩与反无标记截断契约测试：
 * 1. P0-1 /derivative：绝不允许将定义域边界点强行纳入视口导致初始画面缩小 5.85×（cubic 到 13.89 px/单位、lnx_x 到 y=-26.5）
 * 2. P0-2 /sequence-geometric：q=2 指数增长时离散横轴不得被等比压缩成一条竖线，且严禁无断轴标记地把多点叠在 y=45 假高度上
 * 3. P0-3 /sequence-models：错位相减 q=2 时严禁无断轴标记地将 c6=192/c7=448/c8=1024 裁成等高平头柱
 * 4. P1 视口稳定性（A/B 分型）：
 *    - A 类（circle-circle, inequalityBasic）：固定参数预算视口，全范围拖动滑块 scale 恒定（恢复参数→图形大小因果链）
 *    - B 类（quadratic 等）：默认/常规邻域稳态不跳变，越界按阶梯档位外扩，严禁随 0.1 滑块步进逐帧小数缩放
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { SceneScale } from "@/hooks/useSceneScale";
import { CANVAS_PRESETS } from "@/theme";

const FULL_W = CANVAS_PRESETS.full.width;
const FULL_H = CANVAS_PRESETS.full.height;

const mockVp = {
  visibleX: 0,
  visibleY: 0,
  visibleW: FULL_W,
  visibleH: FULL_H,
  centerX: FULL_W / 2,
  centerY: FULL_H / 2,
  scale: 1,
  tx: 0,
  ty: 0,
  transform: "translate(0 0) scale(1)",
  designVisibleW: FULL_W,
  designVisibleH: FULL_H,
  designLeft: 0,
  designTop: 0,
};

const mockCanvasSize = {
  width: FULL_W,
  height: FULL_H,
  scale: 1,
  rawScale: 1,
  px: (v: number) => v,
  font: (v: number) => Math.min(Math.max(v, 7), 16),
};

const capturedScales: SceneScale[] = [];

vi.mock("@/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks")>();
  return {
    ...actual,
    useAnimationViewport: () => ({
      containerRef: { current: null },
      canvasSize: mockCanvasSize,
      vp: mockVp,
      preset: { width: FULL_W, height: FULL_H },
    }),
  };
});

vi.mock("@/components/UI/KatexFormula", () => ({
  KatexFormula: ({ formula }: { formula: string }) => (
    <span data-testid="katex">{formula}</span>
  ),
}));

vi.mock("@/components/Math", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/Math")>();
  const OriginalGrid = actual.CoordinateGrid;
  return {
    ...actual,
    CoordinateGrid: (props: React.ComponentProps<typeof OriginalGrid>) => {
      capturedScales.push(props.scale);
      return <OriginalGrid {...props} />;
    },
  };
});

import { DerivativeAnimation } from "@/features/derivative/DerivativeAnimation";
import { ArithmeticPage } from "@/features/sequence/ArithmeticPage";
import { GeometricPage } from "@/features/sequence/GeometricPage";
import { ModelsPage } from "@/features/sequence/ModelsPage";
import { CircleCircleAnimation } from "@/features/circle-circle/CircleCircleAnimation";
import { InequalityBasicAnimation } from "@/features/inequalityBasic/InequalityBasicAnimation";
import { QuadraticAnimation } from "@/features/quadratic/QuadraticAnimation";

function lastScale(): SceneScale {
  expect(capturedScales.length).toBeGreaterThan(0);
  return capturedScales[capturedScales.length - 1];
}

describe("视口稳定性与反萎缩 / 反无标记截断契约", () => {
  beforeEach(() => {
    cleanup();
    capturedScales.length = 0;
  });

  describe("P0-1 · /derivative 导数几何意义页防萎缩", () => {
    it("cubic 默认视图必须保持基准 81.25 px/单位，严禁被 x0Range 端点拉缩到 13.89", () => {
      render(
        <MemoryRouter>
          <DerivativeAnimation />
        </MemoryRouter>,
      );
      const s = lastScale();
      expect(s.scale).toBeCloseTo(81.25, 2);
      expect(s.xMax - s.xMin).toBeLessThan(12);
    });

    it("切换到 lnx_x 默认点 (x₀=2.72) 时不得受 x₀=0.1 边界拖累下探到 y=-26.5", () => {
      render(
        <MemoryRouter>
          <DerivativeAnimation />
        </MemoryRouter>,
      );
      const lnxBtn = screen
        .getByText("f(x) = \\frac{\\ln x}{x}")
        .closest("button");
      expect(lnxBtn).not.toBeNull();
      fireEvent.click(lnxBtn!);

      const s = lastScale();
      expect(s.scale).toBeCloseTo(81.25, 2);
      expect(s.yMin).toBeGreaterThanOrEqual(-5);
    });
  });

  describe("P0-2 · /sequence-geometric 等比数列指数跃迁视觉保真", () => {
    it("q=2, a1=3, N=8 时散点横向跨度必须占画布 ≥ 50%，且禁止无断轴标记地将超界点叠在同一高度", () => {
      const { container } = render(
        <MemoryRouter>
          <GeometricPage />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByRole("slider", { name: "首项 a₁滑块" }), {
        target: { value: "3" },
      });
      fireEvent.change(screen.getByRole("slider", { name: "公比 q滑块" }), {
        target: { value: "2" },
      });
      fireEvent.change(screen.getByRole("slider", { name: "展示项数 N滑块" }), {
        target: { value: "8" },
      });

      const s = lastScale();
      // 离散序列横轴不得因 y 跨度而与纵轴锁死 1:1 比例
      expect(s.scaleX).toBeGreaterThan(45);

      const anNodes = Array.from(
        container.querySelectorAll('[data-seq-term-an="true"]'),
      );
      expect(anNodes.length).toBe(8);

      const xList = anNodes.map((n) =>
        Number(n.getAttribute("data-x") ?? n.getAttribute("cx") ?? "0"),
      );
      const xSpanPx = Math.max(...xList) - Math.min(...xList);
      expect(xSpanPx).toBeGreaterThanOrEqual(FULL_W * 0.5);

      // 不允许无断轴标记地将超界实心点全压在相同 y 像素；溢出点必须有显式断轴与截断标志
      const solidCircles = anNodes.filter(
        (n) => n.tagName.toLowerCase() === "circle",
      );
      const truncatedMarkers = anNodes.filter(
        (n) => n.getAttribute("data-truncated") === "true",
      );
      const hasAxisBreakMarker =
        container.querySelectorAll("[data-axis-break]").length > 0 &&
        (container.textContent ?? "").includes("截断");

      expect(truncatedMarkers.length).toBeGreaterThanOrEqual(1);
      expect(hasAxisBreakMarker).toBe(true);
      // 严禁把超界的实心点硬压到同一个顶部假坐标上
      const solidTopYs = solidCircles.map((c) =>
        Number(c.getAttribute("cy") ?? "0"),
      );
      expect(solidTopYs.filter((y) => Math.abs(y - 45) < 0.5).length).toBe(0);
    });
  });

  describe("P0-3 · /sequence-models 错位相减反虚假等高截断", () => {
    it("a1=1, d=1, q=2, N=8 时 c6=192/c7=448/c8=1024 不得无标记裁成等高平头柱", () => {
      const { container } = render(
        <MemoryRouter>
          <ModelsPage />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByRole("slider", { name: "首项 a₁滑块" }), {
        target: { value: "1" },
      });
      fireEvent.change(screen.getByRole("slider", { name: "公差 d滑块" }), {
        target: { value: "1" },
      });
      fireEvent.change(screen.getByRole("slider", { name: "公比 q滑块" }), {
        target: { value: "2" },
      });
      fireEvent.change(screen.getByRole("slider", { name: "展示项数 N滑块" }), {
        target: { value: "8" },
      });

      const barRects = Array.from(
        container.querySelectorAll("g.sequence-scene-arith-geo rect"),
      ).filter((r) => {
        const w = Number(r.getAttribute("width") ?? "0");
        return w > 10 && w < 50; // 排除顶部横幅大矩形
      });
      expect(barRects.length).toBeGreaterThanOrEqual(8);

      // c6, c7, c8 柱体高度要么各不相同，要么具备显式断轴截断标志
      const heights = barRects.map((r) =>
        Number(r.getAttribute("height") ?? "0"),
      );
      const tailHeights = heights.slice(-3);
      const allEqualTail =
        Math.abs(tailHeights[0] - tailHeights[1]) < 0.5 &&
        Math.abs(tailHeights[1] - tailHeights[2]) < 0.5;
      const hasBreakSymbol =
        container.querySelectorAll("[data-bar-truncated]").length > 0 ||
        (container.textContent ?? "").includes("截断");

      expect(!allEqualTail && hasBreakSymbol).toBe(true);
    });
  });

  describe("P1 · 视口缩放稳定性与参数因果律契约", () => {
    it("A 类 · CircleCircleAnimation 全半径范围 [0.5, 5] 拖动 scale 恒定不变", () => {
      render(
        <MemoryRouter>
          <CircleCircleAnimation />
        </MemoryRouter>,
      );
      const sDefault = lastScale().scale;

      fireEvent.change(
        screen.getByRole("slider", { name: "圆 O1 半径 r1滑块" }),
        { target: { value: "5" } },
      );
      const sMaxR1 = lastScale().scale;

      expect(sMaxR1).toBeCloseTo(sDefault, 6);
    });

    it("A 类 · InequalityBasicAnimation 半圆模式下 a,b 拉到 10 时 scale 与默认值完全相等", () => {
      render(
        <MemoryRouter>
          <InequalityBasicAnimation />
        </MemoryRouter>,
      );
      const sDefault = lastScale().scale;

      fireEvent.change(screen.getByRole("slider", { name: "正数 a滑块" }), {
        target: { value: "10" },
      });
      fireEvent.change(screen.getByRole("slider", { name: "正数 b滑块" }), {
        target: { value: "10" },
      });
      const sMax = lastScale().scale;

      expect(sMax).toBeCloseTo(sDefault, 6);
    });

    it("B 类 · QuadraticAnimation 参数小步微调不逐帧跳变 scale", () => {
      render(
        <MemoryRouter>
          <QuadraticAnimation />
        </MemoryRouter>,
      );

      // 调至 b=-4, c=-4 后，在 a=1.0 -> 1.1 -> 1.2 附近步进不该每动 0.1 就跳变一次小数 scale
      fireEvent.change(
        screen.getByRole("slider", { name: "一次项系数 b滑块" }),
        { target: { value: "-4" } },
      );
      fireEvent.change(screen.getByRole("slider", { name: "常数项 c滑块" }), {
        target: { value: "-4" },
      });

      fireEvent.change(
        screen.getByRole("slider", { name: "二次项系数 a滑块" }),
        { target: { value: "1" } },
      );
      const s1 = lastScale().scale;

      fireEvent.change(
        screen.getByRole("slider", { name: "二次项系数 a滑块" }),
        { target: { value: "1.1" } },
      );
      const s11 = lastScale().scale;

      fireEvent.change(
        screen.getByRole("slider", { name: "二次项系数 a滑块" }),
        { target: { value: "1.2" } },
      );
      const s12 = lastScale().scale;

      expect(s11).toBeCloseTo(s1, 6);
      expect(s12).toBeCloseTo(s1, 6);
    });
  });

  describe("P2 · useGaokaoView() 路由查询参数驱动", () => {
    it("ArithmeticPage 与 GeometricPage 从 useSearchParams 读取 ?view=gaokao 自动切入高考默认子模式", () => {
      const { container: arithContainer } = render(
        <MemoryRouter initialEntries={["/sequence-arithmetic?view=gaokao"]}>
          <ArithmeticPage />
        </MemoryRouter>,
      );
      expect(screen.getByText(/作差求通项/)).toBeInTheDocument();
      expect(arithContainer.textContent ?? "").toContain("分段定理");

      cleanup();

      render(
        <MemoryRouter initialEntries={["/sequence-geometric?view=gaokao"]}>
          <GeometricPage />
        </MemoryRouter>,
      );
      expect(screen.getByText("高考经典 · 错位相减推导")).toBeInTheDocument();
    });
  });
});
