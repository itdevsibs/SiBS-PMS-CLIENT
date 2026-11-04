import React, { useRef, useState } from "react";
import { FolderOpen, Eye, Trash2, ChevronRight } from "lucide-react";

/**
 * Format timestamp into "Oct 27, 2026 · 2:45 PM"
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

export default function PolicyDocumentsRepositoryPanel({
  policies = [],
  loading = false,
  onUploadPolicy,
  onApprovePolicy,
  onDeletePolicy,
  onViewPolicy,
  onViewFolder,
  uploadingCode = null,
  uploadProgress = 0,
}) {
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

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

    const baseNameNoExt = file.name.replace(/\.[^/.]+$/, "");
    const matchedCfg = {
      code: "POLICY",
      title: baseNameNoExt,
      category: "Operations Policy",
    };

    await onUploadPolicy(matchedCfg.code, file, matchedCfg);
  };

  const openPicker = () => fileInputRef.current?.click();

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    handleFileSelect(event.dataTransfer.files?.[0]);
  };

  return (
    <article className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#DCE4EE] bg-white shadow-2xs h-full">
      {/* 1. Dark Navy Panel Header */}
      <div className="flex items-center justify-between bg-[#082B60] px-5 py-3.5 shrink-0 text-white rounded-t-xl h-[52px]">
        <h3 className="text-[15px] font-extrabold tracking-wide text-white">
          Policy Documents Repository
        </h3>
        <button
          type="button"
          onClick={() => onViewFolder && onViewFolder("policies", "Policy Documents Repository")}
          className="inline-flex items-center gap-1.5 rounded-md bg-white hover:bg-slate-100 px-3 py-1 text-xs font-bold text-[#082B60] transition-colors cursor-pointer shadow-2xs"
          title="View all policies in repository"
        >
          <FolderOpen size={13} className="text-[#082B60]" />
          <span>View Folder</span>
          <span className="ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#082B60] px-1 text-[10px] font-extrabold text-white">
            {policies.length}
          </span>
        </button>
      </div>

      <div className="flex flex-1 min-h-0 flex-col p-5 gap-5">
        {/* 2. Top Alignment Spacer matching Target Source height (approx 34px) */}
        <div className="h-[34px] flex items-center">
          {/* Subtle placeholder line or clean blank matching left side height */}
        </div>

        {/* 3. Upload Area (Dashed border, centered, identical dimensions to left panel) */}
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
            Drag and drop your <span className="text-[#12376B]">Policy Document</span> here
          </p>
          <p className="mt-1 text-xs text-[#526582]">
            or click browse to select a policy file from your device
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
            Formats: PDF <span className="mx-1 text-[#DCE4EE]">|</span> Max file size: 50 MB
          </p>
        </div>

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
              onClick={() => onViewFolder && onViewFolder("policies", "Policy Documents Repository")}
              className="text-[12px] font-bold text-[#12376B] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
            >
              <span>View All ({policies.length})</span>
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Clean table with 4 columns: Uploaded At, File Name, Status, Actions */}
          <div className="overflow-hidden rounded-xl border border-[#DCE4EE]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F0F3F7] text-[11px] font-extrabold text-[#14233F] border-b border-[#DCE4EE]">
                  <th className="py-2.5 px-3 w-[24%]">Uploaded At</th>
                  <th className="py-2.5 px-3 w-[32%]">File Name</th>
                  <th className="py-2.5 px-3 w-[16%] text-center">Status</th>
                  <th className="py-2.5 px-3 w-[28%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE4EE] bg-white text-[12px]">
                {(() => {
                  const displayPolicies = policies.slice(0, 5);
                  const emptySlotsCount = Math.max(0, 5 - displayPolicies.length);

                  return (
                    <>
                      {displayPolicies.map((doc) => {
                        const formattedTime = formatDesignTimestamp(doc.created_at);
                        const isApproved = (doc.approval_status || "").toLowerCase() === "approved";

                        return (
                          <tr key={doc.id} className="hover:bg-[#F4F6F9]/50 transition-colors h-[40px]">
                            <td className="py-2 px-3 whitespace-nowrap text-[#14233F] font-medium">
                              {formattedTime}
                            </td>
                            <td className="py-2 px-3 text-[#14233F] font-semibold truncate max-w-[170px]" title={doc.file_name || doc.policy_title}>
                              {doc.file_name || doc.policy_title}
                            </td>
                            <td className="py-2 px-3 text-center whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                                  isApproved
                                    ? "bg-emerald-50 text-[#15803D] border-emerald-200"
                                    : "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]"
                                }`}
                              >
                                {isApproved ? "Approved" : "Pending"}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5 justify-end">
                                {onApprovePolicy && (
                                  <button
                                    type="button"
                                    onClick={() => onApprovePolicy(doc.id, doc.policy_title || doc.file_name, doc.approval_status)}
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                                      isApproved
                                        ? "bg-amber-50 text-[#B45309] border-amber-200 hover:bg-amber-100"
                                        : "bg-emerald-50 text-[#15803D] border-emerald-200 hover:bg-emerald-100"
                                    }`}
                                    title={isApproved ? "Click to unapprove policy" : "Click to approve policy"}
                                  >
                                    <span>{isApproved ? "Unapprove" : "Approve"}</span>
                                  </button>
                                )}
                                {onViewPolicy && (
                                  <button
                                    type="button"
                                    onClick={() => onViewPolicy(doc)}
                                    className="inline-flex items-center gap-1 rounded border border-[#DCE4EE] bg-white hover:bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-[#14233F] transition-colors cursor-pointer"
                                    title="View document inside modal"
                                  >
                                    <Eye size={12} className="text-[#12376B]" />
                                    <span>View</span>
                                  </button>
                                )}
                                {onDeletePolicy && (
                                  <button
                                    type="button"
                                    onClick={() => onDeletePolicy(doc.id, doc.policy_title || doc.file_name)}
                                    className="inline-flex items-center gap-1 rounded border border-rose-200 bg-white hover:bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-[#B91C1C] transition-colors cursor-pointer"
                                    title="Delete policy document"
                                  >
                                    <Trash2 size={12} className="text-[#B91C1C]" />
                                    <span>Delete</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {Array.from({ length: emptySlotsCount }).map((_, index) => (
                        <tr key={`slot-${index}`} className="h-[40px] text-[#526582]">
                          <td className="py-2 px-3 font-mono text-[#526582]">--</td>
                          <td className="py-2 px-3 italic text-[#526582]">
                            {`Slot ${displayPolicies.length + index + 1} empty`}
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-[#526582]">
                            --
                          </td>
                          <td className="py-2 px-3 text-right text-slate-300 font-mono">—</td>
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

