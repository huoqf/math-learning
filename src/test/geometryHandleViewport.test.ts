/**
 * src/test/geometryHandleViewport.test.ts
 * 「几何类页面 · 派生系数手柄 × 可见视口」一致性契约（2026-09-30 新增）
 *
 * 背景：`sceneViewportKeyPoint.test.ts` / `powerSceneDragDomain.test.ts` 是专为
 * `InteractivePoint` 的 `edgeClampProjection` 写的源码级守卫，但其页面清单**只覆盖函数类页面**
 * （/derivative、/derivative-transcendental、/function-exponential、/function-logarithmic）。
 * 于是「平面向量」专题里两类「系数驱动的合成点」长期处在**结构上无法被机器裁决**的盲区里：
 *   · vectorLinear —— 三点共线 / 自由模式下的合成点 `C = x·A + y·B`
 *   · vectorBasis  —— 等和线模式下的合成点 `P = x·e₁ + y·e₂`
 *
 * 这两个点的手柄位置是「系数的像」，与屏幕坐标不同轴，因此**钳制源只能是系数声明域**
 * （`paramDomainRange`，`src/utils/paramClamp.ts` 的 doc 明确点名的就是这一场景）。
 * 而「系数域 → 屏幕坐标」是乘法放大的：系数 ±1~2.5 × 基底 ±5/±4.5，其像可远出视口。
 * 按 `paramClamp` 的 SSOT 约定，视口溢出**必须**交由 `edgeClampProjection` 投影吸附手柄兜底
 * —— 该 prop 只改变渲染位置，拖拽链路仍读真实数学坐标，故点贴边显示且仍可拖回。
 *
 * 本文件把该契约固化为四类断言（沿用本仓库既有测试的行文风格）：
 *  ① **前置断言**：可见域由 `calculateSceneScale` 现算，不手抄常数；参数域取自 `paramMeta`（SSOT）。
 *  ② **溢出必要性**：用**生产数学层**（`computeVectorLinear` / `computeVectorBasis`）在参数域端点
 *     采样，证明确实存在滑块可达的越界组合，且越界幅度达视口纵域 2 倍以上。
 *  ③ **反向控制**：证明「爪子分点」（`(1−t)e₁ + t·e₂`，`t∈[0,1]`）**不**越界，
 *     避免把断言写成「几何页一律开投影」的过度约束。
 *  ④ **源码层锁死**：两个 Scene 必须保留 `edgeClampProjection`，防 prop 被静默删除。
 *
 * ⚠ 本文件**不**主张通过收窄系数声明域来回避溢出 —— 那会剥夺学生在 `x + y = 1` 全区间上
 *   探究等和线的能力（与 §5 中「不拿钳制 x₀ 换纵坐标」的同一条原则）。
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { calculateSceneScale, type SceneScale } from "@/hooks/useSceneScale";
import { CANVAS_PRESETS } from "@/theme";
import { computeVectorLinear } from "@/math/vectorLinear";
import { computeVectorBasis } from "@/math/vectorBasis";
import { paramMeta as vectorLinearMeta } from "@/data/registries/vectorLinear";
import { paramMeta as vectorBasisMeta } from "@/data/registries/vectorBasis";

const FULL = CANVAS_PRESETS.full;

/** 按页面真实视口参数现算比例尺（与 `useSceneScale` 同源，`keepAspectRatio` 同为默认 true） */
function buildScale(
  xRange: [number, number],
  yRange: [number, number],
): SceneScale {
  return calculateSceneScale({
    designVisibleW: FULL.width,
    designVisibleH: FULL.height,
    designLeft: 0,
    designTop: 0,
    xRange,
    yRange,
  });
}

/** 两页中屏视口一致（vectorLinear / vectorBasis 均为 x∈[−6,6]、y∈[−4.5,4.5]） */
const GEO_X_RANGE: [number, number] = [-6, 6];
const GEO_Y_RANGE: [number, number] = [-4.5, 4.5];

function isOutOfView(scale: SceneScale, x: number, y: number): boolean {
  return x < scale.xMin || x > scale.xMax || y < scale.yMin || y > scale.yMax;
}

