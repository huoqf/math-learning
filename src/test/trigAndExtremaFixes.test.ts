import { describe, it, expect } from "vitest";
import { buildAngleBMarks } from "@/data/registries/triangleExtrema";
import {
  clampAngleBOnAChange,
  applyTriangleParamChange,
} from "@/math/triangleExtrema";
import { paramMeta as trigIdentityMeta } from "@/data/registries/trigIdentity";
import {
  HOMO_VIEWPORT,
  getIdentityViewport,
  DEFAULT_IDENTITY_VIEWPORT,
} from "@/features/trigIdentity/math/trigIdentity";
import { INTERACTIVE_POINT_GEOMETRY } from "@/components/Math";
import {
  calculateWarningCapsuleWidth,
  calculateWarningCapsuleHeight,
  estimateTextWidth,
  FONT_SCALE_MAX,
} from "@/utils";
import { TAN_CAPSULE_SPEC as IDENTITY_TAN_CAPSULE } from "@/features/trigIdentity/components/TrigIdentityScene";
import { TAN_CAPSULE_SPEC as LINES_TAN_CAPSULE } from "@/features/trigLines/components/TrigLinesComparisonScene";
import {
  calcTrigProperties,
  partitionFivePointsByView,
  DEFAULT_TRIG_XRANGE,
} from "@/features/trigTransform/math/trigTransform";
import { CANVAS_PRESETS } from "@/theme";
import { calculateSceneScale } from "@/hooks";

