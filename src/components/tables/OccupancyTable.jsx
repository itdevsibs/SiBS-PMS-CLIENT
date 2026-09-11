import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  Table as TableIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import DatePicker from "@/components/ui/Filter/DatePicker";
import EmployeeSelect from "@/components/ui/Filter/EmployeeSelect";
import TimeRangePicker from "@/components/ui/Filter/TimeRangePicker";
import TablePagination from "./TablePagination";

export const OCCUPANCY_COLUMNS = [
  {
    key: "name",
    label: "Name",
    labelLines: ["Name"],
    category: "general",
    align: "text-left",
    minWidth: 160,
    widthPct: "11.5%",
  },
  {
    key: "interval",
    label: "Interval",
    labelLines: ["Interval"],
    category: "general",
    align: "text-center",
    minWidth: 95,
    widthPct: "6%",
  },
  {
    key: "expectedHoursSec",
    label: "Expected Hours (sec)",
    labelLines: ["Expected Hours", "(sec)"],
    category: "phone",
    align: "text-center",
    minWidth: 125,
    widthPct: "6.5%",
  },
  {
    key: "actualLoggedTime",
    label: "Actual Logged Time",
    labelLines: ["Actual Logged", "Time"],
    category: "phone",
    align: "text-center",
    minWidth: 125,
    widthPct: "6.5%",
  },
  {
    key: "handledCalls",
    label: "Handled Calls",
    labelLines: ["Handled", "Calls"],
    category: "phone",
    align: "text-center",
    minWidth: 100,
    widthPct: "6%",
  },
  {
    key: "avgTalkTime",
    label: "AVG Talk Time",
    labelLines: ["AVG Talk", "Time"],
    category: "phone",
    align: "text-center",
    minWidth: 110,
    widthPct: "6.5%",
  },
  {
    key: "avgHoldTime",
    label: "AVG Hold Time",
    labelLines: ["AVG Hold", "Time"],
    category: "phone",
    align: "text-center",
    minWidth: 110,
    widthPct: "6%",
  },
  {
    key: "availTime",
    label: "Avail Time",
    labelLines: ["Avail", "Time"],
    category: "phone",
    align: "text-center",
    minWidth: 100,
    widthPct: "6.5%",
  },
  {
    key: "phoneOccupancy",
    label: "Phone Occupancy",
    labelLines: ["Phone", "Occupancy"],
    category: "phone",
    align: "text-center",
    minWidth: 120,
    widthPct: "7.5%",
  },
  {
    key: "availableEmailCapacity",
    label: "Avail Email Capacity",
    labelLines: ["Avail Email", "Capacity"],
    category: "email",
    align: "text-center",
    minWidth: 130,
    widthPct: "7.5%",
  },
  {
    key: "targetEmails",
    label: "Target # of Emails",
    labelLines: ["Target # of", "Emails"],
    category: "email",
    align: "text-center",
    minWidth: 115,
    widthPct: "7%",
  },
  {
    key: "actualEmails",
    label: "Actual # Emails",
    labelLines: ["Actual #", "Emails"],
    category: "email",
    align: "text-center",
    minWidth: 110,
    widthPct: "7%",
  },
  {
    key: "utilizationEmail",
    label: "Utilization (Email)",
    labelLines: ["Utilization", "(Email)"],
    category: "email",
    align: "text-center",
    minWidth: 120,
    widthPct: "7.5%",
  },
  {
    key: "actualEfficiency",
    label: "Actual Efficiency",
    labelLines: ["Actual", "Efficiency"],
    category: "efficiency",
    align: "text-center",
    minWidth: 120,
    widthPct: "8%",
  },
];

export const TOTAL_TABLE_MIN_WIDTH = OCCUPANCY_COLUMNS.reduce(
  (sum, col) => sum + (col.minWidth || 100),
  0,
);

