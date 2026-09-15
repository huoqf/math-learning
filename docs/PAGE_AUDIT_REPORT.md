# 高中数学交互动画系统 — 逐页三屏一致性审查报告（v2 · 标准校正版）

> 审查对象：`D:\code\math\math-learning`
> 审查方式：**纯静态代码审读**（未运行页面、**未修改任何源码**）
> 覆盖范围：72 个知识节点 / **73 个页面组件**，共 10 个章节
> 证据粒度：均定位到 `文件:行号`

---

## 修订记录 v1 → v2

| # | 修订项 | 说明 |
|---|---|---|
| 1 | **校正 C4 判据标准** | v1 将「`reasoningSteps[].latex` 含数值」一律判违规，与工作区公理 2 冲突。v2 依 `AGENTS.md:34`、`:80` 重定义为**推导链三部曲**判据（见 §0.2） |
| 2 | **撤销过度定性** | 重新逐条核验后发现：**`quadratic`、`derivative-monotonicity`、`inequality-basic` 三页的定理区（`theorems`）实为纯符号**，全部数值均位于 `reasoningSteps` 的合法代入步。判定撤销（见 §2） |
| 3 | **修正一处事实误读** | v1 将 `inequalityBasic.ts:222` 的 `(-2)+(-8)=-10 < 8` 判为「硬编码缺陷」；复核后确认这是 **`warnings` 中的反例说明**（演示负数下定理失效），属正确教学表达，判定撤销 |
| 4 | **重定严重度体系** | 由 v1 的「🔴严重」单轴改为 **🔴 阻断级（教学错误 / 不同源 / 交互断裂）** 与 **🟡 规范级（纯净度 / 标注 / 残留）** 双轨，与修复路线对应 |
| 5 | **新增可执行修复方案** | 新增 §4，对第一梯队逐项给出「根因 → 方案 → 验收 → 风险」，仍**不含代码补丁** |
| 6 | 结论总数 | 🔴 **25 → 10**；🟡 39 → 54；🟢 9 不变 |
| 7 | `funcZero` 二次复核降级 | 确认 `funcZero.ts:141` 的硬编码位于 **`warnings` 反例说明**（演示 $f(-1)>0, f(3)>0$ 时二分法失效），**不影响中屏动画渲染与核心计算**，属「提示文案参数化未完全插值」→ 由 🔴 降为 🟡 规范级 |

> v1 的**证据与行号全部保留且仍属有效**——本次修订只改「定级与判据」，不改「事实」。

---

## 0. 审查标准（v2 校正版）

### 0.1 依据

`AGENTS.md` 公理 2 及其自动化门禁，是全库唯一事实源（SSOT）：

- `AGENTS.md:33` — 「左问右解闭环」：完整公式推导 100% 归位右屏 `MathPanel`；学科规范以 `.agents/skills/new-math-animation/references/right-panel-spec.md` 为 SSOT。
- `AGENTS.md:34` — **推导链三部曲（严禁孤立数字）**：「推导链必须严格遵循『① 符号表达式 → ② 代入解析式 → ③ 结果/解集』，**严禁直接跳步给出孤立数值**（如 $f_{\min} = 2.50$）；参数求解必须由充要条件列出含参不等式。」
- `AGENTS.md:80` — 门禁「推导链代数三部曲」：`reasoningSteps` 严禁**孤立数字赋值**，必须按「符号 → 解析式代入 → 结果」演绎。
- `AGENTS.md:81` — 门禁「代数表达与逻辑严谨」：**严禁代数多项式出现机器浮点尾零（如 $1.00x$）** 与未化简系数（$1x$ 必须化简为 $x$）。

**关键结论**：公理**鼓励**推导链出现「② 代入解析式」，因为那正是解题演算闭环的教学价值；公理**禁止**的是①跳步孤立数字、②机器浮点尾零。v1 的 C4 把「含数值」当成违规，**标准错位**。

### 0.2 C4 的校正：三分判据

| 字段 | v1 判定 | **v2 校正判定** | 依据 |
|---|---|---|---|
| `theorems[].latex` | 禁一切数值 | **维持：必须纯符号**（核心定理 = 普适数学模型，不得随滑块跳动） | 公理 2 表格「Theorem 定理与前提条件」+ 用户确认 |
| `reasoningSteps[].latex` | 禁一切数值 → 🔴 | **允许代入当前参数**（三部曲②）；违规**仅限以下三形态** | `AGENTS.md:34`、`:80` |
| `quantities[].symbol / .value` | 允许数值 | 允许实时数值；但 `symbol`（公式位）宜为符号串 | `AGENTS.md:33` |

**`reasoningSteps` 的三种真实违规形态**（v2 唯一的可判定红线）：

| 形态 | 描述 | 定级 |
|---|---|---|
| **① 跳步孤立数字** | 未先给出符号式，即单独抛出结果（如一步只有 `f_{\min} = 2.50`） | 🟡 规范 |
| **② 写死常数** | 数值**不随参数联动**（滑块调不动 / 恒为默认构型的常数） | 🔴 **阻断（正确性 Bug）** |
| **③ 机器浮点尾零 / 未化简系数** | `1.00x`、`-3.00`、`0.00`、`1x` | 🟡 规范（门禁 `AGENTS.md:81`） |

> 📌 **判据要点**：形态② 与形态①③ 的本质区别在于——② 会让**数学结论本身出错**，③ 只是表达不洁。v1 把三者混为一谈，是 🔴 虚高的主因。

### 0.3 严重度定义（v2）

