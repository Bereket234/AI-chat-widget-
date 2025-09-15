import { CometChat } from "@cometchat/chat-sdk-javascript";
import type {
  CometChatConfig,
  User,
  ChatMessage,
  CallSession,
  MessageListener,
  CallListener,
  UserStatusListener,
  ChatUser,
  // Conversation,
} from "./chatType.ts";
import { CometChatCalls } from "@cometchat/calls-sdk-javascript";

class CometChatService {
  private static instance: CometChatService;
  private initialized: boolean = false;
  private callsInitialized: boolean = false;
  private messageListeners: Set<MessageListener> = new Set();
  private callListeners: Set<CallListener> = new Set();
  private userStatusListeners: Set<UserStatusListener> = new Set();
  private readonly AUTH_TOKEN_KEY = "cometchat_auth_token";
  private readonly USER_ID_KEY = "cometchat_user_id";

  private constructor() {}

  static getInstance(): CometChatService {
    if (!CometChatService.instance) {
      CometChatService.instance = new CometChatService();
    }
    return CometChatService.instance;
  }

  async initialize(config: CometChatConfig): Promise<boolean> {
    if (this.initialized) return true;

    try {
      const appSettings = new CometChat.AppSettingsBuilder()
        .subscribePresenceForAllUsers()
        .setRegion(config.region)
        .build();

      await CometChat.init(config.appId, appSettings);
      await this.initializeCalls(config);

      this.initialized = true;
      this.registerListeners();
      return true;
    } catch (error) {
      console.error("CometChat initialization failed:", error);
      return false;
    }
  }
  private async initializeCalls(config: CometChatConfig): Promise<boolean> {
    if (this.callsInitialized) return true;

    try {
      const callAppSettings = new CometChatCalls.CallAppSettingsBuilder()
        .setAppId(config.appId)
        .setRegion(config.region)
        .build();

      await CometChatCalls.init(callAppSettings);
      this.callsInitialized = true;
      return true;
    } catch (error) {
      console.error("CometChatCalls initialization failed:", error);
      return false;
    }
  }

