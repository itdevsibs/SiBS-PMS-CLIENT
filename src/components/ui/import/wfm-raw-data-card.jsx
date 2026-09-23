import { CheckCircle2, CloudUpload, FileSpreadsheet, FolderOpen } from "lucide-react";
import { formatRelativeTime, normalizeTaskOrderOption } from "@/lib/wfm-import-utils";

export default function WfmRawDataCard({
  card,
  uploads = [],
  isUploading = false,
  onFileSelect,
  onOpenCard,
}) {
  const latestUploads = uploads.slice(0, 3);

  return (
    <section className="sibs-card flex min-h-[350px] flex-col justify-between p-4 shadow-xs transition hover:border-sibs-primary-1/40">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="m-0 text-base font-extrabold leading-tight text-sibs-primary-1 break-words">
              {card.title}
            </h2>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              uploads.length > 0
                ? "border border-emerald-200/80 bg-emerald-50 text-emerald-700"
                : "border border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            {uploads.length > 0 ? (
              <>
                <CheckCircle2 size={11} className="shrink-0" />
                {uploads.length} {uploads.length === 1 ? "file" : "files"}
              </>
            ) : (
              "0 files"
            )}
          </span>
        </div>

        {card.taskOrders?.length ? (
          <div className="mt-2.5 flex min-w-0 flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[10px] font-extrabold uppercase text-sibs-tertiary-5 shrink-0">
              TASK ORDERS:
            </span>
            <div className="flex min-w-0 flex-wrap gap-1">
              {card.taskOrders.map((taskOrder, index) => {
                const option = normalizeTaskOrderOption(taskOrder);
                return (
                  <span
                    key={option?.id || option?.label || index}
                    className="rounded-md border border-sibs-tertiary-8 bg-white px-2 py-0.5 text-[11px] font-bold text-sibs-primary-1 shadow-2xs whitespace-nowrap"
                  >
                    {option?.id ? `${option.id} - ${option.label}` : option?.label}
                  </span>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-3.5 min-h-[175px] flex-1 rounded-xl border border-slate-200/80 bg-slate-50/50 p-2.5">
        {latestUploads.length ? (
          <div className="space-y-1.5">
            {latestUploads.map((upload) => (
              <div
                key={upload.id || `${upload.fileName}-${upload.uploadedAt}`}
                className="rounded-lg border border-slate-200/60 bg-white p-2 shadow-2xs transition hover:border-slate-300"
              >
                <div className="flex items-start gap-2">
                  <FileSpreadsheet
                    size={15}
                    className="mt-0.5 shrink-0 text-sibs-primary-1/70"
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className="m-0 truncate text-[11px] font-bold text-sibs-primary-1"
                      title={upload.fileName}
                    >
                      {upload.fileName}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-1.5 text-[10px] text-sibs-tertiary-5">
                      <span className="whitespace-nowrap shrink-0">
                        {formatRelativeTime(upload)}
                      </span>
                      {upload.batchCode ? (
                        <span
                          className="rounded bg-sibs-primary-2/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-sibs-primary-2 whitespace-nowrap"
                          title={upload.batchCode}
                        >
                          {upload.batchCode}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full min-h-[120px] flex-col items-center justify-center p-3 text-center">
            <CloudUpload
              size={22}
              className="mb-1.5 text-slate-400 opacity-60"
            />
            <p className="m-0 text-xs font-semibold text-sibs-tertiary-5">
              No uploaded data yet
            </p>
          </div>
        )}
      </div>

      <div className="mt-3.5 grid grid-cols-2 gap-2.5">
        <label className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-sibs-primary-1 px-3 text-xs font-bold text-white shadow-xs transition hover:bg-sibs-tertiary-4">
          <CloudUpload className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Import</span>
          <input
            type="file"
            accept={card.account === "US VISA" ? (card.fileExtension || ".xlsx") : ".xlsx,.xls,.csv"}
            disabled={isUploading}
            onChange={(event) => onFileSelect(card, event)}
            className="hidden"
          />
        </label>
        <button
          type="button"
          onClick={() => onOpenCard(card)}
          className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-sibs-primary-1 shadow-xs transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1 hover:text-white"
        >
          <FolderOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Open</span>
        </button>
      </div>
    </section>
  );
}

