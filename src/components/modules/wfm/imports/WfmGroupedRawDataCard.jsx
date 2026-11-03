import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  CloudUpload,
  FileSpreadsheet,
  FolderOpen,
  RotateCw,
  Trash2,
  Upload,
} from "lucide-react";
import SingleSelectDropdown from "@/components/common/filters/SingleSelectDropdown";
import { formatRelativeTime, normalizeTaskOrderOption, getImportDisplayStatus } from "@/lib/wfm-import-utils";

export default function WfmGroupedRawDataCard({
  group,
  uploadsByCard = {},
  isUploading = false,
  onFileSelect,
  onOpenCard,
  onRefreshCard,
  onOpenErrorDetails,
}) {
  const cards = group?.cards || [];
  const [selectedCardId, setSelectedCardId] = useState(() => cards[0]?.id || "");

  // Keep selected card in sync when cards change (e.g. search filtering)
  useEffect(() => {
    if (!cards.some((c) => c.id === selectedCardId)) {
      setSelectedCardId(cards[0]?.id || "");
    }
  }, [cards, selectedCardId]);

  const activeCard = useMemo(() => {
    return cards.find((c) => c.id === selectedCardId) || cards[0] || null;
  }, [cards, selectedCardId]);

  const activeUploads = useMemo(() => {
    if (!activeCard) return [];
    return uploadsByCard[activeCard.id] || [];
  }, [activeCard, uploadsByCard]);

  const latestUpload = activeUploads[0] || null;

  const isCompletedWithErrors = Boolean(
    latestUpload &&
      (latestUpload.batchStatus === "COMPLETED_WITH_ERRORS" && !latestUpload.displayStatus ||
        (latestUpload.invalidRows || 0) > 0 ||
        (latestUpload.warningRows || 0) > 0 ||
        (latestUpload.duplicateRows || 0) > 0),
  );

  const dropdownOptions = useMemo(() => {
    return cards.map((card) => {
      const fileCount = (uploadsByCard[card.id] || []).length;
      return {
        value: card.id,
        label: fileCount > 0 ? `${card.title} (${fileCount} ${fileCount === 1 ? "file" : "files"})` : card.title,
      };
    });
  }, [cards, uploadsByCard]);

  if (!activeCard) return null;

  const [stagedFilesByCard, setStagedFilesByCard] = useState({});
  const stagedFile = stagedFilesByCard[activeCard?.id] || null;

  const handleStageFile = (card, file) => {
    if (!file) return;
    setStagedFilesByCard((prev) => ({
      ...prev,
      [card.id]: file,
    }));
  };

  const handleRemoveStagedFile = (cardId) => {
    setStagedFilesByCard((prev) => {
      const next = { ...prev };
      delete next[cardId];
      return next;
    });
  };

  const handleExecuteUpload = async () => {
    if (!stagedFile || !activeCard) return;
    const fileToUpload = stagedFile;
    handleRemoveStagedFile(activeCard.id);
    await onFileSelect(activeCard, { target: { files: [fileToUpload], value: "" } });
  };

  return (
    <section className="sibs-card relative flex min-h-[370px] flex-col justify-between p-4 shadow-xs transition hover:border-sibs-primary-1/40">
      <div>
        {/* Card Header: Level Name & Refresh Button (stored in Import Repository) */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-sibs-tertiary-5 block">
              LEVEL
            </span>
            <h2
              className="m-0 text-sm font-extrabold text-sibs-primary-1 truncate"
              title={group.label}
            >
              {group.label}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onRefreshCard?.(activeCard?.id, group?.cards)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-all shadow-2xs active:scale-95 ${
              activeUploads.length > 0
                ? "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 cursor-pointer"
                : "border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            }`}
            title="Refresh card (new imports are stored in Import Repository)"
          >
            <RotateCw size={11} className="shrink-0 text-current" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Segmented Toggle for selecting Report / Source within this level */}
        <div className="mt-3">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-sibs-tertiary-5 block mb-1.5">
            REPORT / SOURCE
          </span>
          <div className="inline-flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-200/80 shadow-inner">
            {cards.map((card) => {
              const isActive = card.id === activeCard.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setSelectedCardId(card.id)}
                  className={`inline-flex items-center rounded-lg px-3.5 py-1.5 text-xs transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#042c51] text-white shadow-sm font-extrabold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50 font-medium"
                  }`}
                >
                  <span>{card.sourceLabel || card.sourceSystem || card.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Task Orders badges */}
        {activeCard.taskOrders?.length ? (
          <div className="mt-2.5 flex min-w-0 flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[10px] font-extrabold uppercase text-sibs-tertiary-5 shrink-0">
              TASK ORDERS:
            </span>
            <div className="flex min-w-0 flex-wrap gap-1">
              {activeCard.taskOrders.map((taskOrder, index) => {
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

      {/* Uploaded file container with rich batch summary fitting the card */}
      <div className="mt-3.5 min-h-[175px] flex-1 rounded-xl border border-slate-200/80 bg-slate-50/50 p-2.5 flex flex-col justify-center">
        {latestUpload ? (
          <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs">
            {/* Header: File icon, Filename, Status Badge */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-100 bg-sky-50 text-sky-600">
                  <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="m-0 truncate text-xs font-bold text-sibs-primary-1"
                    title={latestUpload.fileName}
                  >
                    {latestUpload.fileName}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-sibs-tertiary-5">
                    {latestUpload.batchCode ? (
                      <span className="rounded bg-sibs-primary-2/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-sibs-primary-2">
                        {latestUpload.batchCode}
                      </span>
                    ) : null}
                    <span className="whitespace-nowrap">
                      ({formatRelativeTime(latestUpload)}) {latestUpload.uploadedAt}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              {isCompletedWithErrors ? (
                <button
                  type="button"
                  onClick={() =>
                    onOpenErrorDetails?.(
                      latestUpload.batchId || latestUpload.id,
                    )
                  }
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-400 bg-amber-50 px-2 py-0.5 text-[9.5px] font-semibold text-amber-800 shadow-2xs hover:bg-amber-100 transition-colors cursor-pointer"
                  title="Review validation issues"
                >
                  <AlertTriangle size={10} className="shrink-0 text-amber-600" />
                  <span>{getImportDisplayStatus(latestUpload).label}</span>
                </button>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wide text-emerald-700 shadow-2xs">
                  <CheckCircle2 size={10} className="shrink-0 text-emerald-600" />
                  <span>Completed</span>
                </span>
              )}
            </div>

            {/* 6 Stats Pills Grid matching Batch Details Modal */}
            <div className="mt-2.5 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-1.5 text-center">
                <span className="block text-[8px] font-extrabold uppercase text-sibs-tertiary-5 leading-none">Total Rows</span>
                <span className="mt-1 block text-xs sm:text-[13px] font-black text-sibs-primary-1 leading-tight">
                  {Number(latestUpload.totalRows || 0).toLocaleString()}
                </span>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-1.5 text-center">
                <span className="block text-[8px] font-extrabold uppercase text-emerald-700 leading-none">Valid Rows</span>
                <span className="mt-1 block text-xs sm:text-[13px] font-black text-emerald-700 leading-tight">
                  {Number(latestUpload.validRows || 0).toLocaleString()}
                </span>
              </div>
              <div className="rounded-lg border border-rose-100 bg-rose-50/60 p-1.5 text-center">
                <span className="block text-[8px] font-extrabold uppercase text-rose-700 leading-none">Invalid Rows</span>
                <span className="mt-1 block text-xs sm:text-[13px] font-black text-rose-700 leading-tight">
                  {Number(latestUpload.invalidRows || 0).toLocaleString()}
                </span>
              </div>
              <div className="rounded-lg border border-orange-100 bg-orange-50/60 p-1.5 text-center">
                <span className="block text-[8px] font-extrabold uppercase text-orange-700 leading-none">Duplicate Rows</span>
                <span className="mt-1 block text-xs sm:text-[13px] font-black text-orange-700 leading-tight">
                  {Number(latestUpload.duplicateRows || 0).toLocaleString()}
                </span>
              </div>
              <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-1.5 text-center">
                <span className="block text-[8px] font-extrabold uppercase text-amber-700 leading-none">Warning Rows</span>
                <span className="mt-1 block text-xs sm:text-[13px] font-black text-amber-700 leading-tight">
                  {Number(latestUpload.warningRows || 0).toLocaleString()}
                </span>
              </div>
              <div className="rounded-lg border border-cyan-100 bg-cyan-50/60 p-1.5 text-center">
                <span className="block text-[8px] font-extrabold uppercase text-cyan-700 leading-none">Info Rows</span>
                <span className="mt-1 block text-xs sm:text-[13px] font-black text-cyan-700 leading-tight">
                  {Number(latestUpload.infoRows || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Bottom action: View Error Details button */}
            {isCompletedWithErrors && (
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() =>
                    onOpenErrorDetails?.(
                      latestUpload.batchId || latestUpload.id,
                    )
                  }
                  className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-[10.5px] font-bold text-rose-700 shadow-2xs hover:bg-rose-100 hover:border-rose-300 transition-colors cursor-pointer"
                >
                  <AlertCircle size={11} className="shrink-0 text-rose-600" />
                  <span>
                    View Import Events (
                    {(
                      (latestUpload.invalidRows || 0) +
                      (latestUpload.warningRows || 0) +
                      (latestUpload.duplicateRows || 0)
                    ).toLocaleString()}
                    )
                  </span>
                </button>
              </div>
            )}
          </div>
        ) : stagedFile ? (
          /* Clean, organized FrontSteps Staged File View fitting the card comfortably */
          <div className="flex h-full min-h-[160px] flex-col justify-between rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50/60 p-3 sm:p-3.5 transition-all">
            {/* Top row: Spreadsheet icon + File name & details */}
            <div className="flex items-start gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-sky-200 text-sky-700 shadow-2xs">
                <FileSpreadsheet size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="m-0 truncate text-xs font-bold text-slate-800" title={stagedFile.name}>
                    {stagedFile.name}
                  </p>
                  <span className="rounded bg-sky-100 border border-sky-200/60 px-1.5 py-0.2 text-[8.5px] font-extrabold text-sky-800 uppercase tracking-wider whitespace-nowrap">
                    READY TO UPLOAD
                  </span>
                </div>
                <p className="m-0 mt-0.5 text-[10.5px] text-slate-500 font-medium">
                  {(stagedFile.size / 1024).toFixed(1)} KB · Staged for {activeCard.sourceLabel || activeCard.title}
                </p>
              </div>
            </div>

            {/* Bottom row: Change and Trash buttons */}
            <div className="mt-3 flex items-center justify-end gap-1.5 pt-2.5 border-t border-sky-200/50">
              <label
                className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition cursor-pointer shadow-2xs"
                title="Choose a different file"
              >
                Change
                <input
                  type="file"
                  accept={activeCard.acceptedFileTypes || ".xlsx,.csv"}
                  disabled={isUploading}
                  onChange={(event) => {
                    const f = event.target.files?.[0];
                    if (f) handleStageFile(activeCard, f);
                    event.target.value = "";
                  }}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={() => handleRemoveStagedFile(activeCard.id)}
                aria-label="Remove staged file"
                title="Remove selected file"
                className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-rose-600 transition cursor-pointer"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ) : (
          /* Dropzone when no file is staged */
          <label
            className="group flex h-full min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-sky-200/80 bg-white/70 p-4 text-center transition-all hover:border-sky-400 hover:bg-sky-50/40"
          >
            <input
              type="file"
              accept={activeCard.acceptedFileTypes || ".xlsx,.csv"}
              disabled={isUploading}
              onChange={(event) => {
                const f = event.target.files?.[0];
                if (f) handleStageFile(activeCard, f);
                event.target.value = "";
              }}
              className="hidden"
            />
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-100 bg-white text-[#042c51] shadow-xs group-hover:scale-105 group-hover:border-sky-200 transition-transform">
              <CloudUpload size={22} strokeWidth={1.8} className="text-[#042c51]" />
            </div>
            <p className="m-0 text-xs sm:text-sm font-extrabold text-[#042c51] leading-tight">
              Drag and drop your <span className="text-[#ff5c28]">{activeCard.sourceLabel || activeCard.title}</span> here
            </p>
            <p className="m-0 mt-1 text-[11px] text-slate-500">
              or click browse to select a spreadsheet from your device
            </p>
            <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-[#042c51] px-3 py-1.5 text-[11px] font-bold text-white shadow-xs group-hover:bg-[#063d70] transition-colors">
              <FolderOpen size={13} />
              <span>Browse Files</span>
            </span>
            <p className="m-0 mt-2 text-[10px] text-slate-400">
              Formats: CSV, XLSX · Max file size: 25 MB
            </p>
          </label>
        )}
      </div>

      {/* Action buttons: Upload (when staged) on left of Open */}
      <div className={`mt-3.5 ${stagedFile ? "grid grid-cols-2 gap-2.5" : ""}`}>
        {stagedFile && (
          <button
            type="button"
            onClick={handleExecuteUpload}
            disabled={isUploading}
            className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#ff5c28] hover:bg-[#ed4a1b] px-3 text-xs font-bold text-white shadow-xs transition-colors"
          >
            <Upload size={14} className="shrink-0" />
            <span className="truncate">Upload {activeCard.sourceLabel || activeCard.title}</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => onOpenCard?.(activeCard, group)}
          className={`flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-sibs-primary-1 shadow-xs transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1 hover:text-white ${
            stagedFile ? "" : "w-full"
          }`}
        >
          <FolderOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Open</span>
        </button>
      </div>
    </section>
  );
}

