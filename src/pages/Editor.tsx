import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Image,
  Type,
  LayoutGrid,
  PlaySquare,
  Settings as SettingsIcon,
  Edit3,
  Palette,
  X,
  Loader2,
  GripVertical,
  Save,
  Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type ContentBlock = {
  id: string;
  type: "image" | "video" | "grid" | "text";
  content: any;
  file?: File;
  files?: File[];
};

type ProjectSettings = {
  backgroundColor: string;
  textColor: string;
  fontFamily: "sans" | "serif" | "mono";
  contentWidth: "narrow" | "wide";
  showTitle: boolean;
};

const DEFAULT_SETTINGS: ProjectSettings = {
  backgroundColor: "#ffffff",
  textColor: "#111827",
  fontFamily: "sans",
  contentWidth: "wide",
  showTitle: true,
};

const fontFamilyMap: Record<ProjectSettings["fontFamily"], string> = {
  sans: "ui-sans-serif, system-ui, sans-serif",
  serif: "Georgia, Cambria, serif",
  mono: "ui-monospace, SFMono-Regular, monospace",
};

export default function Editor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");

  const [projectTitle, setProjectTitle] = useState("");
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>(DEFAULT_SETTINGS);
  const [isPublished, setIsPublished] = useState(false);
  const [activePanel, setActivePanel] = useState<"styles" | "settings" | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const gridInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || !projectId) {
      if (!projectId) {
        setProjectTitle("");
        setContentBlocks([]);
        setProjectSettings(DEFAULT_SETTINGS);
        setIsPublished(false);
      }
      return;
    }

    let cancelled = false;

    const loadProject = async () => {
      setIsLoadingProject(true);
      const { data, error } = await (supabase
        .from("projects" as any)
        .select("*")
        .eq("id", projectId)
        .eq("creator_id", user.id)
        .maybeSingle() as any);

      if (cancelled) return;

      if (error || !data) {
        toast.error("Project could not be loaded", {
          description: "This project may not exist or belong to your account.",
        });
        navigate("/dashboard");
        return;
      }

      setProjectTitle(data.title || "");
      setContentBlocks(
        Array.isArray(data.content_blocks)
          ? data.content_blocks.map((block: ContentBlock) => ({ ...block }))
          : [],
      );
      setProjectSettings({
        ...DEFAULT_SETTINGS,
        ...(data.settings || {}),
      });
      setIsPublished(Boolean(data.published));
      setIsLoadingProject(false);
    };

    loadProject();

    return () => {
      cancelled = true;
    };
  }, [user, projectId, navigate]);

  const addBlock = (type: ContentBlock["type"]) => {
    if (type === "image") imageInputRef.current?.click();
    else if (type === "video") videoInputRef.current?.click();
    else if (type === "grid") gridInputRef.current?.click();
    else {
      setContentBlocks((blocks) => [
        ...blocks,
        { id: Date.now().toString(), type, content: "" },
      ]);
    }
  };

  const handleMediaSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video",
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setContentBlocks((blocks) => [
      ...blocks,
      { id: Date.now().toString(), type, file, content: previewUrl },
    ]);
    event.target.value = "";
  };

  const handleGridSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const previewUrls = files.map((file) => URL.createObjectURL(file));
    setContentBlocks((blocks) => [
      ...blocks,
      { id: Date.now().toString(), type: "grid", files, content: previewUrls },
    ]);
    event.target.value = "";
  };

  const updateBlockContent = (id: string, newContent: string) => {
    setContentBlocks((blocks) =>
      blocks.map((block) =>
        block.id === id ? { ...block, content: newContent } : block,
      ),
    );
  };

  const removeBlock = (id: string) => {
    setContentBlocks((blocks) => blocks.filter((block) => block.id !== id));
  };

  const uploadFile = async (file: File) => {
    if (!user) throw new Error("You must be logged in to upload media.");

    const fileExt =
      file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const fileName =
      Date.now() + "-" + Math.random().toString(36).slice(2) + "." + fileExt;
    const filePath = user.id + "/" + fileName;

    const { error: uploadError } = await supabase.storage
      .from("project_media")
      .upload(filePath, file, {
        cacheControl: "3600",
        contentType: file.type || undefined,
        upsert: false,
      });

    if (uploadError) {
      throw new Error("Media upload failed: " + uploadError.message);
    }

    const { data } = supabase.storage
      .from("project_media")
      .getPublicUrl(filePath);

    if (!data.publicUrl) {
      throw new Error("Media URL could not be created.");
    }

    return { filePath, publicUrl: data.publicUrl };
  };

  const saveProject = async (published: boolean) => {
    if (!user) {
      toast.error("You must be logged in to save a project.");
      return;
    }

    if (!projectTitle.trim()) {
      toast.error("Please give your project a title.");
      return;
    }

    if (published && contentBlocks.length === 0) {
      toast.error("Add some content before publishing.");
      return;
    }

    setIsSaving(true);
    const toastId = "project-save";
    toast.loading(published ? "Publishing project..." : "Saving draft...", {
      id: toastId,
    });
    const uploadedPaths: string[] = [];

    try {
      const processedBlocks = await Promise.all(
        contentBlocks.map(async (block) => {
          if (
            (block.type === "image" || block.type === "video") &&
            block.file
          ) {
            const uploaded = await uploadFile(block.file);
            uploadedPaths.push(uploaded.filePath);
            return {
              id: block.id,
              type: block.type,
              content: uploaded.publicUrl,
            };
          }

          if (block.type === "grid" && block.files) {
            const uploadedGrid = await Promise.all(
              block.files.map(async (file) => {
                const uploaded = await uploadFile(file);
                uploadedPaths.push(uploaded.filePath);
                return uploaded.publicUrl;
              }),
            );
            return {
              id: block.id,
              type: block.type,
              content: uploadedGrid,
            };
          }

          return {
            id: block.id,
            type: block.type,
            content: block.content,
          };
        }),
      );

      const projectPayload = {
        title: projectTitle.trim(),
        content_blocks: processedBlocks,
        settings: projectSettings,
        published,
      };

      let savedProject: any = null;
      let dbError: any = null;

      if (projectId) {
        const result = await (supabase
          .from("projects" as any)
          .update(projectPayload)
          .eq("id", projectId)
          .eq("creator_id", user.id)
          .select("id")
          .maybeSingle() as any);
        savedProject = result.data;
        dbError = result.error;
      } else {
        const result = await (supabase
          .from("projects" as any)
          .insert({
            ...projectPayload,
            creator_id: user.id,
          })
          .select("id")
          .single() as any);
        savedProject = result.data;
        dbError = result.error;
      }

      if (dbError) throw dbError;
      if (!savedProject) {
        throw new Error("Project was not found or could not be updated.");
      }

      setIsPublished(published);
      toast.success(
        projectId
          ? published
            ? "Project updated and published."
            : "Project draft updated."
          : published
            ? "Project published successfully."
            : "Project draft saved.",
        { id: toastId },
      );
      navigate("/dashboard");
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("project_media").remove(uploadedPaths);
      }

      const errorMessage =
        error instanceof Error ? error.message : "Unknown save error";
      console.error("Project save error:", error);
      const isPermissionError = /permission|row-level security|not authorized/i.test(
        errorMessage,
      );
      toast.error(
        isPermissionError
          ? "Upload permission denied. Please log in again and retry."
          : "Failed to save project: " + errorMessage,
        { id: toastId },
      );
    } finally {
      setIsSaving(false);
    }
  };

  const updateSettings = (changes: Partial<ProjectSettings>) => {
    setProjectSettings((settings) => ({ ...settings, ...changes }));
  };

  const ToolButton = ({
    icon: Icon,
    label,
    onClick,
  }: {
    icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
    label: string;
    onClick: () => void;
  }) => (
    <button
      type="button"
      className="flex flex-col items-center gap-3 cursor-pointer group"
      onClick={onClick}
    >
      <div className="w-20 h-20 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 group-hover:border-blue-500 group-hover:text-blue-600 group-hover:shadow-md transition-all">
        <Icon size={28} strokeWidth={1.5} />
      </div>
      <span className="text-sm font-bold text-gray-700">{label}</span>
    </button>
  );

  const canvasWidth = projectSettings.contentWidth === "narrow" ? "780px" : "1100px";

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col font-sans">
      <div className="h-[72px] bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4 w-1/2">
          <input
            type="text"
            value={projectTitle}
            onChange={(event) => setProjectTitle(event.target.value)}
            className="text-xl font-bold text-gray-900 border-none focus:ring-0 p-0 bg-transparent w-full placeholder-gray-300"
            placeholder="Give your project a title..."
            disabled={isLoadingProject}
          />
          {projectId && (
            <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">
              {isPublished ? "Published" : "Draft"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => saveProject(false)}
            disabled={isSaving || isLoadingProject}
            className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save size={15} /> Save Draft
          </button>
          <button
            type="button"
            onClick={() => saveProject(true)}
            disabled={isSaving || isLoadingProject}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 px-8 rounded-full transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving ? "Saving..." : projectId && isPublished ? "Update & Publish" : "Publish"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto flex flex-col items-center p-8 scroll-smooth">
          {isLoadingProject && (
            <div className="fixed inset-0 z-30 bg-white/70 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
          )}

          <input
            type="file"
            ref={imageInputRef}
            onChange={(event) => handleMediaSelect(event, "image")}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={videoInputRef}
            onChange={(event) => handleMediaSelect(event, "video")}
            accept="video/*"
            className="hidden"
          />
          <input
            type="file"
            ref={gridInputRef}
            onChange={handleGridSelect}
            accept="image/*"
            multiple
            className="hidden"
          />

          {contentBlocks.length === 0 ? (
            <div className="text-center w-full max-w-4xl mt-32 animate-in fade-in zoom-in duration-500">
              <h1 className="text-3xl text-gray-400 font-medium mb-12">
                Start building your project
              </h1>
              <div className="flex justify-center gap-6 flex-wrap">
                <ToolButton icon={Image} label="Image" onClick={() => addBlock("image")} />
                <ToolButton icon={Type} label="Text" onClick={() => addBlock("text")} />
                <ToolButton icon={LayoutGrid} label="Photo Grid" onClick={() => addBlock("grid")} />
                <ToolButton icon={PlaySquare} label="Video" onClick={() => addBlock("video")} />
              </div>
            </div>
          ) : (
            <div
              className="w-full shadow-sm border border-gray-100 min-h-[600px] mt-4 mb-32 rounded-xl relative pb-8 transition-colors"
              style={{
                maxWidth: canvasWidth,
                backgroundColor: projectSettings.backgroundColor,
                color: projectSettings.textColor,
                fontFamily: fontFamilyMap[projectSettings.fontFamily],
              }}
            >
              {projectSettings.showTitle && (
                <h1
                  className="text-3xl font-bold px-8 pt-8 pb-2"
                  style={{ color: projectSettings.textColor }}
                >
                  {projectTitle || "Untitled project"}
                </h1>
              )}

              {contentBlocks.map((block) => (
                <div
                  key={block.id}
                  className="relative group border-2 border-transparent hover:border-blue-100 transition-colors m-4 rounded-lg"
                >
                  <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <div className="p-2 text-gray-300 cursor-grab hover:text-gray-500">
                      <GripVertical size={20} />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBlock(block.id)}
                    className="absolute -right-4 -top-4 p-2 bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md z-10 border border-gray-100"
                  >
                    <X size={16} />
                  </button>

                  {block.type === "text" && (
                    <textarea
                      value={block.content || ""}
                      onChange={(event) =>
                        updateBlockContent(block.id, event.target.value)
                      }
                      placeholder="Start typing..."
                      className="w-full min-h-[120px] p-8 text-xl border-none focus:ring-0 resize-none overflow-hidden bg-transparent leading-relaxed"
                      style={{
                        color: projectSettings.textColor,
                        fontFamily: fontFamilyMap[projectSettings.fontFamily],
                      }}
                    />
                  )}

                  {block.type === "image" && (
                    <div className="w-full p-2 flex justify-center bg-black/5 rounded-lg">
                      <img
                        src={block.content}
                        alt="Project block"
                        className="max-w-full h-auto max-h-[800px] object-contain rounded"
                      />
                    </div>
                  )}

                  {block.type === "video" && (
                    <div className="w-full p-2 flex justify-center bg-black/80 rounded-lg">
                      <video
                        src={block.content}
                        controls
                        className="max-w-full h-auto max-h-[800px] rounded outline-none"
                      />
                    </div>
                  )}

                  {block.type === "grid" && (
                    <div className="w-full p-2">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {(Array.isArray(block.content) ? block.content : []).map(
                          (url: string, index: number) => (
                            <div
                              key={index}
                              className="aspect-square bg-black/5 rounded-lg overflow-hidden border border-black/10 shadow-sm"
                            >
                              <img
                                src={url}
                                alt={"Grid " + index}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="flex justify-center gap-3 pt-8 mt-8 border-t border-dashed border-black/10 w-3/4 mx-auto">
                <button
                  type="button"
                  onClick={() => addBlock("image")}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                >
                  <Image size={18} /> Image
                </button>
                <button
                  type="button"
                  onClick={() => addBlock("text")}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                >
                  <Type size={18} /> Text
                </button>
                <button
                  type="button"
                  onClick={() => addBlock("grid")}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                >
                  <LayoutGrid size={18} /> Grid
                </button>
                <button
                  type="button"
                  onClick={() => addBlock("video")}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                >
                  <PlaySquare size={18} /> Video
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-[320px] bg-white border-l border-gray-200 flex flex-col shadow-sm shrink-0 overflow-y-auto">
          <div className="p-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
              Insert Element
            </h3>
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => addBlock("image")} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg text-gray-700 hover:text-blue-600 transition-colors font-semibold text-sm border border-transparent hover:border-gray-100">
                <Image size={20} /> Add Image
              </button>
              <button type="button" onClick={() => addBlock("text")} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg text-gray-700 hover:text-blue-600 transition-colors font-semibold text-sm border border-transparent hover:border-gray-100">
                <Type size={20} /> Add Text
              </button>
              <button type="button" onClick={() => addBlock("grid")} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg text-gray-700 hover:text-blue-600 transition-colors font-semibold text-sm border border-transparent hover:border-gray-100">
                <LayoutGrid size={20} /> Photo Grid
              </button>
              <button type="button" onClick={() => addBlock("video")} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg text-gray-700 hover:text-blue-600 transition-colors font-semibold text-sm border border-transparent hover:border-gray-100">
                <PlaySquare size={20} /> Video / Audio
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
                Project Settings
              </h3>
              <button type="button" onClick={() => setActivePanel(activePanel === "styles" ? null : "styles")} className={"w-full flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg text-gray-700 transition-colors font-semibold text-sm border mb-2 " + (activePanel === "styles" ? "border-blue-500 bg-blue-50" : "border-gray-200")}>
                <span className="flex items-center gap-2"><Palette size={16} /> Styles</span>
                <Edit3 size={16} className="text-gray-400" />
              </button>
              <button type="button" onClick={() => setActivePanel(activePanel === "settings" ? null : "settings")} className={"w-full flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg text-gray-700 transition-colors font-semibold text-sm border " + (activePanel === "settings" ? "border-blue-500 bg-blue-50" : "border-gray-200")}>
                <span className="flex items-center gap-2"><SettingsIcon size={16} /> Settings</span>
                <SettingsIcon size={16} className="text-gray-400" />
              </button>

              {activePanel === "styles" && (
                <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-2">Background color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={projectSettings.backgroundColor} onChange={(event) => updateSettings({ backgroundColor: event.target.value })} className="h-9 w-12 cursor-pointer rounded" />
                      <span className="text-xs text-gray-500">{projectSettings.backgroundColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-2">Text color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={projectSettings.textColor} onChange={(event) => updateSettings({ textColor: event.target.value })} className="h-9 w-12 cursor-pointer rounded" />
                      <span className="text-xs text-gray-500">{projectSettings.textColor}</span>
                    </div>
                  </div>
                  <label className="text-xs font-bold text-gray-500 block">
                    Font
                    <select value={projectSettings.fontFamily} onChange={(event) => updateSettings({ fontFamily: event.target.value as ProjectSettings["fontFamily"] })} className="mt-2 w-full rounded-lg border border-gray-200 bg-white p-2 text-sm font-normal">
                      <option value="sans">Modern Sans</option>
                      <option value="serif">Editorial Serif</option>
                      <option value="mono">Mono</option>
                    </select>
                  </label>
                  <label className="text-xs font-bold text-gray-500 block">
                    Content width
                    <select value={projectSettings.contentWidth} onChange={(event) => updateSettings({ contentWidth: event.target.value as ProjectSettings["contentWidth"] })} className="mt-2 w-full rounded-lg border border-gray-200 bg-white p-2 text-sm font-normal">
                      <option value="wide">Wide</option>
                      <option value="narrow">Narrow</option>
                    </select>
                  </label>
                </div>
              )}

              {activePanel === "settings" && (
                <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-4">
                  <label className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                    <input type="checkbox" checked={projectSettings.showTitle} onChange={(event) => updateSettings({ showTitle: event.target.checked })} />
                    Show project title on canvas
                  </label>
                  <div className="text-xs text-gray-500 leading-relaxed">
                    Save Draft keeps the project private. Publish makes it visible on your public creator profile.
                  </div>
                  <button type="button" onClick={() => navigate("/dashboard")} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">
                    <Eye size={15} className="inline mr-2" /> Back to dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
