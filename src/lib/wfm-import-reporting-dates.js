// Format the date-only coverage saved on an import batch without shifting it
// into the browser's timezone. These are reporting dates, not timestamps.
const reportingDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function parseReportingYmd(value) {
  if (value == null || value === '') return null;
  const text = value instanceof Date
    ? (Number.isFinite(value.getTime()) ? value.toISOString() : '')
    : String(value).trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})(?=$|[T ])/u.exec(text);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null;

  return { year, month, day, date };
}

export function formatWfmImportReportingDate(value) {
  const parsed = parseReportingYmd(value);
  if (!parsed) return null;
  return reportingDateFormatter.format(parsed.date);
}

/**
 * Format a coverage date range:
 * - Single date if both are same or only one exists: "Nov 3, 2026"
 * - Same month & year: "Nov 2–8, 2026"
 * - Different month, same year: "Oct 30 – Nov 3, 2026"
 * - Different year: "Dec 28, 2025 – Jan 3, 2026"
 * - Neither available: null
 */
export function formatWfmImportCoverage(fromDate, toDate) {
  const from = parseReportingYmd(fromDate);
  const to = parseReportingYmd(toDate);

  if (!from && !to) return null;
  if (from && !to) return reportingDateFormatter.format(from.date);
  if (!from && to) return reportingDateFormatter.format(to.date);

  // Both exist
  if (from.year === to.year && from.month === to.month && from.day === to.day) {
    return reportingDateFormatter.format(from.date);
  }

  const fromMonth = MONTH_NAMES[from.month - 1];
  const toMonth = MONTH_NAMES[to.month - 1];

  if (from.year === to.year && from.month === to.month) {
    return `${fromMonth} ${from.day}–${to.day}, ${from.year}`;
  }

  if (from.year === to.year) {
    return `${fromMonth} ${from.day} – ${toMonth} ${to.day}, ${from.year}`;
  }

  return `${fromMonth} ${from.day}, ${from.year} – ${toMonth} ${to.day}, ${to.year}`;
}

