import type { KnowledgeNode } from './types'

export const knowledgeTree: KnowledgeNode[] = [
  // 1. 集合与常用逻辑
  {
    id: 'know-set-venn',
    title: '集合的基本运算与 Venn 图',
    chapter: '集合与常用逻辑',
    module: '集合运算',
    importance: 'basic',
    animationIds: ['anim-set-venn'],
    prerequisites: []
  },
  // 2. 不等式
  {
    id: 'know-ineq-basic',
    title: '基本不等式及其几何证明',
    chapter: '不等式',
    module: '基本不等式',
    importance: 'core',
    animationIds: ['anim-ineq-basic'],
    prerequisites: []
  },
  // 3. 函数概念与性质
  {
    id: 'know-func-properties',
    title: '函数的单调性与奇偶性',
    chapter: '函数概念与性质',
    module: '函数的基本性质',
    importance: 'core',
    animationIds: ['anim-func-properties'],
    prerequisites: []
  },
  {
    id: 'know-quadratic',
    title: '二次函数与一元二次方程、不等式',
    chapter: '函数概念与性质',
    module: '二次函数',
    importance: 'core',
    animationIds: ['anim-quadratic'],
    prerequisites: ['know-func-properties']
  },
  // 4. 导数及其应用
  {
    id: 'know-derivative-tangent',
    title: '导数的几何意义与切线方程',
    chapter: '导数及其应用',
    module: '导数概念',
    importance: 'gaokao',
    animationIds: ['anim-derivative-tangent'],
    prerequisites: ['know-func-properties']
  },
  {
    id: 'know-derivative-compare',
    title: '导数与函数的单调性及极值',
    chapter: '导数及其应用',
    module: '导数的应用',
    importance: 'hard',
    animationIds: ['anim-derivative-compare'],
    prerequisites: ['know-derivative-tangent']
  },
  // 5. 三角函数
  {
    id: 'know-trig-unit-circle',
    title: '任意角与单位圆中的三角函数线',
    chapter: '三角函数',
    module: '三角函数概念',
    importance: 'core',
    animationIds: ['anim-trig-unit-circle'],
    prerequisites: []
  },
  {
    id: 'know-trig-transform',
    title: '三角函数 y=Asin(ωx+φ) 图像变换',
    chapter: '三角函数',
    module: '三角函数的图像与性质',
    importance: 'core',
    animationIds: ['anim-trig-transform'],
    prerequisites: ['know-trig-unit-circle']
  },
  {
    id: 'know-triangle-solve',
    title: '正弦定理、余弦定理与解三角形',
    chapter: '三角函数',
    module: '解三角形',
    importance: 'gaokao',
    animationIds: ['anim-triangle-solve'],
    prerequisites: []
  },
  // 6. 平面向量与复数
  {
    id: 'know-vector-linear',
    title: '平面向量的线性运算与共线',
    chapter: '平面向量与复数',
    module: '平面向量',
    importance: 'basic',
    animationIds: ['anim-vector-linear'],
    prerequisites: []
  },
  {
    id: 'know-vector-dot-product',
    title: '平面向量的数量积与几何投影',
    chapter: '平面向量与复数',
    module: '平面向量',
    importance: 'core',
    animationIds: ['anim-vector-dot-product'],
    prerequisites: ['know-vector-linear']
  },
  {
    id: 'know-complex-geometry',
    title: '复数的几何意义与乘法旋转',
    chapter: '平面向量与复数',
    module: '复数',
    importance: 'core',
    animationIds: ['anim-complex-geometry'],
    prerequisites: ['know-vector-linear']
  },
  // 7. 数列
  {
    id: 'know-sequence-geom',
    title: '等差与等比数列的几何直观',
    chapter: '数列',
    module: '等差与等比数列',
    importance: 'core',
    animationIds: ['anim-sequence-geom'],
    prerequisites: []
  },
  // 8. 立体几何与空间向量
  {
    id: 'know-solid-position',
    title: '空间线面平行与垂直判定定理',
    chapter: '立体几何与空间向量',
    module: '立体几何',
    importance: 'core',
    animationIds: ['anim-solid-position'],
    prerequisites: []
  },
  {
    id: 'know-solid-angle',
    title: '空间直角坐标系与求空间角',
    chapter: '立体几何与空间向量',
    module: '空间向量应用',
    importance: 'hard',
    animationIds: ['anim-solid-angle'],
    prerequisites: ['know-solid-position']
  },
  // 9. 解析几何
  {
    id: 'know-conic-definition',
    title: '圆锥曲线的定义与轨迹生成',
    chapter: '解析几何',
    module: '圆锥曲线',
    importance: 'gaokao',
    animationIds: ['anim-conic-definition'],
    prerequisites: []
  },
  {
    id: 'know-conic-properties',
    title: '椭圆与双曲线的几何性质及离心率',
    chapter: '解析几何',
    module: '圆锥曲线',
    importance: 'gaokao',
    animationIds: ['anim-conic-properties'],
    prerequisites: ['know-conic-definition']
  },
  {
    id: 'know-conic-line',
    title: '直线与圆锥曲线位置关系与弦长',
    chapter: '解析几何',
    module: '圆锥曲线',
    importance: 'hard',
    animationIds: ['anim-conic-line'],
    prerequisites: ['know-conic-properties']
  },
  // 10. 概率与统计
  {
    id: 'know-probability-normal',
    title: '频率直方图与正态分布曲线',
    chapter: '概率与统计',
    module: '随机变量及其分布',
    importance: 'gaokao',
    animationIds: ['anim-probability-normal'],
    prerequisites: []
  }
]

export const knowledgeIndex: Record<string, KnowledgeNode> = {}

knowledgeTree.forEach(node => {
  knowledgeIndex[node.id] = node
})

export function getKnowledgeNode(id: string): KnowledgeNode | undefined {
  return knowledgeIndex[id]
}

