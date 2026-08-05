import { useEffect, useMemo, useState } from "react";
import { Search, Settings2, UserPlus } from "lucide-react";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AppHeader from "@/components/layout/AppHeader";
import AppModal from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import LoadingModal from "@/components/ui/loading-modal";
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
];

const emptyAccessByInterface = Object.fromEntries(
  userInterfaces.map((interfaceName) => [interfaceName, []]),
);

function SuperAdminDashboard() {
  const dashboard = useDashboardPage();
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
        const response = await api.get("/super-admin/interface-access");
        setAccessByInterface({
          ...emptyAccessByInterface,
          ...(response.data?.accessByInterface || {}),
        });
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

    if (!isAddUserOpen || searchValue.length < 2) {
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
  }, [employeeSearch, isAddUserOpen]);

  const openAccessModal = (user) => {
    setUserToManage(user);
    setIsUserAllowed(true);
  };

  const closeAccessModal = () => {
    setUserToManage(null);
    setIsUserAllowed(true);
  };

  const handleEmployeeSearchChange = (value) => {
    setEmployeeSearch(value);

    if (value.trim().length < 2) {
      setEmployeeSearchResults([]);
      setIsSearchingEmployees(false);
      setEmployeeSearchError("");
    }
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
    <section className="font-jakarta flex min-h-screen bg-[#eef3f7] text-sibs-primary-1">
      <AdminSidebar
        isMobileOpen={dashboard.isMobileSidebarOpen}
        modules={dashboard.modules}
        onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        onMobileClose={() => dashboard.setIsMobileSidebarOpen(false)}
        userName={userName}
        userRole={dashboard.authUser?.email || dashboard.authUser?.roleLabel || "User"}
      />

      <main className="min-w-0 flex-1">
        <AppHeader
          title={`${dashboard.authUser?.roleLabel || "User"} Dashboard`}
          subtitle="Performance Management System"
          onMenuClick={() => dashboard.setIsMobileSidebarOpen(true)}
        />

        <div className="sibs-scrollbar max-h-[calc(100vh-74px)] overflow-y-auto p-3 sm:p-4 lg:p-5">
      <div className="space-y-4">
      <section className="sibs-card sibs-page-card-in overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-sibs-tertiary-10 bg-sibs-primary-3/30 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 text-base font-bold text-sibs-primary-1">
              {selectedInterface} Access Users
            </h3>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-sibs-tertiary-5">
              {accessUsers.length} users
            </span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={selectedInterface}
              onChange={(event) => handleInterfaceChange(event.target.value)}
              className="form-input h-9 rounded-lg py-0 sm:w-80"
            >
              {userInterfaces.map((interfaceName) => (
                <option key={interfaceName} value={interfaceName}>
                  {interfaceName} ({accessByInterface[interfaceName]?.length || 0})
                </option>
              ))}
            </select>
            <Button
              type="button"
              onClick={() => setIsAddUserOpen(true)}
              disabled={isLoadingAccess || isSavingAccess}
              className="h-9 rounded-lg bg-sibs-primary-1 px-4 text-white hover:bg-sibs-tertiary-4"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Add User Access
            </Button>
          </div>
        </div>
        {accessError ? (
          <div className="border-b border-sibs-danger/20 bg-sibs-danger/10 px-5 py-2 text-sm font-semibold text-sibs-danger">
            {accessError}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] table-fixed border-collapse text-left text-sm">
            <colgroup>
              <col className="w-[150px]" />
              <col className="w-[260px]" />
              <col className="w-[300px]" />
              <col className="w-[150px]" />
            </colgroup>
            <thead className="bg-[#eef3f7] text-xs uppercase text-sibs-tertiary-5">
              <tr>
                {tableHeaders.map((header) => (
                  <th key={header} className="whitespace-nowrap px-4 py-2 font-bold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-sibs-tertiary-10">
              {isLoadingAccess ? (
                <tr>
                  <td colSpan={tableHeaders.length} className="bg-[#f8fbfd] px-4 py-8 text-center text-sm text-sibs-tertiary-5">
                    Loading interface access...
                  </td>
                </tr>
              ) : accessUsers.length > 0 ? (
                accessUsers.map((user) => (
                <tr key={`${selectedInterface}-${user.employeeId}`} className="bg-[#f8fbfd] transition hover:bg-sibs-primary-2/5">
                  <td className="whitespace-nowrap px-4 py-2.5 font-bold text-sibs-primary-1">
                    <span className="block truncate" title={user.employeeId}>
                      {user.employeeId}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-sibs-tertiary-5">
                    <span className="block truncate" title={user.name}>
                      {user.name}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-sibs-tertiary-5">
                    <span className="block truncate" title={user.department || user.account || ""}>
                      {user.department || user.account || "-"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => openAccessModal(user)}
                      disabled={isSavingAccess}
                      className="h-7 rounded-lg px-2.5 text-xs"
                    >
                      <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Access
                    </Button>
                  </td>
                </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={tableHeaders.length} className="bg-[#f8fbfd] px-4 py-8 text-center text-sm text-sibs-tertiary-5">
                    No users added to this interface yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AppModal isOpen={Boolean(userToManage)} className="max-w-md">
        <p className="m-0 text-lg font-bold text-sibs-primary-1">
          Interface Access
        </p>
        <p className="mt-1 mb-0 text-sm text-sibs-tertiary-5">
          {userToManage?.name} - {selectedInterface}
        </p>

        <label className="mt-4 flex cursor-pointer items-center gap-2 rounded-lg border border-sibs-tertiary-10 bg-[#f8fbfd] px-3 py-2">
          <input
            type="checkbox"
            checked={isUserAllowed}
            onChange={(event) => setIsUserAllowed(event.target.checked)}
            className="h-3.5 w-3.5 accent-sibs-primary-1"
          />
          <span className="text-xs font-semibold text-sibs-primary-1">
            Give this user access to {selectedInterface}
          </span>
        </label>

        <div className="mt-5 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={closeAccessModal}
            className="h-10 rounded-lg px-4"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={saveAccessChange}
            disabled={isSavingAccess}
            className="h-10 rounded-lg bg-sibs-primary-1 px-4 text-white hover:bg-sibs-tertiary-4"
          >
            {isSavingAccess ? "Saving..." : "Save"}
          </Button>
        </div>
      </AppModal>

      <AppModal isOpen={isAddUserOpen} className="max-w-3xl">
        <p className="m-0 text-lg font-bold text-sibs-primary-1">
          Add User Access
        </p>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sibs-tertiary-6" aria-hidden="true" />
          <input
            value={employeeSearch}
            onChange={(event) => handleEmployeeSearchChange(event.target.value)}
            className="form-input h-10 w-full rounded-lg pl-9"
            placeholder="Search by employee ID or first name..."
            type="text"
          />
        </div>

        <div className="mt-4 max-h-72 overflow-y-auto rounded-lg border border-sibs-tertiary-10">
          {employeeSearch.trim().length < 2 ? (
            <div className="bg-[#f8fbfd] px-4 py-8 text-center text-sm text-sibs-tertiary-5">
              Enter at least 2 characters to search.
            </div>
          ) : isSearchingEmployees ? (
            <div className="bg-[#f8fbfd] px-4 py-8 text-center text-sm text-sibs-tertiary-5">
              Searching employees...
            </div>
          ) : employeeSearchError ? (
            <div className="bg-[#f8fbfd] px-4 py-8 text-center text-sm text-sibs-danger">
              {employeeSearchError}
            </div>
          ) : filteredEmployees.length > 0 ? (
            filteredEmployees.map((employee) => (
              <div
                key={`${selectedInterface}-${employee.employeeId}`}
                className="grid gap-3 border-b border-sibs-tertiary-10 bg-[#f8fbfd] px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_72px] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="m-0 break-words text-sm font-bold text-sibs-primary-1">
                    {employee.name}
                  </p>
                  <p className="mt-1 mb-0 break-words text-xs font-bold text-sibs-primary-2">
                    {employee.employeeId}
                  </p>
                  <p className="mt-1 mb-0 break-all text-xs text-sibs-tertiary-5" title={employee.email}>
                    {employee.email || "-"}
                  </p>
                  <p className="mt-1 mb-0 break-words text-xs text-sibs-tertiary-5" title={employee.department || employee.account}>
                    {employee.department || employee.account || "-"}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => confirmAddUserAccess(employee)}
                  disabled={isSavingAccess}
                  className="h-8 rounded-lg bg-sibs-primary-1 px-3 text-white hover:bg-sibs-tertiary-4 sm:justify-self-end"
                >
                  Add
                </Button>
              </div>
            ))
          ) : (
            <div className="bg-[#f8fbfd] px-4 py-8 text-center text-sm text-sibs-tertiary-5">
              No employees found.
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={closeAddUserModal}
            className="h-10 rounded-lg px-4"
          >
            Close
          </Button>
        </div>
      </AppModal>

      <ConfirmationModal
        isOpen={Boolean(userToAdd)}
        title="Add user access"
        message={`Add ${userToAdd?.employeeId || "this user"} to the ${selectedInterface} table?`}
        cancelText="Cancel"
        confirmText="Add"
        onCancel={() => setUserToAdd(null)}
        onConfirm={addUserAccess}
        tone="neutral"
      />

      <AppModal isOpen={Boolean(savedAccessChange)} className="max-w-sm" textAlign="center">
        <p className="m-0 text-lg font-bold text-sibs-primary-1">
          Access updated
        </p>
        <p className="mt-2 mb-0 text-sm text-sibs-tertiary-5">
          {savedAccessChange?.action === "added"
            ? `${savedAccessChange?.employeeId} was added to ${savedAccessChange?.interfaceName}.`
            : `${savedAccessChange?.employeeId} ${savedAccessChange?.allowed ? "keeps access to" : "was removed from"} ${savedAccessChange?.interfaceName}.`}
        </p>
        <Button
          type="button"
          onClick={() => setSavedAccessChange(null)}
          className="mt-5 h-10 w-full rounded-lg bg-sibs-primary-1 text-white hover:bg-sibs-tertiary-4"
        >
          Done
        </Button>
      </AppModal>
      </div>
        </div>
      </main>

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
