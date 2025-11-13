-- AI Data Cleanup and Constraints (Idempotent & Safe)
-- Use this script to:
--  1) Safely remove orphan rows from product_embeddings (safe update mode compatible)
--  2) Add recommended FK/UNIQUE/CHECK constraints
--  3) Add helpful indexes for AI features
-- Run after importing DBWebBanDoBongDa.sql and AI_Schema.sql

USE my_store;

-- ============================================
-- 1) Safe cleanup for orphan product_embeddings rows
-- ============================================
-- Works even when SQL_SAFE_UPDATES is enabled
SET @prev_safe := @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

-- Use single-table DELETE with NOT EXISTS (LIMIT is not allowed in multi-table DELETE)
DELETE FROM product_embeddings
WHERE NOT EXISTS (
  SELECT 1 FROM product p WHERE p.id = product_embeddings.product_id
)
LIMIT 100000;

SET SQL_SAFE_UPDATES = @prev_safe;


-- ============================================
-- 2) Constraints (FK + UNIQUE + CHECK) - Idempotent
-- ============================================

-- 2.1) FK: product_embeddings.product_id -> product(id) ON DELETE CASCADE
SET @fk_exists := (
  SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'product_embeddings'
    AND CONSTRAINT_NAME = 'fk_pe_product'
);
SET @sql := IF(@fk_exists = 0,
  'ALTER TABLE product_embeddings\n     ADD CONSTRAINT fk_pe_product\n     FOREIGN KEY (product_id) REFERENCES product(id)\n     ON DELETE CASCADE',
  'SELECT "fk_pe_product already exists"'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- 2.2) UNIQUE: product_sizes(product_id, size_id)
SET @ix := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='product_sizes' AND INDEX_NAME='uk_product_size'
);
SET @sql := IF(@ix=0,
  'ALTER TABLE product_sizes ADD UNIQUE KEY uk_product_size (product_id, size_id)',
  'SELECT "uk_product_size exists"'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- 2.3) UNIQUE: rating(order_detail_id)
SET @ix := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='rating' AND INDEX_NAME='uk_rating_order_detail'
);
SET @sql := IF(@ix=0,
  'ALTER TABLE rating ADD UNIQUE KEY uk_rating_order_detail (order_detail_id)',
  'SELECT "uk_rating_order_detail exists"'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- 2.4) UNIQUE: sizes(size)
SET @ix := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='sizes' AND INDEX_NAME='uk_sizes_size'
);
SET @sql := IF(@ix=0,
  'ALTER TABLE sizes ADD UNIQUE KEY uk_sizes_size (size)',
  'SELECT "uk_sizes_size exists"'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- 2.5) CHECK constraints (MySQL 8.0+)
SET @chk_qty := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='order_details' AND CONSTRAINT_NAME='chk_od_qty'
);
SET @sql := IF(@chk_qty=0,
  'ALTER TABLE order_details ADD CONSTRAINT chk_od_qty CHECK (quantity > 0)',
  'SELECT "chk_od_qty exists"'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @chk_price := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='order_details' AND CONSTRAINT_NAME='chk_od_price'
);
SET @sql := IF(@chk_price=0,
  'ALTER TABLE order_details ADD CONSTRAINT chk_od_price CHECK (price >= 0)',
  'SELECT "chk_od_price exists"'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;


-- ============================================
-- 3) Helpful indexes - Idempotent
-- ============================================

-- Index on ai_conversations(created_at) for cleanup/analytics
SET @ix := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ai_conversations' AND INDEX_NAME='idx_ai_conv_created'
);
SET @sql := IF(@ix=0,
  'CREATE INDEX idx_ai_conv_created ON ai_conversations(created_at)',
  'SELECT "idx_ai_conv_created exists"'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- Index on orders(account_id, created_at) for user order timelines
SET @ix := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND INDEX_NAME='idx_orders_account_created'
);
SET @sql := IF(@ix=0,
  'CREATE INDEX idx_orders_account_created ON orders(account_id, created_at)',
  'SELECT "idx_orders_account_created exists"'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- End of migration
