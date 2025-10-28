#!/bin/bash

# Reset test database script
# This script drops and recreates all tables in the test database
# Used to ensure a clean state between test runs

set -e

echo "Resetting test database..."

# Database connection details
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-54422}"
DB_NAME="${DB_NAME:-postgres_test}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"

# Export password for psql
export PGPASSWORD=$DB_PASSWORD

# Function to execute SQL
execute_sql() {
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$1"
}

# Drop all tables
echo "Dropping existing tables..."
execute_sql "DROP TABLE IF EXISTS card_assets CASCADE;"
execute_sql "DROP TABLE IF EXISTS cards CASCADE;"
execute_sql "DROP TABLE IF EXISTS customers CASCADE;"
execute_sql "DROP TABLE IF EXISTS orders CASCADE;"
execute_sql "DROP TABLE IF EXISTS admin_users_auth0 CASCADE;"

# Drop functions
echo "Dropping functions..."
execute_sql "DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;"

# Recreate schema by running migrations
echo "Recreating schema..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$0")/migrations/000_complete_schema.sql"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$0")/migrations/001_add_order_fulfillment_fields.sql"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$0")/migrations/002_cleanup_cards_schema.sql"

echo "Test database reset complete!"