/** 在 [lo, hi] 上等距取样（含两端点 —— 端点都是滑块可达值） */
function seq(lo: number, hi: number, steps: number): number[] {
  return Array.from(
    { length: steps + 1 },
    (_, i) => lo + ((hi - lo) * i) / steps,
  );
}

interface OverflowReport {
  total: number;
  outCount: number;
  maxAbsY: number;
  sample: { x: number; y: number; args: unknown } | null;
}

/** 统计一组采样点的越界情况，并记录纵坐标绝对值最大的那组（越界特征最显著） */
function scan(
  scale: SceneScale,
  points: { point: { x: number; y: number }; args: unknown }[],
): OverflowReport {
  const report: OverflowReport = {
    total: points.length,
    outCount: 0,
    maxAbsY: 0,
    sample: null,
  };
  for (const { point, args } of points) {
    if (isOutOfView(scale, point.x, point.y)) {
      report.outCount += 1;
      if (Math.abs(point.y) > report.maxAbsY) {
        report.maxAbsY = Math.abs(point.y);
        report.sample = { x: point.x, y: point.y, args };
      }
    }
  }
  return report;
}

/* ================================================================== *
 * 1. vectorLinear —— 合成点 C = x·A + y·B
 * ================================================================== */

describe("/vector-linear 合成点 C 的可见性契约（派生系数手柄）", () => {
  const scale = buildScale(GEO_X_RANGE, GEO_Y_RANGE);

  // 声明域端点（SSOT = registries/vectorLinear.ts；因域 ⊂ 视口，paramDragRange 与声明域同值）
  const XS = [vectorLinearMeta.xa.min, vectorLinearMeta.xa.max];
  const YS = [vectorLinearMeta.ya.min, vectorLinearMeta.ya.max];
  const COEFF = (meta: { min: number; max: number }) =>
    seq(meta.min, meta.max, 40);

  it("三点共线模式（锁定 x + y = 1）在基底端点处必然溢出 ⇒ 必须开 edgeClampProjection", () => {
    const points: { point: { x: number; y: number }; args: unknown }[] = [];
    for (const xa of XS)
      for (const ya of YS)
        for (const xb of XS)
          for (const yb of YS)
            for (const xCoeff of COEFF(vectorLinearMeta.xCoeff)) {
              const args = { xa, ya, xb, yb, xCoeff, lockCollinear: true };
              const res = computeVectorLinear(args);
              points.push({ point: res.pointC, args });
            }

    const report = scan(scale, points);
    expect(
      report.outCount,
      "三点共线模式下合成点 C 必须存在越界组合（否则本页无需 edgeClampProjection）",
    ).toBeGreaterThan(0);
    // 越界幅度必须显著：实测最差 C_y = ±13.5，视口纵域仅 ±4.5
    expect(report.maxAbsY).toBeGreaterThan(scale.yMax * 2);
  });

  it("自由探究模式（x, y 各自独立在 [−1,2] 内）溢出更严重", () => {
    const points: { point: { x: number; y: number }; args: unknown }[] = [];
    const xs = seq(
      vectorLinearMeta.xCoeff.min,
      vectorLinearMeta.xCoeff.max,
      20,
    );
    const ys = seq(
      vectorLinearMeta.yCoeff.min,
      vectorLinearMeta.yCoeff.max,
      20,
    );
    for (const xa of XS)
      for (const ya of YS)
        for (const xb of XS)
          for (const yb of YS)
            for (const xCoeff of xs)
              for (const yCoeff of ys) {
                const args = { xa, ya, xb, yb, xCoeff, yCoeff };
                const res = computeVectorLinear(args);
                points.push({ point: res.pointC, args });
              }

    const report = scan(scale, points);
    expect(report.outCount).toBeGreaterThan(0);
    // 实测最差 C = (0, 18)
    expect(report.maxAbsY).toBeGreaterThan(scale.yMax * 2);
  });

  it("源码层锁死：VectorLinearScene 的 C 手柄开启了 edgeClampProjection", () => {
    const code = readFileSync(
      resolve(
        process.cwd(),
        "src/features/vectorLinear/components/VectorLinearScene.tsx",
      ),
      "utf8",
    );
    expect(
      code.includes("edgeClampProjection"),
      "VectorLinearScene 的合成点 C 是系数驱动的手柄（paramDomainRange 钳制），" +
        "系数声明域 [−1,2] 的像可达视口纵域的 3 倍 —— 关掉投影后手柄会被裁出画布且拖不回来",
    ).toBe(true);
  });
});

