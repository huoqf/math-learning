#!/usr/bin/env node
/**
 * .agents/skills/math-page-audit/scripts/audit_page.mjs
 * 高中数学可视化页面自动化只读质量审计工具 (CLI 入口)
 *
 * 附加 --strict / -s 参数时：检测到 error 级别违规以 exit(1) 阻断 CI/CD 流程。
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runAudit } from './engine/runner.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '../../../../');

// 原生 ANSI 终端色彩
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m',
};

const args = process.argv.slice(2);

// 帮助信息
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
${c.bold}高中数学教学与新高考规范静态审计工具 (Math Page Audit CLI)${c.reset}

${c.bold}用法:${c.reset}
  node audit_page.mjs [path] [options]

${c.bold}参数选项:${c.reset}
  ${c.cyan}[path]${c.reset}              要审计的相对路径（默认: src/features）
  ${c.cyan}--strict, -s${c.reset}        严格门禁模式：检测到 error 级违规时 exit(1) 阻断流程
  ${c.cyan}--group=<name>${c.reset}      按领域规则组过滤运行 (arch | left | center | right | style | discipline)
  ${c.cyan}--rule=<id>${c.reset}         按具体规则 ID 过滤运行 (如 --rule=arch/no-browser-router)
  ${c.cyan}--quiet, -q${c.reset}         静默模式：仅在存在违规时输出文件详情
  ${c.cyan}--help, -h${c.reset}          显示此帮助信息

${c.bold}行级豁免注解:${c.reset}
  在源码违规行的上一行添加标准注释即可局部豁免：
  ${c.gray}// audit-disable-next-line <rule-id 或 type>${c.reset}

${c.bold}示例:${c.reset}
  node audit_page.mjs src/features/parabola --strict
  node audit_page.mjs src/features --group=right
  node audit_page.mjs src/features --rule=arch/no-nested-vertical-scroll
`);
  process.exit(0);
}

const isStrict = args.includes('--strict') || args.includes('-s');
const isQuiet = args.includes('--quiet') || args.includes('-q');
const groupArgMatch = args.find((arg) => arg.startsWith('--group='));
const targetGroup = groupArgMatch ? groupArgMatch.split('=')[1] : null;
const ruleArgMatch = args.find((arg) => arg.startsWith('--rule='));
const targetRule = ruleArgMatch ? ruleArgMatch.split('=')[1] : null;
const targetArg = args.find((arg) => !arg.startsWith('-')) || 'src/features';
const scanDir = path.resolve(workspaceRoot, targetArg);

let filterTip = '';
if (targetRule) {
  filterTip = ` [rule: ${c.magenta}${targetRule}${c.reset}]`;
} else if (targetGroup) {
  filterTip = ` [group: ${c.yellow}${targetGroup}${c.reset}]`;
}

if (!isQuiet) {
  console.log(
    `\n🔍 ${c.bold}[Math Page Audit]${c.reset} 开始静态代码与高考规范审计: ${c.cyan}${targetArg}${c.reset}${filterTip} (strictMode: ${isStrict ? `${c.red}ON${c.reset}` : `${c.gray}OFF${c.reset}`})\n` +
    '─'.repeat(60)
  );
}

const result = runAudit({
  targetDir: scanDir,
  workspaceRoot,
  isStrict,
  group: targetGroup,
  rule: targetRule,
});

for (const report of result.fileReports) {
  console.log(`\n📄 ${c.bold}${report.relPath}${c.reset} (${report.issues.length} 处需关注):`);
  report.issues.forEach((iss) => {
    const sevTag = iss.severity === 'error' ? `${c.red}[ERROR]${c.reset}` : `${c.yellow}[WARN]${c.reset}`;
    console.log(`  ${c.gray}L${iss.lineNum}${c.reset} ${sevTag} ${c.bold}[${iss.type}]${c.reset} ${iss.message}`);
    if (iss.snippet) {
      console.log(`     ${c.gray}> ${iss.snippet}${c.reset}`);
    }
  });
}

if (!isQuiet || result.totalIssues > 0) {
  console.log('\n' + '─'.repeat(60));
}

const suppressedTip = result.totalSuppressed > 0 ? ` (${result.totalSuppressed} 处被注释豁免)` : '';
const durationTip = ` ${c.gray}in ${result.durationMs}ms${c.reset}`;

if (result.totalIssues === 0) {
  if (!isQuiet) {
    console.log(`✅ ${c.green}${c.bold}审计完成${c.reset}：扫描 ${result.totalFiles} 个文件 (${result.activeRulesCount} 条规则)，全部符合规范，零潜在违规项！${suppressedTip}${durationTip}\n`);
  }
  process.exit(0);
}

console.log(
  `⚠️  ${c.bold}审计完成${c.reset}：扫描 ${result.totalFiles} 个文件，发现 ${c.red}${result.totalErrors} 处错误${c.reset}，${c.yellow}${result.totalWarnings} 处建议${c.reset}。${suppressedTip}${durationTip}\n`
);

if (isStrict && result.totalErrors > 0) {
  console.error(`🚨 ${c.red}${c.bold}[门禁拦截]${c.reset} strict 模式下检测到 ${result.totalErrors} 处严重违规，阻断流程！`);
  console.error(`   ${c.gray}💡 若确有特殊教学构型豁免需求，可使用 // audit-disable-next-line <ruleId> 局部豁免。${c.reset}\n`);
  process.exit(1);
} else {
  if (isStrict && result.totalErrors === 0) {
    console.log(`💡 ${c.green}通过门禁${c.reset}：存在建议项但无阻断性错误，允许构建通过。\n`);
  } else {
    console.log(`💡 ${c.gray}提示：可附加 --strict 参数在 CI/CD 或预提交时启用阻断拦截。${c.reset}\n`);
  }
}
