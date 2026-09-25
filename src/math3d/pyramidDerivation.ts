/**
 * src/math3d/pyramidDerivation.ts
 * 锥体体积公式推导（三棱柱三等分与刘徽堑堵割体术：阳马与鳖臑）纯数学计算层
 *
 * 遵循公理 1：纯净领域模型，严禁任何 DOM/React/全局状态依赖
 */

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface PolygonFace {
  indices: number[]; // 顶点在 vertices 数组中的索引
  name?: string;
}

export interface PolyhedronPart {
  id: string;
  name: string;
  chineseName: string;
  formulaVolume: string;
  volume: number;
  volumeRatio: number; // 占母几何体体积比例
  vertices: Point3D[];
  faces: PolygonFace[];
  centroid: Point3D;
  explodeOffset: Point3D; // 爆炸位移方向单位向量 (归一化)
  colorKey: "paramPrimary" | "paramSecondary" | "paramTertiary";
  baseArea: number;
  height: number;
  description: string;
}

export interface PrismTripartitionData {
  a: number; // 底面边长 a
  b: number; // 底面边长 b
  h: number; // 柱体高度 h
  prismVolume: number; // 三棱柱体积 V = (1/2) a b h
  baseArea: number; // 底面积 S = (1/2) a b
  pyramidVolume: number; // 单个三棱锥体积 V_cone = (1/3) S h = (1/6) a b h
  parts: PolyhedronPart[];
}

export interface YangmaBienaoData {
  a: number; // 尺寸 a
  b: number; // 尺寸 b
  c: number; // 尺寸 c (高)
  qianduVolume: number; // 堑堵（直角三棱柱母体）总体积 V = (1/2) a b c
  cuboidVolume: number; // 对应长方体体积 V_长 = a b c
  yangmaVolume: number; // 阳马体积 = (1/3) a b c = (2/3) V_堑堵
  bienaoVolume: number; // 鳖臑体积 = (1/6) a b c = (1/3) V_堑堵
  volumeRatio: string; // "阳马 : 鳖臑 = 2 : 1"
  parts: PolyhedronPart[];
}

// 辅助向量加法与标量乘法
function add(p1: Point3D, p2: Point3D): Point3D {
  return { x: p1.x + p2.x, y: p1.y + p2.y, z: p1.z + p2.z };
}

function scale(p: Point3D, s: number): Point3D {
  return { x: p.x * s, y: p.y * s, z: p.z * s };
}

function computeCentroid(points: Point3D[]): Point3D {
  const n = points.length;
  if (n === 0) return { x: 0, y: 0, z: 0 };
  const sum = points.reduce((acc, p) => add(acc, p), { x: 0, y: 0, z: 0 });
  return scale(sum, 1 / n);
}

