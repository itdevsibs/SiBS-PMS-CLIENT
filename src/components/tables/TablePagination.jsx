import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Reusable corporate TablePagination component.
 *
 * @param {object} props
 * @param {number} props.currentPage - Active page number (1-indexed)
 * @param {number} props.totalPages - Total calculated pages
 * @param {number} props.totalItems - Total items matching filters
 * @param {number} [props.pageSize=10] - Number of items per page
 * @param {function} props.onPageChange - Handler receiving next page number
 * @param {string} [props.itemLabel="employees"] - Label for counted items
 * @param {string} [props.className=""] - Extra wrapper classes
 */
export default function TablePagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  itemLabel = "employees",
  className = "",
}) {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  const startItem =
    totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, safeCurrentPage * pageSize);

  // Generate pagination range (e.g. 1, 2, 3, '...', 10)
  const getPageNumbers = () => {
    if (safeTotalPages <= 5) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }

    const pages = [];
    const showLeftEllipsis = safeCurrentPage > 3;
    const showRightEllipsis = safeCurrentPage < safeTotalPages - 2;

    if (!showLeftEllipsis && showRightEllipsis) {
      pages.push(1, 2, 3, 4, "...", safeTotalPages);
    } else if (showLeftEllipsis && !showRightEllipsis) {
      pages.push(
        1,
        "...",
        safeTotalPages - 3,
        safeTotalPages - 2,
        safeTotalPages - 1,
        safeTotalPages
      );
    } else {
      pages.push(
        1,
        "...",
        safeCurrentPage - 1,
        safeCurrentPage,
        safeCurrentPage + 1,
        "...",
        safeTotalPages
      );
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200 bg-white px-3 py-2.5 sm:px-5 sm:py-3 ${className}`}
    >
      {/* Left side: Results Count Indicator */}
      <div className="text-xs sm:text-[13px] text-slate-600 font-medium text-center sm:text-left">
        {totalItems === 0 ? (
          <span>
            Showing <strong className="font-bold text-slate-900">0</strong> of{" "}
            <strong className="font-bold text-slate-900">0</strong> {itemLabel}
          </span>
        ) : (
          <span>
            Showing{" "}
            <strong className="font-bold text-slate-900">{startItem}</strong> to{" "}
            <strong className="font-bold text-slate-900">{endItem}</strong> of{" "}
            <strong className="font-bold text-slate-900">{totalItems}</strong>{" "}
            {itemLabel}
          </span>
        )}
      </div>

      {/* Right side: Page Navigation Controls */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 self-center sm:self-auto">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange?.(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1}
          aria-label="Previous page"
          className="inline-flex h-8.5 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs sm:text-[13px] font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Page Number Buttons */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="flex h-8.5 w-7 items-center justify-center text-xs font-bold text-slate-400 select-none"
                >
                  ...
                </span>
              );
            }

            const isActive = p === safeCurrentPage;

            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange?.(p)}
                aria-current={isActive ? "page" : undefined}
                className={`flex h-8.5 min-w-[34px] items-center justify-center rounded-lg px-2 text-xs sm:text-[13px] font-semibold transition-all ${
                  isActive
                    ? "border border-[#18466b] bg-[#18466b] text-white shadow-2xs font-bold"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange?.(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= safeTotalPages}
          aria-label="Next page"
          className="inline-flex h-8.5 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs sm:text-[13px] font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
