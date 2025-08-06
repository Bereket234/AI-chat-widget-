import "./App.css";
import ChatWidget from "./components/widget/ChatWidget.tsx";
import EmailCaptureForm from "./components/widget/EmailCaptureForm.tsx";
import ChatInterface from "./components/widget/ChatInterface.tsx";
import { useChatWidget } from "./context/ChatWidgetContext.tsx";

function App() {
  const { currentPage } = useChatWidget();

  const renderContent = () => {
    switch (currentPage) {
      case "email-capture":
        return <EmailCaptureForm />;
      case "chat":
        return <ChatInterface />;
      default:
        return <EmailCaptureForm />;
    }
  };

  return <ChatWidget>{renderContent()}</ChatWidget>;
}

export default App;
