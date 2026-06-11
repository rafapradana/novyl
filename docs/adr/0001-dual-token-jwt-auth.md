# Dual-token JWT authentication with email and password

v1 uses credential-based auth (display name, email, password at signup; email and password at sign-in) with open registration. Social/OAuth login from the brief is deferred.

Authentication follows the standard dual-token pattern: a short-lived access token (JWT) for API requests and a long-lived refresh token (stored securely, rotated on use) to obtain new access tokens without re-entering credentials. Go Fiber validates JWTs on protected routes; refresh is a dedicated endpoint that issues a new pair and invalidates the previous refresh token.

Email/password was chosen for v1 because early access needs the simplest self-serve signup without OAuth app configuration. Dual-token JWT avoids session state on the server while keeping access tokens short-lived for security.
