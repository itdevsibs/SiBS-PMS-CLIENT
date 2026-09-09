// Provides the shared shell wrapper for app pages.
const AppShell = ({ children }) => {
  return <div className="h-full w-full overflow-hidden">{children}</div>;
};

export default AppShell;
