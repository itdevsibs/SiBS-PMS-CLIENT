// Super admin page for assigning dashboard interface access.
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, Edit2, Search, Settings2, Trash2, UserPlus } from "lucide-react";

import AdminSidebar from "@/components/common/layout/AdminSidebar";
import AppHeader from "@/components/common/layout/AppHeader";
import AppModal from "@/components/common/ui/AppModal";
import { Button } from "@/components/common/ui/Button";
import ConfirmationModal from "@/components/common/ui/ConfirmationModal";
import LoadingModal from "@/components/common/ui/LoadingModal";
import useDashboardPage from "@/hooks/useDashboardPage";
import api from "@/lib/axios/api-template";

const userInterfaces = [
  "Work Force Management",
  "Agents",
  "Team Leaders",
  "Board of Directors",
  "Super Admin",
  "Operations Management",
  "Client",
  "Employee Ledger",
];

const emptyAccessByInterface = Object.fromEntries(
  userInterfaces.map((interfaceName) => [interfaceName, []]),
);

function SuperAdminDashboard() {
  const dashboard = useDashboardPage();
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [selectedInterface, setSelectedInterface] = useState(userInterfaces[0]);
  const [accessByInterface, setAccessByInterface] = useState(emptyAccessByInterface);
  const [userToManage, setUserToManage] = useState(null);
  const [isUserAllowed, setIsUserAllowed] = useState(true);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [userToAdd, setUserToAdd] = useState(null);
  const [savedAccessChange, setSavedAccessChange] = useState(null);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeSearchResults, setEmployeeSearchResults] = useState([]);
  const [isSearchingEmployees, setIsSearchingEmployees] = useState(false);
  const [employeeSearchError, setEmployeeSearchError] = useState("");
  const [isLoadingAccess, setIsLoadingAccess] = useState(true);
  const [isSavingAccess, setIsSavingAccess] = useState(false);
  const [accessError, setAccessError] = useState("");
  const accessUsers = useMemo(
    () => accessByInterface[selectedInterface] || [],
    [accessByInterface, selectedInterface],
  );
  const filteredEmployees = useMemo(() => {
    const existingIds = new Set(accessUsers.map((user) => user.employeeId));
    const searchValue = employeeSearch.toLowerCase().trim();

    return employeeSearchResults.filter((employee) => {
      const matchesSearch = [employee.employeeId, employee.name, employee.role, employee.department]
        .join(" ")
        .toLowerCase()
        .includes(searchValue);

      return !existingIds.has(employee.employeeId) && matchesSearch;
    });
  }, [accessUsers, employeeSearch, employeeSearchResults]);

  useEffect(() => {
    const loadInterfaceAccess = async () => {
      setIsLoadingAccess(true);
      setAccessError("");

      try {
        const response = await api.get("/super-admin/account-interface-access");
        if (response.data?.success && Array.isArray(response.data?.data)) {
          setAccountAccessList(response.data.data);
        }
      } catch {
        setAccessError("Unable to load interface access.");
      } finally {
        setIsLoadingAccess(false);
      }
    };

    void loadInterfaceAccess();
  }, []);

  useEffect(() => {
    const searchValue = employeeSearch.trim();

    // If modal is closed, input has fewer than 2 chars, or an employee is already selected with this name, don't search
    if (!isAddAccountOpen || searchValue.length < 2 || (selectedEmployee && selectedEmployee.name === searchValue)) {
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsSearchingEmployees(true);
      setEmployeeSearchError("");

      try {
        const response = await api.get("/login/employees/search", {
          params: {
            q: searchValue,
          },
          signal: controller.signal,
        });

        setEmployeeSearchResults(response.data?.employees || []);
      } catch (error) {
        if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") {
          setEmployeeSearchError("Unable to search employees.");
          setEmployeeSearchResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchingEmployees(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [employeeSearch, isAddAccountOpen]);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedInterfaces, setSelectedInterfaces] = useState({
    frontSteps: false,
    usVisa: false,
  });
  const [isInterfaceDropdownOpen, setIsInterfaceDropdownOpen] = useState(false);
  const [isEditingAccount, setIsEditingAccount] = useState(false);

  const [accountAccessList, setAccountAccessList] = useState([]);
  const [isSavingAccessLoading, setIsSavingAccessLoading] = useState(false);
  const [successModalData, setSuccessModalData] = useState(null);
  const [alreadyHasAccessModalData, setAlreadyHasAccessModalData] = useState(null);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [isDeletingAccessLoading, setIsDeletingAccessLoading] = useState(false);
  const [deleteSuccessModalData, setDeleteSuccessModalData] = useState(null);

  const handleSaveAccess = async () => {
    if (!selectedEmployee) {
      alert("Please select an employee first.");
      return;
    }

    const grantedInterfaces = [];
    if (selectedInterfaces.frontSteps) {
      grantedInterfaces.push("Front Steps Account");
    }
    if (selectedInterfaces.usVisa) {
      grantedInterfaces.push("US VISA Account");
    }

    if (grantedInterfaces.length === 0) {
      alert("Please select at least one interface from the dropdown.");
      return;
    }

    const savedEmployee = { ...selectedEmployee };
    const savedInterfaces = [...grantedInterfaces];

    setIsAddAccountOpen(false);
    setIsSavingAccessLoading(true);

    const startTime = Date.now();

    try {
      const response = await api.post("/super-admin/account-interface-access", {
        employeeId: savedEmployee.employeeId,
        name: savedEmployee.name,
        department: savedEmployee.department || "IT",
        interfaces: savedInterfaces,
      });

      // Ensure loading modal is visible for at least 800ms
      const elapsed = Date.now() - startTime;
      if (elapsed < 800) {
        await new Promise((resolve) => setTimeout(resolve, 800 - elapsed));
      }

      if (response.data?.success) {
        setAccountAccessList((prev) => {
          const existingIndex = prev.findIndex(
            (item) => item.employeeId === savedEmployee.employeeId,
          );

          const newItem = {
            employeeId: savedEmployee.employeeId,
            name: savedEmployee.name,
            department: savedEmployee.department || "IT",
            interfaces: savedInterfaces,
            createdAt: response.data?.data?.createdAt || savedEmployee.createdAt || new Date(),
            updatedAt: response.data?.data?.updatedAt || null,
            createdBy: response.data?.data?.createdBy || savedEmployee.createdBy || null,
            updatedBy: response.data?.data?.updatedBy || null,
          };

          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = newItem;
            return updated;
          }

          return [newItem, ...prev];
        });

        setSuccessModalData({
          employeeName: savedEmployee.name,
          employeeId: savedEmployee.employeeId,
          interfaces: savedInterfaces,
        });
      }
    } catch (err) {
      console.error("Failed to save interface access to database:", err);
      alert("Failed to save interface access. Please try again.");
    } finally {
      setIsSavingAccessLoading(false);

      // Reset form states
      setSelectedEmployee(null);
      setEmployeeSearch("");
      setEmployeeSearchResults([]);
      setSelectedInterfaces({
        frontSteps: false,
        usVisa: false,
      });
      setIsEditingAccount(false);
    }
  };

  const handleEditAccess = (item) => {
    setIsEditingAccount(true);
    setSelectedEmployee({
      employeeId: item.employeeId,
      name: item.name,
      department: item.department,
      createdAt: item.createdAt,
      createdBy: item.createdBy,
    });
    setSelectedInterfaces({
      frontSteps: item.interfaces.some((i) => i.toLowerCase().includes("front")),
      usVisa: item.interfaces.some((i) => i.toLowerCase().includes("visa") || i.toLowerCase().includes("workforce")),
    });
    setEmployeeSearch(item.name);
    setIsAddAccountOpen(true);
  };

  const promptDeleteAccess = (item) => {
    setEmployeeToDelete(item);
  };

  const handleConfirmDeleteAccess = async () => {
    if (!employeeToDelete) return;
    const deletedEmp = { ...employeeToDelete };
    const { employeeId } = deletedEmp;

    setEmployeeToDelete(null);
    setIsDeletingAccessLoading(true);

    const startTime = Date.now();

    try {
      const response = await api.delete(`/super-admin/account-interface-access/${employeeId}`);

      const elapsed = Date.now() - startTime;
      if (elapsed < 800) {
        await new Promise((resolve) => setTimeout(resolve, 800 - elapsed));
      }

      if (response.data?.success) {
        setAccountAccessList((prev) =>
          prev.filter((item) => item.employeeId !== employeeId),
        );
        setDeleteSuccessModalData({
          employeeName: deletedEmp.name,
          employeeId: deletedEmp.employeeId,
        });
      }
    } catch (err) {
      console.error("Failed to delete interface access from database:", err);
      alert("Failed to delete interface access. Please try again.");
    } finally {
      setIsDeletingAccessLoading(false);
    }
  };

  const closeInterfaceModal = () => {
    setIsInterfaceModalOpen(false);
    setSelectedEmployee(null);
    setEmployeeSearch("");
    setEmployeeSearchResults([]);
    setSelectedInterfaces({
      frontSteps: false,
      usVisa: false,
    });
  };

  const toggleInterfaceCheck = (key) => {
    setSelectedInterfaces((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const closeAddAccountModal = () => {
    setIsAddAccountOpen(false);
    setEmployeeSearch("");
    setEmployeeSearchResults([]);
    setEmployeeSearchError("");
    setSelectedEmployee(null);
    setSelectedInterfaces({
      frontSteps: false,
      usVisa: false,
    });
    setIsInterfaceDropdownOpen(false);
    setIsEditingAccount(false);
  };

  const closeAccessModal = () => {
    setUserToManage(null);
    setIsUserAllowed(true);
  };

  const handleEmployeeSearchChange = (value) => {
    setEmployeeSearch(value);

    // If the user starts typing/editing the input, clear any previous selection so suggestions show
    if (selectedEmployee && value !== selectedEmployee.name) {
      setSelectedEmployee(null);
    }

    if (value.trim().length < 2) {
      setEmployeeSearchResults([]);
      setIsSearchingEmployees(false);
      setEmployeeSearchError("");
    }
  };

  const handleSelectEmployee = (employee) => {
    // If not editing, check if this employee already has access entries in the table
    if (!isEditingAccount) {
      const existingEntry = accountAccessList.find(
        (item) => String(item.employeeId) === String(employee.employeeId),
      );

      if (existingEntry) {
        setAlreadyHasAccessModalData({
          employee,
          existingEntry,
        });
        return;
      }
    }

    setSelectedEmployee(employee);
    setEmployeeSearch("");
    setEmployeeSearchResults([]);
  };

  const saveAccessChange = async () => {
    if (!userToManage) {
      return;
    }

    setIsSavingAccess(true);
    setAccessError("");

    const changeSummary = {
      employeeId: userToManage.employeeId,
      name: userToManage.name,
      interfaceName: selectedInterface,
      allowed: isUserAllowed,
    };

    try {
      const response = await api.post("/super-admin/interface-access", {
        interfaceName: selectedInterface,
        user: userToManage,
        allowed: isUserAllowed,
      });

      setAccessByInterface({
        ...emptyAccessByInterface,
        ...(response.data?.accessByInterface || {}),
      });
      closeAccessModal();
      setSavedAccessChange(changeSummary);
    } catch {
      setAccessError("Unable to save interface access.");
    } finally {
      setIsSavingAccess(false);
    }
  };

  const confirmAddUserAccess = (employee) => {
    setUserToAdd(employee);
  };

  const addUserAccess = async () => {
    if (!userToAdd) {
      return;
    }

    setIsSavingAccess(true);
    setAccessError("");

    try {
      const response = await api.post("/super-admin/interface-access", {
        interfaceName: selectedInterface,
        user: userToAdd,
        allowed: true,
      });

      setAccessByInterface({
        ...emptyAccessByInterface,
        ...(response.data?.accessByInterface || {}),
      });
      setSavedAccessChange({
        employeeId: userToAdd.employeeId,
        name: userToAdd.name,
        interfaceName: selectedInterface,
        allowed: true,
        action: "added",
      });
      setEmployeeSearch("");
      setUserToAdd(null);
      setIsAddUserOpen(false);
    } catch {
      setAccessError("Unable to save interface access.");
      setUserToAdd(null);
    } finally {
      setIsSavingAccess(false);
    }
  };

  const closeAddUserModal = () => {
    setEmployeeSearch("");
    setEmployeeSearchResults([]);
    setEmployeeSearchError("");
    setUserToAdd(null);
    setIsAddUserOpen(false);
  };

  const formatAuditDate = (dateVal) => {
    if (!dateVal) return "—";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handleInterfaceChange = (interfaceName) => {
    setSelectedInterface(interfaceName);
    closeAccessModal();
    closeAddUserModal();
  };

  const tableHeaders = useMemo(
    () => ["Employee ID", "Name", "Department", "Action"],
    [],
  );
  const userName = dashboard.authUser?.name || dashboard.authUser?.username || "User";

  return (
    <section className="font-jakarta flex h-screen max-h-[100dvh] min-h-screen bg-[#eef3f7] text-sibs-primary-1 overflow-hidden">
      <AdminSidebar
        isMobileOpen={dashboard.isMobileSidebarOpen}
        modules={dashboard.modules}
        onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        onMobileClose={() => dashboard.setIsMobileSidebarOpen(false)}
        userName={userName}
        userRole={dashboard.authUser?.email || dashboard.authUser?.roleLabel || "User"}
      />

      <main className="min-w-0 flex-1 flex flex-col h-full overflow-hidden">
        <AppHeader
          title={dashboard.authUser?.roleLabel || "Super Admin"}
          subtitle="Performance Management System"
          onMenuClick={() => dashboard.setIsMobileSidebarOpen(true)}
          onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        />

        <div className="sibs-scrollbar flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5">
          <div className="space-y-4">
            <section className="sibs-card sibs-page-card-in overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-sibs-tertiary-10 bg-sibs-primary-3/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="m-0 text-base font-bold text-sibs-primary-1">
                    Account Access
                  </h3>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-sibs-tertiary-5">
                    {accountAccessList.length} accounts
                  </span>
                </div>
                <div>
                  <Button
                    type="button"
                    onClick={() => setIsAddAccountOpen(true)}
                    className="h-9 rounded-lg bg-sibs-primary-1 px-4 text-white hover:bg-sibs-tertiary-4"
                  >
                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                    Add Account Access
                  </Button>
                </div>
              </div>

              <div>
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-[#eef3f7] text-[11px] uppercase text-sibs-tertiary-5">
                    <tr>
                      <th className="whitespace-nowrap px-3 py-2.5 font-bold">Employee ID</th>
                      <th className="whitespace-nowrap px-3 py-2.5 font-bold">Employee Name</th>
                      <th className="px-3 py-2.5 font-bold">Department</th>
                      <th className="px-3 py-2.5 font-bold">Accessible Interfaces</th>
                      <th className="whitespace-nowrap px-3 py-2.5 font-bold">Audit</th>
                      <th className="whitespace-nowrap px-3 py-2.5 font-bold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sibs-tertiary-10">
                    {accountAccessList.length > 0 ? (
                      accountAccessList.map((item) => (
                        <tr
                          key={item.employeeId}
                          className="bg-[#f8fbfd] transition hover:bg-sibs-primary-2/5"
                        >
                          <td className="whitespace-nowrap px-3 py-2 font-bold text-sibs-primary-2">
                            {item.employeeId}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 font-bold text-sibs-primary-1">
                            {item.name}
                          </td>
                          <td className="px-3 py-2 text-sibs-tertiary-5 text-[11px] leading-tight">
                            {item.department}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1 items-center">
                              {item.interfaces.map((iface) => (
                                <span
                                  key={iface}
                                  className="inline-block whitespace-nowrap rounded-md bg-sibs-primary-1 px-2 py-0.5 text-[11px] font-semibold text-white shadow-xs"
                                >
                                  {iface}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-[10px]">
                            <div className="flex flex-col gap-0.5 leading-snug">
                              <span className="font-bold text-sibs-primary-1 tracking-wide">
                                CREATED <span className="font-medium text-sibs-tertiary-5 ml-1">{formatAuditDate(item.createdAt)}</span>
                                {item.createdBy && (
                                  <span className="font-normal text-sibs-tertiary-5/80 ml-1">by {item.createdBy}</span>
                                )}
                              </span>
                              <span className="font-bold text-sibs-primary-1 tracking-wide">
                                UPDATED{" "}
                                {item.updatedAt ? (
                                  <>
                                    <span className="font-medium text-sibs-tertiary-5 ml-1">{formatAuditDate(item.updatedAt)}</span>
                                    {item.updatedBy && (
                                      <span className="font-normal text-sibs-tertiary-5/80 ml-1">by {item.updatedBy}</span>
                                    )}
                                  </>
                                ) : (
                                  <span className="font-medium text-sibs-tertiary-5 ml-1">—</span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2">
                            <div className="flex items-center justify-center">
                              {/* Edit Action with Tooltip */}
                              <div className="relative group flex items-center">
                                <button
                                  type="button"
                                  onClick={() => handleEditAccess(item)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-sibs-tertiary-10 bg-white text-sibs-tertiary-5 shadow-xs transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1 hover:text-white cursor-pointer"
                                  aria-label="Edit access"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-sibs-primary-1 px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 z-10">
                                  Edit Access
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="bg-[#f8fbfd] px-4 py-8 text-center text-sm text-sibs-tertiary-5"
                        >
                          No accounts added yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>

        <AppModal isOpen={isAddAccountOpen} className="max-w-2xl min-h-[580px] flex flex-col justify-between">
          <div className="flex flex-col flex-1 min-h-0 justify-between">
            <div className="flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-sibs-tertiary-10 shrink-0">
                <p className="m-0 text-xl font-bold text-sibs-primary-1">
                  {isEditingAccount ? "Edit Account Access" : "Add Account Access"}
                </p>
              </div>

              {/* Employee Search Input (only when no employee is selected) */}
              {!selectedEmployee ? (
                <div className="mt-5 space-y-2 shrink-0">
                  <label className="text-xs font-bold text-sibs-primary-1 uppercase tracking-wider">
                    Employee Name
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sibs-tertiary-6" aria-hidden="true" />
                    <input
                      type="text"
                      value={employeeSearch}
                      onChange={(event) => handleEmployeeSearchChange(event.target.value)}
                      placeholder="Enter employee name or ID..."
                      className="form-input h-11 w-full rounded-lg pl-9 text-sm"
                    />
                  </div>
                </div>
              ) : (
                /* Selected Employee Box (replaces the input field) */
                <div className="mt-5 space-y-2 shrink-0">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-sibs-primary-1 uppercase tracking-wider">
                      Selected Employee:
                    </label>
                    {!isEditingAccount && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEmployee(null);
                          setEmployeeSearch("");
                          setEmployeeSearchResults([]);
                        }}
                        className="text-xs font-semibold text-sibs-primary-2 hover:underline cursor-pointer"
                      >
                        Change Employee
                      </button>
                    )}
                  </div>
                  <div className="rounded-xl border border-sibs-tertiary-10 bg-[#f8fbfd] p-3.5">
                    <p className="m-0 text-sm font-bold text-sibs-primary-1">
                      {selectedEmployee.name} | <span className="text-sibs-primary-2">ID: {selectedEmployee.employeeId}</span>
                    </p>
                    {selectedEmployee.department ? (
                      <p className="mt-1 mb-0 text-xs font-semibold text-sibs-primary-2">
                        {selectedEmployee.department}
                      </p>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Employee Search Results - Only show when no employee is selected */}
              {!selectedEmployee && (
                <div className="mt-3 flex-1 min-h-[160px] max-h-56 overflow-y-auto rounded-lg border border-sibs-tertiary-10 sibs-scrollbar">
                  {employeeSearch.trim().length < 2 ? (
                    <div className="bg-[#f8fbfd] px-4 py-8 text-center text-sm text-sibs-tertiary-5">
                      Type at least 2 characters to search employees.
                    </div>
                  ) : isSearchingEmployees ? (
                    <div className="bg-[#f8fbfd] px-4 py-8 text-center text-sm text-sibs-tertiary-5">
                      Searching employees...
                    </div>
                  ) : employeeSearchError ? (
                    <div className="bg-[#f8fbfd] px-4 py-8 text-center text-sm text-sibs-danger">
                      {employeeSearchError}
                    </div>
                  ) : employeeSearchResults.length > 0 ? (
                    employeeSearchResults.map((employee) => {
                      return (
                        <div
                          key={employee.employeeId}
                          onClick={() => handleSelectEmployee(employee)}
                          className="grid cursor-pointer gap-2 border-b border-sibs-tertiary-10 px-4 py-2.5 transition last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center bg-[#f8fbfd] hover:bg-sibs-primary-2/5"
                        >
                          <div className="min-w-0">
                            <p className="m-0 break-words text-sm font-bold text-sibs-primary-1">
                              {employee.name} | <span className="text-sibs-primary-2">ID: {employee.employeeId}</span>
                            </p>
                            {employee.department ? (
                              <p className="mt-0.5 mb-0 text-xs font-semibold text-sibs-primary-2">
                                {employee.department}
                              </p>
                            ) : null}
                          </div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded text-sibs-tertiary-5 bg-white border border-sibs-tertiary-10">
                            Select
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="bg-[#f8fbfd] px-4 py-8 text-center text-sm text-sibs-tertiary-5">
                      No employees found.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Accessible Interfaces Dropdown with Checkboxes - Positioned at bottom above footer buttons */}
            {selectedEmployee ? (
              <div className="mt-auto pt-6 space-y-2 shrink-0">
                <label className="text-xs font-bold text-sibs-primary-1 uppercase tracking-wider">
                  Accessible Interfaces
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsInterfaceDropdownOpen((prev) => !prev)}
                    className="flex h-11 w-full items-center justify-between rounded-lg border border-sibs-tertiary-10 bg-[#f8fbfd] px-3 text-sm font-semibold text-sibs-primary-1 hover:border-sibs-primary-1 transition cursor-pointer"
                  >
                    <div className="flex flex-wrap items-center gap-1.5 overflow-hidden">
                      {(() => {
                        const selectedNames = [];
                        if (selectedInterfaces.frontSteps) selectedNames.push("Front Steps Account");
                        if (selectedInterfaces.usVisa) selectedNames.push("US VISA Account");

                        if (selectedNames.length === 0) {
                          return (
                            <span className="text-sibs-tertiary-5 font-normal">
                              Select accessible interfaces...
                            </span>
                          );
                        }

                        return selectedNames.map((name) => (
                          <span
                            key={name}
                            className="inline-flex items-center rounded-md bg-sibs-primary-1 px-2.5 py-0.5 text-xs font-semibold text-white shadow-xs"
                          >
                            {name}
                          </span>
                        ));
                      })()}
                    </div>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-sibs-tertiary-5 transition-transform ${isInterfaceDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Dropdown Menu (opens downwards) */}
                  {isInterfaceDropdownOpen ? (
                    <div className="absolute left-0 right-0 top-full z-20 mt-1 space-y-1.5 rounded-xl border border-sibs-tertiary-10 bg-white p-3 shadow-lg">
                      <div
                        onClick={() => toggleInterfaceCheck("frontSteps")}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition select-none ${
                          selectedInterfaces.frontSteps
                            ? "border-sibs-primary-1 bg-sibs-primary-3/50"
                            : "border-sibs-tertiary-10 bg-[#f8fbfd] hover:bg-sibs-primary-2/5"
                        }`}
                      >
                        <span className="text-sm font-bold text-sibs-primary-1">
                          Front Steps Account
                        </span>
                        <input
                          type="checkbox"
                          checked={selectedInterfaces.frontSteps}
                          readOnly
                          className="pointer-events-none h-5 w-5 rounded accent-sibs-primary-1 cursor-pointer"
                        />
                      </div>

                      <div
                        onClick={() => toggleInterfaceCheck("usVisa")}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition select-none ${
                          selectedInterfaces.usVisa
                            ? "border-sibs-primary-1 bg-sibs-primary-3/50"
                            : "border-sibs-tertiary-10 bg-[#f8fbfd] hover:bg-sibs-primary-2/5"
                        }`}
                      >
                        <span className="text-sm font-bold text-sibs-primary-1">
                          US VISA Account
                        </span>
                        <input
                          type="checkbox"
                          checked={selectedInterfaces.usVisa}
                          readOnly
                          className="pointer-events-none h-5 w-5 rounded accent-sibs-primary-1 cursor-pointer"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 pt-3 border-t border-sibs-tertiary-10 shrink-0">
            <div>
              {isEditingAccount && selectedEmployee && (
                <button
                  type="button"
                  onClick={() => {
                    promptDeleteAccess({
                      employeeId: selectedEmployee.employeeId,
                      name: selectedEmployee.name,
                    });
                    closeAddAccountModal();
                  }}
                  className="h-10 rounded-lg border border-red-200 bg-white text-red-600 hover:border-red-600 hover:bg-red-600 hover:text-white px-3.5 font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Access</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeAddAccountModal}
                className="h-10 rounded-lg px-4"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!selectedEmployee}
                onClick={handleSaveAccess}
                className="h-10 rounded-lg bg-sibs-primary-1 px-5 text-white hover:bg-sibs-tertiary-4 font-semibold disabled:opacity-50"
              >
                {isEditingAccount ? "Update Access" : "Add Access"}
              </Button>
            </div>
          </div>
        </AppModal>

        {/* Loading Modal during saving */}
        <LoadingModal
          isOpen={isSavingAccessLoading}
          title="Saving Access"
          message="Updating interface access permissions..."
        />

        {/* Loading Modal during deletion */}
        <LoadingModal
          isOpen={isDeletingAccessLoading}
          title="Removing Access"
          message="Deleting interface access permissions..."
        />

        {/* Success Modal */}
        <AppModal isOpen={Boolean(successModalData)} textAlign="center" className="max-w-md">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <p className="m-0 text-lg font-bold text-sibs-primary-1">
            Access Granted Successfully!
          </p>
          <p className="mt-2 mb-0 text-sm text-sibs-tertiary-5">
            Interface access for <span className="font-bold text-sibs-primary-1">{successModalData?.employeeName}</span> (<span className="font-bold text-sibs-primary-2">{successModalData?.employeeId}</span>) has been updated.
          </p>
          <Button
            type="button"
            onClick={() => setSuccessModalData(null)}
            className="mt-6 h-10 w-full rounded-lg bg-sibs-primary-1 text-white hover:bg-sibs-tertiary-4 font-semibold"
          >
            Done
          </Button>
        </AppModal>

        {/* Deletion Success Modal */}
        <AppModal isOpen={Boolean(deleteSuccessModalData)} textAlign="center" className="max-w-md">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <p className="m-0 text-lg font-bold text-sibs-primary-1">
            Access Removed Successfully!
          </p>
          <p className="mt-2 mb-0 text-sm text-sibs-tertiary-5">
            Interface access for <span className="font-bold text-sibs-primary-1">{deleteSuccessModalData?.employeeName}</span> (<span className="font-bold text-sibs-primary-2">{deleteSuccessModalData?.employeeId}</span>) has been removed.
          </p>
          <Button
            type="button"
            onClick={() => setDeleteSuccessModalData(null)}
            className="mt-6 h-10 w-full rounded-lg bg-sibs-primary-1 text-white hover:bg-sibs-tertiary-4 font-semibold"
          >
            Done
          </Button>
        </AppModal>

        {/* Already Has Access Modal */}
        <AppModal isOpen={Boolean(alreadyHasAccessModalData)} textAlign="center" className="max-w-md" zIndex="z-[140]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-3">
            <AlertCircle className="h-8 w-8" />
          </div>
          <p className="m-0 text-lg font-bold text-sibs-primary-1">
            Employee Already Has Access
          </p>
          <p className="mt-2 mb-0 text-sm text-sibs-tertiary-5">
            <span className="font-bold text-sibs-primary-1">{alreadyHasAccessModalData?.employee?.name}</span> (<span className="font-bold text-sibs-primary-2">{alreadyHasAccessModalData?.employee?.employeeId}</span>) already has account interface access configured.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {alreadyHasAccessModalData?.existingEntry?.interfaces?.map((iface) => (
              <span
                key={iface}
                className="inline-block rounded-md bg-sibs-primary-1 px-2.5 py-0.5 text-xs font-semibold text-white"
              >
                {iface}
              </span>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAlreadyHasAccessModalData(null)}
              className="h-10 w-full rounded-lg sm:w-auto"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={() => {
                const entry = alreadyHasAccessModalData.existingEntry;
                setAlreadyHasAccessModalData(null);
                handleEditAccess(entry);
              }}
              className="h-10 w-full rounded-lg bg-sibs-primary-1 text-white hover:bg-sibs-tertiary-4 font-semibold sm:w-auto"
            >
              Edit Existing Access
            </Button>
          </div>
        </AppModal>
      </main>

      <ConfirmationModal
        isOpen={Boolean(employeeToDelete)}
        title="Remove Interface Access"
        message={`Are you sure you want to remove all interface access for ${employeeToDelete?.name || "this user"} (${employeeToDelete?.employeeId || ""})?`}
        cancelText="Cancel"
        confirmText="Remove Access"
        onCancel={() => setEmployeeToDelete(null)}
        onConfirm={handleConfirmDeleteAccess}
        tone="neutral"
      />

      <ConfirmationModal
        isOpen={dashboard.showLogoutModal}
        title="Confirm logout"
        message="Are you sure you want to logout?"
        cancelText="Cancel"
        confirmText="Logout"
        onCancel={() => dashboard.setShowLogoutModal(false)}
        onConfirm={dashboard.handleLogout}
        tone="neutral"
      />

      <LoadingModal
        isOpen={dashboard.isLoggingOut}
        title="Logging out"
        message="Please wait while we end your session."
      />
    </section>
  );
}

export default SuperAdminDashboard;
