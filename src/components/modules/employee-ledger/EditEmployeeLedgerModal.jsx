import { useMemo, useRef, useState } from "react";
import {
  Briefcase,
  Calendar,
  Check,
  FileText,
  Flag,
  Headphones,
  IdCard,
  Layers,
  List,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Save,
  Shield,
  User,
  Users,
  X,
} from "lucide-react";
import AppModal from "@/components/common/ui/AppModal";

const BENTO_SECTIONS = [
  {
    key: "tools",
    title: "Tool Identities (Aliases)",
    icon: Layers,
    iconColor: "text-slate-700",
    badge: "4 Tools",
    badgeColor: "bg-blue-50 text-blue-600 border border-blue-200/80",
    fields: [
      { key: "fusecomName", label: "FuseCom Name", dotColor: "bg-orange-500", placeholder: "FuseCom username / name" },
      { key: "fusenetName", label: "FuseNet Name", dotColor: "bg-sky-500", placeholder: "FuseNet username / name" },
      { key: "herodashName", label: "HeroDash Name", dotColor: "bg-amber-400", placeholder: "HeroDash username / name" },
      { key: "msdName", label: "MSD Name", dotColor: "bg-purple-500", placeholder: "MSD / MS-D username" },
    ],
  },
  {
    key: "operations",
    title: "Operations & Assignment",
    icon: Briefcase,
    iconColor: "text-slate-700",
    badge: "6 Fields",
    badgeColor: "bg-emerald-50 text-emerald-700 border border-emerald-200/80",
    fields: [
      { key: "site", label: "Site", icon: MapPin, placeholder: "e.g. Tagum, Davao" },
      { key: "status", label: "Status", icon: Shield, placeholder: "e.g. Active, Resigned" },
      { key: "phase", label: "Phase", icon: Flag, placeholder: "e.g. Production, Grad Bay" },
      { key: "modality", label: "Modality", icon: Headphones, placeholder: "e.g. Voice, Chat, Email" },
      {
        key: "taskOrder",
        label: "Task Order",
        icon: List,
        type: "select",
        options: [
          "GSS 2.0 TO10 - SEASIA",
          "GSS 2.0 TO4 - PAC",
          "GSS 2.0 TO12 - NICE",
          "GSS 2.0 TO16 - SEURECA",
          "GSS 2.0 TO14 - NESAMI",
        ],
        placeholder: "Select Task Order",
      },
      { key: "taskOrderDescription", label: "Task Order Description", icon: FileText, placeholder: "Task order details..." },
    ],
  },
  {
    key: "leadership",
    title: "Leadership & Dates",
    icon: Users,
    iconColor: "text-slate-700",
    badge: "6 Fields",
    badgeColor: "bg-purple-50 text-purple-700 border border-purple-200/80",
    fields: [
      { key: "teamLeader", label: "Team Leader", icon: Users, placeholder: "Team Leader name" },
      { key: "manager", label: "Manager", icon: Users, placeholder: "Manager name" },
      { key: "seniorManager", label: "Senior Manager", icon: Users, placeholder: "Senior Manager name" },
      { key: "tenurity", label: "Tenurity (days)", icon: Calendar, placeholder: "Auto-computed: Join Date to Today", readOnly: true },
      { key: "usVisaJoinDate", label: "US Visa Join Date", icon: Calendar, placeholder: "YYYY-MM-DD", type: "date", readOnly: true },
      { key: "usVisaDepartureDate", label: "US Visa Departure Date", icon: Calendar, placeholder: "YYYY-MM-DD", type: "date", readOnly: true },
    ],
  },
  {
    key: "identity",
    title: "Official Identity & Contact",
    icon: User,
    iconColor: "text-slate-700",
    badge: "3 Fields",
    badgeColor: "bg-sky-50 text-sky-700 border border-sky-200/80",
    fields: [
      { key: "kronosName", label: "Official Kronos Name", icon: IdCard, placeholder: "e.g. ARMIE LACABA", readOnly: true },
      { key: "agentName", label: "Agent Name", icon: User, placeholder: "e.g. ARMIE LACABA" },
      { key: "callNovoEmail", label: "Call Novo Email", icon: Mail, placeholder: "e.g. armie.lacaba@callnovo.com" },
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

  const hasChanges = useMemo(() => {
    return Object.keys(initialData).some((key) => {
      const orig = String(initialData[key] ?? "").trim();
      const curr = String(formData[key] ?? "").trim();
      return orig !== curr;
    });
  }, [initialData, formData]);

  const hasActiveEdits = useMemo(() => {
    return Object.values(activeEdits).some(Boolean);
  }, [activeEdits]);

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

  const displayName = formData.agentName || formData.kronosName || employee.agentName || employee.kronosName || "—";

  return (
    <AppModal
      isOpen={isOpen}
      className="!max-w-none !w-[min(96vw,1320px)] !max-h-[95vh] !p-0 flex flex-col overflow-hidden rounded-2xl shadow-2xl border border-slate-200 bg-white"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0 overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex items-start justify-between gap-3 border-b border-slate-200/80 bg-white px-5 py-3">
          <div className="min-w-0">
            <h3 className="m-0 text-lg font-extrabold text-slate-900 leading-snug">
              Edit Employee Ledger Record
            </h3>
            <p className="mt-0.5 mb-0 text-xs text-slate-500">
              Click <span className="font-semibold text-slate-700">Edit</span> on any field to modify details, then click{" "}
              <span className="font-semibold text-slate-700">Confirm &amp; Save</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body: Left Profile Card + Right 2x2 Bento Grid */}
        <div className="sibs-scrollbar flex-1 min-h-0 overflow-y-auto lg:overflow-hidden overflow-x-hidden bg-slate-50/50 p-3.5 overscroll-contain">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
            {/* Left Profile Column: Full-height Navy Identity Card */}
            <div className="lg:col-span-3 flex flex-col">
              <div className="flex-1 rounded-xl bg-gradient-to-b from-[#0b3b68] to-[#072848] p-5 text-white shadow-2xs flex flex-col items-center justify-end gap-4 text-center">
                <div className="flex flex-1 items-center justify-center">
                  <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white/10 border border-white/20 text-white shadow-inner">
                    <User size={58} className="text-white/90" />
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-extrabold uppercase tracking-wide text-white">
                    {displayName}
                  </h4>

                  <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-200">
                    <span>SIBS ID:</span>
                    <span className="rounded bg-white/15 px-2.5 py-0.5 font-mono font-bold text-white border border-white/15">
                      {employee.sibsId || "—"}
                    </span>
                  </div>
                </div>

                <div className="w-full space-y-3">
                  <div className="w-full grid grid-cols-2 gap-2 border-t border-white/15 pt-4 text-left text-xs">
                    <div className="rounded-lg bg-white/10 px-3 py-2">
                      <span className="block text-[10px] text-slate-300">Site</span>
                      <span className="text-xs font-bold text-white truncate block">{formData.site || "—"}</span>
                    </div>
                    <div className="rounded-lg bg-white/10 px-3 py-2">
                      <span className="block text-[10px] text-slate-300">Status</span>
                      <span className="text-xs font-bold text-sky-200 truncate block">{formData.status || "—"}</span>
                    </div>
                  </div>

                  <div className="w-full space-y-2.5 border-t border-white/15 pt-4 text-left text-xs">
                  <div className="flex items-start gap-2.5">
                    <Mail size={14} className="mt-0.5 shrink-0 text-slate-300" />
                    <div className="min-w-0">
                      <span className="block text-[10px] text-slate-300">Call Novo Email</span>
                      <span className="block truncate font-semibold text-white" title={formData.callNovoEmail || ""}>
                        {formData.callNovoEmail || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <User size={14} className="mt-0.5 shrink-0 text-slate-300" />
                    <div className="min-w-0">
                      <span className="block text-[10px] text-slate-300">Agent Name</span>
                      <span className="block truncate font-semibold text-white">
                        {formData.agentName || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <IdCard size={14} className="mt-0.5 shrink-0 text-slate-300" />
                      <div className="min-w-0">
                        <span className="block text-[10px] text-slate-300">Official Kronos Name</span>
                        <span className="block truncate font-semibold text-white">
                          {formData.kronosName || "—"}
                        </span>
                      </div>
                    </div>
                    <span
                      title="Locked"
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/10 text-slate-300"
                    >
                      <Lock size={11} />
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Flag size={14} className="mt-0.5 shrink-0 text-slate-300" />
                    <div className="min-w-0">
                      <span className="block text-[10px] text-slate-300">Phase &amp; Tenurity</span>
                      <span className="block truncate font-semibold text-white">
                        {formData.phase || "—"} {formData.tenurity ? `• ${formData.tenurity} days` : ""}
                      </span>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 2x2 Bento Sections */}
            <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
              {BENTO_SECTIONS.map((section) => {
                const SectionIcon = section.icon;
                return (
                  <div
                    key={section.key}
                    className="flex flex-col rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs"
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <SectionIcon size={16} className={`shrink-0 ${section.iconColor}`} />
                        <h4 className="m-0 text-sm font-bold text-slate-900 truncate">
                          {section.title}
                        </h4>
                      </div>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold shrink-0 select-none ${section.badgeColor}`}
                      >
                        {section.badge}
                      </span>
                    </div>

                    {/* Field Rows */}
                    <div className="divide-y divide-slate-100 flex-1 flex flex-col justify-start">
                      {section.fields.map((field) => {
                        const isReadOnly = Boolean(field.readOnly);
                        const isEditing = !isReadOnly && Boolean(activeEdits[field.key]);
                        const currentVal = formData[field.key];
                        const FieldIcon = field.icon;

                        return (
                          <div
                            key={field.key}
                            className="flex items-center justify-between gap-3 py-1.5 first:pt-1 last:pb-0.5"
                          >
                            {/* Left: Dot/Icon + Label */}
                            <div className="flex items-center gap-2.5 w-[40%] min-w-0 shrink-0">
                              {field.dotColor ? (
                                <span className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${field.dotColor}`} />
                              ) : FieldIcon ? (
                                <FieldIcon size={14} className="shrink-0 text-slate-400" />
                              ) : null}
                              <span className="text-xs font-medium text-slate-600 truncate">
                                {field.label}
                              </span>
                            </div>

                            {/* Middle: Value or Input */}
                            <div className="flex-1 min-w-0">
                              {isEditing ? (
                                field.type === "select" ? (
                                  <select
                                    ref={(el) => {
                                      inputRefs.current[field.key] = el;
                                    }}
                                    value={currentVal || ""}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    className="h-7 w-full rounded-md border border-[#0b3b68]/60 bg-white px-2 text-xs font-semibold text-slate-900 focus:border-[#0b3b68] focus:ring-1 focus:ring-[#0b3b68] focus:outline-none transition"
                                  >
                                    <option value="">Select {field.label}...</option>
                                    {field.options?.map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <div className="relative">
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
                                      className="h-7 w-full rounded-md border border-[#0b3b68]/60 bg-white px-2 pr-6 text-xs font-semibold text-slate-900 focus:border-[#0b3b68] focus:ring-1 focus:ring-[#0b3b68] focus:outline-none transition"
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
                                )
                              ) : (
                                <span
                                  className={`block text-xs truncate select-text ${
                                    currentVal
                                      ? "font-bold text-slate-900"
                                      : "text-slate-400 font-normal"
                                  }`}
                                  title={currentVal || "Not set"}
                                >
                                  {currentVal || "— Not set —"}
                                </span>
                              )}
                            </div>

                            {/* Right: Edit / Done / Locked Button */}
                            <div className="shrink-0">
                              {isReadOnly ? (
                                <span
                                  title="Locked"
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-slate-400"
                                >
                                  <Lock size={12} />
                                </span>
                              ) : isEditing ? (
                                (() => {
                                  const isFieldChanged =
                                    String(currentVal ?? "").trim() !==
                                    String(initialData[field.key] ?? "").trim();
                                  const handleCancelField = () => {
                                    handleChange(field.key, initialData[field.key] ?? "");
                                    handleDeactivateEdit(field.key);
                                  };
                                  return (
                                    <div className="inline-flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={handleCancelField}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95 transition cursor-pointer"
                                        title="Cancel editing"
                                      >
                                        <X size={14} strokeWidth={2.2} />
                                      </button>
                                      {isFieldChanged && (
                                        <button
                                          type="button"
                                          onClick={() => handleDeactivateEdit(field.key)}
                                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition cursor-pointer"
                                          title="Update field"
                                        >
                                          <Check size={14} strokeWidth={2.5} />
                                        </button>
                                      )}
                                    </div>
                                  );
                                })()
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleActivateEdit(field.key)}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-2xs hover:border-[#0b3b68] hover:text-[#0b3b68] transition cursor-pointer"
                                  title={`Edit ${field.label}`}
                                >
                                  <Pencil size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between border-t border-slate-200/80 bg-white px-5 py-2.5">
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
              <span className="text-xs text-slate-400">
                No changes made yet. Click Edit on any field to make changes.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
              className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-5 text-xs font-bold shadow-xs transition ${
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
