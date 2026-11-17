import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  Menu,
  Lock,
} from "lucide-react";
import { FRONTSTEPS_NAV_MODULES } from "../config/frontStepsAiNavigation";
import { getAuthUser } from "@/lib/auth";
import { handleLogout as handleAuthLogout } from "@/lib/axios/api-template";
import useDashboardPage from "@/hooks/useDashboardPage";
import "../styles/frontsteps-ai-report.css";

export default function FrontStepsAiLayout({ children, activeRouteId = "" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dashboard = useDashboardPage();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // All parent modules expanded by default
  const [expandedParents, setExpandedParents] = useState(() =>
    FRONTSTEPS_NAV_MODULES.map((m) => m.key)
  );

  const toggleExpand = (moduleKey) => {
    setExpandedParents((prev) =>
      prev.includes(moduleKey)
        ? prev.filter((k) => k !== moduleKey)
        : [...prev, moduleKey]
    );
  };

  const authUser = getAuthUser();
  const fullNameFromParts = [authUser?.firstName, authUser?.middleName, authUser?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const displayName =
    authUser?.fullName ||
    authUser?.name ||
    fullNameFromParts ||
    authUser?.username ||
    authUser?.sibs_id ||
    "User";
  const displayEmail = authUser?.email || authUser?.roleLabel || "user@thesiblingssolutions.com";
  const userInitial = displayName?.charAt(0)?.toUpperCase() || "U";
  const avatarSrc = authUser?.avatar || authUser?.profile_photo || authUser?.photo_url || null;

  const handleNavClick = (sub) => {
    if (sub.path) {
      navigate(sub.path);
    }
    if (isMobileOpen) setIsMobileOpen(false);
  };

  // Find human-readable title for active route in breadcrumbs
  const activeSubmodule = FRONTSTEPS_NAV_MODULES.flatMap((m) => m.submodules).find(
    (sub) => sub.id === activeRouteId || (sub.path && location.pathname === sub.path)
  );
  const activePageTitle = activeSubmodule ? activeSubmodule.name : "Summary";

  const renderSidebarContent = (collapsed = false, isMobile = false) => {
    return (
      <div className="flex h-full w-full min-w-0 flex-col bg-[#042c51] text-white overflow-hidden">
        {/* 1. Brand Header */}
        <div
          className={`flex h-[60px] min-h-[60px] w-full shrink-0 items-center border-b border-[#0d3b66] px-3 ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          <div className={`flex items-center min-w-0 ${collapsed ? "justify-center" : "gap-2.5"}`}>
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff5c28] to-[#ff4713] text-sm font-extrabold text-white shadow-xs">
              FS
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-white shadow-xs" />
            </span>
            {!collapsed && (
              <div className="min-w-0 flex-1 truncate">
                <span className="block truncate text-xs font-black tracking-tight text-white leading-tight uppercase">
                  FrontSteps
                </span>
                <span className="block truncate text-[10px] font-semibold text-[#90a1b9] leading-tight mt-0.5">
                  AI Report Suite
                </span>
              </div>
            )}
          </div>

          {!isMobile && (
            <button
              type="button"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setIsCollapsed((prev) => !prev)}
              className={`flex items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer ${
                collapsed ? "h-6 w-6 mt-1" : "h-7 w-7"
              }`}
            >
              {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={14} />}
            </button>
          )}

          {isMobile && (
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setIsMobileOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* 2. Scrollable Navigation */}
        <div className={`py-3 flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden sibs-scrollbar ${collapsed ? "px-2" : "px-3"}`}>
          <p
            className={`mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-[#90a1b9] ${
              collapsed ? "text-center text-[9px] px-0" : ""
            }`}
          >
            {collapsed ? "Menu" : "MODULES"}
          </p>

          <nav className="flex flex-col gap-1 w-full min-w-0" aria-label="FrontSteps AI navigation">
            {FRONTSTEPS_NAV_MODULES.map((item) => {
              const Icon = item.icon;
              const isExpanded = expandedParents.includes(item.key);
              const isParentActive = item.submodules.some(
                (sub) => sub.id === activeRouteId || (sub.path && location.pathname === sub.path)
              );

              return (
                <div key={item.key} className="flex flex-col w-full min-w-0">
                  {/* Parent Module Row */}
                  <div
                    className={`group flex h-[36px] w-full items-center rounded-xl transition-all duration-150 ${
                      item.isAiGroup
                        ? isParentActive
                          ? "bg-white/[0.14] text-white font-bold border border-white/20"
                          : "text-[#cad5e2] hover:bg-white/[0.08] hover:text-white border border-transparent"
                        : isParentActive
                        ? "bg-white/[0.10] text-white font-bold"
                        : "text-[#cad5e2] hover:bg-white/[0.08] hover:text-white"
                    } ${collapsed ? "justify-center px-0" : "px-2.5"}`}
                  >
                    <button
                      type="button"
                      title={item.name}
                      onClick={() => {
                        if (collapsed) {
                          setIsCollapsed(false);
                          if (!expandedParents.includes(item.key)) {
                            setExpandedParents((prev) => [...prev, item.key]);
                          }
                        } else {
                          toggleExpand(item.key);
                        }
                      }}
                      className={`flex flex-1 min-w-0 cursor-pointer items-center gap-2.5 border-0 bg-transparent p-0 text-left font-semibold text-inherit outline-none ${
                        collapsed ? "h-[36px] w-[36px] justify-center" : ""
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          isParentActive
                            ? "text-[#ff5c28]"
                            : item.isAiGroup
                            ? "text-[#ff5c28] group-hover:text-white"
                            : "text-[#90a1b9] group-hover:text-white"
                        }`}
                        strokeWidth={1.9}
                      />
                      {!collapsed && (
                        <span className="min-w-0 flex-1 truncate text-left text-[12.5px] font-semibold leading-5">
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
                          toggleExpand(item.key);
                        }}
                        className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0 transition-all hover:bg-white/10 outline-none text-[#90a1b9] hover:text-white"
                      >
                        <ChevronDown
                          size={13}
                          strokeWidth={2.2}
                          className={`transform transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : "rotate-0"
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {/* Submodules Accordion */}
                  {!collapsed && (
                    <div
                      className="grid transition-all duration-200 ease-in-out w-full min-w-0"
                      style={{
                        gridTemplateRows: isExpanded ? "1fr" : "0fr",
                        opacity: isExpanded ? 1 : 0,
                        marginTop: isExpanded ? "0.2rem" : "0rem",
                        pointerEvents: isExpanded ? "auto" : "none",
                      }}
                    >
                      <div className="overflow-hidden w-full min-w-0">
                        <div className="relative ml-2.5 flex flex-col gap-0.5 border-l-2 border-white/20 pl-2 py-0.5 min-w-0">
                          {item.submodules.map((sub) => {
                            const SubIcon = sub.icon;
                            const isSubActive =
                              sub.id === activeRouteId || (sub.path && location.pathname === sub.path);
                            const isLocked = Boolean(sub.isLocked);

                            if (isLocked) {
                              return (
                                <div
                                  key={sub.id}
                                  title={`${sub.name} (In Progress)`}
                                  className="flex h-[30px] w-full select-none items-center gap-2 rounded-lg px-2 text-left text-[11px] font-medium text-slate-400/80 cursor-not-allowed opacity-80 min-w-0"
                                >
                                  <Lock className="h-3 w-3 shrink-0 text-amber-400/90" strokeWidth={2} />
                                  <span className="min-w-0 flex-1 truncate text-left">
                                    {sub.name}
                                  </span>
                                  <span className="shrink-0 rounded-full bg-amber-400/20 border border-amber-400/40 px-1.5 py-0.2 text-[8.5px] font-extrabold text-amber-300 uppercase">
                                    In Progress
                                  </span>
                                </div>
                              );
                            }

                            return (
                              <button
                                key={sub.id}
                                type="button"
                                title={sub.name}
                                onClick={() => handleNavClick(sub)}
                                className={`group/sub flex h-[30px] w-full cursor-pointer items-center gap-2 rounded-lg border-0 px-2 text-left text-[11.5px] font-medium transition-all duration-150 min-w-0 ${
                                  isSubActive
                                    ? "bg-[#ff5c28] text-white font-bold shadow-xs hover:!bg-[#ff5c28] hover:!text-white"
                                    : "text-[#cad5e2] hover:bg-white/[0.08] hover:text-white"
                                }`}
                              >
                                {SubIcon && (
                                  <SubIcon
                                    className={`h-3 w-3 shrink-0 transition-colors ${
                                      isSubActive ? "text-white" : "text-[#90a1b9] group-hover/sub:text-white"
                                    }`}
                                    strokeWidth={1.8}
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
            })}
          </nav>
        </div>

        {/* 3. Bottom User Profile Section */}
        <div className={`border-t border-[#0d3b66] shrink-0 bg-[#042c51] ${collapsed ? "p-2" : "p-2.5"}`}>
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-2.5"}`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0d3b66] text-xs font-bold text-white uppercase overflow-hidden ring-1 ring-white/20">
              {avatarSrc ? (
                <img src={avatarSrc} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                userInitial
              )}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white leading-tight" title={displayName}>
                  {displayName}
                </p>
                <p className="truncate text-[10px] text-slate-400 leading-tight mt-0.5" title={displayEmail}>
                  {displayEmail}
                </p>
              </div>
            )}
            {!collapsed && (
              <button
                type="button"
                title="Log out"
                onClick={() => handleAuthLogout()}
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:text-rose-400 hover:bg-white/10 transition cursor-pointer shrink-0"
              >
                <LogOut size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const shellClasses = [
    "frontsteps-ai-shell",
    isCollapsed ? "is-collapsed" : "",
    isSidebarHidden ? "is-sidebar-hidden" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellClasses} data-fs-ai="true">
      {/* 1. Desktop Sidebar Column (Confined to Grid Track 1) */}
      <aside className="frontsteps-ai-sidebar desktop-track" aria-label="FrontSteps sidebar">
        {renderSidebarContent(isCollapsed, false)}
      </aside>

      {/* 2. Mobile Drawer & Backdrop */}
      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar backdrop"
          onClick={() => setIsMobileOpen(false)}
          className="frontsteps-ai-backdrop lg:hidden"
        />
      )}
      {isMobileOpen && (
        <aside className="frontsteps-ai-drawer lg:hidden" aria-label="FrontSteps mobile menu">
          {renderSidebarContent(false, true)}
        </aside>
      )}

      {/* 3. Main Content Column (Confined to Grid Track 2) */}
      <main className="frontsteps-ai-main">
        {/* Top Header */}
        <header className="frontsteps-ai-header">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition lg:hidden cursor-pointer"
              title="Open menu"
            >
              <Menu size={18} />
            </button>

            {/* Desktop Expand Button when Sidebar is Hidden */}
            {isSidebarHidden && (
              <button
                type="button"
                onClick={() => setIsSidebarHidden(false)}
                className="hidden lg:flex p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                title="Expand sidebar"
              >
                <Menu size={18} />
              </button>
            )}

            {/* Breadcrumb Path */}
            <div className="flex items-center gap-1.5 text-xs truncate">
              <span className="font-bold uppercase tracking-wider text-slate-400">
                FrontSteps
              </span>
              <span className="text-slate-300">/</span>
              <span className="font-bold text-slate-500">
                AI Report
              </span>
              <span className="text-slate-300">/</span>
              <span className="font-black text-[#042c51] truncate">
                {activePageTitle}
              </span>
            </div>
          </div>

          {/* Right Header Badges: Snapshot-Driven Zero-Hermes Status */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Snapshot-Driven (0 Hermes GET)</span>
            </span>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <div className="frontsteps-ai-content sibs-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
