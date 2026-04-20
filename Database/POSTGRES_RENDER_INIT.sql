-- PostgreSQL init script for Render
-- Run this in Render PostgreSQL -> Query editor before deploying backend.

BEGIN;

CREATE TABLE IF NOT EXISTS account (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'user',
  reset_token TEXT NULL,
  reset_token_expiry TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS category (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL
);

CREATE TABLE IF NOT EXISTS product (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  price NUMERIC(14,2) NOT NULL DEFAULT 0,
  image TEXT NULL,
  category_id BIGINT NULL REFERENCES category(id) ON DELETE SET NULL,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS sizes (
  id BIGSERIAL PRIMARY KEY,
  size VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS product_sizes (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES product(id) ON DELETE CASCADE,
  size_id BIGINT NOT NULL REFERENCES sizes(id) ON DELETE CASCADE,
  stock INTEGER NOT NULL DEFAULT 0,
  UNIQUE(product_id, size_id)
);

CREATE TABLE IF NOT EXISTS address (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NULL REFERENCES account(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  provinceName VARCHAR(255) NULL,
  districtName VARCHAR(255) NULL,
  wardName VARCHAR(255) NULL,
  address_detail TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  address TEXT NOT NULL,
  account_id BIGINT NULL REFERENCES account(id) ON DELETE SET NULL,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(50) NOT NULL DEFAULT 'cod',
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  payment_info TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_details (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_sizes_id BIGINT NOT NULL REFERENCES product_sizes(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS rating (
  id BIGSERIAL PRIMARY KEY,
  rating_value INTEGER NOT NULL CHECK (rating_value BETWEEN 1 AND 5),
  comment TEXT NULL,
  order_detail_id BIGINT NULL REFERENCES order_details(id) ON DELETE SET NULL,
  admin_reply TEXT NULL,
  replied_by BIGINT NULL,
  replied_at TIMESTAMPTZ NULL
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_product_category ON product(category_id);
CREATE INDEX IF NOT EXISTS idx_product_sizes_product ON product_sizes(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_account ON orders(account_id);
CREATE INDEX IF NOT EXISTS idx_order_details_order ON order_details(order_id);
CREATE INDEX IF NOT EXISTS idx_rating_order_detail ON rating(order_detail_id);

COMMIT;
