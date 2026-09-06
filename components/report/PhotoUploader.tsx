"use client";

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { Lang, getDictionary } from "@/lib/i18n";

interface PhotoUploaderProps {
  onChange?: (file: File | null) => void;
  lang: Lang;
}

export function PhotoUploader({ onChange, lang }: PhotoUploaderProps) {
  const t = getDictionary(lang);
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
        {previewUrl ? t.retakePhoto : t.takePhoto}
      </button>

      {previewUrl && (
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-module border-2 border-steel">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            aria-label={t.deletePhoto}
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
