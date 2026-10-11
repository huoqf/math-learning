import { describe, it, expect } from "vitest";
import { buildMathQuantities } from "@/data/mathQuantities";
import type { ParamMeta } from "@/data/types";

// 批量引入重点学科专题的参数元数据与默认配置
import {
  defaultParams as quadDefaults,
  paramMeta as quadMeta,
} from "@/data/registries/quadratic";
import {
  defaultParams as derivDefaults,
  paramMeta as derivMeta,
} from "@/data/registries/derivative";
import {
  defaultParams as conicLineDefaults,
  paramMeta as conicLineMeta,
} from "@/data/registries/conicLine";
import {
  defaultParams as seqDefaults,
  paramMeta as seqMeta,
} from "@/data/registries/sequence";
import {
  defaultParams as nikeDefaults,
  paramMeta as nikeMeta,
} from "@/data/registries/nike";
import {
  defaultParams as probCountingDefaults,
  paramMeta as probCountingMeta,
} from "@/data/registries/probabilityCounting";
import {
  defaultParams as probBayesDefaults,
  paramMeta as probBayesMeta,
} from "@/data/registries/probabilityBayes";
import {
  defaultParams as triangleSolveDefaults,
  paramMeta as triangleSolveMeta,
} from "@/data/registries/triangleSolve";
import {
  defaultParams as vectorDotDefaults,
  paramMeta as vectorDotMeta,
} from "@/data/registries/vectorDotProduct";
import {
  defaultParams as lineCircleDefaults,
  paramMeta as lineCircleMeta,
} from "@/data/registries/lineCircle";
import {
  defaultParams as solidDefaults,
  solidAxiomsMeta,
  polyhedronFeaturesMeta,
} from "@/data/registries/solidGeometry";

/**
 * 立体几何 registry 的元数据以数组形式导出（同一文件承载十余个页面的 meta），
 * 这里做一次本地适配：数组 → 以 key 为索引的表，与其他专题的 paramMeta 形状对齐。
 */
const toMetaRecord = (list: ParamMeta[]): Record<string, ParamMeta> =>
  Object.fromEntries(list.map((m) => [m.key, m]));

/**
 * 单构型巡检参数。
 *
 * 多模式页面（如空间公理页的 平面确定/平面相交/等角定理）如果只测默认构型，
 * 其余模式就仍是"零巡检"——与"四道门禁全绿、页面仍有问题"是同一个病根。
 * 因此这里允许一个 animId 展开成多个构型，逐构型跑完整套边界 + 动态响应断言。
 */
interface FuzzVariant {
  /** 构型说明，会拼进用例名，便于失败时定位到具体模式 */
  label: string;
  config?: Record<string, unknown>;
  /** 该构型的核心主控参数键名（不同构型主控参数可能不同，故按构型指定） */
  primaryKey?: string;
}

interface TopicFuzzTarget {
  animId: string;
  topicName: string;
  defaultParams: Record<string, number>;
  paramMeta: Record<string, ParamMeta>;
  /** 单构型页面的写法（与 variants 二选一） */
  config?: Record<string, unknown>;
  primaryKey?: string; // 核心主控参数键名，用于做摄动动态响应检查
  /** 多构型页面：逐构型展开；提供后 config/primaryKey 被忽略 */
  variants?: FuzzVariant[];
}

