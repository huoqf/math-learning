import { test, expect } from '@playwright/test';
import * as path from 'path';

const ARTIFACT_DIR = 'C:/Users/hqf/.gemini/antigravity/brain/5173fb9a-a331-4e45-8aa2-cd3885147018/scratch';

test.describe('Visual & Interaction Verification for Sequence Updates', () => {
  test('1. 首页高考专题视图与等差数列卡片跳转', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.locator('text=数列递推与新定义探索').first()).toBeVisible({ timeout: 10000 });
    
    // 截图首页
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, '01_home_gaokao_view.png'),
      fullPage: false,
    });

    // 精确点击等差数列卡片的标题
    const arithHeading = page.getByRole('heading', { level: 4, name: '等差数列通项与求和' });
    await expect(arithHeading).toBeVisible();
    await arithHeading.click();

    // 等待等差数列页面加载完成
    await expect(page.locator('text=等差数列看板').first()).toBeVisible({ timeout: 5000 });
    expect(page.url()).toContain('view=gaokao');

    // 验证默认切入高考核心模式：已知 Sn 求通项（Tab 为 "Sn 求 an"）
    const snTab = page.locator('button, [role="tab"]').filter({ hasText: 'Sn 求 an' }).first();
    await expect(snTab).toBeVisible();

    // 截图等差数列高考模式
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, '02_sequence_arithmetic_gaokao.png'),
      fullPage: false,
    });
  });

  test('2. 等差数列常规模式与对称配对', async ({ page }) => {
    await page.goto('/#/sequence-arithmetic');
    await expect(page.locator('text=等差数列看板').first()).toBeVisible();

    // 默认一次函数模式
    const linearTab = page.locator('button, [role="tab"]').filter({ hasText: '一次函数' }).first();
    await expect(linearTab).toBeVisible();

    // 截图中屏包含对称配对连线
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, '03_sequence_arithmetic_linear.png'),
      fullPage: false,
    });

    // 切换至前n项和二次函数模式
    const quadTab = page.locator('button, [role="tab"]').filter({ hasText: '二次最值' }).first();
    if (await quadTab.isVisible()) {
      await quadTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, '04_sequence_arithmetic_quadratic.png'),
        fullPage: false,
      });
    }
  });

  test('3. 等比数列错位相减与指数跃迁', async ({ page }) => {
    // 3.1 高考跳转模式
    await page.goto('/#/sequence-geometric?view=gaokao');
    await expect(page.locator('text=等比数列实验室').first()).toBeVisible();
    
    // 错位相减 Tab 激活
    const staggerTab = page.locator('button, [role="tab"]').filter({ hasText: '错位相减' }).first();
    await expect(staggerTab).toBeVisible();

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, '05_sequence_geometric_stagger.png'),
      fullPage: false,
    });

    // 3.2 普通模式
    await page.goto('/#/sequence-geometric');
    await expect(page.locator('text=等比数列实验室').first()).toBeVisible();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, '06_sequence_geometric_exponential.png'),
      fullPage: false,
    });
  });

  test('4. 高考求和模型分步作答三屏严格闭环', async ({ page }) => {
    await page.goto('/#/sequence-models');
    await expect(page.locator('text=高考求和模型看板').first()).toBeVisible();

    // 验证 StepNavigator
    await expect(page.locator('text=高考标准解答分步走').first()).toBeVisible();
    
    // 错位相减 Step 1 截图
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, '07_models_arith_geo_step1.png'),
      fullPage: false,
    });

    // 点击切换到 Step 2
    const step2Btn = page.locator('text=同乘公比右移一格错位对齐').first();
    await step2Btn.click();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, '08_models_arith_geo_step2.png'),
      fullPage: false,
    });

    // 点击切换到 Step 3
    const step3Btn = page.locator('text=两式错位相减合并中间等比项').first();
    await step3Btn.click();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, '09_models_arith_geo_step3.png'),
      fullPage: false,
    });

    // 点击切换到 Step 4
    const step4Btn = page.locator('text=分类讨论并化简结果检验首项').first();
    await step4Btn.click();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, '10_models_arith_geo_step4.png'),
      fullPage: false,
    });

    // 切换到裂项相消模型
    const teleRadio = page.locator('text=裂项相消').first();
    await teleRadio.click();
    await page.waitForTimeout(500);

    // 裂项相消 Step 1 截图
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, '11_models_telescoping_step1.png'),
      fullPage: false,
    });
  });

  test('5. 递推与构造法页面', async ({ page }) => {
    await page.goto('/#/sequence-recurrence');
    await expect(page.locator('text=递推与构造法看板').first()).toBeVisible();

    // 不动点法截图
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, '12_recurrence_linear_pan.png'),
      fullPage: false,
    });

    // 切换到累加法
    const accumRadio = page.locator('text=累加法').first();
    if (await accumRadio.isVisible()) {
      await accumRadio.click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, '13_recurrence_accumulation.png'),
        fullPage: false,
      });
    }

    // 切换到累乘法
    const multRadio = page.locator('text=累乘法').first();
    if (await multRadio.isVisible()) {
      await multRadio.click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, '14_recurrence_multiplication.png'),
        fullPage: false,
      });
    }
  });
});
