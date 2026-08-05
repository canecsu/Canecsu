import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Search, ArrowLeft, MoreVertical, Phone, Video, Image as ImageIcon, Paperclip, Smile, Check, CheckCheck, Info, BellRing, X, FileVideo } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate, useSearchParams } from "react-router-dom";

interface Conversation {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline?: boolean;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB

const Messages = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const convosRef = useRef(conversations);

  useEffect(() => {
    convosRef.current = conversations;
  }, [conversations]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 50);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showMobileChat]);

  // Auth Check, Realtime Subscriptions & Auto-Refresh
  useEffect(() => {
    let isMounted = true;
    let refreshInterval: NodeJS.Timeout;

    const initChat = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      if (isMounted) fetchConversations();
      
      // Auto-refresh conversations every 10 seconds
      refreshInterval = setInterval(() => {
        if (isMounted) fetchConversations();
      }, 10000);
    };

    initChat();

    const channel = supabase
      .channel("public:messages")
      .on(
        "postgres_changes", 
        { event: "INSERT", schema: "public", table: "messages" }, 
        (payload) => {
          const msg = payload.new as Message;
          if (!user) return;
          
          if (msg.sender_id === user.id || msg.receiver_id === user.id) {
            
            setSelectedConvo(currSelected => {
              if (currSelected && (msg.sender_id === currSelected.otherUserId || msg.receiver_id === currSelected.otherUserId)) {
                setMessages(prev => {
                  if (prev.some(m => m.id === msg.id)) return prev;
                  return [...prev, msg];
                });
                
                if (msg.sender_id !== user.id) {
                  supabase.from("messages").update({ is_read: true }).eq("id", msg.id).then();
                }
              } 
              else if (msg.sender_id !== user.id) {
                const sender = convosRef.current.find(c => c.otherUserId === msg.sender_id);
                const senderName = sender?.otherUserName || "Someone";
                
                toast.custom((t) => (
                  <div className="flex items-center gap-3 bg-white dark:bg-card p-3 rounded-2xl shadow-xl border border-border/50 w-full max-w-sm">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <BellRing className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground">New message from {senderName}</p>
                      <p className="text-xs text-muted-foreground truncate">{msg.content}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-primary text-xs rounded-xl" onClick={() => {
                      toast.dismiss(t);
                      if (sender) handleSelectConvo(sender);
                    }}>View</Button>
                  </div>
                ), { position: "top-center", duration: 4000 });
              }
              return currSelected;
            });

            fetchConversations();
          }
        }
      )
      .subscribe();

    return () => { 
      isMounted = false;
      if (refreshInterval) clearInterval(refreshInterval);
      supabase.removeChannel(channel); 
    };
  }, [user, navigate]);

  // Also auto-refresh current chat messages every 10 seconds
  useEffect(() => {
    if (!selectedConvo) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selectedConvo.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (data) {
        const sorted = data.reverse();
        setMessages(prev => {
          // Only update if there are new messages
          if (sorted.length !== prev.length || (sorted.length > 0 && sorted[sorted.length - 1].id !== prev[prev.length - 1]?.id)) {
            return sorted;
          }
          return prev;
        });
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedConvo?.id]);

  // Deep Linking
  useEffect(() => {
    const userId = searchParams.get("user");
    const userName = searchParams.get("name");
    
    if (userId && userName && user) {
      const convoId = [user.id, userId].sort().join("_");
      const existingConvo = conversations.find(c => c.id === convoId);
      
      if (existingConvo) {
        handleSelectConvo(existingConvo);
      } else {
        const newConvo: Conversation = {
          id: convoId,
          otherUserId: userId,
          otherUserName: userName,
          otherUserAvatar: searchParams.get("avatar"),
          lastMessage: "",
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
        };
        setSelectedConvo(newConvo);
        setShowMobileChat(true);
        setMessages([]);
      }
    }
  }, [searchParams, user, conversations.length]);

  const fetchConversations = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data: allMessages } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(500); 

    if (!allMessages) { setLoading(false); return; }

    const convoMap = new Map<string, { msgs: Message[]; otherId: string }>();
    allMessages.forEach(msg => {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      const convoId = [user.id, otherId].sort().join("_");
      if (!convoMap.has(convoId)) convoMap.set(convoId, { msgs: [], otherId });
      convoMap.get(convoId)!.msgs.push(msg);
    });

    const otherIds = [...new Set([...convoMap.values()].map(v => v.otherId))];
    const { data: profiles } = await supabase.from("profiles").select("id, name, avatar_url").in("id", otherIds);
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    const convos: Conversation[] = [...convoMap.entries()].map(([id, val]) => {
      const lastMsg = val.msgs[0];
      const unread = val.msgs.filter(m => m.receiver_id === user.id && !m.is_read).length;
      const p = profileMap.get(val.otherId);
      return {
        id,
        otherUserId: val.otherId,
        otherUserName: p?.name || "User",
        otherUserAvatar: p?.avatar_url || null,
        lastMessage: lastMsg.content,
        lastMessageTime: lastMsg.created_at,
        unreadCount: unread,
      };
    });

    convos.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
    setConversations(convos);
    setLoading(false);
  };

  const handleSelectConvo = async (convo: Conversation) => {
    setSelectedConvo(convo);
    setShowMobileChat(true);

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convo.id)
      .order("created_at", { ascending: false })
      .limit(100); 
    
    const sortedData = (data || []).reverse();
    setMessages(sortedData);
    scrollToBottom();

    if (data && user) {
      const unreadMsgs = data.filter(m => m.receiver_id === user.id && !m.is_read);
      if (unreadMsgs.length > 0) {
        const unreadIds = unreadMsgs.map(m => m.id);
        setConversations(prev => prev.map(c => c.id === convo.id ? { ...c, unreadCount: 0 } : c));
        for (const id of unreadIds) {
          await supabase.from("messages").update({ is_read: true }).eq("id", id);
        }
      }
    }
  };

  const handleSend = async () => {
    if (!user || !selectedConvo || !newMessage.trim() || sending) return;
    
    const messageText = newMessage.trim();
    setNewMessage(""); 
    setSending(true);

    const messageId = crypto.randomUUID(); 

    const optimisticMsg: Message = {
      id: messageId,
      sender_id: user.id,
      receiver_id: selectedConvo.otherUserId,
      content: messageText,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    scrollToBottom();

    const { error } = await supabase.from("messages").insert({
      id: messageId,
      conversation_id: selectedConvo.id,
      sender_id: user.id,
      receiver_id: selectedConvo.otherUserId,
      content: messageText,
    });

    if (error) {
      toast.error("Failed to send message");
      setMessages(prev => prev.filter(m => m.id !== messageId));
      setNewMessage(messageText); 
    } else {
      setConversations(prev => {
        const convoIndex = prev.findIndex(c => c.id === selectedConvo.id);
        if (convoIndex > -1) {
          const updated = [...prev];
          const convo = updated.splice(convoIndex, 1)[0];
          convo.lastMessage = messageText;
          convo.lastMessageTime = new Date().toISOString();
          return [convo, ...updated];
        }
        return prev;
      });
    }
    setSending(false);
  };

  // File upload handler for images and videos
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !selectedConvo) return;

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Validate file type
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      toast.error("Only images and videos are supported");
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File must be under 30MB");
      return;
    }

    setUploading(true);

    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `chat/${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(filePath);
      const fileUrl = urlData.publicUrl;

      const messageContent = isImage
        ? `📷 [Image](${fileUrl})`
        : `🎥 [Video](${fileUrl})`;

      const messageId = crypto.randomUUID();
      const optimisticMsg: Message = {
        id: messageId,
        sender_id: user.id,
        receiver_id: selectedConvo.otherUserId,
        content: messageContent,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, optimisticMsg]);
      scrollToBottom();

      const { error: insertError } = await supabase.from("messages").insert({
        id: messageId,
        conversation_id: selectedConvo.id,
        sender_id: user.id,
        receiver_id: selectedConvo.otherUserId,
        content: messageContent,
      });

      if (insertError) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
        throw insertError;
      }

      toast.success(`${isImage ? "Image" : "Video"} sent!`);
    } catch (err: any) {
      toast.error("Failed to upload file: " + (err.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  // Render message content with media support
  const renderMessageContent = (content: string) => {
    // Check for image/video markdown links: 📷 [Image](url) or 🎥 [Video](url)
    const mediaMatch = content.match(/^(📷|🎥)\s*\[(Image|Video)\]\((.+)\)$/);
    if (mediaMatch) {
      const type = mediaMatch[2];
      const url = mediaMatch[3];
      if (type === "Image") {
        return (
          <div className="max-w-[280px] rounded-xl overflow-hidden">
            <img src={url} alt="Shared image" className="w-full h-auto rounded-xl cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(url, "_blank")} />
          </div>
        );
      }
      if (type === "Video") {
        return (
          <div className="max-w-[320px] rounded-xl overflow-hidden">
            <video src={url} controls className="w-full rounded-xl" preload="metadata" />
          </div>
        );
      }
    }
    return <p className="whitespace-pre-wrap break-words">{content}</p>;
  };

  // Formatting Helpers
  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 86400000 && d.getDate() === now.getDate()) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diff < 604800000) return d.toLocaleDateString([], { weekday: "short" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const formatMsgTime = (ts: string) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const y = new Date(today); y.setDate(y.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return "Yesterday";
    return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  };

  const getAvatarInitials = (name: string) => name ? name.substring(0, 2).toUpperCase() : "U";

  const grouped: { date: string; msgs: Message[] }[] = [];
  messages.forEach(m => {
    const date = formatDate(m.created_at);
    const last = grouped[grouped.length - 1];
    if (last && last.date === date) last.msgs.push(m);
    else grouped.push({ date, msgs: [m] });
  });

  const filtered = conversations.filter(c => c.otherUserName.toLowerCase().includes(searchQuery.toLowerCase()));

  if (!user && loading) return <div className="h-[100dvh] bg-background flex justify-center items-center"><div className="animate-spin h-8 w-8 border-3 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
      <Header />
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      <main className="flex-1 flex overflow-hidden min-h-0">
        
        {/* LEFT PANEL */}
        <div className={cn(
          "w-full md:w-[380px] lg:w-[400px] border-r border-border/40 flex flex-col bg-background/95 shrink-0 z-20",
          showMobileChat && "hidden md:flex"
        )}>
          <div className="px-5 py-5 border-b border-border/40 bg-card/50 backdrop-blur-sm shrink-0">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-2xl font-extrabold tracking-tight">Chats</h1>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-2xl bg-muted/60 border-transparent hover:bg-muted focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 transition-all text-[15px]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="animate-spin h-8 w-8 border-3 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center opacity-70">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Send className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-1 text-foreground">No chats yet</h3>
                <p className="text-sm text-muted-foreground">Start connecting with creators.</p>
              </div>
            ) : (
              <div className="p-3 space-y-1">
                {filtered.map(convo => (
                  <button
                    key={convo.id}
                    onClick={() => handleSelectConvo(convo)}
                    className={cn(
                      "w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl transition-all duration-200 text-left group border border-transparent",
                      selectedConvo?.id === convo.id 
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[0.98]" 
                        : "hover:bg-muted hover:border-border/50"
                    )}
                  >
                    <div className="relative shrink-0">
                      <div className={cn(
                        "w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shadow-sm",
                        selectedConvo?.id === convo.id ? "bg-primary-foreground/20" : "bg-gradient-to-br from-primary/20 to-primary/10 border border-background"
                      )}>
                        {convo.otherUserAvatar ? (
                          <img src={convo.otherUserAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className={cn("font-bold text-sm", selectedConvo?.id === convo.id ? "text-white" : "text-primary")}>
                            {getAvatarInitials(convo.otherUserName)}
                          </span>
                        )}
                      </div>
                      {(() => {
                        const lastTime = new Date(convo.lastMessageTime).getTime();
                        const isRecent = (Date.now() - lastTime) < 5 * 60 * 1000;
                        return isRecent ? <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-card rounded-full"></div> : null;
                      })()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={cn("text-[15px] truncate", convo.unreadCount > 0 ? "font-bold" : "font-semibold")}>
                          {convo.otherUserName}
                        </span>
                        <span className={cn("text-[11px] shrink-0 font-medium", selectedConvo?.id === convo.id ? "text-primary-foreground/80" : "text-muted-foreground", convo.unreadCount > 0 && "text-primary")}>
                          {formatTime(convo.lastMessageTime)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={cn("text-[13px] truncate", selectedConvo?.id === convo.id ? "text-primary-foreground/80" : convo.unreadCount > 0 ? "text-foreground font-semibold" : "text-muted-foreground")}>
                          {convo.lastMessage.startsWith("📷") ? "📷 Photo" : convo.lastMessage.startsWith("🎥") ? "🎥 Video" : convo.lastMessage}
                        </p>
                        {convo.unreadCount > 0 && selectedConvo?.id !== convo.id && (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-2 h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                            {convo.unreadCount}
                          </motion.span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className={cn(
          "flex-1 flex flex-col relative min-w-0 bg-[#F8FAFC] dark:bg-background/50",
          !showMobileChat && "hidden md:flex"
        )}>
          {selectedConvo ? (
            <>
              <div className="absolute inset-0 z-0 opacity-[0.4] dark:opacity-[0.1] pointer-events-none" 
                   style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%230D56A7\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

              <div className="flex items-center gap-3 px-4 sm:px-6 py-3.5 border-b border-border/40 bg-white/80 dark:bg-card/80 backdrop-blur-xl shrink-0 z-20 shadow-sm">
                <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 rounded-full shrink-0 mr-1 hover:bg-muted" onClick={() => setShowMobileChat(false)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>

                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer shadow-sm border border-background" onClick={() => navigate(`/creator/${selectedConvo.otherUserId}`)}>
                  {selectedConvo.otherUserAvatar ? (
                    <img src={selectedConvo.otherUserAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-primary text-sm">{getAvatarInitials(selectedConvo.otherUserName)}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/creator/${selectedConvo.otherUserId}`)}>
                  <p className="font-bold text-[15px] truncate">{selectedConvo.otherUserName}</p>
                  {(() => {
                    const otherUserMsgs = messages.filter(m => m.sender_id === selectedConvo.otherUserId);
                    const lastMsg = otherUserMsgs[otherUserMsgs.length - 1];
                    const isRecentlyActive = lastMsg && (Date.now() - new Date(lastMsg.created_at).getTime()) < 5 * 60 * 1000;
                    return isRecentlyActive 
                      ? <p className="text-[11px] text-green-600 dark:text-green-400 font-semibold tracking-wide">Active now</p>
                      : <p className="text-[11px] text-muted-foreground font-medium">{lastMsg ? `Last seen ${formatTime(lastMsg.created_at)}` : "Offline"}</p>;
                  })()}
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary"><Phone className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary"><Video className="h-5 w-5" /></Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground"><Info className="h-5 w-5" /></Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 z-10 p-4 sm:p-6 custom-scrollbar">
                <div className="max-w-3xl mx-auto flex flex-col justify-end min-h-full space-y-3 pb-2">
                  
                  <div className="flex flex-col items-center py-8 mb-6 mt-auto">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 shadow-md border-[3px] border-white dark:border-card overflow-hidden mb-3 flex items-center justify-center">
                      {selectedConvo.otherUserAvatar ? (
                        <img src={selectedConvo.otherUserAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-primary">{getAvatarInitials(selectedConvo.otherUserName)}</span>
                      )}
                    </div>
                    <h2 className="font-bold text-xl">{selectedConvo.otherUserName}</h2>
                    <p className="text-xs text-muted-foreground mb-4">Canecsu Professional</p>
                    <Button variant="outline" size="sm" className="rounded-full shadow-sm text-xs h-8" onClick={() => navigate(`/creator/${selectedConvo.otherUserId}`)}>View Profile</Button>
                  </div>

                  {grouped.map((group) => (
                    <div key={group.date} className="space-y-3">
                      <div className="flex justify-center my-4 sticky top-2 z-20">
                        <span className="text-[11px] font-bold text-muted-foreground bg-white/90 dark:bg-card/90 backdrop-blur-md border border-border/50 px-3 py-1 rounded-full shadow-sm uppercase tracking-wider">
                          {group.date}
                        </span>
                      </div>
                      
                      {group.msgs.map((msg, index) => {
                        const isMe = msg.sender_id === user?.id;
                        const nextMsg = group.msgs[index + 1];
                        const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id;

                        return (
                          <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.2 }} key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                            <div className={cn(
                              "max-w-[85%] sm:max-w-[70%] px-4 py-2.5 text-[15px] leading-relaxed relative group shadow-sm",
                              isMe ? "bg-gradient-to-tr from-primary to-[#1a66c2] text-white rounded-2xl" : "bg-white dark:bg-card text-foreground rounded-2xl border border-border/40",
                              isMe && isLastInGroup ? "rounded-br-sm" : "",
                              !isMe && isLastInGroup ? "rounded-tl-sm" : ""
                            )}>
                              {renderMessageContent(msg.content)}
                              <div className={cn("flex items-center gap-1.5 mt-1 select-none", isMe ? "justify-end" : "justify-end")}>
                                <span className={cn("text-[10px] font-medium", isMe ? "text-white/70" : "text-muted-foreground")}>{formatMsgTime(msg.created_at)}</span>
                                {isMe && (msg.is_read ? <CheckCheck className="h-3.5 w-3.5 text-blue-200" /> : <Check className="h-3.5 w-3.5 text-white/50" />)}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ))}
                  <div ref={scrollRef} className="h-1" />
                </div>
              </div>

              <div className="p-3 sm:p-4 bg-white/80 dark:bg-card/80 backdrop-blur-xl border-t border-border/40 shrink-0 z-20">
                {uploading && (
                  <div className="flex items-center gap-2 mb-2 px-4 py-2 bg-primary/10 rounded-xl text-sm text-primary font-medium">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    Uploading file...
                  </div>
                )}
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-end gap-2 max-w-4xl mx-auto relative">
                  <Button type="button" variant="ghost" size="icon" className="h-11 w-11 rounded-full text-muted-foreground shrink-0 hover:bg-muted/80 hover:text-primary transition-colors mb-0.5 hidden sm:flex" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  
                  <div className="flex-1 relative bg-white dark:bg-muted/40 rounded-3xl border border-border/60 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all shadow-sm flex items-end overflow-hidden">
                    <Button type="button" variant="ghost" size="icon" className="h-12 w-12 ml-0.5 rounded-full text-muted-foreground shrink-0 hover:text-primary sm:hidden" onClick={() => fileInputRef.current?.click()}>
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Message..."
                      className="w-full bg-transparent border-0 focus:ring-0 resize-none py-3.5 px-1 text-[15px] max-h-32 min-h-[50px] scrollbar-hide"
                      rows={1}
                      style={{ fieldSizing: "content" } as any}
                    />
                    <Button type="button" variant="ghost" size="icon" className="h-12 w-12 mr-0.5 rounded-full text-muted-foreground shrink-0 hover:text-primary" onClick={() => fileInputRef.current?.click()}>
                      <ImageIcon className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="shrink-0 mb-0.5 ml-1">
                    <AnimatePresence mode="wait">
                      {newMessage.trim() ? (
                        <motion.div key="send" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.15 }}>
                          <Button type="submit" size="icon" disabled={sending} className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-transform active:scale-95">
                            <Send className="h-5 w-5 ml-0.5" />
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.div key="mic" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.15 }}>
                          <Button type="button" size="icon" className="h-12 w-12 rounded-full bg-muted dark:bg-muted/60 text-muted-foreground hover:bg-muted/80 transition-transform active:scale-95 border border-border/50">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="w-28 h-28 rounded-full bg-white dark:bg-card flex items-center justify-center mb-6 shadow-xl shadow-primary/5 border border-border/40">
                <Send className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-3xl font-extrabold mb-3 text-foreground tracking-tight">Your Messages</h2>
              <p className="text-[15px] text-muted-foreground max-w-md mb-8 leading-relaxed">
                Connect directly with creators. Select a conversation from the sidebar to start chatting.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Messages;
