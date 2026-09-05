import { expect } from "vitest";
import { buildMathQuantities } from "@/data/mathQuantities";

export interface SyncContractTestCase<
  TParams extends Record<string, number> = Record<string, number>,
> {
  name: string;
  animId: string;
  modeOptions?: Record<string, unknown>; // 子模式，如 { modelType: 'corner' }
  params: TParams;
  // 1. 真实解算对照：用于断言 quantities 是否算准
  groundTruth: Record<string, number>;
  // 2. 课型断言，默认高考大题课
  lessonType?: "concept" | "gaokao_topic";
  // 3. 高考专题特定核验项 (仅 gaokao_topic 生效)
  expectedExamAnchor?: string; // 必须包含的母题名称关键字
  expectedMnemonic?: string; // 必须包含的口诀片段
  expectedReasoningSymbols?: string[]; // 3步推演链中必须出现的关键符号 (如 ['d^2', 'R'])
  expectedInvariants?: string[]; // 必须标记为 isInvariant: true 的几何不变量
  // 4. 特征量存在性检查 (如检查是否存在某些复杂量标签)
  expectedQuantityLabels?: string[];
}

/**
 * 全学科通用的三屏一致性自动化契约核验函数
 */
export function verifyTopicSyncContract<
  TParams extends Record<string, number> = Record<string, number>,
>(testCases: SyncContractTestCase<TParams>[]) {
  testCases.forEach((tc) => {
    const {
      name,
      animId,
      params,
      modeOptions,
      groundTruth,
      lessonType = "gaokao_topic",
    } = tc;
    const mathData = buildMathQuantities(animId, params, modeOptions);

    // 1. 验证数学特征量 (Quantities) 是否与真实解算严格同步
    Object.entries(groundTruth).forEach(([label, expectedVal]) => {
      const q = mathData.quantities.find((item) => item.label.includes(label));
      expect(
        q,
        `[${name}] 未在右屏 quantities 中找到特征量: ${label}`,
      ).toBeDefined();
      expect(
        Number(q!.value),
        `[${name}] 特征量 [${label}] 数值偏差过大: 期望 ${expectedVal}，实际 ${q!.value}`,
      ).toBeCloseTo(expectedVal, 4);
    });

    // 2. 检查特定特征量标签存在性
    if (tc.expectedQuantityLabels) {
      tc.expectedQuantityLabels.forEach((label) => {
        const exists = mathData.quantities.some((q) => q.label.includes(label));
        expect(exists, `[${name}] quantities 应当包含量: ${label}`).toBe(true);
      });
    }

    // 3. 若为高考专题课，执行严格的大题推演链规范核验
    if (lessonType === "gaokao_topic") {
      // 必须有母题定位与口诀心法
      if (tc.expectedExamAnchor) {
        expect(
          mathData.examAnchor,
          `[${name}] 缺少母题定位或不匹配: ${tc.expectedExamAnchor}`,
        ).toContain(tc.expectedExamAnchor);
      }
      if (tc.expectedMnemonic) {
        expect(
          mathData.mnemonic,
          `[${name}] 缺少记忆口诀或不匹配: ${tc.expectedMnemonic}`,
        ).toContain(tc.expectedMnemonic);
      }

      // 必须严格是标准高考 3 步推演链 (破题 -> 转化消元 -> 求解目标)
      expect(
        mathData.reasoningSteps,
        `[${name}] 高考专题课必须提供 reasoningSteps 推演链`,
      ).toBeDefined();
      expect(
        mathData.reasoningSteps?.length,
        `[${name}] 高考破题推演链必须正好为 3 步`,
      ).toBe(3);

      // 验证推演链中是否代入了当前的核心符号
      if (tc.expectedReasoningSymbols) {
        const fullReasoningContent =
          mathData.reasoningSteps
            ?.map((s) => `${s.title} ${s.detail || ""} ${s.latex}`)
            .join(" ") || "";
        tc.expectedReasoningSymbols.forEach((sym) => {
          expect(
            fullReasoningContent,
            `[${name}] 推演链中未正确代入核心代数代号: ${sym}`,
          ).toContain(sym);
        });
      }
    }

    // 4. 验证定值不变量标记
    if (tc.expectedInvariants) {
      tc.expectedInvariants.forEach((invLabel) => {
        const inv = mathData.quantities.find((q) => q.label.includes(invLabel));
        expect(
          inv?.isInvariant,
          `[${name}] 特征量 [${invLabel}] 应标记为🌟定值不变量 (isInvariant: true)`,
        ).toBe(true);
      });
    }
  });
}