/* ================================================================== *
 * 2. vectorBasis —— 等和线合成点 P = x·e₁ + y·e₂
 * ================================================================== */

describe("/vector-basis 等和线合成点的可见性契约（派生系数手柄）", () => {
  const scale = buildScale(GEO_X_RANGE, GEO_Y_RANGE);

  const E = [
    [vectorBasisMeta.e1x.min, vectorBasisMeta.e1x.max],
    [vectorBasisMeta.e1y.min, vectorBasisMeta.e1y.max],
  ];

  it("等和线模式在基底与系数端点处必然溢出 ⇒ 必须开 edgeClampProjection", () => {
    const points: { point: { x: number; y: number }; args: unknown }[] = [];
    const coeffsX = seq(
      vectorBasisMeta.xCoeff.min,
      vectorBasisMeta.xCoeff.max,
      20,
    );
    const coeffsY = seq(
      vectorBasisMeta.yCoeff.min,
      vectorBasisMeta.yCoeff.max,
      20,
    );
    for (const e1x of E[0])
      for (const e1y of E[1])
        for (const e2x of E[0])
          for (const e2y of E[1])
            for (const xCoeff of coeffsX)
              for (const yCoeff of coeffsY) {
                const args = {
                  e1x,
                  e1y,
                  e2x,
                  e2y,
                  ax: 0,
                  ay: 0,
                  xCoeff,
                  yCoeff,
                };
                const res = computeVectorBasis(args);
                points.push({ point: res.collinearPoint, args });
              }

    const report = scan(scale, points);
    expect(
      report.outCount,
      "等和线合成点必须存在越界组合（否则本页无需 edgeClampProjection）",
    ).toBeGreaterThan(0);
    // 实测最差 P = (0, 22.5)，视口纵域仅 ±4.5 —— 越界幅度须达 2 倍以上
    expect(report.maxAbsY).toBeGreaterThan(scale.yMax * 2);
  });

  it("反向控制：爪子分点 (1−t)e₁ + t·e₂（t∈[0,1]）恒在线段 e₁e₂ 上，绝不越界", () => {
    const points: { point: { x: number; y: number }; args: unknown }[] = [];
    for (const e1x of E[0])
      for (const e1y of E[1])
        for (const e2x of E[0])
          for (const e2y of E[1])
            for (const ratioT of seq(
              vectorBasisMeta.ratioT.min,
              vectorBasisMeta.ratioT.max,
              20,
            )) {
              const args = {
                e1x,
                e1y,
                e2x,
                e2y,
                ax: 0,
                ay: 0,
                ratioT,
              };
              const res = computeVectorBasis(args);
              points.push({ point: res.divisionPoint, args });
            }

    const report = scan(scale, points);
    expect(
      report.outCount,
      "爪子分点两端点都在视口内且 t∈[0,1] ⇒ 它不应越界；若越界说明视口或 t 域被改动，需重判是否需要投影手柄",
    ).toBe(0);
  });

  it("源码层锁死：VectorBasisScene 的等和线合成点开启了 edgeClampProjection", () => {
    const code = readFileSync(
      resolve(
        process.cwd(),
        "src/features/vectorBasis/components/VectorBasisScene.tsx",
      ),
      "utf8",
    );
    expect(
      code.includes("edgeClampProjection"),
      "VectorBasisScene 的等和线合成点是系数驱动的手柄（paramDomainRange 钳制），" +
        "系数声明域 [−1.5,2.5] 的像可达视口纵域的 5 倍 —— 关掉投影后手柄会被裁出画布且拖不回来",
    ).toBe(true);
  });
});
