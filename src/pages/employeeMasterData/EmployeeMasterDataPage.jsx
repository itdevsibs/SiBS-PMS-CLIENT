import { recordAuditLog } from "@/lib/audit-logger";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpDown,
  AlertTriangle,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  Layers,
  Loader2,
  Pencil,
  RefreshCw,
  Search,
  Upload,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";

import AdminSidebar from "@/components/common/layout/AdminSidebar";
import AppHeader from "@/components/common/layout/AppHeader";
import AppModal from "@/components/common/ui/AppModal";
import ConfirmationModal from "@/components/common/ui/ConfirmationModal";
import LoadingModal from "@/components/common/ui/LoadingModal";
import EditEmployeeLedgerModal from "@/components/modules/employee-ledger/EditEmployeeLedgerModal";
import TablePagination from "@/components/common/tables/TablePagination";
import { getUserAdminAccess } from "@/config/accessControl";
import useDashboardPage from "@/hooks/useDashboardPage";
import {
  fetchMasterDataLedger,
  fetchMasterDataTaskOrders,
  importUsVisaEmployeeLedger,
  previewKronosEmployeeLedgerSync,
  applyKronosEmployeeLedgerSync,
  updateEmployeeLedgerRecord,
} from "@/lib/axios/masterdata";

const DEFAULT_TASK_ORDERS = [
  "All Task Orders",
  "GSS 2.0 TO10 - SEASIA",
  "GSS 2.0 TO4 - PAC",
  "GSS 2.0 TO12 - NICE",
  "GSS 2.0 TO16 - SEURECA",
  "GSS 2.0 TO14 - NESAMI",
];

function isOmOrInvalidTaskOrder(str) {
  if (!str) return false;
  const s = String(str).trim().toLowerCase();
  return (
    s === "om" ||
    s === "- om" ||
    s === "- operations manager" ||
    s === "operations manager" ||
    s.includes("operations manager") ||
    s.includes("#ref!")
  );
}

/* ─── Status badge ──────────────────────────────────────────────── */
// eslint-disable-next-line no-unused-vars
function StatusBadge({ status }) {
  const map = {
    UNIFIED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ALIASED:  "bg-blue-50   text-blue-700   border-blue-200",
    INCOMPLETE: "bg-rose-50 text-rose-600   border-rose-200",
  };
  const cls = map[status] || "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider ${cls}`}
    >
      {status || "—"}
    </span>
  );
}

/* ─── Tool name cell ─────────────────────────────────────────────── */
// eslint-disable-next-line no-unused-vars
function ToolCell({ name, type }) {
  if (!name) return <span className="text-slate-300 select-none">—</span>;
  const isExact = type === "EXACT";
  const badgeCls = isExact
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-blue-50 text-blue-700 border-blue-200";

  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="font-medium text-slate-800 leading-tight truncate" title={name}>
        {name}
      </span>
      {type && (
        <span
          className={`inline-block w-fit rounded px-1.5 py-px text-[9px] font-bold uppercase tracking-wider border ${badgeCls}`}
        >
          {type}
        </span>
      )}
    </div>
  );
}

/** The database `status` column is retained untouched for historical/import compatibility. */
function getEmploymentStatus(employee) {
  if (["Active", "Inactive", "Needs Verification"].includes(employee?.employmentStatus)) {
    return employee.employmentStatus;
  }
  // No local status inference: the server uses the synchronized Kronos
  // gy_user_status snapshot (0 = Active, 1 = Inactive).
  return "Needs Verification";
}

const ORGANIZATIONAL_ROLE_OPTIONS = [
  ["", "All Roles"],
  ["AGENT", "Agent"],
  ["TEAM_LEADER", "Team Leader"],
  ["MANAGER", "Manager"],
  ["SENIOR_MANAGER", "SOM / Senior Manager"],
  ["NEEDS_REVIEW", "Needs Review"],
  ["UNCLASSIFIED", "Unclassified"],
];

const EMPLOYMENT_STATUS_OPTIONS = [
  ["", "All Status"],
  ["Active", "Active"],
  ["Needs Verification", "Needs Verification"],
  ["Inactive", "Inactive"],
];

const LEDGER_SUMMARY_CARDS = [
  {
    key: "total",
    label: "TOTAL EMPLOYEES",
    value: "—",
    subtitle: "All employee records in SiBS PMS",
    icon: Users,
    iconWrapClass: "bg-blue-50 text-blue-600",
  },
  {
    key: "active",
    label: "ACTIVE EMPLOYEES",
    value: "—",
    subtitle: "Currently employed and on record",
    icon: CheckCircle2,
    iconWrapClass: "bg-emerald-50 text-emerald-600",
  },
  {
    key: "needsVerification",
    label: "NEEDS VERIFICATION",
    value: "—",
    subtitle: "Pending Kronos verification",
    icon: Clock,
    iconWrapClass: "bg-amber-50 text-amber-500",
  },
  {
    key: "inactive",
    label: "INACTIVE EMPLOYEES",
    value: "—",
    subtitle: "Disabled or archived accounts",
    icon: XCircle,
    iconWrapClass: "bg-orange-50 text-orange-500",
  },
  {
    key: "kronosVerified",
    label: "KRONOS VERIFIED",
    value: "—",
    subtitle: "Matched and verified in Kronos",
    icon: Layers,
    iconWrapClass: "bg-purple-50 text-purple-600",
  },
];

