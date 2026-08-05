import { useState, useEffect, useRef } from "react";
import { Send, Image, Paperclip, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string | null;
  onClose?: () => void;
  className?: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export function ChatWindow({ receiverId, receiverName, receiverAvatar, onClose, className }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const conversationId = [user?.id, receiverId].sort().join("_");

  useEffect(() => {
    if (!user) return;
    fetchMessages();

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const msg = payload.new as Message;
        setMessages(prev => [...prev, msg]);
        if (msg.sender_id !== user.id) {
          supabase.from("messages").update({ is_read: true }).eq("id", msg.id).then();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, receiverId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    setMessages(data || []);
    // Mark unread as read
    if (data && user) {
      const unread = data.filter(m => m.receiver_id === user.id && !m.is_read).map(m => m.id);
      if (unread.length > 0) {
        for (const id of unread) {
          await supabase.from("messages").update({ is_read: true }).eq("id", id);
        }
      }
    }
  };

  const handleSend = async () => {
    if (!user || !newMessage.trim() || sending) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      receiver_id: receiverId,
      content: newMessage.trim(),
    });
    if (error) toast.error("Failed to send");
    else setNewMessage("");
    setSending(false);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  // Group messages by date
  const grouped: { date: string; msgs: Message[] }[] = [];
  messages.forEach(m => {
    const date = formatDate(m.created_at);
    const last = grouped[grouped.length - 1];
    if (last && last.date === date) last.msgs.push(m);
    else grouped.push({ date, msgs: [m] });
  });

  return (
    <div className={cn("flex flex-col h-full bg-card rounded-2xl border border-border/50 overflow-hidden shadow-lg", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50 bg-muted/30">
        {onClose && (
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="w-9 h-9 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center shrink-0">
          {receiverAvatar ? (
            <img src={receiverAvatar} alt={receiverName} className="w-full h-full object-cover" />
          ) : (
            <span className="font-bold text-primary text-sm">{receiverName.charAt(0)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{receiverName}</p>
          <p className="text-[10px] text-muted-foreground">Chat</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-1">
          {grouped.length === 0 && (
            <div className="text-center py-16">
              <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
            </div>
          )}
          {grouped.map((group) => (
            <div key={group.date}>
              <div className="flex justify-center my-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {group.date}
                </span>
              </div>
              {group.msgs.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={cn("flex mb-2", isMe ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    )}>
                      <p>{msg.content}</p>
                      <div className={cn("flex items-center gap-1 mt-1", isMe ? "justify-end" : "justify-start")}>
                        <span className={cn("text-[9px]", isMe ? "text-primary-foreground/60" : "text-muted-foreground")}>
                          {formatTime(msg.created_at)}
                        </span>
                        {isMe && msg.is_read && (
                          <span className="text-[9px] text-primary-foreground/60">✓✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border/50 bg-muted/20">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 h-10 rounded-full bg-background border-border/50 text-sm"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || sending}
            className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
