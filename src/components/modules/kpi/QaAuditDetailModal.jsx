import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, ClipboardCheck, Loader2, X } from "lucide-react";
import { getQualityAuditRowDetail } from "@/lib/axios/kpis";

function normalizeQaScorePct(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return 0;
  return num > 0 && num <= 1 ? num * 100 : num;
}

function formatScorePct(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return "0.00%";
  return `${num.toFixed(2)}%`;
}

function formatDisplayDate(raw) {
  if (!raw || raw === "—") return "—";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return String(raw);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function cleanVal(val) {
  if (val === null || val === undefined) return "—";
  const str = typeof val === "object" ? JSON.stringify(val) : String(val).trim();
  return str === "" ? "—" : str;
}

function pickField(raw, candidates = []) {
  if (!raw || typeof raw !== "object") return "—";
  const entries = Object.entries(raw);
  for (const candidate of candidates) {
    const target = candidate.toLowerCase();
    const exact = entries.find(([k]) => k.trim().toLowerCase() === target);
    if (exact && cleanVal(exact[1]) !== "—") return cleanVal(exact[1]);
  }
  for (const candidate of candidates) {
    const target = candidate.toLowerCase();
    const partial = entries.find(([k]) => k.trim().toLowerCase().includes(target));
    if (partial && cleanVal(partial[1]) !== "—") return cleanVal(partial[1]);
  }
  return "—";
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "ratings", label: "Ratings" },
  { id: "findings", label: "Findings" },
  { id: "auditInfo", label: "Audit Info" },
];

