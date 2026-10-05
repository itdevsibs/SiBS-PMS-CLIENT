// Centralizes frontend role resolution, dashboard routing, and module permissions.
export const ACCESS = Object.freeze({
  EMPLOYEE: 0,
  TA: 1,
  HR: 2,
  HR_ADMIN: 3,
  FINANCE: 4,
  OM: 5,
  BOD: 6,
  SUPER_ADMIN: 7,
  TL: 8,
  WFM: 9,
  SOM: 10,
  MASTER_DATA: 11,
});

export const PERMISSIONS = Object.freeze({
  VIEW_OWN_PERFORMANCE: "VIEW_OWN_PERFORMANCE",
  VIEW_TEAM_PERFORMANCE: "VIEW_TEAM_PERFORMANCE",
  VIEW_OPERATIONS_PERFORMANCE: "VIEW_OPERATIONS_PERFORMANCE",
  VIEW_WOW_REPORT: "VIEW_WOW_REPORT",
  WFM_IMPORT_DATA: "WFM_IMPORT_DATA",
  WFM_IMPORT_REPOSITORY: "WFM_IMPORT_REPOSITORY",
  WFM_HISTORY_LOGS: "WFM_HISTORY_LOGS",
  WFM_TASK_ORDER_LEDGER: "WFM_TASK_ORDER_LEDGER",
  VIEW_EMPLOYEE_LEDGER: "VIEW_EMPLOYEE_LEDGER",
  VIEW_OCCUPANCY: "VIEW_OCCUPANCY",
  SUPER_ADMIN_ACCESS: "SUPER_ADMIN_ACCESS",
  SUPER_ADMIN_HISTORY: "SUPER_ADMIN_HISTORY",
  CLIENT_DASHBOARD: "CLIENT_DASHBOARD",
});

const ACCESS_PRIORITY = [
  ACCESS.SUPER_ADMIN,
  ACCESS.BOD,
  ACCESS.MASTER_DATA,
  ACCESS.SOM,
  ACCESS.OM,
  ACCESS.WFM,
  ACCESS.TL,
];

const ROLE_BY_ACCESS = Object.freeze({
  [ACCESS.OM]: "om",
  [ACCESS.BOD]: "bod",
  [ACCESS.SUPER_ADMIN]: "admin",
  [ACCESS.TL]: "tl",
  [ACCESS.WFM]: "wfm",
  [ACCESS.SOM]: "som",
  [ACCESS.MASTER_DATA]: "masterdata",
});

const ROLE_LABELS = Object.freeze({
  admin: "Administrator",
  bod: "Board of Directors",
  client: "Client",
  employee: "Employee",
  masterdata: "Master Data / Ledger Admin",
  om: "Operations Manager",
  som: "Senior Operations Manager",
  tl: "Team Leader",
  wfm: "Workforce Management",
});

const HOME_ROUTES = Object.freeze({
  admin: "/dashboard/superadmin",
  bod: "/dashboard/bod",
  client: "/dashboard/client",
  employee: "/dashboard/agent",
  masterdata: "/dashboard/employee-master-data",
  om: "/dashboard/om",
  som: "/dashboard/som",
  tl: "/dashboard/tl",
  wfm: "/dashboard/wfm/view-graphs",
});

const PERMISSION_RULES = Object.freeze({
  [PERMISSIONS.VIEW_OWN_PERFORMANCE]: {
    roles: ["employee"],
  },
  [PERMISSIONS.VIEW_TEAM_PERFORMANCE]: {
    access: [ACCESS.TL],
  },
  [PERMISSIONS.VIEW_OPERATIONS_PERFORMANCE]: {
    access: [ACCESS.OM],
  },
  [PERMISSIONS.VIEW_WOW_REPORT]: {
    access: [
      ACCESS.OM,
      ACCESS.BOD,
      ACCESS.SUPER_ADMIN,
      ACCESS.TL,
      ACCESS.WFM,
      ACCESS.SOM,
    ],
  },
  [PERMISSIONS.WFM_IMPORT_DATA]: {
    access: [ACCESS.WFM],
  },
  [PERMISSIONS.WFM_IMPORT_REPOSITORY]: {
    access: [ACCESS.WFM],
  },
  [PERMISSIONS.WFM_HISTORY_LOGS]: {
    access: [ACCESS.WFM],
  },
  [PERMISSIONS.WFM_TASK_ORDER_LEDGER]: {
    access: [ACCESS.WFM],
  },
  [PERMISSIONS.VIEW_EMPLOYEE_LEDGER]: {
    access: [
      ACCESS.BOD,
      ACCESS.SUPER_ADMIN,
      ACCESS.WFM,
      ACCESS.SOM,
      ACCESS.MASTER_DATA,
    ],
  },
  [PERMISSIONS.VIEW_OCCUPANCY]: {
    access: [ACCESS.BOD, ACCESS.SUPER_ADMIN, ACCESS.WFM, ACCESS.SOM],
  },
  [PERMISSIONS.SUPER_ADMIN_ACCESS]: {
    access: [ACCESS.SUPER_ADMIN],
  },
  [PERMISSIONS.SUPER_ADMIN_HISTORY]: {
    access: [ACCESS.SUPER_ADMIN],
  },
  [PERMISSIONS.CLIENT_DASHBOARD]: {
    roles: ["client"],
  },
});

