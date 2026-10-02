// Manages dashboard auth state, sidebar modules, and logout flow.
import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  Database,
  Filter,
  FolderDown,
  Gauge,
  LayoutDashboard,
  LineChart,
  Mail,
  PhoneCall,
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
    const viewGraphsModule = {
      name: "Wow Report",
      icon: BarChart3,
      path: "/dashboard/wfm/view-graphs",
      submodules: [
        {
          name: "Calls",
          key: "calls",
          icon: PhoneCall,
          path: "/dashboard/wfm/view-graphs?section=calls",
        },
        {
          name: "Emails",
          key: "emails",
          icon: Mail,
          path: "/dashboard/wfm/view-graphs?section=emails",
        },
        {
          name: "QA",
          key: "qa",
          icon: ClipboardCheck,
          path: "/dashboard/wfm/view-graphs?section=qa",
        },
        {
          name: "Occupancy & HC",
          key: "occupancy",
          icon: Users,
          path: "/dashboard/wfm/view-graphs?section=occupancy",
        },
      ],
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
    const taskOrderLedgerModule = {
      name: "Task-Order Ledger",
      icon: Award,
      path: "/dashboard/wfm/task-order-ledger",
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

    const adminAccessNum = Number(
      authUser?.adminAccess ?? authUser?.admin_access ?? 0,
    );

    if (["admin", "bod", "som"].includes(role) || adminAccessNum === 7) {
      const adminModules = [
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

    const isWfmView = role === "wfm" || location.pathname.startsWith("/dashboard/wfm");

    if (isWfmView) {
      return [
        viewGraphsModule,
        employeeLedgerModule,
        taskOrderLedgerModule,
        importDataModule,
        importRepositoryModule,
        occupancyModule,
        {
          name: "History Logs",
          icon: ClipboardList,
          path: "/dashboard/wfm/history-logs",
        },
      ];
    }

    return [viewGraphsModule];
  }, [authUser, role, location.pathname]);

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
