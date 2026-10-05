// Manages dashboard shell state and consumes centralized access-controlled modules.
import { useMemo, useState } from "react";
import {
  Award,
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  Database,
  Filter,
  FolderDown,
  Gauge,
  Mail,
  PhoneCall,
  ShieldCheck,
  Users,
} from "lucide-react";

import { useAuthAccess } from "@/context/AuthAccessContext";
import { getAuthDisplayName } from "@/lib/auth";
import { handleLogout as handleAuthLogout } from "@/lib/axios/api-template";

const moduleIcons = {
  award: Award,
  "bar-chart": BarChart3,
  "clipboard-check": ClipboardCheck,
  "clipboard-list": ClipboardList,
  database: Database,
  filter: Filter,
  "folder-down": FolderDown,
  gauge: Gauge,
  mail: Mail,
  "phone-call": PhoneCall,
  "shield-check": ShieldCheck,
  users: Users,
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

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const modules = useMemo(
    () => accessModules.map(hydrateModuleIcons),
    [accessModules],
  );

  const handleLogout = () => {
    setShowLogoutModal(false);
    setIsLoggingOut(true);

    window.setTimeout(() => {
      void handleAuthLogout(true);
    }, 2500);
  };

  return {
    authUser,
    handleLogout,
    hasPermission,
    isLoggingOut,
    isMobileSidebarOpen,
    modules,
    role,
    roleLabel,
    setIsMobileSidebarOpen,
    setShowLogoutModal,
    showLogoutModal,
    userName: getAuthDisplayName(authUser),
  };
}

export default useDashboardPage;
