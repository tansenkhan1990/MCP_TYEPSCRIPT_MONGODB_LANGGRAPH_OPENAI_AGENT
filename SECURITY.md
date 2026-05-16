# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| latest `main` | yes |

## Reporting a vulnerability

Please **do not** open a public issue for security-sensitive reports.

Email the repository owner with:

- Description of the issue
- Steps to reproduce
- Impact assessment

## Secrets

- Never commit `.env` or Atlas credentials.
- Rotate credentials immediately if they are exposed.
- Use Atlas IP allowlists and least-privilege database users in production.
