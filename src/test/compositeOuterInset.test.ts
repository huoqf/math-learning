/**
 * src/test/compositeOuterInset.test.ts
 * 复合函数页「外层映射小图 f(u)」取景契约（P1-H ②）
 *
 * 背景：复合函数的传导链是 x →(g)→ u →(f)→ y。中屏此前只有 u = g(x) 与 y = f(g(x))
 * 两条曲线，外层 f 本身完全没有图象 —— 学生看不到「外层是增还是减、有没有转折」，
 * 「同增异减」只能死记。补一张小图必须同时钉死三件事，否则会退化成一个纯装饰的框：
 *  ① **同比例**：小图取景窗口与绘图区严格同比例（scaleX === scaleY），
 *     指数的陡升、对数的下坠、抛物线的开口与顶点才不会被拉扁失真；
 *  ② **取景有效**：窗口必须含原点（u 轴与 y 轴都要画得出来），
 *     且必须含各自「最该被看见的特征部位」（顶点 / 零点 / 出框点），
 *     否则要么曲线整段飞出、要么干脆一片空白；
 *  ③ **不越界、不争位**：小图外框必须落在可见设计区内（不被 overflow-hidden 裁掉），
 *     且不与左上角公式浮标、右下角图例矩形争位。
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  OUTER_INSET,
  buildOuterInset,
  type OuterType,
} from "@/features/composite/outerInset";
import { calculateComposite } from "@/math/composite";
import { CANVAS_PRESETS } from "@/theme";

/** 与外层映射函数的唯一实现同源：直接问 math 层，绝不在测试里重写一份公式 */
function outerOf(outerType: OuterType) {
  return calculateComposite({ xSample: 0, innerB: -2, innerC: 2, outerType })
    .evaluateOuter;
}

/** 三种外层各自的「最该被看见的特征部位」，用于断言取景不是空的 */
const CHARACTERISTIC: Record<OuterType, { u: number; y: number; why: string }> =
  {
    exp: { u: 1, y: 2, why: "指数在 u=1 处 y=2，且继续陡升穿出上界" },
    log: { u: 1, y: 0, why: "对数的零点 u=1，左端向 u→0⁺ 下坠" },
    quadratic: { u: 2, y: 4, why: "抛物线顶点 (2, 4) 必须落在窗口内并留余量" },
  };

const ALL: OuterType[] = ["exp", "log", "quadratic"];

/** 本页视口（CANVAS_PRESETS.full），与 CompositeAnimation 的 useAnimationViewport 同源 */
const VP = {
  designLeft: 0,
  designTop: 0,
  designVisibleW: CANVAS_PRESETS.full.width,
  designVisibleH: CANVAS_PRESETS.full.height,
} as const;

