-- Run once on an existing Neon/PostgreSQL database to support the backend's
-- filters, cursor pagination, text search, and product/order relationships.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE product ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_product_active_id
  ON product(id DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_product_active_category_id
  ON product(category_id, id DESC) WHERE deleted_at IS NULL;

-- The AI catalog search uses ILIKE '%term%' on both fields; B-tree indexes
-- cannot accelerate these substring filters.
CREATE INDEX IF NOT EXISTS idx_product_name_trgm_active
  ON product USING GIN (name gin_trgm_ops) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_product_description_trgm_active
  ON product USING GIN (description gin_trgm_ops) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_product_category
  ON product(category_id);

-- These lookups are already covered by wider indexes / the UNIQUE constraint.
DROP INDEX IF EXISTS idx_orders_account;
DROP INDEX IF EXISTS idx_product_sizes_product;
DROP INDEX IF EXISTS idx_order_details_order;

CREATE INDEX IF NOT EXISTS idx_orders_created_id
  ON orders(created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_address_account_id
  ON address(account_id, id DESC);

CREATE INDEX IF NOT EXISTS idx_orders_account_created_id
  ON orders(account_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_order_details_product_size
  ON order_details(product_sizes_id);

CREATE INDEX IF NOT EXISTS idx_order_details_order_id
  ON order_details(order_id, id);

CREATE INDEX IF NOT EXISTS idx_rating_order_detail
  ON rating(order_detail_id);

-- Password reset links look up accounts by token. Avoid indexing empty tokens.
CREATE INDEX IF NOT EXISTS idx_account_reset_token
  ON account(reset_token) WHERE reset_token IS NOT NULL;

-- Admin account search uses case-insensitive substring matches on email/name.
CREATE INDEX IF NOT EXISTS idx_account_email_trgm
  ON account USING GIN (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_account_username_trgm
  ON account USING GIN (username gin_trgm_ops);

ANALYZE product;
ANALYZE product_sizes;
ANALYZE orders;
ANALYZE order_details;
ANALYZE address;
ANALYZE rating;
ANALYZE account;
