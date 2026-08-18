// Builds and stores dynamic WFM graph report data from uploaded raw rows.
const WFM_GRAPH_REPORTS_KEY = "sibs-wfm-graph-reports";
export const WFM_GRAPH_REPORTS_UPDATED_EVENT = "sibs-wfm-graph-reports-updated";

const metricColors = {
  abandonRate: "#EF4444",
  abandoned: "#DC2626",
  afterCallTime: "#64748B",
  asa: "#7C3AED",
  aht: "#7C3AED",
  backlog: "#DC2626",
  csat: "#06B6D4",
  failed: "#D97706",
  finalScore: "#2563EB",
  handled: "#16A34A",
  holdTime: "#EA580C",
  netOffered: "#0891B2",
  offered: "#2563EB",
  productivity: "#4F46E5",
  quality: "#0F766E",
  queueTime: "#D97706",
  reachability: "#06B6D4",
  resolved: "#16A34A",
  serviceLevel: "#0F766E",
  sla: "#0F766E",
  talkTime: "#4F46E5",
  tickets: "#2563EB",
};

const fallbackColors = [
  "#2563EB",
  "#16A34A",
  "#0891B2",
  "#DC2626",
  "#D97706",
  "#0F766E",
  "#06B6D4",
  "#7C3AED",
  "#4F46E5",
  "#64748B",
];

const dateNameHints = [
  "date",
  "datetime",
  "startdate",
  "enddate",
  "reportdate",
  "kpiperiod",
  "period",
  "week",
  "month",
];
const dimensionNameHints = [
  "account",
  "campaign",
  "channel",
  "country",
  "department",
  "employee",
  "product",
  "queue",
  "region",
  "site",
  "skill",
  "team",
];
const identifierNameHints = [
  "employeeid",
  "employeeids",
  "idnumber",
  "recordid",
  "recordnumber",
  "rownumber",
  "userid",
];
const statusNameHints = ["status", "state", "result", "outcome", "disposition"];
const descriptionNameHints = ["remark", "remarks", "comment", "comments", "description", "notes"];

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[%()/_<>-]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, "");
}

