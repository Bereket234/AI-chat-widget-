import "./App.css";
import ChatWidget from "./components/widget/ChatWidget.tsx";
import EmailCaptureForm from "./components/widget/EmailCaptureForm.tsx";
import ChatInterface from "./components/widget/ChatInterface.tsx";
import AIChatInterface from "./components/widget/AIChatInterface.tsx";
import { useChatWidget } from "./context/ChatWidgetContext.tsx";
import { useEffect } from "react";
import chroma from "chroma-js";

function App() {
  const { currentPage, setWidgetSettings, theme } = useChatWidget();

  useEffect(() => {
    // const data = {
    //   settings: {
    //     text_color: "#2e2e2e",
    //     font_family: "Robot",
    //     chat_priority: "human",
    //     email_capture: true,
    //     widget_background_color: "#fff",
    //     ai_only: false,
    //   },
    // };
    // setWidgetSettings(data.settings);
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

  useEffect(() => {
    const root = document.documentElement;
    const bg = theme.bgColor;
    const base = chroma(bg);

    const isLight =
      bg === "#fff" ||
      bg.toLowerCase() === "white" ||
      bg.toLowerCase() === "light" ||
      base.luminance() > 0.85;

    if (!isLight) {
      // Generate palette
      root.style.setProperty("--primary-color", base.hex());
      root.style.setProperty("--primary-light", base.brighten(1).hex());
      root.style.setProperty("--primary-lighter", base.brighten(2).hex());
      root.style.setProperty("--primary-lightest", base.brighten(3).hex());
      root.style.setProperty("--primary-dark", base.darken(1).hex());
      root.style.setProperty("--primary-darker", base.darken(2).hex());
      root.style.setProperty("--primary-darkest", base.darken(3).hex());

      root.style.setProperty("--primary-hover", base.brighten(0.5).hex());
      root.style.setProperty("--primary-active", base.darken(0.5).hex());
      root.style.setProperty("--primary-focus", base.hex());
      root.style.setProperty("--primary-disabled", base.desaturate(2).brighten(2).hex());

      root.style.setProperty("--primary-bg", base.hex());
      root.style.setProperty("--primary-bg-light", base.brighten(2.5).hex());
      root.style.setProperty("--primary-bg-dark", base.darken(2.5).hex());

      // Text colors: contrast for accessibility
      root.style.setProperty("--primary-text", base.luminance() > 0.5 ? "#222" : "#fff");
      root.style.setProperty("--primary-text-light", base.brighten(2.5).hex());
      root.style.setProperty("--primary-text-dark", base.darken(2.5).hex());

      root.style.setProperty("--primary-border", base.darken(0.5).hex());
      root.style.setProperty("--primary-border-light", base.brighten(1.5).hex());
      root.style.setProperty("--primary-border-dark", base.darken(1.5).hex());

      root.style.setProperty("--primary-shadow", base.alpha(0.15).css());
      root.style.setProperty("--primary-shadow-light", base.alpha(0.08).css());
      root.style.setProperty("--primary-shadow-dark", base.alpha(0.25).css());
    }
  }, [theme.bgColor]);

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
