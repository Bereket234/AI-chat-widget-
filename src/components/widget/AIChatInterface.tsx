import React, { useState, useEffect, useRef } from "react";
import "./ChatInterface.css";
import { useChatWidget } from "../../context/ChatWidgetContext.tsx";
import { User } from "lucide-react";

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

const AIChatInterface = () => {
  const { userInfo, navigateTo } = useChatWidget();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
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
        text: `Hello ${userInfo.firstName}! I'm your AI assistant. How can I help you today?`,
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    } else {
      const welcomeMessage: Message = {
        id: 1,
        text: `Hello! I'm your AI assistant. How can I help you today?`,
        sender: "ai",
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

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: messages.length + 2,
        text: "I understand your question. Let me help you with that. Is there anything specific you'd like to know?",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleContactHuman = () => {
    navigateTo("chat");
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <div className="ai-avatar">
          <div className="ai-avatar-circle">
            <span>AI</span>
          </div>
        </div>
        <div className="ai-info">
          <p className="ai-info-title">AI Assistant</p>
          <p className="ai-info-subtitle">Available 24/7</p>
        </div>
        <button className="contact-human-btn" onClick={handleContactHuman}>
          Contact Human
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${
              message.sender === "user" ? "user-message" : "ai-message"
            }`}
          >
            <div className="message-avatar">
              {message.sender === "user" ? (
                <div className="user-avatar">
                  <User size={16} />
                </div>
              ) : (
                <div className="ai-avatar-small">
                  <span>AI</span>
                </div>
              )}
            </div>
            <div className="message-content">
              <div className="message-text">{message.text}</div>
              <div className="message-time">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="message ai-message">
            <div className="message-avatar">
              <div className="ai-avatar-small">
                <span>AI</span>
              </div>
            </div>
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

      <div>
        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <div className="input-container">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me anything..."
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

export default AIChatInterface;
