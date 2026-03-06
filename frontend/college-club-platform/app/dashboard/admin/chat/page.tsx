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

export default function AdminChatPage() {
  const { user } = useAuth();
  const [club, setClub] = useState<Club | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatMode, setChatMode] = useState<"open" | "admin_only">("open");
  const [connected, setConnected] = useState(false);
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; messageId: string } | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Fetch admin's club
  useEffect(() => {
    const fetchClub = async () => {
      try {
        const myClub = await clubsAPI.getMyClub();
        setClub(myClub);
      } catch (err) {
        console.error("Failed to fetch club:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchClub();
  }, [user]);

  // Connect socket
  useEffect(() => {
    if (!club || !user) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    if (socketRef.current) socketRef.current.disconnect();

    const socket = io(
      process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
        "http://localhost:5000",
      { auth: { token } }
    );

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-club", club._id);
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("joined-club", () => {
      loadMessages(club._id);
      loadSettings(club._id);
      loadPinnedMessage(club._id);
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
      socket.emit("leave-club", club._id);
      socket.disconnect();
    };
  }, [club, user]);

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
    if (!newMessage.trim() || !club || !socketRef.current) return;
    socketRef.current.emit("send-message", {
      clubId: club._id,
      text: newMessage.trim(),
    });
    setNewMessage("");
    inputRef.current?.focus();
  };

  const toggleChatMode = async () => {
    if (!club) return;
    const newMode = chatMode === "open" ? "admin_only" : "open";
    try {
      await chatAPI.updateSettings(club._id, newMode);
      setChatMode(newMode);
      socketRef.current?.emit("chat-mode-changed", {
        clubId: club._id,
        chatMode: newMode,
      });
    } catch (err) {
      console.error("Failed to update chat mode:", err);
    }
  };

  const handlePinMessage = async (messageId: string) => {
    if (!club) return;
    try {
      const data = await chatAPI.pinMessage(club._id, messageId);
      setPinnedMessage(data.pinnedMessage);
      socketRef.current?.emit("message-pinned", {
        clubId: club._id,
        pinnedMessage: data.pinnedMessage,
      });
    } catch (err) {
      console.error("Failed to pin message:", err);
    }
    setContextMenu(null);
  };

  const handleUnpinMessage = async () => {
    if (!club) return;
    try {
      await chatAPI.unpinMessage(club._id);
      setPinnedMessage(null);
      socketRef.current?.emit("message-unpinned", {
        clubId: club._id,
      });
    } catch (err) {
      console.error("Failed to unpin message:", err);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, messageId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, messageId });
  };

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

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

  if (!club) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center">
          <div className="text-5xl mb-4">💬</div>
          <h2 className="text-xl font-semibold text-white mb-2">No Club Found</h2>
          <p className="text-zinc-400 text-sm">You need to manage a club to use chat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800">
      {/* Chat Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">
            {club.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold text-white">{club.name}</h2>
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-400" : "bg-red-400"}`} />
              <span className="text-[11px] text-zinc-500">
                {connected ? `${club.members?.length || 0} members` : "Reconnecting..."}
              </span>
            </div>
          </div>
        </div>

        {/* Chat Mode Toggle */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-zinc-500">Chat Mode</div>
            <div className={`text-xs font-medium ${chatMode === "admin_only" ? "text-red-400" : "text-green-400"}`}>
              {chatMode === "admin_only" ? "Admin Only" : "Open to All"}
            </div>
          </div>
          <button
            onClick={toggleChatMode}
            className={`relative w-12 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${
              chatMode === "admin_only" ? "bg-red-500/30" : "bg-green-500/30"
            }`}
            title={chatMode === "admin_only" ? "Switch to open chat" : "Switch to admin-only"}
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full transition-all duration-200 ${
                chatMode === "admin_only" ? "left-1 bg-red-400" : "left-[26px] bg-green-400"
              }`}
            />
          </button>
        </div>
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
              <button
                onClick={handleUnpinMessage}
                className="p-1 hover:bg-zinc-700/50 rounded transition text-zinc-500 hover:text-white flex-shrink-0"
                title="Unpin message"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-zinc-500 text-sm">No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date}>
              <div className="flex items-center justify-center my-4">
                <span className="px-3 py-1 bg-zinc-800/80 rounded-full text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                  {group.date}
                </span>
              </div>

              {group.messages.map((msg, idx) => {
                const isMe = msg.sender._id === user?.id;
                const prevMsg = idx > 0 ? group.messages[idx - 1] : null;
                const sameSender = prevMsg && prevMsg.sender._id === msg.sender._id;
                const isSenderAdmin = msg.sender.role === "admin";

                return (
                  <div
                    key={msg._id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"} ${sameSender ? "mt-0.5" : "mt-3"}`}
                    onContextMenu={(e) => handleContextMenu(e, msg._id)}
                  >
                    <div className={`max-w-[75%] sm:max-w-[60%] ${isMe ? "items-end" : "items-start"}`}>
                      {!isMe && !sameSender && (
                        <div className="flex items-center gap-1.5 mb-1 ml-1">
                          <span className="text-xs font-medium text-zinc-400">{msg.sender.name}</span>
                          {isSenderAdmin && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-blue-500/20 text-blue-400 rounded">
                              Admin
                            </span>
                          )}
                        </div>
                      )}

                      <div
                        className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                          isMe
                            ? "bg-blue-600 text-white rounded-br-md"
                            : "bg-zinc-800 text-zinc-100 rounded-bl-md"
                        }`}
                      >
                        {msg.text}
                        <span className={`block text-[10px] mt-1 ${isMe ? "text-blue-200/60" : "text-zinc-500"}`}>
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
        {contextMenu && (
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

      {/* Input */}
      <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/30 flex-shrink-0">
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
