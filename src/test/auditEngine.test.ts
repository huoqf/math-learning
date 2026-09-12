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
import { runAudit } from "../../.agents/skills/math-page-audit/scripts/engine/runner.mjs";

interface AuditRule {
  id: string;
  type: string;
  severity: string;
  check: (
    ctx: unknown,
  ) => Array<{
    lineNum: number;
    message: string;
    snippet?: string;
    type?: string;
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
});
