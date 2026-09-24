// Manages dashboard auth state, sidebar modules, and logout flow.
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ClipboardList,
  Database,
  Filter,
  FolderDown,
  Gauge,
  LayoutDashboard,
  LineChart,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { getAuthDisplayName, getAuthUser, isAuthenticated } from "@/lib/auth";
import { handleLogout as handleAuthLogout } from "@/lib/axios/api-template";

const roleIcons = {
  admin: LayoutDashboard,
  wfm: LayoutDashboard,
  som: LayoutDashboard,
  agent: Gauge,
  om: Filter,
  tl: ClipboardList,
  client: LineChart,
  bod: BarChart3,
  masterdata: Database,
};

// Central dashboard state shared by all role-based dashboard pages.
function useDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [authUser] = useState(() => getAuthUser());

  const role = authUser?.role || "agent";
  const Icon = roleIcons[role] || Gauge;
  const modules = useMemo(() => {
    // Builds the sidebar modules allowed for the signed-in user's role.
    const dashboardModule = {
      name: "Dashboard",
      icon: Icon,
      path: authUser?.dashboardPath || "/dashboard",
    };
    const viewGraphsModule = {
      name: "View Graphs",
      icon: BarChart3,
      path: "/dashboard/wfm/view-graphs",
    };
    const occupancyModule = {
      name: "Occupancy",
      icon: Users,
      path: "/dashboard/occupancy",
    };
    const employeeLedgerModule = {
      name: "Employee Ledger",
      icon: Database,
      path: "/dashboard/employee-master-data",
    };
    const importDataModule = {
      name: "Import Data",
      icon: ClipboardList,
      path: "/dashboard/wfm/import-data",
    };
    const importRepositoryModule = {
      name: "Import Repository",
      icon: FolderDown,
      path: "/dashboard/wfm/import-repository",
    };

    if (role === "masterdata") {
      return [employeeLedgerModule];
    }

    const isWfmView = role === "wfm" || location.pathname.startsWith("/dashboard/wfm");

    if (isWfmView) {
      return [
        dashboardModule,
        employeeLedgerModule,
        importDataModule,
        importRepositoryModule,
        viewGraphsModule,
        occupancyModule,
        {
          name: "History Logs",
          icon: ClipboardList,
          path: "/dashboard/wfm/history-logs",
        },
      ];
    }

    const adminAccessNum = Number(
      authUser?.adminAccess ?? authUser?.admin_access ?? 0,
    );

    if (["admin", "bod", "som"].includes(role) || adminAccessNum === 7) {
      const adminModules = [
        dashboardModule,
        employeeLedgerModule,
        viewGraphsModule,
        occupancyModule,
      ];

      if (role === "admin" || adminAccessNum === 7) {
        adminModules.push({
          name: "History Logs",
          icon: ClipboardList,
          path: "/dashboard/superadmin/history-logs",
        });
      }

      return adminModules;
    }

    return [dashboardModule];
  }, [Icon, authUser, role, location.pathname]);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    setShowLogoutModal(false);
    setIsLoggingOut(true);

    // Keeps the loading modal visible before clearing the local session.
    window.setTimeout(() => {
      void handleAuthLogout(true);
    }, 2500);
  };

  return {
    authUser,
    userName: getAuthDisplayName(authUser),
    handleLogout,
    isLoggingOut,
    isMobileSidebarOpen,
    modules,
    setIsMobileSidebarOpen,
    setShowLogoutModal,
    showLogoutModal,
  };
}

export default useDashboardPage;
