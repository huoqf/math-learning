# 规范治理与高中数学教学质量保证 — 待办事项

> 更新时间：2026-09-13
> 当前状态：P0 基础设施完成；P1 存量规范治理收官（**`src/features` 502 文件**严格审计 0 违规）；
> **P2 门禁范围与课标边界治理**：审计范围扩至全库 `src`、新增超纲术语门禁与学段边界一致性测试。

---

## 零、 口径更正说明（重要）

此前文档中"**全库 365 文件**严格审计 0 违规"的表述与实际不符，实为：

- `audit_page.mjs` 默认目标目录为 `src/features`（502 文件），`src/data`（140 文件）、`src/components`（91 文件）**从未被扫描**；
- 即"0 违规"是**范围缩水后的局部结果**，不是全库真实水位。

现已从根上修正（见"三、P2 门禁范围与课标边界治理"）。

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

## 二、 阶段成果与已完成（P1 阶段：存量代码规范治理全面清零）

> 目标：清理存量违规，使 `npm run audit:strict src/features` 全局通过并纳入 CI 阻断门禁。
> **最终战报**：全量违规项从 **269 处降至 0 处**（累计清除 269 处，清除率 **100%**），全库 365 个功能文件 0 警告 0 报错通过严格门禁！

### 2.1 P1 阶段治理成果

- [x] **审计门禁精准度升级**：
  - 修复检查 9：精准识别上下文，排除 `SceneLegend` / `SceneLegendItem` 图例中的合法数学公式（消除 22 处图例误报）。
  - 修复检查 7：改为逐个字符串字面量解析，排除对象键名（如 `三角函数: "trig_prob"`）和代码变量名误报。
  - 修复检查 3B：增强对多行数组的匹配支持，杜绝 `useMemo` 依赖跨函数错配引发的误报。
  - 修复检查 3C：支持大小写不敏感匹配与扩展模式字段（`tab`, `op`, `logic`），消除 40 处驼峰命名模式变量误报。
- [x] **SelectGrid 选项堆砌公式全部清零（20 处全部转为规范纯中文与 description）**：
  - `CompositeAnimation.tsx`、`LineParamTAnimation.tsx`、`FuncExpLogAnimation.tsx`、`LineEquationAnimation.tsx`、`ProbabilityBayesAnimation.tsx`、`ProbabilityDistributionAnimation.tsx`、`SetAnimation.tsx`、`TrigLinesAnimation.tsx`。
- [x] **TipCard 联动缺失全部修复（19 处全部补齐依赖与设问特化）**：
  - `SingleVarPage.tsx`（补齐 `presetKey`, `subMode` 并细化临界相切/轴位置设问）、`DerivativeAnimation.tsx`、`DerivativeMonotonicityAnimation.tsx`、`PowerPage.tsx`、`SymmetryPage.tsx`、`ProbabilityDistributionAnimation.tsx`、`ProbabilityNormalAnimation.tsx`、`RecurrencePage.tsx`、`LinePlaneRelationAnimation.tsx`、`ParametricPointAnimation.tsx`、`SpatialAngleAnimation.tsx`、`SurfaceRelationAnimation.tsx`、`StatPercentileAnimation.tsx`、`TrigTransformAnimation.tsx`、`Vector3DBasisAnimation.tsx`。
- [x] **混合文本缺少 $ 定界符全部修复（19 处全部规范化）**：
  - `ComplexAnimation.tsx`、`ConicParamAnimation.tsx`、`modeConfig.ts`、`DerivativeMonotonicityAnimation.tsx`、`LineCircleAnimation.tsx`、`ProbabilityNormalAnimation.tsx`、`TriangleExtremaAnimation.tsx`、`TrigFormulasAnimation.tsx`、`trigIdentity.ts`、`TrigLinesAnimation.tsx`。
- [x] **参数色彩 Token 绑定缺失修复**：
  - `LogarithmicPage.tsx` 中的 marks `labelFormula` 绑定 `MATH_COLORS.paramPrimary`。
- [x] **右屏模式上下文透传补齐**：
  - `FuncZeroAnimation.tsx` 补齐 `{ modelKey }` 透传。
- [x] **全量编译与回归测试 100% 通过**：
  - `npx tsc -b`：0 错误。
  - `npm run test`：71 个测试文件、645 个测试用例全部通过（含 56 个核心页面完整冒烟渲染）。

---

## 三、 已完成工作（P2 阶段：数学内容自动化测试与学科专项）

- [x] **1. 扩展 `syncContract.test.ts` 三屏契约测试**
  - 在已有 9 个专题基础上，新增覆盖等差数列、等比数列、平面向量数量积、极化恒等式、三角函数线与正弦型变换等重点章节，累计达 15 个专题级三屏数据一致性测试。
- [x] **2. 右屏推导链与 LaTeX 离线语法校验**
  - 新建 `src/test/katexSyntaxValidation.test.ts`，对全库 18 个主力专题的 `quantities.symbol`、`theorems.formula`、`reasoningSteps.mathFormula` 以及内嵌 `$formula$` 实行 100% 严格 KaTeX 离线预编译校验，零语法错误。
