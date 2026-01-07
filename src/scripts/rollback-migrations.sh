#!/bin/bash
# src/scripts/rollback-migrations.sh

set -e

echo "Starting migration rollback..."

# Check environment
if [ -z "$NODE_ENV" ]; then
  echo "NODE_ENV not set, defaulting to development"
  export NODE_ENV=development
fi

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Function to rollback migrations for a database
rollback_migrations() {
  local db_name=$1
  local data_source_path=$2
  local data_source_name=$3
  
  echo "Rolling back migrations for $db_name database using $data_source_name..."
  
  read -p "Are you sure you want to rollback $db_name migrations? (y/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Skipping $db_name rollback"
    return
  fi
  
  npx typeorm migration:revert -d "$data_source_path#$data_source_name"
  
  if [ $? -eq 0 ]; then
    echo "✓ $db_name rollback completed"
  else
    echo "✗ $db_name rollback failed"
    exit 1
  fi
}

# Rollback in reverse order (respect dependencies)
rollback_migrations "emergency" "src/config/typeorm.config.ts" "emergencyDataSource"
rollback_migrations "analytics" "src/config/typeorm.config.ts" "analyticsDataSource"
rollback_migrations "billing" "src/config/typeorm.config.ts" "billingDataSource"
rollback_migrations "telephony" "src/config/typeorm.config.ts" "telephonyDataSource"
rollback_migrations "auth" "src/config/typeorm.config.ts" "authDataSource"
rollback_migrations "tenants" "src/config/typeorm.config.ts" "tenantsDataSource"

echo "Migration rollback completed!"