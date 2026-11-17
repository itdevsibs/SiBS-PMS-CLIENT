import React, { useEffect, useState } from "react";
import {
  X,
  Pencil,
  Check,
  Lock,
  User,
  Briefcase,
  Users,
  MapPin,
  Calendar,
} from "lucide-react";

const SECTIONS = [
  {
    key: "employeeInfo",
    title: "Employee Information",
    icon: User,
    cols: "grid-cols-1 sm:grid-cols-2",
    fields: [
      { key: "name", label: "Employee Name", required: true },
      { key: "salesforceName", label: "Salesforce Name" },
    ],
  },
  {
    key: "employmentDetails",
    title: "Employment Details",
    icon: Briefcase,
    cols: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    fields: [
      { key: "sibsId", label: "SiBS ID", locked: true },
      { key: "account", label: "Account", locked: true },
      {
        key: "tier",
        label: "Tier",
        locked: true,
      },
      {
        key: "lob",
        label: "LOB",
        locked: true,
      },
    ],
  },
  {
    key: "organization",
    title: "Organization",
    icon: Users,
    cols: "grid-cols-1 sm:grid-cols-2",
    fields: [
      { key: "tl", label: "Team Leader (TL)" },
      { key: "om", label: "Operations Manager (OM)" },
    ],
  },
  {
    key: "assignmentStatus",
    title: "Assignment & Status",
    icon: MapPin,
    cols: "grid-cols-1 sm:grid-cols-2",
    fields: [
      {
        key: "site",
        label: "Site",
        locked: true,
      },
      {
        key: "status",
        label: "Status",
        locked: true,
      },
    ],
  },
  {
    key: "employmentDates",
    title: "Employment Dates",
    icon: Calendar,
    cols: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    fields: [
      { key: "pstDate", label: "PST Date", type: "date", locked: true },
      { key: "hireDate", label: "Hire Date", type: "date", locked: true },
      { key: "productionDate", label: "Production Date", type: "date", locked: true },
      { key: "departureDate", label: "Departure Date", type: "date", locked: true },
    ],
  },
];

