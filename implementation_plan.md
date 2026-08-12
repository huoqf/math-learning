# 新高考数学可视化扩展与优化 — 详细分步实施方案与影响度评估

## 1. 现有页面影响度评估 (Impact Assessment)

在推进新高考扩展与优化的过程中，确保现有系统的**稳定可靠与零破坏（Zero-Breaking）**是第一原则。

### 1.1 影响度矩阵分析

| 优化阶段 | 修改类型 | 影响页面范围 | 破坏性风险 | 风险管控与兼容策略 |
| :--- | :--- | :--- | :--- | :--- |
| **【阶段 1：数据与看板增强】** | 数据层增强 | 现有 30+ 个页面 | **无（Zero-Breaking）** | **已完成**。全量升级 `mathQuantities.ts` 算法化步骤与 KaTeX 参数色彩绑定，项目 `npm run build` 构建零报错。 |
| **【阶段 2A：扩展知识树】** | 数据定义 | 知识库图谱 | **无（Zero-Breaking）** | **已完成**。在 `knowledgeTree.ts` 注册 7 大新高考压轴节点，为后续分页面实现提供统一架构入口。 |
| **【阶段 2B：按 SKILL 分页面实现】** | 增量开发 | 仅新建页面 | **无（Zero-Breaking）** | 严格遵循 `new-math-animation` (2D) 与 `new-3d-math-animation` (3D) SKILL 规范脚手架，新页面与老页面完全解耦。 |
| **【阶段 3：双向拖拽与避让交互】** | 视图层微调 | 约 10 个核心 SVG 页面 | **极低（Low Impact）** | 在现有 `InteractivePoint` 的 `onDrag` 中引入反向解算逻辑，逐个页面单测验证，保留原滑块逻辑作为 fallback。 |
| **【阶段 4：路由 Meta 纯重构】** | 架构清理 | 全站路由配置 | **极低（Refactoring）** | 仅将 `routeEntries.ts` 内联的 `legacyEntries` 拆分出独立 `meta.ts`，`knowledgeTree.ts` 接口完全不变。 |

---

## 2. 扩展知识树完成情况 (Knowledge Tree Roadmap)

已在 `src/data/knowledgeTree.ts` 中成功注册以下 7 大新高考高频压轴专题节点：

```
                              ┌────────────────────────────────────────┐
                              │    新高考数学压轴知识树节点库 (已接入) │
                              └──────────────────┬─────────────────────┘
                                                 │
      ┌────────────────────────┬─────────────────┴────────┬────────────────────────┐
      ▼                        ▼                            ▼                        ▼
┌───────────┐            ┌───────────┐                ┌───────────┐            ┌───────────┐
│  导数压轴 │            │  解析几何 │                │ 立体几何  │            │ 概率统计  │
└─────┬─────┘            └─────┬─────┘                └─────┬─────┘            └─────┬─────┘
      │                        │                            │                        │
  • 二阶导与拐点凹凸性    • 直线参数 t 几何意义        • 外接球三大模型         • 全概与马尔可夫
    know-derivative-inflection  know-conic-param-t          know-solid-ball-models   链状态转移递推
  • 端点效应与泰勒放缩    • 极化恒等式与阿波圆                                    know-probability-markov
    know-derivative-endpoint    know-conic-polarization
                          • 非对称齐次化求斜率和/积
                            know-conic-homogenization
```

### 节点注册信息汇总
1. **`know-derivative-inflection`**: 二阶导数、拐点与函数凹凸性（路由 `/derivative-inflection`）
2. **`know-derivative-endpoint`**: 端点效应与洛必达/泰勒拟合放缩（路由 `/derivative-endpoint`）
3. **`know-conic-param-t`**: 直线参数方程 $t$ 的几何意义与割线定理（路由 `/conic-param-t`）
4. **`know-conic-polarization`**: 向量极化恒等式与阿波罗尼斯圆（路由 `/conic-polarization`）
5. **`know-conic-homogenization`**: 非对称齐次化求斜率和/斜率积（路由 `/conic-homogenization`）
6. **`know-solid-ball-models`**: 多面体外接球三大模型（墙角/柱体/补形）（路由 `/solid-ball-models`）
7. **`know-probability-markov`**: 全概率公式与马尔可夫链状态转移递推（路由 `/probability-markov`）

---

## 3. 分页面实现的 SKILL 规范与 Checklist

在后续逐个分页面开发压轴专题实验室时，必须严格遵守 `AGENTS.md` 铁律与对应的 SKILL 指南：

### 3.1 2D 页面 (适用 SKILL: `new-math-animation`)
- **文件职责划分**：
  - `Animation.tsx`：状态/viewport编排，禁止直接写 SVG。
  - `components/Scene.tsx`：纯 SVG 渲染，严格由 Animation 传入 `fontScale`，禁止硬编码字号与硬编码 Hex 颜色。
  - `math/<topic>.ts`：纯数学计算层，零 DOM/React 副作用。
  - `registries/<topic>.ts`：声明式 `paramMeta`。
- **三位一体色彩绑定**：中屏图形、左屏 Label 与右屏 KaTeX 中的主参数强制统一使用 `MATH_COLORS.paramPrimary` / `Secondary`。

### 3.2 3D 页面 (适用 SKILL: `new-3d-math-animation`)
- **三视图与 WebGL 降级**：
  - 必须提供 `guarded3D: true`。
  - 左屏提供“3D 直观图 / 三视图”切换开关；在三视图模式下使用 `ThreeViewsPanel` 进行纯 SVG 正投影渲染。

---

## 4. 后续落地推进计划

- [x] **阶段一：数据与看板增强**（已完成：算法化 4 步步骤 + KaTeX 颜色绑定）
- [x] **阶段二 A：扩展知识树**（已完成：在 `knowledgeTree.ts` 中注册 7 大压轴节点）
- [ ] **阶段二 B：按 SKILL 规范分页面实现**（建议先实现：*直线参数方程 $t$ 几何意义实验室* 或 *多面体外接球三大模型实验室*）
- [ ] **阶段三：全站交互精细化与避让**
- [ ] **阶段四：全站 Meta 重构清理**
