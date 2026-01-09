-- unity_catalog.sql (DEPRECATED for MSSQL editors)
-- Use `unity_catalog.databricks.sql` for Databricks/Spark SQL execution.
-- The original Unity Catalog DDL has been copied to `unity_catalog.databricks.sql`.
-- This file remains for human reference and is intentionally left as-is to avoid MSSQL-specific validation errors.

-- Original DDL begins below (see .databricks.sql for exact Databricks-compatible file).
-- 2. Create schemas for different data types
CREATE SCHEMA IF NOT EXISTS dukat_voice_catalog.raw_data
COMMENT 'Raw unstructured data from all tenants'
WITH ( 
    DBPROPERTIES (
        'retention_days' = '90',
        'encryption' = 'enabled',
        'audit_enabled' = 'true'
    )
);

CREATE SCHEMA IF NOT EXISTS dukat_voice_catalog.processed_data
COMMENT 'Processed and enriched data'
WITH ( 
    DBPROPERTIES (
        'retention_days' = '365',
        'encryption' = 'enabled',
        'quality_checks' = 'enabled'
    )
);

CREATE SCHEMA IF NOT EXISTS dukat_voice_catalog.feature_store
COMMENT 'ML feature store for AI training'
WITH ( 
    DBPROPERTIES (
        'retention_days' = '730',
        'versioning' = 'enabled',
        'lineage_tracking' = 'enabled'
    )
);

-- 3. Create main tables with governance
CREATE OR REPLACE TABLE dukat_voice_catalog.raw_data.unstructured_assets
(
    tenant_id STRING NOT NULL,
    asset_id STRING NOT NULL,
    asset_type STRING NOT NULL, -- audio, video, text, image
    source_path STRING,
    content BINARY,
    metadata MAP<STRING, STRING>,
    ingestion_timestamp TIMESTAMP,
    ingestion_batch_id STRING,
    quality_score DOUBLE,
    compliance_status STRING,
    
    -- Partitioning for performance
    CONSTRAINT valid_tenant CHECK (tenant_id IS NOT NULL),
    CONSTRAINT valid_asset_type CHECK (asset_type IN ('audio', 'video', 'text', 'image'))
)
USING DELTA
PARTITIONED BY (tenant_id, asset_type, date(ingestion_timestamp))
TBLPROPERTIES (
    'delta.dataSkippingNumIndexedCols' = '5',
    'delta.enableChangeDataFeed' = 'true',
    'delta.autoOptimize.optimizeWrite' = 'true',
    'delta.autoOptimize.autoCompact' = 'true'
)
COMMENT 'Raw unstructured assets from all tenants with governance';

-- 4. Create processed data table
CREATE OR REPLACE TABLE dukat_voice_catalog.processed_data.embeddings
(
    tenant_id STRING NOT NULL,
    asset_id STRING NOT NULL,
    embedding_type STRING NOT NULL, -- text, audio, video
    embedding_vector ARRAY<FLOAT>,
    model_version STRING,
    inference_timestamp TIMESTAMP,
    confidence_score DOUBLE,
    
    -- Foreign key to raw data
    raw_asset_id STRING,
    
    CONSTRAINT fk_raw_asset FOREIGN KEY (tenant_id, raw_asset_id) 
    REFERENCES dukat_voice_catalog.raw_data.unstructured_assets(tenant_id, asset_id)
)
USING DELTA
PARTITIONED BY (tenant_id, embedding_type, date(inference_timestamp))
TBLPROPERTIES (
    'delta.enableChangeDataFeed' = 'true'
);

-- 5. Create feature store table
CREATE OR REPLACE TABLE dukat_voice_catalog.feature_store.conversation_features
(
    tenant_id STRING NOT NULL,
    conversation_id STRING NOT NULL,
    turn_id INTEGER NOT NULL,
    speaker STRING NOT NULL,
    
    -- Text features
    text_embedding ARRAY<FLOAT>,
    sentiment_score DOUBLE,
    emotion_vector ARRAY<FLOAT>,
    intent_class STRING,
    
    -- Audio features
    audio_embedding ARRAY<FLOAT>,
    speech_rate DOUBLE,
    pitch_variance DOUBLE,
    volume_level DOUBLE,
    
    -- Metadata
    feature_timestamp TIMESTAMP,
    model_versions MAP<STRING, STRING>,
    
    PRIMARY KEY (tenant_id, conversation_id, turn_id)
)
USING DELTA
PARTITIONED BY (tenant_id, date(feature_timestamp))
TBLPROPERTIES (
    'delta.enableChangeDataFeed' = 'true',
    'delta.featureStore.timestampColumn' = 'feature_timestamp',
    'delta.featureStore.primaryKeys' = 'tenant_id,conversation_id,turn_id'
);

