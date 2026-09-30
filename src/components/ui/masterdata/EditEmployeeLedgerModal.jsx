import { useMemo, useRef, useState } from "react";
import {
  Briefcase,
  Calendar,
  Check,
  Cpu,
  Loader2,
  Pencil,
  Save,
  User,
  X,
} from "lucide-react";
import AppModal from "@/components/ui/app-modal";

const FIELD_SECTIONS = [
  {
    title: "Official Identity & Contact",
    icon: User,
    iconColor: "text-slate-700",
    badge: "3 Fields",
    badgeColor: "bg-slate-100 text-slate-700 border border-slate-200",
    fields: [
      { key: "kronosName", label: "Official Kronos Name", placeholder: "e.g. ARMIE LACABA", readOnly: true },
      { key: "agentName", label: "Agent Name", placeholder: "e.g. ARMIE LACABA" },
      { key: "callNovoEmail", label: "Call Novo Email", placeholder: "e.g. armie.lacaba@callnovo.com" },
    ],
  },
  {
    title: "Tool Identities (Aliases)",
    icon: Cpu,
    iconColor: "text-blue-600",
    badge: "4 Tools",
    badgeColor: "bg-blue-50 text-blue-700 border border-blue-200",
    fields: [
      { key: "fusecomName", label: "FuseCom Name", dotColor: "bg-orange-500", placeholder: "FuseCom username / name" },
      { key: "fusenetName", label: "FuseNet Name", dotColor: "bg-blue-500", placeholder: "FuseNet username / name" },
      { key: "herodashName", label: "HeroDash Name", dotColor: "bg-amber-500", placeholder: "HeroDash username / name" },
      { key: "msdName", label: "MSD Name", dotColor: "bg-purple-500", placeholder: "MSD / MS-D username" },
    ],
  },
  {
    title: "Operations & Assignment",
    icon: Briefcase,
    iconColor: "text-emerald-600",
    badge: "6 Fields",
    badgeColor: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    fields: [
      { key: "site", label: "Site", placeholder: "e.g. Tagum, Davao" },
      { key: "status", label: "Status", placeholder: "e.g. Active, Resigned" },
      { key: "phase", label: "Phase", placeholder: "e.g. Production, Grad Bay" },
      { key: "modality", label: "Modality", placeholder: "e.g. Voice, Chat, Email" },
      { key: "taskOrder", label: "Task Order", placeholder: "e.g. GSS 2.0 TO10 - SEASIA" },
      { key: "taskOrderDescription", label: "Task Order Description", placeholder: "Task order details..." },
    ],
  },
  {
    title: "Leadership & Dates",
    icon: Calendar,
    iconColor: "text-indigo-600",
    badge: "6 Fields",
    badgeColor: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    fields: [
      { key: "teamLeader", label: "Team Leader", placeholder: "Team Leader name" },
      { key: "manager", label: "Manager", placeholder: "Manager name" },
      { key: "seniorManager", label: "Senior Manager", placeholder: "Senior Manager name" },
      { key: "tenurity", label: "Tenurity", subLabel: "days", placeholder: "Auto-computed: Join Date to Today" },
      { key: "usVisaJoinDate", label: "US Visa Join Date", placeholder: "YYYY-MM-DD", type: "date" },
      { key: "usVisaDepartureDate", label: "US Visa Departure Date", placeholder: "YYYY-MM-DD", type: "date" },
    ],
  },
];

function calculateTenurityDays(joinDate, departureDate) {
  if (!joinDate) return "";
  const str = String(joinDate).trim();
  if (!str || str === "0000-00-00" || str === "—") return "";
  const start = new Date(str);
  if (isNaN(start.getTime()) || start.getFullYear() < 1990) return "";

  const endStr = departureDate ? String(departureDate).trim() : "";
  const end = endStr && endStr !== "—" ? new Date(endStr) : new Date();
  if (isNaN(end.getTime())) return "";

  const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());

  const diffDays = Math.floor((utcEnd - utcStart) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 ? String(diffDays) : "";
}

function buildInitialFormData(employee = {}) {
  const clean = (val) => {
    if (!val) return "";
    const str = String(val).trim();
    return str.includes("#REF!") || str.includes("#N/A") || str.includes("#VALUE!") ? "" : str;
  };

  const computedTenurity = calculateTenurityDays(
    employee.usVisaJoinDate,
    employee.usVisaDepartureDate
  );

  return {
    kronosName: clean(employee.kronosName),
    agentName: clean(employee.agentName),
    callNovoEmail: clean(employee.callNovoEmail),
    fusecomName: clean(employee.fusecomName),
    fusenetName: clean(employee.fusenetName),
    herodashName: clean(employee.herodashName),
    msdName: clean(employee.msdName),
    site: clean(employee.site),
    status: clean(employee.status),
    phase: clean(employee.phase),
    taskOrder: clean(employee.taskOrder),
    taskOrderDescription: clean(employee.taskOrderDescription),
    modality: clean(employee.modality),
    teamLeader: clean(employee.teamLeader),
    manager: clean(employee.manager),
    seniorManager: clean(employee.seniorManager),
    tenurity: computedTenurity || clean(employee.tenurity),
    usVisaJoinDate: employee.usVisaJoinDate || "",
    usVisaDepartureDate: employee.usVisaDepartureDate || "",
  };
}

