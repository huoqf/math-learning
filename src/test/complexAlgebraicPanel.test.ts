import { describe, it, expect } from "vitest";
import katex from "katex";
import { buildMathQuantities } from "@/data/mathQuantities";
import type { MathPanelData } from "@/data/types";
import {
  addComplex,
  mulComplex,
  divComplex,
  createComplex,
  powerOfI,
} from "@/math/complex";
import { calculateSceneScale, type SceneScale } from "@/hooks/useSceneScale";
import { CANVAS_PRESETS } from "@/theme";
import { defaultParams } from "@/data/registries/complex";
import {
  COMPLEX_ALGEBRAIC_PRESETS,
  COMPLEX_ALGEBRAIC_SUB_MODELS,
  COMPLEX_VIEWPORT_ALGEBRAIC,
  COMPLEX_VIEWPORT_DEFAULT,
  resolveComplexViewport,
  type ComplexStudyMode,
  type ComplexSubModel,
} from "@/features/complex/sceneConfig";

/**
 * 复数第四模式 algebraic-operations 右屏分支门禁。
 *
 * 为什么需要这个文件（覆盖陷阱）：
 *   `panelMathTextGate` / `katexSyntaxValidation` / `rightPanelSplitGate` 等既有门禁
 *   要么按 `routeEntries` 用 **默认 config** 驱动，要么只枚举一个 config 样本；
 *   本页默认 config 是 `{ mode: "plane-operations" }`，因此第四模式（以及它的 3 个子情景）
 *   对既有门禁**完全不可见**——内容缺项、`$` 不成对、latex 编译失败都不会被拦下。
 *   本文件按 `mode × subModel` 显式铺开，并额外覆盖退化参数（零向量除、负指数、纯虚数分母）。
 */

const MODE = "algebraic-operations";
const SUB_MODELS = [
  "multiply-divide",
  "conjugate-rationalize",
  "power-cycle",
] as const;

/** 每组 = [子情景, 参数, 说明] */
const PARAM_CASES: Array<{
  subModel: (typeof SUB_MODELS)[number];
  params: Record<string, number>;
  name: string;
}> = [
  // multiply-divide
  {
    subModel: "multiply-divide",
    params: { a1: 3, b1: 2, a2: 1, b2: 3 },
    name: "乘除展开·默认参数",
  },
  {
    subModel: "multiply-divide",
    params: { a1: 0, b1: 0, a2: 1, b2: 3 },
    name: "乘除展开·z1 为零（被乘数为零）",
  },
  {
    subModel: "multiply-divide",
    params: { a1: 1, b1: 1, a2: 0, b2: 0 },
    name: "乘除展开·z2 为零（除数为零退化）",
  },
  {
    subModel: "multiply-divide",
    params: { a1: 2, b1: 0, a2: -1.5, b2: 0 },
    name: "乘除展开·两复数均退化为实数",
  },
  {
    subModel: "multiply-divide",
    params: { a1: -3, b1: -2.5, a2: 4, b2: -1.5 },
    name: "乘除展开·全负参数（符号易错）",
  },
  // conjugate-rationalize
  {
    subModel: "conjugate-rationalize",
    params: { a1: 3, b1: 2, a2: 1, b2: 3 },
    name: "分母实数化·默认参数",
  },
  {
    subModel: "conjugate-rationalize",
    params: { a1: 1, b1: 1, a2: 0, b2: 0 },
    name: "分母实数化·除数为零退化",
  },
  {
    subModel: "conjugate-rationalize",
    params: { a1: 2, b1: -3, a2: 0, b2: 2.5 },
    name: "分母实数化·除数为纯虚数",
  },
  {
    subModel: "conjugate-rationalize",
    params: { a1: 0, b1: 0, a2: 1, b2: -2 },
    name: "分母实数化·分子为零",
  },
  // power-cycle
  { subModel: "power-cycle", params: { powerN: 1 }, name: "i 的幂·n=1" },
  {
    subModel: "power-cycle",
    params: { powerN: 4 },
    name: "i 的幂·n=4（余 0）",
  },
  { subModel: "power-cycle", params: { powerN: 2026 }, name: "i 的幂·n 很大" },
  { subModel: "power-cycle", params: { powerN: -1 }, name: "i 的幂·n 为负" },
  { subModel: "power-cycle", params: { powerN: 0 }, name: "i 的幂·n=0" },
];

