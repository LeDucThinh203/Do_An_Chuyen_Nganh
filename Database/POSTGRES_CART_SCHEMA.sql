-- Idempotent migration for account-specific shopping carts.
BEGIN;

CREATE TABLE IF NOT EXISTS cart (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  product_sizes_id BIGINT NOT NULL REFERENCES product_sizes(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_cart_account_product_size UNIQUE (account_id, product_sizes_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_account_updated
  ON cart (account_id, updated_at DESC, id DESC);

COMMIT;
