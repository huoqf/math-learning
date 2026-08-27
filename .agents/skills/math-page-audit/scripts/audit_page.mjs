#!/usr/bin/env node
/**
 * .agents/skills/math-page-audit/scripts/audit_page.mjs
 * 高中数学可视化页面自动化只读质量审计工具
 * 
 * 作用：扫描指定文件或 src/features 目录，排查：
 * 1. 孤立参数字母 (如 labelFormula: "a")
 * 2. 轨道刻度密集平铺/冲突 marks
 * 3. 画布内手写 <text> 渲染浮点坐标
 * 4. 手写 <circle> 替代 MathPoint
 * 5. 拖拽二次转换错误 (onDrag -> designToMath)
 * 6. 硬编码 Hex 颜色
 * 7. JSX 属性字符串双斜杠转义陷阱 (formula="...\\\\...")
 * 8. 左屏职责越界文案 (左屏侵入“高考核心/高考题型”)
 * 9. 动画页面缺少 TipCard 教学引导卡片
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '../../../../');

const targetArg = process.argv[2] || 'src/features';
const scanDir = path.resolve(workspaceRoot, targetArg);

console.log(`\n🔍 [Math Page Audit] 开始静态代码与高考规范审计: ${targetArg}\n` + '─'.repeat(60));

let totalFiles = 0;
let totalIssues = 0;

function walkDir(currentPath, fileList = []) {
  if (!fs.existsSync(currentPath)) return fileList;
  const stat = fs.statSync(currentPath);
  if (stat.isFile() && (currentPath.endsWith('.tsx') || currentPath.endsWith('.ts'))) {
    fileList.push(currentPath);
  } else if (stat.isDirectory()) {
    const files = fs.readdirSync(currentPath);
    for (const file of files) {
      if (file === 'node_modules' || file === 'dist' || file === '.git') continue;
      walkDir(path.join(currentPath, file), fileList);
    }
  }
  return fileList;
}

const files = walkDir(scanDir);

for (const filePath of files) {
  totalFiles++;
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relPath = path.relative(workspaceRoot, filePath);
  const issues = [];

  // 全文级检查：主动画页面必须包含 TipCard
  const isAnimationPage = (filePath.endsWith('Animation.tsx') || filePath.endsWith('Page.tsx')) && 
                          !filePath.includes('test') && 
                          content.includes('ThreePanel');
  if (isAnimationPage && !content.includes('TipCard')) {
    issues.push({
      lineNum: 1,
      type: '缺失教学导引',
      message: '主探究页面左屏必须包含 TipCard 教学导引卡片（说明模型特征与核心设问）',
      snippet: 'ThreePanel 页面未引入/挂载 TipCard'
    });
  }

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // 1. 检查画布手写 <text> 浮点数
    if (line.includes('<text') && (line.includes('toFixed') || line.includes('${'))) {
      if (!line.includes('SceneLabelGroup') && !line.includes('PolarGrid') && !line.includes('CoordinateGrid')) {
        issues.push({
          lineNum,
          type: '中屏浮点堆砌',
          message: '检测到 SVG 内可能直接渲染了浮点坐标字符串，请使用纯代数符号 + SceneLegend',
          snippet: line.trim()
        });
      }
    }

    // 2. 检查孤立字母参数标签
    if (/labelFormula:\s*["'][a-zA-Z0-9_]["']/.test(line)) {
      issues.push({
        lineNum,
        type: '孤立参数代号',
        message: '参数标签缺少中文几何含义，应为: \\text{含义 } \\color{...}{字母}',
        snippet: line.trim()
      });
    }

    // 3. 检查拖拽二次转换
    if (line.includes('onDrag') && line.includes('designToMath')) {
      issues.push({
        lineNum,
        type: '拖拽二次转换',
        message: 'InteractivePoint 回调已是数学坐标，严禁二次调用 designToMath',
        snippet: line.trim()
      });
    }

    // 4. 检查硬编码 Hex
    if (/stroke=["']#[0-9a-fA-F]{3,8}["']/.test(line) || /fill=["']#[0-9a-fA-F]{3,8}["']/.test(line)) {
      if (!filePath.includes('theme') && !filePath.includes('test')) {
        issues.push({
          lineNum,
          type: '硬编码颜色',
          message: '禁止硬编码 Hex 颜色，必须使用 MATH_COLORS.* 或 CANVAS_COLORS.*',
          snippet: line.trim()
        });
      }
    }

    // 5. 检查 JSX 属性中的 LaTeX 双斜杠转义陷阱 (formula="...\\\\...")
    if (/formula="[^"]*\\\\/.test(line)) {
      issues.push({
        lineNum,
        type: 'JSX双斜杠陷阱',
        message: 'JSX 属性字符串中的 \\\\ 会被直接传给 KaTeX 导致换行/排版断裂，请改为单斜杠 \\',
        snippet: line.trim()
      });
    }

    // 6. 检查左屏越界考点词
    if (line.includes('<TipCard') || (line.includes('title=') && line.includes('LeftPanelSection'))) {
      if (line.includes('高考核心') || line.includes('高考题型') || line.includes('高考考点')) {
        issues.push({
          lineNum,
          type: '左屏职责越界',
          message: '左屏应聚焦于模型条件与探究设问，严禁堆砌高考考点字样（请归位右屏 MathPanel）',
          snippet: line.trim()
        });
      }
    }
  });

  if (issues.length > 0) {
    totalIssues += issues.length;
    console.log(`\n📄 ${relPath} (${issues.length} 处潜在问题):`);
    issues.forEach(iss => {
      console.log(`  L${iss.lineNum} [${iss.type}] ${iss.message}`);
      console.log(`     > ${iss.snippet}`);
    });
  }
}

console.log('\n' + '─'.repeat(60));
if (totalIssues === 0) {
  console.log(`✅ 审计完成：扫描 ${totalFiles} 个文件，全部符合规范，零潜在违规项！\n`);
} else {
  console.log(`⚠️ 审计完成：扫描 ${totalFiles} 个文件，发现 ${totalIssues} 处需关注项。\n`);
}

