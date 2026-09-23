import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Info,
  ListPlus,
} from "lucide-react";
import AppModal from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import BatchDetailStat from "@/components/ui/import/wfm-batch-detail-stat";

export function DuplicateUploadAlertModal({ duplicateUploadAlert, onClose }) {
  return (
    <AppModal isOpen={Boolean(duplicateUploadAlert)} className="max-w-sm" textAlign="center">
      <p className="m-0 text-lg font-bold text-sibs-primary-1">
        Duplicate file name
      </p>
      <p className="mt-2 mb-0 text-sm text-sibs-tertiary-5">
        {duplicateUploadAlert?.fileName} is already imported in {duplicateUploadAlert?.rawDataTitle}. Please choose a different file.
      </p>
      <Button
        type="button"
        onClick={onClose}
        className="mt-5 h-10 w-full rounded-lg bg-sibs-primary-1 text-white hover:bg-sibs-tertiary-4"
      >
        Got It
      </Button>
    </AppModal>
  );
}

export function AddedUploadSuccessModal({
  addedUpload,
  onClose,
  handleOpenUsVisaErrors,
}) {
  return (
    <AppModal
      isOpen={Boolean(addedUpload)}
      className="!max-w-none sm:!w-[880px]"
      textAlign="center"
    >
      <p className="m-0 text-lg font-bold text-sibs-primary-1">
        Import Successful
      </p>
      <p className="mt-2 mb-0 text-sm text-sibs-tertiary-5">
        <span className="font-semibold text-sibs-primary-1">
          {addedUpload?.fileName}
        </span>{" "}
        was imported to{" "}
        <span className="font-semibold text-sibs-primary-1">
          {addedUpload?.rawDataTitle}
        </span>
        .
      </p>

      {addedUpload?.batch ? (
        <div className="mt-4 rounded-xl border border-sibs-tertiary-10 bg-white p-4 text-left">
          <div className="flex items-center justify-between text-xs font-bold text-sibs-primary-1">
            <span className="font-mono text-sibs-primary-2">
              Batch: {addedUpload.batch.batchCode}
            </span>
            {addedUpload.batch.status === "COMPLETED_WITH_ERRORS" ||
            Number(addedUpload.batch.warningRows || 0) > 0 ||
            Number(addedUpload.batch.invalidRows || 0) > 0 ||
            Number(addedUpload.batch.duplicateRows || 0) > 0 ? (
              <span className="inline-flex items-center gap-1 rounded border border-amber-400 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                <AlertTriangle className="h-3 w-3 text-amber-600" aria-hidden="true" />
                <span>Completed with warnings</span>
              </span>
            ) : addedUpload.batch.status === "FAILED" ? (
              <span className="rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                Failed
              </span>
            ) : (
              <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                Completed
              </span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-2.5 sm:grid-cols-6">
            <BatchDetailStat
              label="Total Rows"
              value={addedUpload.batch.totalRows}
              icon={FileSpreadsheet}
              tone="blue"
            />
            <BatchDetailStat
              label="Valid Rows"
              value={addedUpload.batch.validRows}
              icon={CheckCircle2}
              tone="emerald"
            />
            <BatchDetailStat
              label="Invalid Rows"
              value={addedUpload.batch.invalidRows}
              icon={AlertCircle}
              tone="rose"
            />
            <BatchDetailStat
              label="Duplicate Rows"
              value={addedUpload.batch.duplicateRows}
              icon={ListPlus}
              tone="orange"
            />
            <BatchDetailStat
              label="Warning Rows"
              value={addedUpload.batch.warningRows}
              icon={AlertTriangle}
              tone="amber"
            />
            <BatchDetailStat
              label="Info Rows"
              value={addedUpload.batch.infoRows}
              icon={Info}
              tone="cyan"
            />
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex justify-end gap-2">
        {addedUpload?.batch &&
        (addedUpload.batch.invalidRows > 0 ||
          addedUpload.batch.warningRows > 0 ||
          addedUpload.batch.duplicateRows > 0) ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const batchId = addedUpload.batch.id;
              onClose();
              handleOpenUsVisaErrors(batchId);
            }}
            className="h-10 rounded-lg border-sibs-danger/30 px-4 text-sibs-danger hover:bg-sibs-danger hover:text-white"
          >
            View Errors (
            {(
              (addedUpload.batch.invalidRows || 0) +
              (addedUpload.batch.warningRows || 0) +
              (addedUpload.batch.duplicateRows || 0)
            ).toLocaleString()}
            )
          </Button>
        ) : null}
        <Button
          type="button"
          onClick={onClose}
          className="h-10 rounded-lg bg-sibs-primary-1 px-4 text-white hover:bg-sibs-tertiary-4"
        >
          Done
        </Button>
      </div>
    </AppModal>
  );
}

export function RemovedUploadSuccessModal({ removedUpload, onClose }) {
  return (
    <AppModal
      isOpen={Boolean(removedUpload)}
      className="max-w-md"
      textAlign="center"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="mt-4 mb-0 text-lg font-bold text-sibs-primary-1">
        Data Removed Successfully
      </p>
      <p className="mt-2 mb-0 text-sm text-sibs-tertiary-5">
        <span className="break-words font-semibold text-sibs-primary-1 [overflow-wrap:anywhere]">
          {removedUpload?.fileName}
        </span>{" "}
        and all associated database records have been deleted.
      </p>
      <Button
        type="button"
        onClick={onClose}
        className="mt-5 h-10 w-full rounded-lg bg-sibs-primary-1 text-white hover:bg-sibs-tertiary-4"
      >
        Done
      </Button>
    </AppModal>
  );
}
