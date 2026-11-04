import React, { useRef, useState } from "react";
import { FolderOpen, Upload, Trash2, ChevronRight } from "lucide-react";

/**
 * Format timestamp into "Oct 27, 2026 · 1:42 PM" matching approved design
 */
function formatDesignTimestamp(value) {
  if (!value) return "—";
  const str = String(value).trim();
  let dateObj = null;

  const sqlMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (sqlMatch) {
    dateObj = new Date(Date.UTC(+sqlMatch[1], +sqlMatch[2] - 1, +sqlMatch[3], +sqlMatch[4], +sqlMatch[5], +(sqlMatch[6] || 0)));
  } else {
    const parsed = new Date(str.endsWith("Z") ? str : str + "Z");
    dateObj = isNaN(parsed.getTime()) ? new Date(str) : parsed;
  }

  if (!dateObj || isNaN(dateObj.getTime())) return str;

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const m = monthNames[dateObj.getMonth()];
  const d = dateObj.getDate();
  const y = dateObj.getFullYear();
  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${m} ${d}, ${y} · ${hours}:${minutes} ${ampm}`;
}

export default function CallsReportUploadPanel({
  selectedCategory = "calls",
  onCategoryChange,
  file,
  onSelect,
  onRemove,
  onUpload,
  onViewFolder,
  uploadedCounts = { cases: 0, calls: 0 },
  historyItems = [],
  uploading = false,
  uploadProgress = 0,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const isCases = selectedCategory === "cases";

  const currentTitle = isCases ? "Cases Report" : "Calls Report";
  const currentCount = uploadedCounts[selectedCategory] || 0;

  const selectFile = (candidate) => {
    if (!candidate) return;
    onSelect(selectedCategory, candidate);
  };
  const openPicker = () => inputRef.current?.click();
  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  };

  return (
    <article className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#DCE4EE] bg-white shadow-2xs h-full">
      {/* 1. Dark Navy Panel Header */}
      <div className="flex items-center justify-between bg-[#082B60] px-5 py-3.5 shrink-0 text-white rounded-t-xl h-[52px]">
        <h3 className="text-[15px] font-extrabold tracking-wide text-white">
          {isCases ? "Cases Report Upload" : "Calls Report Upload"}
        </h3>
        <button
          type="button"
          onClick={() => onViewFolder(selectedCategory, currentTitle)}
          className="inline-flex items-center gap-1.5 rounded-md bg-white hover:bg-slate-100 px-3 py-1 text-xs font-bold text-[#082B60] transition-colors cursor-pointer shadow-2xs"
          title={`View repository for ${currentTitle}`}
        >
          <FolderOpen size={13} className="text-[#082B60]" />
          <span>View Folder</span>
          <span className="ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#082B60] px-1 text-[10px] font-extrabold text-white">
            {currentCount}
          </span>
        </button>
      </div>

      <div className="flex flex-1 min-h-0 flex-col p-5 gap-5">
        {/* 2. Target Source Selector */}
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-extrabold text-[#14233F]">Target Source</span>
          <div className="inline-flex rounded-full bg-[#F4F6F9] p-1 gap-1 border border-[#DCE4EE]">
            <button
              type="button"
              onClick={() => onCategoryChange("cases")}
              disabled={uploading}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-bold transition-all cursor-pointer ${
                isCases
                  ? "bg-[#082B60] text-white shadow-2xs"
                  : "text-[#526582] hover:text-[#14233F]"
              }`}
            >
              <span>Cases Report</span>
              <span className={`inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-mono font-bold ${
                isCases ? "bg-white/20 text-white" : "bg-slate-200 text-[#526582]"
              }`}>
                {uploadedCounts.cases || 0}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onCategoryChange("calls")}
              disabled={uploading}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-bold transition-all cursor-pointer ${
                !isCases
                  ? "bg-[#082B60] text-white shadow-2xs"
                  : "text-[#526582] hover:text-[#14233F]"
              }`}
            >
              <span>Calls Report</span>
              <span className={`inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-mono font-bold ${
                !isCases ? "bg-white/20 text-white" : "bg-slate-200 text-[#526582]"
              }`}>
                {uploadedCounts.calls || 0}
              </span>
            </button>
          </div>
        </div>

        {/* 3. Upload Area (Dashed border, centered, no big icons) */}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".csv,.xlsx,.xls"
          aria-label={`Choose ${currentTitle} file`}
          onChange={(event) => {
            selectFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />

        {file ? (
          <div className="flex h-[310px] flex-col justify-between rounded-none border border-dashed border-[#12376B] bg-[#F4F6F9]/50 p-5 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="inline-block rounded bg-blue-100 text-[#12376B] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Ready To Upload
                </span>
                <p className="m-0 truncate text-sm font-extrabold text-[#14233F]" title={file.name}>
                  {file.name}
                </p>
                <p className="m-0 text-xs text-[#526582] mt-0.5 font-medium">
                  {(file.size / 1024).toFixed(1)} KB · Staged for {currentTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(selectedCategory)}
                className="p-1 text-[#526582] hover:text-[#B91C1C] transition-colors cursor-pointer"
                title="Remove file"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#DCE4EE]">
              <button
                type="button"
                onClick={openPicker}
                className="rounded-lg border border-[#DCE4EE] bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-[#14233F] transition-colors cursor-pointer"
              >
                Change File
              </button>
              <button
                type="button"
                onClick={() => onUpload(selectedCategory)}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-lg bg-[#082B60] hover:bg-[#12376B] px-5 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                <Upload size={13} />
                <span>{uploading ? `Ingesting ${uploadProgress}%...` : `Upload ${isCases ? "Cases" : "Calls"}`}</span>
              </button>
            </div>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={openPicker}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openPicker();
              }
            }}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={(event) => { event.preventDefault(); setDragging(false); }}
            onDrop={onDrop}
            className={`group flex h-[310px] cursor-pointer flex-col items-center justify-center rounded-none border border-dashed text-center outline-none transition-all ${
              dragging
                ? "border-[#12376B] bg-blue-50/50"
                : "border-[#A0AEC0] bg-white hover:border-[#12376B] hover:bg-[#F4F6F9]/40"
            }`}
          >
            <p className="text-[19px] font-extrabold text-[#14233F]">
              Drag and drop your <span className="text-[#12376B]">{currentTitle}</span> here
            </p>
            <p className="mt-1 text-xs text-[#526582]">
              or click browse to select a spreadsheet from your device
            </p>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openPicker();
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#082B60] px-7 py-3 text-sm font-bold text-white shadow-2xs hover:bg-[#12376B] transition-colors cursor-pointer"
            >
              <FolderOpen size={16} />
              <span>Browse Files</span>
            </button>

            <p className="mt-3 text-[11px] text-[#526582]">
              Formats: CSV, XLSX, XLS <span className="mx-1 text-[#DCE4EE]">|</span> Max file size: 25 MB
            </p>
          </div>
        )}

        {/* 4. Recent Uploads Section */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[#DCE4EE]">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <div className="w-[3px] h-[14px] bg-[#12376B] rounded-full shrink-0" />
              <h4 className="text-[13px] font-extrabold text-[#14233F]">
                Recent Uploads
              </h4>
            </div>
            <button
              type="button"
              onClick={() => onViewFolder(selectedCategory, currentTitle)}
              className="text-[12px] font-bold text-[#12376B] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
            >
              <span>View All ({currentCount})</span>
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Clean table */}
          <div className="overflow-hidden rounded-xl border border-[#DCE4EE]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F0F3F7] text-[11px] font-extrabold text-[#14233F] border-b border-[#DCE4EE]">
                  <th className="py-2.5 px-3 w-[30%]">Uploaded At</th>
                  <th className="py-2.5 px-3 w-[45%]">File Name</th>
                  <th className="py-2.5 px-3 w-[25%] text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE4EE] bg-white text-[12px]">
                {(() => {
                  const displayItems = historyItems.slice(0, 5);
                  const emptySlotsCount = Math.max(0, 5 - displayItems.length);

                  return (
                    <>
                      {displayItems.map((item) => {
                        const formattedTime = formatDesignTimestamp(item.timestamp);
                        const isWarn = item.status === "COMPLETED_WITH_ERRORS";
                        const isSuccess = item.status === "COMPLETED";

                        return (
                          <tr key={item.id} className="hover:bg-[#F4F6F9]/50 transition-colors h-[40px]">
                            <td className="py-2 px-3 whitespace-nowrap text-[#14233F] font-medium">
                              {formattedTime}
                            </td>
                            <td className="py-2 px-3 text-[#14233F] font-semibold truncate max-w-[200px]" title={item.name}>
                              {item.name}
                            </td>
                            <td className="py-2 px-3 text-right whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                                isSuccess
                                  ? "bg-emerald-50 text-[#15803D] border border-emerald-200"
                                  : isWarn
                                  ? "bg-amber-50 text-[#B45309] border border-amber-200"
                                  : "bg-rose-50 text-[#B91C1C] border border-rose-200"
                              }`}>
                                {isSuccess ? "Completed" : isWarn ? "Completed with Errors" : item.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}

                      {Array.from({ length: emptySlotsCount }).map((_, index) => (
                        <tr key={`slot-${index}`} className="h-[40px] text-[#526582]">
                          <td className="py-2 px-3 font-mono text-[#526582]">--</td>
                          <td className="py-2 px-3 italic text-[#526582]">
                            {`Slot ${displayItems.length + index + 1} empty`}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-[#526582]">
                            --
                          </td>
                        </tr>
                      ))}
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </article>
  );
}

