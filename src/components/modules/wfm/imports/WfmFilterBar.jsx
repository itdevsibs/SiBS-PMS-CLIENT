import { Search } from "lucide-react";
import SingleSelectDropdown from "@/components/common/filters/SingleSelectDropdown";

export default function WfmFilterBar({
  selectedAccount,
  onSelectAccount,
  rawDataSearch,
  onSearchChange,
  accountFilters = [],
  sourceSystemCounts = {},
}) {
  return (
    <div className="mb-2 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-start shrink-0">
      {/* Control 1: Account selector dropdown */}
      <SingleSelectDropdown
        className="w-full sm:w-44 shrink-0"
        buttonClassName="h-8.5 rounded-xl border border-[#D7E1EE] bg-white px-3 text-xs font-bold text-[#102448] shadow-2xs hover:bg-[#F3F6FA] hover:border-[#B5C9E2] transition-all"
        value={selectedAccount === "All Accounts" ? "US VISA" : selectedAccount}
        onChange={(event) => onSelectAccount(event.target.value)}
        options={accountFilters
          .filter((acc) => acc !== "All Accounts")
          .map((account) => ({
            value: account,
            label: account,
          }))}
      />

      {/* Control 2: Search Input with rounded corners and thin border */}
      <div className="relative w-full sm:flex-1 sm:min-w-[200px] lg:max-w-sm shrink-0">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#587094]"
          aria-hidden="true"
        />
        <input
          value={rawDataSearch}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-8.5 w-full rounded-xl border border-[#D7E1EE] bg-white pl-9 pr-3 text-xs text-[#102448] placeholder-[#587094] outline-none focus:border-[#062A5C] shadow-2xs transition-all"
          placeholder="Search data..."
          type="text"
        />
      </div>
    </div>
  );
}
