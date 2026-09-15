// Visual summary donut/ring chart for system source & distribution.
import { useMemo } from "react";

export default function WfmSourceDonutChart({
  batches = [],
  cards = [],
  uploadsByCard = {},
  isLoading = false,
}) {
  const distribution = useMemo(() => {
    const sources = {
      FUSECOM: { name: "Fusecom", count: 0, color: "#ff7e67" },
      HERODASH: { name: "HeroDash", count: 0, color: "#0099ff" },
      FUSENET: { name: "FuseNet", count: 0, color: "#22c55e" },
    };

    cards.forEach((card) => {
      const src = String(card.source || card.sourceLabel || "").toUpperCase();
      const uploads = uploadsByCard[card.id] || [];
      const totalRows = uploads.reduce((acc, u) => acc + Number(u.totalRows || 0), 0);

      if (src.includes("FUSECOM")) {
        sources.FUSECOM.count += totalRows || uploads.length;
      } else if (src.includes("HERO")) {
        sources.HERODASH.count += totalRows || uploads.length;
      } else if (src.includes("NET")) {
        sources.FUSENET.count += totalRows || uploads.length;
      }
    });

    const total = Object.values(sources).reduce((acc, s) => acc + s.count, 0);

    return {
      items: Object.values(sources),
      total: total || 1,
    };
  }, [cards, uploadsByCard]);

  // Compute SVG stroke-dasharray values
  const radius = 68;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;
  const slices = distribution.items.map((item) => {
    const percent = item.count > 0 ? (item.count / distribution.total) * 100 : 33.33;
    const dashLength = (percent / 100) * circumference;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += percent;

    return {
      ...item,
      percent: Math.round(percent),
      dashLength,
      strokeDashoffset,
    };
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs h-[360px] animate-pulse" />
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs flex flex-col justify-between h-[360px]">
      {/* Header */}
      <div className="border-b border-slate-100 pb-3">
        <h3 className="m-0 text-sm sm:text-base font-bold text-slate-800">
          Source Distribution
        </h3>
        <p className="m-0 text-xs text-slate-400">Records breakdown by source provider</p>
      </div>

      {/* Donut Graphic */}
      <div className="flex-1 flex items-center justify-center relative py-2">
        <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
          {slices.map((slice, i) => (
            <circle
              key={i}
              cx="90"
              cy="90"
              r={radius}
              fill="transparent"
              stroke={slice.color}
              strokeWidth="24"
              strokeDasharray={`${slice.dashLength} ${circumference - slice.dashLength}`}
              strokeDashoffset={slice.strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 hover:opacity-85"
            />
          ))}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-black text-slate-800">
            {distribution.total >= 1000 ? `${(distribution.total / 1000).toFixed(1)}k` : distribution.total}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Records
          </span>
        </div>
      </div>

      {/* Clean Legend */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-around text-xs">
        {slices.map((slice, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: slice.color }}
            />
            <span className="font-semibold text-slate-600">{slice.name}</span>
            <span className="text-slate-400 font-bold">{slice.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
