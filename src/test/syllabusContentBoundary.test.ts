/**
 * 分册 × 内容拓扑红线门禁 (Syllabus Content Boundary Gate) —— v2
 *
 * 铁律：高一必修一（函数概念与性质 / 三角函数 / 数列前置）页面严禁出现高二选择性必修二
 * （导数及其应用）的专属求导运算、点斜式切线方程与导数压轴通法。
 *
 * ── v1 为什么形同虚设（本轮复查实测，逐条修正） ──
 *
 * 1) **记号线是复合短语，真实文案里根本不出现**：
 *    v1 的 `/导数切线/`、`/求导判号/`、`/点斜式展开/`、`/对数函数导函数/`、`/指数函数导函数/`
 *    在真实 builder 输出中永不成立 —— 是死条件。而 §六 真正要求的 `导函数`/`求导`/
 *    `切线方程`/`切线斜率`/`相切临界`/`切线放缩` 等词根却一条都没写。
 *    ⇒ v2 每条记号线都必须配一个 `mustMatch` 正样本，缺失即红灯（测试「记号线自检」）。
 *
 * 2) **恒传空 `params` + 空 `config`**：
 *    `buildMathQuantities(node.animationIds[0], {}, {})` 有两个后果——
 *    (a) 只走默认分支：如 `anim-func-zero` 的 `modelKey` 是 **params** 而非 config，
 *        恒取默认值 ⇒ 另外 3 个零点模型永不进入裁决；
 *    (b) 张冠李戴：`know-func-domain-range` / `know-func-properties` / `know-func-symmetry`
 *        三个节点的页面其实都调 `anim-func-properties` 并显式传 `mode`，
 *        而 v1 分别传 `anim-func-domain` / `anim-func-parity` / `anim-func-symmetry` + 空 config
 *        ⇒ 三者**都**落到默认 `mode: "parity"`，被同一段奇偶性文案同时误伤。
 *    ⇒ v2 用 `PAGE_BRANCHES` 显式登记「页面真实可达的 (animId, params, config)」，
 *      并以 knowledgeTree 反查完整性（新增必修一节点未登记分支即红灯）。
 *
 * 3) **声明而未消费的白名单**：v1 的 `PENDING_MIGRATION_NODES` 是空集，其分支恒为死代码。
 *    ⇒ v2 用 `CONTENT_BOUNDARY_EXEMPT`（(nodeId, 记号线) 粒度）+ 真消费 + 死条目检测，
 *      并单独用合成规则验证「豁免机制本身可用」。
 *
 * ── v3 增量（本轮复查实测） ──
 * 4) **词根漏网**：nike.ts 旧稿整段写「拐点」「极值」却全绿 —— 极值 / 驻点 / 拐点 / 可导 /
 *    不可导 / 二阶导 六类词根一条都没收。⇒ 见下方 v3 补漏段。
 *    注：`可导` 必须带否定前瞻 `(?!出)`，否则「即可导出」会被误判（LEGIT_SAMPLES 已固化）。
 * 5) **只扫面板、不扫元数据**：节点 `title` / `labTitle` / `examMethod` 同样直接面向学生
 *    （知识树标题、面包屑、高考通法标签），v2 完全没管 ⇒ v3 增补元数据扫描用例。
 *    遗留（见报告未办清单）：页面自有文案（features 目录与各 scenarios.ts）仍不在本门禁范围内。
 *
 * ── v3 二次补漏（`重新检查，修复所有问题` 轮次） ──
 * 6) **"默认分支恰好绕开 fallback"漏检**：`know-func-composite` 的 composite 分支原登记为 `params: {}`，
 *    即 `xSample = 1.5, innerB = -2` ⇒ `axisX = 1.0`，内/外层单调性判定恒为 ↗/↘，
 *    `"stationary"` 兜底文案（原写 `"极值/驻点 (—)"`、`"驻点 / 无定义"` —— 均为选必二词汇）
 *    虽在必修一节点上却从未被渲染、因而从未被拦截。
 *    而 `registries/composite.ts` 的 `paramMeta.xSample` 明确带 `{ value: 1.0, label: "1(轴)" }`
 *    临界标记 ⇒ 采样点落在对称轴上是**设计中的可达状态**。
 *    ⇒ 修正文案并在 PAGE_BRANCHES 中补齐「对称轴 / 二次外层顶点 / 真数越界」三个真实分支。
 *    教训：登记分支时只枚举 config 是不够的，**params 中带 marks 临界值的键同样改变文案分支**。
 *
 * ── v3 三次补漏（同轮复查） ──
 * 7) **记号线漏收「极小值 / 极大值 / 极小点」**：`/极值/` 匹不到 `极小值`（极+小+值 不含子串「极值」），
 *    于是 `nike/AmgmPage.tsx` 的 图例「均值等号成立**极小点**」长期全绿。⇒ 改为 `/极[小大]?[值点]/`，
 *    并在 LEGIT_SAMPLES 里固化「最大值 / 最小值」不得被误伤。
 * 8) **features 目录从未纳入扫描**（报告未办清单遗留）：门禁此前只扫 `buildMathQuantities` 面板与
 *    节点元数据，而左屏「教学导引 / 核心设问」、图例标签、场景名、开关标签同样直接面向学生。
 *    实测漏网：`funcExpLog` 指数页与对数页的**「展示导数切线」图层**（含 `TangentLine` 渲染、
 *    图例 `切线 f'(x_0)`、设问「切线方程及高考切线放缩不等式」、「两曲线相切的底数临界值 a_c」）、
 *    `nike` 三页设问的「求导解驻点 / 导函数符号 / 极小值点」、`transform` 的「不可导尖点」「最值与极值点」、
 *    `trigTransform` 的「统计零点与极值」、`inequalityAbsolute` 的「极值结构」badge。
 *    ⇒ 新增「页面自有文案」用例：读取必修一页面目录源码 + 必修一 `paramMeta` 注册表，
 *    **剔除注释**后跑同一组记号线，并配「扫描面目标数」与「扫描管线」两条自检。
 *    幂函数页早于本门禁就写有「幂函数位于必修一…不提供切线图层」注释，指数/对数页属同目录内漏做。
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { knowledgeTree } from "@/data/knowledgeTree";
import { buildMathQuantities } from "@/data/mathQuantities";
import type { ParamMeta } from "@/data/types";
import { paramMeta as compositeParamMeta } from "@/data/registries/composite";
import { paramMeta as funcExpLogParamMeta } from "@/data/registries/funcExpLog";
import { paramMeta as funcZeroParamMeta } from "@/data/registries/funcZero";
import { paramMeta as inequalityAbsoluteParamMeta } from "@/data/registries/inequalityAbsolute";
import { paramMeta as inequalityBasicParamMeta } from "@/data/registries/inequalityBasic";
import { paramMeta as nikeParamMeta } from "@/data/registries/nike";
import { paramMeta as quadraticParamMeta } from "@/data/registries/quadratic";
import { paramMeta as radianMeasureParamMeta } from "@/data/registries/radianMeasure";
import { paramMeta as transformParamMeta } from "@/data/registries/transform";
import { paramMeta as trigFormulasParamMeta } from "@/data/registries/trigFormulas";
import { paramMeta as trigIdentityParamMeta } from "@/data/registries/trigIdentity";
import { paramMeta as trigLinesParamMeta } from "@/data/registries/trigLines";
import { paramMeta as trigTangentParamMeta } from "@/data/registries/trigTangent";
import { paramMeta as trigTransformParamMeta } from "@/data/registries/trigTransform";
import { paramMeta as trigModelParamMeta } from "@/data/registries/trigModel";
import { TRIG_SCENARIOS } from "@/math/trigModel";

/**
 * 选必二导数章节专属记号（必修一严禁包含）——**词根级**
 *
 * 刻意**不**收录的单词（防误伤，本文件末尾有反误伤用例固化该约定）：
 *  - `切线`（裸词）：必修一/解析几何的"圆的切线与半径垂直"由几何法得出，合法；
 *  - `单调`（裸词）：必修一合法的单调性内容；
 *  - `导数`（裸词）：由 `导函数` / `求导` / `切线方程` 等组合词根精确覆盖，无需裸词。
 */
