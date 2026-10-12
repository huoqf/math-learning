import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  boundsCorners,
  boundingSphereOf,
  expandBounds,
  requiredCameraDistance,
  DEFAULT_CAMERA_FOV_DEG,
  type Bounds3D,
} from "@/math3d/sceneBounds";
import { mathToThree } from "@/math3d/coordinateConvention";
import {
  frustumA1UpperBound,
  polyhedronSceneBounds,
  type PolyhedronMode,
} from "@/math3d/polyhedronFeatures";
import {
  solidAxiomsSceneBounds,
  type AxiomsMode,
  type AxiomsSubType,
} from "@/math3d/solidAxioms";
import {
  defaultParams as solidDefaultParams,
  polyhedronFeaturesMeta,
} from "@/data/registries/solidGeometry";
import { PRESET_POSITIONS } from "@/hooks/use3DViewport";
import { LEGACY_3D_PAGE_BOUNDS } from "@/math3d/legacy3dBounds";

/**
 * 取景（framing）回归测试
 *
 * ## 为什么需要它
 * 三维页面使用**固定机位**，而既有契约测试只断言"3D 元素树非空 + 几何数值有限"，
 * **结构上无法发现"关键装置被裁出画布"**。典型翻车场景：棱台把上底拉到接近下底时
 * 补全大棱锥的顶点高达 `H = h/(1-k)`，顶点连同标注一起飞出视锥；棱柱把 h 拉满时
 * 顶面也被裁掉。
 *
 * 本测试用**独立的投影预言机**（自己实现透视投影与视锥判定）验证：
 * `<CameraFit>` 把相机摆到 `requiredCameraDistance` 之后，场景包围盒的 8 个角点
 * 全部落在 NDC 的 [-1, 1] 之内。
 *
 * 同时给出**反向对照**：把相机留在预设机位、不做适配时，部分配置确实会出框 ——
 * 以此证明本测试不是"恒真"的空壳（如果反向对照也全在框内，说明断言写错了）。
 */

const PADDING = 0.35; // 与 <CameraFit> 默认值一致
const FOV = DEFAULT_CAMERA_FOV_DEG; // 与 <ThreeDCanvas> 默认值一致

type V3 = { x: number; y: number; z: number };

/** `mathToThree` 返回元组，这里统一转成本测试用的对象形态 */
const toThree = (v: { x: number; y: number; z: number }): V3 => {
  const [x, y, z] = mathToThree(v);
  return { x, y, z };
};

const sub = (a: V3, b: V3): V3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
});
const dot = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: V3, b: V3): V3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
const norm = (a: V3) => Math.hypot(a.x, a.y, a.z);
const unit = (a: V3): V3 => {
  const n = norm(a);
  return n < 1e-12
    ? { x: 0, y: 0, z: 0 }
    : { x: a.x / n, y: a.y / n, z: a.z / n };
};

/**
 * 独立实现的透视投影预言机：把 three 坐标点投影到 NDC。
 * 与 `CameraFit` 没有任何代码共享，因此可以用来检验它的结果。
 */
function projectNdc(
  pointThree: V3,
  camPos: V3,
  target: V3,
  aspect: number,
): { x: number; y: number } {
  const forward = unit(sub(target, camPos));
  // 视线与 up 平行时（俯视机位）改用 z 轴作参考，避免叉积退化为零向量
  const upRef: V3 =
    Math.abs(forward.y) > 0.999 ? { x: 0, y: 0, z: 1 } : { x: 0, y: 1, z: 0 };
  const right = unit(cross(forward, upRef));
  const up = cross(right, forward);
  const d = sub(pointThree, camPos);
  const depth = dot(d, forward); // 相机前方为正
  const halfV = Math.tan((FOV * Math.PI) / 360);
  const xCam = dot(d, right);
  const yCam = dot(d, up);
  return {
    x: xCam / depth / (halfV * aspect),
    y: yCam / depth / halfV,
  };
}

/** 复刻 `<CameraFit>` 的机位计算：只后退不前进，方向不变，注视点移到场景中心 */
function fitCamera(
  bounds: Bounds3D,
  preset: [number, number, number],
  aspect: number,
): { camPos: V3; target: V3; required: number; backedOff: boolean } {
  const sphere = boundingSphereOf(expandBounds(bounds, PADDING));
  const target = toThree(sphere.center);
  const start: V3 = { x: preset[0], y: preset[1], z: preset[2] };
  const dir = sub(start, target);
  const distance = norm(dir);
  const required = requiredCameraDistance(sphere.radius, {
    fovDeg: FOV,
    aspect,
  });
  if (required <= 0 || distance >= required || distance < 1e-6) {
    return { camPos: start, target, required, backedOff: false };
  }
  return {
    camPos: {
      x: target.x + (dir.x / distance) * required,
      y: target.y + (dir.y / distance) * required,
      z: target.z + (dir.z / distance) * required,
    },
    target,
    required,
    backedOff: true,
  };
}

