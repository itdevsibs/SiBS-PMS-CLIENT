import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AIWowReportPage from "./AIWowReportPage";

export default function AIEmailsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("section") !== "emails") {
      params.set("section", "emails");
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  return <AIWowReportPage />;
}
