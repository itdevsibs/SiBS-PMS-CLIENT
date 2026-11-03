import AppModal from "@/components/common/ui/AppModal";

export default function WfmReportDateModal({
  pendingReportDateUpload,
  selectedReportDate,
  setSelectedReportDate,
  onCancel,
  onConfirm,
}) {
  return (
    <AppModal
      isOpen={Boolean(pendingReportDateUpload)}
      className="w-full max-w-md p-5 sm:p-6"
    >
      <div>
        <p className="m-0 text-lg font-bold text-sibs-primary-1">
          Select Report Date
        </p>
        <p className="mt-1 mb-0 text-xs font-semibold leading-5 text-sibs-tertiary-5">
          Select the source date represented by this {pendingReportDateUpload?.card?.title || "workbook"}. Agent Performance By Skill does not contain a Date column, so this date will be stored with the imported rows.
        </p>
      </div>

      <div className="mt-5">
        <label className="block text-xs font-bold uppercase tracking-wide text-sibs-primary-1">
          Report Date
        </label>
        <input
          type="date"
          value={selectedReportDate}
          onChange={(event) => setSelectedReportDate(event.target.value)}
          className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-sibs-primary-1 outline-none transition focus:border-sibs-primary-1"
        />
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-sibs-primary-1 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!selectedReportDate}
          className="h-9 rounded-lg bg-sibs-primary-1 px-4 text-xs font-bold text-white transition hover:bg-sibs-tertiary-4 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Upload XLSX
        </button>
      </div>
    </AppModal>
  );
}
