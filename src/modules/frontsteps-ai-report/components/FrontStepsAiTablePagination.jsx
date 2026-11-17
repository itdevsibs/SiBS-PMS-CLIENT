import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

/**
 * FrontStepsAiTablePagination
 *
 * Exact replication of the Employee Records table pagination footer design:
 * - Direct bottom placement below the employee scorecard table
 * - 3-Column layout:
 *   LEFT:   Showing 1–15 of 29 employee records
 *   CENTER: «  ‹ Previous  1  2  Next ›  »
 *   RIGHT:  Page 1 of 2
 * - Compact outlined buttons with SiBS orange (#ff5c28) active highlight
 * - Full responsive stacking on mobile
 */
export default function FrontStepsAiTablePagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 15,
  onPageChange,
  itemLabel = "employee records",
  disabled = false,
  className = "",
}) {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, safeCurrentPage * pageSize);

  // Compact page-number window with ellipses for large page counts
  const getPageNumbers = () => {
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }

    const pages = [];
    const showLeftEllipsis = safeCurrentPage > 4;
    const showRightEllipsis = safeCurrentPage < safeTotalPages - 3;

    if (!showLeftEllipsis && showRightEllipsis) {
      pages.push(1, 2, 3, 4, 5, "...", safeTotalPages);
    } else if (showLeftEllipsis && !showRightEllipsis) {
      pages.push(
        1,
        "...",
        safeTotalPages - 4,
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
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:px-5 ${className}`}
    >
      {/* LEFT: Showing Range of Total */}
      <div className="flex items-center justify-center sm:justify-start text-xs sm:text-[13px] text-slate-500 font-medium">
        {totalItems === 0 ? (
          <span>
            Showing <strong className="font-semibold text-slate-800">0</strong> of{" "}
            <strong className="font-semibold text-slate-800">0</strong> {itemLabel}
          </span>
        ) : (
          <span>
            Showing{" "}
            <strong className="font-semibold text-slate-800">
              {startItem}–{endItem}
            </strong>{" "}
            of{" "}
            <strong className="font-semibold text-slate-800">
              {totalItems}
            </strong>{" "}
            {itemLabel}
          </span>
        )}
      </div>

      {/* CENTER: «  ‹ Previous  1  2  Next ›  » */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 self-center sm:self-auto">
        {/* First Page Button («) */}
        <button
          type="button"
          onClick={() => onPageChange?.(1)}
          disabled={disabled || safeCurrentPage <= 1}
          aria-label="First page"
          title="First page"
          className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white cursor-pointer"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </button>

        {/* Previous Page Button (‹ Previous) */}
        <button
          type="button"
          onClick={() => onPageChange?.(safeCurrentPage - 1)}
          disabled={disabled || safeCurrentPage <= 1}
          aria-label="Previous page"
          title="Previous page"
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs sm:text-[13px] font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white cursor-pointer"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Previous</span>
        </button>

        {/* Numbered Page Buttons */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="flex h-8 w-6 items-center justify-center text-xs font-bold text-slate-400 select-none"
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
                disabled={disabled || isActive}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-xs sm:text-[13px] transition-all ${
                  isActive
                    ? "border border-[#ff5c28] bg-[#ff5c28] font-bold text-white shadow-xs cursor-default"
                    : "border border-slate-200 bg-white font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page Button (Next ›) */}
        <button
          type="button"
          onClick={() => onPageChange?.(safeCurrentPage + 1)}
          disabled={disabled || safeCurrentPage >= safeTotalPages}
          aria-label="Next page"
          title="Next page"
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs sm:text-[13px] font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        {/* Last Page Button (») */}
        <button
          type="button"
          onClick={() => onPageChange?.(safeTotalPages)}
          disabled={disabled || safeCurrentPage >= safeTotalPages}
          aria-label="Last page"
          title="Last page"
          className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white cursor-pointer"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* RIGHT: Page X of Y */}
      <div className="flex items-center justify-center sm:justify-end text-xs sm:text-[13px] text-slate-500 font-medium">
        <span>
          Page{" "}
          <strong className="font-semibold text-slate-800">
            {safeCurrentPage}
          </strong>{" "}
          of{" "}
          <strong className="font-semibold text-slate-800">
            {safeTotalPages}
          </strong>
        </span>
      </div>
    </div>
  );
}
