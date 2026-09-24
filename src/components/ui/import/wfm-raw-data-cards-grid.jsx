import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import WfmGroupedRawDataCard from "@/components/ui/import/wfm-grouped-raw-data-card";
import WfmRawDataCard from "@/components/ui/import/wfm-raw-data-card";

export default function WfmRawDataCardsGrid({
  groupedCards = [],
  hasCards = true,
  uploadsByCard = {},
  isUploading = false,
  onBackToAll,
  onFileSelect,
  onOpenCard,
  onRefreshCard,
  onOpenErrorDetails,
}) {
  const { levelGroups, otherGroup } = useMemo(() => {
    const levels = [];
    let other = null;

    groupedCards.forEach((group) => {
      if (group.label === "OTHER") {
        other = group;
      } else {
        levels.push(group);
      }
    });

    return { levelGroups: levels, otherGroup: other };
  }, [groupedCards]);

  if (!hasCards || !groupedCards.length) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-sibs-tertiary-9 bg-[#f8fbfd] px-5 py-8 text-center text-sm text-sibs-tertiary-5">
        <p className="m-0">No raw data cards found.</p>
        <button
          type="button"
          onClick={onBackToAll}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-sibs-primary-1 shadow-xs transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1 hover:text-white cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to All Accounts</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grouped Level Cards: 1 Card for SERVICE / QUEUE LEVEL, 1 Card for AGENT LEVEL, 1 Card for AGENT OCCUPANCY */}
      {levelGroups.length > 0 && (
        <section className="min-w-0">
          <div className="mb-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onBackToAll}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-sibs-primary-1 shadow-xs transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1 hover:text-white cursor-pointer shrink-0"
              title="Back to All Accounts"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
            <h2 className="m-0 text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
              RAW DATA IMPORT LEVELS
            </h2>
            <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
          </div>

          <div className="grid gap-5 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {levelGroups.map((group) => (
              <WfmGroupedRawDataCard
                key={group.label}
                group={group}
                uploadsByCard={uploadsByCard}
                isUploading={isUploading}
                onFileSelect={onFileSelect}
                onOpenCard={onOpenCard}
                onRefreshCard={onRefreshCard}
                onOpenErrorDetails={onOpenErrorDetails}
              />
            ))}
          </div>
        </section>
      )}

      {/* Fallback for ungrouped cards (e.g. YOMDEL or custom accounts) */}
      {otherGroup?.cards?.length ? (
        <section className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            {levelGroups.length === 0 ? (
              <button
                type="button"
                onClick={onBackToAll}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-sibs-primary-1 shadow-xs transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1 hover:text-white cursor-pointer shrink-0"
                title="Back to All Accounts"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            ) : null}
            <h2 className="m-0 text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
              OTHER RAW DATA
            </h2>
            <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {otherGroup.cards.map((card) => (
              <WfmRawDataCard
                key={card.id}
                card={card}
                uploads={uploadsByCard[card.id] || []}
                isUploading={isUploading}
                onFileSelect={onFileSelect}
                onOpenCard={onOpenCard}
                onRefreshCard={onRefreshCard}
                onOpenErrorDetails={onOpenErrorDetails}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