const BEYOND_COMPULSORY_PATTERNS: Array<{
  source: string;
  re: RegExp;
  mustMatch: string;
}> = [
  // 裸词「导数」：必修一（含三角函数、不等式、集合逻辑）全科不出现导数二字，可直接按词根拦
  // 「推」前置否定前瞻：自然中文「推**导数**学公式」「推**导函数**在闭区间上的最值」会把
  // 「推导 + 数/函数」误判成导数记号（LEGIT_SAMPLES 已固化）。
  { source: "导数", re: /(?<!推)导数/, mustMatch: "导数及其应用" },
  { source: "导函数", re: /(?<!推)导函数/, mustMatch: "利用导函数的奇偶性" },
  { source: "求导", re: /求导/, mustMatch: "对函数式求导" },
  { source: "f'(x)", re: /f'\s*\(/, mustMatch: "f'(x) = 2x" },
  {
    source: "f'(x_0)",
    re: /f'\s*\(\s*x_?\{?0\}?\s*\)/,
    mustMatch: "f'(x_0) = 1",
  },
  { source: "(a^x)'", re: /\(a\^x\)'/, mustMatch: "(a^x)' = a^x \\ln a" },
  {
    source: "(\\ln x)'",
    re: /\(\\ln x\)'/,
    mustMatch: "(\\ln x)' = \\frac{1}{x}",
  },
  { source: "切线方程", re: /切线方程/, mustMatch: "写出该点处的切线方程" },
  { source: "切线斜率", re: /切线斜率/, mustMatch: "切线斜率与尖点坐标" },
  {
    source: "构造差函数",
    re: /构造差函数/,
    mustMatch: "构造差函数 $g(x) = f(x) - x$",
  },
  { source: "相切临界", re: /相切临界/, mustMatch: "相切临界底数 $a_c$" },
  { source: "指对同构", re: /指对同构/, mustMatch: "指对同构化简" },
  { source: "隐零点", re: /隐零点/, mustMatch: "隐零点虚设代换" },
  { source: "极值点偏移", re: /极值点偏移/, mustMatch: "极值点偏移问题" },
  { source: "切线放缩", re: /切线放缩/, mustMatch: "切线放缩不等式" },
  // v3 补漏（本轮复查实测：nike.ts 旧稿含「拐点」却全绿 —— 下列词根从未被覆盖）
  // 「极值族」必须用 极[小大]?[值点]：裸 /极值/ 匹不到「极小值」「极大值」「极小点」
  {
    source: "极值",
    re: /极[小大]?[值点]/,
    mustMatch: "求函数在 $x_0$ 处的极小值",
  },
  { source: "驻点", re: /驻点/, mustMatch: "令导数为零求得驻点" },
  { source: "拐点", re: /拐点/, mustMatch: "判断曲线的拐点位置" },
  { source: "可导", re: /可导(?!出)/, mustMatch: "函数在 $x = 0$ 处可导" },
  { source: "不可导", re: /不可导/, mustMatch: "函数在尖点处不可导" },
  { source: "二阶导", re: /二阶导/, mustMatch: "二阶导数 $f''(x)$ 的符号" },
];

/** 反误伤样本：必修一内部完全合法的文案，任何记号线都不得命中 */
const LEGIT_SAMPLES = [
  "圆的切线与过切点的半径垂直",
  "函数在 $(0, +\\infty)$ 上单调递增",
  "正切函数 $y = \\tan x$ 的渐近线为 $x = k\\pi + \\frac{\\pi}{2}$",
  "指数函数与对数函数的图象关于直线 $y = x$ 对称",
  "求函数 $f(x) = x^2 - 2x$ 的值域",
  "二次函数图象与 $x$ 轴交点个数由判别式决定",
  "基本不等式 $a + b \\ge 2\\sqrt{ab}\\ (a, b > 0)$",
  "对勾函数 $y = x + \\frac{4}{x}$ 在 $(0, 2]$ 上单调递减",
  // 「最值」是必修一合法词根，绝不能被「极值族」记号线误伤
  "函数 $y = x + \\frac{1}{x}$ 在 $(0, +\\infty)$ 上的最小值为 $2$",
  "用基本不等式求 $\\frac{1}{x} + x$ 的最大值与最小值",
  // 「可导」必须带否定前瞻「(?!出)」：否则会把「即可导出」的“可导”二字误判为导数记号
  "在两角和公式中令 $\\beta = \\alpha$ 即可导出二倍角公式，这是升降幂的常用手法",
  // 同源误伤：自然中文「推导 + 数学/函数」会被「导数 / 导函数」记号线命中，故记号线带 (?<!推)
  "借助祖暅原理推导数学公式，是立体几何中常用的化归手法",
  "把 $f(x) = x^2 - 2x$ 配方后即可推导函数在闭区间上的最值分布",
];

interface Branch {
  /** 该分支在页面上的可读来源（失败时报出来便于定位） */
  from: string;
  animId: string;
  params: Record<string, number>;
  config?: Record<string, unknown>;
}

/**
 * 必修一节点的**真实可达分支**表。
 *
 * 登记原则：
 *  - `animId` / `config` 必须与该节点对应页面里 `buildMathQuantities(...)` 的实际调用一致；
 *  - 会改变文案分支的 **params**（下拉/滑块驱动的模型选择，如 `anim-func-zero` 的 `modelKey`）
 *    必须逐一枚举；纯数值型预设（左屏 preset 只是同一分支下的取值点，不改变文案）不单列。
 */
const PAGE_BRANCHES: Record<string, Branch[]> = {
  "know-set-venn": [
    { from: "SetVennPage", animId: "anim-set-venn", params: {} },
  ],
  "know-logic-conditions": [
    { from: "SetVennPage(logic)", animId: "anim-logic-conditions", params: {} },
  ],
  "know-logic-quantifiers": [
    {
      from: "SetQuantifiersPage/universal",
      animId: "anim-logic-quantifiers",
      params: {},
      config: { activeTab: "universal" },
    },
    {
      from: "SetQuantifiersPage/existential",
      animId: "anim-logic-quantifiers",
      params: {},
      config: { activeTab: "existential" },
    },
    ...(["all_all", "all_exist", "exist_exist"] as const).map(
      (dualScenario) => ({
        from: `SetQuantifiersPage/dual-${dualScenario}`,
        animId: "anim-logic-quantifiers",
        params: {},
        config: { activeTab: "dual", dualScenario },
      }),
    ),
  ],
  "know-ineq-basic": (["semicircle", "square", "nike"] as const).map(
    (studyMode) => ({
      from: `InequalityBasicAnimation/${studyMode}`,
      animId: "anim-ineq-basic",
      params: { a: 2, b: 3 },
      config: { studyMode },
    }),
  ),
  "know-ineq-absolute": (
    ["single", "sum", "diff", "triangle"] as const
  ).flatMap((studyMode) =>
    (["<=", ">="] as const).map((ineqType) => ({
      from: `InequalityAbsoluteAnimation/${studyMode}-${ineqType}`,
      animId: "anim-ineq-absolute",
      params: { a: 1, b: 2, c: 3 },
      config: { studyMode, ineqType },
    })),
  ),
  "know-func-domain-range": (["cubic", "root", "reciprocal"] as const).map(
    (fnType) => ({
      from: `DomainPage/${fnType}`,
      animId: "anim-func-properties",
      params: {},
      config: { mode: "domain", fnType },
    }),
  ),
  "know-func-properties": (
    ["cubic", "quadratic", "abs", "reciprocal", "sin"] as const
  ).map((fnType) => ({
    from: `ParityPage/${fnType}`,
    animId: "anim-func-properties",
    params: {},
    config: { mode: "parity", fnType },
  })),
  "know-func-symmetry": (
    [
      ["axis", "quadratic"],
      ["axis", "abs"],
      ["axis", "sin"],
      ["center", "cubic"],
      ["center", "reciprocal"],
      ["center", "sin"],
      ["period-dual-axis", "sin"],
      ["period-dual-center", "sin"],
      ["period-axis-center", "sin"],
    ] as const
  ).map(([subMode, fnType]) => ({
    from: `SymmetryPage/${subMode}-${fnType}`,
    animId: "anim-func-properties",
    params: {},
    config: { mode: "symmetry", subMode, fnType },
  })),
  "know-quadratic": [
    ...(["function", "equation"] as const).map((studyMode) => ({
      from: `QuadraticAnimation/${studyMode}`,
      animId: "anim-quadratic",
      params: { a: 1, b: -2, c: -3 },
      config: { studyMode },
    })),
    ...(["<", ">"] as const).map((ineqType) => ({
      from: `QuadraticAnimation/inequality-${ineqType}`,
      animId: "anim-quadratic",
      params: { a: 1, b: -2, c: -3 },
      config: { studyMode: "inequality", ineqType },
    })),
  ],
  "know-func-explog": (["single", "inverse"] as const).map((explogMode) => ({
    from: `ExponentialPage/${explogMode}`,
    animId: "anim-func-explog",
    params: { baseA: 2, x0: 1.5 },
    config: { subExpLog: "exponential", explogMode },
  })),
  "know-func-logarithmic": (["single", "inverse"] as const).map(
    (explogMode) => ({
      from: `LogarithmicPage/${explogMode}`,
      animId: "anim-func-explog",
      params: { baseA: 2, x0: 2 },
      config: { subExpLog: "logarithmic", explogMode },
    }),
  ),
  "know-power-function": (["single", "compare"] as const).map((powerMode) => ({
    from: `PowerPage/${powerMode}`,
    animId: "anim-func-explog",
    params: { powerAlpha: 0.5, x0: 2 },
    config: { subExpLog: "power", powerMode },
  })),
  "know-func-hook": (["standard", "amgm", "shifted"] as const).map(
    (activeMode) => ({
      from: `NikeAnimation/${activeMode}`,
      animId: "anim-nike",
      params: { a: 1, b: 4 },
      config: { activeMode },
    }),
  ),
  "know-nike-amgm": [
    {
      from: "AmgmPage",
      animId: "anim-nike",
      params: { a: 1, b: 4 },
      config: { activeMode: "amgm" },
    },
  ],
  "know-nike-shifted": [
    {
      from: "ShiftedPage",
      animId: "anim-nike",
      params: { a: 1, b: 4, h: 1, c: 0 },
      config: { activeMode: "shifted" },
    },
  ],
  // modelKey 是 params（不是 config），且直接决定模型文案 ⇒ 必须逐值枚举
  "know-func-zero": [0, 1, 2, 3].map((modelKey) => ({
    from: `FuncZeroAnimation/model-${modelKey}`,
    animId: "anim-func-zero",
    params: { modelKey, intervalM: -2, intervalN: 2 },
  })),
  "know-func-transform": (["none", "global", "input"] as const).flatMap(
    (foldMode) =>
      (["quadratic", "cubic", "sine", "exp", "log"] as const).map((fnType) => ({
        from: `TransformAnimation/${fnType}-${foldMode}`,
        animId: "anim-func-transform",
        params: { A: 1, omega: 1, h: 0, k: 0 },
        config: { fnType, foldMode },
      })),
  ),
  "know-func-composite": [
    ...(["exp", "log", "quadratic"] as const).map((outerType) => ({
      from: `CompositeAnimation/composite-${outerType}`,
      animId: "anim-func-composite",
      params: {},
      config: { subMode: "composite", outerType },
    })),
    // v3 补漏：三个 fallback 文案（而非 `"极值/驻点"`，见修正记录）只在
    // innerMonotonicity / outerMonotonicity / compositeMonotonicity = "stationary" 时才渲染，
    // 而 `paramMeta.xSample` 恰好带 `1.0 → "1(轴)"` 临界标记 ⇒ 这三个分支是**页面真实可达**的，
    // 仅用 `params: {}`（xSample=1.5, innerB=-2 ⇒ axisX=1.0）永远绕开它们，构成漏检。
    {
      from: "CompositeAnimation/composite-采样点恰在对称轴",
      animId: "anim-func-composite",
      params: { xSample: 1, innerB: -2, innerC: 2 },
      config: { subMode: "composite", outerType: "exp" },
    },
    {
      from: "CompositeAnimation/composite-采样点恰在二次外层顶点",
      animId: "anim-func-composite",
      params: { xSample: 0, innerB: -2, innerC: 2 },
      config: { subMode: "composite", outerType: "quadratic" },
    },
    {
      from: "CompositeAnimation/composite-真数越界无定义",
      animId: "anim-func-composite",
      params: { xSample: 0, innerB: 0, innerC: -1 },
      config: { subMode: "composite", outerType: "log" },
    },
    {
      from: "CompositeAnimation/piecewise",
      animId: "anim-func-composite",
      params: {},
      config: { subMode: "piecewise" },
    },
  ],
  "know-radian-measure": (
    ["definition", "conversion", "arcSector"] as const
  ).map((studyMode) => ({
    from: `RadianMeasureAnimation/${studyMode}`,
    animId: "anim-radian-measure",
    params: { alphaRad: Math.PI / 3, radius: 1.5 },
    config: { studyMode },
  })),
  "know-trig-lines": (["lines", "comparison", "inequality"] as const).map(
    (studyMode) => ({
      from: `TrigLinesAnimation/${studyMode}`,
      animId: "anim-trig-lines",
      params: { alphaDeg: 45 },
      config: { studyMode, ineqKind: "sin_gt" },
    }),
  ),
  "know-trig-identity": [
    ...(
      [
        ["identity", "geometry"],
        ["identity", "known_one"],
        ["identity", "homogeneous"],
      ] as const
    ).map(([studyMode, identitySubMode]) => ({
      from: `TrigIdentityAnimation/${studyMode}-${identitySubMode}`,
      animId: "anim-trig-identity",
      params: { alphaDeg: 30 },
      config: { studyMode, identitySubMode },
    })),
    ...(["standard6", "universal_k", "complementary"] as const).map(
      (inductionSubMode) => ({
        from: `TrigIdentityAnimation/induction-${inductionSubMode}`,
        animId: "anim-trig-identity",
        params: { alphaDeg: 30 },
        config: { studyMode: "induction", inductionSubMode },
      }),
    ),
  ],
  "know-trig-formulas": (
    ["sum_diff", "double_angle", "auxiliary"] as const
  ).map((studyMode) => ({
    from: `TrigFormulasAnimation/${studyMode}`,
    animId: "anim-trig-formulas",
    params: { alphaDeg: 30, betaDeg: 45 },
    config: { studyMode },
  })),
  "know-trig-transform": (
    ["properties", "fivePoints", "transformPath", "omegaZeros"] as const
  ).map((studyMode) => ({
    from: `TrigTransformAnimation/${studyMode}`,
    animId: "anim-trig-transform",
    params: { A: 2, omega: 2, phi: 0, k: 1 },
    config: { studyMode },
  })),
  "know-trig-tangent": (
    ["unitCircle", "baseFunction", "generalTransform", "gaokaoProblem"] as const
  ).map((studyMode) => ({
    from: `TrigTangentAnimation/${studyMode}`,
    animId: "anim-trig-tangent",
    params: { omega: 1, phi: 0 },
    config: { studyMode },
  })),
  "know-trig-model": [
    // 简谐运动模型：四个量各管什么
    {
      from: "TrigModelAnimation/harmonic",
      animId: "anim-trig-model",
      params: { A: 2, period: 2, phi: Math.PI / 2, k: 0, tRatio: 0.75 },
      config: { studyMode: "harmonic" },
    },
    // 由图象求解析式：读数顺序（最值 → 周期 → 特殊点）
    {
      from: "TrigModelAnimation/fromGraph",
      animId: "anim-trig-model",
      params: { A: 2, period: 2, phi: Math.PI / 2, k: 0, tRatio: 0.75 },
      config: { studyMode: "fromGraph" },
    },
    // 实际情境应用：三个情境的文案互不相同，必须逐一枚举（scenarioKey 是改变文案的二级选项）
    ...TRIG_SCENARIOS.map((scenario) => ({
      from: `TrigModelAnimation/modeling-${scenario.key}`,
      animId: "anim-trig-model",
      params: {
        ...scenario.params,
        tRatio: scenario.probeTime / scenario.params.period,
      },
      config: { studyMode: "modeling", scenarioKey: scenario.key },
    })),
  ],
};

/**
 * 各 `animId` 对应的 `paramMeta` 注册表 —— 供「critical 标记分支必须登记」的反查使用。
 *
 * 为什么必须显式登记：`marks` 中 `variant: "critical"` 的值都是**临界退化态**
 * （`baseA = 1` 使指数函数退化为常值、`xSample = 1` 恰落在内层对称轴上、`a = 0` 使二次退化为一次），
 * 页面在这些取值上有**独立的兜底文案**。若 `PAGE_BRANCHES` 只登记默认值，
 * 这些兜底分支就永远进不了内容边界裁决 —— 即 §8.6 第 3 条留下的漏检。
 *
 * 少登记任何一个「带参数分支用到的 animId」都会被下面的覆盖自检立刻抓出，
 * 因此本表不能靠"漏写"来绕过检查。
 */
const ANIM_PARAM_META: Record<string, Record<string, ParamMeta>> = {
  "anim-func-composite": compositeParamMeta,
  "anim-func-explog": funcExpLogParamMeta,
  "anim-func-zero": funcZeroParamMeta,
  "anim-ineq-absolute": inequalityAbsoluteParamMeta,
  "anim-ineq-basic": inequalityBasicParamMeta,
  "anim-nike": nikeParamMeta,
  "anim-quadratic": quadraticParamMeta,
  "anim-radian-measure": radianMeasureParamMeta,
  "anim-func-transform": transformParamMeta,
  "anim-trig-formulas": trigFormulasParamMeta,
  "anim-trig-identity": trigIdentityParamMeta,
  "anim-trig-lines": trigLinesParamMeta,
  "anim-trig-tangent": trigTangentParamMeta,
  "anim-trig-transform": trigTransformParamMeta,
  "anim-trig-model": trigModelParamMeta,
};

/**
 * 内容边界白名单 —— (nodeId, 记号线) 粒度，**当前为空 = 零容忍**。
 *
 * 只有在「该节点确实存在课标内合法、但字面命中记号线」的内容时才允许登记，
 * 且必须写明理由。任何登记都必须在本轮运行中至少被命中一次（见「白名单不得留死条目」），
 * 杜绝 v1 那种"声明了却从不读取"的装饰性机制。
 */
interface ExemptionRule {
  nodeId: string;
  /** 必须与 BEYOND_COMPULSORY_PATTERNS 的 `source` 完全一致 */
  pattern: string;
  reason: string;
}
const CONTENT_BOUNDARY_EXEMPT: ExemptionRule[] = [];

function isExempt(
  nodeId: string,
  pattern: string,
  rules: ExemptionRule[],
): boolean {
  return rules.some((r) => r.nodeId === nodeId && r.pattern === pattern);
}

/**
 * 必修一页面源码目录（`src/features/<dir>`）。
 *
 * 覆盖范围 = 必修一节点的页面实现目录；刻意**不含**
 * `constant`（选必二 · 含参超越函数与双变量）、`derivative*`（选必二）、
 * `home`（知识树首页，非节点页面）以及几何 / 概率统计等其它分册目录。
 */
const COMPULSORY_ONE_FEATURE_DIRS = [
  "composite",
  "funcExpLog",
  "funcProperties",
  "funcZero",
  "inequalityAbsolute",
  "inequalityBasic",
  "nike",
  "quadratic",
  "radianMeasure",
  "set",
  "transform",
  "trigFormulas",
  "trigIdentity",
  "trigLines",
  "trigTangent",
  "trigTransform",
  "trigModel",
] as const;

const FEATURES_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../features",
);

/**
 * 必修一页面直接渲染的 `paramMeta` 注册表（左屏滑块 label / labelFormula / description）。
 * `CompositeAnimation` 等页面用 `paramMeta[key]` 直接构造 `ParamConfig`，故注册表文案同样面向学生。
 */
const COMPULSORY_ONE_REGISTRY_FILES = [
  "composite.ts",
  "funcExpLog.ts",
  "funcProperties.ts",
  "funcZero.ts",
  "inequalityAbsolute.ts",
  "inequalityBasic.ts",
  "nike.ts",
  "quadratic.ts",
  "quantifiers.ts",
  "radianMeasure.ts",
  "set.ts",
  "transform.ts",
  "trigFormulas.ts",
  "trigIdentity.ts",
  "trigLines.ts",
  "trigTangent.ts",
  "trigTransform.ts",
  "trigModel.ts",
] as const;

const REGISTRIES_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../data/registries",
);

