/**
 * .agents/skills/math-page-audit/scripts/rules/architecture.mjs
 * 领域规则：系统架构与纯洁性底线
 */

export const architectureRules = [
  {
    id: 'arch/pure-math-layer',
    group: 'arch',
    type: '数学层纯洁性违规',
    severity: 'error',
    check(ctx) {
      if (!ctx.isMathPureLayer) return [];
      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        if (/from\s+['"]react['"]/.test(line) || /from\s+['"]react-dom['"]/.test(line) || /\bdocument\./.test(line) || /\bwindow\./.test(line)) {
          issues.push({
            lineNum: idx + 1,
            message: 'src/math/ 与 src/math3d/ 必须为纯函数层，严禁导入 React 或直接访问 DOM / window 全局对象',
            snippet: line.trim(),
          });
        }
      });
      return issues;
    },
  },
  {
    id: 'arch/no-browser-router',
    group: 'arch',
    type: '全局禁止BrowserRouter',
    severity: 'error',
    check(ctx) {
      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        if (/import\s*\{[^}]*BrowserRouter[^}]*\}\s*from\s*['"]react-router-dom['"]/.test(line) || /<BrowserRouter\b/.test(line)) {
          issues.push({
            lineNum: idx + 1,
            message: '全库禁止使用 BrowserRouter，离线环境与单页路由必须强制使用 HashRouter Only',
            snippet: line.trim(),
          });
        }
      });
      return issues;
    },
  },
  {
    id: 'arch/no-scroll-axis-conflict',
    group: 'arch',
    type: '多轴冲突隐式滚动容器',
    severity: 'error',
    check(ctx) {
      if (!ctx.filePath.includes('components/UI') || ctx.isTest) return [];
      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        if (/overflow-x-hidden\s+overflow-y-visible/.test(line) || /overflow-y-visible\s+overflow-x-hidden/.test(line)) {
          issues.push({
            lineNum: idx + 1,
            message: '严禁使用 overflow-x-hidden 与 overflow-y-visible 组合，浏览器规范会强制将 visible 降级为 auto 产生嵌套滚动条',
            snippet: line.trim(),
          });
        }
      });
      return issues;
    },
  },
  {
    id: 'arch/no-nested-vertical-scroll',
    group: 'arch',
    type: '嵌套垂直滚动容器违规',
    severity: 'error',
    check(ctx) {
      // 仅精准豁免顶层 ThreePanel.tsx 主布局与知识树主页面，以及单测文件
      const fileName = ctx.filePath.replace(/\\/g, '/').split('/').pop() || '';
      if (ctx.isTest || fileName === 'ThreePanel.tsx' || fileName === 'KnowledgeTreeHome.tsx') {
        return [];
      }
      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        if (/overflow-y-(?:auto|scroll)\b/.test(line)) {
          issues.push({
            lineNum: idx + 1,
            message: '严禁在子卡片或内部组件中私自设置 overflow-y-auto/scroll 制造嵌套滚动条，所有垂直滚动必须由 ThreePanel 顶层统一接管',
            snippet: line.trim(),
          });
        }
      });
      return issues;
    },
  },
];
