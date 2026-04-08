# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |

## Reporting a Vulnerability

We take the security of Studyield seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do NOT report security vulnerabilities through public GitHub issues.**

### How to Report

Send an email to [security@studyield.com](mailto:security@studyield.com) with the following information:

- Type of issue (e.g., SQL injection, XSS, authentication bypass, etc.)
- Full paths of source file(s) related to the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

- **Acknowledgment**: We will acknowledge your report within **48 hours**.
- **Assessment**: We will provide an initial assessment of the report within **5 business days**.
- **Resolution**: We aim to resolve critical vulnerabilities within **30 days** of disclosure.
- **Disclosure**: We will coordinate with you on the timing of public disclosure.

### Safe Harbor

We support safe harbor for security researchers who:

- Make a good faith effort to avoid privacy violations, destruction of data, and interruption or degradation of our services.
- Only interact with accounts you own or with explicit permission of the account holder.
- Do not exploit a security issue for purposes other than verification.
- Report the vulnerability promptly after discovery.

We will not pursue legal action against researchers who follow these guidelines.

## Security Best Practices for Self-Hosting

When deploying Studyield, please ensure:

1. **Environment Variables**: Never commit `.env` files. Use the provided `.env.example` as a template.
2. **JWT Secrets**: Always set strong, unique `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in production (min 32 characters).
3. **Database**: Use strong passwords and restrict network access to your PostgreSQL, Redis, Qdrant, and ClickHouse instances.
4. **HTTPS**: Always use HTTPS in production with valid SSL certificates.
5. **Updates**: Keep your Studyield installation and dependencies up to date.
6. **Firebase**: Keep Firebase credentials secure and restrict API key permissions.
7. **File Uploads**: Configure appropriate file size limits and validate file types.
8. **CORS**: Restrict `CORS_ORIGINS` to only your frontend domain in production.

## Dependencies

We use [Dependabot](https://github.com/dependabot) to monitor and update dependencies with known vulnerabilities.
