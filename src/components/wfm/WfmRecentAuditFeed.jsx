// Professional WFM Recent Audit Feed component with real timestamps.
import {
  ArrowRight,
  Clock,
  History,
  ShieldCheck,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function formatAuditSummary(message = "") {
  const text = String(message || "").trim();
  const match = text.match(/^(Imported|Import|Removed|Remove|Deleted|Delete|Uploaded)\b/i);

  if (!match) {
    return {
      actionWord: "Updated",
      isImport: true,
      target: text,
      fileName: null,
    };
  }

  const [actionWord] = match;
  const isImport = /^(Import|Upload)/i.test(actionWord);
  let rest = text.slice(actionWord.length).trim();

  // Pattern: "<fileName> to <TargetAccount - TargetProfile>" or "<fileName> from <TargetAccount - TargetProfile>"
  const splitMatch = rest.match(/^(.*?)\s+(?:to|from)\s+(.*?)$/i);
  if (splitMatch) {
    const fileName = splitMatch[1].trim();
    let target = splitMatch[2].trim().replace(/\.$/, "");

    // If target has "US VISA - Herodash Agent Level", clean it to just "Herodash Agent Level" or keep profile
    if (target.includes(" - ")) {
      target = target.split(" - ").slice(1).join(" - ");
    }

    return {
      actionWord: isImport ? "Imported" : "Removed",
      isImport,
      target,
      fileName,
    };
  }

  return {
    actionWord: isImport ? "Imported" : "Removed",
    isImport,
    target: rest.replace(/\.$/, ""),
    fileName: null,
  };
}

function getLogTimestamp(log) {
  const rawFormatted = log?.formattedTime || log?.formatted_time;
  if (rawFormatted) {
    return String(rawFormatted).replace(/,\s+(\d{1,2}:\d{2}\s+[AP]M)$/i, " - $1");
  }

  const rawDate = log?.timestamp || log?.createdAt || log?.created_at || log?.date;
  if (rawDate) {
    try {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        return new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).format(d).replace(/,\s+(\d{1,2}:\d{2}\s+[AP]M)$/i, " - $1");
      }
    } catch {
      // ignore
    }
  }

  return "Just now";
}

function formatUserName(name = "") {
  if (!name) return "WFM Specialist";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 2) {
    return parts
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }
  // Shorten e.g. "Paul Lorenzo Rebucas Balagat" -> "Paul Balagat"
  const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
  const last = parts[parts.length - 1].charAt(0).toUpperCase() + parts[parts.length - 1].slice(1).toLowerCase();
  return `${first} ${last}`;
}

export default function WfmRecentAuditFeed({
  logs = [],
  isLoading = false,
}) {
  const navigate = useNavigate();

  return (
    <article className="rounded-xl border border-slate-200/90 bg-white relative z-10 flex flex-col h-full shadow-2xs overflow-hidden">
      {/* Clean Header */}
      <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck size={14} className="text-slate-500 shrink-0" />
          <h3 className="m-0 text-xs sm:text-[13px] font-bold text-slate-800">
            Audit Trail
          </h3>
        </div>

        <button
          type="button"
          onClick={() => navigate("/dashboard/wfm/history-logs")}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-sibs-primary-1 hover:text-sibs-primary-2 cursor-pointer transition-colors"
        >
          <span>All Logs</span>
          <ArrowRight size={11} />
        </button>
      </div>

      {/* Content Body */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        {isLoading ? (
          <div className="space-y-2 py-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            <History className="mx-auto mb-1.5 h-6 w-6 text-slate-300" />
            No WFM audit actions recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.slice(0, 5).map((log, index) => {
              const summary = formatAuditSummary(log.message || log.action);

              return (
                <div
                  key={log.id || index}
                  className="flex items-center justify-between gap-2 py-2 px-1 hover:bg-slate-50/80 rounded-lg transition-colors -mx-1"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Action Pill Badge */}
                    <span
                      className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider ${
                        summary.isImport
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border border-rose-200 bg-rose-50 text-rose-600"
                      }`}
                    >
                      {summary.actionWord}
                    </span>

                    {/* Summary Target */}
                    <div className="min-w-0 flex-1">
                      <p className="m-0 text-xs font-bold text-slate-800 truncate">
                        {summary.target}
                      </p>

                      {/* User & Time Subtitle */}
                      <p className="m-0 text-[10px] text-slate-400 flex items-center gap-1.5 truncate">
                        <span className="font-semibold text-slate-500">
                          {formatUserName(log.userName || log.user_name)}
                        </span>
                        <span>•</span>
                        <span>{getLogTimestamp(log)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer info */}
        <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-end text-xs">
          <button
            type="button"
            onClick={() => navigate("/dashboard/wfm/history-logs")}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-sibs-primary-1 hover:text-sibs-primary-2 cursor-pointer transition-colors"
          >
            <span>Full History Logs</span>
            <ArrowRight size={11} />
          </button>
        </div>
      </div>
    </article>
  );
}
