# 规范治理与高中数学教学质量保证 — 待办事项

> 更新时间：2026-09-09
> 当前状态：P0 基础设施完成；P1 存量治理取得重大突破（违规数从 269 处降至 59 处，消除 78%）

---

## 一、 已完成工作（P0 阶段）

- [x] **门禁阻断机制与命令**：`audit_page.mjs` 支持 `--strict` / `-s` 退出码阻断；`package.json` 注册 `audit:strict` 命令。
- [x] **新增自动化门禁规则**：
  - 检查 12：严禁引入/使用 `BrowserRouter`（全库强制 `HashRouter`）。
  - 检查 13：SVG 内部严禁裸 `fontSize={...}`（必须使用 `fontScale` 比例计算）。
  - 检查 14：严禁裸 `rgb()` / `rgba()` 颜色定义（必须经 `MATH_COLORS` 与 `withAlpha`）。
- [x] **架构纯洁性静态保障**：`eslint.config.mjs` 将 `src/math3d/` 纳入与 `src/math/` 同等的纯函数无副作用规则（禁止导入 React、DOM、window 或全局 Store）。
- [x] **规范示例模板对齐**：`Template2DAnimation.tsx` 完整落地 `@/types/scenario` 的 `ScenarioSpec` 与 `useScenario` 驱动三屏闭环规范。
- [x] **Hook 依赖修复**：修复 `KatexFormula.tsx` 与 `ParabolaArchimedesScene.tsx` 中的依赖项警告。

---

## 二、 阶段成果与进行中（P1 阶段：存量代码规范治理与去违规）

> 目标：清理存量违规，使 `npm run audit:strict src/features` 能全局通过并纳入 CI 阻断门禁。
> **当前进展**：全量违规项由 **269 处降至 59 处**（累计清除 210 处，清除率 **78.1%**）。

### 2.1 P1 阶段已完成治理

- [x] **审计门禁精准度升级**：
  - 修复检查 9：精准识别上下文，排除 `SceneLegend` / `SceneLegendItem` 图例中的合法数学公式（消除 22 处图例误报）。
  - 修复检查 7：改为逐个字符串字面量解析，排除对象键名（如 `三角函数: "trig_prob"`）和代码变量名误报。
  - 修复检查 3B：增强对多行数组的匹配支持，杜绝 `useMemo` 依赖跨函数错配引发的误报。
- [x] **核心大型模块规范清零（共 11 个主力页面彻底达标 0 违规）**：
  - `ComplexAnimation.tsx`（补齐标准 `TipCard`，清理 11 处 `formula` 堆砌，12 处违规清零）。
  - `TranscendentalAnimation.tsx`（绑定 `MATH_COLORS` 色彩 Token，`preset` 深度联动，42 处违规清零）。
  - `KnowledgeTreeHome.tsx`（修复映射表误判，12 处违规清零）。
  - `DoubleVarPage.tsx`（联动 `presetKey`，修复双动点博弈混合公式 `$f_{\min} \ge g_{\max}$`，12 处违规清零）。
  - `VectorPolarizationApolloniusAnimation.tsx`（选项全部收敛为纯中文教学标签与描述，12 处违规清零）。
  - `ConicPropertiesAnimation.tsx`（联动 `conicType`，绑定离心率 marks 色彩 Token，11 处违规清零）。
  - `VectorLinearAnimation.tsx`（清理线性组合与共线预设公式，绑定 `MATH_COLORS`，11 处违规清零）。
  - `NikeAnimation.tsx`（标准型、均值不等式型、平移型选项全部转为纯中文标签，9 处违规清零）。
  - `VectorDotProductAnimation.tsx`（正交投影、垂直充要判定、极化等预设全面纯中文规范化，9 处违规清零）。
  - `TrigIdentityAnimation.tsx`（6 组诱导公式与 k·π/2 选择器全面纯中文标签化，9 处违规清零）。
  - `SequenceAnimation.tsx`（一阶递推、倒数构造、裂项相消等选择器纯中文规范化，9 处违规清零）。
- [x] **全量回归保障**：`src/test/corePagesSmoke.test.tsx` 56 个核心页面全部通过（56 passed）。

### 2.2 P1 阶段剩余待办（最后 59 处小文件收尾）

- [ ] **1. 剩余 SelectGrid 选项堆砌公式清理（剩余 20 处）**
  - 分布在：`LineParamTAnimation.tsx` (4)、`ProbabilityBayesAnimation.tsx` (4)、`TrigLinesAnimation.tsx` (4)、`LineEquationAnimation.tsx` (3)、`ProbabilityDistributionAnimation.tsx` (3)、`SetAnimation.tsx` (2) 等微型场景中。
- [ ] **2. 剩余 TipCard 联动缺失修复（剩余 19 处）**
  - 检查并补齐 `SingleVarPage.tsx`、`DerivativeMonotonicityAnimation.tsx` 等组件中对子模式/预设的特化响应。
- [ ] **3. 剩余混合文本未加 $ 定界符修复（剩余 19 处）**
  - 修复 `trigIdentity.ts`、`SymmetryPage.tsx` 等处中文自然语言句子中夹杂的未定界数学符号。
- [ ] **4. 生产页面逐步推广 `ScenarioSpec` 与 `useScenario` DSL**
  - 以已通过严格审计的典型页面为基础，在后续新建或重构页面时推广场景规范。

---

## 三、 待完成工作（P2 阶段：数学内容自动化测试与学科专项）

- [ ] **1. 扩展 `syncContract.test.ts` 三屏契约测试**
  - 在已有 9 个专题基础上，新增覆盖数列（等差/等比/递推）、平面向量、三角函数等重点章节的三屏数据一致性测试。
- [ ] **2. 右屏推导链与 LaTeX 离线语法校验**
  - 构建轻量 KaTeX 语法与结构静态测试，对所有 `reasoningSteps`、`Theorem`、`Formula` 的公式字符串做预编译校验，拦截公式重影、字符缺失与语法错误。
- [ ] **3. 学科专项规范（discipline-specs）静态门禁化**
  - **数列专项**：增加离散点域检测（严格正整数 $n \in \mathbb{N}^*$、柱状/点状表征、禁止连续光滑曲线假象）。
  - **3D 立体几何**：自动化检测范式 A（纯几何无坐标轴无向量）与范式 B（建系标法向量）的纯净度。

---

## 四、 待完成工作（P3 阶段：规范整合与文档演进）

- [ ] **1. 规范文档单一事实源（SSOT）整合**
  - 整理 `audit-checklist.md`、`right-panel-spec.md`、`AGENTS.md` 中冗余重复的“推导链三要素”表述，指定单一核心标准文件，其余文档改为相对链接引用。
- [ ] **2. 3D Skill 规范对齐**
  - 完善 `new-3d-math-animation/SKILL.md`，明晰 `guarded3D: true` 的 WebGL 上下文降级防护与注册流程细节。
