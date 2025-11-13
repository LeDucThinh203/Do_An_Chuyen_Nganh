-- ================================================
-- SQL Script: Cập nhật database hỗ trợ VNPay
-- ================================================

USE `my_store`;

-- Bước 1: Thêm cột payment_info vào bảng orders (nếu chưa có)
-- Kiểm tra và thêm cột nếu chưa tồn tại
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'my_store' 
  AND TABLE_NAME = 'orders' 
  AND COLUMN_NAME = 'payment_info';

SET @query = IF(@col_exists = 0,
    'ALTER TABLE `orders` ADD COLUMN `payment_info` TEXT NULL COMMENT ''Thông tin giao dịch thanh toán (JSON format)'' AFTER `is_paid`',
    'SELECT ''Column payment_info already exists'' AS Message');
    
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Bước 2: Cập nhật constraint payment_method để hỗ trợ vnpay
ALTER TABLE `orders` DROP CHECK `chk_payment_method`;

ALTER TABLE `orders` 
ADD CONSTRAINT `chk_payment_method` 
CHECK (`payment_method` IN ('cod', 'bank', 'vnpay'));

-- Bước 3: Thêm index để tối ưu truy vấn (nếu chưa có)
SET @idx1_exists = 0;
SELECT COUNT(*) INTO @idx1_exists 
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'my_store' 
  AND TABLE_NAME = 'orders' 
  AND INDEX_NAME = 'idx_payment_method';

SET @query1 = IF(@idx1_exists = 0,
    'CREATE INDEX `idx_payment_method` ON `orders` (`payment_method`)',
    'SELECT ''Index idx_payment_method already exists'' AS Message');
    
PREPARE stmt1 FROM @query1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

SET @idx2_exists = 0;
SELECT COUNT(*) INTO @idx2_exists 
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'my_store' 
  AND TABLE_NAME = 'orders' 
  AND INDEX_NAME = 'idx_is_paid';

SET @query2 = IF(@idx2_exists = 0,
    'CREATE INDEX `idx_is_paid` ON `orders` (`is_paid`)',
    'SELECT ''Index idx_is_paid already exists'' AS Message');
    
PREPARE stmt2 FROM @query2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Hoàn tất!
SELECT 'VNPay database update completed successfully!' AS Status;
