import React, { useState, useEffect, useRef } from "react";
import "./ChatInterface.css";
import { useChatWidget } from "../../context/ChatWidgetContext.tsx";
import { MessageCircle, Mic, Video } from "lucide-react";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const ChatInterface = () => {
  const { userInfo } = useChatWidget();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeMode, setActiveMode] = useState<"chat" | "audio" | "video">(
    "chat"
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (userInfo) {
      const welcomeMessage: Message = {
        id: 1,
        text: `Hello ${userInfo.firstName}! How can I help you today?`,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [userInfo]);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        text: "Thank you for your message! I'm here to help. How can I assist you further?",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleModeChange = (mode: "chat" | "audio" | "video") => {
    setActiveMode(mode);
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!userInfo) {
    return <div>Loading...</div>;
  }

  return (
    <div className="chat-interface">
      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${
              message.sender === "user" ? "user-message" : "bot-message"
            }`}
          >
            <div className="message-content">
              <div className="message-text">{message.text}</div>
              <div className="message-time">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="message bot-message">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-mode-buttons">
        <button
          className={`mode-button ${activeMode === "chat" ? "active" : ""}`}
          onClick={() => handleModeChange("chat")}
          title="Text Chat"
        >
          <MessageCircle size={18} />
          <span>Chat</span>
        </button>
        <button
          className={`mode-button ${activeMode === "audio" ? "active" : ""}`}
          onClick={() => handleModeChange("audio")}
          title="Voice Chat"
        >
          <Mic size={18} />
          <span>Audio</span>
        </button>
        <button
          className={`mode-button ${activeMode === "video" ? "active" : ""}`}
          onClick={() => handleModeChange("video")}
          title="Video Chat"
        >
          <Video size={18} />
          <span>Video</span>
        </button>
      </div>
      <div>
        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <div className="input-container">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="chat-input"
              disabled={isTyping}
            />
            <button
              type="submit"
              className="send-button"
              disabled={!inputMessage.trim() || isTyping}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 18L18 10L10 2M18 10H2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
