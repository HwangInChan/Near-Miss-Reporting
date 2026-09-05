"use client";

import { MapPin } from "lucide-react";
import { FACTORY_ZONES } from "@/lib/constants";

interface LocationSelectProps {
  value: string;
  onChange: (zoneId: string) => void;
}

export function LocationSelect({ value, onChange }: LocationSelectProps) {
  return (
    <label className="flex items-center gap-3 rounded-module border-2 border-steel bg-ink-softer px-4 py-3">
      <MapPin className="h-6 w-6 shrink-0 text-safety-yellow" />
      <span className="sr-only">현재 위치(구역) 선택</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-transparent font-body text-base text-paper outline-none"
      >
        <option value="" disabled className="bg-ink-soft">
          지금 계신 구역을 선택하세요
        </option>
        {FACTORY_ZONES.map((zone) => (
          <option key={zone.id} value={zone.id} className="bg-ink-soft">
            {zone.label}
          </option>
        ))}
      </select>
    </label>
  );
}
