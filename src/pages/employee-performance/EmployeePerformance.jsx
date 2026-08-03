import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AppHeader from "@/components/layout/AppHeader";
import AdminSidebar from "@/components/layout/AdminSidebar";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import LoadingModal from "@/components/ui/loading-modal";
import {
  clearAuthSession,
  getAuthDisplayName,
  getAuthUser,
  isAuthenticated,
} from "@/lib/auth";

import { sidebarModules } from "../shared/sidebarModules";

const EmployeePerformance = () => {
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [authUser] = useState(() => getAuthUser());
  const [userName] = useState(() => getAuthDisplayName());

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    setShowLogoutModal(false);
    setIsLoggingOut(true);

    window.setTimeout(() => {
      clearAuthSession();
      navigate("/");
    }, 2500);
  };

  return (
    <section className="font-jakarta flex min-h-screen bg-[#eef3f7] text-sibs-primary-1">
      <AdminSidebar
        isMobileOpen={isMobileSidebarOpen}
        modules={sidebarModules}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      <main className="min-w-0 flex-1">
        <AppHeader
          title="Employee Performance"
          subtitle="Performance Management System"
          onMenuClick={() => setIsMobileSidebarOpen(true)}
          onLogoutClick={() => setShowLogoutModal(true)}
          userEmail={authUser?.email}
          userName={userName}
        />

        <div className="sibs-scrollbar max-h-[calc(100vh-74px)] overflow-y-auto p-4 sm:p-5 lg:p-6" />
      </main>

      <ConfirmationModal
        isOpen={showLogoutModal}
        title="Confirm logout"
        message="Are you sure you want to logout from the employee performance module?"
        cancelText="Cancel"
        confirmText="Logout"
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        tone="neutral"
      />

      <LoadingModal
        isOpen={isLoggingOut}
        title="Logging out"
        message="Please wait while we end your session."
      />
    </section>
  );
};

export default EmployeePerformance;
