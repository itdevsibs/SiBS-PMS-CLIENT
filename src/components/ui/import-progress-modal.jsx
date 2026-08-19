// Modal displaying step-by-step progress during raw Excel imports.
import { CheckCircle2, FileSpreadsheet, Loader2 } from "lucide-react";
import AppModal from "@/components/ui/app-modal";

const STAGES = [
  {
    id: "reading",
    label: "Reading Workbook",
    desc: "Inspecting worksheets, column headers, and structure",
  },
  {
    id: "uploading",
    label: "Uploading to Backend",
    desc: "Streaming file payload to the ingestion pipeline",
  },
  {
    id: "validating",
    label: "Schema & Format Validation",
    desc: "Checking required fields, dates, and metric types",
  },
  {
    id: "processing",
    label: "Hashing & Deduplication",
    desc: "Deriving intervals, canonical columns, and row hashes",
  },
  {
    id: "finalizing",
    label: "Database Staging",
    desc: "Storing batch, raw rows, and skill statistics",
  },
];

const STAGE_ORDER = ["reading", "uploading", "validating", "processing", "finalizing", "complete"];

function getStageIndex(stageId) {
  const index = STAGE_ORDER.indexOf(stageId);
  return index === -1 ? 0 : index;
}

const ImportProgressModal = ({
  isOpen,
  fileName = "",
  cardTitle = "",
  currentStage = "reading",
  progressPercent = 0,
}) => {
  if (!isOpen) return null;

  const currentStageIndex = getStageIndex(currentStage);
  const clampedProgress = Math.min(Math.max(Math.round(progressPercent || 0), 0), 100);

  return (
    <AppModal
      isOpen={isOpen}
      className="!max-w-none sm:!w-[500px] !p-6"
      zIndex="z-[150]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-sibs-primary-2/10 px-2 py-0.5 text-xs font-bold text-sibs-primary-2">
              {cardTitle || "Import"}
            </span>
            <span className="text-xs font-semibold text-sibs-tertiary-5">
              Pipeline Ingestion
            </span>
          </div>
          <h2 className="mt-1 mb-0 text-lg font-bold text-sibs-primary-1">
            Importing Raw Data
          </h2>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-sibs-tertiary-5">
            <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 text-sibs-primary-2" aria-hidden="true" />
            <span className="truncate max-w-[340px]" title={fileName}>
              {fileName || "Workbook.xlsx"}
            </span>
          </div>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0f6fa]">
          <Loader2 className="h-5 w-5 text-sibs-primary-2 animate-spin" aria-hidden="true" />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-5 rounded-xl border border-sibs-tertiary-10 bg-[#f8fbfd] p-3">
        <div className="flex items-center justify-between text-xs font-bold text-sibs-primary-1">
          <span>Overall Progress</span>
          <span className="font-mono text-sibs-primary-2">{clampedProgress}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sibs-tertiary-10">
          <div
            className="h-full rounded-full bg-sibs-primary-1 transition-all duration-300 ease-out"
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      </div>

      {/* Stages Checklist */}
      <div className="mt-4 space-y-2">
        {STAGES.map((stage, index) => {
          const isDone = currentStageIndex > index;
          const isCurrent = currentStageIndex === index;

          return (
            <div
              key={stage.id}
              className={`flex items-start gap-3 rounded-xl border px-3.5 py-2.5 transition-all ${
                isCurrent
                  ? "border-sibs-primary-2/40 bg-sibs-primary-2/5 shadow-sm"
                  : isDone
                  ? "border-emerald-200 bg-emerald-50/40"
                  : "border-sibs-tertiary-10 bg-white opacity-60"
              }`}
            >
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                ) : isCurrent ? (
                  <Loader2 className="h-4 w-4 text-sibs-primary-2 animate-spin" aria-hidden="true" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-sibs-tertiary-8" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`m-0 text-xs font-bold leading-tight ${
                      isCurrent
                        ? "text-sibs-primary-1"
                        : isDone
                        ? "text-emerald-950"
                        : "text-sibs-tertiary-6"
                    }`}
                  >
                    {stage.label}
                  </p>
                  {isDone ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                      Done
                    </span>
                  ) : isCurrent ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sibs-primary-2 animate-pulse">
                      Active
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 mb-0 text-[11px] leading-tight text-sibs-tertiary-5">
                  {stage.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </AppModal>
  );
};

export default ImportProgressModal;