export default function FrontStepsEditEmployeeModal({
  isOpen,
  employee,
  onClose,
  onSave,
}) {
  const [formData, setFormData] = useState({});
  const [editingField, setEditingField] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({ ...employee });
      setEditingField(null);
      setHasChanges(false);
    }
  }, [employee]);

  if (!isOpen || !employee) return null;

  const handleFieldChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleConfirmSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px]">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B2A4A] text-white shadow-2xs">
              <Pencil size={17} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Edit Employee Ledger Record
              </h2>
              <p className="text-xs text-slate-500">
                Update employee account details and employment information.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto bg-slate-50/40 p-6">
          {/* Top Row: Shorter Profile Card + Stacked Info/Details */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Left Profile Card (Picture Placeholder Only) */}
            <div className="lg:col-span-3">
              <div className="flex h-full flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-[#0B2A4A] to-[#071D34] p-6 text-white shadow-sm">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-slate-200/90 text-[#0B2A4A] shadow-inner">
                  <User size={52} className="text-slate-500" />
                </div>
              </div>
            </div>

            {/* Right Top: Employee Information + Employment Details */}
            <div className="flex flex-col justify-between gap-4 lg:col-span-9">
              {SECTIONS.slice(0, 2).map((section) => {
                const Icon = section.icon;
                return (
                  <div
                    key={section.key}
                    className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs"
                  >
                    <div className="mb-2.5 flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-[#0B2A4A]">
                        <Icon size={14} />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {section.title}
                      </h4>
                    </div>

                    <div className={`grid gap-2.5 ${section.cols}`}>
                      {section.fields.map((field) => {
                        const isEditing = editingField === field.key;
                        const val = formData[field.key] ?? "";

                        return (
                          <div
                            key={field.key}
                            className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 transition ${
                              field.locked
                                ? "border-slate-200/80 bg-slate-100/70"
                                : "border-slate-200 bg-slate-50/40"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <span className="block text-[10.5px] font-medium text-slate-500">
                                {field.label}
                                {field.required && (
                                  <span className="ml-0.5 text-rose-500">*</span>
                                )}
                              </span>

                              {isEditing ? (
                                field.type === "select" ? (
                                  <select
                                    value={val}
                                    onChange={(e) =>
                                      handleFieldChange(field.key, e.target.value)
                                    }
                                    autoFocus
                                    className="mt-0.5 w-full rounded border border-[#0B2A4A] bg-white px-1.5 py-0.5 text-xs font-semibold text-slate-900 focus:outline-none"
                                  >
                                    {field.options.map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type={field.type || "text"}
                                    value={val}
                                    onChange={(e) =>
                                      handleFieldChange(field.key, e.target.value)
                                    }
                                    autoFocus
                                    className="mt-0.5 w-full rounded border border-[#0B2A4A] bg-white px-1.5 py-0.5 text-xs font-semibold text-slate-900 focus:outline-none"
                                  />
                                )
                              ) : (
                                <p
                                  className={`truncate text-xs font-semibold ${
                                    val && val !== "-"
                                      ? "text-slate-900"
                                      : "font-normal text-slate-400"
                                  }`}
                                >
                                  {val && val !== "-" ? val : "— Not set"}
                                </p>
                              )}
                            </div>

                            {field.locked ? (
                              <span
                                title="Locked"
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400"
                              >
                                <Lock size={13} />
                              </span>
                            ) : isEditing ? (
                              <button
                                type="button"
                                onClick={() => setEditingField(null)}
                                title="Done"
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              >
                                <Check size={13} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setEditingField(field.key)}
                                title={`Edit ${field.label}`}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                              >
                                <Pencil size={12} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Row: 3 Category Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {SECTIONS.slice(2).map((section) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.key}
                  className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs"
                >
                  <div className="mb-2.5 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-[#0B2A4A]">
                      <Icon size={14} />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {section.title}
                    </h4>
                  </div>

                  <div
                    className={`grid gap-2.5 ${
                      section.key === "employmentDates"
                        ? "grid-cols-1 sm:grid-cols-2"
                        : "grid-cols-1"
                    }`}
                  >
                    {section.fields.map((field) => {
                      const isEditing = editingField === field.key;
                      const val = formData[field.key] ?? "";

                      return (
                        <div
                          key={field.key}
                          className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 transition ${
                            field.locked
                              ? "border-slate-200/80 bg-slate-100/70"
                              : "border-slate-200 bg-slate-50/40"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="block text-[10.5px] font-medium text-slate-500">
                              {field.label}
                            </span>

                            {isEditing ? (
                              field.type === "select" ? (
                                <select
                                  value={val}
                                  onChange={(e) =>
                                    handleFieldChange(field.key, e.target.value)
                                  }
                                  autoFocus
                                  className="mt-0.5 w-full rounded border border-[#0B2A4A] bg-white px-1.5 py-0.5 text-xs font-semibold text-slate-900 focus:outline-none"
                                >
                                  {field.options.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={field.type || "text"}
                                  value={val}
                                  onChange={(e) =>
                                    handleFieldChange(field.key, e.target.value)
                                  }
                                  autoFocus
                                  className="mt-0.5 w-full rounded border border-[#0B2A4A] bg-white px-1.5 py-0.5 text-xs font-semibold text-slate-900 focus:outline-none"
                                />
                              )
                            ) : (
                              <p
                                className={`truncate text-xs font-semibold ${
                                  val && val !== "-"
                                    ? "text-slate-900"
                                    : "font-normal text-slate-400"
                                }`}
                              >
                                {val && val !== "-" ? val : "— Not set"}
                              </p>
                            )}
                          </div>

                          {field.locked ? (
                            <span
                              title="Locked"
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400"
                            >
                              <Lock size={13} />
                            </span>
                          ) : isEditing ? (
                            <button
                              type="button"
                              onClick={() => setEditingField(null)}
                              title="Done"
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            >
                              <Check size={13} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditingField(field.key)}
                              title={`Edit ${field.label}`}
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                            >
                              <Pencil size={12} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-white px-6 py-3.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!hasChanges}
              onClick={handleConfirmSave}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2A4A] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#09223c] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              <Check size={13} />
              Confirm &amp; Save
            </button>
        </div>
      </div>
    </div>
  );
}
