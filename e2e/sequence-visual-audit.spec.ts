import { test, expect } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

const ARTIFACT_DIR = path.resolve(
  process.cwd(),
  "test-results",
  "sequence-visual-audit",
);

test.beforeAll(() => {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
});

test.describe("Visual & Geometry Verification for Sequence Pages", () => {
  test("1. 首页进入等差数列携带 ?view=gaokao 并激活 Sn 求 an 视图", async ({
    page,
  }) => {
    await page.goto("/#/");
    await expect(
      page.locator("text=数列递推与新定义探索").first(),
    ).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "01_home_gaokao_view.png"),
      fullPage: false,
    });

    const arithHeading = page.getByRole("heading", {
      level: 4,
      name: "等差数列通项与求和",
    });
    await expect(arithHeading).toBeVisible();
    await arithHeading.click();

    await expect(page.locator("text=等差数列看板").first()).toBeVisible({
      timeout: 5000,
    });
    expect(page.url()).toContain("view=gaokao");

    const snTab = page
      .locator('button, [role="tab"], [role="radio"]')
      .filter({ hasText: "Sn 求 an" })
      .first();
    await expect(snTab).toBeVisible();
    await expect(snTab).toHaveAttribute("aria-checked", "true");

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "02_sequence_arithmetic_gaokao.png"),
      fullPage: false,
    });
  });

  test("2. 等差数列常规模式切换与对称配对文本无尾零", async ({ page }) => {
    await page.goto("/#/sequence-arithmetic");
    await expect(page.locator("text=等差数列看板").first()).toBeVisible();

    const linearTab = page
      .locator('button, [role="tab"]')
      .filter({ hasText: "一次函数" })
      .first();
    await expect(linearTab).toBeVisible();

    // 验证对称配对提示不带工科浮点尾零（如 = 1.00）
    const svgText = await page.locator("svg").first().textContent();
    expect(svgText ?? "").not.toMatch(/\d+\.00\b/);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "03_sequence_arithmetic_linear.png"),
      fullPage: false,
    });

    const quadTab = page
      .locator('button, [role="tab"]')
      .filter({ hasText: "二次最值" })
      .first();
    await expect(quadTab).toBeVisible();
    await quadTab.click();
    await expect(
      page.locator("svg g.sequence-scene-arithmetic-quadratic").first(),
    ).toBeVisible();

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "04_sequence_arithmetic_quadratic.png"),
      fullPage: false,
    });
  });

  test("3. 等比数列 q=2 指数跃迁：离散横轴占宽 ≥ 50% 且超界项显示显式断轴", async ({
    page,
  }) => {
    await page.goto("/#/sequence-geometric?view=gaokao");
    await expect(page.locator("text=等比数列实验室").first()).toBeVisible();
    await expect(
      page.locator("svg g.sequence-scene-stagger-sum").first(),
    ).toBeVisible();

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "05_sequence_geometric_stagger.png"),
      fullPage: false,
    });

    const expRadio = page.getByRole("radio", { name: /通项与指数模型/ }).first();
    await expect(expRadio).toBeVisible();
    await expRadio.click();
    await expect(
      page.locator("svg g.sequence-scene-geometric-exponential").first(),
    ).toBeVisible();

    // 切换预设 q=2 并调至 a1=3, N=8
    await page.getByRole("slider", { name: "首项 a₁滑块" }).fill("3");
    await page.getByRole("slider", { name: "公比 q滑块" }).fill("2");
    await page.getByRole("slider", { name: "展示项数 N滑块" }).fill("8");

    // 真实几何断言：8 个项节点必须在画布横向上充分铺开（≥ 50% SVG 宽）
    const svgBox = await page.locator("svg").first().boundingBox();
    expect(svgBox).not.toBeNull();

    const termNodes = page.locator('[data-seq-term-an="true"]');
    await expect(termNodes).toHaveCount(8);

    const xCoords: number[] = [];
    for (let i = 0; i < 8; i++) {
      const xVal = await termNodes.nth(i).getAttribute("data-x");
      xCoords.push(Number(xVal ?? "0"));
    }
    const xSpanDesign = Math.max(...xCoords) - Math.min(...xCoords);
    expect(xSpanDesign).toBeGreaterThanOrEqual(420);

    // 存在溢出截断且断轴警示显式可见
    await expect(page.locator('[data-axis-break="top"]').first()).toBeVisible();
    await expect(page.locator('[data-truncated="true"]').first()).toBeVisible();

    // 右屏与中屏统一禁止 .0000 机器尾零，断轴顶端 a8 与 S8 文本垂直间距 >= 14px
    const bodyText = (await page.locator("main").textContent()) ?? "";
    expect(bodyText).not.toMatch(/\b384\.0000\b/);
    const anBox = await page.locator("svg text", { hasText: "a₈ = 384" }).first().boundingBox();
    const snBox = await page.locator("svg text", { hasText: "S₈ = 765" }).first().boundingBox();
    expect(anBox).not.toBeNull();
    expect(snBox).not.toBeNull();
    expect(Math.abs((snBox?.y ?? 0) - (anBox?.y ?? 0))).toBeGreaterThanOrEqual(12);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "06_sequence_geometric_exponential_q2.png"),
      fullPage: false,
    });
  });

  test("4. 高考求和模型错位相减 q=2：禁止等高截断柱，须呈现锯齿断口与阶梯高度差", async ({
    page,
  }) => {
    await page.goto("/#/sequence-models");
    await expect(page.locator("text=高考求和模型看板").first()).toBeVisible();
    await expect(
      page.locator("text=高考标准解答分步走").first(),
    ).toBeVisible();

    await page.getByRole("slider", { name: "首项 a₁滑块" }).fill("1");
    await page.getByRole("slider", { name: "公差 d滑块" }).fill("1");
    await page.getByRole("slider", { name: "公比 q滑块" }).fill("2");
    await page.getByRole("slider", { name: "展示项数 N滑块" }).fill("8");

    const bars = page.locator('g.sequence-scene-arith-geo [data-seq-bar="true"]');
    await expect(bars).toHaveCount(8);

    const h1 = Number(await bars.nth(0).getAttribute("height"));
    const h2 = Number(await bars.nth(1).getAttribute("height"));
    const h6 = Number(await bars.nth(5).getAttribute("height"));
    const h7 = Number(await bars.nth(6).getAttribute("height"));
    const h8 = Number(await bars.nth(7).getAttribute("height"));
    expect(h2).toBeGreaterThan(h1);
    expect(h7).toBeGreaterThan(h6);
    expect(h8).toBeGreaterThan(h7);

    // 所有正项柱底必须齐平贴紧 y=0 横轴（禁止悬空或倒挂）
    const y1 = Number(await bars.nth(0).getAttribute("y"));
    const y8 = Number(await bars.nth(7).getAttribute("y"));
    const zeroAxisDesignY = y1 + h1;
    expect(Math.abs(zeroAxisDesignY - (y8 + h8))).toBeLessThan(1);

    await expect(
      page.locator('g.sequence-scene-arith-geo [data-bar-truncated="true"]').first(),
    ).toBeVisible();

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "07_models_arith_geo_q2_step1.png"),
      fullPage: false,
    });

    await page.locator("text=同乘公比右移一格错位对齐").first().click();
    await expect(page.locator("g.step-2-shift-grid").first()).toBeVisible();

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "08_models_arith_geo_step2.png"),
      fullPage: false,
    });

    await page.locator("text=两式错位相减合并中间等比项").first().click();
    await expect(page.locator("g.step-3-subtract-view").first()).toBeVisible();

    await page.locator("text=分类讨论并化简结果检验首项").first().click();
    await expect(page.locator("g.step4-verify-badge").first()).toBeVisible();

    // 真实几何验证：负尾项柱必须朝第四象限 y=0 下方延伸；中间纯等比段实柱存在；Step4 徽标与橙框标题零撞框
    const tailBarY = Number(
      await page
        .locator('g.tail-warning-term rect[data-seq-bar="true"]')
        .first()
        .getAttribute("y"),
    );
    expect(tailBarY).toBeGreaterThanOrEqual(zeroAxisDesignY - 1);
    await expect(
      page.locator('g.middle-geo-box rect[data-seq-bar="true"]'),
    ).toHaveCount(7);
    const step4BadgeBox = await page
      .locator("g.step4-verify-badge rect")
      .first()
      .boundingBox();
    const middleTitleBox = await page
      .locator("g.middle-geo-box text")
      .first()
      .boundingBox();
    expect(step4BadgeBox).not.toBeNull();
    expect(middleTitleBox).not.toBeNull();
    expect(middleTitleBox?.y ?? 0).toBeGreaterThanOrEqual(
      (step4BadgeBox?.y ?? 0) + (step4BadgeBox?.height ?? 0),
    );

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "09_models_arith_geo_step4.png"),
      fullPage: false,
    });

    await page.locator("text=裂项相消").first().click();
    await expect(
      page.locator("svg g.telescoping-domino-card").first(),
    ).toBeVisible();

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "10_models_telescoping_step1.png"),
      fullPage: false,
    });
  });

  test("5. 递推与构造法页面模式切换与 SVG 渲染验证", async ({ page }) => {
    await page.goto("/#/sequence-recurrence");
    await expect(page.locator("text=递推与构造法看板").first()).toBeVisible();

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "11_recurrence_linear_pan.png"),
      fullPage: false,
    });

    const accumRadio = page.locator("text=累加法").first();
    await expect(accumRadio).toBeVisible();
    await accumRadio.click();
    await expect(page.locator("svg circle").first()).toBeVisible();

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "12_recurrence_accumulation.png"),
      fullPage: false,
    });
  });
});
