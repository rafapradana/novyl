"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { signIn } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = "Email wajib diisi";
    if (!password) newErrors.password = "Password wajib diisi";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const { error } = await signIn.email({ email, password });
    setLoading(false);

    if (error) {
      toast.error(error.message || "Login gagal");
    } else {
      toast.success("Login berhasil");
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-10 text-center text-2xl font-semibold tracking-tight">
          Masuk ke Novyl
        </h1>
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
            {errors.email && (
              <p className="mt-2 text-sm text-red-500">{errors.email}</p>
            )}
          </div>
          <div>
            <Label htmlFor="password" className="text-sm font-medium">
              Password
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
          <Button type="submit" disabled={loading} className="w-full transition-[background-color,scale] duration-150 ease-out active:scale-[0.96]">
            {loading ? "Memuat..." : "Login"}
          </Button>
        </form>
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <span>
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Register
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
