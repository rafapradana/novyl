import Link from "next/link";

const NOVELS_PATH = "/novels";

/**
 * Minimal app header — logo + brand name centered.
 * Navigation is handled by NavDock at the bottom.
 */
export function AppHeader(): React.JSX.Element {
  return (
    <header className="flex h-14 shrink-0 items-center justify-center px-4">
      <Link
        href={NOVELS_PATH}
        className="flex items-center gap-2 font-semibold text-sm"
      >
        <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <span className="text-xs font-bold">N</span>
        </div>
        Novyl
      </Link>
    </header>
  );
}
