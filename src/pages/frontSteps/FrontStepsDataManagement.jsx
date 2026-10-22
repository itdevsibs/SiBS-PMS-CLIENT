import React, { useMemo, useRef, useState } from "react";
import {
  AlertTriangle, CheckCircle2,
  Clock3, Database, FileText,
  FilterX, RotateCcw, Search, X, UploadCloud, FileSpreadsheet, PhoneCall, FolderOpen, Trash2, Info,
  Upload, Eye,
} from "lucide-react";
import SingleSelectDropdown from "../../components/common/filters/SingleSelectDropdown";
import TablePagination from "../../components/common/tables/TablePagination";

// FrontSteps Data Management module for record tracking, validation review, and correction tracking.
const INITIAL_RECORDS = [];

const QUALITY_OPTIONS = ["Missing", "Incomplete", "Corrected"];
const VALIDATION_OPTIONS = ["Validated", "Pending Validation", "Unvalidated", "Requires Review"];
const STANDARD_SOURCES = ["Calls", "Cases", "Individual KPI", "Attendance", "AHT / Telephony", "CRM Documentation", "Schedule Adherence", "Omni Availability"];
const sourceOptions = ["All Sources", ...STANDARD_SOURCES];
const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-[#ff5c28] focus:ring-2 focus:ring-[#ff5c28]/20";
const labelClass = "mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500";
const btnPrimary = "inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#ff5c28] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#ed4a1b] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer shadow-xs";
const btnSecondary = "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer";

function Badge({ children, kind = "neutral" }) {
  const colors = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warn: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    neutral: "bg-slate-50 text-slate-600 border-slate-200",
  };
  return <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${colors[kind]}`}>{children}</span>;
}
const qualityKind = (q) => q === "Missing" || q === "Incomplete" ? "danger" : q === "Corrected" ? "info" : "success";
const validationKind = (v) => v === "Validated" ? "success" : v === "Requires Review" ? "danger" : v === "Pending Validation" ? "warn" : "neutral";

function Modal({ title, subtitle, onClose, children, footer, wide = false, size = "default" }) {
  const sizeClasses = {
    default: "max-w-2xl max-h-[90vh]",
    wide: "max-w-4xl max-h-[90vh]",
    xl: "max-w-5xl h-[85vh] max-h-[92vh]",
    full: "max-w-6xl h-[88vh] max-h-[95vh]",
  };
  const chosenSize = size !== "default" ? sizeClasses[size] || sizeClasses.default : wide ? sizeClasses.wide : sizeClasses.default;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 backdrop-blur-2xs p-3 sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-label={title} className={`flex w-full ${chosenSize} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150`}>
        <header className="flex shrink-0 items-center justify-between gap-3 bg-[#042c51] px-6 py-4 text-white">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-white leading-tight">{title}</h2>
            {subtitle && <p className="mt-1 text-xs text-slate-300">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-6 sm:p-7 sibs-scrollbar">{children}</div>
        {footer && <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-3.5">{footer}</footer>}
      </section>
    </div>
  );
}

function Section({ title, description, children }) {
  return (
    <section className="mb-5 last:mb-0">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#042c51]">{title}</h3>
      {description && <p className="mb-3 mt-1 text-xs text-slate-500">{description}</p>}
      {!description && <div className="mb-2.5" />}
      {children}
    </section>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="mt-0.5 break-words text-xs font-semibold text-slate-800">{value || "—"}</dd>
    </div>
  );
}


// Frontend-only file selector. Files remain in memory and are not sent to a server.
const ACCEPTED_UPLOAD_EXTENSIONS = ["csv", "xlsx", "xls"];
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

function UploadCard({
  title,
  description,
  category,
  file,
  onSelect,
  onRemove,
  onUpload,
  onViewFolder,
  hasUploadedFiles,
  uploadedCount = 0,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const isCases = category === "cases";
  const Icon = isCases ? FileSpreadsheet : PhoneCall;

  const selectFile = (candidate) => {
    if (!candidate) return;
    onSelect(category, candidate);
  };
  const openPicker = () => inputRef.current?.click();
  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  };

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Card Header with View Folder/Datas button */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isCases ? "bg-blue-50 text-blue-700" : "bg-cyan-50 text-cyan-700"}`}>
            <Icon size={22} strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-extrabold text-[#042c51]">{title}</h3>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500">CSV / Excel</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
          </div>
        </div>

        {/* View Folder / View Datas Button in Header */}
        <button
          type="button"
          onClick={() => onViewFolder(category, title)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 px-3 py-1.5 text-xs font-bold text-[#042c51] transition-all cursor-pointer shrink-0 shadow-2xs"
          title={`View uploaded ${title} files`}
        >
          <FolderOpen size={14} className="text-[#042c51]" />
          <span>View Datas</span>
          {uploadedCount > 0 && (
            <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ff5c28] px-1 text-[10px] font-extrabold text-white">
              {uploadedCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".csv,.xlsx,.xls"
          aria-label={`Choose ${title} file`}
          onChange={(event) => {
            selectFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />

        {/* Drop zone */}
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
          className={`flex min-h-[190px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-6 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${dragging ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-slate-50/60 hover:border-blue-300 hover:bg-blue-50/40"}`}
        >
          <div className="mb-2.5 flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-700 shadow-sm">
            <UploadCloud size={22} strokeWidth={1.8} />
          </div>
          <p className="text-sm font-bold text-[#042c51]">Drag and drop your file here</p>
          <p className="mt-1 text-xs text-slate-500">or select a file from your device</p>
          <span className="mt-3.5 inline-flex items-center gap-2 rounded-lg bg-[#042c51] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#063d70] transition-colors">
            <FolderOpen size={14} /> Browse Files
          </span>
          <p className="mt-2.5 text-[11px] text-slate-400">CSV, XLSX or XLS · Maximum 25 MB</p>
        </div>

        {/* Selected file area + Upload Button */}
        <div className="mt-4">
          {file ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/60 p-3 shadow-2xs">
              <div className="flex min-w-0 items-center gap-3">
                <FileSpreadsheet size={20} className="shrink-0 text-blue-700" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-800" title={file.name}>{file.name}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{(file.size / 1024).toFixed(1)} KB · Ready to upload</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onRemove(category)}
                  aria-label={`Remove ${title} file`}
                  title="Remove selected file"
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => onUpload(category)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#ff5c28] hover:bg-[#ed4a1b] px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Upload size={14} />
                  <span>Upload</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-3.5 py-3 text-xs text-slate-500">
              <span className="flex items-center gap-2">
                <Info size={15} className="shrink-0 text-slate-400" />
                No file selected yet.
              </span>
              <button
                type="button"
                onClick={() => onViewFolder(category, title)}
                className="text-xs font-bold text-[#042c51] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Eye size={13} />
                View Folder ({uploadedCount})
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function FrontStepsDataManagement() {
  const [records, setRecords] = useState(INITIAL_RECORDS);
  const [uploadFiles, setUploadFiles] = useState({ cases: null, calls: null });
  const [uploadError, setUploadError] = useState("");
  // Helper to format live timestamp as: "Oct 12, 2026,- 1:42 AM"
  const formatLiveTimestamp = (date = new Date()) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 hour is 12
    return `${month} ${day}, ${year},- ${hours}:${minutes} ${ampm}`;
  };

  // Track uploaded files per category with timestamp and exact filename
  const [uploadedHistory, setUploadedHistory] = useState({
    cases: [
      {
        id: "cases-sample-1",
        name: "FrontSteps_Cases_Closed_W3_Oct2026.xlsx",
        timestamp: "Oct 22, 2026,- 9:15 AM",
        size: "1.4 MB",
      },
    ],
    calls: [
      {
        id: "calls-sample-1",
        name: "FrontSteps_Telephony_Inbound_Oct2026.csv",
        timestamp: "Oct 22, 2026,- 9:18 AM",
        size: "842 KB",
      },
    ],
  });
  // Modal for viewing the folder/datas of uploaded files
  const [folderModal, setFolderModal] = useState(null); // { category: 'cases'|'calls', title: string }

  const selectUpload = (category, file) => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_UPLOAD_EXTENSIONS.includes(extension)) {
      setUploadError("Unsupported file type. Choose a CSV, XLSX, or XLS file.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError("File is too large. Maximum file size is 25 MB.");
      return;
    }
    setUploadError("");
    setUploadFiles((previous) => ({ ...previous, [category]: file }));
  };

  const removeUpload = (category) => {
    setUploadError("");
    setUploadFiles((previous) => ({ ...previous, [category]: null }));
  };

  // Upload handler: saves file into uploaded folder history with exact timestamp and filename
  const handleUpload = (category) => {
    const file = uploadFiles[category];
    if (!file) return;

    const formattedTimestamp = formatLiveTimestamp(new Date());

    const newRecord = {
      id: `${category}-${Date.now()}`,
      name: file.name,
      timestamp: formattedTimestamp,
      size: `${(file.size / 1024).toFixed(1)} KB`,
    };

    setUploadedHistory((prev) => ({
      ...prev,
      [category]: [newRecord, ...(prev[category] || [])],
    }));

    // Clear selected file stage and show success toast
    setUploadFiles((prev) => ({ ...prev, [category]: null }));
    setToast(`Successfully uploaded "${file.name}" to ${category === "cases" ? "Cases" : "Calls"} data folder.`);
  };

  const openViewFolder = (category, title) => {
    setFolderModal({ category, title });
  };
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("All Sources");
  const [period, setPeriod] = useState("All Periods");
  const [quality, setQuality] = useState("All Quality");
  const [validation, setValidation] = useState("All Validation");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [reviewer, setReviewer] = useState("WFM Reviewer");
  const [checks, setChecks] = useState([false, false, false, false]);
  const [issueDraft, setIssueDraft] = useState(null);
  const [toast, setToast] = useState("");
  const pageSize = 10;

  const filtered = useMemo(() => records.filter((r) => {
    const term = search.trim().toLowerCase();
    return (!term || [r.id, r.source, r.owner, r.employeeId, r.supervisor].some((x) => String(x).toLowerCase().includes(term))) &&
      (source === "All Sources" || r.source === source) &&
      (period === "All Periods" || r.period === period) &&
      (quality === "All Quality" || (quality === "No Issues" ? r.quality.length === 0 : r.quality.includes(quality))) &&
      (validation === "All Validation" || r.validation === validation);
  }), [records, search, source, period, quality, validation]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((Math.min(page, totalPages) - 1) * pageSize, Math.min(page, totalPages) * pageSize);
  const chosen = modal ? records.find((r) => r.id === modal.id) : null;
  const stats = {
    total: records.length,
    validated: records.filter((r) => r.validation === "Validated").length,
    pending: records.filter((r) => r.validation !== "Validated").length,
    issues: records.filter((r) => r.quality.length > 0 || r.issues.some((i) => i.status !== "Resolved")).length
  };

  const reset = () => {
    setSearch("");
    setSource("All Sources");
    setPeriod("All Periods");
    setQuality("All Quality");
    setValidation("All Validation");
    setPage(1);
  };

  const open = (id, type) => {
    setModal({ id, type });
    setToast("");
    setRemarks("");
    setReviewer("WFM Reviewer");
    const r = records.find((x) => x.id === id);
    const isValidated = r?.validation === "Validated";
    setChecks(isValidated ? [true, true, true, true] : [false, false, false, false]);
    const first = r?.issues?.[0];
    setIssueDraft(first ? { ...first } : { field: "", kind: "Incomplete", description: "", original: "", proposed: "", reason: "", assignee: "", status: "Open" });
  };

  const update = (id, fn, message) => {
    setRecords((prev) => prev.map((r) => r.id === id ? fn(r) : r));
    setModal(null);
    setToast(message);
  };

  const validationReady = checks.every(Boolean) && !!reviewer.trim() && !chosen?.quality.some((q) => q === "Missing" || q === "Incomplete") && chosen?.issues.every((i) => ["Resolved", "Ready for Revalidation"].includes(i.status));

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 sm:gap-3 overflow-hidden font-jakarta text-slate-800">
      {/* Toast Notice */}
      {toast && (
        <div
          role="status"
          className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 shrink-0"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 size={15} />
            {toast}
          </span>
          <button
            type="button"
            onClick={() => setToast("")}
            aria-label="Dismiss notification"
            className="cursor-pointer text-emerald-700 hover:text-emerald-900"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 1. Summary Cards (4 Metrics) Matching Other FrontSteps Modules */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 shrink-0">
        {/* Card 1 — Total Data Records */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 shadow-xs">
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Data Records
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-extrabold text-slate-800">
                {stats.total}
              </span>
              <span className="text-xs font-medium text-slate-400">Sources</span>
            </div>
            <span className="block text-[10px] text-slate-400 mt-0.5">
              Source Records
            </span>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-[#042c51] border border-slate-100">
            <Database size={15} />
          </div>
        </div>

        {/* Card 2 — Validated Records */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 shadow-xs">
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Validated Records
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-extrabold text-emerald-600">
                {stats.validated}
              </span>
              <span className="text-xs font-medium text-emerald-600/80">Valid</span>
            </div>
            <span className="block text-[10px] text-emerald-600/80 mt-0.5">
              Reviewed & verified
            </span>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 size={15} />
          </div>
        </div>

        {/* Card 3 — Pending Validation */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 shadow-xs">
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Pending Validation
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-extrabold text-amber-600">
                {stats.pending}
              </span>
              <span className="text-xs font-medium text-amber-600/80">Pending</span>
            </div>
            <span className="block text-[10px] text-amber-600/80 mt-0.5">
              Awaiting review
            </span>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
            <Clock3 size={15} />
          </div>
        </div>

        {/* Card 4 — Records with Issues */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 shadow-xs">
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Records with Issues
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-extrabold text-rose-600">
                {stats.issues}
              </span>
              <span className="text-xs font-medium text-rose-600/80">Issues</span>
            </div>
            <span className="block text-[10px] text-rose-600/80 mt-0.5">
              Missing, incomplete, or corrected
            </span>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
            <AlertTriangle size={15} />
          </div>
        </div>
      </div>

      {/* 2. Source File Uploads */}
      <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-2 sibs-scrollbar">

        {uploadError && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
            <span className="flex items-center gap-2"><AlertTriangle size={15} />{uploadError}</span>
            <button type="button" onClick={() => setUploadError("")} aria-label="Dismiss upload error"><X size={15} /></button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <UploadCard
            title="Cases Report"
            category="cases"
            description="Choose the Cases Closed source report for FrontSteps case productivity and reporting."
            file={uploadFiles.cases}
            onSelect={selectUpload}
            onRemove={removeUpload}
            onUpload={handleUpload}
            onViewFolder={openViewFolder}
            uploadedCount={uploadedHistory.cases?.length || 0}
          />
          <UploadCard
            title="Calls Report"
            category="calls"
            description="Choose the Inbound Calls source report for FrontSteps call activity and reporting."
            file={uploadFiles.calls}
            onSelect={selectUpload}
            onRemove={removeUpload}
            onUpload={handleUpload}
            onViewFolder={openViewFolder}
            uploadedCount={uploadedHistory.calls?.length || 0}
          />
        </div>
      </section>

      {/* 4. Data Record Details Modal */}
      {chosen && modal?.type === "view" && (
        <Modal
          title="Data Record Details"
          subtitle={`${chosen.id} • ${chosen.source}`}
          onClose={() => setModal(null)}
          wide
          footer={<button className={btnPrimary} onClick={() => setModal(null)}>Done</button>}
        >
          <Section title="1. Record Information">
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
              <Detail label="Record ID" value={chosen.id} />
              <Detail label="Report Type" value={chosen.source} />
              <Detail label="Reporting Period" value={chosen.period} />
              <Detail label="Employee / Account" value={chosen.owner} />
              <Detail label="Employee ID" value={chosen.employeeId} />
              <Detail label="Supervisor" value={chosen.supervisor} />
            </div>
          </Section>

          <Section title="2. Source Data Summary" description="Overview of metrics extracted for this reporting cycle.">
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
              {chosen.metrics.map((m) => (
                <Detail key={m.label} label={m.label} value={m.value} />
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200/80 px-3.5 py-2.5 text-xs text-slate-600">
              <span className="font-medium text-slate-500">Source Feed Classification:</span>
              <span className="font-semibold text-slate-800">{chosen.origin}</span>
            </div>
          </Section>

          <Section title="3. Data Quality & Validation">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500 mr-1">Quality Status:</span>
              {chosen.quality.length ? (
                chosen.quality.map((q) => <Badge key={q} kind={qualityKind(q)}>{q}</Badge>)
              ) : (
                <Badge kind="success">No Issues</Badge>
              )}
              <span className="text-xs font-medium text-slate-500 mx-1">|</span>
              <span className="text-xs font-medium text-slate-500 mr-1">Validation:</span>
              <Badge kind={validationKind(chosen.validation)}>{chosen.validation}</Badge>
            </div>
            {chosen.notes && (
              <p className="mt-2.5 rounded-lg border border-slate-100 bg-slate-50/80 p-2.5 text-xs text-slate-600 leading-relaxed">
                {chosen.notes}
              </p>
            )}
            {chosen.issues.map((i, idx) => (
              <div key={idx} className="mt-2.5 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
                <div className="flex items-center justify-between">
                  <strong className="font-semibold text-amber-950">{i.field} · {i.kind}</strong>
                  <span className="rounded bg-amber-100/80 px-2 py-0.5 text-[10.5px] font-bold text-amber-800 uppercase tracking-wide">{i.status}</span>
                </div>
                <p className="mt-1.5 text-amber-800">{i.description}</p>
              </div>
            ))}
          </Section>

          <Section title="4. Supporting Records">
            <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-3.5 text-xs text-slate-600">
              <FileText size={16} className="text-slate-400 shrink-0" />
              <span>Supporting documentation: Standard source report reference archived for audit compliance.</span>
            </div>
          </Section>
        </Modal>
      )}

      {/* 5. Data Validation Modal */}
      {chosen && modal?.type === "validate" && (
        <Modal
          title="Data Validation Review"
          subtitle={`${chosen.id} • Data Verification`}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className={btnSecondary} onClick={() => setModal(null)}>Cancel</button>
              <button
                className={btnSecondary}
                onClick={() => update(chosen.id, (r) => ({ ...r, validation: "Requires Review" }), "Record returned for review.")}
              >
                Return for Review
              </button>
              <button
                className={btnPrimary}
                disabled={!validationReady}
                onClick={() => update(chosen.id, (r) => ({ ...r, validation: "Validated" }), "Record successfully marked as validated.")}
              >
                Mark Validated
              </button>
            </>
          }
        >
          <Section title="1. Record Summary">
            <div className="grid grid-cols-2 gap-2.5">
              <Detail label="Record ID" value={chosen.id} />
              <Detail label="Current Validation" value={chosen.validation} />
            </div>
          </Section>

          <Section title="2. Validation Checklist" description="Complete all required validation checks before certifying this record.">
            <div className="space-y-2">
              {[
                "Required fields are present and complete",
                "Source reference has been audited against operational logs",
                "Reported values adhere to threshold metrics",
                "All reported quality issues have been resolved or reconciled"
              ].map((v, i) => (
                <label key={v} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded accent-[#042c51] cursor-pointer"
                    checked={checks[i]}
                    onChange={(e) => setChecks((a) => a.map((x, j) => j === i ? e.target.checked : x))}
                  />
                  <span>{v}</span>
                </label>
              ))}
            </div>
            {(chosen.quality.some((q) => q === "Missing" || q === "Incomplete") || chosen.issues.some((i) => !["Resolved", "Ready for Revalidation"].includes(i.status))) && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <AlertTriangle size={15} className="shrink-0 text-amber-600 mt-0.5" />
                <p>This record contains unresolved data issues. Document a correction proposal before proceeding with final validation.</p>
              </div>
            )}
          </Section>

          <Section title="3. Review Details">
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Reviewer</label>
                <input
                  className={inputClass}
                  value={reviewer}
                  onChange={(e) => setReviewer(e.target.value)}
                  placeholder="Enter reviewer name"
                />
              </div>
              <div>
                <label className={labelClass}>Validation Remarks</label>
                <textarea
                  className={inputClass}
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter validation remarks"
                />
              </div>
            </div>
          </Section>
        </Modal>
      )}

      {/* 6. Data Issue / Correction Review Modal */}
      {chosen && modal?.type === "issue" && (
        <Modal
          title="Data Issue / Correction Review"
          subtitle={`${chosen.id} • Correction Review`}
          onClose={() => setModal(null)}
          wide
          footer={
            <>
              <button className={btnSecondary} onClick={() => setModal(null)}>Cancel</button>
              <button
                className={btnPrimary}
                disabled={!issueDraft?.field.trim() || !issueDraft?.description.trim() || !issueDraft?.reason.trim() || !issueDraft?.assignee.trim()}
                onClick={() => update(chosen.id, (r) => ({
                  ...r,
                  quality: [...new Set([...r.quality.filter((q) => q !== "Missing" && q !== "Incomplete"), "Corrected"])],
                  validation: "Pending Validation",
                  issues: [{ ...issueDraft, status: "Ready for Revalidation" }, ...r.issues.slice(1)]
                }), "Correction proposal recorded; record updated to Pending Validation.")}
              >
                Save Correction Proposal
              </button>
            </>
          }
        >
          <Section title="1. Identified Issue">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Detail label="Record ID" value={chosen.id} />
              <Detail label="Data Source" value={chosen.source} />
              <div>
                <label className={labelClass}>Affected Field *</label>
                <input
                  className={inputClass}
                  value={issueDraft.field}
                  onChange={(e) => setIssueDraft((d) => ({ ...d, field: e.target.value }))}
                  placeholder="e.g. AHT, Cases Closed, Attendance"
                />
              </div>
              <div>
                <label className={labelClass}>Issue Type *</label>
                <select
                  className={inputClass}
                  value={issueDraft.kind}
                  onChange={(e) => setIssueDraft((d) => ({ ...d, kind: e.target.value }))}
                >
                  {["Missing", "Incomplete", "Incorrect"].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className={labelClass}>Issue Description *</label>
              <textarea
                className={inputClass}
                rows={2}
                value={issueDraft.description}
                onChange={(e) => setIssueDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="Describe the discrepancy or missing information"
              />
            </div>
          </Section>

          <Section title="2. Proposed Correction" description="Specify the proposed adjustment and rationale for audit documentation.">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Original Value</label>
                <input
                  className={`${inputClass} bg-slate-100 text-slate-500 cursor-not-allowed`}
                  value={issueDraft.original || "—"}
                  readOnly
                />
              </div>
              <div>
                <label className={labelClass}>Proposed Value *</label>
                <input
                  className={inputClass}
                  value={issueDraft.proposed}
                  onChange={(e) => setIssueDraft((d) => ({ ...d, proposed: e.target.value }))}
                  placeholder="Enter proposed correction"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Reason for Correction *</label>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={issueDraft.reason}
                  onChange={(e) => setIssueDraft((d) => ({ ...d, reason: e.target.value }))}
                  placeholder="Explain the proposed adjustment and reference source"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Responsible Person *</label>
                <input
                  className={inputClass}
                  value={issueDraft.assignee}
                  onChange={(e) => setIssueDraft((d) => ({ ...d, assignee: e.target.value }))}
                  placeholder="Person handling or submitting correction"
                />
              </div>
            </div>
          </Section>

          <Section title="3. Correction Review">
            <p className="rounded-lg border border-blue-100 bg-blue-50/80 p-3 text-xs text-blue-900 leading-relaxed">
              Submitting records the correction proposal and updates validation status to <strong>Pending Validation</strong> for supervisor verification.
            </p>
          </Section>
        </Modal>
      )}

      {/* 5. View Datas / Folder Modal */}
      {folderModal && (
        <Modal
          size="xl"
          title={`Uploaded Files: ${folderModal.title}`}
          subtitle={`Repository for ${folderModal.category === "cases" ? "Cases Closed" : "Inbound Calls"} source datasets`}
          onClose={() => setFolderModal(null)}
          footer={
            <button
              type="button"
              className={btnPrimary}
              onClick={() => setFolderModal(null)}
            >
              Close
            </button>
          }
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-[#ff5c28]" />
                <span className="text-xs font-bold text-slate-700">
                  Total Uploaded:{" "}
                  <strong className="text-[#042c51]">
                    {uploadedHistory[folderModal.category]?.length || 0} files
                  </strong>
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Sorted by most recent upload
              </span>
            </div>

            {uploadedHistory[folderModal.category]?.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Exact Filename</th>
                      <th className="px-4 py-3 w-48 text-right sm:text-left">Timestamp Uploaded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {uploadedHistory[folderModal.category].map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-800 break-all">
                          <div className="flex items-center gap-2.5">
                            <FileSpreadsheet className="h-4 w-4 shrink-0 text-blue-600" />
                            <span className="font-mono text-xs">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap text-right sm:text-left">
                          <div className="flex items-center gap-1.5 sm:justify-start justify-end">
                            <Clock3 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{item.timestamp}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 text-center">
                <FolderOpen className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-600">No uploaded files in this folder yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Use the "Upload" button on the card to upload reports.</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
