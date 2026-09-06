"use client";

import { MapPin } from "lucide-react";
import { FACTORY_ZONES } from "@/lib/constants";
import { Lang, getDictionary, getZoneLabel } from "@/lib/i18n";

interface LocationSelectProps {
  value: string;
  onChange: (zoneId: string) => void;
  lang: Lang;
}

export function LocationSelect({ value, onChange, lang }: LocationSelectProps) {
  const t = getDictionary(lang);
  return (
    <label className="flex items-center gap-3 rounded-module border-2 border-steel bg-ink-softer px-4 py-3">
      <MapPin className="h-6 w-6 shrink-0 text-safety-yellow" />
      <span className="sr-only">{t.selectZone}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-transparent font-body text-base text-paper outline-none"
      >
        <option value="" disabled className="bg-ink-soft">
          {t.selectZone}
        </option>
        {FACTORY_ZONES.map((zone) => (
          <option key={zone.id} value={zone.id} className="bg-ink-soft">
            {getZoneLabel(lang, zone.id, zone.label)}
          </option>
        ))}
      </select>
    </label>
  );
}
