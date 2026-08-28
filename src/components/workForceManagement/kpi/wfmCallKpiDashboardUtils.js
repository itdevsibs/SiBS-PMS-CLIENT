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
  const step = getNiceStep(maxValue, safeTickCount);
  const axisMax = Math.max(step * safeTickCount, Math.ceil((Number(maxValue) || 0) / step) * step);
  const interval = axisMax / safeTickCount;

  return Array.from({ length: safeTickCount + 1 }, (_, index) =>
    Math.max(0, Math.round(axisMax - interval * index)),
  );
}


export function buildVolumeBarItems(item = {}) {
  return [
    { metric: "Volume", value: Number(item.callsOffered || 0), className: "bg-[#0b3b68]" },
    { metric: "Handled", value: Number(item.callsHandled || 0), className: "bg-[#2f6f9f]" },
    { metric: "Handled w/SLA", value: Number(item.handledWithinSla || 0), className: "bg-[#4c9aca]" },
  ];
}