function normalize(v: Point3D): Point3D {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (len < 1e-6) return { x: 0, y: 1, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

/**
 * 模式一：直三棱柱三等分法纯数学数据
 * 直三棱柱 ABC - A₁B₁C₁：
 * A(0, 0, 0), B(a, 0, 0), C(0, b, 0)
 * A₁(0, 0, h), B₁(a, 0, h), C₁(0, b, h)
 *
 * 分解为 3 个三棱锥：
 * 锥 1: P₁ = A₁ - ABC (底面 ABC, 顶 A₁)
 * 锥 2: P₂ = A₁ - BCC₁ (底面 BCC₁, 顶 A₁)
 * 锥 3: P₃ = A₁ - B₁C₁B (底面 B₁C₁B, 顶 A₁) -> 亦即 C₁ - A₁B₁B
 */
export function calculatePrismTripartition(
  a: number,
  b: number,
  h: number,
): PrismTripartitionData {
  const safeA = Math.max(0.5, a);
  const safeB = Math.max(0.5, b);
  const safeH = Math.max(0.5, h);

  const baseArea = 0.5 * safeA * safeB;
  const prismVolume = baseArea * safeH;
  const singleVolume = prismVolume / 3;

  // 原始顶点
  const A: Point3D = { x: 0, y: 0, z: 0 };
  const B: Point3D = { x: safeA, y: 0, z: 0 };
  const C: Point3D = { x: 0, y: safeB, z: 0 };
  const A1: Point3D = { x: 0, y: 0, z: safeH };
  const B1: Point3D = { x: safeA, y: 0, z: safeH };
  const C1: Point3D = { x: 0, y: safeB, z: safeH };

  const prismCentroid = computeCentroid([A, B, C, A1, B1, C1]);

  // 锥 1: A₁ - ABC (顶点 A₁, 底面 ABC)
  const v1 = [A, B, C, A1];
  const c1 = computeCentroid(v1);
  const dir1 = normalize({
    x: c1.x - prismCentroid.x - 0.2,
    y: c1.y - prismCentroid.y - 0.4,
    z: c1.z - prismCentroid.z - 0.5,
  });

  // 锥 2: A₁ - BC C₁ (顶点 A₁, 底面 △BCC₁)
  const v2 = [B, C, C1, A1];
  const c2 = computeCentroid(v2);
  const dir2 = normalize({
    x: c2.x - prismCentroid.x + 0.3,
    y: c2.y - prismCentroid.y + 0.5,
    z: c2.z - prismCentroid.z,
  });

  // 锥 3: C₁ - A₁ B₁ B (等价于 A₁ - B B₁ C₁, 顶点 C₁, 底面 △A₁B₁B)
  const v3 = [A1, B1, B, C1];
  const c3 = computeCentroid(v3);
  const dir3 = normalize({
    x: c3.x - prismCentroid.x + 0.5,
    y: c3.y - prismCentroid.y - 0.3,
    z: c3.z - prismCentroid.z + 0.5,
  });

  // 构造标准四面体表面（每个三棱锥 4 个三角形面）
  const tetraFaces: PolygonFace[] = [
    { indices: [0, 1, 2] }, // 底面
    { indices: [0, 1, 3] }, // 侧面 1
    { indices: [1, 2, 3] }, // 侧面 2
    { indices: [2, 0, 3] }, // 侧面 3
  ];

  const part1: PolyhedronPart = {
    id: "part-pyramid-1",
    name: "Pyramid 1 (A₁-ABC)",
    chineseName: "三棱锥① A₁-ABC",
    formulaVolume: "\\frac{1}{3} S_{\\text{底}} h",
    volume: singleVolume,
    volumeRatio: 1 / 3,
    vertices: v1,
    faces: tetraFaces,
    centroid: c1,
    explodeOffset: dir1,
    colorKey: "paramPrimary",
    baseArea,
    height: safeH,
    description:
      "以原柱体下底面 △ABC 为底，高为侧棱高 h。体积占三棱柱总体积的 1/3。",
  };

  const part2: PolyhedronPart = {
    id: "part-pyramid-2",
    name: "Pyramid 2 (A₁-BCC₁)",
    chineseName: "三棱锥② A₁-BCC₁",
    formulaVolume: "\\frac{1}{3} S_{\\text{底}} h",
    volume: singleVolume,
    volumeRatio: 1 / 3,
    vertices: v2,
    faces: tetraFaces,
    centroid: c2,
    explodeOffset: dir2,
    colorKey: "paramSecondary",
    baseArea: 0.5 * Math.sqrt(safeA * safeA + safeB * safeB) * safeH,
    height: (safeA * safeB) / Math.sqrt(safeA * safeA + safeB * safeB),
    description:
      "以侧面矩形被对角线分割的直角三角形 △BCC₁ 为底，顶点为 A₁。与三棱锥③同顶同底面积，体积相等。",
  };

  const part3: PolyhedronPart = {
    id: "part-pyramid-3",
    name: "Pyramid 3 (C₁-A₁B₁B)",
    chineseName: "三棱锥③ C₁-A₁B₁B (A₁-BB₁C₁)",
    formulaVolume: "\\frac{1}{3} S_{\\text{底}} h",
    volume: singleVolume,
    volumeRatio: 1 / 3,
    vertices: v3,
    faces: tetraFaces,
    centroid: c3,
    explodeOffset: dir3,
    colorKey: "paramTertiary",
    baseArea: 0.5 * safeA * safeH,
    height: safeB,
    description:
      "以侧面直角三角形 △A₁B₁B 为底，顶点为 C₁。其底面面积与高分别与三棱锥①在侧面视角等价，体积相等。",
  };

  return {
    a: safeA,
    b: safeB,
    h: safeH,
    prismVolume,
    baseArea,
    pyramidVolume: singleVolume,
    parts: [part1, part2, part3],
  };
}

/**
 * 模式二：刘徽割体术（堑堵剖分为 1 阳马 + 1 鳖臑）
 * 母体为堑堵（直角三棱柱）：底面 △OAB 为直角三角形，直角在原点 O(0,0,0)
 * O(0,0,0), A(a,0,0), B(0,b,0)
 * O₁(0,0,c), A₁(a,0,c), B₁(0,b,c)
 * 堑堵体积 V_堑堵 = (1/2) a b c
 *
 * 沿截面 A₁OB 切开，严密分为两部分：
 * 1. 阳马（四棱锥）：
 *    顶点 A₁(a, 0, c)
 *    底面矩形 O B B₁ O₁（在面 x=0 上，长 b，高 c）
 *    侧棱 A₁O₁ = a 垂直于面 x=0，即为高！
 *    底面积 S_底 = bc，高 h = a
 *    体积 V_阳马 = (1/3) * bc * a = (1/3) a b c = (2/3) V_堑堵。
 *
 * 2. 鳖臑（三棱锥）：
 *    顶点 A₁(a, 0, c)
 *    底面直角三角形 △OAB（在面 z=0 上，直角边 a, b，面积 (1/2)ab）
 *    高为 AA₁ = c（侧棱垂直于底面）
 *    四个面全为直角三角形：△OAB, △AA₁O, △AA₁B, △A₁OB（三垂线定理）！
 *    体积 V_鳖臑 = (1/3) * (1/2 ab) * c = (1/6) a b c = (1/3) V_堑堵。
 *
 * 两者之和：(1/3)abc + (1/6)abc = (1/2)abc = V_堑堵！
 * 两者之比：V_阳马 : V_鳖臑 = 2 : 1！
 */
export function calculateYangmaBienao(
  a: number,
  b: number,
  c: number,
): YangmaBienaoData {
  const safeA = Math.max(0.5, a);
  const safeB = Math.max(0.5, b);
  const safeC = Math.max(0.5, c);

  const cuboidVolume = safeA * safeB * safeC;
  const qianduVolume = 0.5 * cuboidVolume;
  const yangmaVolume = (1 / 3) * cuboidVolume;
  const bienaoVolume = (1 / 6) * cuboidVolume;

  // 堑堵顶点
  const O: Point3D = { x: 0, y: 0, z: 0 };
  const A: Point3D = { x: safeA, y: 0, z: 0 };
  const B: Point3D = { x: 0, y: safeB, z: 0 };
  const O1: Point3D = { x: 0, y: 0, z: safeC };
  const A1: Point3D = { x: safeA, y: 0, z: safeC };
  const B1: Point3D = { x: 0, y: safeB, z: safeC };

  const qianduCentroid = computeCentroid([O, A, B, O1, A1, B1]);

  // 1. 阳马：顶点 A₁，底面矩形 O B B₁ O₁ (面 x=0)
  // 5 个顶点：O(0), B(1), B₁(2), O₁(3), A₁(4)
  const yangmaVertices = [O, B, B1, O1, A1];
  const yangmaCentroid = computeCentroid(yangmaVertices);
  const yangmaDir = normalize({
    x: yangmaCentroid.x - qianduCentroid.x - 0.4,
    y: yangmaCentroid.y - qianduCentroid.y + 0.5,
    z: yangmaCentroid.z - qianduCentroid.z + 0.3,
  });

  const yangmaFaces: PolygonFace[] = [
    { indices: [0, 1, 2, 3], name: "底面矩形 OBB₁O₁" },
    { indices: [0, 1, 4], name: "侧面 △OBA₁" },
    { indices: [1, 2, 4], name: "侧面 △BB₁A₁" },
    { indices: [2, 3, 4], name: "侧面 △B₁O₁A₁" },
    { indices: [3, 0, 4], name: "侧面 △O₁OA₁" },
  ];

  // 2. 鳖臑：顶点 A₁，底面直角三角形 △OAB (面 z=0)
  // 4 个顶点：O(0), A(1), B(2), A₁(3)
  const bienaoVertices = [O, A, B, A1];
  const bienaoCentroid = computeCentroid(bienaoVertices);
  const bienaoDir = normalize({
    x: bienaoCentroid.x - qianduCentroid.x + 0.5,
    y: bienaoCentroid.y - qianduCentroid.y - 0.4,
    z: bienaoCentroid.z - qianduCentroid.z - 0.5,
  });

  const bienaoFaces: PolygonFace[] = [
    { indices: [0, 1, 2], name: "底面 △OAB (直角)" },
    { indices: [0, 1, 3], name: "侧面 △OAA₁ (直角)" },
    { indices: [1, 2, 3], name: "侧面 △ABA₁ (直角)" },
    { indices: [0, 2, 3], name: "侧面 △OBA₁ (直角)" },
  ];

  const partYangma: PolyhedronPart = {
    id: "part-yangma",
    name: "Yangma (A₁-OBB₁O₁)",
    chineseName: "阳马（四棱锥）",
    formulaVolume: "\\frac{1}{3} a b c",
    volume: yangmaVolume,
    volumeRatio: 2 / 3, // 占堑堵 2/3
    vertices: yangmaVertices,
    faces: yangmaFaces,
    centroid: yangmaCentroid,
    explodeOffset: yangmaDir,
    colorKey: "paramPrimary",
    baseArea: safeB * safeC,
    height: safeA,
    description:
      "《九章算术》定义：底面为矩形、一侧棱垂直于底面的四棱锥。占直角三棱柱（堑堵）体积的 2/3，占长方体的 1/3。",
  };

  const partBienao: PolyhedronPart = {
    id: "part-bienao",
    name: "Bienao (A₁-OAB)",
    chineseName: "鳖臑（三棱锥）",
    formulaVolume: "\\frac{1}{6} a b c",
    volume: bienaoVolume,
    volumeRatio: 1 / 3, // 占堑堵 1/3
    vertices: bienaoVertices,
    faces: bienaoFaces,
    centroid: bienaoCentroid,
    explodeOffset: bienaoDir,
    colorKey: "paramSecondary",
    baseArea: 0.5 * safeA * safeB,
    height: safeC,
    description:
      "《九章算术》定义：四个面皆为直角三角形的三棱锥。占直角三棱柱（堑堵）体积的 1/3，占长方体的 1/6。阳马与鳖臑体积比恒为 2 : 1。",
  };

  return {
    a: safeA,
    b: safeB,
    c: safeC,
    qianduVolume,
    cuboidVolume,
    yangmaVolume,
    bienaoVolume,
    volumeRatio: "阳马 : 鳖臑 = 2 : 1",
    parts: [partYangma, partBienao],
  };
}
