import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function DeleteAccountSection() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== "DELETE") {
      toast.error('Please type "DELETE" to confirm');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      toast.success("Your account and personal data have been removed.");
      await signOut();
      navigate("/");
    } catch (e: any) {
      toast.error(e?.message || "Could not delete account. Please contact privacy@canecsu.com");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-6 border-destructive/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" /> Delete My Account & Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          You can permanently delete your account at any time. We will remove or
          anonymize your personal data (profile, portfolio, messages, reviews and
          uploads). Records we are required to retain for tax or fraud-prevention
          purposes will be kept in anonymized form only.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="rounded-xl">
              <Trash2 className="h-4 w-4 mr-2" /> Delete my account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>This action cannot be undone</AlertDialogTitle>
              <AlertDialogDescription>
                Type <span className="font-bold text-foreground">DELETE</span> to
                confirm. Your account, profile and personal content will be
                permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="my-2"
            />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmText("")}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={loading || confirmText !== "DELETE"}
                className="bg-destructive hover:bg-destructive/90"
              >
                {loading ? "Deleting..." : "Permanently delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}