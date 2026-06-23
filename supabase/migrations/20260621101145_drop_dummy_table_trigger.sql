DROP TRIGGER IF EXISTS set_dummy_table_updated_at ON dummy_table;
DROP FUNCTION IF EXISTS update_dummy_table_updated_at();
DROP TABLE IF EXISTS dummy_table CASCADE;