function EditEmployeeLedgerForm({ isOpen, employee, onClose, onSave, isSaving }) {
  const initialData = useMemo(() => buildInitialFormData(employee), [employee]);
  const [formData, setFormData] = useState(initialData);
  const [activeEdits, setActiveEdits] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef({});

  const isLoading = Boolean(isSaving || isSubmitting);

  // Check if any field differs from initial employee data
  const hasChanges = useMemo(() => {
    return Object.keys(initialData).some((key) => {
      const orig = String(initialData[key] ?? "").trim();
      const curr = String(formData[key] ?? "").trim();
      return orig !== curr;
    });
  }, [initialData, formData]);

  // Check if any field is currently being edited (user has not clicked "Done" yet)
  const hasActiveEdits = useMemo(() => {
    return Object.values(activeEdits).some(Boolean);
  }, [activeEdits]);

  // Can only save if there are actual changes AND all fields are finalized with "Done"
  const isSaveReady = hasChanges && !hasActiveEdits && !isLoading;

  const handleActivateEdit = (key) => {
    setActiveEdits((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      inputRefs.current[key]?.focus();
    }, 50);
  };

  const handleDeactivateEdit = (key) => {
    setActiveEdits((prev) => ({ ...prev, [key]: false }));
  };

  const handleChange = (key, val) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: val };
      if (key === "usVisaJoinDate" || key === "usVisaDepartureDate") {
        const autoDays = calculateTenurityDays(next.usVisaJoinDate, next.usVisaDepartureDate);
        if (autoDays) {
          next.tenurity = autoDays;
        }
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isSaveReady) return;
    setIsSubmitting(true);
    try {
      await onSave?.(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppModal
      isOpen={isOpen}
      className="!max-w-none !w-[min(97vw,1440px)] !max-h-[90vh] !p-0 flex flex-col overflow-hidden rounded-2xl shadow-2xl border border-slate-200 bg-white"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0 overflow-hidden">
        {/* Sticky Header */}
        <div className="shrink-0 border-b border-slate-200/90 bg-slate-50/90 px-5 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="m-0 text-base font-extrabold text-slate-900 leading-snug">
                Edit Employee Ledger Record
              </h3>
              <p className="mt-0.5 mb-0 text-xs text-slate-500 truncate">
                Click <span className="font-semibold text-slate-700">Edit</span> on any field to modify details, then click <span className="font-semibold text-slate-700">Confirm &amp; Save</span>.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Identifier Badge Bar */}
          <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">SIBS ID:</span>
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                {employee.sibsId || "—"}
              </span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Official Name:</span>
              <span className="text-xs font-extrabold text-slate-900 truncate">
                {employee.agentName || employee.kronosName || "—"}
              </span>
            </div>
            {formData.site && (
              <>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <div className="hidden sm:flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Site:</span>
                  <span className="text-xs font-bold text-slate-700">{formData.site}</span>
                </div>
              </>
            )}
            {formData.status && (
              <>
                <span className="text-slate-300 hidden md:inline">•</span>
                <div className="hidden md:flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status:</span>
                  <span className="text-xs font-bold text-slate-700">{formData.status}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Horizontal Landscape 4-Column Scrollable Body */}
        <div className="sibs-scrollbar flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-5 overscroll-contain">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
            {FIELD_SECTIONS.map((section, sectionIdx) => {
              const SectionIcon = section.icon;
              return (
                <div
                  key={section.title}
                  className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-3 sm:p-3.5 flex flex-col shadow-2xs"
                >
                  {/* Column Section Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2 mb-3">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <SectionIcon size={15} className={`shrink-0 ${section.iconColor}`} />
                      <h4 className="m-0 text-xs font-bold uppercase tracking-wider text-slate-800 truncate">
                        {section.title}
                      </h4>
                    </div>
                    {section.badge && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold shrink-0 select-none ${section.badgeColor}`}
                      >
                        {section.badge}
                      </span>
                    )}
                  </div>

                  {/* Field Cards in this Section */}
                  <div className="flex flex-col gap-2.5 flex-1">
                    {section.fields.map((field) => {
                      const isReadOnly = Boolean(field.readOnly || section.readOnly);
                      const isEditing = !isReadOnly && Boolean(activeEdits[field.key]);
                      const currentVal = formData[field.key];

                      return (
                        <div
                          key={field.key}
                          className={`rounded-lg border p-2.5 transition-all ${
                            isReadOnly
                              ? "border-slate-200/70 bg-slate-100/70"
                              : isEditing
                              ? "border-[#0b3b68] bg-blue-50/30 shadow-2xs ring-1 ring-[#0b3b68]/30"
                              : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1.5 mb-1">
                            <label className="flex items-baseline gap-1 text-[11px] font-bold text-slate-700 truncate">
                              {field.dotColor && (
                                <span
                                  className={`inline-block h-2 w-2 rounded-full shrink-0 ${field.dotColor}`}
                                />
                              )}
                              <span className="truncate">{field.label}</span>
                              {field.subLabel && (
                                <span className="text-[10px] font-semibold lowercase tracking-normal text-slate-400">
                                  {field.subLabel}
                                </span>
                              )}
                            </label>

                            {!isReadOnly ? (
                              isEditing ? (
                                <button
                                  type="button"
                                  onClick={() => handleDeactivateEdit(field.key)}
                                  className="inline-flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-emerald-700 transition cursor-pointer shrink-0 shadow-2xs"
                                  title="Lock field (done editing)"
                                >
                                  <Check size={10} strokeWidth={2.5} />
                                  <span>Done</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleActivateEdit(field.key)}
                                  className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold text-[#0b3b68] shadow-2xs hover:border-[#0b3b68] hover:bg-[#0b3b68]/5 transition cursor-pointer shrink-0"
                                  title={`Edit ${field.label}`}
                                >
                                  <Pencil size={9.5} />
                                  <span>Edit</span>
                                </button>
                              )
                            ) : (
                              <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                                Locked
                              </span>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="relative mt-1">
                              <input
                                ref={(el) => {
                                  inputRefs.current[field.key] = el;
                                }}
                                type={field.type || "text"}
                                value={currentVal || ""}
                                onChange={(e) => handleChange(field.key, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleDeactivateEdit(field.key);
                                  }
                                }}
                                placeholder={field.placeholder || `Enter ${field.label}...`}
                                className="h-7 w-full rounded border border-[#0b3b68]/50 bg-white px-2 pr-6 text-xs font-medium text-slate-900 focus:border-[#0b3b68] focus:ring-1 focus:ring-[#0b3b68] focus:outline-none transition shadow-2xs"
                              />
                              {currentVal && (
                                <button
                                  type="button"
                                  onClick={() => handleChange(field.key, "")}
                                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                  title="Clear field"
                                >
                                  <X size={11} />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center min-h-[24px]">
                              <span
                                className={`text-xs truncate select-text ${
                                  currentVal
                                    ? "font-semibold text-slate-900"
                                    : "italic text-slate-400 text-[11px]"
                                }`}
                                title={currentVal || "Not set"}
                              >
                                {currentVal || "— Not set"}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Informative Callout for Column 1 */}
                    {sectionIdx === 0 && (
                      <div className="mt-auto rounded-lg border border-slate-200/90 bg-white/90 p-2.5 text-[11px] leading-relaxed text-slate-600 shadow-2xs">
                        <span className="font-bold text-slate-800">Master Identity:</span> Official Kronos Name, Agent Name, and Call Novo Email linked to this SIBS ID.
                      </div>
                    )}

                    {/* Informative Callout for Column 2 (Tool Aliases) */}
                    {sectionIdx === 1 && (
                      <div className="mt-auto rounded-lg border border-blue-100 bg-blue-50/40 p-2.5 text-[11px] leading-relaxed text-blue-700 shadow-2xs">
                        <span className="font-bold">Tool Alignment:</span> Used for mapping agent performance metrics from FuseCom, FuseNet, HeroDash, and MSD.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticky Footer Actions */}
        <div className="shrink-0 flex items-center justify-between border-t border-slate-200/90 bg-slate-50/90 px-5 py-3">
          <div className="min-w-0 hidden sm:flex items-center gap-2">
            {hasActiveEdits ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span>Please click &quot;Done&quot; on your edited field before saving.</span>
              </span>
            ) : hasChanges ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>Changes detected — ready to save.</span>
              </span>
            ) : (
              <span className="text-xs text-slate-400 italic">
                No changes made yet. Click Edit on any field to make changes.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-8.5 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isSaveReady}
              title={
                hasActiveEdits
                  ? "Please click 'Done' on your active field before saving"
                  : !hasChanges
                  ? "No changes made yet"
                  : "Save modifications to database"
              }
              className={`inline-flex h-8.5 items-center justify-center gap-2 rounded-lg px-5 text-xs font-extrabold shadow-xs transition ${
                isLoading
                  ? "bg-[#0b3b68]/80 text-white cursor-wait"
                  : !isSaveReady
                  ? "bg-slate-200 text-slate-400 border border-slate-300/80 cursor-not-allowed shadow-none"
                  : "bg-[#0b3b68] text-white hover:bg-[#082b4d] cursor-pointer"
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 size={13} className="animate-spin text-white shrink-0" />
                  <span>Saving to Database…</span>
                </>
              ) : (
                <>
                  <Save size={13} className="shrink-0" />
                  <span>Confirm &amp; Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </AppModal>
  );
}

export default function EditEmployeeLedgerModal({
  isOpen,
  employee,
  onClose,
  onSave,
  isSaving = false,
}) {
  if (!isOpen || !employee) return null;

  return (
    <EditEmployeeLedgerForm
      key={employee.id || employee.sibsId || "edit-employee"}
      isOpen={isOpen}
      employee={employee}
      onClose={onClose}
      onSave={onSave}
      isSaving={isSaving}
    />
  );
}

