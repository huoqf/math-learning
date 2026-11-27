# 2D 核心数学组件速查手册 (2D Components Guide)

> 适用范围：所有基于 `AnimationSvgCanvas` 的 2D 函数、解析几何、向量及概率图表开发。

---

## 一、核心组件速查与规范约束

| 组件名称 | 路径 | 核心 Props | 严禁与避坑指南 |
| :--- | :--- | :--- | :--- |
| **`CoordinateGrid`** | `@/components/Math` | `scale`, `fontScale`, `showGrid`, `showLabels`, `showOriginLabel`, `xStep`, `yStep` | ❌ 严禁漏传 `fontScale`；解析几何与综合函数建议 `showGrid={false}` 呈现学术纯净白底。 |
| **`FunctionGraph`** | `@/components/Math` | `fn`, `scale`, `color`, `domain`, `xRange`, `strokeWidth`, `samples` | ❌ 严禁在 `fn` 中引入未定义域计算（如负数开方、除以 0），必须做 `isNaN/isFinite` 防御。 |
| **`InteractivePoint`**| `@/components/Math` | `cx`, `cy`, `scale`, `vp`, `onDrag`, `axis`, `snapTo`, `xRange`, `yRange`, `color`, `label`, `labelKey`, `placedLabels` | ❌ `onDrag` 回调参数已是数学坐标对象 `{ x, y }`，**严禁二次调用 `designToMath`**；多点标优先统一交由 `<SceneLabelGroup>` 或传入 `placedLabels` 避让。 |
| **`MathPoint`** | `@/components/Math` | `cx`, `cy`, `scale`, `color`, `variant` (`'solid' \| 'hollow' \| 'focus' \| 'foot'`) | 纯数学静态交点/零点/焦点，去心点用 `'hollow'`。❌ 严禁手写 `<circle>`。 |
| **`VectorArrow`** | `@/components/Math` | `from`, `to`, `scale`, `color`, `strokeWidth`, `headLength`, `headWidth`, `label`, `labelPositionRatio`, `labelOffset`, `labelSize`, `fontScale`, `strokeDasharray` | 带箭头平面向量组件。❌ 严禁手写 `<line>` + `<polygon>` 拼箭头；传入 `label` 时须透传 `fontScale`。 |
| **`TangentLine`** | `@/components/Math` | `fn`, `x0`, `scale`, `color`, `strokeWidth`, `extend`, `h` | 动切线组件（内置数值求导，无需传入导函数 `dfn`）。 |
| **`SecantLine`** | `@/components/Math` | `fn`, `x1`, `x2`, `scale`, `color`, `strokeWidth`, `showTriangle`, `extend` | 割线逼近组件。 |
| **`Asymptote`** | `@/components/Math` | `type` (`'vertical' \| 'horizontal' \| 'oblique'`), `value`, `intercept`, `scale`, `color`, `label`, `fontScale` | 渐近线组件，自动虚线化并渲染代号。支持 `fontScale`。 |
| **`IntervalShadow`** | `@/components/Math` | `fn`, `x1`, `x2`, `scale`, `baseline`, `fillColor`, `strokeColor` | 阴影/积分区间组件，`baseline` 须显式声明 `{ kind: 'axis' \| 'horizontal' \| 'curve' }`。 |
| **`SceneLabelGroup`**| `@/components/Math` | `items`, `fontScale`, `offset`, `className` | 智能 8 向碰撞避让点标组。`items` 每项为 `{ key, x, y, text, color? }`（需先用 `mathToDesign` 转为设计坐标，不传 `scale`）。 |
| **`TrackPath`** | `@/components/Math` | `parametric`, `tRange`, `tCurrent`, `scale`, `color`, `strokeWidth`, `showDot` | 动点参数方程轨迹追踪线组件。 |
| **`PolarGrid`** | `@/components/Math` | `scale`, `fontScale`, `maxRadius`, `radiusStep`, `angleStep`, `showGrid` | 极坐标系网格与同心圆渲染组件。 |
| **`SceneLegend`** | `@/components/Math` | `items`, `title`, `position` (`'bottom-right' \| 'top-right' \| 'top-left' \| 'bottom-left'`) | 智能避让毛玻璃图例。`SceneLegendItem` 使用 `{ colorKey / color, label / formula, style }`。默认 `bottom-right`；当右下角有直方图柱、正态长尾、焦点或密集刻度时，必须配置 `position="top-right"`。 |

---

## 二、三栏布局与核心交互控件清单

