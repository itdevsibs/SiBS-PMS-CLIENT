// Renders the root app component.
import AppShell from "./AppShell";
import Router from "./router";

function App() {
  return (
    <AppShell>
      <Router />
    </AppShell>
  );
}

export default App;
