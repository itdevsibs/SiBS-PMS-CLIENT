import React, { useMemo, useRef, useState } from "react";
import {
  PhoneCall,
  MessageSquare,
  Users,
  Clock,
  BarChart3,
  Mail,
  ShieldCheck,
  ChevronRight,
  Upload,
  FolderOpen,
  PieChart,
  FileText,
} from "lucide-react";

/**
 * Standard report categories configuration.
 */
const REPORT_LEVELS_CONFIG = [
  {
    id: "agent-activity-productive-breaks",
    label: "AGENT ACTIVITY - PRODUCTIVE BREAKS",
    displayName: "Agent Activity – Productive Breaks",
    icon: Clock,
    fallbackSourcesSummary: "HeroDash",
    supportedExtensions: "CSV, XLSX",
    maxSize: "25 MB",
  },
  {
    id: "agent-occupancy",
    label: "AGENT OCCUPANCY",
    displayName: "Agent Occupancy",
    icon: Users,
    fallbackSourcesSummary: "FuseCom · FuseNet · HeroDash",
    supportedExtensions: "CSV, XLSX",
    maxSize: "25 MB",
  },
  {
    id: "agent-performance-by-skill",
    label: "AGENT PERFORMANCE BY SKILL",
    displayName: "Agent Performance by Skill",
    icon: BarChart3,
    fallbackSourcesSummary: "HeroDash",
    supportedExtensions: "CSV, XLSX",
    maxSize: "25 MB",
  },
  {
    id: "call-report-eod",
    label: "CALL REPORT (EOD)",
    displayName: "Call Report (EOD)",
    icon: PhoneCall,
    fallbackSourcesSummary: "FuseCom · FuseNet · HeroDash",
    supportedExtensions: "CSV, XLSX",
    maxSize: "25 MB",
  },
  {
    id: "chat-report-eod",
    label: "CHAT REPORT (EOD)",
    displayName: "Chat Report (EOD)",
    icon: MessageSquare,
    fallbackSourcesSummary: "FuseCom · FuseNet · HeroDash",
    supportedExtensions: "CSV, XLSX",
    maxSize: "25 MB",
  },
  {
    id: "documented-calls",
    label: "DOCUMENTED CALLS",
    displayName: "Documented Calls",
    icon: FileText,
    fallbackSourcesSummary: "MS Dynamics",
    supportedExtensions: "XLSX",
    maxSize: "25 MB",
  },
  {
    id: "email-level",
    label: "EMAIL LEVEL",
    displayName: "Email Level",
    icon: Mail,
    fallbackSourcesSummary: "Email",
    supportedExtensions: "CSV, XLSX",
    maxSize: "25 MB",
  },
  {
    id: "quality-audit",
    label: "QUALITY AUDIT",
    displayName: "Quality Audit",
    icon: ShieldCheck,
    fallbackSourcesSummary: "Quality Audit",
    supportedExtensions: "CSV, XLSX",
    maxSize: "25 MB",
  },
  {
    id: "skill-statistics",
    label: "SKILL STATISTICS",
    displayName: "Skill Statistics",
    icon: PieChart,
    fallbackSourcesSummary: "FuseCom · FuseNet · HeroDash",
    supportedExtensions: "CSV, XLSX",
    maxSize: "25 MB",
  },
];

/**
 * Format timestamp into "Oct 27, 2026 · 9:42 PM" matching approved design
 */
