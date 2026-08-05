import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  category: string;
  read_time: string | null;
  created_at: string;
}

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("blog_posts").select("*").eq("is_published", true).order("created_at", { ascending: false })
      .then(({ data }) => { setPosts(data || []); setLoading(false); });
  }, []);

  const fallbackPosts: BlogPost[] = [
    { id: "1", title: "10 Tips to Build a Killer Creator Portfolio", excerpt: "Stand out from the crowd with these portfolio optimization strategies.", content: "", image_url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=400&fit=crop", category: "Tips", read_time: "5 min", created_at: "2026-02-28" },
    { id: "2", title: "How Canecsu Rankings Work", excerpt: "A transparent look at our data-driven ranking algorithm.", content: "", image_url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop", category: "Platform", read_time: "4 min", created_at: "2026-02-20" },
    { id: "3", title: "Pricing Your Services: A Creator's Guide", excerpt: "Learn how to price competitively without undervaluing your work.", content: "", image_url: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=400&fit=crop", category: "Guide", read_time: "7 min", created_at: "2026-02-15" },
  ];

  const displayPosts = posts.length > 0 ? posts : fallbackPosts;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">Blog & Resources</h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Tips, guides, and stories from the Canecsu community</p>
            </motion.div>

            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
            ) : (
              <>
                {displayPosts.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="mb-12 rounded-3xl overflow-hidden bg-card shadow-card cursor-pointer group">
                    <div className="grid md:grid-cols-2">
                      <div className="aspect-[16/10] md:aspect-auto overflow-hidden">
                        {displayPosts[0].image_url && <img src={displayPosts[0].image_url} alt={displayPosts[0].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                      </div>
                      <div className="p-8 md:p-12 flex flex-col justify-center">
                        <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full w-fit mb-4">{displayPosts[0].category}</span>
                        <h2 className="font-heading text-2xl md:text-3xl font-bold mb-3">{displayPosts[0].title}</h2>
                        <p className="text-muted-foreground mb-4">{displayPosts[0].excerpt}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{new Date(displayPosts[0].created_at).toLocaleDateString()}</span>
                          {displayPosts[0].read_time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{displayPosts[0].read_time}</span>}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayPosts.slice(1).map((post, i) => (
                    <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i + 1) * 0.08 }}
                      className="bg-card rounded-2xl overflow-hidden shadow-card cursor-pointer group hover:shadow-card-hover transition-all">
                      {post.image_url && (
                        <div className="aspect-[16/10] overflow-hidden">
                          <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      )}
                      <div className="p-5">
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">{post.category}</span>
                        <h3 className="font-heading font-semibold text-lg mt-3 mb-2 line-clamp-2">{post.title}</h3>
                        <p className="text-muted-foreground text-sm line-clamp-2">{post.excerpt}</p>
                        <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          {post.read_time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.read_time}</span>}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
