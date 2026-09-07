import { describe, it, expect } from "vitest";
import {
  getParabolaArchimedesBase,
  getArchimedesTriangleInfo,
  getFocalChordAdvInfo,
  getOrthogonalChordsInfo,
} from "../parabolaArchimedes";

describe("parabolaArchimedes math library", () => {
  it("should calculate correct base info", () => {
    const base = getParabolaArchimedesBase(2);
    expect(base.p).toBe(2);
    expect(base.focus).toEqual({ x: 1, y: 0 });
    expect(base.directrixX).toBe(-1);
    expect(base.latusRectum).toBe(4);
  });

  describe("Archimedes Triangle properties", () => {
    it("should verify QA perp QB and chord passes focus for arbitrary yQ", () => {
      const p = 2;
      const yQ = 3;
      const info = getArchimedesTriangleInfo(p, yQ);

      expect(info.isPerpendicular).toBe(true);
      expect(info.chordPassesFocus).toBe(true);
      expect(info.isQFPerpAB).toBe(true);
      expect(info.isP0MidpointOfQM).toBe(true);
      expect(info.M.y).toBeCloseTo(yQ, 5);
      expect(info.P0.y).toBeCloseTo(yQ, 5);
      expect(info.areaQAB).toBeGreaterThanOrEqual(info.minArea - 1e-4);
      expect(info.areaParabolicSegment).toBeCloseTo((2 / 3) * info.areaQAB, 5);
    });

    it("should reach minimum area p^2 at latus rectum tangent (yQ = 0)", () => {
      const p = 3;
      const info = getArchimedesTriangleInfo(p, 0);

      expect(info.isPerpendicular).toBe(true);
      expect(info.areaQAB).toBeCloseTo(p * p, 4);
      expect(info.minArea).toBe(p * p);
      expect(info.A.y).toBeCloseTo(p, 4);
      expect(info.B.y).toBeCloseTo(-p, 4);
    });
  });

  describe("Focal Chord Advanced properties", () => {
    it("should verify harmonic sum 1/AF + 1/BF == 2/p and circle tangent to directrix", () => {
      const p = 2;
      const chord = getFocalChordAdvInfo(p, 60);

      expect(chord.harmonicSum).toBeCloseTo(2 / p, 4);
      expect(chord.prodY).toBeCloseTo(-p * p, 4);
      expect(chord.prodX).toBeCloseTo((p * p) / 4, 4);
      expect(chord.directrixTangentCircle.isTangent).toBe(true);
      expect(chord.directrixTangentCircle.tangentPointK.x).toBeCloseTo(
        -p / 2,
        4,
      );
      expect(chord.directrixTangentCircle.tangentPointK.y).toBeCloseTo(
        chord.midpointM.y,
        4,
      );
    });

    it("should verify latus rectum length is 2p at theta = 90 deg", () => {
      const p = 2.5;
      const chord = getFocalChordAdvInfo(p, 90);

      expect(chord.lengthAB).toBeCloseTo(2 * p, 4);
      expect(chord.lengthAF).toBeCloseTo(p, 4);
      expect(chord.lengthBF).toBeCloseTo(p, 4);
      expect(chord.focalRatio).toBeCloseTo(1, 4);
    });
  });

  describe("Orthogonal Focal Chords properties", () => {
    it("should verify 1/|AB| + 1/|CD| == 1/(2p) for any angle", () => {
      const p = 2;
      const info = getOrthogonalChordsInfo(p, 30);

      expect(info.harmonicSumChords).toBeCloseTo(1 / (2 * p), 4);
      expect(info.sumLengths).toBeGreaterThanOrEqual(info.minSumLengths - 1e-4);
      expect(info.quadrilateralArea).toBeGreaterThanOrEqual(
        info.minArea - 1e-4,
      );
    });

    it("should reach minimum sum and area at theta = 45 deg", () => {
      const p = 2;
      const info = getOrthogonalChordsInfo(p, 45);

      expect(info.sumLengths).toBeCloseTo(8 * p, 4);
      expect(info.quadrilateralArea).toBeCloseTo(8 * p * p, 4);
    });
  });
});
