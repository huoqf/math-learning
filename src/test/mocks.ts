import { vi } from "vitest";
import type { RefObject } from "react";

const createFontFn = (v: number) => Math.min(Math.max(v, 7), 16);

export const mockCanvasSize = {
  width: 840,
  height: 650,
  scale: 1,
  rawScale: 1,
  px: (v: number) => v,
  font: createFontFn,
};

export const mockVp = {
  visibleX: 0,
  visibleY: 0,
  visibleW: 840,
  visibleH: 650,
  centerX: 420,
  centerY: 325,
  scale: 1,
  tx: 0,
  ty: 0,
  transform: "translate(0 0) scale(1)",
  designVisibleW: 840,
  designVisibleH: 650,
  designLeft: 0,
  designTop: 0,
};

export const mockScale = {
  scaleX: 70,
  scaleY: 72.2,
  scale: 70,
  originX: 420,
  originY: 325,
  xMin: -6,
  xMax: 6,
  yMin: -4.5,
  yMax: 4.5,
};

export const mockContainerRef = {
  current: null,
} as RefObject<HTMLDivElement | null>;

vi.mock("@/hooks", () => ({
  useAnimationViewport: () => ({
    containerRef: mockContainerRef,
    canvasSize: mockCanvasSize,
    vp: mockVp,
    preset: { width: 840, height: 650 },
  }),
  useSceneScale: () => mockScale,
  useAnimationLifecycle: vi.fn(),
}));
