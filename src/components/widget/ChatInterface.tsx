import React, { useState, useEffect, useRef } from "react";
import "./ChatInterface.css";
import { useChatWidget } from "../../context/ChatWidgetContext.tsx";
import { Mic, Phone, Video } from "lucide-react";
import { useCometChat } from "../../context/cometChatContext.tsx";
import { CometChat } from "@cometchat/chat-sdk-javascript";

const ChatInterface = () => {
  const { navigateTo, widgetSettings } = useChatWidget();
  const {
    isAuthenticated,
    cometChatUser,
    activeCall,
    outgoingCall,
    incomingCalls,
    initialize,
    login,
    startCall,
    endCall,
    cometChatService,
    messages,
    setMessages,
    rejectCall,
    acceptCall,
  } = useCometChat();
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping] = useState(false);
  const [_, setActiveMode] = useState<"chat" | "audio" | "video">("chat");
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (widgetSettings?.ai_only) {
      navigateTo("ai-chat");
      return;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const config = {
      appId: (import.meta as any).env.VITE_COMETCHAT_APP_ID as string,
      region: (import.meta as any).env.VITE_COMETCHAT_REGION as string,
      authKey: (import.meta as any).env.VITE_COMETCHAT_AUTH_KEY as string,
    };

    if (!isAuthenticated && config.appId && config.region && config.authKey) {
      (async () => {
        const ok = await initialize(config);
        if (!ok) return;

        const uid = "3b36ad5f-7f5f-4544-b05e-45b72c72e1e2";

        try {
          await cometChatService?.createUser(uid, "beki", config.authKey);
        } catch (error) {
          console.log("User might already exist:", error);
        }

        await cometChatService?.login(uid, config.authKey);
        // const user = await cometChatService?.getUser(uid);
        login(uid);
      })();
    }
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      const conversations = await cometChatService.getConversations(10);
      const target = conversations[0];

      const messages = await cometChatService.getMessages(target.id, 30);
      setMessages(messages);
    };
    fetchMessages();
    return () => {};
  }, [
    cometChatService,
    isAuthenticated,
    activeCall,
    outgoingCall,
    incomingCalls,
  ]);

  useEffect(() => {
    if (!containerRef.current || !activeCall) return;

    const initializeCall = async () => {
      try {
        await cometChatService.startCall(
          activeCall.sessionId,
          containerRef.current!,
          () => endCall(activeCall.sessionId),
          activeCall.callType
        );
      } catch (error) {
        console.error("Failed to initialize call:", error);
        cometChatService.endCall(activeCall.sessionId);
      }
    };

    initializeCall();

    return () => {
      cometChatService.endCall(activeCall.sessionId);
    };
  }, [activeCall]);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();

      if (!inputMessage.trim()) return;
      console.log("here");

      const messege = await cometChatService.sendMessage(
        "test_user_1",
        inputMessage
      );

      setMessages((prev) => [...prev, messege]);
      setInputMessage("");
    } catch (e) {
      console.log("error sending message", e);
    }
  };

  const handleStartVideo = async () => {
    setActiveMode("video");
    try {
      const conversations = await cometChatService.getConversations(10);
      const target = conversations[0];
      if (!target) return;

      await startCall("test_user_1", "video");
    } catch (e) {
      console.error("Video call start failed", e);
    }
  };
  const handleStartAudio = async () => {
    setActiveMode("audio");
    try {
      const conversations = await cometChatService.getConversations(10);
      const target = conversations[0];
      if (!target) return;

      await startCall("test_user_1", "audio");
    } catch (e) {
      console.error("Audio call start failed", e);
    }
  };

  const handleChatWithAI = () => {
    navigateTo("ai-chat");
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="chat-interface">
      {activeCall && (
        <div ref={containerRef} className="call_ui">
          {" "}
        </div>
      )}

      <div className="chat-header">
        <div className="expert-avatar">
          <div className="expert-avatar-circle">
            {cometChatUser?.avatar ? (
              <img
                src={"https://cdn-icons-png.flaticon.com/512/3541/3541871.png"}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <span>EX</span>
            )}
          </div>
        </div>
        <div className="expert-info">
          <p className="expert-info-title">{"Expert Support"}</p>
          <p className="expert-info-subtitle">Human Customer Service</p>
        </div>

        <button className="chat-with-ai-btn" onClick={handleChatWithAI}>
          Chat with AI
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.getId()}
            className={`message ${
              message.getSender().getUid() !== cometChatUser?.uid
                ? "user-message"
                : "bot-message"
            }`}
          >
            <div className="message-avatar">
              {message.getSender().getUid() !== cometChatUser?.uid ? (
                <div className="user-avatar">
                  {message.getSender().getAvatar() ? (
                    <img
                      src={message.getSender().getAvatar()}
                      alt="EX"
                      className="expert-avatar-image"
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <img
                      src={
                        "https://cdn-icons-png.flaticon.com/512/3541/3541871.png"
                      }
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                </div>
              ) : (
                <div className="expert-avatar-small">
                  {message.getSender().getAvatar() ? (
                    <img
                      src={message.getSender().getAvatar()}
                      alt="EX"
                      className="expert-avatar-image"
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <img
                      src={
                        "https://cdn-icons-png.flaticon.com/512/3541/3541871.png"
                      }
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                </div>
              )}
            </div>
            <div className="message-content">
              <div className="message-text">
                {message.getType() === "video" ? (
                  <>
                    <Video size={14} /> {message.getStatus()}
                  </>
                ) : message.getType() === "audio" ? (
                  <>
                    <Mic size={14} /> {message.getStatus()}
                  </>
                ) : (
                  message.getData()?.text
                )}
              </div>
              <div className="message-time">
                {formatTime(new Date(message.getSentAt() * 1000))}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="message bot-message">
            <div className="message-avatar">
              <div className="expert-avatar-small">
                <span>EX</span>
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

      <div className="chat-mode-buttons">
        {outgoingCall && (
          <div ref={containerRef} className="outgoing_call_ui">
            <div className="profile-container">
              <img
                src={
                  outgoingCall.receiverAvatar
                    ? outgoingCall.receiverAvatar
                    : "https://cdn-icons-png.flaticon.com/512/3541/3541871.png"
                }
                alt={outgoingCall.receiver}
              />
              <p>Calling {outgoingCall.receiver}...</p>
            </div>
            <button
              className="cancel-call-button"
              onClick={() =>
                rejectCall(
                  outgoingCall.sessionId,
                  CometChat.CALL_STATUS.CANCELLED
                )
              }
            >
              <Phone width={16} />
            </button>
          </div>
        )}
        {incomingCalls?.map((incomingCall) => (
          <div ref={containerRef} className="outgoing_call_ui">
            <div className="profile-container">
              <img
                src={
                  incomingCall.receiverAvatar
                    ? incomingCall.receiverAvatar
                    : "https://cdn-icons-png.flaticon.com/512/3541/3541871.png"
                }
                alt={incomingCall.receiver}
              />
              <p>Answer call...</p>
            </div>
            <button
              className="accept-call-button"
              onClick={() => acceptCall(incomingCall.sessionId)}
            >
              <Phone width={16} />
            </button>
          </div>
        ))}
        <button
          className={`mode-button`}
          onClick={handleStartAudio}
          title="Voice Chat"
        >
          <Mic size={18} />
          <span>Audio</span>
        </button>
        <button
          className={`mode-button`}
          onClick={handleStartVideo}
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