| 等级 | 判据 | 含义 |
|---|---|---|
| 🔴 **阻断级** | 导致学生学到**错误数学结论**，或**功能不可用 / 关键三屏联动断裂** | 第一梯队，立即修 |
| 🟡 **规范级** | 不改变数学结论，但违反纯净度/一致性规范（定理数值化、尾零、临界漏标、残留参数、默认值不一致） | 第二梯队，分批治理 |
| 🟢 **合规** | 未发现问题 | 可作整改样板 |

---

## 1. 总体结论（v2 重评）

| 结论 | 页数 | 占比 |
|---|---|---|
| 🔴 阻断级 | **10** | 14% |
| 🟡 规范级 | **54** | 74% |
| 🟢 合规 | **9** | 12% |

**🔴 阻断级 10 页**：
`inequalityAbsolute`、`funcProperties/SymmetryPage`、`vectorDotProduct`、`line-circle`、`parabola`、`conicParam`、`solidGeometry/SpatialAngleAnimation`、`solidGeometry/SpatialDistanceAnimation`、`CircumInSphereAnimation`、`PolyhedronCircumSphereAnimation`

> `SpatialDistanceAnimation` 为 v2 新增识别，建议纳入运行复核；`funcZero` 经二次复核降为 🟡（见修订记录 #7）。

**9 个 🟢 页面**：`set/SetQuantifiersPage`、`trigIdentity`、`trigFormulas`、`triangleExtrema`、`vectorBasis`、`complex`、`second-derivative`、`derivative-endpoint-taylor`、`solidGeometry/SurfaceRelationAnimation`。

**一句话总评**：左屏声明式参数体系（`paramMeta → ParamControl`）落地扎实——**全项目 73 个页面无一处手写 `<input type="range">`**，模式依赖数组也基本完整。真正的风险集中且明确：**10 页阻断级硬伤**（多数是「中屏与右屏各自判定 / 参数键错配 / 写死常数」），以及**规范级的定理区数值化与浮点尾零**。

---

## 2. v1 → v2 定级变更清单（被撤销的过度判定）

| 页面 | v1 | v2 | 变更理由（复核证据） |
|---|---|---|---|
| `quadratic/QuadraticAnimation` | 🔴 | 🟡 规范 | **复核确认定理区已符号化**：`quadratic.ts:160,328,515` 三处 `theorems.push` 的 latex 全为 `ax^2+bx+c>0`、`\Delta=b^2-4ac`、`x_1+x_2=-\frac{b}{a}` 等纯符号式。v1 引用的 `:201,208,215`（配方）与 `:370,395,550,562,569,579`（判别式/韦达）**全部位于 `reasoningSteps`**，属三部曲②③的合法代入。真实缺陷降为：`.toFixed(2)` 尾零 + `:510` `value` 内 `$$` |
| `derivative-monotonicity` | 🔴 | 🟡 规范 | **复核确认定理区符号化**：`derivativeMonotonicity.ts:268,296,325` 的定理为「导数与单调性判定定理」「极值点第一充分条件」等符号式。v1 引用的 `:170,204,226-231` 全在 `reasoningSteps`（`:158-235`），且 `:155-156` 本身备有符号兜底 `y - f(x_0) = f'(x_0)(x-x_0)`。仅余尾零 `1.00`/`-2.00` 属规范问题 |
| `inequalityBasic` | 🔴 | 🟡 规范 | **事实纠正**：v1 所指 `:222` 为 `warnings[].text` 中的**反例说明**「若 a,b 含负数则不等式不成立，如 $(-2)+(-8)=-10 < 8$」——这是正确且必要教学表达，**非硬编码缺陷**，判定撤销。真实缺陷仅剩 `registries:27-54` 的 marks 依赖另一参数当前值 |
| `funcExpLog/ExponentialPage` | 🔴 | 🟡 规范 | 推演数值撤销；真实缺陷为 `:50-89` 手写参数数组未走 `paramMeta`（架构一致性） |
| `funcExpLog/LogarithmicPage` | 🔴 | 🟡 规范 | 推演数值撤销；真实缺陷为 `:84` 文案术语错误（对数页写"指数函数"） |
| `derivative/TranscendentalAnimation` 等 4 页 | 🟡 | 🟡 规范 | 等级不变，但**移除「公式数值化」表述**，改注为「左屏 marks 覆写丢失 critical」等真实问题 |
| `funcZero/FuncZeroAnimation` | 🔴 | 🟡 规范 | **二次复核降级**：`funcZero.ts:141` 的硬编码位于 `warnings` 反例文案，不影响中屏渲染与核心计算，属提示文案未参数化插值 |

**撤销的判定共 3 页整体降级 + 5 页部分条目撤销。** 涉及 `builders` 约 100 余处 `reasoningSteps` 数值，**全部不再视为违规**。

---

## 3. 系统性问题（v2）

### P0-A 阻断级硬伤（10 页，详见 §4 方案）

