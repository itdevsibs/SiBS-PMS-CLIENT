import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Headphones,
  Mail,
  PhoneCall,
  TrendingUp,
  Users,
} from "lucide-react";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AppHeader from "@/components/layout/AppHeader";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import LoadingModal from "@/components/ui/loading-modal";
import OccupancyTable from "@/components/tables/OccupancyTable";
import useDashboardPage from "@/hooks/useDashboardPage";

export default function OccupancyPage() {
  const dashboard = useDashboardPage();
  const userRole = String(dashboard.authUser?.role || "").toLowerCase();
  const canAccess = ["wfm", "admin", "superadmin", "bod", "som"].includes(userRole);

  // Ready for co-developer's API response / upload data integration:
  // e.g. const { occupancyData, isLoading, refresh } = useOccupancyData();
  const [occupancyData, setOccupancyData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeRecords, setActiveRecords] = useState([]);

  // Check if any mapped occupancy data was saved to localStorage by uploader or testing
  useEffect(() => {
    try {
      const stored =
        localStorage.getItem("sibs-occupancy-records") ||
        localStorage.getItem("sibs-occupancy-data");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOccupancyData(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Calculate live KPI metrics from active/filtered records (or raw uploaded dataset)
  const summaryStats = useMemo(() => {
    const dataSource =
      activeRecords && activeRecords.length > 0
        ? activeRecords
        : occupancyData && occupancyData.length > 0
        ? occupancyData
        : [];

    if (dataSource.length === 0) {
      return {
        totalEmployees: 0,
        actualEfficiency: "0%",
        phoneOccupancy: "0%",
        handledCalls: 0,
        actualEmails: 0,
      };
    }
    const uniqueEmployees = new Set(
      dataSource
        .map((r) => r.name || r.Name || r["Agent Name"] || r.agent_name || r.employee_name)
        .filter(Boolean)
    );
    const totalCalls = dataSource.reduce((acc, r) => {
      const val = parseFloat(r.handledCalls || r["Handled Calls"] || r.calls_handled || 0);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    const totalEmails = dataSource.reduce((acc, r) => {
      const val = parseFloat(
        r.actualEmails ||
        r["Actual # of Emails"] ||
        r["Actual # of Emails (Email/Hour)"] ||
        r["Actual # Emails"] ||
        r.emails_handled ||
        0
      );
      return acc + (isNaN(val) ? 0 : val);
    }, 0);

    const effValues = dataSource
      .map((r) =>
        parseFloat(String(r.actualEfficiency || r["Actual Efficiency"] || "").replace("%", ""))
      )
      .filter((v) => !isNaN(v));
    const avgEff =
      effValues.length > 0
        ? Math.round(effValues.reduce((a, b) => a + b, 0) / effValues.length) + "%"
        : "0%";

    const occValues = dataSource
      .map((r) =>
        parseFloat(String(r.phoneOccupancy || r["Phone Occupancy"] || "").replace("%", ""))
      )
      .filter((v) => !isNaN(v));
    const avgOcc =
      occValues.length > 0
        ? Math.round(occValues.reduce((a, b) => a + b, 0) / occValues.length) + "%"
        : "0%";

    return {
      totalEmployees: uniqueEmployees.size || dataSource.length,
      actualEfficiency: avgEff,
      phoneOccupancy: avgOcc,
      handledCalls: Math.round(totalCalls),
      actualEmails: Math.round(totalEmails),
    };
  }, [occupancyData, activeRecords]);

  return (
    <section className="font-jakarta flex h-screen max-h-[100dvh] min-h-screen bg-[#eef3f7] text-sibs-primary-1 overflow-hidden">
      <AdminSidebar
        isMobileOpen={dashboard.isMobileSidebarOpen}
        modules={dashboard.modules}
        onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        onMobileClose={() => dashboard.setIsMobileSidebarOpen(false)}
        userName={dashboard.userName}
        userRole={
          dashboard.authUser?.email ||
          dashboard.authUser?.roleLabel ||
          "User"
        }
      />

      <main className="min-w-0 flex-1 flex flex-col h-full overflow-hidden">
        <AppHeader
          title={`${dashboard.authUser?.roleLabel || "User"} Dashboard`}
          subtitle="Performance Management System"
          onMenuClick={() => dashboard.setIsMobileSidebarOpen(true)}
          onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        />

        <div className="sibs-scrollbar flex-1 overflow-y-auto p-3 sm:p-3.5">
          {!canAccess ? (
            <div className="sibs-card p-6 text-center">
              <AlertCircle className="mx-auto mb-3 text-amber-500" size={34} />
              <h2 className="m-0 text-lg font-bold text-sibs-primary-1">
                Occupancy Access Required
              </h2>
              <p className="mt-2 mb-0 text-sm text-sibs-tertiary-5">
                Occupancy reporting is available for WFM, BOD, SOM, and Admin dashboards.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header Title Banner */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-xs">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="flex h-9.5 w-9.5 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Users className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="m-0 text-sm sm:text-base md:text-lg font-bold text-slate-900 truncate">
                      Occupancy & Efficiency Overview
                    </h1>
                    <p className="m-0 text-[11px] sm:text-xs text-slate-500 truncate">
                      Phone and email metrics, intervals, and agent actual efficiency
                    </p>
                  </div>
                </div>
              </div>

              {/* High-level KPI summary cards - Compact corporate sizing */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {/* 1. Total Employees */}
                <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-2xs transition-all hover:border-slate-300">
                  <div className="flex items-center justify-between gap-1.5">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate"
                      title="Total Employees"
                    >
                      Total Employees
                    </span>
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-600">
                      <Users size={11} />
                    </div>
                  </div>
                  <div className="mt-0.5 text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {summaryStats.totalEmployees}
                  </div>
                </div>

                {/* 2. Actual Efficiency */}
                <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-2xs transition-all hover:border-slate-300">
                  <div className="flex items-center justify-between gap-1.5">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate"
                      title="Actual Efficiency"
                    >
                      Actual Efficiency
                    </span>
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-600">
                      <TrendingUp size={11} />
                    </div>
                  </div>
                  <div className="mt-0.5 text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {summaryStats.actualEfficiency}
                  </div>
                </div>

                {/* 3. Phone Occupancy */}
                <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-2xs transition-all hover:border-slate-300">
                  <div className="flex items-center justify-between gap-1.5">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate"
                      title="Phone Occupancy"
                    >
                      Phone Occupancy
                    </span>
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-600">
                      <Headphones size={11} />
                    </div>
                  </div>
                  <div className="mt-0.5 text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {summaryStats.phoneOccupancy}
                  </div>
                </div>

                {/* 4. Handled Calls */}
                <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-2xs transition-all hover:border-slate-300">
                  <div className="flex items-center justify-between gap-1.5">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate"
                      title="Handled Calls"
                    >
                      Handled Calls
                    </span>
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-600">
                      <PhoneCall size={11} />
                    </div>
                  </div>
                  <div className="mt-0.5 text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {summaryStats.handledCalls}
                  </div>
                </div>

                {/* 5. Actual # of Emails (Email/Hour) */}
                <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-2xs col-span-2 sm:col-span-1 transition-all hover:border-slate-300">
                  <div className="flex items-center justify-between gap-1.5">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate"
                      title="Actual # of Emails (Email/Hour)"
                    >
                      Actual # of Emails
                    </span>
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-600">
                      <Mail size={11} />
                    </div>
                  </div>
                  <div className="mt-0.5 flex items-baseline gap-1">
                    <span className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                      {summaryStats.actualEmails}
                    </span>
                    <span className="text-[9.5px] font-medium text-slate-400">
                      email/hr
                    </span>
                  </div>
                </div>
              </div>

              {/* Occupancy Data Grid Component */}
              <OccupancyTable
                data={occupancyData}
                isLoading={isLoading}
                onFilteredDataChange={setActiveRecords}
              />
            </div>
          )}
        </div>
      </main>

      <ConfirmationModal
        isOpen={dashboard.showLogoutModal}
        title="Confirm logout"
        message="Are you sure you want to logout?"
        cancelText="Cancel"
        confirmText="Logout"
        onCancel={() => dashboard.setShowLogoutModal(false)}
        onConfirm={dashboard.handleLogout}
        tone="neutral"
      />

      <LoadingModal
        isOpen={dashboard.isLoggingOut}
        title="Logging out"
        message="Please wait while we end your session."
      />
    </section>
  );
}
