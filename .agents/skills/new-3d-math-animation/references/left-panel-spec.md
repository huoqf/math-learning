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

## 2. 模式选择防截断规范 (2+1 SelectGrid)

当探究模式有 3 个选项时，横排 `TabSwitcher` 会因宽度不足产生文本截断。必须统一采用 2+1 `SelectGrid` 架构：

```tsx
<SelectGrid
  items={[
    { key: "continuous", label: "连续切面", formula: "S = \\frac{S'}{\\cos\\theta}" },
    { key: "construction", label: "作图推演", formula: "P, Q, R \\text{ 交轨}" },
    { key: "extrema", label: "动点极值探究", formula: "S(t) \\to \\max / \\min", fullWidth: true },
  ]}
  value={mode}
  onChange={(m) => setMode(m as ModeType)}
  columns={2}
/>
```

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

