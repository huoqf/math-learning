/**
 * src/test/sceneViewportKeyPoint.test.ts
 * 「中屏关键点 × 可见视口」一致性契约（P1-D · 从 `presetViewportVisibility` 推广）
 *
 * 背景：`presetViewportVisibility.test.ts` 只覆盖阿氏圆一页；`powerSceneDragDomain.test.ts`
 * 与 `derivativeShift.test.ts` 的可见域契约也只覆盖各自页面。于是 `/derivative`、
 * `/derivative-transcendental`、`/function-exponential`、`/function-logarithmic` 四页
 * 长期处在**结构上无法被机器裁决**的盲区里 —— 参数域与视口一旦脱节，手柄会被裁出画布。
 *
 * 本文件把「同源」固化为三类断言（沿用本仓库既有测试的行文风格）：
 *  ① **前置断言**：可见域由 `calculateSceneScale` 现算，不手抄常数；
 *  ② **溢出必要性**：证明在**左屏滑块可达**的参数域端点处，关键点确实越出可见纵域
 *     ⇒ 该页必须开 `InteractivePoint` 的 `edgeClampProjection`（并在源码层锁死该 prop）；
 *  ③ **反向控制**：证明另有参数组合**不**越界，避免把断言写成"一律开投影"的过度约束。
 *
 * ⚠ 本文件**不**主张通过钳制 x₀ 来回避纵坐标溢出 —— 那会粗暴剥夺学生在 x₀ 全区间上的
 *   探究能力。越界一律交由 `edgeClampProjection` 投影吸附手柄承担（点贴边显示 + 方向引线）。
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { calculateSceneScale, type SceneScale } from "@/hooks/useSceneScale";
import { CANVAS_PRESETS } from "@/theme";
import { PRESET_FUNCTIONS } from "@/math/derivative";
import { paramMeta as derivativeParamMeta } from "@/data/registries/derivative";
import { paramMeta as expLogParamMeta } from "@/data/registries/funcExpLog";
import { transcendentalParamMeta } from "@/data/registries/transcendental";
import { paramDragRange } from "@/utils/paramClamp";

/** 按页面真实视口参数现算比例尺（与 `useSceneScale` 同源） */
function buildScale(
  xRange: [number, number],
  yRange: [number, number],
): SceneScale {
  return calculateSceneScale({
    designVisibleW: CANVAS_PRESETS.full.width,
    designVisibleH: CANVAS_PRESETS.full.height,
    designLeft: 0,
    designTop: 0,
    xRange,
    yRange,
  });
}

/** 沿 x 等距取样，返回首个越出可见纵域的可达点（无越界则 null） */
function firstOverflow(
  scale: SceneScale,
  xLo: number,
  xHi: number,
  fn: (x: number) => number,
  steps = 120,
): { x: number; y: number } | null {
  for (let i = 0; i <= steps; i += 1) {
    const x = xLo + ((xHi - xLo) * i) / steps;
    const y = fn(x);
    if (!Number.isFinite(y)) continue;
    if (y < scale.yMin || y > scale.yMax) return { x, y };
  }
  return null;
}

/** 断言某场景源码文件确实为手柄开启了投影吸附（防止 prop 被静默删除） */
function expectProjectionEnabled(relPath: string, page: string) {
  const code = readFileSync(resolve(process.cwd(), relPath), "utf8");
  expect(
    code.includes("edgeClampProjection"),
    `${page}（${relPath}）的 InteractivePoint 必须开启 edgeClampProjection：` +
      `该页关键点存在滑块可达的越界组合，关掉投影后手柄会被裁出画布且拖不回来`,
  ).toBe(true);
}

/* ================================================================== *
 * 1. /derivative —— PRESET_FUNCTIONS 全表 × 视口
 * ================================================================== */

