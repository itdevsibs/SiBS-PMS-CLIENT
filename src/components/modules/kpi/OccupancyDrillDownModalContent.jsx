import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Gauge,
  Minus,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";

function formatNumber(value, digits = 0) {
  const num = Number(value || 0);
  return num.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function formatPercent(value) {
  if (value == null || !Number.isFinite(Number(value))) return "--";
  const num = Number(value);
  if (num >= 100 || num.toFixed(2) === "100.00") return "100%";
  return `${formatNumber(num, 2)}%`;
}

function DeltaBadge({ current, previous, invert = false, isPercent = false }) {
  if (
    current == null ||
    previous == null ||
    !Number.isFinite(Number(previous)) ||
    Number(previous) === 0
  ) {
    return null;
  }
  const diff = Number(current) - Number(previous);
  if (Math.abs(diff) < 0.01) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
        <Minus size={10} />0
      </span>
    );
  }
  const isPositive = diff > 0;
  const isGood = invert ? !isPositive : isPositive;
  const formattedDiff = isPercent
    ? `${isPositive ? "+" : ""}${diff.toFixed(2)}%`
    : `${isPositive ? "+" : ""}${formatNumber(diff, Number.isInteger(diff) ? 0 : 2)}`;

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
        isGood ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
      }`}
      title="Change vs previous period"
    >
      {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
      {formattedDiff}
    </span>
  );
}

function ProgressRow({ label, valueText, pct, barColor = "bg-[#0b3b68]", subtext = null }) {
  const clamped = Math.max(0, Math.min(100, Number(pct || 0)));
  return (
    <div className="space-y-0.5">
      <div className="flex items-baseline justify-between gap-2 text-[11px]">
        <span className="font-bold text-slate-700">{label}</span>
        <div className="flex items-baseline gap-2">
          {subtext ? <span className="text-[10.5px] font-medium text-slate-400">{subtext}</span> : null}
          <span className="font-extrabold text-[#103B63] tabular-nums">{valueText}</span>
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export default function OccupancyDrillDownModalContent({
  series = [],
  selectedIndex = 0,
}) {
  const activeItem = series[selectedIndex] || null;
  const previousItem = selectedIndex > 0 ? series[selectedIndex - 1] : null;

  if (!activeItem) {
    return (
      <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">
        No drill-down data available for this period.
      </div>
    );
  }

  const occupancyPct = activeItem.occupancyPct != null ? Number(activeItem.occupancyPct) : null;
  const utilizationPct = activeItem.utilizationPct != null ? Number(activeItem.utilizationPct) : null;
  const requiredHc = activeItem.requiredHeadcount != null ? Number(activeItem.requiredHeadcount) : null;
  const actualHc = activeItem.actualHeadcount != null ? Number(activeItem.actualHeadcount) : null;
  const buffer = activeItem.buffer != null ? Number(activeItem.buffer) : null;
  const absenteeismPct = activeItem.absenteeismPct != null ? Number(activeItem.absenteeismPct) : null;
  const attritionPct = activeItem.attritionPct != null ? Number(activeItem.attritionPct) : null;

  const fulfillmentPct =
    requiredHc != null && requiredHc > 0 && actualHc != null
      ? (actualHc / requiredHc) * 100
      : null;
  const isShortfall = buffer != null && buffer < 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Top 5 KPI Summary Cards */}
      <div className="shrink-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <div className="rounded border border-slate-200 bg-white px-3 py-2 shadow-2xs">
          <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            <span>Occupancy</span>
            <Gauge size={12} className="text-[#0b3b68]" />
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-1">
            <span className="text-lg font-black text-[#103B63] tabular-nums">
              {formatPercent(occupancyPct)}
            </span>
            <DeltaBadge current={occupancyPct} previous={previousItem?.occupancyPct} isPercent />
          </div>
          <p className="m-0 mt-0.5 text-[10px] font-semibold text-slate-400">
            Active handling occupancy
          </p>
        </div>

        <div className="rounded border border-slate-200 bg-white px-3 py-2 shadow-2xs">
          <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            <span>Utilization</span>
            <Activity size={12} className="text-[#557da4]" />
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-1">
            <span className="text-lg font-black text-[#103B63] tabular-nums">
              {formatPercent(utilizationPct)}
            </span>
            <DeltaBadge current={utilizationPct} previous={previousItem?.utilizationPct} isPercent />
          </div>
          <p className="m-0 mt-0.5 text-[10px] font-semibold text-slate-400">
            Paid time utilization
          </p>
        </div>

        <div className="rounded border border-slate-200 bg-white px-3 py-2 shadow-2xs">
          <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            <span>Actual vs Req HC</span>
            <Users size={12} className="text-[#2f6f9f]" />
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-1">
            <span className="text-lg font-black text-[#103B63] tabular-nums">
              {actualHc != null ? formatNumber(actualHc, Number.isInteger(actualHc) ? 0 : 2) : "--"}
            </span>
            {fulfillmentPct != null ? (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9.5px] font-bold ${
                  fulfillmentPct >= 100 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}
              >
                {formatPercent(fulfillmentPct)}
              </span>
            ) : null}
          </div>
          <p className="m-0 mt-0.5 text-[10px] font-semibold text-slate-500">
            Required FTE: <strong className="text-[#0b3b68]">{requiredHc != null ? formatNumber(requiredHc, Number.isInteger(requiredHc) ? 0 : 2) : "--"}</strong>
          </p>
        </div>

        <div className="rounded border border-slate-200 bg-white px-3 py-2 shadow-2xs">
          <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            <span>{isShortfall ? "Shortfall" : "Buffer"}</span>
            <UserCheck size={12} className={isShortfall ? "text-rose-500" : "text-emerald-600"} />
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-1">
            <span className={`text-lg font-black tabular-nums ${isShortfall ? "text-rose-600" : "text-[#103B63]"}`}>
              {buffer != null ? `${buffer > 0 ? "+" : ""}${formatNumber(buffer, Number.isInteger(buffer) ? 0 : 2)}` : "--"}
            </span>
            {buffer != null ? (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9.5px] font-bold ${
                  isShortfall ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {isShortfall ? "Shortfall" : "Buffered"}
              </span>
            ) : null}
          </div>
          <p className="m-0 mt-0.5 text-[10px] font-semibold text-slate-400">
            Actual HC minus Required FTE
          </p>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded border border-slate-200 bg-white px-3 py-2 shadow-2xs">
          <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            <span>Absenteeism</span>
            <UserMinus size={12} className="text-amber-600" />
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-1">
            <span className="text-lg font-black text-[#103B63] tabular-nums">
              {formatPercent(absenteeismPct)}
            </span>
            <DeltaBadge current={absenteeismPct} previous={previousItem?.absenteeismPct} invert isPercent />
          </div>
          <p className="m-0 mt-0.5 text-[10px] font-semibold text-slate-500">
            Attrition: <strong className="text-[#0b3b68]">{formatPercent(attritionPct)}</strong>
          </p>
        </div>
      </div>

      {/* Middle 2-Column Analytical Breakdown */}
      <div className="shrink-0 grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded border border-slate-200 bg-white px-4 py-3 shadow-2xs flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <h3 className="m-0 text-[11px] font-black uppercase tracking-wider text-[#103B63]">
              Workforce Efficiency &amp; People Rates
            </h3>
            <span className="text-[10.5px] font-semibold text-slate-400">
              {activeItem.label}
            </span>
          </div>

          <div className="space-y-2">
            <ProgressRow
              label="Occupancy %"
              valueText={formatPercent(occupancyPct)}
              pct={occupancyPct ?? 0}
              barColor="bg-[#0b3b68]"
            />
            <ProgressRow
              label="Utilization %"
              valueText={formatPercent(utilizationPct)}
              pct={utilizationPct ?? 0}
              barColor="bg-[#557da4]"
            />
            <ProgressRow
              label="Headcount Fulfillment"
              valueText={formatPercent(fulfillmentPct)}
              subtext={actualHc != null && requiredHc != null ? `${formatNumber(actualHc, 0)} / ${formatNumber(requiredHc, 0)}` : null}
              pct={fulfillmentPct ?? 0}
              barColor={fulfillmentPct != null && fulfillmentPct >= 100 ? "bg-emerald-600" : "bg-amber-500"}
            />
            <ProgressRow
              label="Absenteeism %"
              valueText={formatPercent(absenteeismPct)}
              pct={absenteeismPct ?? 0}
              barColor="bg-amber-400"
            />
            <ProgressRow
              label="Attrition %"
              valueText={formatPercent(attritionPct)}
              pct={attritionPct ?? 0}
              barColor="bg-rose-400"
            />
          </div>
        </div>

        <div className="rounded border border-slate-200 bg-white px-4 py-3 shadow-2xs flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <h3 className="m-0 text-[11px] font-black uppercase tracking-wider text-[#103B63]">
              Staffing &amp; Capacity Summary
            </h3>
            <span className="text-[10.5px] font-semibold text-slate-400">
              FTE &amp; People Health
            </span>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-2.5">
            <div className="rounded bg-slate-50 px-2.5 py-2 border border-slate-100">
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                Required FTE
              </div>
              <div className="mt-0.5 text-sm font-black text-[#103B63] tabular-nums">
                {requiredHc != null ? formatNumber(requiredHc, Number.isInteger(requiredHc) ? 0 : 2) : "--"}
              </div>
              <div className="text-[10px] text-slate-400">
                Target staffing requirement
              </div>
            </div>

            <div className="rounded bg-slate-50 px-2.5 py-2 border border-slate-100">
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                Actual Headcount
              </div>
              <div className="mt-0.5 text-sm font-black text-[#103B63] tabular-nums">
                {actualHc != null ? formatNumber(actualHc, Number.isInteger(actualHc) ? 0 : 2) : "--"}
              </div>
              <div className="text-[10px] text-slate-400">
                Active staffed headcount
              </div>
            </div>

            <div className="rounded bg-slate-50 px-2.5 py-2 border border-slate-100">
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                Occ. vs Util. Spread
              </div>
              <div className="mt-0.5 text-sm font-black text-[#103B63] tabular-nums">
                {occupancyPct != null && utilizationPct != null
                  ? `${occupancyPct - utilizationPct >= 0 ? "+" : ""}${(occupancyPct - utilizationPct).toFixed(2)}%`
                  : "--"}
              </div>
              <div className="text-[10px] text-slate-400">
                Occupancy minus Utilization
              </div>
            </div>

            <div className="rounded bg-slate-50 px-2.5 py-2 border border-slate-100">
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                Attrition Rate
              </div>
              <div className="mt-0.5 text-sm font-black text-[#103B63] tabular-nums">
                {formatPercent(attritionPct)}
              </div>
              <div className="text-[10px] text-slate-400">
                Workforce turnover rate
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Detailed Metric Breakdown for Clicked Period Only */}
      <div className="flex-1 min-h-0 flex flex-col rounded border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="shrink-0 flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
          <h3 className="m-0 text-[11px] font-black uppercase tracking-wider text-[#103B63]">
            Detailed Metrics
          </h3>
          <span className="text-[10.5px] font-semibold text-slate-500">
            Complete workforce performance summary
          </span>
        </div>

        <div className="flex-1 min-h-0 overflow-x-auto">
          <table className="h-full w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="px-3.5 py-1.5">Metric</th>
                <th className="px-3 py-1.5 text-right">Value</th>
                <th className="px-3 py-1.5 text-right">Context / Benchmark</th>
                <th className="px-3.5 py-1.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-3.5 py-1.5 font-semibold text-slate-700">Occupancy %</td>
                <td className="px-3 py-1.5 text-right font-bold text-[#103B63] tabular-nums">{formatPercent(occupancyPct)}</td>
                <td className="px-3 py-1.5 text-right text-slate-500">Active handling share</td>
                <td className="px-3.5 py-1.5 text-right"><DeltaBadge current={occupancyPct} previous={previousItem?.occupancyPct} isPercent /></td>
              </tr>
              <tr>
                <td className="px-3.5 py-1.5 font-semibold text-slate-700">Utilization %</td>
                <td className="px-3 py-1.5 text-right font-bold text-[#103B63] tabular-nums">{formatPercent(utilizationPct)}</td>
                <td className="px-3 py-1.5 text-right text-slate-500">Paid time utilization</td>
                <td className="px-3.5 py-1.5 text-right"><DeltaBadge current={utilizationPct} previous={previousItem?.utilizationPct} isPercent /></td>
              </tr>
              <tr>
                <td className="px-3.5 py-1.5 font-semibold text-slate-700">Required FTE</td>
                <td className="px-3 py-1.5 text-right font-bold text-[#103B63] tabular-nums">
                  {requiredHc != null ? formatNumber(requiredHc, Number.isInteger(requiredHc) ? 0 : 2) : "--"}
                </td>
                <td className="px-3 py-1.5 text-right text-slate-500">Planned staffing need</td>
                <td className="px-3.5 py-1.5 text-right text-slate-400">--</td>
              </tr>
              <tr>
                <td className="px-3.5 py-1.5 font-semibold text-slate-700">Actual Headcount</td>
                <td className="px-3 py-1.5 text-right font-bold text-[#103B63] tabular-nums">
                  {actualHc != null ? formatNumber(actualHc, Number.isInteger(actualHc) ? 0 : 2) : "--"}
                </td>
                <td className="px-3 py-1.5 text-right text-slate-500 tabular-nums">
                  {fulfillmentPct != null ? `${formatPercent(fulfillmentPct)} fulfillment` : "--"}
                </td>
                <td className="px-3.5 py-1.5 text-right"><DeltaBadge current={actualHc} previous={previousItem?.actualHeadcount} /></td>
              </tr>
              <tr>
                <td className="px-3.5 py-1.5 font-semibold text-slate-700">Buffer / Shortfall</td>
                <td className={`px-3 py-1.5 text-right font-bold tabular-nums ${isShortfall ? "text-rose-600" : "text-[#103B63]"}`}>
                  {buffer != null ? `${buffer > 0 ? "+" : ""}${formatNumber(buffer, Number.isInteger(buffer) ? 0 : 2)}` : "--"}
                </td>
                <td className="px-3 py-1.5 text-right text-slate-500">Actual HC − Required FTE</td>
                <td className="px-3.5 py-1.5 text-right">
                  {buffer != null ? (
                    <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${isShortfall ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                      {isShortfall ? "Shortfall" : "Buffered"}
                    </span>
                  ) : (
                    <span className="text-slate-400">--</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="px-3.5 py-1.5 font-semibold text-slate-700">Absenteeism %</td>
                <td className="px-3 py-1.5 text-right font-bold text-[#103B63] tabular-nums">{formatPercent(absenteeismPct)}</td>
                <td className="px-3 py-1.5 text-right text-slate-500">Unplanned absence rate</td>
                <td className="px-3.5 py-1.5 text-right"><DeltaBadge current={absenteeismPct} previous={previousItem?.absenteeismPct} invert isPercent /></td>
              </tr>
              <tr>
                <td className="px-3.5 py-1.5 font-semibold text-slate-700">Attrition %</td>
                <td className="px-3 py-1.5 text-right font-bold text-[#103B63] tabular-nums">{formatPercent(attritionPct)}</td>
                <td className="px-3 py-1.5 text-right text-slate-500">Employee turnover rate</td>
                <td className="px-3.5 py-1.5 text-right"><DeltaBadge current={attritionPct} previous={previousItem?.attritionPct} invert isPercent /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