| 组件名称 | 导入路径 | 核心 Props | 作用与规范约束 |
| :--- | :--- | :--- | :--- |
| **`ThreePanel`** | `@/components/Layout` | `left`, `center`, `right`, `mobileBreakpoint` | 标准三屏容器。100% 接管外层垂直滚动，内层禁止制造双重滚动条。 |
| **`AnimationSvgCanvas`** | `@/components/Layout` | `containerRef`, `transform`, `children` | 中屏标准矢量画布容器。配合 `useAnimationViewport` 响应式缩放。 |
| **`LeftPanel`** | `@/components/UI` | `children` | 左屏容器（物理宽度 240~280px），`p-3 gap-2.5` 紧凑内边距。 |
| **`LeftPanelSection`** | `@/components/UI` | `title`, `compact`, `children` | 左屏区块卡片外壳。标题精炼加粗，严禁写口水话副标题。 |
| **`TabSwitcher`** | `@/components/UI` | `tabs`, `value`, `onChange`, `layout`, `size` | 探索维度/大类模式切换器。支持横向单排与 4 项自动熔断网格。 |
| **`SelectGrid`** | `@/components/UI` | `items`, `value`, `onChange`, `columns`, `layout`, `variant` | 典型情境/母题预设选择器。纯中文标题，默认 2 列排版，首项自由探索通栏。 |
| **`ParamControl`** | `@/components/UI` | `params`, `onParamChange`, `onReset`, `disabled`, `variant` | 核心参数降维调节器。支持单项 `ParamConfig.disabled`（如 `isParamLocked`）与整组 `disabled`；扁平分组，三位一体色彩映射；多模式页面 `onReset` 须按当前模式安全复位。 |
| **`ParamPlayBar`** | `@/components/UI` | `isPlaying`, `onToggle`, `label`, `speed`, `onSpeedChange`, `secondaryAction` | 通用动画播放控制条（搭配 `@/hooks` 的 `useParamPlay`）。手动调参/拖拽/切模式时必须同步 `pause()`。 |
| **`Toggle`** | `@/components/UI` | `label`, `checked`, `onChange`, `disabled`, `size` | 标准单行紧凑开关。❌ 严禁手写原生 `<input type="checkbox">` 或暗色风格开关盒（如 `bg-slate-800`）。 |
| **`StepNavigator`** | `@/components/UI` | `steps`, `active`, `onChange`, `hint` | B 类大题分步作答导航器，驱动右屏 `focusStep` 与中屏 `activeStep` 三方同源联动。 |
| **`TipCard`** | `@/components/UI` | `badge`, `background`, `condition`, `question`, `variant` | 教学导引与题设三要素闭环卡片。置于左屏底部，数学符号 100% 包裹 `$...$`。 |
| **`MathPanel`** | `@/components/UI` | `quantities`, `theorems`, `gaokaoPoints`, `warnings`, `reasoningSteps`, `examAnchor`, `mnemonic`, `focusStep`, `focusTarget` | 右屏数学量看板。统一由 `buildMathQuantities` 组装结构化数据接入。 |

## 三、三位一体色彩映射规则

| 角色 | 主题 Token | 典型场景 |
| :--- | :--- | :--- |
| **主控核心参数 1** | `MATH_COLORS.paramPrimary` (`#EF4444` 鲜红) | 二次项 $a$、切点 $x_0$、离心率 $e$、斜率 $k$ |
| **从属关联参数 2** | `MATH_COLORS.paramSecondary` (`#D97706` 暖橙) | 一次项 $b$、分点比 $\lambda$、截距 $m$ |
| **辅助/高维参数 3** | `MATH_COLORS.paramTertiary` (`#059669` 翠绿) | 常数项 $c$、旋转角 $\theta$、样本量 $n$ |
| **主函数曲线** | `MATH_COLORS.function` (`#2563EB` 蓝) | $f(x)$ 曲线 |
| **对比/复合函数曲线** | `MATH_COLORS.functionSecondary` (`#8B5CF6` 紫) | $g(x)$ 或第二基准曲线 |
| **导函数曲线** | `MATH_COLORS.derivative` (`#D97706` 暖橙) | $f'(x)$ 曲线 |
| **几何切线** | `MATH_COLORS.tangentLine` (`#DC2626` 警示红) | 几何切线 |

---

## 四、fontScale 传递规范

1. **源头**：在 `Animation.tsx` 从 `useAnimationViewport` 获取 `canvasSize.font`。
2. **中转**：作为 `fontScale` prop 传入 `Scene.tsx`。
3. **消费**：`Scene.tsx` 传递给 `CoordinateGrid`、`InteractivePoint`、`SceneLabelGroup` 等。
4. **计算**：在任何需要动态调整字号的场景，使用 `fontSize={fontScale(12)}`，杜绝任何物理字号硬编码。
