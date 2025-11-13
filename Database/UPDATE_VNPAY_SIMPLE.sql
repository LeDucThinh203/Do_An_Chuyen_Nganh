-- ================================================
-- SQL Script: Cập nhật database hỗ trợ VNPay (Phiên bản đơn giản)
-- Chạy từng câu lệnh, bỏ qua lỗi nếu đã tồn tại
-- ================================================

USE `my_store`;

-- Bước 1: Thêm cột payment_info
-- (Nếu báo lỗi "Duplicate column name" thì bỏ qua, có nghĩa là đã có cột này)
ALTER TABLE `orders` 
ADD COLUMN `payment_info` TEXT NULL COMMENT 'Thông tin giao dịch thanh toán (JSON format)' AFTER `is_paid`;

-- Bước 2: Xóa constraint cũ
ALTER TABLE `orders` DROP CHECK `chk_payment_method`;

-- Bước 3: Thêm constraint mới hỗ trợ vnpay
ALTER TABLE `orders` 
ADD CONSTRAINT `chk_payment_method` 
CHECK (`payment_method` IN ('cod', 'bank', 'vnpay'));

-- Bước 4: Thêm index
-- (Nếu báo lỗi "Duplicate key name" thì bỏ qua)
CREATE INDEX `idx_payment_method` ON `orders` (`payment_method`);
CREATE INDEX `idx_is_paid` ON `orders` (`is_paid`);

-- Xem kết quả
SELECT 'VNPay database update completed!' AS Status;
