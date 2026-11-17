import React, { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios/api-template";
import {
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from "lucide-react";
import FrontStepsEditEmployeeModal from "./FrontStepsEditEmployeeModal";

const FRONTSTEPS_LEDGER_COLUMNS = [
  { key: "sibsId", label: "SIBS ID", sticky: "left", width: "w-[90px]" },
  { key: "name", label: "Name", width: "w-[200px]" },
  { key: "account", label: "Account", width: "w-[120px]" },
  { key: "tier", label: "Tier", width: "w-[125px]" },
  { key: "lob", label: "LOB", width: "w-[145px]" },
  { key: "salesforceName", label: "Salesforce Name", width: "w-[170px]" },
  { key: "tl", label: "TL", width: "w-[185px]" },
  { key: "om", label: "OM", width: "w-[155px]" },
  { key: "site", label: "Site", width: "w-[95px]" },
  { key: "pstDate", label: "PST Date", width: "w-[115px]" },
  { key: "hireDate", label: "Hire Date", width: "w-[115px]" },
  { key: "productionDate", label: "Production Date", width: "w-[135px]" },
  { key: "departureDate", label: "Departure Date", width: "w-[135px]" },
  { key: "status", label: "Status", width: "w-[105px]" },
  { key: "actions", label: "Actions", width: "w-[80px]" },
];

// Accurate SIBS ID & SalesForce Name records from pms_db.frontsteps_employee_aliases
const INITIAL_FRONTSTEPS_EMPLOYEES = [
  {
    sibsId: "1603",
    name: "SENATE STEFANE TONING",
    account: "FRONTSTEPS",
    lob: "-",
    salesforceName: "Senate Toning",
    tl: "",
    om: "",
    site: "Tagum",
    pstDate: "",
    hireDate: "2023-12-18",
    productionDate: "",
    departureDate: "2024-09-03",
    status: "Inactive",
  },
  {
    sibsId: "1403",
    name: "ANGELITO ROMERO",
    account: "FRONTSTEPS",
    lob: "-",
    salesforceName: "Angelito Romero",
    tl: "",
    om: "",
    site: "Davao",
    pstDate: "",
    hireDate: "2023-07-31",
    productionDate: "",
    departureDate: "2024-09-03",
    status: "Inactive",
  },
  {
    sibsId: "5179",
    name: "DAPHNE IGDANES",
    account: "FRONTSTEPS",
    lob: "-",
    salesforceName: "Daphne Vergara",
    tl: "",
    om: "",
    site: "Davao",
    pstDate: "",
    hireDate: "2023-03-27",
    productionDate: "",
    departureDate: "2024-09-03",
    status: "Inactive",
  },
  {
    sibsId: "4604",
    name: "Glenn Edmund Loria",
    account: "FRONTSTEPS",
    lob: "-",
    salesforceName: "Glenn Loria",
    tl: "",
    om: "",
    site: "Davao",
    pstDate: "",
    hireDate: "2022-09-26",
    productionDate: "",
    departureDate: "2024-09-03",
    status: "Inactive",
  },
  {
    sibsId: "3707",
    name: "Ale Macmod",
    account: "FRONTSTEPS",
    lob: "-",
    salesforceName: "Ale Macmod",
    tl: "Appraille Faith Gulmatico",
    om: "Ian Ceasar Maclan",
    site: "Davao",
    pstDate: "2021-10-08",
    hireDate: "",
    productionDate: "",
    departureDate: "2025-06-02",
    status: "Inactive",
  },
  {
    sibsId: "5631",
    name: "Hazelou Itom",
    account: "FRONTSTEPS",
    lob: "Resident Support",
    salesforceName: "Hazelou Itom",
    tl: "Appraille Faith Gulmatico",
    om: "Ian Ceasar Maclan",
    site: "Tagum",
    pstDate: "2023-09-20",
    hireDate: "",
    productionDate: "",
    departureDate: "2026-01-30",
    status: "Inactive",
  },
  {
    sibsId: "5206",
    name: "Leslie Joy Patricio",
    account: "FRONTSTEPS",
    tier: "Tier 1",
    lob: "Tier II",
    salesforceName: "Leslie Joy Patricio",
    tl: "Appraille Faith Gulmatico",
    om: "Ian Ceasar Maclan",
    site: "Davao",
    pstDate: "2023-04-11",
    hireDate: "2023-04-11",
    productionDate: "",
    departureDate: "",
    status: "Active",
  },
  {
    sibsId: "5669",
    name: "Nikki Bagaipo",
    account: "FRONTSTEPS",
    lob: "Resident Support",
    salesforceName: "Nikki Bagaipo",
    tl: "Appraille Faith Gulmatico",
    om: "Ian Ceasar Maclan",
    site: "Tagum",
    pstDate: "2023-11-13",
    hireDate: "",
    productionDate: "",
    departureDate: "2025-02-02",
    status: "Inactive",
  },
  {
    sibsId: "3566",
    name: "Jayrin Geverola",
    account: "FRONTSTEPS",
    lob: "Resident Support",
    salesforceName: "Jayrin Geverola",
    tl: "Appraille Faith Gulmatico",
    om: "Ian Ceasar Maclan",
    site: "Davao",
    pstDate: "2021-07-28",
    hireDate: "",
    productionDate: "",
    departureDate: "2024-12-13",
    status: "Inactive",
  },
  {
    sibsId: "6519",
    name: "Arvin Enlahosta",
    account: "FRONTSTEPS",
    lob: "Resident Support",
    salesforceName: "Arvin Enlahosta",
    tl: "Appraille Faith Gulmatico",
    om: "Ian Ceasar Maclan",
    site: "Davao",
    pstDate: "2025-02-23",
    hireDate: "2025-09-09",
    productionDate: "",
    departureDate: "2026-05-22",
    status: "Inactive",
  },
  {
    sibsId: "6632",
    name: "Jasmen Mique",
    account: "FRONTSTEPS",
    lob: "Resident Support",
    salesforceName: "Jasmen Mique",
    tl: "Appraille Faith Gulmatico",
    om: "Ian Ceasar Maclan",
    site: "Davao",
    pstDate: "2026-02-23",
    hireDate: "",
    productionDate: "",
    departureDate: "2026-03-31",
    status: "Inactive",
  },
  {
    sibsId: "6687",
    name: "DYAN VALERY KABIGTING",
    account: "FRONTSTEPS",
    tier: "Tier 1",
    lob: "Resident Support",
    salesforceName: "Dyan Kabigting",
    tl: "Appraille Faith Gulmatico",
    om: "Ian Ceasar Maclan",
    site: "Davao",
    pstDate: "2026-03-23",
    hireDate: "2026-03-16",
    productionDate: "",
    departureDate: "2026-08-10",
    status: "Inactive",
  },
  {
    sibsId: "6754",
    name: "Isagani Caballejo",
    account: "FRONTSTEPS",
    tier: "Tier 1",
    lob: "Resident Support",
    salesforceName: "Isagani Caballejo",
    tl: "Appraille Faith Gulmatico",
    om: "Ian Ceasar Maclan",
    site: "Davao",
    pstDate: "2026-05-26",
    hireDate: "2026-05-18",
    productionDate: "",
    departureDate: "",
    status: "Active",
  },
  {
    sibsId: "6750",
    name: "April Angel Eliguir",
    account: "FRONTSTEPS",
    tier: "Tier 1 / Tier 2",
    lob: "Resident Support",
    salesforceName: "April Eleguir",
    tl: "Appraille Faith Gulmatico",
    om: "Ian Ceasar Maclan",
    site: "Davao",
    pstDate: "2026-05-26",
    hireDate: "",
    productionDate: "",
    departureDate: "2026-07-10",
    status: "Inactive",
  },
  {
    sibsId: "6855",
    name: "Carlo Crisanto Bondoc",
    account: "FRONTSTEPS",
    tier: "Tier 1",
    lob: "Resident Support",
    salesforceName: "Carlo Bondoc",
    tl: "Appraille Faith Gulmatico",
    om: "Ian Ceasar Maclan",
    site: "Davao",
    pstDate: "2026-08-03",
    hireDate: "2026-08-03",
    productionDate: "",
    departureDate: "2026-10-11",
    status: "Inactive",
  },
  {
    sibsId: "6863",
    name: "Rosuel Alido",
    account: "FRONTSTEPS",
    tier: "Tier 1",
    lob: "Resident Support",
    salesforceName: "Rosuel Alido",
    tl: "Appraille Faith Gulmatico",
    om: "Ian Ceasar Maclan",
    site: "Tagum",
    pstDate: "2026-08-03",
    hireDate: "2026-08-03",
    productionDate: "",
    departureDate: "",
    status: "Active",
  },
  {
    sibsId: "6859",
    name: "Aira Krystelle Sanding",
    account: "FRONTSTEPS",
    tier: "Tier 1",
    lob: "Resident Support",
    salesforceName: "Aira Sanding",
    tl: "Appraille Faith Gulmatico",
    om: "Ian Ceasar Maclan",
    site: "Davao",
    pstDate: "2026-08-03",
    hireDate: "2026-08-03",
    productionDate: "",
    departureDate: "2026-10-11",
    status: "Inactive",
  },
  {
    sibsId: "6860",
    name: "Lerry Jen Perida",
    account: "FRONTSTEPS",
    tier: "Tier 1",
    lob: "Resident Support",
    salesforceName: "Lerry Perida",
    tl: "Appraille Faith Gulmatico",
    om: "Ian Ceasar Maclan",
    site: "Tagum",
    pstDate: "2026-08-03",
    hireDate: "2026-08-03",
    productionDate: "",
    departureDate: "2026-09-10",
    status: "Inactive",
  },
  {
    sibsId: "6887",
    name: "Shella Mae Timtim",
    account: "FRONTSTEPS",
    tier: "Tier 1",
    lob: "Resident Support",
    salesforceName: "Shella Timtim",
    tl: "Appraille Faith Gulmatico",
    om: "Ian Ceasar Maclan",
    site: "Davao",
    pstDate: "2026-08-03",
    hireDate: "2026-08-03",
    productionDate: "",
    departureDate: "",
    status: "Active",
  },
  {
    sibsId: "6888",
    name: "Mhitos Levita Lara",
    account: "FRONTSTEPS",
    tier: "Tier 1",
    lob: "Resident Support",
    salesforceName: "Mhitos Lara",
    tl: "Appraille Faith Gulmatico",
    om: "Ian Ceasar Maclan",
    site: "Davao",
    pstDate: "2026-08-03",
    hireDate: "2026-08-03",
    productionDate: "",
    departureDate: "2026-09-08",
    status: "Inactive",
  },
];

export default function FrontStepsEmployeeLedger() {
  const [employees, setEmployees] = useState(INITIAL_FRONTSTEPS_EMPLOYEES);
  const [editingEmployee, setEditingEmployee] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .get("/frontsteps/employee-ledger")
      .then((res) => {
        if (active && res?.data?.success && Array.isArray(res.data.data)) {
          setEmployees(res.data.data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLob, setSelectedLob] = useState("");
  const [selectedSite, setSelectedSite] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 14;

  const hasActiveFilters = Boolean(
    searchTerm || selectedLob || selectedSite || selectedStatus
  );

  const filteredList = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return employees.filter((emp) => {
      if (selectedLob && emp.lob !== selectedLob) return false;
      if (selectedSite && emp.site !== selectedSite) return false;
      if (selectedStatus && emp.status !== selectedStatus) return false;
      if (!q) return true;
      return (
        emp.sibsId.toLowerCase().includes(q) ||
        emp.name.toLowerCase().includes(q) ||
        emp.salesforceName.toLowerCase().includes(q)
      );
    });
  }, [employees, searchTerm, selectedLob, selectedSite, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedList = filteredList.slice(startIndex, startIndex + pageSize);

  const handleReset = () => {
    setSearchTerm("");
    setSelectedLob("");
    setSelectedSite("");
    setSelectedStatus("");
    setCurrentPage(1);
  };

  return (
    <div className="flex h-[calc(100vh-1.5rem)] flex-col gap-3.5 px-0 pt-4 pb-0">
      {/* Toolbar */}
      <div className="rounded-none border border-slate-200/90 bg-white p-2.5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by SIBS ID, employee name, or SalesForce name..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/40 pl-8.5 pr-3 text-xs text-slate-800 placeholder:text-slate-400 transition focus:border-[#0B2A4A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2A4A]/10"
            />
          </div>

          <select
            value={selectedLob}
            onChange={(e) => setSelectedLob(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition focus:border-[#0B2A4A] focus:outline-none focus:ring-2 focus:ring-[#0B2A4A]/10"
          >
            <option value="">All LOBs</option>
            <option value="Solutions Delivery">Solutions Delivery</option>
            <option value="Resident Support">Resident Support</option>
            <option value="Tier II">Tier II</option>
          </select>

          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition focus:border-[#0B2A4A] focus:outline-none focus:ring-2 focus:ring-[#0B2A4A]/10"
          >
            <option value="">All Sites</option>
            <option value="Davao">Davao</option>
            <option value="Tagum">Tagum</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition focus:border-[#0B2A4A] focus:outline-none focus:ring-2 focus:ring-[#0B2A4A]/10"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <button
            type="button"
            onClick={handleReset}
            disabled={!hasActiveFilters}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw size={13} />
            Reset
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-none border border-slate-200/90 bg-white shadow-2xs">
        <div className="flex-1 overflow-auto">
          <table className="w-max min-w-full table-fixed divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-[#0B2A4A] text-white">
              <tr>
                {FRONTSTEPS_LEDGER_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={`whitespace-nowrap px-5 py-3.5 text-xs font-semibold tracking-wide ${col.width || ""} ${
                      col.sticky === "left"
                        ? "sticky left-0 z-10 bg-[#0B2A4A] border-r border-white/10"
                        : col.sticky === "right"
                        ? "sticky right-0 z-10 bg-[#0B2A4A] border-l border-white/10 text-center"
                        : ""
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedList.length === 0 ? (
                <tr>
                  <td
                    colSpan={FRONTSTEPS_LEDGER_COLUMNS.length}
                    className="px-6 py-16 text-center"
                  >
                    <p className="text-sm font-medium text-slate-700">
                      No FrontSteps employee records found
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Try adjusting your search or filter criteria.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedList.map((emp) => (
                  <tr
                    key={emp.sibsId}
                    className="group transition-colors hover:bg-slate-50/90"
                  >
                    <td className="sticky left-0 z-10 whitespace-nowrap border-r border-slate-100 bg-white px-5 py-2 font-semibold tabular-nums text-slate-900 group-hover:bg-slate-50/90">
                      {emp.sibsId}
                    </td>
                    <td className="whitespace-nowrap px-5 py-2 font-medium text-slate-800">
                      {emp.name}
                    </td>
                    <td className="whitespace-nowrap px-5 py-2">
                      <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-700 border border-orange-200/70">
                        {emp.account}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-2 text-slate-600">
                      {emp.tier && emp.tier !== "-" ? (
                        emp.tier
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-2 text-slate-600">
                      {emp.lob && emp.lob !== "-" ? (
                        emp.lob
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-2 text-slate-700">
                      {emp.salesforceName || (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-2 text-slate-600">
                      {emp.tl || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-5 py-2 text-slate-600">
                      {emp.om || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-5 py-2">
                      {emp.site ? (
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {emp.site}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-2 tabular-nums text-slate-600">
                      {emp.pstDate || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-5 py-2 tabular-nums text-slate-600">
                      {emp.hireDate || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-5 py-2 tabular-nums text-slate-600">
                      {emp.productionDate || (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-2 tabular-nums text-slate-600">
                      {emp.departureDate || (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                          emp.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                            : "bg-slate-100 text-slate-600 border border-slate-200/80"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            emp.status === "Active"
                              ? "bg-emerald-500"
                              : "bg-slate-400"
                          }`}
                        />
                        {emp.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-2 text-center">
                      <button
                        type="button"
                        title="Edit employee"
                        onClick={() => setEditingEmployee(emp)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800"
                      >
                        <Pencil size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/40 px-4 py-6 text-sm text-slate-600">
          <span>
            Showing{" "}
            <strong className="font-semibold text-slate-900">
              {filteredList.length > 0 ? startIndex + 1 : 0}
            </strong>{" "}
            to{" "}
            <strong className="font-semibold text-slate-900">
              {Math.min(startIndex + pageSize, filteredList.length)}
            </strong>{" "}
            of{" "}
            <strong className="font-semibold text-slate-900">
              {filteredList.length}
            </strong>{" "}
            employees
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              <ChevronLeft size={15} />
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition ${
                  page === safePage
                    ? "bg-[#0B2A4A] text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Next
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      <FrontStepsEditEmployeeModal
        isOpen={Boolean(editingEmployee)}
        employee={editingEmployee}
        onClose={() => setEditingEmployee(null)}
        onSave={async (updated) => {
          try {
            const res = await api.put(
              `/frontsteps/employee-ledger/${encodeURIComponent(updated.sibsId)}`,
              updated
            );
            const saved = res?.data?.data || updated;
            setEmployees((prev) =>
              prev.map((item) => (item.sibsId === saved.sibsId ? saved : item))
            );
          } catch {
            setEmployees((prev) =>
              prev.map((item) =>
                item.sibsId === updated.sibsId ? updated : item
              )
            );
          }
        }}
      />
    </div>
  );
}
