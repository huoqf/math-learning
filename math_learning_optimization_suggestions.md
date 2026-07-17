# 高中数学交互动画系统优化建议

本项目从高中物理交互动画项目迁移而来。物理与数学在教学演示和交互逻辑上存在本质差异。物理是以**时间演化（$t$ 轴时基）**驱动的现象展示，而数学是以**代数-几何（参数空间）**为核心的数形结合。

为了让本系统更贴合高中数学的教学场景与学习痛点，以下是针对高中数学特点的系统优化建议。

---

## 一、 核心转变：从“时基播放”走向“数形双向联动”

### 1. 交互机制的本质区别
*   **物理项目**：常以时间 $t$ 为自变量。用户点击“播放”按钮，观察抛体运动、简谐振动等随时间推移的物理现象。
*   **数学项目**：极少需要“播放”或“暂停”按钮。数学强调的是**解析式中的参数（代数）**与**图像（几何）**的实时对应关系。用户通过改变参数，图像立刻发生瞬时改变，不需要时间积累。

### 2. 交互控制流优化：手势直接拖拽（Direct Manipulation）
目前系统只能通过左侧面板的 Slider 修改参数，这属于**“参数 $\to$ 图像”的单向联动**。
数学的最佳体验是**双向联动**：
*   **图像 $\to$ 参数（反向）**：允许用户在 SVG 画布上直接用鼠标/手指拖动几何关键点（例如：抛物线的顶点、椭圆的焦点、切线的切点、三角函数的相位点），反向计算出代数参数（如 $a, b, c$ 或 $\theta$），并同步更新左侧 Sliders 和右侧 `MathPanel`。

