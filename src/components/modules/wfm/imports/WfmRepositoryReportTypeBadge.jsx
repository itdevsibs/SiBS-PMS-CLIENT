import { getRepositoryReportTypeForUpload } from "@/lib/wfm-import-repository-tools";

// Consistent report-type identification across the calendar and list views.
export default function WfmRepositoryReportTypeBadge({ upload }) {
  return <span className="inline-flex max-w-full items-center rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-800">
    {getRepositoryReportTypeForUpload(upload)}
  </span>;
}
