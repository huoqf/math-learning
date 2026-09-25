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

import PyramidDerivationAnimation from "../PyramidDerivationAnimation";

describe("PyramidDerivationAnimation 页面契约测试", () => {
  it("默认渲染三棱柱三分法模式，左中右三屏正常加载", () => {
    render(<PyramidDerivationAnimation />);

    // 左屏标题与 Tab
    expect(screen.getByText("推导范式选择")).toBeInTheDocument();
    expect(screen.getByText("三棱柱三分法")).toBeInTheDocument();
    expect(screen.getByText("刘徽阳马与鳖臑")).toBeInTheDocument();

    // 探究导引 TipCard
    expect(screen.getByText("欧几里得分割 · 三等分三棱柱")).toBeInTheDocument();

    // 右屏核心量或定理
    expect(screen.getByText("三棱柱总体积")).toBeInTheDocument();
    expect(screen.getByText("单个三棱锥体积")).toBeInTheDocument();

    // 中屏图例一致性校验
    expect(screen.getByText("三棱锥① A₁-ABC")).toBeInTheDocument();
    expect(screen.getByText("三棱锥② A₁-BCC₁")).toBeInTheDocument();
    expect(screen.getByText("三棱锥③ C₁-A₁B₁B")).toBeInTheDocument();
  });

  it("点击切换到刘徽阳马与鳖臑模式，三屏联动同步更新", () => {
    render(<PyramidDerivationAnimation />);

    const yangmaTab = screen.getByText("刘徽阳马与鳖臑");
    fireEvent.click(yangmaTab);

    // TipCard 徽标更新
    expect(
      screen.getByText("《九章算术》刘徽割体术 · 阳马与鳖臑"),
    ).toBeInTheDocument();

    // 右屏更新为阳马与鳖臑指标
    expect(screen.getByText("母体堑堵体积")).toBeInTheDocument();
    expect(screen.getByText("阳马体积")).toBeInTheDocument();
    expect(screen.getByText("鳖臑体积")).toBeInTheDocument();

    // 中屏图例一致性校验（阳马与鳖臑图例同步切换）
    expect(screen.getByText(/阳马 A₁-OBB₁O₁/)).toBeInTheDocument();
    expect(screen.getByText(/鳖臑 A₁-OAB/)).toBeInTheDocument();
  });

  it("默认态显示母体顶点字母，拖大爆炸进度后改由子体名称接替", () => {
    const { container } = render(<PyramidDerivationAnimation />);

    // 3D 层标注文本被 drei Text 替身为 <sprite/>（文本内容不进 DOM），
    // 故以 sprite 数量作为「当前显示几个标注」的结构代理（本页仅 PointLabel3D 产出 sprite）。
    const labelCount = () => container.querySelectorAll("sprite").length;

    // 默认不拆解：显示母体 6 个顶点字母 A/B/C/A₁/B₁/C₁，此刻不显示子体名称
    expect(labelCount()).toBe(6);

    // 拖动「爆炸拆解进度」（唯一 min=0 / max=1 的滑块）使子体分离
    const explodeSlider = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[type="range"]'),
    ).find(
      (s) => s.getAttribute("min") === "0" && s.getAttribute("max") === "1",
    );
    expect(explodeSlider).toBeTruthy();
    fireEvent.change(explodeSlider!, { target: { value: "0.6" } });

    // 分离后顶点字母退场（位置已漂移），改由 3 个子体名称标注接替
    expect(labelCount()).toBe(3);
  });

  it("点击切换到祖暅圆锥等积模式，三屏联动同步更新", () => {
    render(<PyramidDerivationAnimation />);

    const coneTab = screen.getByText("祖暅圆锥等积");
    fireEvent.click(coneTab);

    // TipCard 徽标更新
    expect(screen.getByText("祖暅原理 · 圆锥与棱锥等积")).toBeInTheDocument();

    // 右屏更新为圆锥与伴随四棱锥等积指标
    expect(screen.getByText("共同底面积 S_底")).toBeInTheDocument();
    expect(screen.getByText("伴随正棱锥底边长 a")).toBeInTheDocument();
    expect(screen.getByText("圆锥截面圆面积 S₁")).toBeInTheDocument();
    expect(screen.getByText("四棱锥截面面积 S₂")).toBeInTheDocument();

    // 中屏图例同步更新
    expect(screen.getByText(/圆锥体 \(底半径 r\)/)).toBeInTheDocument();
    expect(screen.getByText(/伴随四棱锥/)).toBeInTheDocument();
    expect(screen.getByText("等高平行截面 (S₁ ≡ S₂)")).toBeInTheDocument();
  });
});
