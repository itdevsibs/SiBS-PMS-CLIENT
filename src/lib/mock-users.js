export const MOCK_USERS = [
  {
    id: "superadmin",
    username: "superadmin",
    password: "superadmin123",
    name: "Super Admin",
    role: "superadmin",
    roleLabel: "Super Admin",
    dashboardPath: "/dashboard/superadmin",
    description: "Manage system-level access, role coverage, and mock readiness views.",
  },
  {
    id: "wfm",
    username: "wfm",
    password: "wfm123",
    name: "Work Force Management",
    role: "wfm",
    roleLabel: "Work Force Management",
    dashboardPath: "/dashboard/wfm",
    description: "Download and manage client tool files for upload workflows.",
  },
  {
    id: "agent",
    username: "agent",
    password: "agent123",
    name: "Agent User",
    role: "agent",
    roleLabel: "Agent",
    dashboardPath: "/dashboard/agent",
    description: "View personal performance results and KPI progress.",
  },
  {
    id: "om",
    username: "om",
    password: "om123",
    name: "Operations Management",
    role: "om",
    roleLabel: "Operations Management",
    dashboardPath: "/dashboard/om",
    description: "Filter accounts and review agent performance by account.",
  },
  {
    id: "tl",
    username: "tl",
    password: "tl123",
    name: "Team Leader",
    role: "tl",
    roleLabel: "Team Leader",
    dashboardPath: "/dashboard/tl",
    description: "Review agent performance for the assigned account.",
  },
  {
    id: "client",
    username: "client",
    password: "client123",
    name: "Client User",
    role: "client",
    roleLabel: "Client",
    dashboardPath: "/dashboard/client",
    description: "View KPI results per agent or overall account performance.",
  },
  {
    id: "bod",
    username: "bod",
    password: "bod123",
    name: "Board of Directors",
    role: "bod",
    roleLabel: "Board of Directors",
    dashboardPath: "/dashboard/bod",
    description: "Check performance across all accounts.",
  },
];

export function authenticateMockUser({ username, password }) {
  const normalizedUsername = String(username || "").trim().toLowerCase();

  return MOCK_USERS.find(
    (user) =>
      user.username.toLowerCase() === normalizedUsername &&
      user.password === password,
  );
}

export function getDashboardModule(user) {
  return [
    {
      name: `${user?.roleLabel || "User"} Dashboard`,
      path: user?.dashboardPath || "/dashboard",
    },
  ];
}
