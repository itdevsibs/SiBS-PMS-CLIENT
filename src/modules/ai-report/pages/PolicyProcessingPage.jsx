import { useState, useEffect } from "react";
import {
  FileCog,
  Sparkles,
  BookOpen,
} from "lucide-react";
import AIReportLayout from "./AIReportLayout";
import { useAuthAccess } from "@/context/AuthAccessContext";
import { hasPermissionForUser, PERMISSIONS } from "@/config/accessControl";
import {
  getPolicyProcessingOverview,
  getPolicyProcessingDocuments,
  reprocessPolicyDocument,
  getPolicyPdfPreviewUrl,
} from "@/lib/axios/policy-processing";
import PolicyOverviewCards from "@/pages/policyProcessing/PolicyOverviewCards";
import PolicyDocumentTable from "@/pages/policyProcessing/PolicyDocumentTable";
import PolicyDetailModal from "@/pages/policyProcessing/PolicyDetailModal";
import PolicyUploadModal from "@/pages/policyProcessing/PolicyUploadModal";

export default function PolicyProcessingPage() {
  const { user } = useAuthAccess();
  const canManage = hasPermissionForUser(user, PERMISSIONS.MANAGE_POLICY_PROCESSING);

  // Overview metrics state
  const [overview, setOverview] = useState({
    totalDocuments: 0,
    successfullyProcessed: 0,
    pendingProcessing: 0,
    failedAttention: 0,
  });
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Documents list state
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  // Trigger re-fetch on actions
  const [refreshVersion, setRefreshVersion] = useState(0);

  // Interaction states
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [processingDocId, setProcessingDocId] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    let ignore = false;
    getPolicyProcessingOverview()
      .then((data) => {
        if (!ignore) {
          setOverview(data);
          setOverviewLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load policy processing overview:", err);
          setOverviewLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [refreshVersion]);

  useEffect(() => {
    let ignore = false;
    getPolicyProcessingDocuments({
      page: pagination.page,
      limit: pagination.limit,
      search,
      category,
      status,
    })
      .then((res) => {
        if (!ignore && res && res.success) {
          setDocuments(res.data || []);
          if (res.pagination) {
            setPagination(res.pagination);
          }
          setListLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load policy processing documents:", err);
          setListLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [pagination.page, pagination.limit, search, category, status, refreshVersion]);

  // Handle Reprocess action
  const handleReprocess = async (docId) => {
    try {
      setProcessingDocId(docId);
      const res = await reprocessPolicyDocument(docId);
      setNotification({
        type: "success",
        message: res.message || "Document successfully extracted and reprocessed.",
      });
      setOverviewLoading(true);
      setListLoading(true);
      setRefreshVersion((v) => v + 1);
    } catch (err) {
      setNotification({
        type: "error",
        message:
          err?.response?.data?.message ||
          err.message ||
          "Failed to reprocess policy document.",
      });
    } finally {
      setProcessingDocId(null);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Handle Inspect Details
  const handleViewDetail = (doc) => {
    setSelectedDocId(doc.id);
    setSelectedDoc(doc);
  };

  // Handle Preview PDF in new tab
  const handlePreviewPdf = (doc) => {
    const previewUrl = getPolicyPdfPreviewUrl(doc.id);
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <AIReportLayout
      title="Policy Processing"
      subtitle="Enterprise PDF Business Rules Extraction & Governance • Hermes AI Ready"
    >
      <div className="w-full space-y-4 pb-6">
        {/* Page Title & Context Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#082B60] text-white shadow-xs">
              <FileCog size={26} className="text-[#ff5c28]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-[#14233F] tracking-tight">
                  Policy Processing
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-extrabold text-[#082B60]">
                  <Sparkles size={11} className="text-[#ff5c28]" />
                  <span>Hermes AI Ready</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Enterprise PDF business rules extraction, indexing, and retrieval for PMS operational governance
              </p>
            </div>
          </div>

          {/* Business Rule Banner */}
          <div className="flex items-center gap-2 rounded-xl bg-white border border-[#DCE4EE] p-3 shadow-2xs max-w-md">
            <BookOpen size={18} className="text-[#082B60] shrink-0" />
            <p className="text-[11px] text-slate-600 leading-snug">
              <strong>Authoritative Source:</strong> Approved repository PDFs define PMS KPI formulas, thresholds, weights, and PMP/PIP conditions.
            </p>
          </div>
        </div>

        {/* Notification toast */}
        {notification && (
          <div
            className={`flex items-center justify-between rounded-xl p-4 text-xs font-bold shadow-xs transition-all ${
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            <span>{notification.message}</span>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-700 font-bold ml-3 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Overview Cards */}
        <PolicyOverviewCards overview={overview} loading={overviewLoading} />

        {/* Main Documents Table */}
        <PolicyDocumentTable
          documents={documents}
          pagination={pagination}
          loading={listLoading}
          search={search}
          onSearchChange={(val) => setSearch(val)}
          category={category}
          onCategoryChange={(val) => setCategory(val)}
          status={status}
          onStatusChange={(val) => setStatus(val)}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          onRefresh={() => {
            setOverviewLoading(true);
            setListLoading(true);
            setRefreshVersion((v) => v + 1);
          }}
          onViewDetail={handleViewDetail}
          onPreviewPdf={handlePreviewPdf}
          onReprocess={handleReprocess}
          onOpenUpload={() => setIsUploadOpen(true)}
          canManage={canManage}
          processingDocId={processingDocId}
        />

        {/* Detail / Inspection Modal */}
        {selectedDocId && (
          <PolicyDetailModal
            documentId={selectedDocId}
            initialDocument={selectedDoc}
            onClose={() => {
              setSelectedDocId(null);
              setSelectedDoc(null);
            }}
            onReprocess={handleReprocess}
            canManage={canManage}
            isReprocessing={processingDocId === selectedDocId}
          />
        )}

        {/* Upload Modal */}
        {isUploadOpen && (
          <PolicyUploadModal
            isOpen={isUploadOpen}
            onClose={() => setIsUploadOpen(false)}
            onUploadSuccess={() => {
              setOverviewLoading(true);
              setListLoading(true);
              setPagination((prev) => ({ ...prev, page: 1 }));
              setRefreshVersion((v) => v + 1);
              setNotification({
                type: "success",
                message: "Policy document uploaded and processed successfully.",
              });
              setTimeout(() => setNotification(null), 5000);
            }}
          />
        )}
      </div>
    </AIReportLayout>
  );
}
