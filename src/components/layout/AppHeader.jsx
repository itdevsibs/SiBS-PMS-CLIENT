import { useEffect, useRef, useState } from "react";
import { Bell, Calendar, ChevronDown, LogOut, Menu } from "lucide-react";
import { getAuthUser } from "@/lib/auth";
import { handleLogout as handleAuthLogout } from "@/lib/axios/api-template";

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
  onLogoutClick,
  onMenuClick,
  subtitle,
  title,
  userEmail,
  userName,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const authUser = getAuthUser();
  // Uses the saved employee name fields when the API does not send one full name.
  const fullNameFromParts = [
    authUser?.firstName,
    authUser?.middleName,
    authUser?.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  const displayName =
    userName ||
    authUser?.fullName ||
    authUser?.name ||
    fullNameFromParts ||
    authUser?.username ||
    authUser?.sibs_id ||
    "User";
  const displayEmail = userEmail || authUser?.email || authUser?.roleLabel || "signed-in";
  const userInitial = displayName?.charAt(0)?.toUpperCase() || "U";

  const [currentDateTime, setCurrentDateTime] = useState(formatHeaderDateTime);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(formatHeaderDateTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  useEffect(() => {
    if (!isUserMenuOpen) {
      return undefined;
    }

    const handleOutsidePointerDown = (event) => {
      if (!userMenuRef.current?.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointerDown);
    };
  }, [isUserMenuOpen]);

  const handleLogoutClick = () => {
    setIsUserMenuOpen(false);

    // Dashboard pages pass this handler to show the confirmation modal first.
    if (onLogoutClick) {
      onLogoutClick();
      return;
    }

    void handleAuthLogout(true);
  };

  return (
    <>
      <header className="app-header fixed top-0 left-0 right-0 z-[90] bg-white md:sticky md:top-0 md:left-auto md:right-auto md:w-full">
        <div className="app-header-inner justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {onMenuClick && (
            <button
              type="button"
              aria-label="Open sidebar"
              onClick={onMenuClick}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sibs-tertiary-9 bg-white text-sibs-primary-1 shadow-sm transition hover:border-sibs-primary-2 hover:bg-sibs-primary-2 hover:text-white md:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          )}

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
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-sibs-primary-1"
          >
            <Bell className="h-4.5 w-4.5" aria-hidden="true" />
            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-sibs-primary-2 ring-2 ring-white" />
          </button>

          {/* Divider */}
          <div className="hidden sm:block h-6 w-px bg-slate-200 shrink-0" aria-hidden="true" />

          {/* 3. User Profile */}
          {displayName && (
            <div ref={userMenuRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((value) => !value)}
                className={`group flex min-w-0 cursor-pointer items-center gap-0 sm:gap-2.5 rounded-full sm:rounded-[14px] border p-0.5 sm:px-2 sm:py-1 text-left transition-all duration-150 ${
                  isUserMenuOpen
                    ? "border-[#ffb899] bg-[#fff3eb] shadow-xs"
                    : "border-transparent hover:bg-slate-100"
                }`}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
              >
                {avatarSrc && !avatarError ? (
                  <img
                    src={avatarSrc}
                    alt={displayName}
                    onError={() => setAvatarError(true)}
                    className="h-9 w-9 shrink-0 rounded-full object-cover shadow-sm ring-1 ring-slate-200"
                  />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sibs-primary-1 text-sm font-bold text-white shadow-sm">
                    {userInitial}
                  </span>
                )}
                <span className="hidden min-w-0 flex-col text-left md:flex">
                  <span
                    className="block max-w-[130px] lg:max-w-[180px] truncate text-[12px] font-extrabold uppercase leading-5 text-sibs-primary-1"
                    title={displayName}
                  >
                    {displayName}
                  </span>
                  <span
                    className="block max-w-[130px] lg:max-w-[180px] truncate text-[11px] font-semibold leading-4 text-sibs-primary-2"
                    title={displayEmail}
                  >
                    {displayEmail}
                  </span>
                </span>
                <ChevronDown
                  className={`hidden sm:block h-4 w-4 shrink-0 transition-transform duration-200 ${
                    isUserMenuOpen
                      ? "rotate-180 text-sibs-primary-1"
                      : "text-slate-500 group-hover:text-sibs-primary-1"
                  }`}
                  aria-hidden="true"
                />
              </button>

              {isUserMenuOpen && (
                <div
                  className="sibs-profile-dropdown-panel absolute right-0 top-[calc(100%+0.5rem)] z-[999] w-[180px] sm:w-[200px] overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xl"
                  role="menu"
                >
                  <button
                    type="button"
                    onClick={handleLogoutClick}
                    className="flex w-full items-center gap-3 rounded-xl border-0 bg-[#fff1f1] px-3.5 py-2.5 text-left text-sm font-bold text-[#ef4444] transition hover:bg-[#ffe5e5] cursor-pointer"
                    role="menuitem"
                  >
                    <LogOut className="h-4.5 w-4.5 shrink-0 text-[#ef4444]" aria-hidden="true" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
          </div>
        )}
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