/** 递归收集目录下的 .ts / .tsx 源码（排除测试与快照文件） */
function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__") continue;
      collectSourceFiles(full, out);
      continue;
    }
    if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/**
 * 剔除注释，只保留「学生可见的源码」。
 * 块注释同时覆盖 JSX 的花括号注释形式；行注释用 `[^:]` 前瞻避开 `https://`。
 */
function stripComments(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

/** 拓展区（选必二前瞻）的内联标记 —— 必须成对出现，整行独占注释 */
const EXTENSION_BEGIN = "@syllabus-extension:begin";
const EXTENSION_END = "@syllabus-extension:end";

/**
 * 把源码中的「拓展区」整体挖空（保留空行以维持行号可读性）。
 *
 * 为什么需要它：必修一页面允许保留**选必二前瞻**图层（如指数/对数页的「展示切线」开关），
 * 但必须满足两个硬条件 —— ① 界面上显式标注为拓展且默认关闭；② 声明式登记（见
 * `EXTENSION_REGION_FILES`），而不是靠"门禁扫不到"来蒙混。
 * 挖空只影响本门禁的判据，不改动源码；标记本身必须能被人工 reviewer 一眼看到。
 */
function maskExtensionRegions(code: string): {
  masked: string;
  regions: number;
  maskedLines: number;
} {
  let inRegion = false;
  let regions = 0;
  let maskedLines = 0;
  const masked = code
    .split("\n")
    .map((line) => {
      if (!inRegion && line.includes(EXTENSION_BEGIN)) {
        inRegion = true;
        regions += 1;
        return line;
      }
      if (inRegion && line.includes(EXTENSION_END)) {
        inRegion = false;
        return line;
      }
      if (inRegion) {
        maskedLines += 1;
        return "";
      }
      return line;
    })
    .join("\n");

  return { masked, regions, maskedLines };
}

/**
 * 含「拓展区（选必二前瞻）」的必修一页面文件 —— 声明式登记，缺一即红灯。
 *
 * 与下方「页面自有文案」用例的 `violations` 是**互补**关系：
 * 登记文件内的拓展区被挖空（允许保留选必二内容），未登记文件里的任何选必二记号一律拦截。
 * 每个登记文件还必须满足：① 真实含 ≥ 1 个拓展区（死条目即红灯）；
 * ② 源码里出现「选必二前瞻」字样（保证界面上确有拓展标注，而不是只挖空不标）。
 */
const EXTENSION_REGION_FILES = [
  // 指数/对数页的「展示切线」图层：Toggle 标签即「展示切线（选必二前瞻 · 拓展）」，默认关闭
  "features/funcExpLog/ExponentialPage.tsx",
  "features/funcExpLog/LogarithmicPage.tsx",
  "features/funcExpLog/components/ExpLogScene.tsx",
] as const;

interface PageCopyScan {
  targets: number;
  missing: string[];
  violations: string[];
  /** 含拓展区的文件（相对 src/ 的 posix 路径） */
  extensionFiles: Set<string>;
  /** 拓展区内被挖空的行数，供「挖空确实生效」自检 */
  maskedLines: number;
  /** 从必修一页面可达的共享组件数（见 §8.6 ①：共享组件曾是扫描盲区） */
  sharedComponents: number;
}

let pageCopyScanCache: PageCopyScan | null = null;

/**
 * 从必修一页面源码出发，反向走依赖图，收集**真正会被必修一页面渲染**的共享组件。
 *
 * 为什么不能整目录扫 `src/components/**`：共享组件是全分册共用的，
 * 直接整目录扫会把「只被选必二页面使用」的组件（其文案里出现导数词根完全合法）
 * 一并判成违规，逼着后来者加白名单 —— 那正是本门禁最忌讳的"装饰性机制"。
 * 也不能不扫：共享组件里的**硬编码标注文字**同样直接呈现给学生（§8.6 ① 留的盲区）。
 *
 * 故按可达性精确取集：从必修一 15 个页面目录出发，沿 `from "@/components/…"`
 * 与组件目录内的相对 `from "./…"` 逐层展开（含 barrel 的 `export * from "./X"`），
 * 只把落在 `src/components/` 内的模块纳入扫描面。
 */
function collectReachableSharedComponents(seedFiles: string[]): string[] {
  const SRC = path.resolve(FEATURES_DIR, "..");
  const COMPONENTS_DIR = path.join(SRC, "components");
  const found = new Set<string>();
  const visited = new Set<string>();
  const queue = [...seedFiles];

  const resolveCandidates = (spec: string, fromFile: string): string[] => {
    let base: string;
    if (spec.startsWith("@/components/")) {
      base = path.join(COMPONENTS_DIR, spec.slice("@/components/".length));
    } else if (spec.startsWith(".")) {
      base = path.resolve(path.dirname(fromFile), spec);
    } else {
      return []; // 第三方包 / 其它别名，不跟
    }
    return [
      `${base}.tsx`,
      `${base}.ts`,
      path.join(base, "index.tsx"),
      path.join(base, "index.ts"),
    ].filter((c) => fs.existsSync(c) && fs.statSync(c).isFile());
  };

  while (queue.length > 0) {
    const file = queue.pop() as string;
    if (visited.has(file)) continue;
    visited.add(file);

    const raw = fs.readFileSync(file, "utf8");
    for (const m of raw.matchAll(/from\s+"([^"]+)"/g)) {
      for (const cand of resolveCandidates(m[1], file)) {
        if (!cand.startsWith(COMPONENTS_DIR)) continue; // 只关心共享组件子树
        if (/\.test\.tsx?$/.test(cand)) continue;
        found.add(cand);
        queue.push(cand);
      }
    }
  }

  return [...found];
}

