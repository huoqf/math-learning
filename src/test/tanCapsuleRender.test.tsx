/**
 * src/test/tanCapsuleRender.test.tsx
 * 胶囊「渲染级」护栏：真渲染两个 Scene，从 DOM 读回底框宽高与字号，
 * 断言 DOM 里的几何仍然等于排版纯函数的预测。
 *
 * 为什么需要这一层：`calculateWarningCapsuleWidth` 的纯函数单测只能证明函数自身自洽。
 * 若 Scene 的 JSX 把渲染字号改成不来自 `TAN_CAPSULE_SPEC` 的字面量
 * （例如 `fontSize={fontScale(20)}`），纯函数单测**照绿**，而真实底框已溢出。
 * 本文件用真实渲染堵住这个缺口。
 */
import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { CANVAS_PRESETS } from "@/theme";
import { AnimationSvgCanvas } from "@/components/Layout/AnimationSvgCanvas";
import {
  calculateSceneScale,
  type SceneScale,
  type ViewportInfo,
} from "@/hooks";
import {
  calculateWarningCapsuleWidth,
  calculateWarningCapsuleHeight,
  estimateTextWidth,
  FONT_SCALE_MAX,
} from "@/utils";
import { getIdentityViewport } from "@/features/trigIdentity/math/trigIdentity";
import {
  TrigIdentityScene,
  TAN_CAPSULE_SPEC as IDENTITY_TAN_CAPSULE,
} from "@/features/trigIdentity/components/TrigIdentityScene";
import {
  TrigLinesComparisonScene,
  TAN_CAPSULE_SPEC as LINES_TAN_CAPSULE,
} from "@/features/trigLines/components/TrigLinesComparisonScene";

const { width: FULL_W, height: FULL_H } = CANVAS_PRESETS.full;

/** 标称 840×650 容器下的视口信息 */
const VP: ViewportInfo = {
  visibleX: 0,
  visibleY: 0,
  visibleW: FULL_W,
  visibleH: FULL_H,
  centerX: FULL_W / 2,
  centerY: FULL_H / 2,
  scale: 1,
  tx: 0,
  ty: 0,
  transform: "",
  designVisibleW: FULL_W,
  designVisibleH: FULL_H,
  designLeft: 0,
  designTop: 0,
};

const scaleOf = (
  xRange: [number, number],
  yRange: [number, number],
): SceneScale =>
  calculateSceneScale({
    designVisibleW: FULL_W,
    designVisibleH: FULL_H,
    designLeft: 0,
    designTop: 0,
    xRange,
    yRange,
  });

/** 三角恒等：几何子模式视口（±2.0 / ±1.5） */
const IDENTITY_SCALE = scaleOf(
  getIdentityViewport("identity", "geometry").xRange,
  getIdentityViewport("identity", "geometry").yRange,
);
/** 正切线比较页：TrigLinesAnimation 声明的视口 ±1.6 */
const LINES_SCALE = scaleOf([-1.6, 1.6], [-1.6, 1.6]);

/**
 * 两档字号工况。「字号钳制上界」取 `useCanvasSize.ts` 导出的 `FONT_SCALE_MAX`
 * （即 `clamp(v * scale, FONT_SCALE_MIN, FONT_SCALE_MAX)` 的上界），容器再放大也不会超过它。
 */
const FONT_CASES: { label: string; fontScale: (v: number) => number }[] = [
  { label: "标称容器", fontScale: (v) => v },
  {
    label: "容器放大至字号钳制上界",
    fontScale: (v) => Math.min(v * 1.6, FONT_SCALE_MAX),
  },
];

/** 底框 rect 与 text 是同一 <g> 内的兄弟节点，按文案定位后取前一个兄弟 */
function readCapsule(container: HTMLElement, text: string) {
  const textEl = Array.from(container.querySelectorAll("text")).find(
    (el) => el.textContent === text,
  );
  if (!textEl) throw new Error(`未渲染出胶囊文案：${text}`);
  const rect = textEl.previousElementSibling as SVGRectElement;
  return {
    text: textEl.textContent ?? "",
    fontPx: Number(textEl.getAttribute("font-size")),
    width: Number(rect.getAttribute("width")),
    height: Number(rect.getAttribute("height")),
  };
}

