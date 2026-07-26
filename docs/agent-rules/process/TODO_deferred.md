# 知识树架构重构 — 待办事项

> 创建时间：2026-07-25
> 状态：Layer 0 + Round 0~5 全部完成

## 背景

知识树注册链条长（4 个文件手工同步）、无 fail-fast 校验、多知识点塞单页面。本次重构目标：meta.ts 下沉 + build-time 校验 + 脚手架 + 分批拆分。

## Layer 0（已完成）

- [x] 修复 `anim-solid-rotation-body` bug（KnowledgeTreeHome.tsx 补映射）
- [x] 清理 4 条 ANIMATION_ROUTE_MAP 死条目（`anim-func-hook`、`anim-probability-regression`、`anim-sequence-geom`、`anim-sequence-sum`）

## Round 0：基础设施定型 + Set 端到端验证（4 天）

- [x] 创建 `knowledgeTree.test.ts` 校验测试（10 项）
  - knowledgeTree 数据完整性（id 唯一、prerequisites 有效、importance 合法、快照）
  - ANIMATION_ROUTE_MAP 一致性（key 有节点引用、route 在 routeEntries 注册）
  - routeEntries 一致性（route 全局唯一）
  - barrel export 纪律（index.ts 不得 re-export meta.ts）
  - 挂载到 vitest run（`npx vitest run src/data/knowledgeTree.test.ts`）
- [x] 扩展 `KnowledgeNode` 类型：新增 `labTitle?` 和 `route?` 可选字段
- [x] 创建 Set 页面 `src/features/set/meta.ts`（node + loader 分离导出）
- [x] 创建 `src/data/routeEntries.ts`（覆盖全部 23 个路由）
  - 1 个已迁移 meta.ts 的页面（Set）：从 meta.ts import
  - 22 个暂未迁移的页面：内联声明 loader
  - 含 `guarded3D` 标记区分 3D 页面
  - 自动生成 `PATH_TO_LABEL`
- [x] App.tsx 重构：移除 19 个静态 import + 手写 PATH_TO_LABEL + 22 个手写 Route，改为从 routeEntries 自动生成
- [x] 创建 `gen:node` 脚手架命令（`scripts/gen-node.mjs`）
  - 自动生成 meta.ts + Animation.tsx 骨架 + index.ts
  - 自动插入 knowledgeTree.ts + routeEntries.ts
  - 参数校验（id 前缀、route 前缀、importance 枚举）
- [x] Set 页面拆分（`SetVennPage` + `SetLogicPage`）
  - SetVennPage：/set（集合运算，含 Venn 操作选择）
  - SetLogicPage：/set-logic（充分必要条件，含逻辑解释）
  - Set meta.ts 导出 vennNode + logicNode + vennLoader + logicLoader
  - KnowledgeTreeHome.tsx 更新 anim-logic-conditions → /set-logic
- [x] Playwright 验证：首页、/set、/set-logic、/quadratic、/sequence 全部正常加载

## Round 1：Sequence 架构 spike（已完成）

- [x] 验证 SequenceScene 共享壳能否干净抽出 → **可以**
- [x] 验证渲染分支能否收敛到 4 个独立页面 → **13 个分支可收敛到 4 个页面**
- [x] 输出可行性结论

### Spike 结论

**可行性：HIGH | 难度：LOW-MEDIUM（机械提取）**

SequenceScene.tsx（1227 行）含 13 个互斥渲染分支，无跨分支状态依赖。拆分方案：

| 目标文件 | 提取来源 | 预估行数 |
|---|---|---|
| ArithmeticScene.tsx | branch 1（等差） | ~177 |
| GeometricScene.tsx | branches 2+3（等比 points/tessellation） | ~225 |
| ModelsScene.tsx | branches 4-8（5 个高考模型，内部路由） | ~346 |
| RecurrenceScene.tsx | branches 9-13（5 个递推子模式，内部路由） | ~336 |

共享代码可提取：
- `SequenceSceneLayout`：CoordinateGrid + param 解构 + useMemo 调用
- `StemDotPlot`：7 个分支共用的"茎-点"SVG 模式

性能收益：当前 12 个 useMemo 在每次渲染时全部计算，拆分后每个子组件只计算自己需要的 memo。

## Round 2：低难度拆分（已完成）

- [x] PairedData 拆分：RegressionPage（/paired-data-regression）+ IndependencePage（/paired-data-independence）
  - PairedDataAnimation.tsx 保留为旧路由兼容入口
  - knowledgeTree 新增 know-paired-independence 节点
- [x] Constant 拆分：SingleVarPage（/constant-single）+ DoubleVarPage（/constant-double）
  - ConstantAnimation.tsx 保留为旧路由兼容入口
  - knowledgeTree 新增 know-constant-double 节点
- [x] Playwright 验证：4 个新页面全部正常加载

## Round 3：中难度拆分（已完成）

- [x] FuncExpLog 拆为 3 页：ExponentialPage + LogarithmicPage + PowerPage
- [x] FuncProperties 拆为 3 页：DomainPage + ParityPage + SymmetryPage
- [x] Nike 拆为 3 页：StandardPage + AmgmPage + ShiftedPage
- [x] 共 9 个新页面

## Round 4：Sequence 主模式拆分（已完成）

- [x] 4 个主模式独立路由（ArithmeticPage / GeometricPage / RecurrencePage / ModelsPage）
- [x] 子模式保留在各自页面内部用 useState 切换
- [x] SequenceScene 保持共享（接收 activeMode prop）

## Round 5：收尾（已完成）

- [x] 旧路由重定向：/set→/set-logic, /constant→/constant-single, /paired-data→/paired-data-regression, /function-properties→/function-domain, /function-explog→/function-exponential, /nike→/nike-standard, /sequence→/sequence-arithmetic
- [x] 面包屑统一：PATH_TO_LABEL 由 routeEntries 自动生成
- [x] 全量测试通过（29 文件，203 测试）

## 架构决策记录

| 决策 | 结论 | 理由 |
|------|------|------|
| loader 位置 | meta.ts 分离导出，不进入 KnowledgeNode | 保持类型可序列化、单一职责 |
| barrel export | 禁止 index.ts re-export meta.ts | 防止懒加载失效 |
| 排序机制 | 数组顺序 + 快照测试，不新增 order 字段 | 避免新增同步点 |
| 迁移范围 | 选项 A：本次只迁移 7 个拆分页面，15 个暂留原地 | 混合架构为有意过渡态 |
| 子模式路由 | 主模式一级路由，子模式留在页面内部 | 知识树节点只到主模式层 |
| routeEntries 覆盖 | Round 0 起覆盖全部 22 个路由 | 避免两套机制并存 |
| 旧路由处理 | 重定向到默认子页面（`<Navigate replace />`） | 兼容历史书签 |
| 面包屑标题 | 保留两套：labTitle（实验室名）+ title（知识点名） | 命名风格不同，各有用途 |

## 注意事项

- 拆分 `/sequence` 为 4 个路由后，按 pathname 聚合的埋点/统计会断裂，需提前确认
- 过渡期 `knowledgeTree.ts` 为混合架构（部分 meta.ts 引用 + 部分内联），新页面必须用 meta.ts
