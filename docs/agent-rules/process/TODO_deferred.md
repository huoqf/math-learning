# TODO: 标注避让迁移（Deferred）

> 记录主屏 InteractivePoint 接入 `placedLabels` 的待迁移场景。
> 完成状态：SetScene、FunctionScene、SingleVarScene 已迁移。

## 已完成

| 场景 | InteractivePoint 数量 | 状态 |
|------|----------------------|------|
| SetScene | 3 (O_A, O_B, P) | ✅ |
| FunctionScene | 4 (P, P, m, n) | ✅ |
| SingleVarScene | 4 (m, n, a, a_axis) | ✅ |
| useQuadraticScene | 5 (vertex, yInt, root×2, ineq) | ✅ (共享 avoidLabels) |

## 待迁移

| 场景 | 文件 | InteractivePoint 数量 | 优先级 | 说明 |
|------|------|----------------------|--------|------|
| DoubleVarScene | `constant/components/DoubleVarScene.tsx` | 2 | 中 | 顶点 + 拖拽点，冲突概率低 |
| CompositeScene | `composite/components/CompositeScene.tsx` | 2 | 中 | 分界点 + 采样点，可能重叠 |
| TransformScene | `transform/components/TransformScene.tsx` | 1 | 低 | 单点，无需避让 |
| DerivativeScene | `derivative/components/DerivativeScene.tsx` | 1 | 低 | 单点，已有固定布局 |

## 迁移步骤

1. 添加 `import { avoidLabels, type LabelEntry } from "@/utils/labelAvoider"`
2. 添加 `useMemo` 计算 `placedLabels`
3. 为每个 `<InteractivePoint>` 添加 `labelKey` 和 `placedLabels` props

## 参考实现

参见 `SetScene.tsx` 或 `FunctionScene.tsx` 的实现模式。

## 技术决策

- `avoidLabels()` 在 `useMemo` 中调用，依赖 params/scale/fontScale
- `labelKey` 与 `placedLabels` 中的 `key` 匹配
- 未匹配时回退到默认 `dy = -(r + 6)`