| # | 页面 | 硬伤 | 证据 |
|---|---|---|---|
| A1 | `inequalityAbsolute` | **教学导引卡整体消失** | `InequalityAbsoluteAnimation.tsx:104` 拼出 `triangle-free`，而 `scenarios.ts:183` 声明为 `tri-free` → `tipProps` 为 null |
| A2 | `vectorDotProduct` | 中屏/右屏**各自判定**几何模型 | `builders/vectorDotProduct.ts:17-23`（builder 内推 `usePolarGeom`）vs `VectorDotProductScene.tsx:36`（吃原始 params） |
| A3 | `funcProperties/SymmetryPage` | 中屏图形与右屏残差**两套函数** | `PropertiesScene.tsx:52-72`（自建 `0.5(x-a)^2-1.5`）vs `builders/funcProperties.ts:22-39`（母函数 `x*x`） |
| A4 | `solidGeometry/SpatialAngleAnimation` | 距离模式右屏**错显体积极值** | `:36` `AngleMode` 含 `"distance"` → `:118` 传 `mode:"distance"`，但 `solidSpatialDistance.ts:22,38,245` 只认 `skewDistance`/`pointPlaneDistance` → 落 `else` |
| A5 | `line-circle` | midpoint 模式**滑块调不动弦** | 左屏暴露 `mx/my`（`:209-213`），`builders/lineCircle.ts:297-302` 与 `math/lineCircle.ts:258,261` 仍读 `k/m` |
| A6 | `conicParam` | 合振幅**写死为 5**，与可调 a、b 矛盾 | `builders/conicParam.ts:99,100,106`（`\sqrt{16+9}=5`），而 `registries/conicParam.ts:130-141` a、b 可调 |
| A7 | `parabola` | 公式**重复拼接** + 仅对向右开口成立 | `:197-208`（`focalRadiusFormula` 自带 `\|PF\| =` 前缀被二次拼接）；`:276,285,345,352` 方向写死 |
| A8 | `CircumInSphereAnimation` | 右屏**缺失整块推演链** | `:737-742` 未传 `reasoningSteps`，而 `solidCircumSphere.ts:40,837` 已产出 |
| A9 | `PolyhedronCircumSphereAnimation` | 右屏**缺失整块推演链** | `:605-610` 未传 `reasoningSteps`，而 `solidPolyhedronSphere.ts:35,531` 已产出 |
| A10 | `solidGeometry/SpatialDistanceAnimation` | 「正方体」判定中/右屏不同源 | `:198`（认 preset）vs `solidSpatialDistance.ts:41-42`（按 `a≈b≈c` 自动判定） |

### P1-B 定理区数值化（真违规，但非阻断 → 第二梯队）

`theorems[].latex` 不得内嵌当前数值——此项 v1 判定**正确**，保留：

- `builders/derivative.ts:143,152` — 两条定理为数值点斜式/斜截式 `y - 2.00 = 3.00(x - 1.00)`（源 `math/derivative.ts:96,169`）
- `builders/quadratic.ts` — 定理区已合规（见 §2）
- `builders/probabilityBayes.ts:568` — 通项定理 `p_n=0.318-0.682·(0.50)^{n-1}`，符号兜底 `:570` 永不生效
- `builders/pairedData.ts:56` — 回归定理 `\hat y=2.35·e^{0.61x}`（源 `math/pairedData.ts:294`）
- `builders/pairedData.ts:280,290,325,334,349` — χ² 定理写入实测统计量
- `builders/solidAdvancedSphere.ts:313-314` — 定理固定近似值
- `builders/solidSpatialAngle.ts:197,420` / `solidSpatialDistance.ts:191` 等 — 定理/近似值

**建议**：确立硬规则「`theorems[].latex` 只承载符号模型」；`reasoningSteps` **不受此限**（仅受 §0.2 三形态约束）。可扩展 `src/test/syncContract.test.ts` 做自动护栏。

### P1-C 格式门禁（第二梯队）

- **机器浮点尾零** `.00`：`builders/quadratic.ts`（`:201,208,215,370,379,395,550,562,569,579`）、`derivativeMonotonicity.ts:229` 等，**近乎全库 builder 通病** → 违反 `AGENTS.md:81`，须统一走 `formatMathNumber`
- **LaTeX 混入 Markdown `$`**：`builders/quadratic.ts:510`（`value` 内 `$${solutionText}$`）、`conicLine.ts:480`、`funcTransform.ts:83-87`
- **emoji 入看板**：`builders/funcComposite.ts:60-65,173-176`

### P1-D 参数同步与临界标注（第二梯队）

- 改参后预设高亮丢失：`nike/StandardPage.tsx:77`、`AmgmPage.tsx:80`、`ShiftedPage.tsx:93`（`setPreset("free")` 但无 `free` 项）
- 子模式切换不重置非法参数：`funcProperties/SymmetryPage.tsx:217`（仅改 `subMode`，`fnType` 残留 `cubic`）
- 隐藏参数越界：`LinePlaneRelationAnimation.tsx:88`（`zHeight:0` < min 0.5）、`SectionCuboidDemo.tsx:181`（`posR:0.05` < min 0.1）、`Vector3DBasisAnimation.tsx:181-187`（共面锁定 z 越界）
- 临界漏标：`registries/trigTangent.ts:13-24`（θ 的 ±π/2）、`sequence.ts:179-195`（d=0）、`:208`（q=-1）、`inequalityAbsolute.ts:30,44`（a=0/b=0）
- 临界**不可达**（mark 值被 ParamControl 量程过滤）：`registries/trigTangent.ts:55-61`、`transform.ts:38-44`（ω=0 低于 min）
- 临界**误标**：`registries/nike.ts:61-68,80-87`（h/c 非退化）、`statPercentile.ts:186-192`（p=50 为中位数）、`derivativeShift.ts:229-236`（a=2.0 为默认值）
- 临界**用固定值标注动态关系**：`triangleSolve.ts:74-80`（4.33）、`conicDefinition.ts:30-56`、`conicLine.ts:423-435`

### P1-E 元数据与残留（第二梯队）

