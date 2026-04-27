import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import {
  users,
  sessions,
  accounts,
  verifications,
  novels,
  characters,
  settings,
  chapters,
} from "@/db/schema";
import { Resend } from "resend";

const APP_NAME = "Novyl AI";
const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Novyl AI] RESEND_API_KEY not set. Emails will be logged to console only.");
    return null;
  }
  return new Resend(apiKey);
}

async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }) {
  const resend = getResend();
  if (!resend) {
    console.log(`[Email Mock] To: ${to}\nSubject: ${subject}\nText: ${text}`);
    return;
  }
  await resend.emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to,
    subject,
    html,
    text,
  });
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
      novel: novels,
      character: characters,
      setting: settings,
      chapter: chapters,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    autoSignInAfterRegistration: true,
    minPasswordLength: 8,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url, token }) => {
      await sendEmail({
        to: user.email,
        subject: `Reset your ${APP_NAME} password`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Reset your password</h2>
            <p>Hello ${user.name || user.email},</p>
            <p>You requested to reset your password for ${APP_NAME}. Click the link below to set a new password:</p>
            <p><a href="${url}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
            <p>Or copy and paste this URL into your browser:</p>
            <p style="word-break: break-all; color: #2563eb;">${url}</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="color: #6b7280; font-size: 12px;">${APP_NAME}</p>
          </div>
        `,
        text: `Reset your ${APP_NAME} password\n\nHello ${user.name || user.email},\n\nYou requested to reset your password. Click the link below to set a new password:\n${url}\n\nIf you didn't request this, you can safely ignore this email.`,
      });
    },
    resetPasswordTokenExpiresIn: 3600,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: `Verify your email for ${APP_NAME}`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Verify your email</h2>
            <p>Hello ${user.name || user.email},</p>
            <p>Thanks for signing up for ${APP_NAME}. Click the link below to verify your email address:</p>
            <p><a href="${url}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Verify Email</a></p>
            <p>Or copy and paste this URL into your browser:</p>
            <p style="word-break: break-all; color: #2563eb;">${url}</p>
            <p>If you didn't sign up for ${APP_NAME}, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="color: #6b7280; font-size: 12px;">${APP_NAME}</p>
          </div>
        `,
        text: `Verify your email for ${APP_NAME}\n\nHello ${user.name || user.email},\n\nThanks for signing up. Click the link below to verify your email address:\n${url}\n\nIf you didn't sign up, you can safely ignore this email.`,
      });
    },
  },
});