function build(
  subModel: (typeof SUB_MODELS)[number],
  params: Record<string, number>,
): MathPanelData {
  return buildMathQuantities("anim-complex-geometry", params, {
    mode: MODE,
    subModel,
  });
}

/** 收集 MathPanelData 中所有非空字符串字段（含数组），带路径 */
function collectTextFields(data: MathPanelData): Array<{
  path: string;
  value: string;
}> {
  const out: Array<{ path: string; value: string }> = [];
  const walk = (node: unknown, path: string) => {
    if (typeof node === "string") {
      if (node.trim()) out.push({ path, value: node });
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${path}[${i}]`));
      return;
    }
    if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`);
    }
  };
  walk(data, "");
  return out;
}

function expectKatexCompilable(expr: string, context: string) {
  const clean = expr?.trim();
  if (!clean) return;
  try {
    katex.renderToString(clean, {
      throwOnError: true,
      displayMode: true,
      strict: false,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    expect.fail(`[KaTeX 编译失败] ${context} -> "${clean}": ${msg}`);
  }
}

/** 统计未配对的 $ 个数（0 表示定界符平衡） */
function countUnpairedDollar(text: string): number {
  const dollars = (text.match(/\$/g) || []).length;
  let consumed = 0;
  const regex = /\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    consumed += m[1] !== undefined ? 4 : 2;
  }
  return dollars - consumed;
}

function extractDollarFormulas(text: string): string[] {
  const formulas: string[] = [];
  const regex = /\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const expr = (m[1] || m[2])?.trim();
    if (expr) formulas.push(expr);
  }
  return formulas;
}

