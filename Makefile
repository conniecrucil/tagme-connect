SHELL := /bin/bash
.DEFAULT_GOAL := help

NPM ?= npm
SUPABASE ?= supabase
PSQL ?= psql
DOCKER ?= docker
SUPABASE_START_FLAGS ?= --debug

ENV_LOCAL ?= .env.local
DB_HOST ?= 127.0.0.1
DB_PORT ?= 54322
DB_NAME ?= postgres
DB_USER ?= postgres
DB_PASSWORD ?= postgres

SUPABASE_API_URL ?= http://127.0.0.1:54321
SUPABASE_STUDIO_URL ?= http://127.0.0.1:54323
SUPABASE_MAILPIT_URL ?= http://127.0.0.1:54324
SUPABASE_STORAGE_S3_URL ?= http://127.0.0.1:54321/storage/v1/s3
APP_DEV_URL ?= http://127.0.0.1:3000
MINIO_API_URL ?= $(SUPABASE_STORAGE_S3_URL)
MINIO_CONSOLE_URL ?= $(SUPABASE_STUDIO_URL)
MINIO_PUBLIC_URL ?= http://127.0.0.1:54321/storage/v1
SUPABASE_PROJECT_LABEL ?= $(notdir $(CURDIR))
SUPABASE_DB_CONTAINER ?= supabase_db_$(SUPABASE_PROJECT_LABEL)

