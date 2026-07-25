import type { BufferGeometry } from "three";

interface DepthPrepassMeshProps {
  geometry: BufferGeometry;
}

/**
 * 只写深度、不写颜色的预写网格。
 *
 * 目的：让 opacity<1（depthWrite=false）的主体依旧能正确遮挡
 * 后方绘制的辅助线/虚线，避免半透明导致的深度测试失真。
 * 必须比主体和轮廓线更早渲染（renderOrder 更小）。
 */
export function DepthPrepassMesh({ geometry }: DepthPrepassMeshProps) {
  return (
    <mesh geometry={geometry} renderOrder={0}>
      <meshBasicMaterial colorWrite={false} depthWrite depthTest />
    </mesh>
  );
}
