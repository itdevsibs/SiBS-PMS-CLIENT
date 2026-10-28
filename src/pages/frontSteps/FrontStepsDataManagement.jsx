import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, AlertCircle, CheckCircle2,
  Clock3, Database, FileText,
  FilterX, RotateCcw, Search, X, UploadCloud, FileSpreadsheet, PhoneCall, FolderOpen, Trash2, Info,
  Upload, Eye, ListPlus, UserX, Download, Plus, RefreshCw, FileCheck, Shield, BookOpen, Loader2, Check, Sparkles
} from "lucide-react";
import SingleSelectDropdown from "../../components/common/filters/SingleSelectDropdown";
import TablePagination from "../../components/common/tables/TablePagination";
import ImportProgressModal from "../../components/common/ui/ImportProgressModal";
import AppModal from "../../components/common/ui/AppModal";
import BatchDetailStat from "../../components/modules/wfm/imports/WfmBatchDetailStat";
import {
  uploadFrontStepsFile,
  getFrontStepsHistory,
  getFrontStepsRows,
  getFrontStepsIssues,
  getFrontStepsUnmatchedRecords,
  getFrontStepsSummary,
  deleteFrontStepsBatch,
  getFrontStepsPolicies,
  uploadFrontStepsPolicy,
  approveFrontStepsPolicy,
  deleteFrontStepsPolicy,
  getFrontStepsPolicyBlob,
} from "../../lib/axios/frontsteps-imports";

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

/**
 * Format UTC datetime string (from MySQL database) into local Philippine time (12-hour format with AM/PM).
 * @param {string|Date} value - Raw timestamp or string from MySQL
 * @param {boolean} withSeparatorSpace - If true returns "MM/DD/YYYY · h:mm AM", else "MM/DD/YYYY-h:mmAM"
 */
function formatUtcTimestamp(value, withSeparatorSpace = false) {
  if (!value) return "—";
  const str = String(value).trim();
  let dateObj = null;

  const sqlMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (sqlMatch) {
    // MySQL timestamp is in UTC
    dateObj = new Date(Date.UTC(+sqlMatch[1], +sqlMatch[2] - 1, +sqlMatch[3], +sqlMatch[4], +sqlMatch[5], +(sqlMatch[6] || 0)));
  } else {
    const parsed = new Date(str.endsWith("Z") ? str : str + "Z");
    dateObj = isNaN(parsed.getTime()) ? new Date(str) : parsed;
  }

  if (!dateObj || isNaN(dateObj.getTime())) return str;

  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  const y = dateObj.getFullYear();
  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  if (withSeparatorSpace) {
    return `${m}/${d}/${y} · ${hours}:${minutes} ${ampm}`;
  }
  return `${m}/${d}/${y}-${hours}:${minutes}${ampm}`;
}

function Modal({ title, subtitle, onClose, children, footer, wide = false, size = "default", bodyClassName = "" }) {
  const sizeClasses = {
    default: "max-w-2xl max-h-[90vh]",
    wide: "max-w-4xl max-h-[90vh]",
    policy: "max-w-[1200px] w-[92vw] h-[85vh] max-h-[92vh]",
    policyViewer: "max-w-[1200px] w-[92vw] h-[88vh] max-h-[94vh]",
    xl: "max-w-[1280px] w-[94vw] h-[88vh] max-h-[94vh]",
    repository: "max-w-[1500px] w-[96vw] h-[91vh] max-h-[96vh]",
    full: "max-w-[1500px] w-[96vw] h-[92vh] max-h-[96vh]",
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
        <div className={`min-h-0 flex-1 overflow-y-auto sibs-scrollbar ${bodyClassName || "p-6 sm:p-7"}`}>{children}</div>
        {footer && <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-3.5">{footer}</footer>}
      </section>
    </div>
  );
}

function FrontStepsImportSummaryModal({ summary, onClose, onViewIssues, onViewUnmatched }) {
  if (!summary) return null;
  const batch = summary.batch || {};
  const issueCount = Number(batch.issueCount ?? batch.issue_count ?? 0);
  const unmatchedRecordCount = Number(batch.unmatchedRecords ?? batch.unmatched_record_count ?? batch.unmapped ?? 0);
  const hasWarnings = issueCount > 0 || unmatchedRecordCount > 0 || Number(batch.invalid || 0) > 0 || Number(batch.conflict || 0) > 0;

  return (
    <AppModal isOpen className="!max-w-none sm:!w-[920px]" textAlign="center">
      <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${hasWarnings ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}>
        {hasWarnings ? <AlertTriangle className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
      </div>
      <p className="mt-4 mb-0 text-lg font-bold text-[#042c51]">
        {hasWarnings ? "Import Completed with Warnings" : "Import Successful"}
      </p>
      <p className="mt-2 mb-0 text-sm text-slate-500">
        <span className="font-semibold text-[#042c51]">{summary.fileName}</span> was processed successfully.
      </p>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-left">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[#042c51]">
          <span className="font-mono text-blue-700">Batch: {batch.batchCode || batch.id}</span>
          <Badge kind={hasWarnings ? "warn" : "success"}>{batch.status || "COMPLETED"}</Badge>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          <BatchDetailStat label="Total Rows" value={batch.total} icon={FileSpreadsheet} tone="blue" />
          <BatchDetailStat label="Valid Rows" value={batch.valid} icon={CheckCircle2} tone="emerald" />
          <BatchDetailStat label="New Rows" value={batch.inserted} icon={UploadCloud} tone="cyan" />
          <BatchDetailStat label="Updated" value={batch.updated} icon={RotateCcw} tone="sky" />
          <BatchDetailStat label="Duplicates" value={batch.duplicate} icon={ListPlus} tone="orange" />
          <BatchDetailStat label="Unmatched Records" value={unmatchedRecordCount} icon={UserX} tone="amber" />
          <BatchDetailStat label="Issues" value={issueCount} icon={AlertCircle} tone="rose" />
        </div>
        {(Number(batch.invalid || 0) > 0 || Number(batch.conflict || 0) > 0) && (
          <p className="mt-3 mb-0 text-xs text-slate-500">
            {Number(batch.invalid || 0).toLocaleString()} invalid · {Number(batch.conflict || 0).toLocaleString()} conflicts · {Number(batch.unmapped || 0).toLocaleString()} rows affected by employee mapping
          </p>
        )}
      </div>

      <div className="mt-5 flex justify-end gap-2">
        {unmatchedRecordCount > 0 && (
          <button type="button" className={btnSecondary} onClick={onViewUnmatched}>
            <UserX size={14} /> Unmatched Records ({unmatchedRecordCount.toLocaleString()})
          </button>
        )}
        {issueCount > 0 && (
          <button type="button" className={btnSecondary} onClick={onViewIssues}>
            <AlertTriangle size={14} /> View Issues ({issueCount.toLocaleString()})
          </button>
        )}
        <button type="button" className={btnPrimary} onClick={onClose}>Done</button>
      </div>
    </AppModal>
  );
}

function PolicyDocViewerModal({ policy, onClose }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!policy?.id) return;
    let url = null;
    let active = true;
    setLoading(true);
    setError("");

    getFrontStepsPolicyBlob(policy.id)
      .then((blob) => {
        if (!active) return;
        const mime = blob.type || (policy.file_extension?.toLowerCase() === "pdf" ? "application/pdf" : "application/octet-stream");
        const typedBlob = new Blob([blob], { type: mime });
        url = URL.createObjectURL(typedBlob);
        setBlobUrl(url);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.response?.data?.message || err.message || "Failed to load document content.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [policy?.id]);

  if (!policy) return null;

  const title = policy.file_name || policy.policy_title || "Policy Document";
  const ext = (policy.file_extension || policy.file_name?.split(".").pop() || "").toLowerCase();
  const isPdf = ext === "pdf";

  return (
    <Modal
      title={title}
      subtitle={`Policy Code: ${policy.document_code || "—"} · Revision: Rev ${policy.revision_number || "000"} · Status: ${policy.approval_status || "Active"}`}
      onClose={onClose}
      size="policyViewer"
      bodyClassName="p-0 flex flex-col h-full bg-slate-100"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            {policy.file_size ? `${(Number(policy.file_size) / 1024).toFixed(1)} KB` : ""} {ext ? `· ${ext.toUpperCase()}` : ""}
          </div>
          <div className="flex items-center gap-2">
            {blobUrl && (
              <a
                href={blobUrl}
                download={policy.file_name || `${policy.document_code || "policy"}.${ext || "pdf"}`}
                className={btnSecondary}
              >
                <Download size={14} /> Download Copy
              </a>
            )}
            <button type="button" className={btnPrimary} onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-1 min-h-0 w-full flex-col items-center justify-center relative h-full">
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
            <Loader2 size={32} className="animate-spin text-purple-700" />
            <span className="text-xs font-bold text-slate-600">Loading document viewer...</span>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
            <AlertTriangle className="h-10 w-10 text-rose-500 mb-2" />
            <p className="text-sm font-bold text-slate-800">Unable to display document</p>
            <p className="mt-1 text-xs text-rose-600">{error}</p>
          </div>
        )}

        {!loading && !error && blobUrl && (
          isPdf ? (
            <iframe
              src={blobUrl}
              title={title}
              className="w-full h-full border-none flex-1 min-h-[500px]"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center max-w-md">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 mb-4 shadow-xs">
                <FileText size={32} />
              </div>
              <h4 className="text-base font-extrabold text-[#042c51]">{policy.file_name}</h4>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                Word document ({ext.toUpperCase()}) cannot be rendered directly inside the browser viewport, but can be downloaded for full fidelity editing or viewing.
              </p>
              <a
                href={blobUrl}
                download={policy.file_name || `${policy.document_code || "policy"}.${ext}`}
                className={`${btnPrimary} mt-5`}
              >
                <Download size={15} /> Download Document
              </a>
            </div>
          )
        )}
      </div>
    </Modal>
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

function RepositoryStatCard({ label, value, caption, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "border-blue-100 bg-blue-50/60 text-blue-700",
    emerald: "border-emerald-100 bg-emerald-50/60 text-emerald-700",
    amber: "border-amber-100 bg-amber-50/60 text-amber-700",
    rose: "border-rose-100 bg-rose-50/60 text-rose-700",
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone] || tones.blue}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] opacity-70">{label}</p>
          <p className="mt-1 text-2xl font-extrabold leading-none">{Number(value || 0).toLocaleString()}</p>
          <p className="mt-2 text-[11px] font-medium opacity-75">{caption}</p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/80 shadow-xs">
          <Icon size={17} />
        </div>
      </div>
    </div>
  );
}

