USE my_store;

--
-- Idempotent index creation helpers using information_schema + dynamic SQL
-- Re-running this file will not error if indexes already exist.
--

-- ============================================
-- Product table indexes for faster search
-- ============================================

-- product(name(100)) for LIKE/prefix searches
SET @ix := (
   SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product' AND INDEX_NAME = 'idx_product_name'
);
SET @sql := IF(@ix = 0,
   'CREATE INDEX idx_product_name ON product(name(100))',
   'SELECT "idx_product_name exists"'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- product(price) for price range filtering
SET @ix := (
   SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product' AND INDEX_NAME = 'idx_product_price'
);
SET @sql := IF(@ix = 0,
   'CREATE INDEX idx_product_price ON product(price)',
   'SELECT "idx_product_price exists"'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- product(category_id) for category filtering
SET @ix := (
   SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product' AND INDEX_NAME = 'idx_product_category'
);
SET @sql := IF(@ix = 0,
   'CREATE INDEX idx_product_category ON product(category_id)',
   'SELECT "idx_product_category exists"'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- product(category_id, price) composite for common filters
SET @ix := (
   SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product' AND INDEX_NAME = 'idx_product_category_price'
);
SET @sql := IF(@ix = 0,
   'CREATE INDEX idx_product_category_price ON product(category_id, price)',
   'SELECT "idx_product_category_price exists"'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;


-- ============================================
-- Product sizes indexes for size filtering
-- ============================================

-- product_sizes(product_id) for joins
SET @ix := (
   SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_sizes' AND INDEX_NAME = 'idx_ps_product'
);
SET @sql := IF(@ix = 0,
   'CREATE INDEX idx_ps_product ON product_sizes(product_id)',
   'SELECT "idx_ps_product exists"'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- product_sizes(size_id) for size filtering
SET @ix := (
   SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_sizes' AND INDEX_NAME = 'idx_ps_size'
);
SET @sql := IF(@ix = 0,
   'CREATE INDEX idx_ps_size ON product_sizes(size_id)',
   'SELECT "idx_ps_size exists"'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;


-- ============================================
-- AI conversation indexes for chat history
-- ============================================

-- ai_conversations(session_id, id) for session lookup
SET @ix := (
   SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ai_conversations' AND INDEX_NAME = 'idx_ai_conv_session'
);
SET @sql := IF(@ix = 0,
   'CREATE INDEX idx_ai_conv_session ON ai_conversations(session_id, id)',
   'SELECT "idx_ai_conv_session exists"'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ai_conversations(user_id, created_at) for user history
SET @ix := (
   SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ai_conversations' AND INDEX_NAME = 'idx_ai_conv_user'
);
SET @sql := IF(@ix = 0,
   'CREATE INDEX idx_ai_conv_user ON ai_conversations(user_id, created_at)',
   'SELECT "idx_ai_conv_user exists"'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;


-- ============================================
-- AI memory indexes for long-term recall (already created in AI_Schema.sql)
-- ============================================

-- Already has unique key on user_id (sufficient)
-- No additional index needed


-- ============================================
-- Product embeddings indexes
-- ============================================

-- Primary key on product_id already exists (sufficient)
-- Index on updated_at for cache invalidation
SET @ix := (
   SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_embeddings' AND INDEX_NAME = 'idx_pe_updated'
);
SET @sql := IF(@ix = 0,
   'CREATE INDEX idx_pe_updated ON product_embeddings(updated_at)',
   'SELECT "idx_pe_updated exists"'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;


-- ============================================
-- Orders indexes for AI tool queries
-- ============================================

-- Index for user's orders
SET @ix := (
   SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND INDEX_NAME = 'idx_orders_account'
);
SET @sql := IF(@ix = 0,
   'CREATE INDEX idx_orders_account ON orders(account_id, id DESC)',
   'SELECT "idx_orders_account exists"'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- Index for order status lookup
SET @ix := (
   SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND INDEX_NAME = 'idx_orders_status'
);
SET @sql := IF(@ix = 0,
   'CREATE INDEX idx_orders_status ON orders(status)',
   'SELECT "idx_orders_status exists"'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;


-- ============================================
-- Order details indexes for order lookup
-- ============================================

-- Index for order items lookup
SET @ix := (
   SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_details' AND INDEX_NAME = 'idx_od_order'
);
SET @sql := IF(@ix = 0,
   'CREATE INDEX idx_od_order ON order_details(order_id)',
   'SELECT "idx_od_order exists"'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- Index for product_sizes join
SET @ix := (
   SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_details' AND INDEX_NAME = 'idx_od_ps'
);
SET @sql := IF(@ix = 0,
   'CREATE INDEX idx_od_ps ON order_details(product_sizes_id)',
   'SELECT "idx_od_ps exists"'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;


-- ============================================
-- Category indexes
-- ============================================

-- Index for category name search
SET @ix := (
   SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'category' AND INDEX_NAME = 'idx_category_name'
);
SET @sql := IF(@ix = 0,
   'CREATE INDEX idx_category_name ON category(name(50))',
   'SELECT "idx_category_name exists"'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;


-- ============================================
-- Sizes indexes
-- ============================================

-- Index for size lookup
SET @ix := (
   SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sizes' AND INDEX_NAME = 'idx_sizes_size'
);
SET @sql := IF(@ix = 0,
   'CREATE INDEX idx_sizes_size ON sizes(size(10))',
   'SELECT "idx_sizes_size exists"'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;


-- ============================================
-- Verify indexes created
-- ============================================

-- Check product indexes
SHOW INDEX FROM product;

-- Check ai_conversations indexes
SHOW INDEX FROM ai_conversations;

-- Check product_embeddings indexes
SHOW INDEX FROM product_embeddings;

-- Optional: Analyze tables for query optimization
ANALYZE TABLE product;
ANALYZE TABLE product_sizes;
ANALYZE TABLE ai_conversations;
ANALYZE TABLE product_embeddings;
ANALYZE TABLE orders;
ANALYZE TABLE order_details;


-- ============================================
-- Performance tips
-- ============================================

/*
After creating indexes:

1. Monitor slow queries:
   SET GLOBAL slow_query_log = 'ON';
   SET GLOBAL long_query_time = 1; -- queries > 1s

2. Check index usage:
   EXPLAIN SELECT ... -- before actual query

3. If database grows large (>100k products):
   - Consider partitioning by category_id
   - Add full-text search index for product.name

4. Maintenance:
   - Run OPTIMIZE TABLE monthly
   - Monitor index fragmentation
   - Update statistics with ANALYZE TABLE

5. Memory optimization:
   - Increase innodb_buffer_pool_size if possible
   - Monitor query cache hit rate
*/
