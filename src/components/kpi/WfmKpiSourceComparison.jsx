import { AlertCircle, GitCompareArrows } from "lucide-react";

const METRIC_LABELS = {
  abandonedCalls: "Abandoned Calls",
  averageHandleSeconds: "AHT",
  callsOffered: "Calls Offered",
  handledCalls: "Handled Calls",
  serviceLevel: "Service Level",
};

const DURATION_METRICS = new Set(["averageHandleSeconds"]);
const PERCENT_METRICS = new Set(["serviceLevel"]);

function isUnavailable(value) {
  return value === null || value === undefined || value === "";
}

function formatNumber(value, digits = 2) {
  if (isUnavailable(value)) return "N/A";

  const number = Number(value);
  if (!Number.isFinite(number)) return "N/A";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(number);
}

function formatMetricValue(metric, value) {
  if (isUnavailable(value)) return "N/A";

  if (DURATION_METRICS.has(metric)) {
    return `${formatNumber(value, 0)}s`;
  }

  if (PERCENT_METRICS.has(metric)) {
    return `${formatNumber(value, 2)}%`;
  }

  return formatNumber(value, 2);
}

function formatDifference(metric, value) {
  if (isUnavailable(value)) return "N/A";

  const number = Number(value);
  if (!Number.isFinite(number)) return "N/A";
  const sign = number > 0 ? "+" : "";

  if (DURATION_METRICS.has(metric)) {
    return `${sign}${formatNumber(number, 0)}s`;
  }

  if (PERCENT_METRICS.has(metric)) {
    return `${sign}${formatNumber(number, 2)} pts`;
  }

  return `${sign}${formatNumber(number, 2)}`;
}

function getStatusLabel(status) {
  if (status === "MISSING_AGENT_DATA" || status === "MISSING_SKILL_DATA") {
    return "MISSING DATA";
  }

  return String(status || "NOT COMPARABLE").replaceAll("_", " ");
}

function getStatusClass(status) {
  if (status === "MATCH") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "DIFFERENT") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "MISSING_AGENT_DATA" || status === "MISSING_SKILL_DATA") {
    return "border-slate-200 bg-slate-50 text-slate-600";
  }

  return "border-sky-200 bg-sky-50 text-sky-700";
}

function EmptyComparison({ error }) {
  return (
    <div className="rounded-xl border border-dashed border-sibs-tertiary-9 bg-white px-5 py-7 text-center">
      <AlertCircle className="mx-auto h-7 w-7 text-sibs-tertiary-5" aria-hidden="true" />
      <p className="mt-3 mb-0 text-sm font-extrabold text-sibs-primary-1">
        KPI Source Comparison Unavailable
      </p>
      <p className="mx-auto mt-1 mb-0 max-w-xl text-sm text-sibs-tertiary-5">
        {error || "No Skill Statistics vs Agent Level comparison rows were returned for these filters."}
      </p>
    </div>
  );
}

export default function WfmKpiSourceComparison({
  comparison,
  error,
  isLoading,
}) {
  const rows = Array.isArray(comparison?.summary) ? comparison.summary : [];
  const filters = comparison?.filters || {};
  const skillFilters =
    filters.skill && typeof filters.skill === "object" ? filters.skill : {};
  const sourceSystem =
    skillFilters.sourceSystem ||
    (typeof filters.sourceSystem === "string" ? filters.sourceSystem : "") ||
    "N/A";
  const taskOrder =
    skillFilters.taskOrder ||
    (typeof filters.taskOrder === "string" ? filters.taskOrder : "") ||
    "All";
  const skillName =
    skillFilters.skill ||
    (typeof filters.skill === "string" ? filters.skill : "") ||
    "All";
  const dateFrom =
    skillFilters.dateFrom ||
    (typeof filters.dateFrom === "string" ? filters.dateFrom : "") ||
    "N/A";
  const dateTo =
    skillFilters.dateTo ||
    (typeof filters.dateTo === "string" ? filters.dateTo : "") ||
    "N/A";

  return (
    <section className="sibs-card overflow-hidden shadow-xs">
      <div className="border-b border-sibs-tertiary-10 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <GitCompareArrows size={16} className="text-sibs-primary-1" aria-hidden="true" />
          <h2 className="m-0 text-sm font-extrabold uppercase tracking-wide text-sibs-primary-1">
            KPI Source Comparison
          </h2>
        </div>
        <p className="mt-1 mb-0 text-xs text-sibs-tertiary-5">
          Skill Statistics and Agent Level are compared with the same source, Task Order, skill, date range, and reporting period filters.
        </p>
      </div>

      <div className="px-4 py-2 text-[10px] font-semibold text-sibs-tertiary-5">
        <span>Source: {sourceSystem}</span>
        <span className="mx-2">|</span>
        <span>Task Order: {taskOrder}</span>
        <span className="mx-2">|</span>
        <span>Skill: {skillName}</span>
        <span className="mx-2">|</span>
        <span>Range: {dateFrom} to {dateTo}</span>
      </div>

      {isLoading ? (
        <div className="p-4 text-sm font-semibold text-sibs-tertiary-5">
          Loading KPI source comparison...
        </div>
      ) : null}

      {!isLoading && (error || !rows.length) ? (
        <div className="p-4">
          <EmptyComparison error={error} />
        </div>
      ) : null}

      {!isLoading && !error && rows.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-sibs-primary-3/50 text-xs uppercase text-sibs-tertiary-6">
              <tr>
                <th className="px-4 py-3 font-bold">Metric</th>
                <th className="px-4 py-3 font-bold">Skill Stats</th>
                <th className="px-4 py-3 font-bold">Agent Level</th>
                <th className="px-4 py-3 font-bold">Difference</th>
                <th className="px-4 py-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sibs-tertiary-10">
              {rows.map((row) => (
                <tr key={`${row.scope || "summary"}-${row.metric}`} className="bg-white">
                  <td className="px-4 py-3 font-bold text-sibs-primary-1">
                    {METRIC_LABELS[row.metric] || row.metric}
                  </td>
                  <td className="px-4 py-3 text-sibs-tertiary-5">
                    {formatMetricValue(row.metric, row.skillValue)}
                  </td>
                  <td className="px-4 py-3 text-sibs-tertiary-5">
                    {formatMetricValue(row.metric, row.agentValue)}
                  </td>
                  <td className="px-4 py-3 text-sibs-tertiary-5">
                    {formatDifference(row.metric, row.difference)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${getStatusClass(row.status)}`}>
                      {getStatusLabel(row.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

export {
  formatDifference,
  formatMetricValue,
  getStatusLabel,
};
