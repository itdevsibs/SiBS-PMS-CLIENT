import { useEffect, useState } from "react";
import {
  Check,
  ClipboardCheck,
  Download,
  FileText,
  Layers,
  Loader2,
  Mail,
  PhoneCall,
  Users,
  X,
} from "lucide-react";

const REPORT_OPTIONS = [
  {
    id: "calls",
    label: "Calls",
    description: "Call volume, handled calls, SLA %, and answer speed",
    icon: PhoneCall,
  },
  {
    id: "emails",
    label: "Emails",
    description: "Email cases, response rates, and service levels",
    icon: Mail,
  },
  {
    id: "qa",
    label: "QA",
    description: "Audit volume, QA scores, and evaluation trends",
    icon: ClipboardCheck,
  },
  {
    id: "occupancy",
    label: "Occupancy",
    description: "Occupancy and headcount performance metrics",
    icon: Users,
  },
];

const ALL_REPORT_IDS = REPORT_OPTIONS.map((opt) => opt.id);

export default function DownloadPdfModal({
  isOpen,
  onClose,
  onDownload,
  isDownloading = false,
  activeSection = "",
}) {
  const [selectedIds, setSelectedIds] = useState([]);

  // Reset or preset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      if (activeSection && ALL_REPORT_IDS.includes(activeSection)) {
        setSelectedIds([activeSection]);
      } else {
        setSelectedIds([...ALL_REPORT_IDS]);
      }
    }
  }, [isOpen, activeSection]);

  if (!isOpen) return null;

  const isAllSelected =
    ALL_REPORT_IDS.length > 0 &&
    ALL_REPORT_IDS.every((id) => selectedIds.includes(id));

  const handleToggleAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds([...ALL_REPORT_IDS]);
    }
  };

  const handleToggleSingle = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const handleConfirm = () => {
    if (!selectedIds.length || isDownloading) return;
    onDownload(selectedIds);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4 transition-all"
      onClick={!isDownloading ? onClose : undefined}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200/80 overflow-hidden font-jakarta animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 bg-[#f8fafc] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-sibs-primary-1 border border-blue-100/60 shadow-xs">
              <Download size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-sibs-primary-1">
                Download as PDF
              </h2>
              <p className="text-[11px] text-slate-500">
                Choose which performance reports to include in the PDF export.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDownloading}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-colors disabled:pointer-events-none"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Checklist */}
        <div className="p-4 space-y-2">
          {/* All Reports Option */}
          <div
            onClick={!isDownloading ? handleToggleAll : undefined}
            className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all ${
              isAllSelected
                ? "border-sibs-primary-1/30 bg-blue-50/50 shadow-xs"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                  isAllSelected
                    ? "bg-sibs-primary-1 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <Layers size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-sibs-primary-1">
                  All Reports
                </p>
                <p className="text-[10.5px] text-slate-500">
                  Select all available performance graphs
                </p>
              </div>
            </div>

            <div
              className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                isAllSelected
                  ? "border-sibs-primary-1 bg-sibs-primary-1 text-white"
                  : "border-slate-300 bg-white"
              }`}
            >
              {isAllSelected && <Check size={13} strokeWidth={3} />}
            </div>
          </div>

          {/* Divider */}
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider text-slate-400">
              <span className="bg-white px-2">Individual Sections</span>
            </div>
          </div>

          {/* Individual Report Options */}
          <div className="space-y-1.5">
            {REPORT_OPTIONS.map((option) => {
              const isChecked = selectedIds.includes(option.id);
              const Icon = option.icon;

              return (
                <div
                  key={option.id}
                  onClick={!isDownloading ? () => handleToggleSingle(option.id) : undefined}
                  className={`flex items-center justify-between rounded-xl border p-2.5 cursor-pointer transition-all ${
                    isChecked
                      ? "border-sibs-primary-1/30 bg-blue-50/40 shadow-xs"
                      : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isChecked
                          ? "bg-sibs-primary-1 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-sibs-primary-1 truncate">
                        {option.label}
                      </p>
                      <p className="text-[10.5px] text-slate-500 truncate">
                        {option.description}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                      isChecked
                        ? "border-sibs-primary-1 bg-sibs-primary-1 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isChecked && <Check size={13} strokeWidth={3} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-[#f8fafc] px-5 py-3">
          <span className="text-[11px] font-medium text-slate-500">
            {selectedIds.length === 0
              ? "No reports selected"
              : `${selectedIds.length} of ${ALL_REPORT_IDS.length} selected`}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDownloading}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:pointer-events-none"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedIds.length === 0 || isDownloading}
              className="inline-flex cursor-pointer select-none items-center gap-1.5 rounded-xl bg-sibs-primary-1 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-sibs-primary-1/90 transition-colors disabled:pointer-events-none disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <Loader2 size={13} className="animate-spin text-white" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download size={13} className="text-white" />
                  <span>Download as PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
