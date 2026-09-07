# 新页面注册四步闭环指南

> 每个新页面必须完成以下四步注册，缺一不可。漏注册会导致知识树节点锁定、路由 404 或右屏看板空白。

---

## Step 1：创建 `meta.ts` — KnowledgeNode + loader

路径：`src/features/<topic>/meta.ts`

```ts
import type { KnowledgeNode } from '@/data/types';

// ── KnowledgeNode 必填字段 ──────────────────────────────────────
export const <topic>Node: KnowledgeNode = {
  id: 'know-<topic>',            // 全局唯一，格式 know-<kebab-topic>
  title: '知识点全称',            // 知识树节点显示名（学科正规名称）
  labTitle: '实验室页面标题',      // 面包屑与页面 Header 显示
  chapter: '所属章节',            // 如"函数与导数"、"立体几何与空间向量"
  module: '所属模块',             // 如"导数应用"、"空间向量"
  importance: 'core',            // 'basic' | 'core' | 'gaokao' | 'hard' | 'extend'
  animationIds: ['anim-<topic>'], // ⚠️ 必须与 mathQuantities.ts 的 case 完全一致
  prerequisites: [],             // 前置知识节点 id 列表（可空数组）
  route: '/<topic>',             // HashRouter 路径（不含 #）

  // 可选但推荐填写（影响高考专题地图展示）
  gaokaoTopic: 'func_derivative', // 'func_derivative'|'conic_geometry'|'solid_geometry'|...
  questionCategory: 'solution_first', // 'foundation'|'multi_select_hard'|'solution_first'|'solution_final'
  examMethod: '通法一句话描述',   // 高考核心通法，如"切点斜率法与截距式联立"
  examWeight: 4,                  // 高考考查权重 1-5 星
};

// ── loader：动态 import 页面组件（3D 页面 import 对应的 3D Animation 文件）
export const <topic>Loader = () => import('./<Topic>Animation');
```

**重要：`animationIds[0]` 必须与 Step 4 中 `mathQuantities.ts` 里的 `case "anim-<topic>"` 字符串严格相同**，否则右屏看板永远空白。

---

## Step 2：注册路由 — `routeEntries.ts`

路径：`src/data/routeEntries.ts`

```ts
// 在文件顶部按章节分组 import
import {
  <topic>Node,
  <topic>Loader,
} from '@/features/<topic>/meta';

// 在 routeEntries 数组对应章节区块内追加（按章节顺序）
export const routeEntries: RouteEntry[] = [
  // ... 已有条目 ...
  {
    node: <topic>Node,
    loader: <topic>Loader,
    // 3D 页面必须加此字段，2D 页面省略
    // guarded3D: true,
  },
];
```

> **3D 页面必须** 设置 `guarded3D: true`，触发 WebGL 门禁检测与懒加载包装。

---

## Step 3：注册知识树 — `knowledgeTree.ts`

路径：`src/data/knowledgeTree.ts`

```ts
// 在对应章节注释区块内插入节点（按照课程进度顺序）
import type { KnowledgeNode } from './types';

// ── 在现有节点之后追加 ──
{
  ...  // 前一个节点
},
// 导入并展开或直接写：
// <topic>Node 对象从 meta.ts re-export 或直接复制粘贴
{
  id: 'know-<topic>',
  title: '知识点全称',
  // ... 同 meta.ts 中的 KnowledgeNode 内容
},
```

> **替代方案**（推荐）：在 `knowledgeTree.ts` 顶部 import 后，直接在数组中引用 `<topic>Node`：
> ```ts
> import { <topic>Node } from '@/features/<topic>/meta';
> export const knowledgeTree: KnowledgeNode[] = [
>   ...,
>   <topic>Node,  // 插入合适位置
> ];
> ```

---

## Step 4：注册右屏数据 — `mathQuantities.ts`

路径：`src/data/mathQuantities.ts`

```ts
// 1. 顶部 import builder 函数
import { build<Topic>Panel } from './builders/<topic>';

// 2. 在 buildMathQuantities() 的 switch 语句中追加 case
export function buildMathQuantities(
  animId: string,
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  switch (animId) {
    // ... 已有 case ...
    case 'anim-<topic>':          // ⚠️ 必须与 meta.ts 的 animationIds[0] 完全一致
    // 若同一主题包含多个子动画模式，可连续列出多个 case fall-through：
    // case 'anim-<topic>-mode2':
      return build<Topic>Panel(params, config);
    // ...
    default:
      return EMPTY;
  }
}
```

---

## KnowledgeNode `importance` 等级含义

| 值 | 含义 | 高考地位 |
|----|------|---------|
| `'basic'` | 基础概念 | 选择/填空基础题 |
| `'core'` | 核心知识 | 各题型必考 |
| `'gaokao'` | 高考重点 | 历年真题高频 |
| `'hard'` | 压轴难点 | 解答题压轴 |
| `'extend'` | 竞赛/拓展 | 超出考纲 |

---

## 注册完整性自检与验收

```bash
# 1. 静态检查
npx tsc -b
npm test
node .agents/skills/math-page-audit/scripts/audit_page.mjs src/features/<topic>
```

**运行态核对 Checklist**：
- [ ] **路由可达**：浏览器访问 `http://localhost:5173/#/<route>` 正常加载，无 404，控制台无报错。
- [ ] **知识树亮起**：首页知识树/高考地图对应节点处于激活状态（可点击进入），**无灰色锁定锁头图标**。
- [ ] **面包屑对应**：页面顶部 Header 面包屑显示 `chapter > module > labTitle`，无 undefined。
- [ ] **右屏非空**：右屏 MathPanel 正常渲染几何特征量、核心定理或推演链，**无“暂无数学解析数据”空白提示**。
- [ ] **3D 门禁**：若为 3D 页面，`routeEntries.ts` 中已配置 `guarded3D: true`。
