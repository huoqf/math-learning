import { test, expect, type Page } from '@playwright/test';

/**
 * 进入页面并等待公式渲染就绪。
 *
 * 不能再用「参数设置」作为就绪信号：该文案只是 `ParamControl` 在未传 `title`
 * 时的兜底值，而正式页面一律传了显式标题，因此那个字符串在真机上永远不出现，
 * 会让整份 e2e 恒失败（每次运行都直接超时）。改为以 `.katex` 出现为准——
 * 它既是「应用已成功挂载」的证据，也正是本文件要验证的对象。
 *
 * 另注：生产包曾因 `vendor-react ↔ vendor-misc` 循环分包而在启动时崩溃
 * （`reading 'forwardRef'` of undefined），此处超时即可同时兜住该类回归。
 */
async function gotoAndWaitFormulas(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('.katex').first()).toBeVisible({ timeout: 15000 });
}

const ROUTES = [
  { path: '/#/quadratic', name: '二次函数' },
  { path: '/#/derivative', name: '导数几何意义' },
  { path: '/#/function-domain', name: '函数性质' },
  { path: '/#/constant-single', name: '恒成立问题' },
  { path: '/#/set-logic', name: '集合与逻辑' },
  { path: '/#/transform', name: '图象变换' },
  { path: '/#/composite', name: '分段与复合函数' },
];

for (const route of ROUTES) {
  test(`formula rendering on ${route.name}`, async ({ page }) => {
    await gotoAndWaitFormulas(page, route.path);

    // 检查所有 KatexFormula 是否渲染成功（失败时会显示纯文本，不会生成 .katex 元素）
    const katexElements = await page.locator('.katex').count();
    expect(katexElements, `期望 ${route.name} 页面至少有一些公式渲染`).toBeGreaterThan(0);

    // 检查 ParamControl 内的 label 公式：labelFormula 会生成 .katex 元素
    const paramLabels = await page.locator('label .katex, [class*="katex"]').count();
    expect(paramLabels, `期望 ${route.name} 页面参数标签有公式渲染`).toBeGreaterThan(0);

    // 截图用于人工复核。落在 Playwright 的 outputDir（test-results/）下：
    // 该目录每次运行前会被清空，且已在 .gitignore 中，避免产物堆在 e2e/ 源码目录里。
    await page.screenshot({
      path: `test-results/screenshots/${route.name}.png`,
      fullPage: false,
    });
  });
}

test('set page venn buttons use KaTeX', async ({ page }) => {
  // Venn 运算按钮在 /set（SetVennPage）；/set-logic 是「充分必要条件」页，没有这组按钮。
  await gotoAndWaitFormulas(page, '/#/set');

  // 检查 A ∩ B 按钮内部是否有 .katex
  const capBtn = page.locator('button').filter({ has: page.locator('.katex') }).first();
  await expect(capBtn).toBeVisible();
});

test('transform page fold buttons use KaTeX', async ({ page }) => {
  await gotoAndWaitFormulas(page, '/#/transform');

  // 检查翻折模式按钮内部是否有 .katex
  const foldBtn = page.locator('button').filter({ has: page.locator('.katex:has-text("f")') }).first();
  await expect(foldBtn).toBeVisible();
});

test('derivative page function buttons use KaTeX', async ({ page }) => {
  await gotoAndWaitFormulas(page, '/#/derivative');

  // 检查函数选择按钮内部是否有 .katex
  const fnBtn = page.locator('button').filter({ has: page.locator('.katex') }).first();
  await expect(fnBtn).toBeVisible();
});
