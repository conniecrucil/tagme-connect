# Makefile for Netlify POC Testing Suite
# Provides easy commands for development, testing, and Docker management

.PHONY: help install dev dev-stop test test-headed test-ui test-docker clean docker-build docker-up docker-down docker-logs test-basic test-core test-admin-create test-admin-modify test-all

# Default target
help: ## Show this help message
	@echo "Netlify POC Testing Suite"
	@echo "========================"
	@echo ""
	@echo "Available commands:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development commands
install: ## Install dependencies
	@echo "📦 Installing dependencies..."
	npm install
	npx playwright install

dev: ## Start development environment (Docker services + Netlify dev)
	@echo "🚀 Starting development environment..."
	@if [ ! -f ".env" ]; then \
		echo "❌ Error: .env file not found!"; \
		echo "Please run 'make setup-env' to create a .env file with default values."; \
		echo "Then edit the .env file with your actual API keys and configuration."; \
		exit 1; \
	fi
	@echo "📦 Starting Docker services..."
	docker-compose -f docker-compose.dev.yml up -d
	@echo "⏳ Waiting for services to be ready..."
	@sleep 5
	@echo "🔍 Checking service health..."
	@until docker-compose -f docker-compose.dev.yml ps | grep -q "healthy\|Up"; do \
		echo "⏳ Waiting for services..."; \
		sleep 2; \
	done
	@echo "✅ Docker services are ready!"
	@echo "🌱 Seeding MinIO with fake data..."
	@sleep 3
	@node supabase/seed-minio.cjs || echo "⚠️  MinIO seeding failed, continuing..."
	@if lsof -Pi :8888 -sTCP:LISTEN -t >/dev/null 2>&1; then \
		echo "⚠️  Port 8888 is already in use. Stopping existing process..."; \
		lsof -ti:8888 | xargs kill -9 2>/dev/null || true; \
		sleep 2; \
	fi
	@echo "🌐 Starting Netlify dev server on port 8888..."
	netlify dev --port 8888

dev-stop: ## Stop development environment (Docker services)
	@echo "🛑 Stopping development environment..."
	@if lsof -Pi :8888 -sTCP:LISTEN -t >/dev/null 2>&1; then \
		echo "🛑 Stopping Netlify dev server..."; \
		lsof -ti:8888 | xargs kill -9 2>/dev/null || true; \
	fi
	@echo "🐳 Stopping Docker services..."
	docker-compose -f docker-compose.dev.yml down --volumes
	@echo "✅ Development environment stopped!"

dev-down: ## Stop development environment (alias for dev-stop)
	@make dev-stop

dev-logs: ## Show logs from development environment
	@echo "📋 Showing development environment logs..."
	docker-compose -f docker-compose.dev.yml logs -f

dev-logs-netlify: ## Show logs from Netlify dev server only
	@echo "📋 Showing Netlify dev server logs..."
	docker-compose -f docker-compose.dev.yml logs -f netlify-dev

dev-logs-minio: ## Show logs from MinIO dev service only
	@echo "📋 Showing MinIO dev service logs..."
	docker-compose -f docker-compose.dev.yml logs -f minio

dev-logs-db: ## Show logs from database services only
	@echo "📋 Showing database service logs..."
	docker-compose -f docker-compose.dev.yml logs -f postgres postgrest

# Testing commands
test: ## Run all Playwright tests headlessly (no human interaction needed)
	@echo "🧪 Running Playwright tests headlessly..."
	npx playwright test --headed=false

test-headed: ## Run Playwright tests with browser UI visible (requires human interaction)
	@echo "🧪 Running Playwright tests with browser UI..."
	npx playwright test --headed

test-ui: ## Run Playwright tests in UI mode
	@echo "🧪 Running Playwright tests in UI mode..."
	npx playwright test --ui

test-ci: ## Run tests in CI mode (fully automated, no browser UI)
	@echo "🤖 Running tests in CI mode..."
	CI=true npx playwright test --workers=1

test-basic: ## Run basic card purchase test only
	@echo "🧪 Running basic card purchase test..."
	npx playwright test tests/basic-card-purchase.spec.ts

test-core: ## Run TAG Core card purchase test only
	@echo "🧪 Running TAG Core card purchase test..."
	npx playwright test tests/tag-core-card-purchase.spec.ts

test-admin-create: ## Run admin create card test only
	@echo "🧪 Running admin create card test..."
	npx playwright test tests/admin-create-card.spec.ts

test-admin-modify: ## Run admin modify card test only
	@echo "🧪 Running admin modify card test..."
	npx playwright test tests/admin-modify-card.spec.ts

