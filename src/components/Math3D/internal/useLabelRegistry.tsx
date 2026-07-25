import { createContext, useContext, useEffect, useRef } from "react";

interface Entry {
  x: number;
  y: number;
  z: number;
  text: string;
}

interface Registry {
  entries: Entry[];
}

const RegistryContext = createContext<Registry | null>(null);

export const LabelRegistryProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const ref = useRef<Registry>({ entries: [] });
  return (
    <RegistryContext.Provider value={ref.current}>
      {children}
    </RegistryContext.Provider>
  );
};

const EPS = 0.05;

export function useLabelRegistry(
  pos: { x: number; y: number; z: number },
  text: string,
) {
  const registry = useContext(RegistryContext);
  useEffect(() => {
    if (!registry || !import.meta.env.DEV) return;
    const dup = registry.entries.find(
      (e) =>
        Math.hypot(e.x - pos.x, e.y - pos.y, e.z - pos.z) < EPS &&
        e.text !== text,
    );
    if (dup) {
      console.warn(
        `[Math3D] 检测到位置重叠的标签冲突: "${dup.text}" 与 "${text}" 几乎在同一位置，` +
          `请检查是否同时使用了 Label3D 与 PointLabel3D`,
      );
    }
    registry.entries.push({ ...pos, text });
    return () => {
      registry.entries = registry.entries.filter(
        (e) =>
          !(e.x === pos.x && e.y === pos.y && e.z === pos.z && e.text === text),
      );
    };
  }, [pos.x, pos.y, pos.z, text, registry]);
}
