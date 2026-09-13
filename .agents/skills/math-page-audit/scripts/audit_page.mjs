#!/usr/bin/env node
/**
 * .agents/skills/math-page-audit/scripts/audit_page.mjs
 * 高中数学可视化页面自动化只读质量审计工具 (CLI 入口)
 *
 * 附加 --strict / -s 参数时：检测到 error 级别违规以 exit(1) 阻断 CI/CD 流程。
 */

import fs from 'node:fs';
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
  ${c.cyan}[path]${c.reset}              要审计的相对路径（默认: src，即全库）
  ${c.cyan}--strict, -s${c.reset}        严格门禁模式：检测到 error 级违规时 exit(1) 阻断流程
  ${c.cyan}--update-baseline${c.reset}   将当前全库违规快照写为存量基线 (.audit-baseline.json)
  ${c.cyan}--group=<name>${c.reset}      按领域规则组过滤运行 (arch | left | center | right | style | discipline)
  ${c.cyan}--rule=<id>${c.reset}         按具体规则 ID 过滤运行 (如 --rule=arch/no-browser-router)
  ${c.cyan}--quiet, -q${c.reset}         静默模式：仅在存在违规时输出文件详情
  ${c.cyan}--help, -h${c.reset}          显示此帮助信息

${c.bold}存量基线 (Baseline) 机制:${c.reset}
  为在"全库扫描"下不阻断历史存量，审计以 (文件, 规则, 类型, 级别) 为单位记录存量计数。
  strict 模式下仅对 ${c.red}超出基线的增量违规${c.reset} exit(1)；存量违规仅提示不阻断。
  整改完成后可用 ${c.cyan}--update-baseline${c.reset} 下修基线，逐步逼近全库清零。

${c.bold}行级豁免注解:${c.reset}
  在源码违规行的上一行添加标准注释即可局部豁免：
  ${c.gray}// audit-disable-next-line <rule-id 或 type>${c.reset}

${c.bold}示例:${c.reset}
  node audit_page.mjs --strict
  node audit_page.mjs src/features/parabola --strict
  node audit_page.mjs src --group=discipline
  node audit_page.mjs src/features --rule=arch/no-nested-vertical-scroll
