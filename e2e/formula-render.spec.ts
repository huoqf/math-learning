import { test, expect } from '@playwright/test';

const ROUTES = [
  { path: '/#/quadratic', name: '二次函数' },
  { path: '/#/derivative', name: '导数几何意义' },
  { path: '/#/function', name: '函数性质' },
  { path: '/#/constant', name: '恒成立问题' },
  { path: '/#/set', name: '集合与逻辑' },
  { path: '/#/transform', name: '图象变换' },
  { path: '/#/composite', name: '分段与复合函数' },
];

for (const route of ROUTES) {
  test(`formula rendering on ${route.name}`, async ({ page }) => {
    await page.goto(route.path);
    // 等待页面加载完成（包含"参数设置"文字）
    await page.getByText('参数设置').first().waitFor({ timeout: 10000 });

    // 检查所有 KatexFormula 是否渲染成功（失败时会显示纯文本，不会生成 .katex 元素）
    const katexElements = await page.locator('.katex').count();
    expect(katexElements, `期望 ${route.name} 页面至少有一些公式渲染`).toBeGreaterThan(0);

    // 检查 ParamControl 内的 label 公式：labelFormula 会生成 .katex 元素
    const paramLabels = await page.locator('label .katex, [class*="katex"]').count();
    expect(paramLabels, `期望 ${route.name} 页面参数标签有公式渲染`).toBeGreaterThan(0);

    // 截图用于人工复核
    await page.screenshot({ path: `e2e/screenshots/${route.name}.png`, fullPage: false });
  });
}

test('set page venn buttons use KaTeX', async ({ page }) => {
  await page.goto('/#/set');
  await page.getByText('参数设置').first().waitFor({ timeout: 10000 });

  // 检查 A ∩ B 按钮内部是否有 .katex
  const capBtn = page.locator('button').filter({ has: page.locator('.katex') }).first();
  await expect(capBtn).toBeVisible();
});

test('transform page fold buttons use KaTeX', async ({ page }) => {
  await page.goto('/#/transform');
  await page.getByText('参数设置').first().waitFor({ timeout: 10000 });

  // 检查翻折模式按钮内部是否有 .katex
  const foldBtn = page.locator('button').filter({ has: page.locator('.katex:has-text("f")') }).first();
  await expect(foldBtn).toBeVisible();
});

test('derivative page function buttons use KaTeX', async ({ page }) => {
  await page.goto('/#/derivative');
  await page.getByText('参数设置').first().waitFor({ timeout: 10000 });

  // 检查函数选择按钮内部是否有 .katex
  const fnBtn = page.locator('button').filter({ has: page.locator('.katex') }).first();
  await expect(fnBtn).toBeVisible();
});
