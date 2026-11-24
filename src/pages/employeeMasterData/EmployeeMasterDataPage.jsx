import { recordAuditLog } from "@/lib/audit-logger";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpDown,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Pencil,
  RefreshCw,
  Search,
  Upload,
  Users,
  X,
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

function roleLabel(role) {
  return ORGANIZATIONAL_ROLE_OPTIONS.find(([key]) => key === role)?.[1] || "Unclassified";
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function EmployeeMasterDataPage() {
  const dashboard = useDashboardPage();

  const [searchTerm, setSearchTerm]           = useState("");
  const [selectedRole, setSelectedRole]       = useState("");
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
      void loadLedgerData(searchTerm, selectedTaskOrder, currentPage, pageSize, sortBy, sortOrder, selectedRole);
    }, 250);
    return () => clearTimeout(t);
  }, [searchTerm, selectedTaskOrder, selectedRole, currentPage, pageSize, sortBy, sortOrder, loadLedgerData]);

  // Keep only the Task Order dropdown; the page is always scoped to US Visa.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (taskOrderDropdownRef.current && !taskOrderDropdownRef.current.contains(e.target)) {
        setIsTaskOrderDropdownOpen(false);
        setTaskOrderSearchTerm("");
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsTaskOrderDropdownOpen(false);
        setTaskOrderSearchTerm("");
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
        void loadLedgerData(searchTerm, selectedTaskOrder, currentPage, pageSize, sortBy, sortOrder, selectedRole);
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
        void loadLedgerData(searchTerm, selectedTaskOrder, currentPage, pageSize, sortBy, sortOrder, selectedRole);
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

        <main className="flex flex-1 min-h-0 flex-col gap-2.5 sm:gap-3 overflow-hidden px-2.5 sm:px-4 lg:px-5 pt-2.5 sm:pt-3 pb-2">

          {/* ── Toolbar ────────────────────────────────────────────── */}
          <div className="shrink-0 flex flex-col lg:flex-row lg:items-center gap-2.5 sm:gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:px-4 sm:py-3 shadow-xs">
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

            <select
              aria-label="Filter by organizational role"
              value={selectedRole}
              onChange={(event) => { setSelectedRole(event.target.value); setCurrentPage(1); }}
              className="h-9 w-full sm:w-40 shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0b3b68]"
            >
              {ORGANIZATIONAL_ROLE_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            {/* Template Actions (Right) */}
            <div className="shrink-0 w-full sm:w-auto flex items-center gap-2 justify-end sm:justify-start lg:justify-end">
              {canSyncKronos && (
                <button
                  type="button"
                  onClick={handleKronosPreview}
                  disabled={isPreviewingKronos || isApplyingKronos || isLoading}
                  title="Review Kronos Account 20 employees and their supervisor hierarchy before changing PMS"
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#0b3b68] bg-white px-3 text-xs font-semibold text-[#0b3b68] hover:bg-blue-50 disabled:opacity-50"
                >
                  {isPreviewingKronos ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  {isPreviewingKronos ? "Checking Kronos…" : "Sync from Kronos"}
                </button>
              )}
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
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">

            {/* Scrollable table wrapper */}
            <div
              className="flex-1 min-h-0 overflow-x-auto overflow-y-auto sibs-scrollbar scroll-smooth"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
                <table className="w-full min-w-[3850px] table-fixed text-left text-xs border-collapse">
                  <colgroup>
                    <col style={{ width: "145px" }} />
                    <col style={{ width: "200px" }} />
                    <col style={{ width: "220px" }} />
                    <col style={{ width: "200px" }} />
                    <col style={{ width: "180px" }} />
                    <col style={{ width: "180px" }} />
                    <col style={{ width: "180px" }} />
                    <col style={{ width: "180px" }} />
                    <col style={{ width: "130px" }} />
                    <col style={{ width: "165px" }} />
                    <col style={{ width: "130px" }} />
                    <col style={{ width: "130px" }} />
                    <col style={{ width: "260px" }} />
                    <col style={{ width: "240px" }} />
                    <col style={{ width: "180px" }} />
                    <col style={{ width: "190px" }} />
                    <col style={{ width: "190px" }} />
                    <col style={{ width: "190px" }} />
                    <col style={{ width: "190px" }} />
                    <col style={{ width: "140px" }} />
                    <col style={{ width: "230px" }} />
                  </colgroup>
                  {/* ── Table head ──────────────────────────────────── */}
                  <thead className="sticky top-0 z-10 border-b border-[#0d3b66] bg-[#042c51] text-white shadow-xs">
                    <tr>
                      {/* 1. SIBS ID # */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap overflow-hidden">
                        SIBS ID #
                      </th>

                      {/* 2. Kronos Name */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap overflow-hidden">
                        Kronos Name
                      </th>

                      {/* 3. Call Novo email add */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap overflow-hidden">
                        Call Novo email add
                      </th>

                      {/* 4. Agent Name */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap overflow-hidden">
                        Agent Name
                      </th>

                      {/* 5. FuseCom  Name */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap overflow-hidden">
                        FuseCom Name
                      </th>

                      {/* 6. FuseNet  Name */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap overflow-hidden">
                        FuseNet Name
                      </th>

                      {/* 7. HeroDash Name */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap overflow-hidden">
                        HeroDash Name
                      </th>

                      {/* 8. MSD Name */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap overflow-hidden">
                        MSD Name
                      </th>

                      {/* 9. Site */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap overflow-hidden">
                        Site
                      </th>

                      {/* 10. Status */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap overflow-hidden">
                        Status
                      </th>

                      {/* Verified or proposed organizational role, distinct from application access */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap">
                        Role
                      </th>

                      {/* 11. Phase */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap overflow-hidden">
                        Phase
                      </th>

                      {/* 12. Task Order */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap overflow-hidden">
                        Task Order
                      </th>

                      {/* 13. Task Order Discription */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap overflow-hidden">
                        Task Order Discription
                      </th>

                      {/* 14. US Visa Join Date */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap overflow-hidden">
                        US Visa Join Date
                      </th>

                      {/* 15. US Visa Departure Date */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap overflow-hidden">
                        US Visa Departure Date
                      </th>

                      {/* 16. Team Leader */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap overflow-hidden">
                        Team Leader
                      </th>

                      {/* 17. Manager */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap overflow-hidden">
                        Manager
                      </th>

                      {/* 18. Senior Manager */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap overflow-hidden">
                        Senior Manager
                      </th>

                      {/* 19. Tenurity */}
                      <th className="px-4 py-3 text-xs font-bold text-white whitespace-nowrap overflow-hidden">
                        <div className="inline-flex items-baseline gap-1">
                          <span className="uppercase tracking-wider">TENURITY</span>
                          <span className="text-[10px] font-semibold lowercase tracking-normal text-white/70">days</span>
                        </div>
                      </th>

                      {/* 20. Modality (Voice, Chat, Email) */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap overflow-hidden">
                        Modality (Voice, Chat, Email)
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
                            <div className="flex items-center justify-between gap-2">
                              <div className="h-4 w-14 rounded-md bg-slate-200" />
                              <div className="h-5 w-5 rounded-md bg-slate-100" />
                            </div>
                          </td>
                          {/* 2. Kronos Name */}
                          <td className="px-4 py-3.5">
                            <div className="h-4 w-32 rounded-md bg-slate-200" />
                          </td>
                          {/* 3. Call Novo email add */}
                          <td className="px-4 py-3.5">
                            <div className="h-4 w-40 rounded-md bg-slate-200" />
                          </td>
                          {/* 4. Agent Name */}
                          <td className="px-4 py-3.5">
                            <div className="h-4 w-36 rounded-md bg-slate-200" />
                          </td>
                          {/* 5. FuseCom Name */}
                          <td className="px-4 py-3.5">
                            <div className="h-4 w-32 rounded-md bg-slate-200" />
                          </td>
                          {/* 6. FuseNet Name */}
                          <td className="px-4 py-3.5">
                            <div className="h-4 w-28 rounded-md bg-slate-200" />
                          </td>
                          {/* 7. HeroDash Name */}
                          <td className="px-4 py-3.5">
                            <div className="h-4 w-32 rounded-md bg-slate-200" />
                          </td>
                          {/* 8. MSD Name */}
                          <td className="px-4 py-3.5">
                            <div className="h-4 w-32 rounded-md bg-slate-200" />
                          </td>
                          {/* 9. Site */}
                          <td className="px-4 py-3.5">
                            <div className="h-4 w-16 rounded-md bg-slate-200" />
                          </td>
                          {/* 10. Status loading placeholder */}
                          <td className="px-4 py-3.5">
                            <div className="h-4 w-20 rounded-full bg-slate-200" />
                          </td>
                          {/* Organizational Role skeleton: never reference a row here */}
                          <td className="px-4 py-3.5"><div className="h-4 w-24 rounded-full bg-slate-200" /></td>
                          {/* 11. Phase */}
                          <td className="px-4 py-3.5">
                            <div className="h-4 w-16 rounded-md bg-slate-200" />
                          </td>
                          {/* 12. Task Order */}
                          <td className="px-4 py-3.5">
                            <div className="h-4 w-36 rounded-md bg-slate-200" />
                          </td>
                          {/* 13. Task Order Discription */}
                          <td className="px-4 py-3.5">
                            <div className="h-4 w-44 rounded-md bg-slate-200" />
                          </td>
                          {/* 14. US Visa Join Date */}
                          <td className="px-4 py-3.5">
                            <div className="h-4 w-24 rounded-md bg-slate-200" />
                          </td>
                          {/* 15. US Visa Departure Date */}
                          <td className="px-4 py-3.5">
                            <div className="h-4 w-24 rounded-md bg-slate-200" />
                          </td>
                          {/* 16. Team Leader */}
                          <td className="px-4 py-3.5">
                            <div className="h-4 w-32 rounded-md bg-slate-200" />
                          </td>
                          {/* 17. Manager */}
                          <td className="px-4 py-3.5">
                            <div className="h-4 w-32 rounded-md bg-slate-200" />
                          </td>
                          {/* 18. Senior Manager */}
                          <td className="px-4 py-3.5">
                            <div className="h-4 w-32 rounded-md bg-slate-200" />
                          </td>
                          {/* 19. Tenurity */}
                          <td className="px-4 py-3.5">
                            <div className="h-4 w-16 rounded-md bg-slate-200" />
                          </td>
                          {/* 20. Modality */}
                          <td className="px-4 py-3.5">
                            <div className="h-4 w-28 rounded-md bg-slate-200" />
                          </td>
                        </tr>
                      ))
                    ) : ledgerList.length === 0 ? (
                      <tr>
                        <td colSpan={21} className="py-24 text-center">
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
                            <div className="flex items-center justify-between gap-1.5 min-w-0">
                              <span className="font-mono text-xs font-bold text-slate-900 truncate">
                                {emp.sibsId || <span className="text-slate-300 font-normal select-none">—</span>}
                              </span>
                              {emp.sibsId && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(emp)}
                                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 shadow-2xs hover:border-[#0b3b68] hover:bg-[#0b3b68]/10 hover:text-[#0b3b68] transition cursor-pointer"
                                  title={`Edit details for ${emp.agentName || emp.kronosName || emp.sibsId}`}
                                >
                                  <Pencil size={11} />
                                </button>
                              )}
                            </div>
                          </td>

                          {/* 2. Kronos Name */}
                          <td className="px-4 py-3 text-slate-800 truncate" title={`${emp.kronosName || ""}${emp.kronosLastSyncedAt ? ` | Last sync (Manila): ${emp.kronosLastSyncedAt}` : ""}`}>
                            <div className="truncate">{emp.kronosName || <span className="text-slate-300 select-none">—</span>}</div>
                            {emp.kronosMembershipStatus && (
                              <div className="mt-0.5 truncate text-[9px] font-medium text-slate-500" title={`Hierarchy: ${emp.hierarchySyncStatus || "Not verified"}`}>
                                {emp.kronosMembershipStatus === "CURRENT_US_VISA" ? "Kronos verified: US Visa" :
                                  emp.kronosMembershipStatus === "OTHER_ACCOUNT" ? "Kronos: Other account" :
                                  "Kronos: Not found"}
                                {emp.hierarchySyncStatus && emp.hierarchySyncStatus !== "VERIFIED" && ` · ${emp.hierarchySyncStatus}`}
                              </div>
                            )}
                          </td>

                          {/* 3. Call Novo email add */}
                          <td className="px-4 py-3 text-slate-700 truncate" title={emp.callNovoEmail}>
                            {emp.callNovoEmail || <span className="text-slate-300 select-none">—</span>}
                          </td>

                          {/* 4. Agent Name */}
                          <td className="px-4 py-3 font-medium text-slate-900 truncate" title={emp.agentName}>
                            {emp.agentName || <span className="text-slate-300 select-none">—</span>}
                          </td>

                          {/* 5. FuseCom  Name */}
                          <td className="px-4 py-3 text-slate-700 truncate" title={emp.fusecomName}>
                            {emp.fusecomName || <span className="text-slate-300 select-none">—</span>}
                          </td>

                          {/* 6. FuseNet  Name */}
                          <td className="px-4 py-3 text-slate-700 truncate" title={emp.fusenetName}>
                            {emp.fusenetName || <span className="text-slate-300 select-none">—</span>}
                          </td>

                          {/* 7. HeroDash Name */}
                          <td className="px-4 py-3 text-slate-700 truncate" title={emp.herodashName}>
                            {emp.herodashName || <span className="text-slate-300 select-none">—</span>}
                          </td>

                          {/* 8. MSD Name */}
                          <td className="px-4 py-3 text-slate-700 truncate" title={emp.msdName}>
                            {emp.msdName || <span className="text-slate-300 select-none">—</span>}
                          </td>

                          {/* 9. Site */}
                          <td className="px-4 py-3 text-slate-700 truncate" title={emp.site}>
                            {emp.site || <span className="text-slate-300 select-none">—</span>}
                          </td>

                          {/* 10. Employee status determined only by Kronos gy_user_status */}
                          <td className="px-4 py-3 text-slate-700 truncate">
                            <span
                              title={getEmploymentStatus(emp) === "Active"
                                ? "Active · Kronos gy_user_status = 0"
                                : getEmploymentStatus(emp) === "Inactive"
                                  ? "Inactive · Kronos gy_user_status = 1"
                                  : "Needs Verification · Kronos user status missing, unmatched, or unrecognized. Check Kronos sync."}
                              className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                getEmploymentStatus(emp) === "Active"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : getEmploymentStatus(emp) === "Needs Verification"
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}
                            >
                              {getEmploymentStatus(emp)}
                            </span>
                          </td>

                          {/* Organizational Role */}
                          <td className="px-4 py-3 text-slate-700">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                title={`Read-only role · ${emp.roleReviewStatus || "NOT_CLASSIFIED"} · ${emp.roleSource || "NO_KRONOS_CLASSIFICATION"} · Account: ${emp.kronosAccountName || "Not synced"}`}
                                className={`inline-flex min-w-0 items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${
                                  emp.roleReviewStatus === "NEEDS_REVIEW"
                                    ? "border-amber-200 bg-amber-50 text-amber-800"
                                    : "border-slate-200 bg-slate-50 text-slate-700"
                                }`}
                              >
                                {roleLabel(emp.organizationalRole)}{emp.roleReviewStatus === "NEEDS_REVIEW" ? " · Review" : ""}
                              </span>
                            </div>
                          </td>

                          {/* 11. Phase */}
                          <td className="px-4 py-3 text-slate-700 truncate" title={emp.phase}>
                            {emp.phase || <span className="text-slate-300 select-none">—</span>}
                          </td>

                          {/* 12. Task Order */}
                          <td className="px-4 py-3 text-slate-700 whitespace-nowrap" title={emp.taskOrder}>
                            {emp.taskOrder && !String(emp.taskOrder).includes("#REF!") ? (
                              emp.taskOrder
                            ) : (
                              <span className="text-slate-300 select-none">—</span>
                            )}
                          </td>

                          {/* 13. Task Order Discription */}
                          <td className="px-4 py-3 text-slate-700 truncate" title={emp.taskOrderDescription}>
                            {emp.taskOrderDescription && !String(emp.taskOrderDescription).includes("#REF!") ? (
                              emp.taskOrderDescription
                            ) : (
                              <span className="text-slate-300 select-none">—</span>
                            )}
                          </td>

                          {/* 14. US Visa Join Date */}
                          <td className="px-4 py-3 text-slate-700 truncate" title={emp.usVisaJoinDate}>
                            {emp.usVisaJoinDate || <span className="text-slate-300 select-none">—</span>}
                          </td>

                          {/* 15. US Visa Departure Date */}
                          <td className="px-4 py-3 text-slate-700 truncate" title={emp.usVisaDepartureDate}>
                            {emp.usVisaDepartureDate || <span className="text-slate-300 select-none">—</span>}
                          </td>

                          {/* 16. Team Leader */}
                          <td className="px-4 py-3 text-slate-700 truncate" title={emp.teamLeader}>
                            {emp.teamLeader || <span className="text-slate-300 select-none">—</span>}
                          </td>

                          {/* 17. Manager */}
                          <td className="px-4 py-3 text-slate-700 truncate" title={emp.manager}>
                            {emp.manager || <span className="text-slate-300 select-none">—</span>}
                          </td>

                          {/* 18. Senior Manager */}
                          <td className="px-4 py-3 text-slate-700 truncate" title={emp.seniorManager}>
                            {emp.seniorManager || <span className="text-slate-300 select-none">—</span>}
                          </td>

                          {/* 19. Tenurity */}
                          <td
                            className="px-4 py-3 text-slate-700 truncate"
                            title={emp.tenurityDateWarning === "LAST_WORKING_DAY_BEFORE_ACCOUNT_JOIN_DATE"
                              ? "Last Working Day is earlier than Account Join Date. Check the ledger dates."
                              : emp.tenurityDateWarning === "INVALID_LAST_WORKING_DAY"
                                ? "Invalid Last Working Day. Check the ledger dates."
                                : emp.tenurity ?? ""}
                          >
                            {emp.tenurityDateWarning ? (
                              <span className="inline-flex items-center gap-1 text-amber-700">
                                <AlertTriangle size={12} aria-label="Date verification required" /> —
                              </span>
                            ) : emp.tenurity != null && emp.tenurity !== "" ? emp.tenurity : <span className="text-slate-300 select-none">—</span>}
                          </td>

                          {/* 20. Modality (Voice, Chat, Email) */}
                          <td className="px-4 py-3 text-slate-700 truncate" title={emp.modality}>
                            {emp.modality || <span className="text-slate-300 select-none">—</span>}
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

      {/* Edit Employee Ledger Modal */}
      <EditEmployeeLedgerModal
        isOpen={Boolean(editingEmployee)}
        employee={editingEmployee}
        onClose={handleCloseEditModal}
        onSave={handleSaveEmployeeRecord}
        isSaving={isSavingEdit}
      />

      {/* Preview -> Apply: keeps existing and inactive employees safe. */}
      <AppModal isOpen={Boolean(kronosPreview)} className="max-w-3xl max-h-[85vh] overflow-y-auto p-5" zIndex="z-[145]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Kronos Employee Ledger Sync</h3>
            <p className="mt-1 text-xs text-slate-500">Preview only. Nothing changes until you apply verified updates.</p>
          </div>
          <button type="button" onClick={() => !isApplyingKronos && setKronosPreview(null)} disabled={isApplyingKronos} className="text-slate-500 hover:text-slate-800" aria-label="Close sync preview"><X size={17} /></button>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            ["Add", kronosPreview?.summary?.new],
            ["Update", kronosPreview?.summary?.update],
            ["Unchanged", kronosPreview?.summary?.unchanged],
            ["Preserved", kronosPreview?.summary?.preserved],
          ].map(([label, count]) => (
            <div key={label} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[10px] uppercase font-semibold text-slate-500">{label}</div>
              <div className="text-lg font-bold text-[#0b3b68]">{count ?? 0}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-slate-600">
          {kronosPreview?.summary?.transferred ?? 0} previously listed employees are now assigned to another account;
          {" "}{kronosPreview?.summary?.missing ?? 0} are not found in the current Kronos collection.
          Both groups stay in PMS with their historical records intact.
          {" "}{kronosPreview?.summary?.nonCurrentRoleUpdates ?? 0} existing non-US-Visa employees have new role/hierarchy classifications.
        </p>
        <p className="mt-2 text-[11px] text-slate-600">
          Verified missing dates to populate: <strong>{kronosPreview?.summary?.joinDatesToPopulate ?? 0}</strong> US Visa joins,
          {" "}<strong>{kronosPreview?.summary?.departureDatesToPopulate ?? 0}</strong> departures.
          {" "}<strong>{kronosPreview?.summary?.statusNeedsVerification ?? 0}</strong> employees require status verification,
          and <strong>{kronosPreview?.summary?.dateWarnings ?? 0}</strong> date-evidence warnings will be retained for review.
        </p>
        <p className="mt-1 text-[11px] text-amber-700">
          {kronosPreview?.summary?.partialHierarchy ?? 0} partial and {kronosPreview?.summary?.unresolvedHierarchy ?? 0} unresolved supervisor chains.
          {" "}{kronosPreview?.summary?.roleNeedsReview ?? 0} organizational roles need human review.
          Only verified positions are used for hierarchy. BOD is checked as the root, not added to the ledger.
        </p>
        <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-slate-200">
          <table className="w-full text-[11px] text-left">
            <thead className="sticky top-0 bg-slate-100 text-slate-600"><tr>
              <th className="p-2">SIBS ID</th><th className="p-2">Employee</th><th className="p-2">Action</th><th className="p-2">Status</th><th className="p-2">Join / Departure</th><th className="p-2">Role</th><th className="p-2">Hierarchy</th>
            </tr></thead>
            <tbody>
              {(kronosPreview?.previewRows || []).map((row) => (
                <tr key={row.sibsId} className="border-t border-slate-100">
                  <td className="p-2 font-medium">{row.sibsId}</td>
                  <td className="p-2">{row.name || "—"}</td>
                  <td className="p-2">{row.action.replaceAll("_", " ")}</td>
                  <td className="p-2">{row.employmentStatus || "—"}</td>
                  <td className="p-2" title={(row.dateWarnings || []).join(", ")}>
                    {row.joinDate || "—"} / {row.departureDate || "—"}
                    {row.dateWarnings?.length > 0 ? " · Review" : ""}
                  </td>
                  <td className="p-2">{roleLabel(row.organizationalRole)}{row.roleReviewStatus === "NEEDS_REVIEW" ? " · Review" : ""}</td>
                  <td className="p-2" title={row.warnings?.join(", ") || ""}>{row.hierarchyStatus || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {kronosPreview?.previewTruncated && (
          <p className="mt-2 text-[11px] text-slate-500">Showing the first 200 of {kronosPreview.totalPreviewRows} records.</p>
        )}
        <p className="mt-3 text-[11px] text-slate-600">
          Existing PMS employment dates, raw statuses, Task Orders, historical employees and vendor aliases are protected. Only verified missing dates are populated.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => setKronosPreview(null)} disabled={isApplyingKronos} className="h-9 rounded-md border border-slate-200 px-4 text-xs font-semibold text-slate-700">Cancel</button>
          <button type="button" onClick={handleKronosApply} disabled={isApplyingKronos} className="h-9 inline-flex items-center gap-1.5 rounded-md bg-[#0b3b68] px-4 text-xs font-semibold text-white disabled:opacity-60">
            {isApplyingKronos && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isApplyingKronos ? "Applying…" : "Apply Verified Updates"}
          </button>
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
