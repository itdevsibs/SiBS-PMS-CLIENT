import { useState, useRef } from "react";
import {
  X,
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { uploadPolicyDocument } from "@/lib/axios/policy-processing";

export default function PolicyUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
}) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [documentCode, setDocumentCode] = useState("");
  const [category, setCategory] = useState("Operations Policy");
  const [revisionNumber, setRevisionNumber] = useState("000");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf") {
      setError("Unsupported file format. Please select a valid PDF file (.pdf).");
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError("File exceeds 50 MB size limit.");
      return;
    }

    setError("");
    setFile(selectedFile);

    // Auto-fill title from filename if not yet filled
    if (!title) {
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setTitle(cleanName);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a PDF document to upload.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title || file.name);
      formData.append("documentCode", documentCode || "FS-POL");
      formData.append("category", category);
      formData.append("revisionNumber", revisionNumber || "000");
      if (description) {
        formData.append("description", description);
      }

      await uploadPolicyDocument(formData, (percent) => {
        setProgress(percent);
      });

      if (onUploadSuccess) {
        onUploadSuccess();
      }
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to upload and process policy document."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center overflow-y-auto bg-black/60 p-4 sm:p-6 backdrop-blur-xs">
      <div className="relative flex flex-col w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#DCE4EE] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-[#082B60] px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <Upload size={18} className="text-[#ff5c28]" />
            <h3 className="text-base font-extrabold tracking-wide text-white">
              Upload Approved Policy Document
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop File Target */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,application/pdf"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />

          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFileSelect(e.dataTransfer.files?.[0]);
            }}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
              dragging
                ? "border-[#ff5c28] bg-orange-50/50"
                : file
                ? "border-emerald-400 bg-emerald-50/30"
                : "border-slate-300 bg-slate-50 hover:border-[#082B60] hover:bg-slate-100"
            }`}
          >
            {file ? (
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 size={24} className="text-emerald-600" />
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-800 truncate max-w-[280px]">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for processing
                  </p>
                </div>
              </div>
            ) : (
              <>
                <FolderOpen size={28} className="text-slate-400 mb-1" />
                <p className="text-xs font-bold text-slate-700">
                  Drag and drop PDF here, or <span className="text-[#082B60] underline">browse</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  PDF format only • Max file size: 50 MB
                </p>
              </>
            )}
          </div>

          {/* Metadata Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#14233F] mb-1">
                Document Code
              </label>
              <input
                type="text"
                value={documentCode}
                onChange={(e) => setDocumentCode(e.target.value)}
                placeholder="e.g. FS-PIP-002"
                className="w-full rounded-lg border border-[#DCE4EE] bg-white px-3 py-2 text-xs text-[#14233F] focus:border-[#082B60] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#14233F] mb-1">
                Revision Number
              </label>
              <input
                type="text"
                value={revisionNumber}
                onChange={(e) => setRevisionNumber(e.target.value)}
                placeholder="000"
                className="w-full rounded-lg border border-[#DCE4EE] bg-white px-3 py-2 text-xs text-[#14233F] focus:border-[#082B60] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#14233F] mb-1">
              Document Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Performance Incentive Program Policy"
              className="w-full rounded-lg border border-[#DCE4EE] bg-white px-3 py-2 text-xs text-[#14233F] focus:border-[#082B60] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#14233F] mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-[#DCE4EE] bg-white px-3 py-2 text-xs text-[#14233F] focus:border-[#082B60] outline-none"
            >
              <option value="Operations Policy">Operations Policy</option>
              <option value="Performance Incentive">Performance Incentive</option>
              <option value="FrontSteps Policy">FrontSteps Policy</option>
              <option value="WFM Standard">WFM Standard</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#14233F] mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the policy scope and rules..."
              className="w-full rounded-lg border border-[#DCE4EE] bg-white px-3 py-2 text-xs text-[#14233F] focus:border-[#082B60] outline-none"
            />
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Uploading & Processing Document...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#082B60] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#DCE4EE]">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="rounded-lg bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#082B60] hover:bg-[#12376B] px-5 py-2 text-xs font-bold text-white transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload size={14} />
                  <span>Upload & Process</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