export default function QaAuditDetailModal({
  audit,
  periodLabel = null,
  targetQaPct = 90,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [ratingsGroup, setRatingsGroup] = useState("all");
  const [ratingsPage, setRatingsPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!audit?.id) return undefined;
    let isCancelled = false;
    setActiveTab("overview");
    setRatingsGroup("all");
    setRatingsPage(1);
    setIsLoading(true);
    setError(null);

    getQualityAuditRowDetail(audit.id)
      .then((res) => {
        if (!isCancelled) setDetail(res?.data || res || null);
      })
      .catch((err) => {
        if (!isCancelled) {
          setDetail(null);
          setError(err?.response?.data?.message || err?.message || "Failed to load audit details.");
        }
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [audit?.id]);

  const raw = detail?.rowJson && typeof detail.rowJson === "object" ? detail.rowJson : {};

  const parsed = useMemo(() => {
    const entries = Object.entries(raw).map(([key, value]) => ({
      key: key.trim(),
      keyLower: key.trim().toLowerCase(),
      value: cleanVal(value),
      rawValue: value,
    }));

    // 1. Performance Components (decimal/numeric category weights)
    const componentNames = [
      "compliance",
      "issue resolution",
      "communication",
      "policy and process",
      "call and email handling",
      "data protection and information security",
    ];
    const components = [];
    for (const compName of componentNames) {
      const match = entries.find(
        (e) =>
          e.keyLower === compName ||
          (e.keyLower.includes(compName) && !e.keyLower.includes("critical") && !/^\d+\.\d+/.test(e.keyLower)),
      );
      if (match) {
        const num = Number(match.rawValue);
        components.push({
          label: match.key,
          displayValue: match.value,
          pct: Number.isFinite(num) ? (num <= 1 ? Math.max(0, Math.min(100, num * 100)) : Math.max(0, Math.min(100, num))) : 0,
        });
      }
    }

    // 2. Ratings (numbered criteria like 1.1, 1.2, 2.1, 3.2, etc.)
    const ratings = entries
      .filter((e) => /^\d+\.\d+\b/.test(e.keyLower))
      .map((e) => {
        const match = /^(\d+\.\d+)\s*(.*)$/.exec(e.key);
        const code = match ? match[1] : "";
        const criterion = match ? match[2] : e.key;
        return {
          code,
          criterion: criterion || e.key,
          value: e.value,
        };
      })
      .sort((a, b) => {
        const [aMaj, aMin] = a.code.split(".").map(Number);
        const [bMaj, bMin] = b.code.split(".").map(Number);
        return aMaj - bMaj || aMin - bMin;
      });

    // 3. Findings & Recommendations (exclude per-criterion "Remark 1.1" / empty / #REF! noise)
    const findings = entries.filter((e) => {
      if (/^\d+\.\d+\b/.test(e.keyLower)) return false;
      if (/^remark\s*\d+\.\d+/i.test(e.keyLower)) return false;
      const isFindingKey =
        e.keyLower.includes("finding") ||
        e.keyLower.includes("recommendation") ||
        e.keyLower.includes("comment") ||
        e.keyLower.includes("feedback") ||
        e.keyLower.includes("coaching") ||
        e.keyLower.includes("note") ||
        e.keyLower.includes("summary") ||
        (e.keyLower.includes("remark") && e.value !== "—" && !/^#ref!?$/i.test(e.value));
      if (!isFindingKey) return false;
      if (/^#ref!?$/i.test(e.value)) return false;
      return true;
    });

    // 4. Critical Indicators
    const criticalNames = [
      "Caller Impacting Critical",
      "Business Impacting Critical",
      "Compliance Impacting Critical",
    ];
    const criticalIndicators = criticalNames.map((label) => ({
      label,
      value: pickField(raw, [label]),
    }));

    return { components, ratings, findings, criticalIndicators };
  }, [raw]);

  if (!audit) return null;

  const scorePct = normalizeQaScorePct(audit.totalAuditScore);
  const sibsId = pickField(raw, ["sibs - id", "sibs id"]) !== "—" ? pickField(raw, ["sibs - id", "sibs id"]) : audit.sibsId || "—";
  const agentName = pickField(raw, ["agent name"]) !== "—" ? pickField(raw, ["agent name"]) : audit.agentName || "—";
  const auditType = pickField(raw, ["audit type"]) !== "—" ? pickField(raw, ["audit type"]) : audit.auditType || "—";
  const auditWeek = pickField(raw, ["audit week"]) !== "—" ? pickField(raw, ["audit week"]) : audit.auditWeek || periodLabel || "—";
  const auditDate = audit.auditDate ? formatDisplayDate(audit.auditDate) : pickField(raw, ["audit date"]);

  const summaryFields = [
    { label: "Agent Name", value: agentName },
    { label: "SiBS ID", value: sibsId },
    { label: "Site", value: pickField(raw, ["site", "location"]) },
    { label: "Phase", value: pickField(raw, ["phase"]) !== "—" ? pickField(raw, ["phase"]) : audit.phase || "—" },
    { label: "LOB", value: pickField(raw, ["lob"]) !== "—" ? pickField(raw, ["lob"]) : audit.lob || "—" },
    { label: "Country", value: pickField(raw, ["country"]) !== "—" ? pickField(raw, ["country"]) : audit.country || "—" },
    { label: "Category", value: pickField(raw, ["category"]) },
    { label: "Task Order", value: pickField(raw, ["task order"]) !== "—" ? pickField(raw, ["task order"]) : audit.taskOrderId || "—" },
  ];

  const auditInfoFields = [
    { label: "Auditor's Name", value: pickField(raw, ["auditor full name", "auditor's name", "auditor name"]) },
    { label: "Trainer Name", value: pickField(raw, ["trainer name", "trainer"]) },
    { label: "Transaction Date", value: pickField(raw, ["transaction date"]) },
    { label: "Audit Month", value: pickField(raw, ["audit month"]) },
    { label: "Audit Year", value: pickField(raw, ["audit year"]) },
    { label: "Call/Case ID", value: pickField(raw, ["call/case id", "call case id"]) !== "—" ? pickField(raw, ["call/case id", "call case id"]) : audit.callCaseId || "—" },
    { label: "Sub Category", value: pickField(raw, ["sub category", "subcategory"]) },
    { label: "Tenurity", value: pickField(raw, ["tenurity", "tenure"]) },
    { label: "Auditor Role", value: pickField(raw, ["auditor role"]) },
    { label: "Auditor Email", value: pickField(raw, ["auditor email"]) },
    { label: "Auditor Skype", value: pickField(raw, ["auditor skype"]) },
    { label: "Auditor Mobile", value: pickField(raw, ["auditor mobile"]) },
  ];

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex h-[80vh] max-h-[760px] w-[91vw] max-w-[1360px] flex-col overflow-hidden border border-[#103B63] bg-white shadow-2xl">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b-2 border-[#F28C28] bg-[#103B63] px-6 py-3.5 text-white">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <ClipboardCheck size={17} className="shrink-0 text-white" />
              <h3 className="m-0 truncate text-base font-black tracking-wide text-white">
                Quality Audit Details
              </h3>
            </div>
            <p className="m-0 mt-0.5 truncate text-xs text-white/80">
              {sibsId} &middot; {agentName} &middot; {auditType}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded text-white/85 hover:bg-white/15 hover:text-white cursor-pointer"
            aria-label="Close audit details"
          >
            <X size={18} />
          </button>
        </div>

        {/* Top 3 KPI Summary Strip */}
        <div className="shrink-0 grid grid-cols-3 gap-4 border-b border-slate-200 bg-white px-6 py-3.5">
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Audit Score</div>
            <div className={`mt-0.5 text-xl font-black tabular-nums ${scorePct >= targetQaPct ? "text-[#103B63]" : "text-amber-600"}`}>
              {formatScorePct(scorePct)}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Audit Week</div>
            <div className="mt-0.5 text-xl font-black text-slate-900">
              {String(auditWeek).toLowerCase().startsWith("week") ? auditWeek : `Week ${auditWeek}`}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Audit Date</div>
            <div className="mt-0.5 text-xl font-black text-slate-900">{auditDate}</div>
          </div>
        </div>

        {/* 4 Box Tabs */}
        <div className="shrink-0 flex items-center border-b border-slate-200 bg-white px-6 py-2.5">
          <div className="inline-flex items-center gap-1 rounded border border-slate-300 bg-slate-100 p-0.5">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded px-4 py-1 text-xs font-bold transition-colors cursor-pointer ${
                    isActive
                      ? "bg-[#103B63] text-white shadow-2xs"
                      : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 bg-white">
          {isLoading ? (
            <div className="flex h-full items-center justify-center gap-2 text-xs font-semibold text-slate-500">
              <Loader2 size={16} className="animate-spin text-[#103B63]" />
              <span>Loading audit details...</span>
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex items-center gap-2 rounded border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          ) : activeTab === "overview" ? (
            <div className="flex h-full flex-col justify-between gap-4">
              {/* Employee & Audit Summary — 4-column compact card grid */}
              <section className="rounded border border-slate-200 bg-slate-50/40 p-4">
                <h4 className="m-0 mb-3 text-xs font-black uppercase tracking-wider text-[#103B63]">
                  Employee &amp; Audit Summary
                </h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {summaryFields.map(({ label, value }) => (
                    <div key={label} className="rounded border border-slate-200/80 bg-white px-3.5 py-2.5 shadow-2xs">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {label}
                      </div>
                      <div className="mt-1 truncate text-sm font-bold text-slate-900" title={value}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Performance Components — 2-column balanced grid */}
              <section className="flex-1 rounded border border-slate-200 bg-slate-50/40 p-4 flex flex-col justify-between">
                <div className="flex items-baseline justify-between gap-2 mb-3">
                  <h4 className="m-0 text-xs font-black uppercase tracking-wider text-[#103B63]">
                    Performance Components
                  </h4>
                  <span className="text-[11px] font-medium text-slate-400">
                    Source values, displayed without recalculation
                  </span>
                </div>
                {parsed.components.length > 0 ? (
                  <div className="grid flex-1 grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 content-center">
                    {parsed.components.map((comp) => (
                      <div key={comp.label} className="rounded border border-slate-200/80 bg-white px-3.5 py-2.5 shadow-2xs space-y-1.5">
                        <div className="flex items-baseline justify-between gap-2 text-xs">
                          <span className="font-bold text-slate-800">{comp.label}</span>
                          <span className="font-black text-[#103B63] tabular-nums">{comp.displayValue}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#2f6f9f]"
                            style={{ width: `${comp.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="m-0 text-xs text-slate-400">No component scores found in this record.</p>
                )}
              </section>
            </div>
          ) : activeTab === "ratings" ? (
            (() => {
              const ratingGroups = Array.from(
                new Set(parsed.ratings.map((r) => r.code.split(".")[0]).filter(Boolean)),
              ).sort((a, b) => Number(a) - Number(b));

              const filteredRatings =
                ratingsGroup === "all"
                  ? parsed.ratings
                  : parsed.ratings.filter((r) => r.code.startsWith(`${ratingsGroup}.`));

              const ratingsPageSize = 8;
              const totalRatingsPages = Math.max(1, Math.ceil(filteredRatings.length / ratingsPageSize));
              const safeRatingsPage = Math.min(ratingsPage, totalRatingsPages);
              const startIdx = (safeRatingsPage - 1) * ratingsPageSize;
              const pageRatings = filteredRatings.slice(startIdx, startIdx + ratingsPageSize);

              return (
                <div className="flex h-full min-h-0 flex-col gap-3">
                  <div className="shrink-0 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="m-0 text-xs font-black uppercase tracking-wider text-[#103B63]">
                        Audit Ratings ({filteredRatings.length})
                      </h4>
                      <p className="m-0 mt-0.5 text-[11px] text-slate-500">
                        Grouped by rating code
                      </p>
                    </div>

                    {ratingGroups.length > 1 ? (
                      <div className="inline-flex items-center gap-1 rounded border border-slate-300 bg-slate-100 p-0.5">
                        <button
                          type="button"
                          onClick={() => setRatingsGroup("all")}
                          className={`rounded px-2.5 py-0.5 text-[11px] font-bold transition-colors cursor-pointer ${
                            ratingsGroup === "all"
                              ? "bg-[#103B63] text-white"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          All
                        </button>
                        {ratingGroups.map((grp) => (
                          <button
                            key={grp}
                            type="button"
                            onClick={() => setRatingsGroup(grp)}
                            className={`rounded px-2.5 py-0.5 text-[11px] font-bold transition-colors cursor-pointer ${
                              ratingsGroup === grp
                                ? "bg-[#103B63] text-white"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            {grp}.x
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto rounded border border-slate-200 bg-white">
                    {filteredRatings.length > 0 ? (
                      <table className="w-full border-collapse text-left text-xs">
                        <thead className="sticky top-0 z-10 bg-[#103B63]">
                          <tr className="border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-white">
                            <th className="px-3 py-2 w-16">Code</th>
                            <th className="px-3 py-2">Criterion</th>
                            <th className="px-3 py-2 text-right w-48">Rating / Result</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredRatings.map((item, idx) => {
                            const lower = item.value.toLowerCase();
                            const badgeClass =
                              lower.includes("meets") || lower.includes("exceeds") || lower === "yes" || lower === "pass"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : lower.includes("does not") || lower.includes("needs improvement") || lower === "no" || lower === "fail"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-slate-100 text-slate-600 border-slate-200";

                            return (
                              <tr
                                key={`${item.code}-${item.criterion}`}
                                className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                              >
                                <td className="px-3 py-2 font-mono font-bold text-[#103B63] align-middle">
                                  {item.code}
                                </td>
                                <td className="px-3 py-2 font-semibold text-slate-800 align-middle">
                                  {item.criterion}
                                </td>
                                <td className="px-3 py-2 text-right align-middle whitespace-nowrap">
                                  <span className={`inline-block rounded border px-2 py-0.5 text-[11px] font-bold ${badgeClass}`}>
                                    {item.value}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400">
                        No numbered rating criteria found in this record.
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          ) : activeTab === "findings" ? (
            <div className="flex h-full min-h-0 flex-col gap-4">
              {/* Findings & Recommendations */}
              <section className="flex-1 min-h-0 flex flex-col overflow-hidden rounded border border-slate-200 bg-slate-50/40 p-4">
                <h4 className="shrink-0 m-0 mb-3 text-xs font-black uppercase tracking-wider text-[#103B63]">
                  Findings &amp; Recommendations
                </h4>
                {parsed.findings.length > 0 ? (
                  <div className={`flex-1 min-h-0 overflow-y-auto grid gap-3 content-start ${parsed.findings.length > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
                    {parsed.findings.map((item) => (
                      <div key={item.key} className="flex flex-col rounded border border-slate-200/80 bg-white px-4 py-3 shadow-2xs">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {item.key}
                        </div>
                        <div className="mt-1.5 whitespace-pre-wrap break-words text-sm font-semibold leading-relaxed text-slate-800">
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center rounded border border-dashed border-slate-200 bg-white text-xs font-semibold text-slate-400">
                    No findings or recommendations recorded.
                  </div>
                )}
              </section>

              {/* Critical Indicators */}
              <section className="shrink-0 rounded border border-slate-200 bg-slate-50/40 p-4">
                <h4 className="m-0 mb-3 text-xs font-black uppercase tracking-wider text-[#103B63]">
                  Critical Indicators
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {parsed.criticalIndicators.map((ind) => (
                    <div key={ind.label} className="rounded border border-slate-200/80 bg-white px-3.5 py-2.5 shadow-2xs">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {ind.label}
                      </div>
                      <div className="mt-1 text-sm font-black text-[#103B63]">
                        {ind.value}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <section className="flex-1 rounded border border-slate-200 bg-slate-50/40 p-4 flex flex-col">
                <h4 className="m-0 mb-3 text-xs font-black uppercase tracking-wider text-[#103B63]">
                  Audit Metadata
                </h4>
                <div className="grid flex-1 grid-cols-2 lg:grid-cols-3 gap-3 content-start">
                  {auditInfoFields.map(({ label, value }) => (
                    <div key={label} className="rounded border border-slate-200/80 bg-white px-3.5 py-2.5 shadow-2xs">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {label}
                      </div>
                      <div className="mt-1 truncate text-sm font-bold text-slate-900" title={value}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
