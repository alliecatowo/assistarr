# Assistarr — Developer Makefile
# Usage: make <target>
#
# Requires: node 20+, pnpm 9+, docker (for dev with compose)

.PHONY: help install dev dev-docker stop build start lint format \
        db-migrate db-generate db-studio db-push db-check \
        test test-unit test-e2e test-coverage test-visual \
        health check-env setup

# Default target
help:
	@echo ""
	@echo "Assistarr — available targets:"
	@echo ""
	@echo "  Setup"
	@echo "    make setup        Copy .env.example → .env.local and run install"
	@echo "    make install      Install dependencies (pnpm install)"
	@echo "    make check-env    Verify required environment variables are set"
	@echo ""
	@echo "  Dev"
	@echo "    make dev          Start Next.js dev server (pnpm dev)"
	@echo "    make dev-docker   Start full stack via Docker Compose (app + postgres + redis)"
	@echo "    make stop         Stop and remove Docker Compose stack"
	@echo ""
	@echo "  Build"
	@echo "    make build        Build for production (pnpm build)"
	@echo "    make start        Start production server (pnpm start)"
	@echo ""
	@echo "  Code quality"
	@echo "    make lint         Run biome linter"
	@echo "    make format       Format all files"
	@echo ""
	@echo "  Database"
	@echo "    make db-migrate   Run pending migrations"
	@echo "    make db-generate  Generate new migration from schema changes"
	@echo "    make db-studio    Open Drizzle Studio (database GUI)"
	@echo "    make db-push      Push schema changes (dev only — skips migration)"
	@echo "    make db-check     Check for migration drift"
	@echo ""
	@echo "  Testing"
	@echo "    make test         Run all tests"
	@echo "    make test-unit    Run unit tests (vitest)"
	@echo "    make test-e2e     Run end-to-end tests (playwright)"
	@echo "    make test-visual  Run visual snapshot tests"
	@echo "    make test-coverage Run tests with coverage report"
	@echo ""
	@echo "  Health"
	@echo "    make health       Hit /api/health (requires dev server running)"
	@echo ""

# =====================
# Setup
# =====================

setup:
	@if [ ! -f .env.local ]; then \
		cp .env.example .env.local; \
		echo "✓ Created .env.local from .env.example — edit it before starting"; \
	else \
		echo "ℹ  .env.local already exists, skipping copy"; \
	fi
	$(MAKE) install

install:
	pnpm install

check-env:
	@echo "Checking required environment variables..."
	@missing=0; \
	for var in POSTGRES_URL AUTH_SECRET; do \
		if [ -z "$${!var}" ]; then \
			echo "  ✗ $$var is not set"; \
			missing=1; \
		else \
			echo "  ✓ $$var"; \
		fi; \
	done; \
	if [ -z "$$OPENROUTER_API_KEY" ] && [ -z "$$AI_GATEWAY_API_KEY" ]; then \
		echo "  ✗ At least one of OPENROUTER_API_KEY or AI_GATEWAY_API_KEY is required"; \
		missing=1; \
	else \
		echo "  ✓ AI provider key present"; \
	fi; \
	if [ $$missing -eq 1 ]; then \
		echo ""; \
		echo "Run 'cp .env.example .env.local' and fill in the missing values."; \
		exit 1; \
	else \
		echo ""; \
		echo "All required environment variables are set."; \
	fi

# =====================
# Dev
# =====================

dev:
	pnpm dev

dev-docker:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up

dev-docker-d:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

stop:
	docker compose down

# =====================
# Build
# =====================

build:
	pnpm build

start:
	pnpm start

# =====================
# Code quality
# =====================

lint:
	pnpm lint

format:
	pnpm format

# =====================
# Database
# =====================

db-migrate:
	pnpm db:migrate

db-generate:
	pnpm db:generate

db-studio:
	pnpm db:studio

db-push:
	pnpm db:push

db-check:
	pnpm db:check

# =====================
# Testing
# =====================

test:
	pnpm test

test-unit:
	pnpm exec vitest run

test-e2e:
	pnpm test:e2e

test-visual:
	pnpm test:visual

test-coverage:
	pnpm test:coverage

# =====================
# Health
# =====================

health:
	@curl -sf http://localhost:3000/api/health | python3 -m json.tool || \
		echo "Health check failed — is the dev server running? (make dev)"
