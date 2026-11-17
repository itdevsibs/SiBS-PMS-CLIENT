import { Skeleton } from "@/components/common/ui/Skeleton";
import { FileText, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

/**
 * Overview summary metric cards for Policy Processing
 */
export default function PolicyOverviewCards({ overview = {}, loading = false }) {
  const cards = [
    {
      title: "Total Policy Documents",
      value: (overview.totalDocuments ?? 0).toLocaleString(),
      valueColor: "text-[#12376B]",
      accentColor: "bg-[#12376B]",
      subtext: "Authoritative PDFs in repository",
      icon: FileText,
      iconColor: "text-[#12376B]",
      iconBg: "bg-blue-50",
    },
    {
      title: "Successfully Processed",
      value: (overview.successfullyProcessed ?? 0).toLocaleString(),
      valueColor: "text-[#15803D]",
      accentColor: "bg-[#15803D]",
      subtext: "Ready for Hermes AI indexing",
      icon: CheckCircle2,
      iconColor: "text-[#15803D]",
      iconBg: "bg-emerald-50",
    },
    {
      title: "Pending / Processing",
      value: (overview.pendingProcessing ?? 0).toLocaleString(),
      valueColor: "text-[#B45309]",
      accentColor: "bg-[#D97706]",
      subtext: "Queued or undergoing extraction",
      icon: Clock,
      iconColor: "text-[#B45309]",
      iconBg: "bg-amber-50",
    },
    {
      title: "Failed / Requires Attention",
      value: (overview.failedAttention ?? 0).toLocaleString(),
      valueColor: "text-[#B91C1C]",
      accentColor: "bg-[#DC2626]",
      subtext: "Extraction warnings or issues",
      icon: AlertTriangle,
      iconColor: "text-[#B91C1C]",
      iconBg: "bg-rose-50",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-xl border border-[#DCE4EE] bg-white p-4 shadow-2xs min-h-[105px]"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-16 mt-2" />
            <Skeleton className="h-3 w-36 mt-1" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-[#DCE4EE] bg-white p-4 shadow-2xs transition-shadow hover:shadow-xs min-h-[105px]"
          >
            {/* Top accent line */}
            <div className={`absolute top-0 left-0 right-0 h-[3px] ${card.accentColor}`} />

            <div className="flex items-start justify-between">
              <div>
                <span className="block text-xs font-bold text-[#526582] truncate">
                  {card.title}
                </span>
                <div className={`text-2xl font-extrabold ${card.valueColor} tracking-tight leading-tight mt-1.5`}>
                  {card.value}
                </div>
              </div>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.iconBg} ${card.iconColor} shrink-0`}>
                <IconComponent size={18} />
              </div>
            </div>

            <span className="block text-[11px] font-medium text-[#526582] mt-2 truncate">
              {card.subtext}
            </span>
          </div>
        );
      })}
    </div>
  );
}