/**
 * 扫描必修一页面自有文案（features 页面目录 + `paramMeta` 注册表 + 可达共享组件）。
 *
 * 结果在同一轮运行内缓存，供多条用例复用（避免用例间隐式顺序依赖）。
 */
function scanCompulsoryOnePageCopy(): PageCopyScan {
  if (pageCopyScanCache) return pageCopyScanCache;

  const SRC_DIR = path.resolve(FEATURES_DIR, "..");
  const missing: string[] = [];
  const violations: string[] = [];
  const extensionFiles = new Set<string>();
  let totalMaskedLines = 0;

  const targets: string[] = [];

  // ① 页面目录源码 src/features/<dir>/**
  for (const dirName of COMPULSORY_ONE_FEATURE_DIRS) {
    const dir = path.join(FEATURES_DIR, dirName);
    if (!fs.existsSync(dir)) {
      missing.push(`src/features/${dirName}`);
      continue;
    }
    targets.push(...collectSourceFiles(dir));
  }

  // ② paramMeta 注册表 src/data/registries/*.ts
  for (const fileName of COMPULSORY_ONE_REGISTRY_FILES) {
    const file = path.join(REGISTRIES_DIR, fileName);
    if (!fs.existsSync(file)) {
      missing.push(`src/data/registries/${fileName}`);
      continue;
    }
    targets.push(file);
  }

  // ③ 必修一页面可达的共享组件 src/components/**（§8.6 ① 曾为扫描盲区）
  //    注意：seed 用「页面 + 注册表」全体，注册表本身不 import 组件，展开结果等价于从页面出发。
  const sharedComponents = collectReachableSharedComponents([...targets]);
  targets.push(...sharedComponents);

  for (const file of targets) {
    const rel = path.relative(SRC_DIR, file).replace(/\\/g, "/");
    const raw = fs.readFileSync(file, "utf8");

    const { masked, regions, maskedLines } = maskExtensionRegions(raw);
    if (regions > 0) {
      extensionFiles.add(rel);
      totalMaskedLines += maskedLines;
    }

    const code = stripComments(masked);

    for (const p of BEYOND_COMPULSORY_PATTERNS) {
      const m = code.match(p.re);
      if (!m) continue;
      const start = Math.max(0, (m.index ?? 0) - 40);
      const end = Math.min(code.length, (m.index ?? 0) + 60);
      const snippet = code.slice(start, end).replace(/\s+/g, " ");
      violations.push(`  <${p.source}> ${rel}: ...${snippet}...`);
    }
  }

  pageCopyScanCache = {
    targets: targets.length,
    missing,
    violations,
    extensionFiles,
    maskedLines: totalMaskedLines,
    sharedComponents: sharedComponents.length,
  };
  return pageCopyScanCache;
}