- `registries.defaultValue` 与 `defaultParams` 不一致：`sequence.ts:157,173,261`、`lineEquation.ts:20-21`、`derivative.ts:31`、`solidGeometry.ts:5-15`、`vector3d.ts:6-8`（**三方不一致**）、`funcExpLog.ts:25`
- 残留/死参数：`conicLine.ts:5-6`、`solidGeometry.ts:53-62,74`、`vector3d.ts:94-125`、`pairedData.ts:24` 等

---

## 4. 第一梯队修复方案（逐项可执行 · 不含代码补丁）

> **执行状态：T1-1 ~ T1-8 已全部落地**（`tsc -b` 0 错误、105 文件 / 1016 用例全通过、`audit:strict` 增量违规 0）。
> 逐项根因、实际改动、验收结论与验证矩阵见 → [docs/PAGE_AUDIT_FIX_REPORT.md](./PAGE_AUDIT_FIX_REPORT.md)。
> 其中 T1-2 落地时对方案做了一处实质增强（见该报告 §1 T1-2「与报告原方案的偏差」）。

> 原则：每项均给出**根因**，方案优先消除「同一事实两处判定」而非打补丁。实施前建议先运行复核。

### T1-1 `inequalityAbsolute` 教学导引卡消失 — A1

- **证据**：`InequalityAbsoluteAnimation.tsx:104` `const freeId = \`${studyMode}-free\``；`scenarios.ts` 该组 id 为 `tri-same-sign:161` / `tri-diff-sign:172` / `tri-free:183`
- **根因**：自由情景 id 由**字符串拼接**合成，与 `ScenarioSpec` 声明的 id 词汇表脱钩（违反公理 1 SSOT）。其余三组的前缀（`single-*:23`、`sum-*:68`、`diff-*:114`）恰与 mode 名一致，**故 4 个模式中只有 triangle 组断裂**——潜伏 bug
- **方案**：**删除拼接**，改为结构性查找。已验证 4 组的 free 项是各自唯一无 `presetParams` 者（`:57,103,149,183`），故 `const free = currentScenarios.find(s => !s.presetParams); if (free) setScenarioKey(free.id);`。更彻底：为 `ScenarioSpec` 增加 `isFree?: boolean`，或由 `useScenario` 暴露 `freeSpec`
- **验收**：4 个模式分别拖动任一滑块后，TipCard 立即切至该组「自由参数探索」文案，SelectGrid 高亮不丢
- **风险**：低

### T1-2 `vectorDotProduct` 中屏右屏不同源 — A2

- **证据**：`builders/vectorDotProduct.ts:17-23`（builder 内推导 `usePolarGeom`）；`VectorDotProductScene.tsx:36`（`computeVectorDotProduct(params)` 吃原始参数）；页面 `:228` 传 `{studyMode}`；`:271` 又独立算一次；`math/vectorDotProduct.ts:64,85`（内核确有该开关）；`registries/vectorDotProduct.ts` 无该键
- **根因**：派生开关 `usePolarGeom` 落在**数据层（builder）**而非页面的单一出口 → 同一事实被三处各自判定
- **方案**：页面新增 `effectiveParams = useMemo(() => ({ ...params, usePolarGeom: studyMode === "defProj" }), [params, studyMode])`，**同一对象**同时喂给 `VectorDotProductScene`、`buildMathQuantities`、`topFormulaLatex`；同时删除 builder 的 `??` 启发式，改为只读 `params.usePolarGeom`
- **验收**：`defProj` + 「正交垂直构型」预设下，中屏夹角 = 90°、投影垂足与原点重合，与右屏 $\vec a \cdot \vec b = 0$ 一致
- **风险**：中（须回归 `properties`/`polarization` 两模式构型仍正确）

### T1-3 `SymmetryPage` 图形与残差两套函数 — A3

- **证据**：`PropertiesScene.tsx:52-72` 自建 `0.5(x-axisA)^2-1.5`（axis）/ `0.3(x-centerX)^3+centerY`（center）；`builders/funcProperties.ts:22-39` 的 `getFn` 无论 mode 一律 `x*x / \|x\| / sin x`；残差经 `evalAxisSymmetry`（`:658-673`、`:699-707`）计算
- **根因**：对称母函数在两个文件各写一份，无共享构造器
- **方案**：在 `src/math/function.ts` 抽出唯一 `createSymmetryFn({ fnType, subMode, axisA, centerX, centerY })`（返回 `(x) => number`），Scene 与 builder 均引用；builder 的通用 `getFn` 仅保留 parity/domain 分支
- **验收**：`symmetry/axis` 下 $\Delta y$ 恒为 0（$f(x_0) = f(2a - x_0)$），图形与看板同时成立；`center` 子模式同理
- **风险**：中（须同步核查 `PropertiesSymmetryScene.tsx` 是否另有实现）

### T1-4 `SpatialAngleAnimation` mode 键错 — A4

- **证据**：`:36` `AngleMode = "skewLines" \| "linePlane" \| "dihedral" \| "distance"`；`:118` 传 `mode: activeMode`；`solidSpatialDistance.ts:22` 取 `config.mode ?? "skewDistance"`，仅 `:38`/`:245` 两个分支
- **根因**：页面用「交互模式」词表、builder 用「距离模型」词表，**两套枚举描述同一对象**
- **方案**：数据层导出唯一 `type SpatialDistanceMode = "skewDistance" \| "pointPlaneDistance"`；页面在 distance 模式下显式映射为 `"pointPlaneDistance"`（其 `DistanceModeScene` 走 `solvePointToPlaneDistance`，`:108`），弃用 `"distance"` 字面量
- **验收**：切入第 4 模式，右屏标题为「点到平面距离与体积极值高考看板」（`:797`）且数值与中屏 `distanceData` 同源
- **风险**：低

