import { recordAuditLog } from "@/lib/audit-logger";
// Manages dashboard shell state and consumes centralized access-controlled modules.
import { useMemo, useState } from "react";
import {
  Award,
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  Database,
  Filter,
  FolderArchive,
  FolderDown,
  Gauge,
  LineChart,
  Mail,
  MessageCircle,
  PhoneCall,
  ShieldCheck,
  Users,
  UsersRound,
} from "lucide-react";

import { useAuthAccess } from "@/context/AuthAccessContext";
import { useSidebar } from "@/context/SidebarContext";
import { getAuthDisplayName } from "@/lib/auth";
import { handleLogout as handleAuthLogout } from "@/lib/axios/api-template";

const moduleIcons = {
  award: Award,
  "bar-chart": BarChart3,
  "clipboard-check": ClipboardCheck,
  "clipboard-list": ClipboardList,
  database: Database,
  filter: Filter,
  "folder-archive": FolderArchive,
  "folder-down": FolderDown,
  gauge: Gauge,
  "line-chart": LineChart,
  mail: Mail,
  "message-circle": MessageCircle,
  "phone-call": PhoneCall,
  "shield-check": ShieldCheck,
  users: Users,
  "users-round": UsersRound,
};

function hydrateModuleIcons(module) {
  return {
    ...module,
    icon: moduleIcons[module.iconKey] || Gauge,
    submodules: Array.isArray(module.submodules)
      ? module.submodules.map((submodule) => ({
          ...submodule,
          icon: moduleIcons[submodule.iconKey] || Gauge,
        }))
      : module.submodules,
  };
}

function useDashboardPage() {
  const {
    authUser,
    hasPermission,
    modules: accessModules,
    role,
    roleLabel,
  } = useAuthAccess();

  const sidebar = useSidebar();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const modules = useMemo(
    () => accessModules.map(hydrateModuleIcons),
    [accessModules],
  );

  const handleLogout = () => {
    setShowLogoutModal(false);
    setIsLoggingOut(true);

    try {
      recordAuditLog({
        action: "Logout",
        module: "Authentication",
        description: "Logged out of session",
        user: authUser,
      });
    } catch {
      // ignore
    }

    window.setTimeout(() => {
      void handleAuthLogout(true);
    }, 2500);
  };

  return {
    authUser,
    handleLogout,
    hasPermission,
    isLoggingOut,
    // Sidebar state shared across PMS pages
    isMobileSidebarOpen: sidebar.isMobileOpen,
    setIsMobileSidebarOpen: sidebar.setIsMobileOpen,
    isSidebarHidden: sidebar.isSidebarHidden,
    setIsSidebarHidden: sidebar.setIsSidebarHidden,
    isCollapsed: sidebar.isCollapsed,
    setIsCollapsed: sidebar.setIsCollapsed,
    toggleSidebarHidden: sidebar.toggleHidden,
    toggleCollapsed: sidebar.toggleCollapsed,
    modules,
    role,
    roleLabel,
    setShowLogoutModal,
    showLogoutModal,
    userName: getAuthDisplayName(authUser),
  };
}

export default useDashboardPage;
