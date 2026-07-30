import { Menu } from "lucide-react";

const AppHeader = ({ subtitle, title, onMenuClick }) => {
  return (
    <header className="app-header">
      <div className="app-header-inner justify-start gap-3 px-4 sm:px-6 md:justify-between">
        {onMenuClick && (
          <button
            type="button"
            aria-label="Open sidebar"
            onClick={onMenuClick}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sibs-tertiary-9 bg-white text-sibs-primary-1 shadow-sm transition hover:border-sibs-tertiary-4 hover:bg-sibs-tertiary-4 hover:text-white md:hidden"
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
      <div className="app-header-line" />
    </header>
  );
};

export default AppHeader;
