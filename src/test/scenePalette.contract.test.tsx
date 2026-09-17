/**
 * src/test/scenePalette.contract.test.ts
 * 中屏「图例 ↔ 画布同源」的机器契约
 *
 * 背景：本轮修复的根因是「图例一份配置、画布一份硬编码」，两侧各自漂移，
 * 出现「图例说橙、画布画蓝」「图例指向一条画布上根本不存在的曲线」「一个原点两个 O」。
 * 光把某一页改对只能治标，下列断言把「同源」变成机器可裁决的契约：
 *  1. 图例的每一项颜色必须真的来自 palette（而不是手写常量）；
 *  2. palette 里不单列进图例的对象必须写明 note（杜绝「画布上有、图例里没有」的静默遗漏）；
 *  3. 同一模式下点类对象颜色必须两两不同（两个不同对象同色 = 按图例对色必然认错）；
 *  4. 场景文件不得再直接取色（颜色只能来自 palette）。
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { CoordinateGrid } from "@/components/Math";
import type { SceneLegendItem } from "@/components/Math";
import { paletteColors } from "@/components/Math/scenePalette";
import type { ScenePalette } from "@/components/Math/scenePalette";
import { getShiftPalette } from "@/features/derivativeShift/scenePalette";
import { getDerivativeShiftLegendItems } from "@/features/derivativeShift/constants";
import {
  getEndpointLegendItems,
  getEndpointPalette,
} from "@/features/derivative-endpoint-taylor/scenePalette";
import { mockScale } from "@/test/mocks";

interface PageCase {
  page: string;
  mode: string;
  palette: ScenePalette;
}

/** 本轮纳入「图例↔画布同源」改造的页面（新增多模型页请一并登记） */
const PAGES: PageCase[] = [
  ...(["implicit_zero", "shift_symmetric", "log_mean"] as const).map(
    (mode) => ({
      page: "derivativeShift",
      mode,
      palette: getShiftPalette(mode),
    }),
  ),
  ...(["endpoint", "lhopital", "taylor"] as const).map((mode) => ({
    page: "derivativeEndpointTaylor",
    mode,
    palette: getEndpointPalette(mode),
  })),
];

/** 已接入 palette 的场景文件：颜色只允许来自 palette，不允许直接取色 */
const PALETTE_DRIVEN_SCENES = [
  "src/features/derivativeShift/components/DerivativeShiftScene.tsx",
  "src/features/derivative-endpoint-taylor/components/DerivativeEndpointTaylorScene.tsx",
];

describe("场景调色板契约：图例与画布同源", () => {
  it("每个页面每个模式都有非空调色板", () => {
    for (const { page, mode, palette } of PAGES) {
      expect(
        Object.keys(palette).length,
        `${page}/${mode} palette 为空`,
      ).toBeGreaterThan(0);
    }
  });

  it("图例颜色必须来自 palette，且覆盖所有声明了 label 的对象", () => {
    const cases: {
      page: string;
      mode: string;
      palette: ScenePalette;
      legend: SceneLegendItem[];
    }[] = [
      ...(["implicit_zero", "shift_symmetric", "log_mean"] as const).map(
        (mode) => ({
          page: "derivativeShift",
          mode,
          palette: getShiftPalette(mode),
          legend: getDerivativeShiftLegendItems(mode, "x_ln_x"),
        }),
      ),
      ...(["endpoint", "lhopital", "taylor"] as const).map((mode) => ({
        page: "derivativeEndpointTaylor",
        mode,
        palette: getEndpointPalette(mode),
        legend: getEndpointLegendItems(mode, {
          endpointType: "exp",
          taylorBase: "exp",
          taylorOrder: 2,
        }),
      })),
    ];

    for (const { page, mode, palette, legend } of cases) {
      const allowed = new Set(paletteColors(palette));
      const labelled = Object.values(palette).filter(
        (entry) => entry.label !== undefined,
      ).length;
      expect(
        legend.length,
        `${page}/${mode}：图例条数与 palette 中声明 label 的对象数不一致`,
      ).toBe(labelled);
      for (const item of legend) {
        expect(
          allowed.has(item.color ?? ""),
          `${page}/${mode}：图例出现 palette 之外的颜色 ${item.color}`,
        ).toBe(true);
      }
    }
  });

  it("不单列进图例的对象必须写明 note 说明原因", () => {
    for (const { page, mode, palette } of PAGES) {
      for (const [key, entry] of Object.entries(palette)) {
        if (entry.label === undefined) {
          expect(
            entry.note,
            `${page}/${mode}.${key} 既不在图例里，也没有 note 说明原因`,
          ).toBeTruthy();
        }
      }
    }
  });

  it("同一模式下点类对象（point / hollow-point）颜色必须两两不同", () => {
    for (const { page, mode, palette } of PAGES) {
      const points = Object.entries(palette).filter(
        ([, entry]) => entry.kind === "point" || entry.kind === "hollow-point",
      );
      const seen = new Map<string, string>();
      for (const [key, entry] of points) {
        const prev = seen.get(entry.color);
        expect(
          prev,
          `${page}/${mode}：${prev} 与 ${key} 同为点对象且同色 ${entry.color}，按图例对色必然认错`,
        ).toBeUndefined();
        seen.set(entry.color, key);
      }
    }
  });

  it("场景文件不得直接取色（颜色只能来自 palette）", () => {
    for (const rel of PALETTE_DRIVEN_SCENES) {
      const src = readFileSync(resolve(process.cwd(), rel), "utf8");
      expect(
        /MATH_COLORS\.\w+/.test(src),
        `${rel} 出现直接取色，应改为从同页 scenePalette 取值`,
      ).toBe(false);
    }
  });
});

describe("原点标识：画布上有且只有一个 O", () => {
  it("默认由坐标网格给出唯一一个 O", () => {
    render(
      <svg>
        <CoordinateGrid scale={mockScale} />
      </svg>,
    );
    expect(screen.getAllByText("O")).toHaveLength(1);
  });

  it("页面自绘原点标识时可关掉网格的 O，避免一个原点两个 O", () => {
    render(
      <svg>
        <CoordinateGrid scale={mockScale} showOriginLabel={false} />
      </svg>,
    );
    expect(screen.queryAllByText("O")).toHaveLength(0);
  });
});