describe("三角函数与解三角形专题核心算法真值验证", () => {
  describe("N7: TriangleExtrema angleA 与 angleB 联动及边界收缩", () => {
    it("真调 clampAngleBOnAChange，在合法几何域 A <= 174 内严格保证 B >= 5 且 C >= 1°", () => {
      const testCases = [
        { angleA: 15, currentB: 165, expected: 160 }, // 声明域上限 160 约束
        { angleA: 90, currentB: 100, expected: 89 },
        { angleA: 120, currentB: 90, expected: 59 },
        { angleA: 150, currentB: 160, expected: 29 }, // UI 声明域上限 150°
        { angleA: 174, currentB: 50, expected: 5 }, // 几何临界 A = 174°，B = 5°，C = 1°
        { angleA: 175, currentB: 50, expected: 5 }, // 超限收敛至声明下限 5°
        { angleA: 60, currentB: undefined, expected: 45 }, // 默认缺省保护
      ];

      for (const { angleA, currentB, expected } of testCases) {
        const resultB = clampAngleBOnAChange(currentB, angleA);
        expect(resultB).toBe(expected);
        expect(resultB).toBeGreaterThanOrEqual(5);
        if (angleA <= 174) {
          const angleC = 180 - angleA - resultB;
          expect(angleC).toBeGreaterThanOrEqual(1);
        }
      }
    });

    it("真调 applyTriangleParamChange 纯函数，验证接入层状态转移与非目标键保真", () => {
      const initialParams = { angleA: 60, angleB: 100, sideA: 6 };
      // 拖拽 angleA 到 120°，angleB 必须联动缩到 59°，sideA 保持不变
      const next1 = applyTriangleParamChange(initialParams, "angleA", 120);
      expect(next1.angleA).toBe(120);
      expect(next1.angleB).toBe(59);
      expect(next1.sideA).toBe(6);

      // 修改无关键 sideA，不得影响 angleB
      const next2 = applyTriangleParamChange(next1, "sideA", 8);
      expect(next2.sideA).toBe(8);
      expect(next2.angleB).toBe(59);
    });

    it("真调 buildAngleBMarks，仅当 90° 可达且 C >= 1° 时呈现直角刻度", () => {
      // 当 angleA <= 88 时，maxB >= 91，90° 处在内点，应有 90° 刻度
      const marks80 = buildAngleBMarks(80);
      expect(marks80.some((m) => m.value === 90)).toBe(true);

      // 当 angleA = 89 时，maxB = 91，maxB - 1 = 90，90° 恰好可达（C = 1°），应有 90° 刻度
      const marks89 = buildAngleBMarks(89);
      expect(marks89.some((m) => m.value === 90)).toBe(true);

      // 当 angleA = 90 时，maxB = 90，maxB - 1 = 89，90° 不可达（否则 C = 0°），不呈现 90° 刻度
      const marks90 = buildAngleBMarks(90);
      expect(marks90.some((m) => m.value === 90)).toBe(false);

      // 当 angleA = 100 时，maxB = 80，90° 彻底超出，不呈现 90° 刻度
      const marks100 = buildAngleBMarks(100);
      expect(marks100.some((m) => m.value === 90)).toBe(false);
    });
  });

  describe("N10: TrigIdentity 齐次模式专属视口完整覆盖声明域与屏幕像素安全", () => {
    it("真调 getIdentityViewport 纯函数，验证子模式与视口绑定的正确性", () => {
      // 齐次模式必须返回 HOMO_VIEWPORT
      const homoVp = getIdentityViewport("identity", "homogeneous");
      expect(homoVp).toBe(HOMO_VIEWPORT);

      // 非齐次同角模式与诱导公式必须返回 DEFAULT_IDENTITY_VIEWPORT
      const defaultVp1 = getIdentityViewport("identity", "geometry");
      expect(defaultVp1).toBe(DEFAULT_IDENTITY_VIEWPORT);

      const defaultVp2 = getIdentityViewport("induction", "standard6");
      expect(defaultVp2).toBe(DEFAULT_IDENTITY_VIEWPORT);
    });

    it("真调 HOMO_VIEWPORT，数学声明域严格被专属视口包容", () => {
      const minA = trigIdentityMeta.homoA.min;
      const maxA = trigIdentityMeta.homoA.max;
      const minB = trigIdentityMeta.homoB.min;
      const maxB = trigIdentityMeta.homoB.max;

      expect(minA).toBe(-3.0);
      expect(maxA).toBe(3.0);
      expect(minB).toBe(-3.0);
      expect(maxB).toBe(3.0);

      expect(minB).toBeGreaterThan(HOMO_VIEWPORT.xRange[0]);
      expect(maxB).toBeLessThan(HOMO_VIEWPORT.xRange[1]);
      expect(minA).toBeGreaterThan(HOMO_VIEWPORT.yRange[0]);
      expect(maxA).toBeLessThan(HOMO_VIEWPORT.yRange[1]);
    });

    it("真调生产 calculateSceneScale 纯函数与 INTERACTIVE_POINT_GEOMETRY，断言极值点 Q(homoB.max, homoA.max) 在标称容器下拥有 >= 15px 顶部留白，字号极端放大时亦绝对不越界", () => {
      const { width: fullW, height: fullH } = CANVAS_PRESETS.full;
      const sceneScale = calculateSceneScale({
        designVisibleW: fullW,
        designVisibleH: fullH,
        designLeft: 0,
        designTop: 0,
        xRange: HOMO_VIEWPORT.xRange,
        yRange: HOMO_VIEWPORT.yRange,
      });

      // 在设计坐标系中，通过生产计算出的 origin 与 scale 映射极值点 Q(homoB.max, homoA.max)
      const maxA = trigIdentityMeta.homoA.max;
      const maxB = trigIdentityMeta.homoB.max;
      const qDesignX = sceneScale.originX + maxB * sceneScale.scaleX;
      const qDesignY = sceneScale.originY - maxA * sceneScale.scaleY;

      // 1. 标称 840×650 容器（fontPx = 11）下：
      // 向上总占用：r(6) + labelDyOffset(8) + capHeight(0.7 * 11) = 21.7px
      const nominalTopSpan = INTERACTIVE_POINT_GEOMETRY.calcTotalTopSpan();
      expect(nominalTopSpan).toBeCloseTo(21.7, 1);

      const nominalLabelTopY = qDesignY - nominalTopSpan;
      // 标称画布下留白为 38.24 - 21.7 = 16.54px >= 15px
      expect(nominalLabelTopY).toBeGreaterThanOrEqual(15);

      // 2. 窗口大幅拉宽/放大使得 fontScale 达到极端上限 16px 时：
      // 向上总占用：6 + 8 + 16 * 0.7 = 25.2px
      const maxFontTopSpan = INTERACTIVE_POINT_GEOMETRY.calcTotalTopSpan(
        INTERACTIVE_POINT_GEOMETRY.defaultR,
        16,
      );
      expect(maxFontTopSpan).toBeCloseTo(25.2, 1);

      const maxLabelTopY = qDesignY - maxFontTopSpan;
      // 断言在极端字号放大下绝对不越界（留白 > 0，且实测 13.04px >= 12px）
      expect(maxLabelTopY).toBeGreaterThan(0);
      expect(maxLabelTopY).toBeGreaterThanOrEqual(12);

      // 3. 断言横向设计坐标距离右边框留出至少 30px 边距
      expect(qDesignX).toBeLessThanOrEqual(fullW - 30);
    });

    it("真调两页导出的胶囊基准与生产排版纯函数，断言标称与极限字号下宽高均不溢出", () => {
      // 极限字号 = fontScale 的钳制上界（useCanvasSize.ts 导出的 FONT_SCALE_MAX），
      // 容器再大字号也不会超过它。
      const EXTREME_FONT_PX = FONT_SCALE_MAX;

      // 两页文案必须各自独立（防止复制粘贴时把 A 页文案塞进 B 页）
      expect(LINES_TAN_CAPSULE.text).not.toBe(IDENTITY_TAN_CAPSULE.text);

      for (const spec of [LINES_TAN_CAPSULE, IDENTITY_TAN_CAPSULE]) {
        // 文案 / 基准字号 / 最小底框宽全部取自生产 Scene 导出的同一对象
        for (const fontPx of [spec.baseFontPx, EXTREME_FONT_PX]) {
          const textWidth = estimateTextWidth(spec.text, fontPx);
          const capsuleW = calculateWarningCapsuleWidth(
            spec.text,
            fontPx,
            spec.minWidth,
          );
          const capsuleH = calculateWarningCapsuleHeight(fontPx);

          // 宽度必须盖住文本并至少预留 20px 内边距，且不窄于声明的最小底框
          expect(capsuleW).toBeGreaterThan(textWidth + 20);
          expect(capsuleW).toBeGreaterThanOrEqual(spec.minWidth);
          // 高度必须容纳单行文字（字号 + 上下各 3px 以上余量）
          expect(capsuleH).toBeGreaterThanOrEqual(fontPx + 6);
        }
      }
    });
  });

  describe("N11: TrigTransform 五点作图一体化划分纯函数同源真值验证", () => {
    it("真调 DEFAULT_TRIG_XRANGE、calcTrigProperties 与 partitionFivePointsByView，断言绝对同源互斥", () => {
      // 复现真实反例：φ = π/3, ω = 0.5 时，周期放大导致第 5 点 x ≈ 10.472 > DEFAULT_TRIG_XRANGE[1]
      const data = calcTrigProperties(1, 0.5, Math.PI / 3, 0, [
        DEFAULT_TRIG_XRANGE[0],
        DEFAULT_TRIG_XRANGE[1],
      ]);
      const { fivePoints } = data;

      expect(fivePoints).toHaveLength(5);
      expect(fivePoints[4].x).toBeGreaterThan(DEFAULT_TRIG_XRANGE[1]);

      // 真调与生产组件 100% 共享的 partitionFivePointsByView 和 DEFAULT_TRIG_XRANGE
      const { visiblePoints, outCount } = partitionFivePointsByView(
        fivePoints,
        DEFAULT_TRIG_XRANGE[0],
        DEFAULT_TRIG_XRANGE[1],
      );

      // 验证超界准确计数为 1，可见手柄准确为 4，两者之和恒等于总数 5
      expect(outCount).toBe(1);
      expect(visiblePoints).toHaveLength(4);
      expect(visiblePoints.length + outCount).toBe(fivePoints.length);

      // 验证出界的正是 P5 (index: 4)
      expect(visiblePoints.some((pt) => pt.index === fivePoints[4].index)).toBe(
        false,
      );
    });
  });
});
