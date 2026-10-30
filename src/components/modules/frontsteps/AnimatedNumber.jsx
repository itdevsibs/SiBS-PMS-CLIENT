import React, { useState, useEffect } from "react";

export function useAnimatedNumber(value, duration = 1500, delay = 0) {
  const [displayValue, setDisplayValue] = useState(() => {
    const str = String(value ?? "").trim();
    if (str.startsWith("$")) return "$0";
    if (str.endsWith("%")) return "0%";
    if (str.endsWith("s")) return "0s";
    if (/^\d+:\d{2}:\d{2}$/.test(str)) return "0:00:00";
    if (/^\d{1,2}:\d{2}$/.test(str)) return "0:00";
    return "0";
  });

  useEffect(() => {
    if (value === null || value === undefined || value === "") return;
    const str = String(value).trim();

    // Check if value is a time string like "0:17:15" or "1:00:56" (H:MM:SS)
    const timeMatch = str.match(/^(\d+):(\d{2}):(\d{2})$/);
    if (timeMatch) {
      const targetSeconds =
        parseInt(timeMatch[1], 10) * 3600 +
        parseInt(timeMatch[2], 10) * 60 +
        parseInt(timeMatch[3], 10);

      let startTime = null;
      let animationFrameId;

      const timeoutId = setTimeout(() => {
        const step = (timestamp) => {
          if (!startTime) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          const curSeconds = Math.round(targetSeconds * ease);

          const h = Math.floor(curSeconds / 3600);
          const m = Math.floor((curSeconds % 3600) / 60);
          const s = curSeconds % 60;

          const formatted = `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
          setDisplayValue(formatted);

          if (progress < 1) {
            animationFrameId = requestAnimationFrame(step);
          }
        };
        animationFrameId = requestAnimationFrame(step);
      }, delay);

      return () => {
        clearTimeout(timeoutId);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      };
    }

    const prefix = str.startsWith("$") ? "$" : "";
    const suffixMatch = str.match(/[%s]+$/);
    const suffix = suffixMatch ? suffixMatch[0] : "";
    const numStr = str.replace(/[^0-9.]/g, "");
    const target = parseFloat(numStr);

    if (isNaN(target)) {
      setDisplayValue(value);
      return;
    }

    const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;
    const hasComma = str.includes(",");

    let startTime = null;
    let animationFrameId;

    const timeoutId = setTimeout(() => {
      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = target * ease;

        let formatted = decimals > 0 ? current.toFixed(decimals) : Math.round(current).toString();
        if (hasComma) {
          const parts = formatted.split(".");
          parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          formatted = parts.join(".");
        }

        setDisplayValue(`${prefix}${formatted}${suffix}`);

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        }
      };
      animationFrameId = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration, delay]);

  return displayValue;
}

export default function AnimatedNumber({
  value,
  duration = 1500,
  delay = 0,
  className = "",
  as = "span",
  ...rest
}) {
  const displayValue = useAnimatedNumber(value, duration, delay);

  if (as === "tspan") {
    return <tspan className={className} {...rest}>{displayValue}</tspan>;
  }

  return <span className={className} {...rest}>{displayValue}</span>;
}
