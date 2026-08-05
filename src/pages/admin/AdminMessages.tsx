import { motion } from "framer-motion";
import { Mail, MailOpen, Trash2, Clock } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const AdminMessages = () => {
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const toggleRead = async (id: string, current: boolean) => {
    await supabase.from("contact_messages").update({ is_read: !current }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-messages"] });
  };

  const deleteMsg = async (id: string) => {
    await supabase.from("contact_messages").delete().eq("id", id);
    toast.success("Message deleted");
    queryClient.invalidateQueries({ queryKey: ["admin-messages"] });
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-heading text-2xl font-bold">Contact Messages</h1>
              <p className="text-muted-foreground text-sm">{unreadCount} unread of {messages.length} total</p>
            </div>
          </div>

          <div className="space-y-3">
            {messages.map(msg => (
              <Card key={msg.id} className={msg.is_read ? "opacity-70" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {msg.is_read ? <MailOpen className="h-5 w-5 text-muted-foreground" /> : <Mail className="h-5 w-5 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm">{msg.name}</h3>
                        <span className="text-xs text-muted-foreground">&lt;{msg.email}&gt;</span>
                        {!msg.is_read && <Badge>New</Badge>}
                      </div>
                      {msg.subject && <p className="text-sm font-medium mb-1">{msg.subject}</p>}
                      <p className="text-sm text-muted-foreground">{msg.message}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(msg.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => toggleRead(msg.id, msg.is_read)}>
                        {msg.is_read ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMsg(msg.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {messages.length === 0 && !isLoading && (
              <p className="text-center text-muted-foreground py-12">No contact messages yet.</p>
            )}
          </div>
        </motion.div>
    </AdminLayout>
  );
};

export default AdminMessages;
