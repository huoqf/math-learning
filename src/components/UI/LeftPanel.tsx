import React from "react";

interface LeftPanelProps {
  children: React.ReactNode;
  className?: string;
}

interface LeftPanelSectionProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  compact?: boolean;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={["relative flex min-h-full flex-col gap-2.5 p-3", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
};

export const LeftPanelSection: React.FC<LeftPanelSectionProps> = ({
  children,
  title,
  subtitle,
  action,
  className = "",
  bodyClassName = "",
  compact = false,
}) => {
  const padding = compact ? "p-2" : "p-3";
  const headerSpacing = compact ? "mb-1" : "mb-2";

  return (
    <section
      className={[
        "shrink-0 rounded-xl border border-neutral-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
        padding,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {(title || subtitle || action) && (
        <div
          className={["flex items-start justify-between gap-2", headerSpacing]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="min-w-0 flex-1">
            {title && (
              <div className="text-[12px] font-bold text-neutral-700 leading-snug tracking-tight">
                {title}
              </div>
            )}
            {subtitle && (
              <div className="mt-0.5 text-[11px] text-neutral-400 leading-snug">
                {subtitle}
              </div>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
};
