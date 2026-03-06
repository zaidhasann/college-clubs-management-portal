"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { clubsAPI, chatAPI } from "@/lib/api";
import { io, Socket } from "socket.io-client";

interface Message {
  _id: string;
  text: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
}

interface Club {
  _id: string;
  name: string;
  admin: any;
  members: any[];
}

export default function MemberChatPage() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatMode, setChatMode] = useState<"open" | "admin_only">("open");
  const [isAdmin, setIsAdmin] = useState(false);
  const [connected, setConnected] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; messageId: string } | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Fetch clubs the user belongs to
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const allClubs = await clubsAPI.getAll();
        const myClubs = allClubs.filter(
          (c: any) =>
            c.members?.some((m: any) => (m._id || m) === user?.id) ||
            (c.admin?._id || c.admin) === user?.id
        );
        setClubs(myClubs);
        if (myClubs.length > 0 && !selectedClub) {
          setSelectedClub(myClubs[0]);
        }
      } catch (err) {
        console.error("Failed to fetch clubs:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchClubs();
  }, [user]);

  // Connect socket when club is selected
  useEffect(() => {
    if (!selectedClub || !user) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    // Disconnect previous socket
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(
      process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
        "http://localhost:5000",
      {
        auth: { token },
      }
    );

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-club", selectedClub._id);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("joined-club", () => {
      // Load existing messages
      loadMessages(selectedClub._id);
      loadSettings(selectedClub._id);
      loadPinnedMessage(selectedClub._id);
    });

    socket.on("new-message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("chat-mode-updated", (data: { chatMode: "open" | "admin_only" }) => {
      setChatMode(data.chatMode);
    });

    socket.on("message-pinned-updated", (data: { pinnedMessage: Message | null }) => {
      setPinnedMessage(data.pinnedMessage);
    });

    socket.on("error", (err: string) => {
      console.error("Socket error:", err);
    });

    return () => {
      socket.emit("leave-club", selectedClub._id);
      socket.disconnect();
    };
  }, [selectedClub, user]);

  const loadMessages = async (clubId: string) => {
    try {
      const msgs = await chatAPI.getMessages(clubId);
      setMessages(msgs);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const loadSettings = async (clubId: string) => {
    try {
      const settings = await chatAPI.getSettings(clubId);
      setChatMode(settings.chatMode);
      setIsAdmin(settings.isAdmin);
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  };

  const loadPinnedMessage = async (clubId: string) => {
    try {
      const data = await chatAPI.getPinnedMessage(clubId);
      setPinnedMessage(data.pinnedMessage);
    } catch (err) {
      console.error("Failed to load pinned message:", err);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedClub || !socketRef.current) return;

    socketRef.current.emit("send-message", {
      clubId: selectedClub._id,
      text: newMessage.trim(),
    });

    setNewMessage("");
    inputRef.current?.focus();
  };

  const toggleChatMode = async () => {
    if (!selectedClub) return;
    const newMode = chatMode === "open" ? "admin_only" : "open";
    try {
      await chatAPI.updateSettings(selectedClub._id, newMode);
      setChatMode(newMode);
      socketRef.current?.emit("chat-mode-changed", {
        clubId: selectedClub._id,
        chatMode: newMode,
      });
    } catch (err) {
      console.error("Failed to update chat mode:", err);
    }
  };

  const handlePinMessage = async (messageId: string) => {
    if (!selectedClub) return;
    try {
      const data = await chatAPI.pinMessage(selectedClub._id, messageId);
      setPinnedMessage(data.pinnedMessage);
      socketRef.current?.emit("message-pinned", {
        clubId: selectedClub._id,
        pinnedMessage: data.pinnedMessage,
      });
    } catch (err) {
      console.error("Failed to pin message:", err);
    }
    setContextMenu(null);
  };

  const handleUnpinMessage = async () => {
    if (!selectedClub) return;
    try {
      await chatAPI.unpinMessage(selectedClub._id);
      setPinnedMessage(null);
      socketRef.current?.emit("message-unpinned", {
        clubId: selectedClub._id,
      });
    } catch (err) {
      console.error("Failed to unpin message:", err);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, messageId: string) => {
    if (!isAdmin) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, messageId });
  };

  const canSendMessage = chatMode === "open" || isAdmin;

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  messages.forEach((msg) => {
    const date = formatDate(msg.createdAt);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) {
      last.messages.push(msg);
    } else {
      groupedMessages.push({ date, messages: [msg] });
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (clubs.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center">
          <div className="text-5xl mb-4">💬</div>
          <h2 className="text-xl font-semibold text-white mb-2">
            No Club Chats Available
          </h2>
          <p className="text-zinc-400 text-sm">
            Join a club to start chatting with other members.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800">
      {/* Club List Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-72" : "w-0"
        } transition-all duration-300 bg-zinc-900/50 border-r border-zinc-800 flex-shrink-0 overflow-hidden`}
      >
        <div className="p-4 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            Club Chats
          </h3>
        </div>
        <div className="overflow-y-auto h-full pb-20">
          {clubs.map((club) => {
            const active = selectedClub?._id === club._id;
            return (
              <button
                key={club._id}
                onClick={() => {
                  setSelectedClub(club);
                  setMessages([]);
                  if (window.innerWidth < 768) setSidebarOpen(false);
                }}
                className={`w-full text-left px-4 py-3.5 flex items-center gap-3 transition-all border-b border-zinc-800/50 ${
                  active
                    ? "bg-blue-500/10 border-l-2 border-l-blue-500"
                    : "hover:bg-zinc-800/40 border-l-2 border-l-transparent"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                    active
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {club.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={`font-medium truncate text-sm ${
                      active ? "text-white" : "text-zinc-300"
                    }`}
                  >
                    {club.name}
                  </div>
                  <div className="text-xs text-zinc-500 truncate">
                    {club.members?.length || 0} members
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Toggle sidebar button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-zinc-800 transition text-zinc-400"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {selectedClub && (
              <>
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-semibold">
                  {selectedClub.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-semibold text-white text-sm">
                    {selectedClub.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        connected ? "bg-green-400" : "bg-red-400"
                      }`}
                    />
                    <span className="text-[11px] text-zinc-500">
                      {connected ? "Connected" : "Reconnecting..."}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Admin Controls */}
          {isAdmin && selectedClub && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 hidden sm:block">
                {chatMode === "admin_only"
                  ? "Admin only"
                  : "Everyone can chat"}
              </span>
              <button
                onClick={toggleChatMode}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                  chatMode === "admin_only" ? "bg-red-500/40" : "bg-green-500/40"
                }`}
                title={
                  chatMode === "admin_only"
                    ? "Switch to open chat"
                    : "Switch to admin-only"
                }
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200 ${
                    chatMode === "admin_only"
                      ? "left-0.5 bg-red-400"
                      : "left-[22px] bg-green-400"
                  }`}
                />
              </button>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1" onClick={() => setContextMenu(null)}>
          {/* Pinned Message Banner */}
          {pinnedMessage && (
            <div className="sticky top-0 z-10 mb-3 mx-auto max-w-2xl">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2.5 flex items-center gap-3">
                <svg className="w-4 h-4 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-yellow-400 font-semibold uppercase tracking-wider">Pinned Message</div>
                  <p className="text-sm text-zinc-200 truncate">{pinnedMessage.text}</p>
                  <span className="text-[10px] text-zinc-500">{pinnedMessage.sender?.name}</span>
                </div>
                {isAdmin && (
                  <button
                    onClick={handleUnpinMessage}
                    className="p-1 hover:bg-zinc-700/50 rounded transition text-zinc-500 hover:text-white flex-shrink-0"
                    title="Unpin message"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-zinc-500 text-sm">
                  No messages yet. Start the conversation!
                </p>
              </div>
            </div>
          ) : (
            groupedMessages.map((group) => (
              <div key={group.date}>
                {/* Date Separator */}
                <div className="flex items-center justify-center my-4">
                  <span className="px-3 py-1 bg-zinc-800/80 rounded-full text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                    {group.date}
                  </span>
                </div>

                {group.messages.map((msg, idx) => {
                  const isMe = msg.sender._id === user?.id;
                  const prevMsg = idx > 0 ? group.messages[idx - 1] : null;
                  const sameSender =
                    prevMsg && prevMsg.sender._id === msg.sender._id;
                  const isSenderAdmin = msg.sender.role === "admin";

                  return (
                    <div
                      key={msg._id}
                      className={`flex ${
                        isMe ? "justify-end" : "justify-start"
                      } ${sameSender ? "mt-0.5" : "mt-3"}`}
                      onContextMenu={(e) => handleContextMenu(e, msg._id)}
                    >
                      <div
                        className={`max-w-[75%] sm:max-w-[60%] ${
                          isMe ? "items-end" : "items-start"
                        }`}
                      >
                        {/* Sender name */}
                        {!isMe && !sameSender && (
                          <div className="flex items-center gap-1.5 mb-1 ml-1">
                            <span className="text-xs font-medium text-zinc-400">
                              {msg.sender.name}
                            </span>
                            {isSenderAdmin && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-blue-500/20 text-blue-400 rounded">
                                Admin
                              </span>
                            )}
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div
                          className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                            isMe
                              ? "bg-blue-600 text-white rounded-br-md"
                              : "bg-zinc-800 text-zinc-100 rounded-bl-md"
                          }`}
                        >
                          {msg.text}
                          <span
                            className={`block text-[10px] mt-1 ${
                              isMe ? "text-blue-200/60" : "text-zinc-500"
                            }`}
                          >
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />

          {/* Context Menu */}
          {contextMenu && isAdmin && (
            <div
              className="fixed z-50 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl py-1 min-w-[160px]"
              style={{ top: contextMenu.y, left: contextMenu.x }}
            >
              <button
                onClick={() => handlePinMessage(contextMenu.messageId)}
                className="w-full text-left px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700 flex items-center gap-2 transition"
              >
                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                </svg>
                Pin Message
              </button>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/30 flex-shrink-0">
          {!canSendMessage ? (
            <div className="flex items-center justify-center gap-2 py-2 text-zinc-500 text-sm">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Only the admin can send messages
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 bg-zinc-800/80 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/60 transition"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-xl transition flex-shrink-0"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
