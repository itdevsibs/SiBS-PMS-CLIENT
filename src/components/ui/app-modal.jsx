const AppModal = ({ children, className = "", isOpen, textAlign = "left" }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="sibs-modal-backdrop-in fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-6">
      <div
        className={`sibs-modal-pop-in w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl sm:p-6 ${
          textAlign === "center" ? "text-center" : ""
        } ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

export default AppModal;
