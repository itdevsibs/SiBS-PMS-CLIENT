// Renders the collapsible dashboard sidebar navigation.
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

const SIDEBAR_COLLAPSED_KEY = "pms-sidebar-collapsed";

const AdminSidebar = ({
  isMobileOpen = false,
  modules,
  onLogoutClick,
  onMobileClose,
  userName = "User",
  userRole = "Signed in",
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
          collapsed ? "collapsed" : "items-center gap-2 py-5"
        }`}
      >
        <div
          className={`sibs-sidebar-brand ${
            collapsed ? "justify-center" : "items-center"
          }`}
        >
          <span className="sibs-sidebar-logo-mark">S</span>
          {!collapsed && (
            <span className="sibs-sidebar-brand-copy">
              <span className="sibs-sidebar-brand-title">
                SiBS <span className="text-sibs-primary-2">PMS</span>
              </span>
              <span className="sibs-sidebar-brand-subtitle">
                <span>Performance Management</span>
                <span>System</span>
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
            className={`sibs-sidebar-toggle text-sibs-primary-1 hover:text-white ${
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

      <div className={`sibs-sidebar-scroll py-3 ${collapsed ? "px-3" : "px-3"}`}>
        <div className="sibs-sidebar-section">
          <p
            className={`sibs-sidebar-section-title mb-3 ${
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
                  className={`h-auto min-h-10 w-full justify-start gap-3 rounded-lg border-0 px-3 py-2.5 text-left text-sm font-bold text-[#b9cad8] hover:bg-[#ff5c28] hover:text-white ${
                    isActive ? "bg-sibs-primary-2 text-white" : ""
                  } ${mobile ? "mobile" : ""} ${
                    collapsed ? "h-10 min-h-10 justify-center px-0" : ""
                  }`}
                >
                  <Icon
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  {!collapsed && (
                    <span
                      className={`min-w-0 flex-1 text-left leading-5 ${
                        mobile ? "whitespace-normal break-words" : "whitespace-nowrap"
                      }`}
                    >
                      {item.name}
                    </span>
                  )}
                </Button>
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
        className={`sibs-sidebar hidden border-r border-[#174e78] bg-[#07385f] text-white shadow-sm md:flex ${
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
        className={`sibs-sidebar mobile z-[100] !w-[260px] max-w-[calc(100vw-2rem)] border-r border-[#174e78] bg-[#07385f] text-white shadow-2xl sm:!w-[280px] md:hidden ${
          isMobileOpen ? "mobile-open" : ""
        }`}
      >
        {renderContent({ mobile: true })}
      </aside>
    </>
  );
};

export default AdminSidebar;
