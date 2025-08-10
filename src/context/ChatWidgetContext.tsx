import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export const CHAT_PAGES = ["email-capture", "chat"] as const;

export type ChatPage = (typeof CHAT_PAGES)[number];

interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
}

interface ChatWidgetContextType {
  currentPage: ChatPage;
  userInfo: UserInfo | null;
  navigateTo: (page: ChatPage) => void;
  setUserInfo: (info: UserInfo) => void;
  resetState: () => void;
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
  };

  const value: ChatWidgetContextType = {
    currentPage,
    userInfo,
    navigateTo,
    setUserInfo,
    resetState,
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
