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

import { clearAuthSession, getAuthUser, isAuthenticated } from "@/lib/auth";

const roleIcons = {
  admin: ShieldCheck,
  wfm: FolderDown,
  agent: Gauge,
  om: Filter,
  tl: ClipboardList,
  client: LineChart,
  bod: BarChart3,
};

function useDashboardPage() {
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [authUser] = useState(() => getAuthUser());

  const role = authUser?.role || "agent";
  const Icon = roleIcons[role] || Gauge;
  const modules = useMemo(() => {
    const dashboardModule = {
      name: role === "wfm" ? "Dashboard" : `${authUser?.roleLabel || "User"} Dashboard`,
      icon: Icon,
      path: authUser?.dashboardPath || "/dashboard",
    };

    if (role === "wfm") {
      return [
        dashboardModule,
        {
          name: "Import Data",
          icon: ClipboardList,
          path: "/dashboard/wfm/import-data",
        },
        {
          name: "View Graphs",
          icon: BarChart3,
          path: "/dashboard/wfm/view-graphs",
        },
        {
          name: "History Logs",
          icon: ClipboardList,
          path: "/dashboard/wfm/history-logs",
        },
      ];
    }

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
  }, [Icon, authUser, role]);

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
    }, 2500);
  };

  return {
    authUser,
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
