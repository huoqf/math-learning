# 3D 页面左屏 (LeftPanel) 交互与渲染规范

## 1. 五步标准渲染层级（严格遵循）

所有 3D 立体几何与空间向量页面的左屏，必须按照以下 5 步顺序组织：

| 顺序 | Section 标题 | 核心控件 | 规范要求 |
|------|-------------|---------|---------|
| **Step 1** | `title="探究模式"` | `SelectGrid` / `TabSwitcher` | 2~3 个教学模式；3 项模式必须用 2+1 `SelectGrid`（带 KaTeX 简式），防文字截断 |
| **Step 2** | `title="高考场景"` 或 `"几何体模型"` | `SelectGrid` / `TabSwitcher` | 实体模型选择（柱/锥/台/球）或当前模式专属高考算例。**铁律：预设仅调参数，严禁跨模式篡改 activeMode** |
| **Step 3** | `title="参数调节"` | `ParamControl` | 按当前模式精准过滤参数；自动演示按钮紧随滑块区下方 |
| **Step 4** | `title="教学提示" compact` | `<TipCard variant="...">` | 统一使用 `TipCard`，公式用 `<KatexFormula mode="inline" />`，严禁手写色彩类名 |
| **Step 5** | `title="视图与视角"` | `TabSwitcher` + `SelectGrid` | 3D/三视图切换 + 4 大视角预设 (`iso`, `front`, `top`, `side`) + 坐标轴开关 |

---

## 2. 模式选择网格选用规范矩阵 (防截断与对称排版)

| 选项数量与特征 | 推荐控件 / 布局 | 规则说明 |
|---------------|----------------|---------|
| **4 项模式** | `SelectGrid (columns={2})` | 2×2 完美对称网格，微描述 $\le 6$ 字，禁止 `fullWidth` 破相 |
| **3 项短标签**（$\le 3$ 字，如模型预设） | `SelectGrid (columns={3})` 或 `TabSwitcher` | 3 列紧凑展示，如“长方体”、“正方体”、“四棱柱” |
| **3 项长公式 / 长描述** | `SelectGrid (columns={2})` + `fullWidth` | 2+1 布局，第 3 项独占一行 |
| **2 项模式** | `TabSwitcher (horizontal)` 或 `SelectGrid (columns={2})` | 2 列等宽 |

---

## 3. 教学提示 Design Token 映射规范

教学提示统一使用 `@/components/UI/TipCard`，禁止手写 `<div>` 拼接颜色。

| 变体 `variant` | 适用教学场景 | 视觉表现 (Tailwind Token) |
|---------------|-------------|--------------------------|
| `danger` | 易错反例 / 判定条件缺失（如面内直线反例、平行线反例） | `bg-danger-50/60 border-danger-200/70 text-neutral-700` |
| `info` | 概念转化思维链 / 几何性质定理（如射影面积定理） | `bg-neutral-50 border-neutral-200 text-neutral-600` |
| `warning` | 高考母题模型 / 几何作高特征（如四棱锥侧面垂直作高） | `bg-accent-50/70 border-accent-200/80 text-neutral-700` |
| `success` | 判定定理成立 / 核心性质结论（如线面垂直判定成功） | `bg-success-50/60 border-success-200/70 text-neutral-700` |
| `primary` | 空间向量法 / 坐标法解析（如法向量垂直与线面角） | `bg-primary-50/60 border-primary-200/70 text-neutral-700` |

---

## 4. 文案简洁性与空间紧凑性铁律

1. **去冗余副标题**：Section 标题力求精准精炼（如 `title="探究模式"`、`title="几何体模型"`），非必要不写长 subtitle，节约纵向高度。
2. **微描述控制**：`SelectGrid` 的 `description` 控制在 4~8 字内（如 `description="→ 生成圆柱"` 或 `description="三点交轨"`），杜绝多行换行。
3. **参数模式过滤**：`paramConfigs` 必须根据当前 `activeMode` 进行精准过滤，严禁全量罗列无关滑块。
4. **提示精炼精粹**：教学提示只提炼 1~2 句核心转化链或易错警示点，严禁大段长篇推导（完整推导属于右屏 `MathPanel`）。
5. **紧凑外边距**：教学提示外层 `LeftPanelSection` 必须添加 `compact` prop，使卡片轻盈融入左屏。
6. **图层解耦分类**：3D 辅助结构开关必须按数学维度独立解耦（几何辅助线、垂直直角符号、空间角弧、空间法向量），严禁将辅助线与直角混绑。