export function getCellValue(row, column) {
  if (!row) return "-";

  // 1. Direct key or label match
  if (row[column.key] !== undefined && row[column.key] !== null && row[column.key] !== "") {
    return row[column.key];
  }
  if (row[column.label] !== undefined && row[column.label] !== null && row[column.label] !== "") {
    return row[column.label];
  }

  // 2. Comprehensive column aliases for mapper flexibility
  if (column.key === "name") {
    const val =
      row.name ||
      row.Name ||
      row["Agent Name"] ||
      row.agent_name ||
      row.agentName ||
      row["Employee Name"] ||
      row.employee_name ||
      row.employeeName ||
      row.agent ||
      row.employee ||
      row.fullName ||
      row.full_name ||
      row.user?.name;
    if (val !== undefined && val !== null && val !== "") return val;
  }

  if (column.key === "interval") {
    const val =
      row.interval ||
      row.Interval ||
      row["Time Interval"] ||
      row.time_interval ||
      row.timeInterval ||
      row.period ||
      row.Period ||
      row["Time Range"] ||
      row.time_range;
    if (val !== undefined && val !== null && val !== "") return val;
    if (row.start_time && row.end_time) return `${row.start_time} - ${row.end_time}`;
    if (row.startTime && row.endTime) return `${row.startTime} - ${row.endTime}`;
  }

  if (column.key === "expectedHoursSec") {
    const val =
      row.expectedHoursSec ||
      row.expected_hours_sec ||
      row["Expected Hours(sec)"] ||
      row["Expected Hours (sec)"] ||
      row["Expected Hours"] ||
      row.expected_hours ||
      row.expectedHours ||
      row.expected_sec ||
      row.scheduled_time;
    if (val !== undefined && val !== null && val !== "") return val;
  }

  if (column.key === "actualLoggedTime") {
    const val =
      row.actualLoggedTime ||
      row.actual_logged_time ||
      row["Actual Logged Time"] ||
      row.logged_time ||
      row.loggedTime ||
      row.actual_time ||
      row.actualTime ||
      row.staffed_time ||
      row.staffedTime ||
      row.login_time;
    if (val !== undefined && val !== null && val !== "") return val;
  }

  if (column.key === "handledCalls") {
    const val =
      row.handledCalls ||
      row.handled_calls ||
      row["Handled Calls"] ||
      row.calls_handled ||
      row.callsHandled ||
      row.acd_calls ||
      row.calls;
    if (val !== undefined && val !== null && val !== "") return val;
  }

  if (column.key === "avgTalkTime") {
    const val =
      row.avgTalkTime ||
      row.avg_talk_time ||
      row["AVG Talk Time"] ||
      row["Average Talk Time"] ||
      row.average_talk_time ||
      row.att ||
      row.talk_time;
    if (val !== undefined && val !== null && val !== "") return val;
  }

  if (column.key === "avgHoldTime") {
    const val =
      row.avgHoldTime ||
      row.avg_hold_time ||
      row["AVG Hold Time"] ||
      row["Average Hold Time"] ||
      row.average_hold_time ||
      row.hold_time;
    if (val !== undefined && val !== null && val !== "") return val;
  }

  if (column.key === "availTime") {
    const val =
      row.availTime ||
      row.avail_time ||
      row["Avail Time"] ||
      row["Available Time"] ||
      row.available_time ||
      row.idle_time;
    if (val !== undefined && val !== null && val !== "") return val;
  }

  if (column.key === "phoneOccupancy") {
    const val =
      row.phoneOccupancy ||
      row.phone_occupancy ||
      row["Phone Occupancy"] ||
      row.occupancy ||
      row["Occupancy %"] ||
      row.occupancy_pct ||
      row.phone_occ;
    if (val !== undefined && val !== null && val !== "") return val;
  }

  if (column.key === "availableEmailCapacity") {
    const val =
      row.availableEmailCapacity ||
      row.avail_email_capacity ||
      row["Available Email Capacity (email)"] ||
      row["Avail Email Capacity"] ||
      row["Available Email Capacity"] ||
      row.email_capacity;
    if (val !== undefined && val !== null && val !== "") return val;
  }

  if (column.key === "targetEmails") {
    const val =
      row.targetEmails ||
      row.target_emails ||
      row["Target # of Emails"] ||
      row["Target # Emails"] ||
      row["Target Emails"] ||
      row.target_email_count;
    if (val !== undefined && val !== null && val !== "") return val;
  }

  if (column.key === "actualEmails") {
    const val =
      row.actualEmails ||
      row.actual_emails ||
      row["Actual # of Emails"] ||
      row["Actual # of Emails (Email/Hour)"] ||
      row["Actual # Emails"] ||
      row.actualEmailsHour ||
      row.emails_handled ||
      row.emails_completed;
    if (val !== undefined && val !== null && val !== "") return val;
  }

  if (column.key === "utilizationEmail") {
    const val =
      row.utilizationEmail ||
      row.utilization_email ||
      row["Utilization (Email)"] ||
      row["Utilization"] ||
      row.email_utilization ||
      row.email_util;
    if (val !== undefined && val !== null && val !== "") return val;
  }

  if (column.key === "actualEfficiency") {
    const val =
      row.actualEfficiency ||
      row.actual_efficiency ||
      row["Actual Efficiency"] ||
      row.efficiency ||
      row["Efficiency %"] ||
      row.actual_eff;
    if (val !== undefined && val !== null && val !== "") return val;
  }

  // 3. Fallback: normalize key and label by stripping non-alphanumeric chars
  const normTarget = column.label.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normKey = column.key.toLowerCase().replace(/[^a-z0-9]/g, "");
  const foundKey = Object.keys(row).find((k) => {
    const stripped = k.toLowerCase().replace(/[^a-z0-9]/g, "");
    return stripped === normTarget || stripped === normKey;
  });
  if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && row[foundKey] !== "") {
    return row[foundKey];
  }

  return "-";
}

export function getRowEmployeeName(row) {
  const name = getCellValue(row, OCCUPANCY_COLUMNS[0]);
  return name && name !== "-" ? String(name).trim() : "";
}