### T1-5 `line-circle` midpoint 参数错配 — A5

- **证据**：`LineCircleAnimation.tsx:209-213` midpoint 仅暴露 `mx/my/r`；`builders/lineCircle.ts:297-302` 用 `k`；`math/lineCircle.ts:258,261` 由 `k,m` 构造 `A=k, B=-1, C=m`
- **根因**：midpoint 的驱动量 $(M, r)$ 未被转换为内核所需的直线 $(k, m)$，内核仍以 $k,m$ 为主参
- **方案（垂径定理路，数学自洽）**：由圆心 $C(a,b)$ 与弦中点 $M(m_x,m_y)$ 得 $k = -\dfrac{m_x - a}{m_y - b}$（$CM \perp$ 弦），$m = m_y - k\,m_x$；页面在喂给 `buildMathQuantities` 前补全 `k,m`。**须单独处理 $m_y \approx b$ 的退化分支**（弦竖直、斜率不存在），同步补 warning。备选：内核改以 $(m_x, m_y, r)$ 直算弦，`k` 仅供展示
- **验收**：拖动 `mx/my` 时弦线实时移动，且 $k_{CH} \cdot k_{AB} = -1$（`:304-307`）
- **风险**：中高（斜率不存在分支必须处理，否则退化构型崩溃）

### T1-6 `conicParam` 写死合振幅 — A6

- **证据**：`builders/conicParam.ts:99` `\frac{|5\sin(\theta+\varphi)-6|}{\sqrt2}`；`:100` `\sqrt{16+9}=5`；`:106` `|5(1)-6|/\sqrt2`
- **根因**：辅助角振幅 $R=\sqrt{(Aa)^2+(Bb)^2}$ 被**离线算成默认构型 $(a{=}4,b{=}3)$ 的常数**写进字符串
- **方案**：改为实时 `R = Math.hypot(A*a, B*b)`；第一步符号区写 `\sqrt{(Aa)^2+(Bb)^2}`，数值仅出现在第二/三步代入处（符合三部曲）
- **验收**：拖动 $a$ 或 $b$，第二步 $R$ 与第三步 $d_{\min}/d_{\max}$ 同步变化
- **风险**：低

### T1-7 `parabola` 重复拼接与开向 — A7

- **证据**：`:197-201` `focalRadiusFormula` 自带 `"|PF| = "` 前缀；`:208` 再拼 `|PF| = d(P, l) = ${focalRadiusFormula}`；`:276,285,345,352` 方向写死
- **根因**：模板串**重复承载标签**；且未复用 `math/parabola.ts:168-174` 已具备的方向感知结果
- **方案**：`focalRadiusFormula` 只存右端（`x_0 + \frac{p}{2}` 等）；`:276/285/345/352` 按 `direction` 分支生成，或直接引用 math 层方向感知产物
- **验收**：4 个开向切换后，右屏 4 处公式与左屏开口方向一致，且无重复 `|PF| =`
- **风险**：低

### T1-8 外接球两页缺失推演链 — A8 / A9

- **证据**：`CircumInSphereAnimation.tsx:737-742`、`PolyhedronCircumSphereAnimation.tsx:605-610` 的 `<MathPanel>` 无 `reasoningSteps`；`solidCircumSphere.ts:40,837`、`solidPolyhedronSphere.ts:35,531` 已返回
- **根因**：右屏 props 未与 `MathPanelData` 全字段对齐，**缺字段被静默丢弃**
- **方案**：补 `reasoningSteps={mathData.reasoningSteps}`；建议 `<MathPanel>` 改用 `{...mathData}` 展开或令字段 required，从类型层面杜绝再漏
- **验收**：两页右屏出现推演链区块
- **风险**：低

### T1-9（待复核）`SpatialDistanceAnimation` 正方体判定不同源 — A10

- **证据**：`SpatialDistanceAnimation.tsx:198`（认 preset）vs `solidSpatialDistance.ts:41-42`（按 `a \approx b \approx c` 自动判定）
- **方案**：统一判定函数——页面算出 `isCube` 后写入 `config`，builder 只读，避免同一事实两处各判一次
- **前置**：**建议先在浏览器运行确认**，再决定是否纳入第一梯队
- 附：`builders/funcZero.ts:141` 的端点未插值已另行归入 🟡 规范级（见 §2），不属阻断级

---

## 5. 逐页明细（v2 重评）

> 标注说明：~~删除线~~ = v1 判定已撤销；`→` 表示定级变更。

### 第 1 章 集合与常用逻辑

| 页面 | v2 | 主要发现（证据） | 建议 |
|---|---|---|---|
| `set/SetVennPage` | 🟡 | `builders/set.ts:105` 考点、`:124` 口诀为量词主题（跨知识点残留） | 按 `animId` 分流 |
| `set/SetLogicPage` | 🟡 | `mathQuantities.ts:147-148` 与 Venn 页共用 `buildSetPanel`，`config` 被丢弃 | 建独立 builder |
| `set/SetQuantifiersPage` | 🟢 | 仅文案风格小瑕疵 `:192,196` | 统一公式包裹 |

### 第 2 章 不等式

