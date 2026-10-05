# AGENTS.md — Antigravity 工作区系统公理与工程契约（自动加载）

> 💡 **核心设计哲学**：拒绝教条式规则堆砌，依托**领域模型（DSL）**、**类型系统（TypeScript）**与**自动化静态门禁（Audit Gate）**实现全生命周期确定性保障。

---

## 一、 项目定位与技术栈

- **定位**：覆盖全高中数学（代数/几何/概率统计/解析几何/立体几何）的“数形结合”交互探索平台。
- **技术栈**：React 19 + TypeScript 5.5+ (strict) + TailwindCSS 4 + Vite 6 (`base: './'`) + 纯 React Hooks。
- **离线与路由**：KaTeX 完全离线渲染；全局路由 **HashRouter Only**。

---

## 二、 系统四大核心公理（System Axioms）

### 公理 1：单一事实源（SSOT）与纯净领域模型
1. **纯净数学层（Zero Side-effects）**：`src/math/` 与 `src/math3d/` 必须全部为纯函数，严禁导入 React、DOM、window 或任何全局 Store。所有状态计算返回明确的结构化数据与 `validity` 标志。
2. **场景规范驱动（Scenario Spec DSL）**：
   - 凡涉及多构型/典型真题情景的页面，必须使用 `@/types/scenario` 中的 `ScenarioSpec` 统一声明元数据（`id`, `name`, `badge`, `condition`, `question`, `presetParams`）；
   - 使用 `useScenario` 驱动三屏联动，**严禁**在左屏散落手拼题设口水话或使用单向未绑定状态。
3. **右屏数据统一组装**：右屏 `MathPanel` 统一通过 `buildMathQuantities(animId, params, config)` 接收数据，严禁绕过统一数据源散装。

