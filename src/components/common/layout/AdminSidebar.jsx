// Renders the collapsible dashboard sidebar navigation.
import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/common/ui/Button";
import { getAuthUser } from "@/lib/auth";
import { handleLogout as handleAuthLogout } from "@/lib/axios/api-template";
import { useSidebar } from "@/context/SidebarContext";

const SIDEBAR_EXPANDED_KEY = "pms-sidebar-expanded-modules";

const AdminSidebar = ({
  isMobileOpen: propIsMobileOpen,
  isSidebarHidden: propIsSidebarHidden,
  isCollapsed: propIsCollapsed,
  onSidebarToggle: propOnSidebarToggle,
  onMobileClose: propOnMobileClose,
  modules = [],
  onLogoutClick,
  userName,
  userRole,
  brandBadge = "S",
  brandTitle = "SiBS PMS",
  brandSubtitle = "PERFORMANCE MANAGEMENT SYSTEM",
  hideToggleTooltip = "Hide sidebar totally",
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarContext = useSidebar();

  // Support controlled or context-based state
  const isMobileOpen =
    typeof propIsMobileOpen === "boolean"
      ? propIsMobileOpen
      : sidebarContext.isMobileOpen;

  const isSidebarHidden =
    typeof propIsSidebarHidden === "boolean"
      ? propIsSidebarHidden
      : sidebarContext.isSidebarHidden;

  const isCollapsed =
    typeof propIsCollapsed === "boolean"
      ? propIsCollapsed
      : sidebarContext.isCollapsed;

  const handleMobileClose = () => {
    if (propOnMobileClose) {
      propOnMobileClose();
    } else {
      sidebarContext.closeMobile();
    }
  };

  const handleToggleHidden = () => {
    if (propOnSidebarToggle) {
      propOnSidebarToggle();
    } else {
      sidebarContext.toggleHidden();
    }
  };

  const handleToggleCollapsed = () => {
    sidebarContext.toggleCollapsed();
  };

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const authUser = getAuthUser();
  const fullNameFromParts = [
    authUser?.firstName,
    authUser?.middleName,
    authUser?.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  const resolvedAuthName =
    authUser?.fullName ||
    authUser?.name ||
    authUser?.gy_emp_fullname ||
    fullNameFromParts ||
    authUser?.username ||
    authUser?.sibs_id ||
    null;

  const displayName =
    (userName && userName !== "User")
      ? userName
      : (resolvedAuthName || userName || "User");
  const displayEmail =
    userRole ||
    authUser?.email ||
    authUser?.roleLabel ||
    "user@thesiblingssolutions.com";
  const userInitial = displayName?.charAt(0)?.toUpperCase() || "U";
  const avatarSrc =
    authUser?.avatar ||
    authUser?.profile_photo ||
    authUser?.photo ||
    authUser?.photo_url ||
    authUser?.image ||
    authUser?.profile_image ||
    authUser?.avatar_url ||
    authUser?.picture ||
    authUser?.gy_emp_photo ||
    null;

  const handleLogoutAction = () => {
    setIsUserMenuOpen(false);
    if (onLogoutClick) {
      onLogoutClick();
      return;
    }
    void handleAuthLogout(true);
  };

  // Persist expanded modules in localStorage so navigating to any module keeps all open dropdowns open
  const [expandedModules, setExpandedModules] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_EXPANDED_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    // Default to keeping all module dropdowns open
    if (Array.isArray(modules)) {
      return modules
        .filter((m) => Array.isArray(m.submodules) && m.submodules.length > 0)
        .map((m) => m.name || m.key);
    }
    return [];
  });

  // Save expanded states whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_EXPANDED_KEY, JSON.stringify(expandedModules));
    } catch {
      // ignore
    }
  }, [expandedModules]);

  // Ensure the active route's parent is always included without collapsing any others
  useEffect(() => {
    if (!Array.isArray(modules)) return;
    const currentPath = location.pathname;
    const matchingModule = modules.find((m) =>
      Array.isArray(m.submodules) &&
      m.submodules.some((s) => (s.path ? s.path.split("?")[0] === currentPath : s.id === currentPath)),
    );
    if (matchingModule) {
      const modKey = matchingModule.name || matchingModule.key;
      setExpandedModules((prev) =>
        prev.includes(modKey) ? prev : [...prev, modKey],
      );
    }
  }, [location.pathname, modules]);

  const toggleExpand = (moduleName) => {
    setExpandedModules((prev) =>
      prev.includes(moduleName)
        ? prev.filter((name) => name !== moduleName)
        : [...prev, moduleName]
    );
  };

  const renderContent = ({ collapsed = false, mobile = false }) => (
    <div className="flex h-full flex-col bg-[#042c51] text-white">
      {/* Brand Header */}
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
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#ff5c28] to-[#ff4713] text-[20px] font-extrabold text-white shadow-xs">
            {brandBadge}
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-white shadow-xs" />
          </span>
          {!collapsed && (
            <span className="flex min-w-0 flex-1 flex-col justify-center leading-none">
              <span className="whitespace-nowrap font-sans text-[20.5px] font-extrabold leading-[23px] tracking-tight text-white">
                {brandTitle === "SiBS PMS" ? (
                  <>
                    <span className="text-[#ff7247]">SiBS</span> PMS
                  </>
                ) : (
                  brandTitle
                )}
              </span>
              <span className="mt-1 block whitespace-nowrap font-sans text-[8px] font-bold uppercase leading-tight tracking-[0.05em] text-[#9fb2c5]">
                {brandSubtitle}
              </span>
            </span>
          )}
        </div>

        {/* Desktop Toggle Button: Hide sidebar completely (matches FrontSteps design) */}
        {!mobile && (
          <button
            type="button"
            aria-label="Hide sidebar"
            title={hideToggleTooltip}
            onClick={handleToggleHidden}
            className="sibs-sidebar-toggle"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
        )}

        {/* Mobile Close Button */}
        {mobile && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={handleMobileClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation Links Scroll Container */}
      <div className={`sibs-sidebar-scroll py-3 flex-1 overflow-y-auto ${collapsed ? "px-2" : "px-3"}`}>
        <div className="mb-4">
          <p
            className={`mb-2 px-3 text-[10.5px] font-bold uppercase tracking-wider text-[#90a1b9] ${
              collapsed ? "text-center text-[9.5px] px-0" : ""
            }`}
          >
            {collapsed ? "Menu" : "MODULES"}
          </p>

          <nav className="flex flex-col gap-1" aria-label="Sidebar modules">
            {modules.map((item) => {
              const Icon = item.icon;
              const hasSubmodules = Array.isArray(item.submodules) && item.submodules.length > 0;
              const modKey = item.key || item.name;
              const isExpanded = expandedModules.includes(modKey) || expandedModules.includes(item.name);
              
              const activePaths = [
                item.path,
                ...(Array.isArray(item.activePaths) ? item.activePaths : []),
                ...(hasSubmodules ? item.submodules.map((s) => s.path?.split("?")[0] || s.id) : []),
              ];
              const isChildRouteActive = hasSubmodules && item.submodules.some((sub) => {
                if (!sub.path) return false;
                const subClean = sub.path.split("?")[0];
                if (sub.path.includes("?section=")) {
                  return location.pathname === subClean && location.search.includes(`section=${sub.key}`);
                }
                return location.pathname === subClean;
              });
              const isParentActive = isChildRouteActive || (item.path && activePaths.includes(location.pathname));

              if (hasSubmodules) {
                return (
                  <div key={modKey} className="flex flex-col">
                    <div
                      className={`group flex h-[38px] w-full items-center rounded-xl transition-all duration-150 ${
                        isParentActive && (!hasSubmodules || item.path === "/view-graphs") && !location.search
                          ? "bg-[#ff5c28] text-white shadow-md shadow-orange-950/20"
                          : isParentActive
                            ? "bg-white/[0.12] text-white font-bold"
                            : "text-[#cad5e2] hover:bg-white/[0.08] hover:text-white"
                      } ${collapsed ? "justify-center px-0" : "px-3"}`}
                    >
                      <button
                        type="button"
                        title={item.name}
                        onClick={() => {
                          if (item.path && item.key === "wow-report") {
                            navigate(item.path);
                            if (mobile) handleMobileClose();
                            if (!isExpanded) toggleExpand(modKey);
                          } else {
                            toggleExpand(modKey);
                          }
                        }}
                        className={`flex flex-1 min-w-0 cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-left font-semibold text-inherit outline-none ${
                          collapsed ? "h-[38px] w-[38px] justify-center" : ""
                        }`}
                      >
                        {Icon && (
                          <Icon
                            className={`h-[19px] w-[19px] shrink-0 transition-colors ${
                              isParentActive ? "text-white" : "text-[#90a1b9] group-hover:text-white"
                            }`}
                            strokeWidth={1.9}
                            aria-hidden="true"
                          />
                        )}
                        {!collapsed && (
                          <span className="min-w-0 flex-1 truncate text-left text-[12.5px] font-semibold leading-5 tracking-normal">
                            {item.name}
                          </span>
                        )}
                      </button>

                      {!collapsed && (
                        <button
                          type="button"
                          aria-label={isExpanded ? `Collapse ${item.name}` : `Expand ${item.name}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleExpand(modKey);
                          }}
                          className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent p-0 transition-all hover:bg-white/10 outline-none text-[#90a1b9] hover:text-white"
                        >
                          <ChevronDown
                            size={14}
                            strokeWidth={2.2}
                            className={`transform transition-transform duration-300 ease-in-out ${
                              isExpanded ? "rotate-180" : "rotate-0"
                            }`}
                          />
                        </button>
                      )}
                    </div>

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
                              const isSubActive = sub.path?.includes("?section=")
                                ? location.pathname === sub.path.split("?")[0] &&
                                  location.search.includes(`section=${sub.key}`)
                                : location.pathname === sub.path?.split("?")[0];

                              return (
                                <button
                                  key={sub.name || sub.id}
                                  type="button"
                                  title={sub.name}
                                  onClick={() => {
                                    if (sub.path) {
                                      navigate(sub.path);
                                    }
                                    if (mobile) handleMobileClose();
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
                    if (item.path) {
                      navigate(item.path);
                    }
                    if (mobile) {
                      handleMobileClose();
                    }
                  }}
                  className={`group flex h-[38px] w-full cursor-pointer items-center gap-3 rounded-xl border-0 px-3 text-left font-semibold transition-all duration-150 ${
                    isParentActive
                      ? "bg-[#ff5c28] text-white shadow-md shadow-orange-950/20 hover:!bg-[#ff5c28] hover:!text-white"
                      : "text-[#cad5e2] hover:bg-white/[0.08] hover:text-white"
                  } ${collapsed ? "h-[38px] justify-center px-0" : ""}`}
                >
                  {Icon && (
                    <Icon
                      className={`h-[19px] w-[19px] shrink-0 transition-colors ${
                        isParentActive ? "text-white" : "text-[#90a1b9] group-hover:text-white"
                      }`}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />
                  )}
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

      {/* Bottom User Profile Section */}
      <div className={`relative mt-auto border-t border-white/10 ${collapsed ? "p-2" : "p-3"}`}>
        {isUserMenuOpen && (
          <div
            className={`absolute bottom-[calc(100%+0.5rem)] z-[999] overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-2 shadow-2xl shadow-slate-900/20 ${
              collapsed ? "left-2 w-[220px]" : "left-2 right-2"
            }`}
            role="menu"
          >
            <div className="px-2.5 py-2 border-b border-slate-100 mb-1.5">
              <p className="text-[11.5px] font-extrabold uppercase tracking-tight text-slate-900 truncate">
                {displayName}
              </p>
              <p className="text-[10.5px] font-semibold text-[#ff5c28] truncate">
                {displayEmail}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogoutAction}
              className="flex w-full items-center gap-2.5 rounded-xl border-0 bg-[#fff1f1] px-3 py-2 text-left text-xs font-bold text-[#ef4444] hover:bg-[#ffe5e5] transition cursor-pointer"
              role="menuitem"
            >
              <LogOut className="h-4 w-4 shrink-0 text-[#ef4444]" aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          title={displayName}
          className={`flex w-full items-center rounded-xl border border-white/15 bg-white/10 text-left transition-all duration-150 hover:bg-white/20 hover:border-white/25 cursor-pointer group ${
            collapsed ? "justify-center p-2" : "gap-2.5 p-2"
          }`}
        >
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={displayName}
              className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white/30"
            />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ff5c28] text-xs font-black text-white shadow-xs">
              {userInitial}
            </span>
          )}

          {!collapsed && (
            <>
              <div className="min-w-0 flex-1 flex-col justify-center">
                <span
                  className="block truncate text-[11.5px] font-bold text-white group-hover:text-white"
                  title={displayName}
                >
                  {displayName}
                </span>
                <span
                  className="block truncate text-[10px] font-semibold text-white/80"
                  title={displayEmail}
                >
                  {displayEmail}
                </span>
              </div>

              <ChevronDown
                className={`h-4 w-4 shrink-0 text-white/80 transition-transform duration-200 group-hover:text-white ${
                  isUserMenuOpen ? "rotate-180" : ""
                }`}
              />
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar with slide & collapse animation */}
      <aside
        className={`sibs-sidebar hidden border-r border-[#0d3b66] bg-[#042c51] text-white shadow-sm lg:flex transition-all duration-300 ease-in-out ${
          isSidebarHidden
            ? "!w-0 !min-w-0 !border-0 opacity-0 -translate-x-4 pointer-events-none overflow-hidden"
            : "!w-[260px] opacity-100 translate-x-0 overflow-visible"
        } ${isCollapsed && !isSidebarHidden ? "collapsed" : ""}`}
      >
        <div className="w-[260px] h-full flex flex-col shrink-0 overflow-visible relative">
          {renderContent({ collapsed: isCollapsed, mobile: false })}
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={handleMobileClose}
          className="sibs-sidebar-backdrop z-[95] lg:hidden"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`sibs-sidebar mobile z-[100] !w-[260px] max-w-[calc(100vw-2rem)] border-r border-[#0d3b66] bg-[#042c51] text-white shadow-2xl sm:!w-[280px] lg:hidden ${
          isMobileOpen ? "mobile-open" : ""
        }`}
      >
        {renderContent({ mobile: true })}
      </aside>
    </>
  );
};

export default AdminSidebar;
