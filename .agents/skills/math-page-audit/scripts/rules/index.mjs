/**
 * .agents/skills/math-page-audit/scripts/rules/index.mjs
 * 统一注册导出所有审计规则
 */

import { architectureRules } from './architecture.mjs';
import { leftPanelRules } from './left-panel.mjs';
import { centerCanvasRules } from './center-canvas.mjs';
import { rightPanelRules } from './right-panel.mjs';
import { styleTokensRules } from './style-tokens.mjs';
import { disciplineRules } from './discipline.mjs';

export const allRules = [
  ...architectureRules,
  ...leftPanelRules,
  ...centerCanvasRules,
  ...rightPanelRules,
  ...styleTokensRules,
  ...disciplineRules,
];
