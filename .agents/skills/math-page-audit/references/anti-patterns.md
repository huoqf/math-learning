# 高中数学动画开发与教学踩坑反面教材库 (Anti-Patterns)

> 记录在开发、重构过程中必须严格防范与立即纠正的典型反模式。

---

## 🚫 反模式 1：动点拖拽二次坐标转换（导致动点乱飞脱轨）

### ❌ 错误写法
```tsx
// 错误：InteractivePoint 吐出的已经是经过逆解算的数学坐标 (mathX, mathY)
const handleDrag = (x: number, y: number) => {
  const mathPos = designToMath(x, y, scale); // 💣 二次转换！导致动点瞬移或飞出画布
  setParams({ x0: mathPos.x });
};
```
### ✅ 正确写法
```tsx
const handleDrag = (mathX: number, mathY: number) => {
  setParams({ x0: mathX }); // 直接消费数学坐标
};
```

---

## 🚫 反模式 2：画布内直接渲染跳动的浮点数字符串

### ❌ 错误写法
```tsx
// 错误：在 SVG 内手写 text 渲染跳动的小数，严重破坏学术严肃性与遮挡图形
<text x={pos.x} y={pos.y}>{`P(${x.toFixed(2)}, ${y.toFixed(2)})`}</text>
```
### ✅ 正确写法
```tsx
// 正确：画布内仅保留代数点标 P，精确坐标与公式统一收纳至右下角 SceneLegend 与右屏
<SceneLabelGroup
  items={[{ id: 'p', text: 'P', mathX: x, mathY: y, color: MATH_COLORS.focusPoint }]}
  scale={scale}
  fontScale={fontScale}
/>
```

---

## 🚫 反模式 3：TipCard 提前剧透解题过程与最终极值

### ❌ 错误写法
```tsx
// 错误：把设问写成答案或推导过程
question: "通过配方法将解析式化为顶点式，并在 x=2 处取得最大值 4。"
```
### ✅ 正确写法
```tsx
// 正确：提出探究设问，推导过程与结论归位右屏 MathPanel
question: "(1) 观察抛物线对称轴随参数的变化；(2) 探究闭区间 [0, 3] 上的最值分布与端点取值。"
```

---

## 🚫 反模式 4：SelectGrid 堆砌复杂公式与代码变量

### ❌ 错误写法
```tsx
// 错误：在预设选项副标题中硬塞公式或代码代号
{
  key: 'case1',
  label: '模型一',
  description: 'a=1.5, b=-2.3, Delta=4.5 > 0, 根为 x=(-b±sqrt(Delta))/2a'
}
```
### ✅ 正确写法
```tsx
// 正确：纯净加粗的中文自解释标题，省略不必要的副标题，双列紧凑布局
{
  key: 'distinct_roots',
  label: '两相异实根'
}
```

---

## 🚫 反模式 5：图例（SceneLegend）颜色与实际图形色彩错位

### ❌ 错误写法
```tsx
// 场景中画的是紫色曲线
<FunctionGraph fn={f} scale={scale} color={MATH_COLORS.secondary} />
// 但图例写的是 primary (蓝色)
<SceneLegend items={[{ label: 'f(x)', colorKey: 'primary', type: 'line' }]} />
```
### ✅ 正确规范
中屏 `<SceneLegend>` 中配置的 `colorKey` 必须与实际渲染图元的色彩 Token 1-to-1 绝对一致。
