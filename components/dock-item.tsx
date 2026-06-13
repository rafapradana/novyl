"use client";

import { cn } from "@/lib/utils";

const BASE_SIZE = 48;
const MAX_SCALE = 1.6;

interface DockItemProps {
  readonly label: string;
  readonly isActive?: boolean;
  readonly scale: number;
  readonly onClick?: () => void;
  readonly children: React.ReactNode;
}

/**
 * Single item inside NavDock.
 * `scale` is controlled by the parent dock's mouse proximity calculation.
 */
export function DockItem({
  label,
  isActive = false,
  scale,
  onClick,
  children,
}: DockItemProps): React.JSX.Element {
  const size = BASE_SIZE * scale;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col items-center gap-1.5"
      aria-label={label}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl bg-muted/80 transition-all duration-150 ease-out",
          isActive && "bg-primary/15 ring-2 ring-primary/30"
        )}
        style={{ width: size, height: size }}
      >
        {children}
      </div>
      <span
        className={cn(
          "text-[10px] font-medium text-muted-foreground transition-all duration-150",
          isActive && "text-primary",
          scale > 1.1 && "opacity-100",
          scale <= 1.1 && "opacity-0"
        )}
      >
        {label}
      </span>
    </button>
  );
}