describe("/derivative 切点 P 可见性契约（P1-D）", () => {
  const scale = buildScale([-5, 5], [-4, 4]);

  it("前置：视图区由 x 轴锁定比例尺 81.25，可见 x ≈ ±5.169、y 恰 [-4, 4]", () => {
    expect(CANVAS_PRESETS.full).toEqual({ width: 840, height: 650 });
    expect(scale.scale).toBe(81.25);
    expect(scale.xMin).toBeCloseTo(-5.169, 3);
    expect(scale.xMax).toBeCloseTo(5.169, 3);
    expect(scale.yMin).toBe(-4);
    expect(scale.yMax).toBe(4);
  });

  it("溢出必要性：7 个母函数在各自 x₀ 滑块端点处必然越出可见纵域", () => {
    // 每个母函数取「越界最严重的那一端」，逐一钉死其可达的越界事实。
    const cases: Array<[string, number, number]> = [
      // [fnKey, 产生越界的 x₀, 期望的纵坐标]
      ["cubic", 3, 18], // x³ − 3x
      ["quadratic", 3, 9], // x²
      ["exp", 2, Math.exp(2)], // eˣ ⇒ 7.389
      ["xlnx", 4, 4 * Math.log(4)], // x ln x ⇒ 5.545
      ["lnx_x", 0.1, Math.log(0.1) / 0.1], // (ln x)/x ⇒ −23.026
      ["xex", 1.5, 1.5 * Math.exp(1.5)], // x eˣ ⇒ 6.723
      ["rational", -0.08, 1 / -0.08], // 1/x ⇒ −12.5
    ];

    for (const [key, x0, expected] of cases) {
      const preset = PRESET_FUNCTIONS[key];
      expect(preset, `PRESET_FUNCTIONS 缺少 ${key}`).toBeDefined();

      // 该 x₀ 必须落在母函数自己的滑块域内 —— 否则学生根本够不到，属无意义断言
      expect(
        x0 >= preset.x0Range[0] && x0 <= preset.x0Range[1],
        `${key} 的越界样例 x₀=${x0} 不在滑块域 [${preset.x0Range}] 内`,
      ).toBe(true);

      expect(preset.fn(x0)).toBeCloseTo(expected, 6);
      const out = preset.fn(x0) < scale.yMin || preset.fn(x0) > scale.yMax;
      expect(out, `${key} 在 x₀=${x0} 处应当越界（y=${preset.fn(x0)}）`).toBe(
        true,
      );
    }
  });

  it("溢出必要性：cubic 的出框临界 x₀ ≈ 2.19 落在滑块域 [-3, 3] 内", () => {
    // x³ − 3x = yMax = 4 ⇒ x ≈ 2.1958；左支同理 ⇒ 学生在滑块上轻松拖到越界区
    const critical = 2.195823345445647;
    expect(PRESET_FUNCTIONS.cubic.fn(critical)).toBeCloseTo(4, 6);
    expect(critical).toBeLessThan(PRESET_FUNCTIONS.cubic.x0Range[1]);
    expect(critical).toBeGreaterThan(PRESET_FUNCTIONS.cubic.x0Range[0]);
  });

  it("反向控制：ln 与 √x 在整个滑块域内都不越界（不得写成「一律开投影」）", () => {
    expect(firstOverflow(scale, 0.1, 4, PRESET_FUNCTIONS.ln.fn)).toBeNull();
    expect(firstOverflow(scale, 0, 4, PRESET_FUNCTIONS.sqrt.fn)).toBeNull();
    // 上下界端点复核
    expect(PRESET_FUNCTIONS.ln.fn(0.1)).toBeCloseTo(-2.302585, 5);
    expect(PRESET_FUNCTIONS.ln.fn(4)).toBeCloseTo(1.386294, 5);
    expect(PRESET_FUNCTIONS.sqrt.fn(4)).toBe(2);
  });

  it("反向控制：sin/cos 的纵坐标恒在 [-1, 1]，越界只可能来自横向（x₀Range ±6.28 > 可见 ±5.169）", () => {
    for (const key of ["sine", "cosine"]) {
      const preset = PRESET_FUNCTIONS[key];
      expect(firstOverflow(scale, -6.28, 6.28, preset.fn)).toBeNull();
      // 横向越界确实可达 ⇒ 投影必须同时覆盖左/右边界
      expect(Math.abs(preset.x0Range[1])).toBeGreaterThan(scale.xMax);
    }
  });

  it("源码层锁死：DerivativeScene 的切点手柄开启了 edgeClampProjection", () => {
    expectProjectionEnabled(
      "src/features/derivative/components/DerivativeScene.tsx",
      "/derivative",
    );
  });

  it("拖拽域与滑块域同源：x₀ 拖拽区间取 preset.x0Range（非注册表兜底值 paramMeta.x0）", () => {
    // 注册表那份是 [-4, 4] 的兜底；若拖拽直接用它，cubic 可被拖到 ±4，
    // 而滑块上限是 ±3 ⇒ 滑块读数被夹回、图形不跟，"同一控件内自相矛盾"。
    const registryRange = paramDragRange(derivativeParamMeta.x0, scale, "x");
    expect(registryRange).toEqual([-4, 4]);
    expect(registryRange).not.toEqual(PRESET_FUNCTIONS.cubic.x0Range);

    for (const [key, preset] of Object.entries(PRESET_FUNCTIONS)) {
      const dragRange = paramDragRange(
        {
          ...derivativeParamMeta.x0,
          min: preset.x0Range[0],
          max: preset.x0Range[1],
        },
        scale,
        "x",
      );
      expect(dragRange, `${key} 拖拽区间缺失`).toBeDefined();
      // 拖拽区间必须是「滑块域 ∩ 可见 x 域」，且非空
      const expectLo = Math.max(preset.x0Range[0], scale.xMin);
      const expectHi = Math.min(preset.x0Range[1], scale.xMax);
      expect(dragRange![0]).toBeCloseTo(expectLo, 6);
      expect(dragRange![1]).toBeCloseTo(expectHi, 6);
      expect(dragRange![0]).toBeLessThan(dragRange![1]);
    }

    // 源码层：拖拽回调必须引用 preset.x0Range，防止回退成裸 paramMeta.x0
    const code = readFileSync(
      resolve(
        process.cwd(),
        "src/features/derivative/components/DerivativeScene.tsx",
      ),
      "utf8",
    );
    expect(
      /paramDragRange\(\s*\{[^}]*preset\.x0Range/.test(code),
      "DerivativeScene 的 paramDragRange 必须以 preset.x0Range 为参数域（滑块同源），" +
        "不得直接传注册表兜底值 paramMeta.x0",
    ).toBe(true);
  });
});

/* ================================================================== *
 * 2. /derivative-transcendental —— 三个模式逐一裁决
 * ================================================================== */

describe("/derivative-transcendental 切点 P 可见性契约（P1-D）", () => {
  const scale = buildScale([-4, 4], [-3, 5]);

  it("前置：可见 x ≈ ±5.169、可见 y 恰 [-3, 5]", () => {
    expect(scale.scale).toBe(81.25);
    expect(scale.xMin).toBeCloseTo(-5.169, 3);
    expect(scale.yMin).toBe(-3);
    expect(scale.yMax).toBe(5);
  });

  it("exp 模式：滑块上限 2.0 而 e² ≈ 7.389，越界必然触发", () => {
    const meta = transcendentalParamMeta.exp.x0;
    expect(meta.max).toBe(2.0);
    expect(Math.exp(meta.max)).toBeCloseTo(7.389056, 6);
    expect(Math.exp(meta.max)).toBeGreaterThan(scale.yMax);

    // 出框临界 x₀ = ln 5 ≈ 1.609 严格小于滑块上限 ⇒ 学生拖到一半就飞出手柄
    const critical = Math.log(scale.yMax);
    expect(critical).toBeCloseTo(1.609438, 5);
    expect(critical).toBeLessThan(meta.max);
    expect(critical).toBeGreaterThan(meta.min);

    expect(
      firstOverflow(scale, meta.min, meta.max, (x) => Math.exp(x)),
    ).not.toBeNull();
  });

  it("反向控制：log 模式（ln 0.1 ≈ −2.303 与 ln 3.5 ≈ 1.253）整域不越界", () => {
    const meta = transcendentalParamMeta.log.x0;
    expect(meta.min).toBeGreaterThan(0); // 真数保护
    expect(
      firstOverflow(scale, meta.min, meta.max, (x) => Math.log(x)),
    ).toBeNull();
    expect(Math.log(meta.min)).toBeCloseTo(-2.302585, 5);
    expect(Math.log(meta.max)).toBeCloseTo(1.252763, 5);
  });

  it("反向控制：chain 模式的动点在中轴 y = x 上，域 [0.2, 3] ⊂ [-3, 5] 不越界", () => {
    const meta = transcendentalParamMeta.chain.x0;
    expect(firstOverflow(scale, meta.min, meta.max, (x) => x)).toBeNull();
    expect(meta.min).toBeGreaterThan(scale.yMin);
    expect(meta.max).toBeLessThan(scale.yMax);
  });

  it("源码层锁死：TranscendentalScene 的切点手柄开启了 edgeClampProjection", () => {
    expectProjectionEnabled(
      "src/features/derivativeTranscendental/components/TranscendentalScene.tsx",
      "/derivative-transcendental",
    );
  });
});

/* ================================================================== *
 * 3. /function-exponential 与 /function-logarithmic —— ExpLogScene
 * ================================================================== */

describe("指对函数页 探究动点 P 可见性契约（P1-D）", () => {
  const scale = buildScale([-6, 6], [-4.5, 4.5]);

  it("前置：视图区由 x 轴锁定比例尺 70，可见 x 恰 ±6、y ≈ ±4.6429", () => {
    expect(scale.scale).toBe(70);
    expect(scale.xMin).toBe(-6);
    expect(scale.xMax).toBe(6);
    expect(scale.yMax).toBeCloseTo(325 / 70, 6);
    expect(scale.yMin).toBeCloseTo(-325 / 70, 6);
  });

  it("指数页：a⁴ 与 a⁻⁴ 双向越界，α=0.2 的负半轴最远飞到 625", () => {
    const aMax = expLogParamMeta.baseA.max;
    const aMin = expLogParamMeta.baseA.min;
    const xMax = expLogParamMeta.x0.max;
    const xMin = expLogParamMeta.x0.min;

    expect(Math.pow(aMax, xMax)).toBe(256);
    expect(Math.pow(aMax, xMax)).toBeGreaterThan(scale.yMax);

    // 下界侧同样可达：e.g. a = 0.2、x₀ = −4 ⇒ 625
    expect(Math.pow(aMin, xMin)).toBeCloseTo(625, 6);
    expect(Math.pow(aMin, xMin)).toBeGreaterThan(scale.yMax);

    expect(
      firstOverflow(scale, xMin, xMax, (x) => Math.pow(aMax, x)),
    ).not.toBeNull();
    expect(
      firstOverflow(scale, xMin, xMax, (x) => Math.pow(aMin, x)),
    ).not.toBeNull();
  });

  it("对数页：底数趋近 1 时 log_a x 爆炸，a = 1.1、x₀ = 0.1 处已到 −24.16", () => {
    const y = Math.log(0.1) / Math.log(1.1);
    expect(y).toBeCloseTo(-24.158858, 5);
    expect(y).toBeLessThan(scale.yMin);

    // 反向控制：底数离 1 足够远时（a = 2、a = 4）在滑块域内不越界
    expect(
      firstOverflow(
        scale,
        0.1,
        expLogParamMeta.x0.max,
        (x) => Math.log(x) / Math.log(2),
      ),
    ).toBeNull();
    expect(
      firstOverflow(
        scale,
        0.1,
        expLogParamMeta.x0.max,
        (x) => Math.log(x) / Math.log(4),
      ),
    ).toBeNull();
  });

  it("源码层锁死：ExpLogScene 的三个手柄分支（power / exp / log）都开启了投影", () => {
    const code = readFileSync(
      resolve(
        process.cwd(),
        "src/features/funcExpLog/components/ExpLogScene.tsx",
      ),
      "utf8",
    );
    const hits = code.match(/edgeClampProjection/g) ?? [];
    // 幂函数分支在 PowerScene，本 Scene 覆盖 exp / log / inverse 三处手柄
    expect(
      hits.length,
      "ExpLogScene 至少应有 3 处 edgeClampProjection（exp / log / 反函数对照）",
    ).toBeGreaterThanOrEqual(3);
  });
});
