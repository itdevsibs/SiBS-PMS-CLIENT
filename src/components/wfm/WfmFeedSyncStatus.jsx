// Professional Daily Raw Feed Sync Status component for WFM.
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileSpreadsheet,
  Layers,
  UploadCloud,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function isUploadedToday(timestamp) {
  if (!timestamp) return false;
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  } catch {
    return false;
  }
}

export default function WfmFeedSyncStatus({
  cards = [],
  uploadsByCard = {},
  selectedAccount = "US VISA",
  onAccountChange,
  accountOptions = [],
  isLoading = false,
}) {
  const navigate = useNavigate();

  return (
    <article className="rounded-xl border border-slate-200/90 bg-white relative z-10 flex flex-col h-[385px] shadow-2xs overflow-hidden">
      {/* Clean Header */}
      <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-2.5 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Layers size={14} className="text-slate-500 shrink-0" />
          <h3 className="m-0 text-xs sm:text-[13px] font-bold text-slate-800">
            Feed Sync
          </h3>
        </div>

        {/* Account Switcher Tabs - Scrolls horizontally if there are many accounts */}
        {accountOptions.length > 1 && (
          <div className="inline-flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5 max-w-[200px] sm:max-w-[320px] overflow-x-auto sibs-scrollbar shrink-0">
            {accountOptions.map((acc) => (
              <button
                key={acc}
                type="button"
                onClick={() => onAccountChange?.(acc)}
                className={`rounded-md px-2.5 py-0.5 text-[11px] font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  selectedAccount === acc
                    ? "bg-white text-sibs-primary-1 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {acc}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Body with Fixed Height & Scrollable Feed List */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col min-h-0">
        {isLoading ? (
          <div className="space-y-2 py-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-10 text-center text-xs text-slate-400">
            No raw data feed cards configured for {selectedAccount}.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto sibs-scrollbar pr-1 divide-y divide-slate-100">
            {cards.map((card) => {
              const uploads = uploadsByCard[card.id] || [];
              const latest = uploads[0] || null;
              const syncedToday = latest && isUploadedToday(latest.uploadedAtMs || latest.createdAt);

              let statusBadge = (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-bold text-slate-400">
                  <Clock3 className="h-2.5 w-2.5" />
                  PENDING TODAY
                </span>
              );

              if (latest) {
                if (syncedToday) {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      SYNCED TODAY
                    </span>
                  );
                } else {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      OUTDATED
                    </span>
                  );
                }
              }

              return (
                <div
                  key={card.id}
                  className="group flex items-center justify-between gap-2 py-2 px-1 rounded-lg transition-colors hover:bg-slate-50/80 -mx-0.5"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold ${
                        syncedToday
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : latest
                          ? "bg-amber-50 border-amber-200 text-amber-700"
                          : "bg-slate-50 border-slate-200 text-slate-400"
                      }`}
                    >
                      <FileSpreadsheet size={13} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="m-0 text-xs font-bold text-slate-800 truncate">
                          {card.title}
                        </p>
                        {card.sourceLabel && (
                          <span className="hidden md:inline-block rounded bg-slate-100 px-1.5 py-0.2 text-[8.5px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                            {card.sourceLabel}
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 mb-0 text-[10px] sm:text-[10.5px] text-slate-400 truncate">
                        {latest ? (
                          <span>Last sync: {latest.uploadedAt || latest.formattedTime}</span>
                        ) : (
                          "Awaiting today's sync"
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {statusBadge}
                    <button
                      type="button"
                      onClick={() => navigate("/dashboard/wfm/import-data")}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                      title="Upload or manage this card"
                    >
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Navigation Link */}
        <div className="pt-2.5 mt-auto border-t border-slate-100 flex items-center justify-end text-xs shrink-0">
          <button
            type="button"
            onClick={() => navigate("/dashboard/wfm/import-data")}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-sibs-primary-1 hover:text-sibs-primary-2 cursor-pointer transition-colors"
          >
            <span>Import Center</span>
            <ArrowRight size={11} />
          </button>
        </div>
      </div>
    </article>
  );
}
