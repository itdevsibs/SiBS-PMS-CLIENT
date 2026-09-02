import {
  BarChart3,
  Clock,
  Clock3,
  Headphones,
  PauseCircle,
  PhoneCall,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";

import AgentKpiDetail from "@/components/agent/AgentKpiDetail";
import { formatNumber, formatSeconds } from "@/components/agent/AgentPerformanceDashboard";
import WfmKpiDatePicker from "@/components/workForceManagement/kpi/WfmKpiDatePicker";

const PERIOD_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
  { value: "custom", label: "Custom" },
];

function formatPercent(value) {
  if (value === null || value === undefined || value === "") return "N/A";

  const number = Number(value);
  if (!Number.isFinite(number)) return "N/A";

  return `${formatNumber(number)}%`;
}

function MetricTile({ icon: Icon, label, value, subtitle }) {
  return (
    <div className="min-w-0 rounded-xl border border-sibs-tertiary-10 bg-white p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-[10px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
            {label}
          </p>
          <p className="mt-2 mb-0 break-words text-2xl font-black leading-none text-sibs-primary-1">
            {value}
          </p>
          {subtitle ? (
            <p className="mt-1 mb-0 text-xs text-sibs-tertiary-5">
              {subtitle}
            </p>
          ) : null}
        </div>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sky-100 bg-sky-50 text-sky-700">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

function EmptyPanel({ title, message }) {
  return (
    <div className="rounded-xl border border-dashed border-sibs-tertiary-9 bg-white px-5 py-8 text-center">
      <BarChart3 className="mx-auto h-8 w-8 text-sibs-tertiary-5" aria-hidden="true" />
      <p className="mt-3 mb-0 text-sm font-extrabold text-sibs-primary-1">
        {title}
      </p>
      <p className="mx-auto mt-1 mb-0 max-w-xl text-sm text-sibs-tertiary-5">
        {message}
      </p>
    </div>
  );
}

function FilterBar({ filters, isLoading, onFilterChange, onRefresh }) {
  const isCustom = filters.period === "custom";

  return (
    <section className="sibs-card relative z-40 overflow-visible shadow-xs">
      <div className="border-b border-sibs-tertiary-10 bg-sibs-primary-3/30 px-3.5 py-1.5">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-sibs-primary-1" />
          <h1 className="m-0 text-sm font-extrabold text-sibs-primary-1">
            Team Leader Performance
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2.5 p-3">
        {/* 1. Reporting Period */}
        <label className="block w-44">
          <span className="mb-0.5 block text-[9.5px] font-extrabold uppercase text-sibs-tertiary-5">
            Reporting Period
          </span>
          <select
            value={filters.period}
            onChange={(event) =>
              onFilterChange({
                period: event.target.value,
                referenceDate: "",
                from: "",
                to: "",
              })
            }
            className="h-8 w-full cursor-pointer rounded-lg border border-sibs-tertiary-8 bg-white px-2.5 text-xs font-semibold text-sibs-primary-1 outline-none transition hover:border-sibs-primary-1 hover:bg-slate-50/50 focus:border-sibs-primary-1 focus:ring-1 focus:ring-sibs-primary-1/20"
            aria-label="Reporting period"
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {/* 2. Reference Date (or From + To) */}
        {isCustom ? (
          <>
            <div className="w-44">
              <WfmKpiDatePicker
                label="From"
                value={filters.from}
                onChange={(from) => onFilterChange({ from: from || "" })}
                disabled={isLoading}
              />
            </div>
            <div className="w-44">
              <WfmKpiDatePicker
                label="To"
                value={filters.to}
                onChange={(to) => onFilterChange({ to: to || "" })}
                disabled={isLoading}
              />
            </div>
          </>
        ) : (
          <>
            <div className="w-44">
              <WfmKpiDatePicker
                label="Reference Date"
                value={filters.referenceDate}
                onChange={(referenceDate) =>
                  onFilterChange({ referenceDate: referenceDate || "" })
                }
                disabled={isLoading}
              />
            </div>
            <div>
              <button
                type="button"
                onClick={() => onFilterChange({ referenceDate: "" })}
                disabled={isLoading}
                title="Use the latest available date."
                className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-sibs-primary-1 shadow-xs transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Clock size={12} className="shrink-0" />
                <span>Latest</span>
              </button>
            </div>
          </>
        )}

        <div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-sibs-primary-1 px-3.5 text-xs font-bold text-white shadow-xs transition hover:bg-sibs-tertiary-4 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 border-t border-sibs-tertiary-10 px-3.5 py-1 text-[10px] font-semibold text-sibs-tertiary-5">
        <span>Source: Agent Level Interactions & Team Leader Scopes</span>
        <span>Period: {PERIOD_OPTIONS.find((opt) => opt.value === filters.period)?.label || filters.period}</span>
        {filters.referenceDate && !isCustom ? <span>Reference date: {filters.referenceDate}</span> : null}
        {filters.from && filters.to && isCustom ? <span>Range: {filters.from} to {filters.to}</span> : null}
      </div>
    </section>
  );
}

function OperationalContext({ context, error }) {
  const summary = context?.summary || {};

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="m-0 text-sm font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
            Operational / Queue Context
          </p>
          <p className="mt-1 mb-0 text-sm text-sibs-tertiary-5">
            Skill Statistics queue metrics for the selected reporting window.
          </p>
        </div>
      </div>

      {error && !context ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm text-sibs-tertiary-5">
          Queue context: N/A
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetricTile
          icon={ShieldCheck}
          label="Service Level"
          value={formatPercent(summary.serviceLevelPct)}
        />
        <MetricTile
          icon={PhoneCall}
          label="Answer Rate"
          value={formatPercent(summary.answerRatePct)}
        />
        <MetricTile
          icon={PhoneCall}
          label="Calls Offered"
          value={formatNumber(summary.callsOffered)}
        />
        <MetricTile
          icon={Clock3}
          label="Queue AHT"
          value={formatSeconds(summary.ahtSeconds)}
        />
        <MetricTile
          icon={BarChart3}
          label="Abandonment"
          value="N/A"
        />
      </div>
    </section>
  );
}

function TeamSummary({ summary = {}, agentCount = 0 }) {
  return (
    <section className="rounded-xl border border-sibs-tertiary-10 bg-white p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700">
          <Users className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="m-0 text-sm font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
            Team / Individual Agent Performance
          </p>
          <p className="mt-1 mb-0 text-sm text-sibs-tertiary-5">
            Agent Level metrics for agents in your backend-authorized scope.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <MetricTile
          icon={Users}
          label="Agent Count"
          value={formatNumber(agentCount)}
        />
        <MetricTile
          icon={PhoneCall}
          label="Team Handled"
          value={formatNumber(summary.handledCalls)}
        />
        <MetricTile
          icon={Clock3}
          label="Team AHT"
          value={formatSeconds(summary.averageHandleSeconds)}
        />
        <MetricTile
          icon={Headphones}
          label="Talk Time"
          value={formatSeconds(summary.totalTalkSeconds)}
        />
        <MetricTile
          icon={PauseCircle}
          label="Hold Time"
          value={formatSeconds(summary.totalHoldSeconds)}
        />
        <MetricTile
          icon={PauseCircle}
          label="Hold Count"
          value={formatNumber(summary.holdCount)}
        />
      </div>
    </section>
  );
}

function AgentTable({ agents = [], selectedAgentUid, onSelectAgent }) {
  if (!agents.length) {
    return (
      <EmptyPanel
        title="No scoped agents returned"
        message="No Agent Level rows were returned for your team and selected reporting range."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-sibs-tertiary-10 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-sibs-primary-3/50 text-xs uppercase text-sibs-tertiary-6">
            <tr>
              <th className="px-4 py-3 font-bold">Agent</th>
              <th className="px-4 py-3 font-bold">Handled Calls</th>
              <th className="px-4 py-3 font-bold">AHT</th>
              <th className="px-4 py-3 font-bold">Talk Time</th>
              <th className="px-4 py-3 font-bold">Hold Time</th>
              <th className="px-4 py-3 font-bold">Hold Count</th>
              <th className="px-4 py-3 font-bold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sibs-tertiary-10">
            {agents.map((agent) => {
              const kpis = agent.kpis || {};
              const isSelected = selectedAgentUid === agent.employeeUid;

              return (
                <tr key={agent.employeeUid || agent.label} className={isSelected ? "bg-sky-50" : "bg-white"}>
                  <td className="px-4 py-3 font-bold text-sibs-primary-1">
                    {agent.label || agent.employeeUid || "Unmapped"}
                  </td>
                  <td className="px-4 py-3 text-sibs-tertiary-5">
                    {formatNumber(kpis.handledCalls)}
                  </td>
                  <td className="px-4 py-3 text-sibs-tertiary-5">
                    {formatSeconds(kpis.averageHandleSeconds)}
                  </td>
                  <td className="px-4 py-3 text-sibs-tertiary-5">
                    {formatSeconds(kpis.totalTalkSeconds)}
                  </td>
                  <td className="px-4 py-3 text-sibs-tertiary-5">
                    {formatSeconds(kpis.totalHoldSeconds)}
                  </td>
                  <td className="px-4 py-3 text-sibs-tertiary-5">
                    {formatNumber(kpis.holdCount)}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      type="button"
                      variant={isSelected ? "outline" : "default"}
                      onClick={() => onSelectAgent(isSelected ? "" : agent.employeeUid)}
                      className="h-8 rounded-lg px-3 text-xs font-bold"
                    >
                      {isSelected ? "Close" : "Drill In"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TeamLeaderPerformanceDashboard({
  error,
  filters,
  isLoading,
  isLoadingAgent,
  operationalContext,
  operationalError,
  onFilterChange,
  onRefresh,
  onSelectAgent,
  selectedAgentData,
  selectedAgentUid,
  teamData,
}) {
  const agents = teamData?.agents || [];
  const summary = teamData?.summary || {};

  return (
    <div className="space-y-4">
      <FilterBar
        filters={filters}
        isLoading={isLoading}
        onFilterChange={onFilterChange}
        onRefresh={onRefresh}
      />

      {error ? (
        <EmptyPanel title="Unable to load team performance" message={error} />
      ) : null}

      <OperationalContext
        context={operationalContext}
        error={operationalError}
      />

      <TeamSummary
        summary={summary}
        agentCount={agents.length}
      />

      <AgentTable
        agents={agents}
        selectedAgentUid={selectedAgentUid}
        onSelectAgent={onSelectAgent}
      />

      <AgentKpiDetail
        data={selectedAgentData}
        isLoading={isLoadingAgent}
      />
    </div>
  );
}
