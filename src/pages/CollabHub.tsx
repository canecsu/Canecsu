import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom"; // 🔥 IMPORT ADDED
import { 
  Plus, Briefcase, MapPin, Calendar, DollarSign, Users, 
  ChevronRight, Send, Check, X, Search, Filter, Sparkles, Clock 
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CollabProject {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  category: string;
  budget_min: number;
  budget_max: number;
  location: string | null;
  deadline: string | null;
  skills_needed: string[];
  status: string;
  created_at: string;
  creator_name?: string;
  creator_avatar?: string;
  application_count?: number;
}

interface CollabApplication {
  id: string;
  project_id: string;
  applicant_id: string;
  message: string | null;
  proposed_price: number;
  status: string;
  created_at: string;
  applicant_name?: string;
  applicant_avatar?: string;
  project_title?: string;
}

const CATEGORIES = ["All", "General", "Photography", "Videography", "Content", "Modeling", "Design", "Development"];

export default function CollabHub() {
  // 🔥 UPDATED: Extracted profile to check the plan
  const { user, profile } = useAuth(); 
  const navigate = useNavigate(); // 🔥 ADDED: for redirection
  
  const [projects, setProjects] = useState<CollabProject[]>([]);
  const [myApplications, setMyApplications] = useState<CollabApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<CollabProject | null>(null);
  const [viewProject, setViewProject] = useState<CollabProject | null>(null);
  const [projectApplications, setProjectApplications] = useState<CollabApplication[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [location, setLocation] = useState("");
  const [deadline, setDeadline] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [applyMessage, setApplyMessage] = useState("");
  const [applyPrice, setApplyPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchProjects(); }, []);
  useEffect(() => { if (user) fetchMyApplications(); }, [user]);

  const fetchProjects = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("collab_projects")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (data) {
      const creatorIds = [...new Set(data.map(p => p.creator_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, name, avatar_url").in("id", creatorIds);
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

      setProjects(data.map(p => ({
        ...p,
        creator_name: profileMap[p.creator_id]?.name || "Unknown",
        creator_avatar: profileMap[p.creator_id]?.avatar_url,
      })));
    }
    setLoading(false);
  };

  const fetchMyApplications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("collab_applications")
      .select("*")
      .eq("applicant_id", user.id)
      .order("created_at", { ascending: false });
    setMyApplications(data || []);
  };

  const fetchProjectApplications = async (projectId: string) => {
    const { data } = await supabase
      .from("collab_applications")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (data) {
      const applicantIds = [...new Set(data.map(a => a.applicant_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, name, avatar_url").in("id", applicantIds);
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

      setProjectApplications(data.map(a => ({
        ...a,
        applicant_name: profileMap[a.applicant_id]?.name || "Unknown",
        applicant_avatar: profileMap[a.applicant_id]?.avatar_url,
      })));
    }
  };

  // Plan gating removed: any logged-in user can post or apply.
  const isPremiumUser = () => !!user;

  const handlePremiumAction = (actionCallback: () => void) => {
    if (!user) { 
      toast.error("Please log in first"); 
      navigate("/login"); 
      return; 
    }
    
    actionCallback();
  };

  const handleCreateProject = async () => {
    if (!user) { toast.error("Please log in first"); return; }
    if (!title.trim() || !description.trim()) { toast.error("Title and description are required"); return; }
    setSubmitting(true);

    const { error } = await supabase.from("collab_projects").insert({
      creator_id: user.id,
      title: title.trim(),
      description: description.trim(),
      category: category.toLowerCase(),
      budget_min: parseInt(budgetMin) || 0,
      budget_max: parseInt(budgetMax) || 0,
      location: location || null,
      deadline: deadline || null,
      skills_needed: skillsInput.split(",").map(s => s.trim()).filter(Boolean),
    });

    setSubmitting(false);
    if (error) { toast.error("Failed to create project"); return; }
    toast.success("Project posted successfully!");
    setCreateOpen(false);
    resetForm();
    fetchProjects();
  };

  const handleApply = async () => {
    if (!user || !selectedProject) return;
    setSubmitting(true);

    const { error } = await supabase.from("collab_applications").insert({
      project_id: selectedProject.id,
      applicant_id: user.id,
      message: applyMessage || null,
      proposed_price: parseInt(applyPrice) || 0,
    });

    setSubmitting(false);
    if (error) {
      if (error.code === "23505") toast.error("You already applied to this project");
      else toast.error("Failed to submit application");
      return;
    }
    toast.success("Application submitted successfully!");
    setApplyOpen(false);
    setApplyMessage(""); setApplyPrice("");
    fetchMyApplications();
  };

  const handleApplicationStatus = async (appId: string, status: string) => {
    const { error } = await supabase.from("collab_applications").update({ status }).eq("id", appId);
    if (error) toast.error("Failed to update status");
    else {
      toast.success(`Application marked as ${status}`);
      if (viewProject) fetchProjectApplications(viewProject.id);
    }
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setCategory("general"); setBudgetMin(""); setBudgetMax("");
    setLocation(""); setDeadline(""); setSkillsInput("");
  };

  const myProjects = projects.filter(p => p.creator_id === user?.id);
  const appliedIds = new Set(myApplications.map(a => a.project_id));

  // Filter Logic
  const filteredProjects = useMemo(() => {
    return projects
      .filter(p => p.creator_id !== user?.id)
      .filter(p => activeCategory === "All" || p.category.toLowerCase() === activeCategory.toLowerCase())
      .filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [projects, user?.id, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-muted/30 pt-16 pb-12 md:pt-24 md:pb-20 border-b border-border/50">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="container max-w-6xl relative z-10 px-4 md:px-6">
            <div className="max-w-2xl">
              <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 py-1">
                <Sparkles className="h-3 w-3 mr-1" /> Universal CollabHub
              </Badge>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground">
                Find Your Next <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                  Creative Collaboration
                </span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Whether you're a client seeking top-tier talent or a creator looking for your next big project, connect and build together right here.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="Search projects by title or keyword..." 
                    className="pl-10 h-12 rounded-xl border-border/50 shadow-sm bg-background"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {user && (
  <Button 
    size="lg" 
    className="h-12 rounded-xl px-8 shadow-md" 
    onClick={() => handlePremiumAction(() => setCreateOpen(true))}
  >
    <Plus className="h-5 w-5 mr-2" /> Post a Project
  </Button>
)}
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-8 md:py-12">
          <div className="container max-w-6xl px-4 md:px-6">
            <Tabs defaultValue="browse" className="space-y-8">
              <TabsList className="bg-muted/50 p-1 h-auto rounded-xl w-full max-w-md mx-auto flex">
                <TabsTrigger value="browse" className="rounded-lg flex-1 py-2.5">Discover</TabsTrigger>
                {user && <TabsTrigger value="my-projects" className="rounded-lg flex-1 py-2.5">My Listings</TabsTrigger>}
                {user && <TabsTrigger value="applications" className="rounded-lg flex-1 py-2.5">Applications</TabsTrigger>}
              </TabsList>

              <TabsContent value="browse" className="space-y-6 animate-in fade-in-50 duration-500">
                {/* Categories */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <Filter className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${
                        activeCategory === cat 
                          ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                          : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <div className="flex justify-center py-20">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : filteredProjects.length === 0 ? (
                  <div className="text-center py-24 bg-muted/20 rounded-3xl border border-border/50 border-dashed">
                    <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No projects found</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      We couldn't find any projects matching your current filters. Try adjusting your search or category.
                    </p>
                    <Button variant="outline" className="mt-6 rounded-xl" onClick={() => {setSearchQuery(""); setActiveCategory("All");}}>
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence>
                      {filteredProjects.map((project, i) => (
                        <motion.div 
                          key={project.id} 
                          initial={{ opacity: 0, y: 20 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: i * 0.05 }}
                          className="group bg-card rounded-2xl p-6 border border-border/40 hover:border-primary/30 hover:shadow-lg transition-all flex flex-col"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-background">
                                {project.creator_avatar ? 
                                  <img src={project.creator_avatar} alt={project.creator_name} className="w-full h-full object-cover" /> : 
                                  <span className="font-semibold text-muted-foreground">{project.creator_name?.charAt(0)}</span>
                                }
                              </div>
                              <div>
                                <p className="text-sm font-medium leading-none">{project.creator_name}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(project.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="capitalize bg-primary/5 text-primary hover:bg-primary/10 border-none">
                              {project.category}
                            </Badge>
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                              {project.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                              {project.description}
                            </p>
                          </div>

                          <div className="space-y-4 mt-auto">
                            {project.skills_needed && project.skills_needed.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {project.skills_needed.slice(0, 3).map(s => (
                                  <span key={s} className="px-2 py-1 bg-muted rounded-md text-[10px] font-medium text-muted-foreground">
                                    {s}
                                  </span>
                                ))}
                                {project.skills_needed.length > 3 && (
                                  <span className="px-2 py-1 bg-muted rounded-md text-[10px] font-medium text-muted-foreground">
                                    +{project.skills_needed.length - 3}
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 py-3 border-y border-border/40">
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" /> Budget
                                </span>
                                <span className="text-sm font-medium">
                                  {project.budget_max > 0 ? `₹${project.budget_min.toLocaleString()} - ${project.budget_max.toLocaleString()}` : 'Negotiable'}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3 w-3" /> Location
                                </span>
                                <span className="text-sm font-medium truncate">
                                  {project.location || 'Remote'}
                                </span>
                              </div>
                            </div>

                            {/* Apply button - visible to all with clear upgrade CTA for free users */}
                            {user && isPremiumUser() ? (
                              <Button 
                                className="w-full rounded-xl font-medium" 
                                variant={appliedIds.has(project.id) ? "secondary" : "default"}
                                disabled={appliedIds.has(project.id)}
                                onClick={() => { setSelectedProject(project); setApplyOpen(true); }}
                              >
                                {appliedIds.has(project.id) ? "Application Sent ✓" : "Apply to Project"}
                              </Button>
                            ) : (
                              <Button className="w-full rounded-xl font-medium" variant="outline" disabled>
                                Login to Apply
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="my-projects" className="animate-in fade-in-50 duration-500">
                {myProjects.length === 0 ? (
                  <div className="text-center py-24 bg-muted/20 rounded-3xl border border-border/50 border-dashed">
                    <Sparkles className="h-12 w-12 mx-auto text-primary/40 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">You haven't posted anything yet</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                      Looking for talent? Post a project to connect with skilled creators and get your job done.
                    </p>
                    {/* 🔥 UPDATED: Protected with handlePremiumAction */}
                    <Button className="rounded-xl px-8" onClick={() => handlePremiumAction(() => setCreateOpen(true))}>
                      <Plus className="h-4 w-4 mr-2" /> Post Your First Project
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {myProjects.map(project => (
                      <div key={project.id} className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[10px] uppercase">{project.status}</Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {new Date(project.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="font-bold text-lg leading-tight mb-1">{project.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">{project.description}</p>
                        </div>
                        <Button variant="outline" className="rounded-xl shrink-0" onClick={() => {
                          setViewProject(project);
                          fetchProjectApplications(project.id);
                        }}>
                          View Applications <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="applications" className="animate-in fade-in-50 duration-500">
                {myApplications.length === 0 ? (
                  <div className="text-center py-24 bg-muted/20 rounded-3xl border border-border/50 border-dashed">
                    <Send className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No applications yet</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      When you apply for projects, you'll be able to track their status right here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {myApplications.map(app => (
                      <div key={app.id} className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="font-medium text-sm mb-1 line-clamp-2">"{app.message || "I am interested in this role."}"</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> Proposed: ₹{app.proposed_price.toLocaleString()}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(app.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Badge 
                          className="shrink-0 capitalize rounded-lg px-3 py-1"
                          variant={app.status === "accepted" ? "default" : app.status === "rejected" ? "destructive" : "secondary"} 
                        >
                          {app.status === 'pending' ? (
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</span>
                          ) : app.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      {/* --- Modals (Code remains exactly the same below) --- */}
      
      {/* Create Project Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Post a Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-4">
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Project Title</label>
              <Input className="rounded-xl bg-muted/50" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Need a senior React developer for MVP" />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Description</label>
              <Textarea className="rounded-xl bg-muted/50 resize-none" value={description} onChange={e => setDescription(e.target.value)} placeholder="Detail your requirements, timeline, and expectations..." rows={4} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="rounded-xl bg-muted/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter(c => c !== "All").map(cat => (
                      <SelectItem key={cat} value={cat.toLowerCase()}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Location</label>
                <Input className="rounded-xl bg-muted/50" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Remote, Mumbai, etc." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Min Budget (₹)</label>
                <Input className="rounded-xl bg-muted/50" type="number" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Max Budget (₹)</label>
                <Input className="rounded-xl bg-muted/50" type="number" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Deadline (Optional)</label>
                <Input className="rounded-xl bg-muted/50" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Skills Needed</label>
                <Input className="rounded-xl bg-muted/50" value={skillsInput} onChange={e => setSkillsInput(e.target.value)} placeholder="e.g. React, Node, UI/UX (comma separated)" />
              </div>
            </div>
            <Button size="lg" className="w-full rounded-xl mt-2" onClick={handleCreateProject} disabled={submitting}>
              {submitting ? "Posting Project..." : "Publish Project"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Apply Dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle>Apply to Project</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">Applying for: <span className="font-medium text-foreground">{selectedProject?.title}</span></p>
          </DialogHeader>
          <div className="space-y-5 mt-4">
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Cover Message</label>
              <Textarea className="rounded-xl bg-muted/50 resize-none" value={applyMessage} onChange={e => setApplyMessage(e.target.value)} placeholder="Briefly explain why you're a great fit for this project..." rows={4} />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Your Proposed Rate (₹)</label>
              <Input className="rounded-xl bg-muted/50" type="number" value={applyPrice} onChange={e => setApplyPrice(e.target.value)} placeholder="e.g. 15000" />
            </div>
            <Button size="lg" className="w-full rounded-xl" onClick={handleApply} disabled={submitting}>
              {submitting ? "Sending..." : "Submit Application"} <Send className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Applications Dialog */}
      <Dialog open={!!viewProject} onOpenChange={(open) => !open && setViewProject(null)}>
        <DialogContent className="max-w-2xl sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle>Applications Received</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">{viewProject?.title}</p>
          </DialogHeader>
          <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
            {projectApplications.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No applications received yet.</p>
              </div>
            ) : projectApplications.map(app => (
              <div key={app.id} className="p-5 bg-card rounded-xl border border-border/60 shadow-sm transition-all hover:border-primary/20">
                <div className="flex flex-col sm:flex-row gap-4 sm:items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {app.applicant_avatar ? 
                        <img src={app.applicant_avatar} alt="Avatar" className="w-full h-full object-cover" /> : 
                        <Users className="h-5 w-5 text-muted-foreground" />
                      }
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{app.applicant_name}</p>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5 text-primary">
                        Proposed: ₹{app.proposed_price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={app.status === "accepted" ? "default" : app.status === "rejected" ? "destructive" : "secondary"} 
                    className="capitalize shrink-0 self-start"
                  >
                    {app.status}
                  </Badge>
                </div>
                
                <div className="bg-muted/30 p-3 rounded-lg text-sm text-foreground/80 mb-4 border border-border/30">
                  {app.message || <span className="text-muted-foreground italic">No cover message provided.</span>}
                </div>
                
                {app.status === "pending" && (
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" className="rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20" onClick={() => handleApplicationStatus(app.id, "rejected")}>
                      <X className="h-4 w-4 mr-1.5" /> Decline
                    </Button>
                    <Button size="sm" variant="default" className="rounded-lg bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApplicationStatus(app.id, "accepted")}>
                      <Check className="h-4 w-4 mr-1.5" /> Accept Proposal
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
