"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Plus,
  Search,
  LogOut,
  Settings,
  X,
  MoreVertical,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getNovelsByUser } from "@/lib/actions/novel-actions";
import {
  BookCover,
  BookTitle,
  BookDescription,
  BookIcon,
} from "@/components/book-cover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { NovelWithMeta } from "@/types/novel";

function getGreeting(hour: number, name: string): string {
  if (hour >= 4 && hour < 10) return `Selamat Pagi, ${name} !`;
  if (hour >= 10 && hour < 15) return `Selamat Siang, ${name} !`;
  if (hour >= 15 && hour < 18) return `Selamat Sore, ${name} !`;
  return `Selamat Malam, ${name} !`;
}

function formatRelativeTime(date: Date | null): string {
  if (!date) return "-";
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit yang lalu`;
  if (diffHour < 24) return `${diffHour} jam yang lalu`;
  if (diffDay < 7) return `${diffDay} hari yang lalu`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} minggu yang lalu`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)} bulan yang lalu`;
  return `${Math.floor(diffDay / 365)} tahun yang lalu`;
}



export default function DashboardPage() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [novels, setNovels] = useState<NovelWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  // Detect scroll for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    async function fetchNovels() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getNovelsByUser();
        setNovels(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Gagal memuat daftar novel"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchNovels();
  }, []);

  const greeting = useMemo(() => {
    if (!user?.name) return "";
    const hour = new Date().getHours();
    return getGreeting(hour, user.name);
  }, [user]);

  const filteredNovels = useMemo(() => {
    if (!search.trim()) return novels;
    const q = search.toLowerCase();
    return novels.filter((n) => n.title.toLowerCase().includes(q));
  }, [novels, search]);

  const handleClearSearch = useCallback(() => {
    setSearch("");
  }, []);

  if (authLoading) {
    return (
      <div className="space-y-6 md:space-y-8">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-6 w-64 mx-auto" />
        <div className="flex justify-center gap-3 max-w-lg mx-auto">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 relative">
      {/* Sticky Header Bar (muncul saat scroll) */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-sm shadow-sm border-b"
            : "bg-transparent opacity-0 pointer-events-none"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-3 flex items-center justify-between">
          <span className="font-bold text-sm">Novyl AI</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full transition-transform duration-150 ease-out active:scale-[0.96]"
              onClick={() => router.push("/novel/create")}
              title="Buat Novel Baru"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full transition-transform duration-150 ease-out active:scale-[0.96]">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Top Actions: Settings & Logout Dropdown */}
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-9 w-9 transition-transform duration-150 ease-out active:scale-[0.96]"
              title="Menu"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => { /* Settings placeholder */ }}>
              <Settings className="h-4 w-4 mr-2" />
              Pengaturan
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => signOut()}>
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Header Section - Centered */}
      <div className="text-center space-y-3 md:space-y-4">
        <h1 className="text-xl md:text-2xl font-bold">Novyl AI</h1>
        <p className="text-base md:text-lg text-muted-foreground">{greeting}</p>
      </div>

      {/* Search + Button - Centered */}
      <div className="flex justify-center">
        <div className="flex gap-2 md:gap-3 w-full max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari novel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9 rounded-full border-gray-200"
              aria-label="Cari novel"
            />
            {search && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-[background-color,scale] duration-150 ease-out active:scale-[0.96]"
                aria-label="Hapus pencarian"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <Button
            onClick={() => router.push("/novel/create")}
            className="rounded-full bg-black text-white hover:bg-black/90 px-3 md:px-5 shrink-0 transition-[background-color,scale] duration-150 ease-out active:scale-[0.96]"
            aria-label="Buat Novel Baru"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Novel Baru</span>
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive text-center max-w-lg mx-auto">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 md:gap-x-10 lg:gap-x-12 gap-y-8 md:gap-y-10 lg:gap-y-12 max-w-5xl mx-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center space-y-3">
              <Skeleton className="aspect-[3/4] w-[150px] md:w-[180px] lg:w-[200px]" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredNovels.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center space-y-5">
          <div className="rounded-full bg-muted p-5 md:p-6">
            <BookOpen className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-medium">Belum ada novel</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Mulai tulis novel pertamamu sekarang. AI akan membantu kamu menulis lebih cepat!
            </p>
          </div>
          <Button
            onClick={() => router.push("/novel/create")}
            className="rounded-full bg-black text-white hover:bg-black/90 px-6 h-11 transition-[background-color,scale] duration-150 ease-out active:scale-[0.96]"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Buat Novel Baru
          </Button>
        </div>
      )}

      {/* Content Section - Novel Grid */}
      {!isLoading && !error && filteredNovels.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 md:gap-x-10 lg:gap-x-12 gap-y-8 md:gap-y-10 lg:gap-y-12 max-w-5xl mx-auto py-4">
          {filteredNovels.map((novel) => (
            <div
              key={novel.id}
              className="flex flex-col items-center cursor-pointer group"
              onClick={() => router.push(`/novel/${novel.id}/edit`)}
              role="button"
              tabIndex={0}
              aria-label={`Buka novel ${novel.title}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(`/novel/${novel.id}/edit`);
                }
              }}
            >
              <div className="transition-transform duration-150 ease-out active:scale-[0.96]">
                <BookCover
                  color="neutral"
                  size="sm"
                >
                  <BookIcon className="text-white/70 mb-2" />
                  <BookTitle className="text-sm">{novel.title}</BookTitle>
                  {novel.premise && (
                    <BookDescription className="line-clamp-3">
                      {novel.premise}
                    </BookDescription>
                  )}
                </BookCover>
                {novel.generationStatus && novel.generationStatus !== "idle" && (
                  <div className="mt-2 flex justify-center">
                    {novel.generationStatus === "generating" && (
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Generating
                      </Badge>
                    )}
                    {novel.generationStatus === "completed" && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Selesai
                      </Badge>
                    )}
                    {novel.generationStatus === "failed" && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Gagal
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-2 md:mt-3 text-center space-y-0.5">
                <p className="text-xs text-muted-foreground">
                  Terakhir Diedit
                </p>
                <p className="font-medium text-sm tabular-nums">
                  {novel.updatedAt
                    ? formatRelativeTime(novel.updatedAt)
                    : "—"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
