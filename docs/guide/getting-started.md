# Getting started

Assistarr is a Next.js 15 app with a Postgres database. There is no hosted version and no published package: you run it yourself, either with Docker Compose (see [Self-hosting](/guide/self-hosting)) or from source as below.

## Prerequisites

- Node.js 20 or newer
- pnpm 9 or newer
- PostgreSQL 16 or newer
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
