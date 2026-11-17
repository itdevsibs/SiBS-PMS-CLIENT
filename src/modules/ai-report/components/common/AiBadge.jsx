import { Sparkles, Shield, BrainCircuit } from "lucide-react";

export default function AiBadge({ variant = "primary", children, icon = "sparkles" }) {
  const getIcon = () => {
    switch (icon) {
      case "sparkles":
        return <Sparkles size={11} className="text-[#ff5c28]" />;
      case "shield":
        return <Shield size={11} className="text-[#082B60]" />;
      case "brain":
        return <BrainCircuit size={11} className="text-[#082B60]" />;
      default:
        return null;
    }
  };

  const variantClass = {
    primary: "bg-blue-50 text-[#082B60] border border-blue-200",
    accent: "bg-orange-50 text-[#c4380d] border border-orange-200",
    success: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    neutral: "bg-slate-100 text-slate-700 border border-slate-200",
  }[variant] || "bg-blue-50 text-[#082B60] border border-blue-200";

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${variantClass}`}>
      {getIcon()}
      <span>{children}</span>
    </span>
  );
}
