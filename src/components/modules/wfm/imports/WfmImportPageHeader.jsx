import React from "react";

/**
 * Top Page Header for WFM Import Data module matching the approved design.
 * Compact height to eliminate vertical page scroll.
 */
export default function WfmImportPageHeader() {
  return (
    <div className="flex items-center gap-2.5 pb-2 bg-white shrink-0 select-none">
      {/* Slim vertical navy accent line */}
      <div className="w-[3px] h-[28px] bg-[#062A5C] rounded-full shrink-0" />
      <div>
        <h1 className="text-[18px] font-black text-[#102448] leading-none tracking-tight m-0">
          Import Data
        </h1>
        <p className="text-[11px] text-[#587094] font-medium mt-0.5 leading-none m-0">
          Import and manage data files from multiple sources.
        </p>
      </div>
    </div>
  );
}
