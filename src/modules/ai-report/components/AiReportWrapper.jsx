// Provides a reusable wrapper for AI Report pages, preparing for future Hermes AI integration.
import { useMemo } from "react";
import { AiReportContext } from "@/context/AiReportContext";

export default function AiReportWrapper({
  reportId,
  title = "",
  category = "",
  children,
}) {
  const contextValue = useMemo(
    () => ({
      isAiReport: true,
      reportId,
      title,
      category,
      // Hermes extension anchor: future AI integration features (e.g. streaming insights,
      // policy interpretation, Hermes prompt connectors) dock here cleanly without
      // modifying the underlying report components.
      hermesEnabled: false,
    }),
    [reportId, title, category],
  );

  return (
    <AiReportContext.Provider value={contextValue}>
      <div
        className="ai-report-page-wrapper w-full h-full relative"
        data-ai-report="true"
        data-report-id={reportId}
        data-report-category={category}
      >
        {children}
      </div>
    </AiReportContext.Provider>
  );
}
