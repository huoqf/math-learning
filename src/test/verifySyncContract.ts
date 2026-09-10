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
  // 5. 跨模式隔离性核验：防止右屏显示不相干内容
  expectedTheoremsKeywords?: string[]; // 必须包含的专属定理关键字
  forbiddenTheoremKeywords?: string[]; // 严禁出现的跨模式不相干定理关键字
  forbiddenGaokaoKeywords?: string[]; // 严禁出现的跨模式不相干考点关键字
  expectedWarningCount?: number; // 临界预警数量断言
  // 6. 参数摄动防假推导核验：断言当参数扰动时，关键特征量动态响应改变
  perturbation?: {
    params: TParams;
    dynamicQuantityLabels: string[];
  };
}

/**
 * 容错提取 quantities 中的数值（支持百分比、带符号字符串、等号表达式或代数标注）
 */
function parseQuantityNumericValue(val: unknown): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    // 优先截取等号右侧的内容（如 "a_{8} = -4.00" => "-4.00"）
    const candidate = val.includes("=") ? val.split("=").pop()! : val;
    // 匹配第一个有效浮点数
    const match = candidate.match(/[+-]?\d+(?:\.\d+)?/);
    if (match) return parseFloat(match[0]);
  }
  return NaN;
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
      perturbation,
    } = tc;
    const mathData = buildMathQuantities(animId, params, modeOptions);

    // 0. 契约非空门禁：全课型严禁提供空的 groundTruth 假契约，必须至少对账一个核心数学特征量
    expect(
      Object.keys(groundTruth).length,
      `[${name}] 契约测试严禁提供空的 groundTruth，必须至少对账一个核心数学特征量`,
    ).toBeGreaterThan(0);

    // 1. 验证数学特征量 (Quantities) 是否与真实解算严格同步
    Object.entries(groundTruth).forEach(([label, expectedVal]) => {
      const q = mathData.quantities.find((item) => item.label.includes(label));
      expect(
        q,
        `[${name}] 未在右屏 quantities 中找到特征量: ${label}`,
      ).toBeDefined();

      const parsedNum = parseQuantityNumericValue(q!.value);
      expect(
        Number.isNaN(parsedNum),
        `[${name}] 特征量 [${label}] 的值无法解析为有效数值: "${q!.value}"`,
      ).toBe(false);

      expect(
        parsedNum,
        `[${name}] 特征量 [${label}] 数值偏差过大: 期望 ${expectedVal}，实际 ${q!.value}`,
      ).toBeCloseTo(expectedVal, 3);
    });

    // 1.1 参数摄动防伪推导测试：确保参数变化时特征量产生动态联动
    if (perturbation) {
      const perturbedData = buildMathQuantities(
        animId,
        perturbation.params,
        modeOptions,
      );
      perturbation.dynamicQuantityLabels.forEach((label) => {
        const baseQ = mathData.quantities.find((item) =>
          item.label.includes(label),
        );
        const pertQ = perturbedData.quantities.find((item) =>
          item.label.includes(label),
        );
        expect(baseQ, `[${name}] 摄动基准未找到 [${label}]`).toBeDefined();
        expect(pertQ, `[${name}] 摄动后未找到 [${label}]`).toBeDefined();

        const baseVal = parseQuantityNumericValue(baseQ!.value);
        const pertVal = parseQuantityNumericValue(pertQ!.value);
        expect(
          Math.abs(baseVal - pertVal),
          `[${name}] 特征量 [${label}] 在参数改变后未产生数值联动响应 (base: ${baseVal}, perturbed: ${pertVal})，存在死数据假推导风险！`,
        ).toBeGreaterThan(1e-4);
      });
    }

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

    // 5. 跨模式隔离与右屏防污染核验 (防止出现不相干内容)
    if (tc.expectedTheoremsKeywords) {
      tc.expectedTheoremsKeywords.forEach((kw) => {
        const hasKw = mathData.theorems.some((t) => t.name.includes(kw));
        expect(hasKw, `[${name}] 右屏应当包含专属定理关键字: [${kw}]`).toBe(
          true,
        );
      });
    }

    if (tc.forbiddenTheoremKeywords) {
      tc.forbiddenTheoremKeywords.forEach((kw) => {
        const leaked = mathData.theorems.filter((t) => t.name.includes(kw));
        expect(
          leaked.length,
          `[${name}] 右屏发生跨模式定理污染，检测到不相干定理: ${leaked.map((t) => t.name).join(", ")}`,
        ).toBe(0);
      });
    }

    if (tc.forbiddenGaokaoKeywords) {
      tc.forbiddenGaokaoKeywords.forEach((kw) => {
        const leaked = mathData.gaokaoPoints?.filter((gp) =>
          gp.text.includes(kw),
        );
        expect(
          leaked?.length || 0,
          `[${name}] 右屏发生跨模式考点污染，检测到不相干考点: ${kw}`,
        ).toBe(0);
      });
    }

    if (tc.expectedWarningCount !== undefined) {
      expect(
        mathData.warnings.length,
        `[${name}] 预警数量不符合预期: 期望 ${tc.expectedWarningCount}，实际 ${mathData.warnings.length}`,
      ).toBe(tc.expectedWarningCount);
    }
  });
}
