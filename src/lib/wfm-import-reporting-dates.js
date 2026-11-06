// Format the date-only coverage saved on an import batch without shifting it
// into the browser's timezone. These are reporting dates, not timestamps.
const reportingDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatWfmImportReportingDate(value) {
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

  return reportingDateFormatter.format(date);
}