export const DASHBOARD_MODULES = Object.freeze([
  {
    key: "own-performance",
    name: "My Performance",
    iconKey: "gauge",
    path: "/dashboard/agent",
    permission: PERMISSIONS.VIEW_OWN_PERFORMANCE,
  },
  {
    key: "team-performance",
    name: "Team Performance",
    iconKey: "clipboard-list",
    path: "/dashboard/tl",
    permission: PERMISSIONS.VIEW_TEAM_PERFORMANCE,
  },
  {
    key: "operations-performance",
    name: "Operations Performance",
    iconKey: "filter",
    path: "/dashboard/om",
    permission: PERMISSIONS.VIEW_OPERATIONS_PERFORMANCE,
  },
  {
    key: "wow-report",
    name: "Wow Report",
    iconKey: "bar-chart",
    path: "/dashboard/wfm/view-graphs",
    activePaths: ["/dashboard/bod", "/dashboard/som"],
    permission: PERMISSIONS.VIEW_WOW_REPORT,
    submodules: [
      {
        name: "Calls",
        key: "calls",
        iconKey: "phone-call",
        path: "/dashboard/wfm/view-graphs?section=calls",
      },
      {
        name: "Emails",
        key: "emails",
        iconKey: "mail",
        path: "/dashboard/wfm/view-graphs?section=emails",
      },
      {
        name: "QA",
        key: "qa",
        iconKey: "clipboard-check",
        path: "/dashboard/wfm/view-graphs?section=qa",
      },
      {
        name: "Occupancy & HC",
        key: "occupancy",
        iconKey: "users",
        path: "/dashboard/wfm/view-graphs?section=occupancy",
      },
    ],
  },
  {
    key: "employee-ledger",
    name: "Employee Ledger",
    iconKey: "database",
    path: "/dashboard/employee-master-data",
    permission: PERMISSIONS.VIEW_EMPLOYEE_LEDGER,
  },
  {
    key: "task-order-ledger",
    name: "Task-Order Ledger",
    iconKey: "award",
    path: "/dashboard/wfm/task-order-ledger",
    permission: PERMISSIONS.WFM_TASK_ORDER_LEDGER,
  },
  {
    key: "import-data",
    name: "Import Data",
    iconKey: "clipboard-list",
    path: "/dashboard/wfm/import-data",
    permission: PERMISSIONS.WFM_IMPORT_DATA,
  },
  {
    key: "import-repository",
    name: "Import Repository",
    iconKey: "folder-down",
    path: "/dashboard/wfm/import-repository",
    permission: PERMISSIONS.WFM_IMPORT_REPOSITORY,
  },
  {
    key: "occupancy",
    name: "Occupancy",
    iconKey: "users",
    path: "/dashboard/occupancy",
    permission: PERMISSIONS.VIEW_OCCUPANCY,
  },
  {
    key: "wfm-history",
    name: "History Logs",
    iconKey: "clipboard-list",
    path: "/dashboard/wfm/history-logs",
    permission: PERMISSIONS.WFM_HISTORY_LOGS,
  },
  {
    key: "super-admin",
    name: "Super Admin",
    iconKey: "shield-check",
    path: "/dashboard/superadmin",
    permission: PERMISSIONS.SUPER_ADMIN_ACCESS,
  },
  {
    key: "super-admin-history",
    name: "Access History",
    iconKey: "clipboard-list",
    path: "/dashboard/superadmin/history-logs",
    permission: PERMISSIONS.SUPER_ADMIN_HISTORY,
  },
]);

const ROUTE_PERMISSION_RULES = Object.freeze([
  { paths: ["/dashboard/agent", "/dashboard/agents"], permission: PERMISSIONS.VIEW_OWN_PERFORMANCE },
  { paths: ["/dashboard/tl"], permission: PERMISSIONS.VIEW_TEAM_PERFORMANCE },
  { paths: ["/dashboard/om"], permission: PERMISSIONS.VIEW_OPERATIONS_PERFORMANCE },
  { paths: ["/dashboard/bod", "/dashboard/som", "/dashboard/wfm", "/dashboard/wfm/view-graphs"], permission: PERMISSIONS.VIEW_WOW_REPORT },
  { paths: ["/dashboard/wfm/import-data"], permission: PERMISSIONS.WFM_IMPORT_DATA },
  { paths: ["/dashboard/wfm/import-repository"], permission: PERMISSIONS.WFM_IMPORT_REPOSITORY },
  { paths: ["/dashboard/wfm/history-logs"], permission: PERMISSIONS.WFM_HISTORY_LOGS },
  { paths: ["/dashboard/wfm/task-order-ledger", "/dashboard/wfm/skills-ledger"], permission: PERMISSIONS.WFM_TASK_ORDER_LEDGER },
  { paths: ["/dashboard/employee-master-data", "/dashboard/masterdata"], permission: PERMISSIONS.VIEW_EMPLOYEE_LEDGER },
  { paths: ["/dashboard/occupancy", "/dashboard/wfm/occupancy"], permission: PERMISSIONS.VIEW_OCCUPANCY },
  { paths: ["/dashboard/superadmin"], permission: PERMISSIONS.SUPER_ADMIN_ACCESS },
  { paths: ["/dashboard/superadmin/history-logs"], permission: PERMISSIONS.SUPER_ADMIN_HISTORY },
  { paths: ["/dashboard/client"], permission: PERMISSIONS.CLIENT_DASHBOARD },
]);