| 页面 | v2 | 主要发现 | 建议 |
|---|---|---|---|
| `inequalityBasic` | ~~🔴~~ → 🟡 | ~~推演 latex 含 `= 4.0`~~（**撤销**，属三部曲②）；~~`:222` 硬编码~~（**撤销**，实为 `warnings` 反例说明）；真实缺陷：`registries:27-54` marks 依赖另一参数当前值 | mark 改静态/动态声明 |
| `inequalityAbsolute` | 🔴 | `:104` `freeId` 与 `scenarios.ts:183` `tri-free` 不匹配 → **导引卡消失**；`registries:30,44` a=0/b=0 无 critical | 见 T1-1 |
| `nike/StandardPage` | 🟡 | `:77` 预设高亮丢失；`registries/nike.ts:61-68,80-87` h/c 误标 critical | 补 `free` 项；改 recommended |
| `nike/AmgmPage` | 🟡 | `:80` 预设不同步；`:53-75` 覆写量程丢弃 marks | 量程并入注册表 |
| `nike/ShiftedPage` | 🟡 | `:93` 预设不同步 | 同上 |

### 第 3 章 函数概念与性质

| 页面 | v2 | 主要发现 | 建议 |
|---|---|---|---|
| `funcProperties/DomainPage` | 🟡 | ~~探针数值入 latex~~（**撤销**）；真实缺陷：`registries:57,70` 左屏标签不随模式更新 | 标签符号化 |
| `funcProperties/ParityPage` | 🟡 | ~~割线斜率 `k=1.50` 入 latex~~（**撤销**） | — |
| `funcProperties/SymmetryPage` | 🔴 | **中右屏两套函数**（`PropertiesScene.tsx:52-72` vs `builders:22-39`）→ 残差自相矛盾；`:217` 切子模式不重置 `fnType` | 见 T1-3 |
| `funcExpLog/ExponentialPage` | ~~🔴~~ → 🟡 | ~~`builders:740,747` 数值~~（**撤销**）；真实缺陷：`:50-89` 手写参数数组未走 `paramMeta` | 改 `Object.entries(paramMeta)` |
| `funcExpLog/LogarithmicPage` | ~~🔴~~ → 🟡 | ~~`builders:674,684` 数值~~（**撤销**）；真实缺陷：`:84` 文案"非指数函数"应为对数 | 修文案 |
| `funcExpLog/PowerPage` | 🟡 | `registries:39-61` `powerAlpha` 不可调，marks 形同虚设 | 删除或启用 |
| `funcZero/FuncZeroAnimation` | ~~🔴~~ → 🟡 | `:141` `warnings` 反例文案端点未参数化插值（仅 `a=-1,b=3` 成立）；**不影响动画渲染与核心计算** | 文案端点改由 `params` 派生 |
| `transform/TransformAnimation` | ~~🔴~~ → 🟡 | `builders:83-87` Markdown `$` 混入 latex（渲染瑕疵）；`registries:38-44` ω=0 critical 不可达 | 母函数名符号化 |
| `composite/CompositeAnimation` | 🟡 | `registries:116-119` innerC critical 依赖 innerB | mark 动态化 |
| `quadratic/QuadraticAnimation` | ~~🔴~~ → 🟡 | **定理区已合规**（`:160,328,515` 全符号）；真实缺陷：`.toFixed(2)` 尾零 + `:510` `value` 内 `$$` | 走 `formatMathNumber` |

### 第 4 章 三角函数与解三角形

| 页面 | v2 | 主要发现 | 建议 |
|---|---|---|---|
| `trigLines` | 🟡 | `builders/trigLines.ts:301` 定理 latex 为不等式解集；`registries:10-11` 无 UI 恒为 1 | 解集移入 quantities |
| `trigIdentity` | 🟢 | 仅 `:201` 中屏夹角含 θ 数值 | 可选优化 |
| `trigFormulas` | 🟢 | 仅 `builders:154` `\pi≈3.142` 位置 | 字段归位 |
| `trigTangent` | 🟡 | `registries:13-24` θ 的 ±π/2 无 critical；`:55-61` ω=0 越界被过滤 | 补 θ 临界 |
| `trigTransform` | 🟡 | `:188,195,211` TipCard 直接插值 `${phi}` 渲染出 `1.0471975511965976` | 用 `formatPiValue` |
| `triangleSolve` | 🟡 | `registries:74-80` a 的临界写死 4.33 | 动态生成 |
| `triangleExtrema` | 🟢 | 依赖数组、临界、符号 latex 均正确 | — |

### 第 5 章 平面向量与复数

| 页面 | v2 | 主要发现 | 建议 |
|---|---|---|---|
| `vectorLinear` | 🟡 | xa/ya/xb/yb 无共线退化（det=0）critical | 补说明型 mark |
| `vectorDotProduct` | 🔴 | **中右屏不同源**（`builders:17-23` vs `VectorDotProductScene.tsx:36`）；注册表无 `usePolarGeom` | 见 T1-2 |
| `vectorBasis` | 🟢 | 参数受控、临界齐备、符号 latex | — |
| `vectorPolarizationApollonius` | 🟡 | ~~`builders:97,160,167,174,197,278,289,300` 推演数值~~（**撤销**，theorems 干净） | — |
| `complex` | 🟢 | 仅 `registries:103-107` deg1 marks 无 variant | 可选补 |

### 第 6 章 数列

| 页面 | v2 | 主要发现 | 建议 |
|---|---|---|---|
| `sequence/ArithmeticPage` | 🟡 | `registries:179-195` d=0 无 critical；`:157,173,261` defaultValue 不一致 | 补 critical；对齐默认值 |
| `sequence/GeometricPage` | 🟡 | `registries:208` q=-1 无 critical | 补 critical |
| `sequence/RecurrencePage` | 🔴 | `:45-52` 累积模型 `stepParam` 在"裂项"子型无效（参数无效）；`registries:349-359` a2 无 marks；~~通项 latex 数值~~（**撤销**） | 隐藏无效参数 |
| `sequence/ModelsPage` | 🟡 | ~~`:591` 分段求和数值~~（**撤销**）；`:276-277,310-311` `sumStep/teleGap` 未入 paramMeta | 参数入注册表 |

