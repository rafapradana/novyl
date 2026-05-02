"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Layers, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-full bg-white">
        <div className="animate-pulse text-sm text-muted-foreground">Memuat...</div>
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="flex flex-col min-h-full bg-white text-black">
      <main className="flex flex-col flex-1">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center px-6 py-24 sm:py-32 md:py-40">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-tight"
            >
              Write Bestselling Novels Faster with AI
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-6 text-lg sm:text-xl text-zinc-600 leading-relaxed max-w-2xl mx-auto"
            >
              Platform ghostwriter AI untuk menulis novel berkualitas bestseller
              dengan lebih cepat dan terstruktur.
            </motion.p>

            <motion.div variants={itemVariants} className="mt-10">
              <Link href="/register">
                <Button
                  size="lg"
                  className="rounded-full px-8 py-6 text-base font-medium bg-black text-white hover:bg-zinc-800 transition-[background-color,scale] duration-150 ease-out active:scale-[0.96]"
                >
                  Get Started
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-20 sm:py-24">
          <motion.div
            className="max-w-6xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center text-center px-4"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 mb-6">
                  <Sparkles className="w-5 h-5 text-black" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight">
                  AI-assisted writing
                </h3>
                <p className="mt-3 text-zinc-600 leading-relaxed">
                  Dapatkan saran kalimat, pengembangan karakter, dan alur cerita
                  yang digerakkan oleh AI kreatif.
                </p>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center text-center px-4"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 mb-6">
                  <Layers className="w-5 h-5 text-black" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight">
                  Structured workflow
                </h3>
                <p className="mt-3 text-zinc-600 leading-relaxed">
                  Kelola outline, bab, dan draft dalam satu alur kerja yang
                  terorganisir dan mudah dipantau.
                </p>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center text-center px-4"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 mb-6">
                  <BookOpen className="w-5 h-5 text-black" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight">
                  Long-form support
                </h3>
                <p className="mt-3 text-zinc-600 leading-relaxed">
                  Dukungan penuh untuk naskah panjang dengan konteks besar dan
                  konsistensi cerita yang terjaga.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* CTA Footer */}
        <section className="px-6 py-24 sm:py-32">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.h2
              variants={itemVariants}
              className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight"
            >
              Mulai Menulis Sekarang
            </motion.h2>

            <motion.p
              variants={itemVariants}
              className="mt-5 text-lg text-zinc-600 max-w-xl mx-auto"
            >
              Bergabunglah dengan para penulis yang telah mempercepat proses
              kreatif mereka bersama Novyl AI.
            </motion.p>

            <motion.div variants={itemVariants} className="mt-10">
              <Link href="/register">
                <Button
                  size="lg"
                  className="rounded-full px-8 py-6 text-base font-medium bg-black text-white hover:bg-zinc-800 transition-[background-color,scale] duration-150 ease-out active:scale-[0.96]"
                >
                  Get Started
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