/**
 * 与生产一致：Scene 自身不含 <svg>，由 AnimationSvgCanvas 提供 SVG 命名空间容器
 * （直接用 render 渲染裸 <g>/<rect> 会被 React 当成 HTML 标签并告警）。
 */
function renderInCanvas(children: React.ReactNode) {
  return render(
    <AnimationSvgCanvas
      containerRef={{ current: null }}
      transform={VP.transform}
    >
      {children}
    </AnimationSvgCanvas>,
  );
}

describe("胶囊渲染级护栏：DOM 几何必须等于排版纯函数的预测", () => {
  /** 每个场景都处在「正切被裁掉」状态，必然渲染出提示胶囊 */
  const scenes = [
    {
      name: "三角恒等 · 正切超出视口",
      spec: IDENTITY_TAN_CAPSULE,
      // |tan 80°| = 5.67 > 可见 yMax 1.548 ⇒ 走胶囊分支
      render: (fontScale: (v: number) => number) =>
        renderInCanvas(
          <TrigIdentityScene
            params={{ alphaDeg: 80 }}
            scale={IDENTITY_SCALE}
            vp={VP}
            onParamChange={() => {}}
            fontScale={fontScale}
            studyMode="identity"
            identitySubMode="geometry"
          />,
        ),
    },
    {
      name: "正切线比较 · 正切超出视口",
      spec: LINES_TAN_CAPSULE,
      // tan 70° = 2.75 > 可见 yMax 1.6 ⇒ 走胶囊分支
      render: (fontScale: (v: number) => number) =>
        renderInCanvas(
          <TrigLinesComparisonScene
            params={{ compAlphaDeg: 70 }}
            scale={LINES_SCALE}
            vp={VP}
            onParamChange={() => {}}
            fontScale={fontScale}
            centerPt={{ x: FULL_W / 2, y: FULL_H / 2 }}
            aDesign={{ x: FULL_W / 2 + LINES_SCALE.scaleX, y: FULL_H / 2 }}
            unitRadiusPx={LINES_SCALE.scaleX}
          />,
        ),
    },
  ];

  for (const scene of scenes) {
    for (const { label, fontScale } of FONT_CASES) {
      it(`${scene.name} @ ${label}：DOM 宽高 = 纯函数预测，且文本不溢出`, () => {
        const { container, unmount } = scene.render(fontScale);
        try {
          const cap = readCapsule(container, scene.spec.text);

          // 1. 文案与字号必须分别来自 spec 与 fontScale（不得各写一份字面量）
          expect(cap.text).toBe(scene.spec.text);
          expect(cap.fontPx).toBe(fontScale(scene.spec.baseFontPx));

          // 2. DOM 几何必须逐位等于纯函数的预测值
          expect(cap.width).toBe(
            calculateWarningCapsuleWidth(
              scene.spec.text,
              cap.fontPx,
              scene.spec.minWidth,
            ),
          );
          expect(cap.height).toBe(calculateWarningCapsuleHeight(cap.fontPx));

          // 3. 真实不溢出：底框不窄于声明下限，且给文案留出 >= 20px 内边距
          expect(cap.width).toBeGreaterThanOrEqual(scene.spec.minWidth);
          expect(cap.width).toBeGreaterThan(
            estimateTextWidth(cap.text, cap.fontPx) + 20,
          );
          expect(cap.height).toBeGreaterThanOrEqual(cap.fontPx + 6);
        } finally {
          unmount();
        }
      });
    }
  }

  it("极限档确实触到字号上界 16px（否则该档守护力为 0）", () => {
    const extreme = FONT_CASES[1].fontScale;
    expect(extreme(IDENTITY_TAN_CAPSULE.baseFontPx)).toBe(16);
    expect(extreme(LINES_TAN_CAPSULE.baseFontPx)).toBe(16);
  });
});
