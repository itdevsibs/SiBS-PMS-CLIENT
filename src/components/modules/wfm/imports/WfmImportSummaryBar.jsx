import { AlertTriangle } from "lucide-react";
import {
  IMPORT_SUMMARY_CARDS,
  importSummaryNumberFormatter,
} from "@/lib/wfm-import-utils";

export default function WfmImportSummaryBar({
  importSummary,
  onOpenWarnings,
  onOpenRejected,
  onOpenDuplicates,
}) {
  return (
    <div
      className="mb-3.5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6 shrink-0"
      aria-label="Import summary metrics"
    >
      {IMPORT_SUMMARY_CARDS.map((card) => {
        const value = Number(importSummary?.[card.key] || 0);
        const uploadsWithIssues = Number(importSummary?.uploadsWithIssues || 0);
        const isTotalUploadsCard = card.key === "totalUploads";
        const isWarningCard = card.key === "warningRows";
        const isRejectedCard = card.key === "invalidRows";
        const isDuplicateCard = card.key === "duplicateRows";

        const isError = isRejectedCard;
        const isDuplicate = isDuplicateCard;
        const isWarning = isWarningCard;
        const isClickable = isWarningCard || isRejectedCard || isDuplicateCard;

        const onClickHandler = isWarningCard
          ? onOpenWarnings
          : isRejectedCard
          ? onOpenRejected
          : isDuplicateCard
          ? onOpenDuplicates
          : undefined;

        let cardStyle = "bg-white border-[#D7E1EE] text-[#102448]";
        let titleColor = "text-[#587094]";
        let valueColor = "text-[#102448]";

        if (isError) {
          cardStyle = "bg-[#FFF5F5] border-[#FED7D7] text-[#DC2626]";
          titleColor = "text-[#DC2626]/85";
          valueColor = "text-[#DC2626]";
        } else if (isDuplicate) {
          cardStyle = "bg-[#FFF9F2] border-[#FEEBC8] text-[#C65A08]";
          titleColor = "text-[#C65A08]/85";
          valueColor = "text-[#C65A08]";
        } else if (isWarning) {
          cardStyle = "bg-[#FFFDF0] border-[#FEFCBF] text-[#D97706]";
          titleColor = "text-[#D97706]/85";
          valueColor = "text-[#D97706]";
        }

        return (
          <div
            key={card.key}
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onClick={onClickHandler}
            onKeyDown={
              isClickable
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onClickHandler?.();
                    }
                  }
                : undefined
            }
            className={`min-w-0 rounded-2xl border px-4 py-2.5 shadow-2xs transition-all duration-150 flex flex-col justify-between h-[74px] ${cardStyle} ${
              isClickable
                ? "cursor-pointer hover:shadow-xs hover:border-[#062A5C]/40 active:scale-[0.99]"
                : ""
            }`}
            title={
              isWarningCard
                ? `Warnings: ${value.toLocaleString()} found`
                : isRejectedCard
                ? `Rejected: ${value.toLocaleString()} found`
                : isDuplicateCard
                ? `Duplicates: ${value.toLocaleString()} found`
                : `${card.label}: ${value.toLocaleString()}`
            }
          >
            <p className={`m-0 text-[10.5px] font-bold uppercase tracking-wider leading-none truncate ${titleColor}`}>
              {card.label === "TOTAL UPLOADS"
                ? "Total Uploads"
                : card.label === "RECORDS PROCESSED"
                ? "Records Processed"
                : card.label === "RECORDS ACCEPTED"
                ? "Records Accepted"
                : card.label === "RECORDS REJECTED"
                ? "Records Rejected"
                : card.label === "DUPLICATES FOUND"
                ? "Duplicates Found"
                : card.label === "WARNINGS FOUND"
                ? "Warnings Found"
                : card.label}
            </p>

            <div className="flex items-baseline justify-between gap-1.5 min-w-0">
              <span className={`text-[23px] font-black leading-none tracking-tight ${valueColor}`}>
                {importSummaryNumberFormatter.format(value)}
              </span>

              {isTotalUploadsCard && uploadsWithIssues > 0 ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#FCD34D] bg-[#FEF3C7] px-2 py-0.5 text-[9.5px] font-bold text-[#B45309] shadow-2xs">
                  <AlertTriangle
                    className="h-2.5 w-2.5 shrink-0 text-[#B45309]"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                  <span>{uploadsWithIssues} Issues</span>
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