test-all: ## Run all tests individually (for debugging)
	@echo "🧪 Running all tests individually..."
	@echo "Running basic card test..."
	npx playwright test tests/basic-card-purchase.spec.ts
	@echo "Running TAG Core card test..."
	npx playwright test tests/tag-core-card-purchase.spec.ts
	@echo "Running admin create test..."
	npx playwright test tests/admin-create-card.spec.ts
	@echo "Running admin modify test..."
	npx playwright test tests/admin-modify-card.spec.ts

# Docker commands
docker-build: ## Build Docker images
	@echo "🐳 Building Docker images..."
	docker-compose build

docker-up: ## Start Docker containers
	@echo "🐳 Starting Docker containers..."
	docker-compose up -d

docker-down: ## Stop Docker containers
	@echo "🐳 Stopping Docker containers..."
	docker-compose down

docker-logs: ## Show Docker container logs
	@echo "🐳 Showing Docker container logs..."
	docker-compose logs -f

test-docker: ## Run tests in Docker environment
	@echo "🐳 Running tests in Docker environment..."
	docker-compose -f docker-compose.test.yml up --build playwright-tests

test-logs: ## Show logs from test environment
	@echo "📋 Showing test environment logs..."
	docker-compose -f docker-compose.test.yml logs -f

test-logs-netlify: ## Show logs from Netlify test server only
	@echo "📋 Showing Netlify test server logs..."
	docker-compose -f docker-compose.test.yml logs -f netlify-test

test-logs-minio: ## Show logs from MinIO test service only
	@echo "📋 Showing MinIO test service logs..."
	docker-compose -f docker-compose.test.yml logs -f minio-test

test-logs-db: ## Show logs from test database services only
	@echo "📋 Showing test database service logs..."
	docker-compose -f docker-compose.test.yml logs -f postgres-test postgrest-test

# MinIO console commands
minio-console-dev: ## Open MinIO console for development environment
	@echo "🌐 Opening MinIO development console..."
	@echo "URL: http://localhost:9001"
	@echo "Username: minioadmin"
	@echo "Password: minioadmin123"
	@open http://localhost:9001 || echo "Please open http://localhost:9001 in your browser"

minio-console-test: ## Open MinIO console for test environment
	@echo "🌐 Opening MinIO test console..."
	@echo "URL: http://localhost:9003"
	@echo "Username: miniotest"
	@echo "Password: miniotest123"
	@open http://localhost:9003 || echo "Please open http://localhost:9003 in your browser"

# MinIO seeding commands
seed-minio: ## Seed MinIO with fake VCF files and HTML content
	@echo "🌱 Seeding MinIO with fake data..."
	@node supabase/seed-minio.cjs

seed-minio-test: ## Seed MinIO test environment with fake data
	@echo "🌱 Seeding MinIO test environment with fake data..."
	@S3_ENDPOINT=http://localhost:9002 S3_ACCESS_KEY=miniotest S3_SECRET_KEY=miniotest123 S3_BUCKET_NAME=tagme-test node supabase/seed-minio.cjs

# Combined commands
dev-test: ## Start dev server and run tests (requires two terminals)
	@echo "🚀 Starting dev server and running tests..."
	@echo "This will start the dev server in the background and run tests."
	@echo "Press Ctrl+C to stop both processes."
	@if lsof -Pi :8888 -sTCP:LISTEN -t >/dev/null 2>&1; then \
		echo "⚠️  Port 8888 is already in use. Stopping existing process..."; \
		lsof -ti:8888 | xargs kill -9 2>/dev/null || true; \
		sleep 2; \
	fi
	@echo "Starting Netlify dev server..."
	netlify dev --port 8888 &
	@echo "Waiting for server to start..."
	sleep 10
	@echo "Running tests..."
	npx playwright test
	@echo "Stopping dev server..."
	pkill -f "netlify dev" || true

