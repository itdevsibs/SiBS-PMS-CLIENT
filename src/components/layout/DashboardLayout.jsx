import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  ClipboardList,
  CloudUpload,
  Download,
  Filter,
  FolderDown,
  Gauge,
  LineChart,
  MoreVertical,
  Search,
  ShieldCheck,
  Target,
  Trash2,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import AppHeader from "@/components/layout/AppHeader";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AppModal from "@/components/ui/app-modal";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import LoadingModal from "@/components/ui/loading-modal";
import { Button } from "@/components/ui/button";
import { clearAuthSession, getAuthUser, isAuthenticated } from "@/lib/auth";
import SuperAdminDashboard from "@/pages/super-admin/SuperAdminDashboard";
import SuperAdminHistoryLogs from "@/pages/super-admin/SuperAdminHistoryLogs";

const roleIcons = {
  superadmin: ShieldCheck,
  wfm: FolderDown,
  agent: Gauge,
  om: Filter,
  tl: ClipboardList,
  client: LineChart,
  bod: BarChart3,
};

const wfmRawDataColumns = [
  "Employee ID",
  "Employee Name",
  "Account",
  "Team Leader",
  "Operations Manager",
  "KPI Period",
  "Attendance %",
  "Quality %",
  "Productivity %",
  "CSAT %",
  "AHT Sec",
  "Compliance %",
  "Final Score",
  "Status",
  "Remarks",
  "Source File",
];

const wfmRawDataColumnConfig = [
  { label: "Employee ID", width: "110px" },
  { label: "Employee Name", width: "190px" },
  { label: "Account", width: "180px" },
  { label: "Team Leader", width: "160px" },
  { label: "Operations Manager", width: "190px" },
  { label: "KPI Period", width: "120px" },
  { label: "Attendance %", width: "120px", align: "right" },
  { label: "Quality %", width: "105px", align: "right" },
  { label: "Productivity %", width: "130px", align: "right" },
  { label: "CSAT %", width: "90px", align: "right" },
  { label: "AHT Sec", width: "95px", align: "right" },
  { label: "Compliance %", width: "130px", align: "right" },
  { label: "Final Score", width: "110px", align: "right" },
  { label: "Status", width: "115px" },
  { label: "Remarks", width: "260px" },
  { label: "Source File", width: "230px" },
];

const WFM_IMPORT_CACHE_KEY = "sibs-wfm-import-cache";

function readWfmImportCache() {
  if (typeof window === "undefined") {
    return {
      selectedUpload: "",
      uploadedFiles: [],
    };
  }

  try {
    const cached = JSON.parse(
      window.localStorage.getItem(WFM_IMPORT_CACHE_KEY) || "{}",
    );
    const uploadedFiles = Array.isArray(cached.uploadedFiles)
      ? cached.uploadedFiles
      : [];

    return {
      selectedUpload: cached.selectedUpload || uploadedFiles[0]?.fileName || "",
      uploadedFiles,
    };
  } catch {
    return {
      selectedUpload: "",
      uploadedFiles: [],
    };
  }
}

function writeWfmImportCache({ selectedUpload, uploadedFiles }) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    WFM_IMPORT_CACHE_KEY,
    JSON.stringify({
      selectedUpload,
      uploadedFiles,
    }),
  );
}

function normalizeColumnKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getCellText(value) {
  if (value == null) {
    return "";
  }

  if (typeof value === "object") {
    if ("text" in value) return String(value.text || "");
    if ("result" in value) return String(value.result || "");
    if ("richText" in value) {
      return value.richText.map((item) => item.text || "").join("");
    }
  }

  return String(value);
}

function parseCsvRows(text, fileName) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return [];
  }

  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
    const normalized = wfmRawDataColumns.map((_, index) => cells[index] || "-");
    normalized[normalized.length - 1] = fileName;
    return normalized;
  });
}

function normalizeImportedObjects(rows, fileName) {
  if (!rows.length) {
    return [];
  }

  return rows.map((row) =>
    wfmRawDataColumns.map((column, index) => {
      if (column === "Source File") {
        return fileName;
      }

      const normalizedColumn = normalizeColumnKey(column);
      const matchedKey = Object.keys(row).find(
        (key) => normalizeColumnKey(key) === normalizedColumn,
      );

      return getCellText(row[matchedKey] ?? row[index] ?? "-") || "-";
    }),
  );
}

function isImportDataRow(values) {
  return values.some((value) => value && value !== "-");
}

function getHeaderMatchCount(values) {
  const normalizedValues = values.map(normalizeColumnKey);

  return wfmRawDataColumns.filter((column) =>
    normalizedValues.includes(normalizeColumnKey(column)),
  ).length;
}

async function parseWorkbookRows(arrayBuffer, fileName) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(arrayBuffer, {
    type: "array",
    cellDates: true,
    cellText: false,
  });
  const sheetName = workbook.SheetNames.find(
    (name) => workbook.Sheets[name]?.["!ref"],
  );

  if (!sheetName) {
    return [];
  }

  const sheetRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    defval: "",
    blankrows: false,
    raw: false,
  });
  const normalizedSheetRows = sheetRows
    .map((row) => row.map((cell) => getCellText(cell).trim()))
    .filter(isImportDataRow);

  if (!normalizedSheetRows.length) {
    return [];
  }

  let headerRowIndex = -1;
  const scanLimit = Math.min(12, normalizedSheetRows.length);

  for (let index = 0; index < scanLimit; index += 1) {
    const candidateValues = normalizedSheetRows[index];
    const matchCount = getHeaderMatchCount(candidateValues);

    if (matchCount >= 2 || (matchCount >= 1 && candidateValues.length >= 5)) {
      headerRowIndex = index;
      break;
    }
  }

  const headers = headerRowIndex >= 0 ? normalizedSheetRows[headerRowIndex] : [];
  const dataRows =
    headerRowIndex >= 0
      ? normalizedSheetRows.slice(headerRowIndex + 1)
      : normalizedSheetRows;
  const rows = dataRows.map((cells) => {
    const rowObject = {};

    headers.forEach((header, index) => {
      if (header) {
        rowObject[header] = cells[index] || "";
      }
    });

    return {
      ...cells,
      ...rowObject,
    };
  });

  return normalizeImportedObjects(rows, fileName);
}

