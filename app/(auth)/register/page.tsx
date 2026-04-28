"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { signUp } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!name) newErrors.name = "Nama wajib diisi";
    if (!email) newErrors.email = "Email wajib diisi";
    if (!password) newErrors.password = "Password wajib diisi";
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
    if (!validate()) return;

    setLoading(true);
    const { error } = await signUp.email({ email, password, name });
    setLoading(false);

    if (error) {
      toast.error(error.message || "Registrasi gagal");
    } else {
      toast.success("Registrasi berhasil");
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-10 text-center text-2xl font-semibold tracking-tight">
          Daftar ke Novyl
        </h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <Label htmlFor="name" className="text-sm font-medium">
              Nama
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="mt-2 border-0 border-b border-gray-300 rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-black"
            />
            {errors.name && (
              <p className="mt-2 text-sm text-red-500">{errors.name}</p>
            )}
          </div>
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
          <div>
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Konfirmasi Password
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
          <Button type="submit" disabled={loading} className="w-full transition-[background-color,scale] duration-150 ease-out active:scale-[0.96]">
            {loading ? "Memuat..." : "Daftar"}
          </Button>
        </form>
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
