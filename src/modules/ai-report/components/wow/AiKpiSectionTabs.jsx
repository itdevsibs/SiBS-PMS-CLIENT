import { PhoneCall, Mail, ClipboardCheck, Users, LayoutDashboard } from "lucide-react";

export default function AiKpiSectionTabs({ activeSection = "", onSelectSection }) {
  const tabs = [
    { key: "", label: "All WoW Reports", icon: LayoutDashboard },
    { key: "calls", label: "Calls", icon: PhoneCall },
    { key: "emails", label: "Emails", icon: Mail },
    { key: "qa", label: "QA", icon: ClipboardCheck },
    { key: "occupancy", label: "Occupancy & HC", icon: Users },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeSection === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelectSection(tab.key)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isActive
                ? "bg-[#082B60] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Icon size={14} className={isActive ? "text-[#ff5c28]" : "text-slate-400"} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
