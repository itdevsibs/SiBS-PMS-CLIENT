import AppModal from "@/components/common/ui/AppModal";

/** Review notes and existing reporting dates before committing a US Visa upload. */
export default function WfmReviewImportModal({
  pendingReviewUpload,
  reportDateFrom,
  setReportDateFrom,
  reportDateTo,
  setReportDateTo,
  importNote,
  setImportNote,
  onCancel,
  onConfirm,
}) {
  const card = pendingReviewUpload?.card;
  const requiresDates = Boolean(card?.requiresReportingPeriod);
  const completeDates = Boolean(reportDateFrom && reportDateTo && reportDateFrom <= reportDateTo);
  const incompleteDates = Boolean(reportDateFrom) !== Boolean(reportDateTo);
  const invalidRange = Boolean(reportDateFrom && reportDateTo && reportDateFrom > reportDateTo);
  const cannotConfirm = requiresDates ? !completeDates : incompleteDates || invalidRange;

  return (
    <AppModal
      isOpen={Boolean(pendingReviewUpload)}
      className="!max-w-none w-full sm:!w-[min(92vw,680px)] p-6 sm:p-7 rounded-2xl shadow-2xl border border-slate-200 bg-white"
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="m-0 text-xl font-bold text-sibs-primary-1">Review Import</h2>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Review the reporting period and add an optional note before importing.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 transition-all hover:bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-2xs text-[#042c51]">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="m-0 truncate text-sm font-bold text-slate-900"
              title={pendingReviewUpload?.file?.name}
            >
              {pendingReviewUpload?.file?.name || "Selected workbook"}
            </p>
            <p className="mt-0.5 mb-0 text-xs text-slate-500">
              {card?.title || "Raw Data"}
              {card?.sourceLabel ? ` · ${card.sourceLabel}` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-1">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Reporting Date From{requiresDates ? " *" : ""}
            </label>
            <input
              type="date"
              value={reportDateFrom}
              max={reportDateTo || undefined}
              onChange={(event) => setReportDateFrom(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition-colors focus:border-[#042c51] focus:ring-1 focus:ring-[#042c51]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Reporting Date To{requiresDates ? " *" : ""}
            </label>
            <input
              type="date"
              value={reportDateTo}
              min={reportDateFrom || undefined}
              onChange={(event) => setReportDateTo(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition-colors focus:border-[#042c51] focus:ring-1 focus:ring-[#042c51]"
            />
          </div>
        </div>
        <p className="text-[11.5px] leading-relaxed text-slate-500 pt-1">
          {requiresDates
            ? "Both dates are required for this source because the workbook does not provide a report date."
            : "Optional: leave both dates blank to use the reporting dates detected from the workbook."}
        </p>
        {(incompleteDates || invalidRange) && (
          <p role="alert" className="text-xs font-semibold text-rose-600">
            {invalidRange
              ? "Reporting Date From cannot be after Reporting Date To."
              : "Enter both dates or leave both blank."}
          </p>
        )}
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <label
            htmlFor="wfm-import-note"
            className="text-xs font-bold uppercase tracking-wider text-slate-600"
          >
            Note <span className="font-normal lowercase text-slate-400">(optional)</span>
          </label>
          <span
            className={`text-xs font-semibold ${
              Array.from(importNote).length >= 500 ? "text-amber-600" : "text-slate-400"
            }`}
          >
            {Array.from(importNote).length}/500
          </span>
        </div>
        <textarea
          id="wfm-import-note"
          rows={3}
          maxLength={500}
          value={importNote}
          onChange={(event) =>
            setImportNote(Array.from(event.target.value).slice(0, 500).join(""))
          }
          placeholder="Enter notes or remarks for this import..."
          className="w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-[#042c51] focus:ring-1 focus:ring-[#042c51]"
        />
        <p className="mt-1 text-[11px] text-slate-400">
          Duplicate checking and record validation will run during Import Progress.
        </p>
      </div>

      <div className="mt-7 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-lg border border-slate-200 bg-white px-5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={cannotConfirm}
          className="h-10 rounded-lg bg-[#042c51] px-5 text-xs font-bold text-white hover:bg-[#063d70] disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
        >
          Confirm Import
        </button>
      </div>
    </AppModal>
  );
}