-- 6. Create data lineage table
CREATE OR REPLACE TABLE dukat_voice_catalog.audit.data_lineage
(
    lineage_id STRING NOT NULL,
    source_table STRING NOT NULL,
    target_table STRING NOT NULL,
    transformation_type STRING NOT NULL,
    transformation_details STRING,
    rows_processed BIGINT,
    processing_timestamp TIMESTAMP,
    processing_job_id STRING,
    success BOOLEAN,
    error_message STRING,
    
    PRIMARY KEY (lineage_id)
)
USING DELTA
PARTITIONED BY (date(processing_timestamp))
COMMENT 'Complete data lineage for compliance and debugging';

-- 7. Create access control table
CREATE OR REPLACE TABLE dukat_voice_catalog.audit.data_access
(
    access_id STRING NOT NULL,
    user_id STRING NOT NULL,
    tenant_id STRING,
    table_name STRING NOT NULL,
    operation STRING NOT NULL,
    access_timestamp TIMESTAMP,
    ip_address STRING,
    user_agent STRING,
    rows_accessed BIGINT,
    query_text STRING,
    
    PRIMARY KEY (access_id)
)
USING DELTA
PARTITIONED BY (date(access_timestamp), tenant_id)
COMMENT 'Complete audit trail for all data access';

-- 8. Create data quality rules table
CREATE OR REPLACE TABLE dukat_voice_catalog.quality.rules
(
    rule_id STRING NOT NULL,
    table_name STRING NOT NULL,
    column_name STRING,
    rule_type STRING NOT NULL, -- completeness, validity, consistency, accuracy
    rule_definition STRING,
    severity STRING, -- critical, warning, info
    active BOOLEAN DEFAULT true,
    
    PRIMARY KEY (rule_id)
)
USING DELTA;

-- 9. Create data quality results table
CREATE OR REPLACE TABLE dukat_voice_catalog.quality.results
(
    result_id STRING NOT NULL,
    rule_id STRING NOT NULL,
    check_timestamp TIMESTAMP,
    table_name STRING,
    failing_rows BIGINT,
    total_rows BIGINT,
    failure_percentage DOUBLE,
    sample_failures ARRAY<STRING>,
    
    PRIMARY KEY (result_id),
    CONSTRAINT fk_rule FOREIGN KEY (rule_id) 
    REFERENCES dukat_voice_catalog.quality.rules(rule_id)
)
USING DELTA
PARTITIONED BY (date(check_timestamp));

-- 10. Create views for common queries
CREATE OR REPLACE VIEW dukat_voice_catalog.monitoring.data_quality_dashboard AS
SELECT 
    r.rule_id,
    r.table_name,
    r.rule_type,
    r.severity,
    q.check_timestamp,
    q.failing_rows,
    q.total_rows,
    q.failure_percentage,
    CASE 
        WHEN q.failure_percentage > 10 AND r.severity = 'critical' THEN 'ALERT'
        WHEN q.failure_percentage > 5 THEN 'WARNING'
        ELSE 'OK'
    END as status
FROM dukat_voice_catalog.quality.rules r
LEFT JOIN dukat_voice_catalog.quality.results q 
    ON r.rule_id = q.rule_id 
    AND q.check_timestamp >= current_timestamp() - INTERVAL '7 days'
WHERE r.active = true;

-- 11. Grant permissions (examples)
GRANT USAGE ON CATALOG dukat_voice_catalog TO `account_users`;
GRANT SELECT ON SCHEMA dukat_voice_catalog.processed_data TO `data_scientists`;
GRANT SELECT, INSERT ON SCHEMA dukat_voice_catalog.feature_store TO `ml_engineers`;
GRANT SELECT ON TABLE dukat_voice_catalog.audit.data_access TO `security_team`;

-- 12. Create retention policies
ALTER TABLE dukat_voice_catalog.raw_data.unstructured_assets 
SET TBLPROPERTIES (
    'delta.logRetentionDuration' = 'interval 30 days',
    'delta.deletedFileRetentionDuration' = 'interval 7 days'
);

-- 13. Enable change data feed for CDC
ALTER TABLE dukat_voice_catalog.processed_data.embeddings 
SET TBLPROPERTIES (delta.enableChangeDataFeed = true);

-- 14. Create optimization schedule (databricks style placeholder)
-- See platform for schedule syntax