export function getRowDate(row) {
  if (!row) return null;
  const rawDate =
    row.date ||
    row.Date ||
    row.interval_date ||
    row.intervalDate ||
    row["Interval Date"] ||
    row.shift_date ||
    row.shiftDate ||
    row["Shift Date"] ||
    row.created_at ||
    row.timestamp ||
    row.day ||
    row.Day;

  if (!rawDate) return null;

  if (typeof rawDate === "string") {
    const trimmed = rawDate.trim();
    // YYYY-MM-DD pattern
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }
    // MM/DD/YYYY pattern
    const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (usMatch) {
      return `${usMatch[3]}-${usMatch[1].padStart(2, "0")}-${usMatch[2].padStart(2, "0")}`;
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, "0");
      const d = String(parsed.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }

  if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
    const y = rawDate.getFullYear();
    const m = String(rawDate.getMonth() + 1).padStart(2, "0");
    const d = String(rawDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  return null;
}

export function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;
  const cleaned = timeStr.trim();

  // 12-hour match: "08:00 AM", "8:30 PM", "8 AM"
  const match12 = cleaned.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2] ? parseInt(match12[2], 10) : 0;
    const meridian = match12[3].toUpperCase();
    if (meridian === "PM" && hours < 12) hours += 12;
    if (meridian === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // 24-hour match: "08:00", "14:30", "08:00:00"
  const match24 = cleaned.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return hours * 60 + minutes;
  }

  return null;
}

export function getRowTimeRange(row) {
  const intervalStr = getCellValue(row, OCCUPANCY_COLUMNS[1]);
  if (intervalStr && intervalStr !== "-") {
    const parts = intervalStr.split(/[-–—to]+/i);
    if (parts.length >= 2) {
      const startMin = parseTimeToMinutes(parts[0]);
      const endMin = parseTimeToMinutes(parts[1]);
      if (startMin !== null && endMin !== null) {
        return { startMin, endMin };
      }
      if (startMin !== null) {
        return { startMin, endMin: startMin + 60 };
      }
    } else if (parts.length === 1) {
      const startMin = parseTimeToMinutes(parts[0]);
      if (startMin !== null) {
        return { startMin, endMin: startMin + 60 };
      }
    }
  }

  const startProp = row.start_time || row.startTime || row.interval_start || row.start;
  const endProp = row.end_time || row.endTime || row.interval_end || row.end;
  if (startProp) {
    const startMin = parseTimeToMinutes(String(startProp));
    const endMin = endProp
      ? parseTimeToMinutes(String(endProp))
      : startMin !== null
      ? startMin + 60
      : null;
    if (startMin !== null) {
      return { startMin, endMin: endMin ?? (startMin + 60) };
    }
  }

  return null;
}

