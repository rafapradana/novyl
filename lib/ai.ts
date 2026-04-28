import { OpenRouter } from "@openrouter/sdk";

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is not set in environment variables");
}

export const ai = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const MODELS = {
  primary: "x-ai/grok-4.1-fast",
  fallback: "deepseek/deepseek-v4-flash",
} as const;

export function isRetryableError(error: unknown): boolean {
  if (error && typeof error === "object" && "statusCode" in error) {
    const statusCode = (error as { statusCode: number }).statusCode;
    return statusCode === 429 || statusCode === 503 || statusCode >= 500;
  }
  return false;
}

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return (error as { message: string }).message;
  }
  return String(error);
}

export function getStatusCode(error: unknown): number | null {
  if (error && typeof error === "object" && "statusCode" in error) {
    return (error as { statusCode: number }).statusCode;
  }
  return null;
}
