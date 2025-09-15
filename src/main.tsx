import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ChatWidgetProvider } from "./context/ChatWidgetContext.tsx";
import { CometChatProvider } from "./context/cometChatContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CometChatProvider>
      <ChatWidgetProvider>
        <App />
      </ChatWidgetProvider>
    </CometChatProvider>
  </StrictMode>,
);
