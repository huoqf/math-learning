/**
 * src/test/trigModelSceneRender.test.tsx
 * 「三角函数模型应用」中屏契约（2026-10-03 新增，随页面一同落地）。
 *
 * 本页的中屏视口是**固定**的（不像多数页面那样跟着参数自动取景），
 * 而参数声明域又相对宽（A ∈ [0.5, 3]、T ∈ [2, 13]、t = tRatio × T ≤ 13、k ∈ [−1, 3]）。
 * 两者必须严格闭环，否则会出现本仓最忌讳的「滑块读数合法、点却已在画布之外」。
 * 故此处把三条不变量钉成机器可裁决的契约：
 *
 *   ① **可达即可见**：在声明域端点与 step 网格上枚举参数组合，
 *      曲线、观测点 P、峰值点、平衡线与两条极值线必须全部落在可见设计矩形 [0,840]×[0,650] 内；
 *   ② **无 NaN 污染**：三种模式真实渲染（组件不 mock）产出的 SVG 中不得出现 "NaN"，
 *      杜绝 mathToDesign 误用 / 除零 / 视口外坐标撑爆路径；
 *   ③ **画布只写符号**：中屏 <text> 文本不得出现浮点读数（具体读数归右屏看板）；
 *   ④ **顶部安全带不被侵占**：悬浮解析式窗由 CSS 像素定高、不随画布缩放，
 *      纵轴顶端 / 纵轴整数刻度 / 一周期标尺都必须落在它的下沿之下，
 *      且标尺的两条端刻度线必须有实际长度。
 *      ⚠️ 本页两类定位量都以 **CSS 像素** 声明，换算进 design 坐标必须**除以** `vp.scale`：
 *      ① 基准量（安全带下沿）用 `topChromeBottomY` 的 `(PX − ty) / scale`；
 *      ② 相对偏移量（标尺 / 刻度 / 特征线标签）用 `cssToDesignLength(vp, css)`。
 *      历史上这里连踩两坑：先是把定位量喂给 `fontScale = clamp(v*scale, 7, 16)`（截断成零长度），
 *      后是改成 `v * vp.scale`（方向反了，屏幕长度成 `v × scale²`，本文件一度把该错误写进期望值）。
 */

import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";

import { calculateSceneScale, type SceneScale } from "@/hooks/useSceneScale";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { paramMeta } from "@/data/registries/trigModel";
import { buildHarmonicModel, harmonicValue } from "@/math/trigModel";
import { TrigModelScene } from "@/features/trigModel/components/TrigModelScene";
import {
  SPAN_TICK_BOTTOM_DY,
  SPAN_TICK_TOP_DY,
  TRIG_MODEL_XRANGE,
  TRIG_MODEL_YRANGE,
  topChromeBottomY,
} from "@/features/trigModel/viewport";

const DESIGN_W = CANVAS_PRESETS.full.width;
const DESIGN_H = CANVAS_PRESETS.full.height;

/** 按页面真实视口参数现算比例尺（与 useSceneScale 同源，不手抄常数） */
const scale: SceneScale = calculateSceneScale({
  designVisibleW: DESIGN_W,
  designVisibleH: DESIGN_H,
  designLeft: 0,
  designTop: 0,
  xRange: TRIG_MODEL_XRANGE,
  yRange: TRIG_MODEL_YRANGE,
});

/** 视口信息（TriggerModelScene 只把 vp 透传给 InteractivePoint 做拖拽逆变换） */
const vp = {
  tx: 0,
  ty: 0,
  scale: 1,
  svgWidth: DESIGN_W,
  svgHeight: DESIGN_H,
  transform: "",
  designVisibleW: DESIGN_W,
  designVisibleH: DESIGN_H,
  designLeft: 0,
  designTop: 0,
} as unknown as Parameters<typeof TrigModelScene>[0]["vp"];

const fontScale = (v: number) => v;

/**
 * 真实容器（比设计框更「高」）下标定的视口参数 —— 实测来源：
 * 1600×950 窗口下中屏容器约 1000×894 CSS px ⇒ `translate(0 60) scale(1.2)`、
 * 可见 design 高度 750（> 设计框 650）。
 * 正是这种情形会让纵轴自然冲出设计框顶边，故顶部安全带必须按 CSS 像素换算而非写死 design 常数。
 */
const TALL_VP = {
  tx: 0,
  ty: 60,
  scale: 1.2,
  transform: "translate(0 60) scale(1.2)",
  svgWidth: 1000,
  svgHeight: 894,
  designVisibleW: 840,
  designVisibleH: 750,
  designLeft: 0,
  designTop: -50,
} as unknown as Parameters<typeof TrigModelScene>[0]["vp"];

