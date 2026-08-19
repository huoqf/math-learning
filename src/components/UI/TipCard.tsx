import React from "react";

export type TipCardVariant =
  "info" | "primary" | "warning" | "danger" | "success" | "accent";

interface TipCardProps {
  children: React.ReactNode;
  variant?: TipCardVariant;
  className?: string;
}

const variantStyles: Record<TipCardVariant, string> = {
  primary:
    "bg-primary-50/60 border-primary-200/70 text-neutral-700 [&_.font-bold]:text-primary-700 [&_b]:text-primary-700",
  info: "bg-neutral-50 border-neutral-200 text-neutral-600 [&_.font-bold]:text-neutral-800 [&_b]:text-neutral-800",
  warning:
    "bg-accent-50/70 border-accent-200/80 text-neutral-700 [&_.font-bold]:text-accent-800 [&_b]:text-accent-800",
  danger:
    "bg-danger-50/60 border-danger-200/70 text-neutral-700 [&_.font-bold]:text-danger-700 [&_b]:text-danger-700",
  success:
    "bg-success-50/60 border-success-200/70 text-neutral-700 [&_.font-bold]:text-success-800 [&_b]:text-success-800",
  accent:
    "bg-accent-50/70 border-accent-200/80 text-neutral-700 [&_.font-bold]:text-accent-800 [&_b]:text-accent-800",
};

export const TipCard: React.FC<TipCardProps> = ({
  children,
  variant = "primary",
  className = "",
}) => {
  return (
    <div
      className={[
        "px-2.5 py-2 rounded-lg border text-[11px] leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
        variantStyles[variant],
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
};
