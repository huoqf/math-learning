import { describe, it, expect } from "vitest";
// @ts-expect-error -- importing internal mjs audit script
import { FileContext } from "../../.agents/skills/math-page-audit/scripts/engine/context.mjs";
// @ts-expect-error -- importing internal mjs audit script
import { architectureRules } from "../../.agents/skills/math-page-audit/scripts/rules/architecture.mjs";
// @ts-expect-error -- importing internal mjs audit script
import { styleTokensRules } from "../../.agents/skills/math-page-audit/scripts/rules/style-tokens.mjs";
// @ts-expect-error -- importing internal mjs audit script
import { rightPanelRules } from "../../.agents/skills/math-page-audit/scripts/rules/right-panel.mjs";
// @ts-expect-error -- importing internal mjs audit script
import { disciplineRules } from "../../.agents/skills/math-page-audit/scripts/rules/discipline.mjs";
// @ts-expect-error -- importing internal mjs audit script
import { runAudit } from "../../.agents/skills/math-page-audit/scripts/engine/runner.mjs";

interface AuditRule {
  id: string;
  type: string;
  severity: string;
  check: (ctx: unknown) => Array<{
    lineNum: number;
    message: string;
    snippet?: string;
    type?: string;
    severity?: string;
  }>;
}

describe("Audit Engine & Suppression Tests", () => {
  it("应正确检测 BrowserRouter 架构违规", () => {
    const badCode = `
import { BrowserRouter } from 'react-router-dom';
export function App() {}
`;
    const ctx = new FileContext(
      "src/features/demo/DemoApp.tsx",
      badCode,
      process.cwd(),
    );
    const rule = (architectureRules as AuditRule[]).find(
      (r: AuditRule) => r.id === "arch/no-browser-router",
    )!;
    const issues = rule.check(ctx);
    expect(issues.length).toBe(1);
    expect(issues[0].message).toContain("全库禁止使用 BrowserRouter");
  });

  it("应支持通过 // audit-disable-next-line 豁免下一行违规", () => {
    const suppressedCode = `
// audit-disable-next-line arch/no-browser-router
import { BrowserRouter } from 'react-router-dom';
export function App() {}
`;
    const ctx = new FileContext(
      "src/features/demo/DemoApp.tsx",
      suppressedCode,
      process.cwd(),
    );
    const rule = (architectureRules as AuditRule[]).find(
      (r: AuditRule) => r.id === "arch/no-browser-router",
    )!;
    const issues = rule.check(ctx);
    expect(issues.length).toBe(1);
    // 检查 ctx.isSuppressed 是否正确判定为已豁免
    expect(
      ctx.isSuppressed(issues[0].lineNum, rule.id, "全局禁止BrowserRouter"),
    ).toBe(true);
  });

  it("未匹配到的规则不应被豁免", () => {
    const mismatchedSuppression = `
// audit-disable-next-line other-rule
import { BrowserRouter } from 'react-router-dom';
export function App() {}
`;
    const ctx = new FileContext(
      "src/features/demo/DemoApp.tsx",
      mismatchedSuppression,
      process.cwd(),
    );
    const rule = (architectureRules as AuditRule[]).find(
      (r: AuditRule) => r.id === "arch/no-browser-router",
    )!;
    const issues = rule.check(ctx);
    expect(issues.length).toBe(1);
    expect(
      ctx.isSuppressed(issues[0].lineNum, rule.id, "全局禁止BrowserRouter"),
    ).toBe(false);
  });

  it("加固：支持跳过多余空行准确绑定目标代码行", () => {
    const codeWithEmptyLines = `
// audit-disable-next-line arch/no-browser-router


import { BrowserRouter } from 'react-router-dom';
export function App() {}
`;
    const ctx = new FileContext(
      "src/features/demo/DemoApp.tsx",
      codeWithEmptyLines,
      process.cwd(),
    );
    const rule = (architectureRules as AuditRule[]).find(
      (r: AuditRule) => r.id === "arch/no-browser-router",
    )!;
    const issues = rule.check(ctx);
    expect(issues.length).toBe(1);
    // 第 5 行是真正代码行，应该被准确豁免
    expect(
      ctx.isSuppressed(issues[0].lineNum, rule.id, "全局禁止BrowserRouter"),
    ).toBe(true);
  });

  it("加固：状态机准确剥离带单双引号嵌套的注释，防止误报", () => {
    const codeWithNestedQuotes = `
export const msg = "Don't touch"; // stroke="#EF4444" 这里是注释中的十六进制颜色
`;
    const ctx = new FileContext(
      "src/features/demo/DemoApp.tsx",
      codeWithNestedQuotes,
      process.cwd(),
    );
    const rule = (styleTokensRules as AuditRule[]).find(
      (r: AuditRule) => r.id === "style/no-hardcoded-hex",
    )!;
    const issues = rule.check(ctx);
    // 因为注释中的 #EF4444 已经被状态机彻底清洗，所以不会误报
    expect(issues.length).toBe(0);
  });

  it("高价值规则：拦截子组件中私自设置 overflow-y-auto 嵌套滚动", () => {
    const nestedScrollCode = `
export function SubCard() {
  return <div className="p-4 overflow-y-auto">内容</div>;
}
`;
    const ctx = new FileContext(
      "src/features/demo/SubCard.tsx",
      nestedScrollCode,
      process.cwd(),
    );
    const rule = (architectureRules as AuditRule[]).find(
      (r: AuditRule) => r.id === "arch/no-nested-vertical-scroll",
    )!;
    const issues = rule.check(ctx);
    expect(issues.length).toBe(1);
    expect(issues[0].message).toContain(
      "严禁在子卡片或内部组件中私自设置 overflow-y-auto",
    );
  });

  it("高价值规则：拦截推导链直接给孤立数值跳步", () => {
    const isolatedNumberCode = `
export function buildTestPanel() {
  const reasoningSteps = [];
  reasoningSteps.push({
    step: 2,
    latex: "|AB| = 5.33",
  });
}
`;
    const ctx = new FileContext(
      "src/data/builders/demoBuilder.ts",
      isolatedNumberCode,
      process.cwd(),
    );
    const rule = (rightPanelRules as AuditRule[]).find(
      (r: AuditRule) => r.id === "right/reasoning-no-isolated-number",
    )!;
    const issues = rule.check(ctx);
    expect(issues.length).toBe(1);
    expect(issues[0].message).toContain("推导链严禁跳步直接给孤立数值");
  });

  it("CLI 增强：runAudit 支持 rule 定向过滤与耗时统计", () => {
    const res = runAudit({
      targetDir: "src/features/parabola",
      workspaceRoot: process.cwd(),
      rule: "arch/no-browser-router",
    });
    expect(res.activeRulesCount).toBe(1);
    expect(res.totalIssues).toBe(0);
    expect(res.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("CLI 增强：runAudit 支持 group 定向过滤", () => {
    const res = runAudit({
      targetDir: "src/features/parabola",
      workspaceRoot: process.cwd(),
      group: "arch",
    });
    expect(res.activeRulesCount).toBeGreaterThanOrEqual(3);
    expect(res.totalIssues).toBe(0);
  });

  it("防误报加固：raw-latex-instructions 不受模板字符串变量插值 ${...} 干扰，且能识别真实裸露指令", () => {
    const rule = (disciplineRules as AuditRule[]).find(
      (r: AuditRule) => r.id === "discipline/raw-latex-instructions",
    )!;

    // 含有 ${...} 插值且公式已包裹 $...$：不应报任何 issue
    const validInterpolatedCode = `
export function buildDemo() {
  const dVal = "1.50";
  return {
    detail: \`比较距离与半径：$d = \${dVal} < r = 2.00$，判别式 $\\\\Delta = 3.00 > 0$\`,
  };
}
`;
    const validCtx = new FileContext(
      "src/data/builders/demoBuilder.ts",
      validInterpolatedCode,
      process.cwd(),
    );
    expect(rule.check(validCtx).length).toBe(0);

    // 真实裸露 LaTeX 指令：必须被拦截
    const invalidCode = `
export function buildDemo() {
  return {
    detail: "判别式为 \\\\Delta > 0，故有两个相异实根",
  };
}
`;
    const invalidCtx = new FileContext(
      "src/data/builders/demoBuilder.ts",
      invalidCode,
      process.cwd(),
    );
    const issues = rule.check(invalidCtx);
    expect(issues.length).toBe(1);
    expect(issues[0].message).toContain("未用 $...$ 包裹");
  });

  it("防误报加固：algebra-rigor 不误伤无穷大 infty 与定义域集合真充要，仍严密防范点线伪充要", () => {
    const rule = (rightPanelRules as AuditRule[]).find(
      (r: AuditRule) => r.id === "right/algebra-rigor",
    )!;

    // 包含无穷大区间与定义域真充要：不应误判为伪命题
    const validMathCode = `
export function buildDemo() {
  return {
    theorems: [
      { latex: "x \\\\in D_{\\\\text{复合}} \\\\iff g(x) \\\\in D_f" },
      { latex: "x \\\\ge 0 \\\\iff D = [0, +\\\\infty)" },
      { latex: "Q \\\\in l \\\\iff QA \\\\perp QB \\\\iff F \\\\in AB \\\\iff QF \\\\perp AB" }
    ]
  };
}
`;
    const validCtx = new FileContext(
      "src/data/builders/demoBuilder.ts",
      validMathCode,
      process.cwd(),
    );
    const issues = rule
      .check(validCtx)
      .filter((i) => i.type === "伪命题充要条件滥用");
    expect(issues.length).toBe(0);

    // 真正的点线伪充要滥用（过定点反推直线方程）：必须拦截
    const invalidCode = `
export function buildDemo() {
  return {
    theorems: [
      { latex: "l: y = kx + b \\\\iff P(x_0, y_0) \\\\in l" }
    ]
  };
}
`;
    const invalidCtx = new FileContext(
      "src/data/builders/demoBuilder.ts",
      invalidCode,
      process.cwd(),
    );
    const badIssues = rule
      .check(invalidCtx)
      .filter((i) => i.type === "伪命题充要条件滥用");
    expect(badIssues.length).toBe(1);
    expect(badIssues[0].message).toContain("点线位置关系严禁滥用充要双向箭头");
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 门禁升级：discipline/no-beyond-syllabus-terms 由「文件级豁免」收紧为「条目级豁免」
  // 背景：旧实现只要文件里出现过「拓展」字样就整份豁免，导致「局部含拓展 → 整页超纲检测失效」。
  // ───────────────────────────────────────────────────────────────────────────
  describe("超纲术语门禁：文件级豁免 → 条目级豁免", () => {
    const beyondRule = (disciplineRules as AuditRule[]).find(
      (r: AuditRule) => r.id === "discipline/no-beyond-syllabus-terms",
    )!;

    const checkAt = (relPath: string, code: string) =>
      beyondRule.check(new FileContext(relPath, code, process.cwd()));

    const checkDemo = (code: string) =>
      checkAt("src/data/builders/demoBuilder.ts", code);

    it("条目自身标注 isExtension: true → 降级为 warning（合法拓展）", () => {
      const code = `
export function buildDemo() {
  return {
    theorems: [
      {
        name: "洛必达法则的适用边界",
        latex: "x",
        isExtension: true,
      },
    ],
  };
}
`;
      const issues = checkDemo(code);
      expect(issues.length).toBe(1);
      expect(issues[0].severity).toBe("warning");
    });

    it("漏洞封堵：兄弟条目标了拓展，不得外溢豁免本条目（必须 error）", () => {
      const code = `
export function buildDemo() {
  return {
    theorems: [
      { name: "合法条目", latex: "x", isExtension: true },
    ],
    warnings: [
      { text: "本页用洛必达法则求解该极限问题。" },
    ],
  };
}
`;
      const issues = checkDemo(code);
      expect(issues.length).toBe(1);
      // 旧实现会把 return 外层聚合对象整体豁免，从而降级为 warning —— 这里锁死为 error
      expect(issues[0].severity).toBe("error");
    });

    it("条目级隔离：同一条目内标注可豁免，另一未标条目仍须 error", () => {
      const code = `
export function buildDemo() {
  return {
    gaokaoPoints: [
      { text: "拓展延伸：特征方程法求通项。", importance: "extend" },
      { text: "本页用洛必达法则求解该极限问题。" },
    ],
  };
}
`;
      const severities = checkDemo(code).map((i) => i.severity);
      expect(severities).toContain("warning");
      expect(severities).toContain("error");
    });

    it("自由文本「拓展 · 选学」不再构成任何豁免依据（必须 error）", () => {
      const code = `
export function buildDemo() {
  return {
    meta: { note: "拓展 · 选学（超出课标，仅供参考）" },
    warnings: [
      { text: "本页用洛必达法则求解该极限问题。" },
    ],
  };
}
`;
      const issues = checkDemo(code);
      expect(issues.length).toBe(1);
      expect(issues[0].severity).toBe("error");
    });

    it("节点级豁免有效：真实 extend 节点的 builder 文件 → warning", () => {
      const code = `
export function buildDemo() {
  return {
    warnings: [{ text: "本页用洛必达法则求解该极限问题。" }],
  };
}
`;
      const issues = checkAt("src/data/builders/lineParamT.ts", code);
      expect(issues.length).toBe(1);
      expect(issues[0].severity).toBe("warning");
    });

    it("节点级豁免有效：真实 extend feature 目录 → warning", () => {
      const code = `
export function LineParamTAnimation() {
  return { warnings: [{ text: "本页用洛必达法则求解该极限问题。" }] };
}
`;
      const issues = checkAt(
        "src/features/conicParamT/LineParamTAnimation.tsx",
        code,
      );
      expect(issues.length).toBe(1);
      expect(issues[0].severity).toBe("warning");
    });

    it("非 extend 节点文件不得豁免：真实普通 builder → error", () => {
      const code = `
export function buildDemo() {
  return {
    warnings: [{ text: "本页用洛必达法则求解该极限问题。" }],
  };
}
`;
      const issues = checkAt("src/data/builders/sequence.ts", code);
      expect(issues.length).toBe(1);
      expect(issues[0].severity).toBe("error");
    });

    it("黑名单已覆盖「三垂线」：未声明拓展的正文命中即 error", () => {
      // 三垂线定理属旧大纲、2019 人教A版课标已删，本库统一改用「线面垂直的判定与性质」；
      // 此用例锁死黑名单条目，防止日后误删导致该术语再次静默流入正文。
      const code = `
export function buildDemo() {
  return {
    reasoningSteps: [
      { step: 1, detail: "由三垂线定理得 EM ⊥ BD" },
    ],
  };
}
`;
      const issues = checkDemo(code);
      expect(issues.length).toBe(1);
      expect(issues[0].severity).toBe("error");
    });

    it("黑名单已覆盖「极点/极线」族拆分变体：未声明拓展即 error", () => {
      // 圆锥曲线的「极点极线」属超纲内容，但曾有一页把它包装成课标内的「切点弦」，
      // 正文只用「极线对偶公式」「外部极点」这类拆分写法，因黑名单仅收录四字整串而被静默放行。
      // 此用例锁死拆分变体，防止该术语再次以"换词"方式绕开门禁。
      const poleCode = `
export function buildDemo() {
  return {
    theorems: [
      { name: "切点弦方程", condition: "外部极点 $P$ 向曲线引两条切线，$A$、$B$ 为两切点" },
    ],
  };
}
`;
      const poleIssues = checkDemo(poleCode);
      expect(poleIssues.length).toBe(1);
      expect(poleIssues[0].severity).toBe("error");
      expect(poleIssues[0].message).toContain("极点");

      const polarCode = `
export function buildDemo() {
  return {
    reasoningSteps: [{ step: 1, detail: "利用极线对偶公式一步写出切点弦方程" }],
  };
}
`;
      const polarIssues = checkDemo(polarCode);
      expect(polarIssues.length).toBe(1);
      expect(polarIssues[0].severity).toBe("error");
      expect(polarIssues[0].message).toContain("极线");
    });

    it("已声明拓展的条目使用极点/极线表述 → 降级为 warning（合法拓展）", () => {
      const code = `
export function buildDemo() {
  return {
    warnings: [
      { text: "极点位于曲线内部时不存在真实切线。", isExtension: true },
    ],
  };
}
`;
      const issues = checkDemo(code);
      expect(issues.length).toBe(1);
      expect(issues[0].severity).toBe("warning");
    });
  });

  describe("arch/no-builder-raw-calc 门禁规则对抗性拦截测试 (10/10 守护验证)", () => {
    const rule = (architectureRules as AuditRule[]).find(
      (r: AuditRule) => r.id === "arch/no-builder-raw-calc",
    )!;

    it("1. 拦截长变量名 Math.sqrt: const circumRadius = Math.sqrt(...)", () => {
      const code = `const circumRadius = Math.sqrt(a * a + b * b + c * c) / 2;`;
      const ctx = new FileContext(
        "src/data/builders/solidA.ts",
        code,
        process.cwd(),
      );
      expect(rule.check(ctx).length).toBe(1);
    });

    it("2. 拦截 Math.hypot: const dist = Math.hypot(x, y)", () => {
      const code = `const dist = Math.hypot(x, y);`;
      const ctx = new FileContext(
        "src/data/builders/solidB.ts",
        code,
        process.cwd(),
      );
      expect(rule.check(ctx).length).toBe(1);
    });

    it("3. 拦截单字母 R: const R = Math.sqrt(...)", () => {
      const code = `const R = Math.sqrt(a * a + b * b + c * c) / 2;`;
      const ctx = new FileContext(
        "src/data/builders/solidC.ts",
        code,
        process.cwd(),
      );
      expect(rule.check(ctx).length).toBe(1);
    });

    it("4. 拦截单字母 d: const d = Math.sqrt(...)", () => {
      const code = `const d = Math.sqrt(x * x + y * y);`;
      const ctx = new FileContext(
        "src/data/builders/solidD.ts",
        code,
        process.cwd(),
      );
      expect(rule.check(ctx).length).toBe(1);
    });

    it("5. 拦截斜高 hs 与 Math.pow: const hs = Math.pow(c * c + a * a, 0.5)", () => {
      const code = `const hs = Math.pow(c * c + a * a, 0.5);`;
      const ctx = new FileContext(
        "src/data/builders/solidE.ts",
        code,
        process.cwd(),
      );
      expect(rule.check(ctx).length).toBe(1);
    });

    it("6. 拦截 let 声明与 ** 0.5 语法: let l = (r * r + h * h) ** 0.5", () => {
      const code = `let l = (r * r + h * h) ** 0.5;`;
      const ctx = new FileContext(
        "src/data/builders/solidF.ts",
        code,
        process.cwd(),
      );
      expect(rule.check(ctx).length).toBe(1);
    });

    it("7. 拦截直接赋值: radius = Math.sqrt(rBase * rBase + h * h)", () => {
      const code = `radius = Math.sqrt(rBase * rBase + h * h);`;
      const ctx = new FileContext(
        "src/data/builders/solidG.ts",
        code,
        process.cwd(),
      );
      expect(rule.check(ctx).length).toBe(1);
    });

    it("8. 拦截 src/features/** 场景组件内的裸重算: modes/DistanceModeScene.tsx", () => {
      const code = `const d = Math.sqrt(dx * dx + dy * dy);`;
      const ctx = new FileContext(
        "src/features/solidGeometry/modes/DistanceModeScene.tsx",
        code,
        process.cwd(),
      );
      expect(rule.check(ctx).length).toBe(1);
    });

    it("9. 拦截 Scene 组件内手算动点坐标: lambda * c", () => {
      const code = `tex={\`E(0,0,\${(lambda * c).toFixed(2)})\`}`;
      const ctx = new FileContext(
        "src/features/solidGeometry/modes/DistanceModeScene.tsx",
        code,
        process.cwd(),
      );
      const issues = rule.check(ctx);
      expect(issues.length).toBe(1);
      expect(issues[0].message).toContain("3D场景组件严禁直接手算 lambda * c");
    });

    it("10. 合规消费 math 纯函数解算结果时不误报", () => {
      const code = `
const res = calculateCuboidSphere(a, b, c, "circum");
const radius = res.radius;
const center = res.center;
`;
      const ctx = new FileContext(
        "src/data/builders/solidCircumSphere.ts",
        code,
        process.cwd(),
      );
      expect(rule.check(ctx).length).toBe(0);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 门禁召回率加固：四类「行级正则必然漏过」的写法 + 精度守护
  // 1) 跨行赋值（prettier 折行会让行级匹配周期性失效）
  // 2) 内联无变量（模板串里直接开方）
  // 3) 白名单外的标识符（单字母 e / s、拼音式命名）
  // 4) 手算动点坐标时多余的括号 lambda * (c)
  // ───────────────────────────────────────────────────────────────────────────
  describe("arch/no-builder-raw-calc 召回率加固（跨行 / 内联 / 任意标识符 / 容错括号）", () => {
    const rule = (architectureRules as AuditRule[]).find(
      (r: AuditRule) => r.id === "arch/no-builder-raw-calc",
    )!;

    const checkSolid = (code: string) =>
      rule.check(
        new FileContext(
          "src/data/builders/solidInjected.ts",
          code,
          process.cwd(),
        ),
      );

    it("加固 1. 跨行赋值：`const circumRadius =` 换行后接 Math.sqrt", () => {
      const code = `
const circumRadius =
  Math.sqrt(a * a + b * b + c * c) / 2;
`;
      expect(checkSolid(code).length).toBe(1);
    });

    it("加固 2. 调用实参跨行：Math.sqrt( 换行到参数行", () => {
      const code = `
const inRadius = Math.sqrt(
  a * a + b * b + c * c,
) / 2;
`;
      expect(checkSolid(code).length).toBe(1);
    });

    it("加固 3. 内联无变量：模板串内直接开方", () => {
      const code = `const value = \`\${Math.sqrt(a * a + b * b).toFixed(2)}\`;`;
      expect(checkSolid(code).length).toBe(1);
    });

    it("加固 4. 白名单外单字母 e：const e = Math.sqrt(...)", () => {
      const code = `const e = Math.sqrt(a * a + b * b);`;
      expect(checkSolid(code).length).toBe(1);
    });

    it("加固 5. 白名单外单字母 s 与 Math.hypot", () => {
      const code = `const s = Math.hypot(x, y);`;
      expect(checkSolid(code).length).toBe(1);
    });

    it("加固 6. 非几何式命名同样拦截：const halfH = Math.sqrt(...)", () => {
      const code = `const halfH = Math.sqrt(r * r + h * h);`;
      expect(checkSolid(code).length).toBe(1);
    });

    it("加固 7. 场景内手算动点坐标容忍多余括号：lambda * (c)", () => {
      const code = `tex={\`E(0,0,\${(lambda * (c)).toFixed(2)})\`}`;
      const ctx = new FileContext(
        "src/features/solidGeometry/modes/DistanceModeScene.tsx",
        code,
        process.cwd(),
      );
      const issues = rule.check(ctx);
      expect(issues.length).toBe(1);
      expect(issues[0].message).toContain("3D场景组件严禁直接手算 lambda * c");
    });

    it("加固 8. 场景内手算动点坐标容忍左侧括号：(lambda) * c", () => {
      const code = `tex={\`E(0,0,\${((lambda) * c).toFixed(2)})\`}`;
      const ctx = new FileContext(
        "src/features/solidGeometry/modes/DihedralModeScene.tsx",
        code,
        process.cwd(),
      );
      expect(rule.check(ctx).length).toBe(1);
    });

    it("加固 9. 跨行的 ** 0.5 同样拦截", () => {
      const code = `
const generatrix = (r * r + h * h)
  ** 0.5;
`;
      expect(checkSolid(code).length).toBe(1);
    });

    it("精度守护 1. 纯常数开方不误报：Math.sqrt(3)", () => {
      const code = `const ratio = (Math.sqrt(3) / 3) * a;`;
      expect(checkSolid(code).length).toBe(0);
    });

    it("精度守护 2. 常数系数式不误报：(Math.sqrt(2) / 2) * value", () => {
      const code = `next.c = Number(((Math.sqrt(2) / 2) * value).toFixed(2));`;
      expect(checkSolid(code).length).toBe(0);
    });

    it("精度守护 3. 常数幂不误报：2 ** 0.5", () => {
      const code = `const ratio = 2 ** 0.5;`;
      expect(checkSolid(code).length).toBe(0);
    });

    it("精度守护 4. 非 0.5 指数的 Math.pow 不误报（体积/立方）", () => {
      const code = `const inVolume = (4 / 3) * Math.PI * Math.pow(res.inRadius, 3);`;
      expect(checkSolid(code).length).toBe(0);
    });

    it("精度守护 5. 通用 builder 的几何族命名才拦截，非几何开方放行", () => {
      const nikeLike = `const extVal = 2 * Math.sqrt(a * b);`;
      expect(
        rule.check(
          new FileContext("src/data/builders/nike.ts", nikeLike, process.cwd()),
        ).length,
      ).toBe(0);

      const geometric = `const dist = Math.hypot(dx, dy);`;
      expect(
        rule.check(
          new FileContext(
            "src/data/builders/demoBuilder.ts",
            geometric,
            process.cwd(),
          ),
        ).length,
      ).toBe(1);
    });

    it("精度守护 6. 消费 math3d 产物（含结构化字段与 norm/distance）不误报", () => {
      const code = `
const res = calculatePrismSphere(a, b, c, "circum");
const rBase = res.baseCircumRadius!;
const cBase = res.cBase;
const rA = distance(A, HA);
const rCut = sphereSectionRadius(R, absD);
const l = cylinderAxialDiagonal(r1, height);
`;
      expect(checkSolid(code).length).toBe(0);
    });

    it("精度守护 7. 同文件正常消费 + 一处裸算：只报裸算那一行", () => {
      const code = `
const res = calculateCuboidSphere(a, b, c, "circum");
const radius = res.radius;
const diagAxial = Math.sqrt(4 * r1 ** 2 + height ** 2);
`;
      const issues = checkSolid(code);
      expect(issues.length).toBe(1);
      expect(issues[0].lineNum).toBe(4);
    });
  });
});
