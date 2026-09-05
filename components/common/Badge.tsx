import { Severity } from "@/lib/types";
import { SEVERITY_COLOR } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SeverityBadge({ severity }: { severity: Severity }) {
  const c = SEVERITY_COLOR[severity];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-module border px-2 py-0.5 text-xs font-semibold font-body"
      style={{
        color: c.text,
        borderColor: c.text,
        backgroundColor: `${c.text}1A`, // 10% alpha
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: c.text }}
      />
      {c.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styleMap: Record<string, string> = {
    미분류: "text-steel-light border-steel-light bg-steel-light/10",
    분석중: "text-safety-yellow border-safety-yellow bg-safety-yellow/10",
    조치완료: "text-safety-green border-safety-green bg-safety-green/10",
  };
  return (
    <span
      className={cn(
        "inline-block rounded-module border px-2 py-0.5 text-xs font-semibold font-body",
        styleMap[status] ?? styleMap["미분류"]
      )}
    >
      {status}
    </span>
  );
}
