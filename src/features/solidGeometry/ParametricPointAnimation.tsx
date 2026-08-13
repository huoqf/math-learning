import { useState, useMemo } from "react";
import { ThreePanel } from "@/components/Layout/ThreePanel";
import { ThreeDCanvas } from "@/components/Layout/ThreeDCanvas";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  MathPanel,
  TabSwitcher,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import {
  Scene3DGrid,
  Vector3DArrow,
  Point3D,
  PointLabel3D,
  FormulaLabel3D,
  Legend3D,
  CameraRig,
} from "@/components/Math3D";
import { Cuboid } from "@/components/Math3D/solids";
import { use3DViewport } from "@/hooks/use3DViewport";
import { solidParametricMeta } from "@/data/registries/solidGeometry";
import type { Vec3 } from "@/math3d/vector3";

export default function ParametricPointAnimation() {
  const [params, setParams] = useState<Record<string, number>>({
    a: 4,
    b: 3,
    c: 3,
    lambda: 0.5,
  });

  const { preset, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  const a = params.a ?? 4;
  const b = params.b ?? 3;
  const c = params.c ?? 3;
  const lambda = params.lambda ?? 0.5;

  // 长方体顶点与棱上动点 P 解算
  // A(0,0,0), B(a,0,0), C(a,b,0), D(0,b,0)
  // A1(0,0,c), B1(a,0,c), C1(a,b,c), D1(0,b,c)
  // 动点 P 在侧棱 BB1 上: P(a, 0, lambda * c)
  const A: Vec3 = { x: 0, y: 0, z: 0 };
  const B: Vec3 = { x: a, y: 0, z: 0 };
  const C: Vec3 = { x: a, y: b, z: 0 };
  const D: Vec3 = { x: 0, y: b, z: 0 };
  const B1: Vec3 = { x: a, y: 0, z: c };
  const D1: Vec3 = { x: 0, y: b, z: c };

  // 动点 P 的坐标: P = B + lambda * (B1 - B) = (a, 0, lambda * c)
  const P: Vec3 = { x: a, y: 0, z: lambda * c };

  // 看板数据组装
  const mathData = useMemo(() => {
    // 截面 PAC 的法向量 n = (x, y, z)
    // AP = (a, 0, lambda * c), AC = (a, b, 0)
    // n = (lambda * b * c, -lambda * a * c, -a * b)
    const nx = lambda * b * c;
    const ny = -lambda * a * c;
    const nz = -a * b;
    const lenN = Math.sqrt(nx * nx + ny * ny + nz * nz);

    // 点 D 到平面 PAC 的距离 d = |DA · n| / |n|
    // DA = (0, -b, 0) => DA · n = b * lambda * a * c
    const distDToPAC = (a * b * c * lambda) / lenN;

    // 二面角 (平面 PAC 与底面 ABCD) 余弦值 = |nz| / lenN
    const cosDihedral = (a * b) / lenN;
    const angleDihedralDeg = (Math.acos(cosDihedral) * 180) / Math.PI;

    return {
      quantities: [
        {
          label: "动点参数 λ",
          symbol: "\\lambda = \\frac{BP}{BB_1}",
          value: Number(lambda.toFixed(2)),
          color: "#EF4444",
        },
        {
          label: "动点 P 空间坐标",
          symbol: "P",
          value: `(${a}, 0, ${(lambda * c).toFixed(2)})`,
          color: "#D97706",
        },
        {
          label: "动截面 PAC 法向量",
          symbol: "\\vec{n}(\\lambda)",
          value: `(${nx.toFixed(1)}, ${ny.toFixed(1)}, ${nz.toFixed(1)})`,
          color: "#059669",
        },
        {
          label: "点 D 到平面 PAC 距离",
          symbol: "d(\\lambda)",
          value: Number(distDToPAC.toFixed(3)),
          color: "#3B82F6",
        },
        {
          label: "二面角 P-AC-B",
          symbol: "\\theta(\\lambda)",
          value: `${angleDihedralDeg.toFixed(2)}°`,
          color: "#8B5CF6",
        },
      ],
      theorems: [
        {
          name: "空间动点向量坐标化定理",
          latex:
            "\\vec{OP}(\\lambda) = (1-\\lambda)\\vec{OB} + \\lambda \\vec{OB_1}",
          level: "core" as const,
          condition: "λ ∈ [0, 1] 决定动点在线段上的相对位置",
        },
        {
          name: "向量法探究动点存在性方程",
          latex:
            "\\sin \\theta(\\lambda) = \\frac{|\\vec{u} \\cdot \\vec{n}(\\lambda)|}{|\\vec{u}||\\vec{n}(\\lambda)|} = k_0",
          level: "important" as const,
          note: "解关于 λ 的无理/二次方程求出是否存在满足条件的 λ 值",
        },
      ],
      gaokaoPoints: [
        {
          text: "高考大题第 2 问存在性探究题口诀：“设出坐标用 λ 表示，列方程化简求解”。当 λ 有解且属于 [0, 1] 时存在，否则不存在。",
          importance: "gaokao" as const,
        },
        {
          text: "最值探究：利用单调性或均值不等式，求出线段长度 |DP| 或点面距离 d(λ) 在 λ ∈ [0, 1] 上的极大/极小值。",
          importance: "gaokao" as const,
        },
      ],
      warnings:
        lambda === 0
          ? [
              {
                text: "λ = 0 时动点 P 退化落于顶点 B 处，平面 PAC 退化为直线 ABC！",
                level: "warning" as const,
              },
            ]
          : [],
    };
  }, [a, b, c, lambda]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setParams({ a: 4, b: 3, c: 3, lambda: 0.5 });
  };

  const paramConfigs = useMemo<ParamConfig[]>(
    () =>
      solidParametricMeta.map((meta) => ({
        key: meta.key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        value: params[meta.key] ?? meta.defaultValue ?? 0,
        min: meta.min,
        max: meta.max,
        step: meta.step ?? 0.01,
        description: meta.description,
        descriptionFormula: meta.descriptionFormula,
        importance: meta.importance,
        marks: meta.marks,
      })),
    [params],
  );

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection
            title="动点与几何尺寸调节"
            subtitle="拖动 λ 滑块观察动点 P 沿着棱 BB₁ 连续移动"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          <LeftPanelSection title="3D 视角选择">
            <TabSwitcher
              tabs={[
                { key: "iso", label: "轴测" },
                { key: "front", label: "主视" },
                { key: "top", label: "俯视" },
                { key: "side", label: "左视" },
              ]}
              value={preset}
              onChange={(p) => setCameraPreset(p as any)}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <ThreeDCanvas
          cameraPosition={cameraPosition}
          legend={
            <Legend3D
              title="图例"
              items={[
                { colorKey: "primary", swatch: "area", label: "长方体主体" },
                { colorKey: "highlight", swatch: "line", label: "动点 P 轨迹" },
                { colorKey: "accent", swatch: "line", label: "连线 DP" },
              ]}
            />
          }
        >
          <CameraRig ref={controlsRef} />
          <Scene3DGrid size={5} />

          {/* 长方体框架 */}
          <Cuboid a={a} b={b} c={c} opacity={0.12} colorKey="primary" />

          {/* 动线段 DP */}
          <Vector3DArrow from={D} to={P} colorKey="accent" />
          {/* 动截面 PAC 三角形线框 */}
          <Vector3DArrow from={A} to={P} colorKey="highlight" />
          <Vector3DArrow from={P} to={C} colorKey="highlight" />
          <Vector3DArrow from={C} to={A} colorKey="highlight" />

          {/* 可拖拽 3D 动点 P (在棱 BB1 上) */}
          <Point3D
            position={P}
            draggable
            constrain={(raw) => ({
              x: a,
              y: 0,
              z: Math.min(c, Math.max(0, raw.z)),
            })}
            onDrag={(next) =>
              setParams((prev) => ({
                ...prev,
                lambda: Number((next.z / c).toFixed(2)),
              }))
            }
            colorKey="highlight"
          />

          {/* 顶点文本标号 */}
          <PointLabel3D position={A} text="A" />
          <PointLabel3D position={B} text="B" />
          <PointLabel3D position={C} text="C" />
          <PointLabel3D position={D} text="D" />
          <PointLabel3D position={B1} text="B1" />
          <PointLabel3D position={D1} text="D1" />
          <PointLabel3D position={P} text="P(λ)" offset={[0.1, 0.1, 0.1]} />

          <FormulaLabel3D
            position={{ x: P.x + 0.2, y: 0, z: P.z }}
            tex={`\\lambda=${lambda}`}
          />
        </ThreeDCanvas>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          title="动点存在性与最值看板"
        />
      }
    />
  );
}
