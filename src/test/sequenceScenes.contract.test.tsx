/**
 * src/test/sequenceScenes.contract.test.tsx
 * 数列关键场景守卫「渲染级」契约测试：
 * 1. 等比/等差片段和场景空态卡：参数准确透传与两页一致性 (k 与 2k 引导文案)；
 * 2. 高斯倒序相加场景：正项几何扣合 vs 负项代数对称配对双分支真实渲染切分；
 * 3. 二阶递推场景：Δ < 0 降阶等比不可用警示与 bn 散点屏蔽真实渲染拦截。
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { CANVAS_PRESETS } from "@/theme";
import { calculateSceneScale, type ViewportInfo } from "@/hooks";
import { SequenceGeometricSegmentScene } from "@/features/sequence/components/SequenceGeometricSegmentScene";
import { SequenceArithmeticSegmentScene } from "@/features/sequence/components/SequenceArithmeticSegmentScene";
import { SequenceArithmeticGaussScene } from "@/features/sequence/components/SequenceArithmeticGaussScene";
import { RecurrenceSecondOrderScene } from "@/features/sequence/components/RecurrenceSecondOrderScene";

const { width: FULL_W, height: FULL_H } = CANVAS_PRESETS.full;

const VP: ViewportInfo = {
  visibleX: 0,
  visibleY: 0,
  visibleW: FULL_W,
  visibleH: FULL_H,
  centerX: FULL_W / 2,
  centerY: FULL_H / 2,
  scale: 1,
  tx: 0,
  ty: 0,
  transform: "",
  designVisibleW: FULL_W,
  designVisibleH: FULL_H,
  designLeft: 0,
  designTop: 0,
};

const dummyScale = calculateSceneScale({
  designVisibleW: FULL_W,
  designVisibleH: FULL_H,
  designLeft: 0,
  designTop: 0,
  xRange: [-1, 15],
  yRange: [-20, 50],
  keepAspectRatio: false,
});

const dummyFontScale = (size: number) => size;

describe("数列场景渲染级守卫契约测试", () => {
  describe("1. 片段场景空态引导卡与 k 参数真实绑定", () => {
    it("等比片段场景：N=6, kSegment=4 时准确渲染空态提示，不得硬编码回退至 k=3", () => {
      const { container } = render(
        <svg>
          <SequenceGeometricSegmentScene
            params={{ a1: 2, q: 2, N: 6, kSegment: 4 }}
            scale={dummyScale}
            fontScale={dummyFontScale}
          />
        </svg>,
      );

      const textContent = container.textContent || "";
      // 必须渲染当前传入的 k=4
      expect(textContent).toContain("项数不足成段 (当前 N=6, k=4)");
      expect(textContent).toContain("至少需要 N ≥ 2k (8 项)");
      // 绝不可错误显示回退默认值 k=3
      expect(textContent).not.toContain("k=3");
      expect(textContent).not.toContain("6 项");
    });

    it("等差片段场景：N=6, kSegment=4 时准确渲染空态提示，与等比页保持完全对称", () => {
      const { container } = render(
        <svg>
          <SequenceArithmeticSegmentScene
            params={{ a1: 1, d: 2, N: 6, kSegment: 4 }}
            scale={dummyScale}
            vp={VP}
            fontScale={dummyFontScale}
          />
        </svg>,
      );

      const textContent = container.textContent || "";
      expect(textContent).toContain("项数不足成段 (当前 N=6, k=4)");
      expect(textContent).toContain("至少需要 N ≥ 2k (8 项)");
    });

    it("等比片段场景：项数足够成段时 (N=8, kSegment=4)，空态卡消失且渲染等比公比倍数标签", () => {
      const { container } = render(
        <svg>
          <SequenceGeometricSegmentScene
            params={{ a1: 1, q: 2, N: 8, kSegment: 4 }}
            scale={dummyScale}
            fontScale={dummyFontScale}
          />
        </svg>,
      );

      const textContent = container.textContent || "";
      expect(textContent).not.toContain("项数不足成段");
      expect(textContent).toContain("× q⁴");
    });
  });

  describe("2. 高斯倒序相加双构型真实渲染切换", () => {
    it("正项场景：渲染几何无字证明阶梯拼接与大长方形面积说明", () => {
      const { container } = render(
        <svg>
          <SequenceArithmeticGaussScene
            params={{ a1: 1, d: 2, N: 5, gaussRatio: 1 }}
            scale={dummyScale}
            vp={VP}
            fontScale={dummyFontScale}
          />
        </svg>,
      );

      const textContent = container.textContent || "";
      expect(textContent).toContain("大长方形面积");
      expect(textContent).not.toContain("代数配对和");
      expect(textContent).not.toContain("几何面积拼图失效");
    });

    it("含负项场景：自动切换为代数对称双列配对柱，严禁展示几何大长方形面积", () => {
      const { container } = render(
        <svg>
          <SequenceArithmeticGaussScene
            params={{ a1: 3, d: -2, N: 6, gaussRatio: 1 }}
            scale={dummyScale}
            vp={VP}
            fontScale={dummyFontScale}
          />
        </svg>,
      );

      const textContent = container.textContent || "";
      expect(textContent).toContain("代数配对和");
      expect(textContent).toContain(
        "几何面积拼图需各项非负且和为正：本例不适用，代数对称相加恒等式依然成立",
      );
      expect(textContent).toContain("和=-4.0");
      expect(textContent).not.toContain("大长方形面积");
    });

    it("全零场景 (a1=0, d=0)：正确切换为代数配对分支，严禁错误归因为「含负项」", () => {
      const { container } = render(
        <svg>
          <SequenceArithmeticGaussScene
            params={{ a1: 0, d: 0, N: 6, gaussRatio: 1 }}
            scale={dummyScale}
            vp={VP}
            fontScale={dummyFontScale}
          />
        </svg>,
      );

      const textContent = container.textContent || "";
      expect(textContent).toContain("代数配对和");
      expect(textContent).toContain(
        "几何面积拼图需各项非负且和为正：本例不适用，代数对称相加恒等式依然成立",
      );
      // 核心断言：全零时绝不可展示「含负项」
      expect(textContent).not.toContain("含负项");
      expect(textContent).toContain("和=0.0");
      expect(textContent).not.toContain("大长方形面积");
    });
  });

  describe("3. 二阶递推特征方程判别式 Δ < 0 渲染守卫", () => {
    it("当 Δ < 0 时，渲染「降阶等比不适用」警示牌，且图例与场景中屏蔽 bn 节点", () => {
      // x^2 - x + 1 = 0, p=1, q=-1 => delta = p^2 + 4q = 1 - 4 = -3 < 0
      const { container } = render(
        <svg>
          <RecurrenceSecondOrderScene
            params={{ a1: 1, a2: 1, p_rec: 1, q_rec: -1, N: 6 }}
            scale={dummyScale}
            vp={VP}
            fontScale={dummyFontScale}
            highlightN={1}
          />
        </svg>,
      );

      const textContent = container.textContent || "";
      expect(textContent).toContain("降阶等比不适用");
      expect(textContent).not.toContain("构造降阶等比");
    });

    it("当 Δ ≥ 0 时，正常渲染原数列与构造降阶等比图例", () => {
      // x^2 - 3x + 2 = 0, p=3, q=-2 => delta = 9 + 4(-2) = 1 >= 0
      const { container } = render(
        <svg>
          <RecurrenceSecondOrderScene
            params={{ a1: 1, a2: 2, p_rec: 3, q_rec: -2, N: 6 }}
            scale={dummyScale}
            vp={VP}
            fontScale={dummyFontScale}
            highlightN={1}
          />
        </svg>,
      );

      const textContent = container.textContent || "";
      expect(textContent).toContain("原二阶递推数列");
      expect(textContent).toContain("构造降阶等比");
      expect(textContent).not.toContain("降阶等比不适用");
    });
  });
});
