import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function KpiChartModal({
  isOpen,
  onClose,
  title,
  periodLabel = null,
  subtitle = null,
  legend = null,
  children = null,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]"
      onClick={(event) => event.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label={title || "Chart details"}
    >
      <div
        className="flex h-[86vh] max-h-[840px] w-[95vw] max-w-[1440px] flex-col overflow-hidden border border-[#103B63] bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 border-b-2 border-[#F28C28] bg-[#103B63] px-4 py-3 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <h2 className="m-0 truncate text-base sm:text-lg font-black uppercase tracking-wider text-white">
                {title}
              </h2>
              {periodLabel ? (
                <span className="shrink-0 rounded bg-[#F28C28] px-2.5 py-0.5 text-xs font-extrabold tracking-wide text-white shadow-xs">
                  {periodLabel}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {legend ? (
                <div className="hidden sm:inline-flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] [&>span]:!text-white/95">
                  {legend}
                </div>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-7 w-7 items-center justify-center rounded text-white/85 transition-colors hover:bg-white/15 hover:text-white cursor-pointer"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-3.5 bg-slate-50/40">
          {children || (
            <div className="flex h-full w-full items-center justify-center rounded border border-dashed border-slate-300 bg-white p-6 text-center">
              <div className="space-y-1">
                <p className="m-0 text-sm font-bold text-[#103B63]">
                  {title}
                </p>
                <p className="m-0 text-xs text-slate-500">
                  Detailed view coming soon.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
