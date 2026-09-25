import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import "@/test/mocks";

vi.mock("@react-three/fiber", async () => {
  const h = await import("@/test/harness/threeTestLayer");
  return h.fiberMock;
});

vi.mock("@react-three/drei", async () => {
  const h = await import("@/test/harness/threeTestLayer");
  return h.dreiMock;
});

import SphereDerivationAnimation from "../SphereDerivationAnimation";
import { buildMathQuantities } from "@/data/mathQuantities";
import type { MathPanelData } from "@/data/types";

/**
 * anim-solid-sphere-derivation 页面契约测试。
 *
 * 该页有两种推导范式（祖暅原理 / 以锥积球），而 `buildSphereDerivationPanel`
 * 按 `mode` 走**互相独立的两条分支**：两者共享的 MathQuantity 只有极少数。
 * `panelMathTextGate` 的通用门禁以 `config: undefined` 采样，只会命中默认分支
 * （zuxuan），因此「切到模式二后右屏是否真的换分支」在这类通用门禁下**恒真而不被检验**——
 * 本文件正是补上这一段显式覆盖（同类缺陷见 solidPyramidDerivation 的 params 同源问题）。
 */

const ANIM_ID = "anim-solid-sphere-derivation";

/** 按页面真实调用口径构建右屏数据（页面同时把 mode 塞进 params 与 config） */
function buildPanel(
  mode: "zuxuan" | "micropyramid",
  extra: Record<string, number> = {},
): MathPanelData {
  return buildMathQuantities(
    ANIM_ID,
    {
      radius: 2.0,
      heightCut: 1.0,
      subdivisions: 16,
      ...extra,
      mode,
    } as unknown as Record<string, number>,
    { mode },
  );
}

/** 取指定 symbol 的数学量原始读数；缺失即失败，避免断言静默空转 */
function valueOf(data: MathPanelData, symbol: string): string {
  const quantity = data.quantities.find((item) => item.symbol === symbol);
  expect(quantity, `右屏缺少 symbol = ${symbol} 的数学量`).toBeTruthy();
  // MathQuantity.value 为 string | number，统一转成字符串再比对展示口径
  return String(quantity!.value);
}

/** 读数的数值部分（容忍 "512 块" / "1.60%" / "0.00 (严格恒等)" 这类带单位或后缀的展示） */
function numberOf(data: MathPanelData, symbol: string): number {
  return parseFloat(valueOf(data, symbol));
}

describe("SphereDerivationAnimation 页面契约测试", () => {
  it("默认渲染祖暅原理模式（等高切片阶段），三屏核心元素齐备", () => {
    const { container } = render(<SphereDerivationAnimation />);

    // 左屏：范式 Tab 与阶段 SelectGrid
    expect(screen.getByText("祖暅原理求体积")).toBeInTheDocument();
    expect(screen.getByText("以锥积球求表面积")).toBeInTheDocument();
    expect(screen.getByText("等高切片面积对比")).toBeInTheDocument();
    expect(screen.getByText("柱锥体积反向相减")).toBeInTheDocument();

    // 左屏 TipCard 徽标
    expect(
      screen.getByText("祖暅原理 · 幂势既同则积不容异"),
    ).toBeInTheDocument();

    // 右屏：必须是祖暅分支的量与定理
    const text = container.textContent ?? "";
    expect(text).toContain("完整球体体积");
    expect(text).toContain("半球截面圆面积 S₁");
    expect(text).toContain("挖锥柱体截面圆环面积 S₂");
    expect(text).toContain("祖暅原理（卡瓦列里原理）");
    // 截面积差恒等判据（S₁ ≡ S₂）在默认 h=1、R=2 下应报严格恒等
    expect(text).toContain("严格恒等");
  });

  it("切换到以锥积球模式，右屏换上微锥分割分支且旧分支量退场", () => {
    const { container } = render(<SphereDerivationAnimation />);
    fireEvent.click(screen.getByText("以锥积球求表面积"));

    expect(screen.getByText("以平代曲 · 以锥积球分割求和")).toBeInTheDocument();

    const text = container.textContent ?? "";
    // 模式二特有量：微锥总数 N = n×2n = 16×32、理论值与收敛判据
    expect(text).toContain("球面分割微锥总数");
    expect(text).toContain("512 块");
    expect(text).toContain("理论球表面积");
    expect(text).toContain("当前细分下的相对误差率");
    expect(text).toContain("以锥积球与分割近似求和原理");

    // 模式一的量与定理必须完全退场，否则即为两分支混装
    expect(text).not.toContain("挖锥柱体截面圆环面积 S₂");
    expect(text).not.toContain("祖暅原理（卡瓦列里原理）");
  });

  it("祖暅模式下切到「柱锥体积反向相减」，TipCard 设问随阶段特化", () => {
    const { container } = render(<SphereDerivationAnimation />);
    fireEvent.click(screen.getByText("柱锥体积反向相减"));

    // 阶段二做的是体积相减，设问应改为推导整球体积公式
    expect(container.textContent ?? "").toContain("推导完整球体体积公式");
  });
});

