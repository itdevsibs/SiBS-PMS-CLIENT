import { Users, CalendarDays, UserCheck, UserX, CalendarOff, CalendarClock } from "lucide-react";

const CARDS = [
  { key: "all", field: "totalEmployees", label: "Total Employees", Icon: Users, tone: "text-slate-700 bg-slate-100" },
  { key: "scheduled", field: "scheduledToWork", label: "Scheduled to Work", Icon: CalendarDays, tone: "text-sky-700 bg-sky-50" },
  { key: "present", field: "present", label: "Present", Icon: UserCheck, tone: "text-emerald-700 bg-emerald-50" },
  { key: "absent", field: "absent", label: "Absent", Icon: UserX, tone: "text-rose-700 bg-rose-50" },
  { key: "plannedLeave", field: "plannedLeave", label: "Planned Leave", Icon: CalendarDays, tone: "text-indigo-700 bg-indigo-50" },
  { key: "unplannedLeave", field: "unplannedLeave", label: "Unplanned Leave", Icon: CalendarClock, tone: "text-amber-700 bg-amber-50" },
  { key: "restDay", field: "restDay", label: "Rest Day", Icon: CalendarOff, tone: "text-slate-600 bg-slate-100" },
  { key: "noSchedule", field: "noSchedule", label: "No Schedule", Icon: CalendarClock, tone: "text-amber-700 bg-amber-50" },
];

const number = (value) => value == null ? "—" : Number(value).toLocaleString("en-US");
const rate = (value) => value == null ? "—" : `${Number(value).toFixed(2)}%`;

export default function AttendanceSummaryCards({ summary, activeFilter = "all", onFilterChange, loading = false, progressive = false }) {
  const toggle = (key) => onFilterChange(activeFilter === key ? "all" : key);
  const selected = (key) => activeFilter === key;

  return (
    <section aria-label="Attendance summary cards" aria-busy={loading || progressive} className="shrink-0">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 2xl:grid-cols-8">
        {CARDS.map(({ key, field, label, Icon, tone }) => (
          <button
            key={key}
            type="button"
            aria-pressed={selected(key)}
            disabled={!summary || (key !== "all" && summary[field] == null)}
            onClick={() => toggle(key)}
            className={`min-w-0 rounded-lg border bg-white p-2 text-left transition focus-visible:outline-2 focus-visible:outline-sky-600 disabled:cursor-default ${selected(key) ? "border-sky-500 ring-1 ring-sky-500/20" : "border-slate-200 hover:border-sky-300 hover:bg-slate-50"}`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${tone}`}><Icon size={14} aria-hidden="true" /></span>
              <span className="text-[10px] font-bold leading-tight uppercase text-slate-500">{label}</span>
            </div>
            {(progressive || loading) && summary?.[field] == null ? (
              <div role="status" aria-label={`Loading ${label}`} className="mt-1 h-6 w-12 animate-pulse rounded bg-slate-200" />
            ) : (
              <div className={`mt-1 text-xl font-extrabold leading-tight tabular-nums ${tone.split(" ")[0]}`}>{number(summary?.[field])}</div>
            )}
            {key === "present" && summary?.present != null && <div className="mt-0.5 text-[10px] text-slate-500">{rate(summary?.attendanceRate)} scheduled rate</div>}
            {key === "absent" && summary?.absent != null && <div className="mt-0.5 text-[10px] text-slate-500">{rate(summary?.absenceRate)} scheduled rate</div>}
          </button>
        ))}
      </div>
    </section>
  );
}