describe("复数 algebraic-operations 模式右屏分支门禁", () => {
  it("三个子情景都必须落到真实分支，严禁静默落空或互相串味", () => {
    const panels = SUB_MODELS.map((s) => ({
      subModel: s,
      data: build(s, { a1: 3, b1: 2, a2: 1, b2: 3, powerN: 1 }),
    }));

    panels.forEach(({ subModel, data }) => {
      expect(
        data.quantities.length,
        `${subModel} 的右屏数学量为空，说明未命中 algebraic-operations 分支`,
      ).toBeGreaterThan(0);
      expect(data.theorems.length, `${subModel} 缺核心定理`).toBeGreaterThan(0);
      expect(
        data.gaokaoPoints.length,
        `${subModel} 缺高考考点`,
      ).toBeGreaterThan(0);
      expect(
        data.reasoningSteps?.length ?? 0,
        `${subModel} 缺推导链`,
      ).toBeGreaterThanOrEqual(3);
    });

    // 分支互斥性：子情景切换后内容必须真正变化（防「subModel 被忽略」的复制粘贴缺陷）
    const [md, cr, pc] = panels.map((p) =>
      p.data.quantities.map((q) => q.label).join("|"),
    );
    expect(md).not.toBe(cr);
    expect(cr).not.toBe(pc);
    expect(md).not.toBe(pc);
  });

  it("所有参数组下右屏文本的 $ 定界符成对、latex 字段无 $、公式均可被 KaTeX 编译", () => {
    for (const { subModel, params, name } of PARAM_CASES) {
      const data = build(subModel, params);
      const fields = collectTextFields(data);
      expect(fields.length, `${name}：无任何文本字段`).toBeGreaterThan(0);

      for (const { path, value } of fields) {
        // latex 是整串公式字段，不得含 $ 定界符
        if (/\.latex$/.test(path)) {
          expect(
            value.includes("$"),
            `${name} ${path} 是整串公式字段，不应含 $：${JSON.stringify(value)}`,
          ).toBe(false);
          expectKatexCompilable(value, `${name} ${path}`);
          continue;
        }

        // 其余承载数学的字段：$ 必须成对，$...$ 内表达式必须合法
        expect(
          countUnpairedDollar(value),
          `${name} ${path} 中 $ 定界符未成对：${JSON.stringify(value)}`,
        ).toBe(0);
        extractDollarFormulas(value).forEach((f) =>
          expectKatexCompilable(f, `${name} ${path} 的 $...$ 片段`),
        );
      }
    }
  });

  it("label / unit / rubric 中不得出现未被 $ 包裹的裸 LaTeX 命令", () => {
    const BARE_CMD =
      /\\(?:color|dfrac|tfrac|frac|sqrt|sum|prod|int|infty|cdot|times|pm|le|ge|neq|triangle|angle|vec|bar|hat|Delta|lambda|theta|mu|sigma|alpha|beta|gamma|pi|omega|arg|min|max|lim|ln|log|sin|cos|tan|text|begin|left|right)\b/;

    for (const { subModel, params, name } of PARAM_CASES) {
      const data = build(subModel, params);
      for (const { path, value } of collectTextFields(data)) {
        if (!/\.(label|unit|rubric)$/.test(path)) continue;
        const outside = value.replace(/\$[^$\n]*\$/g, "");
        expect(
          BARE_CMD.test(outside),
          `${name} ${path} 含未被 $ 包裹的裸 LaTeX 命令：${JSON.stringify(value)}`,
        ).toBe(false);
      }
    }
  });

  it("推导链每步都要有标题、过程说明与采分点，且步号连续", () => {
    for (const { subModel, params, name } of PARAM_CASES) {
      const steps = build(subModel, params).reasoningSteps ?? [];
      expect(steps.length, `${name}：缺推导链`).toBeGreaterThanOrEqual(3);
      steps.forEach((s, i) => {
        expect(s.step, `${name} 第 ${i + 1} 步步号错位`).toBe(i + 1);
        expect(s.title?.trim(), `${name} 第 ${i + 1} 步缺标题`).toBeTruthy();
        expect(
          s.detail?.trim(),
          `${name} 第 ${i + 1} 步缺过程说明`,
        ).toBeTruthy();
        expect(s.rubric?.trim(), `${name} 第 ${i + 1} 步缺采分点`).toBeTruthy();
      });
    }
  });

  it("乘除展开分支的右屏数值必须与 math 层严格同源", () => {
    const params = { a1: 3, b1: 2, a2: 1, b2: 3 };
    const z1 = createComplex(params.a1, params.b1);
    const z2 = createComplex(params.a2, params.b2);
    const prod = mulComplex(z1, z2); // (3+2i)(1+3i) = 3 + 9i + 2i + 6i² = -3 + 11i
    const quo = divComplex(z1, z2);

    expect(prod).toEqual({ re: -3, im: 11 });
    expect(quo.valid).toBe(true);

    const data = build("multiply-divide", params);
    const value = (symbol: string) =>
      data.quantities.find((q) => q.symbol === symbol)?.value ?? "";

    // 乘积与商都必须与 math 层一致（同源校验，防右屏与图形各算一套）
    expect(value("z_1 z_2")).toContain("-3");
    expect(value("z_1 z_2")).toContain("11");
    // 分母 |z2|² = 1 + 9 = 10
    expect(value("|z_2|^2")).toContain("10.00");
    expect(value("z_1 / z_2")).not.toContain("无意义");

    // 共轭加法恒等式：z + z̄ = 2a 必须成立（守住共轭相关数学量的符号）
    expect(addComplex(z2, { re: z2.re, im: -z2.im })).toEqual({
      re: 2 * z2.re,
      im: 0,
    });
  });

  it("i 的幂分支的右屏取值必须等于 n mod 4 的查表结果", () => {
    for (const n of [-8, -1, 0, 1, 2, 3, 4, 5, 7, 12, 2026]) {
      const data = build("power-cycle", { powerN: n });
      const value = (symbol: string) =>
        data.quantities.find((q) => q.symbol === symbol)?.value ?? "";
      const table = powerOfI(n).latex;
      expect(value("i^n"), `n=${n} 的 i^n 取值错误`).toBe(table);
      expect(value("n \\bmod 4"), `n=${n} 的余数错误`).toBe(
        `${powerOfI(n).residue}`,
      );
      // 连续四项之和恒为 0
      expect(value("\\sum_{k=0}^{3} i^{n+k}"), `n=${n} 四项和不为零`).toBe(
        "0 + 0i",
      );
    }
  });

  it("除数为零时必须给出明确警示，且不得输出伪造的商", () => {
    const data = build("multiply-divide", { a1: 1, b1: 1, a2: 0, b2: 0 });
    expect(
      data.warnings.some((w) => w.level === "warning"),
      "z2 = 0 时缺少除法无意义警示",
    ).toBe(true);
    const quo = data.quantities.find((q) => q.symbol === "z_1 / z_2");
    expect(quo?.value ?? "").toContain("无意义");
  });
});

