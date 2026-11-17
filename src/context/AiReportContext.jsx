// Centralizes context and state for AI Report pages.
import { createContext, useContext } from "react";

export const AiReportContext = createContext({
  isAiReport: false,
  reportId: null,
  title: "",
  category: "",
});

export const useAiReport = () => useContext(AiReportContext);
