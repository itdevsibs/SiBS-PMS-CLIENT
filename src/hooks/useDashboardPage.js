// Manages dashboard auth state, sidebar modules, and logout flow.
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ClipboardList,
  Filter,
  FolderDown,
  Gauge,
  LineChart,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getAuthDisplayName, getAuthUser, isAuthenticated } from "@/lib/auth";
import { handleLogout as handleAuthLogout } from "@/lib/axios/api-template";
import { recordWfmLogout } from "@/lib/axios/wfm-history-logs";

const roleIcons = {
  admin: ShieldCheck,
  wfm: FolderDown,
  agent: Gauge,
  om: Filter,
  tl: ClipboardList,
  client: LineChart,
  bod: BarChart3,
};

// Central dashboard state shared by all role-based dashboard pages.
function useDashboardPage() {
  const navigate = useNavigate();
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

    if (role === "wfm") {
      return [
        dashboardModule,
        {
          name: "Import Data",
          icon: ClipboardList,
          path: "/dashboard/wfm/import-data",
        },
        viewGraphsModule,
        {
          name: "History Logs",
          icon: ClipboardList,
          path: "/dashboard/wfm/history-logs",
        },
      ];
    }

    if (["admin", "bod", "som"].includes(role)) {
      const adminModules = [
        dashboardModule,
        viewGraphsModule,
      ];

      if (role === "admin") {
        adminModules.push({
          name: "History Logs",
          icon: ClipboardList,
          path: "/dashboard/superadmin/history-logs",
        });
      }

      return adminModules;
    }

    return [dashboardModule];
  }, [Icon, authUser, role]);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const handleLogout = async () => {
    setShowLogoutModal(false);
    setIsLoggingOut(true);

    if (role === "wfm") {
      try {
        await recordWfmLogout();
      } catch (error) {
        console.warn("Could not record WFM logout:", error?.response?.data || error?.message || error);
      }
    }

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
