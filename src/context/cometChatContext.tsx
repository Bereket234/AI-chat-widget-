import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import CometChatService from "../services/CometChatService.ts";
import type {
  CometChatConfig,
  User,
  CallSession,
} from "../services/chatType.ts";
import { CometChat } from "@cometchat/chat-sdk-javascript";

export interface CometChatContextType {
  cometChatService: CometChatService;
  cometChatUser: User | null;
  isAuthenticated: boolean;
  incomingCalls: CallSession[];
  activeCall: CallSession | null;
  outgoingCall: CallSession | null;
  initialize: (config: CometChatConfig) => Promise<boolean>;
  login: (uid: string, authKey?: string) => Promise<User>;
  logout: () => Promise<void>;
  startCall: (receiverId: string, type: "audio" | "video") => Promise<void>;
  acceptCall: (sessionId: string) => Promise<void>;
  rejectCall: (sessionId: string, status: string) => Promise<void>;
  endCall: (sessionId: string) => Promise<void>;
  messages: CometChat.BaseMessage[];
  setMessages: React.Dispatch<React.SetStateAction<CometChat.BaseMessage[]>>;
  uid: string;
  setUid: React.Dispatch<React.SetStateAction<string>>;
  conversationId: string;
  setConversationId: React.Dispatch<React.SetStateAction<string>>;
  user: string;
  setUser: React.Dispatch<React.SetStateAction<string>>;
}

const CometChatContext = createContext<CometChatContextType | undefined>(
  undefined
);

interface ProviderProps {
  children: ReactNode;
}

export const CometChatProvider: React.FC<ProviderProps> = ({ children }) => {
  const cometChatService = useMemo(() => CometChatService.getInstance(), []);

  const [cometChatUser, setCometChatUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [incomingCalls, setIncomingCalls] = useState<CallSession[]>([]);
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [outgoingCall, setOutgoingCall] = useState<CallSession | null>(null);
  const [messages, setMessages] = useState<CometChat.BaseMessage[]>([]);
  const [uid, setUid] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [user, setUser] = useState<string>("");

  // Helper to normalize CometChat.Call to CallSession
  const toCallSession = (call: any): CallSession => {
    const receiver = call.getCallReceiver();
    return {
      sessionId: call.getSessionId(),
      callType: call.getType() as "audio" | "video",
      initiator: call.getCallInitiator().getUid(),
      receiver: (receiver as any).getUid
        ? (receiver as any).getUid()
        : (receiver as any).getGuid(),
      status: call.getStatus(),
      startedAt: call.getInitiatedAt(),
      endedAt: call.getInitiatedAt(),
      receiverAvatar: (receiver as any).getAvatar
        ? (receiver as any).getAvatar()
        : null,
    };
  };

  // Attach call listeners once
  useEffect(() => {
    const handleCallEvent = (call: any, event: string) => {
      const session = toCallSession(call);
      if (event === "incoming") {
        setIncomingCalls((prev) => {
          const exists = prev.some((c) => c.sessionId === session.sessionId);
          return exists ? prev : [...prev, session];
        });
      }
      if (event === "call-started") {
        setActiveCall(session);
        setIncomingCalls((prev) =>
          prev.filter((c) => c.sessionId !== session.sessionId)
        );
        setOutgoingCall((prev) =>
          prev && prev.sessionId === session.sessionId ? null : prev
        );
      }
      if (event === "outgoing-accepted") {
        setActiveCall(session);
        setOutgoingCall((prev) =>
          prev && prev.sessionId === session.sessionId ? null : prev
        );
      }
      if (event === "outgoing-rejected" || event === "incoming-cancelled") {
        console.log("Call rejected or cancelled", session);
        setIncomingCalls((prev) =>
          prev.filter((c) => c.sessionId !== session.sessionId)
        );
        setOutgoingCall((prev) =>
          prev && prev.sessionId === session.sessionId ? null : prev
        );
      }
      if (event === "call-ended") {
        setActiveCall((prev) =>
          prev && prev.sessionId === session.sessionId ? null : prev
        );
        setOutgoingCall((prev) =>
          prev && prev.sessionId === session.sessionId ? null : prev
        );
        setIncomingCalls((prev) =>
          prev.filter((c) => c.sessionId !== session.sessionId)
        );
      }
    };

    cometChatService.addCallListener(handleCallEvent);
    return () => {
      cometChatService.removeCallListener(handleCallEvent);
    };
  }, [cometChatService]);

  useEffect(() => {
    const handleMessageEvent = (message: CometChat.BaseMessage) => {
      setMessages((prev) => [...prev, message]);
    };
    cometChatService.addMessageListener(handleMessageEvent);
    return () => {
      cometChatService.removeMessageListener(handleMessageEvent);
    };
  }, [cometChatService]);

  const initialize = async (config: CometChatConfig) => {
    const ok = await cometChatService.initialize(config);
    return ok;
  };

  const login = async (uid: string, authKey?: string) => {
    const user = await cometChatService.login(uid, authKey);
    setCometChatUser(user);
    setIsAuthenticated(true);
    return user;
  };

  const logout = async () => {
    await cometChatService.logout();
    setCometChatUser(null);
    setIsAuthenticated(false);
    setIncomingCalls([]);
    setActiveCall(null);
    setOutgoingCall(null);
  };

  const startCall = async (receiverId: string, type: "audio" | "video") => {
    const call = await cometChatService.initiateCall(receiverId, type);
    setOutgoingCall(toCallSession(call));
  };

  const acceptCall = async (sessionId: string) => {
    const session = await cometChatService.acceptCall(sessionId);
    setActiveCall(session);
    setIncomingCalls((prev) => prev.filter((c) => c.sessionId !== sessionId));
    setOutgoingCall((prev) =>
      prev && prev.sessionId === sessionId ? null : prev
    );
  };

  const rejectCall = async (sessionId: string, status: string) => {
    await cometChatService.rejectCall(sessionId, status);
    if (status === CometChat.CALL_STATUS.CANCELLED) {
      setOutgoingCall(null);
    }
    if (status === CometChat.CALL_STATUS.REJECTED) {
      setIncomingCalls((prev) => prev.filter((c) => c.sessionId !== sessionId));
    }
  };

  const endCall = async (sessionId: string) => {
    await cometChatService.endCall(sessionId);
    setActiveCall(null);
    setOutgoingCall(null);
    setIncomingCalls([]);
  };

  const value: CometChatContextType = {
    cometChatService,
    cometChatUser,
    isAuthenticated,
    incomingCalls,
    activeCall,
    outgoingCall,
    messages,
    initialize,
    login,
    logout,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    setMessages,
    uid,
    setUid,
    conversationId,
    setConversationId,
    user,
    setUser,
  };

  return (
    <CometChatContext.Provider value={value}>
      {children}
    </CometChatContext.Provider>
  );
};

export const useCometChat = (): CometChatContextType => {
  const ctx = useContext(CometChatContext);
  if (!ctx) {
    throw new Error("useCometChat must be used within a CometChatProvider");
  }
  return ctx;
};

export default CometChatContext;
