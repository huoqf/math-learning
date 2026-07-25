import { useMemo } from "react";
import * as THREE from "three";
import { mathToThree } from "@/math3d/coordinateConvention";
import { MATH_COLORS } from "@/theme/math/colors";
import type { Vec3 } from "@/math3d/vector3";

interface Vector3DArrowProps {
  from: Vec3;
  to: Vec3;
  colorKey?: keyof typeof MATH_COLORS;
  headLength?: number;
  headWidth?: number;
}

export const Vector3DArrow = ({
  from,
  to,
  colorKey = "primary",
  headLength = 0.22,
  headWidth = 0.13,
}: Vector3DArrowProps) => {
  const arrow = useMemo(() => {
    const origin = new THREE.Vector3(...mathToThree(from));
    const target = new THREE.Vector3(...mathToThree(to));
    const dir = target.clone().sub(origin);
    const len = dir.length();
    dir.normalize();
    return new THREE.ArrowHelper(
      dir,
      origin,
      len,
      new THREE.Color(MATH_COLORS[colorKey]).getHex(),
      headLength,
      headWidth,
    );
  }, [from, to, colorKey, headLength, headWidth]);
  return <primitive object={arrow} />;
};
