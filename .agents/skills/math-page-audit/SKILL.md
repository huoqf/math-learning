---
name: math-page-audit
description: 高中数学教学与新高考规范审计 / 页面质量检查 / 解析几何与函数几何核查 / 交互拖拽与三屏同步质检 / 检查页面是否满足教学与新高考 / 审查数学动画页面 / 修复坐标乱飞与公式重影
---

# 高中数学可视化页面质量与新高考教学审计规范 (Math Page Audit Protocol)

> **定位**：本技能是页面质量与教学严谨性的**轻量级调度中心与 SOP 指南**。
> 💡 **资源按需加载**：详细核查清单、反模式案例库与学科规范已模块化沉淀，审计时请直接查阅对应资源。

---

## 📚 按需调用资源索引表

| 资源路径 | 作用与内容 | 适用场景 |
| :--- | :--- | :--- |
| [references/audit-checklist.md](file:///d:/code/math/math-learning/.agents/skills/math-page-audit/references/audit-checklist.md) | **全学科全流程逐项核查清单**（A/B 课型分流、左中右三屏对账） | **页面交付前自检必查** |
| [references/anti-patterns.md](file:///d:/code/math/math-learning/.agents/skills/math-page-audit/references/anti-patterns.md) | **前端交互与教学踩坑反例库**（二次转换乱飞/浮点跳动/设问剧透等） | 排查疑难 Bug 或代码走查时比对 |
| [references/discipline-specs.md](file:///d:/code/math/math-learning/.agents/skills/math-page-audit/references/discipline-specs.md) | **五大分支学科深度审计标准**（函数/导数/解几/立几/概率专属标准） | 深入特定学科模块时针对性核查 |
| [scripts/audit_page.mjs](file:///d:/code/math/math-learning/.agents/skills/math-page-audit/scripts/audit_page.mjs) | **自动化代码与高考规范静态审计脚本**（9+ 类违规一键检测） | 命令行执行自动化门禁 |

---

## 🛠️ 标准化页面审计 5 步闭环 SOP

### 第 1 步：课型定界与课标建模确认
- 确定属于 **A 类基础概念课**（定义/性质/直观，右屏严禁生硬堆砌大题推演链）还是 **B 类高考专题课**（三步破题推演链、定值不变量、评分采分点）。
- **课标参数合规性**：参数必须 100% 符合高中教材与高考题设体系（如动点分比 $t$、斜率截距 $k, b$、标准方程参数、事件概率），**严禁脱离课标的计算机/工程化建模**（如球坐标切面、高维噪声因子）。
- 检查适用前提条件 `condition` 与多表征支持是否完备。

### 第 2 步：左屏动线与三屏对账 (SSOT)
- **动线排布**：`模式(TabSwitcher) → 典型情景(SelectGrid) → 参数调节(ParamControl) → 教学导引(TipCard)`。
- **步骤自适应**：若含推演/作图控制器，步数与分支必须因题自适应（如立几截面 2/3/4 步、求导符号无根自适应），**严禁教条化一刀切硬编码固定步数**。
- **参数分组**：参数 $\ge 4$ 项时必须声明 `group` 属性（动自变量置顶，静态尺寸沉底），检查 `mapKeysToConfigs` 是否透传 `group`。
- **标签三位一体**：核查是否为 `\text{含义 } \color{Token}{代号}`。
- **TipCard 双要素**：检查是否落实【初始条件】+【核心设问】（探究句，严禁提前剧透配方解或极值答案）。

### 第 3 步：中屏作图与交互解耦
- **点标纯学术化**：画布内严禁手写 `<text>` 渲染浮点坐标，统一使用 `<SceneLabelGroup>`。
- **图例绝对绑定**：`<SceneLegend>` 中配置的 `colorKey` 必须与实际渲染图元 1-to-1 绝对一致。
- **交互解耦**：动点拖拽回调已是数学坐标，严禁二次调用 `designToMath`；拖拽动点自动切回自由探索 `free`。

### 第 4 步：右屏推导与代数消元
- **左问右解闭环**：左屏设问 $(1),(2),(3)$ 在右屏必须有对应的推导载体与数值代入。
- **推导链防断层铁律**：推导过程必须与题设已知量严格对齐，遵循 `已知条件/设元` $\to$ `核心方程/定理展开` $\to$ `数值代入求解` 三要素闭环，**严禁直接空降浮点数或跳步给答案**。
- **色彩 Token 绑定**：`paramPrimary`（红）、`paramSecondary`（橙）、`paramTertiary`（绿）三屏绝对同色。
- **代数标准消元**：严禁代码变量名泄露，系数为 1 省略，规范正负号。

### 第 5 步：CLI 自动化门禁与工程验证
运行以下自动化门禁命令，确保全部通过：

```bash
# 门禁 0：一键运行自动化静态代码与规范审计脚本
node .agents/skills/math-page-audit/scripts/audit_page.mjs src/features/<topic>

# 门禁 1：TypeScript 全量类型编译
npx tsc -b

# 门禁 2：全量单元测试与契约测试
npm test
```
