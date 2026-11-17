import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AIWowReportPage from "./AIWowReportPage";

export default function AIOccupancyHCPage() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("section") !== "occupancy") {
      params.set("section", "occupancy");
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  return <AIWowReportPage />;
}
