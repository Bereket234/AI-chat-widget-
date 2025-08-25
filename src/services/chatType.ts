export interface ChatMessage {
  id: number;
  text: string;
  type: string;
  sender: string;
  receiver: string;
  sentAt: number;
  status: string;
}

export interface CallSession {
  sessionId: string;
  callType: "audio" | "video";
  initiator: string;
  receiver: string;
  status: string;
  startedAt: number;
  endedAt?: number;
  receiverAvatar?: string | null;
}

export interface CometChatConfig {
  appId: string;
  region: string;
  authKey: string;
}

export interface ActiveCall {
  sessionId: string;
  callType: "audio" | "video";
  caller: {
    name: string;
    avatar?: string;
  };
}

export interface User {
  uid: string;
  name: string;
  avatar?: string;
  status?: string;
  role?: string;
}

export interface Conversation {
  conversationId: string;
  conversationType: string;
  conversationWith: User;
  lastMessage: ChatMessage;
  unreadMessageCount: number;
  updatedAt: number;
}

export interface ChatUser {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageAt: string;
  avatar?: string;
  online: boolean;
  isAI: boolean;
  duration?: string;
  conversationTime?: string;
  isOngoingCall?: boolean;
  callType?: "video" | "audio" | "chat";
  callDuration: string; // e.g., "02:15"
}

export type MessageListener = (message: CometChat.BaseMessage) => void;
export type CallEvent =
  | "incoming"
  | "outgoing-accepted"
  | "outgoing-rejected"
  | "incoming-cancelled"
  | "call-ended"
  | "call-started";
export type CallListener = (call: CometChat.Call, event: CallEvent) => void;
export type UserStatusListener = (user: CometChat.User) => void;
