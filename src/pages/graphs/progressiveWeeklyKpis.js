// Phase 1: request six full Sunday-Saturday windows, latest first.  Keeping
// this independent of JSX lets regression tests verify ordering and merging.
const DAY_MS = 86_400_000;

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

export function getProgressiveWeeklyWindows(referenceDate, count = 6) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(referenceDate || ''))) return [];
  const anchor = new Date(`${referenceDate}T00:00:00.000Z`);
  if (Number.isNaN(anchor.getTime()) || formatDate(anchor) !== referenceDate) return [];
  const mostRecentSunday = new Date(anchor.getTime() - anchor.getUTCDay() * DAY_MS);
  return Array.from({ length: count }, (_, i) => {
    const sunday = new Date(mostRecentSunday.getTime() - i * 7 * DAY_MS);
    const saturday = new Date(sunday.getTime() + 6 * DAY_MS);
    return { weekFrom: formatDate(sunday), weekTo: formatDate(saturday) };
  });
}

const CLOSED_STATUSES = new Set(['UNAVAILABLE', 'ACCOUNT_UNAVAILABLE']);
export function isWeeklyKpiUsable(payload, type) {
  const data = payload?.data?.data;
  if (!data || !Array.isArray(data.series) || data.series.length !== 1) return false;
  return !CLOSED_STATUSES.has(data[type]?.status);
}

// The backend uses a Sunday-week reporting key. Keep data ordered by the
// server's bucket key, not completion order; unrequested weeks stay missing.
export function buildPartialWeeklyResponse(pieces, type) {
  const ready = pieces.filter(Boolean);
  const first = ready[0]?.data?.data || {};
  const values = new Map();
  for (const item of ready) {
    for (const bucket of item?.data?.data?.series || []) values.set(bucket.key, bucket);
  }
  const summary = type === 'utilization'
    ? { utilizationPct: null, utilizationProductiveTime: null, totalShiftTime: null, utilizationMatchedEmployeeDays: null }
    : { absenteeismPct: null, actualHeadcount: null, presentHeadcount: null,
        presentEmployeeDays: null, absentEmployeeDays: null, scheduledEmployeeDays: null };
  return {
    data: {
      success: true,
      data: {
        summary,
        series: [...values.values()].sort((a, b) => a.key.localeCompare(b.key)),
        [type]: { ...(first[type] || {}), status: 'PARTIAL_LOADING',
          message: 'Weekly values are available. Full-period totals are still loading.' },
        filters: first.filters || {},
      },
    },
  };
}
