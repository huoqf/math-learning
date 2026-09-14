import { describe, it, expect } from "vitest";
import { buildConstantDoublePanel } from "../constantDouble";

describe("buildConstantDoublePanel (双变量博弈面板数据构建)", () => {
  const defaultParams = {
    yf: 2.5,
    xf: 1.25,
    yg: 1.5,
    xg: 2.25,
  };

  it("all_all (任意对任意) 模式生成规范数据", () => {
    const data = buildConstantDoublePanel(defaultParams, {
      selectedLogic: "all_all",
    });

    expect(data.quantities.length).toBeGreaterThan(0);
    expect(data.theorems.length).toBeGreaterThan(0);
    expect(data.reasoningSteps?.length).toBe(3);
    expect(data.gaokaoPoints.length).toBeGreaterThan(0);
    expect(data.examAnchor).toContain("双变量量词博弈");

    // 检查定理中的核心模型公式
    expect(data.theorems[0].latex).toContain("f_{\\min} \\ge g_{\\max}");

    // 检查破题三步推演链三要素
    const steps = data.reasoningSteps!;
    expect(steps[0].title).toContain("审题定法");
    expect(steps[1].title).toContain("建模联立");
    expect(steps[2].title).toContain("求解反思");

    // 检查所有推导步骤包含采分点
    for (const step of steps) {
      expect(step.rubric).toBeDefined();
      expect(step.rubric).toContain("采分点");
    }
  });

  it("same_var (同自变量对垒) 模式采用差函数法", () => {
    const data = buildConstantDoublePanel(defaultParams, {
      selectedLogic: "same_var",
    });

    expect(data.theorems[0].name).toContain("同自变量恒成立 · 差函数法");
    expect(data.theorems[0].latex).toContain("h(x)_{\\min} \\ge 0");

    // 作用域交集
    const domainQuantity = data.quantities.find(
      (q) => q.label === "作用域公共交集",
    );
    expect(domainQuantity).toBeDefined();
    expect(domainQuantity?.value).toBe("[1.50, 2.00]");
  });

  it("all_exist (任意对存在) 模式校验极小保底", () => {
    const data = buildConstantDoublePanel(defaultParams, {
      selectedLogic: "all_exist",
    });

    expect(data.theorems[0].name).toContain("极小保底支撑");
    expect(data.theorems[0].latex).toContain("f_{\\min} \\ge g_{\\min}");
  });

  it("exist_all (存在对任意) 模式校验顶峰压制", () => {
    const data = buildConstantDoublePanel(defaultParams, {
      selectedLogic: "exist_all",
    });

    expect(data.theorems[0].name).toContain("极大顶峰压制");
    expect(data.theorems[0].latex).toContain("f_{\\max} \\ge g_{\\max}");
  });

  it("exist_exist (存在对存在) 模式校验准入门槛与违背警告", () => {
    // 设置 yf=-0.8，导致 f_max = 0.20 < g_min = 1.00，博弈违背
    const violatedParams = {
      xf: 1.0,
      yf: -0.8,
      xg: 2.0,
      yg: 2.0,
    };
    const data = buildConstantDoublePanel(violatedParams, {
      selectedLogic: "exist_exist",
    });

    expect(data.theorems[0].name).toContain("门槛局部超越");
    expect(data.theorems[0].latex).toContain("f_{\\max} \\ge g_{\\min}");

    // 违背警告必须有警示信息且公式规范包裹
    expect(data.warnings.length).toBe(1);
    expect(data.warnings[0].text).toContain("\\Delta y");
    expect(data.warnings[0].text).toContain("y_f");

    // 验证 quantities 动态对齐：只出现冲顶值与准入值，绝不出现不相干的 f_min 与 g_max
    const labels = data.quantities.map((q) => q.label);
    expect(labels).toContain("f(x) 极大冲顶值");
    expect(labels).toContain("g(x) 极小准入值");
    expect(labels).not.toContain("f(x) 最小值");
    expect(labels).not.toContain("g(x) 最大值");
  });

  it("推导链代数三部曲严谨性：杜绝机器浮点尾零与孤立空降数值", () => {
    const data = buildConstantDoublePanel(defaultParams, {
      selectedLogic: "same_var",
    });

    const step2 = data.reasoningSteps![1];
    // 严禁 7.00x 机器浮点尾零
    expect(step2.latex).not.toMatch(/\d+\.00[a-zA-Z]/);
    // 必须包含标准展开式符号表达
    expect(step2.latex).toContain("f(x) - g(x)");

    const step3 = data.reasoningSteps![2];
    // 严禁跳步生硬的负号程序化表达式
    expect(step3.latex).not.toContain("g_{\\max} - (f_{\\min} - y_f)");
    // 必须按代入求值得出参数不等式
    expect(step3.latex).toContain("y_f \\ge");
  });
});