/** 检查包围盒角点是否全部落在画布内；返回出框角点数量与最大 |ndc| */
function frameCheck(
  bounds: Bounds3D,
  camPos: V3,
  target: V3,
  aspect: number,
): { outside: number; maxAbs: number } {
  let outside = 0;
  let maxAbs = 0;
  for (const corner of boundsCorners(expandBounds(bounds, PADDING))) {
    const ndc = projectNdc(toThree(corner), camPos, target, aspect);
    const m = Math.max(Math.abs(ndc.x), Math.abs(ndc.y));
    maxAbs = Math.max(maxAbs, m);
    if (m > 1) outside++;
  }
  return { outside, maxAbs };
}

// ============================================================================
// 用例数据：参数一律取自 registry 声明域，不手写第二套
// ============================================================================

const POLY_DEFAULTS = solidDefaultParams.polyhedronFeatures;
const AXIOMS_DEFAULTS = solidDefaultParams.solidAxioms;

const polyMeta = new Map(polyhedronFeaturesMeta.map((m) => [m.key, m]));
const maxOf = (key: string, fallback: number) =>
  polyMeta.get(key)?.max ?? fallback;
const minOf = (key: string, fallback: number) =>
  polyMeta.get(key)?.min ?? fallback;

interface PolyCase {
  mode: PolyhedronMode;
  label: string;
  params: { a: number; b: number; h: number; a1: number; a2: number };
}

const polyCases: PolyCase[] = [
  {
    mode: "prism",
    label: "棱柱 · 声明域上界",
    params: { ...POLY_DEFAULTS, a: maxOf("a", 5), h: maxOf("h", 6) },
  },
  {
    mode: "pyramid",
    label: "棱锥 · 声明域上界",
    params: { ...POLY_DEFAULTS, a: maxOf("a", 5), h: maxOf("h", 6) },
  },
  {
    mode: "frustum",
    label: "棱台 · 默认",
    params: { ...POLY_DEFAULTS },
  },
  {
    mode: "frustum",
    label: "棱台 · 相似比取到声明域可达上界（补全大锥 H 最远）",
    // 用域规则算出**真实可达**的 a₁：`min(a₁.max, a₂ − 0.5)`。
    // 直接写 4.5 会超出声明域，测的就不是学生能拖出来的场景了。
    params: {
      ...POLY_DEFAULTS,
      a2: maxOf("a2", 5),
      a1: frustumA1UpperBound(maxOf("a2", 5), {
        min: minOf("a1", 1),
        max: maxOf("a1", 3.5),
      }),
      h: maxOf("h", 6),
    },
  },
  {
    mode: "frustum",
    label: "棱台 · 下底最大、上底最小",
    params: {
      ...POLY_DEFAULTS,
      a2: maxOf("a2", 5),
      a1: minOf("a1", 1),
      h: maxOf("h", 6),
    },
  },
  {
    mode: "equalVolume",
    label: "等体积换底 · 声明域上界",
    params: {
      ...POLY_DEFAULTS,
      a: maxOf("a", 5),
      b: maxOf("b", 5),
      h: maxOf("h", 6),
    },
  },
];

interface AxiomsCase {
  mode: AxiomsMode;
  subType: AxiomsSubType;
  label: string;
  params: {
    tParam: number;
    tiltDeg: number;
    angleParamDeg: number;
    flipSecondRay: boolean;
  };
}

const axiomsBase = {
  tParam: AXIOMS_DEFAULTS.tParam,
  tiltDeg: AXIOMS_DEFAULTS.tiltDeg,
  angleParamDeg: AXIOMS_DEFAULTS.angleParamDeg,
  flipSecondRay: false,
};

const axiomsCases: AxiomsCase[] = [
  ...(
    [
      "threePoints",
      "lineAndPoint",
      "intersectingLines",
      "parallelLines",
    ] as AxiomsSubType[]
  ).flatMap((subType) =>
    [minOf("tParam", -2), maxOf("tParam", 2)].map((tParam) => ({
      mode: "determination" as AxiomsMode,
      subType,
      label: `平面确定 · ${subType} · Δz=${tParam}`,
      params: { ...axiomsBase, tParam },
    })),
  ),
  {
    mode: "intersection",
    subType: "threePoints",
    label: "两面相交 · 倾角下界",
    params: { ...axiomsBase, tiltDeg: 15 },
  },
  {
    mode: "intersection",
    subType: "threePoints",
    label: "两面相交 · 倾角上界",
    params: { ...axiomsBase, tiltDeg: 85 },
  },
  ...([false, true] as boolean[]).flatMap((flipSecondRay) =>
    [15, 120].map((angleParamDeg) => ({
      mode: "spatialLines" as AxiomsMode,
      subType: "threePoints" as AxiomsSubType,
      label: `平行与等角 · α=${angleParamDeg}° · 反向=${flipSecondRay}`,
      params: { ...axiomsBase, angleParamDeg, flipSecondRay },
    })),
  ),
];

