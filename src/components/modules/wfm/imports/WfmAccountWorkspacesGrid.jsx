import { ArrowRight, FolderOpen, Layers } from "lucide-react";

export default function WfmAccountWorkspacesGrid({
  accountOptions = [],
  sourceSystemCounts = {},
  onSelectAccount,
}) {
  if (!accountOptions.length) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-sibs-tertiary-9 bg-[#f8fbfd] px-5 py-8 text-center text-sm text-sibs-tertiary-5">
        No accounts found.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2.5 flex items-center gap-1.5">
        <h2 className="m-0 text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
          Accounts & Workspaces
        </h2>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {accountOptions.map((account) => {
          const totalSourceSystems = sourceSystemCounts[account] || 0;

          return (
            <button
              key={account}
              type="button"
              onClick={() => onSelectAccount(account)}
              className="group relative flex min-h-[135px] cursor-pointer flex-col justify-between rounded-2xl border border-slate-300/90 bg-white p-4 text-left shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-sibs-primary-2 hover:shadow-md ring-1 ring-slate-900/[0.04]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#07385f] text-white shadow-2xs group-hover:bg-sibs-primary-2 transition-colors">
                  <FolderOpen size={16} />
                </div>
                <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider text-slate-600">
                  Account
                </span>
              </div>

              <div className="my-auto py-2">
                <p className="m-0 text-base font-extrabold text-sibs-primary-1 group-hover:text-sibs-primary-2 transition-colors">
                  {account}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-sibs-tertiary-5">
                <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                  <Layers size={13} className="text-slate-400" />
                  {totalSourceSystems}{" "}
                  {totalSourceSystems === 1 ? "source system" : "source systems"}
                </span>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-50 text-slate-400 group-hover:bg-sibs-primary-2 group-hover:text-white transition-all">
                  <ArrowRight size={13} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

