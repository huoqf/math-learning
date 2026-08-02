import { c as createLucideIcon, j as jsxRuntimeExports, r as reactExports } from "./index-DT9BKSox.js";
import { b as MATH_COLORS, T as ThreePanel, M as MathPanel, L as LeftPanel, a as LeftPanelSection, P as ParamControl } from "./probabilityBayes-DNLi5nE3.js";
import { S as Shape, L as Line, D as DoubleSide, u as use3DViewport, T as ThreeDCanvas, C as CameraRig, a as Scene3DGrid, b as Legend3D } from "./Legend3D-DaYU3ia-.js";
import { T as TabSwitcher } from "./TabSwitcher--Cq6ch7f.js";
import { S as SelectGrid } from "./SelectGrid-Ce2XNEmL.js";
import { b as buildSolidViews, T as ThreeViewsPanel } from "./buildSolidViews-B44gnRMc.js";
import { R as RotationSolid, s as sphereProfile, f as frustumProfile, c as coneProfile, a as cylinderProfile } from "./RotationSolid-O5oRCvD8.js";
import { r as rotationBodyMeta } from "./solidGeometry-Q14xCXek.js";
import { b as buildMathQuantities } from "./mathQuantities-CPwsyb9V.js";
import "./useRadioGroup-DJLu5uAU.js";
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const LoaderCircle = createLucideIcon("LoaderCircle", [
  ["path", { d: "M21 12a9 9 0 1 1-6.219-8.56", key: "13zald" }]
]);
const Button = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  ...props
}) => {
  const baseStyles = [
    "relative inline-flex items-center justify-center font-medium rounded-md transition-all duration-fast ease-standard",
    "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
    "active:scale-[0.97]"
  ];
  const variantStyles = {
    primary: [
      "bg-primary-600 text-white",
      "hover:bg-primary-700",
      "active:bg-primary-800",
      "disabled:bg-neutral-300 disabled:cursor-not-allowed"
    ],
    secondary: [
      "bg-white text-primary-700 border border-primary-300",
      "hover:bg-primary-50 hover:border-primary-400",
      "active:bg-primary-100",
      "disabled:border-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed"
    ],
    ghost: [
      "bg-transparent text-neutral-700",
      "hover:bg-neutral-100",
      "active:bg-neutral-200",
      "disabled:text-neutral-400 disabled:cursor-not-allowed"
    ],
    danger: [
      "bg-danger-500 text-white",
      "hover:bg-danger-600",
      "active:bg-danger-700",
      "disabled:bg-neutral-300 disabled:cursor-not-allowed"
    ]
  };
  const sizeStyles = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base"
  };
  const isDisabled = disabled || loading;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      disabled: isDisabled,
      "aria-busy": loading,
      className: [
        ...baseStyles,
        ...variantStyles[variant],
        sizeStyles[size],
        isDisabled && "opacity-40 cursor-not-allowed",
        className
      ].filter(Boolean).join(" "),
      ...props,
      children: [
        loading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: loading ? "opacity-0" : "inline-flex items-center justify-center", children })
      ]
    }
  );
};
const RotationSweep = ({
  profile,
  sweepAngleDeg,
  axisHeight = 4,
  colorKey = "primary",
  hasTopCap = true,
  hasBottomCap = true
}) => {
  const angleRad = sweepAngleDeg / 180 * Math.PI;
  const isComplete = sweepAngleDeg >= 359.5;
  const closedLoop = reactExports.useMemo(
    () => [
      ...profile.map((p) => [p.r, p.z, 0]),
      [profile[0].r, profile[0].z, 0]
    ],
    [profile]
  );
  const profileShape = reactExports.useMemo(() => {
    const shape = new Shape();
    profile.forEach(
      (p, i) => i === 0 ? shape.moveTo(p.r, p.z) : shape.lineTo(p.r, p.z)
    );
    shape.lineTo(profile[0].r, profile[0].z);
    return shape;
  }, [profile]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Line,
      {
        points: [
          [0, -0.3, 0],
          [0, axisHeight + 0.3, 0]
        ],
        color: MATH_COLORS.axis3D_Z,
        lineWidth: 1,
        dashed: true,
        dashSize: 0.1,
        gapSize: 0.08
      }
    ),
    sweepAngleDeg > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
      RotationSolid,
      {
        profile,
        thetaLength: Math.min(angleRad, Math.PI * 2),
        colorKey,
        opacity: isComplete ? 0.28 : 0.15,
        showOutline: isComplete,
        hasTopCap,
        hasBottomCap
      }
    ),
    !isComplete && /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { rotation: [0, angleRad, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("shapeGeometry", { args: [profileShape] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "meshBasicMaterial",
          {
            color: MATH_COLORS.highlight,
            transparent: true,
            opacity: 0.5,
            side: DoubleSide
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Line,
        {
          points: closedLoop,
          color: MATH_COLORS.highlight,
          lineWidth: 2
        }
      )
    ] }),
    isComplete && /* @__PURE__ */ jsxRuntimeExports.jsx(
      Line,
      {
        points: closedLoop,
        color: MATH_COLORS.label,
        lineWidth: 1.5,
        dashed: true,
        dashSize: 0.06,
        gapSize: 0.05,
        transparent: true,
        opacity: 0.35,
        depthTest: false,
        renderOrder: 20
      }
    )
  ] });
};
function RotationBodyAnimation() {
  const [shape, setShape] = reactExports.useState("rectangle");
  const [params, setParams] = reactExports.useState({
    r1: 1.5,
    r2: 0.8,
    height: 3,
    sweepAngleDeg: 360
  });
  const [autoPlay, setAutoPlay] = reactExports.useState(false);
  const [displayMode, setDisplayMode] = reactExports.useState("3d");
  const { cameraPosition, controlsRef } = use3DViewport("iso");
  const timerRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (autoPlay) {
      timerRef.current = window.setInterval(() => {
        setParams((p) => ({
          ...p,
          sweepAngleDeg: (p.sweepAngleDeg + 4) % 364
        }));
      }, 40);
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [autoPlay]);
  const profile = reactExports.useMemo(() => {
    switch (shape) {
      case "rectangle":
        return cylinderProfile(params.r1, params.height);
      case "rightTriangle":
        return coneProfile(params.r1, params.height);
      case "rightTrapezoid":
        return frustumProfile(params.r1, params.r2, params.height);
      case "semicircle":
        return sphereProfile(params.r1);
    }
  }, [shape, params.r1, params.r2, params.height]);
  const solidKind = reactExports.useMemo(() => {
    switch (shape) {
      case "rectangle":
        return "cylinder";
      case "rightTriangle":
        return "cone";
      case "rightTrapezoid":
        return "frustum";
      case "semicircle":
        return "sphere";
    }
  }, [shape]);
  const solidViews = reactExports.useMemo(
    () => buildSolidViews(solidKind, {
      radius: params.r1,
      bottomRadius: params.r1,
      topRadius: params.r2,
      height: params.height
    }),
    [solidKind, params.r1, params.r2, params.height]
  );
  const mathData = reactExports.useMemo(
    () => buildMathQuantities("anim-solid-rotation-body", {
      ...params,
      shape
    }),
    [params, shape]
  );
  const handleParamChange = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };
  const handleReset = () => {
    setParams({ r1: 1.5, r2: 0.8, height: 3, sweepAngleDeg: 360 });
    setAutoPlay(false);
  };
  const paramConfigs = reactExports.useMemo(
    () => rotationBodyMeta.filter((meta) => {
      if (meta.key === "r2" && shape !== "rightTrapezoid") return false;
      return true;
    }).map((meta) => ({
      key: meta.key,
      label: meta.label,
      labelFormula: meta.labelFormula,
      value: params[meta.key] ?? meta.defaultValue ?? 0,
      min: meta.min,
      max: meta.max,
      step: meta.step ?? 0.1,
      description: meta.description,
      descriptionFormula: meta.descriptionFormula,
      importance: meta.importance,
      marks: meta.marks
    })),
    [params, shape]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ThreePanel,
    {
      left: /* @__PURE__ */ jsxRuntimeExports.jsxs(LeftPanel, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "母线形状选择",
            subtitle: "选择旋转生成的平面图形",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              SelectGrid,
              {
                items: [
                  { key: "rectangle", label: "矩形", description: "→ 圆柱" },
                  {
                    key: "rightTriangle",
                    label: "直角三角形",
                    description: "→ 圆锥"
                  },
                  {
                    key: "rightTrapezoid",
                    label: "直角梯形",
                    description: "→ 圆台"
                  },
                  { key: "semicircle", label: "半圆", description: "→ 球" }
                ],
                value: shape,
                onChange: (k) => {
                  setShape(k);
                  setParams((p) => ({ ...p, sweepAngleDeg: 360 }));
                },
                variant: "filled"
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          LeftPanelSection,
          {
            title: "参数调节",
            subtitle: "调节旋转体尺寸与旋转角度",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ParamControl,
                {
                  params: paramConfigs,
                  onParamChange: handleParamChange,
                  onReset: handleReset
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: autoPlay ? "primary" : "secondary",
                  size: "sm",
                  className: "w-full mt-3",
                  onClick: () => setAutoPlay((v) => !v),
                  children: autoPlay ? "停止自动演示" : "自动演示旋转生成"
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "显示模式", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          TabSwitcher,
          {
            tabs: [
              { key: "3d", label: "3D 直观图" },
              { key: "orthographic", label: "三视图" }
            ],
            value: displayMode,
            onChange: (k) => setDisplayMode(k)
          }
        ) })
      ] }),
      center: displayMode === "3d" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        ThreeDCanvas,
        {
          cameraPosition,
          frameloop: autoPlay ? "always" : "demand",
          legend: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Legend3D,
            {
              title: "图例",
              items: [
                {
                  colorKey: "highlight",
                  swatch: "area",
                  label: "母线（平面图形）"
                },
                {
                  colorKey: "primary",
                  swatch: "area",
                  label: "已生成的旋转体"
                },
                { colorKey: "axis3D_Z", swatch: "dash", label: "旋转轴" }
              ]
            }
          ),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CameraRig, { ref: controlsRef }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Scene3DGrid, { size: 4 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              RotationSweep,
              {
                profile,
                sweepAngleDeg: params.sweepAngleDeg,
                axisHeight: params.height,
                hasTopCap: shape !== "semicircle",
                hasBottomCap: shape !== "semicircle"
              }
            )
          ]
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
        ThreeViewsPanel,
        {
          views: solidViews.views,
          extent: solidViews.extent
        }
      ),
      right: /* @__PURE__ */ jsxRuntimeExports.jsx(
        MathPanel,
        {
          quantities: mathData.quantities,
          theorems: mathData.theorems,
          gaokaoPoints: mathData.gaokaoPoints,
          warnings: mathData.warnings,
          title: "旋转体指标看板"
        }
      )
    }
  );
}
export {
  RotationBodyAnimation as default
};
