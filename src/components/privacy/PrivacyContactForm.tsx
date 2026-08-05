import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(10).max(2000),
});

export function PrivacyContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, email, message });
    if (!parsed.success) {
      toast.error("Please fill in all fields correctly.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: "[Privacy / Grievance]",
      message: parsed.data.message,
    });
    setLoading(false);
    if (error) {
      toast.error("Could not submit. Please email privacy@canecsu.com");
      return;
    }
    setName(""); setEmail(""); setMessage("");
    toast.success("Thanks — our Data Protection team will respond within 7 days.");
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
        <Input type="email" placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
      </div>
      <Textarea
        placeholder="Describe your privacy concern or grievance…"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={5}
        maxLength={2000}
      />
      <Button type="submit" disabled={loading} className="rounded-xl">
        {loading ? "Submitting…" : "Submit complaint"}
      </Button>
    </form>
  );
}