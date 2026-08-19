import { CheckCircle2, Clock3, Gauge, PhoneCall } from "lucide-react";

function formatNumber(value, digits = 0) {
  const number = Number(value || 0);
  return number.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function formatPercent(value) {
  return `${formatNumber(value, 2)}%`;
}

function formatDuration(seconds) {
  const value = Number(seconds || 0);
  const minutes = Math.floor(value / 60);
  const remainingSeconds = Math.round(value % 60);
  return minutes > 0 ? `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s` : `${remainingSeconds}s`;
}

function KpiCard({ icon: Icon, label, value, hint, status }) {
  return (
    <article className="sibs-card min-w-0 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
            {label}
          </p>
          <p className="mt-2 mb-0 text-2xl font-extrabold text-sibs-primary-1">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 mb-0 text-xs font-medium text-sibs-tertiary-5">{hint}</p>
          ) : null}
        </div>
        <div className="rounded-xl bg-sibs-primary-3/50 p-2.5 text-sibs-primary-1">
          <Icon size={20} />
        </div>
      </div>
      {status ? (
        <div className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${status.className}`}>
          {status.label}
        </div>
      ) : null}
    </article>
  );
}

function ChartShell({ title, subtitle, children }) {
  return (
    <article className="sibs-card overflow-hidden">
      <div className="border-b border-sibs-tertiary-10 bg-sibs-primary-3/30 px-4 py-3 sm:px-5">
        <h3 className="m-0 text-sm font-extrabold uppercase tracking-[0.18em] text-sibs-primary-1">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-1 mb-0 text-xs text-sibs-tertiary-5">{subtitle}</p>
        ) : null}
      </div>
      <div className="overflow-x-auto p-4 sm:p-5">{children}</div>
    </article>
  );
}

function EmptyChart() {
  return (
    <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed border-sibs-tertiary-8 bg-sibs-tertiary-10/30 px-4 text-center text-sm font-semibold text-sibs-tertiary-5">
      No KPI data is available for this reporting range.
    </div>
  );
}

function VolumeChart({ series }) {
  if (!series.length) return <EmptyChart />;

  const maxValue = Math.max(
    1,
    ...series.flatMap((item) => [item.callsOffered, item.callsHandled, item.handledWithinSla]),
  );

  return (
    <div className="min-w-[720px]">
      <div className="mb-4 flex flex-wrap gap-4 text-xs font-bold text-sibs-tertiary-5">
        <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-[#0b3b68]" />Volume</span>
        <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-[#2f6f9f]" />Handled</span>
        <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-[#4c9aca]" />Handled w/SLA</span>
      </div>
      <div className="flex h-64 items-end gap-5 border-b border-sibs-tertiary-8 px-2">
        {series.map((item) => (
          <div key={item.key} className="flex min-w-[86px] flex-1 flex-col items-center justify-end">
            <div className="flex h-52 w-full items-end justify-center gap-1.5">
              {[
                [item.callsOffered, "bg-[#0b3b68]"],
                [item.callsHandled, "bg-[#2f6f9f]"],
                [item.handledWithinSla, "bg-[#4c9aca]"],
              ].map(([value, className], index) => (
                <div key={index} className="flex h-full flex-1 items-end justify-center">
                  <div
                    title={formatNumber(value)}
                    className={`w-full max-w-7 rounded-t ${className}`}
                    style={{ height: `${Math.max(2, (Number(value || 0) / maxValue) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 mb-0 text-center text-[11px] font-bold text-sibs-primary-1">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineChart({ series, target }) {
  if (!series.length) return <EmptyChart />;

  const width = Math.max(720, series.length * 120);
  const height = 250;
  const chartTop = 20;
  const chartBottom = 195;
  const xStep = series.length > 1 ? (width - 80) / (series.length - 1) : 0;
  const y = (value) => chartBottom - (Math.max(0, Math.min(100, Number(value || 0))) / 100) * (chartBottom - chartTop);
  const points = (key) => series.map((item, index) => `${40 + index * xStep},${y(item[key])}`).join(" ");

  return (
    <div style={{ minWidth: width }}>
      <div className="mb-3 flex flex-wrap gap-4 text-xs font-bold text-sibs-tertiary-5">
        <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-[#0b3b68]" />Answer %</span>
        <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-[#4c9aca]" />SL %</span>
        <span><i className="mr-1.5 inline-block h-0.5 w-4 align-middle bg-red-500" />SL Target</span>
      </div>
      <svg width={width} height={height} role="img" aria-label="Answer rate and service level trend">
        {[0, 25, 50, 75, 100].map((tick) => (
          <g key={tick}>
            <line x1="40" x2={width - 20} y1={y(tick)} y2={y(tick)} stroke="#e5e7eb" />
            <text x="4" y={y(tick) + 4} fontSize="10" fill="#64748b">{tick}%</text>
          </g>
        ))}
        <line x1="40" x2={width - 20} y1={y(target)} y2={y(target)} stroke="#ef4444" strokeWidth="2" strokeDasharray="6 5" />
        <polyline fill="none" stroke="#0b3b68" strokeWidth="3" points={points("answerRatePct")} />
        <polyline fill="none" stroke="#4c9aca" strokeWidth="3" points={points("serviceLevelPct")} />
        {series.map((item, index) => {
          const x = 40 + index * xStep;
          return (
            <g key={item.key}>
              <circle cx={x} cy={y(item.answerRatePct)} r="4" fill="#0b3b68" />
              <circle cx={x} cy={y(item.serviceLevelPct)} r="4" fill="#4c9aca" />
              <text x={x} y="226" textAnchor="middle" fontSize="10" fontWeight="700" fill="#183153">{item.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function AhtChart({ series, target }) {
  if (!series.length) return <EmptyChart />;

  const maxValue = Math.max(target, ...series.map((item) => Number(item.ahtSeconds || 0)), 1);
  const targetPosition = Math.min(100, (target / maxValue) * 100);

  return (
    <div className="min-w-[720px]">
      <div className="mb-4 flex items-center gap-4 text-xs font-bold text-sibs-tertiary-5">
        <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-[#0b3b68]" />Call AHT</span>
        <span><i className="mr-1.5 inline-block h-0.5 w-4 align-middle bg-red-500" />Target ({formatNumber(target)} sec)</span>
      </div>
      <div className="relative flex h-64 items-end gap-5 border-b border-sibs-tertiary-8 px-3">
        <div
          className="pointer-events-none absolute right-3 left-3 border-t-2 border-dashed border-red-500"
          style={{ bottom: `calc(32px + ${targetPosition * 1.9}px)` }}
        />
        {series.map((item) => (
          <div key={item.key} className="relative z-10 flex min-w-[88px] flex-1 flex-col items-center justify-end">
            <p className="mb-1 text-[10px] font-extrabold text-sibs-primary-1">{formatNumber(item.ahtSeconds, 2)}</p>
            <div className="flex h-48 w-full items-end justify-center">
              <div
                className="w-12 rounded-t bg-[#0b3b68]"
                style={{ height: `${Math.max(2, (Number(item.ahtSeconds || 0) / maxValue) * 100)}%` }}
              />
            </div>
            <p className="mt-2 mb-0 text-center text-[11px] font-bold text-sibs-primary-1">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WfmCallKpiDashboard({ data }) {
  const summary = data?.summary || {};
  const series = Array.isArray(data?.series) ? data.series : [];
  const targets = data?.targets || { serviceLevelPct: 90, ahtSeconds: 420 };
  const serviceLevelMet = Number(summary.serviceLevelPct || 0) >= Number(targets.serviceLevelPct || 0);
  const ahtMet = Number(summary.ahtSeconds || 0) <= Number(targets.ahtSeconds || 0) && Number(summary.ahtSeconds || 0) > 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard icon={PhoneCall} label="Call Volume" value={formatNumber(summary.callsOffered)} hint="Total calls offered" />
        <KpiCard icon={PhoneCall} label="Handled" value={formatNumber(summary.callsHandled)} hint="Total handled calls" />
        <KpiCard icon={CheckCircle2} label="Handled w/SLA" value={formatNumber(summary.handledWithinSla)} hint="Handled within SLT" />
        <KpiCard icon={Gauge} label="Answer %" value={formatPercent(summary.answerRatePct)} hint="Handled ÷ offered" />
        <KpiCard
          icon={Gauge}
          label="Service Level"
          value={formatPercent(summary.serviceLevelPct)}
          hint={`Target ${formatPercent(targets.serviceLevelPct)}`}
          status={{
            label: serviceLevelMet ? "Target met" : "Below target",
            className: serviceLevelMet ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700",
          }}
        />
        <KpiCard
          icon={Clock3}
          label="Call AHT"
          value={formatDuration(summary.ahtSeconds)}
          hint={`Target ${formatNumber(targets.ahtSeconds)} sec`}
          status={{
            label: ahtMet ? "Target met" : "Above target",
            className: ahtMet ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700",
          }}
        />
      </div>

      <ChartShell title="Calls" subtitle="Volume, handled calls, and handled within SLA">
        <VolumeChart series={series} />
      </ChartShell>

      <ChartShell title="Answer Rate & Service Level" subtitle="Answer % and service level performance against target">
        <LineChart series={series} target={targets.serviceLevelPct} />
      </ChartShell>

      <ChartShell title="Average Handling Time" subtitle="Call AHT measured in seconds against the current target">
        <AhtChart series={series} target={targets.ahtSeconds} />
      </ChartShell>
    </div>
  );
}