### 第 7 章 导数及其应用

| 页面 | v2 | 主要发现 | 建议 |
|---|---|---|---|
| `derivative/DerivativeAnimation` | 🟡 | **定理区**数值式点斜/斜截（`builders:143,152`，源 `math/derivative.ts:96,169`）；`registries:31` dx 不一致 | 定理符号化 |
| `derivative-monotonicity` | ~~🔴~~ → 🟡 | **定理区已合规**（`:268,296,325` 全符号）；`:155-156` 备有符号兜底；仅尾零 `1.00`/`-2.00` | 走 `formatMathNumber` |
| `second-derivative` | 🟢 | theorems 全符号、依赖完整、a=0 critical | — |
| `derivative-endpoint-taylor` | 🟢 | 符号化良好、依赖含各模式 | — |
| `constant/SingleVarPage` | 🟡 | ~~推演数值~~（**撤销**）；theorems 干净 | — |
| `constant/DoubleVarPage` | 🟡 | ~~`builders:337-510` 数值~~（**撤销**），theorems 干净 | — |
| `derivativeShift` | 🟡 | `registries:229-236` a=2.0 伪 critical | 去伪 critical |
| `derivativeTranscendental` | 🟡 | `:176-179,94-98` 左屏覆写 marks 时丢失 critical 变体 | 复用 registry marks |
| `derivativeTangentScaling` | 🟡 | ~~割线数值~~（**撤销**）；左屏 mode 同步到位 | — |

### 第 8 章 平面解析几何

| 页面 | v2 | 主要发现 | 建议 |
|---|---|---|---|
| `lineEquation` | 🟡 | `registries:20-21` vs `:137,148` 默认值不一致；`forms` 模式预设分支死代码 | 对齐默认值 |
| `line-circle` | 🔴 | **midpoint 参数错配**（左屏 `mx/my` `:209-213` vs 内核 `k/m` `math/lineCircle.ts:258,261`）→ 滑块失效；预设不按 mode 过滤；跨模式常推定理 | 见 T1-5 |
| `circle-circle` | 🟡 | `meta.ts:10` 情景 condition 写死数值，改参后相离仍称"相交"；无临界标注 | condition 由 params 插值 |
| `conicDefinition` | 🟡 | `registries:30-56` a/c 互标固定 critical；a/c 无互钳制 | 改动态 warning |
| `conicProperties` | 🟡 | `registries:51-64` e 的 marks 无 variant | 补 critical |
| `parabola` | 🔴 | **4 处公式仅对向右开口成立**（`:276,285,345,352`）；`:197-208` 重复拼接；`p` critical 标在 0.5 非真退化；`tP` 上限未随 p 收紧 | 见 T1-7 |
| `conicLine` | 🟡 | `builders:251` 抛物线分支弦长误写 `\sqrt{1+k^2}`（应为 `\sqrt{1+1/k^2}`）；`:480` latex 混 `$`；`:5-6` 残留索引参数 | 分支修正 |
| `conicParam` | 🔴 | `builders:99,100,106` **合振幅恒写 5**，而 a、b 可调 | 见 T1-6 |
| `conicParamT` | 🟡 | `registries:63-66` α=90° 无 critical | 补 critical |
| `conicHomogenization` | 🟡 | `builders:75,83,93,101,115` `symbol` 位内嵌数值；`registries:87-89` 顶点写死 ±2.5 | symbol 还原符号串 |
| `parabolaArchimedes` | 🟡 | ~~`:371,384,423,431` 数值~~（**撤销**，theorems 干净）；`:137-147` 未透传 `description/importance` | 补元数据 |

### 第 9 章 立体几何与空间向量

| 页面 | v2 | 主要发现 | 建议 |
|---|---|---|---|
| `RotationBodyAnimation` | 🟡 | `:155` 传 mode 但 builder 不用（`solidRotationBody.ts:16-19`）；cutDistance 不随 R 收缩 | builder 加 mode 分支 |
| `LinePlaneRelationAnimation` | 🟡 | `:88` 写入 `zHeight:0` < min 0.5；`registries:5-15` 缺 pyramid*；`:287` 垂直模式左屏恒空 | 对齐注册表 |
| `SurfaceRelationAnimation` | 🟢 | 参数/临界/符号 latex 均合规 | — |
| `FoldingAnimation` | 🟡 | `:58` 中屏 α=0 vs `:76` 右屏用原始 90（左右中不同步）；拖拽值域可低于 min | 用同一 `alphaDeg` |
| `SpatialAngleAnimation` | 🔴 | `:36` `AngleMode` 含 `"distance"` → `:118` 传入，builder 只认 `skewDistance`/`pointPlaneDistance` → 落 else 错显"体积极值" | 见 T1-4 |
| `SpatialDistanceAnimation` | 🔴 | **正方体判定不同源**（`:198` vs `solidSpatialDistance.ts:41-42`）；~~推演数值~~（**撤销**）；每步 rubric 均为"（4分）" | 见 T1-9 |
| `ParametricPointAnimation` | ~~🔴~~ → 🟡 | ~~推演数值~~（**撤销**）；`:199-205` 拖拽未 clamp 可写负值 | 加 clamp |
| `CircumInSphereAnimation` | 🔴 | **未传 `reasoningSteps`**（`:737-742`）；`:196-219` 预设联动只生效一次；~~推演数值~~（**撤销**） | 见 T1-8 |
| `PolyhedronCircumSphereAnimation` | 🔴 | **未传 `reasoningSteps`**（`:605-610`）；`:436-453` "柱体模型"不可达 | 见 T1-8 |
| `AdvancedSphereAnimation` | ~~🔴~~ → 🟡 | **定理区**固定近似值（`solidAdvancedSphere.ts:313-314`）；`shapeType` 无 ParamMeta；`:74` `alpha` 残留 | 定理符号化；补控件 |
| `vector3d/Vector3DBasisAnimation` | 🟡 | 三方默认值不一致（`registries:6-8`/页面 `:57-59`/`builders:140-142`）；重心 mark 0.33 与 step 0.1 不可命中；共面锁定 z 越界 | 对齐默认值 |
| `section/SectionCuboidDemo` | ~~🔴~~ → 🟡 | `:181` 预设 0.05 越界；extrema 模式隐藏参数仍可拖拽；`registries:53-62` 残留参数 | 收敛参数可见性 |

