"use client";

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";

interface PhotoUploaderProps {
  onChange?: (file: File | null) => void;
}

export function PhotoUploader({ onChange }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function handleFile(file: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
    onChange?.(file);
  }

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex flex-1 items-center justify-center gap-2 rounded-module border-2 border-steel bg-ink-softer py-4 font-display text-base tracking-wide text-paper active:scale-[0.98]"
      >
        <Camera className="h-6 w-6" />
        {previewUrl ? "사진 다시 찍기" : "현장 사진 촬영"}
      </button>

      {previewUrl && (
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-module border-2 border-steel">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="촬영된 현장 사진 미리보기" className="h-full w-full object-cover" />
          <button
            type="button"
            aria-label="사진 삭제"
            onClick={() => handleFile(null)}
            className="absolute right-0.5 top-0.5 rounded-full bg-ink/80 p-0.5 text-paper"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
