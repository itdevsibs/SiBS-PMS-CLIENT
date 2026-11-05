// Boots the React application into the browser.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { AuthAccessProvider } from "./context/AuthAccessContext.jsx";
import { SidebarProvider } from "./context/SidebarContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthAccessProvider>
        <SidebarProvider>
          <App />
        </SidebarProvider>
      </AuthAccessProvider>
    </BrowserRouter>
  </StrictMode>,
);
