"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { requestPasswordReset } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Email wajib diisi");
      return;
    }

    setLoading(true);
    const { error: reqError } = await requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (reqError) {
      toast.error(reqError.message || "Gagal mengirim link reset");
    } else {
      setSubmitted(true);
      toast.success("Link reset password telah dikirim ke email Anda");
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-10 text-center text-2xl font-semibold tracking-tight">
          Lupa Password
        </h1>
        {submitted ? (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Link reset password telah dikirim ke email Anda
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="mt-2 border-0 border-b border-gray-300 rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-black"
              />
              {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
              )}
            </div>
            <Button type="submit" disabled={loading} className="w-full transition-[background-color,scale] duration-150 ease-out active:scale-[0.96]">
              {loading ? "Memuat..." : "Kirim Link Reset"}
            </Button>
          </form>
        )}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}