#### 建议封装：`InteractivePoint` 交互点组件
利用现有的 [designToMath](file:///d:/code/math/math-learning/src/utils/coordinate.ts#L32) 坐标逆转换，封装一个通用的 SVG 控制点组件。

```tsx
// 概念实现：InteractivePoint.tsx
interface InteractivePointProps {
  cx: number // 数学坐标 x
  cy: number // 数学坐标 y
  scale: SceneScale
  onDrag: (newPt: { x: number; y: number }) => void
  color?: string
}

export const InteractivePoint: React.FC<InteractivePointProps> = ({
  cx,
  cy,
  scale,
  onDrag,
  color = MATH_COLORS.focusPoint,
}) => {
  const handleMouseDown = (e: React.MouseEvent<SVGElement>) => {
    e.preventDefault()
    const svg = e.currentTarget.ownerSVGElement
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!svg) return
      // 1. 将 clientX/Y 转换为 SVG 内部设计坐标
      const svgPt = clientToSvgPoint(moveEvent.clientX, moveEvent.clientY, svg)
      if (svgPt) {
        // 2. 将设计坐标转换为数学坐标
        const mathPt = designToMath(svgPt.x, svgPt.y, scale)
        onDrag(mathPt)
      }
    }
    
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const pt = mathToDesign(cx, cy, scale)

  return (
    <circle
      cx={pt.x}
      cy={pt.y}
      r={6}
      fill={color}
      stroke="#fff"
      strokeWidth={2}
      className="cursor-grab active:cursor-grabbing hover:scale-125 transition-transform duration-100"
      onMouseDown={handleMouseDown}
    />
  )
}
```

---

## 二、 动态公式解析与高亮渲染

数学高度依赖公式表达式的推导和即时呈现。当前采用的手写拼接字符串（如 `QuadraticAnimation.tsx` 中的 `equationText` 拼接）容易出错且格式不规范。

### 建议优化：动态代数项拼装与 KaTeX 高亮
1.  **代数拼装规范化**：建立一个轻量级工具函数，根据变量值规范拼接多项式。处理系数为 $1$ 或 $-1$ 的省略（如 $1x^2$ 应为 $x^2$）、正负号合并（如 $+ -3$ 应为 $-3$）、系数为 $0$ 的项剔除等。
2.  **联动高亮渲染**：在 LaTeX 公式中对变化的参数进行着色，与 Slider 和图形颜色相对应（如让参数 $a$ 在公式中以黄色显示，对应图像中决定开口的焦点颜色）。

```tsx
// 理想的动态公式组件
<KatexFormula 
  latex={`y = \\color{${MATH_COLORS.paramA}}{${a.toFixed(1)}}x^2 + \\color{${MATH_COLORS.paramB}}{${b.toFixed(1)}}x + \\color{${MATH_COLORS.paramC}}{${c.toFixed(1)}}`} 
/>
```

---

## 三、 几何标注与数学组件库扩展

目前项目仅有 `CoordinateGrid`、`FunctionGraph`、`PolarGrid`、`VectorArrow`。对于高中数学丰富的解析几何、函数与导数、立体几何场景，需要扩充更多标准化的 SVG 数学几何组件：

| 推荐新增组件 | 适用数学场景 | 教学价值说明 |
| :--- | :--- | :--- |
| **`Asymptote` (渐近线)** | 双曲线、正切函数、对数/指数函数 | 提供虚线及标注文字，帮助学生理解极限逼近概念。 |
| **`TangentLine` (动态切线)** | 导数的几何意义、圆/圆锥曲线切线 | 传入切点 $x_0$ 和函数 $f(x)$，组件内利用数值差分法求导并绘制出局部切线。 |
| **`IntervalShadow` (区间阴影)** | 一元二次不等式解集、定积分面积 | 在指定区间 $[x_1, x_2]$ 内，自动填充函数曲线与 X 轴（或两条曲线）围成的区域阴影。 |
| **`TrackPath` (动点轨迹)** | 圆锥曲线的第一/第二定义、参数方程 | 随着参数变化，在画布上留下动点（如椭圆上的点）的移动路径，展示轨迹形成过程。 |
| **`SecantLine` (割线逼近)** | 导数定义（割线斜率趋近于切线斜率） | 传入两个点，绘制连接它们的割线，通过参数拉近两点展示割线向切线极限演变的动态。 |

---

## 四、 极值边界与极致退化防范（Warning System）

物理中一般有物理规律保护物理量（如质量不会为负，速度有上限），但数学参数的输入极其自由，容易进入退化状态。
高中数学一轮复习中，**“分类讨论”和“临界退化”是高频考点**。

### 1. 退化兼容设计
在组件渲染和数学计算中，必须对参数的退化做严密防范。
*   例如在二次函数中，当 $a=0$ 时：
    *   **数学层**：对称轴 $-\frac{b}{2a}$ 变为分母为 0。
    *   **渲染层**：对称轴虚线应优雅地消失，而不是渲染在 `NaN` 坐标或导致 React crash。
    *   **提示层**：右侧 `MathPanel` 自动弹出 `WarningItem` 警示，提示学生此时抛物线退化为一次函数。

### 2. 统一退化警示清单（高频易错点）
建议在 `mathQuantities.ts` 或核心逻辑中，对各模块加入以下退化监控：
*   **二次函数**：$a = 0$（退化为一次函数），$\Delta < 0$（无实根）。
*   **指对数函数**：底数 $a \le 0$ 或 $a = 1$（失去指数/对数函数定义）。
*   **三角函数**：$\tan x$ 采样点到达 $\frac{\pi}{2} + k\pi$（无定义断点）。
*   **圆锥曲线**：离心率 $e$ 变化导致曲线类型跃变（$e < 1$ 椭圆，$e=1$ 抛物线，$e>1$ 双曲线）。

---

## 五、 三屏界面内容划分与数学特化

结合 `AGENTS.md` 铁律，三栏的划分在数学中应做如下优化微调：

1.  **左屏（参数面板）**：
    *   除了 Slider 拖拽，针对特定的临界状态（如 $a=0$ 临界点，$\Delta=0$ 临界点），Slider 轨道上应配置明显的 `marks`，并支持吸附（Magnetic Snap）和临界样式（`variant: 'critical'`），便于快速切换到临界和退化状态。
2.  **中屏（SVG 画布）**：
    *   **严禁放置长段文字**，保持数学的“纯几何美感”。
    *   增加**动态数学量浮动标注**（如：在交点处，文字标签 `(0, c)` 随 $c$ 的大小动态上下移动并更改数值显示）。
3.  **右屏（数学看板）**：
    *   数学中定理和公式比物理中更抽象。不仅要展示公式本身，还要在 `Theorem` 中明确标出**“适用前提条件”**（如 $a \neq 0$，$b^2-4ac \ge 0$），加强一轮复习的查漏补缺作用。
