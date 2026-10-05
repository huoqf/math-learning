# 规范治理与高中数学教学质量保证 — 待办事项

> 更新时间：2026-10-05  
> 当前状态：P0 基础设施完成；P1 存量规范治理收官（**`src/features` 502 文件**严格审计 0 违规）；  
> **P2 门禁范围与课标边界治理**：审计范围扩至全库 `src`、新增超纲术语门禁与学段边界一致性测试。  
> **P3 / P4 已完成**（分节见下）。**中屏换算与网格定位量治理**：中屏「CSS 像素 ↔ design 坐标」换算链路治理与 `CoordinateGrid` 定位量解耦纯 design 常量均已闭环落地（见第六节 6.1 / 6.1.1）；新增 6.1.2 features 业务层 24 文件存量待办。

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

---

## 六、 待裁决 / 延后项（Deferred）与链路治理记录

> 本节收录中屏适配链路的根本性治理落地记录（6.1 / 6.1.1 已闭环）及后续待推进的存量项（6.1.2 / 6.2）。  
> 口径约定：**不做无证据的"疑似"**——每条必须给出可执行定位（`文件:行`）与可复算的量化依据；数量必须逐行清点，不得估算（参见 `docs/reports/审查报告09-13.md:91` 关于"口径前后不一"的教训）。

### 6.1 中屏「CSS 像素 ↔ design 坐标」与定位链路治理（已全面治理落地）

**架构事实**：中屏分辨率适配由共享组件/hook 单一链路承担，页面不得自造视口逻辑：

```
useAnimationViewport({ preset })
 ├─ useCanvasSize(preset)     → containerRef + canvasSize{ scale, rawScale, px(), font() }
 └─ useViewport(canvasSize)   → vp{ scale, tx, ty, transform, designVisibleW/H, designLeft/Top }
        ↓
 useSceneScale({ vp, xRange, yRange }) → scale{ scaleX, scaleY, originX/Y, xMin…yMax }
        ↓
 <AnimationSvgCanvas transform={vp.transform}>   ← 内部 <g transform="translate(tx ty) scale(vp.scale)">
        ↓
 原子件 CoordinateGrid / MathPoint / InteractivePoint（只吃 scale + fontScale）
```

**根因 — 两条 `scale` 语义从未被区分**：

|                    | 定义                                      | 是否已在 `<g transform>` 里生效 | 正确用法                                 |
| ------------------ | ----------------------------------------- | ------------------------------- | ---------------------------------------- |
| `vp.scale`         | `min(visibleW/designW, visibleH/designH)` | **是**                          | 换算 CSS 像素：`design = css / vp.scale` |
| `canvasSize.scale` | `min(raw.w/init.w, raw.h/init.h)`         | 否                              | 仅 CSS / DOM 上下文                      |