function formatTableTimestamp(upload) {
  if (!upload) return "—";
  const raw = upload.uploadedAt || upload.createdAt || "";
  if (!raw && upload.uploadedAtMs) {
    const d = new Date(upload.uploadedAtMs);
    if (!isNaN(d.getTime())) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const m = monthNames[d.getMonth()];
      const day = d.getDate();
      const y = d.getFullYear();
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      return `${m} ${day}, ${y} · ${hours}:${minutes} ${ampm}`;
    }
  }

  const str = String(raw).trim();
  const sqlMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (sqlMatch) {
    const d = new Date(Date.UTC(+sqlMatch[1], +sqlMatch[2] - 1, +sqlMatch[3], +sqlMatch[4], +sqlMatch[5], +(sqlMatch[6] || 0)));
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const m = monthNames[d.getMonth()];
    const day = d.getDate();
    const y = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${m} ${day}, ${y} · ${hours}:${minutes} ${ampm}`;
  }

  return str || "—";
}

function StatusBadge({ upload, onOpenErrors }) {
  const isFailed =
    upload?.batchStatus === "FAILED" || upload?.status === "FAILED";
  const isCompletedWithErrors =
    (upload?.invalidRows || 0) > 0 ||
    (upload?.warningRows || 0) > 0 ||
    (upload?.duplicateRows || 0) > 0 ||
    upload?.batchStatus === "COMPLETED_WITH_ERRORS" ||
    upload?.displayStatus === "COMPLETED_WITH_ERRORS" ||
    upload?.displayStatus === "COMPLETED_WITH_WARNINGS";

  if (isFailed) {
    return (
      <span className="inline-flex items-center rounded-full bg-[#FEF2F2] px-2.5 py-0.5 text-xs font-semibold text-[#DC2626] border border-[#FCA5A5]/60">
        Failed
      </span>
    );
  }

  if (isCompletedWithErrors) {
    return (
      <button
        type="button"
        onClick={() => onOpenErrors?.(upload?.batchId || upload?.id)}
        className="inline-flex items-center rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-xs font-semibold text-[#B45309] border border-[#FCD34D]/70 hover:bg-[#FDE68A] transition-colors cursor-pointer"
        title="Click to view issues/errors"
      >
        Completed with Errors
      </button>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-xs font-semibold text-[#15803D] border border-[#86EFAC]/70">
      Completed
    </span>
  );
}

export default function WfmImportTwoColumnWorkspace({
  groupedCards = [],
  uploadsByCard = {},
  allUploadsList = [],
  isUploading = false,
  onFileSelect,
  onOpenCard,
  onOpenErrorDetails,
}) {
  const [selectedLevelId, setSelectedLevelId] = useState("call-report-eod");
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Available levels dynamically derived from groupedCards plus the standard definitions
  const availableLevels = useMemo(() => {
    const levels = [];
    REPORT_LEVELS_CONFIG.forEach((def) => {
      const match = groupedCards.find((g) => g.label === def.label);
      if (match && match.cards && match.cards.length > 0) {
        const sourceNames = Array.from(
          new Set(match.cards.map((c) => c.sourceLabel || c.title)),
        ).join(" · ");
        levels.push({
          ...def,
          sourcesSummary: sourceNames || def.fallbackSourcesSummary,
          group: match,
        });
      }
    });

    if (levels.length === 0) {
      return REPORT_LEVELS_CONFIG.map((def) => ({
        ...def,
        sourcesSummary: def.fallbackSourcesSummary,
        group: groupedCards.find((g) => g.label === def.label) || null,
      }));
    }

    return levels;
  }, [groupedCards]);

  // Active Level definition
  const activeLevel = useMemo(() => {
    const found = availableLevels.find((lvl) => lvl.id === selectedLevelId);
    return found || availableLevels[0] || REPORT_LEVELS_CONFIG[0];
  }, [availableLevels, selectedLevelId]);

  // Cards for active level
  const availableCards = useMemo(() => {
    if (activeLevel.group?.cards?.length) {
      return activeLevel.group.cards;
    }
    const group = groupedCards.find((g) => g.label === activeLevel.label);
    return group?.cards || [];
  }, [activeLevel, groupedCards]);

  // Active Card selected among availableCards
  const activeCard = useMemo(() => {
    if (!availableCards.length) return null;
    if (selectedSourceId) {
      const match = availableCards.find(
        (c) =>
          c.id === selectedSourceId ||
          c.sourceLabel?.toLowerCase() === selectedSourceId.toLowerCase() ||
          c.title?.toLowerCase() === selectedSourceId.toLowerCase(),
      );
      if (match) return match;
    }
    return availableCards[0];
  }, [availableCards, selectedSourceId]);

  // When switching level, set selectedSourceId to first card of that level
  const handleLevelSelect = (levelId) => {
    setSelectedLevelId(levelId);
    const targetLevel = availableLevels.find((l) => l.id === levelId);
    const firstCard = targetLevel?.group?.cards?.[0] || groupedCards.find((g) => g.label === targetLevel?.label)?.cards?.[0];
    setSelectedSourceId(firstCard?.id || "");
  };

  const handleSourceSelect = (card) => {
    setSelectedSourceId(card.id);
  };

  // Recent imports for this specific active card (up to 5 items)
  const recentImports = useMemo(() => {
    if (!activeCard) return [];
    const directUploads = uploadsByCard[activeCard.id] || [];
    if (directUploads.length > 0) {
      return directUploads.slice(0, 5);
    }
    const filtered = allUploadsList.filter((u) => {
      if (u.cardId === activeCard.id) return true;
      if (
        u.groupLabel === activeCard.groupLabel &&
        u.sourceSystem?.toLowerCase() === activeCard.sourceLabel?.toLowerCase()
      ) {
        return true;
      }
      return false;
    });
    return filtered.slice(0, 5);
  }, [activeCard, uploadsByCard, allUploadsList]);

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (!activeCard) return;
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      onFileSelect(activeCard, { target: { files: [file], value: "" } });
    }
  };

  const handleFileInputChange = (e) => {
    if (!activeCard) return;
    onFileSelect(activeCard, e);
  };

  const triggerBrowseFiles = () => {
    fileInputRef.current?.click();
  };

  // Task Orders for activeCard
  const taskOrders = useMemo(() => {
    if (!activeCard || !activeCard.taskOrders || !activeCard.taskOrders.length) {
      return [];
    }
    return activeCard.taskOrders;
  }, [activeCard]);

  // Dynamic upload label
  const dragDropLabel = useMemo(() => {
    if (!activeCard) return "Drag and drop your file here";
    const src = activeCard.sourceLabel || activeCard.title || "";
    return `Drag and drop your ${src} file here`;
  }, [activeCard]);

  // Prepare exactly 5 slots for Recent Imports table
  const slotsData = useMemo(() => {
    const slots = [];
    const totalSlots = 5;
    for (let i = 0; i < totalSlots; i++) {
      if (i < recentImports.length) {
        slots.push({ isEmpty: false, data: recentImports[i], slotIndex: i + 1 });
      } else {
        slots.push({ isEmpty: true, data: null, slotIndex: i + 1 });
      }
    }
    return slots;
  }, [recentImports]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(270px,0.29fr)_minmax(0,1fr)] gap-4 items-stretch shrink-0 lg:flex-1 lg:min-h-0">
      {/* ================= LEFT PANEL: REPORT LEVELS ================= */}
      <section className="bg-white rounded-2xl border border-[#D7E1EE] p-3.5 sm:p-4 shadow-2xs flex flex-col h-[280px] sm:h-[340px] lg:h-full min-h-0 overflow-hidden shrink-0">
        <div className="mb-3 shrink-0">
          <h2 className="text-[16px] font-black text-[#102448] tracking-tight leading-none m-0">
            Report Levels
          </h2>
          <p className="text-[11.5px] text-[#587094] font-medium mt-1 leading-none m-0">
            Select a level to import data
          </p>
        </div>

        {/* Scrollable list for report levels */}
        <nav
          className="sibs-scrollbar flex flex-col gap-1.5 flex-1 overflow-y-auto pr-1"
          aria-label="Report Levels Navigation"
        >
          {availableLevels.map((level) => {
            const isSelected = level.id === selectedLevelId;
            const Icon = level.icon;

            return (
              <button
                key={level.id}
                type="button"
                onClick={() => handleLevelSelect(level.id)}
                className={`w-full flex items-center justify-between text-left px-3.5 py-3 rounded-xl transition-colors duration-150 cursor-pointer shrink-0 border ${
                  isSelected
                    ? "bg-[#062A5C] text-white shadow-sm border-[#062A5C]"
                    : "bg-white text-[#102448] hover:bg-[#F3F6FA] border-transparent"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`flex items-center justify-center shrink-0 w-7 h-7 rounded-lg ${
                      isSelected
                        ? "text-white"
                        : "text-[#102448]"
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-[13px] font-bold leading-tight truncate m-0 ${
                        isSelected ? "text-white" : "text-[#102448]"
                      }`}
                    >
                      {level.displayName}
                    </p>
                    <p
                      className={`text-[10.5px] leading-tight mt-0.5 truncate m-0 font-medium ${
                        isSelected ? "text-white/70" : "text-[#587094]"
                      }`}
                    >
                      Source: {level.sourcesSummary}
                    </p>
                  </div>
                </div>

                <div className="w-4 h-4 shrink-0 ml-1.5 flex items-center justify-center">
                  {isSelected ? (
                    <ChevronRight className="w-4 h-4 text-white" strokeWidth={2.5} />
                  ) : null}
                </div>
              </button>
            );
          })}
        </nav>
      </section>

      {/* ================= RIGHT PANEL: DYNAMIC IMPORT WORKSPACE ================= */}
      <section className="bg-white rounded-2xl border border-[#D7E1EE] overflow-hidden shadow-2xs flex flex-col justify-between shrink-0 lg:h-full">
        {/* Dark Navy Header Bar */}
        <div className="bg-[#062A5C] px-5 py-3 text-white rounded-t-2xl shrink-0 flex items-center min-h-[48px]">
          <h2 className="text-[16px] font-black text-white tracking-tight leading-none m-0">
            {activeLevel.displayName}
          </h2>
        </div>

        <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 gap-3">
          {/* Source System & Task Orders Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Source Segmented Control */}
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-extrabold text-[#102448] whitespace-nowrap">
                Report / Source
              </span>
              <div className="inline-flex items-center rounded-full bg-[#F3F6FA] p-0.5 border border-[#D7E1EE]">
                {availableCards.length > 0 ? (
                  availableCards.map((card) => {
                    const isSelected = activeCard?.id === card.id;
                    const label = card.sourceLabel || card.title;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => handleSourceSelect(card)}
                        className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? "bg-[#062A5C] text-white shadow-xs"
                            : "text-[#587094] hover:text-[#102448]"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })
                ) : (
                  <span className="px-3 py-0.5 text-xs text-[#587094] font-medium">
                    {activeLevel.displayName}
                  </span>
                )}
              </div>
            </div>

            {/* Task Orders Outlined Pills */}
            {taskOrders.length > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-extrabold text-[#102448] whitespace-nowrap">
                  Task Orders
                </span>
                <div className="flex items-center gap-1.5">
                  {taskOrders.map((to) => {
                    const text = `${to.id} – ${to.label}`;
                    return (
                      <span
                        key={to.id || to.label}
                        className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-[#102448] border border-[#D7E1EE] shadow-2xs"
                      >
                        {text}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          {/* Shared File Upload Drag-and-Drop Area */}
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-5 px-4 transition-all text-center flex-1 my-1 ${
              isDragOver
                ? "border-[#062A5C] bg-[#F3F6FA]"
                : "border-[#C0D4EC] bg-white hover:border-[#062A5C]/60"
            }`}
          >
            {/* Hidden native input */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={activeCard?.acceptedFileTypes || ".xlsx,.csv"}
              aria-label={`Upload file for ${activeLevel.displayName}`}
              onChange={handleFileInputChange}
            />

            {/* Upload Icon */}
            <div className="flex items-center justify-center text-[#062A5C] mb-2">
              <Upload className="w-7 h-7" strokeWidth={1.9} />
            </div>

            <p className="text-[15.5px] sm:text-[16.5px] font-bold text-[#102448] m-0 tracking-tight">
              {dragDropLabel}
            </p>
            <p className="text-[12px] text-[#587094] font-medium mt-0.5 mb-3 m-0">
              or click browse to select a spreadsheet from your device
            </p>

            <button
              type="button"
              onClick={triggerBrowseFiles}
              disabled={isUploading || !activeCard}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#062A5C] px-5 py-2 text-[12.5px] font-bold text-white shadow-xs hover:bg-[#082F68] transition-all cursor-pointer disabled:opacity-50"
            >
              <FolderOpen className="w-4 h-4 text-white" />
              <span>Browse Files</span>
            </button>

            <p className="text-[11px] text-[#587094] font-medium mt-2.5 m-0">
              Formats: {activeLevel.supportedExtensions} | Max file size: {activeLevel.maxSize}
            </p>
          </div>

          {/* Recent Imports Section */}
          <div className="pt-2 border-t border-[#D7E1EE]/70 flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-[3.5px] h-5 bg-[#062A5C] rounded-full" />
                <h3 className="text-[16px] sm:text-[17px] font-black text-[#102448] leading-tight m-0 tracking-tight">
                  Recent Imports
                </h3>
              </div>

              <button
                type="button"
                onClick={() => onOpenCard?.(activeCard, activeLevel.group)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#D7E1EE] bg-white px-3 py-1 text-xs font-bold text-[#102448] shadow-2xs hover:bg-[#F3F6FA] hover:border-[#062A5C] transition-colors cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5 text-[#062A5C]" />
                <span>Open Repository</span>
              </button>
            </div>

            {/* Table with 5 explicit slots */}
            <div className="overflow-hidden rounded-xl border border-[#D7E1EE]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F3F6FA] border-b border-[#D7E1EE] text-[#102448]">
                    <th className="py-1.5 px-3.5 font-bold w-[25%]">Uploaded At</th>
                    <th className="py-1.5 px-3.5 font-bold w-[45%]">File Name</th>
                    <th className="py-1.5 px-3.5 font-bold text-center w-[18%]">Status</th>
                    <th className="py-1.5 px-3.5 font-bold text-right w-[12%]">Records</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D7E1EE] bg-white">
                  {slotsData.map((slot) => {
                    if (slot.isEmpty) {
                      return (
                        <tr
                          key={`empty-slot-${slot.slotIndex}`}
                          className="h-[28px] text-[#8EA2BE]"
                        >
                          <td className="py-1.5 px-3.5 font-mono text-[11px] text-[#8EA2BE]">--</td>
                          <td className="py-1.5 px-3.5 italic text-[11px] text-[#8EA2BE]">
                            Slot {slot.slotIndex} empty
                          </td>
                          <td className="py-1.5 px-3.5 text-center font-mono text-[11px] text-[#8EA2BE]">--</td>
                          <td className="py-1.5 px-3.5 text-right font-mono text-[11px] text-[#8EA2BE]">--</td>
                        </tr>
                      );
                    }

                    const upload = slot.data;
                    const recordsCount = Number(
                      upload.totalRows ||
                      upload.validRows ||
                      (Array.isArray(upload.rows) ? upload.rows.length : 0),
                    );

                    return (
                      <tr
                        key={upload.id || upload.batchId || `slot-${slot.slotIndex}`}
                        className="hover:bg-[#F8FAFC] transition-colors h-[28px]"
                      >
                        <td className="py-1.5 px-3.5 text-[#102448] whitespace-nowrap font-medium">
                          {formatTableTimestamp(upload)}
                        </td>
                        <td
                          className="py-1.5 px-3.5 text-[#102448] font-semibold max-w-[260px] truncate"
                          title={upload.fileName || "File"}
                        >
                          {upload.fileName || "—"}
                        </td>
                        <td className="py-1.5 px-3.5 text-center whitespace-nowrap">
                          <StatusBadge
                            upload={upload}
                            onOpenErrors={onOpenErrorDetails}
                          />
                        </td>
                        <td className="py-1.5 px-3.5 text-right font-bold text-[#102448] whitespace-nowrap">
                          {recordsCount.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
