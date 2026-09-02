import {
  BarChart3,
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
import { Button } from "@/components/ui/button";

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
    <div className="rounded-xl border border-sibs-tertiary-10 bg-white p-4 shadow-xs">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="m-0 text-lg font-black text-sibs-primary-1">
            Team Leader Performance
          </p>
          <p className="mt-1 mb-0 text-sm text-sibs-tertiary-5">
            Queue context and Agent Level performance are shown separately.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-[150px_150px_150px_auto]">
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
            className="form-input h-10 rounded-lg py-0 text-sm"
            aria-label="Reporting period"
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {isCustom ? (
            <>
              <input
                type="date"
                value={filters.from}
                onChange={(event) => onFilterChange({ from: event.target.value })}
                className="form-input h-10 rounded-lg py-0 text-sm"
                aria-label="From date"
              />
              <input
                type="date"
                value={filters.to}
                onChange={(event) => onFilterChange({ to: event.target.value })}
                className="form-input h-10 rounded-lg py-0 text-sm"
                aria-label="To date"
              />
            </>
          ) : (
            <>
              <input
                type="date"
                value={filters.referenceDate}
                onChange={(event) => onFilterChange({ referenceDate: event.target.value })}
                className="form-input h-10 rounded-lg py-0 text-sm"
                aria-label="Reference date"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => onFilterChange({ referenceDate: "" })}
                className="h-10 rounded-lg px-3 text-xs font-bold"
              >
                Latest
              </Button>
            </>
          )}

          <Button
            type="button"
            onClick={onRefresh}
            className="h-10 rounded-lg bg-sibs-primary-1 px-3 text-white hover:bg-sibs-tertiary-4"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </div>
    </div>
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