### 第 10 章 概率与统计

| 页面 | v2 | 主要发现 | 建议 |
|---|---|---|---|
| `probabilityCounting` | 🟡 | `registries:148-162` 允许非整除组合，`math:434-435` 静默改写 N → 左右屏不一致；`k` 上限恒 10 不与 n 联动 | 只暴露整除组合 |
| `probabilityBayes` | ~~🔴~~ → 🟡 | **定理** latex = `p_n=0.318-0.682·(0.50)^{n-1}`（`:568`）；free 模式文案张冠李戴（`:78`/`builders:492,587`） | latex 只留符号通项 |
| `probabilityDistribution` | 🟡 | `registries:158-178` p₁~p₃ 无 Σ≤1 约束，`modeConfig.ts:93-94` 静默归一；决策场景切换不复位 `decisionParam` | 加和约束 |
| `statPercentile` | 🟡 | `math/statPercentile.ts:269-271` 对空层强制 1，与定理 `\sum n_i=n` 矛盾；`:186-192` p=50 误标 critical | 空层不强制 ≥1 |
| `probabilityNormal` | 🟡 | `:175-187` x₁/x₂ 未进左屏且 builder 不用；`builders:244` "(μ-σ,μ+σ) 内曲线上升"表述有误 | 补滑块；修表述 |
| `pairedData/RegressionPage` | ~~🔴~~ → 🟡 | **定理** latex = `\hat y=2.35·e^{0.61x}`（`:56`）；隐藏 `meanShiftY` 恒被累加（`:92` vs `:213-235`） | latex 符号化；参数复位 |
| `pairedData/IndependencePage` | ~~🔴~~ → 🟡 | **定理** latex 写入 χ² 实测值（`:280,290,325,334,349`）；`registries:24` 残留 `displayMode`；`:269` 硬编码预设下标 | latex 保留纯符号式 |

---

## 6. 修复优先级（v2 路线）

**第一梯队（🔴 阻断级，立即修）** — 见 §4：T1-1 ~ T1-8（9 页），T1-9 待运行复核后纳入
**第二梯队（🟡 规范级，分三批）**
1. **定理区符号化**：`derivative`、`probabilityBayes`、`pairedData`×2、`AdvancedSphere` 等（§3 P1-B），并扩展 `syncContract.test.ts` 护栏
2. **格式门禁**：全库 `.toFixed(2)` 尾零 → `formatMathNumber`；清理 `$$` 混入与 emoji（§3 P1-C）
3. **参数同步/临界/元数据**：nike 预设、`defaultParams` 对齐、critical 补漏与误标清理（§3 P1-D/E）

**第三梯队（P2，内容与清理）**
4. 右屏跨知识点文案分流（`set`、`SetLogicPage`、`trigTransform`、`probabilityBayes` free）
5. 残留参数与死代码清理、元数据透传补全

---

## 7. 附录：已确认的良好实践（建议保持）

- **左屏声明式体系**：73 个页面全部走 `paramMeta → paramConfigs → <ParamControl>`，无一处手写 `<input type="range">`（`type="range"` 仅见于共用件 `components/UI/Slider.tsx:84`、`ParamControl.tsx:445`）
- **推导链三部曲落实**：多数 builder 的 `reasoningSteps` 已按"符号 → 代入 → 结果"演绎，`quadratic`（`:197-219,366-399,546-591`）、`derivativeMonotonicity`（`:158-235`）结构规范，**可作推导链样板**
- **模式依赖数组**：绝大多数页面两处 `useMemo` 均已含 mode 变量
- **完全合规的 🟢 页面（9 个）**：`set/SetQuantifiersPage`、`trigIdentity`、`trigFormulas`、`triangleExtrema`、`vectorBasis`、`complex`、`second-derivative`、`derivative-endpoint-taylor`、`solidGeometry/SurfaceRelationAnimation`
- **数学正确性抽查**：二次函数解集分类讨论（含 a=0 退化）、χ² 临界值 2.706/3.841/6.635/10.828、3σ 数据 68.27/95.45/99.73、正态 μ±σ 高度比 60.65%、`b̂=L_xy/L_xx`、`T=2|a-b|`/`4|a-b|`、抛物线弓形 `S△QAB=|y₁-y₂|³/(8p)` 均经核对正确

> ⚠️ 本报告基于静态代码审读。🔴 阻断级结论建议逐条在浏览器运行复核，尤其是「中屏与右屏不同源」类需肉眼确认渲染结果。
