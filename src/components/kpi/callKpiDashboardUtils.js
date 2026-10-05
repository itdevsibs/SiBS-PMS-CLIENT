import { useCallback, useEffect, useRef } from "react";

export function convertDurationToSeconds(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, value);
  }

  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return 0;

  if (/^\d+(?:\.\d+)?$/.test(text)) {
    return Math.max(0, Number(text));
  }

  const minuteMatch = text.match(/(\d+(?:\.\d+)?)\s*m/);
  const secondMatch = text.match(/(\d+(?:\.\d+)?)\s*s/);

  if (minuteMatch || secondMatch) {
    const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
    const seconds = secondMatch ? Number(secondMatch[1]) : 0;
    return Math.max(0, minutes * 60 + seconds);
  }

  const clockMatch = text.match(/^(\d+):([0-5]?\d)$/);
  if (clockMatch) {
    return Number(clockMatch[1]) * 60 + Number(clockMatch[2]);
  }

  return 0;
}

function getNiceStep(maxValue, tickCount) {
  const safeMax = Math.max(1, Number(maxValue) || 0);
  const safeTickCount = Math.max(1, Number(tickCount) || 4);
  const roughStep = safeMax / safeTickCount;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;

  if (normalized <= 1) return magnitude;
  if (normalized <= 1.25) return 1.25 * magnitude;
  if (normalized <= 2) return 2 * magnitude;
  if (normalized <= 2.5) return 2.5 * magnitude;
  if (normalized <= 5) return 5 * magnitude;
  return 10 * magnitude;
}

export function getCallAxisTicks(maxValue, tickCount = 4) {
  const safeTickCount = Math.max(1, Math.floor(Number(tickCount) || 4));
  // Add headroom so the tallest bars and their labels never collide with the top axis border
  const paddedMax = Math.max(1, Number(maxValue) || 0) * 1.12;
  const step = getNiceStep(paddedMax, safeTickCount);
  const axisMax = Math.max(step, Math.ceil(paddedMax / step) * step);
  const numSteps = Math.max(1, Math.round(axisMax / step));

  return Array.from({ length: numSteps + 1 }, (_, index) =>
    Math.max(0, Math.round(axisMax - step * index)),
  );
}


export function buildVolumeBarItems(item = {}) {
  return [
    { metric: "Volume", value: Number(item.callsOffered || 0), className: "bg-[#0b3b68]" },
    { metric: "Handled", value: Number(item.callsHandled || 0), className: "bg-[#2f6f9f]" },
    { metric: "Handled w/SLA", value: Number(item.handledWithinSla || 0), className: "bg-[#4c9aca]" },
  ];
}

