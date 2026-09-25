import { useState } from "react";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import ImportProgressModal from "@/components/ui/import-progress-modal";
import LoadingModal from "@/components/ui/loading-modal";
import WfmBatchDetailsModal from "@/components/ui/import/wfm-batch-details-modal";
import WfmCardUploadsModal from "@/components/ui/import/wfm-card-uploads-modal";
import WfmErrorDetailsModal from "@/components/ui/import/wfm-error-details-modal";
import WfmReadOnlyExcelModal from "@/components/ui/import/wfm-read-only-excel-modal";
import {
  AddedUploadSuccessModal,
  DuplicateUploadAlertModal,
  RemovedUploadSuccessModal,
} from "@/components/ui/import/wfm-status-feedback-modals";
import WfmTaskOrderModal from "@/components/ui/import/wfm-task-order-modal";
import WfmWarningsModal from "@/components/ui/import/wfm-warnings-modal";

export default function WfmImportModals({
  // Task Order
  pendingTaskOrderUpload,
  selectedTaskOrderId,
  setSelectedTaskOrderId,
  onCancelTaskOrderUpload,
  onConfirmTaskOrderUpload,

  // Card Uploads
  activeOpenCard,
  onCloseCardUploads,
  uploadedDataSearch,
  setUploadedDataSearch,
  isLoadingUsVisaErrors,
  handleOpenUsVisaErrors,
  handleOpenBatchDetails,
  setUploadToRemove,

  // Error Details
  usVisaErrorDetails,
  usVisaBatchResult,
  errorPagination,
  activeErrorBatchId,
  errorSearchQuery,
  setErrorSearchQuery,
  errorSeverityFilter,
  setErrorSeverityFilter,
  jumpPageInput,
  setJumpPageInput,
  onCloseErrorDetails,

  // Batch Details
  selectedUploadDetails,
  onCloseBatchDetails,

  // Warnings
  isWarningsModalOpen,
  onCloseWarnings,
  uploadsByCard,
  selectedAccount,

  // Status Alerts
  duplicateUploadAlert,
  onCloseDuplicateAlert,
  addedUpload,
  onCloseAddedUpload,
  removedUpload,
  onCloseRemovedUpload,

  // Confirmation & Progress
  uploadToRemove,
  onCancelRemoveUpload,
  onConfirmRemoveUpload,
  showLogoutModal,
  onCancelLogout,
  onConfirmLogout,
  isLoggingOut,
  isUploading,
  importFileName,
  uploadingCardTitle,
  uploadProgress,
  importStage,
  importProgressDetail,
  errorModalInfo,
  onCloseErrorInfo,
}) {
  const [selectedRawBatch, setSelectedRawBatch] = useState(null);

  return (
    <>
      {/* Task Order Selection Modal */}
      <WfmTaskOrderModal
        pendingTaskOrderUpload={pendingTaskOrderUpload}
        selectedTaskOrderId={selectedTaskOrderId}
        setSelectedTaskOrderId={setSelectedTaskOrderId}
        onCancel={onCancelTaskOrderUpload}
        onConfirm={onConfirmTaskOrderUpload}
      />

      {/* Card Uploads Modal */}
      <WfmCardUploadsModal
        activeOpenCard={activeOpenCard}
        onClose={onCloseCardUploads}
        uploadedDataSearch={uploadedDataSearch}
        setUploadedDataSearch={setUploadedDataSearch}
        uploadsByCard={uploadsByCard}
        isLoadingUsVisaErrors={isLoadingUsVisaErrors}
        handleOpenUsVisaErrors={handleOpenUsVisaErrors}
        handleOpenBatchDetails={handleOpenBatchDetails}
        onOpenRawData={(batch) => setSelectedRawBatch(batch)}
        setUploadToRemove={setUploadToRemove}
      />

      {/* Error Details Modal */}
      <WfmErrorDetailsModal
        usVisaErrorDetails={usVisaErrorDetails}
        usVisaBatchResult={usVisaBatchResult}
        errorPagination={errorPagination}
        activeErrorBatchId={activeErrorBatchId}
        errorSearchQuery={errorSearchQuery}
        setErrorSearchQuery={setErrorSearchQuery}
        errorSeverityFilter={errorSeverityFilter}
        setErrorSeverityFilter={setErrorSeverityFilter}
        jumpPageInput={jumpPageInput}
        setJumpPageInput={setJumpPageInput}
        isLoadingUsVisaErrors={isLoadingUsVisaErrors}
        handleOpenUsVisaErrors={handleOpenUsVisaErrors}
        onClose={onCloseErrorDetails}
      />

      {/* Batch Details Modal */}
      <WfmBatchDetailsModal
        selectedUploadDetails={selectedUploadDetails}
        activeOpenCard={activeOpenCard}
        isLoadingUsVisaErrors={isLoadingUsVisaErrors}
        handleOpenUsVisaErrors={handleOpenUsVisaErrors}
        onOpenRawData={(batch) => setSelectedRawBatch(batch)}
        onClose={onCloseBatchDetails}
      />

      {/* Read-Only Excel Preview Modal */}
      <WfmReadOnlyExcelModal
        isOpen={Boolean(selectedRawBatch)}
        batch={selectedRawBatch}
        onClose={() => setSelectedRawBatch(null)}
      />

      {/* Warnings Overview Modal */}
      <WfmWarningsModal
        isOpen={isWarningsModalOpen}
        onClose={onCloseWarnings}
        uploadsByCard={uploadsByCard}
        selectedAccount={selectedAccount}
        isLoadingUsVisaErrors={isLoadingUsVisaErrors}
        handleOpenUsVisaErrors={handleOpenUsVisaErrors}
        handleOpenBatchDetails={handleOpenBatchDetails}
        setUploadToRemove={setUploadToRemove}
      />

      {/* Upload Feedback & Confirmation Modals */}
      <DuplicateUploadAlertModal
        duplicateUploadAlert={duplicateUploadAlert}
        onClose={onCloseDuplicateAlert}
      />

      <AddedUploadSuccessModal
        addedUpload={addedUpload}
        onClose={onCloseAddedUpload}
        handleOpenUsVisaErrors={handleOpenUsVisaErrors}
      />

      <RemovedUploadSuccessModal
        removedUpload={removedUpload}
        onClose={onCloseRemovedUpload}
      />

      <ConfirmationModal
        isOpen={Boolean(uploadToRemove)}
        title="Remove imported data"
        message={`Are you sure you want to remove ${uploadToRemove?.fileName || "this file"} from ${activeOpenCard?.title || "this raw data"}? This will permanently delete the batch and all its database records.`}
        cancelText="Cancel"
        confirmText="Remove"
        onCancel={onCancelRemoveUpload}
        onConfirm={onConfirmRemoveUpload}
        tone="neutral"
        zIndex="z-[130]"
      />

      <ConfirmationModal
        isOpen={showLogoutModal}
        title="Confirm logout"
        message="Are you sure you want to logout?"
        cancelText="Cancel"
        confirmText="Logout"
        onCancel={onCancelLogout}
        onConfirm={onConfirmLogout}
        tone="neutral"
      />

      <LoadingModal
        isOpen={isLoggingOut}
        title="Logging out"
        message="Please wait while we end your session."
      />

      <ImportProgressModal
        isOpen={isUploading}
        fileName={importFileName}
        cardTitle={uploadingCardTitle}
        progressPercent={uploadProgress}
        currentStage={importStage}
        progressMessage={importProgressDetail?.message || ""}
        processedRows={importProgressDetail?.processedRows}
        totalRows={importProgressDetail?.totalRows}
      />

      <ConfirmationModal
        isOpen={Boolean(errorModalInfo)}
        title={errorModalInfo?.title || "Notification"}
        message={errorModalInfo?.message || "An issue occurred."}
        confirmText="OK"
        onConfirm={onCloseErrorInfo}
        tone="neutral"
      />
    </>
  );
}
