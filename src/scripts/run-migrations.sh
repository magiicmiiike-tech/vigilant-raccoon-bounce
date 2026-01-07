#!/bin/bash
# src/scripts/run-migrations.sh

set -e

echo "Starting database migrations..."

# Check environment
if [ -z "$NODE_ENV" ]; then
  echo "NODE_ENV not set, defaulting to development"
  export NODE_ENV=development
fi

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Function to run migrations for a database
run_migrations() {
  local db_name=$1
  local data_source_path=$2
  local data_source_name=$3
  
  echo "Running migrations for $db_name database using $data_source_name..."
  
  npx typeorm migration:run -d "$data_source_path#$data_source_name"
  
  if [ $? -eq 0 ]; then
    echo "✓ $db_name migrations completed"
  else
    echo "✗ $db_name migrations failed"
    exit 1
  fi
}

# Run migrations for each database in dependency order
# Tenants must be first as other databases reference tenant_id
run_migrations "tenants" "src/config/typeorm.config.ts" "tenantsDataSource"
run_migrations "auth" "src/config/typeorm.config.ts" "authDataSource"
run_migrations "telephony" "src/config/typeorm.config.ts" "telephonyDataSource"
run_migrations "billing" "src/config/typeorm.config.ts" "billingDataSource"
run_migrations "analytics" "src/config/typeorm.config.ts" "analyticsDataSource"
run_migrations "emergency" "src/config/typeorm.config.ts" "emergencyDataSource"

echo "All database migrations completed successfully!"