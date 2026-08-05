import { useState } from "react";
import { ChevronDown, LogOut, Menu, UserRound } from "lucide-react";

const AppHeader = ({
  onLogoutClick,
  onMenuClick,
  subtitle,
  title,
  userEmail,
  userName,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userInitial = userName?.charAt(0)?.toUpperCase() || "U";

  const handleLogoutClick = () => {
    setIsUserMenuOpen(false);
    onLogoutClick?.();
  };

  return (
    <header className="app-header">
      <div className="app-header-inner justify-start gap-3 px-4 sm:px-6 md:justify-between">
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
            <p className="m-0 truncate text-lg font-bold text-sibs-primary-1 sm:text-xl">
              {title}
            </p>
            {subtitle && (
              <p className="m-0 truncate text-xs text-sibs-tertiary-5 sm:text-sm">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {userName && (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((value) => !value)}
              className={`group flex min-w-0 items-center gap-3 rounded-xl border bg-white px-2 py-1.5 text-left shadow-sm transition hover:border-sibs-tertiary-8 ${
                isUserMenuOpen
                  ? "border-sibs-tertiary-8 ring-2 ring-sibs-tertiary-9/70"
                  : "border-transparent"
              }`}
              aria-expanded={isUserMenuOpen}
              aria-haspopup="menu"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sibs-primary-1 text-sm font-bold text-white shadow-sm">
                {userInitial}
              </span>
              <span className="hidden min-w-0 sm:block">
                <span className="block max-w-[220px] truncate text-sm font-extrabold uppercase leading-5 text-sibs-primary-1">
                  {userName}
                </span>
                <span className="block max-w-[220px] truncate text-xs font-semibold leading-4 text-sibs-primary-2">
                  {userEmail || "signed-in"}
                </span>
              </span>
              <ChevronDown
                className={`hidden h-4 w-4 shrink-0 text-sibs-tertiary-5 transition group-hover:text-sibs-primary-2 sm:block ${
                  isUserMenuOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            {isUserMenuOpen && (
              <div
                className="sibs-profile-dropdown-panel absolute right-0 top-[calc(100%+0.75rem)] z-[999] w-[286px] overflow-hidden rounded-xl border border-sibs-tertiary-9 bg-white p-3 shadow-xl"
                role="menu"
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg border-0 bg-transparent px-3 py-3 text-left transition hover:bg-sibs-primary-3"
                  role="menuitem"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sibs-tertiary-10 text-sibs-primary-1">
                    <UserRound className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-sibs-primary-1">
                      Switch to Employee
                    </span>
                    <span className="block text-xs text-sibs-tertiary-5">
                      Current role: Super Admin
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="mt-2 flex w-full items-center gap-3 rounded-lg border-0 bg-transparent px-3 py-3 text-left font-bold text-sibs-danger transition hover:bg-red-50"
                  role="menuitem"
                >
                  <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="app-header-line" />
    </header>
  );
};

export default AppHeader;
