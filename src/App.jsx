// Renders the root app component.
import AppShell from "./AppShell";
import SessionManager from "./components/common/auth/SessionManager";
import Router from "./router";
import SibsAssistantChatbot from "./components/common/ui/SibsAssistantChatbot";

function App() {
  return (
    <AppShell>
      <SessionManager />
      <Router />
      <SibsAssistantChatbot />
    </AppShell>
  );
}

export default App;
