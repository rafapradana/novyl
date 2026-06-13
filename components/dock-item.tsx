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
 * Layout is fixed: icon + label side by side.
 * Only the icon scales via CSS transform (no layout shift).
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
        "flex items-center gap-2 rounded-xl px-2.5 py-2 transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted"
      )}
      aria-label={label}
    >
      <div
        className="flex size-8 shrink-0 items-center justify-center transition-transform duration-150 ease-out origin-bottom"
        style={{ transform: `scale(${scale})` }}
      >
        {children}
      </div>
      <span
        className={cn(
          "text-xs font-medium whitespace-nowrap",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </button>
  );
}
