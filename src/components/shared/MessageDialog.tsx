import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface MessageDialogProps {
  creatorName: string;
  creatorId: string;
  trigger?: React.ReactNode;
}

export function MessageDialog({ creatorName, creatorId, trigger }: MessageDialogProps) {
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSend = () => {
    if (!user) {
      toast.error("Please log in to send messages");
      navigate("/login");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    toast.success(`Message sent to ${creatorName}!`);
    setMessage("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <MessageCircle className="h-4 w-4 mr-2" />Message
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Message {creatorName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <Textarea
            placeholder={`Hi ${creatorName}, I'd like to discuss a project...`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
          <Button className="w-full gradient-primary text-primary-foreground" onClick={handleSend}>
            <Send className="h-4 w-4 mr-2" />Send Message
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
