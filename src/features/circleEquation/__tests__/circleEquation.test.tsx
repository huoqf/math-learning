import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CircleEquationAnimation } from "../CircleEquationAnimation";

describe("圆的方程实验室集成测试 (CircleEquationAnimation)", () => {
  it("页面成功挂载，默认展示标准方程模式，并能正确渲染三屏核心元素", () => {
    const { container } = render(<CircleEquationAnimation />);

    // 左屏模式切换按钮
    expect(screen.getByText("标准方程与点圆关系")).toBeDefined();
    expect(screen.getByText("一般方程配方互化")).toBeDefined();
    expect(screen.getByText("待定系数法求圆")).toBeDefined();

    // 中屏 SVG 画布
    const circle = container.querySelector("circle");
    expect(circle).not.toBeNull();

    // 右屏看板标题
    expect(screen.getByText("圆的方程探究看板")).toBeDefined();
  });

  it("切换到一般方程配方互化模式，右屏展示配方法推导与判别式", () => {
    render(<CircleEquationAnimation />);

    // 切换到一般方程模式
    const generalTab = screen.getByText("一般方程配方互化");
    fireEvent.click(generalTab);

    // 题设卡片特化与定理展示
    expect(screen.getAllByText(/二元二次方程/).length).toBeGreaterThan(0);

    // 定理展示
    expect(screen.getByText("圆的一般方程与配方法")).toBeDefined();
  });

  it("切换到待定系数法求圆模式，能联动展示三点三角形与外心", () => {
    const { container } = render(<CircleEquationAnimation />);

    // 切换到待定系数法
    const threePointsTab = screen.getByText("待定系数法求圆");
    fireEvent.click(threePointsTab);

    // 中屏三角形多边形
    const polygon = container.querySelector("polygon");
    expect(polygon).not.toBeNull();

    // 右屏定理展示
    expect(screen.getByText("待定系数法求圆的方程")).toBeDefined();
  });
});