function formatUploadTimestamp(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function WfmStatusPill({ status }) {
  const statusMap = {
    Completed: "bg-sibs-secondary-3/10 text-sibs-secondary-3 border-sibs-secondary-3/20",
    Failed: "bg-sibs-danger/10 text-sibs-danger border-sibs-danger/20",
    Processing: "bg-sibs-secondary-2/10 text-sibs-secondary-2 border-sibs-secondary-2/20",
    Validation: "bg-sibs-primary-2/10 text-sibs-primary-2 border-sibs-primary-2/20",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
        statusMap[status] || "bg-sibs-tertiary-10 text-sibs-tertiary-5"
      }`}
    >
      {status}
    </span>
  );
}

const agentProfile = {
  name: "Maria Santos",
  account: "Retail Support",
  team: "Team Alpha",
  coach: "Daniel Cruz",
  initials: "MS",
};

const agentKpis = [
  { label: "Attendance", value: 96, tone: "orange" },
  { label: "Productivity", value: 88, tone: "blue" },
  { label: "Quality Score", value: 94, tone: "blue" },
  { label: "CSAT", value: 91, tone: "orange" },
  { label: "Schedule Adherence", value: 93, tone: "blue" },
];

const agentTrend = [88, 87, 91, 90, 92, 94];
const agentWeeklyAttendance = [92, 96, 95, 98, 94, 96];

const agentKpiRows = [
  ["Attendance Rate", "15%", "96%", "95%", "Exceeded"],
  ["CSAT Score", "25%", "91%", "90%", "Exceeded"],
  ["Productivity (AHT)", "30%", "88%", "90%", "On-Track"],
  ["Quality Audit", "20%", "94%", "92%", "Exceeded"],
  ["Schedule Adherence", "10%", "93%", "92%", "Exceeded"],
];

const agentCoachingRecords = [
  {
    date: "Oct 24, 2026",
    title: "AHT Optimization Strategy",
    detail: "Focus on reducing hold time during complex return queries.",
    status: "Closed",
    tone: "primary",
  },
  {
    date: "Sep 12, 2026",
    title: "Empathy and Soft Skills",
    detail: "Improve customer tone during escalation scenarios.",
    status: "Follow-up",
    tone: "secondary",
  },
  {
    date: "Aug 05, 2026",
    title: "Product Update Training",
    detail: "Review of the latest retail account policy updates.",
    status: "Closed",
    tone: "primary",
  },
];

const agentBreakdown = [
  ["Quality", 94],
  ["Productivity", 88],
  ["Attendance", 96],
  ["CSAT", 91],
  ["Adherence", 93],
];

const bodAccounts = [
  { name: "Global Finance Corp", om: "Sarah Jenkins", risk: "Low", csat: 94, sla: 98, growth: "+4.2%", score: 96 },
  { name: "TeleHealth Connect", om: "Marcus Thorne", risk: "Low", csat: 92, sla: 99, growth: "+1.8%", score: 95 },
  { name: "Urban Logistics", om: "Elena Rodriguez", risk: "Moderate", csat: 88, sla: 94, growth: "+0.5%", score: 91 },
  { name: "SilverCloud SaaS", om: "David Wu", risk: "Low", csat: 91, sla: 96, growth: "+3.1%", score: 94 },
  { name: "Blue Ridge Banking", om: "Anita Desai", risk: "High", csat: 76, sla: 82, growth: "-2.4%", score: 79 },
  { name: "Prime Retailers", om: "James Wilson", risk: "Low", csat: 95, sla: 97, growth: "+5.0%", score: 96 },
  { name: "Zenith Insurance", om: "Linda Park", risk: "Moderate", csat: 84, sla: 89, growth: "+0.2%", score: 86 },
  { name: "Apex E-Commerce", om: "Robert Smith", risk: "Critical", csat: 68, sla: 74, growth: "-5.8%", score: 71 },
  { name: "Swift Telco", om: "Michael Chang", risk: "Moderate", csat: 89, sla: 91, growth: "+1.1%", score: 90 },
  { name: "Nexus Media", om: "Sophia Loren", risk: "Low", csat: 93, sla: 98, growth: "+2.7%", score: 95 },
  { name: "Aurora Energy", om: "George Miller", risk: "Low", csat: 90, sla: 95, growth: "+0.9%", score: 92 },
  { name: "Pacific Resorts", om: "Karen Lee", risk: "Moderate", csat: 82, sla: 86, growth: "+0.1%", score: 84 },
];

const bodSummary = [
  { label: "Total Accounts", value: "12", note: "strategic accounts", width: "100%" },
  { label: "Total Clients", value: "8", note: "active clients", width: "75%" },
  { label: "Company Score", value: "90%", note: "CSAT and SLA weighted", width: "90%", highlight: true },
  { label: "Target Met", value: "8 / 12", note: "accounts above threshold", width: "66%" },
  { label: "Target Compliance", value: "87%", note: "overall compliance", width: "87%", dark: true },
];

const bodTrend = [84, 86, 85, 89, 91, 93];
const bodRiskOrder = ["Low", "Moderate", "High", "Critical"];

function getBodRiskClass(risk) {
  if (risk === "Critical") return "bg-red-100 text-red-700";
  if (risk === "High") return "bg-sibs-primary-2/10 text-sibs-primary-2";
  if (risk === "Moderate") return "bg-sibs-tertiary-10 text-sibs-tertiary-5";
  return "bg-sibs-secondary-3/10 text-sibs-secondary-3";
}

const clientSummary = [
  { label: "Assigned Accounts", value: "2", note: "stable coverage", trend: "Stable" },
  { label: "Overall Score", value: "91%", note: "+1.2% vs prior period", trend: "+1.2%", highlight: true },
  { label: "Compliance", value: "88%", note: "-0.4% needs review", trend: "-0.4%" },
  { label: "Attendance", value: "96%", note: "+0.2% vs prior period", trend: "+0.2%" },
  { label: "Quality Score", value: "94%", note: "+2.1% vs prior period", trend: "+2.1%" },
  { label: "CSAT", value: "92%", note: "+5.0% vs prior period", trend: "+5.0%" },
];

const clientKpis = [
  { label: "AHT", actual: 92, target: 100 },
  { label: "Quality", actual: 94, target: 90 },
  { label: "Compliance", actual: 88, target: 100 },
  { label: "Attendance", actual: 96, target: 95 },
  { label: "CSAT", actual: 92, target: 85 },
];

const clientTrend = [86, 88, 85, 91, 93, 95];

const clientAgents = [
  { id: "Agent 001", aht: 284, quality: 98.5, csat: 96.0, attendance: 100, fcr: 88.2, productivity: 90, status: "Excellent" },
  { id: "Agent 002", aht: 312, quality: 94.2, csat: 92.5, attendance: 98, fcr: 84.5, productivity: 82, status: "On Target" },
  { id: "Agent 003", aht: 345, quality: 91.0, csat: 89.0, attendance: 94, fcr: 82.1, productivity: 74, status: "Improving" },
  { id: "Agent 004", aht: 295, quality: 96.8, csat: 94.2, attendance: 97, fcr: 86.7, productivity: 78, status: "Excellent" },
  { id: "Agent 005", aht: 402, quality: 87.5, csat: 85.0, attendance: 88, fcr: 79.2, productivity: 62, status: "Under Review" },
  { id: "Agent 011", aht: 326, quality: 93.4, csat: 90.6, attendance: 96, fcr: 83.9, productivity: 76, status: "On Target" },
  { id: "Agent 012", aht: 276, quality: 97.9, csat: 95.4, attendance: 99, fcr: 89.6, productivity: 84, status: "Excellent" },
  { id: "Agent 021", aht: 301, quality: 95.8, csat: 93.1, attendance: 97, fcr: 86.9, productivity: 88, status: "Excellent" },
];

function getClientStatusClass(status) {
  if (status === "Under Review") return "bg-red-100 text-red-700";
  if (status === "Improving") return "bg-sibs-primary-2/10 text-sibs-primary-2";
  if (status === "On Target") return "bg-sibs-primary-1/10 text-sibs-primary-1";
  return "bg-sibs-secondary-3/10 text-sibs-secondary-3";
}

const omSummary = [
  { label: "Assigned Accounts", value: "4", note: "+0%" },
  { label: "Total Agents", value: "126", note: "FTE" },
  { label: "Avg. Performance", value: "89%", note: "+2.4%" },
  { label: "Meeting Target", value: "92", note: "/ 126" },
  { label: "Below Target", value: "25", note: "-4%" },
  { label: "Critical Cases", value: "9", note: "needs action", danger: true },
];

const omAccounts = ["Retail Global Accounts", "Healthcare Services", "Fintech Support", "Telecom Logistics"];
const omTeams = ["All Teams", "Team Alpha", "Team Bravo"];
const omKpis = ["CSAT Score", "AHT (Seconds)", "FCR (%)", "Quality Score"];
const omTrend = [82, 85, 89, 87, 92, 90];

const omAgents = [
  { id: "#AG-8821", name: "Elara Moon", initials: "EM", team: "Alpha", csat: 98, quality: 96, performance: 98.2, status: "Top Performer" },
  { id: "#AG-9042", name: "Julian Day", initials: "JD", team: "Bravo", csat: 82, quality: 85, performance: 84.4, status: "Target Met" },
  { id: "#AG-7651", name: "Kai Lennox", initials: "KL", team: "Alpha", csat: 64, quality: 71, performance: 64.1, status: "Critical" },
  { id: "#AG-9130", name: "Soren Vane", initials: "SV", team: "Bravo", csat: 97, quality: 95, performance: 97.5, status: "Top Performer" },
  { id: "#AG-8277", name: "Mira Santos", initials: "MS", team: "Alpha", csat: 88, quality: 90, performance: 89.2, status: "Target Met" },
  { id: "#AG-8114", name: "Theo Cruz", initials: "TC", team: "Bravo", csat: 76, quality: 78, performance: 77.1, status: "Below Target" },
];

const omDistribution = [
  { label: "Meeting Target", value: 92, percent: 73, color: "bg-sibs-primary-1" },
  { label: "Below Target", value: 25, percent: 20, color: "bg-sibs-primary-2" },
  { label: "Critical", value: 9, percent: 7, color: "bg-sibs-danger" },
];

const omHeatmapDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const omHeatmapHours = ["00", "04", "08", "12", "16", "20"];
const omHeatmap = omHeatmapDays.map((day, dayIndex) => ({
  day,
  values: Array.from({ length: 12 }, (_, hourIndex) => {
    const value = ((dayIndex + 2) * (hourIndex + 3) * 11) % 100;
    return Math.max(value, 12);
  }),
}));

function getOmStatusClass(status) {
  if (status === "Critical") return "bg-red-100 text-red-700";
  if (status === "Below Target") return "bg-sibs-primary-2/10 text-sibs-primary-2";
  if (status === "Target Met") return "bg-sibs-primary-1/10 text-sibs-primary-1";
  return "bg-sibs-secondary-3/10 text-sibs-secondary-3";
}

const tlSummary = [
  { label: "Assigned Agents", value: "18", note: "active / full strength" },
  { label: "Avg Score", value: "91%", note: "+2% this cycle", highlight: true },
  { label: "Meeting Target", value: "13", note: "/ 18 agents" },
  { label: "Top Performer", value: "Maria Santos", note: "ID: 4492" },
  { label: "Quality Average", value: "93%", note: "Q3 benchmark" },
];

const tlTrend = [84, 83, 87, 89, 91, 94];
const tlKpis = [
  { label: "AHT", actual: 357, display: "357s", target: "Target: 340s", percent: 85, tone: "primary" },
  { label: "Quality", actual: 92, display: "92%", target: "Target: 90%", percent: 92, tone: "secondary" },
  { label: "Escalations", actual: 3.2, display: "3.2", target: "Target: <= 2.5", percent: 70, tone: "danger" },
];

const tlAgents = [
  { name: "Maria Santos", id: "4492", initials: "MS", rank: 1, score: 98, coaching: "Completed" },
  { name: "James Wilson", id: "4488", initials: "JW", rank: 2, score: 94, coaching: "Scheduled" },
  { name: "Taylor Kim", id: "4475", initials: "TK", rank: 3, score: 88, coaching: "Overdue" },
  { name: "Alyssa Cruz", id: "4510", initials: "AC", rank: 4, score: 86, coaching: "Scheduled" },
  { name: "Benito Ramos", id: "4522", initials: "BR", rank: 5, score: 82, coaching: "Open" },
  { name: "Carla Mendez", id: "4531", initials: "CM", rank: 6, score: 79, coaching: "Overdue" },
];

const tlDistribution = [
  { label: "Exceeding", value: 7, percent: 39, color: "bg-sibs-primary-1" },
  { label: "Meeting", value: 6, percent: 33, color: "bg-sibs-primary-2" },
  { label: "Coaching", value: 5, percent: 28, color: "bg-sibs-danger" },
];

const tlAttributes = [
  ["Quality", 94],
  ["Compliance", 91],
  ["Soft Skills", 93],
  ["Attendance", 88],
  ["FCR", 84],
];

const tlCoachingRecords = [
  {
    title: "FCR Workflow Improvement",
    agent: "Maria Santos",
    detail: "Discussed maintaining high quality while improving first-contact resolution on complex refund requests.",
    coach: "Team Lead",
    status: "Draft",
  },
  {
    title: "Attendance and Tool Training",
    agent: "Taylor Kim",
    detail: "Performance improvement plan initiation focused on attendance, call etiquette, and tool training modules.",
    coach: "Ops Manager",
    status: "Acknowledged",
  },
  {
    title: "SME Readiness Review",
    agent: "James Wilson",
    detail: "Quarterly career progression discussion for transition to SME support within the Retail team.",
    coach: "Team Lead",
    status: "Published",
  },
];

function getTlCoachingClass(status) {
  if (status === "Overdue") return "bg-red-100 text-red-700";
  if (status === "Scheduled" || status === "Open") return "bg-sibs-primary-2/10 text-sibs-primary-2";
  return "bg-sibs-secondary-3/10 text-sibs-secondary-3";
}

function AgentKpiCard({ kpi }) {
  const colorClass = kpi.tone === "orange" ? "bg-sibs-primary-2" : "bg-sibs-primary-1";

  return (
    <div className="flex min-h-[98px] flex-col justify-between rounded-lg bg-[#f8fbfd] p-3">
      <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-sibs-tertiary-6">
        {kpi.label}
      </p>
      <p className="my-1 text-2xl font-bold text-sibs-primary-1">
        {kpi.value}%
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-sibs-tertiary-10">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${kpi.value}%` }} />
      </div>
    </div>
  );
}

