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
    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-start">
      <div className="flex h-9 w-full shrink-0 items-center justify-center truncate rounded-full border border-sibs-tertiary-9 bg-white px-4 text-sm font-extrabold text-sibs-primary-1 sm:w-32">
        {selectedAccount === "All Accounts" ? "All Accounts" : selectedAccount}
      </div>

      <div className="relative w-full shrink-0 sm:w-80">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sibs-tertiary-6"
          aria-hidden="true"
        />
        <input
          value={rawDataSearch}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-9 w-full rounded-full border border-sibs-tertiary-9 bg-white pl-9 pr-4 text-sm outline-none focus:border-sibs-primary-2"
          placeholder="Search data..."
          type="text"
        />
      </div>

      <SingleSelectDropdown
        className="w-full shrink-0 sm:w-64"
        buttonClassName="h-9 rounded-full border border-sibs-tertiary-9 bg-white px-4 text-sm font-semibold text-sibs-primary-1"
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

