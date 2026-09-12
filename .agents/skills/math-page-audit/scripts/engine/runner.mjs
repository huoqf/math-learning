/**
 * .agents/skills/math-page-audit/scripts/engine/runner.mjs
 * 审计执行引擎：遍历文件、调度规则并处理行级抑制
 */

import fs from 'node:fs';
import path from 'node:path';
import { FileContext } from './context.mjs';
import { allRules } from '../rules/index.mjs';

export function walkDirectory(currentPath, fileList = []) {
  if (!fs.existsSync(currentPath)) return fileList;
  const stat = fs.statSync(currentPath);
  if (stat.isFile() && (currentPath.endsWith('.tsx') || currentPath.endsWith('.ts'))) {
    fileList.push(currentPath);
  } else if (stat.isDirectory()) {
    const files = fs.readdirSync(currentPath);
    for (const file of files) {
      if (file === 'node_modules' || file === 'dist' || file === '.git') continue;
      walkDirectory(path.join(currentPath, file), fileList);
    }
  }
  return fileList;
}

export function runAudit({ targetDir, workspaceRoot, isStrict = false, group = null, rule = null, rules = allRules }) {
  const startTime = Date.now();
  let activeRules = rules;
  if (rule) {
    activeRules = activeRules.filter((r) => r.id === rule || r.id.endsWith(`/${rule}`));
  } else if (group) {
    activeRules = activeRules.filter((r) => r.group === group || r.id.startsWith(group));
  }

  const files = walkDirectory(targetDir);

  // 如果扫描的是整个 src/features，补充扫描 src/math 与 src/math3d
  const targetRel = path.relative(workspaceRoot, targetDir).replace(/\\/g, '/');
  if (targetRel === 'src/features' || targetRel === '') {
    walkDirectory(path.resolve(workspaceRoot, 'src/math'), files);
    walkDirectory(path.resolve(workspaceRoot, 'src/math3d'), files);
  }

  let totalFiles = 0;
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalSuppressed = 0;
  const fileReports = [];

  for (const filePath of files) {
    totalFiles++;
    const content = fs.readFileSync(filePath, 'utf-8');
    const ctx = new FileContext(filePath, content, workspaceRoot);
    const fileIssues = [];

    for (const rule of activeRules) {
      // 纯数学算法层 (src/math 与 src/math3d) 仅做纯洁性检验，跳过前端 UI/JSX/文本切分规则
      if (ctx.isMathPureLayer && rule.id !== 'arch/pure-math-layer') {
        continue;
      }

      try {
        const found = rule.check(ctx);
        if (found && found.length > 0) {
          for (const item of found) {
            const lineNum = item.lineNum || 1;
            const itemType = item.type || rule.type;
            const severity = item.severity || rule.severity || 'error';

            // 检查该行是否被抑制注解豁免
            if (ctx.isSuppressed(lineNum, rule.id, itemType)) {
              totalSuppressed++;
              continue;
            }

            if (severity === 'error') {
              totalErrors++;
            } else {
              totalWarnings++;
            }

            fileIssues.push({
              ruleId: rule.id,
              type: itemType,
              severity,
              lineNum,
              message: item.message,
              snippet: item.snippet || '',
            });
          }
        }
      } catch (err) {
        console.error(`[Rule Error] 规则 ${rule.id} 检查 ${ctx.relPath} 时异常:`, err);
      }
    }

    if (fileIssues.length > 0) {
      fileReports.push({
        filePath,
        relPath: ctx.relPath,
        issues: fileIssues,
      });
    }
  }

  return {
    totalFiles,
    totalIssues: totalErrors + totalWarnings,
    totalErrors,
    totalWarnings,
    totalSuppressed,
    fileReports,
    isStrict,
    activeRulesCount: activeRules.length,
    durationMs: Date.now() - startTime,
  };
}