function AgentMiniTrend({ selectedWeek, onSelectWeek }) {
  const chartWidth = 600;
  const chartHeight = 150;
  const xStep = chartWidth / (agentTrend.length - 1);
  const points = agentTrend.map((score, index) => {
    const x = index * xStep;
    const y = chartHeight - ((score - 80) / 20) * chartHeight;

    return { score, x, y };
  });
  const path = points.map((point) => `${point.x},${point.y}`).join(" ");
  const selectedScore = agentTrend[selectedWeek];

  return (
    <div className="grid gap-3 rounded-lg bg-[#eef3f7] p-3 lg:grid-cols-[1fr_190px]">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-sibs-tertiary-6">
          <span className="flex items-center gap-1">
            <span className="h-2 w-5 rounded-full bg-sibs-primary-1" />
            My score
          </span>
          <span className="flex items-center gap-1">
            <span className="h-0.5 w-5 border-t-2 border-dashed border-sibs-primary-2" />
            90% target
          </span>
        </div>
        <div className="relative h-44">
          <svg
            aria-label="Monthly performance line chart"
            className="h-full w-full overflow-visible"
            preserveAspectRatio="none"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          >
            {[80, 85, 90, 95, 100].map((tick) => {
              const y = chartHeight - ((tick - 80) / 20) * chartHeight;

              return (
                <g key={tick}>
                  <line x1="0" x2={chartWidth} y1={y} y2={y} stroke="#dce5ec" strokeWidth="1" />
                  <text x="-8" y={y + 4} textAnchor="end" className="fill-sibs-tertiary-6 text-[10px] font-semibold">
                    {tick}
                  </text>
                </g>
              );
            })}
            <line
              x1="0"
              x2={chartWidth}
              y1={chartHeight - ((90 - 80) / 20) * chartHeight}
              y2={chartHeight - ((90 - 80) / 20) * chartHeight}
              stroke="#f05a28"
              strokeDasharray="8 8"
              strokeWidth="3"
            />
            <polyline fill="none" points={path} stroke="#073763" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
            {points.map((point, index) => (
              <g key={`point-${index}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  fill={selectedWeek === index ? "#f05a28" : "#073763"}
                  r={selectedWeek === index ? "8" : "6"}
                  stroke="#ffffff"
                  strokeWidth="3"
                />
                <text x={point.x} y={chartHeight + 18} textAnchor="middle" className="fill-sibs-tertiary-6 text-[10px] font-bold">
                  W{index + 1}
                </text>
              </g>
            ))}
          </svg>
          {points.map((point, index) => (
            <button
              key={`trend-button-${index}`}
              type="button"
              aria-label={`View week ${index + 1} score`}
              onClick={() => onSelectWeek(index)}
              className="absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full outline-none transition focus:ring-2 focus:ring-sibs-primary-2"
              style={{
                left: `${(point.x / chartWidth) * 100}%`,
                top: `${(point.y / chartHeight) * 100}%`,
              }}
            />
          ))}
        </div>
      </div>
      <aside className="rounded-lg bg-white p-3">
        <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-sibs-tertiary-6">
          Selected Week
        </p>
        <p className="mt-2 mb-0 text-2xl font-bold text-sibs-primary-1">
          Week {selectedWeek + 1}: {selectedScore}%
        </p>
        <p className="mt-2 mb-0 text-xs leading-5 text-sibs-tertiary-5">
          {selectedScore >= 90 ? "Above target performance." : "Below target, monitor for coaching."}
        </p>
      </aside>
    </div>
  );
}

function AgentAttendanceChart({ selectedWeek, onSelectWeek }) {
  const selectedAttendance = agentWeeklyAttendance[selectedWeek];

  return (
    <div className="rounded-lg bg-[#eef3f7] p-3">
      <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-sibs-tertiary-6">
        <span>Target: 95%</span>
        <span className="text-sibs-primary-1">Week {selectedWeek + 1}: {selectedAttendance}%</span>
      </div>
      <div className="flex h-32 items-end gap-2">
        {agentWeeklyAttendance.map((value, index) => (
          <button
            key={`${value}-${index}`}
            type="button"
            onClick={() => onSelectWeek(index)}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1 rounded-md px-1 transition hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-sibs-primary-2"
          >
            <span className="text-[10px] font-bold text-sibs-primary-1">{value}%</span>
            <span
              className={`w-full rounded-t ${
                selectedWeek === index ? "bg-sibs-primary-2" : "bg-sibs-primary-1"
              }`}
              style={{ height: `${Math.max(value - 55, 18)}%` }}
            />
            <span className="text-[10px] font-semibold text-sibs-tertiary-6">W{index + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AgentScoreComparison() {
  return (
    <div className="space-y-3">
      {[
        ["Attendance", 96, 95],
        ["CSAT", 91, 90],
        ["AHT", 88, 90],
        ["Quality", 94, 92],
      ].map(([label, actual, target]) => (
        <div key={label}>
          <div className="mb-1 flex justify-between text-xs font-semibold text-sibs-primary-1">
            <span>{label}</span>
            <span>{actual}% / {target}% target</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-sibs-tertiary-10">
            <div className="h-full rounded-full bg-sibs-primary-2" style={{ width: `${actual}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function AgentBreakdown() {
  return (
    <div className="grid grid-cols-1 gap-3">
      {agentBreakdown.map(([label, value]) => (
        <div key={label} className="flex items-center gap-3">
          <span className="w-24 text-xs font-semibold text-sibs-tertiary-6">
            {label}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-sibs-tertiary-10">
            <div className="h-full rounded-full bg-sibs-primary-1" style={{ width: `${value}%` }} />
          </div>
          <span className="w-9 text-right text-xs font-bold text-sibs-primary-1">
            {value}%
          </span>
        </div>
      ))}
    </div>
  );
}

function AgentDashboardContent() {
  const [selectedWeek, setSelectedWeek] = useState(5);

  return (
    <div className="space-y-3">
      <section className="sibs-card p-3">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="m-0 text-2xl font-bold text-sibs-primary-1">
              My Performance Dashboard
            </p>
            <p className="mt-1 mb-0 text-sm text-sibs-tertiary-5">
              Individual performance metrics, KPI tracking, and coaching history.
            </p>
          </div>

          <div className="flex w-full items-center gap-3 rounded-lg border border-sibs-tertiary-10 bg-[#eef3f7] p-3 sm:w-auto">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sibs-primary-1 text-sm font-bold text-white">
              {agentProfile.initials}
            </div>
            <div className="min-w-0">
              <p className="m-0 truncate text-sm font-bold text-sibs-primary-1">
                {agentProfile.name}
              </p>
              <p className="mt-0.5 mb-0 truncate text-[11px] font-semibold uppercase tracking-wider text-sibs-tertiary-5">
                {agentProfile.account} / {agentProfile.team}
              </p>
              <p className="m-0 text-[11px] font-bold text-sibs-primary-2">
                TL: {agentProfile.coach}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-7">
        <div className="col-span-2 flex min-h-[98px] flex-col justify-between rounded-lg bg-sibs-primary-1 p-3 text-white">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-white/75">
              Overall Performance
            </span>
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <p className="m-0 text-3xl font-bold leading-none">92%</p>
            <p className="mt-2 mb-0 text-xs font-medium text-white/80">
              +2.4% from last month
            </p>
          </div>
        </div>

        {agentKpis.map((kpi) => (
          <AgentKpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className="grid grid-cols-12 gap-3">
        <section className="sibs-card col-span-12 p-4 lg:col-span-8">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="m-0 flex items-center gap-2 text-lg font-semibold text-sibs-primary-1">
              <TrendingUp className="h-5 w-5 text-sibs-primary-2" aria-hidden="true" />
              Monthly Performance Trend
            </h2>
            <span className="w-fit rounded-full bg-sibs-primary-3 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sibs-tertiary-6">
              6-Week Window
            </span>
          </div>
          <AgentMiniTrend selectedWeek={selectedWeek} onSelectWeek={setSelectedWeek} />
        </section>

        <section className="sibs-card col-span-12 p-4 lg:col-span-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="m-0 text-lg font-semibold text-sibs-primary-1">
              Weekly Attendance
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider text-sibs-primary-2">
              6-Week View
            </span>
          </div>
          <AgentAttendanceChart selectedWeek={selectedWeek} onSelectWeek={setSelectedWeek} />
          <div className="mt-4 border-t border-sibs-tertiary-10 pt-3">
            <p className="m-0 text-sm font-bold text-sibs-primary-1">
              Team Ranking
            </p>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-3xl font-bold text-sibs-primary-2">#4</span>
              <span className="mb-1 text-xs font-medium text-sibs-tertiary-5">
                of 18 agents
              </span>
            </div>
          </div>
        </section>

        <section className="sibs-card col-span-12 p-4 md:col-span-6 lg:col-span-4">
          <h2 className="m-0 mb-4 flex items-center gap-2 text-base font-semibold text-sibs-primary-1">
            <Target className="h-5 w-5 text-sibs-primary-2" aria-hidden="true" />
            KPI Actual vs Target
          </h2>
          <AgentScoreComparison />
        </section>

        <section className="sibs-card col-span-12 p-4 md:col-span-6 lg:col-span-4">
          <h2 className="m-0 mb-4 flex items-center gap-2 text-base font-semibold text-sibs-primary-1">
            <BarChart3 className="h-5 w-5 text-sibs-primary-2" aria-hidden="true" />
            Performance Breakdown
          </h2>
          <AgentBreakdown />
        </section>

        <section className="sibs-card col-span-12 p-4 lg:col-span-4">
          <h2 className="m-0 mb-4 flex items-center gap-2 text-base font-semibold text-sibs-primary-1">
            <Award className="h-5 w-5 text-sibs-primary-2" aria-hidden="true" />
            Coaching Records
          </h2>
          <div className="sibs-scrollbar flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
            {agentCoachingRecords.map((record) => (
              <div
                key={record.title}
                className="rounded-lg bg-[#eef3f7] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sibs-tertiary-6">
                    {record.date}
                  </span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-sibs-primary-1">
                    {record.status}
                  </span>
                </div>
                <p className="mt-2 mb-1 text-sm font-bold text-sibs-primary-1">
                  {record.title}
                </p>
                <p className="m-0 text-xs leading-5 text-sibs-tertiary-5">
                  {record.detail}
                </p>
                <p className="mt-3 mb-0 flex items-center gap-1 text-[11px] font-semibold text-sibs-tertiary-6">
                  <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                  Coach: {agentProfile.coach}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="sibs-card col-span-12 overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-sibs-tertiary-10 bg-sibs-primary-3/30 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="m-0 text-lg font-semibold text-sibs-primary-1">
              Detailed KPI Breakdown
            </h2>
            <Button
              variant="outline"
              className="h-9 rounded-lg border-sibs-primary-2 bg-transparent px-4 text-sibs-primary-2 hover:bg-sibs-primary-2 hover:text-white"
            >
              Export Report
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="bg-sibs-primary-3/50 text-xs uppercase text-sibs-tertiary-6">
                <tr>
                  {["KPI Name", "Weight", "Actual", "Target", "Status"].map((header) => (
                    <th key={header} className={`px-5 py-3 font-bold ${header === "Status" ? "text-right" : ""}`}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sibs-tertiary-10">
                {agentKpiRows.map((row) => (
                  <tr key={row[0]} className="bg-[#f8fbfd]">
                    {row.map((cell, index) => (
                      <td
                        key={`${row[0]}-${cell}`}
                        className={`px-5 py-3 ${
                          index === 0 ? "font-bold text-sibs-primary-1" : "text-sibs-tertiary-5"
                        } ${index === 4 ? "text-right" : ""}`}
                      >
                        {index === 4 ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                              cell === "On-Track"
                                ? "bg-sibs-primary-2/10 text-sibs-primary-2"
                                : "bg-sibs-secondary-3/10 text-sibs-secondary-3"
                            }`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            {cell}
                          </span>
                        ) : (
                          cell
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function BodSummaryCard({ item }) {
  return (
    <div
      className={`flex min-h-[98px] flex-col justify-between rounded-lg p-3 ${
        item.dark ? "bg-sibs-primary-1 text-white" : "bg-[#f8fbfd]"
      }`}
    >
      <p className={`m-0 text-[11px] font-semibold uppercase tracking-wider ${item.dark ? "text-white/70" : "text-sibs-tertiary-6"}`}>
        {item.label}
      </p>
      <div>
        <p className={`m-0 text-2xl font-bold ${item.dark ? "text-white" : item.highlight ? "text-sibs-primary-2" : "text-sibs-primary-1"}`}>
          {item.value}
        </p>
        <p className={`mt-1 mb-0 text-xs ${item.dark ? "text-white/75" : "text-sibs-tertiary-5"}`}>
          {item.note}
        </p>
      </div>
      <div className={`h-1.5 overflow-hidden rounded-full ${item.dark ? "bg-white/20" : "bg-sibs-tertiary-10"}`}>
        <div
          className={`h-full rounded-full ${item.highlight || item.dark ? "bg-sibs-primary-2" : "bg-sibs-primary-1"}`}
          style={{ width: item.width }}
        />
      </div>
    </div>
  );
}

function BodAccountPerformance({ accounts, selectedAccount, onSelectAccount }) {
  return (
    <div className="sibs-scrollbar max-h-[318px] space-y-2 overflow-y-auto pr-1">
      {accounts.map((account) => {
        const isSelected = selectedAccount.name === account.name;

        return (
          <button
            key={account.name}
            type="button"
            onClick={() => onSelectAccount(account)}
            className={`grid w-full grid-cols-[minmax(120px,180px)_1fr_54px] items-center gap-3 rounded-lg p-2 text-left transition hover:bg-sibs-primary-2/10 focus:outline-none focus:ring-2 focus:ring-sibs-primary-2 ${
              isSelected ? "bg-sibs-primary-2/10" : "bg-[#eef3f7]"
            }`}
          >
            <span className="truncate text-xs font-bold text-sibs-primary-1">
              {account.name}
            </span>
            <span className="h-4 overflow-hidden rounded-full bg-white">
              <span
                className={`block h-full rounded-full ${
                  account.score >= 92 ? "bg-sibs-primary-1" : account.score >= 85 ? "bg-sibs-tertiary-8" : "bg-sibs-primary-2"
                }`}
                style={{ width: `${account.score}%` }}
              />
            </span>
            <span className="text-right text-xs font-bold text-sibs-primary-1">
              {account.score}%
            </span>
          </button>
        );
      })}
    </div>
  );
}

function BodRiskDistribution({ selectedRisk, onSelectRisk }) {
  const riskCounts = bodRiskOrder.map((risk) => ({
    risk,
    count: bodAccounts.filter((account) => account.risk === risk).length,
  }));
  const selectedCount = selectedRisk === "All"
    ? bodAccounts.length
    : riskCounts.find((item) => item.risk === selectedRisk)?.count || 0;

  return (
    <div className="grid gap-3 rounded-lg bg-[#eef3f7] p-3 sm:grid-cols-[150px_1fr]">
      <div className="relative mx-auto flex h-36 w-36 items-center justify-center rounded-full bg-sibs-primary-1">
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-[#eef3f7]">
          <span className="text-2xl font-bold text-sibs-primary-1">
            {selectedCount}
          </span>
          <span className="text-[10px] font-bold uppercase text-sibs-tertiary-6">
            Accounts
          </span>
        </div>
      </div>
      <div className="grid content-center gap-2">
        <button
          type="button"
          onClick={() => onSelectRisk("All")}
          className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-bold transition ${
            selectedRisk === "All" ? "bg-sibs-primary-1 text-white" : "bg-white text-sibs-primary-1 hover:bg-white/70"
          }`}
        >
          <span>All Risk Levels</span>
          <span>{bodAccounts.length}</span>
        </button>
        {riskCounts.map((item) => (
          <button
            key={item.risk}
            type="button"
            onClick={() => onSelectRisk(item.risk)}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-bold transition ${
              selectedRisk === item.risk ? "bg-sibs-primary-2 text-white" : "bg-white text-sibs-primary-1 hover:bg-white/70"
            }`}
          >
            <span>{item.risk} Risk</span>
            <span>{item.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function BodTrendChart({ selectedWeek, onSelectWeek }) {
  const chartWidth = 600;
  const chartHeight = 150;
  const xStep = chartWidth / (bodTrend.length - 1);
  const points = bodTrend.map((score, index) => ({
    score,
    x: index * xStep,
    y: chartHeight - ((score - 80) / 20) * chartHeight,
  }));
  const path = points.map((point) => `${point.x},${point.y}`).join(" ");
  const selectedScore = bodTrend[selectedWeek];

  return (
    <div className="grid gap-3 rounded-lg bg-[#eef3f7] p-3 lg:grid-cols-[1fr_180px]">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-sibs-tertiary-6">
          <span className="flex items-center gap-1">
            <span className="h-2 w-5 rounded-full bg-sibs-primary-2" />
            Company score
          </span>
          <span className="flex items-center gap-1">
            <span className="h-0.5 w-5 border-t-2 border-dashed border-sibs-primary-1" />
            90% target
          </span>
        </div>
        <div className="relative h-44">
          <svg
            aria-label="Company performance trend line chart"
            className="h-full w-full overflow-visible"
            preserveAspectRatio="none"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          >
            {[80, 85, 90, 95, 100].map((tick) => {
              const y = chartHeight - ((tick - 80) / 20) * chartHeight;

              return (
                <g key={tick}>
                  <line x1="0" x2={chartWidth} y1={y} y2={y} stroke="#dce5ec" strokeWidth="1" />
                  <text x="-8" y={y + 4} textAnchor="end" className="fill-sibs-tertiary-6 text-[10px] font-semibold">
                    {tick}
                  </text>
                </g>
              );
            })}
            <line
              x1="0"
              x2={chartWidth}
              y1={chartHeight - ((90 - 80) / 20) * chartHeight}
              y2={chartHeight - ((90 - 80) / 20) * chartHeight}
              stroke="#073763"
              strokeDasharray="8 8"
              strokeWidth="3"
            />
            <polyline fill="none" points={path} stroke="#f05a28" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
            {points.map((point, index) => (
              <g key={`bod-trend-${index}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  fill={selectedWeek === index ? "#073763" : "#f05a28"}
                  r={selectedWeek === index ? "8" : "6"}
                  stroke="#ffffff"
                  strokeWidth="3"
                />
                <text x={point.x} y={chartHeight + 18} textAnchor="middle" className="fill-sibs-tertiary-6 text-[10px] font-bold">
                  W{index + 1}
                </text>
              </g>
            ))}
          </svg>
          {points.map((point, index) => (
            <button
              key={`bod-trend-button-${index}`}
              type="button"
              aria-label={`View board week ${index + 1} score`}
              onClick={() => onSelectWeek(index)}
              className="absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full outline-none focus:ring-2 focus:ring-sibs-primary-2"
              style={{
                left: `${(point.x / chartWidth) * 100}%`,
                top: `${(point.y / chartHeight) * 100}%`,
              }}
            />
          ))}
        </div>
      </div>
      <aside className="rounded-lg bg-white p-3">
        <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-sibs-tertiary-6">
          Selected Week
        </p>
        <p className="mt-2 mb-0 text-2xl font-bold text-sibs-primary-1">
          Week {selectedWeek + 1}: {selectedScore}%
        </p>
        <p className="mt-2 mb-0 text-xs leading-5 text-sibs-tertiary-5">
          {selectedScore >= 90 ? "Company performance is above board target." : "Company performance needs account-level review."}
        </p>
      </aside>
    </div>
  );
}

function BodComplianceBars({ accounts, selectedAccount, onSelectAccount }) {
  return (
    <div className="flex h-56 items-end gap-2 rounded-lg bg-[#eef3f7] px-3 py-3">
      {accounts.slice(0, 8).map((account) => (
        <button
          key={account.name}
          type="button"
          onClick={() => onSelectAccount(account)}
          className="flex h-full flex-1 flex-col items-center justify-end gap-1 rounded-md px-1 transition hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-sibs-primary-2"
        >
          <span className="text-[10px] font-bold text-sibs-primary-1">{account.sla}%</span>
          <span
            className={`w-full rounded-t ${
              selectedAccount.name === account.name ? "bg-sibs-primary-2" : "bg-sibs-primary-1"
            }`}
            style={{ height: `${Math.max(account.sla - 55, 18)}%` }}
          />
          <span className="w-10 truncate text-center text-[10px] font-semibold text-sibs-tertiary-6">
            {account.name.split(" ")[0]}
          </span>
        </button>
      ))}
    </div>
  );
}

function BodDashboardContent() {
  const [selectedWeek, setSelectedWeek] = useState(5);
  const [selectedRisk, setSelectedRisk] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccount, setSelectedAccount] = useState(bodAccounts[0]);

  const filteredAccounts = bodAccounts.filter((account) => {
    const matchesRisk = selectedRisk === "All" || account.risk === selectedRisk;
    const search = searchTerm.trim().toLowerCase();
    const matchesSearch = !search || account.name.toLowerCase().includes(search) || account.om.toLowerCase().includes(search);

    return matchesRisk && matchesSearch;
  });
  const visibleAccounts = filteredAccounts.length ? filteredAccounts : bodAccounts;

  return (
    <div className="space-y-3">
      <section className="sibs-card p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="m-0 text-2xl font-bold text-sibs-primary-1">
              Executive Account Performance Overview
            </p>
            <p className="mt-1 mb-0 max-w-3xl text-sm text-sibs-tertiary-5">
              High-level strategic summary of all BPO account operations, KPI delivery, and risk assessment metrics for the Board of Directors.
            </p>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-lg bg-[#eef3f7] px-3 py-2 text-xs font-bold uppercase tracking-wider text-sibs-tertiary-6">
            <Calendar className="h-4 w-4" aria-hidden="true" />
            Fiscal Year Q3 2026
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {bodSummary.map((item) => (
          <BodSummaryCard key={item.label} item={item} />
        ))}
      </div>

      <div className="grid grid-cols-12 gap-3">
        <section className="sibs-card col-span-12 p-4 lg:col-span-8">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="m-0 flex items-center gap-2 text-lg font-semibold text-sibs-primary-1">
              <BarChart3 className="h-5 w-5 text-sibs-primary-2" aria-hidden="true" />
              Overall Account Performance
            </h2>
            <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-sibs-tertiary-6">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sibs-primary-1" />Excellent</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sibs-tertiary-8" />On Track</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sibs-primary-2" />Risk</span>
            </div>
          </div>
          <BodAccountPerformance
            accounts={visibleAccounts}
            selectedAccount={selectedAccount}
            onSelectAccount={setSelectedAccount}
          />
        </section>

        <section className="sibs-card col-span-12 p-4 lg:col-span-4">
          <h2 className="m-0 mb-3 text-lg font-semibold text-sibs-primary-1">
            Account Risk Distribution
          </h2>
          <BodRiskDistribution selectedRisk={selectedRisk} onSelectRisk={setSelectedRisk} />
          <div className="mt-3 rounded-lg bg-[#eef3f7] p-3">
            <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-sibs-tertiary-6">
              Selected Account
            </p>
            <p className="mt-2 mb-0 text-sm font-bold text-sibs-primary-1">
              {selectedAccount.name}
            </p>
            <p className="mt-1 mb-0 text-xs text-sibs-tertiary-5">
              OM: {selectedAccount.om} / Score: {selectedAccount.score}% / Growth: {selectedAccount.growth}
            </p>
          </div>
        </section>

        <section className="sibs-card col-span-12 p-4 lg:col-span-6">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="m-0 flex items-center gap-2 text-lg font-semibold text-sibs-primary-1">
              <TrendingUp className="h-5 w-5 text-sibs-primary-2" aria-hidden="true" />
              Company Performance Trend
            </h2>
            <span className="w-fit rounded-full bg-sibs-primary-3 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sibs-tertiary-6">
              6-Week Window
            </span>
          </div>
          <BodTrendChart selectedWeek={selectedWeek} onSelectWeek={setSelectedWeek} />
        </section>

        <section className="sibs-card col-span-12 p-4 lg:col-span-6">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="m-0 flex items-center gap-2 text-lg font-semibold text-sibs-primary-1">
              <Target className="h-5 w-5 text-sibs-primary-2" aria-hidden="true" />
              Target Compliance Metrics
            </h2>
            <span className="text-xs font-semibold text-sibs-tertiary-5">
              Click an account bar to inspect it
            </span>
          </div>
          <BodComplianceBars
            accounts={visibleAccounts}
            selectedAccount={selectedAccount}
            onSelectAccount={setSelectedAccount}
          />
        </section>

        <section className="sibs-card col-span-12 overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-sibs-tertiary-10 bg-sibs-primary-3/30 px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="m-0 text-lg font-semibold text-sibs-primary-1">
              Account Performance Detail
            </h2>
            <div className="relative w-full lg:w-72">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sibs-tertiary-6"
                aria-hidden="true"
              />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-9 w-full rounded-full border border-sibs-tertiary-9 bg-white pl-9 pr-4 text-sm outline-none focus:border-sibs-primary-2"
                placeholder="Search account or OM..."
                type="text"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left text-sm">
              <thead className="bg-sibs-primary-3/50 text-xs uppercase text-sibs-tertiary-6">
                <tr>
                  {["Client / Account", "Operations Manager", "Risk Level", "CSAT Avg", "SLA Compliance", "Growth Trend", "Weighted Score"].map((header) => (
                    <th key={header} className={`px-5 py-3 font-bold ${/risk|csat|sla|growth|score/i.test(header) ? "text-right" : ""}`}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sibs-tertiary-10">
                {filteredAccounts.map((account) => (
                  <tr
                    key={account.name}
                    onClick={() => setSelectedAccount(account)}
                    className={`cursor-pointer transition hover:bg-sibs-primary-2/5 ${
                      selectedAccount.name === account.name ? "bg-sibs-primary-2/5" : "bg-[#f8fbfd]"
                    }`}
                  >
                    <td className="px-5 py-3 font-bold text-sibs-primary-1">{account.name}</td>
                    <td className="px-5 py-3 text-sibs-tertiary-5">{account.om}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${getBodRiskClass(account.risk)}`}>
                        {account.risk}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-sibs-primary-1">{account.csat}%</td>
                    <td className="px-5 py-3 text-right font-bold text-sibs-primary-1">{account.sla}%</td>
                    <td className={`px-5 py-3 text-right font-bold ${account.growth.startsWith("-") ? "text-sibs-danger" : "text-sibs-secondary-3"}`}>
                      {account.growth}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-sibs-primary-1">{account.score}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-sibs-tertiary-10 px-5 py-3 text-sm text-sibs-tertiary-6">
            Showing {filteredAccounts.length} of {bodAccounts.length} strategic accounts
          </div>
        </section>
      </div>
    </div>
  );
}

function ClientSummaryCard({ item }) {
  const isDown = item.trend.startsWith("-");

  return (
    <div className="flex min-h-[98px] flex-col justify-between rounded-lg bg-[#f8fbfd] p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-sibs-tertiary-6">
          {item.label}
        </span>
        <span className={`text-[11px] font-bold ${isDown ? "text-sibs-danger" : "text-sibs-secondary-3"}`}>
          {item.trend}
        </span>
      </div>
      <p className={`my-1 text-2xl font-bold ${item.highlight ? "text-sibs-primary-2" : "text-sibs-primary-1"}`}>
        {item.value}
      </p>
      <p className="m-0 text-xs text-sibs-tertiary-5">{item.note}</p>
    </div>
  );
}

function ClientKpiComparison({ selectedKpi, onSelectKpi }) {
  return (
    <div className="grid gap-3 rounded-lg bg-[#eef3f7] p-3">
      <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-sibs-tertiary-6">
        <span className="flex items-center gap-1">
          <span className="h-2 w-5 rounded-full bg-sibs-primary-1" />
          Actual
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-5 rounded-full bg-sibs-primary-2/40" />
          Target
        </span>
      </div>
      <div className="flex h-60 items-end gap-3 overflow-x-auto pb-1">
        {clientKpis.map((kpi) => {
          const isSelected = selectedKpi.label === kpi.label;

          return (
            <button
              key={kpi.label}
              type="button"
              onClick={() => onSelectKpi(kpi)}
              className={`flex h-full min-w-24 flex-1 flex-col items-center justify-end gap-2 rounded-lg px-2 py-2 transition hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-sibs-primary-2 ${
                isSelected ? "bg-white" : ""
              }`}
            >
              <div className="flex h-44 items-end gap-1.5">
                <span
                  className="w-6 rounded-t bg-sibs-primary-2/35"
                  style={{ height: `${Math.max(kpi.target, 20)}%` }}
                />
                <span
                  className={`w-6 rounded-t ${isSelected ? "bg-sibs-primary-2" : "bg-sibs-primary-1"}`}
                  style={{ height: `${Math.max(kpi.actual, 20)}%` }}
                />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-sibs-tertiary-6">
                {kpi.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="rounded-lg bg-white p-3">
        <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-sibs-tertiary-6">
          Selected KPI
        </p>
        <p className="mt-2 mb-0 text-xl font-bold text-sibs-primary-1">
          {selectedKpi.label}: {selectedKpi.actual}% actual / {selectedKpi.target}% target
        </p>
        <p className="mt-1 mb-0 text-xs text-sibs-tertiary-5">
          {selectedKpi.actual >= selectedKpi.target ? "Meeting or exceeding client target." : "Below target and should be monitored."}
        </p>
      </div>
    </div>
  );
}

function ClientRatingCard() {
  return (
    <div className="flex flex-col items-center rounded-lg bg-[#eef3f7] p-4 text-center">
      <div
        className="flex h-36 w-36 items-center justify-center rounded-full"
        style={{
          background: "conic-gradient(#073763 0 80%, #dce5ec 80% 100%)",
        }}
      >
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-[#eef3f7]">
          <span className="text-3xl font-bold text-sibs-primary-1">4.4</span>
          <span className="text-[10px] font-bold uppercase text-sibs-tertiary-6">/ 5.0</span>
        </div>
      </div>
      <span className="mt-4 rounded-full bg-sibs-secondary-3/10 px-3 py-1 text-xs font-bold uppercase text-sibs-secondary-3">
        Very Good
      </span>
      <p className="mt-2 mb-0 text-xs text-sibs-tertiary-5">
        Based on 12 independent SLA audits.
      </p>
    </div>
  );
}

function ClientTrendChart({ selectedWeek, onSelectWeek }) {
  const chartWidth = 600;
  const chartHeight = 150;
  const xStep = chartWidth / (clientTrend.length - 1);
  const points = clientTrend.map((score, index) => ({
    score,
    x: index * xStep,
    y: chartHeight - ((score - 80) / 20) * chartHeight,
  }));
  const path = points.map((point) => `${point.x},${point.y}`).join(" ");
  const selectedScore = clientTrend[selectedWeek];

  return (
    <div className="grid gap-3 rounded-lg bg-[#eef3f7] p-3 lg:grid-cols-[1fr_180px]">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-sibs-tertiary-6">
          <span className="flex items-center gap-1">
            <span className="h-2 w-5 rounded-full bg-sibs-primary-2" />
            Account score
          </span>
          <span className="flex items-center gap-1">
            <span className="h-0.5 w-5 border-t-2 border-dashed border-sibs-primary-1" />
            90% target
          </span>
        </div>
        <div className="relative h-44">
          <svg
            aria-label="Client weekly performance line chart"
            className="h-full w-full overflow-visible"
            preserveAspectRatio="none"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          >
            {[80, 85, 90, 95, 100].map((tick) => {
              const y = chartHeight - ((tick - 80) / 20) * chartHeight;

              return (
                <g key={tick}>
                  <line x1="0" x2={chartWidth} y1={y} y2={y} stroke="#dce5ec" strokeWidth="1" />
                  <text x="-8" y={y + 4} textAnchor="end" className="fill-sibs-tertiary-6 text-[10px] font-semibold">
                    {tick}
                  </text>
                </g>
              );
            })}
            <line
              x1="0"
              x2={chartWidth}
              y1={chartHeight - ((90 - 80) / 20) * chartHeight}
              y2={chartHeight - ((90 - 80) / 20) * chartHeight}
              stroke="#073763"
              strokeDasharray="8 8"
              strokeWidth="3"
            />
            <polyline fill="none" points={path} stroke="#f05a28" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
            {points.map((point, index) => (
              <g key={`client-trend-${index}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  fill={selectedWeek === index ? "#073763" : "#f05a28"}
                  r={selectedWeek === index ? "8" : "6"}
                  stroke="#ffffff"
                  strokeWidth="3"
                />
                <text x={point.x} y={chartHeight + 18} textAnchor="middle" className="fill-sibs-tertiary-6 text-[10px] font-bold">
                  W{index + 1}
                </text>
              </g>
            ))}
          </svg>
          {points.map((point, index) => (
            <button
              key={`client-trend-button-${index}`}
              type="button"
              aria-label={`View client week ${index + 1} score`}
              onClick={() => onSelectWeek(index)}
              className="absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full outline-none focus:ring-2 focus:ring-sibs-primary-2"
              style={{
                left: `${(point.x / chartWidth) * 100}%`,
                top: `${(point.y / chartHeight) * 100}%`,
              }}
            />
          ))}
        </div>
      </div>
      <aside className="rounded-lg bg-white p-3">
        <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-sibs-tertiary-6">
          Selected Week
        </p>
        <p className="mt-2 mb-0 text-2xl font-bold text-sibs-primary-1">
          Week {selectedWeek + 1}: {selectedScore}%
        </p>
        <p className="mt-2 mb-0 text-xs leading-5 text-sibs-tertiary-5">
          {selectedScore >= 90 ? "Account is meeting client target." : "Account is below the client target."}
        </p>
      </aside>
    </div>
  );
}

function ClientScatterPlot({ selectedAgent, onSelectAgent }) {
  return (
    <div className="rounded-lg bg-[#eef3f7] p-3">
      <div className="relative h-64 border-b border-l border-sibs-tertiary-9">
        <div className="absolute left-2 top-2 rounded bg-white/80 px-2 py-1 text-[10px] font-bold uppercase text-sibs-tertiary-6">
          Quality
        </div>
        <div className="absolute bottom-2 right-2 rounded bg-white/80 px-2 py-1 text-[10px] font-bold uppercase text-sibs-tertiary-6">
          Productivity
        </div>
        {clientAgents.map((agent) => (
          <button
            key={agent.id}
            type="button"
            onClick={() => onSelectAgent(agent)}
            title={agent.id}
            className={`absolute h-4 w-4 -translate-x-1/2 translate-y-1/2 rounded-full transition hover:scale-125 focus:outline-none focus:ring-2 focus:ring-sibs-primary-2 ${
              selectedAgent.id === agent.id ? "bg-sibs-primary-2 ring-4 ring-sibs-primary-2/20" : "bg-sibs-primary-1"
            }`}
            style={{
              left: `${agent.productivity}%`,
              bottom: `${agent.quality - 10}%`,
            }}
          />
        ))}
      </div>
      <div className="mt-3 rounded-lg bg-white p-3">
        <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-sibs-tertiary-6">
          Selected Agent
        </p>
        <p className="mt-2 mb-0 text-sm font-bold text-sibs-primary-1">
          {selectedAgent.id}: {selectedAgent.quality}% quality / {selectedAgent.productivity}% productivity
        </p>
      </div>
    </div>
  );
}

function ClientDashboardContent() {
  const [selectedWeek, setSelectedWeek] = useState(5);
  const [selectedKpi, setSelectedKpi] = useState(clientKpis[0]);
  const [selectedAgent, setSelectedAgent] = useState(clientAgents[0]);
  const [agentSearch, setAgentSearch] = useState("");

  const filteredAgents = clientAgents.filter((agent) =>
    agent.id.toLowerCase().includes(agentSearch.trim().toLowerCase()),
  );

  return (
    <div className="space-y-3">
      <section className="sibs-card p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="m-0 text-xs font-bold uppercase tracking-wider text-sibs-primary-2">
              Performance / Client View
            </p>
            <p className="mt-1 mb-0 text-2xl font-bold text-sibs-primary-1">
              Client Account Performance
            </p>
            <p className="mt-1 mb-0 max-w-3xl text-sm text-sibs-tertiary-5">
              High-level overview of KPI results, overall account ratings, and service level compliance for designated operations.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="h-9 rounded-lg bg-white px-4">
              <Download className="h-4 w-4" aria-hidden="true" />
              Export PDF
            </Button>
            <Button className="h-9 rounded-lg bg-sibs-primary-1 px-4 text-white hover:bg-sibs-tertiary-4">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              Last 30 Days
            </Button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {clientSummary.map((item) => (
          <ClientSummaryCard key={item.label} item={item} />
        ))}
      </div>

      <div className="grid grid-cols-12 gap-3">
        <section className="sibs-card col-span-12 p-4 lg:col-span-8">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="m-0 flex items-center gap-2 text-lg font-semibold text-sibs-primary-1">
              <Target className="h-5 w-5 text-sibs-primary-2" aria-hidden="true" />
              Account KPI Actual vs Target
            </h2>
            <span className="text-xs font-semibold text-sibs-tertiary-5">
              Click a KPI group to inspect it
            </span>
          </div>
          <ClientKpiComparison selectedKpi={selectedKpi} onSelectKpi={setSelectedKpi} />
        </section>

        <section className="sibs-card col-span-12 p-4 lg:col-span-4">
          <h2 className="m-0 mb-3 text-lg font-semibold text-sibs-primary-1">
            Account Rating
          </h2>
          <ClientRatingCard />
        </section>

        <section className="sibs-card col-span-12 p-4 lg:col-span-7">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="m-0 flex items-center gap-2 text-lg font-semibold text-sibs-primary-1">
                <TrendingUp className="h-5 w-5 text-sibs-primary-2" aria-hidden="true" />
                Weekly Performance
              </h2>
              <p className="mt-1 mb-0 text-xs text-sibs-tertiary-5">
                Last 6 weeks rolling window
              </p>
            </div>
            <span className="flex w-fit items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-sibs-primary-2">
              <span className="h-2 w-2 rounded-full bg-sibs-primary-2" />
              Live
            </span>
          </div>
          <ClientTrendChart selectedWeek={selectedWeek} onSelectWeek={setSelectedWeek} />
        </section>

        <section className="sibs-card col-span-12 p-4 lg:col-span-5">
          <h2 className="m-0 text-lg font-semibold text-sibs-primary-1">
            Agent Quality vs Productivity
          </h2>
          <p className="mt-1 mb-3 text-xs font-bold uppercase tracking-wider text-sibs-tertiary-6">
            Anonymized view
          </p>
          <ClientScatterPlot selectedAgent={selectedAgent} onSelectAgent={setSelectedAgent} />
        </section>

        <section className="sibs-card col-span-12 overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-sibs-tertiary-10 bg-sibs-primary-3/30 px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="m-0 text-lg font-semibold text-sibs-primary-1">
                Agent KPI Summary
              </h2>
              <p className="mt-1 mb-0 text-sm text-sibs-tertiary-5">
                Detailed performance metrics by anonymized agent identifiers.
              </p>
            </div>
            <div className="relative w-full lg:w-72">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sibs-tertiary-6"
                aria-hidden="true"
              />
              <input
                value={agentSearch}
                onChange={(event) => setAgentSearch(event.target.value)}
                className="h-9 w-full rounded-lg border border-sibs-tertiary-9 bg-white pl-9 pr-4 text-sm outline-none focus:border-sibs-primary-2"
                placeholder="Search Agent ID..."
                type="text"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
              <thead className="bg-sibs-primary-3/50 text-xs uppercase text-sibs-tertiary-6">
                <tr>
                  {["Agent ID", "AHT (Sec)", "Quality %", "CSAT %", "Attendance %", "FCR %", "Status"].map((header) => (
                    <th key={header} className={`px-5 py-3 font-bold ${header === "Status" ? "text-right" : ""}`}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sibs-tertiary-10">
                {filteredAgents.map((agent) => (
                  <tr
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className={`cursor-pointer transition hover:bg-sibs-primary-2/5 ${
                      selectedAgent.id === agent.id ? "bg-sibs-primary-2/5" : "bg-[#f8fbfd]"
                    }`}
                  >
                    <td className="px-5 py-3 font-bold text-sibs-primary-1">{agent.id}</td>
                    <td className="px-5 py-3 text-sibs-tertiary-5">{agent.aht}</td>
                    <td className="px-5 py-3 text-sibs-tertiary-5">{agent.quality}%</td>
                    <td className="px-5 py-3 text-sibs-tertiary-5">{agent.csat}%</td>
                    <td className="px-5 py-3 text-sibs-tertiary-5">{agent.attendance}%</td>
                    <td className="px-5 py-3 text-sibs-tertiary-5">{agent.fcr}%</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${getClientStatusClass(agent.status)}`}>
                        {agent.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-2 border-t border-sibs-tertiary-10 px-5 py-3 text-sm text-sibs-tertiary-6 sm:flex-row sm:items-center sm:justify-between">
            <span>Showing {filteredAgents.length} of {clientAgents.length} agents</span>
            <span>Last synchronization: July 30, 2026 at 09:00 AM</span>
          </div>
        </section>
      </div>
    </div>
  );
}

function OmSummaryCard({ item }) {
  return (
    <div className="flex min-h-[92px] flex-col justify-between rounded-lg bg-[#f8fbfd] p-3">
      <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-sibs-tertiary-6">
        {item.label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${item.danger ? "text-sibs-danger" : "text-sibs-primary-1"}`}>
          {item.value}
        </span>
        <span className={`text-xs font-bold ${item.note.includes("-") || item.danger ? "text-sibs-primary-2" : "text-sibs-tertiary-5"}`}>
          {item.note}
        </span>
      </div>
    </div>
  );
}

function OmTrendChart({ selectedWeek, onSelectWeek }) {
  const chartWidth = 600;
  const chartHeight = 150;
  const xStep = chartWidth / (omTrend.length - 1);
  const target = 85;
  const points = omTrend.map((score, index) => ({
    score,
    x: index * xStep,
    y: chartHeight - ((score - 75) / 25) * chartHeight,
  }));
  const path = points.map((point) => `${point.x},${point.y}`).join(" ");
  const selectedScore = omTrend[selectedWeek];

  return (
    <div className="grid gap-3 rounded-lg bg-[#eef3f7] p-3 lg:grid-cols-[1fr_180px]">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-sibs-tertiary-6">
          <span className="flex items-center gap-1">
            <span className="h-2 w-5 rounded-full bg-sibs-primary-1" />
            Performance
          </span>
          <span className="flex items-center gap-1">
            <span className="h-0.5 w-5 border-t-2 border-dashed border-sibs-primary-2" />
            85% target
          </span>
        </div>
        <div className="relative h-44 px-3">
          <svg
            aria-label="Operations account performance trend chart"
            className="h-full w-full overflow-visible"
            preserveAspectRatio="none"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          >
            {[75, 80, 85, 90, 95, 100].map((tick) => {
              const y = chartHeight - ((tick - 75) / 25) * chartHeight;

              return (
                <g key={tick}>
                  <line x1="0" x2={chartWidth} y1={y} y2={y} stroke="#dce5ec" strokeWidth="1" />
                  <text x="-8" y={y + 4} textAnchor="end" className="fill-sibs-tertiary-6 text-[10px] font-semibold">
                    {tick}
                  </text>
                </g>
              );
            })}
            <line
              x1="0"
              x2={chartWidth}
              y1={chartHeight - ((target - 75) / 25) * chartHeight}
              y2={chartHeight - ((target - 75) / 25) * chartHeight}
              stroke="#f05a28"
              strokeDasharray="8 8"
              strokeWidth="3"
            />
            <polyline fill="none" points={path} stroke="#073763" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
            {points.map((point, index) => (
              <g key={`om-trend-${index}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  fill={selectedWeek === index ? "#f05a28" : "#073763"}
                  r={selectedWeek === index ? "8" : "6"}
                  stroke="#ffffff"
                  strokeWidth="3"
                />
                <text x={point.x} y={chartHeight + 18} textAnchor="middle" className="fill-sibs-tertiary-6 text-[10px] font-bold">
                  W{index + 1}
                </text>
              </g>
            ))}
          </svg>
          {points.map((point, index) => (
            <button
              key={`om-trend-button-${index}`}
              type="button"
              aria-label={`View operations week ${index + 1} score`}
              onClick={() => onSelectWeek(index)}
              className="absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full outline-none focus:ring-2 focus:ring-sibs-primary-2"
              style={{
                left: `calc(${(point.x / chartWidth) * 100}% + 12px)`,
                top: `${(point.y / chartHeight) * 100}%`,
              }}
            />
          ))}
        </div>
      </div>
      <aside className="rounded-lg bg-white p-3">
        <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-sibs-tertiary-6">
          Selected Week
        </p>
        <p className="mt-2 mb-0 text-2xl font-bold text-sibs-primary-1">
          Week {selectedWeek + 1}: {selectedScore}%
        </p>
        <p className="mt-2 mb-0 text-xs leading-5 text-sibs-tertiary-5">
          {selectedScore >= target ? "Above the operations target." : "Below target, review account or team filters."}
        </p>
      </aside>
    </div>
  );
}

function OmDistributionCard({ selectedStatus, onSelectStatus }) {
  const selectedItem = selectedStatus === "All"
    ? { label: "All Agents", value: 126, percent: 100 }
    : omDistribution.find((item) => item.label === selectedStatus);

  return (
    <div className="rounded-lg bg-[#eef3f7] p-3">
      <div
        className="mx-auto flex h-36 w-36 items-center justify-center rounded-full"
        style={{
          background: "conic-gradient(#073763 0 73%, #f05a28 73% 93%, #ba1a1a 93% 100%)",
        }}
      >
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-[#eef3f7]">
          <span className="text-2xl font-bold text-sibs-primary-1">{selectedItem.value}</span>
          <span className="text-[10px] font-bold uppercase text-sibs-tertiary-6">Agents</span>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <button
          type="button"
          onClick={() => onSelectStatus("All")}
          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold transition ${
            selectedStatus === "All" ? "bg-sibs-primary-1 text-white" : "bg-white text-sibs-primary-1 hover:bg-white/70"
          }`}
        >
          <span>All Agents</span>
          <span>126</span>
        </button>
        {omDistribution.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onSelectStatus(item.label)}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold transition ${
              selectedStatus === item.label ? "bg-sibs-primary-2 text-white" : "bg-white text-sibs-primary-1 hover:bg-white/70"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
              {item.label}
            </span>
            <span>{item.value} ({item.percent}%)</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function OmLeaderboard() {
  const topPerformers = [...omAgents].sort((a, b) => b.performance - a.performance).slice(0, 3);
  const needsAttention = [...omAgents].sort((a, b) => a.performance - b.performance).slice(0, 2);

  return (
    <div className="space-y-4">
      <div>
        <p className="m-0 mb-2 text-xs font-bold uppercase tracking-wider text-sibs-secondary-3">
          Top Performers
        </p>
        <div className="space-y-3">
          {topPerformers.map((agent) => (
            <div key={agent.id}>
              <div className="mb-1 flex justify-between text-xs font-semibold text-sibs-primary-1">
                <span>{agent.name}</span>
                <span>{agent.performance}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-sibs-tertiary-10">
                <div className="h-full rounded-full bg-sibs-primary-1" style={{ width: `${agent.performance}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-sibs-tertiary-10 pt-3">
        <p className="m-0 mb-2 text-xs font-bold uppercase tracking-wider text-sibs-primary-2">
          Needs Attention
        </p>
        <div className="space-y-3">
          {needsAttention.map((agent) => (
            <div key={agent.id}>
              <div className="mb-1 flex justify-between text-xs font-semibold text-sibs-primary-1">
                <span>{agent.name}</span>
                <span>{agent.performance}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-sibs-tertiary-10">
                <div className="h-full rounded-full bg-sibs-primary-2" style={{ width: `${agent.performance}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OmHeatmap() {
  const getHeatClass = (value) => {
    if (value > 82) return "bg-sibs-primary-2";
    if (value > 62) return "bg-sibs-primary-1/80";
    if (value > 42) return "bg-sibs-primary-1/50";
    if (value > 22) return "bg-sibs-primary-1/30";
    return "bg-sibs-primary-1/10";
  };

  return (
    <div className="overflow-x-auto pb-1">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-[44px_1fr] gap-2">
          <div />
          <div className="grid grid-cols-6 text-center text-[10px] font-bold text-sibs-tertiary-6">
            {omHeatmapHours.map((hour) => (
              <span key={hour}>{hour}</span>
            ))}
          </div>
          {omHeatmap.map((row) => (
            <div key={row.day} className="contents">
              <span className="py-1 text-xs font-bold uppercase text-sibs-primary-1">{row.day}</span>
              <div className="grid grid-cols-12 gap-1">
                {row.values.map((value, index) => (
                  <button
                    key={`${row.day}-${index}`}
                    type="button"
                    title={`${row.day} block ${index + 1}: ${value}% activity`}
                    className={`h-7 rounded transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-sibs-primary-2 ${getHeatClass(value)}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OperationsDashboardContent() {
  const [selectedWeek, setSelectedWeek] = useState(4);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [agentSearch, setAgentSearch] = useState("");
  const [accountVertical, setAccountVertical] = useState(omAccounts[0]);
  const [teamFilter, setTeamFilter] = useState(omTeams[0]);
  const [primaryKpi, setPrimaryKpi] = useState(omKpis[0]);
  const [period, setPeriod] = useState("Last 6 Weeks");

  const filteredAgents = omAgents.filter((agent) => {
    const statusMatches =
      selectedStatus === "All" ||
      (selectedStatus === "Meeting Target" && ["Top Performer", "Target Met"].includes(agent.status)) ||
      (selectedStatus === "Below Target" && agent.status === "Below Target") ||
      (selectedStatus === "Critical" && agent.status === "Critical");
    const teamMatches = teamFilter === "All Teams" || teamFilter.includes(agent.team);
    const search = agentSearch.trim().toLowerCase();
    const searchMatches = !search || agent.name.toLowerCase().includes(search) || agent.id.toLowerCase().includes(search);

    return statusMatches && teamMatches && searchMatches;
  });

  return (
    <div className="space-y-3">
      <section className="sibs-card p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="m-0 text-2xl font-bold text-sibs-primary-1">
              Operations Performance Dashboard
            </p>
            <p className="mt-1 mb-0 text-sm text-sibs-tertiary-5">
              Cross-account performance monitoring and team management tools.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="h-9 rounded-lg bg-white px-4">
              <Download className="h-4 w-4" aria-hidden="true" />
              Export Report
            </Button>
            <Button className="h-9 rounded-lg bg-sibs-primary-2 px-4 text-white hover:bg-sibs-warning">
              <Target className="h-4 w-4" aria-hidden="true" />
              New Benchmark
            </Button>
          </div>
        </div>
      </section>

      <section className="sibs-card grid grid-cols-1 gap-3 p-3 md:grid-cols-3 xl:grid-cols-6">
        {[
          ["Account Vertical", accountVertical, setAccountVertical, omAccounts, "md:col-span-2 xl:col-span-2"],
          ["Team / TL", teamFilter, setTeamFilter, omTeams, ""],
          ["Primary KPI", primaryKpi, setPrimaryKpi, omKpis, ""],
          ["Period", period, setPeriod, ["Last 6 Weeks", "Current Month", "Year to Date"], ""],
        ].map(([label, value, setter, options, extraClass]) => (
          <div key={label} className={`space-y-1 ${extraClass}`}>
            <label className="text-[11px] font-bold uppercase tracking-wider text-sibs-tertiary-6">
              {label}
            </label>
            <select
              value={value}
              onChange={(event) => setter(event.target.value)}
              className="form-input h-10 rounded-lg border-sibs-tertiary-9 bg-white py-0 text-sm"
            >
              {options.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
        ))}
        <div className="flex items-end">
          <Button className="h-10 w-full rounded-lg bg-sibs-primary-1 text-white hover:bg-sibs-tertiary-4">
            <Filter className="h-4 w-4" aria-hidden="true" />
            Deep Filter
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {omSummary.map((item) => (
          <OmSummaryCard key={item.label} item={item} />
        ))}
      </div>

      <div className="grid grid-cols-12 gap-3">
        <section className="sibs-card col-span-12 p-4 lg:col-span-8">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="m-0 text-lg font-semibold text-sibs-primary-1">
                Account Performance Trend
              </h2>
              <p className="mt-1 mb-0 text-xs font-semibold uppercase tracking-wider text-sibs-tertiary-6">
                6-week performance window
              </p>
            </div>
            <span className="w-fit rounded-full bg-sibs-primary-3 px-3 py-1 text-[10px] font-bold uppercase text-sibs-tertiary-6">
              Target: 85%
            </span>
          </div>
          <OmTrendChart selectedWeek={selectedWeek} onSelectWeek={setSelectedWeek} />
        </section>

        <section className="sibs-card col-span-12 p-4 lg:col-span-4">
          <h2 className="m-0 mb-3 text-lg font-semibold text-sibs-primary-1">
            Agent Distribution
          </h2>
          <OmDistributionCard selectedStatus={selectedStatus} onSelectStatus={setSelectedStatus} />
        </section>

        <section className="sibs-card col-span-12 overflow-hidden lg:col-span-8">
          <div className="flex flex-col gap-3 border-b border-sibs-tertiary-10 bg-sibs-primary-3/30 px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="m-0 text-lg font-semibold text-sibs-primary-1">
              Detailed Agent Performance
            </h2>
            <div className="relative w-full lg:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sibs-tertiary-6" aria-hidden="true" />
              <input
                value={agentSearch}
                onChange={(event) => setAgentSearch(event.target.value)}
                className="h-9 w-full rounded-lg border border-sibs-tertiary-9 bg-white pl-9 pr-4 text-sm outline-none focus:border-sibs-primary-2"
                placeholder="Search agents..."
                type="text"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left text-sm">
              <thead className="bg-sibs-primary-3/50 text-xs uppercase text-sibs-tertiary-6">
                <tr>
                  {["ID", "Name", "Team", "CSAT", "Quality", "Status", "Action"].map((header) => (
                    <th key={header} className={`px-5 py-3 font-bold ${header === "Action" ? "text-right" : ""}`}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sibs-tertiary-10">
                {filteredAgents.map((agent) => (
                  <tr key={agent.id} className="bg-[#f8fbfd] transition hover:bg-sibs-primary-2/5">
                    <td className="px-5 py-3 text-sibs-tertiary-5">{agent.id}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sibs-primary-1 text-xs font-bold text-white">
                          {agent.initials}
                        </span>
                        <span className="font-bold text-sibs-primary-1">{agent.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sibs-tertiary-5">{agent.team}</td>
                    <td className={`px-5 py-3 font-bold ${agent.csat < 75 ? "text-sibs-danger" : "text-sibs-primary-1"}`}>{agent.csat}%</td>
                    <td className={`px-5 py-3 font-bold ${agent.quality < 75 ? "text-sibs-danger" : "text-sibs-primary-1"}`}>{agent.quality}%</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${getOmStatusClass(agent.status)}`}>
                        {agent.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <MoreVertical className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-sibs-tertiary-10 px-5 py-3 text-sm text-sibs-tertiary-6">
            Showing {filteredAgents.length} of {omAgents.length} mock agents
          </div>
        </section>

        <section className="sibs-card col-span-12 p-4 lg:col-span-4">
          <h2 className="m-0 mb-3 text-lg font-semibold text-sibs-primary-1">
            Performance Leaderboard
          </h2>
          <OmLeaderboard />
        </section>

        <section className="sibs-card col-span-12 p-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="m-0 text-lg font-semibold text-sibs-primary-1">
                Agent KPI Heatmap
              </h2>
              <p className="mt-1 mb-0 text-xs font-semibold uppercase tracking-wider text-sibs-tertiary-6">
                Activity intensity across operational shifts
              </p>
            </div>
            <div className="flex w-fit items-center gap-2 rounded-lg bg-[#eef3f7] px-3 py-2 text-[11px] font-bold uppercase text-sibs-tertiary-6">
              <span>Low</span>
              <span className="flex gap-0.5">
                <span className="h-4 w-5 bg-sibs-primary-1/10" />
                <span className="h-4 w-5 bg-sibs-primary-1/30" />
                <span className="h-4 w-5 bg-sibs-primary-1/50" />
                <span className="h-4 w-5 bg-sibs-primary-1/80" />
                <span className="h-4 w-5 bg-sibs-primary-2" />
              </span>
              <span>High</span>
            </div>
          </div>
          <OmHeatmap />
        </section>
      </div>
    </div>
  );
}

function TlSummaryCard({ item }) {
  return (
    <div className="flex min-h-[98px] flex-col justify-between rounded-lg bg-[#f8fbfd] p-3">
      <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-sibs-tertiary-6">
        {item.label}
      </p>
      <p className={`my-1 text-xl font-bold ${item.highlight ? "text-sibs-primary-2" : "text-sibs-primary-1"}`}>
        {item.value}
      </p>
      <p className="m-0 text-xs text-sibs-tertiary-5">{item.note}</p>
    </div>
  );
}

function TlTrendChart({ selectedWeek, onSelectWeek }) {
  const chartWidth = 600;
  const chartHeight = 150;
  const target = 90;
  const xStep = chartWidth / (tlTrend.length - 1);
  const points = tlTrend.map((score, index) => ({
    score,
    x: index * xStep,
    y: chartHeight - ((score - 80) / 20) * chartHeight,
  }));
  const path = points.map((point) => `${point.x},${point.y}`).join(" ");
  const selectedScore = tlTrend[selectedWeek];

  return (
    <div className="grid gap-3 rounded-lg bg-[#eef3f7] p-3 lg:grid-cols-[1fr_180px]">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-sibs-tertiary-6">
          <span className="flex items-center gap-1">
            <span className="h-2 w-5 rounded-full bg-sibs-primary-1" />
            Team score
          </span>
          <span className="flex items-center gap-1">
            <span className="h-0.5 w-5 border-t-2 border-dashed border-sibs-primary-2" />
            90% target
          </span>
        </div>
        <div className="relative h-44 px-3">
          <svg
            aria-label="Team performance trend chart"
            className="h-full w-full overflow-visible"
            preserveAspectRatio="none"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          >
            {[80, 85, 90, 95, 100].map((tick) => {
              const y = chartHeight - ((tick - 80) / 20) * chartHeight;

              return (
                <g key={tick}>
                  <line x1="0" x2={chartWidth} y1={y} y2={y} stroke="#dce5ec" strokeWidth="1" />
                  <text x="-8" y={y + 4} textAnchor="end" className="fill-sibs-tertiary-6 text-[10px] font-semibold">
                    {tick}
                  </text>
                </g>
              );
            })}
            <line
              x1="0"
              x2={chartWidth}
              y1={chartHeight - ((target - 80) / 20) * chartHeight}
              y2={chartHeight - ((target - 80) / 20) * chartHeight}
              stroke="#f05a28"
              strokeDasharray="8 8"
              strokeWidth="3"
            />
            <polyline fill="none" points={path} stroke="#073763" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
            {points.map((point, index) => (
              <g key={`tl-trend-${index}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  fill={selectedWeek === index ? "#f05a28" : "#073763"}
                  r={selectedWeek === index ? "8" : "6"}
                  stroke="#ffffff"
                  strokeWidth="3"
                />
                <text x={point.x} y={chartHeight + 18} textAnchor="middle" className="fill-sibs-tertiary-6 text-[10px] font-bold">
                  W{index + 1}
                </text>
              </g>
            ))}
          </svg>
          {points.map((point, index) => (
            <button
              key={`tl-trend-button-${index}`}
              type="button"
              aria-label={`View team week ${index + 1} score`}
              onClick={() => onSelectWeek(index)}
              className="absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full outline-none focus:ring-2 focus:ring-sibs-primary-2"
              style={{
                left: `calc(${(point.x / chartWidth) * 100}% + 12px)`,
                top: `${(point.y / chartHeight) * 100}%`,
              }}
            />
          ))}
        </div>
      </div>
      <aside className="rounded-lg bg-white p-3">
        <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-sibs-tertiary-6">
          Selected Week
        </p>
        <p className="mt-2 mb-0 text-2xl font-bold text-sibs-primary-1">
          Week {selectedWeek + 1}: {selectedScore}%
        </p>
        <p className="mt-2 mb-0 text-xs leading-5 text-sibs-tertiary-5">
          {selectedScore >= target ? "Team is above target." : "Team needs coaching focus for this week."}
        </p>
      </aside>
    </div>
  );
}

function TlDistributionCard({ selectedStatus, onSelectStatus }) {
  return (
    <div className="rounded-lg bg-[#eef3f7] p-3">
      <div
        className="mx-auto flex h-36 w-36 items-center justify-center rounded-full"
        style={{
          background: "conic-gradient(#073763 0 39%, #f05a28 39% 72%, #ba1a1a 72% 100%)",
        }}
      >
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-[#eef3f7]">
          <span className="text-2xl font-bold text-sibs-primary-1">18</span>
          <span className="text-[10px] font-bold uppercase text-sibs-tertiary-6">Agents</span>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {["All", ...tlDistribution.map((item) => item.label)].map((status) => {
          const item = tlDistribution.find((entry) => entry.label === status);

          return (
            <button
              key={status}
              type="button"
              onClick={() => onSelectStatus(status)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold transition ${
                selectedStatus === status ? "bg-sibs-primary-2 text-white" : "bg-white text-sibs-primary-1 hover:bg-white/70"
              }`}
            >
              <span>{status === "All" ? "All Statuses" : status}</span>
              <span>{item ? `${item.value} (${item.percent}%)` : "18"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TlKpiBars() {
  return (
    <div className="space-y-4">
      {tlKpis.map((kpi) => (
        <div key={kpi.label}>
          <div className="mb-1 flex justify-between text-xs font-semibold text-sibs-primary-1">
            <span>{kpi.label}</span>
            <span>{kpi.target}</span>
          </div>
          <div className="h-8 overflow-hidden rounded-lg bg-sibs-tertiary-10">
            <div
              className={`flex h-full items-center px-3 text-sm font-bold text-white ${
                kpi.tone === "danger" ? "bg-sibs-danger" : kpi.tone === "secondary" ? "bg-sibs-primary-2" : "bg-sibs-primary-1"
              }`}
              style={{ width: `${kpi.percent}%` }}
            >
              {kpi.display}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TlAttributes() {
  return (
    <div className="grid gap-3 rounded-lg bg-[#eef3f7] p-3">
      {tlAttributes.map(([label, value]) => (
        <div key={label} className="flex items-center gap-3">
          <span className="w-24 text-xs font-semibold text-sibs-tertiary-6">{label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-sibs-primary-1" style={{ width: `${value}%` }} />
          </div>
          <span className="w-9 text-right text-xs font-bold text-sibs-primary-1">{value}%</span>
        </div>
      ))}
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg bg-white p-3">
          <p className="m-0 text-xs font-bold uppercase text-sibs-secondary-3">Strengths</p>
          <p className="mt-1 mb-0 text-xs text-sibs-tertiary-5">Quality, compliance, soft skills</p>
        </div>
        <div className="rounded-lg bg-white p-3">
          <p className="m-0 text-xs font-bold uppercase text-sibs-primary-2">Growth Areas</p>
          <p className="mt-1 mb-0 text-xs text-sibs-tertiary-5">FCR and escalation control</p>
        </div>
      </div>
    </div>
  );
}

function TeamLeaderDashboardContent() {
  const [selectedWeek, setSelectedWeek] = useState(5);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [agentSearch, setAgentSearch] = useState("");

  const filteredAgents = tlAgents.filter((agent) => {
    const search = agentSearch.trim().toLowerCase();
    const matchesSearch = !search || agent.name.toLowerCase().includes(search) || agent.id.includes(search);
    const matchesStatus =
      selectedStatus === "All" ||
      (selectedStatus === "Exceeding" && agent.score >= 92) ||
      (selectedStatus === "Meeting" && agent.score >= 82 && agent.score < 92) ||
      (selectedStatus === "Coaching" && agent.score < 82);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-3">
      <section className="sibs-card p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <span className="inline-flex rounded-lg bg-sibs-primary-1/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-sibs-primary-1">
              Assigned Account: Retail Support
            </span>
            <p className="mt-2 mb-0 text-2xl font-bold text-sibs-primary-1">
              Team Performance Dashboard
            </p>
            <p className="mt-1 mb-0 text-sm text-sibs-tertiary-5">
              Performance management and coaching tools for the Retail Support team.
            </p>
          </div>
          <Button className="h-9 rounded-lg bg-sibs-primary-2 px-4 text-white hover:bg-sibs-warning">
            <Target className="h-4 w-4" aria-hidden="true" />
            Create Coaching Record
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {tlSummary.map((item) => (
          <TlSummaryCard key={item.label} item={item} />
        ))}
      </div>

      <div className="grid grid-cols-12 gap-3">
        <section className="sibs-card col-span-12 p-4 lg:col-span-8">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="m-0 text-lg font-semibold text-sibs-primary-1">
                Team Performance Trend
              </h2>
              <p className="mt-1 mb-0 text-xs text-sibs-tertiary-5">
                Weekly aggregate performance
              </p>
            </div>
            <select className="form-input h-9 rounded-lg bg-white py-0 text-xs">
              <option>Last 6 Weeks</option>
              <option>Last 12 Weeks</option>
            </select>
          </div>
          <TlTrendChart selectedWeek={selectedWeek} onSelectWeek={setSelectedWeek} />
        </section>

        <section className="sibs-card col-span-12 p-4 lg:col-span-4">
          <h2 className="m-0 mb-3 text-lg font-semibold text-sibs-primary-1">
            Status Distribution
          </h2>
          <TlDistributionCard selectedStatus={selectedStatus} onSelectStatus={setSelectedStatus} />
        </section>

        <section className="sibs-card col-span-12 p-4 lg:col-span-6">
          <h2 className="m-0 mb-4 text-lg font-semibold text-sibs-primary-1">
            KPI Actual vs Target
          </h2>
          <TlKpiBars />
        </section>

        <section className="sibs-card col-span-12 p-4 lg:col-span-6">
          <h2 className="m-0 text-lg font-semibold text-sibs-primary-1">
            Team Attributes
          </h2>
          <p className="mt-1 mb-3 text-xs text-sibs-tertiary-5">
            Brand-aligned skill matrix
          </p>
          <TlAttributes />
        </section>

        <section className="sibs-card col-span-12 p-4 lg:col-span-5">
          <h2 className="m-0 mb-4 text-lg font-semibold text-sibs-primary-1">
            Top 5 Agent Ranking
          </h2>
          <div className="space-y-3">
            {tlAgents.slice(0, 5).map((agent) => (
              <div key={agent.id} className="flex items-center gap-3 rounded-lg bg-[#eef3f7] p-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sibs-primary-1 text-xs font-bold text-white">
                  {agent.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-3 text-sm font-bold text-sibs-primary-1">
                    <span className="truncate">{agent.name}</span>
                    <span>{agent.score}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-sibs-primary-2" style={{ width: `${agent.score}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="sibs-card col-span-12 overflow-hidden lg:col-span-7">
          <div className="flex flex-col gap-3 border-b border-sibs-tertiary-10 bg-sibs-primary-3/30 px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="m-0 text-lg font-semibold text-sibs-primary-1">
                Agent Performance Roster
              </h2>
              <p className="mt-1 mb-0 text-sm text-sibs-tertiary-5">
                Real-time team leaderboard
              </p>
            </div>
            <div className="relative w-full lg:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sibs-tertiary-6" aria-hidden="true" />
              <input
                value={agentSearch}
                onChange={(event) => setAgentSearch(event.target.value)}
                className="h-9 w-full rounded-lg border border-sibs-tertiary-9 bg-white pl-9 pr-4 text-sm outline-none focus:border-sibs-primary-2"
                placeholder="Search by name or ID..."
                type="text"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-sibs-primary-3/50 text-xs uppercase text-sibs-tertiary-6">
                <tr>
                  {["Agent Details", "Employee ID", "Rank", "Score", "Coaching Status", "Operations"].map((header) => (
                    <th key={header} className={`px-5 py-3 font-bold ${header === "Operations" ? "text-right" : ""}`}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sibs-tertiary-10">
                {filteredAgents.map((agent) => (
                  <tr key={agent.id} className="bg-[#f8fbfd] transition hover:bg-sibs-primary-2/5">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sibs-primary-1 text-xs font-bold text-white">
                          {agent.initials}
                        </span>
                        <span className="font-bold text-sibs-primary-1">{agent.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sibs-tertiary-5">{agent.id}</td>
                    <td className="px-5 py-3 font-bold text-sibs-primary-1">#{agent.rank}</td>
                    <td className="px-5 py-3 font-bold text-sibs-primary-1">{agent.score}%</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${getTlCoachingClass(agent.coaching)}`}>
                        {agent.coaching}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <MoreVertical className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-sibs-tertiary-10 px-5 py-3 text-sm text-sibs-tertiary-6">
            Displaying {filteredAgents.length} of {tlAgents.length} mock agents
          </div>
        </section>

        <section className="sibs-card col-span-12 p-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="m-0 text-lg font-semibold text-sibs-primary-1">
              Recent Coaching Records
            </h2>
            <Button variant="ghost" className="h-9 rounded-lg text-sibs-primary-2">
              Access Full Archive
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {tlCoachingRecords.map((record) => (
              <div key={record.title} className="rounded-lg bg-[#eef3f7] p-4">
                <p className="m-0 text-xs font-bold uppercase tracking-wider text-sibs-tertiary-6">
                  {record.agent}
                </p>
                <p className="mt-2 mb-1 text-sm font-bold text-sibs-primary-1">{record.title}</p>
                <p className="m-0 text-xs leading-5 text-sibs-tertiary-5">{record.detail}</p>
                <div className="mt-3 flex items-center justify-between border-t border-white pt-3">
                  <span className="text-[11px] font-bold uppercase text-sibs-tertiary-6">Coach: {record.coach}</span>
                  <span className="rounded bg-white px-2 py-0.5 text-[11px] font-bold uppercase text-sibs-primary-1">
                    {record.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function WfmDashboardContent() {
  const cachedImportState = useMemo(() => readWfmImportCache(), []);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDeletingFile, setIsDeletingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [selectedUpload, setSelectedUpload] = useState(cachedImportState.selectedUpload);
  const [uploadedFiles, setUploadedFiles] = useState(cachedImportState.uploadedFiles);
  const [currentPage, setCurrentPage] = useState(1);

  const selectedUploadedFile = useMemo(
    () => uploadedFiles.find((upload) => upload.fileName === selectedUpload),
    [selectedUpload, uploadedFiles],
  );
  const displayedRows = useMemo(
    () =>
      selectedUploadedFile
        ? selectedUploadedFile.rows
        : uploadedFiles.flatMap((upload) => upload.rows),
    [selectedUploadedFile, uploadedFiles],
  );
  const rowsPerPage = 25;
  const totalPages = Math.max(1, Math.ceil(displayedRows.length / rowsPerPage));
  const paginatedRows = displayedRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const handleSelectedUploadChange = (fileName) => {
    setSelectedUpload(fileName);
    setCurrentPage(1);
  };

  useEffect(() => {
    writeWfmImportCache({
      selectedUpload,
      uploadedFiles,
    });
  }, [selectedUpload, uploadedFiles]);

  const handleFileSelect = (files) => {
    const file = files?.[0];

    if (file) {
      setSelectedFile(file);
    }
  };

  const closeImportModal = () => {
    setIsImportModalOpen(false);
    setSelectedFile(null);
  };

  const readSelectedFile = () =>
    new Promise((resolve) => {
      if (!selectedFile) {
        resolve([]);
        return;
      }

      if (/\.csv$/i.test(selectedFile.name)) {
        const reader = new FileReader();
        reader.onload = () => resolve(parseCsvRows(reader.result, selectedFile.name));
        reader.onerror = () => resolve([]);
        reader.readAsText(selectedFile);
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          resolve(await parseWorkbookRows(reader.result, selectedFile.name));
        } catch (error) {
          console.error("Excel import failed:", error);
          resolve([]);
        }
      };
      reader.onerror = () => resolve([]);
      reader.readAsArrayBuffer(selectedFile);
    });

  const handleUploadFile = async () => {
    const fileName = selectedFile?.name || "workforce_raw_import.xlsx";
    setIsImportModalOpen(false);
    setIsImporting(true);
    const [rows] = await Promise.all([
      readSelectedFile(),
      new Promise((resolve) => {
        window.setTimeout(resolve, 3000);
      }),
    ]);

    setUploadedFiles((currentFiles) => {
      const nextFiles = [
        {
          fileName,
          account: "Workforce Raw Import",
          reportType: "Employee Performance KPI",
          status: "Completed",
          records: rows.length.toLocaleString(),
          uploadedAt: formatUploadTimestamp(),
          rows,
        },
        ...currentFiles.filter((upload) => upload.fileName !== fileName),
      ];

      writeWfmImportCache({
        selectedUpload: fileName,
        uploadedFiles: nextFiles,
      });

      return nextFiles;
    });
    handleSelectedUploadChange(fileName);
    closeImportModal();
    setIsImporting(false);
    setShowSuccessModal(true);
  };

  const confirmDeleteFile = (upload) => {
    setFileToDelete(upload);
    setShowDeleteConfirm(true);
  };

  const handleDeleteFile = async () => {
    const deletedFileName = fileToDelete?.fileName;
    setShowDeleteConfirm(false);
    setIsDeletingFile(true);

    await new Promise((resolve) => {
      window.setTimeout(resolve, 800);
    });

    const nextFiles = uploadedFiles.filter(
      (upload) => upload.fileName !== deletedFileName,
    );

    if (selectedUpload === deletedFileName) {
      const nextFile = nextFiles[0];
      handleSelectedUploadChange(nextFile?.fileName || "");
    }

    setUploadedFiles(nextFiles);
    writeWfmImportCache({
      selectedUpload:
        selectedUpload === deletedFileName ? nextFiles[0]?.fileName || "" : selectedUpload,
      uploadedFiles: nextFiles,
    });

    setFileToDelete(null);
    setIsDeletingFile(false);
  };

  return (
    <>
      <div className="grid grid-cols-12 gap-4">
        <section className="col-span-12 flex justify-end">
          <Button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="h-10 rounded-lg bg-sibs-primary-1 px-5 text-white hover:bg-sibs-tertiary-4"
          >
            <CloudUpload className="h-4 w-4" aria-hidden="true" />
            Upload/Import File
          </Button>
        </section>

        <section className="sibs-card col-span-12 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="m-0 text-base font-semibold text-sibs-primary-1">
              Uploaded Excel Files
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-sibs-tertiary-10 bg-[#f8fbfd] px-2.5 py-1 text-xs font-semibold text-sibs-tertiary-5">
              Imported files
              <strong className="text-sibs-primary-1">{uploadedFiles.length}</strong>
            </span>
          </div>

          {uploadedFiles.length > 0 ? (
            <div className="mt-2 divide-y divide-sibs-tertiary-10 overflow-hidden rounded-lg border border-sibs-tertiary-10 bg-[#f8fbfd]">
              {uploadedFiles.map((upload) => (
                <div
                  key={`${upload.fileName}-${upload.uploadedAt}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectedUploadChange(upload.fileName)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleSelectedUploadChange(upload.fileName);
                    }
                  }}
                  className={`grid cursor-pointer gap-2 px-3 py-2 text-left transition hover:bg-sibs-primary-2/5 md:grid-cols-[minmax(0,1fr)_145px_64px_30px] md:items-center ${
                    selectedUpload === upload.fileName
                      ? "bg-sibs-primary-2/5"
                      : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="m-0 truncate text-xs font-bold text-sibs-primary-1">
                      {upload.fileName}
                    </p>
                  </div>
                  <div className="truncate text-xs text-sibs-tertiary-5">
                    {upload.uploadedAt}
                  </div>
                  <div className="text-xs text-sibs-tertiary-5">
                    <span>{upload.records} rows</span>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      confirmDeleteFile(upload);
                    }}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-sibs-danger transition hover:bg-sibs-danger/10 md:justify-self-end"
                    title="Delete file"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-sibs-tertiary-9 bg-[#f8fbfd] px-5 py-8 text-center text-sm text-sibs-tertiary-5">
              No uploaded files yet.
            </div>
          )}
        </section>

        <section className="sibs-card col-span-12 overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-sibs-tertiary-10 bg-sibs-primary-3/30 px-5 py-3 md:flex-row md:items-center md:justify-between">
            <h2 className="m-0 text-lg font-semibold text-sibs-primary-1">
              Imported Employee Performance Rows
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                value={selectedUpload}
                onChange={(event) => handleSelectedUploadChange(event.target.value)}
                className="form-input h-9 rounded-full py-0 sm:w-72"
              >
                <option value="">All uploaded files</option>
                {uploadedFiles.map((upload) => (
                  <option key={`${upload.fileName}-${upload.uploadedAt}`} value={upload.fileName}>
                    {upload.fileName}
                  </option>
                ))}
              </select>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sibs-tertiary-6"
                  aria-hidden="true"
                />
                <input
                  className="h-9 w-full rounded-full border border-sibs-tertiary-9 bg-white pl-9 pr-4 text-sm outline-none focus:border-sibs-primary-2 sm:w-56"
                  placeholder="Search rows..."
                  type="text"
                />
              </div>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Filter className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>

          <div className="sibs-scrollbar overflow-x-auto">
            <table className="w-max min-w-full table-fixed border-collapse text-left">
              <colgroup>
                {wfmRawDataColumnConfig.map((column) => (
                  <col key={column.label} style={{ width: column.width }} />
                ))}
              </colgroup>
              <thead className="bg-sibs-primary-3/50 text-xs uppercase text-sibs-tertiary-6">
                <tr>
                  {wfmRawDataColumnConfig.map((column) => (
                    <th
                      key={column.label}
                      className={`whitespace-nowrap px-4 py-3 font-bold ${
                        column.align === "right" ? "text-right" : ""
                      }`}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sibs-tertiary-10 text-sm">
                {paginatedRows.length > 0 ? (
                  paginatedRows.map((row, rowIndex) => (
                    <tr key={`${row[0]}-${rowIndex}`} className="bg-[#f8fbfd] transition hover:bg-sibs-primary-2/5">
                      {row.map((cell, cellIndex) => (
                        <td
                          key={`${wfmRawDataColumns[cellIndex]}-${cellIndex}`}
                          className={`max-w-0 whitespace-nowrap px-4 py-3 text-sibs-tertiary-5 ${
                            wfmRawDataColumnConfig[cellIndex]?.align === "right"
                              ? "text-right"
                              : ""
                          }`}
                          title={String(cell || "")}
                        >
                          {wfmRawDataColumns[cellIndex] === "Status" ? (
                            <WfmStatusPill status={cell} />
                          ) : (
                            <span className="block truncate">{cell}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={wfmRawDataColumns.length} className="bg-[#f8fbfd] px-5 py-10 text-center text-sm text-sibs-tertiary-5">
                      No raw data imported yet. Upload a file to populate this table.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-sibs-tertiary-10 px-5 py-3 text-sm text-sibs-tertiary-6 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {paginatedRows.length} of {displayedRows.length} imported rows
            </span>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <span>{selectedUpload || "All uploaded files"}</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-lg px-4"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                >
                  Previous
                </Button>
                <span className="text-xs font-bold text-sibs-tertiary-6">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-lg px-4"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <AppModal isOpen={isImportModalOpen} className="max-w-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="m-0 text-lg font-bold text-sibs-primary-1">
              Upload/Import File
            </p>
            <p className="mt-1 mb-0 text-sm text-sibs-tertiary-5">
              Select an Excel or CSV raw KPI file for frontend staging.
            </p>
          </div>
          <CloudUpload className="h-6 w-6 text-sibs-primary-2" aria-hidden="true" />
        </div>

        <label
          htmlFor="wfm-import-file-input"
          className="mt-5 flex cursor-pointer items-center gap-4 rounded-lg border border-dashed border-sibs-tertiary-9 bg-[#f8fbfd] p-5 text-left transition hover:border-sibs-primary-2 hover:bg-sibs-primary-2/5"
        >
          <input
            id="wfm-import-file-input"
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(event) => handleFileSelect(event.target.files)}
          />
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sibs-primary-2/10">
            <CloudUpload className="h-6 w-6 text-sibs-primary-2" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="m-0 truncate text-sm font-bold text-sibs-primary-1">
              {selectedFile?.name || "Choose Excel sheet file"}
            </p>
            <p className="mt-1 mb-0 text-xs text-sibs-tertiary-5">
              Accepted: .xlsx, .xls, .csv
            </p>
          </div>
        </label>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={closeImportModal}
            className="h-10 rounded-xl border-sibs-tertiary-8 sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!selectedFile}
            onClick={handleUploadFile}
            className="h-10 rounded-xl bg-sibs-primary-1 font-semibold text-white hover:bg-sibs-tertiary-4 sm:w-auto"
          >
            Upload
          </Button>
        </div>
      </AppModal>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Delete uploaded file"
        message={`Remove ${fileToDelete?.fileName || "this file"} from the uploaded files list?`}
        cancelText="Cancel"
        confirmText="Delete"
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteFile}
        tone="neutral"
      />

      <LoadingModal
        isOpen={isImporting}
        title="Importing file"
        message="Please wait while we read and stage the uploaded file."
      />

      <LoadingModal
        isOpen={isDeletingFile}
        title="Deleting file"
        message="Removing the uploaded file from this workspace."
      />

      <AppModal isOpen={showSuccessModal} textAlign="center">
        <CheckCircle2 className="mx-auto h-11 w-11 text-sibs-success" aria-hidden="true" />
        <p className="mt-4 mb-1 text-base font-bold text-sibs-primary-1">
          Action completed
        </p>
        <p className="m-0 text-sm text-sibs-tertiary-5">
          The WFM import workspace has been updated.
        </p>
        <Button
          type="button"
          onClick={() => setShowSuccessModal(false)}
          className="mt-5 h-10 w-full rounded-xl bg-sibs-primary-1 text-white hover:bg-sibs-tertiary-4"
        >
          Done
        </Button>
      </AppModal>
    </>
  );
}

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [authUser] = useState(() => getAuthUser());

  const role = authUser?.role || "agent";
  const Icon = roleIcons[role] || Gauge;
  const isSuperAdminHistoryLogs =
    role === "superadmin" &&
    location.pathname.endsWith("/history-logs");
  const isUnfinalizedInterface = ["agent", "bod", "client", "om", "tl"].includes(role);
  const unfinishedDashboardComponents = useMemo(
    () => ({
      agent: AgentDashboardContent,
      bod: BodDashboardContent,
      client: ClientDashboardContent,
      om: OperationsDashboardContent,
      tl: TeamLeaderDashboardContent,
    }),
    [],
  );
  const UnfinishedDashboardContent = unfinishedDashboardComponents[role];

  const modules = useMemo(
    () => {
      const dashboardModule = {
        name: `${authUser?.roleLabel || "User"} Dashboard`,
        icon: Icon,
        path: authUser?.dashboardPath || "/dashboard",
      };

      if (role !== "superadmin") {
        return [dashboardModule];
      }

      return [
        dashboardModule,
        {
          name: "History Logs",
          icon: ClipboardList,
          path: "/dashboard/superadmin/history-logs",
        },
      ];
    },
    [Icon, authUser, role],
  );

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    setShowLogoutModal(false);
    setIsLoggingOut(true);

    window.setTimeout(() => {
      clearAuthSession();
      navigate("/");
    }, 900);
  };

  return (
    <section className="font-jakarta flex min-h-screen bg-[#eef3f7] text-sibs-primary-1">
      <AdminSidebar
        isMobileOpen={isMobileSidebarOpen}
        modules={modules}
        onLogoutClick={() => setShowLogoutModal(true)}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
        userName={authUser?.name || authUser?.username || "User"}
        userRole={authUser?.email || authUser?.roleLabel || "User"}
      />

      <main className="min-w-0 flex-1">
        <AppHeader
          title={`${authUser?.roleLabel || "User"} Dashboard`}
          subtitle="Performance Management System"
          onMenuClick={() => setIsMobileSidebarOpen(true)}
        />

        <div className="sibs-scrollbar max-h-[calc(100vh-74px)] overflow-y-auto p-3 sm:p-4 lg:p-5">
          {isSuperAdminHistoryLogs ? (
            <SuperAdminHistoryLogs />
          ) : role === "superadmin" ? (
            <SuperAdminDashboard />
          ) : role === "wfm" ? (
            <WfmDashboardContent />
          ) : isUnfinalizedInterface && UnfinishedDashboardContent ? (
            null
          ) : (
            null
          )}
        </div>
      </main>

      <ConfirmationModal
        isOpen={showLogoutModal}
        title="Confirm logout"
        message="Are you sure you want to logout?"
        cancelText="Cancel"
        confirmText="Logout"
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        tone="neutral"
      />

      <LoadingModal
        isOpen={isLoggingOut}
        title="Logging out"
        message="Please wait while we end your session."
      />
    </section>
  );
};

export default DashboardLayout;
