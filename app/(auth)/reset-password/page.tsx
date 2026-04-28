"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { resetPassword } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    token?: string;
  }>({});

  useEffect(() => {
    if (!token) {
      setErrors((prev) => ({ ...prev, token: "Token reset tidak valid" }));
    }
  }, [token]);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!password) newErrors.password = "Password baru wajib diisi";
    else if (password.length < 8)
      newErrors.password = "Password minimal 8 karakter";
    if (!confirmPassword)
      newErrors.confirmPassword = "Konfirmasi password wajib diisi";
    else if (password !== confirmPassword)
      newErrors.confirmPassword = "Password tidak cocok";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Token reset tidak valid");
      return;
    }
    if (!validate()) return;

    setLoading(true);
    const { error } = await resetPassword({ token, newPassword: password });
    setLoading(false);

    if (error) {
      toast.error(error.message || "Gagal reset password");
    } else {
      toast.success("Password berhasil direset");
      router.push("/login");
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-10 text-center text-2xl font-semibold tracking-tight">
          Reset Password
        </h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <Label htmlFor="password" className="text-sm font-medium">
              Password Baru
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-2 border-0 border-b border-gray-300 rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-black"
            />
            {errors.password && (
              <p className="mt-2 text-sm text-red-500">{errors.password}</p>
            )}
          </div>
          <div>
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Konfirmasi Password Baru
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-2 border-0 border-b border-gray-300 rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-black"
            />
            {errors.confirmPassword && (
              <p className="mt-2 text-sm text-red-500">
                {errors.confirmPassword}
              </p>
            )}
          </div>
          {errors.token && (
            <p className="text-sm text-red-500">{errors.token}</p>
          )}
          <Button
            type="submit"
            disabled={loading || !token}
            className="w-full transition-[background-color,scale] duration-150 ease-out active:scale-[0.96]"
          >
            {loading ? "Memuat..." : "Reset Password"}
          </Button>
        </form>
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm">
            <h1 className="mb-10 text-center text-2xl font-semibold tracking-tight">
              Reset Password
            </h1>
            <p className="text-center text-sm text-muted-foreground">
              Memuat...
            </p>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
