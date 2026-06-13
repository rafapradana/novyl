"use client";

import { cn } from "@/lib/utils";

interface DockItemProps {
  readonly label: string;
  readonly isActive?: boolean;
  readonly onClick?: () => void;
  readonly children: React.ReactNode;
}

/**
 * Single item inside NavDock.
 * Icon + label side by side, both inside one container.
 */
export function DockItem({
  label,
  isActive = false,
  onClick,
  children,
}: DockItemProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-xl px-3 py-2 transition-colors",
        isActive
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-muted"
      )}
      aria-label={label}
    >
      <div className="flex size-6 shrink-0 items-center justify-center">
        {children}
      </div>
      <span className="text-xs font-medium whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}
