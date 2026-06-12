# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Novyl, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please report vulnerabilities by emailing the project owner or through a private channel. Include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide a timeline for resolution.

## Supported Versions

| Version | Supported |
|---------|-----------|
| v1 (early access) | Yes |

## Security Best Practices

When running Novyl locally or deploying:

- **Environment variables** — Never commit `.env.local` or API keys to version control.
- **Supabase RLS** — Ensure Row Level Security policies are enabled on all tables.
- **Auth** — Use strong passwords; Supabase Auth handles session management.
- **API routes** — All API routes should validate user sessions via Supabase server client.
- **Dependencies** — Run `npm audit` regularly and keep dependencies updated.

## Dependency Security

This project uses Next.js 16, React 19, and Supabase client libraries. Monitor for security advisories:

- [Next.js Security Advisories](https://github.com/vercel/next.js/security)
- [Supabase Security](https://supabase.com/docs/guides/platform/compliance)

## Contact

For security-related inquiries, contact the project maintainer via GitHub.
