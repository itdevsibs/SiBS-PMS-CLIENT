const BATCH_DETAIL_TONES = {
  emerald: {
    border: "border-emerald-100",
    background: "bg-emerald-50/60",
    iconBackground: "bg-emerald-100",
    icon: "text-emerald-600",
  },
  rose: {
    border: "border-rose-100",
    background: "bg-rose-50/60",
    iconBackground: "bg-rose-100",
    icon: "text-rose-600",
  },
  amber: {
    border: "border-amber-100",
    background: "bg-amber-50/60",
    iconBackground: "bg-amber-100",
    icon: "text-amber-600",
  },
  orange: {
    border: "border-orange-100",
    background: "bg-orange-50/60",
    iconBackground: "bg-orange-100",
    icon: "text-orange-600",
  },
  blue: {
    border: "border-blue-100",
    background: "bg-blue-50/60",
    iconBackground: "bg-blue-100",
    icon: "text-blue-600",
  },
  cyan: {
    border: "border-cyan-100",
    background: "bg-cyan-50/60",
    iconBackground: "bg-cyan-100",
    icon: "text-cyan-600",
  },
  sky: {
    border: "border-sky-100",
    background: "bg-sky-50/60",
    iconBackground: "bg-sky-100",
    icon: "text-sky-600",
  },
};

export default function BatchDetailStat({
  label,
  value,
  icon: Icon,
  tone = "blue",
  className = "",
}) {
  const styles = BATCH_DETAIL_TONES[tone] || BATCH_DETAIL_TONES.blue;

  return (
    <div
      className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border ${styles.border} ${styles.background} p-2.5 sm:p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${className}`}
    >
      <div className="flex items-center justify-between gap-1">
        <p
          className="m-0 min-w-0 whitespace-nowrap text-[8.5px] sm:text-[9px] font-extrabold uppercase leading-none tracking-tight text-sibs-tertiary-5"
          title={typeof label === "string" ? label : undefined}
        >
          {label}
        </p>
        <span
          className={`flex h-5 w-5 sm:h-5.5 sm:w-5.5 shrink-0 items-center justify-center rounded-md sm:rounded-lg ${styles.iconBackground} ${styles.icon}`}
        >
          <Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-1.5 sm:mt-2 mb-0 text-xl sm:text-[22px] font-black leading-none tracking-tight text-sibs-primary-1">
        {Number(value || 0).toLocaleString()}
      </p>
    </div>
  );
}
