/**
 * src/test/radianMeasureSceneRender.test.tsx
 * 「弧度制与扇形」中屏契约（2026-10-03 新增）。
 *
 * 本页的中屏几何有两类「单尺寸测试看不出来」的坑，故把四条不变量钉成机器可裁决的契约：
 *
 *   ① **标注尺寸跨分辨率不变**：标注几何量若经过视口倍率（曾写 `const px = (v) => v * vp.scale`），
 *      屏幕长度会成 `v × vp.scale²` —— 基准窗口（`vp.scale ≈ 1`）下与正确值几乎重合、完全隐形，
 *      换窗口即漂移。故断言「角标记弧半径 ÷ 主圆半径」严格等于 `sceneGeometry` 声明的比例。
 *   ② **优角弧的扫掠方向**：屏幕 y 轴向下，数学逆时针对应 SVG `sweep-flag = 0`，
 *      且优弧必须由 `α > π` 判 `large-arc-flag`（曾用 atan2 反解屏幕角差，
 *      在 π 处归一化到 (−π, π] 导致优角反向坍塌）。
 *   ③ **整角分支可达**：α 的两个入口都被 `ParamControl.snapToStep` 吸附到 `min + n·step`
 *      网格并 `toFixed(2)`，声明域上界 6.2832 实际只能拖到 6.28、距 2π 有 0.0032；
 *      若整角容差仍取 `1e−4`，双半圆路径与同心圆角标记**永不可达**（曾如此，
 *      且滑块拖到头时主弧会以两条相距 0.0032·r 的端点去套 `A` 命令）。
 *   ④ **原点标签唯一**：页面自绘 O，网格必须关闭自己的原点标签，否则同一处重叠两个 O。
 */

import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";

import { calculateSceneScale, type SceneScale } from "@/hooks/useSceneScale";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import type { ViewportInfo } from "@/utils/useViewport";
import { RadianMeasureScene } from "@/features/radianMeasure/components/RadianMeasureScene";
import {
  ANGLE_ARC_R_RATIO,
  ANGLE_LABEL_GAP_RATIO,
  RADIAN_MEASURE_XRANGE,
  RADIAN_MEASURE_YRANGE,
} from "@/features/radianMeasure/sceneGeometry";

const PRESET = CANVAS_PRESETS.square;
const fontScale = (v: number) => v;
const TAU = Math.PI * 2;

/**
 * 按 `useViewport` 的真实算式现造视口（不手抄常数）：
 * `scale = min(W / designW, H / designH)`、`tx/ty` 为居中留白。
 */
function makeViewport(containerW: number, containerH: number): ViewportInfo {
  const scale = Math.min(containerW / PRESET.width, containerH / PRESET.height);
  const tx = (containerW - PRESET.width * scale) / 2;
  const ty = (containerH - PRESET.height * scale) / 2;
  return {
    visibleX: 0,
    visibleY: 0,
    visibleW: containerW,
    visibleH: containerH,
    centerX: containerW / 2,
    centerY: containerH / 2,
    scale,
    tx,
    ty,
    transform: `translate(${tx} ${ty}) scale(${scale})`,
    designVisibleW: containerW / scale,
    designVisibleH: containerH / scale,
    designLeft: -tx / scale,
    designTop: -ty / scale,
  };
}

/** 与页面同源的比例尺（`xRange` / `yRange` 取自 sceneGeometry，不手抄） */
function scaleOf(vp: ViewportInfo): SceneScale {
  return calculateSceneScale({
    designVisibleW: vp.designVisibleW,
    designVisibleH: vp.designVisibleH,
    designLeft: vp.designLeft,
    designTop: vp.designTop,
    xRange: RADIAN_MEASURE_XRANGE,
    yRange: RADIAN_MEASURE_YRANGE,
  });
}

/**
 * 三种真实中屏容器：
 *  · 0.99 / 1.375 两档对应实测过的 1100×700 与 1600×950 窗口（容器近正方形，`scale` 差 1.4 倍）；
 *  · 1000×650 是宽窗：`min(designVisibleW, designVisibleH)` 仍为 preset 边长，但横向可视区更宽。
 */
const VIEWPORTS: Array<[string, ViewportInfo]> = [
  ["矮窗 644×644", makeViewport(644, 644)],
  ["高窗 894×894", makeViewport(894, 894)],
  ["宽窗 1000×650", makeViewport(1000, 650)],
];

function renderScene(
  vp: ViewportInfo,
  alphaRad: number,
  options?: {
    radius?: number;
    studyMode?: "definition" | "conversion" | "arcSector";
  },
) {
  const scale = scaleOf(vp);
  const { container, unmount } = render(
    <svg width={PRESET.width} height={PRESET.height}>
      <RadianMeasureScene
        params={{ alphaRad, radius: options?.radius ?? 1.5 }}
        scale={scale}
        vp={vp}
        onParamChange={() => {}}
        fontScale={fontScale}
        studyMode={options?.studyMode ?? "arcSector"}
      />
    </svg>,
  );
  return { container, scale, unmount };
}

