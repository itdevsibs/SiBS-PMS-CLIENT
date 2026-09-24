import { useEffect, useRef, useState } from "react";
import { Copy, Loader2, Pencil, Save, X } from "lucide-react";
import AppModal from "@/components/ui/app-modal";

export default function EditToolAlignmentModal({
  isOpen,
  employee,
  onClose,
  onSave,
  isSaving = false,
}) {
  const [fusecomName, setFusecomName] = useState("");
  const [fusenetName, setFusenetName] = useState("");
  const [herodashName, setHerodashName] = useState("");

  const [activeEdits, setActiveEdits] = useState({
    fusecom: false,
    fusenet: false,
    herodash: false,
  });

  const fusecomInputRef = useRef(null);
  const fusenetInputRef = useRef(null);
  const herodashInputRef = useRef(null);

  // Initialize values when employee changes or modal opens
  useEffect(() => {
    if (employee) {
      setFusecomName(employee.toolMappings?.fusecom?.name || "");
      setFusenetName(employee.toolMappings?.fusenet?.name || "");
      setHerodashName(employee.toolMappings?.herodash?.name || "");
      setActiveEdits({
        fusecom: false,
        fusenet: false,
        herodash: false,
      });
    }
  }, [employee, isOpen]);

  const handleActivateEdit = (toolKey) => {
    setActiveEdits((prev) => ({ ...prev, [toolKey]: true }));
    setTimeout(() => {
      if (toolKey === "fusecom") fusecomInputRef.current?.focus();
      if (toolKey === "fusenet") fusenetInputRef.current?.focus();
      if (toolKey === "herodash") herodashInputRef.current?.focus();
    }, 50);
  };

  const handleDeactivateEdit = (toolKey) => {
    setActiveEdits((prev) => ({ ...prev, [toolKey]: false }));
  };

  if (!isOpen || !employee) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave?.({
      fusecomName,
      fusenetName,
      herodashName,
    });
  };

  return (
    <AppModal
      isOpen={isOpen}
      className="!max-w-none w-full sm:!w-[560px] p-5 sm:p-6 overflow-hidden"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Modal Header */}
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between">
            <h3 className="m-0 text-base font-bold text-slate-900 leading-snug">
              Edit Tool Identity Alignment
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Official Kronos Identity Cover Box - Single Line */}
          <div className="mt-2.5 rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-2">
            <div className="flex items-center justify-between gap-3 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-300/80 bg-slate-200/80 px-2 py-0.5 text-[11px] font-bold text-slate-700 shadow-2xs shrink-0 select-none">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-500 shrink-0" />
                  <span>Official Kronos Name</span>
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate">
                  {employee.fullName}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs shrink-0 select-none">
                <span className="font-mono font-semibold text-slate-600 rounded bg-white border border-slate-200 px-2 py-0.5 text-[11px] shadow-2xs">
                  SIBS ID: {employee.sibsId}
                </span>
                <span className="text-slate-300">•</span>
                <span className="rounded bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 shadow-2xs">
                  {employee.account || "US Visa"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Tool Name Cards with On-Demand Edit Activation */}
        <div className="space-y-3.5 pt-1">
          {/* Fusecom Name */}
          <div
            className={`rounded-xl border p-3 space-y-2 transition ${
              activeEdits.fusecom
                ? "border-orange-300 bg-orange-50/15"
                : "border-slate-200/90 bg-slate-50/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-1.5 rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-800 shadow-2xs">
                <span className="inline-block h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                <span>Fusecom Name</span>
              </label>

              {activeEdits.fusecom && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFusecomName(employee.fullName || "")}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-orange-700 transition cursor-pointer"
                    title="Fill with official Kronos name"
                  >
                    <Copy size={11} className="text-slate-400" />
                    <span>Use Official Name</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeactivateEdit("fusecom")}
                    className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                    title="Done editing"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>

            {activeEdits.fusecom ? (
              <div className="relative">
                <input
                  ref={fusecomInputRef}
                  type="text"
                  value={fusecomName}
                  onChange={(e) => setFusecomName(e.target.value)}
                  placeholder="Enter Fusecom name..."
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 pr-8 text-xs text-slate-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition shadow-2xs"
                />
                {fusecomName && (
                  <button
                    type="button"
                    onClick={() => setFusecomName("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Clear"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-xs">
                <span
                  className={`truncate pr-2 select-text ${
                    fusecomName ? "font-semibold text-slate-800" : "italic text-slate-400"
                  }`}
                >
                  {fusecomName || "Not aligned (empty)"}
                </span>
                <button
                  type="button"
                  onClick={() => handleActivateEdit("fusecom")}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-bold text-slate-600 shadow-2xs hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer shrink-0"
                  title="Edit Fusecom Name"
                >
                  <Pencil size={11} className="text-slate-400" />
                  <span>Edit</span>
                </button>
              </div>
            )}
          </div>

          {/* FuseNet Name */}
          <div
            className={`rounded-xl border p-3 space-y-2 transition ${
              activeEdits.fusenet
                ? "border-blue-300 bg-blue-50/15"
                : "border-slate-200/90 bg-slate-50/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800 shadow-2xs">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                <span>FuseNet Name</span>
              </label>

              {activeEdits.fusenet && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFusenetName(employee.fullName || "")}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-blue-700 transition cursor-pointer"
                    title="Fill with official Kronos name"
                  >
                    <Copy size={11} className="text-slate-400" />
                    <span>Use Official Name</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeactivateEdit("fusenet")}
                    className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                    title="Done editing"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>

            {activeEdits.fusenet ? (
              <div className="relative">
                <input
                  ref={fusenetInputRef}
                  type="text"
                  value={fusenetName}
                  onChange={(e) => setFusenetName(e.target.value)}
                  placeholder="Enter FuseNet name..."
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 pr-8 text-xs text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition shadow-2xs"
                />
                {fusenetName && (
                  <button
                    type="button"
                    onClick={() => setFusenetName("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Clear"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-xs">
                <span
                  className={`truncate pr-2 select-text ${
                    fusenetName ? "font-semibold text-slate-800" : "italic text-slate-400"
                  }`}
                >
                  {fusenetName || "Not aligned (empty)"}
                </span>
                <button
                  type="button"
                  onClick={() => handleActivateEdit("fusenet")}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-bold text-slate-600 shadow-2xs hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer shrink-0"
                  title="Edit FuseNet Name"
                >
                  <Pencil size={11} className="text-slate-400" />
                  <span>Edit</span>
                </button>
              </div>
            )}
          </div>

          {/* HeroDash Name */}
          <div
            className={`rounded-xl border p-3 space-y-2 transition ${
              activeEdits.herodash
                ? "border-amber-300 bg-amber-50/15"
                : "border-slate-200/90 bg-slate-50/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 shadow-2xs">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                <span>HeroDash Name</span>
              </label>

              {activeEdits.herodash && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHerodashName(employee.fullName || "")}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-amber-700 transition cursor-pointer"
                    title="Fill with official Kronos name"
                  >
                    <Copy size={11} className="text-slate-400" />
                    <span>Use Official Name</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeactivateEdit("herodash")}
                    className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                    title="Done editing"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>

            {activeEdits.herodash ? (
              <div className="relative">
                <input
                  ref={herodashInputRef}
                  type="text"
                  value={herodashName}
                  onChange={(e) => setHerodashName(e.target.value)}
                  placeholder="Enter HeroDash name..."
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 pr-8 text-xs text-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition shadow-2xs"
                />
                {herodashName && (
                  <button
                    type="button"
                    onClick={() => setHerodashName("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Clear"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-xs">
                <span
                  className={`truncate pr-2 select-text ${
                    herodashName ? "font-semibold text-slate-800" : "italic text-slate-400"
                  }`}
                >
                  {herodashName || "Not aligned (empty)"}
                </span>
                <button
                  type="button"
                  onClick={() => handleActivateEdit("herodash")}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-bold text-slate-600 shadow-2xs hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer shrink-0"
                  title="Edit HeroDash Name"
                >
                  <Pencil size={11} className="text-slate-400" />
                  <span>Edit</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 mt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#0b3b68] px-4 text-xs font-bold text-white shadow-xs hover:bg-[#082b4d] transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <Save size={13} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
