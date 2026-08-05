import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, Type, LayoutGrid, PlaySquare, Code, Settings, Edit3, X, Loader2, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Editor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projectTitle, setProjectTitle] = useState('');
  const [contentBlocks, setContentBlocks] = useState([]);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Separate refs for different file types
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const gridInputRef = useRef(null);

  // Add block and trigger respective file pickers
  const addBlock = (type) => {
    if (type === 'image') imageInputRef.current.click();
    else if (type === 'video') videoInputRef.current.click();
    else if (type === 'grid') gridInputRef.current.click();
    else setContentBlocks([...contentBlocks, { id: Date.now().toString(), type, content: '' }]);
  };

  // Handle single Image & Video selection
  const handleMediaSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setContentBlocks([
      ...contentBlocks, 
      { id: Date.now().toString(), type, file, content: previewUrl }
    ]);
    e.target.value = null; 
  };

  // Handle multi-image Grid selection
  const handleGridSelect = (e: any) => {
    const files: File[] = Array.from(e.target.files);
    if (files.length === 0) return;

    const previewUrls = files.map((f: File) => URL.createObjectURL(f));
    setContentBlocks([
      ...contentBlocks, 
      { id: Date.now().toString(), type: 'grid', files, content: previewUrls }
    ]);
    e.target.value = null;
  };

  // Update text
  const updateBlockContent = (id, newContent) => {
    setContentBlocks(blocks => 
      blocks.map(block => block.id === id ? { ...block, content: newContent } : block)
    );
  };

  // Remove block
  const removeBlock = (id) => {
    setContentBlocks(blocks => blocks.filter(block => block.id !== id));
  };

  // Auto-resize textarea
  const handleInputResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = (e.target.scrollHeight) + 'px';
  };

  // Helper to upload a single file to Supabase
  const uploadFile = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('project_media')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('project_media')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  // Save everything to Supabase
  const handlePublish = async () => {
    if (!user) return toast.error("You must be logged in to publish.");
    if (contentBlocks.length === 0) return toast.error("Add some content before publishing!");
    if (!projectTitle.trim()) return toast.error("Please give your project a title.");

    setIsPublishing(true);
    toast.loading("Uploading media and publishing...", { id: "publish" });

    try {
      const processedBlocks = await Promise.all(contentBlocks.map(async (block) => {
        // Handle Single Image or Video
        if ((block.type === 'image' || block.type === 'video') && block.file) {
          const publicUrl = await uploadFile(block.file);
          return { id: block.id, type: block.type, content: publicUrl };
        }
        // Handle Multi-Image Grid
        if (block.type === 'grid' && block.files) {
          const publicUrls = await Promise.all(block.files.map(file => uploadFile(file)));
          return { id: block.id, type: block.type, content: publicUrls };
        }
        // Return text/embeds as-is
        return block; 
      }));

      const { error: dbError } = await (supabase.from('projects' as any).insert({
        creator_id: user.id,
        title: projectTitle,
        content_blocks: processedBlocks,
        published: true 
      } as any) as any);

      if (dbError) throw dbError;

      toast.success("Project published successfully!", { id: "publish" });
      navigate('/'); 

    } catch (error) {
      console.error("Publish error:", error);
      toast.error("Failed to publish project.", { id: "publish" });
    } finally {
      setIsPublishing(false);
    }
  };

  const ToolButton = ({ icon: Icon, label, onClick }) => (
    <div className="flex flex-col items-center gap-3 cursor-pointer group" onClick={onClick}>
      <div className="w-20 h-20 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 group-hover:border-blue-500 group-hover:text-blue-600 group-hover:shadow-md transition-all">
        <Icon size={28} strokeWidth={1.5} />
      </div>
      <span className="text-sm font-bold text-gray-700">{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col font-sans">
      
      {/* Top Navigation Bar */}
      <div className="h-[72px] bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4 w-1/2">
          <input 
            type="text" 
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="text-xl font-bold text-gray-900 border-none focus:ring-0 p-0 bg-transparent w-full placeholder-gray-300"
            placeholder="Give your project a title..."
          />
        </div>
        <div className="flex items-center gap-4">
          <button className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Save Draft</button>
          <button 
            onClick={handlePublish}
            disabled={isPublishing}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 px-8 rounded-full transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
          >
            {isPublishing && <Loader2 size={16} className="animate-spin" />}
            {isPublishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* MAIN CANVAS AREA */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center p-8 scroll-smooth">
          
          {/* Hidden File Inputs */}
          <input type="file" ref={imageInputRef} onChange={(e) => handleMediaSelect(e, 'image')} accept="image/*" className="hidden" />
          <input type="file" ref={videoInputRef} onChange={(e) => handleMediaSelect(e, 'video')} accept="video/*" className="hidden" />
          <input type="file" ref={gridInputRef} onChange={handleGridSelect} accept="image/*" multiple className="hidden" />

          {contentBlocks.length === 0 ? (
            <div className="text-center w-full max-w-4xl mt-32 animate-in fade-in zoom-in duration-500">
              <h1 className="text-3xl text-gray-400 font-medium mb-12">Start building your project</h1>
              <div className="flex justify-center gap-6 flex-wrap">
                <ToolButton icon={Image} label="Image" onClick={() => addBlock('image')} />
                <ToolButton icon={Type} label="Text" onClick={() => addBlock('text')} />
                <ToolButton icon={LayoutGrid} label="Photo Grid" onClick={() => addBlock('grid')} />
                <ToolButton icon={PlaySquare} label="Video" onClick={() => addBlock('video')} />
              </div>
            </div>
          ) : (
            <div className="w-full max-w-5xl bg-white shadow-sm border border-gray-100 min-h-[600px] mt-4 mb-32 rounded-xl relative pb-8">
              {contentBlocks.map((block) => (
                 <div key={block.id} className="relative group border-2 border-transparent hover:border-blue-100 transition-colors m-4 rounded-lg">
                   
                   {/* Hover Controls */}
                   <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <div className="p-2 text-gray-300 cursor-grab hover:text-gray-500"><GripVertical size={20} /></div>
                   </div>
                   <button 
                     onClick={() => removeBlock(block.id)}
                     className="absolute -right-4 -top-4 p-2 bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md z-10 border border-gray-100"
                   >
                     <X size={16} />
                   </button>

                   {/* Render TEXT Block */}
                   {block.type === 'text' && (
                     <textarea 
                        value={block.content}
                        onChange={(e) => updateBlockContent(block.id, e.target.value)}
                        onInput={handleInputResize}
                        placeholder="Start typing..."
                        className="w-full min-h-[120px] p-8 text-xl text-gray-800 border-none focus:ring-0 resize-none overflow-hidden placeholder-gray-300 font-serif leading-relaxed"
                     />
                   )}

                   {/* Render IMAGE Block */}
                   {block.type === 'image' && (
                     <div className="w-full p-2 flex justify-center bg-gray-50 rounded-lg">
                       <img src={block.content} alt="Block" className="max-w-full h-auto max-h-[800px] object-contain rounded" />
                     </div>
                   )}

                   {/* Render VIDEO Block */}
                   {block.type === 'video' && (
                     <div className="w-full p-2 flex justify-center bg-gray-900 rounded-lg">
                       <video src={block.content} controls className="max-w-full h-auto max-h-[800px] rounded outline-none" />
                     </div>
                   )}

                   {/* Render GRID Block */}
                   {block.type === 'grid' && (
                     <div className="w-full p-2 bg-white">
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                         {block.content.map((url, i) => (
                           <div key={i} className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                             <img src={url} alt={`Grid ${i}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
              ))}

              {/* Quick Add Bottom Bar */}
              <div className="flex justify-center gap-3 pt-8 mt-8 border-t border-dashed border-gray-200 w-3/4 mx-auto">
                <button onClick={() => addBlock('image')} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"><Image size={18} /> Image</button>
                <button onClick={() => addBlock('text')} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"><Type size={18} /> Text</button>
                <button onClick={() => addBlock('grid')} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"><LayoutGrid size={18} /> Grid</button>
                <button onClick={() => addBlock('video')} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"><PlaySquare size={18} /> Video</button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR - Behance Style */}
        <div className="w-[280px] bg-white border-l border-gray-200 flex flex-col shadow-sm shrink-0">
          <div className="p-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Insert Element</h3>
            <div className="flex flex-col gap-2">
              <button onClick={() => addBlock('image')} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg text-gray-700 hover:text-blue-600 transition-colors font-semibold text-sm border border-transparent hover:border-gray-100">
                <Image size={20} /> Add Image
              </button>
              <button onClick={() => addBlock('text')} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg text-gray-700 hover:text-blue-600 transition-colors font-semibold text-sm border border-transparent hover:border-gray-100">
                <Type size={20} /> Add Text
              </button>
              <button onClick={() => addBlock('grid')} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg text-gray-700 hover:text-blue-600 transition-colors font-semibold text-sm border border-transparent hover:border-gray-100">
                <LayoutGrid size={20} /> Photo Grid
              </button>
              <button onClick={() => addBlock('video')} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg text-gray-700 hover:text-blue-600 transition-colors font-semibold text-sm border border-transparent hover:border-gray-100">
                <PlaySquare size={20} /> Video / Audio
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Project Settings</h3>
               <button className="w-full flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg text-gray-700 transition-colors font-semibold text-sm border border-gray-200 mb-2">
                 Styles <Edit3 size={16} className="text-gray-400"/>
               </button>
               <button className="w-full flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg text-gray-700 transition-colors font-semibold text-sm border border-gray-200">
                 Settings <Settings size={16} className="text-gray-400"/>
               </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