export async function downloadKpiGraphsAsPdf(targetElementOrId = "kpi-graphs-container") {
  const element =
    typeof targetElementOrId === "string"
      ? document.getElementById(targetElementOrId)
      : targetElementOrId;

  if (!element) {
    console.warn("PDF Export: Target graphs element not found.");
    return false;
  }

  const html2canvasModule = await import("html2canvas-pro");
  const html2canvas = html2canvasModule.default || html2canvasModule.html2canvas;
  const { jsPDF } = await import("jspdf");

  // Short delay to allow transitions to settle
  await new Promise((resolve) => setTimeout(resolve, 150));

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#f8fbfd",
    onclone: (clonedDoc) => {
      const clonedCharts = clonedDoc.querySelector("[data-pdf-charts]");
      if (clonedCharts) {
        clonedCharts.style.width = "1350px";
        clonedCharts.style.display = "grid";
        clonedCharts.style.gridTemplateColumns = "1.3fr 1.1fr 0.95fr";
        clonedCharts.style.gap = "14px";
      }
    },
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  // Report Header
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.setTextColor(4, 44, 81);
  pdf.text("CALLS KPI PERFORMANCE GRAPHS", 12, 14);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(100, 116, 139);
  const now = new Date();
  const timestamp =
    now.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    }) +
    ` at ${now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  pdf.text(
    `Exported on ${timestamp} • Performance Management System`,
    12,
    19,
  );

  // Fit chart image centered on landscape page
  const marginX = 12;
  const startY = 23;
  const availableWidth = pdfWidth - marginX * 2;
  const availableHeight = pdfHeight - startY - 10;

  const imgRatio = canvas.width / canvas.height;
  let finalWidth = availableWidth;
  let finalHeight = finalWidth / imgRatio;

  if (finalHeight > availableHeight) {
    finalHeight = availableHeight;
    finalWidth = finalHeight * imgRatio;
  }

  const finalX = marginX + (availableWidth - finalWidth) / 2;
  const finalY = startY + (availableHeight - finalHeight) / 2;

  pdf.addImage(
    imgData,
    "PNG",
    finalX,
    finalY,
    finalWidth,
    finalHeight,
    undefined,
    "FAST",
  );

  const fileDate = now.toISOString().slice(0, 10);
  pdf.save(`Calls-KPI-Graphs-${fileDate}.pdf`);
  return true;
}

export async function downloadSelectedKpiReportsAsPdf({
  sections = [],
  filename = null,
  isAllReportsDashboard = false,
  allReportsElementId = "export-all-reports-dashboard",
}) {
  const html2canvasModule = await import("html2canvas-pro");
  const html2canvas = html2canvasModule.default || html2canvasModule.html2canvas;
  const { jsPDF } = await import("jspdf");

  // Short delay to allow transitions and renders to settle
  await new Promise((resolve) => setTimeout(resolve, 250));

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const now = new Date();
  const fileDate = now.toISOString().slice(0, 10);

  // If exporting the consolidated All Reports executive dashboard
  if (isAllReportsDashboard) {
    const element =
      document.getElementById(allReportsElementId) ||
      document.getElementById("all-reports-pdf-view");

    if (!element) {
      console.warn(`PDF Export: Element not found for All Reports Dashboard (id: ${allReportsElementId})`);
      return false;
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");

    // Clean minimal margin around landscape page (4mm) to maximize chart visibility
    const marginX = 4;
    const marginY = 4;
    const availableWidth = pdfWidth - marginX * 2;
    const availableHeight = pdfHeight - marginY * 2;

    const imgRatio = canvas.width / canvas.height;
    let finalWidth = availableWidth;
    let finalHeight = finalWidth / imgRatio;

    if (finalHeight > availableHeight) {
      finalHeight = availableHeight;
      finalWidth = finalHeight * imgRatio;
    }

    const finalX = marginX + (availableWidth - finalWidth) / 2;
    const finalY = marginY + (availableHeight - finalHeight) / 2;

    pdf.addImage(
      imgData,
      "PNG",
      finalX,
      finalY,
      finalWidth,
      finalHeight,
      undefined,
      "FAST",
    );

    const saveName = filename || `All-Reports-Performance-Summary-${fileDate}.pdf`;
    pdf.save(saveName);
    return true;
  }

  if (!sections.length) return false;

  const timestamp =
    now.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    }) +
    ` at ${now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;

  let pagesExported = 0;

  for (let i = 0; i < sections.length; i++) {
    const item = sections[i];
    const element =
      item.element ||
      (typeof item.elementId === "string"
        ? document.getElementById(item.elementId)
        : null);

    if (!element) {
      console.warn(`PDF Export: Element not found for section "${item.id}" (id: ${item.elementId})`);
      continue;
    }

    if (pagesExported > 0) {
      pdf.addPage("a4", "landscape");
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#f8fbfd",
      onclone: (clonedDoc) => {
        const clonedCharts = clonedDoc.querySelector("[data-pdf-charts]");
        if (clonedCharts) {
          clonedCharts.style.width = "1350px";
          clonedCharts.style.display = "grid";
          clonedCharts.style.gridTemplateColumns = "1.3fr 1.1fr 0.95fr";
          clonedCharts.style.gap = "14px";
        }
      },
    });

    const imgData = canvas.toDataURL("image/png");

    // Report Header - exact same format as downloadKpiGraphsAsPdf
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(4, 44, 81);
    pdf.text(item.title || "KPI PERFORMANCE GRAPHS", 12, 14);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(
      `Exported on ${timestamp} • Performance Management System`,
      12,
      19,
    );

    // Fit chart image centered on landscape page
    const marginX = 12;
    const startY = 23;
    const availableWidth = pdfWidth - marginX * 2;
    const availableHeight = pdfHeight - startY - 10;

    const imgRatio = canvas.width / canvas.height;
    let finalWidth = availableWidth;
    let finalHeight = finalWidth / imgRatio;

    if (finalHeight > availableHeight) {
      finalHeight = availableHeight;
      finalWidth = finalHeight * imgRatio;
    }

    const finalX = marginX + (availableWidth - finalWidth) / 2;
    const finalY = startY + (availableHeight - finalHeight) / 2;

    pdf.addImage(
      imgData,
      "PNG",
      finalX,
      finalY,
      finalWidth,
      finalHeight,
      undefined,
      "FAST",
    );

    pagesExported += 1;
  }

  if (pagesExported === 0) {
    return false;
  }

  const saveName =
    filename ||
    (sections.length === 1
      ? `${(sections[0].name || sections[0].id || "Report")}-KPI-Graphs-${fileDate}.pdf`
      : `Performance-Report-${fileDate}.pdf`);

  pdf.save(saveName);
  return true;
}

export function useSyncedHorizontalScroll(isCustomPeriod = false) {
  const containerSet = useRef(new Set());
  const cleanupMap = useRef(new Map());
  const isSyncingRef = useRef(false);
  const isActiveRef = useRef(isCustomPeriod);

  useEffect(() => {
    isActiveRef.current = isCustomPeriod;
  }, [isCustomPeriod]);

  // Clean up all listeners on unmount
  useEffect(() => {
    const cleanups = cleanupMap.current;
    return () => {
      cleanups.forEach((fn, el) => {
        el.removeEventListener("scroll", fn);
      });
      cleanups.clear();
      containerSet.current.clear();
    };
  }, []);

  const register = useCallback((node) => {
    if (node) {
      if (cleanupMap.current.has(node)) return;

      containerSet.current.add(node);

      const onScroll = () => {
        if (!isActiveRef.current || isSyncingRef.current) return;
        isSyncingRef.current = true;
        const scrollLeft = node.scrollLeft;

        containerSet.current.forEach((other) => {
          if (other && other !== node && Math.abs(other.scrollLeft - scrollLeft) > 0.5) {
            other.scrollLeft = scrollLeft;
          }
        });

        requestAnimationFrame(() => {
          isSyncingRef.current = false;
        });
      };

      node.addEventListener("scroll", onScroll, { passive: true });
      cleanupMap.current.set(node, onScroll);
    }
  }, []);

  return register;
}
