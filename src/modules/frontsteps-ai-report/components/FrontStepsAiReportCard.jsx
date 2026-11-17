import React from "react";

export default function FrontStepsAiReportCard({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className = "",
}) {
  return (
    <div className={`rounded-xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-2xs font-jakarta min-w-0 overflow-hidden ${className}`}>
      {(title || Icon || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5 mb-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            {Icon && (
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#042c51] text-white shrink-0">
                <Icon size={14} className="text-[#ff5c28]" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              {title && <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 truncate">{title}</h3>}
              {subtitle && <p className="text-[10.5px] text-slate-400 truncate">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="min-w-0 w-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}
