import { useEffect, useRef, useState } from "react";
import { Bell, Calendar, Menu } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";

function formatHeaderDateTime() {
  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "short" });
  const day = now.getDate();
  const year = now.getFullYear();
  const time = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const offsetMinutes = -now.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const hours = Math.floor(Math.abs(offsetMinutes) / 60);
  const tz = `GMT${sign}${hours}`;

  return `${month} ${day}, ${year}, ${time} ${tz}`;
}

const AppHeader = ({
  onMenuClick,
  onSidebarToggle: propOnSidebarToggle,
  isSidebarHidden: propIsSidebarHidden,
  subtitle,
  title,
}) => {
  const sidebar = useSidebar();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef(null);

  const [currentDateTime, setCurrentDateTime] = useState(formatHeaderDateTime);

  // Read from prop if explicitly passed, otherwise fallback to global SidebarContext
  const isHidden =
    typeof propIsSidebarHidden === "boolean"
      ? propIsSidebarHidden
      : sidebar.isSidebarHidden;

  const handleSidebarToggle = propOnSidebarToggle || sidebar.toggleHidden;
  const handleMobileMenuClick = onMenuClick || sidebar.openMobile;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(formatHeaderDateTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isNotificationOpen) {
      return undefined;
    }

    const handleOutsidePointerDown = (event) => {
      if (isNotificationOpen && !notificationRef.current?.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointerDown);
    };
  }, [isNotificationOpen]);

  return (
    <>
      <header className="app-header fixed top-0 left-0 right-0 z-[90] bg-white md:sticky md:top-0 md:left-auto md:right-auto md:w-full">
        <div className="app-header-inner justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {/* Desktop/Tablet Toggle Button: ONLY visible when sidebar is closed/hidden */}
          {isHidden && (
            <button
              type="button"
              aria-label="Expand sidebar"
              title="Expand sidebar"
              onClick={handleSidebarToggle}
              className="hidden md:inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-[#ff5c28] hover:bg-[#ff5c28] hover:text-white transition-all duration-150 cursor-pointer shadow-2xs active:scale-95"
            >
              <Menu className="h-4.5 w-4.5" aria-hidden="true" />
            </button>
          )}

          {/* Mobile Drawer Toggle */}
          <button
            type="button"
            aria-label="Open sidebar"
            onClick={handleMobileMenuClick}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sibs-tertiary-9 bg-white text-sibs-primary-1 shadow-sm transition hover:border-sibs-primary-2 hover:bg-sibs-primary-2 hover:text-white md:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="min-w-0">
            <p className="m-0 truncate text-base font-bold text-sibs-primary-1">
              {typeof title === "string" ? title.replace(/\s+dashboard$/i, "").trim() : title}
            </p>
            {subtitle ? (
              <p className="m-0 truncate text-xs text-sibs-tertiary-5">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* 1. Date & Time */}
          <div className="hidden xl:flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 select-none">
            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            <span>{currentDateTime}</span>
          </div>

          {/* Divider */}
          <div className="hidden xl:block h-6 w-px bg-slate-200 shrink-0" aria-hidden="true" />

          {/* 2. Notification Bell */}
          <div ref={notificationRef} className="relative shrink-0">
            <button
              type="button"
              aria-label="Notifications"
              aria-expanded={isNotificationOpen}
              onClick={() => {
                setIsNotificationOpen((prev) => !prev);
              }}
              className={`relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition ${
                isNotificationOpen
                  ? "bg-slate-100 text-sibs-primary-1"
                  : "hover:bg-slate-100 hover:text-sibs-primary-1"
              }`}
            >
              <Bell className="h-4.5 w-4.5" aria-hidden="true" />
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-sibs-primary-2 ring-2 ring-white" />
            </button>

            {/* Empty Notification Dropdown Modal/Card */}
            {isNotificationOpen && (
              <div className="absolute right-0 top-full mt-2 w-88 sm:w-96 max-w-[calc(100vw-2rem)] min-h-[380px] rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 shrink-0 bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-black uppercase tracking-wider text-sibs-primary-1">
                      Notifications
                    </span>
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-sibs-primary-2 border border-orange-200">
                      0
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 ring-1 ring-slate-100 shadow-inner">
                    <Bell className="h-7 w-7" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">No notifications yet</p>
                  <p className="mt-1 text-xs text-slate-400 max-w-[220px]">
                    We will notify you here when there are new updates or alerts.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="app-header-line" />
    </header>
    <div
      className="h-[calc(82px+env(safe-area-inset-top,0px))] shrink-0 md:hidden pointer-events-none"
      aria-hidden="true"
    />
  </>
  );
};

export default AppHeader;