MIGRATIONS := $(sort $(wildcard supabase/migrations/*.sql))
SEED_SQL := supabase/seed.sql

.PHONY: help up down dev nuke status db-logs docker-status e2e-preflight e2e-dev \
	ensure-tools ensure-db-ready ensure-migrations ensure-seed ensure-minio-seed env-local \
	migrate seed seed-minio init-minio psql-check add-admin

help: ## Show available targets
	@awk 'BEGIN {FS = ":.*## "}; /^[a-zA-Z0-9_.-]+:.*## / {printf "%-14s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

up: ensure-tools ## Start local stack, ensure schema/seed, and update .env.local
	@set -euxo pipefail; \
	echo "Starting Supabase local stack..."; \
	echo "If this hangs at 'Starting database...', run 'make db-logs' in another terminal."; \
	if ! $(SUPABASE) start $(SUPABASE_START_FLAGS); then \
		echo "Supabase start failed. Attempting one stop/retry..."; \
		$(SUPABASE) stop || true; \
		if ! $(SUPABASE) start $(SUPABASE_START_FLAGS); then \
			echo "Supabase still failed to start (often due to unhealthy local volumes)."; \
			echo "Try: make nuke"; \
			exit 1; \
		fi; \
	fi; \
	$(MAKE) env-local; \
	$(MAKE) ensure-db-ready; \
	$(MAKE) ensure-migrations; \
	$(MAKE) ensure-seed; \
	$(MAKE) init-minio; \
	$(MAKE) ensure-minio-seed; \
	echo "Local stack is ready."

down: ## Stop local Supabase stack
	@$(SUPABASE) stop

dev: ## Run fullstack React Router app locally (Vercel-compatible)
	@set -euo pipefail; \
	set -a; \
	[ -f "$(ENV_LOCAL)" ] && . "$(ENV_LOCAL)" || true; \
	set +a; \
	export SUPABASE_PREFER_LOCAL=true; \
	$(NPM) run dev -- --port 3000 --host

nuke: ## Destroy local Supabase stack volumes (DB + MinIO) and refresh local env file
	@set -euo pipefail; \
	echo "Destroying local Supabase stack (database + storage volumes)..."; \
	if ! $(SUPABASE) stop --no-backup; then \
		echo "Retrying with legacy Supabase CLI flag..."; \
		$(SUPABASE) stop --destroy || true; \
	fi; \
	if command -v $(DOCKER) >/dev/null 2>&1; then \
		label="com.supabase.cli.project=$(SUPABASE_PROJECT_LABEL)"; \
		echo "Force-removing Supabase Docker resources with label: $$label"; \
		container_ids=$$($(DOCKER) ps -aq --filter "label=$$label"); \
		if [ -n "$$container_ids" ]; then $(DOCKER) rm -f $$container_ids || true; fi; \
		volume_ids=$$($(DOCKER) volume ls -q --filter "label=$$label"); \
		if [ -n "$$volume_ids" ]; then $(DOCKER) volume rm -f $$volume_ids || true; fi; \
		network_ids=$$($(DOCKER) network ls -q --filter "label=$$label"); \
		if [ -n "$$network_ids" ]; then $(DOCKER) network rm $$network_ids || true; fi; \
		echo "Force-removing Supabase Docker resources by name pattern (fallback)..."; \
		container_ids=$$($(DOCKER) ps -aq --filter "name=$(SUPABASE_PROJECT_LABEL)"); \
		if [ -n "$$container_ids" ]; then $(DOCKER) rm -f $$container_ids || true; fi; \
		volume_ids=$$($(DOCKER) volume ls -q | grep "$(SUPABASE_PROJECT_LABEL)" || true); \
		if [ -n "$$volume_ids" ]; then $(DOCKER) volume rm -f $$volume_ids || true; fi; \
		network_ids=$$($(DOCKER) network ls -q --filter "name=$(SUPABASE_PROJECT_LABEL)"); \
		if [ -n "$$network_ids" ]; then $(DOCKER) network rm $$network_ids || true; fi; \
	fi; \
	if [ -d "supabase/.temp" ]; then \
		echo "Removing stale Supabase local temp state (supabase/.temp)"; \
		rm -rf supabase/.temp; \
	fi; \
	if [ -f "$(ENV_LOCAL)" ]; then \
		echo "Keeping $(ENV_LOCAL) in place (regenerated on next 'make up')."; \
	fi; \
	echo "Local stack destroyed."

status: ## Show local service status, ports, and quick health checks
	@set -euo pipefail; \
	echo "== Supabase CLI status =="; \
	if command -v $(SUPABASE) >/dev/null 2>&1; then \
		$(SUPABASE) status || true; \
	else \
		echo "supabase CLI not found"; \
	fi; \
	echo; \
	echo "== Port listeners =="; \
	for spec in "3000 App Dev Server" "54321 Supabase API" "54322 Postgres" "54323 Supabase Studio" "54324 Mailpit"; do \
		port=$${spec%% *}; label=$${spec#* }; \
		if lsof -nP -iTCP:$$port -sTCP:LISTEN >/dev/null 2>&1; then \
			echo "[LISTENING] $$label ($$port)"; \
		else \
			echo "[DOWN]      $$label ($$port)"; \
		fi; \
	done; \
	echo; \
	echo "== HTTP checks =="; \
	check_http() { \
		local label="$$1"; local url="$$2"; \
		if curl -fsS -o /dev/null --max-time 2 "$$url"; then \
			echo "[OK]   $$label -> $$url"; \
		else \
			echo "[FAIL] $$label -> $$url"; \
		fi; \
	}; \
	check_http_loose() { \
		local label="$$1"; local url="$$2"; local code; \
		code=$$(curl -sS -o /dev/null --max-time 2 -w "%{http_code}" "$$url" || true); \
		if [ "$$code" != "" ] && [ "$$code" != "000" ]; then \
			echo "[OK]   $$label -> $$url (HTTP $$code)"; \
		else \
			echo "[FAIL] $$label -> $$url"; \
		fi; \
	}; \
	check_http "App Dev Server" "$(APP_DEV_URL)"; \
	check_http "Supabase API" "$(SUPABASE_API_URL)/rest/v1/"; \
	check_http "Supabase Studio" "$(SUPABASE_STUDIO_URL)"; \
	check_http "Mailpit" "$(SUPABASE_MAILPIT_URL)"; \
	check_http_loose "Supabase S3 API" "$(SUPABASE_STORAGE_S3_URL)"; \
	echo; \
	echo "== Files =="; \
	for f in .env .env.local $(SEED_SQL); do \
		if [ -f "$$f" ]; then echo "[OK]   $$f"; else echo "[MISS] $$f"; fi; \
	done

db-logs: ## Tail local Supabase Postgres container logs (for startup hangs)
	@set -euo pipefail; \
	if ! command -v $(DOCKER) >/dev/null 2>&1; then \
		echo "docker not found"; exit 1; \
	fi; \
	container="$$( $(DOCKER) ps -a --format '{{.Names}}' | grep -E '^supabase_db_' | grep '$(SUPABASE_PROJECT_LABEL)' | head -1 )"; \
	if [ -z "$$container" ]; then \
		container="$(SUPABASE_DB_CONTAINER)"; \
	fi; \
	echo "Tailing logs for $$container"; \
	$(DOCKER) logs -f --tail 200 "$$container"

docker-status: ## Show Supabase-related Docker containers/volumes/networks for this project
	@set -euo pipefail; \
	if ! command -v $(DOCKER) >/dev/null 2>&1; then \
		echo "docker not found"; exit 1; \
	fi; \
	echo "== Containers =="; \
	$(DOCKER) ps -a --filter "name=$(SUPABASE_PROJECT_LABEL)" --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'; \
	echo; \
	echo "== Volumes =="; \
	$(DOCKER) volume ls | (grep "$(SUPABASE_PROJECT_LABEL)" || true); \
	echo; \
	echo "== Networks =="; \
	$(DOCKER) network ls | (grep "$(SUPABASE_PROJECT_LABEL)" || true)

e2e-preflight: ## Validate local env and prove Supabase/MinIO are reachable before E2E
	@set -euo pipefail; \
	load_dotenv_file() { \
		file="$$1"; \
		[ -f "$$file" ] || return 0; \
		while IFS= read -r line || [ -n "$$line" ]; do \
			line="$${line%$$'\r'}"; \
			case "$$line" in ''|\#*) continue ;; esac; \
			case "$$line" in export\ *) line="$${line#export }" ;; esac; \
			key="$${line%%=*}"; \
			value="$${line#*=}"; \
			key="$$(printf '%s' "$$key" | sed 's/[[:space:]]*$$//')"; \
			if ! printf '%s' "$$key" | grep -Eq '^[A-Za-z_][A-Za-z0-9_]*$$'; then \
				continue; \
			fi; \
			export "$$key=$$value"; \
		done < "$$file"; \
	}; \
	load_dotenv_file ./.env; \
	load_dotenv_file "$(ENV_LOCAL)"; \
	require_env() { \
		name="$$1"; \
		value="$${!name:-}"; \
		if [ -z "$$value" ]; then \
			echo "Missing required env var for E2E: $$name" >&2; \
			missing=1; \
		fi; \
	}; \
	missing=0; \
	require_env STRIPE_SECRET_KEY; \
	require_env VITE_STRIPE_PUBLISHABLE_KEY; \
	require_env SUPABASE_URL; \
	require_env SUPABASE_SERVICE_ROLE_KEY; \
	require_env S3_ENDPOINT; \
	require_env S3_ACCESS_KEY; \
	require_env S3_SECRET_KEY; \
	require_env S3_BUCKET_NAME; \
	if [ "$$missing" -ne 0 ]; then \
		echo "E2E preflight failed due to missing environment variables." >&2; \
		echo "Load/update .env and $(ENV_LOCAL), then rerun 'make e2e-dev'." >&2; \
		exit 1; \
	fi; \
	http_code() { \
		curl -sS -o /dev/null --max-time 3 -w "%{http_code}" "$$1" || true; \
	}; \
	api_code=$$(http_code "$(SUPABASE_API_URL)/rest/v1/"); \
	s3_code=$$(http_code "$(SUPABASE_STORAGE_S3_URL)"); \
	studio_code=$$(http_code "$(SUPABASE_STUDIO_URL)"); \
	mailpit_code=$$(http_code "$(SUPABASE_MAILPIT_URL)/api/v1/info"); \
	if [ -z "$$api_code" ] || [ "$$api_code" = "000" ] || [ -z "$$s3_code" ] || [ "$$s3_code" = "000" ] || [ -z "$$mailpit_code" ] || [ "$$mailpit_code" = "000" ]; then \
		echo "Local Supabase/MinIO is not reachable. Run 'make up' first, then rerun 'make e2e-dev'." >&2; \
		echo "  Supabase API: $(SUPABASE_API_URL)/rest/v1/ (HTTP $${api_code:-000})" >&2; \
		echo "  Storage S3:    $(SUPABASE_STORAGE_S3_URL) (HTTP $${s3_code:-000})" >&2; \
		echo "  Mailpit API:   $(SUPABASE_MAILPIT_URL)/api/v1/info (HTTP $${mailpit_code:-000})" >&2; \
		exit 1; \
	fi; \
	echo "E2E preflight OK:"; \
	echo "  Supabase API reachable at $(SUPABASE_API_URL)/rest/v1/ (HTTP $$api_code)"; \
	echo "  Storage S3 reachable at $(SUPABASE_STORAGE_S3_URL) (HTTP $$s3_code)"; \
	echo "  Mailpit API reachable at $(SUPABASE_MAILPIT_URL)/api/v1/info (HTTP $$mailpit_code)"; \
	if [ -n "$$studio_code" ] && [ "$$studio_code" != "000" ]; then \
		echo "  Studio reachable at $(SUPABASE_STUDIO_URL) (HTTP $$studio_code)"; \
	else \
		echo "  Studio not reachable at $(SUPABASE_STUDIO_URL) (optional)"; \
	fi

e2e-dev: e2e-preflight ## Run local E2E suite (assumes app dev server is already running)
	@set -euo pipefail; \
	load_dotenv_file() { \
		file="$$1"; \
		[ -f "$$file" ] || return 0; \
		while IFS= read -r line || [ -n "$$line" ]; do \
			line="$${line%$$'\r'}"; \
			case "$$line" in ''|\#*) continue ;; esac; \
			case "$$line" in export\ *) line="$${line#export }" ;; esac; \
			key="$${line%%=*}"; \
			value="$${line#*=}"; \
			key="$$(printf '%s' "$$key" | sed 's/[[:space:]]*$$//')"; \
			if ! printf '%s' "$$key" | grep -Eq '^[A-Za-z_][A-Za-z0-9_]*$$'; then \
				continue; \
			fi; \
			export "$$key=$$value"; \
		done < "$$file"; \
	}; \
	load_dotenv_file ./.env; \
	load_dotenv_file "$(ENV_LOCAL)"; \
	if ! curl -fsS -o /dev/null --max-time 2 "$(APP_DEV_URL)"; then \
		echo "App dev server is not reachable at $(APP_DEV_URL)." >&2; \
		echo "Start it first (for example: 'make dev'), then rerun 'make e2e-dev'." >&2; \
		exit 1; \
	fi; \
	echo "App dev server is reachable at $(APP_DEV_URL)"; \
	test_mode_json=$$(curl -fsS --max-time 5 "$(APP_DEV_URL)/api/test-mode" || true); \
	if [ -z "$$test_mode_json" ]; then \
		echo "Failed to read test mode status from $(APP_DEV_URL)/api/test-mode." >&2; \
		echo "Make sure the app is running the latest code, then rerun 'make e2e-dev'." >&2; \
		exit 1; \
	fi; \
	if ! printf '%s' "$$test_mode_json" | grep -Eq '"active"[[:space:]]*:[[:space:]]*true'; then \
		echo "TEST_ENV is not enabled in the running app (/api/test-mode returned: $$test_mode_json)." >&2; \
		echo "Restart the dev server with TEST_ENV=true (for example: 'TEST_ENV=true make dev'), then rerun 'make e2e-dev'." >&2; \
		exit 1; \
	fi; \
	echo "App reports TEST_ENV=true via /api/test-mode"; \
	echo "Running Playwright E2E tests..."; \
	PLAYWRIGHT_EXTERNAL_SERVER=1 PLAYWRIGHT_E2E_LOCAL=1 npx playwright test

ensure-tools:
	@set -euo pipefail; \
	missing=0; \
	if ! command -v node >/dev/null 2>&1; then \
		echo "Missing required tool: node (Node.js)" >&2; \
		echo "Install Node.js 18+ (recommended via nvm):" >&2; \
		echo "  brew install nvm" >&2; \
		echo "  nvm install --lts" >&2; \
		echo "  nvm use --lts" >&2; \
		missing=1; \
	fi; \
	if ! command -v $(NPM) >/dev/null 2>&1; then \
		echo "Missing required tool: $(NPM) (npm)" >&2; \
		echo "npm is normally installed with Node.js. Reinstall Node.js 18+ if needed." >&2; \
		missing=1; \
	fi; \
	if ! command -v $(SUPABASE) >/dev/null 2>&1; then \
		echo "Missing required tool: $(SUPABASE) (Supabase CLI)" >&2; \
		echo "Install Supabase CLI (macOS/Homebrew):" >&2; \
		echo "  brew install supabase/tap/supabase" >&2; \
		echo "Or see: https://supabase.com/docs/guides/cli/getting-started" >&2; \
		missing=1; \
	fi; \
	if ! command -v $(DOCKER) >/dev/null 2>&1; then \
		echo "Missing required tool: $(DOCKER) (Docker Desktop / Docker Engine)" >&2; \
		echo "Install Docker Desktop and make sure it is running before 'make up'." >&2; \
		echo "  https://www.docker.com/products/docker-desktop/" >&2; \
		missing=1; \
	fi; \
	if [ "$$missing" -ne 0 ]; then \
		exit 1; \
	fi; \
	if ! $(DOCKER) info >/dev/null 2>&1; then \
		echo "Docker is installed but not reachable. Start Docker Desktop, then rerun 'make up'." >&2; \
		exit 1; \
	fi; \
	if ! command -v $(PSQL) >/dev/null 2>&1; then \
		echo "Warning: $(PSQL) not found. Migration/seed checks may be skipped." >&2; \
		echo "Install PostgreSQL client tools for better local checks (optional)." >&2; \
	fi

ensure-db-ready:
	@set -euo pipefail; \
	if ! command -v $(PSQL) >/dev/null 2>&1; then \
		echo "Skipping DB readiness check (psql not installed)."; \
		exit 0; \
	fi; \
	echo "Waiting for Postgres on $(DB_HOST):$(DB_PORT)..."; \
	for i in $$(seq 1 30); do \
		if PGPASSWORD="$(DB_PASSWORD)" $(PSQL) -h "$(DB_HOST)" -p "$(DB_PORT)" -U "$(DB_USER)" -d "$(DB_NAME)" -Atqc "select 1" >/dev/null 2>&1; then \
			echo "Postgres is ready."; \
			exit 0; \
		fi; \
		sleep 1; \
	done; \
	echo "Timed out waiting for Postgres on $(DB_HOST):$(DB_PORT)" >&2; \
	exit 1

ensure-migrations: ## Apply migrations only if app schema is missing
	@set -euo pipefail; \
	if ! command -v $(PSQL) >/dev/null 2>&1; then \
		echo "Skipping migration check (psql not installed)."; \
		exit 0; \
	fi; \
	has_orders=$$(PGPASSWORD="$(DB_PASSWORD)" $(PSQL) -h "$(DB_HOST)" -p "$(DB_PORT)" -U "$(DB_USER)" -d "$(DB_NAME)" -Atqc "select exists (select 1 from information_schema.tables where table_schema='public' and table_name='orders');" 2>/dev/null || echo "f"); \
	if [ "$$has_orders" = "t" ]; then \
		echo "Schema detected; skipping migrations."; \
		exit 0; \
	fi; \
	if [ -z "$(MIGRATIONS)" ]; then \
		echo "No migration files found in supabase/migrations/"; \
		exit 0; \
	fi; \
	echo "No schema detected; applying migrations..."; \
	for file in $(MIGRATIONS); do \
		echo "  -> $$file"; \
		PGPASSWORD="$(DB_PASSWORD)" $(PSQL) -v ON_ERROR_STOP=1 -h "$(DB_HOST)" -p "$(DB_PORT)" -U "$(DB_USER)" -d "$(DB_NAME)" -f "$$file"; \
	done; \
	echo "Migrations applied."

ensure-seed: ## Apply seed.sql only if key tables appear empty
	@set -euo pipefail; \
	if ! command -v $(PSQL) >/dev/null 2>&1; then \
		echo "Skipping seed check (psql not installed)."; \
		exit 0; \
	fi; \
	if [ ! -f "$(SEED_SQL)" ]; then \
		echo "No seed file found at $(SEED_SQL); skipping."; \
		exit 0; \
	fi; \
	has_customers_table=$$(PGPASSWORD="$(DB_PASSWORD)" $(PSQL) -h "$(DB_HOST)" -p "$(DB_PORT)" -U "$(DB_USER)" -d "$(DB_NAME)" -Atqc "select exists (select 1 from information_schema.tables where table_schema='public' and table_name='customers');" 2>/dev/null || echo "f"); \
	if [ "$$has_customers_table" != "t" ]; then \
		echo "Customers table not found; skipping seed check (migrations likely not applied)."; \
		exit 0; \
	fi; \
	customer_count=$$(PGPASSWORD="$(DB_PASSWORD)" $(PSQL) -h "$(DB_HOST)" -p "$(DB_PORT)" -U "$(DB_USER)" -d "$(DB_NAME)" -Atqc "select count(*) from public.customers;" 2>/dev/null || echo "0"); \
	if [ "$$customer_count" != "0" ]; then \
		echo "Seed data detected (customers=$$customer_count); skipping seed.sql."; \
		exit 0; \
	fi; \
	echo "No seed data detected; applying $(SEED_SQL)..."; \
	PGPASSWORD="$(DB_PASSWORD)" $(PSQL) -v ON_ERROR_STOP=1 -h "$(DB_HOST)" -p "$(DB_PORT)" -U "$(DB_USER)" -d "$(DB_NAME)" -f "$(SEED_SQL)"; \
	echo "Seed data applied."

ensure-minio-seed:
	@set -euo pipefail; \
	if [ ! -f supabase/seed-minio.cjs ]; then \
		echo "No MinIO seed script found; skipping."; \
		exit 0; \
	fi; \
	code=$$(curl -sS -o /dev/null --max-time 2 -w "%{http_code}" "$(SUPABASE_STORAGE_S3_URL)" || true); \
	if [ -z "$$code" ] || [ "$$code" = "000" ]; then \
		echo "Supabase S3 endpoint is not reachable at $(SUPABASE_STORAGE_S3_URL); skipping MinIO seed."; \
		exit 0; \
	fi; \
	echo "Seeding MinIO assets (idempotent overwrite is OK)..."; \
	set -a; \
	[ -f "$(ENV_LOCAL)" ] && . "$(ENV_LOCAL)" || true; \
	set +a; \
	S3_ENDPOINT="$${S3_ENDPOINT:-$(SUPABASE_STORAGE_S3_URL)}" \
	S3_ACCESS_KEY="$${S3_ACCESS_KEY:-$${APP_AWS_ACCESS_KEY_ID:-}}" \
	S3_SECRET_KEY="$${S3_SECRET_KEY:-$${APP_AWS_SECRET_ACCESS_KEY:-}}" \
	S3_BUCKET_NAME="$${S3_BUCKET_NAME:-tagme-dev}" \
	node ./supabase/seed-minio.cjs

env-local: ## Update local-only overrides in .env.local from local stack defaults/Supabase status
	@set -euo pipefail; \
	touch "$(ENV_LOCAL)"; \
	tmp=$$(mktemp); \
	trap 'rm -f "$$tmp" "$$tmp.keys"' EXIT; \
	cp "$(ENV_LOCAL)" "$$tmp"; \
	supabase_env=$$(mktemp); \
	if command -v $(SUPABASE) >/dev/null 2>&1 && $(SUPABASE) status -o env > "$$supabase_env" 2>/dev/null; then \
		get_env_val() { sed -n "s/^$$1=//p" "$$supabase_env" | tail -1 | sed 's/^\"//; s/\"$$//'; }; \
		api_url=$$(get_env_val API_URL); \
		anon_key=$$(get_env_val ANON_KEY); \
		service_key=$$(get_env_val SERVICE_ROLE_KEY); \
		s3_url=$$(get_env_val STORAGE_S3_URL); \
		s3_access_key=$$(get_env_val S3_PROTOCOL_ACCESS_KEY_ID); \
		s3_secret_key=$$(get_env_val S3_PROTOCOL_ACCESS_KEY_SECRET); \
		s3_region=$$(get_env_val S3_PROTOCOL_REGION); \
	else \
		api_url=""; \
		anon_key=""; \
		service_key=""; \
		s3_url=""; \
		s3_access_key=""; \
		s3_secret_key=""; \
		s3_region=""; \
	fi; \
	rm -f "$$supabase_env"; \
	{ \
		echo "NETLIFY_SITE_URL=$(NETLIFY_DEV_URL)"; \
		echo "SUPABASE_URL=$${api_url:-$(SUPABASE_API_URL)}"; \
		echo "PROJECT_URL=$${api_url:-$(SUPABASE_API_URL)}"; \
		[ -n "$$anon_key" ] && echo "SUPABASE_ANON_KEY=$$anon_key" || true; \
		[ -n "$$service_key" ] && echo "SUPABASE_SERVICE_ROLE_KEY=$$service_key" || true; \
		[ -n "$$service_key" ] && echo "SUPABASE_KEY=$$service_key" || true; \
		echo "SUPABASE_PREFER_LOCAL=true"; \
		echo "APP_AWS_ACCESS_KEY_ID=$${APP_AWS_ACCESS_KEY_ID:-$${s3_access_key:-minioadmin}}"; \
		echo "APP_AWS_SECRET_ACCESS_KEY=$${APP_AWS_SECRET_ACCESS_KEY:-$${s3_secret_key:-minioadmin123}}"; \
		echo "APP_AWS_REGION=$${APP_AWS_REGION:-$${s3_region:-us-east-1}}"; \
		echo "VITE_AWS_S3_BUCKET_NAME=$${VITE_AWS_S3_BUCKET_NAME:-tagme-dev}"; \
		echo "VITE_AWS_S3_BUCKET_URL=$${VITE_AWS_S3_BUCKET_URL:-$(MINIO_PUBLIC_URL)}"; \
		echo "S3_ENDPOINT=$${S3_ENDPOINT:-$${s3_url:-$(SUPABASE_STORAGE_S3_URL)}}"; \
		echo "S3_ACCESS_KEY=$${S3_ACCESS_KEY:-$${s3_access_key:-minioadmin}}"; \
		echo "S3_SECRET_KEY=$${S3_SECRET_KEY:-$${s3_secret_key:-minioadmin123}}"; \
		echo "S3_BUCKET_NAME=$${S3_BUCKET_NAME:-tagme-dev}"; \
	} > "$$tmp.keys"; \
	while IFS='=' read -r key value; do \
		[ -n "$$key" ] || continue; \
		if grep -qE "^$${key}=" "$$tmp"; then \
			sed -i.bak "s|^$${key}=.*|$${key}=$${value}|" "$$tmp"; \
			rm -f "$$tmp.bak"; \
		else \
			printf "\n%s=%s\n" "$$key" "$$value" >> "$$tmp"; \
		fi; \
	done < "$$tmp.keys"; \
	mv "$$tmp" "$(ENV_LOCAL)"; \
	echo "Updated $(ENV_LOCAL) with local Supabase/MinIO/Netlify settings."

migrate: ensure-db-ready ## Force-apply all SQL migrations in supabase/migrations
	@set -euo pipefail; \
	if [ -z "$(MIGRATIONS)" ]; then \
		echo "No migration files found."; \
		exit 0; \
	fi; \
	for file in $(MIGRATIONS); do \
		echo "Applying $$file"; \
		PGPASSWORD="$(DB_PASSWORD)" $(PSQL) -v ON_ERROR_STOP=1 -h "$(DB_HOST)" -p "$(DB_PORT)" -U "$(DB_USER)" -d "$(DB_NAME)" -f "$$file"; \
	done

seed: ensure-db-ready ## Force-apply supabase/seed.sql
	@PGPASSWORD="$(DB_PASSWORD)" $(PSQL) -v ON_ERROR_STOP=1 -h "$(DB_HOST)" -p "$(DB_PORT)" -U "$(DB_USER)" -d "$(DB_NAME)" -f "$(SEED_SQL)"

init-minio: ## Print/localize MinIO defaults (bucket is created by Supabase local storage stack)
	@set -euo pipefail; \
	code=$$(curl -sS -o /dev/null --max-time 2 -w "%{http_code}" "$(SUPABASE_STORAGE_S3_URL)" || true); \
	if [ -n "$$code" ] && [ "$$code" != "000" ]; then \
		echo "Supabase S3 endpoint reachable at $(SUPABASE_STORAGE_S3_URL) (HTTP $$code)"; \
	else \
		echo "Supabase S3 endpoint not reachable at $(SUPABASE_STORAGE_S3_URL) (continuing)"; \
	fi

seed-minio: ensure-minio-seed ## Seed MinIO assets

psql-check: ## Check direct Postgres connectivity
	@PGPASSWORD="$(DB_PASSWORD)" $(PSQL) -h "$(DB_HOST)" -p "$(DB_PORT)" -U "$(DB_USER)" -d "$(DB_NAME)" -Atqc "select version();"

add-admin: ensure-db-ready ## Prompt for an admin email and add it to admin_users_auth0 (use EMAIL=... to skip prompt)
	@set -euo pipefail; \
	email="$${EMAIL:-}"; \
	if [ -z "$$email" ]; then \
		read -r -p "Admin email to add: " email; \
	fi; \
	email="$$(printf '%s' "$$email" | tr -d '\r' | xargs)"; \
	if [ -z "$$email" ]; then \
		echo "Email is required."; \
		exit 1; \
	fi; \
	if ! printf '%s' "$$email" | grep -Eq '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$$'; then \
		echo "Invalid email format: $$email"; \
		exit 1; \
	fi; \
	escaped_email="$${email//\'/\'\'}"; \
	result=$$(PGPASSWORD="$(DB_PASSWORD)" $(PSQL) -h "$(DB_HOST)" -p "$(DB_PORT)" -U "$(DB_USER)" -d "$(DB_NAME)" -Atq \
		-c "WITH ins AS (INSERT INTO public.admin_users_auth0 (email) VALUES ('$$escaped_email') ON CONFLICT (email) DO NOTHING RETURNING email) SELECT CASE WHEN EXISTS (SELECT 1 FROM ins) THEN 'inserted' ELSE 'exists' END;"); \
	if [ "$$result" = "inserted" ]; then \
		echo "Added admin user: $$email"; \
	else \
		echo "Admin user already exists: $$email"; \
	fi
