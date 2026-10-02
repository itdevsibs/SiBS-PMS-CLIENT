// Renders the collapsible dashboard sidebar navigation.
import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

const SIDEBAR_COLLAPSED_KEY = "pms-sidebar-collapsed";

const AdminSidebar = ({
  isMobileOpen = false,
  modules,
  onMobileClose, 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true",
  );
  const [expandedModules, setExpandedModules] = useState(() => ["Wow Report"]);

  useEffect(() => {
    if (location.pathname.includes("view-graphs")) {
      setExpandedModules((prev) =>
        prev.includes("Wow Report") ? prev : [...prev, "Wow Report"]
      );
    }
  }, [location.pathname]);

  const toggleExpand = (moduleName) => {
    setExpandedModules((prev) =>
      prev.includes(moduleName)
        ? prev.filter((name) => name !== moduleName)
        : [...prev, moduleName]
    );
  };

  const handleSidebarToggle = () => {
    setIsCollapsed((value) => {
      const nextValue = !value;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(nextValue));
      return nextValue;
    });
  };

  const renderContent = ({ collapsed = false, mobile = false }) => (
    <>
      <div
        className={`sibs-sidebar-brand-row ${
          collapsed ? "collapsed" : ""
        }`}
      >
        <div
          className={`sibs-sidebar-brand ${
            collapsed ? "justify-center" : "items-center"
          }`}
        >
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#ff5c28] to-[#ff4713] text-[21px] font-extrabold text-white shadow-xs">
            S
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-white shadow-xs" />
          </span>
          {!collapsed && (
            <span className="flex min-w-0 flex-1 flex-col justify-center leading-none">
              <span className="whitespace-nowrap font-sans text-[20.5px] font-extrabold leading-[23px] tracking-tight text-white">
                <span className="text-[#ff7247]">SiBS</span> PMS
              </span>
              <span className="mt-1 block whitespace-nowrap font-sans text-[8px] font-bold uppercase leading-tight tracking-[0.05em] text-[#9fb2c5]">
                PERFORMANCE MANAGEMENT SYSTEM
              </span>
            </span>
          )}
        </div>

        {!mobile && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
            onClick={handleSidebarToggle}
            className={`sibs-sidebar-toggle ${
              collapsed ? "collapsed" : ""
            }`}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        )}
      </div>

      <div className={`sibs-sidebar-scroll py-3 ${collapsed ? "px-2" : "px-3"}`}>
        <div className="mb-4">
          <p
            className={`mb-2 px-3 text-[10.5px] font-bold uppercase tracking-wider text-[#90a1b9] ${
              collapsed ? "text-center text-[9.5px] px-0" : ""
            }`}
          >
            {collapsed ? "Menu" : "Modules"}
          </p>

          <nav className="flex flex-col gap-1" aria-label="Admin modules">
            {modules.map((item) => {
              const Icon = item.icon;
              const hasSubmodules = Array.isArray(item.submodules) && item.submodules.length > 0;
              const isExpanded = expandedModules.includes(item.name);
              const isParentActive = location.pathname === item.path;

              if (hasSubmodules) {
                return (
                  <div key={item.name} className="flex flex-col">
                    <button
                      type="button"
                      title={item.name}
                      onClick={() => {
                        if (collapsed) {
                          navigate(item.path);
                          if (mobile) onMobileClose?.();
                        } else {
                          toggleExpand(item.name);
                          if (location.pathname !== item.path) {
                            navigate(item.path);
                            if (mobile) onMobileClose?.();
                          }
                        }
                      }}
                      className={`group flex h-[38px] w-full cursor-pointer items-center gap-3 rounded-xl border-0 px-3 text-left font-semibold transition-all duration-150 ${
                        isParentActive && !location.search
                          ? "bg-[#ff5c28] text-white shadow-md shadow-orange-950/20 hover:!bg-[#ff5c28] hover:!text-white"
                          : isParentActive
                            ? "bg-white/[0.12] text-white font-bold"
                            : "text-[#cad5e2] hover:bg-white/[0.08] hover:text-white"
                      } ${collapsed ? "h-[38px] justify-center px-0" : ""}`}
                    >
                      <Icon
                        className={`h-[19px] w-[19px] shrink-0 transition-colors ${
                          isParentActive ? "text-white" : "text-[#90a1b9] group-hover:text-white"
                        }`}
                        strokeWidth={1.9}
                        aria-hidden="true"
                      />
                      {!collapsed && (
                        <>
                          <span className="min-w-0 flex-1 truncate text-left text-[12.5px] font-semibold leading-5 tracking-normal">
                            {item.name}
                          </span>
                          <span
                            className="p-0.5 text-[#90a1b9] transition-colors group-hover:text-white shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(item.name);
                            }}
                          >
                            <ChevronDown
                              size={14}
                              strokeWidth={2.2}
                              className={`transform transition-transform duration-300 ease-in-out ${
                                isExpanded ? "rotate-180" : "rotate-0"
                              }`}
                            />
                          </span>
                        </>
                      )}
                    </button>

                    {/* Smooth Submodules Accordion (indented with vertical branch line) */}
                    {!collapsed && (
                      <div
                        className="grid transition-all duration-300 ease-in-out"
                        style={{
                          gridTemplateRows: isExpanded ? "1fr" : "0fr",
                          opacity: isExpanded ? 1 : 0,
                          marginTop: isExpanded ? "0.25rem" : "0rem",
                          pointerEvents: isExpanded ? "auto" : "none",
                        }}
                      >
                        <div className="overflow-hidden">
                          <div className="relative ml-5 flex flex-col gap-0.5 border-l-2 border-white/20 pl-2.5 py-0.5">
                            {item.submodules.map((sub) => {
                              const SubIcon = sub.icon;
                              const isSubActive =
                                location.pathname === item.path &&
                                sub.key &&
                                location.search.includes(`section=${sub.key}`);

                              return (
                                <button
                                  key={sub.name}
                                  type="button"
                                  title={sub.name}
                                  onClick={() => {
                                    navigate(sub.path);
                                    if (mobile) onMobileClose?.();
                                  }}
                                  className={`group/sub flex h-[32px] w-full cursor-pointer items-center gap-2.5 rounded-lg border-0 px-2.5 text-left text-[12px] font-medium transition-all duration-150 ${
                                    isSubActive
                                      ? "bg-[#ff5c28] text-white font-bold shadow-xs hover:!bg-[#ff5c28] hover:!text-white"
                                      : "text-[#cad5e2] hover:bg-white/[0.08] hover:text-white"
                                  }`}
                                >
                                  {SubIcon && (
                                    <SubIcon
                                      className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                                        isSubActive
                                          ? "text-white"
                                          : "text-[#90a1b9] group-hover/sub:text-white"
                                      }`}
                                      strokeWidth={1.8}
                                      aria-hidden="true"
                                    />
                                  )}
                                  <span className="min-w-0 flex-1 truncate text-left">
                                    {sub.name}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={item.name}
                  type="button"
                  title={item.name}
                  onClick={() => {
                    navigate(item.path);
                    if (mobile) {
                      onMobileClose?.();
                    }
                  }}
                  className={`group flex h-[38px] w-full cursor-pointer items-center gap-3 rounded-xl border-0 px-3 text-left font-semibold transition-all duration-150 ${
                    isParentActive
                      ? "bg-[#ff5c28] text-white shadow-md shadow-orange-950/20 hover:!bg-[#ff5c28] hover:!text-white"
                      : "text-[#cad5e2] hover:bg-white/[0.08] hover:text-white"
                  } ${collapsed ? "h-[38px] justify-center px-0" : ""}`}
                >
                  <Icon
                    className={`h-[19px] w-[19px] shrink-0 transition-colors ${
                      isParentActive ? "text-white" : "text-[#90a1b9] group-hover:text-white"
                    }`}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />
                  {!collapsed && (
                    <span className="min-w-0 flex-1 truncate text-left text-[12.5px] font-semibold leading-5 tracking-normal">
                      {item.name}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="mt-auto border-t border-white/10 h-[68px]" />
    </>
  );

  return (
    <>
      <aside
        className={`sibs-sidebar hidden border-r border-[#0d3b66] bg-[#042c51] text-white shadow-sm md:flex ${
          isCollapsed ? "collapsed" : ""
        }`}
      >
        {renderContent({ collapsed: isCollapsed })}
      </aside>

      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onMobileClose}
          className="sibs-sidebar-backdrop z-[95] md:hidden"
        />
      )}

      <aside
        className={`sibs-sidebar mobile z-[100] !w-[260px] max-w-[calc(100vw-2rem)] border-r border-[#0d3b66] bg-[#042c51] text-white shadow-2xl sm:!w-[280px] md:hidden ${
          isMobileOpen ? "mobile-open" : ""
        }`}
      >
        {renderContent({ mobile: true })}
      </aside>
    </>
  );
};

export default AdminSidebar;
