// Provides one client-side source of truth for authenticated role and UI access.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  canAccessDashboardPath,
  getAllowedModules,
  getHomeRouteForUser,
  getRoleLabel,
  getUserAdminAccess,
  hasPermissionForUser,
  resolveUserRole,
} from "@/config/accessControl";
import {
  AUTH_CHANGED_EVENT,
  getAuthUser,
} from "@/lib/auth";

const AuthAccessContext = createContext(null);

export function AuthAccessProvider({ children }) {
  const [authUser, setAuthUser] = useState(() => getAuthUser());

  const refreshAuthUser = useCallback(() => {
    setAuthUser(getAuthUser());
  }, []);

  useEffect(() => {
    const handleAuthChanged = () => {
      refreshAuthUser();
    };

    const handleStorage = (event) => {
      if (
        event.key === "pms-auth-user" ||
        event.key === "sibsAuthenticatedUser"
      ) {
        refreshAuthUser();
      }
    };

    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
      window.removeEventListener("storage", handleStorage);
    };
  }, [refreshAuthUser]);

  const role = useMemo(() => resolveUserRole(authUser), [authUser]);
  const adminAccess = useMemo(() => getUserAdminAccess(authUser), [authUser]);
  const roleLabel = useMemo(() => getRoleLabel(authUser), [authUser]);
  const homeRoute = useMemo(() => getHomeRouteForUser(authUser), [authUser]);
  const modules = useMemo(() => getAllowedModules(authUser), [authUser]);

  const hasPermission = useCallback(
    (permission) => hasPermissionForUser(authUser, permission),
    [authUser],
  );

  const canAccessRoute = useCallback(
    (pathname) => canAccessDashboardPath(authUser, pathname),
    [authUser],
  );

  const value = useMemo(
    () => ({
      adminAccess,
      authUser,
      canAccessRoute,
      hasPermission,
      homeRoute,
      modules,
      refreshAuthUser,
      role,
      roleLabel,
    }),
    [
      adminAccess,
      authUser,
      canAccessRoute,
      hasPermission,
      homeRoute,
      modules,
      refreshAuthUser,
      role,
      roleLabel,
    ],
  );

  return (
    <AuthAccessContext.Provider value={value}>
      {children}
    </AuthAccessContext.Provider>
  );
}

export function useAuthAccess() {
  const context = useContext(AuthAccessContext);

  if (!context) {
    throw new Error("useAuthAccess must be used inside AuthAccessProvider");
  }

  return context;
}

export default AuthAccessContext;