- `canvasSize.px`（`v * scale`）**全仓零调用**（`px={` 与 `canvasSize.px` 均无匹配）—— 有 API 无人敢用的死接口；
- 项目此前**没有**「SVG 内 CSS px → design」的官方工具，页面便各自发明：`trigModel` 写 `const px = (v) => v * vp.scale`，`radianMeasure` 照抄 ⇒ 屏幕长度成 **`v × vp.scale²`**（基准窗口 `vp.scale ≈ 1` 时完全隐形，1.3754 倍窗口虚胖 89%）；
- **同一模块内方向相反的既有铁证**：`src/features/trigModel/viewport.ts:66` 的 `topChromeBottomY` 用 `(PX − ty) / scale`（**除法，正确**），而同 feature 的 `TrigModelScene.tsx:93` 用 `v * vp.scale`（**乘法，错误**）；
- **规范缺口**：`AGENTS.md` 公理 4 只有 4.1 Preset / 4.2 字号链路 / 4.3 原子化复用——**「定位链路」不在宪法里**，是代码注释自造的概念。
- [x] **本轮已落地**（2026-10-03）：
  - `src/utils/useViewport.ts` 新增并导出 `cssToDesignLength(viewport, css) = css / vp.scale` 作为唯一换算真源（附反例文档）；
  - `src/utils/useCanvasSize.ts` 的 `CanvasSize.px` 补「⚠️ 仅 CSS / DOM 上下文」规范注释；
  - `src/features/trigModel/components/TrigModelScene.tsx` 改走真源（除法）；
  - `src/test/trigModelSceneRender.test.tsx` 修正被固化的错误期望值：`(SPAN_TICK_BOTTOM_DY − SPAN_TICK_TOP_DY) * TALL_VP.scale` → `/ TALL_VP.scale`（原期望 `12 × 1.2 = 14.4` 是错的，正确为 `12 / 1.2 = 10`，屏幕恒 12px）；
  - `src/features/radianMeasure/sceneGeometry.ts` 新增（比例常量 + 视口区间单一真源），Scene 的 `angleArcR / labelDist / rLabelNormalOffset` 改为 `radiusPx × 比例`，删除自造 `px` / `vpScale`；
  - 整角分支由死代码变可达：`isFull` 阈值 `TAU − 1e−4` → `TAU − step/2`（实机坐实 `alphaRad` 的可达上界仅 6.28，距 TAU 有 0.0032，旧阈值下双半圆路径与 `<circle>` 角标记恒不可达）；
  - 新增 `src/test/radianMeasureSceneRender.test.tsx`（6 用例，跨三视口断言比例恒等，含优角 `largeArc=1/sweep=0`、整角双半圆、`O` 唯一、三模式无 NaN）。
  - 验收：`tsc -b --force` exit 0 ｜ vitest（全量及 `npm run test`：**180 文件 / 1844 用例**；四目录口径 `src/math src/data src/test src/features`：**172 文件 / 1791 用例**）｜ `audit:strict` **788 文件 / 0 error** ｜ `eslint src --max-warnings 0` exit 0 ｜ 实机三视口（`vp.scale` = 0.56 / 0.9908 / 1.3754）`angleArcR ÷ mainR` 恒 `0.3333`（修复前为 `29.72 ↔ 41.26`，差 38.8%）。
- [x] **6.1.1 已落地（2026-10-05）**：`CoordinateGrid` 9 处「定位偏移量」解耦为纯 design 常量（对齐方案 A + 几何纠偏）
  - **最新锚点** —— 常量定义集中于 `src/components/Math/CoordinateGrid.tsx:70-81` 的 `GRID_METRICS`，在渲染时消费：
    - 横轴数值标签：`:177 y={pt.y + GRID_METRICS.xTickLabelY}`、`:214 x={pt.x - GRID_METRICS.yTickLabelX}`、`:215 y={pt.y + GRID_METRICS.yTickLabelY}`
    - 原点 `O`：`:234 x={ptZero.x - GRID_METRICS.originOffsetX}`、`:235 y={ptZero.y + GRID_METRICS.originOffsetY}`
    - `x` 轴名与箭头：`:298 x={xAxisEnd.x - GRID_METRICS.xAxisLabelOffsetX}`、`:299 y={xAxisEnd.y + GRID_METRICS.xAxisLabelOffsetY}`
    - `y` 轴名与箭头：`:316 x={yAxisEnd.x - GRID_METRICS.yAxisLabelOffsetX}`、`:317 y={yAxisEnd.y + GRID_METRICS.yAxisLabelOffsetY}`
    - （`:180 / :218 / :238 / :302 / :320` 的 `fontSize={fontScale(...)}` 属**字号链路**，完整保留，解耦清晰）
  - **取值裁决（偏离原方案 A 字面量承诺的工程理由）**：
    - 原方案 A 假定的 `(14 / 6 / 13 / 15 / 10 / 2 / 3.5)` 系机械抄录旧 JSX 字面量；实机核算发现 `6 / 2 / 3.5` 在旧代码中受 `FONT_SCALE_MIN = 7` 约束运行时恒被夹紧为 `7`；
    - 落地时经实机视觉校验，裁决采用**真实几何居中与避让值**而非机械字面量：
      1. `yTickLabelY: 3.5`：字号 10.5 时数字高度约 7.3px，重心距基线约 3.6px，设为 3.5 使数字垂直中轴精准对齐水平刻度线（彻底纠正原先误套 fontScale 导致被 clamp(7) 下沉 3.5px 的偏心 Bug）；
      2. `yTickLabelX: 7` 与 `originOffsetX: 7`：刻度线半长 3.5px，右对齐偏移 7px 留出 3.5px 留白；
      3. `xAxisLabelOffsetX: 6`：
         - 几何澄清：箭头为 `polygon [xAxisEnd, xAxisEnd-7] × [y±3.5]`，标签在 `y+15`（基线），文字顶边距箭头底边保持有 ≈11.5px~14.5px 充裕间距，纵向绝无粘连；
         - 取值真因：核心考量为 X 方向视觉平衡。旧代码 `fontScale(2)` 因 `clamp(7)` 实际恒生效为 7px（正对底座垂直线）；若按原字面量 2 突变 5px，中轴将偏至尖端（距尖端仅 2px）导致右倾孤悬；取 6 是为了在承接旧运行时视觉的前提下向尖端微调 1px，居于箭头中后段平衡位置。
  - **门禁与契约固化**：
    - `AGENTS.md` 公理 4.2 正式补入「字号链路与定位链路（PositionScale Chain）解耦」双轨定义；
    - 质量门禁新增 `audit:center/no-font-scale-in-coords` 强拦截公共共享基础设施（`src/components/`）；
    - 实机经多视口（1536×825 标准视口与 1024×768 小视口）交互审查核验，字号缩放与几何留白比例恒定，彻底消除了此前大屏 clamp(16) 导致的 17%~25% 贴脸挤压畸变（区间推导：当 `scale ≥ 16/10.5 ≈ 1.5238` 时字号亦触顶，畸变达 25%）。
  - **验收**：`npx tsc -b` exit 0 ｜ vitest（全量及 `npm run test`：180 文件 / 1844 用例；四目录路径 `npx vitest run src/math src/data src/test src/features`：172 文件 / 1791 用例）100% pass ｜ `audit:strict` 788 文件 / 35 规则 / 0 error。