`);
  process.exit(0);
}

const isStrict = args.includes('--strict') || args.includes('-s');
const isQuiet = args.includes('--quiet') || args.includes('-q');
const isUpdateBaseline = args.includes('--update-baseline');
const groupArgMatch = args.find((arg) => arg.startsWith('--group='));
const targetGroup = groupArgMatch ? groupArgMatch.split('=')[1] : null;
const ruleArgMatch = args.find((arg) => arg.startsWith('--rule='));
const targetRule = ruleArgMatch ? ruleArgMatch.split('=')[1] : null;
const targetArg = args.find((arg) => !arg.startsWith('-')) || 'src';
const scanDir = path.resolve(workspaceRoot, targetArg);
const baselinePath = path.resolve(workspaceRoot, '.audit-baseline.json');

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

// ── 存量基线统计 ────────────────────────────────────────────────
// 以 (相对路径, 规则ID, 类型, 级别) 为键统计当前违规份数
const currentCounts = {};
for (const report of result.fileReports) {
  for (const iss of report.issues) {
    const key = `${report.relPath}::${iss.ruleId}::${iss.type}::${iss.severity}`;
    currentCounts[key] = (currentCounts[key] || 0) + 1;
  }
}

if (isUpdateBaseline) {
  const payload = {
    generatedAt: new Date().toISOString(),
    note: '存量违规基线：仅用于 strict 模式区分"历史存量"与"本次增量"。整改后请用 --update-baseline 下修。',
    counts: currentCounts,
  };
  fs.writeFileSync(baselinePath, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
  console.log(`\n📦 已写入存量基线: ${c.cyan}${path.relative(workspaceRoot, baselinePath)}${c.reset}`);
  console.log(`   共 ${Object.keys(currentCounts).length} 个 (文件::规则::类型::级别) 键，合计 ${result.totalIssues} 处违规。\n`);
  process.exit(0);
}

let baseline = { counts: {} };
if (fs.existsSync(baselinePath)) {
  try {
    baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
  } catch (err) {
    console.error(`${c.yellow}⚠️ 基线文件解析失败，按空基线处理：${err.message}${c.reset}`);
    baseline = { counts: {} };
  }
}
const baselineCounts = baseline.counts || {};

let newErrors = 0;
let newWarnings = 0;
let legacyErrors = 0;
let legacyWarnings = 0;
const newErrorKeys = new Set();
for (const [key, count] of Object.entries(currentCounts)) {
  const isError = key.endsWith('::error');
  const base = baselineCounts[key] || 0;
  const excess = Math.max(0, count - base);
  if (isError) {
    newErrors += excess;
    legacyErrors += Math.min(count, base);
    if (excess > 0) newErrorKeys.add(key);
  } else {
    newWarnings += excess;
    legacyWarnings += Math.min(count, base);
  }
}
const hasBaseline = Object.keys(baselineCounts).length > 0;

// 门禁守卫：strict 模式强制要求存量基线文件已纳入版本控制。
// 防止 .audit-baseline.json 未随变更提交（CI 检出后缺失）时，全库 402 处存量被误判为增量导致构建全面红灯。
if (isStrict && !hasBaseline) {
  console.error(
    `🚨 ${c.red}${c.bold}[门禁拦截]${c.reset} strict 模式未检测到存量基线 .audit-baseline.json，全库违规将全部按"增量"判定并阻断构建。`
  );
  console.error(
    `   ${c.gray}请先运行 ${c.cyan}npm run audit:update-baseline${c.gray} 生成基线，并确保 ${c.cyan}git add .audit-baseline.json${c.gray} 随变更一并提交。${c.reset}\n`
  );
  process.exit(1);
}

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
  `⚠️  ${c.bold}审计完成${c.reset}：扫描 ${result.totalFiles} 个文件，发现 ${c.red}${result.totalErrors} 处错误${c.reset}，${c.yellow}${result.totalWarnings} 处建议${c.reset}。${suppressedTip}${durationTip}`
);

if (hasBaseline) {
  console.log(
    `   ${c.gray}其中：存量错误 ${legacyErrors} 处（基线豁免），本次增量错误 ${c.reset}${newErrors > 0 ? `${c.red}${c.bold}${newErrors}${c.reset}` : `${c.green}0${c.reset}`}${c.gray}；存量建议 ${legacyWarnings} 处，增量建议 ${newWarnings} 处。${c.reset}\n`
  );
} else {
  console.log(`   ${c.gray}未检测到基线文件 .audit-baseline.json，全部违规按"增量"处理。${c.reset}\n`);
}

if (isStrict && newErrors > 0) {
  console.error(`🚨 ${c.red}${c.bold}[门禁拦截]${c.reset} strict 模式下检测到 ${c.red}${newErrors}${c.reset} 处${c.bold}新增${c.reset}严重违规，阻断流程！`);
  if (newErrorKeys.size > 0) {
    console.error(`   ${c.gray}新增违规键（文件::规则::类型::级别）：${c.reset}`);
    for (const k of [...newErrorKeys].slice(0, 20)) {
      console.error(`     ${c.red}·${c.reset} ${k}`);
    }
    if (newErrorKeys.size > 20) {
      console.error(`     ${c.gray}…其余 ${newErrorKeys.size - 20} 键省略${c.reset}`);
    }
  }
  console.error(`   ${c.gray}💡 若确有特殊教学构型豁免需求，可使用 // audit-disable-next-line <ruleId> 局部豁免；`);
  console.error(`   ${c.gray}   若为已确认的历史存量，请运行 --update-baseline 更新基线。${c.reset}\n`);
  process.exit(1);
} else if (isStrict) {
  console.log(`💡 ${c.green}通过门禁${c.reset}：无新增阻断性错误（存量违规 ${legacyErrors} 处已计入基线，不阻断构建）。\n`);
} else {
  console.log(`💡 ${c.gray}提示：可附加 --strict 参数在 CI/CD 或预提交时启用阻断拦截。${c.reset}\n`);
}
