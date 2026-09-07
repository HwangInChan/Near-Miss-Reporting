import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PanelCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** true면 카드가 이웃 카드보다 커져도(그리드 stretch) 내용을 세로 중앙에 배치한다.
   *  콘텐츠 높이가 짧은 위젯(도넛 차트 등)에서 아래쪽에 빈 여백이 남는 걸 막는다. */
  centerContent?: boolean;
  /** true면 본문을 세로 flex 컨테이너로 만든다.
   *  자식이 flex-1로 남는 높이를 채우거나 스크롤 영역을 만들 때 필요하다.
   *  min-h-0을 함께 주어야 자식이 축소될 수 있어 스크롤이 실제로 동작한다. */
  fillBody?: boolean;
}

/**
 * 대시보드 전역에서 쓰는 카드 컨테이너.
 * 둥근 SaaS 카드 대신 각진 모서리 + 상단 라벨 바 형태로
 * "제어반 모듈"의 느낌을 준다.
 */
export function PanelCard({ title, subtitle, action, children, className, centerContent, fillBody }: PanelCardProps) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-module border border-steel-hairline bg-ink-soft",
        className
      )}
    >
      <header className="flex items-center justify-between border-b border-steel-hairline px-4 py-2.5">
        <div>
          <h2 className="font-display text-base tracking-wide text-paper">{title}</h2>
          {subtitle && (
            <p className="font-body text-[11px] leading-snug text-steel-light">{subtitle}</p>
          )}
        </div>
        {action}
      </header>
      <div
        className={cn(
          "flex-1 p-3.5",
          centerContent && "flex flex-col justify-center",
          fillBody && "flex min-h-0 flex-col"
        )}
      >
        {children}
      </div>
    </section>
  );
}