describe("复数代数运算：预设与可见视口一致性守卫", () => {
  const FULL = CANVAS_PRESETS.full;

  /** 与 `useSceneScale` 同源现算可见数学范围（不手抄常数） */
  function scaleOf(
    studyMode: ComplexStudyMode,
    subModel: ComplexSubModel,
  ): SceneScale {
    const vp = resolveComplexViewport(studyMode, subModel);
    return calculateSceneScale({
      designVisibleW: FULL.width,
      designVisibleH: FULL.height,
      designLeft: 0,
      designTop: 0,
      xRange: vp.xRange,
      yRange: vp.yRange,
    });
  }

  it("视口分派：代数落点用放大视口，i 的幂仍用默认视口", () => {
    expect(resolveComplexViewport("plane-operations", "circle")).toEqual(
      COMPLEX_VIEWPORT_DEFAULT,
    );
    expect(
      resolveComplexViewport("algebraic-operations", "multiply-divide"),
    ).toEqual(COMPLEX_VIEWPORT_ALGEBRAIC);
    expect(
      resolveComplexViewport("algebraic-operations", "conjugate-rationalize"),
    ).toEqual(COMPLEX_VIEWPORT_ALGEBRAIC);
    // power-cycle 画半径 1 的单位圆：若也用放大视口，圆会被缩成一个点
    expect(
      resolveComplexViewport("algebraic-operations", "power-cycle"),
    ).toEqual(COMPLEX_VIEWPORT_DEFAULT);
  });

  it("默认参数的乘积 −3 + 11i 必须落在放大视口内（否则主结论第一眼就被裁掉）", () => {
    const sc = scaleOf("algebraic-operations", "multiply-divide");
    const prod = mulComplex(
      createComplex(defaultParams.a1, defaultParams.b1),
      createComplex(defaultParams.a2, defaultParams.b2),
    );
    expect(prod).toEqual({ re: -3, im: 11 });
    expect(prod.re).toBeGreaterThanOrEqual(sc.xMin);
    expect(prod.re).toBeLessThanOrEqual(sc.xMax);
    expect(prod.im).toBeGreaterThanOrEqual(sc.yMin);
    expect(prod.im).toBeLessThanOrEqual(sc.yMax);
  });

  it("每个代数预设加载后，主推结论点都落在可见视口内", () => {
    for (const sub of COMPLEX_ALGEBRAIC_SUB_MODELS) {
      const sc = scaleOf("algebraic-operations", sub);
      const visible = (re: number, im: number) =>
        re >= sc.xMin && re <= sc.xMax && im >= sc.yMin && im <= sc.yMax;

      for (const preset of COMPLEX_ALGEBRAIC_PRESETS[sub]) {
        const ctx = `[${sub} / ${preset.key}]`;
        const params = { ...defaultParams, ...preset.params };

        if (sub === "power-cycle") {
          // 单位圆上的四张牌必须全部可见
          expect(
            visible(1, 0) && visible(0, 1) && visible(-1, 0) && visible(0, -1),
            `${ctx} 单位圆的四张牌越出可见视口`,
          ).toBe(true);
          const n = params.powerN ?? 1;
          expect(
            Math.abs(n),
            `${ctx} powerN = ${n} 超出滑块声明域`,
          ).toBeLessThanOrEqual(12);
          continue;
        }

        const z1 = createComplex(params.a1, params.b1);
        const z2 = createComplex(params.a2, params.b2);
        const prod = mulComplex(z1, z2);
        expect(
          visible(prod.re, prod.im),
          `${ctx} 乘积 ${prod.re} + ${prod.im}i 越出可见视口`,
        ).toBe(true);

        const quo = divComplex(z1, z2);
        expect(quo.valid, `${ctx} 预设中除数不应为零`).toBe(true);
        expect(
          visible(quo.result.re, quo.result.im),
          `${ctx} 商 ${quo.result.re} + ${quo.result.im}i 越出可见视口`,
        ).toBe(true);

        // 分母实数化落点：必在实轴上，且必须可见（这是本子情景的教学落点）
        const denom = z2.re * z2.re + z2.im * z2.im;
        expect(
          visible(denom, 0),
          `${ctx} 分母实数化落点 ${denom} 越出可见视口`,
        ).toBe(true);
      }
    }
  });
});
