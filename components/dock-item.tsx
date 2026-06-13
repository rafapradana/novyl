"use client";

import { cn } from "@/lib/utils";

interface DockItemProps {
  readonly label: string;
  readonly isActive?: boolean;
  readonly scale: number;
  readonly onClick?: () => void;
  readonly children: React.ReactNode;
}

/**
 * Single item inside NavDock.
 * The whole item (icon + label) scales together via CSS transform.
 * Only the visual representation grows — no layout shift.
 */
export function DockItem({
  label,
  isActive = false,
  scale,
  onClick,
  children,
}: DockItemProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 transition-colors origin-bottom",
        isActive
          ? "text-primary"
          : "text-muted-foreground"
      )}
      style={{ transform: `scale(${scale})` }}
      aria-label={label}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl",
          isActive ? "bg-primary/15" : "bg-muted/80"
        )}
      >
        {children}
      </div>
      <span className="text-[10px] font-medium whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}
