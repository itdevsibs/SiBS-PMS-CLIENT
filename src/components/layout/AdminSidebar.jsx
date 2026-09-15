// Renders the collapsible dashboard sidebar navigation.
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
              const isActive = location.pathname === item.path;

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
                    isActive
                      ? "bg-[#ff5c28] text-white shadow-md shadow-orange-950/20 hover:!bg-[#ff5c28] hover:!text-white"
                      : "text-[#cad5e2] hover:bg-white/[0.08] hover:text-white"
                  } ${collapsed ? "h-[38px] justify-center px-0" : ""}`}
                >
                  <Icon
                    className={`h-[19px] w-[19px] shrink-0 transition-colors ${
                      isActive ? "text-white" : "text-[#90a1b9] group-hover:text-white"
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

      <div className="mt-auto border-t border-white/10 p-4" />
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