  private saveAuthData(userId: string, authToken: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.AUTH_TOKEN_KEY, authToken);
      localStorage.setItem(this.USER_ID_KEY, userId);
    }
  }

  private clearAuthData(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.AUTH_TOKEN_KEY);
      localStorage.removeItem(this.USER_ID_KEY);
    }
  }

  getStoredAuthToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.AUTH_TOKEN_KEY);
    }
    return null;
  }

  getStoredUserId(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.USER_ID_KEY);
    }
    return null;
  }

  async getUser(userId: string): Promise<CometChat.User> {
    try {
      const user = await CometChat.getUser(userId);
      return user;
    } catch (error) {
      console.error("Failed to get user:", error);
      throw error;
    }
  }

  async createUser(
    userId: string,
    name: string,
    authKey: string
  ): Promise<User> {
    try {
      const user = new CometChat.User(userId);
      user.setName(name);
      const createdUser = await CometChat.createUser(user, authKey);
      return this.transformUser(createdUser);
    } catch (error) {
      console.error("Failed to create user:", error);
      throw error;
    }
  }

  async login(uid: string, authKey?: string): Promise<User> {
    try {
      const storedToken = this.getStoredAuthToken();
      let user: CometChat.User;

      if (storedToken) {
        try {
          user = await CometChat.login(uid, storedToken);
        } catch (error) {
          this.clearAuthData();
          if (!authKey) throw new Error("Auth key required for login");
          user = await CometChat.login(uid, authKey);
          console.log("login failed, trying with auth key", error);
        }
      } else {
        if (!authKey) throw new Error("Auth key required for login");
        user = await CometChat.login(uid, authKey);
        if (user) {
          this.saveAuthData(uid, user.getAuthToken());
          console.log("saved auth token", user.getAuthToken());
        }
      }

      return this.transformUser(user);
    } catch (error) {
      console.error("CometChat login failed:", error);
      throw error;
    }
  }

  async logout(): Promise<boolean> {
    try {
      // Remove all listeners before logout
      this.removeAllListeners();

      await CometChat.logout();
      this.clearAuthData();
      this.initialized = false;
      this.callsInitialized = false;
      return true;
    } catch (error) {
      console.error("CometChat logout failed:", error);
      return false;
    }
  }

  async sendMessage(receiverId: string, text: string): Promise<CometChat.BaseMessage> {
    try {
      const message = new CometChat.TextMessage(
        receiverId,
        text,
        CometChat.RECEIVER_TYPE.USER
      );
      const sentMessage = await CometChat.sendMessage(message);
      return sentMessage
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    }
  }

  async getMessages(uid: string, limit: number = 30): Promise<CometChat.BaseMessage[]> {
    try {
      const messagesRequest = new CometChat.MessagesRequestBuilder()
        .setUID(uid)
        .setLimit(limit)
        .build();

      const messages = await messagesRequest.fetchPrevious();
      return messages;
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      throw error;
    }
  }

  async initiateCall(
    receiverId: string,
    type: "audio" | "video"
  ): Promise<CometChat.Call> {
    try {
      const call = new CometChat.Call(
        receiverId,
        type,
        CometChat.RECEIVER_TYPE.USER
      );
      const initiatedCall = await CometChat.initiateCall(call);
      return initiatedCall;
    } catch (error) {
      console.error(`Failed to initiate ${type} call:`, error);
      throw error;
    }
  }

  async acceptCall(sessionId: string): Promise<CallSession> {
    try {
      const acceptedCall = await CometChat.acceptCall(sessionId);
      return this.transformCall(acceptedCall);
    } catch (error) {
      console.error("Failed to accept call:", error);
      throw error;
    }
  }

  async rejectCall(sessionId: string, status: string): Promise<void> {
    try {
      await CometChat.rejectCall(sessionId, status);
    } catch (error) {
      console.error("Failed to reject call:", error);
      throw error;
    }
  }

  async endCall(sessionId: string): Promise<void> {
    try {
      await CometChat.endCall(sessionId);
      CometChatCalls.endSession();
    } catch (error) {
      console.error("Failed to end call:", error);
      throw error;
    }
  }

  addMessageListener(listener: MessageListener): void {
    this.messageListeners.add(listener);
  }

  removeMessageListener(listener: MessageListener): void {
    this.messageListeners.delete(listener);
  }

  addCallListener(listener: CallListener): void {
    this.callListeners.add(listener);
  }
  
  async startCall(
    sessionId: string,
    container: HTMLElement,
    handleEndCall: (sessionId: string) => void,
    callType: "audio" | "video"
  ) {
    try {
      const loggedInUser = await CometChat.getLoggedinUser();
      if (!loggedInUser) {
        throw new Error("User not logged in");
      }
      const callToken = await CometChatCalls.generateToken(
        sessionId,
        loggedInUser.getAuthToken()
      );
      const callSettings = new CometChatCalls.CallSettingsBuilder()
        .enableDefaultLayout(true)
        .setIsAudioOnlyCall(callType === "audio")
        .setCallListener(
          new CometChatCalls.OngoingCallListener({
            onUserListUpdated: (userList) => {
              console.log("user list:", userList);
            },
            onCallEnded: () => {
              console.log("Call ended");
              handleEndCall(sessionId);
              CometChatCalls.endSession();
            },
            onSessionTimeout: () => {
              console.log("Call ended due to session timeout");
            },
            onError: (error) => {
              console.log("Error :", error);
            },
            onMediaDeviceListUpdated: (deviceList) => {
              console.log("Device List:", deviceList);
            },
            onUserMuted: (event) => {
              console.log("Listener => onUserMuted:", {
                userMuted: event.muted,
                userMutedBy: event.mutedBy,
              });
            },
            onScreenShareStarted: () => {
              // This event will work in JS SDK v3.0.3 & later.
              console.log("Screen sharing started.");
            },
            onScreenShareStopped: () => {
              // This event will work in JS SDK v3.0.3 & later.
              console.log("Screen sharing stopped.");
            },
            onCallSwitchedToVideo: (event) => {
              // This event will work in JS SDK v3.0.8 & later.
              console.log("call switched to video:", {
                sessionId: event.sessionId,
                callSwitchInitiatedBy: event.initiator,
                callSwitchAcceptedBy: event.responder,
              });
            },
            onUserJoined: (user) => console.log("event => onUserJoined", user),
            onUserLeft: (user) => console.log("event => onUserLeft", user),
          })
        )
        .build();
      CometChatCalls.startSession(callToken.token, callSettings, container);
    } catch (error) {
      console.error("Failed to start call:", error);
    }
  }

  removeCallListener(listener: CallListener): void {
    this.callListeners.delete(listener);
  }

  addUserStatusListener(listener: UserStatusListener): void {
    this.userStatusListeners.add(listener);
  }

  removeUserStatusListener(listener: UserStatusListener): void {
    this.userStatusListeners.delete(listener);
  }

  removeAllListeners(): void {
    // Clear all local listener sets
    this.messageListeners.clear();
    this.callListeners.clear();
    this.userStatusListeners.clear();

    // Remove CometChat listeners
    CometChat.removeMessageListener("message-listener");
    CometChat.removeCallListener("call-listener");
    CometChat.removeUserListener("user-status-listener");
  }

  private registerListeners(): void {
    CometChat.addMessageListener(
      "message-listener",
      new CometChat.MessageListener({
        onTextMessageReceived: (message: CometChat.TextMessage) => {
          this.messageListeners.forEach((listener) => listener(message));
        },
        onMediaMessageReceived: (message: CometChat.MediaMessage) => {
          this.messageListeners.forEach((listener) => listener(message));
        },
        onCustomMessageReceived: (message: CometChat.CustomMessage) => {
          this.messageListeners.forEach((listener) => listener(message));
        }
      })
    );

    CometChat.addCallListener(
      "call-listener",
      new CometChat.CallListener({
        onIncomingCallReceived: (call: CometChat.Call) => {
          this.callListeners.forEach((l) => l(call, "incoming"));
        },
        onOutgoingCallAccepted: (call: CometChat.Call) => {
          this.callListeners.forEach((l) => l(call, "outgoing-accepted"));
        },
        onOutgoingCallRejected: (call: CometChat.Call) => {
          this.callListeners.forEach((l) => l(call, "outgoing-rejected"));
        },
        onIncomingCallCancelled: (call: CometChat.Call) => {
          this.callListeners.forEach((l) => l(call, "incoming-cancelled"));
        },
      })
    );
  }
  private transformUser(user: CometChat.User): User {
    return {
      uid: user.getUid(),
      name: user.getName(),
      avatar: user.getAvatar(),
      status: user.getStatus(),
      role: user.getRole(),
    };
  }

  private transformMessage(message: CometChat.BaseMessage): ChatMessage {
    return {
      id: message.getId(),
      text: message.getData()?.text || "",
      type: message.getType(),
      sender: message.getSender().getUid(),
      receiver: message.getReceiverId(),
      sentAt: message.getSentAt(),
      status: message.getDeliveredAt() ? "delivered" : "sent",
    };
  }

  private transformCall(call: CometChat.Call): CallSession {
    const receiver = call.getCallReceiver();
    return {
      sessionId: call.getSessionId(),
      callType: call.getType() as "audio" | "video",
      initiator: call.getCallInitiator().getUid(),
      receiver:
        receiver instanceof CometChat.User
          ? receiver.getUid()
          : receiver.getGuid(),
      status: call.getStatus(),
      startedAt: call.getInitiatedAt(),
      endedAt: call.getInitiatedAt(),
    };
  }

  private transformConversation(
    conversation: CometChat.Conversation
  ): ChatUser {
    const conversationWith = conversation.getConversationWith();
    return {
      id:
        conversationWith instanceof CometChat.User
          ? conversationWith.getUid()
          : conversationWith.getGuid(),
      name: conversationWith.getName(),
      lastMessage: conversation.getLastMessage()?.getData()?.text || "",
      lastMessageAt:
        conversationWith instanceof CometChat.User
          ? new Date(conversationWith.getLastActiveAt() * 1000).toISOString()
          : new Date(
              conversation.getLastMessage()?.getSentAt() || 0
            ).toISOString(),
      avatar:
        conversationWith instanceof CometChat.User
          ? conversationWith.getAvatar()
          : "",
      online:
        conversationWith instanceof CometChat.User
          ? conversationWith.getStatus() === "online"
          : false,
      isAI: false,
      duration: "0m",
      conversationTime: "0m",
      isOngoingCall: false,
      callType: "chat",
      callDuration: "0m",
    };
  }

  async getGroup(groupId: string): Promise<CometChat.Group> {
    const group = await CometChat.getGroup(groupId);
    return group;
  }

  async getConversations(limit: number = 30): Promise<ChatUser[]> {
    try {
      const conversationsRequest: CometChat.ConversationsRequest =
        new CometChat.ConversationsRequestBuilder()
          .setLimit(limit)
          .setConversationType("user")
          .build();

      const conversations = await conversationsRequest.fetchNext();

      return conversations.map((conversation) =>
        this.transformConversation(conversation)
      );
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      throw error;
    }
  }

  async markConversationAsRead(
    conversationWith: string,
    conversationType: string = CometChat.RECEIVER_TYPE.USER
  ): Promise<void> {
    try {
      await CometChat.markAsRead(conversationWith, conversationType);
    } catch (error) {
      console.error("Failed to mark conversation as read:", error);
      throw error;
    }
  }
  async getUserConversations(userId: string) {
    const conversations = await CometChat.getConversation(
      userId,
      CometChat.RECEIVER_TYPE.USER
    );
    return conversations;
  }

  async getPreviousMessages(
    uid: string,
    limit: number = 30
  ): Promise<CometChat.BaseMessage[]> {
    try {
      const messagesRequest = new CometChat.MessagesRequestBuilder()
        .setUID(uid)
        .setLimit(limit)
        .build();

      const messages = await messagesRequest.fetchPrevious();
      return messages;
    } catch (error) {
      console.error("Failed to fetch previous messages:", error);
      throw error;
    }
  }

  async sendTextMessage(
    receiverId: string,
    text: string,
    metadata?: object,
    tags?: string[]
  ): Promise<CometChat.BaseMessage> {
    try {
      const textMessage = new CometChat.TextMessage(
        receiverId,
        text,
        CometChat.RECEIVER_TYPE.USER
      );

      if (metadata) {
        textMessage.setMetadata(metadata);
      }

      if (tags && tags.length > 0) {
        textMessage.setTags(tags);
      }

      const sentMessage = await CometChat.sendMessage(textMessage);
      return sentMessage;
    } catch (error) {
      console.error("Failed to send text message:", error);
      throw error;
    }
  }

  async sendMediaMessage(
    receiverId: string,
    file: File,
    messageType: string,
    caption?: string,
    metadata?: object,
    tags?: string[]
  ): Promise<CometChat.BaseMessage> {
    try {
      const mediaMessage = new CometChat.MediaMessage(
        receiverId,
        file,
        messageType,
        CometChat.RECEIVER_TYPE.USER
      );

      if (caption) {
        mediaMessage.setCaption(caption);
      }

      if (metadata) {
        mediaMessage.setMetadata(metadata);
      }

      if (tags && tags.length > 0) {
        mediaMessage.setTags(tags);
      }
      console.log("----------------mediaMessage----------------", mediaMessage);
      const sentMessage = await CometChat.sendMediaMessage(mediaMessage);
      return sentMessage;
    } catch (error) {
      console.error("Failed to send media message:", error);
      throw error;
    }
  }

  async sendCustomMessage(
    receiverId: string,
    customType: string,
    customData: object,
    metadata?: object,
    tags?: string[]
  ): Promise<ChatMessage> {
    try {
      const customMessage = new CometChat.CustomMessage(
        receiverId,
        CometChat.RECEIVER_TYPE.USER,
        customType,
        customData
      );

      if (metadata) {
        customMessage.setMetadata(metadata);
      }

      if (tags && tags.length > 0) {
        customMessage.setTags(tags);
      }

      const sentMessage = await CometChat.sendCustomMessage(customMessage);
      return this.transformMessage(sentMessage);
    } catch (error) {
      console.error("Failed to send custom message:", error);
      throw error;
    }
  }

  async editMessage(messageId: number, newText: string): Promise<ChatMessage> {
    try {
      const textMessage = new CometChat.TextMessage(
        messageId.toString(),
        newText,
        CometChat.RECEIVER_TYPE.USER
      );

      const editedMessage = await CometChat.editMessage(textMessage);
      return this.transformMessage(editedMessage);
    } catch (error) {
      console.error("Failed to edit message:", error);
      throw error;
    }
  }

  async deleteMessage(messageId: number): Promise<void> {
    try {
      await CometChat.deleteMessage(messageId.toString());
    } catch (error) {
      console.error("Failed to delete message:", error);
      throw error;
    }
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      await CometChat.markAsRead(messageId);
    } catch (error) {
      console.error("Failed to mark message as read:", error);
      throw error;
    }
  }
}

export default CometChatService;