### 公理 2：三屏严格分工与认知闭环
```
左屏（LeftPanel）               中屏（AnimationSvgCanvas / ThreeDCanvas）       右屏（MathPanel）
──────────────────────          ────────────────────────────────────────        ──────────────────────
• 模式选择 (TabSwitcher)         • SVG / R3F 空间几何主体动画                    • MathQuantity 实时数学量
• 二级情景 (SelectGrid)          • 几何动点拖拽与数形反向解算                     • Theorem 定理与前提条件
• 参数降维调节 (ParamControl)    • SceneLegend 毛玻璃图例                        • GaokaoPoint 高考压轴考点
• 教学导引题设 (TipCard)        ❌ 严禁大段长句与推导解释                      • WarningItem 退化预警
```
- **左问右解闭环**：左屏 `TipCard` 统一承载题设三要素闭环：【真实背景 background】（凡属应用题/统计分析/实际建模/高考真题情景必须交代背景，杜绝抽象符号直接空降）+【初始条件 condition】+【核心设问 question】；完整公式推导、零点存在性证明与高考考法 100% 归位右屏 `MathPanel`。具体推导链三要素（审题定法 $\to$ 建模联立 $\to$ 求解反思）与各学科规范以 [.agents/skills/new-math-animation/references/right-panel-spec.md](file:///d:/code/math/math-learning/.agents/skills/new-math-animation/references/right-panel-spec.md#7-高中数学学科认知与破题推演准则-理顺思路--助力掌握) 为全库单一事实源（SSOT）。
- **推导链三部曲（严禁孤立数字）**：推导链必须严格遵循「① 符号表达式 $\to$ ② 代入解析式 $\to$ ③ 结果/解集」，严禁直接跳步给出孤立数值（如 $f_{\min} = 2.50$）；参数求解必须由充要条件列出含参不等式。
- **分步作答闭环（教具 → 提分）**：支持/已接入分步作答的大题类页面（以概率统计、解析几何与数列等典型高考大题为示范基准），在左屏选用 `StepNavigator` 承载「高考标准解答分步走」主线，带着学生一步一屏地走，而非一次性铺开整块看板。启用该能力的页面，左屏（`StepNavigator` 的 `AnswerStepItem[]`）、右屏（`MathPanel` 的 `focusStep` / `focusTarget`）、中屏（Scene 的 `activeStep` / `regionOpacity` / 当前步围栏）**三处必须同源同频**：链条只写在页面注册表一份，围栏描边取 `MATH_COLORS.answerStepFrame`（`#3B82F6`）与右屏聚焦描边同色，**同一页只允许一处描边**；右屏条目名与步号严禁另写一份。字段级契约、版面自检与回归防线以 [left-panel-spec.md](file:///d:/code/math/math-learning/.agents/skills/new-math-animation/references/left-panel-spec.md) 与 [right-panel-spec.md](file:///d:/code/math/math-learning/.agents/skills/new-math-animation/references/right-panel-spec.md) 为 SSOT，此处不再复述实现细节。
- **条目级拓展声明**：判「超出 2019 人教A版新课标正文」一律用 `Theorem.isExtension` + `extensionBadge`（右屏自动渲染紫色徽标，与 `level` 正交），**严禁**再把「（拓展 · 超出课标）」写进定理名称；该字段同时被 `discipline/no-beyond-syllabus-terms` 门禁识别为"已声明拓展"。
- **内联数学符号 100% 包裹 `$...$`**：所有文本字段（`background`, `detail`, `condition`, `question`, `prerequisites`）中凡涉及数学变量、区间、极值与 LaTeX 指令，必须严格用单 `$...$` 包裹，交由 `renderMixedLatex` 渲染，严禁裸露 raw 字符。
- **情景多级联动**：用户在左屏切换任何二级选项，`TipCard` 的题设背景与探究问题必须 100% 动态特化。

### 公理 3：数形与语义色彩一体化
1. **三位一体色彩映射**：
   - 核心主控参数一（如 $a, k$）：`MATH_COLORS.paramPrimary` (`#EF4444`)
   - 次要关联参数二（如 $b$）：`MATH_COLORS.paramSecondary` (`#D97706`)
   - 辅助/常数参数三（如 $c, \theta$）：`MATH_COLORS.paramTertiary` (`#059669`)
2. **公式-图形-滑块同频**：
   - KaTeX 中使用 `\color{${MATH_COLORS.paramPrimary}}` 动态注入；
   - 场景中由该参数决定的特征线/几何要素呼应同色；
   - 严禁任何字面量裸 Hex（如 `stroke="#RRGGBB"`），统一从 `@/theme` 导入 `MATH_COLORS` 与 `withAlpha`。文档中凡以具体色值作注解，必须写成「令牌 (取值)」形式（如 `` `MATH_COLORS.paramPrimary` (`#EF4444`) ``），供 `agentsDoc.test.ts` 机器校验取值一致性。

### 公理 4：画布视口与原子组件复用
1. **默认 `full` Preset**：高中数学绝大部分页面优先选用 `CANVAS_PRESETS.full` (840×650)；仅单位圆/三角函数/极坐标选用 `square` (650×650)；**能合屏坚决不分屏**。
2. **字号链路（FontScale Chain）与定位链路（PositionScale Chain）解耦**：
   - **字号链路**：`Animation (canvasSize.font) ──→ Scene (fontScale) ──→ components / Labels`。`fontScale` 专门且唯一服务于 `fontSize`；SVG 内部严禁硬编码字号或写死 Tailwind `text-[Npx]`。
   - **定位链路**：中屏几何图元与定位偏移量统一使用 pure design 常量（由 SVG 外层视口 `<g transform="translate(...) scale(vp.scale)">` 等比线性放缩）。共享原子组件与基础设施（`src/components/`）受门禁强拦截阻断，严禁将几何定位偏移传入 `fontScale` 触发非线性截断造成排版畸变。
3. **全面原子化复用，严禁手写重复轮子**：
   - 2D 点：纯数学点/交点用 `MathPoint`，拖拽控制点用 `InteractivePoint`；
   - 2D 标注：点标一律用 `SceneLabelGroup`；图例一律用 `SceneLegend`（遵循**智能避让原则**：默认 `bottom-right`，当右下角存在直方图高分柱、正态长尾阴影、焦点或轴标签时，必须切换为 `top-right` 避让主体，严禁教条硬编码遮挡）；向量一律用 `VectorArrow`；
   - 3D 体系：纯几何线段用 `Segment3D`（无箭头），仅法向量/基向量用 `Vector3DArrow`；顶点标签用 `PointLabel3D` 或 `CompoundLabel3D`，杜绝 Unicode 下标豆腐块。

---

## 三、 质量门禁与裁决链路（Automated Quality Gates）

> ⚠️ **所有微观规范与禁忌由自动化门禁强行判定，任何人工或模型侥幸违规均会被机器直接拦截阻断。**
> 下表每行的**执行者**必须如实标注：`audit:<rule-id>`（静态审计规则）/ `vitest:<相对路径>`（契约测试）/ `tsc`、`vitest`（工具链）/ `人工评审`（**尚无机器守卫，须人工把关**）。执行者真实性由 `src/test/agentsDoc.test.ts` 机器校验——**严禁填写不存在的规则、测试或路径**，也严禁把人工评审项伪装成自动化标准。

执行质量审计：
```powershell
$env:PATH="D:\node-v24;"+$env:PATH; npm run audit -- <path/to/feature>
```

| 门禁检查项 | 判定标准 | 执行者 |
|:---|:---|:---|
| **色彩与硬编码** | 源码中严禁出现 JSX 属性字面量 `fill="#RRGGBB"` / `stroke="#RRGGBB"`，以及 LaTeX 的 `\color{#RRGGBB}{...}`；一律走 `MATH_COLORS.*` / `CANVAS_COLORS.*`。⚠️ 数组元素、变量中转、模板插值里的色值字面量**不在机械拦截范围内**，须人工自律 | `audit:style/no-hardcoded-hex`、`audit:style/no-hardcoded-rgb` |
| **字体缩放** | SVG 标签内严禁裸 `fontSize={数字}`，必须经 `fontScale` 缩放 | `audit:center/font-scale` |
| **几何坐标纯净度** | 共享原子组件严禁将 `fontScale` 误用于 `x`/`y`/`cx`/`cy`/`r`/`width`/`height` 等几何坐标或尺寸属性；几何量统一使用纯 design 常量 | `audit:center/no-font-scale-in-coords` |
| **控件纯净度** | `SelectGrid` 项必须为纯中文标题，严禁堆砌公式或参数值 | `audit:left/select-grid-clean` |
| **情景联动性** | 凡含 `<SelectGrid value={x}>`，`TipCard` / `useScenario` 依赖必须包含 `x` | `audit:left/tipcard-secondary-sync` |
| **架构纯洁性** | `src/math/` 禁止包含 React/DOM 引用；全库禁止 `BrowserRouter` | `audit:arch/pure-math-layer`、`audit:arch/no-browser-router` |
| **审计严格阻断** | `npm run audit:strict` 默认扫描**全库 `src`**（含 `features` / `components` / `data` / `math` / `math3d`）。采用**存量基线**机制：仅"超出基线的增量违规"非零退出阻断构建，历史存量计入 `.audit-baseline.json` 提示不阻断；整改后用 `npm run audit:update-baseline` 下修基线。基线登记为"零存量"时，全库任何一处 error 都会被按增量拦截 | `audit:.agents/skills/math-page-audit/scripts/audit_page.mjs`（元规则：门禁入口自身） |
| **超纲术语门禁** | `discipline/no-beyond-syllabus-terms` 的扫描载体：`builders` / `registries` / `knowledgeTree` / `meta.ts` / `modeConfig` / `Animation.tsx` / `Page.tsx` / `Scene.tsx` 以及首页知识树卡片等用户可见文案。**词表分两类**：① 单字符串 `BEYOND_SYLLABUS_TERMS`（洛必达/麦克劳林/泰勒/琴生/极点极线/克拉默/外积/叉积/夹逼/等价无穷小/上确界/紧致/无穷级数/数列极限/马尔可夫链/平稳分布/卡方分布/概率密度函数/微元/定积分/极坐标/参数方程等）；② **受控词族模式 `BEYOND_SYLLABUS_PATTERNS`**（如 `/特征(?:方程\|根)/` 覆盖「特征方程 / 特征根 / 特征根方程」整族）。⚠️ **新增超纲词若存在同族变体（换字、加字、简称），必须加进词族模式而非只登记单字符串**——单字符串登记会被"多写一个字"绕过 | `audit:discipline/no-beyond-syllabus-terms`、`audit:discipline/no-hardcoded-white`、`audit:discipline/no-physics-units` |
| **超纲术语判定链（按代码真实短路序）** | 命中后依次执行，**前两步是短路 return（静默放行），第三步才是兜底**：① **标内核心技巧豁免** → 静默（向量参数方程 / 参数化设点 / 单参数设点 / 三角参数代换；「双曲线参数方程」被显式排除，不随之放行）；② **专属拓展模块登记表放行** → 静默（见下一行）；③ **兜底判定**：命中条目自身 `isExtension: true`，或所属知识树节点 `importance: "extend"` → **warning**；否则 → **error 拦截**。⚠️ 早期文档曾写成"error 在前、放行在后"，与代码短路口径正好相反，已按此表为准 | `audit:discipline/no-beyond-syllabus-terms` |
| **专属拓展模块主题词登记表** | `EXTEND_MODULE_AUTHORIZED_TERMS`（`discipline.mjs`）登记"页面主题词本身就是超纲术语"的专属选学拓展专页（二阶导数页的「二阶导/拐点/琴生」、泰勒页的「泰勒/麦克劳林/洛必达」、参数方程页的「参数方程」、数列二阶线性递推的「特征方程/特征根」）。三条硬约束：① **每条登记必须写 `reason`**（≥20 字，说明节点 id / `importance` 依据）；② **按 `features` / `builders` / `registries` 载体精确登记**，登记后该模块内**未登记的**超纲术语仍照常报出（如参数方程页写洛必达）；③ **`knowledgeTree` 单独走节点级判定**——知识树是单文件多节点，命中所在 node 对象自身未声明 `importance:"extend"` 即不放行，禁止文件级豁免。**白名单只放行已登记的"主题词"，不是"该模块免检"** | `audit:discipline/no-beyond-syllabus-terms`、`vitest:src/test/auditEngine.test.ts` |
| **正文陈述与命名载体分离** | 超纲术语的**正文陈述**统一用课标内表述（如二阶线性递推写「对应二次方程 $x^2-px-q=0$ 的两根」），仅允许在**命名载体**（定理名 / 左屏标签 / 拓展徽标 / 情景名 / 口诀）上点名超纲方法名；且「拓展 · 超出课标」这类**标注**严禁写进定理名，一律用 `isExtension` + `extensionBadge` | `audit:discipline/no-beyond-syllabus-terms` |
| **极限记号纪律** | 必修一函数章节（尚未学极限）正文严禁 `\lim` 记号与「极限」术语，一律改「分界点左/右侧取值」「无限接近」；数列通项收敛与分布列大样本逼近的**解答题教学正文**同样严禁书写未定义的高等数学极限记号，改文字化近似表述。人教A版课标正文内的导数概念定义式、及显式声明拓展的高等数学专题（如洛必达法则、无穷级数）中的极限记号属合规内容 | `audit:discipline/no-limit-notation-compulsory-one`（必修一）、`vitest:src/data/builders/__tests__/probabilityDistribution.test.ts`、`vitest:src/math/__tests__/probabilityMarkov.test.ts` |
| **学段边界一致性** | `importance === "extend"` 的节点标题必须含「拓展/选学/超出课标/竞赛」；`module`/`chapter` 含"拓展"的节点 `importance` 必须为 `"extend"`；`syllabus.status !== "正文"` 的节点必须标为 `extend`；**先修拓扑册次门禁**：先修节点所在分册序（必修一→必修二→选必一→选必二→选必三）不得晚于本节点分册 | `vitest:src/data/knowledgeTree.test.ts` |
| **TipCard设问质量** | 严禁“观察图形变化”等空泛词；设问必须包含“求范围/最值/证明/单调性/零点”等数学目标词 | `audit:left/tipcard-quality` |
| **推导链代数三部曲** | `reasoningSteps` 严禁孤立数字赋值，必须按「符号 $\to$ 解析式代入 $\to$ 结果」演绎；参数求解必须由充要条件列出含参不等式 | `audit:right/reasoning-no-isolated-number` |
| **内联数学符号定界符** | 文本字段（`background` / `detail` / `condition` / `question` / `prerequisites`）涉数学变量、区间、极值与 LaTeX 指令，必须严格用单 `$...$` 包裹，交由 `renderMixedLatex` 渲染，严禁裸露 raw 字符 | `audit:discipline/text-delimiter`、`audit:discipline/raw-latex-instructions` |
| **分步作答闭环一致性** | 针对已接入分步作答的模块强制：左屏步号 1 起、首末步边界禁用、点击可直跳；`focusStep` 只派发给 `focusTarget` 命中的区块（另一区块不得出现 `data-focus-step`）；中屏第 N 步只点亮第 N 块分区、未分步时全亮且不出围栏；右屏条目的步号与标题逐条等于注册表链条（如 `MARKOV_ANSWER_STEPS` / `INDEPENDENCE_ANSWER_STEPS`） | `vitest:src/test/answerStepFocus.test.tsx` |
| **代数表达与逻辑严谨** | 严禁代数多项式出现机器浮点尾零（如 $1.00x$）与未化简系数（$1x$ 必须化简为 $x$）；几何从属严禁滥用 $\iff$ 伪充要；必须使用 `formatMathNumber` | `audit:right/algebra-rigor`、`audit:center/no-raw-float-text` |
| **单一视口滚动规范** | 垂直滚动条 100% 由 `ThreePanel` 外层统一接管；严禁子卡片/公式使用 `overflow-x-hidden overflow-y-visible` 制造嵌套滚动条 | `audit:arch/no-nested-vertical-scroll`、`audit:arch/no-scroll-axis-conflict` |
| **3D 范式纯净度** | 声明为范式 A (综合法) 的场景源码严禁包含 `<Scene3DGrid>`、`<CoordinateAxes3D>` 或 `<Vector3DArrow>` | `audit:center/paradigm-a-pure` |
| **学科特征线完整性** | 数列页面严禁连续曲线冒充离散点列；立体几何综合法必须包含垂足与垂直标记 | 前半 `audit:center/sequence-discrete`；后半「垂足与垂直标记」**无机器守卫 → 人工评审** |
| **预设参数数学安全** | `presetParams` 必须满足高中课标定义域（分母非零、判别式合规、标准方程参数正定）。⚠️ **本行无静态门禁**：`autoRegistryFuzz.test.ts` 只覆盖"极值下无 NaN/除零/崩溃"的健壮性，**不校验课标定义域语义**，故须人工评审 | `人工评审`（健壮性部分由 `vitest:src/test/autoRegistryFuzz.test.ts` 覆盖） |
| **类型与单测** | `tsc -b` 0 错误；`npm run test` 单元测试 100% 通过 | `tsc`、`vitest` |

