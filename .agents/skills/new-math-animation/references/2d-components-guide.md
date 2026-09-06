# 2D 核心数学组件速查手册 (2D Components Guide)

> 适用范围：所有基于 `AnimationSvgCanvas` 的 2D 函数、解析几何、向量及概率图表开发。

---

## 一、核心组件速查与规范约束

| 组件名称 | 路径 | 核心 Props | 严禁与避坑指南 |
| :--- | :--- | :--- | :--- |
| **`CoordinateGrid`** | `@/components/Math` | `scale`, `fontScale`, `showGrid`, `step` | ❌ 严禁漏传 `fontScale`；解析几何与综合函数建议 `showGrid={false}` 呈现学术纯净白底。 |
| **`FunctionGraph`** | `@/components/Math` | `fn`, `scale`, `color`, `domain`, `strokeWidth` | ❌ 严禁在 `fn` 中引入未定义域计算（如负数开方、除以 0），必须做 `isNaN/isFinite` 防御。 |
| **`InteractivePoint`**| `@/components/Math` | `cx`, `cy`, `scale`, `vp`, `onDrag`, `color` | ❌ **严禁向其传 `label`**（点标统一归 `<SceneLabelGroup>`）；❌ **严禁在 `onDrag` 回调内二次调用 `designToMath`**（回调值已是数学坐标）。 |
| **`MathPoint`** | `@/components/Math` | `cx`, `cy`, `scale`, `color`, `variant` ('solid' \| 'hollow') | 纯数学静态交点/驻点/焦点，实心 $r=3.2$，去心点用空心 $r=3.8$。❌ 严禁手写 `<circle>`。 |
| **`TangentLine`** | `@/components/Math` | `fn`, `dfn`, `x0`, `scale`, `color`, `strokeDasharray` | 动切线组件。需同时提供原函数值与导数值。 |
| **`SecantLine`** | `@/components/Math` | `fn`, `x0`, `x1`, `scale`, `color` | 极限与割线逼近组件。 |
| **`Asymptote`** | `@/components/Math` | `type` ('vertical' \| 'horizontal' \| 'slant'), `value`, `scale` | 渐近线组件，自动虚线化并渲染代号。支持 `fontScale`。 |
| **`IntervalShadow`** | `@/components/Math` | `fn`, `range`, `scale`, `fillColor`, `baseline` | 定积分/不等式解集面积阴影。 |
| **`VectorArrow`** | `@/components/Math` | `from`, `to`, `scale`, `color`, `dashed`, `headSize` | 平面向量与视觉指示箭头。❌ 严禁手写 `<line>` + `<polygon>`。 |
| **`SceneLabelGroup`**| `@/components/Math` | `items`, `scale`, `fontScale` | 智能避让点标。自动执行 8 向防重叠分流与白色微描边。❌ 严禁在画布中央用手写 `<text>` 渲染浮点坐标。 |
| **`SceneLegend`** | `@/components/Math` | `items` (`label`, `colorKey`, `type`, `dashed`) | 中屏右下角毛玻璃图例卡片。承载完整解析式、特征点与几何释义。 |

---

## 二、三位一体色彩映射规则

| 角色 | 主题 Token | 典型场景 |
| :--- | :--- | :--- |
| **主控核心参数 1** | `MATH_COLORS.paramPrimary` (`#EF4444` 鲜红) | 二次项 $a$、切点 $x_0$、离心率 $e$、斜率 $k$ |
| **从属关联参数 2** | `MATH_COLORS.paramSecondary` (`#D97706` 暖橙) | 一次项 $b$、分点比 $\lambda$、截距 $m$ |
| **辅助/高维参数 3** | `MATH_COLORS.paramTertiary` (`#059669` 翠绿) | 常数项 $c$、旋转角 $\theta$、样本量 $n$ |
| **主函数曲线** | `MATH_COLORS.primary` (`#2563EB` 蓝) | $f(x)$ 曲线 |
| **导函数/对比曲线** | `MATH_COLORS.secondary` (`#7C3AED` 紫) | $f'(x)$ 或第二基准曲线 |
| **切线/法线** | `MATH_COLORS.tangent` (`#D97706`) | 几何切线 |

---

## 三、fontScale 传递规范

1. **源头**：在 `Animation.tsx` 从 `useAnimationViewport` 获取 `canvasSize.font`。
2. **中转**：作为 `fontScale` prop 传入 `Scene.tsx`。
3. **消费**：`Scene.tsx` 传递给 `CoordinateGrid`、`InteractivePoint`、`SceneLabelGroup` 等。
4. **计算**：在任何需要动态调整字号的场景，使用 `fontSize={fontScale(12)}`，杜绝任何物理字号硬编码。
