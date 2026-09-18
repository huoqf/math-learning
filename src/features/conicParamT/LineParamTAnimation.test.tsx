import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LineParamTAnimation } from "./LineParamTAnimation";

/**
 * 读取中屏椭圆的实际 rx / ry。
 * useSceneScale 默认 keepAspectRatio=true（scaleX === scaleY），
 * 因此 ry ≤ rx 与 b ≤ a 完全等价，断言不依赖像素比例尺。
 */
const readEllipseAxes = (container: HTMLElement) => {
  const ell = container.querySelector("ellipse");
  if (!ell) return null;
  return {
    rx: Number(ell.getAttribute("rx")),
    ry: Number(ell.getAttribute("ry")),
  };
};

const setSlider = (label: string, value: string) => {
  const el = screen.getByLabelText(label) as HTMLInputElement;
  fireEvent.change(el, { target: { value } });
  return el;
};

describe("conicParamT 椭圆半轴不变量 a > b > 0", () => {
  it("先把 b 调大、再把 a 拖到下限，椭圆的 b 必须随之回缩（不得画出纵向椭圆）", () => {
    const { container } = render(<LineParamTAnimation />);

    // 进入可渲染二次曲线的模式，再切到椭圆（该情景预设 a=3.5, b=2.0）
    fireEvent.click(screen.getByText("割线方幂"));
    fireEvent.click(screen.getByLabelText("椭圆, 标准椭圆方程"));

    // ① 先把 a 调大，再把 b 调到一个远大于 a 下限的值 —— 此刻 b < a，完全合法
    setSlider("半轴 a滑块", "5");
    setSlider("半轴 b滑块", "3");

    const before = readEllipseAxes(container);
    expect(before).not.toBeNull();
    expect(before!.ry).toBeLessThan(before!.rx);

    // ② 再把 a 拖到下限。旧实现只收紧 b 的滑块显示上限、既不回写 state 也不回缩 b，
    //    于是 state 里留下 b=3 > a=1.5，中屏被画成纵向椭圆。
    setSlider("半轴 a滑块", "1.5");

    const after = readEllipseAxes(container);
    expect(after).not.toBeNull();
    expect(after!.rx).toBeGreaterThan(0);
    expect(after!.ry).toBeGreaterThan(0);

    // 核心不变量：椭圆始终横向（a ≥ b），绝不出现 ry > rx
    expect(after!.ry).toBeLessThanOrEqual(after!.rx);
    // 且越界的 b 确实被收敛，而不是原封不动地留在画面里
    expect(after!.ry).toBeLessThan(before!.ry);
  });
});
