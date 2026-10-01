import { describe, it, expect } from "vitest";
import { buildLineCirclePanel } from "../lineCircle";
import { solveChordLineFromMidpoint } from "@/math/lineCircle";

describe("buildLineCirclePanel 右屏数据构造器测试", () => {
  it("位置关系模式 (relation): 正确生成三步破题推演链与双轨判定指标", () => {
    const data = buildLineCirclePanel(
      { a: 0, b: 0, r: 3, k: 0.75, m: -1 },
      { studyMode: "relation" },
    );

    expect(data.quantities.length).toBeGreaterThanOrEqual(4);
    expect(data.theorems.length).toBeGreaterThanOrEqual(3);
    expect(data.gaokaoPoints.length).toBeGreaterThanOrEqual(3);
    expect(data.examAnchor).toContain("双轨判定");

    // 验证推导链三部曲
    expect(data.reasoningSteps).toBeDefined();
    expect(data.reasoningSteps?.length).toBe(3);
    expect(data.reasoningSteps?.[0].title).toContain("审题定法");
    expect(data.reasoningSteps?.[1].title).toContain("建模计算");
    expect(data.reasoningSteps?.[2].title).toContain("求解判定");

    // 验证内联数学符号是否包裹 $
    data.reasoningSteps?.forEach((step) => {
      expect(step.rubric).toBeDefined();
      expect(step.rubric).toContain("采分点");
      expect(step.latex).toBeTruthy();
    });
  });

  it("相交弦长模式 (chord): 相交状态下正确生成几何勾股与代数韦达推导链", () => {
    const data = buildLineCirclePanel(
      { a: 0, b: 0, r: 5, k: 0, m: -3, mx: 1, my: 1 },
      { studyMode: "chord" },
    );

    // 验证关键数学量
    const lGeom = data.quantities.find((q) => q.label.includes("几何弦长"));
    expect(lGeom).toBeDefined();
    expect(String(lGeom?.value)).toContain("8"); // 2 * sqrt(25 - 9) = 8

    const dVal = data.quantities.find((q) => q.label.includes("弦心距"));
    expect(dVal).toBeDefined();
    expect(String(dVal?.value)).toContain("3");

    // 验证推导链
    expect(data.reasoningSteps).toBeDefined();
    expect(data.reasoningSteps?.length).toBe(3);
    expect(data.reasoningSteps?.[1].detail).toContain(
      "\\text{Rt}\\triangle CHA",
    );
    expect(data.reasoningSteps?.[1].latex).toContain("r^2 = d^2");
    expect(data.reasoningSteps?.[2].latex).toContain("L = 2\\sqrt{r^2 - d^2}");
  });

  it("相交弦长模式 (chord): 相离状态下正确生成无实数解预警与推导闭环", () => {
    const data = buildLineCirclePanel(
      { a: 0, b: 0, r: 3, k: 0, m: 5 },
      { studyMode: "chord" },
    );

    const lGeom = data.quantities.find((q) => q.label.includes("几何弦长"));
    expect(String(lGeom?.value)).toContain("相离");

    expect(data.warnings.some((w) => w.text.includes("相离无公共交点"))).toBe(
      true,
    );
    expect(data.reasoningSteps?.[2].latex).toContain("相离");
  });

  it("切线模式 (tangent): 正确计算切线长与切点弦方程推导", () => {
    const data = buildLineCirclePanel(
      { a: 0, b: 0, r: 3, px: 5, py: 0 },
      { studyMode: "tangent" },
    );

    const pt = data.quantities.find((q) => q.label.includes("切线长"));
    expect(String(pt?.value)).toContain("4"); // sqrt(25 - 9) = 4

    expect(data.reasoningSteps).toBeDefined();
    expect(data.reasoningSteps?.length).toBe(3);
    expect(data.reasoningSteps?.[1].latex).toContain(
      "PT = \\sqrt{|PC|^2 - r^2}",
    );
    expect(data.reasoningSteps?.[2].title).toContain("切点弦方程");
  });

  it("垂径中点模式 (midpoint): 正确输出垂径垂直斜率乘积与点差法原理", () => {
    const data = buildLineCirclePanel(
      { a: 0, b: 0, r: 5, k: 2, m: 1 },
      { studyMode: "midpoint" },
    );

    const kProd = data.quantities.find((q) => q.label.includes("斜率乘积"));
    expect(kProd).toBeDefined();
    expect(String(kProd?.value)).toContain("-1");

    expect(data.reasoningSteps).toBeDefined();
    expect(data.reasoningSteps?.length).toBe(3);
    expect(data.reasoningSteps?.[2].title).toContain("点差法原理");
  });

  it("垂径中点模式 (midpoint) 退化：连心线水平 ⇒ 割线铅垂，严禁播报渲染哨兵 1000000", () => {
    // 圆心 C(0,0)，弦中点 M(3,0) 与圆心等高（my = b）⇒ 连心线 CH 水平 ⇒ 割线 AB 为铅垂线 x = 3。
    // 斜截式无法表达铅垂线，solveChordLineFromMidpoint 会返回渲染哨兵 k = 1e6。
    // 修复前：看板直接把该哨兵经 formatMathNumber 播报成 "1000000"，
    // 且推导链输出 "k_{AB} = -1/0 = 1000000" 这类学生可当场代入推翻的假等式。
    const chord = solveChordLineFromMidpoint(0, 0, 3, 0);
    expect(chord.degenerate).toBe(true);

    const data = buildLineCirclePanel(
      { a: 0, b: 0, r: 5, k: chord.k, m: chord.m, mx: 3, my: 0 },
      { studyMode: "midpoint" },
    );

    const kAB = data.quantities.find((q) => q.label.includes("割线 AB 斜率"));
    expect(kAB).toBeDefined();
    expect(String(kAB?.value)).toBe("不存在");
    expect(String(kAB?.value)).not.toContain("1000000");

    const kProd = data.quantities.find((q) => q.label.includes("斜率乘积"));
    expect(String(kProd?.value)).toContain("退化不适用");

    // 推导链第 2 步（斜率垂直乘积）必须显式判退化，不得输出哨兵
    const step2 = data.reasoningSteps?.[1];
    expect(step2?.latex).toBeTruthy();
    expect(String(step2?.latex)).not.toContain("1000000");
    expect(String(step2?.latex)).toContain("不存在");

    // 全看板与全推导链都不允许出现哨兵值
    data.quantities.forEach((q) => {
      expect(String(q.value)).not.toContain("1000000");
    });
    data.reasoningSteps?.forEach((step) => {
      expect(String(step.latex)).not.toContain("1000000");
    });

    // 必须有针对铅垂割线的教学警示
    expect(data.warnings.some((w) => w.text.includes("$k_{AB}$ 不存在"))).toBe(
      true,
    );
  });

  it("契约保证：计算型推导步骤绝无孤立数字，严格遵循等号链三部曲 (公式 -> 代入 -> 结果)", () => {
    const modes = ["relation", "chord", "tangent", "midpoint"] as const;

    modes.forEach((mode) => {
      const data = buildLineCirclePanel(
        { a: 0, b: 0, r: 5, k: 0.75, m: -1, px: 5, py: 4, mx: 1, my: 1 },
        { studyMode: mode },
      );

      data.reasoningSteps?.forEach((step) => {
        expect(step.latex).toBeDefined();
        if (!step.latex) return;

        // 严禁纯 "变量 = 孤立数字" 的断层式输出
        expect(step.latex).not.toMatch(/^[A-Za-z_{}]+ = \d+(\.\d+)?$/);

        // 若包含根号或分式运算，等号/推导符必须至少出现 2 次（公式 -> 代入 -> 结果）
        if (step.latex.includes("\\frac") || step.latex.includes("\\sqrt")) {
          const deductionOps = (step.latex.match(/(=|\\implies|\\iff)/g) || [])
            .length;
          expect(deductionOps).toBeGreaterThanOrEqual(2);
        }
      });
    });
  });
});