const compulsoryOneNodes = knowledgeTree.filter(
  (node) => node.syllabus?.book === "必修一" && node.animationIds.length > 0,
);

describe("分册 × 内容拓扑红线门禁（必修一严禁出现选必二求导内容）", () => {
  it("必修一节点清单非空", () => {
    expect(compulsoryOneNodes.length).toBeGreaterThanOrEqual(8);
  });

  it("每个必修一节点都必须登记可达分支（新增页未登记即红灯）", () => {
    const missing = compulsoryOneNodes
      .map((n) => n.id)
      .filter((id) => !(id in PAGE_BRANCHES) || PAGE_BRANCHES[id].length === 0);
    expect(
      missing,
      `以下必修一节点未登记可达分支，将永远不进入内容边界裁决：${missing.join(", ")}`,
    ).toEqual([]);
  });

  it("PAGE_BRANCHES 不得出现已废弃的节点键", () => {
    const live = new Set(compulsoryOneNodes.map((n) => n.id));
    const stale = Object.keys(PAGE_BRANCHES).filter((id) => !live.has(id));
    expect(stale, `PAGE_BRANCHES 中的过期节点键：${stale.join(", ")}`).toEqual(
      [],
    );
  });

  it("每条分支都必须真实产出面板内容（animId / config 写错会被立即发现）", () => {
    const empty: string[] = [];
    for (const [nodeId, branches] of Object.entries(PAGE_BRANCHES)) {
      for (const b of branches) {
        const panel = buildMathQuantities(b.animId, b.params, b.config);
        if (panel.quantities.length === 0 && panel.theorems.length === 0) {
          empty.push(`${nodeId} ← ${b.from} (${b.animId})`);
        }
      }
    }
    expect(empty, `以下分支产出空面板：\n${empty.join("\n")}`).toEqual([]);
  });

  it("自动派生临界态分支：critical 标记取值下的兜底文案同样不得含选必二记号", () => {
    // 核心思想：**不靠人工把临界态逐条登记进 PAGE_BRANCHES**（那样必然漏），
    // 而是从各注册表的 `marks` 里的 `variant: "critical"` **反向派生出全部分支**再扫描。
    // 派生规则：对每条已登记分支的每个「带 critical 标记的参数键」，把该键换成临界值、
    // 其余参数保持不变 —— 这正是页面上学生拖动滑块能真实到达的状态。
    const derived: Array<Branch & { nodeId: string }> = [];

    for (const [nodeId, branches] of Object.entries(PAGE_BRANCHES)) {
      for (const b of branches) {
        const metas = ANIM_PARAM_META[b.animId];
        if (!metas) continue;
        for (const [key, value] of Object.entries(b.params)) {
          for (const mark of metas[key]?.marks ?? []) {
            if (mark.variant !== "critical") continue;
            if (mark.value === value) continue;
            derived.push({
              nodeId,
              from: `${b.from} · ${key} = ${mark.value}（${mark.label ?? "临界"}）`,
              animId: b.animId,
              params: { ...b.params, [key]: mark.value },
              config: b.config,
            });
          }
        }
      }
    }

    // 防空转：派生数退化为 0 会让整条用例变成装饰
    expect(
      derived.length,
      "临界态分支派生数为 0：ANIM_PARAM_META 或 marks 已失效",
    ).toBeGreaterThanOrEqual(20);

    const violations: string[] = [];
    const empty: string[] = [];
    for (const b of derived) {
      const panel = buildMathQuantities(b.animId, b.params, b.config);
      if (panel.quantities.length === 0 && panel.theorems.length === 0) {
        // 临界态产出空面板同样是缺陷：页面会出现"拖到临界值就白屏"
        empty.push(`[${b.nodeId}] ${b.from} (${b.animId})`);
        continue;
      }
      const text = JSON.stringify(panel);
      for (const p of BEYOND_COMPULSORY_PATTERNS) {
        const m = text.match(p.re);
        if (!m) continue;
        if (isExempt(b.nodeId, p.source, CONTENT_BOUNDARY_EXEMPT)) {
          exemptionHits.add(`${b.nodeId}::${p.source}`);
          continue;
        }
        const start = Math.max(0, (m.index ?? 0) - 40);
        const end = Math.min(text.length, (m.index ?? 0) + 60);
        violations.push(
          `  <${p.source}> [${b.nodeId}] ${b.from}: ...${text.slice(start, end)}...`,
        );
      }
    }

    expect(empty, `以下临界态分支产出空面板：\n${empty.join("\n")}`).toEqual(
      [],
    );
    expect(
      violations,
      `以下临界态分支的兜底文案出现选必二导数专属记号：\n${violations.join("\n")}`,
    ).toEqual([]);
  });

  it("反查覆盖自检：凡带参数的分支，其 animId 都必须登记 paramMeta 来源", () => {
    const withParams = new Set(
      Object.values(PAGE_BRANCHES)
        .flat()
        .filter((b) => Object.keys(b.params).length > 0)
        .map((b) => b.animId),
    );
    const uncovered = [...withParams].filter((id) => !(id in ANIM_PARAM_META));
    expect(
      uncovered,
      `以下 animId 的分支带参数但未登记 paramMeta 来源，其临界态不会被派生扫描：${uncovered.join(", ")}`,
    ).toEqual([]);
    expect(
      withParams.size,
      "带参数分支的 animId 数异常偏少",
    ).toBeGreaterThanOrEqual(10);
  });

  it("记号线自检：每条正则都必须命中其正样本（防死条件）", () => {
    const dead = BEYOND_COMPULSORY_PATTERNS.filter(
      (p) => !p.re.test(p.mustMatch),
    ).map((p) => `${p.source} ← 正样本 ${JSON.stringify(p.mustMatch)}`);
    expect(
      dead,
      `以下记号线永远不可能成立（死条件）：\n${dead.join("\n")}`,
    ).toEqual([]);
  });

  it("反误伤：必修一合法文案不得被任何记号线命中", () => {
    const falsePositives = LEGIT_SAMPLES.flatMap((sample) =>
      BEYOND_COMPULSORY_PATTERNS.filter((p) => p.re.test(sample)).map(
        (p) => `${p.source} 误伤 ${JSON.stringify(sample)}`,
      ),
    );
    expect(
      falsePositives,
      `记号线过宽：\n${falsePositives.join("\n")}`,
    ).toEqual([]);
  });

  it("白名单机制本身可用：登记后可豁免，未登记不得豁免", () => {
    const synthetic: ExemptionRule[] = [
      { nodeId: "know-demo", pattern: "求导", reason: "合成用例" },
    ];
    expect(isExempt("know-demo", "求导", synthetic)).toBe(true);
    expect(isExempt("know-demo", "导函数", synthetic)).toBe(false);
    expect(isExempt("know-other", "求导", synthetic)).toBe(false);
    expect(isExempt("know-demo", "求导", CONTENT_BOUNDARY_EXEMPT)).toBe(false);
  });

  // 登记使用情况，供「白名单不得留死条目」用（同一次运行内由下面的用例填充）
  const exemptionHits = new Set<string>();

  it("必修一节点的元数据（title / labTitle / examMethod 等）不得含选必二记号", () => {
    const violations: string[] = [];

    for (const node of compulsoryOneNodes) {
      // 元数据同样直接面向学生（树标题、面包屑、高考通法标签），必须与分支文案同一口径
      const metaText = JSON.stringify({
        title: node.title,
        labTitle: node.labTitle,
        chapter: node.chapter,
        module: node.module,
        examMethod: node.examMethod,
        crossThemes: node.crossThemes,
        gaokaoTopic: node.gaokaoTopic,
        questionCategory: node.questionCategory,
      });

      for (const p of BEYOND_COMPULSORY_PATTERNS) {
        const m = metaText.match(p.re);
        if (!m) continue;
        if (isExempt(node.id, p.source, CONTENT_BOUNDARY_EXEMPT)) {
          exemptionHits.add(`${node.id}::${p.source}`);
          continue;
        }
        const start = Math.max(0, (m.index ?? 0) - 30);
        const end = Math.min(metaText.length, (m.index ?? 0) + 50);
        violations.push(
          `  [${node.id}] <${p.source}>: ...${metaText.slice(start, end)}...`,
        );
      }
    }

    expect(
      violations,
      `以下必修一节点元数据出现选必二导数专属记号：\n${violations.join("\n")}`,
    ).toEqual([]);
  });

  for (const node of compulsoryOneNodes) {
    const branches = PAGE_BRANCHES[node.id] ?? [];
    if (branches.length === 0) continue;

    it(`[${node.id}] ${node.title} 全部 ${branches.length} 个可达分支均不得含选必二求导记号`, () => {
      const violations: string[] = [];

      for (const b of branches) {
        const panel = buildMathQuantities(b.animId, b.params, b.config);
        const text = JSON.stringify(panel);

        for (const p of BEYOND_COMPULSORY_PATTERNS) {
          const m = text.match(p.re);
          if (!m) continue;
          if (isExempt(node.id, p.source, CONTENT_BOUNDARY_EXEMPT)) {
            exemptionHits.add(`${node.id}::${p.source}`);
            continue;
          }
          const start = Math.max(0, (m.index ?? 0) - 40);
          const end = Math.min(text.length, (m.index ?? 0) + 60);
          violations.push(
            `  <${p.source}> 分支「${b.from}」: ...${text.slice(start, end)}...`,
          );
        }
      }

      expect(
        violations,
        `[${node.id}] 出现选必二导数专属记号：\n${violations.join("\n")}`,
      ).toEqual([]);
    });
  }

  it("白名单不得留死条目（每条豁免都必须在本轮真实命中）", () => {
    const dead = CONTENT_BOUNDARY_EXEMPT.filter(
      (r) => !exemptionHits.has(`${r.nodeId}::${r.pattern}`),
    ).map((r) => `${r.nodeId}::${r.pattern}（${r.reason}）`);
    expect(dead, `以下白名单条目已过期，应删除：\n${dead.join("\n")}`).toEqual(
      [],
    );
  });

  it("必修一页面自有文案（左屏设问 / 图例 / 场景名 / 开关标签 / paramMeta / 可达共享组件）不得含选必二记号", () => {
    const { missing, violations, targets, sharedComponents } =
      scanCompulsoryOnePageCopy();

    expect(
      missing,
      `以下登记目标不存在，登记表已与源码树脱节：${missing.join(", ")}`,
    ).toEqual([]);
    // 扫描面自检：目标数退化为 0 会让整条用例变成空转
    expect(
      targets,
      "必修一页面文案扫描目标数异常偏少，登记表可能已失效",
    ).toBeGreaterThanOrEqual(40);
    // §8.6 ① 闭环自检：共享组件必须真的被走到（实测 43 个；退化为 0 即依赖图展开失效）
    expect(
      sharedComponents,
      "从必修一页面可达的共享组件扫描面退化：依赖图展开失效，共享组件重新成为扫描盲区",
    ).toBeGreaterThanOrEqual(30);
    expect(
      violations,
      `以下必修一页面自有文案出现选必二导数专属记号（正文零容忍；选必二前瞻内容须走拓展区登记）：\n${violations.join("\n")}`,
    ).toEqual([]);
  });

  it("拓展区（选必二前瞻）必须逐一登记，且登记文件确含拓展区与界面标注", () => {
    const { extensionFiles, maskedLines } = scanCompulsoryOnePageCopy();
    const SRC_DIR = path.resolve(FEATURES_DIR, "..");

    // ① 反向：含拓展区但未登记 ⇒ 有人在偷偷开口子
    const unregistered = [...extensionFiles].filter(
      (f) => !(EXTENSION_REGION_FILES as readonly string[]).includes(f),
    );
    expect(
      unregistered,
      `以下文件含 ${EXTENSION_BEGIN} 拓展区但未登记进 EXTENSION_REGION_FILES：\n${unregistered.join("\n")}`,
    ).toEqual([]);

    // ② 正向：登记了却没有拓展区 ⇒ 死条目
    const dead = EXTENSION_REGION_FILES.filter((f) => !extensionFiles.has(f));
    expect(
      dead,
      `以下登记文件已不含拓展区，应删除登记：\n${dead.join("\n")}`,
    ).toEqual([]);

    // ③ 挖空确实生效（否则登记等于没登记）
    expect(
      maskedLines,
      "拓展区挖空未生效：maskedLines 为 0，说明标记未匹配到任何行",
    ).toBeGreaterThan(0);

    // ④ 界面标注自检：拓展区文件必须显式出现「选必二前瞻」字样，
    //    防止「只挖空、界面上却没有任何拓展标注」的假拓展
    const unlabeled = EXTENSION_REGION_FILES.filter(
      (f) =>
        !fs.readFileSync(path.join(SRC_DIR, f), "utf8").includes("选必二前瞻"),
    );
    expect(
      unlabeled,
      `以下文件的拓展区缺少界面标注（源码内应出现「选必二前瞻」字样）：\n${unlabeled.join("\n")}`,
    ).toEqual([]);
  });

  it("页面文案扫描管线自检：命中污染样本、剔除注释、挖空拓展区", () => {
    const polluted = 'const label = "极小值点"; // 这里的极值注释应被剔除';
    const cleaned = stripComments(polluted);

    expect(
      BEYOND_COMPULSORY_PATTERNS.some((p) => p.re.test(cleaned)),
      "扫描管线失效：污染样本的字符串字面量未被任何记号线命中",
    ).toBe(true);
    expect(cleaned, "行注释未被剔除，注释里的「极值」会误报").not.toContain(
      "应被剔除",
    );

    const withRegion = [
      'const keep = "正文文案";',
      `// ${EXTENSION_BEGIN} 拓展区`,
      'const ext = "求导解驻点";',
      `// ${EXTENSION_END}`,
    ].join("\n");
    const { masked, regions } = maskExtensionRegions(withRegion);
    expect(regions, "拓展区标记未被识别").toBe(1);
    expect(
      BEYOND_COMPULSORY_PATTERNS.some((p) => p.re.test(stripComments(masked))),
      "拓展区未被挖空：区内的选必二记号仍会命中",
    ).toBe(false);
    expect(
      BEYOND_COMPULSORY_PATTERNS.some((p) =>
        p.re.test(stripComments(withRegion)),
      ),
      "挖空自检失效：未挖空时本应命中",
    ).toBe(true);
  });
});
