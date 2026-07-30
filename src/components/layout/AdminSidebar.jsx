import { useState } from "react";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

const SIDEBAR_COLLAPSED_KEY = "pms-sidebar-collapsed";

const AdminSidebar = ({
  isMobileOpen = false,
  modules,
  onLogoutClick,
  onMobileClose,
  userName = "admin",
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
          collapsed
            ? "justify-center px-4"
            : "items-start gap-3 px-4 py-5"
        }`}
      >
        <div
          className={`sibs-sidebar-brand text-white ${
            collapsed ? "justify-center" : "items-start"
          }`}
        >
          {!collapsed && (
            <span className="min-w-0 flex-1 border-l-2 border-sibs-primary-2 pl-3 leading-tight">
              <span className="block max-w-[165px] whitespace-normal font-sans text-[15px] font-bold leading-5">
                Performance Management System
              </span>
              <span className="mt-1 block text-xs font-semibold uppercase tracking-wide text-sibs-primary-2">
                by SIBS
              </span>
            </span>
          )}
          {collapsed && (
            <span className="font-sans text-sm font-bold text-sibs-primary-2">
              PMS
            </span>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={mobile ? "Close sidebar" : collapsed ? "Open sidebar" : "Close sidebar"}
          onClick={mobile ? onMobileClose : handleSidebarToggle}
          className="sibs-sidebar-toggle text-white hover:bg-sibs-tertiary-4 hover:text-white"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>

      <div className={`sibs-sidebar-scroll py-3 ${collapsed ? "px-3" : "px-4"}`}>
        <div className="sibs-sidebar-section">
          <p
            className={`sibs-sidebar-section-title mb-3 text-sibs-primary-3 ${
              collapsed ? "collapsed" : ""
            }`}
          >
            {collapsed ? "Menu" : "Modules"}
          </p>

          <nav className="sibs-sidebar-nav" aria-label="Admin modules">
            {modules.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Button
                  key={item.name}
                  type="button"
                  variant="ghost"
                  size="lg"
                  title={item.name}
                  onClick={() => {
                    navigate(item.path);
                    if (mobile) {
                      onMobileClose?.();
                    }
                  }}
                  className={`min-h-10 w-full justify-start gap-3 rounded-lg border-0 px-3 text-left text-sibs-primary-3 hover:bg-sibs-tertiary-4 hover:text-white ${
                    isActive ? "bg-sibs-tertiary-4 font-semibold text-white" : ""
                  } ${collapsed ? "h-10 min-h-10 justify-center px-0" : ""}`}
                >
                  <Icon
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  {!collapsed && (
                    <span className="min-w-0 flex-1 truncate text-left">
                      {item.name}
                    </span>
                  )}
                </Button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="border-t border-white/10 p-4">
        <div
          className={`flex items-center ${
            collapsed
              ? "justify-center"
              : "justify-between gap-2 rounded-xl bg-white/10 px-3 py-2"
          }`}
        >
          {!collapsed && (
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sibs-primary-2 text-sm font-bold text-white">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="m-0 text-sm font-bold text-white">{userName}</p>
                <p className="m-0 text-xs text-sibs-primary-3">signed-in</p>
              </div>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            onClick={onLogoutClick}
            aria-label="Logout"
            title="Logout"
            className="h-9 w-9 rounded-lg border-white/20 bg-white/10 text-white hover:bg-sibs-tertiary-4 hover:text-white"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <aside
        className={`sibs-sidebar m-3 hidden h-[calc(100vh-1.5rem)] rounded-2xl border-sibs-primary-1 bg-sibs-primary-1 text-white shadow-sm md:flex ${
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
        className={`sibs-sidebar mobile z-[100] !w-[280px] max-w-[calc(100vw-2rem)] rounded-r-2xl border-sibs-primary-1 bg-sibs-primary-1 text-white shadow-2xl sm:!w-[320px] md:hidden ${
          isMobileOpen ? "mobile-open" : ""
        }`}
      >
        {renderContent({ mobile: true })}
      </aside>
    </>
  );
};

export default AdminSidebar;