function normalizeLabel(value) {
  return String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getColumnValues(rows, column) {
  return rows
    .map((row) => row?.[column])
    .filter((value) => value != null && value !== "" && value !== "-");
}

function getDisplayValue(value) {
  if (value == null || value === "") return "-";

  return String(value).trim() || "-";
}

function parseMetricValue(value) {
  if (value == null || value === "-") return null;

  const textValue = String(value).trim();
  const durationMatch = textValue.match(/^(\d+):([0-5]?\d)(?::([0-5]?\d))?$/);

  if (durationMatch) {
    const [, hoursOrMinutes, minutesOrSeconds, secondsText] = durationMatch;
    const firstPart = Number(hoursOrMinutes);
    const secondPart = Number(minutesOrSeconds);
    const thirdPart = secondsText == null ? null : Number(secondsText);

    return thirdPart == null
      ? firstPart * 60 + secondPart
      : firstPart * 3600 + secondPart * 60 + thirdPart;
  }

  const cleanedValue = textValue.replace(/,/g, "").replace("%", "").trim();
  const numberValue = Number(cleanedValue);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function parseDateValue(value) {
  if (!value || value === "-") return null;

  const textValue = String(value).trim();
  const firstRangePart = textValue.split(/\s+(?:-|to|through)\s+/i)[0];
  const parsedDate = new Date(firstRangePart || textValue);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function parseDateRangeValue(value) {
  if (!value || value === "-") return null;

  const textValue = String(value).trim();
  const [startText, endText] = textValue.split(/\s+(?:-|to|through)\s+/i);
  const startDate = parseDateValue(startText || textValue);
  const endDate = endText ? parseDateValue(endText) : startDate;

  if (!startDate && !endDate) return null;

  return {
    end: endDate || startDate,
    start: startDate || endDate,
  };
}

function formatDateValue(date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getColumnType(column, rows) {
  const normalizedColumn = normalizeKey(column);
  const values = getColumnValues(rows, column).slice(0, 60);
  const numericValues = values.map(parseMetricValue).filter((value) => value != null);
  const dateValues = values.map(parseDateRangeValue).filter(Boolean);
  const numericRatio = values.length ? numericValues.length / values.length : 0;
  const dateRatio = values.length ? dateValues.length / values.length : 0;
  const hasMetricNameHint =
    /%|total|avg|average|count|score|rate|calls|tickets|handled|offered|failed|resolved|backlog|volume|quantity|time|duration|aht|asa|sla|servicelevel|reachability|quality|csat|productivity|attendance/i.test(
      String(column),
    );

  if (dateNameHints.some((hint) => normalizedColumn.includes(hint)) && dateRatio >= 0.5) {
    return "date";
  }

  if (identifierNameHints.some((hint) => normalizedColumn.includes(hint))) {
    return "identifier";
  }

  if (numericRatio >= 0.7 || (hasMetricNameHint && numericRatio >= 0.35)) {
    if (/time|duration|aht|asa|seconds|sec|min|talk|hold|queue|aftercall|ivr|wrap|warp/i.test(normalizedColumn)) {
      return "duration";
    }

    if (
      String(column).includes("%") ||
      /percentage|percent|rate|score|sla|servicelevel|reachability|quality|csat|productivity|attendance/i.test(
        normalizedColumn,
      ) ||
      values.some((value) => String(value).includes("%"))
    ) {
      return "percentage";
    }

    if (/calls|tickets|count|total|quantity|volume|resolved|received|handled|offered|failed|abandoned|backlog/i.test(normalizedColumn)) {
      return "count";
    }

    return "number";
  }

  if (numericValues.length && numericRatio >= 0.45) {
    return "number";
  }

  if (
    dimensionNameHints.some((hint) => normalizedColumn.includes(hint)) ||
    new Set(values.map(String)).size <= Math.max(20, values.length * 0.5)
  ) {
    return "dimension";
  }

  return "unknown";
}

function isSequentialNumeric(values) {
  const numbers = values
    .map(parseMetricValue)
    .filter((value) => value != null)
    .sort((a, b) => a - b);

  if (numbers.length < 4) return false;

  const sequentialCount = numbers.slice(1).filter(
    (value, index) => Math.abs(value - numbers[index]) <= 1,
  ).length;

  return sequentialCount / (numbers.length - 1) >= 0.8;
}

function getFieldRole({ column, type, uniqueCount, values }) {
  const normalizedColumn = normalizeKey(column);
  const nonEmptyValues = values.filter((value) => getDisplayValue(value) !== "-");
  const uniqueRatio = nonEmptyValues.length ? uniqueCount / nonEmptyValues.length : 0;

  if (type === "date") return "TIME_DIMENSION";
  if (
    identifierNameHints.some((hint) => normalizedColumn.includes(hint)) ||
    (type !== "date" && uniqueRatio >= 0.9 && isSequentialNumeric(nonEmptyValues))
  ) {
    return "IDENTIFIER";
  }
  if (statusNameHints.some((hint) => normalizedColumn.includes(hint)) && uniqueCount <= 12) {
    return "STATUS";
  }
  if (descriptionNameHints.some((hint) => normalizedColumn.includes(hint)) || uniqueRatio > 0.85) {
    return "DESCRIPTION";
  }
  if (type === "percentage") return "PERCENTAGE_METRIC";
  if (type === "duration") return "DURATION_METRIC";
  if (type === "count") return "COUNT_METRIC";
  if (type === "number") return "METRIC";
  if (type === "dimension") return "DIMENSION";

  return "UNKNOWN";
}

function getColumnProfile(column, rows) {
  const values = rows.map((row) => row?.[column]);
  const filledValues = values.filter((value) => getDisplayValue(value) !== "-");
  const uniqueValues = new Set(filledValues.map((value) => getDisplayValue(value)));
  const type = getColumnType(column, rows);
  const numericValues = filledValues.map(parseMetricValue).filter((value) => value != null);
  const role = getFieldRole({
    column,
    type,
    uniqueCount: uniqueValues.size,
    values,
  });
  const average = numericValues.length
    ? numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length
    : null;

  return {
    average,
    blank: values.length - filledValues.length,
    column,
    dataType: type,
    filled: filledValues.length,
    label: normalizeLabel(column),
    max: numericValues.length ? Math.max(...numericValues) : null,
    min: numericValues.length ? Math.min(...numericValues) : null,
    normalizedName: normalizeKey(column),
    role,
    sampleValues: Array.from(uniqueValues).slice(0, 6),
    total: values.length,
    type,
    unique: uniqueValues.size,
    visualizable: !["IDENTIFIER", "DESCRIPTION"].includes(role) && filledValues.length > 0,
  };
}

function getMetricCategory(column, type) {
  const key = normalizeKey(column);

  if (/servicelevel|sla/.test(key)) return "serviceLevel";
  if (/reachability/.test(key)) return "reachability";
  if (/abandon.*rate|abandoned.*rate/.test(key)) return "abandonRate";
  if (/net.*abandon|abandon.*net/.test(key)) return "netAbandoned";
  if (/short.*abandon/.test(key)) return "shortAbandoned";
  if (/abandon/.test(key)) return "abandoned";
  if (/failed/.test(key)) return "failed";
  if (/net.*offered|offered.*net/.test(key)) return "netOffered";
  if (/offered/.test(key)) return "offered";
  if (/handled.*slt|slt.*handled/.test(key) && />|over|greater/.test(String(column).toLowerCase())) return "handledOverSlt";
  if (/handled.*slt|slt.*handled/.test(key) && /<=|within|less/.test(String(column).toLowerCase())) return "handledWithinSlt";
  if (/handled/.test(key)) return "handled";
  if (/avg.*handle|average.*handle/.test(key)) return "aht";
  if (/avg.*talk|average.*talk/.test(key)) return "talkTime";
  if (/avg.*hold|average.*hold/.test(key)) return "holdTime";
  if (/wrap|warp/.test(key)) return "afterCallTime";
  if (/ivr.*avg|avg.*ivr/.test(key)) return "avgIvrTime";
  if (/ivr.*time|time.*ivr/.test(key)) return "ivrTime";
  if (/ivr/.test(key)) return "ivrCalls";
  if (/aftercall|acw/.test(key)) return "afterCallTime";
  if (/talk/.test(key)) return "talkTime";
  if (/hold/.test(key)) return "holdTime";
  if (/queue/.test(key)) return "queueTime";
  if (/asa/.test(key)) return "asa";
  if (/aht|handle.*time/.test(key)) return "aht";
  if (/attendance/.test(key)) return "attendance";
  if (/quality/.test(key)) return "quality";
  if (/productivity/.test(key)) return "productivity";
  if (/csat/.test(key)) return "csat";
  if (/final.*score|score/.test(key)) return "finalScore";
  if (/resolved/.test(key)) return "resolved";
  if (/received|ticket/.test(key)) return "tickets";
  if (/backlog/.test(key)) return "backlog";

  return type;
}

function getMetric(column, type, index) {
  const category = getMetricCategory(column, type);

  return {
    aggregation: type === "count" ? "sum" : "average",
    category,
    color: metricColors[category] || fallbackColors[index % fallbackColors.length],
    column,
    key: normalizeKey(column) || `metric${index + 1}`,
    label: normalizeLabel(column),
    type,
    unit: type === "percentage" ? "%" : "",
  };
}

function getReadableMetricLabel(metric) {
  const labelMap = {
    abandonRate: "Abandon Rate",
    abandoned: "Total Abandoned Calls",
    afterCallTime: "After Call Time",
    asa: "ASA",
    aht: "Average Handle Time",
    avgIvrTime: "Average IVR Time",
    backlog: "Backlog",
    csat: "CSAT",
    failed: "Failed Calls",
    finalScore: "Final Score",
    handled: "Total Handled Calls",
    handledOverSlt: "Handled Over SLT",
    handledWithinSlt: "Handled Within SLT",
    holdTime: "Hold Time",
    ivrCalls: "Total Calls IVR",
    ivrTime: "Total IVR Time",
    netAbandoned: "Net Abandoned Calls",
    netOffered: "Net Calls Offered",
    offered: "Total Calls Offered",
    productivity: "Productivity",
    quality: "Quality",
    queueTime: "Queue Time",
    reachability: "Reachability",
    resolved: "Resolved",
    serviceLevel: "Service Level",
    shortAbandoned: "Short Abandoned Calls",
    sla: "SLA",
    talkTime: "Talk Time",
    tickets: "Tickets",
  };

  return labelMap[metric.category] || metric.label;
}

function prepareMetric(metric, chartType) {
  return {
    ...metric,
    chartType: chartType || metric.chartType || (metric.type === "count" ? "bar" : "line"),
    label: getReadableMetricLabel(metric),
  };
}

function getIsoWeekInfo(date) {
  const targetDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = targetDate.getUTCDay() || 7;

  targetDate.setUTCDate(targetDate.getUTCDate() + 4 - dayNumber);

  const yearStart = new Date(Date.UTC(targetDate.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((targetDate - yearStart) / 86400000 + 1) / 7);
  const weekStart = new Date(targetDate);
  weekStart.setUTCDate(targetDate.getUTCDate() - 3);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

  return {
    dateLabel: `${formatDateValue(weekStart)} - ${formatDateValue(weekEnd)}`,
    label: `W${String(weekNumber).padStart(2, "0")}`,
    sortKey: `${targetDate.getUTCFullYear()}-${String(weekNumber).padStart(2, "0")}`,
    weekNumber,
    year: targetDate.getUTCFullYear(),
  };
}

function getIsoWeeksInYear(year) {
  return getIsoWeekInfo(new Date(Date.UTC(year, 11, 28))).weekNumber;
}

function shiftIsoWeek(year, weekNumber, offset) {
  let shiftedYear = year;
  let shiftedWeek = weekNumber + offset;

  while (shiftedWeek < 1) {
    shiftedYear -= 1;
    shiftedWeek += getIsoWeeksInYear(shiftedYear);
  }

  while (shiftedWeek > getIsoWeeksInYear(shiftedYear)) {
    shiftedWeek -= getIsoWeeksInYear(shiftedYear);
    shiftedYear += 1;
  }

  return {
    sortKey: `${shiftedYear}-${String(shiftedWeek).padStart(2, "0")}`,
    weekNumber: shiftedWeek,
    year: shiftedYear,
  };
}

function getIsoWeekStartDate(year, weekNumber) {
  const fourthOfJanuary = new Date(Date.UTC(year, 0, 4));
  const fourthDayNumber = fourthOfJanuary.getUTCDay() || 7;
  const weekOneMonday = new Date(fourthOfJanuary);

  weekOneMonday.setUTCDate(fourthOfJanuary.getUTCDate() - fourthDayNumber + 1);
  weekOneMonday.setUTCDate(weekOneMonday.getUTCDate() + (weekNumber - 1) * 7);

  return weekOneMonday;
}

function makeEmptyIsoWeekBucket(year, weekNumber) {
  const weekStart = getIsoWeekStartDate(year, weekNumber);
  const weekEnd = new Date(weekStart);

  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

  return {
    dateLabel: `${formatDateValue(weekStart)} - ${formatDateValue(weekEnd)}`,
    label: `W${String(weekNumber).padStart(2, "0")}`,
    rows: [],
    sortKey: `${year}-${String(weekNumber).padStart(2, "0")}`,
  };
}

function getDateBucket(value, period = "weekly") {
  const date = parseDateValue(value);

  if (!date) {
    return {
      dateLabel: String(value || "Unspecified"),
      label: String(value || "Unspecified"),
      sortKey: String(value || "Unspecified"),
    };
  }

  if (period === "monthly") {
    return {
      dateLabel: new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(date),
      label: new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "numeric",
      }).format(date),
      sortKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    };
  }

  if (period === "quarterly") {
    const quarter = Math.floor(date.getMonth() / 3) + 1;

    return {
      dateLabel: `Quarter ${quarter}, ${date.getFullYear()}`,
      label: `Q${quarter} ${date.getFullYear()}`,
      sortKey: `${date.getFullYear()}-Q${quarter}`,
    };
  }

  if (period === "annual") {
    return {
      dateLabel: String(date.getFullYear()),
      label: String(date.getFullYear()),
      sortKey: String(date.getFullYear()),
    };
  }

  return getIsoWeekInfo(date);
}

function aggregateValues(rows, column, aggregation) {
  const values = rows
    .map((row) => parseMetricValue(row[column]))
    .filter((value) => value != null);

  if (!values.length) return null;

  if (aggregation === "sum") {
    return values.reduce((sum, value) => sum + value, 0);
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function groupRows(rows, getBucket) {
  const groups = new Map();

  rows.forEach((row) => {
    const bucket = getBucket(row);
    const currentRows = groups.get(bucket.sortKey) || {
      dateLabel: bucket.dateLabel,
      label: bucket.label,
      rows: [],
      sortKey: bucket.sortKey,
    };

    currentRows.rows.push(row);
    groups.set(bucket.sortKey, currentRows);
  });

  return Array.from(groups.values()).sort((a, b) =>
    String(a.sortKey).localeCompare(String(b.sortKey)),
  );
}

function getDateRange(rows, dateColumn) {
  if (!dateColumn) return null;

  const ranges = rows
    .map((row) => parseDateRangeValue(row[dateColumn]))
    .filter(Boolean)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  if (!ranges.length) return null;

  const startDate = ranges[0].start;
  const endDate = ranges.reduce(
    (latestDate, range) =>
      range.end.getTime() > latestDate.getTime() ? range.end : latestDate,
    ranges[0].end,
  );

  return {
    column: dateColumn,
    end: endDate.toISOString(),
    label:
      startDate.toDateString() === endDate.toDateString()
        ? formatDateValue(startDate)
        : `${formatDateValue(startDate)} - ${formatDateValue(endDate)}`,
    start: startDate.toISOString(),
  };
}

function detectPeriodGranularity(rows, dateColumn) {
  if (!dateColumn) return "UNKNOWN";

  const rawValues = rows
    .map((row) => getDisplayValue(row?.[dateColumn]))
    .filter((value) => value !== "-");

  if (rawValues.some((value) => /\s+(?:-|to|through)\s+/i.test(value))) {
    return "WEEKLY";
  }

  const dates = rawValues
    .map(parseDateValue)
    .filter(Boolean)
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length < 2) {
    const normalizedColumn = normalizeKey(dateColumn);

    if (normalizedColumn.includes("month")) return "MONTHLY";
    if (normalizedColumn.includes("quarter")) return "QUARTERLY";
    if (normalizedColumn.includes("year") || normalizedColumn.includes("annual")) return "ANNUAL";

    return "WEEKLY";
  }

  const dayGaps = dates
    .slice(1)
    .map((date, index) => Math.round((date - dates[index]) / 86400000))
    .filter((gap) => gap > 0);
  const medianGap = dayGaps.sort((a, b) => a - b)[Math.floor(dayGaps.length / 2)] || 0;

  if (medianGap <= 1) return "DAILY";
  if (medianGap <= 8) return "WEEKLY";
  if (medianGap <= 35) return "MONTHLY";
  if (medianGap <= 100) return "QUARTERLY";

  return "ANNUAL";
}

function getPeriodBuckets(rows, dateColumn, period) {
  if (!dateColumn) return [];

  return groupRows(rows, (row) => getDateBucket(row[dateColumn], period));
}

function getWeeklyWindow(rows, dateColumn) {
  const weeklyBuckets = getPeriodBuckets(rows, dateColumn, "weekly");
  const firstBucket = weeklyBuckets[0];
  const latestBucket = weeklyBuckets.at(-1);

  if (!firstBucket || !latestBucket) return [];

  const [firstYearText, firstWeekText] = String(firstBucket.sortKey).split("-");
  const [yearText, weekText] = String(latestBucket.sortKey).split("-");
  const firstYear = Number(firstYearText);
  const firstWeek = Number(firstWeekText);
  const latestYear = Number(yearText);
  const latestWeek = Number(weekText);

  if (
    !Number.isFinite(firstWeek) ||
    !Number.isFinite(firstYear) ||
    !Number.isFinite(latestYear) ||
    !Number.isFinite(latestWeek)
  ) {
    return weeklyBuckets.slice(-6);
  }

  const startWeek = shiftIsoWeek(latestYear, latestWeek, -5);
  const endWeek = shiftIsoWeek(latestYear, latestWeek, 0);
  const buckets = [];
  let cursor = startWeek;

  while (cursor.sortKey <= endWeek.sortKey) {
    const sortKey = cursor.sortKey;
    const existingBucket = weeklyBuckets.find((bucket) => bucket.sortKey === sortKey);

    buckets.push(existingBucket || makeEmptyIsoWeekBucket(cursor.year, cursor.weekNumber));
    cursor = shiftIsoWeek(cursor.year, cursor.weekNumber, 1);
  }

  return buckets;
}

function buildSeriesForPeriod(buckets, metric) {
  return buckets.map((bucket) => ({
    dateLabel: bucket.dateLabel,
    label: bucket.label,
    sortKey: bucket.sortKey,
    value: bucket.rows.length ? aggregateValues(bucket.rows, metric.column, metric.aggregation) : null,
  }));
}

function buildSeries(rows, dateColumn, metric) {
  if (!dateColumn) {
    const value = aggregateValues(rows, metric.column, metric.aggregation);
    const allDataPoint = {
      dateLabel: "All uploaded rows",
      label: "All Data",
      sortKey: "all-data",
      value,
    };

    return {
      annual: [allDataPoint],
      monthly: [allDataPoint],
      quarterly: [allDataPoint],
      weekly: [allDataPoint],
    };
  }

  const weeklyBuckets = getWeeklyWindow(rows, dateColumn);

  return {
    annual: buildSeriesForPeriod(getPeriodBuckets(rows, dateColumn, "annual"), metric),
    monthly: buildSeriesForPeriod(getPeriodBuckets(rows, dateColumn, "monthly"), metric),
    quarterly: buildSeriesForPeriod(getPeriodBuckets(rows, dateColumn, "quarterly"), metric),
    weekly: buildSeriesForPeriod(weeklyBuckets, metric),
  };
}

function getTopValueBuckets(rows, column, limit = 12) {
  const counts = new Map();

  rows.forEach((row) => {
    const value = getDisplayValue(row?.[column]);
    counts.set(value, (counts.get(value) || 0) + 1);
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, value], index) => ({
      dateLabel: `${value} row${value === 1 ? "" : "s"}`,
      label,
      sortKey: `${String(index).padStart(2, "0")}-${label}`,
      value,
    }));
}

function getFieldSummary(rows, column, type) {
  const values = rows.map((row) => getDisplayValue(row?.[column]));
  const filledValues = values.filter((value) => value !== "-");
  const uniqueValues = new Set(filledValues);
  const numericValues = filledValues.map(parseMetricValue).filter((value) => value != null);

  return {
    blank: values.length - filledValues.length,
    column,
    filled: filledValues.length,
    label: normalizeLabel(column),
    max:
      numericValues.length && ["count", "duration", "number", "percentage"].includes(type)
        ? Math.max(...numericValues)
        : null,
    min:
      numericValues.length && ["count", "duration", "number", "percentage"].includes(type)
        ? Math.min(...numericValues)
        : null,
    sampleValues: Array.from(uniqueValues).slice(0, 6),
    total: values.length,
    type,
    unique: uniqueValues.size,
  };
}

function makeDistributionReport({ column, index, rows, type }) {
  const buckets = getTopValueBuckets(rows, column);

  if (!buckets.length) return null;

  const series = {
    annual: buckets,
    monthly: buckets,
    quarterly: buckets,
    weekly: buckets,
  };

  return {
    dateRange: null,
    dimensions: [column],
    id: `distribution-${normalizeKey(column) || index + 1}`,
    series: [
      {
        chartType: "bar",
        color: fallbackColors[index % fallbackColors.length],
        data: buckets,
        key: `${normalizeKey(column) || `field${index + 1}`}Count`,
        label: "Rows",
        series,
        type: "count",
        unit: "",
      },
    ],
    summary: {
      metrics: 1,
    },
    title: `${normalizeLabel(column)} Distribution`,
    type: "distribution",
    valueType: type,
  };
}

function makeDimensionPerformanceReport({ dimension, id, metrics, rows, title }) {
  const metric =
    ["offered", "handled", "serviceLevel", "reachability", "abandonRate", "aht"]
      .map((category) => metrics.find((item) => item.category === category))
      .find(Boolean) || metrics[0];

  if (!dimension || !metric) return null;

  const groups = new Map();

  rows.forEach((row) => {
    const label = getDisplayValue(row?.[dimension]);
    const currentRows = groups.get(label) || [];

    currentRows.push(row);
    groups.set(label, currentRows);
  });

  const buckets = Array.from(groups.entries())
    .map(([label, groupedRows]) => ({
      dateLabel: `${groupedRows.length} row${groupedRows.length === 1 ? "" : "s"}`,
      label,
      sortKey: label,
      value: aggregateValues(groupedRows, metric.column, metric.aggregation),
    }))
    .filter((item) => item.value != null)
    .sort((a, b) => Number(b.value) - Number(a.value));

  if (!buckets.length) return null;

  const series = {
    annual: buckets,
    monthly: buckets,
    quarterly: buckets,
    weekly: buckets,
  };
  const preparedMetric = prepareMetric(metric, "bar");

  return {
    dateRange: null,
    dimensions: [dimension],
    id,
    series: [
      {
        chartType: "bar",
        color: preparedMetric.color,
        data: buckets,
        key: preparedMetric.key,
        label: preparedMetric.label,
        series,
        type: preparedMetric.type,
        unit: preparedMetric.unit,
      },
    ],
    summary: {
      metrics: 1,
    },
    title: `${title} by ${preparedMetric.label}`,
    type: "dimensionComparison",
  };
}

function hasUsefulData(series) {
  const values = Object.values(series)
    .flat()
    .map((item) => item.value)
    .filter((value) => value != null);

  return values.length > 0;
}

function makeReport({ dateRange, id, metrics, rows, title, type }) {
  const series = metrics
    .map((metric) => {
      const metricSeries = buildSeries(rows, dateRange?.column, metric);
      const preparedMetric = prepareMetric(metric);

      return {
        chartType: preparedMetric.chartType,
        color: preparedMetric.color,
        data: metricSeries.weekly,
        key: preparedMetric.key,
        label: preparedMetric.label,
        series: metricSeries,
        type: preparedMetric.type,
        unit: preparedMetric.unit,
      };
    })
    .filter((item) => hasUsefulData(item.series));

  if (!series.length) return null;

  return {
    dateRange,
    id,
    series,
    title,
    type,
  };
}

function makeBusinessReport({ categories, dateRange, id, metrics, rows, title, type }) {
  const selectedMetrics = categories
    .map(({ category, chartType }) => {
      const metric = metrics.find((item) => item.category === category);

      return metric ? prepareMetric(metric, chartType) : null;
    })
    .filter(Boolean);

  if (!selectedMetrics.length) return null;

  return makeReport({
    dateRange,
    id,
    metrics: selectedMetrics,
    rows,
    title,
    type,
  });
}

function getDimensionByHints(schema, hints) {
  return schema.find(
    (field) =>
      ["dimension", "identifier"].includes(field.type) &&
      hints.some((hint) => normalizeKey(field.column).includes(hint)),
  )?.column;
}

function makeGenericMetricReports({ dateRange, metrics, rows, timeField }) {
  const metricGroups = [
    {
      id: "count-metric-trend",
      metrics: metrics.filter((metric) => metric.type === "count").slice(0, 6),
      reason: timeField
        ? `Detected time field ${timeField} and compatible count metrics.`
        : "Detected compatible count metrics.",
      title: "Volume Trend",
      type: "groupedBar",
    },
    {
      id: "percentage-metric-trend",
      metrics: metrics.filter((metric) => metric.type === "percentage").slice(0, 6),
      reason: timeField
        ? `Detected time field ${timeField} and compatible percentage metrics.`
        : "Detected compatible percentage metrics.",
      title: "Performance Trend",
      type: "multiLine",
    },
    {
      id: "duration-metric-trend",
      metrics: metrics.filter((metric) => metric.type === "duration").slice(0, 6),
      reason: timeField
        ? `Detected time field ${timeField} and compatible duration metrics.`
        : "Detected compatible duration metrics.",
      title: "Time Trend",
      type: "multiLine",
    },
    {
      id: "numeric-metric-trend",
      metrics: metrics.filter((metric) => metric.type === "number").slice(0, 6),
      reason: timeField
        ? `Detected time field ${timeField} and compatible numeric metrics.`
        : "Detected compatible numeric metrics.",
      title: "Metric Trend",
      type: "multiLine",
    },
  ];

  return metricGroups
    .filter((group) => group.metrics.length)
    .map((group) => {
      const report = makeReport({
        dateRange,
        id: group.id,
        metrics: group.metrics,
        rows,
        title: group.title,
        type: group.type,
      });

      return report
        ? {
        ...report,
        reason: group.reason,
          }
        : null;
    })
    .filter(Boolean);
}

function getUsefulDimensions(profiles, rows) {
  return profiles
    .filter((profile) => ["DIMENSION", "STATUS"].includes(profile.role))
    .filter((profile) => profile.unique > 1 && profile.unique <= Math.max(30, rows.length * 0.6))
    .sort((a, b) => {
      const namePriorityA = dimensionNameHints.some((hint) => a.normalizedName.includes(hint)) ? 0 : 1;
      const namePriorityB = dimensionNameHints.some((hint) => b.normalizedName.includes(hint)) ? 0 : 1;

      return namePriorityA - namePriorityB || a.unique - b.unique;
    })
    .slice(0, 5);
}

function scoreMetric(metric) {
  const knownPriority = metricColors[metric.category] ? 0 : 1;
  const typePriority = {
    percentage: 0,
    count: 1,
    duration: 2,
    number: 3,
  }[metric.type] ?? 4;

  return knownPriority * 10 + typePriority;
}

function getImportantMetrics(metrics) {
  return [...metrics].sort((a, b) => scoreMetric(a) - scoreMetric(b)).slice(0, 8);
}

function buildReports({ dateRange, dimensions, metrics, profiles, rows, schema }) {
  const timeField = profiles.find((profile) => profile.role === "TIME_DIMENSION")?.column;
  const metricReports = makeGenericMetricReports({
        dateRange,
        metrics: getImportantMetrics(metrics),
        rows,
        timeField,
      });
  const usedCategories = new Set(
    metricReports.flatMap((report) =>
      report.series.map((item) => item.key),
    ),
  );
  const additionalMetrics = metrics
    .filter((metric) => !usedCategories.has(metric.key))
    .slice(0, 6);
  const additionalMetricsReport = additionalMetrics.length
    ? makeReport({
        dateRange,
        id: "additional-metrics",
        metrics: additionalMetrics,
        rows,
        title: "Additional Metrics",
        type: "multiLine",
      })
    : null;
  const usefulDimensions = getUsefulDimensions(profiles, rows);
  const dimensionReports = usefulDimensions
    .slice(0, metrics.length ? 4 : 6)
    .map((profile, index) => {
      if (!metrics.length || profile.role === "STATUS") {
        const report = makeDistributionReport({
          column: profile.column,
          index,
          rows,
          type: profile.type,
        });

        return report
          ? {
              ...report,
              reason: `Detected ${profile.role.toLowerCase()} field ${profile.column}.`,
            }
          : null;
      }

      const metric = getImportantMetrics(metrics)[index % Math.max(getImportantMetrics(metrics).length, 1)];
      const report = makeDimensionPerformanceReport({
        dimension: profile.column,
        id: `comparison-${normalizeKey(metric.column)}-by-${normalizeKey(profile.column)}`,
        metrics: [metric],
        rows,
        title: `${metric.label} by ${profile.label}`,
      });

      return report
        ? {
            ...report,
            reason: `Detected dimension ${profile.column} and metric ${metric.column}.`,
          }
        : null;
    })
    .filter(Boolean);
  const distributionFallbackReports =
    !metrics.length && !dimensionReports.length
      ? schema
          .filter((field) => ["dimension", "unknown", "date"].includes(field.type))
          .slice(0, 6)
          .map((field, index) =>
            makeDistributionReport({
              column: field.column,
              index,
              rows,
              type: field.type,
            }),
          )
          .filter(Boolean)
      : [];
  const reports = [
    ...metricReports,
    ...dimensionReports,
    additionalMetricsReport,
    ...distributionFallbackReports,
  ].filter(Boolean);

  return reports.map((report) => ({
    ...report,
    dimensions,
    summary: {
      metrics: report.series.length,
    },
  }));
}

export function readWfmGraphReports() {
  if (typeof window === "undefined") return [];

  try {
    const reports = JSON.parse(window.localStorage.getItem(WFM_GRAPH_REPORTS_KEY) || "[]");

    return Array.isArray(reports) ? reports : [];
  } catch {
    return [];
  }
}

export function writeWfmGraphReports(reports) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(WFM_GRAPH_REPORTS_KEY, JSON.stringify(reports));
  window.dispatchEvent(new Event(WFM_GRAPH_REPORTS_UPDATED_EVENT));
}

export function generateWfmGraphReports({
  rows,
  columns,
  sourceFile,
  sourceUploadId,
  sourceCardId,
  sourceUploadedAtMs,
  rawDataTitle,
}) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const safeColumns = Array.isArray(columns) ? columns : [];

  if (!safeRows.length || !safeColumns.length) {
    return null;
  }

  const profiles = safeColumns.map((column) => getColumnProfile(column, safeRows));
  const schema = profiles.map((profile) => ({
    average: profile.average,
    column: profile.column,
    dataType: profile.dataType,
    label: profile.label,
    max: profile.max,
    min: profile.min,
    normalizedName: profile.normalizedName,
    role: profile.role,
    sampleValues: profile.sampleValues,
    type: profile.type,
    unique: profile.unique,
    visualizable: profile.visualizable,
  }));
  const dateColumn = profiles.find((field) => field.role === "TIME_DIMENSION")?.column;
  const dateRange = getDateRange(safeRows, dateColumn);
  const periodGranularity = detectPeriodGranularity(safeRows, dateColumn);
  const dimensions = profiles
    .filter((field) => field.role === "DIMENSION")
    .map((field) => field.column);
  const identifiers = profiles
    .filter((field) => field.role === "IDENTIFIER")
    .map((field) => field.column);
  const statuses = profiles
    .filter((field) => field.role === "STATUS")
    .map((field) => field.column);
  const descriptions = profiles
    .filter((field) => field.role === "DESCRIPTION")
    .map((field) => field.column);
  const metrics = profiles
    .filter((field) =>
      ["COUNT_METRIC", "DURATION_METRIC", "METRIC", "PERCENTAGE_METRIC"].includes(field.role),
    )
    .map((field, index) => getMetric(field.column, field.type, index));
  const fieldSummaries = profiles;
  const reports = buildReports({
    dateRange,
    dimensions,
    metrics,
    profiles,
    rows: safeRows,
    schema,
  });

  if (!reports.length) return null;

  const generatedAt = new Date().toISOString();

  return {
    id: `wfm-graph-set-${Date.now()}`,
    availableDimensions: dimensions,
    availableMetrics: metrics.map((metric) => ({
      column: metric.column,
      label: metric.label,
      type: metric.type,
      unit: metric.unit,
    })),
    dateRange,
    datasetProfile: {
      descriptions,
      identifiers,
      metrics: metrics.map((metric) => metric.column),
      periodGranularity,
      statuses,
      timeFields: dateColumn ? [dateColumn] : [],
      visualizations: reports.map((report) => ({
        id: report.id,
        reason: report.reason,
        title: report.title,
        type: report.type,
      })),
    },
    fieldSummaries,
    generatedAt,
    rawDataTitle,
    sourceCardId,
    sourceFile: sourceFile || "Imported dashboard data",
    sourceUploadId,
    sourceUploadedAtMs,
    summary: {
      columns: safeColumns.length,
      dimensions: dimensions.length,
      fields: fieldSummaries.length,
      metrics: metrics.length,
      records: safeRows.length,
      reports: reports.length,
    },
    schema,
    reports,
  };
}

export function saveWfmGraphReportSet(reportSet) {
  const reportSourceUploadId = String(reportSet?.sourceUploadId || "");
  const reportSourceFile = String(reportSet?.sourceFile || "");
  const nextReports = [
    reportSet,
    ...readWfmGraphReports().filter((currentReportSet) => {
      if (reportSourceUploadId && currentReportSet.sourceUploadId === reportSourceUploadId) {
        return false;
      }

      return !reportSourceFile || currentReportSet.sourceFile !== reportSourceFile;
    }),
  ];

  writeWfmGraphReports(nextReports);

  return nextReports;
}

export function removeWfmGraphReportSet(reportSetId) {
  const nextReports = readWfmGraphReports().filter(
    (reportSet) => reportSet.id !== reportSetId,
  );

  writeWfmGraphReports(nextReports);

  return nextReports;
}

export function removeWfmGraphReportsForUpload(uploadId) {
  if (typeof window === "undefined") return [];

  const safeUploadId = String(uploadId || "");

  if (!safeUploadId) {
    return readWfmGraphReports();
  }

  window.localStorage.removeItem(WFM_GRAPH_REPORTS_KEY);
  window.dispatchEvent(new Event(WFM_GRAPH_REPORTS_UPDATED_EVENT));

  return [];
}
