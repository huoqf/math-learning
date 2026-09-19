/**
 * src/test/layoutMetrics.test.ts
 * 排版度量纯函数的**标定护栏**：断言 `estimateTextWidth`（`src/utils/layout.ts`）
 * 对**全部 ASCII 可打印字符**都不低于字体实测宽度 —— 即结构性"永不欠估"。
 *
 * 为什么需要这一层：旧版用单一经验系数 0.55em 估 ASCII，而实测 ASCII 宽度跨
 * **0.271em（`,`）～ 1.005em（`W`）**，跨度 3.7 倍 ⇒ 单一系数必然一端欠估。
 * 一旦文案改成多宽体字母（如连续 `W`/`M`），胶囊底框就会真溢出，而当时的
 * 纯函数测试（断言 `capsuleW > estimateTextWidth(...) + 20`）**全部照绿**——
 * 因为它们两侧用的是同一个失真的估算值。
 *
 * 基准数据 `ASCII_EM_MEASURED` 是**独立于被测代码的外部事实源**：
 * 由字体文件直接实测（Segoe UI Bold 400px 逐字符 advance ÷ 400），**未经取整**，
 * 不是生产表 `ASCII_EM_TABLE` 的拷贝，因此"估算 ≥ 实测"是真断言而非自证。
 */

import { describe, it, expect } from "vitest";
import {
  estimateTextWidth,
  calculateWarningCapsuleWidth,
  FONT_SCALE_MAX,
} from "@/utils";
import { estimateLabelTextWidth } from "@/utils/labelOverlap";
import { TAN_CAPSULE_SPEC as IDENTITY_TAN_CAPSULE } from "@/features/trigIdentity/components/TrigIdentityScene";
import { TAN_CAPSULE_SPEC as LINES_TAN_CAPSULE } from "@/features/trigLines/components/TrigLinesComparisonScene";

/** 探测字号：放大后结果按比例缩放，取值对结论无影响 */
const PROBE_FONT_PX = 100;

/**
 * 字体实测宽度（单位 em = px ÷ 字号），索引 = 码位 − 0x20，覆盖 ASCII 0x20–0x7E。
 * 来源：`C:\Windows\Fonts\segoeuib.ttf`（Segoe UI Bold），400px 逐字符 advance ÷ 400。
 * 胶囊文本 `fontWeight="bold"` 且 `font-family` 走 `system-ui` 链，Windows 实渲染即该字体。
 */
const ASCII_EM_MEASURED: readonly number[] = [
  0.2759, 0.3271, 0.4932, 0.5923, 0.5752, 0.8672, 0.8496, 0.293, 0.3691, 0.3691,
  0.4551, 0.707, 0.271, 0.4043, 0.271, 0.4434, 0.5752, 0.5752, 0.5752, 0.5752,
  0.5752, 0.5752, 0.5752, 0.5752, 0.5752, 0.5752, 0.271, 0.271, 0.707, 0.707,
  0.707, 0.438, 0.9541, 0.7031, 0.6411, 0.624, 0.7373, 0.5322, 0.52, 0.7109,
  0.7661, 0.3169, 0.4453, 0.6489, 0.5112, 0.957, 0.79, 0.7583, 0.6143, 0.7583,
  0.6529, 0.5605, 0.5859, 0.7232, 0.667, 1.0049, 0.6553, 0.607, 0.607, 0.3691,
  0.4361, 0.3691, 0.707, 0.415, 0.314, 0.5381, 0.6201, 0.48, 0.6191, 0.541,
  0.3833, 0.6191, 0.6021, 0.2842, 0.2842, 0.5591, 0.2842, 0.916, 0.605, 0.6113,
  0.6201, 0.6191, 0.398, 0.44, 0.3892, 0.605, 0.542, 0.7974, 0.5523, 0.5381,
  0.479, 0.3691, 0.3262, 0.3691, 0.707,
];

/**
 * 非 ASCII 实测：汉字/全角标点恰为 1.000（全角等宽，与字号无关）。
 * 生产实现对其余非 ASCII 统一取 1.0em（希腊字母实测约 0.6，属有意的保守超估）。
 */
