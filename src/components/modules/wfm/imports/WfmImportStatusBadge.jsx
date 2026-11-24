import { getImportDisplayStatus } from "@/lib/wfm-import-utils";

export default function WfmImportStatusBadge({ upload, onView, className = "" }) {
  const { label, tone } = getImportDisplayStatus(upload);
  const colors = tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : tone === "danger" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-amber-200 bg-amber-50 text-amber-700";
  const classes = `inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${colors} ${className}`;
  return onView ? <button type="button" className={`${classes} cursor-pointer hover:brightness-95`} title="Open batch details" onClick={() => onView(upload)}>{label}</button> : <span className={classes}>{label}</span>;
}
