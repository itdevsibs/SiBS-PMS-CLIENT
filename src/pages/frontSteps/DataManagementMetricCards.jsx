import React from "react";

/**
 * 6 Summary Metric Cards across desktop matching approved design.
 * Order:
 * 1. Total Records (Navy)
 * 2. Stored Records (Navy)
 * 3. Unmatched (Dark Orange #B45309 or #C2410C)
 * 4. Import Issues (Dark Red #B91C1C)
 * 5. Uploaded Policies (Navy)
 * 6. Approved Policies (Green #15803D)
 */
export default function DataManagementMetricCards({ stats = {}, policies = [] }) {
  const totalRecords = (stats.total || 0).toLocaleString();
  const storedRecords = (stats.stored || 0).toLocaleString();
  const unmatchedRecords = (stats.unmapped || 0).toLocaleString();
  const importIssues = (stats.issues || 0).toLocaleString();
  const uploadedPolicies = (policies.length || 0).toLocaleString();
  const approvedPolicies = policies.filter(
    (p) => (p.approval_status || "").toLowerCase() === "approved"
  ).length.toLocaleString();

  const cards = [
    {
      title: "Total Records",
      value: totalRecords,
      valueColor: "text-[#12376B]",
      subtext: "Uploaded Rows",
    },
    {
      title: "Stored Records",
      value: storedRecords,
      valueColor: "text-[#12376B]",
      subtext: "In PMS tables",
    },
    {
      title: "Unmatched",
      value: unmatchedRecords,
      valueColor: "text-[#B45309]",
      subtext: "Awaiting Alias",
    },
    {
      title: "Import Issues",
      value: importIssues,
      valueColor: "text-[#B91C1C]",
      subtext: "Validation checks",
    },
    {
      title: "Uploaded Policies",
      value: uploadedPolicies,
      valueColor: "text-[#12376B]",
      subtext: "Files in repository",
    },
    {
      title: "Approved Policies",
      value: approvedPolicies,
      valueColor: "text-[#15803D]",
      subtext: "Active & governing",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0">
      {cards.map((c, idx) => (
        <div
          key={idx}
          className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-[#DCE4EE] bg-white p-3.5 shadow-2xs min-h-[92px]"
        >
          {/* Thin navy accent line across the top */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#12376B]" />

          <div className="pt-0.5">
            <span className="block text-[11px] font-bold text-[#526582] truncate">
              {c.title}
            </span>
            <div className={`text-[21px] font-extrabold ${c.valueColor} tracking-tight leading-tight mt-1`}>
              {c.value}
            </div>
          </div>

          <span className="block text-[11px] font-medium text-[#526582] mt-0.5 truncate">
            {c.subtext}
          </span>
        </div>
      ))}
    </div>
  );
}