const CJK_EM_MEASURED = 1.0;

/** 按**实测**表累加一行文本的物理宽度（em） */
function measuredEm(text: string): number {
  let em = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    em +=
      code >= 0x20 && code <= 0x7e
        ? ASCII_EM_MEASURED[code - 0x20]
        : CJK_EM_MEASURED;
  }
  return em;
}

describe("排版度量标定：estimateTextWidth 对任意 ASCII 均不欠估", () => {
  it("逐字符：估算 ≥ 实测，欠估字符数为 0", () => {
    const underestimated: {
      ch: string;
      measured: number;
      estimated: number;
    }[] = [];
    for (let i = 0; i < ASCII_EM_MEASURED.length; i++) {
      const ch = String.fromCharCode(0x20 + i);
      const measured = ASCII_EM_MEASURED[i] * PROBE_FONT_PX;
      const estimated = estimateTextWidth(ch, PROBE_FONT_PX);
      if (estimated < measured) {
        underestimated.push({ ch, measured, estimated });
      }
    }
    expect(ASCII_EM_MEASURED).toHaveLength(0x7f - 0x20);
    expect(underestimated).toEqual([]);
  });

  it("回归对照：旧的单一 0.55em 模型在宽体串上必然欠估（证明该护栏有守护力）", () => {
    const wide = "WWWWWWWW";
    const measured = measuredEm(wide) * FONT_SCALE_MAX;
    const legacyModel = [...wide].length * 0.55 * FONT_SCALE_MAX;

    // 旧模型：8 个 W 估 70.4px，实测需 80.4px ⇒ 底框真溢出
    expect(legacyModel).toBeLessThan(measured);
    // 现模型：不小于实测 ⇒ 不欠估
    expect(estimateTextWidth(wide, FONT_SCALE_MAX)).toBeGreaterThanOrEqual(
      measured,
    );
  });

  it("真实文案：底框必须盖过**实测**文本宽度（而非盖过估算值）+ 16px 内边距", () => {
    for (const spec of [IDENTITY_TAN_CAPSULE, LINES_TAN_CAPSULE]) {
      for (const fontPx of [spec.baseFontPx, FONT_SCALE_MAX]) {
        const measuredPx = measuredEm(spec.text) * fontPx;
        const capsuleW = calculateWarningCapsuleWidth(
          spec.text,
          fontPx,
          spec.minWidth,
        );
        expect(capsuleW).toBeGreaterThan(measuredPx);
        expect(capsuleW).toBeGreaterThan(measuredPx + 16);
      }
    }
  });

  it("量级合理：逼近真实而非盲目放大（典型串超估 < 20%）", () => {
    const samples = [
      "T(1, tan x)",
      "|tan α|",
      "abcdefghij",
      "ABCDEFGHIJ",
      "0123456789",
      "{}[]()<>",
      "Hello World!",
      "WwMm@%&",
    ];
    for (const s of samples) {
      const measured = measuredEm(s) * PROBE_FONT_PX;
      const estimated = estimateTextWidth(s, PROBE_FONT_PX);
      expect(estimated).toBeGreaterThanOrEqual(measured);
      expect(estimated).toBeLessThan(measured * 1.2);
    }
  });

  it("两套模型不互相遮蔽：labelOverlap 的标签宽度模型与胶囊模型都可独立取到", () => {
    const probe = "abcdefghij";
    // 避让模型（0.62em + 4px 包围盒余量）比实测表模型更保守
    expect(estimateLabelTextWidth(probe, 11)).toBeGreaterThan(
      estimateTextWidth(probe, 11),
    );
    // 且二者的默认字号语义不同：缺失字号时避让模型不得退化为 0
    expect(estimateLabelTextWidth(probe)).toBeGreaterThan(0);
  });

  it("字号钳制常量同源：FONT_SCALE_MAX 覆盖两页胶囊基准字号的放大上界", () => {
    for (const spec of [IDENTITY_TAN_CAPSULE, LINES_TAN_CAPSULE]) {
      expect(FONT_SCALE_MAX).toBeGreaterThan(spec.baseFontPx);
    }
  });
});