describe("anim-solid-sphere-derivation 右屏数据 SSOT 与模式派发", () => {
  it("祖暅分支：S₁(h) ≡ S₂(h) 且 V_球 = 4/3·πR³（截面恒等与体积公式自洽）", () => {
    const data = buildPanel("zuxuan", { radius: 2.0, heightCut: 1.0 });

    // 右屏读数统一以 2 位小数展示，故按同一精度锁定闭式解，杜绝"看起来对"的宽泛容差
    const at2 = (v: number) => v.toFixed(2);
    const s1 = valueOf(data, "S_1(h)");
    const s2 = valueOf(data, "S_2(h)");
    // S₁ = S₂ = π(R² − h²) = π(4 − 1) = 3π ≈ 9.42
    expect(s1).toBe(at2(Math.PI * (4 - 1)));
    expect(s2).toBe(s1);
    expect(valueOf(data, "|S_1 - S_2|")).toContain("严格恒等");

    const vHalf = numberOf(data, "V_{\\text{半球}}");
    const vSphere = numberOf(data, "V_{\\text{球}}");
    expect(vHalf).toBe(Number(at2((2 / 3) * Math.PI * 8)));
    expect(vSphere).toBe(Number(at2((4 / 3) * Math.PI * 8)));
    // V_球 = 2·V_半球，且 V_半球 = V_柱 − V_锥 = πR³ − (1/3)πR³
    // 各卡独立取 2 位小数，故恒等式比对容差取一个量化步长（0.05），
    // 免得把"各自四舍五入"误判成公式不自洽。
    expect(vSphere).toBeCloseTo(2 * vHalf, 1);
    expect(vHalf).toBeCloseTo(
      numberOf(data, "V_{\\text{柱}}") - numberOf(data, "V_{\\text{锥}}"),
      1,
    );
  });

  it("微锥分支：N = n×2n、理论值与细分加密时误差单调下降", () => {
    const data = buildPanel("micropyramid", { radius: 2.0, subdivisions: 16 });

    expect(numberOf(data, "N")).toBe(16 * 32);
    expect(valueOf(data, "S_{\\text{理论}}")).toBe(
      (4 * Math.PI * 4).toFixed(2),
    );
    expect(valueOf(data, "V_{\\text{理论}}")).toBe(
      ((4 / 3) * Math.PI * 8).toFixed(2),
    );

    // 「以平代曲 → 取极限」的可数值化表述：细分越密，相对误差率 δ 越小
    const errorAt = (n: number) =>
      numberOf(
        buildPanel("micropyramid", { radius: 2.0, subdivisions: n }),
        "\\delta",
      );
    expect(errorAt(8)).toBeGreaterThan(errorAt(16));
    expect(errorAt(16)).toBeGreaterThan(errorAt(32));
  });

  it("模式派发口径同源：params.mode 与 config.mode 任一存在都命中同一分支", () => {
    // 页面把 mode 同时写进 params 与 config（params.mode 为字符串强转）。
    // 两条路径必须落到同一分支，否则会出现「左屏切了模式、右屏仍停在旧分支」的静默失真。
    const viaParams = buildMathQuantities(
      ANIM_ID,
      { radius: 2.0, mode: "micropyramid" } as unknown as Record<
        string,
        number
      >,
      undefined,
    );
    const viaConfig = buildMathQuantities(
      ANIM_ID,
      { radius: 2.0 },
      { mode: "micropyramid" },
    );

    expect(viaParams.quantities.map((q) => q.symbol)).toEqual(
      viaConfig.quantities.map((q) => q.symbol),
    );
    expect(viaParams.quantities.map((q) => q.symbol)).toContain("N");
  });
});
