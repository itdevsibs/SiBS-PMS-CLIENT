import { useContext } from "react";
import { AiReportContext } from "@/context/AiReportContext";

export function useAiReport() {
  const context = useContext(AiReportContext);
  return context || {
    isAiReport: true,
    reportId: null,
    title: "",
    category: "",
    hermesEnabled: false,
  };
}

export default useAiReport;
