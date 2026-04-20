-- Add soft-delete support for product table (PostgreSQL)
-- Safe to run multiple times.

ALTER TABLE product
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

-- Optional helper index for active product queries.
CREATE INDEX IF NOT EXISTS idx_product_deleted_at ON product(deleted_at);
