import { useState, useEffect } from "react";
import { MessageCircle, Heart, Reply, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  likes_count: number;
  parent_id: string | null;
  created_at: string;
  profile?: { name: string; avatar_url: string | null };
  replies?: Comment[];
  isLiked?: boolean;
}

interface ProjectCommentsProps {
  portfolioItemId: string;
  className?: string;
}

export function ProjectComments({ portfolioItemId, className }: ProjectCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [portfolioItemId]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from("project_comments")
      .select("*, profiles:user_id(name, avatar_url)")
      .eq("portfolio_item_id", portfolioItemId)
      .order("created_at", { ascending: true });

    if (!data) return;

    // Fetch user's likes
    let likedIds: string[] = [];
    if (user) {
      const { data: likes } = await supabase
        .from("comment_likes")
        .select("comment_id")
        .eq("user_id", user.id);
      likedIds = (likes || []).map(l => l.comment_id);
    }

    // Build tree
    const map = new Map<string, Comment>();
    const roots: Comment[] = [];
    data.forEach(c => {
      const comment: Comment = {
        ...c,
        profile: c.profiles as any,
        replies: [],
        isLiked: likedIds.includes(c.id),
      };
      map.set(c.id, comment);
    });
    data.forEach(c => {
      const comment = map.get(c.id)!;
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id)!.replies!.push(comment);
      } else {
        roots.push(comment);
      }
    });
    setComments(roots);
  };

  const postComment = async (parentId: string | null = null) => {
    if (!user) { toast.error("Please log in to comment"); return; }
    const text = parentId ? replyText : newComment;
    if (!text.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("project_comments").insert({
      portfolio_item_id: portfolioItemId,
      user_id: user.id,
      content: text.trim(),
      parent_id: parentId,
    });
    if (error) toast.error("Failed to post comment");
    else {
      if (parentId) { setReplyText(""); setReplyTo(null); }
      else setNewComment("");
      fetchComments();
    }
    setPosting(false);
  };

  const toggleLike = async (commentId: string, isLiked: boolean) => {
    if (!user) { toast.error("Please log in"); return; }
    if (isLiked) {
      await supabase.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", user.id);
    } else {
      await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: user.id });
    }
    fetchComments();
  };

  const deleteComment = async (commentId: string) => {
    await supabase.from("project_comments").delete().eq("id", commentId);
    fetchComments();
    toast.success("Comment deleted");
  };

  const totalCount = comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={cn("group", isReply && "ml-8 mt-3")}>
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-muted overflow-hidden shrink-0 flex items-center justify-center">
          {comment.profile?.avatar_url ? (
            <img src={comment.profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-muted-foreground">{comment.profile?.name?.charAt(0) || "?"}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">{comment.profile?.name || "User"}</span>
            <span className="text-[10px] text-muted-foreground">{new Date(comment.created_at).toLocaleDateString()}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{comment.content}</p>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => toggleLike(comment.id, !!comment.isLiked)}
              className={cn("flex items-center gap-1 text-xs transition-colors", comment.isLiked ? "text-primary" : "text-muted-foreground hover:text-foreground")}
            >
              <Heart className={cn("h-3 w-3", comment.isLiked && "fill-current")} />
              {comment.likes_count > 0 && comment.likes_count}
            </button>
            {!isReply && (
              <button
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Reply className="h-3 w-3" /> Reply
              </button>
            )}
            {user?.id === comment.user_id && (
              <button
                onClick={() => deleteComment(comment.id)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Reply input */}
          {replyTo === comment.id && (
            <div className="mt-3 flex gap-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 min-h-[36px] rounded-xl text-sm resize-none"
                rows={1}
              />
              <Button
                size="icon"
                className="h-9 w-9 rounded-full shrink-0"
                onClick={() => postComment(comment.id)}
                disabled={posting || !replyText.trim()}
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
      {comment.replies?.map(r => renderComment(r, true))}
    </div>
  );

  return (
    <div className={cn("space-y-6", className)}>
      <h3 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-3">
        <span className="w-8 h-[2px] bg-primary rounded-full" />
        Comments ({totalCount})
      </h3>

      {/* New comment input */}
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-muted overflow-hidden shrink-0 flex items-center justify-center">
          <span className="text-xs font-bold text-muted-foreground">{user ? "Y" : "?"}</span>
        </div>
        <div className="flex-1 flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={user ? "Add a comment..." : "Log in to comment"}
            className="flex-1 min-h-[40px] rounded-xl text-sm resize-none"
            rows={1}
            disabled={!user}
          />
          <Button
            size="icon"
            className="h-10 w-10 rounded-full shrink-0"
            onClick={() => postComment()}
            disabled={posting || !newComment.trim() || !user}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Comment list */}
      <div className="space-y-5">
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No comments yet. Be the first!</p>
        )}
        {comments.map(c => renderComment(c))}
      </div>
    </div>
  );
}