# Cleanup commands
clean: ## Clean up test artifacts and containers
	@echo "🧹 Cleaning up..."
	docker-compose down --volumes --remove-orphans 2>/dev/null || true
	docker system prune -f 2>/dev/null || true
	rm -rf playwright-report test-results 2>/dev/null || true
	rm -rf temp-cart-data/*.json 2>/dev/null || true

clean-docker: ## Clean up Docker images and containers
	@echo "🧹 Cleaning up Docker resources..."
	docker-compose down --volumes --remove-orphans
	docker system prune -af
	docker volume prune -f

# Environment setup
setup: ## Initial setup (install dependencies and check environment)
	@echo "🔧 Setting up development environment..."
	@if [ ! -f ".env" ]; then \
		echo "❌ Error: .env file not found!"; \
		echo "Please run './setup-env.sh' to create a .env file with default values."; \
		echo "Then edit the .env file with your actual API keys and configuration."; \
		echo "See ENVIRONMENT_VARIABLES.md for details."; \
		exit 1; \
	fi
	@echo "✅ .env file found"
	@if ! command -v netlify &> /dev/null; then \
		echo "📦 Installing Netlify CLI..."; \
		npm install -g netlify-cli; \
	fi
	@echo "✅ Netlify CLI available"
	@if ! command -v docker &> /dev/null; then \
		echo "❌ Error: Docker not found!"; \
		echo "Please install Docker and Docker Compose."; \
		exit 1; \
	fi
	@echo "✅ Docker available"
	@echo "🎉 Environment setup complete!"

setup-env: ## Create .env file with default values
	@echo "🔧 Creating .env file with default values..."
	@./setup-env.sh

# Status commands
status: ## Check status of services
	@echo "📊 Service Status:"
	@echo "=================="
	@if lsof -Pi :8888 -sTCP:LISTEN -t >/dev/null 2>&1; then \
		echo "✅ Netlify dev server: Running on port 8888"; \
	else \
		echo "❌ Netlify dev server: Not running"; \
	fi
	@if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "tagme-"; then \
		echo "✅ Docker dev containers: Running"; \
		docker ps --format "table {{.Names}}\t{{.Status}}" | grep "tagme-"; \
	else \
		echo "❌ Docker dev containers: Not running"; \
	fi
	@if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "netlify-poc"; then \
		echo "✅ Docker test containers: Running"; \
		docker ps --format "table {{.Names}}\t{{.Status}}" | grep "netlify-poc"; \
	else \
		echo "❌ Docker test containers: Not running"; \
	fi
	@echo ""
	@echo "🌐 MinIO Services:"
	@if lsof -Pi :9000 -sTCP:LISTEN -t >/dev/null 2>&1; then \
		echo "✅ MinIO dev API: Running on port 9000"; \
		echo "   Console: http://localhost:9001"; \
		echo "   Website hosting: http://localhost:9010"; \
	else \
		echo "❌ MinIO dev API: Not running"; \
	fi
	@if lsof -Pi :9002 -sTCP:LISTEN -t >/dev/null 2>&1; then \
		echo "✅ MinIO test API: Running on port 9002"; \
		echo "   Console: http://localhost:9003"; \
		echo "   Website hosting: http://localhost:9011"; \
	else \
		echo "❌ MinIO test API: Not running"; \
	fi

# Quick development workflow
quick-test: ## Quick test run (start server, test, cleanup)
	@echo "⚡ Quick test run..."
	@make clean
	@make dev-test
	@make clean

# Production-like testing
prod-test: ## Run tests in production-like Docker environment
	@echo "🏭 Running production-like tests..."
	@make docker-build
	@make test-docker
	@make clean-docker

# Debug commands
debug-test: ## Run a single test with debug output
	@echo "🐛 Running test with debug output..."
	npx playwright test --debug

debug-ui: ## Run tests in debug UI mode
	@echo "🐛 Running tests in debug UI mode..."
	npx playwright test --ui --debug

# Report commands
report: ## Open test report in browser (includes videos and traces)
	@echo "📊 Opening test report..."
	@if [ -f "playwright-report/index.html" ]; then \
		open playwright-report/index.html; \
		echo "🎥 Videos and traces will be available in the report"; \
	else \
		echo "❌ No test report found. Run tests first."; \
	fi

show-results: ## Show test results directory structure
	@echo "📁 Test Results Structure:"
	@find test-results playwright-report -type f -name "*.webm" -o -name "*.png" -o -name "*.zip" 2>/dev/null | head -10 || echo "No video/screenshot files found"
	@echo ""
	@echo "📊 Test Reports:"
	@ls -la playwright-report/ 2>/dev/null || echo "No report directory found"

# Environment validation
validate-env: ## Validate environment variables
	@echo "🔍 Validating environment variables..."
	@if [ ! -f ".env" ]; then \
		echo "❌ .env file not found"; \
		exit 1; \
	fi
	@echo "✅ .env file exists"
	@echo "📋 Required variables:"
	@echo "  - STRIPE_SECRET_KEY"
	@echo "  - STRIPE_PUBLISHABLE_KEY" 
	@echo "  - RESEND_API_KEY"
	@echo "  - EMAIL_FROM"
	@echo "  - ADMIN_EMAIL"
	@echo "  - COMPANY_NAME"
	@echo "  - COMPANY_WEBSITE"
	@echo "  - APP_AWS_ACCESS_KEY_ID"
	@echo "  - APP_AWS_SECRET_ACCESS_KEY"
	@echo "  - APP_AWS_REGION"
	@echo "  - APP_AWS_S3_BUCKET_NAME"
	@echo "  - ADMIN_USER"
	@echo "  - ADMIN_PASS"
	@echo "  - NETLIFY_SITE_URL"