describe("外层映射小图 f(u) 取景契约（P1-H ②）", () => {
  const plotW = OUTER_INSET.w - OUTER_INSET.pad * 2;
  const plotH = OUTER_INSET.h - OUTER_INSET.titleBand - OUTER_INSET.pad;
  const ratio = plotW / plotH;

  it("前置：绘图区 174×128，宽高比 1.359375（横向跨度按此反推）", () => {
    expect(plotW).toBe(174);
    expect(plotH).toBe(128);
    expect(ratio).toBeCloseTo(1.359375, 6);
  });

  it("同比例：三种外层的 scaleX === scaleY，且窗口跨度比 = 绘图区宽高比", () => {
    for (const outerType of ALL) {
      const geo = buildOuterInset({ outerType, ...VP });
      expect(
        geo.scale.scaleX,
        `${outerType} 的 scaleX 与 scaleY 不等 ⇒ f(u) 被拉扁失真`,
      ).toBeCloseTo(geo.scale.scaleY, 9);

      const uSpan = geo.uRange[1] - geo.uRange[0];
      const ySpan = geo.yRange[1] - geo.yRange[0];
      expect(uSpan / ySpan, `${outerType} 的窗口跨度比异常`).toBeCloseTo(
        ratio,
        9,
      );
      expect(geo.scale.scale).toBeCloseTo(geo.scale.scaleX, 9);
    }
  });

  it("数值锚定：exp/log/quadratic 的比例尺分别为 32、21.333…、22.857…", () => {
    const expected: Record<OuterType, number> = {
      exp: 32,
      log: plotH / 6, // 128/6 = 21.3333…
      quadratic: plotH / 5.6, // 128/5.6 = 22.8571…
    };
    for (const outerType of ALL) {
      const geo = buildOuterInset({ outerType, ...VP });
      expect(geo.scale.scale).toBeCloseTo(expected[outerType], 9);
    }
  });

  it("取景有效①：三种外层的窗口都含原点（u 轴与 y 轴都画得出来）", () => {
    for (const outerType of ALL) {
      const geo = buildOuterInset({ outerType, ...VP });
      const { xMin, xMax, yMin, yMax } = geo.scale;
      expect(xMin, `${outerType} 的窗口左端越过原点`).toBeLessThan(0);
      expect(xMax, `${outerType} 的窗口右端越过原点`).toBeGreaterThan(0);
      expect(yMin, `${outerType} 的窗口下端越过原点`).toBeLessThan(0);
      expect(yMax, `${outerType} 的窗口上端越过原点`).toBeGreaterThan(0);
    }
  });

  it("取景有效②：三种外层的窗口都含各自的特征部位", () => {
    for (const outerType of ALL) {
      const geo = buildOuterInset({ outerType, ...VP });
      const fn = outerOf(outerType);
      const { u, y } = CHARACTERISTIC[outerType];

      // 特征点必须在窗口内，且 y 与函数真值一致（防止特征点写漂）
      expect(fn(u), `${outerType} 在 u=${u} 处的真值漂了`).toBeCloseTo(y, 9);
      expect(u, `${outerType} 的特征 u=${u} 不在窗口内`).toBeGreaterThan(
        geo.scale.xMin,
      );
      expect(u, `${outerType} 的特征 u=${u} 不在窗口内`).toBeLessThan(
        geo.scale.xMax,
      );
      expect(y, `${outerType} 的特征 y=${y} 不在窗口内`).toBeGreaterThan(
        geo.scale.yMin,
      );
      expect(y, `${outerType} 的特征 y=${y} 不在窗口内`).toBeLessThan(
        geo.scale.yMax,
      );
    }
  });

  it("取景有效③：曲线确实「部分可见」—— 存在窗口内的 u 使 f(u) 落在纵域内", () => {
    for (const outerType of ALL) {
      const geo = buildOuterInset({ outerType, ...VP });
      const fn = outerOf(outerType);
      const { xMin, xMax, yMin, yMax } = geo.scale;

      const inside: number[] = [];
      for (let i = 0; i <= 400; i += 1) {
        const u = xMin + ((xMax - xMin) * i) / 400;
        const y = fn(u);
        if (Number.isFinite(y) && y >= yMin && y <= yMax) inside.push(u);
      }
      expect(
        inside.length,
        `${outerType} 的 f(u) 在窗口内几乎没有可见段 ⇒ 小图是空框`,
      ).toBeGreaterThan(20);
    }
  });

  it("取景有效④：exp 陡升可见、log 下坠可见、quadratic 顶点留有余量", () => {
    const exp = buildOuterInset({ outerType: "exp", ...VP });
    const expFn = outerOf("exp");
    // 穿出上界的那个 u 必须落在窗口内：说明学生能在小图上看到「冲出画面」的陡升
    const expExit = Math.log2(exp.scale.yMax);
    expect(expExit).toBeCloseTo(1.765534, 5);
    expect(expExit).toBeLessThan(exp.scale.xMax);
    expect(expFn(expExit)).toBeCloseTo(exp.scale.yMax, 9);

    const log = buildOuterInset({ outerType: "log", ...VP });
    // 跌出下界的那个 u = 2^yMin 必须落在窗口内：说明「u→0⁺ 向下无界」可见
    const logExit = Math.pow(2, log.scale.yMin);
    expect(logExit).toBeCloseTo(0.125, 9);
    expect(logExit).toBeGreaterThan(log.scale.xMin);

    const quad = buildOuterInset({ outerType: "quadratic", ...VP });
    // 顶点之上留余量（否则顶点会被上边框压住，看不出「最高点」）
    expect(quad.scale.yMax - 4).toBeGreaterThan(0.3);
    expect(quad.scale.xMin).toBeLessThan(2 - Math.sqrt(5.2));
    expect(quad.scale.xMax).toBeGreaterThan(2 + Math.sqrt(5.2));
  });

  it("不越界：小图外框完整落在可见设计区内（不会被 overflow-hidden 裁掉）", () => {
    for (const outerType of ALL) {
      const geo = buildOuterInset({ outerType, ...VP });
      expect(geo.left).toBeGreaterThanOrEqual(VP.designLeft);
      expect(geo.top).toBeGreaterThanOrEqual(VP.designTop);
      expect(geo.left + geo.w).toBeLessThanOrEqual(
        VP.designLeft + VP.designVisibleW,
      );
      expect(geo.top + geo.h).toBeLessThanOrEqual(
        VP.designTop + VP.designVisibleH,
      );
    }
  });

  it("不争位：小图只在左下象限，避开左上公式浮标与右下角图例", () => {
    for (const outerType of ALL) {
      const geo = buildOuterInset({ outerType, ...VP });
      // 左上浮标占上部、右下图例占右部 ⇒ 小图必须严格落在左下
      expect(
        geo.left + geo.w,
        `${outerType} 的小图右边界侵入右半区，会与右下角图例争位`,
      ).toBeLessThanOrEqual(VP.designLeft + VP.designVisibleW / 2);
      expect(
        geo.top,
        `${outerType} 的小图上边界侵入上半区，会与左上角公式浮标争位`,
      ).toBeGreaterThanOrEqual(VP.designTop + VP.designVisibleH / 2);
    }
  });

  it("不越框：u 轴右端恰在绘图区右边缘、y 轴上端恰在标题条下缘", () => {
    for (const outerType of ALL) {
      const geo = buildOuterInset({ outerType, ...VP });
      const { scale } = geo;
      // 轴端 = 窗口边界，必须严丝合缝贴在绘图区内缘，多一分则越框、少一分则留白
      const uAxisRight = scale.originX + scale.xMax * scale.scaleX;
      const yAxisTop = scale.originY - scale.yMax * scale.scaleY;
      expect(uAxisRight).toBeCloseTo(
        geo.left + OUTER_INSET.w - OUTER_INSET.pad,
        9,
      );
      expect(yAxisTop).toBeCloseTo(geo.top + OUTER_INSET.titleBand, 9);
    }
  });

  it("容错：容器变矮时小图整体上移但仍完整可见（不越出设计区）", () => {
    // 极端情形：可见设计高只有 360（ThreePanel 下压后的余量）
    const short = { ...VP, designVisibleH: 360 };
    for (const outerType of ALL) {
      const geo = buildOuterInset({ outerType, ...short });
      expect(geo.top).toBeGreaterThanOrEqual(short.designTop);
      expect(geo.top + geo.h).toBeLessThanOrEqual(
        short.designTop + short.designVisibleH,
      );
      expect(geo.scale.scaleX).toBeCloseTo(geo.scale.scaleY, 9);
    }
  });

  it("源码层锁死：CompositeScene 必须调 buildOuterInset 并消费 math 层的 evaluateOuter", () => {
    const code = readFileSync(
      resolve(
        process.cwd(),
        "src/features/composite/components/CompositeScene.tsx",
      ),
      "utf8",
    );
    expect(
      /buildOuterInset\(\{/.test(code),
      "CompositeScene 的取景必须走 buildOuterInset（同源 SSOT）；" +
        "回退成内联 calculateSceneScale 会让横向跨度脱离宽高比反推，f(u) 立刻被拉扁",
    ).toBe(true);
    expect(
      /fn=\{res\.evaluateOuter\}/.test(code),
      "小图曲线必须直接消费 math 层的 evaluateOuter，" +
        "不得在 Scene 内重写一份外层映射函数（会产生两份真值）",
    ).toBe(true);
    // 小图不得再自建 CoordinateGrid：本页已有主坐标系，两套轴会出现两个原点 O。
    // 主坐标系的 CoordinateGrid 每个分支各一处（piecewise / composite），共 2 处；
    // 「外层映射小图」标记之后必须一处都没有 —— 小图要靠手绘 u/y 轴 + 原点标 O′。
    const insetFrom = code.indexOf("外层映射小图 f(u)");
    expect(insetFrom, "找不到小图渲染块").toBeGreaterThan(0);
    const insetCode = code.slice(insetFrom);
    expect(
      (code.match(/<CoordinateGrid/g) ?? []).length,
      "CoordinateGrid 只应出现在两个主分支（各一处）",
    ).toBe(2);
    expect(
      (insetCode.match(/<CoordinateGrid/g) ?? []).length,
      "小图内不得实例化 CoordinateGrid：本页会出现两个原点 O；" +
        "应手绘 u/y 轴并把小图原点标 O′",
    ).toBe(0);
    expect(
      insetCode.includes("O′"),
      "小图原点必须标 O′ 以区别于主图原点 O",
    ).toBe(true);
    expect(
      insetCode.includes("calculateSceneScale"),
      "小图内不得自行调用 calculateSceneScale：取景必须全部来自 buildOuterInset",
    ).toBe(false);
  });

  it("唯一真值：math 层 evaluateOuter 与 evaluateComposite 严格复合一致", () => {
    for (const outerType of ALL) {
      const fn = outerOf(outerType);
      const res = calculateComposite({
        xSample: 1.5,
        innerB: -2,
        innerC: 2,
        outerType,
      });
      // evaluateComposite 必须是 evaluateOuter ∘ evaluateInner，不得各写一份
      expect(res.y).toBeCloseTo(fn(res.evaluateInner(1.5)), 9);
      expect(res.y).toBeCloseTo(res.evaluateComposite(1.5), 9);
    }
  });
});
