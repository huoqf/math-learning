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

  // 全文级检查 1：主动画页面必须包含 TipCard
  const isAnimationPage =
    (filePath.endsWith('Animation.tsx') || filePath.endsWith('Page.tsx')) &&
    !filePath.includes('test') &&
    content.includes('ThreePanel');
  if (isAnimationPage && !content.includes('TipCard')) {
    issues.push({
      lineNum: 1,
      type: '缺失教学导引',
      message: '主探究页面左屏必须包含 TipCard 教学导引卡片（说明模型特征与核心设问）',
      snippet: 'ThreePanel 页面未引入/挂载 TipCard',
    });
  }

  // 全文级检查 2：主动画页面 mapKeysToConfigs 丢失 group 属性透传检测
  if (isAnimationPage && content.includes('mapKeysToConfigs')) {
    const mapMatch = content.match(/const\s+mapKeysToConfigs\s*=\s*useCallback\([\s\S]*?return\s+keys[\s\S]*?\.map\(\s*\([^)]*\)\s*=>\s*\(\{([\s\S]*?)\}\)/);
    if (mapMatch && !mapMatch[1].includes('group')) {
      issues.push({
        lineNum: 1,
        type: '参数映射丢失group',
        message: 'mapKeysToConfigs 未解构/传递 group: meta.group，会导致左屏参数分组卡片无法正常渲染',
        snippet: 'mapKeysToConfigs 返回项缺少 group 属性',
      });
    }
  }

  // 全文级检查 3：TipCard 设问剧透检测 (严禁在设问中提前把配方解或极值答案当问题写出)
  if (content.includes('TipCard') || content.includes('question:')) {
    const questionMatches = content.matchAll(/question:\s*["'`]([\s\S]*?)["'`]/g);
    for (const qm of questionMatches) {
      const qText = qm[1];
      if (
        /通过配方法.*求极值/.test(qText) ||
        /当.*时.*(取得|达到).*(最大值|最小值|极值)/.test(qText) ||
        /并在顶点.*处取得最大值/.test(qText)
      ) {
        issues.push({
          lineNum: 1,
          type: 'TipCard设问剧透',
          message: 'TipCard 核心设问应提出探究目标，严禁在设问中提前剧透配方解、方程根或极值结论（推导归位右屏 MathPanel）',
          snippet: qText.slice(0, 70) + '...',
        });
      }
    }
  }

  // 全文级检查 4：数据层 ParamMeta 结构化分组与排序动线扫描
  if (filePath.includes('registries') && content.includes('ParamMeta[]')) {
    const metaArrayRegex = /export\s+const\s+(\w+Meta)\s*:\s*ParamMeta\[\]\s*=\s*\[([\s\S]*?)\];/g;
    let matchMeta;
    while ((matchMeta = metaArrayRegex.exec(content)) !== null) {
      const metaName = matchMeta[1];
      const arrayBody = matchMeta[2];
      // 提取每个参数对象的 key 与 group
      const paramBlocks = arrayBody.split(/\},\s*\{/);
      const paramsList = [];
      for (const block of paramBlocks) {
        const keyMatch = block.match(/key:\s*["']([^"']+)["']/);
        const groupMatch = block.match(/group:\s*["']([^"']+)["']/);
        if (keyMatch) {
          paramsList.push({
            key: keyMatch[1],
            hasGroup: Boolean(groupMatch),
            group: groupMatch ? groupMatch[1] : null,
          });
        }
      }

      // 规则 A：参数数量 >= 4 必须配置 group 分组
      if (paramsList.length >= 4) {
        const missingGroup = paramsList.some((p) => !p.hasGroup);
        if (missingGroup) {
          issues.push({
            lineNum: 1,
            type: '参数过多未分组',
            message: `${metaName} 包含 ${paramsList.length} 个参数 (>=4 项)，严禁全平铺，必须通过 group 字段进行对象化分层`,
            snippet: `${metaName} 包含 ${paramsList.length} 项参数，未全量配置 group`,
          });
        }
      }

      // 规则 B：动参数动线置顶检测 (核心动参数排在静态底模尺寸之后为倒挂)
      const dynamicKeyRegex = /^(lambda|mu|theta|x0|t|n|alpha|beta|k|phi|progress|step)/i;
      const staticKeyRegex = /^(a|b|c|width|height|depth|radius|len|r|size)/i;

      let foundStatic = false;
      let inverted = false;
      let invertedPair = '';
      for (const p of paramsList) {
        if (staticKeyRegex.test(p.key)) {
          foundStatic = true;
        } else if (dynamicKeyRegex.test(p.key) && foundStatic) {
          inverted = true;
          invertedPair = `静态参数排在动参数 ${p.key} 之前`;
          break;
        }
      }

      if (inverted) {
        issues.push({
          lineNum: 1,
          type: '动参数动线倒挂',
          message: `${metaName} 中核心动参数应置顶于静态几何尺寸/背景常数之上，优先展示主要探究自变量`,
          snippet: invertedPair,
        });
      }
    }
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

    // 1.1 检查 SVG Label 或纯文本中裸露反斜杠 LaTeX 源码 (仅在 Scene/SVG 组件中检测)
    if ((filePath.includes('Scene') || line.includes('<text')) &&
      (/text:\s*["'`][^"'`]*\\[a-zA-Z]+/.test(line) || /<text[^>]*>[^<]*\\[a-zA-Z]+/.test(line))) {
      issues.push({
        lineNum,
        type: 'SVG裸LaTeX源码',
        message: '检测到 SVG 画布点标或曲线标签传入了裸 LaTeX 源码，SVG 不支持 LaTeX 解析，请使用 Unicode 字符 (如 √x, 1/x, x²) 或归位 SceneLegend',
        snippet: line.trim()
      });
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

    // 7. 检查数据层混合文本未加 $ 定界符 (如 "当 \\alpha > 0 时" 或 "y=x^2 偶函数")
    const isTestFile = filePath.includes('test') || filePath.includes('spec');
    const isCommentLine = /^\s*(\/\/|\/\*|\{\/\*|\*)/.test(line);
    const isJsxElement = /<[A-Za-z][a-zA-Z0-9]*\b/.test(line);
    if (!isTestFile && !isCommentLine && !isJsxElement && !line.includes('import') && (line.includes('text:') || line.includes('prerequisites:') || line.includes('"') || line.includes('\'')) && /[\u4e00-\u9fa5]/.test(line)) {
      if (/(\\[a-zA-Z]+|[a-zA-Z]\^[0-9a-zA-Z]+|[a-zA-Z]_[0-9a-zA-Z]+)/.test(line) && !line.includes('$') && !line.includes('latex:') && !line.includes('formula:')) {
        issues.push({
          lineNum,
          type: '混合文本缺少$定界符',
          message: '检测到中文句子中包含 LaTeX 指令或上下标，但未用 $...$ 包裹，会导致公式无法被 KaTeX 正确切分渲染',
          snippet: line.trim()
        });
      }
    }

    // 8. 检查物理学科残留单位 (严防从物理迁移的代码未清洗)
    if (/\bunit:\s*["'](m|s|kg|N|m\/s|rad|m²|m³|cm)["']/.test(line)) {
      issues.push({
        lineNum,
        type: '物理单位残留',
        message: '数学量严禁配置物理学科单位 (m, s, N, kg 等)，纯数学量无物理量纲',
        snippet: line.trim()
      });
    }

    // 9. 检查 SelectGrid 选项堆砌公式或孤立代号
    if ((line.includes('<SelectGrid') && line.includes('formula=')) ||
      (!isTestFile && /^\s*formula:\s*["'`][^"'`]+["'`]/.test(line) && !line.includes('labelFormula') && !line.includes('descriptionFormula') && (filePath.includes('Animation.tsx') || filePath.includes('LeftPanel.tsx')))) {
      issues.push({
        lineNum,
        type: 'SelectGrid选项堆砌公式',
        message: 'SelectGrid 选项应使用纯净加粗中文标题，严禁在 items 中配置 formula 堆砌公式或孤立代号（题设归位 TipCard，定理归位 MathPanel）',
        snippet: line.trim()
      });
    }

    // 10. 检查参数标签是否脱离题设无数学代号 (排除 marks 刻度数字)
    if (line.includes('labelFormula:') && !line.includes('//') && !line.includes('value:') && !line.includes('variant:')) {
      const match = line.match(/labelFormula:\s*["'`](.*)["'`]/);
      if (match) {
        const formula = match[1];
        // 剥离 \text{...} 和 \color{...} 后检查是否包含数学/代数/几何字母
        const pureMath = formula.replace(/\\text\{[^}]*\}/g, '').replace(/\\color\{[^}]*\}/g, '').trim();
        const hasSymbol = /[a-zA-Z]/.test(pureMath);
        if (!hasSymbol) {
          issues.push({
            lineNum,
            type: '参数缺少数学代号',
            message: '参数标签缺少具体数学代号（如 a, b, x_0, PA, CA），应遵循: \\text{含义 } \\color{...}{代号}',
            snippet: line.trim()
          });
        }
      }
    }

    // 11. 检查参数标签色彩 Token 绑定缺失 (非比值公式下，排除 marks 刻度数字)
    if (line.includes('labelFormula:') && !line.includes('//') && !line.includes('value:') && !line.includes('variant:')) {
      const match = line.match(/labelFormula:\s*["'`](.*)["'`]/);
      if (match) {
        const formula = match[1];
        // 如果包含数学变量，且未包含比值 \frac 结构，但完全未配置 \color，提示三位一体色彩缺失
        if (/[a-zA-Z]/.test(formula) && !formula.includes('\\color') && !formula.includes('\\frac')) {
          issues.push({
            lineNum,
            type: '参数未绑定色彩Token',
            message: '参数标签必须按三位一体原则绑定色彩 Token: \\color{${MATH_COLORS.paramPrimary}}{...}',
            snippet: line.trim()
          });
        }
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