function normalizeRoleName(value) {
  const role = String(value || "").trim().toLowerCase();

  if (role === "agent") return "employee";
  if (role === "superadmin" || role === "super-admin") return "admin";
  if (role === "master-data") return "masterdata";

  return ROLE_LABELS[role] ? role : "";
}

export function getUserAdminAccess(user) {
  const directValue = Number(
    user?.adminAccess ??
      user?.admin_access ??
      user?.accessValue ??
      user?.access_value ??
      user?.access ??
      0,
  );

  if (Number.isFinite(directValue) && directValue > 0) {
    return directValue;
  }

  const assignedAccounts = Array.isArray(user?.assignedAccounts)
    ? user.assignedAccounts
    : [];

  const values = new Set(
    assignedAccounts
      .map((item) =>
        Number(
          item?.adminAccess ??
            item?.admin_access ??
            item?.accessValue ??
            item?.access_value ??
            item?.access ??
            0,
        ),
      )
      .filter((value) => Number.isFinite(value) && value > 0),
  );

  return ACCESS_PRIORITY.find((value) => values.has(value)) || 0;
}

export function resolveUserRole(user) {
  const access = getUserAdminAccess(user);

  if (ROLE_BY_ACCESS[access]) {
    return ROLE_BY_ACCESS[access];
  }

  const explicitRole = normalizeRoleName(
    user?.resolvedRole ??
      user?.resolved_role ??
      user?.role ??
      user?.userRole ??
      user?.user_role,
  );

  return explicitRole || "employee";
}

export function getRoleLabel(roleOrUser) {
  const role =
    typeof roleOrUser === "string"
      ? normalizeRoleName(roleOrUser) || "employee"
      : resolveUserRole(roleOrUser);

  return ROLE_LABELS[role] || ROLE_LABELS.employee;
}

export function getHomeRouteForUser(user) {
  return HOME_ROUTES[resolveUserRole(user)] || HOME_ROUTES.employee;
}

export function normalizeDashboardPath(path) {
  const normalizedPath = String(path || "").trim();

  const mappings = {
    "/admin/dashboard": "/dashboard/superadmin",
    "/dashboard/admin": "/dashboard/superadmin",
    "/employee/dashboard": "/dashboard/agent",
    "/dashboard/employee": "/dashboard/agent",
    "/wfm/dashboard": "/dashboard/wfm/view-graphs",
    "/dashboard/wfm": "/dashboard/wfm/view-graphs",
    "/som/dashboard": "/dashboard/som",
  };

  return mappings[normalizedPath] || normalizedPath;
}

export function hasPermissionForUser(user, permission) {
  if (!permission || !user) return false;

  const rule = PERMISSION_RULES[permission];
  if (!rule) return false;

  const access = getUserAdminAccess(user);
  const role = resolveUserRole(user);

  return Boolean(
    rule.access?.includes(access) ||
      rule.roles?.includes(role),
  );
}

export function getAllowedModules(user) {
  if (!user) return [];

  return DASHBOARD_MODULES.filter((module) =>
    hasPermissionForUser(user, module.permission),
  );
}

export function canAccessDashboardPath(user, pathname) {
  if (!user) return false;

  const cleanPath = String(pathname || "").split("?")[0].replace(/\/$/, "") || "/";
  const rule = ROUTE_PERMISSION_RULES.find((item) =>
    item.paths.includes(cleanPath),
  );

  return rule ? hasPermissionForUser(user, rule.permission) : false;
}

export function resolveDashboardPath(user, response = {}) {
  const homeRoute = getHomeRouteForUser(user);
  const serverPath =
    response?.redirectTo ||
    response?.user?.redirectTo ||
    response?.data?.redirectTo ||
    response?.data?.user?.redirectTo ||
    response?.user?.dashboard ||
    response?.data?.dashboard ||
    response?.data?.user?.dashboard ||
    user?.redirectTo ||
    user?.dashboard ||
    "";

  const normalizedPath = normalizeDashboardPath(serverPath);

  if (normalizedPath && canAccessDashboardPath(user, normalizedPath)) {
    return normalizedPath;
  }

  return homeRoute;
}
