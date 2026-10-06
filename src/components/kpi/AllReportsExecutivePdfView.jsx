import React from "react";
import { Users } from "lucide-react";
import { getCallAxisTicks } from "./callKpiDashboardUtils";

function formatK(val) {
  const num = Math.round(Number(val) || 0);
  if (num >= 1000) {
    const k = num / 1000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
  }
  return String(num);
}

export default function AllReportsExecutivePdfView({
  callData = {},
  emailData = {},
  qualityAuditData = {},
  occupancyData = {},
  selectedSections = null,
}) {
  const showCalls = !selectedSections || selectedSections.includes("calls");
  const showEmails = !selectedSections || selectedSections.includes("emails");
  const showQa = !selectedSections || selectedSections.includes("qa");
  const showOccupancy = !selectedSections || selectedSections.includes("occupancy");
  const showSection3 = showQa || showOccupancy;

  const activeCount = (showCalls ? 1 : 0) + (showEmails ? 1 : 0) + (showSection3 ? 1 : 0);
  const isSingleSection = activeCount === 1;
  const isTwoSections = activeCount === 2;
  const isCallsStacked = isSingleSection && showCalls;

  const callChartHeight = isCallsStacked ? "365px" : isTwoSections ? "370px" : isSingleSection ? "365px" : "235px";
  const callAxisHeight = isCallsStacked ? "325px" : isTwoSections ? "330px" : isSingleSection ? "325px" : "198px";

  const emailChartHeight = isTwoSections ? "370px" : isSingleSection ? "365px" : "225px";
  const emailAxisHeight = isTwoSections ? "330px" : isSingleSection ? "325px" : "190px";

  const qaChartHeight = isTwoSections ? "370px" : isSingleSection ? "365px" : "220px";
  const qaAxisHeight = isTwoSections ? "330px" : isSingleSection ? "325px" : "185px";

  const occChartHeight = isTwoSections ? "370px" : isSingleSection ? "365px" : "220px";
  const occAxisHeight = isTwoSections ? "330px" : isSingleSection ? "325px" : "185px";

  // Extract canonical week/period labels from the active graphs
  const callList = Array.isArray(callData?.series) ? callData.series : [];
  const emailList = Array.isArray(emailData?.series) ? emailData.series : [];
  const qaList = Array.isArray(qualityAuditData?.series) ? qualityAuditData.series : [];
  const occList = Array.isArray(occupancyData?.series) ? occupancyData.series : [];

  // Determine chronological week labels present on the graph
  const weekLabels =
    callList.length > 0
      ? callList.map((s) => s.label)
      : emailList.length > 0
      ? emailList.map((s) => s.label)
      : qaList.length > 0
      ? qaList.map((s) => s.label)
      : occList.length > 0
      ? occList.map((s) => s.label)
      : [];

  const callMap = new Map(callList.map((s) => [s.label, s]));
  const emailMap = new Map(emailList.map((s) => [s.label, s]));

  // Build series strictly from active graph data
  const callSeries = weekLabels.map((lbl, idx) => {
    const item = callMap.get(lbl) || callList[idx] || {};
    const vol = Number(item.callsOffered ?? item.volume ?? item.interactionCount ?? 0);
    const handled = Number(item.callsHandled ?? item.handled ?? item.answeredCalls ?? 0);
    const sla = Number(item.handledWithSla ?? item.handledWithinSla ?? item.handledWithSlt ?? 0);
    const ansRate = Number(item.answerRatePct ?? item.answerRate ?? (vol > 0 ? (handled / vol) * 100 : 0));
    const sl = Number(item.serviceLevelPct ?? item.serviceLevel ?? (handled > 0 ? (sla / handled) * 100 : 0));
    const ahtSec = Number(item.ahtSeconds ?? item.averageHandleSeconds ?? item.aht ?? item.averageHandleTime ?? 0);

    return {
      label: lbl || item.label || `Week ${idx + 1}`,
      volume: vol,
      handled,
      handledWithSla: sla,
      answerRate: ansRate,
      serviceLevel: sl,
      aht: ahtSec,
    };
  });

  const emailSeries = weekLabels.map((lbl, idx) => {
    const item = emailMap.get(lbl) || emailList[idx] || {};
    const vol = Number(item.emailVolume ?? item.volume ?? 0);
    const handled = Number(item.handled ?? item.emailsHandled ?? 0);
    const sla = Number(item.handledWithinSla ?? item.handledWithSla ?? 0);
    const err = Number(item.errPct ?? (vol > 0 ? (handled / vol) * 100 : 0));
    const sl = Number(item.serviceLevelPct ?? item.serviceLevel ?? (handled > 0 ? (sla / handled) * 100 : 0));

    return {
      label: lbl || item.label || `Week ${idx + 1}`,
      volume: vol,
      handled,
      handledWithSla: sla,
      errPct: err,
      serviceLevel: sl,
    };
  });

  const qaMap = new Map();
  for (const s of qaList) {
    if (s.label) qaMap.set(String(s.label).trim().toLowerCase(), s);
    if (s.key) qaMap.set(String(s.key).trim().toLowerCase(), s);
  }

  const qaSeries = weekLabels.map((lbl, idx) => {
    const item =
      qaMap.get(String(lbl).trim().toLowerCase()) ||
      qaList.find((s) => String(s.label).trim().toLowerCase() === String(lbl).trim().toLowerCase()) ||
      qaList[idx] ||
      {};
    return {
      label: lbl || item.label || `Week ${idx + 1}`,
      transactions: Number(item.qaTransactions ?? item.transactions ?? 0),
      score: Number(item.qaScorePct ?? item.scorePct ?? item.averageScore ?? item.qaScore ?? item.score ?? 0),
    };
  });

  // Calculate scales for Call Volume (clean integer ticks)
  const maxCallVol = Math.max(100, ...callSeries.map((d) => Math.max(d.volume, d.handled, d.handledWithSla)));
  const callVolTicks = getCallAxisTicks(maxCallVol, 4);
  const callVolAxisMax = Math.max(100, callVolTicks[0] || maxCallVol);

  // Calculate scales for Email Volume
  const maxEmailVol = Math.max(100, ...emailSeries.map((d) => Math.max(d.volume, d.handled, d.handledWithSla)));
  const emailVolTicks = getCallAxisTicks(maxEmailVol, 4);
  const emailVolAxisMax = Math.max(100, emailVolTicks[0] || maxEmailVol);

  // Call AHT scale
  const callAhtTicks = [500, 400, 300, 200, 100, 0];
  const callAhtAxisMax = 500;

  // QA Transactions Scale
  const maxQaTx = Math.max(10, ...qaSeries.map((d) => d.transactions));
  const qaTxTicks = getCallAxisTicks(maxQaTx, 4);
  const qaTxAxisMax = Math.max(10, qaTxTicks[0] || maxQaTx);

  const occMap = new Map();
  for (const s of occList) {
    if (s.label) occMap.set(String(s.label).trim().toLowerCase(), s);
    if (s.key) occMap.set(String(s.key).trim().toLowerCase(), s);
  }

  const effectiveLabels = weekLabels.length > 0 ? weekLabels : occList.map((s) => s.label);

  const occSeries = effectiveLabels.map((lbl, idx) => {
    const item =
      occMap.get(String(lbl).trim().toLowerCase()) ||
      occList.find((s) => String(s.label).trim().toLowerCase() === String(lbl).trim().toLowerCase()) ||
      occList[idx] ||
      {};
    return {
      label: lbl || item.label || `Week ${idx + 1}`,
      occupancyPct: Number(item.occupancyPct || 0),
      actualHeadcount: Number(item.actualHeadcount || 0),
    };
  });

  // Calculate scales for Headcount
  const maxHc = Math.max(10, ...occSeries.map((d) => d.actualHeadcount));
  const hcTicks = getCallAxisTicks(maxHc, 4);
  const hcAxisMax = Math.max(10, hcTicks[0] || maxHc);

  // Color Palette
  const navyDark = "#002b49"; // Header banner
  const blueDark = "#0c3b64"; // Primary bars (Volume, ERR, Transactions)
  const blueMid = "#2f71a3";  // Handled, SL %
  const blueLight = "#4c9aca"; // Handled w/SLA, Score
  const redAlert = "#d32f2f";  // Target lines & red formula labels
  // If Quality Audit is the only selected section, export dedicated full-page Quality Audit view
  if (isSingleSection && showQa) {
    return (
      <div
        id="all-reports-pdf-view"
        style={{
          width: "1500px",
          height: "1040px",
          minHeight: "1040px",
          maxHeight: "1040px",
          backgroundColor: "#ffffff",
          fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          padding: "6px 8px 8px 8px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          color: "#0c3b64",
          border: "none",
          overflow: "hidden",
        }}
      >
        {/* Top: QUALITY AUDIT TRANSACTIONS */}
        <div
          style={{
            border: `2px solid ${navyDark}`,
            borderRadius: "6px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            backgroundColor: "#f8fafc",
          }}
        >
          <div
            style={{
              backgroundColor: navyDark,
              color: "#ffffff",
              textAlign: "center",
              fontWeight: "900",
              fontSize: "16px",
              letterSpacing: "0.5em",
              padding: "6px 0",
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            Q U A L I T Y &nbsp; A U D I T &nbsp; T R A N S A C T I O N S
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              border: "1.5px solid #cbd5e1",
              borderRadius: "6px",
              backgroundColor: "#ffffff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              padding: "10px 16px 8px 16px",
              margin: "10px",
              flex: 1,
            }}
          >
            {/* Legend */}
            <div style={{ display: "flex", justifyContent: "center", gap: "24px", fontSize: "12.5px", fontWeight: "700", marginBottom: "4px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: blueDark, display: "inline-block" }} />
                Audits
              </span>
            </div>

            {/* Chart */}
            <div style={{ display: "flex", height: "365px" }}>
              <div style={{ width: "48px", height: "325px", position: "relative", borderRight: "1.5px solid #cbd5e1", fontSize: "10.5px", color: "#475569", fontWeight: "700" }}>
                {qaTxTicks.map((val, idx) => (
                  <span key={idx} style={{ position: "absolute", top: `${(idx / (qaTxTicks.length - 1)) * 100}%`, transform: "translateY(-50%)", right: "5px" }}>
                    {Math.round(val)}
                  </span>
                ))}
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ height: "325px", position: "relative", borderBottom: "1.5px solid #cbd5e1", display: "flex", padding: "0 10px" }}>
                  {qaTxTicks.map((_, idx) => (
                    <div key={idx} style={{ position: "absolute", left: 0, right: 0, top: `${(idx / (qaTxTicks.length - 1)) * 100}%`, borderTop: "1px solid #f1f5f9" }} />
                  ))}

                  {qaSeries.map((item, idx) => {
                    const h = item.transactions > 0 ? Math.min(100, Math.max(9, (item.transactions / qaTxAxisMax) * 100)) : 0;
                    return (
                      <div key={idx} style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center", position: "relative", zIndex: 1 }}>
                        {item.transactions > 0 && (
                          <div style={{ width: "44px", height: `${h}%`, backgroundColor: blueDark, position: "relative", display: "flex", justifyContent: "center", borderRadius: "2px 2px 0 0" }}>
                            <span style={{ position: "absolute", top: "4px", color: "#ffffff", fontSize: "8.5px", fontWeight: "800", whiteSpace: "nowrap" }}>
                              {item.transactions}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ height: "26px", display: "flex", padding: "0 10px" }}>
                  {qaSeries.map((item, idx) => (
                    <div key={idx} style={{ flex: 1, textAlign: "center", fontSize: "12px", fontWeight: "800", color: "#0c3b64", paddingTop: "5px", whiteSpace: "nowrap" }}>
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ textAlign: "center", color: redAlert, fontSize: "11px", fontWeight: "800", marginTop: "4px", letterSpacing: "0.04em" }}>
              QA TRANSACTION : QA TRANSACTIONS
            </div>
          </div>
        </div>

        {/* Bottom: QUALITY AUDIT SCORE */}
        <div
          style={{
            border: `2px solid ${navyDark}`,
            borderRadius: "6px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            backgroundColor: "#f8fafc",
          }}
        >
          <div
            style={{
              backgroundColor: navyDark,
              color: "#ffffff",
              textAlign: "center",
              fontWeight: "900",
              fontSize: "16px",
              letterSpacing: "0.5em",
              padding: "6px 0",
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            Q U A L I T Y &nbsp; A U D I T &nbsp; S C O R E
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              border: "1.5px solid #cbd5e1",
              borderRadius: "6px",
              backgroundColor: "#ffffff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              padding: "10px 16px 8px 16px",
              margin: "10px",
              flex: 1,
            }}
          >
            {/* Legend */}
            <div style={{ display: "flex", justifyContent: "center", gap: "24px", fontSize: "12.5px", fontWeight: "700", marginBottom: "4px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: blueMid, display: "inline-block" }} />
                Audit Score
              </span>
            </div>

            {/* Chart Area */}
            <div style={{ display: "flex", flexDirection: "column", height: "365px", justifyContent: "space-between" }}>
              <div style={{ height: "325px", display: "flex", flexDirection: "column", justifyContent: "space-around" }}>
                {qaSeries.map((item, idx) => {
                  const widthPct = item.score > 0 ? Math.min(100, item.score) : 0;
                  return (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ width: "86px", fontSize: "12px", fontWeight: "800", color: "#0c3b64", textAlign: "right", whiteSpace: "nowrap" }}>
                        {item.label}
                      </span>
                      <div style={{ flex: 1, height: "26px", backgroundColor: "#f1f5f9", position: "relative", borderRadius: "5px", overflow: "hidden" }}>
                        {item.score > 0 && (
                          <div
                            style={{
                              width: `${widthPct}%`,
                              height: "100%",
                              backgroundColor: blueMid,
                              borderRadius: "5px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-end",
                              paddingRight: "10px",
                            }}
                          >
                            <span style={{ color: "#ffffff", fontSize: "10px", fontWeight: "800", letterSpacing: "-0.02em" }}>
                              {item.score.toFixed(2)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom X-Axis (0% - 100%) */}
              <div style={{ display: "flex", paddingLeft: "98px", borderTop: "1.5px solid #cbd5e1", paddingTop: "4px", justifyContent: "space-between", fontSize: "10.5px", color: "#475569", fontWeight: "700" }}>
                <span>0%</span>
                <span>20.00%</span>
                <span>40.00%</span>
                <span>60.00%</span>
                <span>80.00%</span>
                <span>100.00%</span>
              </div>
            </div>

            <div style={{ textAlign: "center", color: redAlert, fontSize: "11px", fontWeight: "800", marginTop: "4px", letterSpacing: "0.04em" }}>
              QA SCORE : AVERAGE OF TOTAL QA SCORE %
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If Occupancy is the only selected section, export dedicated full-page Occupancy & Headcount view
  if (isSingleSection && showOccupancy) {
    return (
      <div
        id="all-reports-pdf-view"
        style={{
          width: "1500px",
          height: "1040px",
          minHeight: "1040px",
          maxHeight: "1040px",
          backgroundColor: "#ffffff",
          fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          padding: "6px 8px 8px 8px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          color: "#0c3b64",
          border: "none",
          overflow: "hidden",
        }}
      >
        {/* Top: OCCUPANCY & UTILIZATION */}
        <div
          style={{
            border: `2px solid ${navyDark}`,
            borderRadius: "6px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            backgroundColor: "#f8fafc",
          }}
        >
          <div
            style={{
              backgroundColor: navyDark,
              color: "#ffffff",
              textAlign: "center",
              fontWeight: "900",
              fontSize: "16px",
              letterSpacing: "0.5em",
              padding: "6px 0",
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            O C C U P A N C Y &nbsp; & &nbsp; U T I L I Z A T I O N
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              border: "1.5px solid #cbd5e1",
              borderRadius: "6px",
              backgroundColor: "#ffffff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              padding: "10px 16px 8px 16px",
              margin: "10px",
              flex: 1,
            }}
          >
            {/* Legend */}
            <div style={{ display: "flex", justifyContent: "center", gap: "24px", fontSize: "12.5px", fontWeight: "700", marginBottom: "4px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: blueDark, display: "inline-block" }} />
                Occupancy
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: blueMid, display: "inline-block" }} />
                Utilization
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", color: redAlert }}>
                <span style={{ width: "16px", borderTop: "1.5px dashed red", display: "inline-block" }} />
                Target: 85%
              </span>
            </div>

            {/* Chart */}
            <div style={{ display: "flex", height: "365px" }}>
              <div style={{ width: "48px", height: "325px", position: "relative", borderRight: "1.5px solid #cbd5e1", fontSize: "10px", color: "#475569", fontWeight: "700" }}>
                {["100.00%", "80.00%", "60.00%", "40.00%", "20.00%", "0%"].map((pct, idx) => (
                  <span key={idx} style={{ position: "absolute", top: `${idx * 20}%`, transform: "translateY(-50%)", right: "5px" }}>
                    {pct}
                  </span>
                ))}
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ height: "325px", position: "relative", borderBottom: "1.5px solid #cbd5e1", display: "flex", padding: "0 10px" }}>
                  {[0, 20, 40, 60, 80, 100].map((val, idx) => (
                    <div key={idx} style={{ position: "absolute", left: 0, right: 0, top: `${val}%`, borderTop: "1px solid #f1f5f9" }} />
                  ))}
                  {/* Target line 85% */}
                  <div style={{ position: "absolute", left: 0, right: 0, top: "15%", borderTop: "1.5px dashed #d32f2f", zIndex: 3 }} />

                  {occSeries.map((item, idx) => {
                    const occH = item.occupancyPct > 0 ? Math.min(100, Math.max(9, item.occupancyPct)) : 0;
                    return (
                      <div key={idx} style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center", position: "relative", zIndex: 2 }}>
                        {item.occupancyPct > 0 && (
                          <div style={{ width: "42px", height: `${occH}%`, backgroundColor: blueDark, position: "relative", display: "flex", justifyContent: "center", borderRadius: "2px 2px 0 0" }}>
                            <span style={{ position: "absolute", top: "4px", fontSize: "8.5px", fontWeight: "800", color: "#ffffff", whiteSpace: "nowrap" }}>
                              {item.occupancyPct.toFixed(2)}%
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ height: "26px", display: "flex", padding: "0 10px" }}>
                  {occSeries.map((item, idx) => (
                    <div key={idx} style={{ flex: 1, textAlign: "center", fontSize: "12px", fontWeight: "800", color: "#0c3b64", paddingTop: "5px", whiteSpace: "nowrap" }}>
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ textAlign: "center", color: redAlert, fontSize: "11px", fontWeight: "800", marginTop: "4px" }}>
              OCCUPANCY % : TOTAL HANDLING TIME / (TOTAL HANDLING TIME + AVAILABLE TIME)
            </div>
          </div>
        </div>

        {/* Bottom: HEADCOUNT VS PEOPLE METRICS */}
        <div
          style={{
            border: `2px solid ${navyDark}`,
            borderRadius: "6px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            backgroundColor: "#f8fafc",
          }}
        >
          <div
            style={{
              backgroundColor: navyDark,
              color: "#ffffff",
              textAlign: "center",
              fontWeight: "900",
              fontSize: "16px",
              letterSpacing: "0.38em",
              padding: "6px 0",
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            H E A D C O U N T &nbsp; V S &nbsp; P E O P L E &nbsp; M E T R I C S
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", backgroundColor: "#f8fafc", padding: "10px", gap: "10px", flex: 1 }}>
            {/* Left: Headcount Metrics */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                border: "1.5px solid #cbd5e1",
                borderRadius: "6px",
                backgroundColor: "#ffffff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                padding: "10px 14px 8px 14px",
                flex: 1,
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", gap: "14px", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: blueDark, display: "inline-block" }} />
                  Required FTE
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: blueMid, display: "inline-block" }} />
                  Actual HC
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#7b9ebc", display: "inline-block" }} />
                  Buffer
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#b0c4de", display: "inline-block" }} />
                  Attrited
                </span>
              </div>

              <div style={{ display: "flex", height: "365px" }}>
                <div style={{ width: "40px", height: "325px", position: "relative", borderRight: "1.5px solid #cbd5e1", fontSize: "10px", color: "#475569", fontWeight: "700" }}>
                  {hcTicks.map((val, idx) => (
                    <span key={idx} style={{ position: "absolute", top: `${(idx / (hcTicks.length - 1)) * 100}%`, transform: "translateY(-50%)", right: "5px" }}>
                      {Math.round(val)}
                    </span>
                  ))}
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ height: "325px", position: "relative", borderBottom: "1.5px solid #cbd5e1", display: "flex", padding: "0 8px" }}>
                    {hcTicks.map((_, idx) => (
                      <div key={idx} style={{ position: "absolute", left: 0, right: 0, top: `${(idx / (hcTicks.length - 1)) * 100}%`, borderTop: "1px solid #f1f5f9" }} />
                    ))}

                    {occSeries.map((item, idx) => {
                      const h = item.actualHeadcount > 0 ? Math.min(100, Math.max(9, (item.actualHeadcount / hcAxisMax) * 100)) : 0;
                      return (
                        <div key={idx} style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center", position: "relative", zIndex: 1 }}>
                          {item.actualHeadcount > 0 && (
                            <div style={{ width: "38px", height: `${h}%`, backgroundColor: blueMid, position: "relative", display: "flex", justifyContent: "center", borderRadius: "2px 2px 0 0" }}>
                              <span style={{ position: "absolute", top: "4px", color: "#ffffff", fontSize: "8.5px", fontWeight: "800" }}>
                                {item.actualHeadcount}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ height: "26px", display: "flex", padding: "0 8px" }}>
                    {occSeries.map((item, idx) => (
                      <div key={idx} style={{ flex: 1, textAlign: "center", fontSize: "12px", fontWeight: "800", color: "#0c3b64", paddingTop: "5px", whiteSpace: "nowrap" }}>
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: People Metrics */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                border: "1.5px solid #cbd5e1",
                borderRadius: "6px",
                backgroundColor: "#ffffff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                padding: "10px 14px 8px 14px",
                flex: 1,
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", gap: "18px", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: blueDark, display: "inline-block" }} />
                  Absenteeism %
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: blueMid, display: "inline-block" }} />
                  Attrition %
                </span>
              </div>

              <div style={{ display: "flex", height: "365px" }}>
                <div style={{ width: "40px", height: "325px", position: "relative", borderRight: "1.5px solid #cbd5e1", fontSize: "10px", color: "#475569", fontWeight: "700" }}>
                  {["20%", "15%", "10%", "5%", "0%"].map((pct, idx) => (
                    <span key={idx} style={{ position: "absolute", top: `${idx * 25}%`, transform: "translateY(-50%)", right: "5px" }}>
                      {pct}
                    </span>
                  ))}
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ height: "325px", position: "relative", borderBottom: "1.5px solid #cbd5e1", display: "flex", padding: "0 8px" }}>
                    {[0, 25, 50, 75, 100].map((val, idx) => (
                      <div key={idx} style={{ position: "absolute", left: 0, right: 0, top: `${val}%`, borderTop: "1px solid #f1f5f9" }} />
                    ))}
                  </div>

                  <div style={{ height: "26px", display: "flex", padding: "0 8px" }}>
                    {occSeries.map((item, idx) => (
                      <div key={idx} style={{ flex: 1, textAlign: "center", fontSize: "12px", fontWeight: "800", color: "#0c3b64", paddingTop: "5px", whiteSpace: "nowrap" }}>
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="all-reports-pdf-view"
      style={{
        width: "1500px",
        height: "1040px",
        minHeight: "1040px",
        maxHeight: "1040px",
        backgroundColor: "#ffffff",
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: "6px 8px 8px 8px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        color: "#0c3b64",
        border: "none",
        overflow: "hidden",
      }}
    >
      {/* ========================================================================= */}
      {/* SECTION 1: C A L L S                                                     */}
      {/* ========================================================================= */}
      {showCalls && (
      <div
        style={{
          border: `2px solid ${navyDark}`,
          borderRadius: "6px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          backgroundColor: isCallsStacked || isTwoSections ? "#f8fafc" : "#ffffff",
        }}
      >
        {/* Banner */}
        <div
          style={{
            backgroundColor: navyDark,
            color: "#ffffff",
            textAlign: "center",
            fontWeight: "900",
            fontSize: isCallsStacked || isTwoSections ? "16px" : "15px",
            letterSpacing: "0.5em",
            padding: isCallsStacked || isTwoSections ? "6px 0" : "5px 0",
            textTransform: "uppercase",
            flexShrink: 0,
          }}
        >
          C A L L S
        </div>

        {/* Content Layout */}
        <div
          style={{
            display: isCallsStacked ? "flex" : "grid",
            flexDirection: isCallsStacked ? "column" : undefined,
            gridTemplateColumns: isCallsStacked ? undefined : "1.05fr 2fr",
            backgroundColor: isCallsStacked || isTwoSections ? "#f8fafc" : "#ffffff",
            padding: isCallsStacked || isTwoSections ? "10px" : "6px 10px",
            gap: isCallsStacked || isTwoSections ? "10px" : "12px",
            flex: 1,
          }}
        >
          {/* 1A: Call Volume, Handled, Handled w/SLA (Card 1) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              border: isCallsStacked || isTwoSections ? "1.5px solid #cbd5e1" : "none",
              borderRight: isCallsStacked || isTwoSections ? "1.5px solid #cbd5e1" : "1.5px solid #e2e8f0",
              borderRadius: isCallsStacked || isTwoSections ? "6px" : "0",
              backgroundColor: "#ffffff",
              boxShadow: isCallsStacked || isTwoSections ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
              padding: isCallsStacked ? "10px 16px 8px 16px" : isTwoSections ? "10px 12px 8px 12px" : "0 10px 0 0",
              flex: isCallsStacked ? 1 : undefined,
            }}
          >
            {/* Legend */}
            <div style={{ display: "flex", justifyContent: "center", gap: "22px", fontSize: isCallsStacked || isTwoSections ? "12.5px" : "12px", fontWeight: "700", marginBottom: "4px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: blueDark, display: "inline-block" }} />
                Volume
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: blueMid, display: "inline-block" }} />
                Handled
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: blueLight, display: "inline-block" }} />
                Handled w/SLA
              </span>
            </div>

            {/* Chart Area */}
            <div style={{ display: "flex", height: callChartHeight, position: "relative" }}>
              {/* Y Axis */}
              <div style={{ width: "44px", height: callAxisHeight, position: "relative", borderRight: "1.5px solid #cbd5e1", fontSize: "10.5px", color: "#475569", fontWeight: "700" }}>
                {callVolTicks.map((val, idx) => (
                  <span
                    key={idx}
                    style={{
                      position: "absolute",
                      top: `${(idx / (callVolTicks.length - 1)) * 100}%`,
                      transform: "translateY(-50%)",
                      right: "5px",
                    }}
                  >
                    {formatK(val)}
                  </span>
                ))}
              </div>

              {/* Bars + Grid Container */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ height: callAxisHeight, position: "relative", borderBottom: "1.5px solid #cbd5e1", display: "flex", padding: "0 8px" }}>
                  {/* Grid Lines */}
                  {callVolTicks.map((_, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: `${(idx / (callVolTicks.length - 1)) * 100}%`,
                        borderTop: "1px solid #f1f5f9",
                        pointerEvents: "none",
                      }}
                    />
                  ))}

                  {/* Bar Groups */}
                  {callSeries.map((item, idx) => {
                    const vH = item.volume > 0 ? Math.max(7, Math.min(100, (item.volume / callVolAxisMax) * 100)) : 0;
                    const hH = item.handled > 0 ? Math.max(7, Math.min(100, (item.handled / callVolAxisMax) * 100)) : 0;
                    const sH = item.handledWithSla > 0 ? Math.max(7, Math.min(100, (item.handledWithSla / callVolAxisMax) * 100)) : 0;

                    const barMaxWidth = isCallsStacked ? "48px" : isTwoSections ? "34px" : "32px";
                    const barFontSize = isCallsStacked ? "8px" : "7px";

                    return (
                      <div key={idx} style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: isCallsStacked || isTwoSections ? "4px" : "2.5px", position: "relative", zIndex: 1 }}>
                        {/* Volume */}
                        {item.volume > 0 && (
                          <div style={{ flex: 1, maxWidth: barMaxWidth, height: `${vH}%`, backgroundColor: blueDark, position: "relative", display: "flex", justifyContent: "center", borderRadius: "2px 2px 0 0" }}>
                            <span style={{ position: "absolute", top: "4px", left: "50%", transform: "translateX(-50%)", color: "#ffffff", fontSize: barFontSize, fontWeight: "800", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "-0.03em" }}>{item.volume}</span>
                          </div>
                        )}
                        {/* Handled */}
                        {item.handled > 0 && (
                          <div style={{ flex: 1, maxWidth: barMaxWidth, height: `${hH}%`, backgroundColor: blueMid, position: "relative", display: "flex", justifyContent: "center", borderRadius: "2px 2px 0 0" }}>
                            <span style={{ position: "absolute", top: "4px", left: "50%", transform: "translateX(-50%)", color: "#ffffff", fontSize: barFontSize, fontWeight: "800", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "-0.03em" }}>{item.handled}</span>
                          </div>
                        )}
                        {/* Handled w/SLA */}
                        {item.handledWithSla > 0 && (
                          <div style={{ flex: 1, maxWidth: barMaxWidth, height: `${sH}%`, backgroundColor: blueLight, position: "relative", display: "flex", justifyContent: "center", borderRadius: "2px 2px 0 0" }}>
                            <span style={{ position: "absolute", top: "4px", left: "50%", transform: "translateX(-50%)", color: "#ffffff", fontSize: barFontSize, fontWeight: "800", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "-0.03em" }}>{item.handledWithSla}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* X Labels */}
                <div style={{ height: "26px", display: "flex", padding: "0 8px" }}>
                  {callSeries.map((item, idx) => (
                    <div key={idx} style={{ flex: 1, textAlign: "center", fontSize: item.label && item.label.length > 8 ? "9.5px" : isCallsStacked ? "12px" : "11.5px", fontWeight: "800", color: "#0c3b64", paddingTop: "5px", whiteSpace: "nowrap" }}>
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Red Subtitle */}
            <div style={{ textAlign: "center", color: redAlert, fontSize: isCallsStacked ? "12px" : "11px", fontWeight: "800", marginTop: "3px", letterSpacing: "0.04em" }}>
              CALL VOLUME , HANDLED , HANDLED W/ SLA
            </div>
          </div>

          {/* 1B: Answer % & SL % (Card 2) + Call AHT (Card 3) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: isCallsStacked || isTwoSections ? "10px" : "12px",
              flex: isCallsStacked ? 1 : undefined,
            }}
          >
            {/* Sub-chart: Answer % & SL % (Card 2) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                border: isCallsStacked || isTwoSections ? "1.5px solid #cbd5e1" : "none",
                borderRadius: isCallsStacked || isTwoSections ? "6px" : "0",
                backgroundColor: "#ffffff",
                boxShadow: isCallsStacked || isTwoSections ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
                padding: isCallsStacked ? "10px 14px 8px 14px" : isTwoSections ? "10px 12px 8px 12px" : "0",
                flex: isCallsStacked ? 1 : undefined,
              }}
            >
              {/* Legend */}
              <div style={{ display: "flex", justifyContent: "center", gap: "14px", fontSize: isCallsStacked || isTwoSections ? "12px" : "11px", fontWeight: "700", marginBottom: "4px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
                  <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: blueDark, display: "inline-block" }} />
                  Answer %
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
                  <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: blueMid, display: "inline-block" }} />
                  SL %
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "5px", color: redAlert, fontWeight: "800", whiteSpace: "nowrap" }}>
                  <span style={{ width: "12px", height: "2px", backgroundColor: redAlert, display: "inline-block" }} />
                  SL Target (90/60)
                </span>
              </div>

              {/* Chart */}
              <div style={{ display: "flex", height: callChartHeight }}>
                {/* Y Axis 0-100% */}
                <div style={{ width: "48px", height: callAxisHeight, position: "relative", borderRight: "1.5px solid #cbd5e1", fontSize: "10px", color: "#475569", fontWeight: "700" }}>
                  {["100.00%", "80.00%", "60.00%", "40.00%", "20.00%", "0%"].map((pct, idx) => (
                    <span key={idx} style={{ position: "absolute", top: `${idx * 20}%`, transform: "translateY(-50%)", right: "4px" }}>
                      {pct}
                    </span>
                  ))}
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ height: callAxisHeight, position: "relative", borderBottom: "1.5px solid #cbd5e1", display: "flex", padding: "0 6px" }}>
                    {/* Grid lines */}
                    {[0, 20, 40, 60, 80, 100].map((val, idx) => (
                      <div key={idx} style={{ position: "absolute", left: 0, right: 0, top: `${val}%`, borderTop: "1px solid #f1f5f9" }} />
                    ))}

                    {/* Red Target Line at 90% */}
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: "10%",
                        borderTop: `1.5px dashed ${redAlert}`,
                        zIndex: 1,
                        pointerEvents: "none",
                      }}
                    />

                    {/* Clustered Bars */}
                    {callSeries.map((item, idx) => {
                      const ansH = item.answerRate > 0 ? Math.max(9, Math.min(100, item.answerRate)) : 0;
                      const slH = item.serviceLevel > 0 ? Math.max(9, Math.min(100, item.serviceLevel)) : 0;
                      const barMaxWidth = isCallsStacked ? "40px" : isTwoSections ? "34px" : "34px";
                      const barFontSize = isCallsStacked ? "8px" : "7px";

                      return (
                        <div key={idx} style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: isCallsStacked || isTwoSections ? "4px" : "3px", position: "relative", zIndex: 2 }}>
                          {/* Answer % - only show if > 0 */}
                          {item.answerRate > 0 && (
                            <div style={{ flex: 1, maxWidth: barMaxWidth, height: `${ansH}%`, backgroundColor: blueDark, position: "relative", display: "flex", justifyContent: "center", borderRadius: "2px 2px 0 0" }}>
                              <span style={{ position: "absolute", top: "4px", left: "50%", transform: "translateX(-50%)", fontSize: barFontSize, fontWeight: "800", color: "#ffffff", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "-0.03em" }}>
                                {item.answerRate >= 100 || item.answerRate.toFixed(1) === "100.0" ? "100%" : `${item.answerRate.toFixed(1)}%`}
                              </span>
                            </div>
                          )}
                          {/* SL % - only show if > 0 */}
                          {item.serviceLevel > 0 && (
                            <div style={{ flex: 1, maxWidth: barMaxWidth, height: `${slH}%`, backgroundColor: blueMid, position: "relative", display: "flex", justifyContent: "center", borderRadius: "2px 2px 0 0" }}>
                              <span style={{ position: "absolute", top: "4px", left: "50%", transform: "translateX(-50%)", fontSize: barFontSize, fontWeight: "800", color: "#ffffff", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "-0.03em" }}>
                                {item.serviceLevel >= 100 || item.serviceLevel.toFixed(1) === "100.0" ? "100%" : `${item.serviceLevel.toFixed(1)}%`}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* X Labels */}
                  <div style={{ height: "26px", display: "flex", padding: "0 6px" }}>
                    {callSeries.map((item, idx) => (
                      <div key={idx} style={{ flex: 1, textAlign: "center", fontSize: item.label && item.label.length > 8 ? "9.5px" : "11px", fontWeight: "800", color: "#0c3b64", paddingTop: "5px", whiteSpace: "nowrap" }}>
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Red Subtitle */}
              <div style={{ textAlign: "center", color: redAlert, fontSize: isCallsStacked || isTwoSections ? "11.5px" : "10px", fontWeight: "800", marginTop: "3px", letterSpacing: "0.03em" }}>
                ANSWER % : OFFERED / HANDLED &nbsp;&nbsp;&nbsp; SL % : HANDLED W/SLA / HANDLED
              </div>
            </div>

            {/* Sub-chart: Target AHT (420) & Call AHT (Card 3) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                border: isCallsStacked || isTwoSections ? "1.5px solid #cbd5e1" : "none",
                borderRadius: isCallsStacked || isTwoSections ? "6px" : "0",
                backgroundColor: "#ffffff",
                boxShadow: isCallsStacked || isTwoSections ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
                padding: isCallsStacked ? "10px 14px 8px 14px" : isTwoSections ? "10px 12px 8px 12px" : "0",
                flex: isCallsStacked ? 1 : undefined,
              }}
            >
              {/* Legend */}
              <div style={{ display: "flex", justifyContent: "center", gap: "7px", fontSize: isCallsStacked || isTwoSections ? "12px" : "11px", fontWeight: "800", marginBottom: "4px", color: redAlert }}>
                <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: redAlert, display: "inline-block" }} />
                Target AHT (420)
              </div>

              {/* Chart */}
              <div style={{ display: "flex", height: callChartHeight }}>
                {/* Y Axis 0-500 */}
                <div style={{ width: "42px", height: callAxisHeight, position: "relative", borderRight: "1.5px solid #cbd5e1", fontSize: "10px", color: "#475569", fontWeight: "700" }}>
                  {callAhtTicks.map((val, idx) => (
                    <span key={idx} style={{ position: "absolute", top: `${idx * 20}%`, transform: "translateY(-50%)", right: "4px" }}>
                      {val}s
                    </span>
                  ))}
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ height: callAxisHeight, position: "relative", borderBottom: "1.5px solid #cbd5e1", display: "flex", padding: "0 6px" }}>
                    {/* Grid lines */}
                    {[0, 20, 40, 60, 80, 100].map((val, idx) => (
                      <div key={idx} style={{ position: "absolute", left: 0, right: 0, top: `${val}%`, borderTop: "1px solid #f1f5f9" }} />
                    ))}

                    {/* Red Target Line at 420 (which is 16% from top: 1 - 420/500 = 0.16) */}
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: "16%",
                        borderTop: `1.5px dashed ${redAlert}`,
                        zIndex: 1,
                        pointerEvents: "none",
                      }}
                    />

                    {/* Bars - only render when aht > 0 */}
                    {callSeries.map((item, idx) => {
                      const ahtH = item.aht > 0 ? Math.max(7, Math.min(100, (item.aht / callAhtAxisMax) * 100)) : 0;
                      const ahtBarWidth = isCallsStacked ? "40px" : isTwoSections ? "34px" : "30px";
                      const ahtFontSize = isCallsStacked ? "8px" : "7px";

                      return (
                        <div key={idx} style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center", position: "relative", zIndex: 2 }}>
                          {/* Dot on target line if there are calls */}
                          {item.handled > 0 && (
                            <div
                              style={{
                                position: "absolute",
                                top: "calc(16% - 4px)",
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                backgroundColor: redAlert,
                                zIndex: 3,
                              }}
                            />
                          )}

                          {/* AHT Bar */}
                          {item.aht > 0 && (
                            <div style={{ width: ahtBarWidth, height: `${ahtH}%`, backgroundColor: blueDark, position: "relative", display: "flex", justifyContent: "center", borderRadius: "2px 2px 0 0" }}>
                              <span style={{ position: "absolute", top: "4px", left: "50%", transform: "translateX(-50%)", color: "#ffffff", fontSize: ahtFontSize, fontWeight: "800", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "-0.03em" }}>
                                {Math.round(item.aht)}s
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* X Labels */}
                  <div style={{ height: "26px", display: "flex", padding: "0 6px" }}>
                    {callSeries.map((item, idx) => (
                      <div key={idx} style={{ flex: 1, textAlign: "center", fontSize: item.label && item.label.length > 8 ? "9.5px" : "11px", fontWeight: "800", color: "#0c3b64", paddingTop: "5px", whiteSpace: "nowrap" }}>
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Red Subtitle */}
              <div style={{ textAlign: "center", color: redAlert, fontSize: isCallsStacked || isTwoSections ? "11.5px" : "10px", fontWeight: "800", marginTop: "3px", letterSpacing: "0.03em" }}>
                CALL AHT : CALL DURATION / HANDLED CALLS
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: E M A I L S                                                   */}
      {/* ========================================================================= */}
      {showEmails && (
      <div
        style={{
          border: `2px solid ${navyDark}`,
          borderRadius: "6px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          backgroundColor: isSingleSection || isTwoSections ? "#f8fafc" : "#ffffff",
        }}
      >
        {/* Banner */}
        <div
          style={{
            backgroundColor: navyDark,
            color: "#ffffff",
            textAlign: "center",
            fontWeight: "900",
            fontSize: isSingleSection || isTwoSections ? "16px" : "15px",
            letterSpacing: "0.5em",
            padding: isSingleSection || isTwoSections ? "6px 0" : "5px 0",
            textTransform: "uppercase",
            flexShrink: 0,
          }}
        >
          E M A I L S
        </div>

        {/* Content Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            backgroundColor: isSingleSection || isTwoSections ? "#f8fafc" : "#ffffff",
            padding: isSingleSection || isTwoSections ? "10px" : "6px 12px 6px 12px",
            gap: isSingleSection || isTwoSections ? "10px" : "14px",
            flex: 1,
          }}
        >
          {/* 2A: Email Volume, Handled, Handled w/SLA */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              border: isSingleSection || isTwoSections ? "1.5px solid #cbd5e1" : "none",
              borderRight: isSingleSection || isTwoSections ? "1.5px solid #cbd5e1" : "1.5px solid #e2e8f0",
              borderRadius: isSingleSection || isTwoSections ? "6px" : "0",
              backgroundColor: "#ffffff",
              boxShadow: isSingleSection || isTwoSections ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
              padding: isSingleSection || isTwoSections ? "10px 14px 8px 14px" : "0 12px 0 0",
              flex: 1,
            }}
          >
            {/* Legend */}
            <div style={{ display: "flex", justifyContent: "center", gap: "22px", fontSize: isSingleSection || isTwoSections ? "12.5px" : "12px", fontWeight: "700", marginBottom: "4px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: blueDark, display: "inline-block" }} />
                Volume
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: blueMid, display: "inline-block" }} />
                Resolved
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: blueLight, display: "inline-block" }} />
                Resolved w/SLA
              </span>
            </div>

            {/* Chart Area */}
            <div style={{ display: "flex", height: emailChartHeight, position: "relative" }}>
              {/* Y Axis */}
              <div style={{ width: "44px", height: emailAxisHeight, position: "relative", borderRight: "1.5px solid #cbd5e1", fontSize: "10.5px", color: "#475569", fontWeight: "700" }}>
                {emailVolTicks.map((val, idx) => (
                  <span
                    key={idx}
                    style={{
                      position: "absolute",
                      top: `${(idx / (emailVolTicks.length - 1)) * 100}%`,
                      transform: "translateY(-50%)",
                      right: "5px",
                    }}
                  >
                    {formatK(val)}
                  </span>
                ))}
              </div>

              {/* Bars + Grid */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ height: emailAxisHeight, position: "relative", borderBottom: "1.5px solid #cbd5e1", display: "flex", padding: "0 8px" }}>
                  {emailVolTicks.map((_, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: `${(idx / (emailVolTicks.length - 1)) * 100}%`,
                        borderTop: "1px solid #f1f5f9",
                        pointerEvents: "none",
                      }}
                    />
                  ))}

                  {emailSeries.map((item, idx) => {
                    const vH = item.volume > 0 ? Math.max(7, Math.min(100, (item.volume / emailVolAxisMax) * 100)) : 0;
                    const hH = item.handled > 0 ? Math.max(7, Math.min(100, (item.handled / emailVolAxisMax) * 100)) : 0;
                    const sH = item.handledWithSla > 0 ? Math.max(7, Math.min(100, (item.handledWithSla / emailVolAxisMax) * 100)) : 0;

                    const barMaxWidth = isSingleSection || isTwoSections ? "42px" : "32px";
                    const barFontSize = isSingleSection ? "8px" : "7px";

                    return (
                      <div key={idx} style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: isTwoSections ? "4px" : "2.5px", position: "relative", zIndex: 1 }}>
                        {/* Volume */}
                        {item.volume > 0 && (
                          <div style={{ flex: 1, maxWidth: barMaxWidth, height: `${vH}%`, backgroundColor: blueDark, position: "relative", display: "flex", justifyContent: "center", borderRadius: "2px 2px 0 0" }}>
                            <span style={{ position: "absolute", top: "4px", left: "50%", transform: "translateX(-50%)", color: "#ffffff", fontSize: barFontSize, fontWeight: "800", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "-0.03em" }}>{item.volume}</span>
                          </div>
                        )}
                        {/* Handled */}
                        {item.handled > 0 && (
                          <div style={{ flex: 1, maxWidth: barMaxWidth, height: `${hH}%`, backgroundColor: blueMid, position: "relative", display: "flex", justifyContent: "center", borderRadius: "2px 2px 0 0" }}>
                            <span style={{ position: "absolute", top: "4px", left: "50%", transform: "translateX(-50%)", color: "#ffffff", fontSize: barFontSize, fontWeight: "800", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "-0.03em" }}>{item.handled}</span>
                          </div>
                        )}
                        {/* Handled w/SLA */}
                        {item.handledWithSla > 0 && (
                          <div style={{ flex: 1, maxWidth: barMaxWidth, height: `${sH}%`, backgroundColor: blueLight, position: "relative", display: "flex", justifyContent: "center", borderRadius: "2px 2px 0 0" }}>
                            <span style={{ position: "absolute", top: "4px", left: "50%", transform: "translateX(-50%)", color: "#ffffff", fontSize: barFontSize, fontWeight: "800", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "-0.03em" }}>{item.handledWithSla}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* X Labels */}
                <div style={{ height: "26px", display: "flex", padding: "0 8px" }}>
                  {emailSeries.map((item, idx) => (
                    <div key={idx} style={{ flex: 1, textAlign: "center", fontSize: item.label && item.label.length > 8 ? "9.5px" : isTwoSections ? "12px" : "11.5px", fontWeight: "800", color: "#0c3b64", paddingTop: "5px", whiteSpace: "nowrap" }}>
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Red Subtitle */}
            <div style={{ textAlign: "center", color: redAlert, fontSize: isTwoSections ? "11.5px" : "11px", fontWeight: "800", marginTop: "3px", letterSpacing: "0.04em" }}>
              EMAIL VOLUME , RESOLVED , RESOLVED W/ SLA
            </div>
          </div>

          {/* 2B: Email ERR & SL % */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              border: isSingleSection || isTwoSections ? "1.5px solid #cbd5e1" : "none",
              borderRadius: isSingleSection || isTwoSections ? "6px" : "0",
              backgroundColor: "#ffffff",
              boxShadow: isSingleSection || isTwoSections ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
              padding: isSingleSection || isTwoSections ? "10px 14px 8px 14px" : "0",
              flex: 1,
            }}
          >
            {/* Legend */}
            <div style={{ display: "flex", justifyContent: "center", gap: "22px", fontSize: isSingleSection || isTwoSections ? "12.5px" : "12px", fontWeight: "700", marginBottom: "4px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: blueDark, display: "inline-block" }} />
                ERR
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: blueMid, display: "inline-block" }} />
                SL %
              </span>
            </div>

            {/* Chart Area */}
            <div style={{ display: "flex", height: emailChartHeight }}>
              {/* Y Axis 0-100% */}
              <div style={{ width: "48px", height: emailAxisHeight, position: "relative", borderRight: "1.5px solid #cbd5e1", fontSize: "10px", color: "#475569", fontWeight: "700" }}>
                {["100.00%", "80.00%", "60.00%", "40.00%", "20.00%", "0%"].map((pct, idx) => (
                  <span key={idx} style={{ position: "absolute", top: `${idx * 20}%`, transform: "translateY(-50%)", right: "5px" }}>
                    {pct}
                  </span>
                ))}
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ height: emailAxisHeight, position: "relative", borderBottom: "1.5px solid #cbd5e1", display: "flex", padding: "0 8px" }}>
                  {[0, 20, 40, 60, 80, 100].map((val, idx) => (
                    <div key={idx} style={{ position: "absolute", left: 0, right: 0, top: `${val}%`, borderTop: "1px solid #f1f5f9" }} />
                  ))}

                  {emailSeries.map((item, idx) => {
                    const errH = item.errPct > 0 ? Math.max(9, Math.min(100, item.errPct)) : 0;
                    const slH = item.serviceLevel > 0 ? Math.max(9, Math.min(100, item.serviceLevel)) : 0;
                    const barMaxWidth = isSingleSection || isTwoSections ? "40px" : "36px";
                    const barFontSize = isSingleSection ? "8px" : "7px";

                    return (
                      <div key={idx} style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "3.5px", position: "relative", zIndex: 2 }}>
                        {/* ERR - only show if > 0 */}
                        {item.errPct > 0 && (
                          <div style={{ flex: 1, maxWidth: barMaxWidth, height: `${errH}%`, backgroundColor: blueDark, position: "relative", display: "flex", justifyContent: "center", borderRadius: "2px 2px 0 0" }}>
                            <span style={{ position: "absolute", top: "4px", left: "50%", transform: "translateX(-50%)", fontSize: barFontSize, fontWeight: "800", color: "#ffffff", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "-0.03em" }}>
                              {item.errPct.toFixed(2)}%
                            </span>
                          </div>
                        )}
                        {/* SL % - only show if > 0 */}
                        {item.serviceLevel > 0 && (
                          <div style={{ flex: 1, maxWidth: barMaxWidth, height: `${slH}%`, backgroundColor: blueMid, position: "relative", display: "flex", justifyContent: "center", borderRadius: "2px 2px 0 0" }}>
                            <span style={{ position: "absolute", top: "4px", left: "50%", transform: "translateX(-50%)", fontSize: barFontSize, fontWeight: "800", color: "#ffffff", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "-0.03em" }}>
                              {item.serviceLevel.toFixed(2)}%
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* X Labels */}
                <div style={{ height: "26px", display: "flex", padding: "0 8px" }}>
                  {emailSeries.map((item, idx) => (
                    <div key={idx} style={{ flex: 1, textAlign: "center", fontSize: item.label && item.label.length > 8 ? "9.5px" : isTwoSections ? "12px" : "11.5px", fontWeight: "800", color: "#0c3b64", paddingTop: "5px", whiteSpace: "nowrap" }}>
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Red Subtitle */}
            <div style={{ textAlign: "center", color: redAlert, fontSize: isTwoSections ? "11.5px" : "11px", fontWeight: "800", marginTop: "3px", letterSpacing: "0.04em" }}>
              ERR % : RESOLVED / OFFERED &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; SL % : RESOLVED W/SLA / RESOLVED
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: QUALITY AUDIT  &  HEADCOUNT VS PEOPLE METRICS                */}
      {/* ========================================================================= */}
      {showSection3 && (
      <div style={{ display: "grid", gridTemplateColumns: showQa && showOccupancy ? "1fr 1.05fr" : "1fr", gap: "10px", flex: 1 }}>
        {/* 3A: QUALITY AUDIT */}
        {showQa && (
        <div style={{ border: `2px solid ${navyDark}`, borderRadius: "6px", overflow: "hidden", display: "flex", flexDirection: "column", flex: 1 }}>
          {/* Banner */}
          <div
            style={{
              backgroundColor: navyDark,
              color: "#ffffff",
              textAlign: "center",
              fontWeight: "900",
              fontSize: "14px",
              letterSpacing: "0.45em",
              padding: "5px 0",
              textTransform: "uppercase",
            }}
          >
            Q U A L I T Y &nbsp; A U D I T
          </div>

          {/* Sub-grid: QA TRANSACTIONS & QA SCORE */}
          <div style={{ display: "grid", gridTemplateColumns: "1.08fr 1.12fr", backgroundColor: "#ffffff", padding: "6px 10px 5px 10px", gap: "12px", flex: 1 }}>
            {/* QA Transactions */}
            <div style={{ display: "flex", flexDirection: "column", borderRight: "1.5px solid #e2e8f0", paddingRight: "10px" }}>
              <div style={{ fontSize: "13px", fontWeight: "900", color: "#0c3b64", textTransform: "uppercase", marginBottom: "4px" }}>
                QA TRANSACTIONS
              </div>

              <div style={{ display: "flex", height: qaChartHeight }}>
                {/* Y Axis - Clean whole numbers */}
                <div style={{ width: "36px", height: qaAxisHeight, position: "relative", borderRight: "1.5px solid #cbd5e1", fontSize: "10.5px", color: "#475569", fontWeight: "700" }}>
                  {qaTxTicks.map((val, idx) => (
                    <span key={idx} style={{ position: "absolute", top: `${(idx / (qaTxTicks.length - 1)) * 100}%`, transform: "translateY(-50%)", right: "4px" }}>
                      {Math.round(val)}
                    </span>
                  ))}
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ height: qaAxisHeight, position: "relative", borderBottom: "1.5px solid #cbd5e1", display: "flex", padding: "0 6px" }}>
                    {qaTxTicks.map((_, idx) => (
                      <div key={idx} style={{ position: "absolute", left: 0, right: 0, top: `${(idx / (qaTxTicks.length - 1)) * 100}%`, borderTop: "1px solid #f1f5f9" }} />
                    ))}

                    {qaSeries.map((item, idx) => {
                      const h = item.transactions > 0 ? Math.min(100, (item.transactions / qaTxAxisMax) * 100) : 0;
                      return (
                        <div key={idx} style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center", position: "relative", zIndex: 1 }}>
                          {item.transactions > 0 && (
                            <div style={{ width: "32px", height: `${h}%`, backgroundColor: blueDark, position: "relative", display: "flex", justifyContent: "center" }}>
                              <span style={{ position: "absolute", top: "3px", color: "#ffffff", fontSize: isSingleSection ? "8px" : "7px", fontWeight: "800", letterSpacing: "-0.03em" }}>
                                {item.transactions}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* X Labels */}
                  <div style={{ height: "26px", display: "flex", padding: "0 6px" }}>
                    {qaSeries.map((item, idx) => (
                      <div key={idx} style={{ flex: 1, textAlign: "center", fontSize: item.label && item.label.length > 8 ? "9px" : "11px", fontWeight: "800", color: "#0c3b64", paddingTop: "5px", whiteSpace: "nowrap" }}>
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Red Subtitle */}
              <div style={{ textAlign: "center", color: redAlert, fontSize: "10.5px", fontWeight: "800", marginTop: "3px" }}>
                QA TRANSACTION : QA TRANSACTIONS
              </div>
            </div>

            {/* QA Score (Horizontal Bar Chart) */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "13px", fontWeight: "900", color: "#0c3b64", textTransform: "uppercase", marginBottom: "4px" }}>
                QA SCORE
              </div>

              {/* Horizontal Bars */}
              <div style={{ display: "flex", flexDirection: "column", height: qaChartHeight, justifyContent: "space-between" }}>
                <div style={{ height: qaAxisHeight, display: "flex", flexDirection: "column", justifyContent: "space-around" }}>
                  {qaSeries.map((item, idx) => {
                    const widthPct = item.score > 0 ? Math.min(100, item.score) : 0;

                    return (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "76px", fontSize: item.label && item.label.length > 8 ? "9px" : "10.5px", fontWeight: "800", color: "#0c3b64", textAlign: "right", whiteSpace: "nowrap" }}>
                          {item.label}
                        </span>
                        <div style={{ flex: 1, height: "20px", backgroundColor: "#f1f5f9", position: "relative", borderRadius: "4px", overflow: "hidden" }}>
                          {item.score > 0 && (
                            <div
                              style={{
                                width: `${widthPct}%`,
                                height: "100%",
                                backgroundColor: "#557da4",
                                borderRadius: "4px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                paddingRight: "8px",
                              }}
                            >
                              <span style={{ color: "#ffffff", fontSize: "8.5px", fontWeight: "800", letterSpacing: "-0.03em" }}>
                                {item.score.toFixed(2)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* X Axis at bottom: 0%, 20%, 40%, 60%, 80%, 100% */}
                <div style={{ display: "flex", paddingLeft: "84px", borderTop: "1.5px solid #cbd5e1", paddingTop: "3px", justifyContent: "space-between", fontSize: "9.5px", color: "#475569", fontWeight: "700" }}>
                  <span>0%</span>
                  <span>20.00%</span>
                  <span>40.00%</span>
                  <span>60.00%</span>
                  <span>80.00%</span>
                  <span>100.00%</span>
                </div>
              </div>

              {/* Red Subtitle */}
              <div style={{ textAlign: "center", color: redAlert, fontSize: "10.5px", fontWeight: "800", marginTop: "3px" }}>
                QA SCORE : AVERAGE OF TOTAL QA SCORE %
              </div>
            </div>
          </div>
        </div>
        )}

        {/* 3B: OCCUPANCY & HEADCOUNT */}
        {showOccupancy && (
        <div style={{ border: `2px solid ${navyDark}`, borderRadius: "3px", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: isSingleSection ? "380px" : "auto" }}>
          {/* Banner */}
          <div
            style={{
              backgroundColor: navyDark,
              color: "#ffffff",
              textAlign: "center",
              fontWeight: "900",
              fontSize: "14px",
              letterSpacing: "0.38em",
              padding: "5px 0",
              textTransform: "uppercase",
            }}
          >
            O C C U P A N C Y &nbsp; & &nbsp; H E A D C O U N T
          </div>

          {/* Sub-grid: Occupancy & Utilization (Left) & Headcount Metrics (Right) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", backgroundColor: "#ffffff", padding: "6px 12px 6px 12px", gap: "14px", flex: 1 }}>
            {/* Left: Occupancy & Utilization */}
            <div style={{ display: "flex", flexDirection: "column", borderRight: "1.5px solid #e2e8f0", paddingRight: "12px" }}>
              {/* Title & Legend Stacked */}
              <div style={{ fontSize: "12px", fontWeight: "900", color: "#0c3b64", textTransform: "uppercase", textAlign: "center", letterSpacing: "0.03em" }}>
                OCCUPANCY &amp; UTILIZATION
              </div>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", fontSize: "10px", fontWeight: "700", marginTop: "1px", marginBottom: "4px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: blueDark, display: "inline-block" }} />
                  Occupancy
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: blueMid, display: "inline-block" }} />
                  Utilization
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px", color: redAlert, fontWeight: "800" }}>
                  <span style={{ width: "12px", borderTop: `1.5px dashed ${redAlert}`, display: "inline-block" }} />
                  Target (85%)
                </span>
              </div>

              {/* Chart Area */}
              <div style={{ display: "flex", height: occChartHeight }}>
                {/* Y Axis 0-100% */}
                <div style={{ width: "32px", height: occAxisHeight, position: "relative", borderRight: "1.5px solid #cbd5e1", fontSize: "9px", color: "#475569", fontWeight: "700" }}>
                  {["100%", "80%", "60%", "40%", "20%", "0%"].map((pct, idx) => (
                    <span key={idx} style={{ position: "absolute", top: `${idx * 20}%`, transform: "translateY(-50%)", right: "3px" }}>
                      {pct}
                    </span>
                  ))}
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ height: occAxisHeight, position: "relative", borderBottom: "1.5px solid #cbd5e1", display: "flex", padding: "0 6px" }}>
                    {[0, 20, 40, 60, 80, 100].map((val, idx) => (
                      <div key={idx} style={{ position: "absolute", left: 0, right: 0, top: `${val}%`, borderTop: "1px solid #f1f5f9" }} />
                    ))}
                    {/* Red 85% Target Line */}
                    <div style={{ position: "absolute", left: 0, right: 0, top: "15%", borderTop: `1.5px dashed ${redAlert}`, zIndex: 3 }} />

                    {occSeries.map((item, idx) => {
                      const occH = item.occupancyPct > 0 ? Math.min(100, Math.max(9, item.occupancyPct)) : 0;
                      return (
                        <div key={idx} style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center", position: "relative", zIndex: 2 }}>
                          {item.occupancyPct > 0 && (
                            <div style={{ width: isSingleSection ? "36px" : "30px", height: `${occH}%`, backgroundColor: blueDark, position: "relative", display: "flex", justifyContent: "center", borderRadius: "2px 2px 0 0" }}>
                              <span style={{ position: "absolute", top: "3px", fontSize: isSingleSection ? "8px" : "7px", fontWeight: "800", color: "#ffffff", whiteSpace: "nowrap", letterSpacing: "-0.03em" }}>
                                {item.occupancyPct.toFixed(2)}%
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* X Labels */}
                  <div style={{ height: "26px", display: "flex", padding: "0 4px" }}>
                    {occSeries.map((item, idx) => (
                      <div key={idx} style={{ flex: 1, textAlign: "center", fontSize: "9px", fontWeight: "800", color: "#0c3b64", paddingTop: "5px", whiteSpace: "nowrap", letterSpacing: "-0.03em", overflow: "visible" }}>
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Red Formula Subtitle */}
              <div style={{ textAlign: "center", color: redAlert, fontSize: "9px", fontWeight: "800", marginTop: "3px", whiteSpace: "nowrap" }}>
                OCCUPANCY % : TOTAL HANDLING TIME / (THT + AVAILABLE TIME)
              </div>
            </div>

            {/* Right: Headcount Metrics */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {/* Title & Legend Stacked */}
              <div style={{ fontSize: "12px", fontWeight: "900", color: "#0c3b64", textTransform: "uppercase", textAlign: "center", letterSpacing: "0.03em" }}>
                HEADCOUNT METRICS
              </div>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", fontSize: "10px", fontWeight: "700", marginTop: "1px", marginBottom: "4px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: blueDark, display: "inline-block" }} />
                  Req FTE
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: blueMid, display: "inline-block" }} />
                  Actual HC
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#7b9ebc", display: "inline-block" }} />
                  Buffer
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#b0c4de", display: "inline-block" }} />
                  Attrited
                </span>
              </div>

              {/* Chart Area */}
              <div style={{ display: "flex", height: occChartHeight }}>
                {/* Y Axis */}
                <div style={{ width: "32px", height: occAxisHeight, position: "relative", borderRight: "1.5px solid #cbd5e1", fontSize: "9.5px", color: "#475569", fontWeight: "700" }}>
                  {hcTicks.map((val, idx) => (
                    <span key={idx} style={{ position: "absolute", top: `${(idx / (hcTicks.length - 1)) * 100}%`, transform: "translateY(-50%)", right: "3px" }}>
                      {Math.round(val)}
                    </span>
                  ))}
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ height: occAxisHeight, position: "relative", borderBottom: "1.5px solid #cbd5e1", display: "flex", padding: "0 6px" }}>
                    {hcTicks.map((_, idx) => (
                      <div key={idx} style={{ position: "absolute", left: 0, right: 0, top: `${(idx / (hcTicks.length - 1)) * 100}%`, borderTop: "1px solid #f1f5f9" }} />
                    ))}

                    {occSeries.map((item, idx) => {
                      const h = item.actualHeadcount > 0 ? Math.min(100, Math.max(7, (item.actualHeadcount / hcAxisMax) * 100)) : 0;
                      return (
                        <div key={idx} style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center", position: "relative", zIndex: 1 }}>
                          {item.actualHeadcount > 0 && (
                            <div style={{ width: isSingleSection ? "36px" : "30px", height: `${h}%`, backgroundColor: blueMid, position: "relative", display: "flex", justifyContent: "center", borderRadius: "2px 2px 0 0" }}>
                              <span style={{ position: "absolute", top: "3px", color: "#ffffff", fontSize: isSingleSection ? "8px" : "7px", fontWeight: "800", letterSpacing: "-0.03em" }}>
                                {item.actualHeadcount}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* X Labels */}
                  <div style={{ height: "26px", display: "flex", padding: "0 4px" }}>
                    {occSeries.map((item, idx) => (
                      <div key={idx} style={{ flex: 1, textAlign: "center", fontSize: "9px", fontWeight: "800", color: "#0c3b64", paddingTop: "5px", whiteSpace: "nowrap", letterSpacing: "-0.03em", overflow: "visible" }}>
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Subtitle to match baseline with left card */}
              <div style={{ textAlign: "center", color: redAlert, fontSize: "9px", fontWeight: "800", marginTop: "3px", whiteSpace: "nowrap" }}>
                HEADCOUNT : ACTUAL ACTIVE EMPLOYEES
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
      )}
    </div>
  );
}
