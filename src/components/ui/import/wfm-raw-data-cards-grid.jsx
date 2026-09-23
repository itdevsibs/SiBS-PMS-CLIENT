import { ArrowLeft } from "lucide-react";
import WfmRawDataCard from "@/components/ui/import/wfm-raw-data-card";

export default function WfmRawDataCardsGrid({
  groupedCards = [],
  hasCards = true,
  uploadsByCard = {},
  isUploading = false,
  onBackToAll,
  onFileSelect,
  onOpenCard,
}) {
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
    <div className="space-y-5">
      {groupedCards.map((group, groupIndex) => (
        <section key={group.label} className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            {groupIndex === 0 ? (
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
              {group.label}
            </h2>
            <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {group.cards.map((card) => (
              <WfmRawDataCard
                key={card.id}
                card={card}
                uploads={uploadsByCard[card.id] || []}
                isUploading={isUploading}
                onFileSelect={onFileSelect}
                onOpenCard={onOpenCard}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

