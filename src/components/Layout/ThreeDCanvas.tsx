import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { Suspense, type ReactNode } from "react";
import { CANVAS_COLORS } from "@/theme/math/colors";
import { LabelRegistryProvider } from "@/components/Math3D/internal/useLabelRegistry";

interface ThreeDCanvasProps {
  children: ReactNode;
  legend?: ReactNode;
  overlay?: ReactNode;
  cameraPosition?: [number, number, number];
  fov?: number;
  frameloop?: "always" | "demand";
}

export const ThreeDCanvas = ({
  children,
  legend,
  overlay,
  cameraPosition = [6, 5, 8],
  fov = 45,
  frameloop = "demand",
}: ThreeDCanvasProps) => (
  <div
    className="relative w-full h-full rounded-xl overflow-hidden"
    style={{ background: CANVAS_COLORS.white }}
  >
    {overlay}
    <Canvas
      frameloop={frameloop}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
      onCreated={({ gl }) => gl.setClearColor(CANVAS_COLORS.white)}
    >
      <PerspectiveCamera makeDefault position={cameraPosition} fov={fov} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} />
      <Suspense fallback={null}>
        <LabelRegistryProvider>{children}</LabelRegistryProvider>
      </Suspense>
    </Canvas>
    {legend}
  </div>
);
