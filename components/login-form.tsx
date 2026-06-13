"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert } from "@/components/ui/alert";
import { Loader2Icon } from "lucide-react";

type AuthTab = "signin" | "signup";

const SIGN_IN_TAB = "signin" as const;
const SIGN_UP_TAB = "signup" as const;
const NOVELS_PATH = "/novels";
const MIN_PASSWORD_LENGTH = 6;
const GENERIC_AUTH_ERROR = "Terjadi kesalahan. Silakan coba lagi.";

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return GENERIC_AUTH_ERROR;
}

function clearFormFields(): {
  displayName: string;
  email: string;
  password: string;
  errorMessage: null;
} {
  return { displayName: "", email: "", password: "", errorMessage: null };
}

async function signInWithEmail(
  email: string,
  password: string
): Promise<string | null> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return error ? extractErrorMessage(error) : null;
}

async function signUpWithDisplayName(
  email: string,
  password: string,
  displayName: string
): Promise<string | null> {
  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  return error ? extractErrorMessage(error) : null;
}

function getDescriptionText(isSignIn: boolean): string {
  return isSignIn
    ? "Masuk ke akun Novyl kamu"
    : "Buat akun baru untuk mulai menulis";
}

function getSubmitLabel(isSignIn: boolean): string {
  return isSignIn ? "Masuk" : "Daftar";
}

function getAutoComplete(isSignIn: boolean): string {
  return isSignIn ? "current-password" : "new-password";
}

interface LoginFormProps extends React.ComponentProps<"div"> {}

export function LoginForm({ className, ...props }: LoginFormProps): React.JSX.Element {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AuthTab>(SIGN_IN_TAB);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSignIn = activeTab === SIGN_IN_TAB;

  function switchToTab(tab: string) {
    setActiveTab(tab as AuthTab);
    const cleared = clearFormFields();
    setDisplayName(cleared.displayName);
    setEmail(cleared.email);
    setPassword(cleared.password);
    setErrorMessage(cleared.errorMessage);
  }

  async function submitAuthForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const authError = isSignIn
      ? await signInWithEmail(email, password)
      : await signUpWithDisplayName(email, password, displayName);

    if (authError) {
      setErrorMessage(authError);
      setIsSubmitting(false);
      return;
    }

    router.push(NOVELS_PATH);
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Selamat datang</CardTitle>
          <CardDescription>{getDescriptionText(isSignIn)}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={switchToTab}>
            <TabsList className="w-full">
              <TabsTrigger value={SIGN_IN_TAB} className="flex-1">
                Masuk
              </TabsTrigger>
              <TabsTrigger value={SIGN_UP_TAB} className="flex-1">
                Daftar
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={submitAuthForm} className="mt-4">
            <FieldGroup>
              {!isSignIn && (
                <Field>
                  <FieldLabel htmlFor="display-name">Nama</FieldLabel>
                  <Input
                    id="display-name"
                    type="text"
                    placeholder="Nama tampilan kamu"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    required
                    autoComplete="name"
                  />
                </Field>
              )}
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@contoh.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Kata sandi</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete={getAutoComplete(isSignIn)}
                />
              </Field>

              {errorMessage && (
                <Alert variant="destructive" className="text-sm">
                  {errorMessage}
                </Alert>
              )}

              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2Icon className="animate-spin" />
                  )}
                  {getSubmitLabel(isSignIn)}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
