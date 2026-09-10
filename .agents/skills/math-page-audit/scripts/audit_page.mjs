#!/usr/bin/env node
/**
 * .agents/skills/math-page-audit/scripts/audit_page.mjs
 * 高中数学可视化页面自动化只读质量审计工具
 *
 * 附加 --strict / -s 参数时：检测到违规以 exit(1) 阻断 CI/CD 流程。
 *
 * 实际检查项 (共 20 项)：
 *  1. 孤立参数字母 (如 labelFormula: "a")
 *  2. mapKeysToConfigs 丢失 group 属性透传
 *  3. TipCard 设问提前剧透解题结论
 *  4. TipCard 未联动二级选项 (SelectGrid value 变量)
 *  5. ParamMeta 参数>=4项未分组 / 动参数动线倒挂
 *  6. 画布内手写 <text> 渲染浮点坐标
 *  7. SVG 内裸 LaTeX 源码（应使用 SceneLabelGroup）
 *  8. 孤立参数代号标签 (labelFormula: "a")
 *  9. 拖拽二次坐标转换 (onDrag -> designToMath)
 * 10. 硬编码 Hex 色值 (stroke/fill)
 * 11. JSX 属性字符串双斜杠转义陷阱
 * 12. 左屏职责越界（高考核心/高考题型关键词）
 * 13. 混合文本缺少 $...$  定界符
 * 14. 物理单位残留（m/s/kg 等）
 * 15. SelectGrid 选项堆砌公式
 * 16. 参数标签缺少数学代号
 * 17. 参数标签未绑定色彩 Token
 * 18. 全库禁止 BrowserRouter（必须 HashRouter Only）
 * 19. SVG <text> 裸 fontSize 硬编码数字
 * 20. 硬编码 rgb()/rgba() 色值
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '../../../../');

const args = process.argv.slice(2);
const isStrict = args.includes('--strict') || args.includes('-s');
const targetArg = args.find((arg) => !arg.startsWith('-')) || 'src/features';
const scanDir = path.resolve(workspaceRoot, targetArg);

console.log(`\n🔍 [Math Page Audit] 开始静态代码与高考规范审计: ${targetArg} (strictMode: ${isStrict ? 'ON' : 'OFF'})\n` + '─'.repeat(60));

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
if (targetArg === 'src/features') {
  walkDir(path.resolve(workspaceRoot, 'src/math'), files);
  walkDir(path.resolve(workspaceRoot, 'src/math3d'), files);
}

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

      // 设问低阶空泛套话拦截 (discipline-specs.md §九)
      if (
        /(观察|看一看|体会).*(变化|走势|规律|作用)|(图形|图象|曲线)怎么动|移动滑块看看/.test(qText)
      ) {
        issues.push({
          lineNum: 1,
          type: 'TipCard设问空泛',
          message: 'TipCard 核心设问严禁出现“观察图象走势/规律/体会参数”等低阶空泛套话，必须直击高考数学核心目标（如求范围/最值/零点/证明等）',
          snippet: qText.slice(0, 70) + '...',
        });
      }
    }
  }

  // 全文级检查 3B：TipCard 与二级选项联动静态检测 (全学科多级联动铁律)
  if (isAnimationPage && content.includes('<SelectGrid') && content.includes('TipCard')) {
    const selectGridValueMatches = [...content.matchAll(/<SelectGrid[\s\S]*?value=\{([a-zA-Z0-9_]+)\}/g)];
    const secondaryVars = selectGridValueMatches.map((m) => m[1]);

    for (const secVar of secondaryVars) {
      // 若 TipCard 开标签属性（props）中直接引用了该变量，视为已联动
      // 注意：仅匹配开标签到第一个 > 之间（非贪婪但限定无嵌套 > 出现），防止误匹配 children
      const directTipCardUsage = new RegExp(`<TipCard[^>]*${secVar}[^>]*>`).test(content);
      if (directTipCardUsage) continue;

      const hasTipConfig = /const\s+(?:tipConfig|tipProps|tipInfo)\s*=\s*useMemo\([\s\S]*?\}\s*,\s*\[([\s\S]*?)\]\s*\)/.exec(content);
      if (hasTipConfig) {
        const deps = hasTipConfig[1];
        if (!deps.includes(secVar)) {
          issues.push({
            lineNum: 1,
            type: 'TipCard未联动二级选项',
            message: `左屏存在 SelectGrid (绑定值: ${secVar})，但 tipConfig 的依赖项 [${deps}] 未包含该二级变量，导致选项切换时教学提示无法同步特化`,
            snippet: `tipConfig 缺少依赖: ${secVar}`,
          });
        }
      }
    }
  }

  // 全文级检查 3C：右屏数据装配缺少模式上下文透传 (防止右屏降级到默认分支导致数据显示不相干)
  if (isAnimationPage && content.includes('buildMathQuantities(') && content.includes('<SelectGrid')) {
    const buildCallMatch = content.match(/buildMathQuantities\s*\(\s*[^,]+,\s*[^,]+(?:,\s*\{([^}]*)\})?\s*\)/);
    if (buildCallMatch) {
      const configObj = (buildCallMatch[1] || "").toLowerCase();
      if (
        !configObj.includes("mode") &&
        !configObj.includes("preset") &&
        !configObj.includes("sub") &&
        !configObj.includes("scenario") &&
        !configObj.includes("type") &&
        !configObj.includes("tab") &&
        !configObj.includes("op") &&
        !configObj.includes("logic")
      ) {
        issues.push({
          lineNum: 1,
          type: '右屏缺少模式上下文透传',
          message: '主页面存在多情景切换，但 buildMathQuantities 第三个参数 config 缺少当前模式/二级选项透传，会导致右屏显示默认或不相干内容',
          snippet: buildCallMatch[0].slice(0, 60),
        });
      }
    }
  }

  // 全文级检查 3D：Builder 跨模式定理无分支装配风险 (防止右屏同时显示所有模式定理)
  if (filePath.includes('builders') && content.includes('theorems') && content.includes('mode')) {
    const hasUnconditionalPush = /theorems\.push\([\s\S]*?theorems\.push\(/g.test(content) && !content.includes('switch') && !content.includes('else if');
    if (hasUnconditionalPush) {
      issues.push({
        lineNum: 1,
        type: 'Builder定理未按模式隔离',
        message: '检测到 Builder 函数中可能存在跨模式定理无条件连续追加，必须按 mode 分支或字典映射纯净装配',
        snippet: 'theorems 缺少模式条件分支隔离',
      });
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

      // 规则 B：动参数动线置顶检测 (仅在三维立体几何与空间底模场景下检测：动分点 lambda/mu 应排在底模长宽高 a,b,c 之前)
      const isSolidContext = filePath.includes('solidGeometry') || /solid|cuboid|prism|pyramid/i.test(metaName);
      if (isSolidContext) {
        const dynamicKeyRegex = /^(lambda|mu|theta|phi|progress|step)/i;
        const staticKeyRegex = /^(a|b|c|width|height|depth|radius|len|r|size)/i;

        let foundStatic = false;
        let inverted = false;
        let invertedPair = '';
        for (const p of paramsList) {
          if (staticKeyRegex.test(p.key)) {
            foundStatic = true;
          } else if (dynamicKeyRegex.test(p.key) && foundStatic) {
            inverted = true;
            invertedPair = `立体几何底模尺寸排在核心动分点 ${p.key} 之前`;
            break;
          }
        }

        if (inverted) {
          issues.push({
            lineNum: 1,
            type: '动参数动线倒挂',
            message: `${metaName} 中核心动点参数应置顶于底模尺寸/背景常数之上，优先展示主要探究自变量`,
            snippet: invertedPair,
          });
        }
      }
    }
  }

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // 0. 数学层纯洁性检测 (src/math/ 与 src/math3d/ 必须为无副作用纯函数)
    const isMathPureLayer = (filePath.includes(path.join('src', 'math')) || filePath.includes(path.join('src', 'math3d'))) && !filePath.includes('test');
    if (isMathPureLayer) {
      if (/from\s+['"]react['"]/.test(line) || /from\s+['"]react-dom['"]/.test(line) || /\bdocument\./.test(line) || /\bwindow\./.test(line)) {
        issues.push({
          lineNum,
          type: '数学层纯洁性违规',
          message: 'src/math/ 与 src/math3d/ 必须为纯函数层，严禁导入 React 或直接访问 DOM / window 全局对象',
          snippet: line.trim()
        });
      }
      return; // 纯数学算法层跳过前端 UI/JSX 相关检查
    }

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
    if (!isTestFile && !isCommentLine && !isJsxElement && !line.includes('import') && /[\u4e00-\u9fa5]/.test(line)) {
      const strMatches = line.match(/(["'`])(?:\\.|(?!\1)[^\\])*\1/g) || [];
      for (const rawStr of strMatches) {
        const str = rawStr.slice(1, -1);
        if (/[\u4e00-\u9fa5]/.test(str) && !str.includes('$') && !line.includes('latex:') && !line.includes('formula:')) {
          const hasLatexCmd = /\\[a-zA-Z]{2,}/.test(str);
          const hasMathSuper = /[a-zA-Z]\^[0-9a-zA-Z]+/.test(str);
          const hasMathSub = /\b[a-zA-Z]{1,2}_[0-9a-zA-Z]+|\b[fgh]_(?:max|min)\b/.test(str);
          if (hasLatexCmd || hasMathSuper || hasMathSub) {
            issues.push({
              lineNum,
              type: '混合文本缺少$定界符',
              message: '检测到中文句子中包含 LaTeX 指令或上下标，但未用 $...$ 包裹，会导致公式无法被 KaTeX 正确切分渲染',
              snippet: line.trim()
            });
            break;
          }
        }
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
      // 排除 SceneLegend / SceneLegendItem 图例中的合法数学公式
      const contextAround = lines.slice(Math.max(0, index - 8), Math.min(lines.length, index + 8)).join('\n');
      const isLegendItem = contextAround.includes('legend') || contextAround.includes('Legend') || /style:\s*["'](solid|dash|point|area)["']/.test(contextAround);
      if (!isLegendItem) {
        issues.push({
          lineNum,
          type: 'SelectGrid选项堆砌公式',
          message: 'SelectGrid 选项应使用纯净加粗中文标题，严禁在 items 中配置 formula 堆砌公式或孤立代号（题设归位 TipCard，定理归位 MathPanel）',
          snippet: line.trim()
        });
      }
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

    // 12. 检查 BrowserRouter 违规（全库强制 HashRouter）
    if (/import\s*\{[^}]*BrowserRouter[^}]*\}\s*from\s*['"]react-router-dom['"]/.test(line) || /<BrowserRouter\b/.test(line)) {
      issues.push({
        lineNum,
        type: '全局禁止BrowserRouter',
        message: '全库禁止使用 BrowserRouter，离线环境与单页路由必须强制使用 HashRouter Only',
        snippet: line.trim()
      });
    }

    // 13. 检查 SVG 内部裸 fontSize 硬编码数字（必须经 fontScale 缩放）
    if ((filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) && /<text\b[^>]*\bfontSize=\{[0-9.]+\}/.test(line)) {
      if (!line.includes('fontScale') && !filePath.includes('test')) {
        issues.push({
          lineNum,
          type: 'SVG裸fontSize硬编码',
          message: 'SVG 标签内严禁直接硬编码裸数字 fontSize={...}，必须通过 fontScale 或 canvasSize.font 进行动态缩放',
          snippet: line.trim()
        });
      }
    }

    // 14. 检查硬编码 rgb/rgba 颜色（排除 theme 目录与测试文件）
    if (!filePath.includes('theme') && !filePath.includes('test') && !filePath.includes('css')) {
      if (/(stroke|fill|color|background|backgroundColor):\s*["']rgba?\([0-9\s.,%]+\)["']/.test(line) ||
          /(stroke|fill)=["']rgba?\([0-9\s.,%]+\)["']/.test(line)) {
        issues.push({
          lineNum,
          type: '硬编码rgb颜色',
          message: '禁止在业务源码中直接硬编码 rgb() / rgba() 色值，必须使用 MATH_COLORS 或 withAlpha()',
          snippet: line.trim()
        });
      }
    }

    // 15. 检查 3D 范式 A (综合法) 纯净度
    if ((filePath.includes('solidGeometry') || filePath.includes('math3d')) && (content.includes('范式 A') || content.includes('综合法') || content.includes('paradigm: "A"'))) {
      if (/<CoordinateAxes3D\b/.test(line) || /<Vector3DArrow\b/.test(line) || /<Scene3DGrid\b/.test(line)) {
        issues.push({
          lineNum,
          type: '3D综合法范式混入坐标轴或向量或网格',
          message: '综合法 (范式 A) 必须保持纯几何纯净度，严禁混入 <CoordinateAxes3D>、<Vector3DArrow> 或 <Scene3DGrid>',
          snippet: line.trim()
        });
      }
    }


    // 16. 检查数列离散点域特征
    if ((filePath.includes('sequence') || filePath.includes('Sequence')) && filePath.endsWith('Scene.tsx')) {
      if (/<SplineCurve\b/.test(line) || /<SmoothCurve\b/.test(line)) {
        issues.push({
          lineNum,
          type: '数列图象连续化违规',
          message: '数列必须严格遵守离散点域规范 (n ∈ N*)，图象主体必须为离散点列或柱状图，严禁光滑样条连续曲线冒充数列',
          snippet: line.trim()
        });
      }
    }

    // 17. 检查高中课标学术符号违规 (禁止大学粗体单字母向量、工程记号等)
    if ((filePath.includes('builders') || filePath.includes('registries') || filePath.endsWith('Animation.tsx') || filePath.endsWith('Scene.tsx')) && !filePath.includes('test')) {
      if (/\\mathbf\{[a-zA-Z]/.test(line)) {
        issues.push({
          lineNum,
          type: '课标符号违规',
          message: '高中向量必须使用 \\vec{a} 或 \\overrightarrow{AB}，严禁大学粗体 \\mathbf{a}',
          snippet: line.trim()
        });
      }
      if (/\b(nCr|nPr)\b/.test(line)) {
        issues.push({
          lineNum,
          type: '课标符号违规',
          message: '排列组合必须使用课标标准 C_n^m / \\binom{n}{m} / A_n^m，严禁工程记号 nCr / nPr',
          snippet: line.trim()
        });
      }
      if (/\\bot\b/.test(line) && !line.includes('bottom')) {
        issues.push({
          lineNum,
          type: '课标符号违规',
          message: '垂直符号必须使用课标标准 \\perp，严禁底元素符号 \\bot',
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
  if (isStrict) {
    console.error(`🚨 [门禁拦截] strict 模式下检测到 ${totalIssues} 处规范违规，阻断流程！请修复上述项后再交付。\n`);
    process.exit(1);
  } else {
    console.log(`💡 提示：可附加 --strict 参数在 CI/CD 或预提交时启用阻断拦截。\n`);
  }
}

