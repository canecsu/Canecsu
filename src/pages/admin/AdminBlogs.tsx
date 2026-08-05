import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Eye, EyeOff, Save, X } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const AdminBlogs = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("General");
  const [readTime, setReadTime] = useState("5 min");
  const [isPublished, setIsPublished] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-blogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const resetForm = () => {
    setEditingId(null);
    setTitle(""); setExcerpt(""); setContent(""); setImageUrl("");
    setCategory("General"); setReadTime("5 min"); setIsPublished(false);
  };

  const openNew = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (post: any) => {
    setEditingId(post.id);
    setTitle(post.title); setExcerpt(post.excerpt || ""); setContent(post.content);
    setImageUrl(post.image_url || ""); setCategory(post.category);
    setReadTime(post.read_time || "5 min"); setIsPublished(post.is_published);
    setDialogOpen(true);
  };

  const savePost = async () => {
    if (!title || !content) { toast.error("Title and content are required"); return; }
    const payload = {
      title, excerpt, content, image_url: imageUrl || null,
      category, read_time: readTime, is_published: isPublished, author_id: user?.id,
    };

    if (editingId) {
      const { error } = await supabase.from("blog_posts").update(payload).eq("id", editingId);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Blog post updated!");
    } else {
      const { error } = await supabase.from("blog_posts").insert(payload);
      if (error) { toast.error("Failed to create"); return; }
      toast.success("Blog post created!");
    }
    setDialogOpen(false); resetForm();
    queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
  };

  const deletePost = async (id: string) => {
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (!error) { toast.success("Deleted"); queryClient.invalidateQueries({ queryKey: ["admin-blogs"] }); }
  };

  const togglePublish = async (id: string, current: boolean) => {
    const { error } = await supabase.from("blog_posts").update({ is_published: !current }).eq("id", id);
    if (!error) { toast.success(!current ? "Published!" : "Unpublished"); queryClient.invalidateQueries({ queryKey: ["admin-blogs"] }); }
  };

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-heading text-2xl font-bold">Blog Management</h1>
              <p className="text-muted-foreground text-sm">{posts.length} posts total</p>
            </div>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />New Post</Button>
          </div>

          <div className="space-y-3">
            {posts.map(post => (
              <Card key={post.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  {post.image_url && (
                    <img src={post.image_url} alt="" className="w-20 h-14 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{post.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{post.category}</Badge>
                      <Badge variant={post.is_published ? "default" : "secondary"}>
                        {post.is_published ? "Published" : "Draft"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => togglePublish(post.id, post.is_published)}>
                      {post.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(post)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deletePost(post.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {posts.length === 0 && !isLoading && (
              <p className="text-center text-muted-foreground py-12">No blog posts yet. Create your first one!</p>
            )}
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Blog Post" : "New Blog Post"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div><label className="text-sm font-medium mb-1 block">Title</label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
                <div><label className="text-sm font-medium mb-1 block">Excerpt</label><Input value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Short summary..." /></div>
                <div><label className="text-sm font-medium mb-1 block">Content</label><Textarea value={content} onChange={e => setContent(e.target.value)} rows={8} /></div>
                <div><label className="text-sm font-medium mb-1 block">Image URL</label><Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Category</label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="Tips">Tips</SelectItem>
                        <SelectItem value="Platform">Platform</SelectItem>
                        <SelectItem value="Guide">Guide</SelectItem>
                        <SelectItem value="Trends">Trends</SelectItem>
                        <SelectItem value="Stories">Stories</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><label className="text-sm font-medium mb-1 block">Read Time</label><Input value={readTime} onChange={e => setReadTime(e.target.value)} /></div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                  <span className="text-sm font-medium">Publish immediately</span>
                </div>
                <Button className="w-full" onClick={savePost}><Save className="h-4 w-4 mr-2" />{editingId ? "Update Post" : "Create Post"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>
    </AdminLayout>
  );
};

export default AdminBlogs;
