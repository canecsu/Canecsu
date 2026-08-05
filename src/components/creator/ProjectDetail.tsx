import { useState, useEffect } from "react";
import { Heart, Share2, MessageCircle, Eye, X, ArrowLeft, Bookmark, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProjectComments } from "./ProjectComments";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PortfolioItem {
  id: string;
  url: string;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  type: string;
  tags?: string[] | null;
  is_featured: boolean;
  thumbnail_url?: string | null;
}

interface ProjectDetailProps {
  item: PortfolioItem | null;
  creatorName: string;
  creatorAvatar?: string | null;
  creatorId: string;
  relatedItems: PortfolioItem[];
  onClose: () => void;
  onItemSelect: (item: PortfolioItem) => void;
  onHire: () => void;
  onMessage: () => void;
}

export function ProjectDetail({
  item, creatorName, creatorAvatar, creatorId,
  relatedItems, onClose, onItemSelect, onHire, onMessage
}: ProjectDetailProps) {
  const { user } = useAuth();
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (item) fetchLikes();
  }, [item, user]);

  const fetchLikes = async () => {
    if (!item) return;
    const { data } = await supabase.from("project_likes").select("id, user_id").eq("portfolio_item_id", item.id);
    setLikesCount(data?.length || 0);
    setIsLiked(!!data?.find(l => l.user_id === user?.id));
  };

  const toggleLike = async () => {
    if (!user) { toast.error("Please log in"); return; }
    if (!item) return;
    if (isLiked) {
      await supabase.from("project_likes").delete().eq("portfolio_item_id", item.id).eq("user_id", user.id);
    } else {
      await supabase.from("project_likes").insert({ portfolio_item_id: item.id, user_id: user.id });
    }
    fetchLikes();
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: item?.title || "Project", url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  };

  if (!item) return null;

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[92vh] p-0 rounded-2xl overflow-hidden border-none shadow-2xl bg-card flex flex-col gap-0">
        {/* Close */}
        <Button
          variant="ghost" size="icon"
          className="absolute top-4 right-4 z-50 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

        <ScrollArea className="flex-1">
          <div className="pb-20">
            {/* Hero */}
            <div className="w-full aspect-video max-h-[50vh] relative bg-muted">
              <img
                src={item.url}
                alt={item.title || "Project"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
                {item.category && (
                  <Badge className="mb-3 bg-primary/20 text-primary hover:bg-primary/30 border-none uppercase tracking-widest font-bold text-[10px]">
                    {item.category}
                  </Badge>
                )}
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-foreground uppercase tracking-tight">
                  {item.title || "Untitled Project"}
                </h2>
              </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 sm:px-10">
              {/* Creator info + actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-6 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                    {creatorAvatar ? (
                      <img src={creatorAvatar} alt={creatorName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-primary text-sm">{creatorName.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{creatorName}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Creator</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="ghost" size="sm"
                    onClick={toggleLike}
                    className={cn("rounded-full gap-1.5", isLiked && "text-primary")}
                  >
                    <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                    {likesCount}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleShare} className="rounded-full">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={onMessage} className="rounded-full" variant="outline">
                    <MessageCircle className="h-4 w-4 mr-1.5" /> Message
                  </Button>
                  <Button size="sm" onClick={onHire} className="rounded-full bg-primary hover:bg-primary/90">
                    Hire Creator
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div className="py-8 space-y-10">
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-widest flex items-center gap-3">
                    <span className="w-8 h-[2px] bg-primary rounded-full" /> About This Project
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {item.description || "A carefully crafted project showcasing creative vision, attention to detail, and professional execution. This piece represents a thoughtful exploration of the subject matter through a unique artistic lens."}
                  </p>
                </div>

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-widest flex items-center gap-3">
                      <span className="w-8 h-[2px] bg-primary rounded-full" /> Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map(tag => (
                        <span key={tag} className="px-3 py-1.5 bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments */}
                <ProjectComments portfolioItemId={item.id} />

                {/* Related */}
                {relatedItems.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-widest flex items-center gap-3">
                      <span className="w-8 h-[2px] bg-primary rounded-full" /> More by {creatorName}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {relatedItems.slice(0, 6).map(related => (
                        <div
                          key={related.id}
                          onClick={() => onItemSelect(related)}
                          className="rounded-xl overflow-hidden aspect-[4/3] bg-muted cursor-pointer group border border-border/30"
                        >
                          <img
                            src={related.url}
                            alt={related.title || ""}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA */}
                <div className="bg-muted/50 rounded-2xl p-8 text-center border border-border/30">
                  <h3 className="font-bold text-lg mb-2">Like what you see?</h3>
                  <p className="text-sm text-muted-foreground mb-5">Work with {creatorName} on your next project</p>
                  <div className="flex justify-center gap-3">
                    <Button onClick={onHire} className="rounded-full px-8">Hire Now</Button>
                    <Button onClick={onMessage} variant="outline" className="rounded-full px-8">
                      <MessageCircle className="h-4 w-4 mr-2" /> Message
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
