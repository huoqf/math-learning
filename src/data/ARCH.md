# `src/data/` 架构与职责边界声明

> 本文档是本目录的 **Single Source of Truth (SSOT)**，供人读与审计门禁扩展共同依赖。
> 任何新增/改动 `builders/`、`registries/`、`mathQuantities.ts` 的代码都必须先对照本节，
> 反之，本节描述与源码不符时以源码为准并回修本文档。

---

## 1. 目录拓扑总览

```
src/data/
├── builders/          # 纯函数看板生成层（Panel Builder）
├── registries/        # 场景配置声明层（ScenarioSpec / paramMeta / 参数类型 / 默认参）
├── knowledgeTree/     # 知识树分组（按学科，已有规范）
├── mathQuantities.ts  # 分发路由层（animId → builder 映射）
├── routeEntries.ts    # 路由注册（按学科分 10 组）
├── types.ts           # 共享类型（MathPanelData 等）
└── index.ts           # 仅对外聚合导出 knowledgeTree
```

---

## 2. 三层职责边界（Terminal Rules）

### `builders/` —— 纯函数计算层

- **输入**：`params: Record<string, number>` + `config`（对象字面量或已类型化参数）
- **输出**：`MathPanelData`
- **允许**：`import type` / `DEFAULT_*` 常量 **单向引用 `registries/`**（见 §3 依赖方向）
- **禁止**：
  - 引用 React / DOM / window 或任何全局 Store（已由全局铁律 6 兜底）
  - 声明 `ScenarioSpec[]` 字面量与数组
  - 包含 `KnowledgeNode`
  - 任何副作用（打印、订阅、计时器）

**子目录/Barrel 先例**：`builders/solidGeometry.ts`（聚合 11 个 `buildSpatialAnglePanel` 等 ）、
`builders/tangentScaling.ts`（`export * from "./tangentScaling/index"`）。
跨域巨型 builder 允许用 barrel 拆分，但顶层路径 `builders/<name>.ts` 必须保持单一入口。

### `registries/` —— 配置声明层

- **内容**：`ScenarioSpec[]` 数组 + `paramMeta` + 场景特有参数类型 + `DEFAULT_*` 默认参
- **允许**：被 `builders/`、`features/<name>` 及各测试文件**只读引用**
- **禁止**：
  - 数学计算逻辑 / 函数体
  - 调用 `builders/`（严禁反向依赖）
  - 引用 React / DOM / window

### `mathQuantities.ts` —— 分发路由层

- **唯一允许**组织并调用 `builders/` 的入口（对齐全局公理 1 右屏统一组装）
- switch 表**只做 `animId → builder` 映射**，不承载业务逻辑
- **注意**：本文件 import 块全部来自 **`builders/`**（`buildQuadraticPanel` 等），
  并仅在 `anim-derivative-tangent-scaling` 分支用 `import("./registries/tangentScaling")` 取
  `TangentScalingParams` 类型（位于 `registries/tangentScaling.ts`，**不是** `conicLine.ts`）、
  用 `import("./builders/tangentScaling")` 取 `TangentScalingOptions`。

---

## 3. 依赖方向（反对有向环）

```
                  ┌────────────────────────┐
                  │  registries/  (声明层)   │
                  └─────────▲──────────────┘
                     只读 │ 允许 flow
                  ┌────────┴──────────────┐
                  │  builders/ (计算层)     │
                  └─────────▲──────────────┘
                     唯一调用者 │
                  ┌────────┴──────────────┐      ┌────────────┐
                  │  mathQuantities.ts     │ ───▶ │ features/  │
                  └────────────────────────┘      └────────────┘
```

- `builders/` → `registries/`：**允许**（限定为类型引入与 `DEFAULT_*` 常量）。
  真实案例：`builders/probabilityIndependence.ts` 引入
  `DEFAULT_PROBABILITY_INDEPENDENCE_PARAMS` 与其参数类型。
- `registries/` → `builders/`：**禁止**（会导致环形依赖，一旦出现即视为架构违规）。
- `mathQuantities.ts` → `builders/`：唯一合法入口。
- `features/<name>`、`src/test/*` → `registries/<name>`：按需单文件只读引用。

---

## 4. 审计门禁扩展建议（Audit Gate）

| 检查项                   | 拦截条件                                                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `builders/` 禁用配置声明 | `builders/**` 中出现 `ScenarioSpec[]` 字面量 / `import` 后构造数组；**类型引用（`import type`）豁免**，避免误伤 §3 合法方向 |
| `registries/` 禁计算     | `registries/**` 中出现 `function` 计算体 / 引用 React/DOM                                                                   |
| `registries/` 反向禁链   | `registries/**` 中出现 `from "*/builders/*"`                                                                                |
| 路由纯净                 | `mathQuantities.ts` 中出现注册表/数学业务逻辑外的副作用调用                                                                 |

---

## 5. `registries/` 学科分组索引（文档级分组）

> 采用 **文档级分组**：不移动 55 个文件，仅在此登记学科归属，供人导航与 IDE 认知。
> 已与 `registries/` 全部 55 个文件逐一核对，无遗漏、无重投。

| 学科 barrel（逻辑组）  | 包含的 `registries/*.ts`                                                                                                                                                                           | 数量      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| `algebra` 代数         | quadratic, funcProperties, funcExpLog, funcZero, transform, composite, inequalityBasic, inequalityAbsolute, nike, constant, set                                                                    | 11        |
| `trig` 三角            | trigLines, trigIdentity, trigFormulas, trigTangent, trigTransform, triangleSolve, triangleExtrema                                                                                                  | 7         |
| `derivative` 导数      | derivative, derivativeMonotonicity, secondDerivative, derivativeEndpointTaylor, derivativeShift, transcendental, tangentScaling                                                                    | 7         |
| `sequence` 数列        | sequence                                                                                                                                                                                           | 1         |
| `vector` 向量/复数     | vectorLinear, vectorDotProduct, vectorBasis, vectorPolarizationApollonius, complex                                                                                                                 | 5         |
| `analytic` 解析几何    | lineEquation, lineCircle, circleCircle, conicDefinition, conicProperties, conicLine, conicParam, lineParamT, conicHomogenization, parabola, parabolaArchimedes                                     | 11        |
| `probability` 概率统计 | probabilityEvents, probabilityClassical, probabilityIndependence, probabilityCounting, probabilityBayes, probabilityMarkov, probabilityDistribution, probabilityNormal, pairedData, statPercentile | 10        |
| `solid` 立体           | solidGeometry, vector3d, quantifiers                                                                                                                                                               | 3         |
| **合计**               |                                                                                                                                                                                                    | **55** ✅ |

> 该分组**仅供导航**。禁止因此新建学科 barrel 文件并让 `mathQuantities.ts` 或任何消费方改走
> 聚合入口——现状的「按需单文件引用」利于显式化与 tree-shaking，勿为可读性牺牲。

---

## 6. 决策记录（为何不移动文件）

- **不移动 `registries/` 的 55 个文件**：`mathQuantities.ts` 的 70 行 import 全部来自
  `builders/`，registries 学科 barrel 对压缩它**零收益**；且各消费方（features 1:1、
  builders 类型、tests）均为按需单文件引用，学科聚合入口是死代码。
- **不移动 `features/` 目录**：见单独 feature 规范化倡议（P2，分批推进）。
- 若未来确需压缩 `mathQuantities.ts` import 块，目标层是 **`builders/`** 而非 `registries/`，
  且压缩须权衡路由显式性与 tree-shaking（当前倾向保持显式）。
