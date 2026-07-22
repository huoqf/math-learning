# 标注避让系统 — 实施记录

> 完成时间：2026-07-21
> Commit: `debe601` feat: 标注避让系统 — 共享工具 + InteractivePoint 接入

## 一、问题背景

主屏（画布）和左面板（滑块）的标注在参数变化时可能重叠：
- 左面板：滑块 marks 百分比阈值检测（仅零点）
- 主屏：各 Scene 组件独立实现，无统一机制

## 二、解决方案

### 2.1 共享工具：`labelAvoider.ts`

| 特性 | 实现 |
|------|------|
| 算法 | 贪心重试（O(N²)，<20 标签足够） |
| 碰撞检测 | 矩形重叠判定 |
| 避让策略 | 按优先级降序放置，碰撞时向上重试（最多 5 次，步长 16px） |
| 边界裁剪 | 可选 `bounds` 参数 |
| 宽度估算 | 中文 10px，英文 6.5px，数字 5.5px |

```typescript
// 用法
const placed = avoidLabels(entries, { fontScale, bounds: { width, height } })
```

### 2.2 InteractivePoint 扩展

新增可选 props（向后兼容）：

| Prop | 类型 | 说明 |
|------|------|------|
| `labelKey` | `string` | 标签唯一标识 |
| `placedLabels` | `PlacedLabel[]` | 避让后的位置数组 |

未传入时回退到默认 `dy = -(r + 6)`。

### 2.3 左面板滑块

`ParamControl.tsx` 的 `buildMarks()` 改进：
- 像素感知阈值（`MIN_GAP_PX = 28`，`CONTAINER_WIDTH_PX = 220`）
- 全局两两冲突检测
- 优先级系统：`auto(0) < zero(1) < 其他(2)`
- 隐藏标注 `title` tooltip

## 三、变更清单

### 新增文件

| 文件 | 说明 |
|------|------|
| `src/utils/labelAvoider.ts` | 共享避让工具（190 行） |
| `docs/agent-rules/process/TODO_deferred.md` | 待迁移场景跟踪 |
| `docs/agent-rules/process/COMPLETED_label_avoidance.md` | 本文档 |

### 修改文件

| 文件 | 改动 |
|------|------|
| `src/components/Math/InteractivePoint.tsx` | 新增 `labelKey`/`placedLabels` props |
| `src/components/UI/ParamControl.tsx` | 滑块标注冲突检测 + `title` tooltip |
| `src/features/set/components/SetScene.tsx` | 3 个 InteractivePoint 接入避让 |
| `src/features/function/components/FunctionScene.tsx` | 4 个 InteractivePoint 接入避让 |
| `src/features/constant/components/SingleVarScene.tsx` | 极值标签 + 4 个 InteractivePoint 接入避让 |
| `src/features/quadratic/hooks/useQuadraticScene.ts` | 迁移到共享 `avoidLabels` |
| `src/features/constant/components/DoubleVarScene.tsx` | 2 个顶点拖拽点接入避让（f_vertex, g_vertex） |
| `src/features/composite/components/CompositeScene.tsx` | 2 个分界/采样点接入避让（按 subMode 切换） |
| `src/features/transform/components/TransformScene.tsx` | 1 个平移控制点 P 接入避让 |
| `src/features/derivative/components/DerivativeScene.tsx` | 1 个切点接入避让（含 slope 标签联动避让） |

### 删除文件

| 文件 | 原因 |
|------|------|
| `src/utils/labelOverlap.ts` | 死代码（定义但未使用） |

## 四、技术决策

1. **不修改 coordinate/viewport 工具**：`labelAvoider.ts` 仅依赖 `FontScaler` 类型
2. **贪心重试而非力导向**：<20 标签场景下 O(N²) 足够
3. **宽度估算而非 DOM 测量**：避免高频 pointermove 下的重排性能问题
4. **向后兼容**：所有新 props 可选，未接入的 Scene 行为不变
5. **多模式 Scene 的 useMemo 位置**：在 `CompositeScene` 中将 `placedLabels` 提到分支前，按 `subMode` 构建 entries，避免 hooks 规则违反
6. **DerivativeScene 双标签联动**：切点坐标标签与斜率标签均纳入 `placedLabels`，切点标签由 `InteractivePoint` 渲染，斜率标签仍为独立 `<text>` 但消费 `placedLabels` 中的 `finalDy`

## 五、验证

- 类型检查：✅ 通过（`tsc -b` 0 errors）
- Vite 构建：✅ 通过
- 71 个单元测试：✅ 全部通过
- 无修改共享工具（coordinate、viewport、SceneScale）

## 六、左面板滑块（ParamControl.tsx）

独立于主屏的标注冲突回避，已在本次会话早期完成：

| 改动 | 说明 |
|------|------|
| `markPriority()` | 优先级函数：`auto(0) < zero(1) < 其他(2)` |
| `detectMarkConflicts()` | 全局两两冲突检测（像素阈值 28px） |
| `buildMarks()` | 返回 `{ visible, hidden }` |
| 隐藏标注 tooltip | `(N hidden)` + `title` 属性 |
| `renderDescription()` | 智能解析 3 种 descriptionFormula 格式 |

## 七、后续维护

`TODO_deferred.md` 中所有场景已完成迁移。新增 Scene 若包含 `InteractivePoint`，应按以下步骤接入 `placedLabels`：

1. 在 Scene 顶部（早于任何 early return）添加 `useMemo` 计算 `placedLabels`
2. 为每个 `<InteractivePoint>` 传入 `labelKey` 和 `placedLabels`
3. 多模式 Scene 在 `useMemo` 内按当前模式构建 entries，避免无效避让计算
