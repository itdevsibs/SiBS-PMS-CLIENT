// Modal used for confirm/cancel user decisions.
import AppModal from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";

const ConfirmationModal = ({
  cancelText = "Cancel",
  confirmText = "Confirm",
  isOpen,
  message,
  onCancel,
  onConfirm,
  tone = "primary",
  title,
  zIndex = "z-[130]",
}) => {
  const confirmClassName =
    tone === "neutral"
      ? "h-10 rounded-xl bg-sibs-primary-1 font-semibold text-white hover:bg-sibs-tertiary-4 hover:text-white sm:w-auto"
      : "h-10 rounded-xl bg-sibs-primary-1 font-semibold text-white hover:bg-sibs-tertiary-4 hover:text-white sm:w-auto";

  return (
    <AppModal isOpen={isOpen} zIndex={zIndex}>
      <p className="m-0 text-lg font-bold text-sibs-primary-1">{title}</p>
      <p className="mt-2 mb-0 break-words text-sm text-sibs-tertiary-5 [overflow-wrap:anywhere]">
        {message}
      </p>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-10 rounded-xl border-sibs-tertiary-8 sm:w-auto"
        >
          {cancelText}
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          className={confirmClassName}
        >
          {confirmText}
        </Button>
      </div>
    </AppModal>
  );
};

export default ConfirmationModal;
