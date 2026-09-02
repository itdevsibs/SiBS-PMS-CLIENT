import {
  Clock3,
  Headphones,
  PauseCircle,
  PhoneCall,
} from "lucide-react";

import { formatNumber, formatSeconds } from "@/components/agent/AgentPerformanceDashboard";

function DetailMetric({ icon: Icon, label, value }) {
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
        </div>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sky-100 bg-sky-50 text-sky-700">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

function EmptyDetail({ title, message }) {
  return (
    <div className="rounded-xl border border-dashed border-sibs-tertiary-9 bg-white px-5 py-8 text-center">
      <p className="m-0 text-sm font-extrabold text-sibs-primary-1">
        {title}
      </p>
      <p className="mx-auto mt-1 mb-0 max-w-xl text-sm text-sibs-tertiary-5">
        {message}
      </p>
    </div>
  );
}

export default function AgentKpiDetail({
  data,
  isLoading,
  title = "Agent Drilldown",
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-sibs-tertiary-10 bg-white p-4 text-sm font-semibold text-sibs-tertiary-5">
        Loading selected agent...
      </div>
    );
  }

  if (!data) return null;

  if (data.error) {
    return (
      <EmptyDetail
        title="Agent drilldown unavailable"
        message={data.error}
      />
    );
  }

  const agent = data.agents?.[0];
  const kpis = agent?.kpis || data.summary || data.performance?.summary || {};

  return (
    <section className="rounded-xl border border-sibs-tertiary-10 bg-white p-4 shadow-xs">
      <p className="m-0 text-sm font-extrabold text-sibs-primary-1">
        {title}
      </p>
      <p className="mt-1 mb-0 text-xs text-sibs-tertiary-5">
        {agent?.label || agent?.employeeUid || "Selected agent"}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <DetailMetric icon={PhoneCall} label="Handled" value={formatNumber(kpis.handledCalls)} />
        <DetailMetric icon={Clock3} label="AHT" value={formatSeconds(kpis.averageHandleSeconds)} />
        <DetailMetric icon={Headphones} label="Talk Time" value={formatSeconds(kpis.totalTalkSeconds)} />
        <DetailMetric icon={PauseCircle} label="Hold Time" value={formatSeconds(kpis.totalHoldSeconds)} />
      </div>
    </section>
  );
}
