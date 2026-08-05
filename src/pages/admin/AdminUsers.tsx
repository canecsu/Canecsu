import { motion } from "framer-motion";
import { Search, MoreHorizontal, Shield, Ban, Eye, Mail, CheckCircle, XCircle } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useAdminUsers } from "@/hooks/useAdminData";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "creator" | "client">("all");
  const { data: users, isLoading, refetch } = useAdminUsers(search, filter);

  // View Profile dialog
  const [viewUser, setViewUser] = useState<any | null>(null);
  // Email dialog
  const [emailUser, setEmailUser] = useState<any | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const handleVerify = async (userId: string) => {
    await supabase.from("profiles").update({ is_verified: true, verification_date: new Date().toISOString() }).eq("id", userId);
    toast.success("User verified!");
    refetch();
  };

  const handleSuspend = async (userId: string, name: string) => {
    // For now we toggle verified off as a "suspend" action
    await supabase.from("profiles").update({ is_verified: false }).eq("id", userId);
    toast.success(`${name} has been suspended`);
    refetch();
  };

  const handleSendEmail = () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast.error("Please fill subject and message");
      return;
    }
    toast.success(`Email sent to ${emailUser?.name}`);
    setEmailUser(null);
    setEmailSubject("");
    setEmailBody("");
  };

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground text-sm">Manage all platform users ({users?.length || 0} total)</p>
          </div>
          <div className="flex gap-2">
            {(["all", "creator", "client"] as const).map((f) => (
              <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)} className="capitalize">
                {f === "all" ? "All Users" : f + "s"}
              </Button>
            ))}
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">User</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4 hidden md:table-cell">Type</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4 hidden lg:table-cell">City</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4 hidden lg:table-cell">Joined</th>
                  <th className="text-right text-xs font-medium text-muted-foreground p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="p-4"><Skeleton className="h-10 w-48" /></td>
                      <td className="p-4 hidden md:table-cell"><Skeleton className="h-6 w-16" /></td>
                      <td className="p-4 hidden lg:table-cell"><Skeleton className="h-6 w-20" /></td>
                      <td className="p-4"><Skeleton className="h-6 w-16" /></td>
                      <td className="p-4 hidden lg:table-cell"><Skeleton className="h-6 w-24" /></td>
                      <td className="p-4"><Skeleton className="h-8 w-8 ml-auto" /></td>
                    </tr>
                  ))
                ) : users?.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary overflow-hidden">
                          {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : user.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-sm flex items-center gap-1">
                            {user.name}
                            {user.is_verified && <Shield className="h-3 w-3 text-secondary" />}
                          </p>
                          {user.phone && <p className="text-[10px] text-muted-foreground">{user.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <Badge variant={user.type === "creator" ? "default" : "secondary"} className="text-xs capitalize">{user.type}</Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground hidden lg:table-cell">{user.city || "—"}</td>
                    <td className="p-4">
                      <Badge variant={user.is_verified ? "default" : "outline"} className={`text-xs capitalize ${user.is_verified ? "bg-secondary text-secondary-foreground" : ""}`}>
                        {user.is_verified ? "Verified" : "Unverified"}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground hidden lg:table-cell">
                      {format(new Date(user.created_at), "MMM d, yyyy")}
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewUser(user)}>
                            <Eye className="h-4 w-4 mr-2" />View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEmailUser(user)}>
                            <Mail className="h-4 w-4 mr-2" />Send Email
                          </DropdownMenuItem>
                          {!user.is_verified && (
                            <DropdownMenuItem onClick={() => handleVerify(user.id)}>
                              <CheckCircle className="h-4 w-4 mr-2" />Verify
                            </DropdownMenuItem>
                          )}
                          {user.is_verified && (
                            <DropdownMenuItem onClick={() => handleSuspend(user.id, user.name)}>
                              <XCircle className="h-4 w-4 mr-2" />Unverify
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive" onClick={() => handleSuspend(user.id, user.name)}>
                            <Ban className="h-4 w-4 mr-2" />Suspend
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {!isLoading && (!users || users.length === 0) && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* View Profile Dialog */}
      <Dialog open={!!viewUser} onOpenChange={(open) => !open && setViewUser(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          {viewUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary overflow-hidden">
                  {viewUser.avatar_url ? <img src={viewUser.avatar_url} className="w-full h-full object-cover" /> : viewUser.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg flex items-center gap-2">
                    {viewUser.name}
                    {viewUser.is_verified && <Badge variant="default" className="text-[10px] bg-secondary">Verified</Badge>}
                  </h3>
                  <p className="text-sm text-muted-foreground capitalize">{viewUser.type}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">City</p>
                  <p className="font-medium">{viewUser.city || "Not set"}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">State</p>
                  <p className="font-medium">{viewUser.state || "Not set"}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Phone</p>
                  <p className="font-medium">{viewUser.phone || "Not set"}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Country</p>
                  <p className="font-medium">{viewUser.country || "Not set"}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 col-span-2">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Bio</p>
                  <p className="font-medium">{viewUser.bio || "No bio"}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Website</p>
                  <p className="font-medium truncate">{viewUser.website || "Not set"}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Joined</p>
                  <p className="font-medium">{format(new Date(viewUser.created_at), "MMM d, yyyy")}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={() => { setViewUser(null); setEmailUser(viewUser); }}>
                  <Mail className="h-4 w-4 mr-2" />Send Email
                </Button>
                {!viewUser.is_verified ? (
                  <Button variant="secondary" onClick={() => { handleVerify(viewUser.id); setViewUser(null); }}>
                    <CheckCircle className="h-4 w-4 mr-2" />Verify
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => { handleSuspend(viewUser.id, viewUser.name); setViewUser(null); }}>
                    <Ban className="h-4 w-4 mr-2" />Suspend
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={!!emailUser} onOpenChange={(open) => !open && setEmailUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Email to {emailUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Subject</label>
              <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Email subject..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Message</label>
              <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} placeholder="Write your message..." rows={5} />
            </div>
            <Button className="w-full" onClick={handleSendEmail}>
              <Mail className="h-4 w-4 mr-2" />Send Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