function parseDurationToSec(val) {
  if (!val || val === "-") return 0;
  const str = String(val).trim();
  if (str.includes(":")) {
    const parts = str.split(":").map(Number);
    if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + (parts[2] || 0);
    if (parts.length === 2) return (parts[0] * 60) + (parts[1] || 0);
  }
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function formatTimeFromSec(totalSec) {
  if (isNaN(totalSec) || totalSec <= 0) return "00:00";
  const m = Math.floor(totalSec / 60);
  const s = Math.round(totalSec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function parsePct(val) {
  if (!val || val === "-") return 0;
  const num = parseFloat(String(val).replace("%", "").trim());
  return isNaN(num) ? 0 : num;
}

function aggregateDailyRecords(rows) {
  const groups = new Map();

  rows.forEach((row) => {
    const empName = getRowEmployeeName(row) || "Unknown Employee";
    const dateKey = getRowDate(row) || "All Dates";
    const key = `${empName}__${dateKey}`;

    if (!groups.has(key)) {
      groups.set(key, {
        name: empName,
        date: dateKey !== "All Dates" ? dateKey : undefined,
        rawRows: [],
      });
    }
    groups.get(key).rawRows.push(row);
  });

  return Array.from(groups.values()).map(({ name, date, rawRows }) => {
    const count = rawRows.length;

    let totalExpectedSec = 0;
    let totalLoggedSec = 0;
    let totalCalls = 0;
    let totalTalkSec = 0;
    let totalHoldSec = 0;
    let totalAvailSec = 0;
    let totalOccupancyPct = 0;
    let totalEmailCapacity = 0;
    let totalTargetEmails = 0;
    let totalActualEmails = 0;
    let totalEmailUtilPct = 0;
    let totalEfficiencyPct = 0;

    rawRows.forEach((r) => {
      totalExpectedSec += parseDurationToSec(getCellValue(r, OCCUPANCY_COLUMNS[2]));
      totalLoggedSec += parseDurationToSec(getCellValue(r, OCCUPANCY_COLUMNS[3]));
      totalCalls += parseFloat(getCellValue(r, OCCUPANCY_COLUMNS[4])) || 0;
      totalTalkSec += parseDurationToSec(getCellValue(r, OCCUPANCY_COLUMNS[5]));
      totalHoldSec += parseDurationToSec(getCellValue(r, OCCUPANCY_COLUMNS[6]));
      totalAvailSec += parseDurationToSec(getCellValue(r, OCCUPANCY_COLUMNS[7]));
      totalOccupancyPct += parsePct(getCellValue(r, OCCUPANCY_COLUMNS[8]));
      totalEmailCapacity += parseFloat(getCellValue(r, OCCUPANCY_COLUMNS[9])) || 0;
      totalTargetEmails += parseFloat(getCellValue(r, OCCUPANCY_COLUMNS[10])) || 0;
      totalActualEmails += parseFloat(getCellValue(r, OCCUPANCY_COLUMNS[11])) || 0;
      totalEmailUtilPct += parsePct(getCellValue(r, OCCUPANCY_COLUMNS[12]));
      totalEfficiencyPct += parsePct(getCellValue(r, OCCUPANCY_COLUMNS[13]));
    });

    const avgTalkSec = count > 0 ? totalTalkSec / count : 0;
    const avgHoldSec = count > 0 ? totalHoldSec / count : 0;
    const avgAvailSec = count > 0 ? totalAvailSec / count : 0;
    const avgOccupancy = count > 0 ? (totalOccupancyPct / count).toFixed(1) : "0.0";
    const avgEmailUtil = count > 0 ? (totalEmailUtilPct / count).toFixed(1) : "0.0";
    const rawIntervals = rawRows
      .map((r) => getCellValue(r, OCCUPANCY_COLUMNS[1]))
      .filter((v) => v && v !== "-");
    const sortedIntervals = [...rawIntervals].sort();
    const timeSpan =
      sortedIntervals.length > 1
        ? `${sortedIntervals[0]} - ${sortedIntervals[sortedIntervals.length - 1]}`
        : sortedIntervals[0] || "08:00 - 17:00";

    return {
      name,
      interval: timeSpan,
      expectedHoursSec: String(totalExpectedSec),
      actualLoggedTime: String(totalLoggedSec),
      handledCalls: String(Math.round(totalCalls)),
      avgTalkTime: formatTimeFromSec(avgTalkSec),
      avgHoldTime: formatTimeFromSec(avgHoldSec),
      availTime: formatTimeFromSec(avgAvailSec),
      phoneOccupancy: `${avgOccupancy}%`,
      availableEmailCapacity: String(Math.round(totalEmailCapacity)),
      targetEmails: String(Math.round(totalTargetEmails)),
      actualEmails: String(Math.round(totalActualEmails)),
      utilizationEmail: `${avgEmailUtil}%`,
      actualEfficiency: `${avgEfficiency}%`,
      date,
      _isDailyAggregated: true,
      _intervalCount: count,
    };
  });
}

// Realistic sample records matching authentic Excel occupancy spreadsheet (3 preview rows)
const SAMPLE_RECORDS = [
  // Amerah Basman (from authentic Excel occupancy spreadsheet)
  {
    name: "Amerah Basman",
    interval: "08:00",
    date: "2026-09-09",
    email: "amerah.basman@sibs.com",
    position: "Customer Support Specialist",
    team: "Customer Support",
    expectedHoursSec: "3600",
    actualLoggedTime: "3483",
    handledCalls: "2",
    avgTalkTime: "1102",
    avgHoldTime: "53",
    availTime: "1592",
    phoneOccupancy: "59.19%",
    availableEmailCapacity: "1421",
    targetEmails: "6",
    actualEmails: "5",
    utilizationEmail: "84.42%",
    actualEfficiency: "93.64%",
  },

  // Jane Smith
  {
    name: "Jane Smith",
    interval: "09:00",
    date: "2026-09-09",
    email: "jane.smith@sibs.com",
    position: "Senior Specialist",
    team: "Customer Support",
    expectedHoursSec: "3600",
    actualLoggedTime: "3600",
    handledCalls: "18",
    avgTalkTime: "185",
    avgHoldTime: "20",
    availTime: "225",
    phoneOccupancy: "91.50%",
    availableEmailCapacity: "12",
    targetEmails: "10",
    actualEmails: "11",
    utilizationEmail: "91.70%",
    actualEfficiency: "96.20%",
  },

  // John Doe
  {
    name: "John Doe",
    interval: "10:00",
    date: "2026-09-09",
    email: "john.doe@sibs.com",
    position: "Tier 1 Agent",
    team: "Customer Support",
    expectedHoursSec: "3600",
    actualLoggedTime: "3540",
    handledCalls: "14",
    avgTalkTime: "225",
    avgHoldTime: "30",
    availTime: "320",
    phoneOccupancy: "84.50%",
    availableEmailCapacity: "15",
    targetEmails: "10",
    actualEmails: "11",
    utilizationEmail: "88.00%",
    actualEfficiency: "92.40%",
  },

  // Alex Johnson
  {
    name: "Alex Johnson",
    interval: "11:00",
    date: "2026-09-09",
    email: "alex.johnson@sibs.com",
    position: "Technical Specialist",
    team: "Technical Support",
    expectedHoursSec: "3600",
    actualLoggedTime: "3600",
    handledCalls: "11",
    avgTalkTime: "310",
    avgHoldTime: "40",
    availTime: "380",
    phoneOccupancy: "80.50%",
    availableEmailCapacity: "16",
    targetEmails: "10",
    actualEmails: "9",
    utilizationEmail: "90.00%",
    actualEfficiency: "88.75%",
  },

  // Carlos Santana
  {
    name: "Carlos Santana",
    interval: "12:00",
    date: "2026-09-09",
    email: "carlos.santana@sibs.com",
    position: "Tier 2 Support",
    team: "Customer Support",
    expectedHoursSec: "3600",
    actualLoggedTime: "3510",
    handledCalls: "15",
    avgTalkTime: "240",
    avgHoldTime: "32",
    availTime: "290",
    phoneOccupancy: "86.20%",
    availableEmailCapacity: "14",
    targetEmails: "8",
    actualEmails: "8",
    utilizationEmail: "100.00%",
    actualEfficiency: "93.10%",
  },

  // Fatima Al-Mansoor
  {
    name: "Fatima Al-Mansoor",
    interval: "13:00",
    date: "2026-09-09",
    email: "fatima.almansoor@sibs.com",
    position: "Customer Care Lead",
    team: "Customer Support",
    expectedHoursSec: "3600",
    actualLoggedTime: "3600",
    handledCalls: "19",
    avgTalkTime: "195",
    avgHoldTime: "18",
    availTime: "210",
    phoneOccupancy: "92.10%",
    availableEmailCapacity: "18",
    targetEmails: "12",
    actualEmails: "12",
    utilizationEmail: "100.00%",
    actualEfficiency: "97.40%",
  },

  // Michael Chang
  {
    name: "Michael Chang",
    interval: "14:00",
    date: "2026-09-09",
    email: "michael.chang@sibs.com",
    position: "Service Desk Agent",
    team: "IT Helpdesk",
    expectedHoursSec: "3600",
    actualLoggedTime: "3490",
    handledCalls: "13",
    avgTalkTime: "270",
    avgHoldTime: "45",
    availTime: "350",
    phoneOccupancy: "82.40%",
    availableEmailCapacity: "15",
    targetEmails: "10",
    actualEmails: "9",
    utilizationEmail: "90.00%",
    actualEfficiency: "89.20%",
  },

  // Sarah Jenkins
  {
    name: "Sarah Jenkins",
    interval: "15:00",
    date: "2026-09-09",
    email: "sarah.jenkins@sibs.com",
    position: "Senior Specialist",
    team: "Customer Support",
    expectedHoursSec: "3600",
    actualLoggedTime: "3600",
    handledCalls: "16",
    avgTalkTime: "215",
    avgHoldTime: "24",
    availTime: "260",
    phoneOccupancy: "89.00%",
    availableEmailCapacity: "13",
    targetEmails: "10",
    actualEmails: "10",
    utilizationEmail: "100.00%",
    actualEfficiency: "94.80%",
  },

  // David Miller
  {
    name: "David Miller",
    interval: "16:00",
    date: "2026-09-09",
    email: "david.miller@sibs.com",
    position: "Tier 1 Agent",
    team: "Customer Support",
    expectedHoursSec: "3600",
    actualLoggedTime: "3580",
    handledCalls: "12",
    avgTalkTime: "260",
    avgHoldTime: "38",
    availTime: "340",
    phoneOccupancy: "83.10%",
    availableEmailCapacity: "15",
    targetEmails: "8",
    actualEmails: "7",
    utilizationEmail: "87.50%",
    actualEfficiency: "90.30%",
  },

  // Maria Garcia
  {
    name: "Maria Garcia",
    interval: "08:00",
    date: "2026-09-09",
    email: "maria.garcia@sibs.com",
    position: "Support Specialist",
    team: "Customer Support",
    expectedHoursSec: "3600",
    actualLoggedTime: "3600",
    handledCalls: "17",
    avgTalkTime: "205",
    avgHoldTime: "22",
    availTime: "240",
    phoneOccupancy: "90.40%",
    availableEmailCapacity: "14",
    targetEmails: "10",
    actualEmails: "10",
    utilizationEmail: "100.00%",
    actualEfficiency: "95.60%",
  },

  // Robert Chen
  {
    name: "Robert Chen",
    interval: "09:00",
    date: "2026-09-09",
    email: "robert.chen@sibs.com",
    position: "Tier 2 Support",
    team: "Technical Support",
    expectedHoursSec: "3600",
    actualLoggedTime: "3520",
    handledCalls: "10",
    avgTalkTime: "340",
    avgHoldTime: "50",
    availTime: "410",
    phoneOccupancy: "78.20%",
    availableEmailCapacity: "17",
    targetEmails: "10",
    actualEmails: "8",
    utilizationEmail: "80.00%",
    actualEfficiency: "86.40%",
  },

  // Emily Watson
  {
    name: "Emily Watson",
    interval: "10:00",
    date: "2026-09-09",
    email: "emily.watson@sibs.com",
    position: "Customer Care Specialist",
    team: "Customer Support",
    expectedHoursSec: "3600",
    actualLoggedTime: "3600",
    handledCalls: "20",
    avgTalkTime: "175",
    avgHoldTime: "15",
    availTime: "190",
    phoneOccupancy: "93.50%",
    availableEmailCapacity: "16",
    targetEmails: "12",
    actualEmails: "12",
    utilizationEmail: "100.00%",
    actualEfficiency: "98.10%",
  },

  // Brian O'Connor
  {
    name: "Brian O'Connor",
    interval: "11:00",
    date: "2026-09-09",
    email: "brian.oconnor@sibs.com",
    position: "Tier 1 Agent",
    team: "Customer Support",
    expectedHoursSec: "3600",
    actualLoggedTime: "3450",
    handledCalls: "11",
    avgTalkTime: "285",
    avgHoldTime: "42",
    availTime: "365",
    phoneOccupancy: "81.00%",
    availableEmailCapacity: "15",
    targetEmails: "9",
    actualEmails: "8",
    utilizationEmail: "88.89%",
    actualEfficiency: "88.90%",
  },
];

export default function OccupancyTable({
  data = [],
  isLoading = false,
  onRefresh,
  onFilteredDataChange,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [intervalType, setIntervalType] = useState("Hourly");
  const [showSampleData, setShowSampleData] = useState(true);

  const activeData = useMemo(() => {
    if (data && data.length > 0) return data;
    if (showSampleData) return SAMPLE_RECORDS;
    return [];
  }, [data, showSampleData]);

  const employeeOptions = useMemo(() => {
    const names = new Set();
    activeData.forEach((row) => {
      const name = getRowEmployeeName(row);
      if (name && name !== "-") names.add(name);
    });
    return Array.from(names).sort();
  }, [activeData]);

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    (selectedEmployees && selectedEmployees.length > 0) ||
    selectedDate ||
    startTime ||
    endTime
  );

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedEmployees([]);
    setSelectedDate("");
    setStartTime("");
    setEndTime("");
  };

  // 1. Base filter across Search, Employee, Date, and Time Range
  const filteredHourlyRows = useMemo(() => {
    const parsedStartMin = startTime ? parseTimeToMinutes(startTime) : null;
    const parsedEndMin = endTime ? parseTimeToMinutes(endTime) : null;
    const query = searchTerm.trim().toLowerCase();

    return activeData.filter((row) => {
      // 1. Search Query: matches name, email, position, team, or any row value
      if (query) {
        const empName = getRowEmployeeName(row).toLowerCase();
        const email = String(row.email || row.Email || "").toLowerCase();
        const position = String(
          row.position || row.Position || row.role || row.Role || ""
        ).toLowerCase();
        const team = String(
          row.team || row.Team || row.department || row.Department || ""
        ).toLowerCase();

        const quickMatch =
          empName.includes(query) ||
          email.includes(query) ||
          position.includes(query) ||
          team.includes(query);

        if (!quickMatch) {
          const rowMatch = Object.values(row).some((val) =>
            String(val ?? "").toLowerCase().includes(query)
          );
          if (!rowMatch) return false;
        }
      }

      // 2. Employee filter (multi-select)
      if (selectedEmployees && selectedEmployees.length > 0) {
        if (selectedEmployees.includes("__NONE__")) return false;
        const empName = getRowEmployeeName(row).toLowerCase();
        const isMatch = selectedEmployees.some(
          (selected) => selected.toLowerCase() === empName
        );
        if (!isMatch) return false;
      }

      // 3. Date filter
      if (selectedDate) {
        const rowDate = getRowDate(row);
        if (rowDate && rowDate !== selectedDate) {
          return false;
        }
      }

      // 4. Time Range filter
      if (parsedStartMin !== null || parsedEndMin !== null) {
        const rowRange = getRowTimeRange(row);
        if (rowRange) {
          if (parsedStartMin !== null && rowRange.startMin < parsedStartMin) {
            return false;
          }
          if (parsedEndMin !== null && rowRange.endMin > parsedEndMin) {
            return false;
          }
        }
      }

      return true;
    });
  }, [activeData, searchTerm, selectedEmployees, selectedDate, startTime, endTime]);

  // 2. Interval filter: Daily groups & aggregates, Hourly keeps individual interval rows
  const filteredData = useMemo(() => {
    if (intervalType === "Daily") {
      return aggregateDailyRecords(filteredHourlyRows);
    }
    return filteredHourlyRows;
  }, [filteredHourlyRows, intervalType]);

  // 3. Pagination: 10 employees/records per page
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever any filter or data change occurs
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedEmployees,
    selectedDate,
    startTime,
    endTime,
    intervalType,
    showSampleData,
    data,
  ]);

  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  // Slice rows for the active 10-record page
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredData.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredData, currentPage, PAGE_SIZE]);

  // Notify parent component for live KPI stats synchronization
  useEffect(() => {
    onFilteredDataChange?.(filteredHourlyRows);
  }, [filteredHourlyRows, onFilteredDataChange]);

  const tableContainerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragScrollLeftRef = useRef(0);

  const handlePointerDown = (e) => {
    if (e.button !== 0 || e.target.closest("button, input, a, select")) return;
    const el = tableContainerRef.current;
    if (!el || el.scrollWidth <= el.clientWidth + 2) return;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // Fallback
    }
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragScrollLeftRef.current = el.scrollLeft;
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const el = tableContainerRef.current;
    if (!el) return;
    const dx = e.clientX - dragStartXRef.current;
    if (Math.abs(dx) > 3) {
      e.preventDefault();
    }
    el.scrollLeft = dragScrollLeftRef.current - dx;
  };

  const handlePointerUp = (e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const el = tableContainerRef.current;
    if (el) {
      try {
        if (el.hasPointerCapture(e.pointerId)) {
          el.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Fallback
      }
    }
  };

  // Reset horizontal scroll when on desktop browser mode
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && tableContainerRef.current) {
        tableContainerRef.current.scrollLeft = 0;
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="space-y-3.5">
      {/* Search and filter toolbar matching reference bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 sm:gap-3.5 rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-xs">
        <div className="flex flex-wrap items-end gap-3 sm:gap-3.5 flex-1 min-w-0 w-full">
          {/* 1. Search */}
          <div className="w-full sm:w-auto flex-1 min-w-0 sm:min-w-[190px] lg:max-w-xs">
            <label className="text-xs font-bold text-slate-800 block mb-1.5">
              Search
            </label>
            <div className="relative flex h-9.5 items-center rounded-lg border border-slate-200 bg-white px-3 hover:border-slate-300 transition-colors">
              <Search className="h-4 w-4 text-slate-400 shrink-0 mr-2" />
              <input
                type="text"
                placeholder="Search name, email, position, team..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-[13px] font-medium text-slate-800 placeholder:text-slate-400 outline-none"
              />
            </div>
          </div>

          {/* 2. Employee */}
          <div className="w-full sm:w-auto flex-1 min-w-0 sm:min-w-[190px] lg:max-w-xs">
            <label className="text-xs font-bold text-slate-800 block mb-1.5">
              Employee
            </label>
            <EmployeeSelect
              value={selectedEmployees}
              onChange={setSelectedEmployees}
              options={employeeOptions}
              placeholder="All Matched Employees"
            />
          </div>

          {/* 3. Date */}
          <div className="w-full sm:w-auto min-w-0 sm:min-w-[145px]">
            <DatePicker
              label="Date"
              labelClassName="text-xs font-bold text-slate-800 block mb-1.5"
              buttonClassName="h-9.5 w-full sm:w-auto"
              value={selectedDate}
              onChange={(val) => setSelectedDate(val || "")}
            />
          </div>

          {/* 4. Time Range */}
          <div className="w-full sm:w-auto min-w-0 sm:min-w-[240px]">
            <TimeRangePicker
              label="Time Range"
              labelClassName="text-xs font-bold text-slate-800 block mb-1.5"
              fromTime={startTime}
              toTime={endTime}
              onFromChange={setStartTime}
              onToChange={setEndTime}
              fromPlaceholder="From time..."
              toPlaceholder="To time..."
              buttonClassName="h-9.5"
            />
          </div>

          {/* 5. Interval */}
          <div className="w-full sm:w-auto">
            <label className="text-xs font-bold text-slate-800 block mb-1.5">
              Interval
            </label>
            <div className="inline-flex h-9.5 w-full sm:w-auto items-center justify-center rounded-lg border border-slate-200 bg-slate-50/60 p-0.5">
              <button
                type="button"
                onClick={() => setIntervalType("Daily")}
                className={`flex-1 sm:flex-initial rounded-md px-3.5 py-1.5 text-xs sm:text-[13px] font-bold transition-all ${
                  intervalType === "Daily"
                    ? "bg-[#18466b] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setIntervalType("Hourly")}
                className={`flex-1 sm:flex-initial rounded-md px-3.5 py-1.5 text-xs sm:text-[13px] font-bold transition-all ${
                  intervalType === "Hourly"
                    ? "bg-[#18466b] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Hourly
              </button>
            </div>
          </div>
        </div>

        {/* Action buttons on right */}
        <div className="flex flex-wrap items-center gap-2 self-end w-full lg:w-auto lg:ml-auto justify-end pt-1 lg:pt-0">
          {(!data || data.length === 0) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSampleData((prev) => !prev)}
              className="h-9.5 flex-1 sm:flex-initial gap-2 px-3.5 text-xs sm:text-sm font-medium border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-400 transition-colors"
            >
              {showSampleData ? (
                <>
                  <EyeOff className="h-4 w-4 text-slate-600 transition-colors group-hover/button:text-slate-900" />
                  <span>Hide Sample Data</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 text-slate-600 transition-colors group-hover/button:text-slate-900" />
                  <span>Preview Sample Data</span>
                </>
              )}
            </Button>
          )}

          {onRefresh && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="h-9.5 flex-1 sm:flex-initial gap-2 px-3.5 text-xs sm:text-sm font-medium border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-400 transition-colors"
            >
              <RefreshCw className="h-4 w-4 text-slate-600 transition-colors group-hover/button:text-slate-900" />
              <span>Refresh</span>
            </Button>
          )}
        </div>
      </div>

      {/* Structured, Well-Organized Data Grid */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div
          ref={tableContainerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full overflow-x-auto lg:overflow-x-hidden sibs-scrollbar cursor-grab active:cursor-grabbing lg:cursor-default lg:active:cursor-default touch-pan-x touch-pan-y"
          style={{
            WebkitOverflowScrolling: "touch",
          }}
        >
          <table className="w-full min-w-[1585px] lg:min-w-0 lg:w-full table-fixed border-collapse text-left">
            <colgroup className="hidden lg:table-column-group">
              {OCCUPANCY_COLUMNS.map((col) => (
                <col
                  key={`desk-col-${col.key}`}
                  style={{
                    width: col.widthPct,
                  }}
                />
              ))}
            </colgroup>
            <colgroup className="lg:hidden">
              {OCCUPANCY_COLUMNS.map((col) => (
                <col
                  key={`mob-col-${col.key}`}
                  style={{
                    width: `${col.minWidth}px`,
                  }}
                />
              ))}
            </colgroup>

            {/* Category Groups Header */}
            <thead className="relative z-10 bg-slate-100">
              <tr className="border-b border-slate-200 bg-slate-100/95 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th
                  colSpan={2}
                  className="px-2.5 py-2.5 border-r border-slate-200 text-center font-extrabold tracking-wide whitespace-nowrap"
                >
                  Agent Information
                </th>
                <th
                  colSpan={7}
                  className="px-2.5 py-2.5 border-r border-slate-200 text-center font-extrabold tracking-wide whitespace-nowrap"
                >
                  Phone & Calls Metrics
                </th>
                <th
                  colSpan={4}
                  className="px-2.5 py-2.5 border-r border-slate-200 text-center font-extrabold tracking-wide whitespace-nowrap"
                >
                  Email Metrics
                </th>
                <th
                  colSpan={1}
                  className="px-2.5 py-2.5 text-center font-extrabold tracking-wide whitespace-nowrap"
                >
                  Efficiency
                </th>
              </tr>

              {/* Sub-Column Header */}
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-700">
                {OCCUPANCY_COLUMNS.map((col) => (
                  <th
                    key={`th-${col.key}`}
                    className={`px-1.5 lg:px-1 xl:px-2 py-2.5 border-r border-slate-200 last:border-r-0 align-middle ${col.align}`}
                  >
                    <div
                      className={`flex flex-col justify-center min-h-[38px] leading-tight ${
                        col.align === "text-left"
                          ? "items-start pl-1 lg:pl-2 text-left"
                          : col.align === "text-center"
                          ? "items-center text-center"
                          : "items-end pr-1 lg:pr-2 text-right"
                      }`}
                    >
                      {col.labelLines ? (
                        col.labelLines.map((line, lIdx) => (
                          <span
                            key={lIdx}
                            className="whitespace-nowrap font-bold text-[10px] xl:text-[10.5px] tracking-tight"
                          >
                            {line}
                          </span>
                        ))
                      ) : (
                        <span className="whitespace-nowrap font-bold text-[10px] xl:text-[10.5px] tracking-tight">
                          {col.label}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={OCCUPANCY_COLUMNS.length}
                    className="py-16 text-center text-slate-500 bg-white"
                  >
                    <div className="mx-auto flex flex-col items-center justify-center gap-2.5">
                      <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                      <span className="font-medium text-sm">Loading records...</span>
                    </div>
                  </td>
                </tr>
              ) : activeData.length === 0 ? (
                <tr>
                  <td
                    colSpan={OCCUPANCY_COLUMNS.length}
                    className="py-14 text-center text-slate-400 bg-white"
                  >
                    <div className="mx-auto flex max-w-sm flex-col items-center justify-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-2">
                        <TableIcon size={18} />
                      </div>
                      <p className="m-0 text-xs sm:text-sm font-semibold text-slate-700">
                        No occupancy data displayed
                      </p>
                      <p className="mt-1 mb-3 text-[11px] sm:text-xs text-slate-400">
                        Sample data is hidden. Click &quot;Preview Sample Data&quot; to display sample preview records.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSampleData(true)}
                        className="gap-1.5 text-xs font-medium text-slate-700 h-8 px-3 hover:bg-slate-50 border-slate-300"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-500" />
                        Preview Sample Data
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={OCCUPANCY_COLUMNS.length}
                    className="py-14 text-center text-slate-400 bg-white"
                  >
                    <div className="mx-auto flex max-w-sm flex-col items-center justify-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-2">
                        <TableIcon size={18} />
                      </div>
                      <p className="m-0 text-xs sm:text-sm font-semibold text-slate-700">
                        No matching occupancy records found
                      </p>
                      <p className="mt-1 mb-3 text-[11px] sm:text-xs text-slate-400">
                        Try adjusting your search query, employee filter, date, or time range selection.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResetFilters}
                        className="gap-1.5 text-xs font-medium text-[#18466b] border-slate-300 h-8 px-3 hover:bg-slate-50"
                      >
                        Reset All Filters
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <tr
                    key={`row-${idx}`}
                    className="bg-white transition-colors hover:bg-slate-50/80 even:bg-slate-50/30"
                  >
                    {OCCUPANCY_COLUMNS.map((col) => {
                      const value = getCellValue(row, col);
                      const isName = col.key === "name";
                      const isEfficiency = col.key === "actualEfficiency";
                      const isOccupancy = col.key === "phoneOccupancy";

                      return (
                        <td
                          key={`cell-${col.key}-${idx}`}
                          className={`px-1.5 lg:px-2 xl:px-2.5 py-3 text-xs xl:text-[13px] border-r border-slate-100 last:border-r-0 tabular-nums truncate ${col.align} ${
                            isName ? "text-slate-900 font-bold pl-2 lg:pl-3" : "text-slate-700"
                          }`}
                          title={String(value)}
                        >
                          {isName ? (
                            <span className="truncate block font-semibold text-slate-900">
                              {value}
                            </span>
                          ) : isEfficiency ? (
                            <span className="font-extrabold text-slate-950">
                              {value}
                            </span>
                          ) : isOccupancy ? (
                            <span className="font-bold text-slate-900">
                              {value}
                            </span>
                          ) : (
                            <span className="font-medium">
                              {value}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Reusable Clean Corporate Table Pagination */}
        {totalItems > 0 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            itemLabel="employees"
          />
        )}
      </div>
    </div>
  );
}
