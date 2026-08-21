// Renders the root app component.
import AppShell from "./AppShell";
import SessionManager from "./components/auth/SessionManager";
import Router from "./router";

function App() {
  return (
    <AppShell>
      <SessionManager />
      <Router />
    </AppShell>
  );
}

export default App;
