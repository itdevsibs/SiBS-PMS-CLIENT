import { useState, useCallback, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Clock, Filter, ChevronDown } from "lucide-react";

import AIReportLayout from "../AIReportLayout";
import AiPageHeader from "../../components/common/AiPageHeader";
import AiInsightCard from "../../components/common/AiInsightCard";
import AiKpiSectionTabs from "../../components/wow/AiKpiSectionTabs";
import useAiWowData from "../../hooks/useAiWowData";

import CallKpiDashboard from "@/components/modules/kpi/CallKpiDashboard";
import EmailKpiDashboard from "@/components/modules/kpi/EmailKpiDashboard";
import QualityAuditKpiDashboard from "@/components/modules/kpi/QualityAuditKpiDashboard";
import OccupancyKpiDashboard from "@/components/modules/kpi/OccupancyKpiDashboard";

import MultiSelectDropdown from "@/components/common/filters/MultiSelectDropdown";
import DatePicker from "@/components/common/filters/DatePicker";
import { SOURCE_OPTIONS, PERIOD_OPTIONS } from "../../adapters/wowDataAdapter";

export default function AIWowReportPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Read section from query params (?section=calls|emails|qa|occupancy)
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const requestedSection = (searchParams.get("section") || "").toLowerCase();
  const activeSection = ["calls", "emails", "qa", "occupancy"].includes(requestedSection)
    ? requestedSection
    : "";

  const [showFilters, setShowFilters] = useState(true);

  const {
    filters,
    setFilters,
    loading,
    error,
    callKpiData,
    emailKpiData,
    qaKpiData,
    occupancyKpiData,
    taskOrderOptions,
    countryOptions,
    skillOptions,
    refreshData,
  } = useAiWowData(activeSection);

  // Sync section from URL
  const handleSelectSection = useCallback((sectionKey) => {
    const params = new URLSearchParams(location.search);
    if (sectionKey) {
      params.set("section", sectionKey);
    } else {
      params.delete("section");
    }
    navigate(`${location.pathname}?${params.toString()}`);
  }, [location.pathname, location.search, navigate]);

  const showCalls = !activeSection || activeSection === "calls";
  const showEmails = !activeSection || activeSection === "emails";
  const showQa = !activeSection || activeSection === "qa";
  const showOccupancy = !activeSection || activeSection === "occupancy";

  // Section title
  const pageTitle = {
    calls: "Calls Performance (AI Report)",
    emails: "Emails Performance (AI Report)",
    qa: "Quality Audit Performance (AI Report)",
    occupancy: "Occupancy & HC Performance (AI Report)",
  }[activeSection] || "WoW Report Executive Dashboard (AI Report)";

  const insightsList = useMemo(() => {
    const list = [];
    if (activeSection === "calls" || !activeSection) {
      list.push("Calls volume, SLA response times, and abandonment thresholds monitored under active policy baselines.");
    }
    if (activeSection === "emails" || !activeSection) {
      list.push("Email resolution rates and turnaround compliance tracked against standard operational guidelines.");
    }
    if (activeSection === "qa" || !activeSection) {
      list.push("Quality Audit evaluations aggregated for automated scorecard and policy-driven coaching insights.");
    }
    if (activeSection === "occupancy" || !activeSection) {
      list.push("Workforce occupancy, utilization, and absenteeism aligned with client contract staffing targets.");
    }
    return list;
  }, [activeSection]);

  return (
    <AIReportLayout
      title={pageTitle}
      subtitle="WoW KPI Analytics • Authorized Read-Only Isolation • Hermes AI Integration Ready"
    >
      <div className="space-y-3 pb-6">
        {/* Module Header */}
        <AiPageHeader
          title={pageTitle}
          subtitle="AI-isolated WoW performance reporting displaying authorized operational data."
          category="WoW Report"
          onRefresh={refreshData}
          isLoading={loading}
          extraActions={(
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
            >
              <Filter size={13} className="text-[#082B60]" />
              <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`} />
            </button>
          )}
        />

        {/* AI Insight Card */}
        <AiInsightCard
          title="Hermes Policy & KPI Intelligence"
          category="WoW Report"
          insights={insightsList}
          policyNotice="Repository policies define KPI targets, SLA weights, and performance bands."
        />

        {/* Section Navigation Tabs */}
        <AiKpiSectionTabs
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
        />

        {/* Filter Controls */}
        {showFilters && (
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 items-end">
              {/* Account / Source */}
              {activeSection !== "qa" && (
                <MultiSelectDropdown
                  label="Account / Source"
                  value={filters.sourceSystem}
                  onChange={(val) => setFilters((prev) => ({ ...prev, sourceSystem: val }))}
                  options={SOURCE_OPTIONS}
                  placeholder="All Sources"
                />
              )}

              {/* Task Order */}
              <MultiSelectDropdown
                label="Task Order"
                value={filters.taskOrder}
                onChange={(val) => setFilters((prev) => ({ ...prev, taskOrder: val }))}
                options={taskOrderOptions}
                placeholder="All Task Orders"
              />

              {/* Country */}
              {activeSection !== "qa" && (
                <MultiSelectDropdown
                  label="Country"
                  value={filters.country}
                  onChange={(val) => setFilters((prev) => ({ ...prev, country: val }))}
                  options={countryOptions}
                  placeholder="All Countries"
                />
              )}

              {/* Skill */}
              {activeSection !== "qa" && (
                <MultiSelectDropdown
                  label="Skill"
                  value={filters.skill}
                  onChange={(val) => setFilters((prev) => ({ ...prev, skill: val }))}
                  options={skillOptions}
                  placeholder="All Skills"
                />
              )}

              {/* Period */}
              <MultiSelectDropdown
                label="Period"
                value={filters.period}
                onChange={(val) => setFilters((prev) => ({ ...prev, period: val }))}
                options={PERIOD_OPTIONS}
                placeholder="Period"
              />

              {/* Date Filter */}
              <DatePicker
                label={filters.period === "custom" ? "Date From" : "Reference Date"}
                value={filters.period === "custom" ? filters.dateFrom : filters.referenceDate}
                onChange={(e) => {
                  const val = typeof e === "string" ? e : e?.target?.value;
                  setFilters((prev) =>
                    filters.period === "custom"
                      ? { ...prev, dateFrom: val }
                      : { ...prev, referenceDate: val }
                  );
                }}
              />
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-xs font-semibold">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* KPI Dashboards View */}
        <div className="space-y-4">
          {showCalls && (
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
              <CallKpiDashboard
                data={callKpiData || {}}
                period={filters.period}
                showSummaryCards={activeSection === "calls"}
                isSubmodule={activeSection === "calls"}
                showFilters={showFilters}
                isLoading={loading}
                onSectionClick={!activeSection ? () => handleSelectSection("calls") : null}
              />
            </div>
          )}

          {showEmails && (
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
              <EmailKpiDashboard
                data={emailKpiData || {}}
                period={filters.period}
                showSummaryCards={activeSection === "emails"}
                isSubmodule={activeSection === "emails"}
                showFilters={showFilters}
                isLoading={loading}
                onSectionClick={!activeSection ? () => handleSelectSection("emails") : null}
              />
            </div>
          )}

          {showQa && (
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
              <QualityAuditKpiDashboard
                data={qaKpiData || {}}
                period={filters.period}
                showSummaryCards={activeSection === "qa"}
                isSubmodule={activeSection === "qa"}
                showFilters={showFilters}
                isLoading={loading}
                onSectionClick={!activeSection ? () => handleSelectSection("qa") : null}
              />
            </div>
          )}

          {showOccupancy && (
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
              <OccupancyKpiDashboard
                data={occupancyKpiData?.occupancy || {}}
                utilizationData={occupancyKpiData?.utilization || null}
                absenteeismData={occupancyKpiData?.absenteeism || null}
                period={filters.period}
                showSummaryCards={activeSection === "occupancy"}
                isSubmodule={activeSection === "occupancy"}
                showFilters={showFilters}
                isLoading={loading}
                onSectionClick={!activeSection ? () => handleSelectSection("occupancy") : null}
              />
            </div>
          )}
        </div>
      </div>
    </AIReportLayout>
  );
}