/** 覆盖宽屏 / 方屏 / 窄到竖屏 —— CameraFit 必须两个方向都算 */
const ASPECTS = [1.6, 1.0, 0.6];

const PRESETS = ["iso", "front", "top", "side"] as const;

describe("3D 场景取景回归（关键装置不得被裁出画布）", () => {
  describe("多面体特征与台体体积推导", () => {
    for (const c of polyCases) {
      for (const aspect of ASPECTS) {
        for (const preset of PRESETS) {
          it(`[${c.label}] ${preset} · aspect=${aspect}：相机适配后全部角点在画布内`, () => {
            const bounds = polyhedronSceneBounds(c.mode, c.params);
            const { camPos, target } = fitCamera(
              bounds,
              PRESET_POSITIONS[preset],
              aspect,
            );
            const { outside, maxAbs } = frameCheck(
              bounds,
              camPos,
              target,
              aspect,
            );
            expect(
              outside,
              `[${c.label}] ${preset}@${aspect} 有 ${outside}/8 个包围盒角点出框（最大 |ndc|=${maxAbs.toFixed(3)}），` +
                `说明相机适配没有把场景完整纳入视野。`,
            ).toBe(0);
          });
        }
      }
    }
  });

  describe("空间公理与基本事实", () => {
    for (const c of axiomsCases) {
      for (const aspect of ASPECTS) {
        for (const preset of PRESETS) {
          it(`[${c.label}] ${preset} · aspect=${aspect}：相机适配后全部角点在画布内`, () => {
            const bounds = solidAxiomsSceneBounds(c.mode, c.subType, c.params);
            const { camPos, target } = fitCamera(
              bounds,
              PRESET_POSITIONS[preset],
              aspect,
            );
            const { outside, maxAbs } = frameCheck(
              bounds,
              camPos,
              target,
              aspect,
            );
            expect(
              outside,
              `[${c.label}] ${preset}@${aspect} 有 ${outside}/8 个包围盒角点出框（最大 |ndc|=${maxAbs.toFixed(3)}）。`,
            ).toBe(0);
          });
        }
      }
    }
  });

  describe("反向对照：本测试确实能发现出框（不是恒真的空壳）", () => {
    it("棱台 k→1 临界场景在预设机位（未做适配）下会出框", () => {
      const c = polyCases.find((x) => x.label.includes("声明域可达上界"))!;
      const bounds = polyhedronSceneBounds(c.mode, c.params);
      const aspect = 1.6;
      const sphere = boundingSphereOf(expandBounds(bounds, PADDING));
      const target = toThree(sphere.center);
      const raw: V3 = {
        x: PRESET_POSITIONS.iso[0],
        y: PRESET_POSITIONS.iso[1],
        z: PRESET_POSITIONS.iso[2],
      };
      const { outside } = frameCheck(bounds, raw, target, aspect);
      expect(
        outside,
        "该场景若在预设机位下也全在框内，说明本测试的判定阈值失效，无法捕捉取景问题。",
      ).toBeGreaterThan(0);
    });

    it("棱柱 h 拉满时在预设机位（未做适配）下会出框", () => {
      const c = polyCases.find((x) => x.mode === "prism")!;
      const bounds = polyhedronSceneBounds(c.mode, c.params);
      const aspect = 1.0;
      const sphere = boundingSphereOf(expandBounds(bounds, PADDING));
      const target = toThree(sphere.center);
      const raw: V3 = {
        x: PRESET_POSITIONS.iso[0],
        y: PRESET_POSITIONS.iso[1],
        z: PRESET_POSITIONS.iso[2],
      };
      const { outside } = frameCheck(bounds, raw, target, aspect);
      expect(outside).toBeGreaterThan(0);
    });
  });

  describe("CameraFit 的幂等与「只后退不前进」性质", () => {
    it("重复适配同一场景得到同一机位（幂等）", () => {
      const c = polyCases.find((x) => x.label.includes("声明域可达上界"))!;
      const bounds = polyhedronSceneBounds(c.mode, c.params);
      const first = fitCamera(bounds, PRESET_POSITIONS.iso, 1.6);
      const second = fitCamera(
        bounds,
        [first.camPos.x, first.camPos.y, first.camPos.z],
        1.6,
      );
      // 允许浮点误差：已在位时不应再产生可见位移
      for (const axis of ["x", "y", "z"] as const) {
        expect(second.camPos[axis]).toBeCloseTo(first.camPos[axis], 9);
      }
      expect(norm(sub(second.camPos, first.camPos))).toBeLessThan(1e-6);
    });

    it("已装得下的场景不做任何位移（不前进）", () => {
      const bounds = polyhedronSceneBounds("prism", {
        ...POLY_DEFAULTS,
        a: 1.5,
        h: 1.5,
      });
      const fit = fitCamera(bounds, PRESET_POSITIONS.iso, 1.6);
      expect(fit.backedOff).toBe(false);
      expect(fit.camPos).toEqual({
        x: PRESET_POSITIONS.iso[0],
        y: PRESET_POSITIONS.iso[1],
        z: PRESET_POSITIONS.iso[2],
      });
    });
  });

  describe("全库 14 个未接入 CameraFit 的 3D 页面全量取景量化台账（把未知变已知）", () => {
    it("量化台账：14 个存量页面清单完整且覆盖 100% 对应知识树节点", () => {
      expect(LEGACY_3D_PAGE_BOUNDS.length).toBe(14);
    });

    it("量化实测证明：14 个页面在极限参数且未适配机位下 100% 存在角点出框（证实系统性排除）", () => {
      for (const page of LEGACY_3D_PAGE_BOUNDS) {
        let maxOutside = 0;
        for (const preset of PRESETS) {
          const rawPos: V3 = {
            x: PRESET_POSITIONS[preset][0],
            y: PRESET_POSITIONS[preset][1],
            z: PRESET_POSITIONS[preset][2],
          };
          const target: V3 = { x: 0, y: 1.5, z: 0 };
          const { outside } = frameCheck(
            page.extremeBounds,
            rawPos,
            target,
            1.3,
          );
          maxOutside = Math.max(maxOutside, outside);
        }
        expect(
          maxOutside,
          `页面 ${page.name}(${page.pageId}) 在极限参数下应能被预言机检出至少 1 个出框角点`,
        ).toBeGreaterThan(0);
      }
    });

    it("数学预言证明：若对这 14 个页面应用 CameraFit 适配机位，则全机位下角点全部 100% 纳入画布 [-1, 1]", () => {
      for (const page of LEGACY_3D_PAGE_BOUNDS) {
        for (const aspect of ASPECTS) {
          for (const preset of PRESETS) {
            const { camPos, target } = fitCamera(
              page.extremeBounds,
              PRESET_POSITIONS[preset],
              aspect,
            );
            const { outside } = frameCheck(
              page.extremeBounds,
              camPos,
              target,
              aspect,
            );
            expect(
              outside,
              `页面 ${page.name}(${page.pageId}) 经 CameraFit 适配后在 ${preset}@${aspect} 仍有 ${outside} 角点出框`,
            ).toBe(0);
          }
        }
      }
    });

    it("视窗漂移量化：首屏 target [0,0,0] 与切换视角后 target [0,1.5,0] 带来确凿的可见视窗漂移", () => {
      const diffs: number[] = [];
      for (const page of LEGACY_3D_PAGE_BOUNDS) {
        const rawIso: V3 = {
          x: PRESET_POSITIONS.iso[0],
          y: PRESET_POSITIONS.iso[1],
          z: PRESET_POSITIONS.iso[2],
        };
        const initialCheck = frameCheck(
          page.defaultBounds,
          rawIso,
          { x: 0, y: 0, z: 0 },
          1.3,
        );
        const clickedCheck = frameCheck(
          page.defaultBounds,
          rawIso,
          { x: 0, y: 1.5, z: 0 },
          1.3,
        );
        diffs.push(Math.abs(initialCheck.maxAbs - clickedCheck.maxAbs));
      }
      const significantDiffs = diffs.filter((d) => d > 0.05);
      expect(significantDiffs.length).toBeGreaterThanOrEqual(10);
    });

    it("全库 16 个 3D 页面 100% 接入 CameraFit 刚性门禁（杜绝任何三维页面无取景防护）", () => {
      const featuresDir = path.resolve(__dirname, "../features");
      const findThreeCanvasFiles = (dir: string): string[] => {
        let results: string[] = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            results = results.concat(findThreeCanvasFiles(fullPath));
          } else if (entry.isFile() && entry.name.endsWith(".tsx")) {
            const content = fs.readFileSync(fullPath, "utf8");
            if (content.includes("<ThreeDCanvas")) {
              results.push(fullPath);
            }
          }
        }
        return results;
      };

      const canvasFiles = findThreeCanvasFiles(featuresDir);
      expect(canvasFiles.length).toBe(16);

      for (const file of canvasFiles) {
        const content = fs.readFileSync(file, "utf8");
        const relPath = path.relative(featuresDir, file).replace(/\\/g, "/");
        expect(
          content.includes("<CameraFit") ||
            content.includes("CameraFit bounds"),
          `3D 页面 ${relPath} 必须挂载 <CameraFit> 自适应取景组件`,
        ).toBe(true);
      }
    });
  });
});