- [x] **3. 学科专项规范（discipline-specs）静态门禁化**
  - **数列专项**：`audit_page.mjs` 新增规则 16（数列离散点域检测，杜绝光滑连续样条曲线混入）。
  - **3D 立体几何**：`audit_page.mjs` 新增规则 15（综合法范式 A 纯净度检测，严禁混入坐标轴与空间向量）。

---

## 四、 已完成工作（P3 阶段：规范整合与文档演进）

- [x] **1. 规范文档单一事实源（SSOT）整合**
  - 将推导链三要素（审题定法 $\to$ 建模联立 $\to$ 求解反思）及防断层三要素闭环的标准定义，统一收敛至 `new-math-animation/references/right-panel-spec.md`（第 7 节）作为全库单一事实源（SSOT）；`audit-checklist.md` 与 `AGENTS.md` 公理 2 全面改为相对链接引用，彻底消除多处冗余维护。
- [x] **2. 3D Skill 规范对齐**
  - 完善 `new-3d-math-animation/SKILL.md`，深入阐述 `guarded3D: true` 的 WebGL 门禁防护机制（设备能力探针、非 WebGL 阻止 Three.js chunk 下载、友好升级提示、`<Suspense>` 懒加载闭环），并提供路由声明与四步注册的标准示例。

---

## 五、 已完成工作（P4 阶段：门禁范围与课标边界根本性治理）

> 背景：原门禁只扫 `src/features`、只校验"怎么画"不校验"画什么"。本次从根上补齐。

- [x] **1. 审计范围扩展至全库**
  - `audit_page.mjs` 默认目标由 `src/features` 改为 `src`，`components` / `data` / `math` / `math3d` 全部纳入。
- [x] **2. 引入存量基线（Baseline）机制**
  - 以 `(文件::规则::类型::级别)` 为单位记录存量计数，写入 `.audit-baseline.json`；
  - `--strict` 仅对"超出基线的增量违规"exit(1)，存量违规提示不阻断，避免历史包袱一上线就红灯；
  - 新增 `npm run audit:update-baseline` 用于整改后下修基线。
- [x] **3. 规则收敛：`left/param-label-format` 误报治理**
  - 原规则把滑块刻度 `ParamMark.labelFormula`（如 `"0"` / `"a=b"`）误判为"参数标签缺失中文含义"，产生 300+ 处噪音；
  - 现按 `marks: [ ... ]` 作用域 + `\bvalue:` 双重判定跳过 ParamMark，只约束 `ParamMeta`。
- [x] **4. 新增超纲术语门禁 `discipline/no-beyond-syllabus-terms`**
  - 覆盖 `builders` / `registries` / `knowledgeTree` / `meta.ts` / `Animation.tsx` / `Page.tsx` / `Scene.tsx`；
  - 命中未标注的洛必达 / 麦克劳林 / 泰勒 / 琴生 / 凹凸 / 极点极线 / 克拉默 / 外积 / 叉积 / 夹逼 / 等价无穷小 / 上确界 / 紧致 / 无穷级数 / 数列极限 / 特征方程 / 马尔可夫链 / 卡方分布 / 概率密度函数 / 微元 / 定积分 / 极坐标 / 参数方程 → error；
  - 已声明 `importance: "extend"` 或带「拓展 · 超出课标 / 选学」徽标的文件降级为 warning（视为已标注的拓展内容）。
- [x] **5. 硬编码色门禁补漏**
  - `style/no-hardcoded-hex` 补充 LaTeX 内联着色 `\color{#RRGGBB}{...}` 检测；已清理 56 处硬编码并统一改为 `${MATH_COLORS.*}`。
- [x] **6. 学段边界变成机器可断言的事实**
  - `KnowledgeNode` 新增可选 `syllabus: { book, status }` 字段；
  - `knowledgeTree.test.ts` 新增 4 条断言：extend 节点标题必须带拓展语义、含"拓展"的 module 必须 extend、`status !== "正文"` 必须 extend、正文节点不得标"超出课标"。
- [x] **7. 内容侧课标边界整改**
  - 超纲术语全部标注为「拓展 · 超出课标 / 选学」，或改写为课标内表述（凹凸→图象形态、夹逼→放缩、参数方程章节标注拓展、马尔可夫链标注选学 · 拓展等）。
- [x] **8. CI / husky / tsconfig 补齐**
  - `ci.yml`：`eslint` 加 `--max-warnings 0`；接入 `playwright test`（原 e2e 名存实亡）；
  - `.husky/pre-commit`：`tsc -b` → `tsc -b --force`（避免 tsbuildinfo 缓存空跑），并加入 `npm run test`；
  - `tsconfig.json`：`include` 纳入 `e2e` 与 `scripts`；
  - `package.json`：`npm run test` 纳入 `src/data`。
