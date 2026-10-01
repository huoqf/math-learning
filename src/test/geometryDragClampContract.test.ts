/**
 * src/test/geometryDragClampContract.test.ts
 * 「解析几何专区中屏可拖拽手柄必须有钳制」静态契约（2026-10-01 新增）。
 *
 * 背景（09-30/10-01 两轮审查的 P1-7）：解析几何 12 个专区页面的
 * `<InteractivePoint>` 集体未接 `@/utils/paramClamp`，而全库其它 28 个文件都已接入。
 * 后果是 `InteractivePoint` 未拿到 `xRange/yRange` 时拖拽**完全不限幅**
 * （InteractivePoint.tsx:151-158：只有传了 range 才 clamp）：
 *   · 可把点拖出左屏滑块声明域 ⇒ 滑块卡在端点、图形却继续跑，读数与画面脱节；
 *   · 可把点拖出可见画布 ⇒ 手柄消失，再也抓不回来（只能用左屏滑块救回）。
 *
 * 本文件把「要么钳制、要么显式豁免」钉成契约：
 *   ① 作用域内每个带 `onDrag` 的 `<InteractivePoint>` 必须含
 *      `xRange`／`yRange`／`edgeClampProjection` 三者之一；
 *   ② 若某点在**原理上**无法用轴对齐一维区间守住（位置由角度参数决定、或拖拽先把点投影回
 *      曲线再反解参数），必须在下方 EXEMPTIONS 里显式登记并写明理由 —— 禁止静默放过。
 *
 * ⚠ 这是**结构守卫**，不是行为测试：它只保证"作者正面处理过钳制问题"，
 *   不保证区间取值正确（后者靠各页面的数学层单测与渲染层断言）。
 */

import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/** 解析几何专区（12 个 feature 目录） */
const SCOPED_DIRS = [
  "circleEquation",
  "circle-circle",
  "conicDefinition",
  "conicHomogenization",
  "conicLine",
  "conicParam",
  "conicParamT",
  "conicProperties",
  "line-circle",
  "lineEquation",
  "parabola",
  "parabolaArchimedes",
];

interface Exemption {
  /** 相对 src/features 的路径片段 */
  relPath: string;
  /** 该点标签块内必须出现的片段（用于唯一定位这个点） */
  contains: string;
  /** 为什么无法用轴对齐区间守住 */
  reason: string;
}

/**
 * 显式豁免清单：这些点的位置由「角度参数」或「投影回曲线后反解的参数」决定，
 * 与屏幕 x/y 不同轴，单轴一维区间在原理上守不住边界（硬套会把手柄钉死）。
 * 按 paramClamp.ts 文件头说明，此类点应走 `edgeClampProjection` 投影吸附。
 */
const EXEMPTIONS: Exemption[] = [
  {
    relPath: "conicDefinition/components/ConicDefinitionScene.tsx",
    contains: "sceneData.pPoint",
    reason:
      "动点位置由角度参数 θ 决定，且拖拽先投影回曲线再反解 θ；另需 edgeClampProjection 处理纵溢出",
  },
  {
    relPath: "conicParam/components/ConicParamScene.tsx",
    contains: "ellipseRes.P.",
    reason:
      "椭圆动点由角度 θ 经 atan2 反解决定，θ 与 x/y 轴离散对齐关系，无合法一维区间",
  },
  {
    relPath: "conicParamT/components/LineParamTScene.tsx",
    contains: "ptP.",
    reason:
      "t 是沿直线方向的有向投影长度，拖拽先把点投影回直线再反解 t，与 x/y 轴不同轴",
  },
  {
    relPath: "parabolaArchimedes/components/ParabolaArchimedesScene.tsx",
    contains: "chordAdv.A",
    reason: "焦点弦端点由角度参数 thetaDeg 决定，拖拽经 atan2 反解角度",
  },
  {
    relPath: "parabolaArchimedes/components/ParabolaArchimedesScene.tsx",
    contains: "orthoInfo.chordAB.A",
    reason: "正交弦端点同上，由角度参数决定",
  },
];

