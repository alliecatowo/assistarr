# Getting started

Assistarr is a Next.js 16 app with a Postgres database. There is no hosted version and no published package: you run it yourself, either with Docker Compose (see [Self-hosting](/guide/self-hosting)) or from source as below.

## Prerequisites

- Node.js 24 (the version the project pins in `mise.toml`)
- pnpm 9
- PostgreSQL 16 or newer
- Two secrets of 32+ characters: `AUTH_SECRET` and `ENCRYPTION_KEY` (`openssl rand -base64 32`)
- One AI provider key (OpenRouter, Vercel AI Gateway, or a direct OpenAI, Anthropic or Google key)

## Run from source

```bash
git clone https://github.com/alliecatowo/assistarr.git
cd assistarr
make setup        # copies .env.example to .env.local and installs dependencies
# edit .env.local, then:
make db-migrate
make dev
```

Without `make`:

```bash
pnpm install
cp .env.example .env.local
pnpm db:migrate
pnpm dev
```

Open `http://localhost:3000`, register an account, then follow [Connecting your services](/guide/services).

Run `make check-env` to verify your configuration before starting.
