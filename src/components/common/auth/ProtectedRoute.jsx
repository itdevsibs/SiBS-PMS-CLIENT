// Protects dashboard routes with the same permissions used by the sidebar.
import { Navigate, useLocation } from "react-router-dom";

import { useAuthAccess } from "@/context/AuthAccessContext";

export default function ProtectedRoute({ children, permission = null }) {
  const location = useLocation();
  const {
    authUser,
    canAccessRoute,
    hasPermission,
    homeRoute,
  } = useAuthAccess();

  if (!authUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const isAllowed = permission
    ? hasPermission(permission)
    : canAccessRoute(location.pathname);

  if (!isAllowed) {
    return <Navigate to={homeRoute} replace />;
  }

  return children;
}
