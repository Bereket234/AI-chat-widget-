import "./App.css";
import ChatWidget from "./components/widget/ChatWidget.tsx";
import EmailCaptureForm from "./components/widget/EmailCaptureForm.tsx";
import ChatInterface from "./components/widget/ChatInterface.tsx";
import AIChatInterface from "./components/widget/AIChatInterface.tsx";
import { useChatWidget } from "./context/ChatWidgetContext.tsx";
import { useEffect } from "react";

function App() {
  const { currentPage, setWidgetSettings } = useChatWidget();

  useEffect(() => {
    const data = {
      settings: {
        text_color: "#2e2e2e",
        font_family: "Robot",
        chat_priority: "human",
        email_capture: true,
        widget_background_color: "#fff",
        ai_only: true, 
      },
    };
    setWidgetSettings(data.settings);

    const url = window.location.hostname;
    console.log("----url----", url);
    fetch(
      `https://api.withoutpost.com/api/theme/widget-customization?shop=outpostdemo.myshopify.com`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    )
      .then((res) => {
        
        return res.json();
      })
      .then((response) => {
        if (response.data && response.data.settings) {
          setWidgetSettings(response.data.settings);
        }
      })
      .catch((err) => {
        console.log("----error fetching widget customization----", err);
      });
  }, []);

  const renderContent = () => {
    switch (currentPage) {
      case "email-capture":
        return <EmailCaptureForm />;
      case "chat":
        return <ChatInterface />;
      case "ai-chat":
        return <AIChatInterface />;
      default:
        return <EmailCaptureForm />;
    }
  };

  return <ChatWidget>{renderContent()}</ChatWidget>;
}

export default App;
