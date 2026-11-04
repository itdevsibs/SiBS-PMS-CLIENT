import React from "react";
import { ChevronDown } from "lucide-react";

/**
 * Header for Data Management matching the approved reference design.
 * Features:
 * - Slim vertical navy accent line on the left of "Data Management"
 * - Subtitle: "Manage data imports, files, and policy documents"
 * - Right-aligned account selector pill ("FrontSteps" with green dot & chevron)
 */
export default function DataManagementHeader({ accountName = "FrontSteps" }) {
  return (
    <div className="flex items-center justify-between pb-3 border-b border-[#DCE4EE] bg-white shrink-0 select-none">
      <div className="flex items-start gap-2.5">
        {/* Slim vertical navy accent line */}
        <div className="w-[3px] h-[34px] bg-[#12376B] rounded-full mt-0.5 shrink-0" />
        <div>
          <h1 className="text-[20px] font-extrabold text-[#14233F] leading-tight tracking-tight">
            Data Management
          </h1>
          <p className="text-[12px] text-[#526582] font-medium mt-0.5">
            Manage data imports, files, and policy documents
          </p>
        </div>
      </div>

      {/* Right Side: Account Selector Pill */}
      <div className="flex items-center">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-[#DCE4EE] bg-white px-3 py-1.5 text-xs font-bold text-[#14233F] shadow-2xs hover:bg-[#F4F6F9] transition-colors cursor-pointer"
        >
          <span className="h-2 w-2 rounded-full bg-[#15803D]" />
          <span>{accountName}</span>
          <ChevronDown size={14} className="text-[#526582]" />
        </button>
      </div>
    </div>
  );
}

