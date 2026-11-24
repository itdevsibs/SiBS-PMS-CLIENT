import WfmImportStatusBadge from "@/components/modules/wfm/imports/WfmImportStatusBadge";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Info,
  ListPlus,
} from "lucide-react";
import AppModal from "@/components/common/ui/AppModal";
import { Button } from "@/components/common/ui/Button";
import BatchDetailStat from "@/components/modules/wfm/imports/WfmBatchDetailStat";

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
  handleOpenBatchDetails,
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
            <WfmImportStatusBadge upload={addedUpload.batch} />
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
              label="Validation Warnings"
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
          {addedUpload.batch.emailMetrics && (
            <div className="mt-3 border-t border-slate-200 pt-3 text-left">
              <p className="mb-2 text-xs font-semibold text-slate-800">Email case reconciliation · Published TO version {addedUpload.batch.emailMetrics.taskOrderVersionId || "—"}</p>
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                {[["New", "newCases"], ["Updated", "updatedCases"], ["Unchanged", "unchangedDuplicates"],
                  ["Stale", "staleVersions"], ["Conflicts", "versionConflicts"], ["Unmapped Countries", "unmappedCountries"], ["Country Conflicts", "mappingConflicts"],
                  ["Invalid", "invalidRows"]].map(([label, key]) => (
                    <div key={key} className="rounded-lg border border-slate-200 px-3 py-2">
                      <div className="font-bold text-slate-800">{Number(addedUpload.batch.emailMetrics[key] || 0).toLocaleString()}</div>
                      <div className="text-slate-500">{label}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}
          {Number(addedUpload.batch.mappingRows || 0) > 0 && (
            <p className="mt-3 mb-0 text-left text-xs font-medium text-slate-600">
              {Number(addedUpload.batch.mappingRows).toLocaleString()} imported row(s) need {addedUpload.batch.importProfileCode === "US_VISA_EMAIL_RAW_DATA" ? "employee identity matching" : "employee or Task Order mapping"}. This does not affect upload success.
            </p>
          )}
        </div>
      ) : null}

      <div className="mt-5 flex justify-end gap-2">
        {addedUpload?.batch ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const batchData = addedUpload.upload || { ...addedUpload.batch, batchId: addedUpload.batch.id, fileName: addedUpload.batch.sourceFilename || addedUpload.fileName, rawDataTitle: addedUpload.rawDataTitle };
              onClose();
              handleOpenBatchDetails?.(batchData);
            }}
            className="h-10 rounded-lg border-sibs-danger/30 px-4 text-sibs-danger hover:bg-sibs-danger hover:text-white"
          >
            View Import Details
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
