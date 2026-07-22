# TODO: 标注避让迁移（Deferred）

> 记录主屏 InteractivePoint 接入 `placedLabels` 的待迁移场景。
> 完成状态：全部场景已迁移完成 ✅
> 详见：`COMPLETED_label_avoidance.md`

## 已完成

| 场景 | InteractivePoint 数量 | 状态 |
|------|----------------------|------|
| SetScene | 3 (O_A, O_B, P) | ✅ |
| FunctionScene | 4 (P, P, m, n) | ✅ |
| SingleVarScene | 4 (m, n, a, a_axis) | ✅ |
| useQuadraticScene | 5 (vertex, yInt, root×2, ineq) | ✅ (共享 avoidLabels) |
| DoubleVarScene | 2 (f_vertex, g_vertex) | ✅ |
| CompositeScene | 2 (x0 / xSample，按 subMode 切换) | ✅ |
| TransformScene | 1 (P) | ✅ |
| DerivativeScene | 1 (tangent，含 slope 联动避让) | ✅ |

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

## 后续维护

新增 Scene 时，若包含 `InteractivePoint`，应按上述步骤接入 `placedLabels`。
多模式 Scene（如 `CompositeScene`、`FunctionScene`）应在 `useMemo` 中按当前模式构建 entries，避免无效避让计算。
