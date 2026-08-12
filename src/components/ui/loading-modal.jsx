// Modal used to show blocking loading progress.
import AppModal from "@/components/ui/app-modal";

const LoadingModal = ({
  isOpen,
  message = "Please wait while we process your request.",
  title = "Loading",
}) => {
  return (
    <AppModal isOpen={isOpen} textAlign="center">
      <div className="mx-auto h-10 w-10 rounded-full border-4 border-sibs-tertiary-10 border-t-sibs-primary-1 animate-spin" />
      <p className="mt-4 mb-1 text-base font-bold text-sibs-primary-1">
        {title}
      </p>
      <p className="m-0 text-sm text-sibs-tertiary-5">{message}</p>
    </AppModal>
  );
};

export default LoadingModal;
