import React from "react";
import { PERMISSIONS } from "@/config/accessControl";
import FrontStepsAiSummaryPage from "../pages/FrontStepsAiSummaryPage";
import FrontStepsAiAccountKpiPage from "../pages/FrontStepsAiAccountKpiPage";
import FrontStepsAiPmpPipPage from "../pages/FrontStepsAiPmpPipPage";
import FrontStepsAiPolicyProcessingPage from "../pages/FrontStepsAiPolicyProcessingPage";

/**
 * Route configurations for the FrontSteps AI Report module.
 * Fully isolated from US Visa AI Report routes and original FrontSteps dashboard tabs.
 */
export const frontStepsAiRouteConfigs = [
  {
    path: "/frontsteps/ai-report/summary",
    permission: PERMISSIONS.VIEW_FRONTSTEPS,
    id: "ai-summary",
    title: "Summary",
    component: FrontStepsAiSummaryPage,
  },
  {
    path: "/frontsteps/ai-report/account-kpi",
    permission: PERMISSIONS.VIEW_FRONTSTEPS,
    id: "ai-account-kpi",
    title: "Account-based KPI",
    component: FrontStepsAiAccountKpiPage,
  },
  {
    path: "/frontsteps/ai-report/pmp-pip",
    permission: PERMISSIONS.VIEW_FRONTSTEPS,
    id: "ai-pmp-pip",
    title: "KPI (PMP/PIP)",
    component: FrontStepsAiPmpPipPage,
  },
  {
    path: "/frontsteps/ai-report/policy-processing",
    permission: PERMISSIONS.VIEW_FRONTSTEPS,
    id: "ai-policy-processing",
    title: "Policy Processing",
    component: FrontStepsAiPolicyProcessingPage,
  },
];

export {
  FrontStepsAiSummaryPage,
  FrontStepsAiAccountKpiPage,
  FrontStepsAiPmpPipPage,
  FrontStepsAiPolicyProcessingPage,
};
