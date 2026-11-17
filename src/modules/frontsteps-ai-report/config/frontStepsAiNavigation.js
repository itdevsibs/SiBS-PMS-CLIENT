import {
  LayoutGrid,
  Activity,
  Target,
  TrendingUp,
  Users,
  ClipboardList,
  Award,
  BarChart3,
  Database,
  BrainCircuit,
  FileCog,
  Settings,
  ShieldCheck,
} from "lucide-react";

/**
 * FrontSteps Navigation structure with isolated AI Report group
 * Hierarchy:
 * 1. Overview
 * 2. Performance Management
 * 3. Reporting & Data
 * 4. AI Report (Collapsible group)
 *    - Summary
 *    - Account-based KPI
 *    - KPI (PMP/PIP)
 *    - Policy Processing
 * 5. System
 */
export const FRONTSTEPS_NAV_MODULES = [
  {
    key: "overview",
    name: "Overview",
    icon: LayoutGrid,
    submodules: [
      { id: "dashboard-summary", name: "Summary", icon: Activity, path: "/frontsteps?tab=dashboard-summary" },
      { id: "dashboard-account-based", name: "Account-based KPI", icon: Target, path: "/frontsteps?tab=dashboard-account-based" },
      { id: "dashboard-kpi-indiv", name: "KPI (PMP/PIP)", icon: TrendingUp, path: "/frontsteps?tab=dashboard-kpi-indiv" },
    ],
  },
  {
    key: "performance-management",
    name: "Performance Management",
    icon: Users,
    submodules: [
      {
        id: "employee-performance",
        name: "Employee Performance",
        icon: Users,
        isLocked: true,
        statusBadge: "In Progress",
      },
      {
        id: "coaching-management",
        name: "Coaching Management",
        icon: ClipboardList,
        isLocked: true,
        statusBadge: "In Progress",
      },
      {
        id: "performance-improvement",
        name: "Performance Improvement",
        icon: TrendingUp,
        isLocked: true,
        statusBadge: "In Progress",
      },
      {
        id: "quarterly-incentives",
        name: "Quarterly Incentives",
        icon: Award,
        isLocked: true,
        statusBadge: "In Progress",
      },
    ],
  },
  {
    key: "reporting-data",
    name: "Reporting & Data",
    icon: BarChart3,
    submodules: [
      { id: "data-management", name: "Data Management", icon: Database, path: "/frontsteps?tab=data-management" },
    ],
  },
  {
    key: "ai-report",
    name: "AI Report",
    icon: BrainCircuit,
    isAiGroup: true,
    submodules: [
      {
        id: "ai-summary",
        name: "Summary",
        icon: Activity,
        path: "/frontsteps/ai-report/summary",
        reportId: "fs-summary",
      },
      {
        id: "ai-account-kpi",
        name: "Account-based KPI",
        icon: Target,
        path: "/frontsteps/ai-report/account-kpi",
        reportId: "fs-account-kpi",
      },
      {
        id: "ai-pmp-pip",
        name: "KPI (PMP/PIP)",
        icon: TrendingUp,
        path: "/frontsteps/ai-report/pmp-pip",
        reportId: "fs-pmp-pip",
      },
      {
        id: "ai-policy-processing",
        name: "Policy Processing",
        icon: FileCog,
        path: "/frontsteps/ai-report/policy-processing",
        reportId: "fs-policy-processing",
      },
    ],
  },
  {
    key: "system",
    name: "System",
    icon: Settings,
    submodules: [
      { id: "administration", name: "Administration", icon: Settings, path: "/frontsteps?tab=administration" },
      { id: "audit-trails", name: "Audit Trails", icon: ShieldCheck, path: "/frontsteps?tab=audit-trails" },
    ],
  },
];