/** 主圆（唯一 stroke-width = 1.5 的 circle）与角标记弧（stroke-width = 1.6 的 path / circle） */
function queryMainCircle(container: HTMLElement): SVGElement {
  const found = [...container.querySelectorAll("circle")].find(
    (c) => c.getAttribute("stroke-width") === "1.5",
  );
  expect(found, "未找到主参考圆（stroke-width = 1.5 的 circle）").toBeTruthy();
  return found as SVGElement;
}

function queryAngleMarkPath(container: HTMLElement): SVGPathElement {
  const found = [...container.querySelectorAll("path")].find(
    (p) =>
      p.getAttribute("stroke") === MATH_COLORS.paramPrimary &&
      p.getAttribute("stroke-width") === "1.6",
  );
  expect(
    found,
    "未找到圆心角标记弧（paramPrimary / stroke-width = 1.6 的 path）",
  ).toBeTruthy();
  return found as SVGPathElement;
}

describe("弧度制与扇形中屏契约", () => {
  it("角标记弧半径 ÷ 主圆半径 在任意视口下恒等于声明比例（标注量不得经过视口倍率）", () => {
    for (const [name, vp] of VIEWPORTS) {
      const { container, unmount } = renderScene(vp, Math.PI / 3);
      const mainR = Number(queryMainCircle(container).getAttribute("r"));
      const d = queryAngleMarkPath(container).getAttribute("d") ?? "";
      // 形如 "M x y A rax ray 0 largeArc sweep ex ey"
      const parsed = /^M ([\d.eE+-]+) ([\d.eE+-]+) A ([\d.eE+-]+)/.exec(d);
      expect(parsed, `[${name}] 角标记弧 d 不可解析：${d}`).not.toBeNull();

      const angleArcR = Number(parsed![3]);
      expect(
        angleArcR / mainR,
        `[${name}] 角标记弧半径 ${angleArcR.toFixed(3)} / 主圆半径 ${mainR.toFixed(3)} 偏离声明比例 ${ANGLE_ARC_R_RATIO}`,
      ).toBeCloseTo(ANGLE_ARC_R_RATIO, 10);

      unmount();
    }
  });

  it("α 标签落在角平分方向，距圆心 = 角标记弧半径 + 声明间隙（同样不随视口漂移）", () => {
    const alpha = (2 * Math.PI) / 3;
    for (const [name, vp] of VIEWPORTS) {
      const { container, scale, unmount } = renderScene(vp, alpha);
      const mainR = Number(queryMainCircle(container).getAttribute("r"));

      const alphaLabel = [...container.querySelectorAll("text")].find(
        (t) => t.textContent === "α",
      );
      expect(alphaLabel, `[${name}] 未找到 α 标签`).toBeTruthy();

      const pO = mathToDesign(0, 0, scale);
      const lx = Number(alphaLabel!.getAttribute("x"));
      const ly = Number(alphaLabel!.getAttribute("y"));
      const dist = Math.hypot(lx - pO.x, ly - pO.y);

      const expectedDist =
        mainR * ANGLE_ARC_R_RATIO + mainR * ANGLE_LABEL_GAP_RATIO;
      expect(
        dist,
        `[${name}] α 标签距圆心 ${dist.toFixed(3)} 偏离期望 ${expectedDist.toFixed(3)}`,
      ).toBeCloseTo(expectedDist, 8);

      // 方向必须落在角平分线 α/2 上（屏幕 y 轴向下 ⟹ 取负正弦）
      const dirScreen = (Math.atan2(ly - pO.y, lx - pO.x) * 180) / Math.PI;
      const expectedDir = -(alpha / 2) * (180 / Math.PI);
      expect(
        dirScreen,
        `[${name}] α 标签方向 ${dirScreen.toFixed(2)}° 偏离 ${expectedDir.toFixed(2)}°`,
      ).toBeCloseTo(expectedDir, 6);

      unmount();
    }
  });

  it("优角 α = 3π/2：主弧 large-arc-flag = 1、sweep-flag = 0，终点落在 270° 方向", () => {
    const alpha = (3 * Math.PI) / 2;
    const radius = 1.5;
    for (const [name, vp] of VIEWPORTS) {
      const { container, scale, unmount } = renderScene(vp, alpha, { radius });

      const mainArc = [...container.querySelectorAll("path")].find(
        (p) =>
          p.getAttribute("stroke") === MATH_COLORS.paramTertiary &&
          p.getAttribute("stroke-width") === "4",
      );
      expect(mainArc, `[${name}] 未找到主圆弧`).toBeTruthy();

      const d = mainArc!.getAttribute("d") ?? "";
      const parsed =
        /^M ([\d.eE+-]+) ([\d.eE+-]+) A ([\d.eE+-]+) ([\d.eE+-]+) 0 (\d) (\d) ([\d.eE+-]+) ([\d.eE+-]+)$/.exec(
          d,
        );
      expect(parsed, `[${name}] 主弧 d 不可解析：${d}`).not.toBeNull();

      const [, , , , , largeArc, sweep, endX, endY] = parsed!;
      expect(largeArc, `[${name}] 优角必须置 large-arc-flag = 1`).toBe("1");
      expect(sweep, `[${name}] 数学逆时针在屏幕坐标系对应 sweep-flag = 0`).toBe(
        "0",
      );

      const expected = mathToDesign(
        radius * Math.cos(alpha),
        radius * Math.sin(alpha),
        scale,
      );
      expect(Number(endX), `[${name}] 弧终点 x`).toBeCloseTo(expected.x, 6);
      expect(
        Number(endY),
        `[${name}] 弧终点 y（3π/2 终边指向屏幕下方）`,
      ).toBeCloseTo(expected.y, 6);
      expect(
        expected.y,
        `[${name}] 3π/2 终边在负 y 方向 ⟹ design y 必须大于圆心 y`,
      ).toBeGreaterThan(mathToDesign(0, 0, scale).y);

      unmount();
    }
  });

  it("整角分支可达：α 取声明域可达上界 6.28 时走双半圆路径 + 同心圆角标记", () => {
    // ParamControl.snapToStep 把 α 吸附到 0.01 网格并 toFixed(2)，声明域上界 6.2832 实际只能到 6.28
    const reachableMax = 6.28;
    expect(reachableMax).toBeLessThan(TAU);
    expect(
      Math.abs(reachableMax - TAU),
      "可达上界必须落在半个吸附格距（0.005）容差内，否则整角分支不可达",
    ).toBeLessThan(0.005);

    for (const [name, vp] of VIEWPORTS) {
      const { container, unmount } = renderScene(vp, reachableMax);

      const mainArc = [...container.querySelectorAll("path")].find(
        (p) =>
          p.getAttribute("stroke") === MATH_COLORS.paramTertiary &&
          p.getAttribute("stroke-width") === "4",
      );
      expect(mainArc, `[${name}] 未找到主圆弧`).toBeTruthy();
      const d = mainArc!.getAttribute("d") ?? "";
      expect(
        (d.match(/A /g) ?? []).length,
        `[${name}] 整角应由两段半圆拼成，实际 d = ${d}`,
      ).toBe(2);
      // 两段半圆的端点必须是圆上左右两个极点（不经 A/起点，避免起终点重合的退化弧）
      const pO = mathToDesign(0, 0, scaleOf(vp));
      const r = Number(queryMainCircle(container).getAttribute("r"));
      expect(d).toContain(`M ${pO.x - r} ${pO.y}`);

      // 角标记退化为完整同心圆，而不是一条起终点几乎重合的弧
      const angleMarkCircle = [...container.querySelectorAll("circle")].find(
        (c) =>
          c.getAttribute("stroke") === MATH_COLORS.paramPrimary &&
          c.getAttribute("stroke-width") === "1.6",
      );
      expect(
        angleMarkCircle,
        `[${name}] 整角时角标记应为 <circle>`,
      ).toBeTruthy();
      expect(Number(angleMarkCircle!.getAttribute("r"))).toBeCloseTo(
        r * ANGLE_ARC_R_RATIO,
        8,
      );

      unmount();
    }
  });

  it("原点标签唯一：页面自绘 O 且网格已关闭自己的原点标签", () => {
    for (const studyMode of [
      "definition",
      "conversion",
      "arcSector",
    ] as const) {
      const { container, unmount } = renderScene(
        makeViewport(894, 894),
        Math.PI / 3,
        {
          studyMode,
        },
      );
      const originLabels = [...container.querySelectorAll("text")].filter(
        (t) => t.textContent === "O",
      );
      expect(
        originLabels.length,
        `[${studyMode}] 原点标签出现 ${originLabels.length} 次（CoordinateGrid 的 showOriginLabel 未关闭？）`,
      ).toBe(1);

      unmount();
    }
  });

  it("三种模式真实渲染（组件不 mock）产出的 SVG 不含 NaN，且画布只写符号不落浮点读数", () => {
    for (const studyMode of [
      "definition",
      "conversion",
      "arcSector",
    ] as const) {
      const { container, unmount } = renderScene(
        makeViewport(894, 894),
        (3 * Math.PI) / 2,
        {
          studyMode,
        },
      );

      const markup = container.innerHTML;
      expect(markup, `[${studyMode}] SVG 中混入了 NaN 坐标`).not.toContain(
        "NaN",
      );
      expect(markup, `[${studyMode}] 未挂载场景根节点`).toContain(
        "radian-measure-scene",
      );

      const texts = [...container.querySelectorAll("text")].map(
        (el) => el.textContent ?? "",
      );
      // 轴刻度是纯整数；其余一律为符号 / 代号（读数归右屏看板）
      const illegal = texts.filter((t) => /\d+\.\d+/.test(t));
      expect(
        illegal,
        `[${studyMode}] 中屏出现浮点读数：${illegal.join(" | ")}`,
      ).toEqual([]);
      expect(texts, `[${studyMode}] 缺少符号标签`).toEqual(
        expect.arrayContaining(["α", "r"]),
      );

      unmount();
    }
  });
});
