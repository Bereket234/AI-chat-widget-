import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export const CHAT_PAGES = ["email-capture", "chat", "ai-chat"] as const;

export type ChatPage = (typeof CHAT_PAGES)[number];

interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
}

interface WidgetSettings {
  text_color: string;
  font_family: string;
  chat_priority: string;
  email_capture: boolean;
  widget_background_color: string;
  ai_only?: boolean; // Optional field for AI-only mode
}

interface ChatWidgetContextType {
  currentPage: ChatPage;
  userInfo: UserInfo | null;
  widgetSettings: WidgetSettings | null;
  navigateTo: (page: ChatPage) => void;
  setUserInfo: (info: UserInfo) => void;
  setWidgetSettings: (settings: WidgetSettings) => void;
  resetState: () => void;
  isAIPriority: () => boolean;
}

const ChatWidgetContext = createContext<ChatWidgetContextType | undefined>(
  undefined
);

interface ChatWidgetProviderProps {
  children: ReactNode;
}

export const ChatWidgetProvider: React.FC<ChatWidgetProviderProps> = ({
  children,
}) => {
  const [currentPage, setCurrentPage] = useState<ChatPage>("email-capture");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [widgetSettings, setWidgetSettings] = useState<WidgetSettings | null>(
    null
  );

  const navigateTo = (page: ChatPage) => {
    if (!CHAT_PAGES.includes(page)) {
      console.warn(`Invalid page navigation attempted: ${page}`);
      return;
    }
    setCurrentPage(page);
  };

  const resetState = () => {
    setCurrentPage("email-capture");
    setUserInfo(null);
    setWidgetSettings(null);
  };

  // Update current page when widget settings change
  const updateWidgetSettings = (settings: WidgetSettings) => {
    setWidgetSettings(settings);

    // Navigate based on chat priority
    if (settings.email_capture) {
      setCurrentPage("email-capture");
    } else if (settings.ai_only) {
      setCurrentPage("ai-chat");
    } else if (settings.chat_priority === "ai") {
      setCurrentPage("ai-chat");
    } else if (settings.chat_priority === "human") {
      setCurrentPage("chat");
    } else {
      setCurrentPage("ai-chat");
    }
  };

  const isAIPriority = () => {
    return widgetSettings?.chat_priority === "ai";
  };

  const value: ChatWidgetContextType = {
    currentPage,
    userInfo,
    widgetSettings,
    navigateTo,
    setUserInfo,
    setWidgetSettings: updateWidgetSettings,
    resetState,
    isAIPriority,
  };

  return (
    <ChatWidgetContext.Provider value={value}>
      {children}
    </ChatWidgetContext.Provider>
  );
};

export const useChatWidget = (): ChatWidgetContextType => {
  const context = useContext(ChatWidgetContext);
  if (context === undefined) {
    throw new Error("useChatWidget must be used within a ChatWidgetProvider");
  }
  return context;
};
