import { useState, useRef } from "react";
import { Camera, Upload, X, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as tf from '@tensorflow/tfjs';
import * as nsfwjs from 'nsfwjs';

interface ImageUploadProps {
  currentUrl?: string | null;
  userId: string;
  folder: string; // "avatars", "covers", "portfolio"
  onUpload: (url: string) => void;
  className?: string;
  variant?: "avatar" | "cover" | "portfolio";
}

export function ImageUpload({ currentUrl, userId, folder, onUpload, className, variant = "avatar" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false); // Tracks AI scanning state
  const inputRef = useRef<HTMLInputElement>(null);

  // --- 🛡️ THE AI MODERATION FUNCTION ---
  const isImageSafe = async (file: File): Promise<boolean> => {
    setAnalyzing(true);
    try {
      // 1. Load the AI Model
      const model = await nsfwjs.load();

      // 2. Convert File to HTML Image Element for the AI
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // 3. Classify the image
      const predictions = await model.classify(img);
      
      // 4. Block if Porn, Hentai, or excessively Sexy probability is > 60%
      const isUnsafe = predictions.some(
        (p) => (p.className === 'Porn' || p.className === 'Hentai' || p.className === 'Sexy') && p.probability > 0.60
      );

      return !isUnsafe;

    } catch (error) {
      console.error("NSFW checking error:", error);
      // If AI fails to load (e.g. browser adblocker), we fail "open" so legitimate users aren't stuck
      return true; 
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    // --- 🚨 RUN THE AI CHECK ---
    const isSafe = await isImageSafe(file);
    if (!isSafe) {
      toast.error("Upload Blocked", {
        description: "Our automated systems detected inappropriate content. Please upload a different image.",
        icon: <ShieldAlert className="text-red-500" />
      });
      // Clear input so they can try again
      if (inputRef.current) inputRef.current.value = '';
      return; 
    }

    // --- PROCEED TO SUPABASE UPLOAD ---
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${userId}/${folder}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("uploads").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("uploads").getPublicUrl(path);
    onUpload(publicUrl);
    toast.success("Image uploaded!");
    setUploading(false);
    
    // Clear input
    if (inputRef.current) inputRef.current.value = '';
  };

  const isProcessing = uploading || analyzing;

  if (variant === "avatar") {
    return (
      <div className={`relative group ${className}`}>
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary overflow-hidden">
          {currentUrl ? (
            <img src={currentUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <Camera className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isProcessing}
          className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          {isProcessing ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Camera className="h-5 w-5 text-white" />}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={isProcessing} />
      </div>
    );
  }

  if (variant === "cover") {
    return (
      <div className={`relative group rounded-2xl overflow-hidden bg-muted h-40 ${className}`}>
        {currentUrl ? (
          <img src={currentUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Upload className="h-8 w-8" />
          </div>
        )}
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isProcessing}
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          {isProcessing ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Camera className="h-5 w-5 text-white" />}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={isProcessing} />
      </div>
    );
  }

  // portfolio
  return (
    <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={isProcessing}>
      {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
      {analyzing ? "Scanning..." : uploading ? "Uploading..." : "Upload Image"}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={isProcessing} />
    </Button>
  );
}