const FEATURES_DIR = join(process.cwd(), "src", "features");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry.endsWith(".tsx")) out.push(full);
  }
  return out;
}

interface Block {
  relPath: string;
  line: number;
  body: string;
}

function collectBlocks(files: string[]): Block[] {
  const blocks: Block[] = [];
  for (const file of files) {
    const src = readFileSync(file, "utf-8");
    let idx = 0;
    for (;;) {
      const at = src.indexOf("<InteractivePoint", idx);
      if (at < 0) break;
      const end = src.indexOf("/>", at);
      blocks.push({
        // 统一正斜杠，保证跨平台与 EXEMPTIONS 里的写法一致
        relPath: relative(FEATURES_DIR, file).replace(/\\/g, "/"),
        line: src.slice(0, at).split("\n").length,
        body: src.slice(at, end < 0 ? src.length : end + 2),
      });
      idx = at + 1;
    }
  }
  return blocks;
}

const scopedFiles = SCOPED_DIRS.flatMap((d) => {
  const dir = join(FEATURES_DIR, d);
  try {
    return walk(dir);
  } catch {
    return [];
  }
});

describe("解析几何专区 · 中屏可拖拽手柄钳制契约", () => {
  it("作用域非空（防止目录名写错导致空跑绿灯）", () => {
    expect(scopedFiles.length).toBeGreaterThan(20);
  });

  it("每个带 onDrag 的 <InteractivePoint> 必须钳制 (xRange/yRange/edgeClampProjection)，或显式豁免", () => {
    const violations: string[] = [];
    let dragPoints = 0;
    let exempted = 0;

    for (const b of collectBlocks(scopedFiles)) {
      if (!/\bonDrag\s*=/.test(b.body)) continue;
      dragPoints += 1;

      const clamped =
        /\bxRange\s*=/.test(b.body) ||
        /\byRange\s*=/.test(b.body) ||
        /\bedgeClampProjection\s*=/.test(b.body) ||
        // 展开写法：{...paramDragBounds(...)} / {...dragBounds(...)} / {...dragBounds}
        /\.\.\.\s*\w*[Dd]ragBounds\b/.test(b.body);
      if (clamped) continue;

      const hit = EXEMPTIONS.find(
        (e) => b.relPath === e.relPath && b.body.includes(e.contains),
      );
      if (hit) {
        exempted += 1;
        continue;
      }

      violations.push(
        `${b.relPath}:${b.line} —— ${b.body.split("\n")[0].trim()}`,
      );
    }

    // 防止"全部命中豁免"式的假绿：必须真的存在被钳制的点
    expect(dragPoints).toBeGreaterThan(exempted);

    expect(
      violations,
      "以下可拖拽手柄既未钳制、也不在 EXEMPTIONS 清单里：\n" +
        "请补 xRange/yRange（用 @/utils/paramClamp 的 paramDragBounds/paramDragRange），" +
        "或确属角度参数/投影反解类点在 EXEMPTIONS 登记并写明理由\n" +
        violations.map((v) => `  ${v}`).join("\n"),
    ).toEqual([]);
  });

  it("EXEMPTIONS 不得指向已不存在的点（防止豁免清单腐烂）", () => {
    const blocks = collectBlocks(scopedFiles);
    const stale = EXEMPTIONS.filter(
      (e) =>
        !blocks.some(
          (b) =>
            b.relPath === e.relPath &&
            b.body.includes(e.contains) &&
            /\bonDrag\s*=/.test(b.body),
        ),
    ).map((e) => `${e.relPath} :: ${e.contains}`);

    expect(
      stale,
      `以下豁免项已找不到对应的可拖拽点，请删除：\n  ${stale.join("\n  ")}`,
    ).toEqual([]);
  });
});
