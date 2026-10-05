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
}) {
  // Extract canonical week/period labels from the active graphs
  const callList = Array.isArray(callData?.series) ? callData.series : [];
  const emailList = Array.isArray(emailData?.series) ? emailData.series : [];
  const qaList = Array.isArray(qualityAuditData?.series) ? qualityAuditData.series : [];

  // Determine chronological week labels present on the graph
  const weekLabels =
    callList.length > 0
      ? callList.map((s) => s.label)
      : emailList.length > 0
      ? emailList.map((s) => s.label)
      : qaList.length > 0
      ? qaList.map((s) => s.label)
      : [];

  const callMap = new Map(callList.map((s) => [s.label, s]));
  const emailMap = new Map(emailList.map((s) => [s.label, s]));

  // Build series strictly from active graph data
  const callSeries = weekLabels.map((lbl, idx) => {
    const item = callMap.get(lbl) || callList[idx] || {};
    const vol = Number(item.callsOffered ?? item.volume ?? 0);
    const handled = Number(item.callsHandled ?? item.handled ?? 0);
    const sla = Number(item.handledWithSla ?? item.handledWithinSla ?? 0);
    const ansRate = vol > 0 ? (handled / vol) * 100 : 0;
    const sl = handled > 0 ? Number(item.serviceLevel ?? item.serviceLevelPct ?? 0) : 0;
    const ahtSec = handled > 0 ? Number(item.aht ?? item.averageHandleTime ?? 0) : 0;

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
    const err = vol > 0 ? Number(item.errPct ?? (handled / vol) * 100) : 0;
    const sl = handled > 0 ? Number(item.serviceLevelPct ?? item.serviceLevel ?? 0) : 0;

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

  // Color Palette
  const navyDark = "#002b49"; // Header banner
  const blueDark = "#0c3b64"; // Primary bars (Volume, ERR, Transactions)
  const blueMid = "#2f71a3";  // Handled, SL %
  const blueLight = "#4c9aca"; // Handled w/SLA, Score
  const redAlert = "#d32f2f"; // Target lines & red formula labels

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
        padding: "8px 10px 10px 10px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        color: "#0c3b64",
        border: "1.5px solid #64748b",
        overflow: "hidden",
      }}
    >
      {/* ========================================================================= */}
      {/* SECTION 1: C A L L S                                                     */}
      {/* ========================================================================= */}
      <div style={{ border: `2px solid ${navyDark}`, borderRadius: "3px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Banner */}
        <div
          style={{
            backgroundColor: navyDark,
            color: "#ffffff",
            textAlign: "center",
            fontWeight: "900",
            fontSize: "15px",
            letterSpacing: "0.5em",
            padding: "5px 0",
            textTransform: "uppercase",
          }}
        >
          C A L L S
        </div>

        {/* Content Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1.05fr", backgroundColor: "#ffffff", padding: "6px 12px 6px 12px", gap: "14px" }}>
          {/* 1A: Call Volume, Handled, Handled w/SLA */}
          <div style={{ display: "flex", flexDirection: "column", borderRight: "1.5px solid #e2e8f0", paddingRight: "12px" }}>
            {/* Legend */}
            <div style={{ display: "flex", justifyContent: "center", gap: "22px", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>
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
            <div style={{ display: "flex", height: "235px", position: "relative" }}>
              {/* Y Axis */}
              <div style={{ width: "44px", height: "198px", position: "relative", borderRight: "1.5px solid #cbd5e1", fontSize: "10.5px", color: "#475569", fontWeight: "700" }}>
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
                <div style={{ height: "198px", position: "relative", borderBottom: "1.5px solid #cbd5e1", display: "flex", padding: "0 8px" }}>
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
                    const vH = item.volume > 0 ? Math.min(100, (item.volume / callVolAxisMax) * 100) : 0;
                    const hH = item.handled > 0 ? Math.min(100, (item.handled / callVolAxisMax) * 100) : 0;
                    const sH = item.handledWithSla > 0 ? Math.min(100, (item.handledWithSla / callVolAxisMax) * 100) : 0;

                    return (
                      <div key={idx} style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "2.5px", position: "relative", zIndex: 1 }}>
                        {/* Volume */}
                        {item.volume > 0 && (
                          <div style={{ flex: 1, maxWidth: "32px", height: `${vH}%`, backgroundColor: blueDark, position: "relative", display: "flex", justifyContent: "center" }}>
                            <span style={{ position: "absolute", top: "3px", color: "#ffffff", fontSize: "10px", fontWeight: "800" }}>{item.volume}</span>
                          </div>
                        )}
                        {/* Handled */}
                        {item.handled > 0 && (
                          <div style={{ flex: 1, maxWidth: "32px", height: `${hH}%`, backgroundColor: blueMid, position: "relative", display: "flex", justifyContent: "center" }}>
                            <span style={{ position: "absolute", top: "3px", color: "#ffffff", fontSize: "10px", fontWeight: "800" }}>{item.handled}</span>
                          </div>
                        )}
                        {/* Handled w/SLA */}
                        {item.handledWithSla > 0 && (
                          <div style={{ flex: 1, maxWidth: "32px", height: `${sH}%`, backgroundColor: blueLight, position: "relative", display: "flex", justifyContent: "center" }}>
                            <span style={{ position: "absolute", top: "3px", color: "#ffffff", fontSize: "10px", fontWeight: "800" }}>{item.handledWithSla}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* X Labels */}
                <div style={{ height: "26px", display: "flex", padding: "0 8px" }}>
                  {callSeries.map((item, idx) => (
                    <div key={idx} style={{ flex: 1, textAlign: "center", fontSize: "11.5px", fontWeight: "800", color: "#0c3b64", paddingTop: "5px" }}>
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Red Subtitle */}
            <div style={{ textAlign: "center", color: redAlert, fontSize: "11px", fontWeight: "800", marginTop: "3px", letterSpacing: "0.04em" }}>
              CALL VOLUME , HANDLED , HANDLED W/ SLA
            </div>
          </div>

          {/* 1B: Answer % & SL % (Left) + Call AHT (Right) */}
          <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.95fr", gap: "12px" }}>
            {/* Sub-chart: Answer % & SL % */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {/* Legend */}
              <div style={{ display: "flex", justifyContent: "center", gap: "14px", fontSize: "11px", fontWeight: "700", marginBottom: "4px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: blueDark, display: "inline-block" }} />
                  Answer %
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: blueMid, display: "inline-block" }} />
                  SL %
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "5px", color: redAlert, fontWeight: "800" }}>
                  <span style={{ width: "12px", height: "2px", backgroundColor: redAlert, display: "inline-block" }} />
                  SL Target (90/60)
                </span>
              </div>

              {/* Chart */}
              <div style={{ display: "flex", height: "235px" }}>
                {/* Y Axis 0-100% */}
                <div style={{ width: "48px", height: "198px", position: "relative", borderRight: "1.5px solid #cbd5e1", fontSize: "10px", color: "#475569", fontWeight: "700" }}>
                  {["100.00%", "80.00%", "60.00%", "40.00%", "20.00%", "0%"].map((pct, idx) => (
                    <span key={idx} style={{ position: "absolute", top: `${idx * 20}%`, transform: "translateY(-50%)", right: "4px" }}>
                      {pct}
                    </span>
                  ))}
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ height: "198px", position: "relative", borderBottom: "1.5px solid #cbd5e1", display: "flex", padding: "0 6px" }}>
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
                        borderTop: `2px solid ${redAlert}`,
                        zIndex: 2,
                      }}
                    />

                    {/* Clustered Bars */}
                    {callSeries.map((item, idx) => {
                      const ansH = item.answerRate > 0 ? Math.min(100, item.answerRate) : 0;
                      const slH = item.serviceLevel > 0 ? Math.min(100, item.serviceLevel) : 0;

                      return (
                        <div key={idx} style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "2px", position: "relative", zIndex: 1 }}>
                          {/* Answer % - only show if > 0 */}
                          {item.answerRate > 0 && (
                            <div style={{ flex: 1, maxWidth: "22px", height: `${ansH}%`, backgroundColor: blueDark, position: "relative", display: "flex", justifyContent: "center" }}>
                              <span style={{ position: "absolute", top: "-13px", fontSize: "9px", fontWeight: "800", color: "#0c3b64", whiteSpace: "nowrap" }}>
                                {item.answerRate.toFixed(1)}%
                              </span>
                            </div>
                          )}
                          {/* SL % - only show if > 0 */}
                          {item.serviceLevel > 0 && (
                            <div style={{ flex: 1, maxWidth: "22px", height: `${slH}%`, backgroundColor: blueMid, position: "relative", display: "flex", justifyContent: "center" }}>
                              <span style={{ position: "absolute", top: "-13px", fontSize: "9px", fontWeight: "800", color: "#2f71a3", whiteSpace: "nowrap" }}>
                                {item.serviceLevel.toFixed(1)}%
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
                      <div key={idx} style={{ flex: 1, textAlign: "center", fontSize: "11px", fontWeight: "800", color: "#0c3b64", paddingTop: "5px" }}>
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Red Subtitle */}
              <div style={{ textAlign: "center", color: redAlert, fontSize: "10px", fontWeight: "800", marginTop: "3px", letterSpacing: "0.03em" }}>
                ANSWER % : OFFERED / HANDLED &nbsp;&nbsp;&nbsp; SL % : HANDLED W/SLA / HANDLED
              </div>
            </div>

            {/* Sub-chart: Target AHT (420) & Call AHT */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {/* Legend */}
              <div style={{ display: "flex", justifyContent: "center", gap: "7px", fontSize: "11px", fontWeight: "800", marginBottom: "4px", color: redAlert }}>
                <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: redAlert, display: "inline-block" }} />
                Target AHT (420)
              </div>

              {/* Chart */}
              <div style={{ display: "flex", height: "235px" }}>
                {/* Y Axis 0-500 */}
                <div style={{ width: "42px", height: "198px", position: "relative", borderRight: "1.5px solid #cbd5e1", fontSize: "10px", color: "#475569", fontWeight: "700" }}>
                  {callAhtTicks.map((val, idx) => (
                    <span key={idx} style={{ position: "absolute", top: `${idx * 20}%`, transform: "translateY(-50%)", right: "4px" }}>
                      {val.toFixed(2)}
                    </span>
                  ))}
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ height: "198px", position: "relative", borderBottom: "1.5px solid #cbd5e1", display: "flex", padding: "0 6px" }}>
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
                        borderTop: `2px solid ${redAlert}`,
                        zIndex: 3,
                      }}
                    />

                    {/* Bars - only render when aht > 0 */}
                    {callSeries.map((item, idx) => {
                      const ahtH = item.aht > 0 ? Math.min(100, (item.aht / callAhtAxisMax) * 100) : 0;

                      return (
                        <div key={idx} style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center", position: "relative", zIndex: 1 }}>
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
                                zIndex: 4,
                              }}
                            />
                          )}

                          {/* AHT Bar */}
                          {item.aht > 0 && (
                            <div style={{ width: "28px", height: `${ahtH}%`, backgroundColor: blueDark, position: "relative", display: "flex", justifyContent: "center" }}>
                              <span style={{ position: "absolute", top: "3px", color: "#ffffff", fontSize: "9.5px", fontWeight: "800" }}>
                                {item.aht.toFixed(2)}
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
                      <div key={idx} style={{ flex: 1, textAlign: "center", fontSize: "11px", fontWeight: "800", color: "#0c3b64", paddingTop: "5px" }}>
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Red Subtitle */}
              <div style={{ textAlign: "center", color: redAlert, fontSize: "10px", fontWeight: "800", marginTop: "3px", letterSpacing: "0.03em" }}>
                CALL AHT : CALL DURATION / HANDLED CALLS
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: E M A I L S                                                   */}
      {/* ========================================================================= */}
      <div style={{ border: `2px solid ${navyDark}`, borderRadius: "3px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Banner */}
        <div
          style={{
            backgroundColor: navyDark,
            color: "#ffffff",
            textAlign: "center",
            fontWeight: "900",
            fontSize: "15px",
            letterSpacing: "0.5em",
            padding: "5px 0",
            textTransform: "uppercase",
          }}
        >
          E M A I L S
        </div>

        {/* Content Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1.05fr", backgroundColor: "#ffffff", padding: "6px 12px 6px 12px", gap: "14px" }}>
          {/* 2A: Email Volume, Handled, Handled w/SLA */}
          <div style={{ display: "flex", flexDirection: "column", borderRight: "1.5px solid #e2e8f0", paddingRight: "12px" }}>
            {/* Legend */}
            <div style={{ display: "flex", justifyContent: "center", gap: "22px", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>
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
            <div style={{ display: "flex", height: "225px", position: "relative" }}>
              {/* Y Axis */}
              <div style={{ width: "44px", height: "190px", position: "relative", borderRight: "1.5px solid #cbd5e1", fontSize: "10.5px", color: "#475569", fontWeight: "700" }}>
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
                <div style={{ height: "190px", position: "relative", borderBottom: "1.5px solid #cbd5e1", display: "flex", padding: "0 8px" }}>
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
                    const vH = item.volume > 0 ? Math.min(100, (item.volume / emailVolAxisMax) * 100) : 0;
                    const hH = item.handled > 0 ? Math.min(100, (item.handled / emailVolAxisMax) * 100) : 0;
                    const sH = item.handledWithSla > 0 ? Math.min(100, (item.handledWithSla / emailVolAxisMax) * 100) : 0;

                    return (
                      <div key={idx} style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "2.5px", position: "relative", zIndex: 1 }}>
                        {/* Volume */}
                        {item.volume > 0 && (
                          <div style={{ flex: 1, maxWidth: "32px", height: `${vH}%`, backgroundColor: blueDark, position: "relative", display: "flex", justifyContent: "center" }}>
                            <span style={{ position: "absolute", top: "3px", color: "#ffffff", fontSize: "10px", fontWeight: "800" }}>{item.volume}</span>
                          </div>
                        )}
                        {/* Handled */}
                        {item.handled > 0 && (
                          <div style={{ flex: 1, maxWidth: "32px", height: `${hH}%`, backgroundColor: blueMid, position: "relative", display: "flex", justifyContent: "center" }}>
                            <span style={{ position: "absolute", top: "3px", color: "#ffffff", fontSize: "10px", fontWeight: "800" }}>{item.handled}</span>
                          </div>
                        )}
                        {/* Handled w/SLA */}
                        {item.handledWithSla > 0 && (
                          <div style={{ flex: 1, maxWidth: "32px", height: `${sH}%`, backgroundColor: blueLight, position: "relative", display: "flex", justifyContent: "center" }}>
                            <span style={{ position: "absolute", top: "3px", color: "#ffffff", fontSize: "10px", fontWeight: "800" }}>{item.handledWithSla}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* X Labels */}
                <div style={{ height: "26px", display: "flex", padding: "0 8px" }}>
                  {emailSeries.map((item, idx) => (
                    <div key={idx} style={{ flex: 1, textAlign: "center", fontSize: "11.5px", fontWeight: "800", color: "#0c3b64", paddingTop: "5px" }}>
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Red Subtitle */}
            <div style={{ textAlign: "center", color: redAlert, fontSize: "11px", fontWeight: "800", marginTop: "3px", letterSpacing: "0.04em" }}>
              EMAIL VOLUME , HANDLED , HANDLED W/ SLA
            </div>
          </div>

          {/* 2B: Email ERR & SL % */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Legend */}
            <div style={{ display: "flex", justifyContent: "center", gap: "22px", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>
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
            <div style={{ display: "flex", height: "225px" }}>
              {/* Y Axis 0-100% */}
              <div style={{ width: "48px", height: "190px", position: "relative", borderRight: "1.5px solid #cbd5e1", fontSize: "10px", color: "#475569", fontWeight: "700" }}>
                {["100.00%", "80.00%", "60.00%", "40.00%", "20.00%", "0%"].map((pct, idx) => (
                  <span key={idx} style={{ position: "absolute", top: `${idx * 20}%`, transform: "translateY(-50%)", right: "5px" }}>
                    {pct}
                  </span>
                ))}
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ height: "190px", position: "relative", borderBottom: "1.5px solid #cbd5e1", display: "flex", padding: "0 8px" }}>
                  {[0, 20, 40, 60, 80, 100].map((val, idx) => (
                    <div key={idx} style={{ position: "absolute", left: 0, right: 0, top: `${val}%`, borderTop: "1px solid #f1f5f9" }} />
                  ))}

                  {emailSeries.map((item, idx) => {
                    const errH = item.errPct > 0 ? Math.min(100, item.errPct) : 0;
                    const slH = item.serviceLevel > 0 ? Math.min(100, item.serviceLevel) : 0;

                    return (
                      <div key={idx} style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "3px", position: "relative", zIndex: 1 }}>
                        {/* ERR - only show if > 0 */}
                        {item.errPct > 0 && (
                          <div style={{ flex: 1, maxWidth: "34px", height: `${errH}%`, backgroundColor: blueDark, position: "relative", display: "flex", justifyContent: "center" }}>
                            <span style={{ position: "absolute", top: "-14px", fontSize: "9.5px", fontWeight: "800", color: "#0c3b64", whiteSpace: "nowrap" }}>
                              {item.errPct.toFixed(2)}%
                            </span>
                          </div>
                        )}
                        {/* SL % - only show if > 0 */}
                        {item.serviceLevel > 0 && (
                          <div style={{ flex: 1, maxWidth: "34px", height: `${slH}%`, backgroundColor: blueMid, position: "relative", display: "flex", justifyContent: "center" }}>
                            <span style={{ position: "absolute", top: "-14px", fontSize: "9.5px", fontWeight: "800", color: "#2f71a3", whiteSpace: "nowrap" }}>
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
                    <div key={idx} style={{ flex: 1, textAlign: "center", fontSize: "11.5px", fontWeight: "800", color: "#0c3b64", paddingTop: "5px" }}>
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Red Subtitle */}
            <div style={{ textAlign: "center", color: redAlert, fontSize: "11px", fontWeight: "800", marginTop: "3px", letterSpacing: "0.04em" }}>
              ANSWER % : OFFERED / HANDLED &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; SL % : HANDLED W/SLA / HANDLED
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: QUALITY AUDIT  &  HEADCOUNT VS PEOPLE METRICS                */}
      {/* ========================================================================= */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: "10px", flex: 1 }}>
        {/* 3A: QUALITY AUDIT */}
        <div style={{ border: `2px solid ${navyDark}`, borderRadius: "3px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
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

              <div style={{ display: "flex", height: "220px" }}>
                {/* Y Axis - Clean whole numbers */}
                <div style={{ width: "36px", height: "185px", position: "relative", borderRight: "1.5px solid #cbd5e1", fontSize: "10.5px", color: "#475569", fontWeight: "700" }}>
                  {qaTxTicks.map((val, idx) => (
                    <span key={idx} style={{ position: "absolute", top: `${(idx / (qaTxTicks.length - 1)) * 100}%`, transform: "translateY(-50%)", right: "4px" }}>
                      {Math.round(val)}
                    </span>
                  ))}
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ height: "185px", position: "relative", borderBottom: "1.5px solid #cbd5e1", display: "flex", padding: "0 6px" }}>
                    {qaTxTicks.map((_, idx) => (
                      <div key={idx} style={{ position: "absolute", left: 0, right: 0, top: `${(idx / (qaTxTicks.length - 1)) * 100}%`, borderTop: "1px solid #f1f5f9" }} />
                    ))}

                    {qaSeries.map((item, idx) => {
                      const h = item.transactions > 0 ? Math.min(100, (item.transactions / qaTxAxisMax) * 100) : 0;
                      return (
                        <div key={idx} style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center", position: "relative", zIndex: 1 }}>
                          {item.transactions > 0 && (
                            <div style={{ width: "32px", height: `${h}%`, backgroundColor: blueDark, position: "relative", display: "flex", justifyContent: "center" }}>
                              <span style={{ position: "absolute", top: "3px", color: "#ffffff", fontSize: "10.5px", fontWeight: "800" }}>
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
                      <div key={idx} style={{ flex: 1, textAlign: "center", fontSize: "11px", fontWeight: "800", color: "#0c3b64", paddingTop: "5px" }}>
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
              <div style={{ display: "flex", flexDirection: "column", height: "220px", justifyContent: "space-between" }}>
                <div style={{ height: "185px", display: "flex", flexDirection: "column", justifyContent: "space-around" }}>
                  {qaSeries.map((item, idx) => {
                    const widthPct = item.score > 0 ? Math.min(100, item.score) : 0;

                    return (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "52px", fontSize: "11px", fontWeight: "800", color: "#0c3b64", textAlign: "right" }}>
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
                              <span style={{ color: "#ffffff", fontSize: "10px", fontWeight: "800" }}>
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
                <div style={{ display: "flex", paddingLeft: "60px", borderTop: "1.5px solid #cbd5e1", paddingTop: "3px", justifyContent: "space-between", fontSize: "9.5px", color: "#475569", fontWeight: "700" }}>
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

        {/* 3B: HEADCOUNT VS PEOPLE METRICS (EMPTY PLACEHOLDER CARD) */}
        <div style={{ border: `2px solid ${navyDark}`, borderRadius: "3px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
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
            H E A D C O U N T &nbsp; V S &nbsp; P E O P L E &nbsp; M E T R I C S
          </div>

          {/* Clean Empty Placeholder Body */}
          <div
            style={{
              flex: 1,
              backgroundColor: "#ffffff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "28px",
              margin: "8px",
              border: "1.5px dashed #cbd5e1",
              borderRadius: "4px",
              textAlign: "center",
            }}
          >
            <Users size={42} style={{ color: "#94a3b8", marginBottom: "10px" }} />
            <div style={{ fontSize: "14px", fontWeight: "800", color: "#0c3b64", marginBottom: "6px" }}>
              Occupancy & Headcount Performance
            </div>
            <div style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "500" }}>
              Occupancy & HC reporting metrics will be displayed here.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
