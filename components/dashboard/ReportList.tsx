"use client";

import { NearMissReport } from "@/lib/types";
import { FACTORY_ZONES } from "@/lib/constants";
import { cn, formatRelativeTime } from "@/lib/utils";
import { SeverityBadge, StatusBadge } from "@/components/common/Badge";
import { Camera } from "lucide-react";

interface ReportListProps {
  reports: NearMissReport[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ReportList({ reports, selectedId, onSelect }: ReportListProps) {
  return (
    <ul className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto pr-1">
      {reports.map((r) => {
        const zone = FACTORY_ZONES.find((z) => z.id === r.zoneId);
        const isSelected = r.id === selectedId;
        return (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => onSelect(r.id)}
              className={cn(
                "w-full rounded-module border px-3 py-2.5 text-left transition-colors",
                isSelected
                  ? "border-safety-yellow bg-safety-yellow/10"
                  : "border-steel-hairline bg-ink-softer hover:border-steel"
              )}
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="font-body text-xs text-steel-light">{r.id}</span>
                <span className="font-body text-xs text-steel-light">
                  {formatRelativeTime(r.createdAt)}
                </span>
              </div>
              <p className="mb-2 line-clamp-2 font-body text-sm text-paper">
                {r.transcript}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <SeverityBadge severity={r.severity} />
                <StatusBadge status={r.status} />
                <span className="font-body text-xs text-steel-light">{zone?.label}</span>
                {r.photoAttached && <Camera className="h-3.5 w-3.5 text-steel-light" />}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
