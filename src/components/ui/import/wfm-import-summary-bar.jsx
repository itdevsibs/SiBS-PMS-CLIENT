import { AlertTriangle } from "lucide-react";
import {
  IMPORT_SUMMARY_CARDS,
  importSummaryNumberFormatter,
} from "@/lib/wfm-import-utils";

export default function WfmImportSummaryBar({ importSummary, onOpenWarnings }) {
  return (
    <div
      className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6"
      aria-label="Import summary"
    >
      {IMPORT_SUMMARY_CARDS.map((card) => {
        const value = Number(importSummary?.[card.key] || 0);
        const uploadsWithIssues = Number(importSummary?.uploadsWithIssues || 0);
        const isTotalUploadsCard = card.key === "totalUploads";
        const isWarningCard = card.key === "warningRows";
        const isError = card.key === "invalidRows" && value > 0;
        const isWarning = card.key === "warningRows" && value > 0;
        const Icon = card.icon;

        return (
          <div
            key={card.key}
            role={isWarningCard ? "button" : undefined}
            tabIndex={isWarningCard ? 0 : undefined}
            onClick={isWarningCard ? onOpenWarnings : undefined}
            onKeyDown={
              isWarningCard
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onOpenWarnings?.();
                    }
                  }
                : undefined
            }
            className={`group relative min-w-0 rounded-xl border bg-white p-2.5 shadow-2xs transition-all duration-150 ${
              isWarningCard
                ? "cursor-pointer hover:border-amber-400 hover:shadow-md active:scale-[0.99]"
                : "hover:border-sibs-primary-1/40 hover:shadow-xs"
            } ${
              isError
                ? "border-red-300 bg-red-50/20 ring-1 ring-red-200"
                : isWarning
                ? "border-amber-300 bg-amber-50/20 ring-1 ring-amber-200"
                : "border-slate-200"
            }`}
            title={
              isWarningCard
                ? `Click to view warnings: ${value.toLocaleString()} found`
                : isTotalUploadsCard && uploadsWithIssues > 0
                ? `${card.label}: ${value.toLocaleString()} • ${uploadsWithIssues.toLocaleString()} with issues`
                : `${card.label}: ${value.toLocaleString()}`
            }
          >
            <div className="flex items-center justify-between gap-1 min-w-0">
              <p className="m-0 min-w-0 truncate text-[9px] font-extrabold uppercase tracking-wider text-sibs-tertiary-5 leading-none">
                {card.label}
              </p>

              <span
                className={`inline-flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-md ${
                  isError
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : isWarning
                    ? "bg-amber-50 text-amber-600 border border-amber-200"
                    : "bg-sibs-primary-3/60 text-sibs-primary-1 border border-sibs-tertiary-10"
                }`}
              >
                <Icon
                  className="h-3 w-3"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </span>
            </div>

            <div className="mt-1.5 flex min-w-0 items-baseline justify-between gap-1">
              <p
                className={`m-0 text-lg font-black leading-none tracking-tight ${
                  isError
                    ? "text-red-600"
                    : isWarning
                    ? "text-amber-600"
                    : "text-sibs-primary-1"
                }`}
              >
                {importSummaryNumberFormatter.format(value)}
              </p>

              {isTotalUploadsCard && uploadsWithIssues > 0 ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300 bg-amber-50/90 px-2 py-0.5 text-[9.5px] font-extrabold leading-none text-amber-800 shadow-2xs">
                  <AlertTriangle
                    className="h-2.5 w-2.5 shrink-0 text-amber-600"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                  <span>
                    {importSummaryNumberFormatter.format(uploadsWithIssues)}{" "}
                    {uploadsWithIssues === 1 ? "issue" : "issues"}
                  </span>
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

