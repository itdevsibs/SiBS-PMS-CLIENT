import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpDown,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Pencil,
  RotateCcw,
  Search,
  Upload,
  Users,
  X,
} from "lucide-react";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AppHeader from "@/components/layout/AppHeader";
import AppModal from "@/components/ui/app-modal";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import LoadingModal from "@/components/ui/loading-modal";
import EditEmployeeLedgerModal from "@/components/ui/masterdata/EditEmployeeLedgerModal";
import useDashboardPage from "@/hooks/useDashboardPage";
import {
  fetchMasterDataAccounts,
  fetchMasterDataLedger,
  importUsVisaEmployeeLedger,
  updateEmployeeToolAliases,
} from "@/lib/axios/masterdata";

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

/* ─── Tenurity Calculator (Join Date to Today in Days) ───────────── */
function calculateTenurityDays(joinDate, departureDate) {
  if (!joinDate) return "";
  const str = String(joinDate).trim();
  if (!str || str === "0000-00-00" || str === "—") return "";
  const start = new Date(str);
  if (isNaN(start.getTime()) || start.getFullYear() < 1990) return "";

  const endStr = departureDate ? String(departureDate).trim() : "";
  const end = endStr && endStr !== "—" ? new Date(endStr) : new Date();
  if (isNaN(end.getTime())) return "";

  const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());

  const diffDays = Math.floor((utcEnd - utcStart) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 ? String(diffDays) : "";
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function EmployeeMasterDataPage() {
  const dashboard = useDashboardPage();

  const [searchTerm, setSearchTerm]           = useState("");
  const [selectedAccount, setSelectedAccount] = useState("US Visa");
  const [accountsList, setAccountsList]       = useState([]);
  const [ledgerList, setLedgerList]           = useState([]);
  const [totalCount, setTotalCount]           = useState(0);
  const [isLoading, setIsLoading]             = useState(false);
  const [errorMsg, setErrorMsg]               = useState("");
  const [currentPage, setCurrentPage]         = useState(1);
  const [totalPages, setTotalPages]           = useState(1);
  const [sortBy, setSortBy]                   = useState(null); // 'fusecom' | 'fusenet' | 'herodash' | 'ms-d' | null
  const [sortOrder, setSortOrder]             = useState("desc"); // 'desc' (aliases first) | 'asc' (no aliases first)
  const pageSize = 25;

  /* Fetch accounts */
  useEffect(() => {
    let alive = true;
    fetchMasterDataAccounts()
      .then((res) => { if (alive && res?.success) setAccountsList(res.accounts || []); })
      .catch(console.error);
    return () => { alive = false; };
  }, []);

  /* Fetch ledger data */
  const loadLedgerData = useCallback(
    async (
      searchQuery = "",
      acc = "US Visa",
      page = 1,
      size = 25,
      activeSortBy = null,
      activeSortOrder = "desc",
    ) => {
      const query = searchQuery.trim();
      const targetAccount = acc || "US Visa";

      if (targetAccount && targetAccount.trim().toLowerCase() !== "us visa") {
        setLedgerList([]);
        setTotalCount(0);
        setTotalPages(1);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMsg("");
        const result = await fetchMasterDataLedger({
          search: query,
          account: targetAccount,
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
      void loadLedgerData(searchTerm, selectedAccount, currentPage, pageSize, sortBy, sortOrder);
    }, 250);
    return () => clearTimeout(t);
  }, [searchTerm, selectedAccount, currentPage, pageSize, sortBy, sortOrder, loadLedgerData]);

  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isSearchingAccount, setIsSearchingAccount]       = useState(false);
  const [accountSearchTerm, setAccountSearchTerm]         = useState("");
  const accountDropdownRef                                = useRef(null);
  const accountSearchInputRef                             = useRef(null);

  useEffect(() => {
    if (!isAccountDropdownOpen && !isSearchingAccount) return;

    const handleClickOutside = (e) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(e.target)) {
        setIsAccountDropdownOpen(false);
        setIsSearchingAccount(false);
        setAccountSearchTerm("");
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsAccountDropdownOpen(false);
        setIsSearchingAccount(false);
        setAccountSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAccountDropdownOpen, isSearchingAccount]);

  useEffect(() => {
    if (isSearchingAccount) {
      setTimeout(() => {
        accountSearchInputRef.current?.focus();
      }, 50);
    }
  }, [isSearchingAccount]);

  const selectableAccounts = useMemo(() => {
    const list = ["US Visa", "All Accounts"];
    accountsList.forEach((acc) => {
      const clean = String(acc || "").trim();
      if (clean && clean.toLowerCase() !== "us visa" && !list.includes(clean)) {
        list.push(clean);
      }
    });
    return list;
  }, [accountsList]);

  const filteredAccountOptions = useMemo(() => {
    const term = accountSearchTerm.trim().toLowerCase();
    if (!term) return selectableAccounts;
    return selectableAccounts.filter((acc) =>
      acc.toLowerCase().includes(term),
    );
  }, [selectableAccounts, accountSearchTerm]);

  const handleSelectAccount = (acc) => {
    const value = acc === "All Accounts" ? "" : acc;
    setSelectedAccount(value);
    setIsAccountDropdownOpen(false);
    setIsSearchingAccount(false);
    setAccountSearchTerm("");
    setCurrentPage(1);
  };

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
      const res = await updateEmployeeToolAliases(editingEmployee.sibsId, formData);
      if (res?.success) {
        const empName = formData.agentName || editingEmployee.agentName || editingEmployee.kronosName || editingEmployee.sibsId;
        const empSibsId = editingEmployee.sibsId;

        // Close edit modal and open success modal
        setEditingEmployee(null);
        setSavedEmployeeSuccess({
          name: empName,
          sibsId: empSibsId,
        });

        // Optimistically update current view and reload data in background
        setLedgerList((prev) =>
          prev.map((emp) =>
            emp.sibsId === editingEmployee.sibsId
              ? { ...emp, ...formData }
              : emp
          )
        );
        void loadLedgerData(searchTerm, selectedAccount, currentPage, pageSize, sortBy, sortOrder);
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
          account: selectedAccount || "US Visa",
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
        "Status": emp.status || "",
        "Phase": emp.phase || "",
        "Task Order": emp.taskOrder || "",
        "Task Order Discription": emp.taskOrderDescription || "",
        "US Visa Join Date": emp.usVisaJoinDate || "",
        "US Visa Departure Date": emp.usVisaDepartureDate || "",
        "Team Leader": emp.teamLeader || "",
        "Manager": emp.manager || "",
        "Senior Manager": emp.seniorManager || "",
        "Tenurity": calculateTenurityDays(emp.usVisaJoinDate, emp.usVisaDepartureDate, emp.tenurity),
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
          taskOrder: getColVal(row, "taskOrder"),
          taskOrderDescription: getColVal(row, "taskOrderDescription"),
          usVisaDepartureDate: formatExcelDate(row[bestMapping.usVisaDepartureDate]),
          usVisaJoinDate: formatExcelDate(row[bestMapping.usVisaJoinDate]),
          teamLeader: getColVal(row, "teamLeader"),
          manager: getColVal(row, "manager"),
          seniorManager: getColVal(row, "seniorManager"),
          tenurity: getColVal(row, "tenurity"),
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
        void loadLedgerData(searchTerm, selectedAccount, currentPage, pageSize, sortBy, sortOrder);
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

        <main className="flex flex-1 min-h-0 flex-col gap-2.5 sm:gap-3 overflow-hidden px-2.5 sm:px-4 lg:px-5 pt-2.5 sm:pt-4 lg:pt-5 pb-2.5 sm:pb-4 lg:pb-5">

          {/* ── Toolbar ────────────────────────────────────────────── */}
          <div className="shrink-0 flex flex-col lg:flex-row lg:items-center gap-2.5 sm:gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:px-4 sm:py-3 shadow-xs">
            {/* Account select + Reset (Left) */}
            <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-64 md:w-72 sm:flex-none" ref={accountDropdownRef}>
                {isSearchingAccount ? (
                  <div className="relative h-9 w-full sm:w-64 md:w-72">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      ref={accountSearchInputRef}
                      type="text"
                      value={accountSearchTerm}
                      onChange={(e) => {
                        setAccountSearchTerm(e.target.value);
                        setIsAccountDropdownOpen(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && filteredAccountOptions.length > 0) {
                          handleSelectAccount(filteredAccountOptions[0]);
                        }
                      }}
                      placeholder="Search department..."
                      className="h-9 w-full rounded-lg border border-[#0b3b68] bg-white pl-8 pr-7 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0b3b68]/15"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setAccountSearchTerm("");
                        setIsSearchingAccount(false);
                        setIsAccountDropdownOpen(false);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAccountDropdownOpen((prev) => !prev)}
                    onDoubleClick={() => {
                      setIsSearchingAccount(true);
                      setIsAccountDropdownOpen(true);
                    }}
                    title="Click to select, double-click to search departments"
                    className="flex h-9 w-full sm:w-64 md:w-72 cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-100 focus:border-[#0b3b68] focus:outline-none"
                  >
                    <span className="truncate">
                      {selectedAccount || "All Accounts"}
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                        isAccountDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                )}

                {/* Dropdown Menu */}
                {isAccountDropdownOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 max-h-96 w-full sm:w-64 md:w-72 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10">
                    {!isSearchingAccount && (
                      <div className="border-b border-slate-100 p-1.5">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                          <input
                            type="text"
                            value={accountSearchTerm}
                            onChange={(e) => setAccountSearchTerm(e.target.value)}
                            placeholder="Type to search..."
                            className="h-7 w-full rounded-md border border-slate-200 bg-slate-50 pl-6 pr-2 text-[11px] text-slate-800 focus:border-[#0b3b68] focus:bg-white focus:outline-none"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    )}

                    <div className="max-h-80 overflow-y-auto sibs-scrollbar">
                      {filteredAccountOptions.length > 0 ? (
                        filteredAccountOptions.map((acc) => {
                          const isSelected =
                            acc === "All Accounts"
                              ? !selectedAccount
                              : selectedAccount === acc;
                          return (
                            <button
                              key={acc}
                              type="button"
                              onClick={() => handleSelectAccount(acc)}
                              className={`flex w-full cursor-pointer items-center justify-between px-3 py-1.5 text-left text-xs transition ${
                                isSelected
                                  ? "bg-sky-50 font-bold text-[#0b3b68]"
                                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                              }`}
                            >
                              <span className="truncate">{acc}</span>
                              {isSelected && (
                                <Check className="h-3.5 w-3.5 text-[#0b3b68]" />
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-3 py-4 text-center text-xs text-slate-400">
                          No departments found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedAccount("US Visa");
                  setIsSearchingAccount(false);
                  setIsAccountDropdownOpen(false);
                  setAccountSearchTerm("");
                  setSortBy(null);
                  setSortOrder("desc");
                  setCurrentPage(1);
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                Reset
              </button>
            </div>

            {/* Search (Middle) */}
            <div className="relative flex-1 w-full min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by SIBS ID, employee name, or tool alias…"
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
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">

            {/* Scrollable table wrapper */}
            <div
              className="flex-1 min-h-0 overflow-x-auto overflow-y-auto sibs-scrollbar scroll-smooth"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
                <table className="w-full min-w-[3590px] table-fixed text-left text-xs border-collapse">
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
                    <col style={{ width: "130px" }} />
                    <col style={{ width: "130px" }} />
                    <col style={{ width: "150px" }} />
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
                  <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 shadow-xs">
                    <tr>
                      {/* 1. SIBS ID # */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap overflow-hidden">
                        SIBS ID #
                      </th>

                      {/* 2. Kronos Name */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap overflow-hidden">
                        Kronos Name
                      </th>

                      {/* 3. Call Novo email add */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap overflow-hidden">
                        Call Novo email add
                      </th>

                      {/* 4. Agent Name */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap overflow-hidden">
                        Agent Name
                      </th>

                      {/* 5. FuseCom  Name */}
                      <th
                        onClick={() => handleToggleToolSort("fusecom")}
                        title="Click to toggle filter for FuseCom aliases"
                        className={`group/th px-4 py-3 text-xs font-bold uppercase tracking-wider select-none cursor-pointer transition whitespace-nowrap overflow-hidden ${
                          sortBy === "fusecom"
                            ? "bg-orange-100/80 text-orange-950"
                            : "text-slate-600 hover:bg-orange-50/80 hover:text-orange-900"
                        }`}
                      >
                        <span className="inline-block h-2 w-2 rounded-full bg-orange-500 mr-1.5 align-middle" />
                        <span>FuseCom  Name</span>
                        <ArrowUpDown
                          className={`inline-block ml-1.5 h-3 w-3 align-middle transition-opacity ${
                            sortBy === "fusecom"
                              ? "opacity-100 text-orange-950"
                              : "opacity-45 text-slate-400 group-hover/th:opacity-100 group-hover/th:text-slate-700"
                          }`}
                          aria-hidden="true"
                        />
                      </th>

                      {/* 6. FuseNet  Name */}
                      <th
                        onClick={() => handleToggleToolSort("fusenet")}
                        title="Click to toggle filter for FuseNet aliases"
                        className={`group/th px-4 py-3 text-xs font-bold uppercase tracking-wider select-none cursor-pointer transition whitespace-nowrap overflow-hidden ${
                          sortBy === "fusenet"
                            ? "bg-blue-100/80 text-blue-950"
                            : "text-slate-600 hover:bg-blue-50/80 hover:text-blue-900"
                        }`}
                      >
                        <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mr-1.5 align-middle" />
                        <span>FuseNet  Name</span>
                        <ArrowUpDown
                          className={`inline-block ml-1.5 h-3 w-3 align-middle transition-opacity ${
                            sortBy === "fusenet"
                              ? "opacity-100 text-blue-950"
                              : "opacity-45 text-slate-400 group-hover/th:opacity-100 group-hover/th:text-slate-700"
                          }`}
                          aria-hidden="true"
                        />
                      </th>

                      {/* 7. HeroDash Name */}
                      <th
                        onClick={() => handleToggleToolSort("herodash")}
                        title="Click to toggle filter for HeroDash aliases"
                        className={`group/th px-4 py-3 text-xs font-bold uppercase tracking-wider select-none cursor-pointer transition whitespace-nowrap overflow-hidden ${
                          sortBy === "herodash"
                            ? "bg-amber-100/80 text-amber-950"
                            : "text-slate-600 hover:bg-amber-50/80 hover:text-amber-900"
                        }`}
                      >
                        <span className="inline-block h-2 w-2 rounded-full bg-amber-500 mr-1.5 align-middle" />
                        <span>HeroDash Name</span>
                        <ArrowUpDown
                          className={`inline-block ml-1.5 h-3 w-3 align-middle transition-opacity ${
                            sortBy === "herodash"
                              ? "opacity-100 text-amber-950"
                              : "opacity-45 text-slate-400 group-hover/th:opacity-100 group-hover/th:text-slate-700"
                          }`}
                          aria-hidden="true"
                        />
                      </th>

                      {/* 8. MSD Name */}
                      <th
                        onClick={() => handleToggleToolSort("ms-d")}
                        title="Click to toggle filter for MSD aliases"
                        className={`group/th px-4 py-3 text-xs font-bold uppercase tracking-wider select-none cursor-pointer transition whitespace-nowrap overflow-hidden ${
                          sortBy === "ms-d" || sortBy === "msd"
                            ? "bg-purple-100/80 text-purple-950"
                            : "text-slate-600 hover:bg-purple-50/80 hover:text-purple-900"
                        }`}
                      >
                        <span className="inline-block h-2 w-2 rounded-full bg-purple-500 mr-1.5 align-middle" />
                        <span>MSD Name</span>
                        <ArrowUpDown
                          className={`inline-block ml-1.5 h-3 w-3 align-middle transition-opacity ${
                            sortBy === "ms-d" || sortBy === "msd"
                              ? "opacity-100 text-purple-950"
                              : "opacity-45 text-slate-400 group-hover/th:opacity-100 group-hover/th:text-slate-700"
                          }`}
                          aria-hidden="true"
                        />
                      </th>

                      {/* 9. Site */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap overflow-hidden">
                        Site
                      </th>

                      {/* 10. Status */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap overflow-hidden">
                        Status
                      </th>

                      {/* 11. Phase */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap overflow-hidden">
                        Phase
                      </th>

                      {/* 12. Task Order */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap overflow-hidden">
                        Task Order
                      </th>

                      {/* 13. Task Order Discription */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap overflow-hidden">
                        Task Order Discription
                      </th>

                      {/* 14. US Visa Join Date */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap overflow-hidden">
                        US Visa Join Date
                      </th>

                      {/* 15. US Visa Departure Date */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap overflow-hidden">
                        US Visa Departure Date
                      </th>

                      {/* 16. Team Leader */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap overflow-hidden">
                        Team Leader
                      </th>

                      {/* 17. Manager */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap overflow-hidden">
                        Manager
                      </th>

                      {/* 18. Senior Manager */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap overflow-hidden">
                        Senior Manager
                      </th>

                      {/* 19. Tenurity */}
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 whitespace-nowrap overflow-hidden">
                        <div className="inline-flex items-baseline gap-1">
                          <span className="uppercase tracking-wider">TENURITY</span>
                          <span className="text-[10px] font-semibold lowercase tracking-normal text-slate-400">days</span>
                        </div>
                      </th>

                      {/* 20. Modality (Voice, Chat, Email) */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap overflow-hidden">
                        Modality (Voice, Chat, Email)
                      </th>
                    </tr>
                  </thead>

                  {/* ── Table body ──────────────────────────────────── */}
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={20} className="py-24 text-center">
                          <Loader2 className="mx-auto mb-2.5 h-8 w-8 animate-spin text-slate-400" />
                          <p className="text-xs font-medium text-slate-500">
                            Loading employee records…
                          </p>
                        </td>
                      </tr>
                    ) : ledgerList.length === 0 ? (
                      <tr>
                        <td colSpan={20} className="py-24 text-center">
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
                          <td className="px-4 py-3 text-slate-800 truncate" title={emp.kronosName}>
                            {emp.kronosName || <span className="text-slate-300 select-none">—</span>}
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

                          {/* 10. Status */}
                          <td className="px-4 py-3 text-slate-700 truncate">
                            {emp.status ? (
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                  String(emp.status).toLowerCase().includes("active")
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-slate-100 text-slate-600 border-slate-200"
                                }`}
                              >
                                {emp.status}
                              </span>
                            ) : (
                              <span className="text-slate-300 select-none">—</span>
                            )}
                          </td>

                          {/* 11. Phase */}
                          <td className="px-4 py-3 text-slate-700 truncate" title={emp.phase}>
                            {emp.phase || <span className="text-slate-300 select-none">—</span>}
                          </td>

                          {/* 12. Task Order */}
                          <td className="px-4 py-3 text-slate-700 truncate" title={emp.taskOrder}>
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
                          <td className="px-4 py-3 text-slate-700 truncate" title={calculateTenurityDays(emp.usVisaJoinDate, emp.usVisaDepartureDate, emp.tenurity)}>
                            {calculateTenurityDays(emp.usVisaJoinDate, emp.usVisaDepartureDate, emp.tenurity) || <span className="text-slate-300 select-none">—</span>}
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
              <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 border-t border-slate-200/90 bg-slate-50/80 px-3.5 sm:px-5 py-2.5 sm:py-3.5">
                {/* Count */}
                <p className="text-xs sm:text-[13px] text-slate-600 m-0 text-center sm:text-left">
                  Showing{" "}
                  <span className="font-bold text-slate-900">{(currentPage - 1) * pageSize + 1}</span>
                  {" "}to{" "}
                  <span className="font-bold text-slate-900">{Math.min(currentPage * pageSize, totalCount)}</span>
                  {" "}of{" "}
                  <span className="font-bold text-slate-900">{totalCount}</span>
                  {" "}employees
                </p>

                {/* Page controls */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1 || isLoading}
                      className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-100 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer"
                      title="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <span className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs sm:text-[12.5px] font-bold text-slate-800 shadow-2xs">
                      {currentPage} / {totalPages}
                    </span>

                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage >= totalPages || isLoading}
                      className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-100 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer"
                      title="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
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
