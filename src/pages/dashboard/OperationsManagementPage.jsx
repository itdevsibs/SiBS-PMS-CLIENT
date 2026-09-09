// Dashboard page for operations management users.
import AdminSidebar from "@/components/layout/AdminSidebar";
import AppHeader from "@/components/layout/AppHeader";
import OperationsManagerPerformanceDashboard from "@/components/operationsManager/OperationsManagerPerformanceDashboard";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import LoadingModal from "@/components/ui/loading-modal";
import useDashboardPage from "@/hooks/useDashboardPage";
import useOperationsManagerPerformance from "@/hooks/useOperationsManagerPerformance";

function OperationsManagementPage() {
  const dashboard = useDashboardPage();
  const operationsPerformance = useOperationsManagerPerformance();
  const userName = dashboard.authUser?.name || dashboard.authUser?.username || "User";

  return (
    <section className="font-jakarta flex h-screen max-h-[100dvh] min-h-screen bg-[#eef3f7] text-sibs-primary-1 overflow-hidden">
      <AdminSidebar
        isMobileOpen={dashboard.isMobileSidebarOpen}
        modules={dashboard.modules}
        onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        onMobileClose={() => dashboard.setIsMobileSidebarOpen(false)}
        userName={userName}
        userRole={dashboard.authUser?.email || dashboard.authUser?.roleLabel || "User"}
      />
      <main className="min-w-0 flex-1 flex flex-col h-full overflow-hidden">
        <AppHeader
          title={`${dashboard.authUser?.roleLabel || "User"} Dashboard`}
          subtitle="Performance Management System"
          onMenuClick={() => dashboard.setIsMobileSidebarOpen(true)}
          onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        />
        <div className="sibs-scrollbar flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5">
          <OperationsManagerPerformanceDashboard
            error={operationsPerformance.error}
            filters={operationsPerformance.filters}
            isLoading={operationsPerformance.isLoading}
            isLoadingAgent={operationsPerformance.isLoadingAgent}
            operationalContext={operationsPerformance.operationalContext}
            operationalError={operationsPerformance.operationalError}
            operationsData={operationsPerformance.operationsData}
            onFilterChange={(patch) =>
              operationsPerformance.setFilters((current) => ({
                ...current,
                ...patch,
              }))
            }
            onRefresh={operationsPerformance.refresh}
            onSelectAgent={operationsPerformance.setSelectedAgentUid}
            onSelectTeamLeader={operationsPerformance.setSelectedTeamLeaderUid}
            selectedAgentData={operationsPerformance.selectedAgentData}
            selectedAgentUid={operationsPerformance.selectedAgentUid}
            selectedTeamLeaderUid={operationsPerformance.selectedTeamLeaderUid}
          />
        </div>
      </main>
      <ConfirmationModal
        isOpen={dashboard.showLogoutModal}
        title="Confirm logout"
        message="Are you sure you want to logout?"
        cancelText="Cancel"
        confirmText="Logout"
        onCancel={() => dashboard.setShowLogoutModal(false)}
        onConfirm={dashboard.handleLogout}
        tone="neutral"
      />
      <LoadingModal
        isOpen={dashboard.isLoggingOut}
        title="Logging out"
        message="Please wait while we end your session."
      />
    </section>
  );
}

export default OperationsManagementPage;
