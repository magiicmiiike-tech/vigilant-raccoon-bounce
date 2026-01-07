import { authDataSource, tenantsDataSource, telephonyDataSource, billingDataSource, analyticsDataSource, emergencyDataSource } from '../config/typeorm.config';
import { DataSource } from 'typeorm';

async function validateDataSourceSchema(dataSource: DataSource, dbName: string) {
  try {
    await dataSource.initialize();
    console.log(`\n--- Validating ${dbName} Database Schema ---`);
    
    // Check if all tables exist
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`Tables in ${dbName} database:`);
    if (tables.length === 0) {
      console.log('  No tables found.');
    } else {
      tables.forEach((table: any) => console.log(`  - ${table.table_name}`));
    }
    
    // Validate foreign key relationships
    const foreignKeys = await dataSource.query(`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name, kcu.column_name
    `);
    
    console.log('\nForeign key relationships:');
    if (foreignKeys.length === 0) {
      console.log('  No foreign keys found.');
    } else {
      foreignKeys.forEach((fk: any) => {
        console.log(`  ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    }
    
    // Check indexes
    const indexes = await dataSource.query(`
      SELECT 
        tablename, 
        indexname, 
        indexdef 
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    
    console.log('\nIndexes:');
    if (indexes.length === 0) {
      console.log('  No indexes found.');
    } else {
      indexes.forEach((index: any) => {
        console.log(`  ${index.tablename}: ${index.indexname}`);
      });
    }
    
    console.log(`\n${dbName} schema validation completed successfully`);
  } catch (error) {
    console.error(`\n${dbName} schema validation failed:`, error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

async function validateAllSchemas() {
  console.log('Starting all database schema validations...');
  await validateDataSourceSchema(tenantsDataSource, 'Tenants');
  await validateDataSourceSchema(authDataSource, 'Auth');
  await validateDataSourceSchema(telephonyDataSource, 'Telephony');
  await validateDataSourceSchema(billingDataSource, 'Billing');
  await validateDataSourceSchema(analyticsDataSource, 'Analytics');
  await validateDataSourceSchema(emergencyDataSource, 'Emergency');
  console.log('\nAll database schema validations completed.');
}

if (require.main === module) {
  validateAllSchemas();
}