function parseJsonish(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === "object") return value;
  try { return JSON.parse(value); } catch { return fallback; }
}

function sourceRecordIdentity(row) {
  const raw = parseJsonish(row?.row_json, {});
  if (raw?.["Case Number"]) return `Case #${raw["Case Number"]}`;
  if (raw?.["Voice Call ID"]) return `Voice Call ${raw["Voice Call ID"]}`;
  return row?.data_grain === "CASE_DETAIL" ? "Case record" : row?.data_grain === "CALL_DETAIL" ? "Call record" : "Source record";
}


// FrontSteps raw upload formats, validated again on the server.
const ACCEPTED_UPLOAD_EXTENSIONS = ["csv", "xlsx", "xls"];
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

function UnifiedUploadCard({
  selectedCategory,
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
  const Icon = isCases ? FileSpreadsheet : PhoneCall;

  const currentTitle = isCases ? "Cases Report" : "Calls Report";
  const currentDescription = isCases
    ? "Upload the Cases Closed source report for FrontSteps case productivity and reporting."
    : "Upload the Inbound Calls source report for FrontSteps call activity and reporting.";
  const currentCount = uploadedCounts[selectedCategory] || 0;
  const totalCount = (uploadedCounts.cases || 0) + (uploadedCounts.calls || 0);

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
    <article className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-shadow hover:shadow-md h-full">
      {/* 1. Header Bar: Title & Category Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5 sm:px-6 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${isCases ? "bg-blue-50 text-blue-700" : "bg-cyan-50 text-cyan-700"}`}>
            <Icon size={20} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-[#042c51]">
              {isCases ? "Cases Report Upload" : "Calls Report Upload"}
            </h3>
          </div>
        </div>

        {/* View Datas Button */}
        <button
          type="button"
          onClick={() => onViewFolder(selectedCategory, currentTitle)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-[#042c51] shadow-2xs transition-all cursor-pointer self-start sm:self-auto shrink-0"
          title={`View repository for ${currentTitle}`}
        >
          <FolderOpen size={14} className="text-[#042c51]" />
          <span>View Folder</span>
          <span className="ml-1 inline-flex h-4 min-w-[18px] items-center justify-center rounded-full bg-[#ff5c28] px-1 text-[10px] font-extrabold text-white">
            {currentCount}
          </span>
        </button>
      </div>

      {/* 2. Sub-Bar: Segmented Report Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 sm:px-6 bg-slate-50/40 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Target Source:</span>
          <div className="inline-flex rounded-xl bg-slate-200/80 p-1 text-xs font-bold shadow-inner">
            <button
              type="button"
              onClick={() => onCategoryChange("cases")}
              disabled={uploading}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 transition-all cursor-pointer ${
                isCases
                  ? "bg-[#042c51] text-white shadow-sm font-extrabold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <FileSpreadsheet size={14} className={isCases ? "text-[#ff5c28]" : "text-slate-500"} />
              <span>Cases Report</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold ${isCases ? "bg-white/20 text-white" : "bg-slate-300/80 text-slate-600"}`}>
                {uploadedCounts.cases || 0}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onCategoryChange("calls")}
              disabled={uploading}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 transition-all cursor-pointer ${
                !isCases
                  ? "bg-[#042c51] text-white shadow-sm font-extrabold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <PhoneCall size={14} className={!isCases ? "text-[#ff5c28]" : "text-slate-500"} />
              <span>Calls Report</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold ${!isCases ? "bg-white/20 text-white" : "bg-slate-300/80 text-slate-600"}`}>
                {uploadedCounts.calls || 0}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Body */}
      <div className="flex flex-1 min-h-0 flex-col p-5 sm:p-6 gap-4">
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
          className={`group flex min-h-[220px] flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center outline-none transition-all focus-visible:ring-2 focus-visible:ring-blue-500 ${
            dragging
              ? "border-[#ff5c28] bg-orange-50/50"
              : "border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:bg-blue-50/30"
          }`}
        >
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-white text-[#042c51] shadow-xs group-hover:scale-105 group-hover:border-blue-200 transition-transform">
            <UploadCloud size={28} strokeWidth={1.8} className="text-[#042c51]" />
          </div>
          <p className="text-sm sm:text-base font-extrabold text-[#042c51]">
            Drag and drop your <span className="text-[#ff5c28]">{currentTitle}</span> here
          </p>
          <p className="mt-1 text-xs text-slate-500">
            or click browse to select a spreadsheet from your device
          </p>
          <span className="mt-3.5 inline-flex items-center gap-2 rounded-xl bg-[#042c51] px-4 py-2 text-xs font-bold text-white shadow-xs group-hover:bg-[#063d70] transition-colors">
            <FolderOpen size={14} /> Browse Files
          </span>
          <p className="mt-2.5 text-[11px] text-slate-400">
            Formats: CSV, XLSX, XLS · Max file size: 25 MB
          </p>
        </div>

        {/* File Staging / Selection & Last 3 Uploads Section */}
        <div className="flex flex-col gap-3 shrink-0">
          {/* Active Staged File (Selected file not yet uploaded) */}
          {file ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-3 shadow-2xs">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-blue-200 text-blue-700 shadow-2xs">
                  <FileSpreadsheet size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-xs font-bold text-slate-800" title={file.name}>{file.name}</p>
                    <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[9px] font-bold text-blue-800 uppercase">
                      Ready to Upload
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB · Staged for {currentTitle}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={openPicker}
                  className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition cursor-pointer"
                  title="Choose a different file"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(selectedCategory)}
                  aria-label={`Remove ${currentTitle} file`}
                  title="Remove selected file"
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => onUpload(selectedCategory)}
                  disabled={uploading}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#ff5c28] hover:bg-[#ed4a1b] px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Upload size={14} />
                  <span>{uploading ? `Ingesting ${uploadProgress}%...` : `Upload ${isCases ? "Cases" : "Calls"}`}</span>
                </button>
              </div>
            </div>
          ) : null}

          {/* Recent Uploads History (Fixed 3 slots) */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#042c51]">
                <Clock3 size={13} className="text-[#ff5c28]" />
                <span>Recent Uploads:</span>
              </div>
              <button
                type="button"
                onClick={() => onViewFolder(selectedCategory, currentTitle)}
                className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({currentCount})</span>
              </button>
            </div>

            {(() => {
              const displayItems = historyItems.slice(0, 3);
              const emptySlotsCount = Math.max(0, 3 - displayItems.length);
              return (
                <div className="space-y-1.5">
                  {displayItems.map((item) => {
                    const formattedTime = formatUtcTimestamp(item.timestamp);

                    return (
                      <div
                        key={item.id}
                        className="flex h-[38px] items-center justify-between gap-2 rounded-lg bg-slate-50/80 hover:bg-slate-100/70 px-3 py-1.5 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileSpreadsheet size={14} className="shrink-0 text-blue-600" />
                          <span className="font-mono text-[11px] font-bold text-slate-700 shrink-0">
                            {formattedTime}
                          </span>
                          <span className="text-slate-300">-</span>
                          <span className="truncate font-semibold text-slate-800 text-xs" title={item.name}>
                            {item.name}
                          </span>
                        </div>
                        <Badge kind={item.status === "COMPLETED" ? "success" : item.status === "COMPLETED_WITH_ERRORS" ? "warn" : "danger"}>
                          {item.status === "COMPLETED" ? "Uploaded" : item.status}
                        </Badge>
                      </div>
                    );
                  })}
                  {Array.from({ length: emptySlotsCount }).map((_, index) => (
                    <div
                      key={`empty-slot-${index}`}
                      className="flex h-[38px] items-center justify-between gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/40 px-3 py-1.5 text-xs text-slate-400 select-none"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileSpreadsheet size={14} className="shrink-0 text-slate-300" />
                        <span className="font-mono text-[11px] text-slate-400 shrink-0">--/--/---- --:--</span>
                        <span className="text-slate-300">-</span>
                        <span className="truncate italic text-slate-400 text-xs">
                          {displayItems.length === 0 && index === 0
                            ? `No uploaded files yet for ${currentTitle}`
                            : `Slot ${displayItems.length + index + 1} empty`}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 px-2 py-0.5 rounded bg-slate-100">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </article>
  );
}

// Fixed 3 FrontSteps Policy Definitions matching the database frontsteps_policies_repository
const FRONTSTEPS_POLICIES_CONFIG = [
  {
    code: "PMP",
    title: "Performance Management Policy",
    category: "Operations",
    color: "from-blue-600 to-indigo-700",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    badgeLabel: "Core Standard",
    description: "Employee operational benchmarks, audit SLAs, and procedural evaluation rules.",
  },
  {
    code: "PIP",
    title: "Performance Incentive Program",
    category: "Incentives",
    color: "from-emerald-600 to-teal-700",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badgeLabel: "Incentives",
    description: "Monthly score targets, case resolution bonuses, and inbound call quality tier criteria.",
  },
  {
    code: "MILESTONE",
    title: "Quarterly Retention and Consistency Incentive Policy",
    category: "Tenure & Retention",
    color: "from-purple-600 to-violet-700",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    badgeLabel: "Milestone",
    description: "Quarterly retention metrics, consistency multipliers, and tenure rewards structure.",
  },
];

function FrontStepsPolicyUploadCard({
  policies = [],
  loading = false,
  selectedCode: controlledCode,
  onSelectCode,
  onUploadPolicy,
  onApprovePolicy,
  onDeletePolicy,
  onViewPolicy,
  onViewFolder,
  uploadingCode = null,
  uploadProgress = 0,
}) {
  const [stagedFile, setStagedFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf") {
      alert("Unsupported file format. Please select a PDF file (.pdf).");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert("File is too large. Maximum file size is 50 MB.");
      return;
    }

    // Determine document code and title dynamically or match known policy configs
    const upperName = file.name.toUpperCase();
    let matchedCfg = FRONTSTEPS_POLICIES_CONFIG.find((c) =>
      upperName.includes(c.code) || upperName.includes(c.title.toUpperCase())
    );
    if (!matchedCfg) {
      const baseNameNoExt = file.name.replace(/\.[^/.]+$/, "");
      matchedCfg = {
        code: "POLICY",
        title: baseNameNoExt,
        category: "Operations Policy",
      };
    }

    setStagedFile(file);
    try {
      await onUploadPolicy(matchedCfg.code, file, matchedCfg);
    } finally {
      setStagedFile(null);
    }
  };

  return (
    <article className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-shadow hover:shadow-md h-full">
      {/* 1. Header Bar: Policy Documents Repository */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5 sm:px-6 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
            <Shield size={20} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-[#042c51]">
              Policy Documents Repository
            </h3>
          </div>
        </div>

        {/* View Repository Button */}
        <button
          type="button"
          onClick={() => onViewFolder && onViewFolder("policies", "Policy Documents Repository")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-[#042c51] shadow-2xs transition-all cursor-pointer self-start sm:self-auto shrink-0"
          title="View all policies and revisions"
        >
          <FolderOpen size={14} className="text-[#042c51]" />
          <span>View Folder</span>
          <span className={`ml-1 inline-flex h-4 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-extrabold text-white transition-colors ${policies.length > 0 ? "bg-emerald-600" : "bg-slate-400"}`}>
            {policies.length}
          </span>
        </button>
      </div>

      {/* 2. Sub-Bar: Clean empty spacer matching Target Source height to align dropzone boxes exactly */}
      <div className="border-b border-slate-100 bg-slate-50/40 shrink-0 h-[53px]" aria-hidden="true" />

      {/* 3. Main Body */}
      <div className="flex flex-1 min-h-0 flex-col p-5 sm:p-6 gap-4">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,application/pdf"
          aria-label="Choose policy document file"
          onChange={(event) => {
            handleFileSelect(event.target.files?.[0]);
            event.target.value = "";
          }}
        />

        {/* Drop zone */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={(event) => { event.preventDefault(); setDragging(false); }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            handleFileSelect(event.dataTransfer.files?.[0]);
          }}
          className={`group flex min-h-[220px] flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center outline-none transition-all focus-visible:ring-2 focus-visible:ring-purple-500 ${
            dragging
              ? "border-[#ff5c28] bg-orange-50/50"
              : "border-slate-200 bg-slate-50/50 hover:border-purple-300 hover:bg-purple-50/20"
          }`}
        >
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-100 bg-white text-purple-700 shadow-xs group-hover:scale-105 group-hover:border-purple-200 transition-transform">
            <UploadCloud size={28} strokeWidth={1.8} className="text-purple-700" />
          </div>
          <p className="text-sm sm:text-base font-extrabold text-[#042c51]">
            Drag and drop your <span className="text-[#ff5c28]">Policy Document</span> here
          </p>
          <p className="mt-1 text-xs text-slate-500 max-w-md">
            or click browse to select a policy file from your device
          </p>
          <span className="mt-3.5 inline-flex items-center gap-2 rounded-xl bg-[#042c51] px-4 py-2 text-xs font-bold text-white shadow-xs group-hover:bg-[#063d70] transition-colors">
            <FolderOpen size={14} /> Browse Files
          </span>
          <p className="mt-2.5 text-[11px] text-slate-400">
            Formats: PDF · Max file size: 50 MB
          </p>
        </div>


        {/* File Staging / Selection & Last 3 Uploads Section */}
        <div className="flex flex-col gap-3 shrink-0">
          {/* Staged File Banner */}
          {stagedFile && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-purple-200 bg-purple-50/70 p-3 shadow-2xs">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-purple-200 text-purple-700 shadow-2xs">
                  <FileText size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-xs font-bold text-slate-800" title={stagedFile.name}>
                      {stagedFile.name}
                    </p>
                    <span className="rounded bg-purple-100 px-1.5 py-0.2 text-[9px] font-bold text-purple-800 uppercase">
                      Uploading...
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {(stagedFile.size / 1024).toFixed(1)} KB · Staging and saving policy document
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Uploads History (Fixed 3 slots) */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#042c51]">
                <Clock3 size={13} className="text-[#ff5c28]" />
                <span>Recent Uploads:</span>
              </div>
              <button
                type="button"
                onClick={() => onViewFolder && onViewFolder("policies", "Policy Documents Repository")}
                className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({policies.length})</span>
              </button>
            </div>

            {(() => {
              const displayPolicies = policies.slice(0, 3);
              const emptySlotsCount = Math.max(0, 3 - displayPolicies.length);

              return (
                <div className="space-y-1.5">
                  {displayPolicies.map((doc) => {
                    const formattedTime = formatUtcTimestamp(doc.created_at);

                    const isApproved = (doc.approval_status || "").toLowerCase() === "approved";

                    return (
                      <div
                        key={doc.id}
                        className="flex h-[38px] items-center justify-between gap-3 rounded-lg bg-slate-50/80 hover:bg-slate-100/70 border border-slate-100 px-3 py-1.5 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText size={14} className="shrink-0 text-purple-700" />
                          <span className="font-mono text-[11px] font-bold text-slate-700 shrink-0">
                            {formattedTime}
                          </span>
                          <span className="text-slate-300">-</span>
                          <span className="truncate font-semibold text-slate-800 text-xs" title={doc.file_name || doc.policy_title}>
                            {doc.file_name || doc.policy_title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {onApprovePolicy && (
                            <button
                              type="button"
                              onClick={() => onApprovePolicy(doc.id, doc.policy_title || doc.file_name, doc.approval_status)}
                              className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer border ${
                                isApproved
                                  ? "border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800"
                                  : "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                              }`}
                              title={isApproved ? "Click to unapprove policy" : "Click to approve policy"}
                            >
                              {isApproved ? <RotateCcw size={11} /> : <Check size={11} strokeWidth={2.5} />}
                              <span>{isApproved ? "Unapprove" : "Approve"}</span>
                            </button>
                          )}

                          {onViewPolicy && (
                            <button
                              type="button"
                              onClick={() => onViewPolicy(doc)}
                              className="inline-flex items-center gap-1 rounded border border-blue-200 bg-white hover:bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 transition-colors cursor-pointer"
                              title="View document inside modal"
                            >
                              <Eye size={12} />
                              <span>View</span>
                            </button>
                          )}

                          {onDeletePolicy && (
                            <button
                              type="button"
                              onClick={() => onDeletePolicy(doc.id, doc.policy_title || doc.file_name)}
                              className="inline-flex items-center gap-1 rounded border border-rose-200 bg-white hover:bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 transition-colors cursor-pointer"
                              title="Delete policy document"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {Array.from({ length: emptySlotsCount }).map((_, index) => (
                    <div
                      key={`empty-policy-slot-${index}`}
                      className="flex h-[38px] items-center justify-between gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/40 px-3 py-1.5 text-xs text-slate-400 select-none"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={14} className="shrink-0 text-slate-300" />
                        <span className="font-mono text-[11px] text-slate-400 shrink-0">--/--/---- --:--</span>
                        <span className="text-slate-300">-</span>
                        <span className="truncate italic text-slate-400 text-xs">
                          {displayPolicies.length === 0 && index === 0
                            ? "No policy documents uploaded yet"
                            : `Slot ${displayPolicies.length + index + 1} empty`}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 px-2 py-0.5 rounded bg-slate-100">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function FrontStepsDataManagement() {
  const [records, setRecords] = useState(INITIAL_RECORDS);
  const [selectedUploadCategory, setSelectedUploadCategory] = useState("cases"); // "cases" | "calls"
  const [uploadFiles, setUploadFiles] = useState({ cases: null, calls: null });
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importStage, setImportStage] = useState("uploading");
  const [importProgressDetail, setImportProgressDetail] = useState({message:"",processedRows:null,totalRows:null});
  const [uploadedHistory, setUploadedHistory] = useState({cases:[],calls:[]});
  const [importSummary,setImportSummary] = useState({sourceRows:0,storedRecords:0,unmappedRows:0,issueRows:0});
  const [historyLoading, setHistoryLoading] = useState(false);
  const [batchPreview,setBatchPreview] = useState(null);
  const [previewKind,setPreviewKind] = useState('raw');
  const [previewRows,setPreviewRows] = useState([]);
  const [previewPage,setPreviewPage] = useState(1);
  const [previewTotal,setPreviewTotal] = useState(0);
  const [previewLoading,setPreviewLoading] = useState(false);
  const [previewError,setPreviewError] = useState('');
  const [deleteTarget,setDeleteTarget] = useState(null);
  const [deletingBatchId,setDeletingBatchId] = useState(null);
  const [uploadSummary,setUploadSummary] = useState(null);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const [historyResult,summaryResult]=await Promise.all([
        getFrontStepsHistory({page:1,limit:100}),
        getFrontStepsSummary(),
      ]);
      const {items=[]}=historyResult;
      setImportSummary(summaryResult.summary||{sourceRows:0,storedRecords:0,unmappedRows:0,issueRows:0});
      const grouped={cases:[],calls:[]};
      for (const item of items) {
        const cat=item.report_type==='CASES'?'cases':'calls';
        grouped[cat].push({
          id:item.id,name:item.source_filename,timestamp:item.created_at,
          size:`${(Number(item.file_size||0)/1024).toFixed(1)} KB`,
          status:item.status,inserted:item.inserted_rows||0,updated:item.updated_rows||0,
          duplicates:item.duplicate_rows||0,invalid:item.invalid_rows||0,
          conflicts:item.conflict_rows||0,unmapped:item.unmapped_rows||0,
          issueCount:Number(item.issue_count ?? 0),
          unmatchedRecordCount:Number(item.unmatched_record_count ?? item.unmapped_rows ?? 0),
          total:item.total_rows||0,
        });
      }
      setUploadedHistory(grouped);
    } catch (error) {setUploadError(error?.response?.data?.message || 'Unable to load FrontSteps upload history.');}
    finally {setHistoryLoading(false);}
  };
  useEffect(()=>{loadHistory();},[]);

  const openBatchPreview = async (item, kind='raw')=>{
    setFolderModal(null);
    setBatchPreview(item);
    setPreviewKind(kind);
    setPreviewPage(1);
  };
  useEffect(()=>{
    if (!batchPreview) return;
    let cancelled=false;
    setPreviewLoading(true);setPreviewError('');
    const request=previewKind==='raw' ? getFrontStepsRows : previewKind==='unmatched' ? getFrontStepsUnmatchedRecords : getFrontStepsIssues;
    request(batchPreview.id,{page:previewPage,limit:25}).then(data=>{
      if (!cancelled) {
        setPreviewRows(data.items||[]);
        setPreviewTotal(data.total ?? (previewKind==='raw' ? batchPreview.total || 0 : 0));
      }
    }).catch(error=>{
      if (!cancelled) setPreviewError(error?.response?.data?.message||'Unable to load records.');
    }).finally(()=>{if(!cancelled)setPreviewLoading(false);});
    return ()=>{cancelled=true;};
  },[batchPreview,previewKind,previewPage]);

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

  // Actual authenticated multipart upload to dedicated FrontSteps database tables.
  const handleUpload = async (category) => {
    const file=uploadFiles[category];
    if (!file || uploading) return;
    setUploading(category);
    setUploadProgress(0);
    setImportStage("uploading");
    setImportProgressDetail({message:"Uploading file to the FrontSteps ingestion service.",processedRows:null,totalRows:null});
    setUploadError('');
    try {
      const result=await uploadFrontStepsFile(
        category,
        file,
        (percent)=>{
          setImportStage("uploading");
          setUploadProgress(Math.round(percent*0.2));
          setImportProgressDetail({message:"Uploading file to the FrontSteps ingestion service.",processedRows:null,totalRows:null});
        },
        (progress)=>{
          if (!progress) return;
          setImportStage(progress.stage||"processing");
          setUploadProgress(progress.percent??0);
          setImportProgressDetail({
            message:progress.message||"",
            processedRows:progress.processedRows??null,
            totalRows:progress.totalRows??null,
          });
        },
      );
      setImportStage("complete");
      setUploadProgress(100);
      const b=result.batch;
      setImportProgressDetail({message:"Import completed successfully.",processedRows:b.total,totalRows:b.total});
      setUploadFiles(previous=>({...previous,[category]:null}));
      await loadHistory();
      setUploadSummary({ fileName:file.name, category, batch:b });
      await new Promise(resolve=>setTimeout(resolve,250));
    } catch (error) {
      setUploadError(error?.response?.data?.message||error.message||'FrontSteps upload failed.');
    } finally {
      setUploading(null);
      setUploadProgress(0);
      setImportStage("uploading");
      setImportProgressDetail({message:"",processedRows:null,totalRows:null});
    }
  };

  const handleDeleteBatch = async () => {
    if (!deleteTarget || deletingBatchId) return;
    setDeletingBatchId(deleteTarget.id);
    setUploadError('');
    try {
      const response=await deleteFrontStepsBatch(deleteTarget.id);
      if (batchPreview?.id===deleteTarget.id) setBatchPreview(null);
      setDeleteTarget(null);
      await loadHistory();
      setToast(response?.message||'FrontSteps import batch deleted.');
    } catch (error) {
      setUploadError(error?.response?.data?.message||error.message||'Unable to delete FrontSteps import batch.');
    } finally {
      setDeletingBatchId(null);
    }
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
  const [toast, setToast] = useState("");
  const pageSize = 10;

  // Automatically dismiss toast notification after 2 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast("");
    }, 2000);
    return () => clearTimeout(timer);
  }, [toast]);

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
  // Import counters must come from MySQL, never in-memory sample records.
  // These are structural source/import metrics, NOT WFM-certified KPI values.
  const stats = {
    total: importSummary.sourceRows || 0,
    stored: importSummary.storedRecords || 0,
    unmapped: importSummary.unmappedRows || 0,
    issues: importSummary.issueRows || 0,
  };

  const folderItems = folderModal ? (uploadedHistory[folderModal.category] || []) : [];
  const folderStats = folderItems.reduce((acc, item) => {
    acc.sourceRows += Number(item.total || 0);
    acc.unmatchedRecords += Number(item.unmatchedRecordCount ?? item.unmapped ?? 0);
    acc.issues += Number(item.issueCount || 0);
    if (item.status === "COMPLETED") acc.completed += 1;
    if (item.status === "COMPLETED_WITH_ERRORS") acc.withWarnings += 1;
    return acc;
  }, { sourceRows: 0, unmatchedRecords: 0, issues: 0, completed: 0, withWarnings: 0 });

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

  // --- Policy Repository State & Logic ---
  const [activeTab, setActiveTab] = useState("sources"); // "sources" | "policies"
  const [policies, setPolicies] = useState([]);
  const [viewingPolicy, setViewingPolicy] = useState(null);
  const [selectedPolicyCode, setSelectedPolicyCode] = useState("PMP");
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(false);
  const [uploadingPolicyCode, setUploadingPolicyCode] = useState(null);
  const [policyUploadProgress, setPolicyUploadProgress] = useState(0);
  const [policyCategoryFilter, setPolicyCategoryFilter] = useState("all");
  const [policySearch, setPolicySearch] = useState("");
  const [isUploadPolicyModalOpen, setIsUploadPolicyModalOpen] = useState(false);
  const [isSubmittingPolicy, setIsSubmittingPolicy] = useState(false);
  const [policyFormError, setPolicyFormError] = useState("");
  const [policyFile, setPolicyFile] = useState(null);
  const [policyFormData, setPolicyFormData] = useState({
    document_code: "",
    policy_title: "",
    policy_category: "PMP",
    revision_number: "000",
    last_review_date: "",
    effectivity_date: "",
    effectivity_note: "Upon Approval",
    approval_status: "Pending Approval",
    prepared_for: "FrontSteps",
    prepared_by: "",
    reviewed_by: "",
    approved_by: "",
    remarks: "",
  });

  const fetchPolicies = async () => {
    try {
      setIsLoadingPolicies(true);
      const res = await getFrontStepsPolicies();
      if (res && res.success) {
        setPolicies(res.data || []);
      }
    } catch (err) {
      console.error("Error loading policies:", err);
    } finally {
      setIsLoadingPolicies(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleDownloadPolicy = (policyId, fileName) => {
    window.open(`http://localhost:5003/api/frontsteps/policies/${policyId}/download`, "_blank");
  };

  const handlePolicyFormChange = (e) => {
    const { name, value } = e.target;
    setPolicyFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePolicyFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const ext = selected.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "doc"].includes(ext)) {
      setPolicyFormError("Unsupported file type. Only PDF and DOCX files are allowed for policies.");
      return;
    }
    setPolicyFormError("");
    setPolicyFile(selected);
  };

  const handleUploadPolicySubmit = async (e) => {
    e.preventDefault();
    if (!policyFile) {
      setPolicyFormError("Please select a policy file (PDF or DOCX).");
      return;
    }
    if (!policyFormData.document_code.trim() || !policyFormData.policy_title.trim()) {
      setPolicyFormError("Document Code and Policy Title are required.");
      return;
    }

    try {
      setIsSubmittingPolicy(true);
      setPolicyFormError("");

      const data = new FormData();
      data.append("file", policyFile);
      Object.entries(policyFormData).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          data.append(key, val);
        }
      });

      const res = await fetch("http://localhost:5003/api/frontsteps/policies/upload", {
        method: "POST",
        body: data,
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to upload policy document.");
      }

      setToast(`Policy "${policyFormData.document_code}" uploaded successfully to database.`);
      setIsUploadPolicyModalOpen(false);
      setPolicyFile(null);
      setPolicyFormData({
        document_code: "",
        policy_title: "",
        policy_category: "PMP",
        revision_number: "000",
        last_review_date: "",
        effectivity_date: "",
        effectivity_note: "Upon Approval",
        approval_status: "Pending Approval",
        prepared_for: "FrontSteps",
        prepared_by: "",
        reviewed_by: "",
        approved_by: "",
        remarks: "",
      });
      fetchPolicies();
    } catch (err) {
      setPolicyFormError(err.message);
    } finally {
      setIsSubmittingPolicy(false);
    }
  };

  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const matchesCategory = policyCategoryFilter === "all" || p.policy_category === policyCategoryFilter;
      const term = policySearch.trim().toLowerCase();
      const matchesSearch = !term || [p.document_code, p.policy_title, p.file_name, p.prepared_by, p.reviewed_by].some(
        (field) => String(field || "").toLowerCase().includes(term)
      );
      return matchesCategory && matchesSearch;
    });
  }, [policies, policyCategoryFilter, policySearch]);

  const setPresetPolicy = (presetCode) => {
    if (presetCode === "PMP") {
      setPolicyFormData({
        document_code: "FS - PMP - 001",
        policy_title: "FrontSteps Resident Support Agent - Performance Management Policy",
        policy_category: "PMP",
        revision_number: "000",
        last_review_date: "2026-08-06",
        effectivity_date: "",
        effectivity_note: "Upon Approval",
        approval_status: "Pending Approval",
        prepared_for: "FrontSteps",
        prepared_by: "Operations & Quality Leadership",
        reviewed_by: "HR & Account Management",
        approved_by: "",
        remarks: "Official Performance Management Policy for FrontSteps Resident Support Agents",
      });
    } else if (presetCode === "PIP") {
      setPolicyFormData({
        document_code: "FS - PIP - 001",
        policy_title: "FrontSteps Resident Support - Performance Incentive Program",
        policy_category: "PIP",
        revision_number: "000",
        last_review_date: "2026-08-06",
        effectivity_date: "",
        effectivity_note: "Upon Approval",
        approval_status: "Pending Approval",
        prepared_for: "FrontSteps",
        prepared_by: "Operations Leadership",
        reviewed_by: "Account Management",
        approved_by: "",
        remarks: "Performance Incentive Program criteria and tier structure",
      });
    } else if (presetCode === "MILESTONE") {
      setPolicyFormData({
        document_code: "FS - MILESTONE - 001",
        policy_title: "FrontSteps Quarterly Retention and Consistency Incentive Policy",
        policy_category: "Milestone",
        revision_number: "002",
        last_review_date: "2026-08-06",
        effectivity_date: "",
        effectivity_note: "Upon Approval",
        approval_status: "Pending Approval",
        prepared_for: "FrontSteps",
        prepared_by: "WFM & Operations Leadership",
        reviewed_by: "Management Committee",
        approved_by: "",
        remarks: "Quarterly retention bonus guidelines and 3-month consistency requirement",
      });
    }
  };

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

      {/* 2. Source File Uploads */}
      <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-2 sibs-scrollbar">
        {uploadError && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
            <span className="flex items-center gap-2"><AlertTriangle size={15} />{uploadError}</span>
            <button type="button" onClick={() => setUploadError("")} aria-label="Dismiss upload error"><X size={15} /></button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 flex-1 min-h-0">
          {/* Left Column: 4 Metric Cards + Operational Data Feeds (Unified Cases & Calls Upload) */}
          <div className="flex flex-col flex-1 min-h-0 h-full gap-4">
            {/* 4 Operational Metric Cards (Total Records, Stored Records, Unmatched, Import Issues) */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 shrink-0">
              {/* Card 1 — Total Data Records */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white px-3 py-2 shadow-2xs">
                <div className="min-w-0">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Total Records
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-base font-extrabold text-slate-800">
                      {stats.total}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">Sources</span>
                  </div>
                  <span className="block text-[9px] text-slate-400 mt-0.5 truncate">
                    Uploaded Rows
                  </span>
                </div>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-[#042c51] border border-slate-100">
                  <Database size={13} />
                </div>
              </div>

              {/* Card 2 — Stored Unique Records */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white px-3 py-2 shadow-2xs">
                <div className="min-w-0">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Stored Records
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-base font-extrabold text-emerald-600">
                      {stats.stored}
                    </span>
                    <span className="text-[10px] font-medium text-emerald-600/80">Stored</span>
                  </div>
                  <span className="block text-[9px] text-emerald-600/80 mt-0.5 truncate">
                    In PMS tables
                  </span>
                </div>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <CheckCircle2 size={13} />
                </div>
              </div>

              {/* Card 3 — Unmatched Records */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white px-3 py-2 shadow-2xs">
                <div className="min-w-0">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Unmatched
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-base font-extrabold text-amber-600">
                      {stats.unmapped}
                    </span>
                    <span className="text-[10px] font-medium text-amber-600/80">Unmapped</span>
                  </div>
                  <span className="block text-[9px] text-amber-600/80 mt-0.5 truncate">
                    Awaiting Alias
                  </span>
                </div>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                  <Clock3 size={13} />
                </div>
              </div>

              {/* Card 4 — Import Issues */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white px-3 py-2 shadow-2xs">
                <div className="min-w-0">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Import Issues
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-base font-extrabold text-rose-600">
                      {stats.issues}
                    </span>
                    <span className="text-[10px] font-medium text-rose-600/80">Issues</span>
                  </div>
                  <span className="block text-[9px] text-rose-600/80 mt-0.5 truncate">
                    Validation checks
                  </span>
                </div>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                  <AlertTriangle size={13} />
                </div>
              </div>
            </div>

            {/* Cases & Calls Upload Card */}
            <UnifiedUploadCard
              selectedCategory={selectedUploadCategory}
              onCategoryChange={(cat) => setSelectedUploadCategory(cat)}
              file={uploadFiles[selectedUploadCategory]}
              onSelect={selectUpload}
              onRemove={removeUpload}
              onUpload={handleUpload}
              onViewFolder={openViewFolder}
              uploadedCounts={{
                cases: uploadedHistory.cases?.length || 0,
                calls: uploadedHistory.calls?.length || 0,
              }}
              historyItems={uploadedHistory[selectedUploadCategory] || []}
              uploading={uploading === selectedUploadCategory}
              uploadProgress={uploadProgress}
            />
          </div>

          {/* Right Column: Policy Metric Cards + Policy Documents Repository */}
          <div className="flex flex-col flex-1 min-h-0 h-full gap-4">
            {/* Policy Metric Indicator Cards: Total Uploaded Files & Approved Files */}
            <div className="grid grid-cols-2 gap-2.5 shrink-0">
              {/* Card 1 — All Files Uploaded */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white px-3 py-2 shadow-2xs">
                <div className="min-w-0">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Uploaded Policies
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-base font-extrabold text-[#042c51]">
                      {policies.length}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">Files</span>
                  </div>
                  <span className="block text-[9px] text-slate-400 mt-0.5 truncate">
                    Total in repository
                  </span>
                </div>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
                  <Shield size={13} />
                </div>
              </div>

              {/* Card 2 — Approved Files */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white px-3 py-2 shadow-2xs">
                <div className="min-w-0">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Approved Policies
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-base font-extrabold text-emerald-600">
                      {policies.filter((p) => (p.approval_status || "").toLowerCase() === "approved").length}
                    </span>
                    <span className="text-[10px] font-medium text-emerald-600/80">Approved</span>
                  </div>
                  <span className="block text-[9px] text-emerald-600/80 mt-0.5 truncate">
                    Active & governing
                  </span>
                </div>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <CheckCircle2 size={13} />
                </div>
              </div>
            </div>

            <FrontStepsPolicyUploadCard
              policies={policies}
              loading={isLoadingPolicies}
              selectedCode={selectedPolicyCode}
              onSelectCode={setSelectedPolicyCode}
              onUploadPolicy={async (code, file, cfg) => {
                try {
                  setUploadingPolicyCode(code);
                  setPolicyUploadProgress(0);

                  // Calculate next revision number if policy already exists
                  const docCode = `FS-${code}-001`;
                  const existingRevs = policies
                    .filter((p) => p.document_code === docCode || p.document_code?.includes(code))
                    .map((p) => parseInt(p.revision_number, 10))
                    .filter((n) => !isNaN(n));
                  const nextRev = existingRevs.length > 0 ? Math.max(...existingRevs) + 1 : 0;
                  const revisionString = String(nextRev).padStart(3, "0");

                  const formData = new FormData();
                  formData.append("file", file);
                  formData.append("document_code", docCode);
                  formData.append("policy_title", cfg.title);
                  formData.append("policy_category", cfg.category);
                  formData.append("revision_number", revisionString);
                  formData.append("effectivity_note", "Upon Approval");
                  formData.append("approval_status", "Active");
                  formData.append("prepared_for", "FrontSteps");
                  formData.append("remarks", `Official ${cfg.title} repository document (Rev ${revisionString})`);
                  formData.append("uploaded_by", "Operations Leadership");

                  await uploadFrontStepsPolicy(formData, (percent) => {
                    setPolicyUploadProgress(percent);
                  });

                  setToast(`Policy "${code} - ${cfg.title}" successfully uploaded and saved to repository (Rev ${revisionString}).`);
                  await fetchPolicies();
                } catch (err) {
                  setUploadError(err?.response?.data?.message || err.message || "Failed to upload policy document.");
                } finally {
                  setUploadingPolicyCode(null);
                  setPolicyUploadProgress(0);
                }
              }}
              onApprovePolicy={async (id, title, currentStatus) => {
                const isCurrentlyApproved = (currentStatus || "").toLowerCase() === "approved";
                const nextStatus = isCurrentlyApproved ? "Pending Approval" : "Approved";
                try {
                  await approveFrontStepsPolicy(id, { approval_status: nextStatus, approved_by: isCurrentlyApproved ? null : "Operations Leadership" });
                  setToast(`Policy "${title}" is now ${nextStatus}.`);
                  await fetchPolicies();
                } catch (err) {
                  setUploadError(err?.response?.data?.message || err.message || "Failed to update approval status.");
                }
              }}
              onDeletePolicy={async (id, title) => {
                if (!window.confirm(`Are you sure you want to delete policy "${title}"?`)) return;
                try {
                  await deleteFrontStepsPolicy(id);
                  setToast(`Policy "${title}" was deleted.`);
                  await fetchPolicies();
                } catch (err) {
                  setUploadError(err?.response?.data?.message || err.message || "Failed to delete policy.");
                }
              }}
              onViewPolicy={(pol) => setViewingPolicy(pol)}
              onViewFolder={(category, title) => openViewFolder(category, title)}
              uploadingCode={uploadingPolicyCode}
              uploadProgress={policyUploadProgress}
            />
          </div>
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

      {/* 5. View Datas / Repository Modal */}
      {folderModal && (
        <Modal
          size={folderModal.category === "policies" ? "policy" : "repository"}
          title={folderModal.category === "policies" ? "Policy Documents Repository" : `Uploaded Files: ${folderModal.title}`}
          subtitle={
            folderModal.category === "policies"
              ? "Official governing policy documents stored for FrontSteps operational tracking."
              : `FrontSteps repository for ${folderModal.category === "cases" ? "Cases Closed" : "Inbound Calls"} source datasets`
          }
          onClose={() => setFolderModal(null)}
          footer={
            <button type="button" className={btnPrimary} onClick={() => setFolderModal(null)}>
              Close
            </button>
          }
        >
          {folderModal.category === "policies" ? (
            <div className="flex flex-col gap-2.5">
              {policies.length > 0 ? (
                <div className="space-y-2">
                  {policies.map((pol) => {
                    const formattedTime = formatUtcTimestamp(pol.created_at, true);

                    const isApproved = (pol.approval_status || "").toLowerCase() === "approved";

                    return (
                      <div
                        key={pol.id}
                        className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-2xs hover:border-purple-200 hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-700 border border-purple-100/80 group-hover:bg-purple-100 transition-colors">
                            <FileText size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className="text-sm font-bold text-[#042c51] break-words"
                              title={pol.file_name || pol.policy_title}
                            >
                              {pol.file_name || pol.policy_title}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span className="font-mono text-slate-500">
                                {formattedTime}
                              </span>
                              {pol.file_size && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span>{(Number(pol.file_size) / 1024).toFixed(1)} KB</span>
                                </>
                              )}
                              <span className="text-slate-300">•</span>
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                                  isApproved
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {isApproved ? <Check size={11} strokeWidth={3} /> : <Clock3 size={11} />}
                                {isApproved ? "Approved" : "Pending Approval"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={async () => {
                              const nextStatus = isApproved ? "Pending Approval" : "Approved";
                              try {
                                await approveFrontStepsPolicy(pol.id, {
                                  approval_status: nextStatus,
                                  approved_by: isApproved ? null : "Operations Leadership",
                                });
                                setToast(`Policy "${pol.policy_title || pol.file_name}" is now marked as ${nextStatus}.`);
                                await fetchPolicies();
                              } catch (err) {
                                setUploadError("Failed to update approval status.");
                              }
                            }}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold cursor-pointer transition-colors shadow-2xs ${
                              isApproved
                                ? "border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800"
                                : "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                            }`}
                            title={isApproved ? "Click to revoke approval" : "Click to approve policy"}
                          >
                            {isApproved ? <RotateCcw size={12} /> : <Check size={12} strokeWidth={2.5} />}
                            <span>{isApproved ? "Unapprove" : "Approve"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setViewingPolicy(pol)}
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700 cursor-pointer transition-colors shadow-2xs"
                            title="View document inside modal"
                          >
                            <Eye size={12} />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              if (!window.confirm(`Are you sure you want to delete policy "${pol.policy_title || pol.file_name}"?`)) return;
                              try {
                                await deleteFrontStepsPolicy(pol.id);
                                setToast(`Policy "${pol.policy_title || pol.file_name}" deleted.`);
                                await fetchPolicies();
                              } catch (err) {
                                setUploadError("Failed to delete policy.");
                              }
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 cursor-pointer transition-colors shadow-2xs"
                            title="Delete policy"
                          >
                            <Trash2 size={12} /> <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 py-12 text-center">
                  <Shield className="mb-2.5 h-10 w-10 text-slate-300" />
                  <p className="text-sm font-bold text-slate-600">No policy documents in repository yet</p>
                  <p className="mt-1 text-xs text-slate-400">Use the policy upload dropzone on the main card to upload documents.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-7">
            <Section
              title="1. Repository Overview"
              description="High-level status of all uploaded batches for this FrontSteps source."
            >
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <RepositoryStatCard
                  label="Uploaded Files"
                  value={folderItems.length}
                  caption={`${folderStats.completed} completed · ${folderStats.withWarnings} with warnings`}
                  icon={FolderOpen}
                  tone="blue"
                />
                <RepositoryStatCard
                  label="Source Rows"
                  value={folderStats.sourceRows}
                  caption="Rows received across all batches"
                  icon={Database}
                  tone="emerald"
                />
                <RepositoryStatCard
                  label="Unmatched Records"
                  value={folderStats.unmatchedRecords}
                  caption="Source rows awaiting employee mapping"
                  icon={UserX}
                  tone="amber"
                />
                <RepositoryStatCard
                  label="Import Issues"
                  value={folderStats.issues}
                  caption="Validation, duplicate, or conflict findings"
                  icon={AlertTriangle}
                  tone="rose"
                />
              </div>
            </Section>

            <Section
              title="2. Uploaded Batches"
              description="Each upload remains traceable to its source rows, mapping findings, and batch-level status."
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-[#ff5c28]" />
                  <span className="text-xs font-bold text-slate-700">
                    {folderItems.length.toLocaleString()} batch{folderItems.length === 1 ? "" : "es"}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {historyLoading ? "Loading server history..." : "Sorted by most recent upload"}
                </span>
              </div>

              {folderItems.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                  <div className="overflow-x-auto sibs-scrollbar">
                    <table className="w-full min-w-[1180px] text-left text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="w-[34%] px-5 py-3.5">Source File</th>
                          <th className="w-[18%] px-5 py-3.5">Uploaded</th>
                          <th className="w-[27%] px-5 py-3.5">Batch Status & Records</th>
                          <th className="w-[21%] px-5 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {folderItems.map((item) => (
                          <tr key={item.id} className="align-top transition-colors hover:bg-slate-50/70">
                            <td className="px-5 py-4">
                              <div className="flex min-w-0 items-start gap-3">
                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                                  <FileSpreadsheet className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="break-words font-semibold leading-5 text-slate-800">{item.name}</p>
                                  <p className="mt-1 text-[10px] font-medium text-slate-400">Batch #{item.id} · {item.size}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 text-slate-600">
                                <Clock3 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                <span className="font-mono text-[11px]">{formatUtcTimestamp(item.timestamp, true)}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-col gap-2">
                                <div>
                                  <Badge kind={item.status === "COMPLETED" ? "success" : item.status === "COMPLETED_WITH_ERRORS" ? "warn" : "danger"}>{item.status}</Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-slate-500">
                                  <span><strong className="text-slate-700">{Number(item.inserted || 0).toLocaleString()}</strong> new</span>
                                  <span><strong className="text-slate-700">{Number(item.updated || 0).toLocaleString()}</strong> updated</span>
                                  <span><strong className="text-slate-700">{Number(item.duplicates || 0).toLocaleString()}</strong> duplicates</span>
                                  <span><strong className="text-amber-700">{Number(item.unmatchedRecordCount ?? item.unmapped ?? 0).toLocaleString()}</strong> unmatched</span>
                                </div>
                                {item.issueCount > 0 && <span className="text-[10px] font-semibold text-rose-600">{Number(item.issueCount).toLocaleString()} import issue{Number(item.issueCount) === 1 ? "" : "s"}</span>}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-wrap justify-end gap-2">
                                <button type="button" onClick={()=>openBatchPreview(item,'raw')} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold text-blue-700 transition hover:bg-blue-100"><Eye size={13}/>Rows</button>
                                <button type="button" onClick={()=>openBatchPreview(item,'issues')} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-bold text-amber-700 transition hover:bg-amber-100"><AlertTriangle size={13}/>Issues{item.issueCount > 0 ? ` (${item.issueCount})` : ''}</button>
                                <button type="button" onClick={()=>openBatchPreview(item,'unmatched')} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[11px] font-bold text-violet-700 transition hover:bg-violet-100"><UserX size={13}/>Unmatched{item.unmatchedRecordCount > 0 ? ` (${item.unmatchedRecordCount})` : ''}</button>
                                <button type="button" onClick={()=>setDeleteTarget(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-700 transition hover:bg-rose-100" title="Delete this import batch and all linked data"><Trash2 size={13}/>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 py-14 text-center">
                  <FolderOpen className="mb-3 h-11 w-11 text-slate-300" />
                  <p className="text-sm font-bold text-slate-600">No uploaded files in this repository yet</p>
                  <p className="mt-1 text-xs text-slate-400">Use the Upload button on the source card to create the first batch.</p>
                </div>
              )}
            </Section>
          </div>
        )}
      </Modal>
    )}
      <FrontStepsImportSummaryModal
        summary={uploadSummary}
        onClose={()=>setUploadSummary(null)}
        onViewIssues={()=>{
          if (!uploadSummary?.batch) return;
          const b=uploadSummary.batch;
          const item={
            id:b.id,
            name:uploadSummary.fileName,
            status:b.status,
            total:b.total||0,
            inserted:b.inserted||0,
            updated:b.updated||0,
            duplicates:b.duplicate||0,
            invalid:b.invalid||0,
            conflicts:b.conflict||0,
            unmapped:b.unmapped||0,
            issueCount:b.issueCount||0,
            unmatchedRecordCount:b.unmapped||b.unmatchedRecords||0,
          };
          setUploadSummary(null);
          openBatchPreview(item,'issues');
        }}
        onViewUnmatched={()=>{
          if (!uploadSummary?.batch) return;
          const b=uploadSummary.batch;
          const item={
            id:b.id,
            name:uploadSummary.fileName,
            status:b.status,
            total:b.total||0,
            inserted:b.inserted||0,
            updated:b.updated||0,
            duplicates:b.duplicate||0,
            invalid:b.invalid||0,
            conflicts:b.conflict||0,
            unmapped:b.unmapped||0,
            issueCount:b.issueCount||0,
            unmatchedRecordCount:b.unmapped||b.unmatchedRecords||0,
          };
          setUploadSummary(null);
          openBatchPreview(item,'unmatched');
        }}
      />

      <ImportProgressModal
        isOpen={Boolean(uploading)}
        fileName={uploading ? uploadFiles[uploading]?.name || "" : ""}
        cardTitle={uploading === "cases" ? "Cases Report" : uploading === "calls" ? "Calls Report" : "FrontSteps Import"}
        currentStage={importStage}
        progressPercent={uploadProgress}
        progressMessage={importProgressDetail.message}
        processedRows={importProgressDetail.processedRows}
        totalRows={importProgressDetail.totalRows}
      />

      {deleteTarget && (
        <Modal
          title="Delete Import Batch"
          subtitle={`Batch #${deleteTarget.id} · ${deleteTarget.name}`}
          onClose={()=>{if(!deletingBatchId)setDeleteTarget(null);}}
          footer={<>
            <button type="button" className={btnSecondary} disabled={Boolean(deletingBatchId)} onClick={()=>setDeleteTarget(null)}>Cancel</button>
            <button type="button" className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={Boolean(deletingBatchId)} onClick={handleDeleteBatch}><Trash2 size={14}/>{deletingBatchId ? "Deleting..." : "Delete Batch"}</button>
          </>}
        >
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
            <p className="font-bold">This permanently deletes the import batch and every FrontSteps row linked to it.</p>
            <p className="mt-1 text-xs leading-relaxed text-rose-700">Raw import rows, normalized Cases/Calls records sourced by this batch, and import issues are removed through database cascade relationships.</p>
          </div>
        </Modal>
      )}

      {batchPreview && (
        <Modal size="full" title={`Raw Source: ${batchPreview.name}`} subtitle={`FrontSteps batch #${batchPreview.id} · ${batchPreview.status} · ${Number(batchPreview.total || 0).toLocaleString()} source records`} onClose={()=>setBatchPreview(null)} footer={<button type="button" className={btnPrimary} onClick={()=>setBatchPreview(null)}>Close</button>}>
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <Detail label="Batch ID" value={`#${batchPreview.id}`} />
              <Detail label="Status" value={batchPreview.status} />
              <Detail label="Source Records" value={Number(batchPreview.total || 0).toLocaleString()} />
              <Detail label="Unmatched Records" value={Number(batchPreview.unmatchedRecordCount ?? batchPreview.unmapped ?? 0).toLocaleString()} />
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-2">
              <button type="button" className={previewKind==='raw'?btnPrimary:btnSecondary} onClick={()=>{setPreviewKind('raw');setPreviewPage(1);}}>Source Rows</button>
              <button type="button" className={previewKind==='issues'?btnPrimary:btnSecondary} onClick={()=>{setPreviewKind('issues');setPreviewPage(1);}}>Import Issues</button>
              <button type="button" className={previewKind==='unmatched'?btnPrimary:btnSecondary} onClick={()=>{setPreviewKind('unmatched');setPreviewPage(1);}}>Unmatched Records</button>
              <span className="ml-auto pr-2 text-xs font-semibold text-slate-500">{Number(previewTotal || 0).toLocaleString()} {previewKind==='raw'?'rows':previewKind==='unmatched'?'records':'issues'}</span>
            </div>
            {previewError && <p role="alert" className="text-xs text-rose-700">{previewError}</p>}
            {previewLoading ? <p className="text-xs text-slate-500">Loading rows...</p> :
              <div className="max-h-[55vh] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 sibs-scrollbar">
                {previewRows.length===0 ? <p className="text-xs text-slate-500">No records on this page.</p> :
                previewRows.map((r)=> {
                  if (previewKind==='unmatched') {
                    const raw = parseJsonish(r.row_json, {});
                    const mappings = parseJsonish(r.mappings, []);
                    const mappingRows = Array.isArray(mappings) ? mappings : [];
                    const recordIdentity = sourceRecordIdentity(r);
                    const contextEntries = r.data_grain === 'CASE_DETAIL'
                      ? [
                          ['Queue', raw?.Queue],
                          ['Status', raw?.Status],
                          ['Case Owner', raw?.['Case Owner']],
                          ['Last Modified By', raw?.['Case Last Modified By']],
                        ]
                      : [
                          ['Call Type', raw?.['Call Type']],
                          ['Queue', raw?.['Queue Name']],
                          ['Owner Name', raw?.['Owner Name: Full Name']],
                          ['Call Status', raw?.Status],
                        ];
                    return <div key={`${r.batch_id}-${r.excel_row_number}`} className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900">Source row {r.excel_row_number}</span>
                          <Badge kind="warn">{r.mapping_status}</Badge>
                          {r.data_grain && <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-600">{r.data_grain}</span>}
                        </div>
                        <span className="font-mono text-[11px] font-bold text-[#042c51]">{recordIdentity}</span>
                      </div>

                      <div className="grid gap-4 p-4 lg:grid-cols-[1.15fr_0.85fr]">
                        <div>
                          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Unmatched employee field{mappingRows.length === 1 ? '' : 's'}</p>
                          <div className="space-y-2">
                            {mappingRows.map((mapping, index) => (
                              <div key={`${r.id}-${index}`} className="rounded-lg border border-violet-100 bg-violet-50/60 px-3 py-2.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[10px] font-bold uppercase tracking-wide text-violet-500">{mapping?.field || 'Employee field'}</span>
                                  <Badge kind="warn">{mapping?.status || r.mapping_status}</Badge>
                                </div>
                                <p className="mt-1 text-sm font-bold text-slate-900">{mapping?.name || 'Unknown name'}</p>
                                {mapping?.message && <p className="mt-1 text-[11px] leading-relaxed text-amber-700">{mapping.message}</p>}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Source record context</p>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                            {contextEntries.map(([label, value]) => (
                              <Detail key={label} label={label} value={value || '—'} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>;
                  }
                  const status = r.validation_status || r.severity;
                  const badgeKind = r.severity==='ERROR' || r.validation_status==='INVALID' ? 'danger' : r.validation_status==='PROCESSED' || r.validation_status==='VALID' ? 'success' : 'warn';
                  return <div key={r.id} className="mb-2 rounded-lg border border-slate-200 bg-white p-3 text-xs">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-800">Source row {r.excel_row_number}</span>
                      <Badge kind={badgeKind}>{status}</Badge>
                      {r.data_grain && <span className="font-mono text-slate-500">{r.data_grain}</span>}
                      {r.error_code && <span className="text-rose-600">{r.error_code}</span>}
                    </div>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2">
                      {Object.entries(r.row_json||{}).map(([key,val])=><div key={key} className="min-w-0"><span className="font-semibold text-slate-500">{key}: </span><span className="break-words text-slate-800">{String(val??'').slice(0,1000)}</span></div>)}
                      {previewKind==='issues' && r.column_name && <div className="min-w-0"><span className="font-semibold text-slate-500">Field: </span><span className="break-words text-slate-800">{r.column_name}</span></div>}
                      {previewKind==='issues' && r.raw_value != null && <div className="min-w-0"><span className="font-semibold text-slate-500">Source Value: </span><span className="break-words font-semibold text-slate-800">{String(r.raw_value).slice(0,1000)}</span></div>}
                      {r.message && <p className={`md:col-span-2 ${r.severity==='WARNING' ? 'text-amber-700' : 'text-rose-700'}`}>{r.message}</p>}
                    </div>
                  </div>;
                })}
              </div>}
            <div className="flex items-center justify-between">
              <button type="button" disabled={previewPage<=1 || previewLoading} className={btnSecondary} onClick={()=>setPreviewPage(x=>Math.max(1,x-1))}>Previous</button>
              <span className="text-xs text-slate-500">Page {previewPage} of {Math.max(1,Math.ceil(previewTotal/25))}</span>
              <button type="button" disabled={previewPage*25>=previewTotal || previewLoading} className={btnSecondary} onClick={()=>setPreviewPage(x=>x+1)}>Next</button>
            </div>
          </div>
        </Modal>
      )}

      {/* 6. Policy Document Viewer Modal */}
      {viewingPolicy && (
        <PolicyDocViewerModal
          policy={viewingPolicy}
          onClose={() => setViewingPolicy(null)}
        />
      )}
    </div>
  );
}