- [ ] **6.1.2 待治理：`src/features/` 下 24 个历史业务页面定位量误用 `fontScale` 存量收拢**
  - **现状**：门禁新规则 `center/no-font-scale-in-coords` 当前优先守卫 `src/components/` 公共共享基础设施（保证 0 存量基线）；经全库逐行清点，`src/features/` 下仍有 **24 个业务文件、精确 221 处**（如 `LineCircleScene.tsx` 7 处、`ComplexScene.tsx` 4 处、`ProbabilityDistribution*` 系列等）存在历史同类误用；
  - **清点依据**：临时移除 `components` 路径限定后运行 `npm run audit:strict` 精确报告 221 处违规，涉及 24 个 Scene/Zone 文件；
  - **治理计划**：在后续专题重构中，对这 24 个业务页面逐步将局部 `<text>` 几何位移或背景框 `width/height` 解耦为纯 design 常量，最终推进门禁规则向全库开放。

### 6.2 全库存量（与 6.1 无因果关系，一并登记备查）

- [ ] 全库 **119 处** `prettier --check` 格式不符（含 `src/utils/useViewport.ts` 等既有「单引号 + 无分号」风格文件与 `.prettierrc` 的 `semi: true` 长期冲突）；
- [ ] **19 处**文件带 BOM（判定须用字节级 `git grep -lI $'\xef\xbb\xbf'`，勿用 `grep -r`）；
- [ ] `.agents/skills/new-3d-math-animation/examples/Template3DAnimation.tsx:157` 存在 1 处 JSX 语法错误（多余 `/>`）。

> ⚠️ 上述三项**长期存在且未阻断任何门禁**（`audit:strict` 的存量基线机制只对「增量」exit(1)）。是否清理需单独裁决。
> ⚠️ **勿在功能修复的提交里夹带全库重排** —— 格式化工具会连带重排无关行，使 diff 失去可读性。本轮已有一次实际教训：对 `src/utils/useViewport.ts` 误跑 `prettier --write` 产生 `+82 / −42` 无关重排，已 `git checkout` 回退并按原风格改为纯增量 `+26 / −0`（该文件的 prettier warn 属 HEAD 既有存量，用 `git show HEAD:<file> | npx prettier --check --stdin-filepath <file>` 复核确认）。
