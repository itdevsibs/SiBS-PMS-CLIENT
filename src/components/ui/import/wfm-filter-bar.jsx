import { Search } from "lucide-react";
import SingleSelectDropdown from "@/components/ui/Filter/SingleSelectDropdown";

export default function WfmFilterBar({
  selectedAccount,
  onSelectAccount,
  rawDataSearch,
  onSearchChange,
  accountFilters = [],
  sourceSystemCounts = {},
}) {
  return (
    <div className="mb-3 sm:mb-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap lg:flex-nowrap sm:items-center sm:justify-start">
      <div className="flex h-9 w-full sm:w-auto sm:min-w-[120px] shrink-0 items-center justify-center truncate rounded-full border border-sibs-tertiary-9 bg-white px-4 text-xs sm:text-sm font-extrabold text-sibs-primary-1 shadow-2xs">
        {selectedAccount === "All Accounts" ? "All Accounts" : selectedAccount}
      </div>

      <div className="relative w-full sm:flex-1 sm:min-w-[200px] lg:max-w-xs shrink-0">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sibs-tertiary-6"
          aria-hidden="true"
        />
        <input
          value={rawDataSearch}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-9 w-full rounded-full border border-sibs-tertiary-9 bg-white pl-9 pr-4 text-xs sm:text-sm outline-none focus:border-sibs-primary-2 shadow-2xs"
          placeholder="Search data..."
          type="text"
        />
      </div>

      <SingleSelectDropdown
        className="w-full sm:w-60 md:w-64 shrink-0"
        buttonClassName="h-9 rounded-full border border-sibs-tertiary-9 bg-white px-4 text-xs sm:text-sm font-semibold text-sibs-primary-1 shadow-2xs"
        value={selectedAccount}
        onChange={(event) => onSelectAccount(event.target.value)}
        options={accountFilters.map((account) => ({
          value: account,
          label: `${account} (${sourceSystemCounts[account] || 0})`,
        }))}
      />
    </div>
  );
}

