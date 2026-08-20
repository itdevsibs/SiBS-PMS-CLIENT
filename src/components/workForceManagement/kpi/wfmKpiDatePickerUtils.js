const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function pad(value) {
  return String(value).padStart(2, "0");
}

export function toIsoDate(year, month, day) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export function parseIsoDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function formatDateForDisplay(value) {
  const parsed = parseIsoDate(value);
  if (!parsed) return "Select date";
  return `${MONTHS_SHORT[parsed.month]} ${parsed.day}, ${parsed.year}`;
}

export function shiftMonth(year, month, amount) {
  const date = new Date(year, month + amount, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function buildCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + index,
    );

    return {
      iso: toIsoDate(date.getFullYear(), date.getMonth(), date.getDate()),
      day: date.getDate(),
      month: date.getMonth(),
      year: date.getFullYear(),
      inCurrentMonth: date.getMonth() === month && date.getFullYear() === year,
    };
  });
}

export function getTodayIso() {
  const today = new Date();
  return toIsoDate(today.getFullYear(), today.getMonth(), today.getDate());
}

export function getMonthLabel(year, month) {
  return `${MONTHS_SHORT[month]} ${year}`;
}
