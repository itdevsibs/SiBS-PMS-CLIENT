// Dashboard page for team leader users.
import AdminSidebar from "@/components/layout/AdminSidebar";
import AppHeader from "@/components/layout/AppHeader";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import LoadingModal from "@/components/ui/loading-modal";
import useDashboardPage from "@/hooks/useDashboardPage";
import useTeamLeaderPerformance from "@/hooks/useTeamLeaderPerformance";
import TeamLeaderPerformanceDashboard from "./TeamLeaderPerformanceDashboard";

function TeamLeaderPage() {
  const dashboard = useDashboardPage();
  const teamLeaderPerformance = useTeamLeaderPerformance();
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
          <TeamLeaderPerformanceDashboard
            error={teamLeaderPerformance.error}
            filters={teamLeaderPerformance.filters}
            isLoading={teamLeaderPerformance.isLoading}
            isLoadingAgent={teamLeaderPerformance.isLoadingAgent}
            operationalContext={teamLeaderPerformance.operationalContext}
            operationalError={teamLeaderPerformance.operationalError}
            teamData={teamLeaderPerformance.teamData}
            onFilterChange={(patch) =>
              teamLeaderPerformance.setFilters((current) => ({
                ...current,
                ...patch,
              }))
            }
            onRefresh={teamLeaderPerformance.refresh}
            onSelectAgent={teamLeaderPerformance.setSelectedAgentUid}
            selectedAgentData={teamLeaderPerformance.selectedAgentData}
            selectedAgentUid={teamLeaderPerformance.selectedAgentUid}
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

export default TeamLeaderPage;

