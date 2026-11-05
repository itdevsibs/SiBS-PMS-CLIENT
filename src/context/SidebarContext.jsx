import { createContext, useContext, useEffect, useState } from "react";

const SIDEBAR_COLLAPSED_KEY = "pms-sidebar-collapsed";
const SIDEBAR_HIDDEN_KEY = "pms-sidebar-hidden";

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [isSidebarHidden, setIsSidebarHidden] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_HIDDEN_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
    } catch {
      // ignore
    }
  }, [isCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_HIDDEN_KEY, String(isSidebarHidden));
    } catch {
      // ignore
    }
  }, [isSidebarHidden]);

  const toggleCollapsed = () => setIsCollapsed((prev) => !prev);
  const toggleHidden = () => setIsSidebarHidden((prev) => !prev);
  const hideSidebar = () => setIsSidebarHidden(true);
  const showSidebar = () => setIsSidebarHidden(false);
  const toggleMobile = () => setIsMobileOpen((prev) => !prev);
  const closeMobile = () => setIsMobileOpen(false);
  const openMobile = () => setIsMobileOpen(true);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        toggleCollapsed,
        isSidebarHidden,
        setIsSidebarHidden,
        toggleHidden,
        hideSidebar,
        showSidebar,
        isMobileOpen,
        setIsMobileOpen,
        toggleMobile,
        closeMobile,
        openMobile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    // Provide a safe fallback if used outside provider
    return {
      isCollapsed: false,
      setIsCollapsed: () => {},
      toggleCollapsed: () => {},
      isSidebarHidden: false,
      setIsSidebarHidden: () => {},
      toggleHidden: () => {},
      hideSidebar: () => {},
      showSidebar: () => {},
      isMobileOpen: false,
      setIsMobileOpen: () => {},
      toggleMobile: () => {},
      closeMobile: () => {},
      openMobile: () => {},
    };
  }
  return context;
}

export default SidebarContext;

