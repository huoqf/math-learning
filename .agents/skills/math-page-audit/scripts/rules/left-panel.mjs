/**
 * .agents/skills/math-page-audit/scripts/rules/left-panel.mjs
 * 领域规则：左屏控制台与教学交互规范
 */

export const leftPanelRules = [
  {
    id: 'left/require-tipcard',
    group: 'left',
    type: '缺失教学导引',
    severity: 'error',
    check(ctx) {
      if (!ctx.isAnimationPage) return [];
      if (!ctx.cleanContent.includes('TipCard')) {
        return [{
          lineNum: 1,
          message: '主探究页面左屏必须包含 TipCard 教学导引卡片（说明模型特征与核心设问）',
          snippet: 'ThreePanel 页面未引入/挂载 TipCard',
        }];
      }
      return [];
    },
  },
  {
    id: 'left/map-keys-group',
    type: '参数映射丢失group',
    severity: 'error',
    check(ctx) {
      if (!ctx.isAnimationPage || !ctx.cleanContent.includes('mapKeysToConfigs')) return [];
      const mapMatch = ctx.cleanContent.match(/const\s+mapKeysToConfigs\s*=\s*useCallback\([\s\S]*?return\s+keys[\s\S]*?\.map\(\s*\([^)]*\)\s*=>\s*\(\{([\s\S]*?)\}\)/);
      if (mapMatch && !mapMatch[1].includes('group')) {
        return [{
          lineNum: 1,
          message: 'mapKeysToConfigs 未解构/传递 group: meta.group，会导致左屏参数分组卡片无法正常渲染',
          snippet: 'mapKeysToConfigs 返回项缺少 group 属性',
        }];
      }
      return [];
    },
  },
  {
    id: 'left/tipcard-quality',
    type: 'TipCard设问质量',
    severity: 'error',
    check(ctx) {
      if (!ctx.cleanContent.includes('TipCard') && !ctx.cleanContent.includes('question:') && !ctx.cleanContent.includes('detail:')) {
        return [];
      }
      const issues = [];
      const questionMatches = ctx.cleanContent.matchAll(/(?:question|detail)\s*:\s*["'`]([\s\S]*?)["'`]/g);
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
        if (
          /(拖动|滑动).*(观察|看一看|体会)|(观察|看一看|体会).*(变化|走势|规律|作用)|(图形|图象|曲线)怎么动|移动滑块看看/.test(qText)
        ) {
          issues.push({
            lineNum: 1,
            type: 'TipCard设问空泛',
            message: 'TipCard 教学导引严禁出现“拖动/滑动...观察”、“观察图象走势/规律/体会参数”等低阶空泛套话，必须直击高考数学核心目标（如求范围/最值/零点/证明等）',
            snippet: qText.slice(0, 70) + '...',
          });
        }
      }
      return issues;
    },
  },
  {
    id: 'left/tipcard-secondary-sync',
    type: 'TipCard未联动二级选项',
    severity: 'error',
    check(ctx) {
      if (!ctx.isAnimationPage || !ctx.cleanContent.includes('<SelectGrid') || !ctx.cleanContent.includes('TipCard')) {
        return [];
      }
      const selectGridValueMatches = [...ctx.cleanContent.matchAll(/<SelectGrid[\s\S]*?value=\{([a-zA-Z0-9_]+)\}/g)];
      const secondaryVars = selectGridValueMatches.map((m) => m[1]);
      const issues = [];

      for (const secVar of secondaryVars) {
        const directTipCardUsage = new RegExp(`<TipCard[^>]*${secVar}[^>]*>`).test(ctx.cleanContent);
        if (directTipCardUsage) continue;

        const hasTipConfig = /const\s+(?:tipConfig|tipProps|tipInfo)\s*=\s*useMemo\([\s\S]*?\}\s*,\s*\[([\s\S]*?)\]\s*\)/.exec(ctx.cleanContent);
        if (hasTipConfig) {
          const deps = hasTipConfig[1];
          if (!deps.includes(secVar)) {
            issues.push({
              lineNum: 1,
              message: `左屏存在 SelectGrid (绑定值: ${secVar})，但 tipConfig 的依赖项 [${deps}] 未包含该二级变量，导致选项切换时教学提示无法同步特化`,
              snippet: `tipConfig 缺少依赖: ${secVar}`,
            });
          }
        }
      }
      return issues;
    },
  },
  {
    id: 'left/step-order',
    type: '左屏动线倒挂违规',
    severity: 'error',
    check(ctx) {
      if (!ctx.isAnimationPage || !ctx.cleanContent.includes('<ParamControl') || !ctx.cleanContent.includes('<TipCard')) {
        return [];
      }
      const paramControlIndex = ctx.cleanContent.indexOf('<ParamControl');
      const tipCardIndex = ctx.cleanContent.lastIndexOf('<TipCard');
      if (tipCardIndex !== -1 && paramControlIndex !== -1 && tipCardIndex < paramControlIndex) {
        return [{
          lineNum: 1,
          message: 'TipCard 教学导引必须置于左屏最底部，严禁将 TipCard 置于 ParamControl 参数滑块上方导致动线倒挂',
          snippet: '检测到 TipCard 出现在 ParamControl 之前',
        }];
      }
      return [];
    },
  },
  {
    id: 'left/no-exam-boundary-leak',
    type: '左屏职责越界',
    severity: 'error',
    check(ctx) {
      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        if (line.includes('<TipCard') || (line.includes('title=') && line.includes('LeftPanelSection'))) {
          if (line.includes('高考核心') || line.includes('高考题型') || line.includes('高考考点')) {
            issues.push({
              lineNum: idx + 1,
              message: '左屏应聚焦于模型条件与探究设问，严禁堆砌高考考点字样（请归位右屏 MathPanel）',
              snippet: line.trim(),
            });
          }
        }
      });
      return issues;
    },
  },
  {
    id: 'left/param-registry-meta',
    type: '参数元数据合规性',
    severity: 'error',
    check(ctx) {
      if (!ctx.isRegistry || !ctx.cleanContent.includes('ParamMeta[]')) return [];
      const metaArrayRegex = /export\s+const\s+(\w+Meta)\s*:\s*ParamMeta\[\]\s*=\s*\[([\s\S]*?)\];/g;
      let matchMeta;
      const issues = [];

      while ((matchMeta = metaArrayRegex.exec(ctx.cleanContent)) !== null) {
        const metaName = matchMeta[1];
        const arrayBody = matchMeta[2];
        const paramBlocks = arrayBody.split(/\},\s*\{/);
        const paramsList = [];
        for (const block of paramBlocks) {
          const keyMatch = block.match(/key:\s*["']([^"']+)["']/);
          const groupMatch = block.match(/group:\s*["']([^"']+)["']/);
          if (keyMatch) {
            paramsList.push({
              key: keyMatch[1],
              hasGroup: Boolean(groupMatch),
            });
          }
        }

        // 规则 A：参数数量 >= 4 必须配置 group 分组
        if (paramsList.length >= 4 && paramsList.some((p) => !p.hasGroup)) {
          issues.push({
            lineNum: 1,
            type: '参数过多未分组',
            message: `${metaName} 包含 ${paramsList.length} 个参数 (>=4 项)，严禁全平铺，必须通过 group 字段进行对象化分层`,
            snippet: `${metaName} 包含 ${paramsList.length} 项参数，未全量配置 group`,
          });
        }

        // 规则 B：动参数动线置顶检测 (三维场景)
        const isSolidContext = ctx.filePath.includes('solidGeometry') || /solid|cuboid|prism|pyramid/i.test(metaName);
        if (isSolidContext) {
          const dynamicKeyRegex = /^(lambda|mu|theta|phi|progress|step)/i;
          const staticKeyRegex = /^(a|b|c|width|height|depth|radius|len|r|size)/i;
          let foundStatic = false;
          for (const p of paramsList) {
            if (staticKeyRegex.test(p.key)) {
              foundStatic = true;
            } else if (dynamicKeyRegex.test(p.key) && foundStatic) {
              issues.push({
                lineNum: 1,
                type: '动参数动线倒挂',
                message: `${metaName} 中核心动点参数应置顶于底模尺寸/背景常数之上，优先展示主要探究自变量`,
                snippet: `立体几何底模尺寸排在核心动分点 ${p.key} 之前`,
              });
              break;
            }
          }
        }
      }
      return issues;
    },
  },
  {
    id: 'left/select-grid-clean',
    type: 'SelectGrid选项堆砌公式',
    severity: 'error',
    check(ctx) {
      if (ctx.isTest) return [];
      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        if ((line.includes('<SelectGrid') && line.includes('formula=')) ||
          (/^\s*formula:\s*["'`][^"'`]+["'`]/.test(line) && !line.includes('labelFormula') && !line.includes('descriptionFormula') &&
           (ctx.filePath.includes('Animation.tsx') || ctx.filePath.includes('LeftPanel.tsx')))) {
          const contextAround = ctx.cleanLines.slice(Math.max(0, idx - 8), Math.min(ctx.cleanLines.length, idx + 8)).join('\n');
          const isLegendItem = contextAround.includes('legend') || contextAround.includes('Legend') || /style:\s*["'](solid|dash|point|area)["']/.test(contextAround);
          if (!isLegendItem) {
            issues.push({
              lineNum: idx + 1,
              message: 'SelectGrid 选项应使用纯净加粗中文标题，严禁在 items 中配置 formula 堆砌公式或孤立代号（题设归位 TipCard，定理归位 MathPanel）',
              snippet: line.trim(),
            });
          }
        }
      });
      return issues;
    },
  },
  {
    id: 'left/param-label-format',
    type: '参数标签格式违规',
    severity: 'error',
    check(ctx) {
      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        if (/labelFormula:\s*["'][a-zA-Z0-9_]["']/.test(line)) {
          issues.push({
            lineNum: idx + 1,
            type: '孤立参数代号',
            message: '参数标签缺少中文几何含义，应为: \\text{含义 } \\color{...}{字母}',
            snippet: line.trim(),
          });
        }
        if (line.includes('labelFormula:') && !line.includes('value:') && !line.includes('variant:')) {
          const match = line.match(/labelFormula:\s*["'`](.*)["'`]/);
          if (match) {
            const formula = match[1];
            const pureMath = formula.replace(/\\text\{[^}]*\}/g, '').replace(/\\color\{[^}]*\}/g, '').trim();
            if (!/[a-zA-Z]/.test(pureMath)) {
              issues.push({
                lineNum: idx + 1,
                type: '参数缺少数学代号',
                message: '参数标签缺少具体数学代号（如 a, b, x_0, PA, CA），应遵循: \\text{含义 } \\color{...}{代号}',
                snippet: line.trim(),
              });
            }
            if (/[a-zA-Z]/.test(formula) && !formula.includes('\\color') && !formula.includes('\\frac')) {
              issues.push({
                lineNum: idx + 1,
                type: '参数未绑定色彩Token',
                message: '参数标签必须按三位一体原则绑定色彩 Token: \\color{${MATH_COLORS.paramPrimary}}{...}',
                snippet: line.trim(),
              });
            }
          }
        }
      });
      return issues;
    },
  },
];
