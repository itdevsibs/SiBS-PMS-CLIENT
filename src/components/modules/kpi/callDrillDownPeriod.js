function formatUtcDate(date) {
  return date.toISOString().slice(0, 10);
}

function toDateOnly(value) {
  if (!value) return undefined;
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return formatUtcDate(parsed);
}

// Mirrors server WoW rule in callKpiService.js: weeks start Sunday and end Saturday,
// where Week 1 is the Sunday-Saturday week containing January 1.
export function resolvePeriodDateRange(item) {
  if (!item) return { dateFrom: undefined, dateTo: undefined };

  const explicitFrom = toDateOnly(item.startDate || item.dateFrom);
  const explicitTo = toDateOnly(item.endDate || item.dateTo);
  if (explicitFrom) {
    return { dateFrom: explicitFrom, dateTo: explicitTo || explicitFrom };
  }

  const key = String(item.key || "").trim();

  // Daily / custom: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
    return { dateFrom: key, dateTo: key };
  }

  // Weekly: YYYY-W##
  const weekMatch = /^(\d{4})-W(\d{1,2})$/i.exec(key);
  if (weekMatch) {
    const year = Number(weekMatch[1]);
    const week = Number(weekMatch[2]);
    const jan1 = new Date(Date.UTC(year, 0, 1));
    const firstSunday = new Date(Date.UTC(year, 0, 1 - jan1.getUTCDay()));
    const start = new Date(firstSunday.getTime());
    start.setUTCDate(start.getUTCDate() + (week - 1) * 7);
    const end = new Date(start.getTime());
    end.setUTCDate(end.getUTCDate() + 6);
    return { dateFrom: formatUtcDate(start), dateTo: formatUtcDate(end) };
  }

  // Monthly: YYYY-MM
  const monthMatch = /^(\d{4})-(\d{2})$/.exec(key);
  if (monthMatch) {
    const year = Number(monthMatch[1]);
    const month = Number(monthMatch[2]);
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
    return { dateFrom: formatUtcDate(start), dateTo: formatUtcDate(end) };
  }

  // Quarterly: YYYY-Q#
  const quarterMatch = /^(\d{4})-Q([1-4])$/i.exec(key);
  if (quarterMatch) {
    const year = Number(quarterMatch[1]);
    const quarter = Number(quarterMatch[2]);
    const startMonth = (quarter - 1) * 3;
    const start = new Date(Date.UTC(year, startMonth, 1));
    const end = new Date(Date.UTC(year, startMonth + 3, 0));
    return { dateFrom: formatUtcDate(start), dateTo: formatUtcDate(end) };
  }

  // Annually: YYYY
  if (/^\d{4}$/.test(key)) {
    return { dateFrom: `${key}-01-01`, dateTo: `${key}-12-31` };
  }

  return { dateFrom: undefined, dateTo: undefined };
}

// Clamp to the effective parent range so partial periods reconcile with the graph.
export function resolveAhtPeriodDateRange(item, filters = {}) {
  const {dateFrom,dateTo}=resolvePeriodDateRange(item);
  const parentFrom=toDateOnly(filters.dateFrom), parentTo=toDateOnly(filters.dateTo);
  if (!dateFrom || !dateTo || !parentFrom || !parentTo) return null;
  const start=dateFrom > parentFrom ? dateFrom : parentFrom;
  const end=dateTo < parentTo ? dateTo : parentTo;
  return start<=end ? {dateFrom:start,dateTo:end} : null;
}
