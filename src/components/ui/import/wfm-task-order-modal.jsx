import AppModal from "@/components/ui/app-modal";

export default function WfmTaskOrderModal({
  pendingTaskOrderUpload,
  selectedTaskOrderId,
  setSelectedTaskOrderId,
  onCancel,
  onConfirm,
}) {
  return (
    <AppModal
      isOpen={Boolean(pendingTaskOrderUpload)}
      className="w-full max-w-md p-5 sm:p-6"
    >
      <div>
        <p className="m-0 text-lg font-bold text-sibs-primary-1">
          Select Task Order
        </p>
        <p className="mt-1 mb-0 text-xs font-semibold leading-5 text-sibs-tertiary-5">
          Choose the Task Order represented by this {pendingTaskOrderUpload?.card?.title || "workbook"}. The server will validate the selected import structure.
        </p>
      </div>

      <div className="mt-5 space-y-2">
        {(pendingTaskOrderUpload?.taskOrderOptions || []).map((option) => (
          <label
            key={option.id}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 transition ${
              selectedTaskOrderId === option.id
                ? "border-sibs-primary-1 bg-sibs-primary-1/5"
                : "border-slate-200 bg-white hover:border-sibs-primary-1/40"
            }`}
          >
            <input
              type="radio"
              name="wfm-task-order"
              value={option.id}
              checked={selectedTaskOrderId === option.id}
              onChange={(event) => setSelectedTaskOrderId(event.target.value)}
              className="h-4 w-4"
            />
            <div className="min-w-0">
              <p className="m-0 text-sm font-bold text-sibs-primary-1">{option.id}</p>
              <p className="m-0 text-xs font-semibold text-sibs-tertiary-5">{option.label}</p>
            </div>
          </label>
        ))}
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
          disabled={!selectedTaskOrderId}
          className="h-9 rounded-lg bg-sibs-primary-1 px-4 text-xs font-bold text-white transition hover:bg-sibs-tertiary-4 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Upload XLSX
        </button>
      </div>
    </AppModal>
  );
}

