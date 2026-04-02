"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, Camera, ChevronRight, Zap, Activity, Eye, RotateCw } from "lucide-react";
import NeonButton from "@/components/ui/NeonButton";
import GlassCard from "@/components/ui/GlassCard";

export default function UploadZone({ label, accept = "video/*", onFileSelected, icon: IconComp = Camera }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const inputRef = useRef(null);

  const handleFile = useCallback(
    (selectedFile) => {
      if (!selectedFile) return;
      setFile(selectedFile);
      setRotation(0); // Reset rotation on new file
      onFileSelected?.(selectedFile, 0);

      // Generate thumbnail
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      const url = URL.createObjectURL(selectedFile);
      video.src = url;
      video.onloadeddata = () => {
        video.currentTime = 0.5;
      };
      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0);
        setThumbnail(canvas.toDataURL("image/jpeg", 0.7));
        URL.revokeObjectURL(url);
      };
    },
    [onFileSelected]
  );

  const handleRotate = useCallback(
    (e) => {
      e.stopPropagation();
      const nextRotation = (rotation + 90) % 360;
      setRotation(nextRotation);
      onFileSelected?.(file, nextRotation);
    },
    [rotation, file, onFileSelected]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile && droppedFile.type.startsWith("video/")) {
        handleFile(droppedFile);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      className={`upload-zone p-8 flex flex-col items-center justify-center cursor-pointer min-h-[240px] transition-all ${
        isDragging ? "drag-over" : ""
      } ${file ? "border-neon/40" : ""}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {thumbnail ? (
        // Preview
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="relative w-full max-w-[260px] aspect-video rounded-lg overflow-hidden border border-neon/20 bg-black/40">
            <img
              src={thumbnail}
              alt={`${label} preview`}
              className="w-full h-full object-contain transition-transform duration-300"
              style={{ transform: `rotate(${rotation}deg)` }}
            />
            
            {/* Rotate Button */}
            <button
               onClick={handleRotate}
               className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 border border-white/10 text-white/70 hover:text-white hover:bg-neon/20 transition-all z-20 group"
               title="Rotate View"
            >
              <RotateCw size={14} className="group-active:rotate-90 transition-transform" />
            </button>

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 z-10">
              <p className="text-[10px] text-white/70 truncate">
                {file?.name}
              </p>
            </div>
          </div>
          <p className="text-xs text-neon/60 flex items-center gap-x-3">
            <span className="flex items-center gap-1">
              <Eye size={12} />
              Click to replace
            </span>
            {rotation !== 0 && (
              <span className="text-[10px] bg-neon/10 px-1.5 py-0.5 rounded border border-neon/20 font-bold uppercase tracking-wider">
                Rotated {rotation}°
              </span>
            )}
          </p>
        </div>
      ) : (
        // Upload prompt
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-neon/5 border border-neon/15 flex items-center justify-center">
            <IconComp size={24} className="text-neon/50" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/60 mb-1">{label}</p>
            <p className="text-[11px] text-white/25">
              Drag & drop or click to upload
            </p>
            <p className="text-[10px] text-white/15 mt-1">
              MP4, MOV, WEBM supported
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