const fuzzTargets: TopicFuzzTarget[] = [
  {
    animId: "anim-quadratic",
    topicName: "二次函数与方程不等式",
    defaultParams: quadDefaults,
    paramMeta: quadMeta,
    primaryKey: "a",
  },
  {
    animId: "anim-derivative-tangent",
    topicName: "导数与切线方程",
    defaultParams: derivDefaults,
    paramMeta: derivMeta,
    primaryKey: "x0",
  },
  {
    animId: "anim-conic-line",
    topicName: "直线与圆锥曲线联立模型",
    defaultParams: conicLineDefaults,
    paramMeta: conicLineMeta,
    config: { conicType: "ellipse", studyMode: "general" },
    primaryKey: "k",
  },
  {
    animId: "anim-sequence",
    topicName: "等差与等比数列通项求和",
    defaultParams: seqDefaults as unknown as Record<string, number>,
    paramMeta: seqMeta,
    config: { activeMode: "arithmetic", arithmeticSubMode: "linear" },
    primaryKey: "d",
  },
  {
    animId: "anim-nike",
    topicName: "对勾函数与双曲极值",
    defaultParams: nikeDefaults,
    paramMeta: nikeMeta,
    primaryKey: "a",
  },
  {
    animId: "anim-probability-counting",
    topicName: "计数原理与排列组合",
    defaultParams: probCountingDefaults,
    paramMeta: probCountingMeta,
    primaryKey: "n",
  },
  {
    animId: "anim-probability-bayes",
    topicName: "条件概率与贝叶斯全概",
    defaultParams: probBayesDefaults,
    paramMeta: probBayesMeta,
    config: { diseaseType: "rare" },
    primaryKey: "prior",
  },
  {
    animId: "anim-triangle-solve",
    topicName: "解三角形正余弦定理",
    defaultParams: triangleSolveDefaults,
    paramMeta: triangleSolveMeta,
    config: { studyMode: "ssa" },
    primaryKey: "a",
  },
  {
    animId: "anim-vector-dot-product",
    topicName: "平面向量数量积与投影",
    defaultParams: vectorDotDefaults,
    paramMeta: vectorDotMeta,
    primaryKey: "thetaDeg",
  },
  {
    animId: "anim-line-circle",
    topicName: "直线与圆的位置关系",
    defaultParams: lineCircleDefaults,
    paramMeta: lineCircleMeta,
    primaryKey: "d",
  },
  {
    animId: "anim-solid-axioms",
    topicName: "空间公理与基本事实",
    defaultParams: solidDefaults.solidAxioms,
    paramMeta: toMetaRecord(solidAxiomsMeta),
    variants: [
      {
        label: "平面确定 · 三点",
        config: { mode: "determination", subType: "threePoints" },
        primaryKey: "tParam",
      },
      {
        label: "平面确定 · 直线与线外一点",
        config: { mode: "determination", subType: "lineAndPoint" },
        primaryKey: "tParam",
      },
      {
        label: "平面确定 · 两条相交直线",
        config: { mode: "determination", subType: "intersectingLines" },
        primaryKey: "tParam",
      },
      {
        label: "平面相交 · 基本事实 3",
        config: { mode: "intersection", subType: "parallelLines" },
        primaryKey: "tiltDeg",
      },
      {
        label: "等角定理 · 同向等角",
        config: { mode: "spatialLines", subType: "threePoints" },
        primaryKey: "angleParamDeg",
      },
      {
        label: "等角定理 · 反向互补",
        config: {
          mode: "spatialLines",
          subType: "threePoints",
          flipSecondRay: true,
        },
        primaryKey: "angleParamDeg",
      },
    ],
  },
  {
    animId: "anim-solid-polyhedron",
    topicName: "多面体特征与台体体积",
    defaultParams: solidDefaults.polyhedronFeatures,
    paramMeta: toMetaRecord(polyhedronFeaturesMeta),
    variants: [
      { label: "棱柱", config: { mode: "prism" }, primaryKey: "h" },
      { label: "正棱锥", config: { mode: "pyramid" }, primaryKey: "h" },
      { label: "棱台", config: { mode: "frustum" }, primaryKey: "h" },
      { label: "等体积法", config: { mode: "equalVolume" }, primaryKey: "h" },
    ],
  },
];

