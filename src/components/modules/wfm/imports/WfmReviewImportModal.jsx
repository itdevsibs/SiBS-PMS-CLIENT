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
    <AppModal isOpen={Boolean(pendingReviewUpload)} className="w-full max-w-lg p-5 sm:p-6">
      <div>
        <h2 className="m-0 text-lg font-bold text-sibs-primary-1">Review Import</h2>
        <p className="mt-1 text-xs font-medium text-sibs-tertiary-5">
          Review the reporting period and add an optional note before importing.
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="m-0 truncate text-sm font-bold text-sibs-primary-1" title={pendingReviewUpload?.file?.name}>
          {pendingReviewUpload?.file?.name || "Selected workbook"}
        </p>
        <p className="mt-1 mb-0 text-xs text-slate-500">
          {card?.title || "Raw Data"}{card?.sourceLabel ? ` · ${card.sourceLabel}` : ""}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-xs font-bold text-sibs-primary-1">
          Reporting Date From{requiresDates ? " *" : ""}
          <input type="date" value={reportDateFrom} max={reportDateTo || undefined}
            onChange={(event) => setReportDateFrom(event.target.value)}
            className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-sibs-primary-1 outline-none focus:border-sibs-primary-1" />
        </label>
        <label className="block text-xs font-bold text-sibs-primary-1">
          Reporting Date To{requiresDates ? " *" : ""}
          <input type="date" value={reportDateTo} min={reportDateFrom || undefined}
            onChange={(event) => setReportDateTo(event.target.value)}
            className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-sibs-primary-1 outline-none focus:border-sibs-primary-1" />
        </label>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
        {requiresDates
          ? "Both dates are required for this source because the workbook does not provide a report date."
          : "Optional: leave both dates blank to use the reporting dates detected from the workbook."}
      </p>
      {(incompleteDates || invalidRange) && <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">
        {invalidRange ? "Reporting Date From cannot be after Reporting Date To." : "Enter both dates or leave both blank."}
      </p>}

      <div className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="wfm-import-note" className="text-xs font-bold text-sibs-primary-1">Import Note (Optional)</label>
          <span className="text-[11px] text-slate-500">{Array.from(importNote).length}/500</span>
        </div>
        <textarea id="wfm-import-note" rows={3} value={importNote}
          onChange={(event) => setImportNote(Array.from(event.target.value).slice(0, 500).join(""))}
          placeholder="E.g., Contains October 21, 6 AM to 7 PM data."
          className="mt-2 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-sibs-primary-1 outline-none focus:border-sibs-primary-1" />
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        Duplicate checking and record validation will run during Import Progress.
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onCancel}
          className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-sibs-primary-1 hover:bg-slate-50">Cancel</button>
        <button type="button" onClick={onConfirm} disabled={cannotConfirm}
          className="h-9 rounded-lg bg-sibs-primary-1 px-4 text-xs font-bold text-white hover:bg-sibs-tertiary-4 disabled:cursor-not-allowed disabled:opacity-50">
          Confirm Import
        </button>
      </div>
    </AppModal>
  );
}
