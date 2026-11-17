// Layout wrapper providing AdminSidebar and AppHeader for all AI Report pages.
import { useLocation } from "react-router-dom";
import AdminSidebar from "@/components/common/layout/AdminSidebar";
import AppHeader from "@/components/common/layout/AppHeader";
import ConfirmationModal from "@/components/common/ui/ConfirmationModal";
import LoadingModal from "@/components/common/ui/LoadingModal";
import useDashboardPage from "@/hooks/useDashboardPage";
import "../styles/ai-report.css";

export default function AIReportLayout({
  title = "AI Report",
  subtitle = "Performance Management System • AI Analytics",
  children,
}) {
  const dashboard = useDashboardPage();
  const location = useLocation();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F4F6F9]">
      <AdminSidebar
        activeModuleKey="ai-report"
        currentPath={location.pathname}
        modules={dashboard.allowedModules}
        isMobileOpen={dashboard.isMobileSidebarOpen}
        onMobileClose={() => dashboard.setIsMobileSidebarOpen(false)}
        userName={dashboard.userName}
        userRole={
          dashboard.authUser?.email ||
          dashboard.authUser?.roleLabel ||
          "User"
        }
      />

      <main className="min-w-0 flex-1 flex flex-col h-full overflow-hidden">
        <AppHeader
          title={title}
          subtitle={subtitle}
          onMenuClick={() => dashboard.setIsMobileSidebarOpen(true)}
          onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        />

        <div className="sibs-scrollbar flex-1 min-h-0 flex flex-col overflow-y-auto px-2.5 sm:px-4 lg:px-5 pt-2 sm:pt-2.5 pb-2 gap-2 sm:gap-2.5">
          {children}
        </div>
      </main>

      <ConfirmationModal
        isOpen={dashboard.showLogoutModal}
        title="Confirm Logout"
        message="Are you sure you want to log out of SiBS PMS?"
        confirmLabel="Log Out"
        cancelLabel="Cancel"
        onConfirm={dashboard.confirmLogout}
        onCancel={() => dashboard.setShowLogoutModal(false)}
      />

      <LoadingModal
        isOpen={dashboard.isLoggingOut}
        message="Logging out..."
      />
    </div>
  );
}
