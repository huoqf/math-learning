import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CoordinateGrid } from "../CoordinateGrid";
import { calculateSceneScale } from "@/hooks/useSceneScale";

describe("CoordinateGrid", () => {
  const scale = calculateSceneScale({
    designVisibleW: 840,
    designVisibleH: 650,
    designLeft: 0,
    designTop: 0,
    xRange: [-4, 4],
    yRange: [-3, 3],
  });

  it("renders standard tick labels by default", () => {
    const { container } = render(
      <svg>
        <CoordinateGrid scale={scale} showLabels={true} />
      </svg>,
    );

    const texts = Array.from(container.querySelectorAll("text")).map(
      (t) => t.textContent,
    );
    expect(texts).toContain("1");
    expect(texts).toContain("-1");
    expect(texts).toContain("2");
    expect(texts).toContain("O");
    expect(texts).toContain("x");
    expect(texts).toContain("y");
  });

  it("applies custom xTickFormatter and yTickFormatter", () => {
    const xFormatter = (v: number) => (v === 0 ? "0" : `${v}π`);
    const yFormatter = (v: number) => `${v}U`;

    const { container } = render(
      <svg>
        <CoordinateGrid
          scale={scale}
          showLabels={true}
          xTickFormatter={xFormatter}
          yTickFormatter={yFormatter}
        />
      </svg>,
    );

    const texts = Array.from(container.querySelectorAll("text")).map(
      (t) => t.textContent,
    );
    expect(texts).toContain("1π");
    expect(texts).toContain("-1π");
    expect(texts).toContain("2U");
    expect(texts).toContain("-2U");
  });

  it("hides numeric tick labels when showLabels and showOriginLabel are false", () => {
    const { container } = render(
      <svg>
        <CoordinateGrid
          scale={scale}
          showLabels={false}
          showOriginLabel={false}
        />
      </svg>,
    );

    const texts = Array.from(container.querySelectorAll("text")).map(
      (t) => t.textContent,
    );
    // 只保留坐标轴末端标签 x 与 y，所有数值刻度和原点 O 全部隐藏
    expect(texts).toEqual(["x", "y"]);
  });
});