function roleLabel(role) {
  return ORGANIZATIONAL_ROLE_OPTIONS.find(([key]) => key === role)?.[1] || "Unclassified";
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function EmployeeMasterDataPage() {
  const dashboard = useDashboardPage();

  const [searchTerm, setSearchTerm]           = useState("");
  const [selectedRole, setSelectedRole]       = useState("");
  const [selectedStatus, setSelectedStatus]   = useState("");
  const [ledgerSummary, setLedgerSummary]     = useState(null);
  const [ledgerList, setLedgerList]           = useState([]);
  const [totalCount, setTotalCount]           = useState(0);
  const [isLoading, setIsLoading]             = useState(true);
  const [errorMsg, setErrorMsg]               = useState("");
  const [currentPage, setCurrentPage]         = useState(1);
  const [totalPages, setTotalPages]           = useState(1);
  const [sortBy, setSortBy]                   = useState(null); // 'fusecom' | 'fusenet' | 'herodash' | 'ms-d' | null
  const [sortOrder, setSortOrder]             = useState("desc"); // 'desc' (tool names first) | 'asc' (missing tool names first)
  const pageSize = 25;

  /* Task Order filter states */
  const [selectedTaskOrder, setSelectedTaskOrder]             = useState("");
  const [taskOrderList, setTaskOrderList]                     = useState(DEFAULT_TASK_ORDERS);
  const [isTaskOrderDropdownOpen, setIsTaskOrderDropdownOpen] = useState(false);
  const [taskOrderSearchTerm, setTaskOrderSearchTerm]         = useState("");
  const taskOrderDropdownRef                                  = useRef(null);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen]           = useState(false);
  const roleDropdownRef                                       = useRef(null);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen]       = useState(false);
  const statusDropdownRef                                     = useRef(null);

  /* Fetch task orders for the US Visa-only ledger */
  useEffect(() => {
    let alive = true;
    fetchMasterDataTaskOrders()
      .then((res) => {
        if (alive && res?.success && Array.isArray(res.taskOrders)) {
          setTaskOrderList((prev) => {
            const filteredPrev = prev.filter((to) => !isOmOrInvalidTaskOrder(to));
            const set = new Set(filteredPrev);
            res.taskOrders.forEach((to) => {
              if (to && !isOmOrInvalidTaskOrder(to)) set.add(to);
            });
            return Array.from(set);
          });
        }
      })
      .catch(console.error);

    return () => { alive = false; };
  }, []);

  // Ensure Operations Manager / OM is never active in selectedTaskOrder
  useEffect(() => {
    if (selectedTaskOrder && isOmOrInvalidTaskOrder(selectedTaskOrder)) {
      setSelectedTaskOrder("");
    }
  }, [selectedTaskOrder]);

  /* Fetch ledger data */
  const loadLedgerData = useCallback(
    async (
      searchQuery = "",
      to = "",
      page = 1,
      size = 25,
      activeSortBy = null,
      activeSortOrder = "desc",
      activeRole = "",
      activeStatus = "",
    ) => {
      const query = searchQuery.trim();
      try {
        setIsLoading(true);
        setErrorMsg("");
        const result = await fetchMasterDataLedger({
          search: query,
          account: "US Visa",
          taskOrder: to || "",
          organizationalRole: activeRole,
          employmentStatus: activeStatus,
          page,
          limit: size,
          viewAll: true,
          sortBy: activeSortBy || "",
          sortOrder: activeSortOrder || "desc",
        });
        if (result?.success) {
          setLedgerList(result.data || []);
          setTotalCount(result.total || 0);
          setTotalPages(result.totalPages || 1);
          if (result.summary) {
            setLedgerSummary(result.summary);
          }
        } else {
          setErrorMsg(result?.message || "Failed to load master ledger records.");
        }
      } catch {
        setErrorMsg("Unable to connect to Master Data service.");
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const handleToggleToolSort = (toolKey) => {
    if (
      sortBy === toolKey ||
      (toolKey === "ms-d" && (sortBy === "msd" || sortBy === "ms-d")) ||
      (toolKey === "msd" && (sortBy === "msd" || sortBy === "ms-d"))
    ) {
      setSortBy(null);
    } else {
      setSortBy(toolKey);
    }
    setSortOrder("desc");
    setCurrentPage(1);
  };

  useEffect(() => {
    const t = setTimeout(() => {
      void loadLedgerData(searchTerm, selectedTaskOrder, currentPage, pageSize, sortBy, sortOrder, selectedRole, selectedStatus);
    }, 250);
    return () => clearTimeout(t);
  }, [searchTerm, selectedTaskOrder, selectedRole, selectedStatus, currentPage, pageSize, sortBy, sortOrder, loadLedgerData]);

  // Close dropdowns on outside click or Escape.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (taskOrderDropdownRef.current && !taskOrderDropdownRef.current.contains(e.target)) {
        setIsTaskOrderDropdownOpen(false);
        setTaskOrderSearchTerm("");
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target)) {
        setIsRoleDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setIsStatusDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsTaskOrderDropdownOpen(false);
        setTaskOrderSearchTerm("");
        setIsRoleDropdownOpen(false);
        setIsStatusDropdownOpen(false);
        setViewingEmployee(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [isSavingEdit, setIsSavingEdit]       = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg]   = useState("");
  const [savedEmployeeSuccess, setSavedEmployeeSuccess] = useState(null);

  const handleOpenEditModal = (emp) => {
    setEditingEmployee(emp);
  };

  const handleCloseEditModal = () => {
    if (isSavingEdit) return;
    setEditingEmployee(null);
  };

  const handleSaveEmployeeRecord = async (formData) => {
    if (!editingEmployee?.sibsId) return;
    try {
      setIsSavingEdit(true);
      setErrorMsg("");
      // Employment status comes from Kronos gy_user_status; preserve the historical ledger status.
      const updatePayload = { ...formData };
      delete updatePayload.status;
      // Read-only API-derived field: never send or optimistically overwrite Tenurity.
      delete updatePayload.tenurity;
      const res = await updateEmployeeLedgerRecord(editingEmployee.sibsId, updatePayload);
      if (res?.success) {
        const empName = formData.agentName || editingEmployee.agentName || editingEmployee.kronosName || editingEmployee.sibsId;
        const empSibsId = editingEmployee.sibsId;

        // Close edit modal and open success modal
        try {
          recordAuditLog({
            action: "Edit",
            module: "Employee Ledger",
            description: `Updated ledger record for ${empName} (${empSibsId})`,
            recordId: empSibsId,
          });
        } catch {}
        setEditingEmployee(null);
        setSavedEmployeeSuccess({
          name: empName,
          sibsId: empSibsId,
        });

        // Optimistically update current view and reload data in background
        setLedgerList((prev) =>
          prev.map((emp) =>
            emp.sibsId === editingEmployee.sibsId
              ? { ...emp, ...updatePayload }
              : emp
          )
        );
        void loadLedgerData(searchTerm, selectedTaskOrder, currentPage, pageSize, sortBy, sortOrder, selectedRole, selectedStatus);
      } else {
        setErrorMsg(res?.message || "Failed to update employee record.");
      }
    } catch (err) {
      console.error("Save error:", err);
      setErrorMsg(err?.response?.data?.message || "Unable to save employee record changes.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  const handleDownloadTemplate = async () => {
    if (isDownloadingTemplate) return;

    try {
      setIsDownloadingTemplate(true);

      let exportRecords = ledgerList;

      if (totalCount > ledgerList.length) {
        const res = await fetchMasterDataLedger({
          search: searchTerm.trim(),
          account: "US Visa",
          taskOrder: selectedTaskOrder || "",
          organizationalRole: selectedRole,
          employmentStatus: selectedStatus,
          page: 1,
          limit: Math.max(totalCount, 1000),
          viewAll: true,
          sortBy: sortBy || "",
          sortOrder: sortOrder || "desc",
        });
        if (res?.success && Array.isArray(res.data)) {
          exportRecords = res.data;
        }
      }

      const rows = exportRecords.map((emp) => ({
        "SIBS ID #": emp.sibsId || "",
        "Kronos Name": emp.kronosName || "",
        "Call Novo email add": emp.callNovoEmail || "",
        "Agent Name": emp.agentName || "",
        "FuseCom  Name": emp.fusecomName || "",
        "FuseNet  Name": emp.fusenetName || "",
        "HeroDash Name": emp.herodashName || "",
        "MSD Name": emp.msdName || "",
        "Site": emp.site || "",
        "Status": getEmploymentStatus(emp),
        "Phase": emp.phase || "",
        "Task Order": emp.taskOrder || "",
        "Task Order Discription": emp.taskOrderDescription || "",
        "US Visa Join Date": emp.usVisaJoinDate || "",
        "US Visa Departure Date": emp.usVisaDepartureDate || "",
        "Team Leader": emp.teamLeader || "",
        "Manager": emp.manager || "",
        "Senior Manager": emp.seniorManager || "",
        "Tenurity": emp.tenurity ?? "",
        "Modality (Voice, Chat, Email)": emp.modality || "",
      }));

      const XLSX = await import("xlsx");
      const worksheet = XLSX.utils.json_to_sheet(rows, {
        header: [
          "SIBS ID #",
          "Kronos Name",
          "Call Novo email add",
          "Agent Name",
          "FuseCom  Name",
          "FuseNet  Name",
          "HeroDash Name",
          "MSD Name",
          "Site",
          "Status",
          "Phase",
          "Task Order",
          "Task Order Discription",
          "US Visa Join Date",
          "US Visa Departure Date",
          "Team Leader",
          "Manager",
          "Senior Manager",
          "Tenurity",
          "Modality (Voice, Chat, Email)",
        ],
      });

      worksheet["!cols"] = [
        { wch: 14 },
        { wch: 26 },
        { wch: 28 },
        { wch: 24 },
        { wch: 22 },
        { wch: 22 },
        { wch: 22 },
        { wch: 22 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 18 },
        { wch: 30 },
        { wch: 20 },
        { wch: 22 },
        { wch: 24 },
        { wch: 24 },
        { wch: 24 },
        { wch: 16 },
        { wch: 28 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Employee Ledger");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "US_Visa_Employee_Ledger_Template.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate populated template download:", err);
      setErrorMsg("Failed to generate Excel download template.");
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const fileInputRef = useRef(null);
  const [isImportingTemplate, setIsImportingTemplate] = useState(false);
  const [isExecutingImport, setIsExecutingImport]     = useState(false);
  const [pendingImport, setPendingImport]             = useState(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImportingTemplate(true);
      setErrorMsg("");

      // Validate file extension
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        throw new Error("Invalid file format. Please upload an Excel spreadsheet (.xlsx or .xls).");
      }

      const buffer = await file.arrayBuffer();
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(buffer, { type: "array" });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error("The uploaded Excel file does not contain any sheets.");
      }

      // Define all 20 columns and patterns for matching
      const EXPECTED_HEADERS = [
        { key: "sibsId", label: "SIBS ID #", patterns: [/sibs\s*id/i, /^id$/i] },
        { key: "kronosName", label: "Kronos Name", patterns: [/kronos/i] },
        { key: "callNovoEmail", label: "Call Novo email add", patterns: [/call\s*novo/i, /novo.*email/i, /^email\s*add/i, /^email$/i] },
        { key: "agentName", label: "Agent Name", patterns: [/agent\s*name/i, /^name$/i, /full\s*name/i, /employee\s*name/i] },
        { key: "fusecomName", label: "FuseCom  Name", patterns: [/fuse\s*com/i, /^fuse\s*name$/i] },
        { key: "fusenetName", label: "FuseNet  Name", patterns: [/fuse\s*net/i] },
        { key: "herodashName", label: "HeroDash Name", patterns: [/hero\s*dash/i] },
        { key: "msdName", label: "MSD Name", patterns: [/ms-?d/i] },
        { key: "site", label: "Site", patterns: [/^site/i] },
        { key: "status", label: "Status", patterns: [/^status/i] },
        { key: "phase", label: "Phase", patterns: [/^phase/i] },
        { key: "taskOrder", label: "Task Order", patterns: [/^task\s*order$/i, /skill.*task.*order/i] },
        { key: "taskOrderDescription", label: "Task Order Discription", patterns: [/task\s*order\s*desc/i, /to\s*desc/i] },
        { key: "usVisaDepartureDate", label: "US Visa Departure Date", patterns: [/departure.*date/i, /departure/i] },
        { key: "usVisaJoinDate", label: "US Visa Join Date", patterns: [/join.*date/i, /join/i] },
        { key: "teamLeader", label: "Team Leader", patterns: [/team\s*leader/i, /^tl$/i] },
        { key: "manager", label: "Manager", patterns: [/^manager/i, /^om$/i, /operations\s*manager/i] },
        { key: "seniorManager", label: "Senior Manager", patterns: [/senior\s*manager/i, /^som$/i] },
        // Keep recognizing legacy Excel headers; uploaded Tenurity values are ignored.
        { key: "tenurity", label: "Tenurity", patterns: [/tenur/i, /tenurity/i] },
        { key: "modality", label: "Modality (Voice, Chat, Email)", patterns: [/modal/i, /channel/i] },
      ];

      // Smart sheet and header row scanner:
      // In large master workbooks, the roster sheet might be sheet 5 or 11, or header row might not be row 0.
      let bestSheetName = null;
      let bestScore = -1;
      let bestRowIndex = -1;
      let bestMapping = {};

      for (const sName of workbook.SheetNames) {
        const ws = workbook.Sheets[sName];
        if (!ws || !ws["!ref"]) continue;
        const sheetRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        for (let r = 0; r < Math.min(15, sheetRows.length); r++) {
          const row = sheetRows[r];
          if (!Array.isArray(row) || row.length === 0) continue;

          const mapping = {};
          let score = 0;

          for (const col of EXPECTED_HEADERS) {
            for (let colIdx = 0; colIdx < row.length; colIdx++) {
              const cellVal = String(row[colIdx] || "").trim();
              if (!cellVal) continue;
              if (col.patterns.some((p) => p.test(cellVal))) {
                mapping[col.key] = colIdx;
                score++;
                break;
              }
            }
          }

          // Check if separate Voice / Chat / Email columns exist if modality column wasn't explicitly found
          if (mapping.modality === undefined) {
            const vCol = row.findIndex((c) => /^voice$/i.test(String(c || "").trim()));
            const cCol = row.findIndex((c) => /^chat$/i.test(String(c || "").trim()));
            const eCol = row.findIndex((c) => /^email$/i.test(String(c || "").trim()));
            if (vCol !== -1 || cCol !== -1 || eCol !== -1) {
              mapping._voiceCol = vCol;
              mapping._chatCol = cCol;
              mapping._emailCol = eCol;
              score++;
            }
          }

          if (score > bestScore) {
            bestScore = score;
            bestSheetName = sName;
            bestRowIndex = r;
            bestMapping = mapping;
          }
        }
      }

      if (!bestSheetName || bestScore < 3 || bestMapping.sibsId === undefined) {
        throw new Error(
          "Invalid template. Could not locate employee ledger headers (SIBS ID #, Agent Name, etc.) in any sheet of this Excel file. Please ensure you are uploading a valid Employee Ledger template or Master Roster."
        );
      }

      const activeWorksheet = workbook.Sheets[bestSheetName];
      const allRows = XLSX.utils.sheet_to_json(activeWorksheet, { header: 1, defval: "" });
      const headerRow = allRows[bestRowIndex] || [];

      const voiceCol = bestMapping._voiceCol ?? headerRow.findIndex((c) => /^voice$/i.test(String(c || "").trim()));
      const chatCol = bestMapping._chatCol ?? headerRow.findIndex((c) => /^chat$/i.test(String(c || "").trim()));
      const emailCol = bestMapping._emailCol ?? headerRow.findIndex((c) => /^email$/i.test(String(c || "").trim()));

      const formatExcelDate = (val) => {
        if (val === null || val === undefined || val === "") return "";
        if (typeof val === "number") {
          const d = new Date(Math.round((val - 25569) * 86400 * 1000));
          if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
        }
        const str = String(val).trim();
        if (!str) return "";
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
        const mdy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
        if (mdy) {
          const [, m, d, y] = mdy;
          return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
        }
        const parsed = new Date(str);
        if (!isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];
        return str;
      };

      const getColVal = (row, key) => {
        const idx = bestMapping[key];
        if (idx === undefined || idx === null || idx < 0) return "";
        const val = String(row[idx] ?? "").trim();
        if (val.includes("#REF!") || val.includes("#N/A") || val.includes("#VALUE!") || val.includes("#NAME?")) {
          return "";
        }
        return val;
      };

      const itemsToUpdate = [];

      for (let r = bestRowIndex + 1; r < allRows.length; r++) {
        const row = allRows[r];
        if (!row || !Array.isArray(row)) continue;

        const sibsId = getColVal(row, "sibsId");
        const kronosName = getColVal(row, "kronosName");
        const agentName = getColVal(row, "agentName");

        // Skip non-data or summary rows without identifiers
        if (!sibsId && !kronosName && !agentName) continue;

        let modalityVal = getColVal(row, "modality");
        if (!modalityVal && (voiceCol !== -1 || chatCol !== -1 || emailCol !== -1)) {
          const channels = [];
          if (voiceCol !== -1 && (row[voiceCol] === true || /^(true|yes|1|voice)$/i.test(String(row[voiceCol] || "").trim()))) {
            channels.push("Voice");
          }
          if (chatCol !== -1 && (row[chatCol] === true || /^(true|yes|1|chat)$/i.test(String(row[chatCol] || "").trim()))) {
            channels.push("Chat");
          }
          if (emailCol !== -1 && (row[emailCol] === true || /^(true|yes|1|email)$/i.test(String(row[emailCol] || "").trim()))) {
            channels.push("Email");
          }
          if (channels.length > 0) modalityVal = channels.join(", ");
        }

        itemsToUpdate.push({
          sibsId,
          kronosName,
          callNovoEmail: getColVal(row, "callNovoEmail"),
          agentName,
          fusecomName: getColVal(row, "fusecomName"),
          fusenetName: getColVal(row, "fusenetName"),
          herodashName: getColVal(row, "herodashName"),
          msdName: getColVal(row, "msdName"),
          site: getColVal(row, "site"),
          status: getColVal(row, "status"),
          phase: getColVal(row, "phase"),
          taskOrder: isOmOrInvalidTaskOrder(getColVal(row, "taskOrder")) ? "" : getColVal(row, "taskOrder"),
          taskOrderDescription: getColVal(row, "taskOrderDescription"),
          usVisaDepartureDate: formatExcelDate(row[bestMapping.usVisaDepartureDate]),
          usVisaJoinDate: formatExcelDate(row[bestMapping.usVisaJoinDate]),
          teamLeader: getColVal(row, "teamLeader"),
          manager: getColVal(row, "manager"),
          seniorManager: getColVal(row, "seniorManager"),
          modality: modalityVal,
        });
      }

      if (itemsToUpdate.length === 0) {
        throw new Error("No valid employee rows found in the uploaded file.");
      }

      setPendingImport({
        fileName: file.name,
        sheetName: bestSheetName,
        items: itemsToUpdate,
      });
    } catch (err) {
      console.error("Failed to parse import template:", err);
      setErrorMsg(err.message || "Failed to parse the template file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setIsImportingTemplate(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!pendingImport?.items?.length) return;

    try {
      setIsExecutingImport(true);
      setErrorMsg("");

      const res = await importUsVisaEmployeeLedger(pendingImport.items);
      if (res?.success) {
        setSaveSuccessMsg(
          res.message ||
            `Successfully imported and saved ${res.count || pendingImport.items.length} employee records to us_visa_employee_ledger.`
        );
        setTimeout(() => setSaveSuccessMsg(""), 5000);
        setPendingImport(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        // Re-fetch ledger so the table updates immediately
        void loadLedgerData(searchTerm, selectedTaskOrder, currentPage, pageSize, sortBy, sortOrder, selectedRole, selectedStatus);
      } else {
        setErrorMsg(res?.message || "Failed to save employee records.");
      }
    } catch (err) {
      console.error("Import error:", err);
      setErrorMsg(err?.response?.data?.message || err.message || "Unable to save employee records.");
    } finally {
      setIsExecutingImport(false);
    }
  };

  /* Manual, explicit Kronos ledger synchronization. No fetch on page load. */
  const [kronosPreview, setKronosPreview] = useState(null);
  const [isPreviewingKronos, setIsPreviewingKronos] = useState(false);
  const [isApplyingKronos, setIsApplyingKronos] = useState(false);

  const handleKronosPreview = async () => {
    if (isPreviewingKronos || isApplyingKronos) return;
    try {
      setIsPreviewingKronos(true);
      setErrorMsg("");
      setKronosPreview(null);
      const result = await previewKronosEmployeeLedgerSync();
      if (!result?.success || !result?.previewToken) {
        throw new Error(result?.message || "Kronos sync preview was not generated.");
      }
      setKronosPreview(result);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err?.message || "Kronos employee sync preview failed.");
    } finally {
      setIsPreviewingKronos(false);
    }
  };

  const handleKronosApply = async () => {
    if (!kronosPreview?.previewToken || isApplyingKronos) return;
    try {
      setIsApplyingKronos(true);
      setErrorMsg("");
      const result = await applyKronosEmployeeLedgerSync(kronosPreview.previewToken);
      if (!result?.success) throw new Error(result?.message || "Kronos sync could not be applied.");
      setKronosPreview(null);
      try {
        recordAuditLog({
          action: "Sync",
          module: "Employee Ledger",
          description: `Kronos sync: ${result.inserted} added, ${result.updated} updated, ${result.preserved} preserved`,
          recordId: "KRONOS_EMPLOYEE_LEDGER",
        });
      } catch {}
      setSaveSuccessMsg(`Kronos sync saved: ${result.inserted} added, ${result.updated} updated, ${result.preserved} historical records preserved.`);
      void loadLedgerData(searchTerm, selectedTaskOrder, currentPage, pageSize, sortBy, sortOrder, selectedRole);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err?.message || "Kronos sync failed. Ledger was not changed.");
      setKronosPreview(null); // A failed/stale preview must be regenerated.
    } finally {
      setIsApplyingKronos(false);
    }
  };

  // Match the API's explicit sync roles (Super Admin, WFM, Master Data).
  // Use the centralized resolver so assigned WFM interfaces are recognized.
  const canSyncKronos = [7, 9, 11].includes(getUserAdminAccess(dashboard.authUser)) ||
    ["admin", "wfm", "masterdata"].includes(dashboard.role);

  const isAdmin =
    dashboard.authUser?.role === "admin" ||
    Number(dashboard.authUser?.adminAccess ?? dashboard.authUser?.admin_access ?? 0) === 7 ||
    ["admin", "bod", "som"].includes(dashboard.authUser?.role);


  /* ─── RENDER ───────────────────────────────────────────────────── */
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f0f4f8] text-slate-800 antialiased font-sans">
      {/* Sidebar */}
      <AdminSidebar
        modules={dashboard.modules}
        isMobileOpen={dashboard.isMobileSidebarOpen}
        onMobileClose={() => dashboard.setIsMobileSidebarOpen(false)}
        onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        userName={dashboard.userName}
        userRole={dashboard.authUser?.email || dashboard.authUser?.roleLabel || "User"}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <AppHeader
          title={isAdmin ? dashboard.authUser?.roleLabel || "Super Admin" : "Employee Master Data Ledger"}
          subtitle={isAdmin ? "Performance Management System" : "Align tool identities (Fusecom, FuseNet, HeroDash)"}
          userName={dashboard.userName}
          onMenuClick={() => dashboard.setIsMobileSidebarOpen(true)}
          onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        />

        <main className="flex flex-1 min-h-0 flex-col gap-2.5 sm:gap-3 overflow-y-auto lg:overflow-hidden px-2.5 sm:px-4 lg:px-5 pt-2.5 sm:pt-3 pb-3 lg:pb-2 sibs-scrollbar">

          {/* ── Summary KPI Cards ───────────────────────────────────── */}
          <div className="shrink-0 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3">
            {LEDGER_SUMMARY_CARDS.map((card, index) => {
              const Icon = card.icon;
              const isLast = index === LEDGER_SUMMARY_CARDS.length - 1;
              return (
                <div
                  key={card.key}
                  className={`flex flex-col justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-xs ${
                    isLast ? "col-span-2 sm:col-span-1" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-500 truncate">
                        {card.label}
                      </p>
                      <p className="mt-1 sm:mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-[#042c51] tabular-nums">
                        {ledgerSummary ? Number(ledgerSummary[card.key] ?? 0).toLocaleString() : card.value}
                      </p>
                    </div>
                    <div
                      className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full ${card.iconWrapClass}`}
                    >
                      <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                    </div>
                  </div>
                  <p className="mt-1.5 sm:mt-2 text-[10.5px] sm:text-[11px] text-slate-500 truncate" title={card.subtitle}>
                    {card.subtitle}
                  </p>
                </div>
              );
            })}
          </div>

          {/* ── Toolbar ────────────────────────────────────────────── */}
          <div className="shrink-0 flex flex-col lg:flex-row lg:flex-wrap xl:flex-nowrap lg:items-center gap-2 sm:gap-2.5 rounded-xl border border-slate-200 bg-white p-3 sm:px-4 sm:py-3 shadow-xs">
            {/* Search (Very Left) */}
            <div className="relative flex-1 w-full min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by SIBS ID, employee name, or tool name…"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-8 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#0b3b68] focus:bg-white focus:ring-2 focus:ring-[#0b3b68]/10 focus:outline-none transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* US Visa-only page: Task Order is the only scope selector. */}
            <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto">
              {/* Task Order select */}
              <div className="relative flex-1 sm:w-56 md:w-64 sm:flex-none" ref={taskOrderDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsTaskOrderDropdownOpen((prev) => !prev)}
                  title="Filter by Task Order"
                  className={`flex h-9 w-full sm:w-56 md:w-64 cursor-pointer items-center justify-between gap-2 rounded-lg border bg-slate-50 px-3 text-xs font-semibold transition hover:bg-slate-100 focus:outline-none ${
                    selectedTaskOrder
                      ? "border-[#0b3b68] text-[#0b3b68] bg-sky-50/50"
                      : "border-slate-200 text-slate-800 hover:border-slate-300"
                  }`}
                >
                  <span className="truncate">
                    {selectedTaskOrder || "All Task Orders"}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {selectedTaskOrder && (
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTaskOrder("");
                          setCurrentPage(1);
                        }}
                        className="p-0.5 text-slate-400 hover:text-slate-600 rounded"
                        title="Clear task order filter"
                      >
                        <X className="h-3 w-3" />
                      </span>
                    )}
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                        isTaskOrderDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {isTaskOrderDropdownOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 max-h-80 w-full sm:w-64 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10">
                    <div className="border-b border-slate-100 p-1.5">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={taskOrderSearchTerm}
                          onChange={(e) => setTaskOrderSearchTerm(e.target.value)}
                          placeholder="Search task order..."
                          className="h-7 w-full rounded-md border border-slate-200 bg-slate-50 pl-6 pr-2 text-[11px] text-slate-800 focus:border-[#0b3b68] focus:bg-white focus:outline-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto sibs-scrollbar">
                      {taskOrderList
                        .filter(
                          (to) =>
                            !isOmOrInvalidTaskOrder(to) &&
                            (!taskOrderSearchTerm ||
                              to.toLowerCase().includes(taskOrderSearchTerm.toLowerCase()))
                        )
                        .map((toOption) => {
                          const isSelected =
                            toOption === "All Task Orders"
                              ? !selectedTaskOrder
                              : selectedTaskOrder === toOption;
                          return (
                            <button
                              key={toOption}
                              type="button"
                              onClick={() => {
                                setSelectedTaskOrder(toOption === "All Task Orders" ? "" : toOption);
                                setIsTaskOrderDropdownOpen(false);
                                setTaskOrderSearchTerm("");
                                setCurrentPage(1);
                              }}
                              className={`flex w-full cursor-pointer items-center justify-between px-3 py-1.5 text-left text-xs transition ${
                                isSelected
                                  ? "bg-sky-50 font-bold text-[#0b3b68]"
                                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                              }`}
                            >
                              <span className="truncate">{toOption}</span>
                              {isSelected && (
                                <Check className="h-3.5 w-3.5 text-[#0b3b68] shrink-0" />
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Organizational Role dropdown */}
            <div className="relative w-full sm:w-40 shrink-0" ref={roleDropdownRef}>
              <button
                type="button"
                aria-label="Filter by organizational role"
                onClick={() => {
                  setIsRoleDropdownOpen((prev) => !prev);
                  setIsTaskOrderDropdownOpen(false);
                  setIsStatusDropdownOpen(false);
                }}
                className={`flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border bg-slate-50 px-3 text-xs font-semibold transition hover:bg-slate-100 focus:outline-none ${
                  selectedRole
                    ? "border-[#0b3b68] text-[#0b3b68] bg-sky-50/50"
                    : "border-slate-200 text-slate-800 hover:border-slate-300"
                }`}
              >
                <span className="truncate">
                  {ORGANIZATIONAL_ROLE_OPTIONS.find(([value]) => value === selectedRole)?.[1] || "All Roles"}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${
                    isRoleDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 w-full sm:w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10">
                  {ORGANIZATIONAL_ROLE_OPTIONS.map(([value, label]) => {
                    const isSelected = selectedRole === value;
                    return (
                      <button
                        key={value || "all"}
                        type="button"
                        onClick={() => {
                          setSelectedRole(value);
                          setIsRoleDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                        className={`flex w-full cursor-pointer items-center justify-between px-3 py-1.5 text-left text-xs transition ${
                          isSelected
                            ? "bg-sky-50 font-bold text-[#0b3b68]"
                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <span className="truncate">{label}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-[#0b3b68] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Employment Status dropdown */}
            <div className="relative w-full sm:w-36 shrink-0" ref={statusDropdownRef}>
              <button
                type="button"
                aria-label="Filter by employment status"
                onClick={() => {
                  setIsStatusDropdownOpen((prev) => !prev);
                  setIsTaskOrderDropdownOpen(false);
                  setIsRoleDropdownOpen(false);
                }}
                className={`flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border bg-slate-50 px-3 text-xs font-semibold transition hover:bg-slate-100 focus:outline-none ${
                  selectedStatus
                    ? "border-[#0b3b68] text-[#0b3b68] bg-sky-50/50"
                    : "border-slate-200 text-slate-800 hover:border-slate-300"
                }`}
              >
                <span className="truncate">
                  {EMPLOYMENT_STATUS_OPTIONS.find(([value]) => value === selectedStatus)?.[1] || "All Status"}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${
                    isStatusDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isStatusDropdownOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 w-full sm:w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10">
                  {EMPLOYMENT_STATUS_OPTIONS.map(([value, label]) => {
                    const isSelected = selectedStatus === value;
                    return (
                      <button
                        key={value || "all"}
                        type="button"
                        onClick={() => {
                          setSelectedStatus(value);
                          setIsStatusDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                        className={`flex w-full cursor-pointer items-center justify-between px-3 py-1.5 text-left text-xs transition ${
                          isSelected
                            ? "bg-sky-50 font-bold text-[#0b3b68]"
                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <span className="truncate">{label}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-[#0b3b68] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sync & Refresh Actions */}
            <div className="shrink-0 w-full sm:w-auto flex items-center gap-2">
              {canSyncKronos && (
                <button
                  type="button"
                  onClick={handleKronosPreview}
                  disabled={isPreviewingKronos || isApplyingKronos || isLoading}
                  title="Review Kronos Account 20 employees and their supervisor hierarchy before changing PMS"
                  className="flex-1 sm:flex-none inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#0b3b68] bg-white px-3 text-xs font-semibold text-[#0b3b68] hover:bg-blue-50 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  {isPreviewingKronos ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  {isPreviewingKronos ? "Checking Kronos…" : "Sync from Kronos"}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedTaskOrder("");
                  setSelectedRole("");
                  setSelectedStatus("");
                  setIsTaskOrderDropdownOpen(false);
                  setIsRoleDropdownOpen(false);
                  setIsStatusDropdownOpen(false);
                  setTaskOrderSearchTerm("");
                  setSortBy(null);
                  setSortOrder("desc");
                  setCurrentPage(1);
                  loadLedgerData("", "", 1, pageSize, null, "desc", "", "");
                }}
                disabled={isLoading}
                title="Clear filters and refresh ledger data"
                className="flex-1 sm:flex-none inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#042c51] bg-[#042c51] px-3 text-xs font-bold text-white shadow-2xs transition hover:bg-[#063d70] hover:border-[#063d70] disabled:cursor-not-allowed disabled:opacity-50 shrink-0 cursor-pointer whitespace-nowrap"
              >
                <RefreshCw
                  size={12}
                  className={`shrink-0 ${isLoading ? "animate-spin text-white" : ""}`}
                />
                <span>Refresh</span>
              </button>
            </div>

            {/* Template Actions (Right) */}
            <div className="shrink-0 w-full sm:w-auto flex items-center gap-2 justify-end sm:justify-start lg:justify-end">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileSelect}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImportingTemplate || isExecutingImport}
                className="flex-1 sm:flex-none inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition cursor-pointer shadow-2xs shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                title="Import template with updated tool identities"
              >
                {isImportingTemplate || isExecutingImport ? (
                  <Loader2 className="h-3.5 w-3.5 text-slate-500 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5 text-slate-500" />
                )}
                <span>
                  {isImportingTemplate
                    ? "Reading…"
                    : isExecutingImport
                    ? "Importing…"
                    : "Import template"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                disabled={isDownloadingTemplate}
                className="flex-1 sm:flex-none inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition cursor-pointer shadow-2xs shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                title="Download template with employee ledger data"
              >
                {isDownloadingTemplate ? (
                  <Loader2 className="h-3.5 w-3.5 text-slate-500 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5 text-slate-500" />
                )}
                <span>{isDownloadingTemplate ? "Downloading…" : "Download template"}</span>
              </button>
            </div>
          </div>

          {/* ── Success Toast (Upper Right Floating) ───────────────── */}
          {saveSuccessMsg && (
            <div className="fixed top-4 right-4 sm:top-5 sm:right-6 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/95 px-3.5 py-2.5 text-xs font-semibold text-emerald-900 shadow-lg backdrop-blur-xs max-w-[calc(100vw-2rem)] sm:max-w-sm transition-all duration-200">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span className="flex-1 truncate">{saveSuccessMsg}</span>
              <button
                type="button"
                onClick={() => setSaveSuccessMsg("")}
                className="rounded p-0.5 text-emerald-500 hover:bg-emerald-100 hover:text-emerald-800 transition cursor-pointer shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* ── Error banner ───────────────────────────────────────── */}
          {errorMsg && (
            <div className="shrink-0 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
              {errorMsg}
            </div>
          )}

          {/* ── Table card ─────────────────────────────────────────── */}
          <div className="flex-1 min-h-[420px] lg:min-h-0 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">

            {/* Scrollable table wrapper */}
            <div
              className="flex-1 min-h-0 overflow-x-auto overflow-y-auto sibs-scrollbar scroll-smooth"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
                <table className="w-full min-w-[1060px] table-fixed text-left text-[12.5px] border-collapse">
                  <colgroup>
                    <col style={{ width: "7%" }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "9%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "12%" }} />
                  </colgroup>
                  {/* ── Table head ──────────────────────────────────── */}
                  <thead className="sticky top-0 z-10 border-b border-[#0d3b66] bg-[#042c51] text-white shadow-xs">
                    <tr>
                      {/* 1. SIBS ID # */}
                      <th className="px-3.5 py-3 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap overflow-hidden">
                        SIBS ID #
                      </th>

                      {/* 2. Kronos Name */}
                      <th className="px-3.5 py-3 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap overflow-hidden">
                        Kronos Name
                      </th>

                      {/* 3. FuseCom Name */}
                      <th className="px-3.5 py-3 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap overflow-hidden">
                        FuseCom Name
                      </th>

                      {/* 4. FuseNet Name */}
                      <th className="px-3.5 py-3 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap overflow-hidden">
                        FuseNet Name
                      </th>

                      {/* 5. HeroDash Name */}
                      <th className="px-3.5 py-3 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap overflow-hidden">
                        HeroDash Name
                      </th>

                      {/* 6. MSD Name */}
                      <th className="px-3.5 py-3 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap overflow-hidden">
                        MSD Name
                      </th>

                      {/* 7. Role */}
                      <th className="px-3.5 py-3 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap overflow-hidden">
                        Role
                      </th>

                      {/* 8. Status */}
                      <th className="px-3.5 py-3 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap overflow-hidden">
                        Status
                      </th>

                      {/* 9. Action */}
                      <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap overflow-hidden">
                        Action
                      </th>
                    </tr>
                  </thead>

                  {/* ── Table body ──────────────────────────────────── */}
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      Array.from({ length: 12 }).map((_, i) => (
                        <tr key={`ledger-skeleton-${i}`} className="animate-pulse">
                          {/* 1. SIBS ID # */}
                          <td className="px-3.5 py-3.5">
                            <div className="h-4 w-12 rounded-md bg-slate-200" />
                          </td>
                          {/* 2. Kronos Name */}
                          <td className="px-3.5 py-3.5">
                            <div className="h-4 w-32 rounded-md bg-slate-200" />
                          </td>
                          {/* 3. FuseCom Name */}
                          <td className="px-3.5 py-3.5">
                            <div className="h-4 w-24 rounded-md bg-slate-200" />
                          </td>
                          {/* 4. FuseNet Name */}
                          <td className="px-3.5 py-3.5">
                            <div className="h-4 w-24 rounded-md bg-slate-200" />
                          </td>
                          {/* 5. HeroDash Name */}
                          <td className="px-3.5 py-3.5">
                            <div className="h-4 w-24 rounded-md bg-slate-200" />
                          </td>
                          {/* 6. MSD Name */}
                          <td className="px-3.5 py-3.5">
                            <div className="h-4 w-24 rounded-md bg-slate-200" />
                          </td>
                          {/* 7. Role */}
                          <td className="px-3.5 py-3.5">
                            <div className="h-4 w-16 rounded-full bg-slate-200" />
                          </td>
                          {/* 8. Status */}
                          <td className="px-3.5 py-3.5">
                            <div className="h-4 w-16 rounded-full bg-slate-200" />
                          </td>
                          {/* 9. Action */}
                          <td className="px-3 py-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="h-7 w-14 rounded-lg bg-slate-100" />
                              <div className="h-7 w-14 rounded-lg bg-slate-100" />
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : ledgerList.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-24 text-center">
                          <Users className="mx-auto mb-2.5 h-8 w-8 text-slate-200" />
                          <p className="text-xs font-semibold text-slate-600 mb-1">
                            No employee records found
                          </p>
                          <p className="text-xs text-slate-400">
                            Upload an Excel template to populate the US Visa employee ledger.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      ledgerList.map((emp, idx) => (
                        <tr
                          key={emp.id || emp.sibsId || idx}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          {/* 1. SIBS ID # */}
                          <td className="px-3.5 py-3 font-semibold text-slate-900 truncate">
                            <span className="font-mono text-xs font-bold text-slate-900 truncate">
                              {emp.sibsId || <span className="text-slate-300 font-normal select-none">—</span>}
                            </span>
                          </td>

                          {/* 2. Kronos Name */}
                          <td className="px-3.5 py-3 text-slate-900 truncate" title={`${emp.kronosName || ""}${emp.kronosLastSyncedAt ? ` | Last sync (Manila): ${emp.kronosLastSyncedAt}` : ""}`}>
                            <div className="font-bold text-slate-900 truncate">{emp.kronosName || <span className="font-normal text-slate-300 select-none">—</span>}</div>
                            {emp.kronosMembershipStatus && (
                              <div className="mt-0.5 truncate text-[10px] font-medium text-slate-500" title={`Hierarchy: ${emp.hierarchySyncStatus || "Not verified"}`}>
                                {emp.kronosMembershipStatus === "CURRENT_US_VISA" ? "Kronos verified: US Visa" :
                                  emp.kronosMembershipStatus === "OTHER_ACCOUNT" ? "Kronos: Other account" :
                                  "Kronos: Not found"}
                                {emp.hierarchySyncStatus && emp.hierarchySyncStatus !== "VERIFIED" && ` · ${emp.hierarchySyncStatus}`}
                              </div>
                            )}
                          </td>

                          {/* 3. FuseCom Name */}
                          <td className="px-3.5 py-3 font-semibold text-slate-900 truncate" title={emp.fusecomName}>
                            {emp.fusecomName || <span className="font-normal text-slate-300 select-none">—</span>}
                          </td>

                          {/* 4. FuseNet Name */}
                          <td className="px-3.5 py-3 font-semibold text-slate-900 truncate" title={emp.fusenetName}>
                            {emp.fusenetName || <span className="font-normal text-slate-300 select-none">—</span>}
                          </td>

                          {/* 5. HeroDash Name */}
                          <td className="px-3.5 py-3 font-semibold text-slate-900 truncate" title={emp.herodashName}>
                            {emp.herodashName || <span className="font-normal text-slate-300 select-none">—</span>}
                          </td>

                          {/* 6. MSD Name */}
                          <td className="px-3.5 py-3 font-semibold text-slate-900 truncate" title={emp.msdName}>
                            {emp.msdName || <span className="font-normal text-slate-300 select-none">—</span>}
                          </td>

                          {/* 7. Role */}
                          <td className="px-3.5 py-3 text-slate-700">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                title={`Read-only role · ${emp.roleReviewStatus || "NOT_CLASSIFIED"} · ${emp.roleSource || "NO_KRONOS_CLASSIFICATION"} · Account: ${emp.kronosAccountName || "Not synced"}`}
                                className={`inline-flex min-w-0 items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap truncate ${
                                  emp.roleReviewStatus === "NEEDS_REVIEW"
                                    ? "border-amber-200 bg-amber-50 text-amber-800"
                                    : "border-slate-200 bg-slate-50 text-slate-700"
                                }`}
                              >
                                {roleLabel(emp.organizationalRole)}{emp.roleReviewStatus === "NEEDS_REVIEW" ? " · Review" : ""}
                              </span>
                            </div>
                          </td>

                          {/* 8. Status */}
                          <td className="px-3.5 py-3 text-slate-700 truncate">
                            <span
                              title={getEmploymentStatus(emp) === "Active"
                                ? "Active · Kronos gy_user_status = 0"
                                : getEmploymentStatus(emp) === "Inactive"
                                  ? "Inactive · Kronos gy_user_status = 1"
                                  : "Needs Verification · Kronos user status missing, unmatched, or unrecognized. Check Kronos sync."}
                              className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                getEmploymentStatus(emp) === "Active"
                                  ? "bg-emerald-600 text-white border-emerald-600"
                                  : getEmploymentStatus(emp) === "Needs Verification"
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : "bg-rose-600 text-white border-rose-600"
                              }`}
                            >
                              {getEmploymentStatus(emp)}
                            </span>
                          </td>

                          {/* 9. Action */}
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="relative group">
                                <button
                                  type="button"
                                  onClick={() => setViewingEmployee(emp)}
                                  className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 text-[11px] font-semibold text-slate-700 shadow-2xs hover:border-slate-400 hover:bg-slate-50 transition cursor-pointer"
                                  aria-label={`View all details for ${emp.agentName || emp.kronosName || emp.sibsId || "employee"}`}
                                >
                                  <Eye size={12} className="text-slate-600 shrink-0" />
                                  <span>View</span>
                                </button>
                                <span
                                  role="tooltip"
                                  className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#042c51] px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100"
                                >
                                  View all details
                                </span>
                              </div>
                              {emp.sibsId && (
                                <div className="relative group">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(emp)}
                                    className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-2.5 text-[11px] font-semibold text-slate-700 shadow-2xs hover:border-[#0b3b68] hover:bg-blue-50/60 hover:text-[#0b3b68] transition cursor-pointer"
                                    aria-label={`Edit details for ${emp.agentName || emp.kronosName || emp.sibsId}`}
                                  >
                                    <Pencil size={11} className="text-blue-600 shrink-0" />
                                    <span>Edit</span>
                                  </button>
                                  <span
                                    role="tooltip"
                                    className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#042c51] px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100"
                                  >
                                    Edit record
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            {/* ── Pagination footer ────────────────────────────────── */}
            {totalCount > 0 && (
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalCount}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                itemLabel="employees"
                className="shrink-0"
              />
            )}
          </div>
        </main>
      </div>

      {/* View Employee Right-Side Drawer */}
      <div
        className={`fixed inset-0 z-[130] flex justify-end transition-visibility duration-300 ${
          viewingEmployee ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!viewingEmployee}
      >
        {/* Subtle dim backdrop (no blur) */}
        <div
          className={`fixed inset-0 bg-slate-900/15 transition-opacity duration-300 ease-out ${
            viewingEmployee ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setViewingEmployee(null)}
          aria-hidden="true"
        />
        {/* Right Drawer Panel */}
        <aside
          role="dialog"
          aria-modal={Boolean(viewingEmployee)}
          aria-label="Employee details drawer"
          className={`relative z-10 flex h-full w-full max-w-3xl flex-col border-l border-slate-200 bg-[#f8fafc] shadow-2xl transform transition-transform duration-300 ease-out ${
            viewingEmployee ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Drawer Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3.5 sibs-scrollbar">
            {viewingEmployee && (() => {
              const emp = viewingEmployee;
              const empStatus = getEmploymentStatus(emp);
              const isKronosVerified =
                emp.kronosUserStatus === 0 ||
                emp.kronosUserStatus === 1 ||
                emp.kronosUserStatus === "0" ||
                emp.kronosUserStatus === "1";
              const statusBadgeCls =
                empStatus === "Active"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : empStatus === "Inactive"
                  ? "bg-rose-600 text-white border-rose-600"
                  : "bg-amber-50 text-amber-700 border-amber-200";
              const cleanVal = (v) =>
                v !== null && v !== undefined && String(v).trim() !== "" && !String(v).includes("#REF!")
                  ? String(v)
                  : "—";

              return (
                <>
                  {/* Profile Summary Card */}
                  <div className="shrink-0 flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-2xs">
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <User className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-extrabold uppercase tracking-tight text-[#042c51]">
                            {cleanVal(emp.agentName || emp.kronosName)}
                          </span>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusBadgeCls}`}>
                            {empStatus}
                          </span>
                        </div>
                        <div className="mt-0.5 text-xs font-medium text-slate-500">
                          SIBS ID: <span className="font-mono font-semibold text-slate-700">{cleanVal(emp.sibsId)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewingEmployee(null)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                      aria-label="Close drawer"
                    >
                      <X size={17} />
                    </button>
                  </div>

                  {/* Row 1: Basic Information + Account Names */}
                  <div className="md:flex-1 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Basic Information */}
                    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs">
                      <div className="shrink-0 flex items-center gap-2 bg-[#042c51] px-4 py-2.5 text-white">
                        <User className="h-3.5 w-3.5 text-sky-300" />
                        <h3 className="text-xs font-bold tracking-wide">Basic Information</h3>
                      </div>
                      <dl className="flex-1 flex flex-col justify-evenly divide-y divide-slate-100/80 px-4 py-1 text-xs">
                        {[
                          ["SIBS ID", cleanVal(emp.sibsId)],
                          ["Kronos Name", cleanVal(emp.kronosName)],
                          ["Call Novo Email", cleanVal(emp.callNovoEmail)],
                          ["Agent Name", cleanVal(emp.agentName)],
                        ].map(([label, val]) => (
                          <div key={label} className="grid grid-cols-5 items-center gap-2 py-2">
                            <dt className="col-span-2 font-medium text-slate-700">{label}</dt>
                            <dd className="col-span-3 font-semibold text-black break-words">{val}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>

                    {/* Account Names */}
                    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs">
                      <div className="shrink-0 flex items-center gap-2 bg-[#042c51] px-4 py-2.5 text-white">
                        <Layers className="h-3.5 w-3.5 text-sky-300" />
                        <h3 className="text-xs font-bold tracking-wide">Account Names</h3>
                      </div>
                      <dl className="flex-1 flex flex-col justify-evenly divide-y divide-slate-100/80 px-4 py-1 text-xs">
                        {[
                          ["Fusecom Name", cleanVal(emp.fusecomName)],
                          ["Fusenet Name", cleanVal(emp.fusenetName)],
                          ["Herodash Name", cleanVal(emp.herodashName)],
                          ["MSD Name", cleanVal(emp.msdName)],
                        ].map(([label, val]) => (
                          <div key={label} className="grid grid-cols-5 items-center gap-2 py-2">
                            <dt className="col-span-2 font-medium text-slate-700">{label}</dt>
                            <dd className="col-span-3 font-semibold text-black break-words">{val}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>

                  {/* Row 2: Employment Details (2-column inner grid) */}
                  <div className="md:flex-1 flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs">
                    <div className="shrink-0 flex items-center gap-2 bg-[#042c51] px-4 py-2.5 text-white">
                      <Briefcase className="h-3.5 w-3.5 text-sky-300" />
                      <h3 className="text-xs font-bold tracking-wide">Employment Details</h3>
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 md:divide-x divide-slate-100 text-xs">
                      <dl className="flex flex-col justify-evenly divide-y divide-slate-100/80 px-4 py-1">
                        <div className="grid grid-cols-5 items-center gap-2 py-2">
                          <dt className="col-span-2 font-medium text-slate-700">Site</dt>
                          <dd className="col-span-3 font-semibold text-black">{cleanVal(emp.site)}</dd>
                        </div>
                        <div className="grid grid-cols-5 items-center gap-2 py-2">
                          <dt className="col-span-2 font-medium text-slate-700">Role</dt>
                          <dd className="col-span-3 font-semibold text-black">{roleLabel(emp.organizationalRole)}</dd>
                        </div>
                        <div className="grid grid-cols-5 items-center gap-2 py-2">
                          <dt className="col-span-2 font-medium text-slate-700">Status</dt>
                          <dd className="col-span-3">
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.2 text-[10px] font-semibold ${statusBadgeCls}`}>
                              {empStatus}
                            </span>
                          </dd>
                        </div>
                        <div className="grid grid-cols-5 items-center gap-2 py-2">
                          <dt className="col-span-2 font-medium text-slate-700">Phase</dt>
                          <dd className="col-span-3 font-semibold text-black">{cleanVal(emp.phase)}</dd>
                        </div>
                        <div className="grid grid-cols-5 items-center gap-2 py-2">
                          <dt className="col-span-2 font-medium text-slate-700">Modality</dt>
                          <dd className="col-span-3 font-semibold text-black">{cleanVal(emp.modality)}</dd>
                        </div>
                      </dl>
                      <dl className="flex flex-col justify-evenly divide-y divide-slate-100/80 border-t md:border-t-0 border-slate-100 px-4 py-1">
                        <div className="grid grid-cols-5 items-center gap-2 py-2">
                          <dt className="col-span-2 font-medium text-slate-700">Task Order</dt>
                          <dd className="col-span-3 font-semibold text-black">{cleanVal(emp.taskOrder)}</dd>
                        </div>
                        <div className="grid grid-cols-5 items-center gap-2 py-2">
                          <dt className="col-span-2 font-medium text-slate-700">TO Desc.</dt>
                          <dd className="col-span-3 font-semibold text-black break-words">{cleanVal(emp.taskOrderDescription)}</dd>
                        </div>
                        <div className="grid grid-cols-5 items-center gap-2 py-2">
                          <dt className="col-span-2 font-medium text-slate-700">Join Date</dt>
                          <dd className="col-span-3 font-semibold text-black tabular-nums">{cleanVal(emp.usVisaJoinDate)}</dd>
                        </div>
                        <div className="grid grid-cols-5 items-center gap-2 py-2">
                          <dt className="col-span-2 font-medium text-slate-700">Departure</dt>
                          <dd className="col-span-3 font-semibold text-black tabular-nums">{cleanVal(emp.usVisaDepartureDate)}</dd>
                        </div>
                        <div className="grid grid-cols-5 items-center gap-2 py-2">
                          <dt className="col-span-2 font-medium text-slate-700">Tenurity</dt>
                          <dd className="col-span-3 font-semibold text-black tabular-nums">
                            {emp.tenurityDateWarning ? (
                              <span className="inline-flex items-center gap-1 text-amber-700">
                                <AlertTriangle size={12} /> Date verification required
                              </span>
                            ) : emp.tenurity != null && emp.tenurity !== "" ? (
                              `${emp.tenurity} days`
                            ) : (
                              "—"
                            )}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Row 3: Reporting Hierarchy + Synchronization Details */}
                  <div className="md:flex-1 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Reporting Hierarchy */}
                    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs">
                      <div className="shrink-0 flex items-center gap-2 bg-[#042c51] px-4 py-2.5 text-white">
                        <Users className="h-3.5 w-3.5 text-sky-300" />
                        <h3 className="text-xs font-bold tracking-wide">Reporting Hierarchy</h3>
                      </div>
                      <dl className="flex-1 flex flex-col justify-evenly divide-y divide-slate-100/80 px-4 py-1 text-xs">
                        {[
                          ["Team Leader", cleanVal(emp.teamLeader)],
                          ["Manager", cleanVal(emp.manager)],
                          ["Senior Manager", cleanVal(emp.seniorManager)],
                        ].map(([label, val]) => (
                          <div key={label} className="grid grid-cols-5 items-center gap-2 py-2">
                            <dt className="col-span-2 font-medium text-slate-700">{label}</dt>
                            <dd className="col-span-3 font-semibold text-black break-words">{val}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>

                    {/* Synchronization Details */}
                    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs">
                      <div className="shrink-0 flex items-center gap-2 bg-[#042c51] px-4 py-2.5 text-white">
                        <RefreshCw className="h-3.5 w-3.5 text-sky-300" />
                        <h3 className="text-xs font-bold tracking-wide">Synchronization Details</h3>
                      </div>
                      <dl className="flex-1 flex flex-col justify-evenly divide-y divide-slate-100/80 px-4 py-1 text-xs">
                        <div className="grid grid-cols-5 items-center gap-2 py-2">
                          <dt className="col-span-2 font-medium text-slate-700">Kronos Verified</dt>
                          <dd className="col-span-3">
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.2 text-[10px] font-semibold ${
                                isKronosVerified
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {isKronosVerified ? "Yes" : "No"}
                            </span>
                          </dd>
                        </div>
                        <div className="grid grid-cols-5 items-center gap-2 py-2">
                          <dt className="col-span-2 font-medium text-slate-700">Verification</dt>
                          <dd className="col-span-3">
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.2 text-[10px] font-semibold ${statusBadgeCls}`}>
                              {empStatus}
                            </span>
                          </dd>
                        </div>
                        <div className="grid grid-cols-5 items-center gap-2 py-2">
                          <dt className="col-span-2 font-medium text-slate-700">Last Synced</dt>
                          <dd className="col-span-3 font-semibold text-black tabular-nums">
                            {cleanVal(emp.kronosLastSyncedAt)}
                          </dd>
                        </div>
                        <div className="grid grid-cols-5 items-center gap-2 py-2">
                          <dt className="col-span-2 font-medium text-slate-700">Sync Source</dt>
                          <dd className="col-span-3 font-semibold text-black">
                            {emp.kronosMembershipStatus ? "Kronos" : "—"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </aside>
      </div>

      {/* Edit Employee Ledger Modal */}
      <EditEmployeeLedgerModal
        isOpen={Boolean(editingEmployee)}
        employee={editingEmployee}
        onClose={handleCloseEditModal}
        onSave={handleSaveEmployeeRecord}
        isSaving={isSavingEdit}
      />

      {/* Preview -> Apply: keeps existing and inactive employees safe. */}
      <AppModal
        isOpen={Boolean(kronosPreview)}
        className="w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden p-0 rounded-2xl border border-slate-200 shadow-2xl"
        zIndex="z-[145]"
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0b3b68]">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Kronos Employee Ledger Sync
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Preview only. Nothing changes until you apply verified updates.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !isApplyingKronos && setKronosPreview(null)}
            disabled={isApplyingKronos}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 cursor-pointer"
            aria-label="Close sync preview"
          >
            <X size={17} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4 sibs-scrollbar">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Add",
                count: kronosPreview?.summary?.new ?? 0,
                cardCls: "border-emerald-200/80 bg-emerald-50/40",
                labelCls: "text-emerald-700",
                valueCls: "text-emerald-900",
              },
              {
                label: "Update",
                count: kronosPreview?.summary?.update ?? 0,
                cardCls: "border-blue-200/80 bg-blue-50/40",
                labelCls: "text-blue-700",
                valueCls: "text-[#0b3b68]",
              },
              {
                label: "Unchanged",
                count: kronosPreview?.summary?.unchanged ?? 0,
                cardCls: "border-slate-200 bg-slate-50/70",
                labelCls: "text-slate-500",
                valueCls: "text-slate-800",
              },
              {
                label: "Preserved",
                count: kronosPreview?.summary?.preserved ?? 0,
                cardCls: "border-amber-200/80 bg-amber-50/40",
                labelCls: "text-amber-700",
                valueCls: "text-amber-900",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`rounded-xl border px-4 py-3 ${stat.cardCls}`}
              >
                <div className={`text-[10px] font-bold uppercase tracking-wider ${stat.labelCls}`}>
                  {stat.label}
                </div>
                <div className={`mt-1 text-2xl font-bold tabular-nums leading-none ${stat.valueCls}`}>
                  {Number(stat.count).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Structured Notes & Review Notices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-[11.5px] leading-relaxed text-slate-600 space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Sync Overview
              </div>
              <p>
                <strong className="text-slate-800">{kronosPreview?.summary?.transferred ?? 0}</strong> reassigned to another account &middot;{" "}
                <strong className="text-slate-800">{kronosPreview?.summary?.missing ?? 0}</strong> not found in Kronos. Both stay preserved with historical records intact.
              </p>
              <p>
                Dates to populate: <strong className="text-slate-800">{kronosPreview?.summary?.joinDatesToPopulate ?? 0}</strong> joins,{" "}
                <strong className="text-slate-800">{kronosPreview?.summary?.departureDatesToPopulate ?? 0}</strong> departures &middot;{" "}
                <strong className="text-slate-800">{kronosPreview?.summary?.nonCurrentRoleUpdates ?? 0}</strong> non-US-Visa role updates.
              </p>
            </div>

            <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 px-4 py-3 text-[11.5px] leading-relaxed text-amber-900/90 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Review Notices
              </div>
              <p>
                <strong>{kronosPreview?.summary?.partialHierarchy ?? 0}</strong> partial &amp;{" "}
                <strong>{kronosPreview?.summary?.unresolvedHierarchy ?? 0}</strong> unresolved supervisor chains &middot;{" "}
                <strong>{kronosPreview?.summary?.roleNeedsReview ?? 0}</strong> roles need review.
              </p>
              <p>
                <strong>{kronosPreview?.summary?.statusNeedsVerification ?? 0}</strong> status verifications &middot;{" "}
                <strong>{kronosPreview?.summary?.dateWarnings ?? 0}</strong> date-evidence warnings retained. BOD is root only.
              </p>
            </div>
          </div>

          {/* Preview Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="max-h-72 overflow-y-auto overflow-x-hidden sibs-scrollbar">
              <table className="w-full table-fixed text-[11px] text-left border-collapse">
                <colgroup>
                  <col className="w-[7%]" />
                  <col className="w-[20%]" />
                  <col className="w-[19%]" />
                  <col className="w-[10%]" />
                  <col className="w-[20%]" />
                  <col className="w-[13%]" />
                  <col className="w-[11%]" />
                </colgroup>
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-2.5 py-2.5 whitespace-nowrap">SIBS ID</th>
                    <th className="px-2.5 py-2.5 whitespace-nowrap">Employee</th>
                    <th className="px-2.5 py-2.5 whitespace-nowrap">Action</th>
                    <th className="px-2.5 py-2.5 whitespace-nowrap">Status</th>
                    <th className="px-2.5 py-2.5 whitespace-nowrap">Join / Departure</th>
                    <th className="px-2.5 py-2.5 whitespace-nowrap">Role</th>
                    <th className="px-2.5 py-2.5 whitespace-nowrap">Hierarchy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(kronosPreview?.previewRows || []).map((row) => {
                    const statusCls =
                      row.employmentStatus === "Active"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : row.employmentStatus === "Inactive"
                        ? "bg-rose-600 text-white border-rose-600"
                        : "bg-amber-50 text-amber-700 border-amber-200";
                    const hierarchyCls =
                      row.hierarchyStatus === "VERIFIED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : row.hierarchyStatus === "PARTIAL"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-slate-100 text-slate-600 border-slate-200";
                    return (
                      <tr key={row.sibsId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-2.5 py-2 font-mono text-[11px] font-semibold text-slate-700 whitespace-nowrap truncate">
                          {row.sibsId}
                        </td>
                        <td className="px-2.5 py-2 font-medium text-slate-800 truncate" title={row.name || ""}>
                          {row.name || "—"}
                        </td>
                        <td className="px-2.5 py-2 overflow-hidden">
                          <span
                            title={row.action.replaceAll("_", " ")}
                            className="inline-block max-w-full truncate rounded-md bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-slate-600 align-middle"
                          >
                            {row.action.replaceAll("_", " ")}
                          </span>
                        </td>
                        <td className="px-2.5 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusCls}`}>
                            {row.employmentStatus || "—"}
                          </span>
                        </td>
                        <td
                          className="px-2.5 py-2 whitespace-nowrap text-slate-600 tabular-nums truncate"
                          title={(row.dateWarnings || []).join(", ")}
                        >
                          <span>{row.joinDate || "—"} / {row.departureDate || "—"}</span>
                          {row.dateWarnings?.length > 0 && (
                            <span className="ml-1 inline-flex items-center rounded bg-amber-50 border border-amber-200 px-1 py-0.2 text-[9px] font-semibold text-amber-700">
                              Review
                            </span>
                          )}
                        </td>
                        <td className="px-2.5 py-2 whitespace-nowrap text-slate-700 truncate" title={roleLabel(row.organizationalRole)}>
                          <span>{roleLabel(row.organizationalRole)}</span>
                          {row.roleReviewStatus === "NEEDS_REVIEW" && (
                            <span className="ml-1 inline-flex items-center rounded bg-amber-50 border border-amber-200 px-1 py-0.2 text-[9px] font-semibold text-amber-700">
                              Review
                            </span>
                          )}
                        </td>
                        <td className="px-2.5 py-2 whitespace-nowrap" title={row.warnings?.join(", ") || ""}>
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9.5px] font-semibold ${hierarchyCls}`}>
                            {row.hierarchyStatus || "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {kronosPreview?.previewTruncated && (
              <div className="border-t border-slate-100 bg-slate-50/70 px-3.5 py-2 text-[11px] text-slate-500">
                Showing the first 200 of {kronosPreview.totalPreviewRows} records.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-3.5">
          <p className="text-[11px] text-slate-500 leading-snug">
            Existing PMS employment dates, raw statuses, Task Orders, historical employees and vendor aliases are protected. Only verified missing dates are populated.
          </p>
          <div className="flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setKronosPreview(null)}
              disabled={isApplyingKronos}
              className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleKronosApply}
              disabled={isApplyingKronos}
              className="h-9 inline-flex items-center gap-1.5 rounded-lg bg-[#0b3b68] px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-[#082b4d] disabled:opacity-60 cursor-pointer"
            >
              {isApplyingKronos && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isApplyingKronos ? "Applying…" : "Apply Verified Updates"}
            </button>
          </div>
        </div>
      </AppModal>

      {/* Record Saved Success Modal */}
      <AppModal
        isOpen={Boolean(savedEmployeeSuccess)}
        className="max-w-md p-6 text-center rounded-2xl shadow-2xl border border-slate-200"
        textAlign="center"
        zIndex="z-[140]"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-xs mb-3.5">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" aria-hidden="true" />
        </div>
        <h3 className="m-0 text-lg font-extrabold text-slate-900 leading-snug">
          Saved Successfully!
        </h3>
        <p className="mt-2 mb-0 text-xs sm:text-sm text-slate-600 leading-relaxed">
          Employee details for{" "}
          <span className="font-extrabold text-slate-900">
            {savedEmployeeSuccess?.name}
          </span>{" "}
          (<span className="font-mono text-xs font-bold text-[#0b3b68] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
            {savedEmployeeSuccess?.sibsId}
          </span>) have been updated and saved to the database.
        </p>
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setSavedEmployeeSuccess(null)}
            className="inline-flex h-9.5 w-full items-center justify-center rounded-xl bg-[#0b3b68] px-6 text-xs font-bold text-white shadow-xs hover:bg-[#082b4d] transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </AppModal>

      {/* Modals */}
      <ConfirmationModal
        isOpen={Boolean(pendingImport)}
        title="Import US Visa Employee Ledger"
        message={`Ready to import "${pendingImport?.fileName}"${pendingImport?.sheetName ? ` (Sheet: "${pendingImport.sheetName}")` : ""}. Found ${pendingImport?.items?.length} employee record(s). These will be saved into the "us_visa_employee_ledger" table under pms_db. Do you want to proceed?`}
        confirmText="Confirm & Save"
        cancelText="Cancel"
        onConfirm={handleConfirmImport}
        onCancel={() => {
          if (isExecutingImport) return;
          setPendingImport(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
      />

      <LoadingModal
        isOpen={isExecutingImport}
        title="Importing Employee Ledger"
        message="Saving records to us_visa_employee_ledger in pms_db and refreshing table…"
      />

      <ConfirmationModal
        isOpen={dashboard.showLogoutModal}
        title="Sign Out"
        message="Are you sure you want to log out?"
        confirmText="Log Out"
        cancelText="Cancel"
        onConfirm={dashboard.handleLogout}
        onCancel={() => dashboard.setShowLogoutModal(false)}
      />
      <LoadingModal isOpen={dashboard.isLoggingOut} message="Signing out…" />
    </div>
  );
}
