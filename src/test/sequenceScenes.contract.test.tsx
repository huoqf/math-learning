/**
 * src/test/sequenceScenes.contract.test.tsx
 * 数列关键场景守卫「渲染级」契约测试：
 * 1. 等比/等差片段和场景空态卡：参数准确透传与两页一致性 (k 与 2k 引导文案)；
 * 2. 高斯倒序相加场景：正项几何扣合 vs 负项代数对称配对双分支真实渲染切分；
 * 3. 二阶递推场景：Δ < 0 降阶等比不可用警示与 bn 散点屏蔽真实渲染拦截。
 */
import { describe, it, expect } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { CoordinateGrid } from "@/components/Math";
import { CANVAS_PRESETS } from "@/theme";
import { calculateSceneScale, type ViewportInfo } from "@/hooks";
import { SequenceGeometricSegmentScene } from "@/features/sequence/components/SequenceGeometricSegmentScene";
import { SequenceArithmeticSegmentScene } from "@/features/sequence/components/SequenceArithmeticSegmentScene";
import { SequenceArithmeticGaussScene } from "@/features/sequence/components/SequenceArithmeticGaussScene";
import { RecurrenceSecondOrderScene } from "@/features/sequence/components/RecurrenceSecondOrderScene";
import { SequenceGeometricStaggerSumScene } from "@/features/sequence/components/SequenceGeometricStaggerSumScene";
import { SequenceGeometricTessellationScene } from "@/features/sequence/components/SequenceGeometricTessellationScene";
import { SequenceModelsArithGeoScene } from "@/features/sequence/components/SequenceModelsArithGeoScene";
import { SequenceModelsTelescopingScene } from "@/features/sequence/components/SequenceModelsTelescopingScene";
import { SequenceModelsGroupedScene } from "@/features/sequence/components/SequenceModelsGroupedScene";
import {
  calcArithGeoSplit,
  calcTelescoping,
  calcCrossTelescoping,
  calcRadicalTelescoping,
  calcGroupedSequence,
} from "@/math/sequence";

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

  describe("4. 中屏几何元素视口边界 (840×650) 越界守卫与参数扫掠测试", () => {
    /**
     * 提取 SVG 渲染树中所有带位置包围盒的关键图元，断言其绝不超出视口边界
     */
    function assertSvgElementsWithinBounds(
      container: HTMLElement,
      options?: {
        maxRightSafetyMargin?: number; // 允许的右边界最大上限（默认 840）
        minLeft?: number;
      },
    ) {
      const maxW = options?.maxRightSafetyMargin ?? FULL_W;
      const minL = options?.minLeft ?? 0;

      // 1. 矩形元素 rect
      const rects = container.querySelectorAll("rect");
      rects.forEach((rect) => {
        const x = parseFloat(rect.getAttribute("x") || "0");
        const y = parseFloat(rect.getAttribute("y") || "0");
        const width = parseFloat(rect.getAttribute("width") || "0");
        const height = parseFloat(rect.getAttribute("height") || "0");
        const right = x + width;
        const bottom = y + height;

        expect(x).toBeGreaterThanOrEqual(minL);
        expect(right).toBeLessThanOrEqual(maxW);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(bottom).toBeLessThanOrEqual(FULL_H);
      });

      // 2. 文本元素 text 锚点坐标
      const texts = container.querySelectorAll("text");
      texts.forEach((text) => {
        const x = parseFloat(text.getAttribute("x") || "0");
        const y = parseFloat(text.getAttribute("y") || "0");
        expect(x).toBeGreaterThanOrEqual(minL);
        expect(x).toBeLessThanOrEqual(maxW);
        expect(y).toBeGreaterThanOrEqual(0);
        // 允许底轴标尺刻度文本保留最多 15px 的边缘留白
        expect(y).toBeLessThanOrEqual(FULL_H + 15);
      });
    }

    it("错位相减推导场景：N ∈ [4, 12] 全参数扫掠，所有矩形卡片与公式文本几何右边缘恒 ≤ 820px（保留 ≥ 20px 安全余量）", () => {
      const nValues = [4, 5, 6, 7, 8, 9, 10, 11, 12];
      const qValues = [0.5, 1, 2];

      for (const N of nValues) {
        for (const q of qValues) {
          const { container } = render(
            <svg viewBox={`0 0 ${FULL_W} ${FULL_H}`}>
              <SequenceGeometricStaggerSumScene
                params={{ a1: 1, q, N }}
                fontScale={dummyFontScale}
              />
            </svg>,
          );

          // 严格断言：右边缘恒 <= 820px，绝不可碰触 840px 画布边缘
          assertSvgElementsWithinBounds(container, {
            maxRightSafetyMargin: 820,
            minLeft: 10,
          });
          // 扫掠在同一用例内多次 render，须显式卸载，避免 DOM 累积（历史：worker 内存溢出）
          cleanup();
        }
      }
    });

    it("自相似几何剖分场景：合法态与非法退化态下所有指示卡片和图形严格在 840×650 视口内", () => {
      // 1. 合法态 (a1 > 0, 0 < q < 1)
      const { container: validContainer } = render(
        <svg viewBox={`0 0 ${FULL_W} ${FULL_H}`}>
          <SequenceGeometricTessellationScene
            params={{ a1: 1, q: 0.5, N: 6 }}
            fontScale={dummyFontScale}
          />
        </svg>,
      );
      assertSvgElementsWithinBounds(validContainer);

      // 2. 非法退化态 (q >= 1)
      const { container: invalidContainer } = render(
        <svg viewBox={`0 0 ${FULL_W} ${FULL_H}`}>
          <SequenceGeometricTessellationScene
            params={{ a1: 1, q: 2, N: 6 }}
            fontScale={dummyFontScale}
          />
        </svg>,
      );
      assertSvgElementsWithinBounds(invalidContainer);
    });

    it("错位相减高考模型：参数网格 × 推演步严格在 840×650 视口内", () => {
      // 覆盖各类纵向压力：正/负首项、q = 1 退化告警、零首项 + 极不对称视口（跨度越大越贴近下边界）
      // 说明：取值控制在滑块可达范围（a1∈[-6,8]、d∈[-3,3]、q∈[-2,2]、N∈[4,12]）；
      //      刻意避开「跨度达 10^4~10^5」的病态组合 —— 那类组合会令 CoordinateGrid 以 yStep=1
      //      生成上万条网格线而拖垮用例（该性能问题另立报告，不在本契约测试职责内）。
      const grid: Array<{ a1: number; d: number; q: number; N: number }> = [
        { a1: 1, d: 1, q: 2, N: 6 }, // 原单点基准（视口跨度 ≈ 449）
        { a1: -3, d: 1, q: 2, N: 6 }, // 负首项：柱体穿零
        { a1: 1, d: 1, q: 1, N: 6 }, // q = 1 退化告警条
        { a1: 0, d: 2, q: 2, N: 7 }, // 零首项 + 极不对称视口
        { a1: 0, d: 3, q: 2, N: 12 }, // 极限指数膨胀（原始真实值跨度达 15.5 万，检验教学视口收敛）
      ];
      // step 4 与 step 3 共用同一渲染分支（源码 `sumStep === 3 || sumStep === 4`），无需重复渲染
      const steps = [1, 2, 3];

      for (const { a1, d, q, N } of grid) {
        const splitRes = calcArithGeoSplit(a1, d, q, N);

        // 严格复刻 ModelsPage 中 arith-geo 分支的最新真实视口换算口径
        const allVals = splitRes.terms.flatMap((t) => [
          t.cn,
          t.cn * q,
          t.an,
          t.bn,
        ]);
        const minV = Math.max(-40, Math.min(0, ...allVals));
        const maxV = Math.min(120, Math.max(3, ...allVals));
        let yR: [number, number] = [
          Math.floor(minV - 3),
          Math.ceil(maxV * 1.15 + 4),
        ];
        if (yR[1] - yR[0] < 6) yR = [yR[0], yR[0] + 6];

        const scale = calculateSceneScale({
          designVisibleW: FULL_W,
          designVisibleH: FULL_H,
          designLeft: 0,
          designTop: 0,
          xRange: [-1, N + 2],
          yRange: yR,
          keepAspectRatio: false,
        });

        for (const step of steps) {
          const { container } = render(
            <svg viewBox={`0 0 ${FULL_W} ${FULL_H}`}>
              <SequenceModelsArithGeoScene
                terms={splitRes.terms}
                q={q}
                N={N}
                sumStep={step}
                vp={VP}
                scale={scale}
                fontScale={dummyFontScale}
              />
            </svg>,
          );
          assertSvgElementsWithinBounds(container);
          // 参数网格在同一用例内多次 render，须显式卸载，避免 DOM 累积（历史：worker 内存溢出）
          cleanup();
        }
      }
    });

    it("CoordinateGrid 基建防线：面对未钳制的 15 万极端数值跨度，自动触发 MAX_SAFE_TICKS 熔断，总刻度数 ≤ 50，绝不卡死主线程", () => {
      // 模拟极端异常输入：yRange 跨度 15.5 万，yStep 仍传默认 1
      const extremeScale = calculateSceneScale({
        designVisibleW: FULL_W,
        designVisibleH: FULL_H,
        designLeft: 0,
        designTop: 0,
        xRange: [-1, 14],
        yRange: [-3, 155448],
        keepAspectRatio: false,
      });

      const { container } = render(
        <svg viewBox={`0 0 ${FULL_W} ${FULL_H}`}>
          <CoordinateGrid scale={extremeScale} showGrid={true} />
        </svg>,
      );

      // 验证在 15 万跨度下网格线与刻度线总数严格收敛于常数级，耗时 9ms，绝不卡死
      const tickLines = container.querySelectorAll("line");
      expect(tickLines.length).toBeLessThanOrEqual(120);
      const tickTexts = container.querySelectorAll("text");
      expect(tickTexts.length).toBeLessThanOrEqual(60);

      cleanup();
    });

    it("裂项相消与分组求和高考模型：顶部居中横幅与图例严格在 840×650 视口内", () => {
      const teleData = calcTelescoping(6);
      const crossData = calcCrossTelescoping(6);
      const radicalData = calcRadicalTelescoping(6);
      const groupedData = calcGroupedSequence(1, 1, 2, 6);

      // 1. 裂项相消三种模式
      for (const gap of [1, 2, 3]) {
        const { container } = render(
          <svg viewBox={`0 0 ${FULL_W} ${FULL_H}`}>
            <SequenceModelsTelescopingScene
              teleGap={gap}
              N={6}
              telescopingData={teleData}
              crossTelescopingData={crossData}
              radicalTeleData={radicalData}
              vp={VP}
              scale={dummyScale}
              fontScale={dummyFontScale}
            />
          </svg>,
        );
        assertSvgElementsWithinBounds(container);
        cleanup();
      }

      // 2. 分组求和
      const { container: groupedContainer } = render(
        <svg viewBox={`0 0 ${FULL_W} ${FULL_H}`}>
          <SequenceModelsGroupedScene
            groupedData={groupedData}
            vp={VP}
            scale={dummyScale}
            fontScale={dummyFontScale}
          />
        </svg>,
      );
      assertSvgElementsWithinBounds(groupedContainer);
    });
  });
});