/** 与 TALL_VP 严格同源的比例尺（designTop / designVisibleH 必须一致，否则不是同一个视口） */
const tallScale: SceneScale = calculateSceneScale({
  designVisibleW: TALL_VP.designVisibleW,
  designVisibleH: TALL_VP.designVisibleH,
  designLeft: TALL_VP.designLeft,
  designTop: TALL_VP.designTop,
  xRange: TRIG_MODEL_XRANGE,
  yRange: TRIG_MODEL_YRANGE,
});

/** 取某个参数的「声明域端点 + 全部 marks + 默认值」，覆盖学生真正能拖到的极值 */
function probeValues(key: string): number[] {
  const meta = paramMeta[key];
  const values = [meta.min, meta.max, meta.defaultValue ?? meta.min];
  for (const mark of meta.marks ?? []) values.push(mark.value);
  return [...new Set(values)];
}

describe("三角函数模型应用中屏契约", () => {
  it("声明域内任意可达组合下，曲线与全部关键点都落在可见设计矩形内", () => {
    const violations: string[] = [];
    const inside = (x: number, y: number) =>
      Number.isFinite(x) &&
      Number.isFinite(y) &&
      x >= 0 &&
      x <= DESIGN_W &&
      y >= 0 &&
      y <= DESIGN_H;

    for (const A of probeValues("A")) {
      for (const period of probeValues("period")) {
        for (const phi of probeValues("phi")) {
          for (const k of probeValues("k")) {
            for (const tRatio of probeValues("tRatio")) {
              const model = buildHarmonicModel(A, period, phi, k);
              const tProbe = tRatio * model.period;

              const checks: Array<[string, number, number]> = [
                ["观测点 P", tProbe, harmonicValue(model, tProbe)],
                ["波峰", model.maxTime, model.maxValue],
                ["波谷", model.minTime, model.minValue],
                ["平衡线右端", scale.xMax, model.balance],
                ["最大值线右端", scale.xMax, model.maxValue],
                ["最小值线右端", scale.xMax, model.minValue],
                ["一周期标尺右端", model.period, 0],
              ];

              for (const [name, mx, my] of checks) {
                const pt = mathToDesign(mx, my, scale);
                if (!inside(pt.x, pt.y)) {
                  violations.push(
                    `A=${A} T=${period} φ=${phi.toFixed(4)} k=${k} tRatio=${tRatio} → ${name} 越出画布 (${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})`,
                  );
                }
              }
            }
          }
        }
      }
    }

    expect(
      violations.slice(0, 12),
      `共 ${violations.length} 处关键点越出可见画布，请在「参数声明域」与「固定视口」之间取齐：\n${violations.slice(0, 12).join("\n")}`,
    ).toEqual([]);
  });

  it("三种模式真实渲染（组件不 mock）产出的 SVG 不含 NaN，且观测点手柄存在", () => {
    for (const studyMode of ["harmonic", "fromGraph", "modeling"] as const) {
      const { container, unmount } = render(
        <svg width={DESIGN_W} height={DESIGN_H}>
          <TrigModelScene
            params={{
              A: 1.5,
              period: 12,
              phi: -Math.PI / 2,
              k: 2.5,
              tRatio: 0.25,
            }}
            scale={scale}
            vp={vp}
            onParamChange={() => {}}
            fontScale={fontScale}
            studyMode={studyMode}
          />
        </svg>,
      );

      const markup = container.innerHTML;
      expect(markup, `[${studyMode}] SVG 中混入了 NaN 坐标`).not.toContain(
        "NaN",
      );
      expect(markup, `[${studyMode}] 未挂载场景根节点`).toContain(
        "trig-model-scene",
      );
      // 曲线路径必须真的画出来（FunctionGraph 非空 d）
      expect(
        container.querySelectorAll("path").length,
        `[${studyMode}] 主曲线与扇形路径缺失`,
      ).toBeGreaterThan(0);
      // 观测点手柄：InteractivePoint 的命中区半径 = r + 10
      expect(
        container.querySelector('circle[r="17"]'),
        `[${studyMode}] 缺少观测点 P 的可拖拽手柄`,
      ).not.toBeNull();

      unmount();
    }
  });

  it("画布文字只写符号与代号，不落任何浮点读数（读数归右屏看板）", () => {
    const { container } = render(
      <svg width={DESIGN_W} height={DESIGN_H}>
        <TrigModelScene
          params={{
            A: 1.5,
            period: 12,
            phi: -Math.PI / 2,
            k: 2.5,
            tRatio: 0.25,
          }}
          scale={scale}
          vp={vp}
          onParamChange={() => {}}
          fontScale={fontScale}
          studyMode="fromGraph"
        />
      </svg>,
    );

    const texts = [...container.querySelectorAll("text")].map(
      (el) => el.textContent ?? "",
    );
    // 轴刻度标签是纯整数（读数轴），其余一律为符号 / 代号 / 中文
    const illegal = texts.filter((t) => /\d+\.\d+/.test(t));
    expect(illegal, `中屏出现浮点读数：${illegal.join(" | ")}`).toEqual([]);
    expect(texts).toContain("h = k + A");
    expect(texts).toContain("t");
    expect(texts).toContain("h");
    expect(texts).toContain("T");
  });

  it("真实容器下：顶部安全带内不落任何图元，且一周期标尺的两条端刻度线有实际长度", () => {
    // 安全带下沿（design 坐标）= CSS 76px 换算值；本视口为 (76 − 60) / 1.2 ≈ 13.33
    const chromeBottom = topChromeBottomY(TALL_VP);
    // 端刻度线长度 = 两端 CSS 像素偏移之差换算进 design 坐标：**除以** vp.scale（12 / 1.2 = 10）
    const rulerTickLength =
      (SPAN_TICK_BOTTOM_DY - SPAN_TICK_TOP_DY) / TALL_VP.scale;

    for (const studyMode of ["harmonic", "fromGraph", "modeling"] as const) {
      const { container, unmount } = render(
        <svg width={DESIGN_W} height={DESIGN_H}>
          <TrigModelScene
            params={{ A: 2, period: 2, phi: Math.PI / 2, k: 0, tRatio: 0.5 }}
            scale={tallScale}
            vp={TALL_VP}
            onParamChange={() => {}}
            fontScale={fontScale}
            studyMode={studyMode}
          />
        </svg>,
      );

      const scene = container.querySelector("g.trig-model-scene");
      expect(scene, `[${studyMode}] 场景根节点缺失`).not.toBeNull();

      // ① 逐图元收集纵坐标（文本要叠加 dy；polygon 拆 points），一律不得越过安全带下沿
      const intruders: string[] = [];
      for (const el of scene!.querySelectorAll("line, polygon, circle, text")) {
        const ys: number[] = [];
        const dy = Number(el.getAttribute("dy") ?? 0);
        for (const attr of ["y", "y1", "y2"]) {
          const raw = el.getAttribute(attr);
          if (raw !== null) ys.push(Number(raw) + dy);
        }
        const points = el.getAttribute("points");
        if (points) {
          for (const pair of points.trim().split(/\s+/)) {
            ys.push(Number(pair.split(",")[1]));
          }
        }
        const top = Math.min(...ys);
        if (Number.isFinite(top) && top < chromeBottom - 0.5) {
          intruders.push(
            `${el.tagName}"${el.textContent ?? ""}"→y=${top.toFixed(1)}`,
          );
        }
      }
      expect(
        intruders,
        `[${studyMode}] 图元越过顶部安全带下沿 y=${chromeBottom.toFixed(2)}：${intruders.join(" | ")}`,
      ).toEqual([]);

      // ② 标尺两条端刻度线（paramSecondary 的竖线）必须有实际长度：
      //   早前的 bug 是把定位量喂给 fontScale = clamp(v*scale, 7, 16)，
      //   四个纵坐标全被截成同一个值 → 两条端刻度线长度归零、标尺退化成一根横线。
      //   后来的修法 `v * vp.scale` 方向反了（应为除以），
      //   在 scale = 1.2 下会把 12 CSS px 画成 17.28 CSS px。
      const rulerTicks = [...scene!.querySelectorAll("line")].filter(
        (l) =>
          l.getAttribute("stroke") === MATH_COLORS.paramSecondary &&
          l.getAttribute("x1") === l.getAttribute("x2"),
      );
      expect(rulerTicks.length, `[${studyMode}] 一周期标尺的端刻度线缺失`).toBe(
        2,
      );
      for (const tick of rulerTicks) {
        const length = Math.abs(
          Number(tick.getAttribute("y2")) - Number(tick.getAttribute("y1")),
        );
        expect(length, `[${studyMode}] 一周期标尺端刻度线长度归零`).toBeCloseTo(
          rulerTickLength,
          5,
        );
      }

      unmount();
    }
  });
});
