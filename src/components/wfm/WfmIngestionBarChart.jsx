// Visual summary bar chart for WFM feed volume & integrity.
import { useMemo } from "react";
import { BarChart3 } from "lucide-react";

export default function WfmIngestionBarChart({
  cards = [],
  uploadsByCard = {},
  isLoading = false,
}) {
  const chartData = useMemo(() => {
    return cards.map((card) => {
      const uploads = uploadsByCard[card.id] || [];
      const totalValid = uploads.reduce((acc, u) => acc + Number(u.validRows || 0), 0);
      const totalRows = uploads.reduce((acc, u) => acc + Number(u.totalRows || 0), 0);
      const totalIssues = uploads.reduce(
        (acc, u) => acc + Number(u.invalidRows || 0) + Number(u.duplicateRows || 0),
        0
      );

      return {
        id: card.id,
        name: card.title.replace("Skill Statistics", "Skills").replace("Agent Level", "Agents"),
        fullName: card.title,
        valid: totalValid,
        total: totalRows,
        issues: totalIssues,
      };
    });
  }, [cards, uploadsByCard]);

  const maxVal = Math.max(...chartData.map((d) => d.total), 100);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs h-[360px] animate-pulse" />
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs flex flex-col justify-between h-[360px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="m-0 text-sm sm:text-base font-bold text-slate-800">
            Feed Ingestion Volume
          </h3>
          <p className="m-0 text-xs text-slate-400">Processed records per operational feed</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff7e67]" />
            <span>Valid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0099ff]" />
            <span>Total</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#a855f7]" />
            <span>Exceptions</span>
          </div>
        </div>
      </div>

      {/* Bars Container */}
      <div className="flex-1 flex items-end justify-around gap-2 pt-8 pb-3 px-2">
        {chartData.map((item) => {
          const validHeight = Math.max(item.valid > 0 ? (item.valid / maxVal) * 100 : 0, 4);
          const totalHeight = Math.max(item.total > 0 ? (item.total / maxVal) * 100 : 0, 4);
          const issuesHeight = Math.max(item.issues > 0 ? (item.issues / maxVal) * 100 : 0, item.issues > 0 ? 4 : 0);

          return (
            <div key={item.id} className="flex flex-col items-center gap-2 flex-1 max-w-[85px] h-full justify-end group">
              {/* Clustered 3 Bars */}
              <div className="flex items-end justify-center gap-1 w-full h-[180px]">
                {/* Bar 1: Valid (Coral) */}
                <div
                  className="w-2.5 sm:w-3 rounded-t-full bg-gradient-to-t from-[#ff6b6b] to-[#ff9068] transition-all duration-300 group-hover:brightness-110 relative"
                  style={{ height: `${validHeight}%` }}
                  title={`Valid: ${item.valid.toLocaleString()}`}
                />
                {/* Bar 2: Total (Blue) */}
                <div
                  className="w-2.5 sm:w-3 rounded-t-full bg-gradient-to-t from-[#2f80ed] to-[#56ccf2] transition-all duration-300 group-hover:brightness-110 relative"
                  style={{ height: `${totalHeight}%` }}
                  title={`Total: ${item.total.toLocaleString()}`}
                />
                {/* Bar 3: Exceptions (Purple) */}
                <div
                  className="w-2.5 sm:w-3 rounded-t-full bg-gradient-to-t from-[#8b5cf6] to-[#c084fc] transition-all duration-300 group-hover:brightness-110 relative"
                  style={{ height: `${issuesHeight}%` }}
                  title={`Exceptions: ${item.issues.toLocaleString()}`}
                />
              </div>

              {/* Label */}
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 text-center truncate w-full" title={item.fullName}>
                {item.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
