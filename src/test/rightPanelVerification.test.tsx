import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import "@/test/mocks";
import type { ComponentType } from "react";
import { routeEntries } from "@/data/routeEntries";
import type { RouteEntry } from "@/data/routeEntries";

// Mock KaTeX and SVG Canvas
vi.mock("@/components/UI/KatexFormula", () => ({
  KatexFormula: ({ formula }: { formula: string }) => (
    <span data-testid="katex">{formula}</span>
  ),
}));

// 原子数学组件整体替身为空渲染（页面测试只需挂载、不需要真画 SVG）。
// 用 importOriginal 自动枚举 barrel 的全部运行时导出：**新增原子组件时无需再手改此处**，
// 从根上消除「mock 清单漂移」；函数导出统一替身，非函数导出（如常量表）原样透传。
vi.mock("@/components/Math", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const stubbed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(actual)) {
    stubbed[key] = typeof value === "function" ? () => null : value;
  }
  stubbed.CoordinateGrid = () => <div data-testid="coordinate-grid" />;
  return stubbed;
});

// P1-14：不再把 3D 层整包 mock 成 null（那会让 3D 元素树永不渲染），
// 改为只替身「必须 WebGL / 必须 R3F 上下文」的边界，Math3D/* 与各 Scene 真实执行。
vi.mock("@react-three/fiber", async () => {
  const h = await import("@/test/harness/threeTestLayer");
  return h.fiberMock;
});

vi.mock("@react-three/drei", async () => {
  const h = await import("@/test/harness/threeTestLayer");
  return h.dreiMock;
});

/**
 * 与 App.tsx 的 adaptLoader / Guarded3DPage 完全同源的组件解算：
 * 优先 default 导出，缺省时回退「首个函数导出」。
 * 测试断言的就是路由真实挂载的那个组件，二者不可能脱节——
 * 本用例正是靠此解算捕获了「页面模块导出辅助纯函数后，原「首个函数导出」
 * 启发式会把辅助函数误当成页面组件挂载」这一真实缺陷。
 */
async function resolvePageComponent(
  entry: RouteEntry,
): Promise<ComponentType | undefined> {
  const mod = await entry.loader();
  if (typeof mod.default === "function") return mod.default;
  return Object.values(mod).find(
    (v): v is ComponentType => typeof v === "function",
  );
}

describe("右屏重构组件内容正确性与高中数学合规性验证", () => {
  // 清单 100% 由注册表 routeEntries 驱动（与路由同源），禁止手写组件 import + 数组：
  // 历史版本手工维护 22 个组件，新增页面永远不会被自动纳入。
  // 注意：loader 未必指向 *Animation.tsx（如 SetVennPage / SingleVarPage / SectionCuboidDemo），
  // 故必须走 routeEntries 而非 glob "**/*Animation.tsx"，否则会静默漏掉十余个页面。
  routeEntries.forEach((entry) => {
    const pageName = entry.node.labTitle || entry.node.title;

    // 每条用例独立动态 import 页面模块（含 3D 依赖图），首条与 3D 页会付出冷启动代价
    const PAGE_MOUNT_TIMEOUT = 30000;

    it(
      `${pageName}（${entry.node.id}）挂载后右屏内容正常，无 NaN/undefined，且公式合规`,
      async () => {
        const Page = await resolvePageComponent(entry);
        expect(typeof Page).toBe("function");
        if (!Page) return;

        // 页面在真实运行中恒处于 HashRouter 之下，部分页面用 useLocation() 取当前路由
        // 推导初始模式（如条件概率/贝叶斯），故此处也用 MemoryRouter 还原同样的上下文，
        // 严禁在 Router 之外裸渲染——那会掩盖「页面依赖路由上下文」这一类真实约束。
        const { container } = render(
          <MemoryRouter initialEntries={[entry.node.route ?? "/"]}>
            <Page />
          </MemoryRouter>,
        );

        const textContent = container.textContent || "";

        // 1. 严格检查：渲染内容中绝不能存在未定义的浮点异常或字符串错误
        expect(textContent).not.toContain("NaN");
        expect(textContent).not.toContain("undefined");
        expect(textContent).not.toContain("[object Object]");

        // 2. 检查右屏 KaTeX 公式是否存在
        const katexElements = container.querySelectorAll(
          '[data-testid="katex"]',
        );
        expect(katexElements.length).toBeGreaterThan(0);

        // 3. 检查每个公式字符串是否无 NaN / null / undefined 串入
        katexElements.forEach((el) => {
          const formula = el.textContent || "";
          expect(formula).not.toContain("NaN");
          expect(formula).not.toContain("undefined");
          expect(formula).not.toContain("null");
        });
      },
      PAGE_MOUNT_TIMEOUT,
    );
  });
});