describe("全库核心学科专题参数边界模糊测试与防虚假推导巡检 (Auto-Registry Fuzzing & Dynamic Response)", () => {
  fuzzTargets.forEach((target) => {
    const { animId, topicName, defaultParams, paramMeta } = target;
    // 多构型页面逐构型展开；单构型页面等价于只有一个构型的旧写法
    const variants: FuzzVariant[] =
      target.variants && target.variants.length > 0
        ? target.variants
        : [{ label: "", config: target.config, primaryKey: target.primaryKey }];

    variants.forEach(({ label, config, primaryKey }) => {
      const title = label
        ? `[${topicName}] ${animId} · ${label}`
        : `[${topicName}] ${animId}`;
      describe(title, () => {
        // 1. 全极小值边界测试 (All Minima)
        it("全参数极小值极限边界：面板数据无 NaN/除零且推导公式有效", () => {
          const minParams: Record<string, number> = { ...defaultParams };
          Object.entries(paramMeta).forEach(([key, meta]) => {
            if (typeof meta.min === "number") {
              minParams[key] = meta.min;
            }
          });

          const data = buildMathQuantities(animId, minParams, config);
          assertDataIntegrity(data, animId, "全极小值边界");
        });

        // 2. 全极大值边界测试 (All Maxima)
        it("全参数极大值极限边界：面板数据无 NaN/溢出且推导公式有效", () => {
          const maxParams: Record<string, number> = { ...defaultParams };
          Object.entries(paramMeta).forEach(([key, meta]) => {
            if (typeof meta.max === "number") {
              maxParams[key] = meta.max;
            }
          });

          const data = buildMathQuantities(animId, maxParams, config);
          assertDataIntegrity(data, animId, "全极大值边界");
        });

        // 3. 逐参数单变量极限摆动 (One-at-a-time Extremes)
        it("逐参数单变量极值扫描：各参数在其独立极值下稳健无崩溃", () => {
          Object.entries(paramMeta).forEach(([targetKey, meta]) => {
            const testValues: number[] = [];
            if (typeof meta.min === "number") testValues.push(meta.min);
            if (typeof meta.max === "number") testValues.push(meta.max);
            if (meta.marks) {
              meta.marks.forEach((m) => testValues.push(m.value));
            }

            testValues.forEach((val) => {
              const currentParams = { ...defaultParams, [targetKey]: val };
              const data = buildMathQuantities(animId, currentParams, config);
              assertDataIntegrity(data, animId, `参数 ${targetKey}=${val}`);
            });
          });
        });

        // 4. 防虚假推导：主参数扰动动态响应断言 (Dynamic Responsiveness Assertion)
        if (primaryKey && paramMeta[primaryKey]) {
          it(`防虚假硬编码推导：主控参数 [${primaryKey}] 扰动时，看板数值必须动态响应变化`, () => {
            const meta = paramMeta[primaryKey];
            const val1 = meta.defaultValue ?? defaultParams[primaryKey] ?? 1;
            const val2 =
              typeof meta.max === "number" && meta.max !== val1
                ? meta.max
                : val1 + (meta.step ?? 1) * 2;

            const data1 = buildMathQuantities(
              animId,
              { ...defaultParams, [primaryKey]: val1 },
              config,
            );
            const data2 = buildMathQuantities(
              animId,
              { ...defaultParams, [primaryKey]: val2 },
              config,
            );

            // 提取两组输出中的特征量数值或结构
            const hasLengthChange =
              data1.quantities.length !== data2.quantities.length;
            const map1 = new Map(
              data1.quantities.map((q) => [q.label, String(q.value)]),
            );
            const hasLabelValueChange = data2.quantities.some((q2) => {
              const v1 = map1.get(q2.label);
              return v1 !== undefined && v1 !== String(q2.value);
            });
            const hasDynamicChange =
              hasLengthChange ||
              hasLabelValueChange ||
              data1.quantities.some(
                (q, idx) =>
                  String(q.value) !== String(data2.quantities[idx]?.value),
              );

            expect(
              hasDynamicChange,
              `[${animId}] 严禁虚假假推导：当主控参数 ${primaryKey} 从 ${val1} 变更为 ${val2} 时，右屏 quantities 数值与结构未发生任何动态改变！`,
            ).toBe(true);
          });
        }
      });
    });
  });
});

/**
 * 结构完整性与数学数值断言辅助函数
 */
function assertDataIntegrity(
  data: ReturnType<typeof buildMathQuantities>,
  animId: string,
  context: string,
) {
  expect(
    data,
    `[${animId}] (${context}) buildMathQuantities 应返回有效数据结构`,
  ).toBeDefined();

  // 1. quantities 验证
  data.quantities.forEach((q) => {
    if (typeof q.value === "number") {
      expect(
        Number.isNaN(q.value),
        `[${animId}] (${context}) 特征量 [${q.label}] 产生了 NaN`,
      ).toBe(false);
      expect(
        Number.isFinite(q.value),
        `[${animId}] (${context}) 特征量 [${q.label}] 产生了无穷大 Infinity`,
      ).toBe(true);
    } else if (typeof q.value === "string") {
      expect(
        q.value.includes("NaN") || q.value.includes("undefined"),
        `[${animId}] (${context}) 特征量 [${q.label}] 包含异常字符: "${q.value}"`,
      ).toBe(false);
    }
  });

  // 2. theorems 验证
  data.theorems.forEach((t) => {
    if (t.latex) {
      expect(
        t.latex.includes("NaN") || t.latex.includes("undefined"),
        `[${animId}] (${context}) 定理 [${t.name}] latex 包含异常字符: "${t.latex}"`,
      ).toBe(false);
    }
  });

  // 3. reasoningSteps 验证
  if (data.reasoningSteps) {
    data.reasoningSteps.forEach((step, idx) => {
      if (step.latex) {
        expect(
          step.latex.includes("NaN") || step.latex.includes("undefined"),
          `[${animId}] (${context}) 推导链第 ${idx + 1} 步 latex 包含异常字符: "${step.latex}"`,
        ).toBe(false);
      }
    });
  }
}
