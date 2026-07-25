import { useMemo, useState } from "react";
import { SectionPlane3D, CameraRig, Scene3DGrid } from "@/components/Math3D";
import { Cuboid } from "@/components/Math3D/solids";
import {
  buildCuboidPolyhedron,
  intersectConvexPolyhedronPlane,
} from "@/math3d/sectionIntersection";
import { ThreeDCanvas } from "@/components/Layout/ThreeDCanvas";
import { ThreePanel } from "@/components/Layout/ThreePanel";
import { LeftPanel, LeftPanelSection } from "@/components/UI/LeftPanel";
import { ParamControl, type ParamConfig } from "@/components/UI/ParamControl";
import type { Plane } from "@/math3d/plane";

export default function SectionCuboidDemo() {
  const [cutHeight, setCutHeight] = useState(2);
  const [tiltDeg, setTiltDeg] = useState(0);

  const width = 3;
  const depth = 2;
  const height = 4;

  const plane = useMemo((): Plane => {
    const tilt = (tiltDeg * Math.PI) / 180;
    return {
      point: { x: 0, y: 0, z: cutHeight },
      normal: { x: Math.sin(tilt), y: 0, z: Math.cos(tilt) },
    };
  }, [cutHeight, tiltDeg]);

  const sectionPoints = useMemo(() => {
    const poly = buildCuboidPolyhedron(width, depth, height);
    return intersectConvexPolyhedronPlane(poly, plane);
  }, [width, depth, height, plane]);

  const paramConfigs = useMemo<ParamConfig[]>(
    () => [
      {
        key: "cutHeight",
        label: "截面高度",
        min: 0,
        max: height,
        step: 0.1,
        value: cutHeight,
      },
      {
        key: "tiltDeg",
        label: "截面倾斜角",
        min: -60,
        max: 60,
        step: 1,
        value: tiltDeg,
        unit: "°",
      },
    ],
    [cutHeight, tiltDeg],
  );

  const handleParamChange = (key: string, value: number) => {
    if (key === "cutHeight") setCutHeight(value);
    else if (key === "tiltDeg") setTiltDeg(value);
  };

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection
            title="截面参数"
            subtitle="调节切割平面的位置与角度"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <ThreeDCanvas cameraPosition={[6, 5, 8]}>
          <CameraRig />
          <Scene3DGrid size={4} />
          <Cuboid a={width} b={depth} c={height} opacity={0.2} />
          <SectionPlane3D
            sectionPoints={sectionPoints}
            plane={plane}
            planeExtent={Math.max(width, depth) * 0.8}
          />
        </ThreeDCanvas>
      }
      right={
        <LeftPanel>
          <LeftPanelSection title="截面信息" subtitle="当前截面的几何属性">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">截面顶点数</span>
                <span className="font-mono font-semibold">
                  {sectionPoints.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">截面形状</span>
                <span className="font-semibold">
                  {sectionPoints.length === 3
                    ? "三角形"
                    : sectionPoints.length === 4
                      ? "四边形"
                      : sectionPoints.length === 5
                        ? "五边形"
                        : sectionPoints.length === 6
                          ? "六边形"
                          : `${sectionPoints.length} 边形`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">平面法向量</span>
                <span className="font-mono text-xs">
                  ({plane.normal.x.toFixed(2)}, {plane.normal.y.toFixed(2)},{" "}
                  {plane.normal.z.toFixed(2)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">截面高度</span>
                <span className="font-mono">{cutHeight.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">倾斜角</span>
                <span className="font-mono">{tiltDeg}°</span>
              </div>
            </div>
          </LeftPanelSection>
          <LeftPanelSection title="知识点" subtitle="长方体截面的高考考点">
            <div className="space-y-2 text-sm text-neutral-600">
              <p>
                • 长方体被平面所截，截面必为<strong>凸多边形</strong>
              </p>
              <p>• 截面顶点数 ∈ {"{3, 4, 5, 6}"}</p>
              <p>
                • 水平截面与底面<strong>全等</strong>
              </p>
              <p>
                • 倾斜截面可产生<strong>菱形、梯形</strong>等特殊四边形
              </p>
            </div>
          </LeftPanelSection>
        </LeftPanel>
      }
    />
  );
}
