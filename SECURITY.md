# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

1. **Do NOT** open a public GitHub issue for security vulnerabilities
2. Email your findings to the project maintainers
3. Include as much detail as possible:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes (optional)

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
- **Updates**: We will provide updates on the status of your report within 7 days
- **Resolution**: We aim to resolve critical vulnerabilities within 30 days
- **Credit**: We will credit reporters in our release notes (unless you prefer anonymity)

## Security Scanning

This project employs multiple layers of automated security scanning:

### Dependency Scanning

- **npm audit**: Scans Node.js dependencies for known vulnerabilities
- Runs on every pull request and weekly scheduled scans

### Static Analysis

- **CodeQL**: GitHub's semantic code analysis engine
- Detects security vulnerabilities and code quality issues
- Configured with `security-and-quality` query suite

### Container Security

- **Trivy**: Comprehensive container vulnerability scanner
- Scans the production Docker image for:
  - OS package vulnerabilities
  - Application dependency vulnerabilities
  - Misconfigurations
- Reports CRITICAL and HIGH severity issues

### Secret Detection

- **Gitleaks**: Scans for hardcoded secrets and credentials
- Checks entire git history for leaked secrets
- **GitHub Secret Scanning**: Native GitHub feature enabled for this repository

## Security Best Practices

When contributing to Assistarr:

1. **Never commit secrets**: Use environment variables for sensitive data
2. **Keep dependencies updated**: Regular updates reduce vulnerability exposure
3. **Follow secure coding practices**: Input validation, output encoding, etc.
4. **Review security alerts**: Address Dependabot and CodeQL alerts promptly

## Security Configuration

### Environment Variables

Sensitive configuration should be provided via environment variables:

- `DATABASE_URL` - Database connection string
- `NEXTAUTH_SECRET` - Authentication secret (generate with `openssl rand -base64 32`)
- `*_API_KEY` - Service API keys

### Docker Security

The production Docker image follows security best practices:

- Runs as non-root user (`nextjs`)
- Uses multi-stage builds to minimize attack surface
- Alpine-based image for smaller footprint
- Health checks enabled

## Dependency Management

- Dependencies are locked with `pnpm-lock.yaml`
- Dependabot is configured for automated security updates
- All dependencies are audited before merge

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
