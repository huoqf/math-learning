/**
 * InteractivePoint 边缘投影手柄（Edge Clamp Projection）契约测试。
 *
 * 背景：全站 smoke 测试一律把 `InteractivePoint` mock 成 `() => null`，
 * 因此「手柄飞出画布即失联」这一类缺陷在既有测试网下**结构上不可能被发现**。
 * 本文件是该能力唯一的守门人，故必须把「默认关闭 = 旧行为逐像素不变」也一并钉死。
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InteractivePoint } from "@/components/Math/InteractivePoint";
import { INTERACTIVE_POINT_GEOMETRY } from "@/components/Math/pointGeometry";
import { calculateSceneScale } from "@/hooks/useSceneScale";

/**
 * 固定视口：绘图区 design 区间 x∈[-5,5]、y∈[-4,4]，1:1 比例尺 75px/单位。
 * 由 calculateSceneScale 推导（而非手写常数），保证与运行时同源：
 *   scale = min(800/10, 600/8) = 75
 *   originX = 20 + 800/2 = 420 ；originY = 20 + 600/2 = 320
 *   plotTop = 320 - 4*75 = 20 ；plotBottom = 320 + 4*75 = 620
 */
const scale = calculateSceneScale({
  designVisibleW: 800,
  designVisibleH: 600,
  designLeft: 20,
  designTop: 20,
  xRange: [-5, 5],
  yRange: [-4, 4],
});

const PLOT_TOP = 20;
const PLOT_BOTTOM = 620;
const INSET = INTERACTIVE_POINT_GEOMETRY.edgeProjectionInset;

/** 半径 r 的默认核心圆点；halo 为 r+4、命中圈为 r+10，故 r=6 唯一 */
const CORE_DOT_R = String(INTERACTIVE_POINT_GEOMETRY.defaultR);
/** 透明命中圈半径 r + 10，是「手柄是否可被按住」的唯一判据 */
const HIT_AREA_R = String(INTERACTIVE_POINT_GEOMETRY.defaultR + 10);

interface RenderOptions {
  cx: number;
  cy: number;
  edgeClampProjection?: boolean;
}

function renderPoint({ cx, cy, edgeClampProjection }: RenderOptions) {
  const { container } = render(
    <svg>
      <InteractivePoint
        cx={cx}
        cy={cy}
        scale={scale}
        edgeClampProjection={edgeClampProjection}
      />
    </svg>,
  );
  const circles = Array.from(container.querySelectorAll("circle"));
  const core = circles.find((c) => c.getAttribute("r") === CORE_DOT_R);
  const hit = circles.find((c) => c.getAttribute("r") === HIT_AREA_R);
  const connector = container.querySelector("line");
  return { core, hit, connector };
}

const num = (el: Element | null | undefined, attr: string) =>
  el ? Number(el.getAttribute(attr)) : Number.NaN;

describe("InteractivePoint 边缘投影手柄", () => {
  it("默认关闭时保持旧行为：上越界的手柄仍渲染在真实位置，且不画方向引线", () => {
    const { core, connector } = renderPoint({ cx: 0, cy: 100 });
    // 真实设计坐标 y = 320 - 100*75 = -7180，远在画布之外
    expect(core).toBeTruthy();
    expect(num(core, "cy")).toBe(-7180);
    expect(connector).toBeNull();
  });

  it("开启后上越界：手柄吸附到绘图区上边界内侧，并画指向边界的虚线引线", () => {
    const { core, hit, connector } = renderPoint({
      cx: 0,
      cy: 100,
      edgeClampProjection: true,
    });
    expect(num(core, "cy")).toBe(PLOT_TOP + INSET);
    // 水平位置绝不改动：投影只做垂直吸附
    expect(num(core, "cx")).toBe(420);
    expect(connector).not.toBeNull();
    expect(num(connector, "x1")).toBe(420);
    expect(num(connector, "y1")).toBe(PLOT_TOP + INSET);
    expect(num(connector, "x2")).toBe(420);
    expect(num(connector, "y2")).toBe(PLOT_TOP);
    // 命中圈必须跟随投影位置 —— 这是「可按住投影点拖回」的物理前提
    expect(num(hit, "cy")).toBe(PLOT_TOP + INSET);
    expect(num(hit, "cx")).toBe(420);
  });

  it("开启后下越界：手柄吸附到绘图区下边界内侧，引线方向朝下", () => {
    const { core, connector } = renderPoint({
      cx: 0,
      cy: -100,
      edgeClampProjection: true,
    });
    expect(num(core, "cy")).toBe(PLOT_BOTTOM - INSET);
    expect(num(connector, "y1")).toBe(PLOT_BOTTOM - INSET);
    expect(num(connector, "y2")).toBe(PLOT_BOTTOM);
  });

  it("开启后未越界：渲染位置与真实位置完全一致，且不产生任何额外图元", () => {
    const { core, connector } = renderPoint({
      cx: 1,
      cy: 2,
      edgeClampProjection: true,
    });
    // 设计坐标：x = 420 + 1*75 = 495 ；y = 320 - 2*75 = 170
    expect(num(core, "cx")).toBe(495);
    expect(num(core, "cy")).toBe(170);
    expect(connector).toBeNull();
  });

  it("边界恰好在绘图区内外沿时按「未越界」处理，不做多余吸附", () => {
    const { core, connector } = renderPoint({
      cx: 0,
      cy: 4,
      edgeClampProjection: true,
    });
    expect(num(core, "cy")).toBe(PLOT_TOP);
    expect(connector).toBeNull();
  });

  it("开启后横向右越界：手柄吸附到绘图区右边界内侧，引线指向右边界", () => {
    const { core, hit, connector } = renderPoint({
      cx: 10, // 远超 xMax = 5
      cy: 0,
      edgeClampProjection: true,
    });
    const plotRight = 820; // 20 + 800
    expect(num(core, "cx")).toBe(plotRight - INSET);
    expect(num(core, "cy")).toBe(320); // 纵轴不越界保持原位
    expect(connector).not.toBeNull();
    expect(num(connector, "x1")).toBe(plotRight - INSET);
    expect(num(connector, "y1")).toBe(320);
    expect(num(connector, "x2")).toBe(plotRight);
    expect(num(connector, "y2")).toBe(320);
    expect(num(hit, "cx")).toBe(plotRight - INSET);
  });

  it("开启后右上双向越界：手柄吸附在右上角内侧，引线斜向指向右上顶点", () => {
    const { core, connector } = renderPoint({
      cx: 10, // 右越界
      cy: 10, // 上越界
      edgeClampProjection: true,
    });
    const plotRight = 820;
    expect(num(core, "cx")).toBe(plotRight - INSET);
    expect(num(core, "cy")).toBe(PLOT_TOP + INSET);
    expect(connector).not.toBeNull();
    expect(num(connector, "x1")).toBe(plotRight - INSET);
    expect(num(connector, "y1")).toBe(PLOT_TOP + INSET);
    expect(num(connector, "x2")).toBe(plotRight);
    expect(num(connector, "y2")).toBe(PLOT_TOP);
  });
});
