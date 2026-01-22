# Contributing to Assistarr

Thank you for your interest in contributing to Assistarr! This guide will help you get started with development and understand our contribution process.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Plugin Development](#plugin-development)
- [Issue Reporting](#issue-reporting)

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9.12+ (required - npm/yarn not supported)
- PostgreSQL database (we recommend [Neon](https://neon.tech))
- Git

### Setup

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/assistarr.git
   cd assistarr
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration:

   | Variable | Description | Required |
   |----------|-------------|----------|
   | `AUTH_SECRET` | NextAuth secret (generate with `openssl rand -base64 32`) | Yes |
   | `POSTGRES_URL` | PostgreSQL connection string | Yes |
   | `OPENROUTER_API_KEY` | OpenRouter API key for AI | Yes* |
   | `AI_GATEWAY_API_KEY` | Alternative: Vercel AI Gateway key | Yes* |

   *At least one AI provider key is required.

4. **Run database migrations**

   ```bash
   pnpm db:migrate
   ```

5. **Start the development server**

   ```bash
   pnpm dev
   ```

   The app will be available at `http://localhost:3000`.

## Development Workflow

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with Turbopack |
| `pnpm build` | Build for production |
| `pnpm lint` | Check code with Biome (via ultracite) |
| `pnpm format` | Auto-fix lint and formatting issues |
| `pnpm test` | Run unit tests with Vitest |
| `pnpm test:ui` | Run tests with Vitest UI |
| `pnpm test:e2e` | Run E2E tests with Playwright |
| `pnpm test:coverage` | Generate test coverage report |
| `pnpm db:generate` | Generate new database migrations |
| `pnpm db:migrate` | Run pending migrations |
| `pnpm db:studio` | Open Drizzle Studio for database inspection |

### Branch Naming

Use descriptive branch names with a prefix:

- `feat/` - New features (e.g., `feat/jellyfin-resume-watching`)
- `fix/` - Bug fixes (e.g., `fix/radarr-queue-display`)
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or fixes
- `chore/` - Maintenance tasks

## Code Style

### Biome (via Ultracite)

We use [Biome](https://biomejs.dev/) for linting and formatting, wrapped by [ultracite](https://github.com/haydenbleasel/ultracite) for configuration management.

```bash
# Check for issues
pnpm lint

# Auto-fix issues
pnpm format
```

### TypeScript

- TypeScript strict mode is enabled - avoid `any` types
- Use explicit return types for exported functions
- Prefer interfaces over type aliases for object shapes
- Use Zod schemas for runtime validation

### Pre-commit Hooks

Husky and lint-staged run automatically on commit:

1. **Pre-commit**: Runs `ultracite fix` on staged `.ts`, `.tsx`, `.json`, and `.md` files
2. **Commit-msg**: Validates commit message format with commitlint

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/). Commits must match this format:

```
type(scope): subject
```

**Allowed types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style (formatting, semicolons, etc.)
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `test` - Adding or fixing tests
- `build` - Build system changes
- `ci` - CI configuration
- `chore` - Maintenance tasks
- `revert` - Reverting changes

**Rules:**
- Subject must be lowercase
- Header max length: 100 characters
- Scope is optional but encouraged

**Examples:**
```
feat(radarr): add movie search autocomplete
fix(sonarr): handle missing episode thumbnails
docs: update plugin development guide
refactor(plugins): extract common base client
```

## Testing

### Unit Tests (Vitest)

Unit tests are located alongside source files or in `__tests__` directories.

```bash
# Run all unit tests
pnpm test

# Run with UI
pnpm test:ui

# Run specific test file
pnpm test lib/plugins/radarr/search-movies.test.ts

# Generate coverage
pnpm test:coverage
```

### E2E Tests (Playwright)

E2E tests are in the `tests/` directory.

```bash
# Install Playwright browsers (first time)
pnpm exec playwright install

# Run all E2E tests
pnpm test:e2e

# Run with UI mode
pnpm exec playwright test --ui

# Run specific test file
pnpm exec playwright test tests/e2e/radarr.spec.ts

# Debug mode
pnpm exec playwright test --debug
```

### Testing Requirements for PRs

- All existing tests must pass
- New features should include unit tests
- UI changes should include E2E tests where applicable
- Test coverage should not decrease significantly

## Pull Request Process

1. **Create a feature branch** from `main`

   ```bash
   git checkout -b feat/your-feature
   ```

2. **Make your changes** following the code style guidelines

3. **Write tests** for new functionality

4. **Run the full test suite**

   ```bash
   pnpm lint
   pnpm test
   pnpm test:e2e
   ```

5. **Commit your changes** using conventional commits

6. **Push and create a PR**

   ```bash
   git push origin feat/your-feature
   ```

7. **Fill out the PR template** with:
   - Description of changes
   - Related issue(s)
   - Testing performed
   - Screenshots (for UI changes)

### PR Review Checklist

- [ ] Code follows the style guide
- [ ] All tests pass
- [ ] New code has appropriate test coverage
- [ ] Documentation is updated if needed
- [ ] Commit messages follow conventional commits
- [ ] No unnecessary console.log statements

## Plugin Development

Assistarr uses a plugin architecture for service integrations. See [`docs/PLUGIN_ARCHITECTURE.md`](docs/PLUGIN_ARCHITECTURE.md) for the complete guide.

### Quick Reference

Plugins live in `lib/plugins/{service-name}/` with this structure:

```
lib/plugins/your-service/
  definition.ts    # ServiceDefinition export
  client.ts        # API client
  schemas.ts       # Zod schemas for validation
  types.ts         # TypeScript types
  {tool-name}.ts   # Individual tool implementations
  index.ts         # Exports
```

### Adding a New Plugin

1. Create the service directory structure
2. Implement the API client with error handling
3. Define Zod schemas for all API responses
4. Create tool implementations using the AI SDK `tool()` function
5. Export a `ServiceDefinition` in `definition.ts`
6. Register in `lib/plugins/core/manager.ts`
7. Add display names in `components/tool-results/`
8. Write tests for critical functionality

## Issue Reporting

### Bug Reports

When reporting bugs, include:

1. **Description**: Clear explanation of the issue
2. **Steps to Reproduce**: Numbered list of steps
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**:
   - OS and version
   - Browser (for UI issues)
   - Node.js version
   - Service versions (Radarr, Sonarr, etc.)
6. **Logs**: Relevant console or server logs
7. **Screenshots**: For UI issues

### Feature Requests

For new features, describe:

1. **Problem**: What problem does this solve?
2. **Proposed Solution**: How should it work?
3. **Alternatives Considered**: Other approaches you thought of
4. **Additional Context**: Mockups, examples, etc.

### Security Issues

For security vulnerabilities, please do NOT create a public issue. Instead, contact the maintainers directly.

---

## Questions?

If you have questions about contributing, feel free to:

- Open a discussion on GitHub
- Check existing issues and PRs for context
- Review the documentation in the `docs/` folder

Thank you for contributing to Assistarr!
