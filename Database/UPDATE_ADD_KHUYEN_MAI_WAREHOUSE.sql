-- --------------------------------------------------------
-- Cập nhật thêm cột khuyến mãi và kho hàng
-- Date: November 13, 2025
-- --------------------------------------------------------

USE `my_store`;

-- Thêm cột khuyen_mai vào bảng product
-- Giá trị từ 0-100 để lưu % khuyến mãi
ALTER TABLE `product` 
ADD COLUMN `khuyen_mai` INT DEFAULT 0 COMMENT 'Phần trăm khuyến mãi (0-100)';

-- Thêm constraint để đảm bảo giá trị khuyến mãi hợp lệ (0-100)
ALTER TABLE `product`
ADD CONSTRAINT `chk_khuyen_mai` CHECK (`khuyen_mai` >= 0 AND `khuyen_mai` <= 100);

-- Thêm cột warehouse (Kho) vào bảng product_sizes
-- Lưu số lượng sản phẩm tồn kho cho từng size
ALTER TABLE `product_sizes` 
ADD COLUMN `warehouse` INT DEFAULT 0 COMMENT 'Số lượng sản phẩm trong kho';

-- Thêm constraint để đảm bảo số lượng kho không âm
ALTER TABLE `product_sizes`
ADD CONSTRAINT `chk_warehouse` CHECK (`warehouse` >= 0);

-- Cập nhật một số dữ liệu mẫu (tùy chọn)
-- Ví dụ: Set khuyến mãi cho một số sản phẩm
UPDATE `product` SET `khuyen_mai` = 10 WHERE `id` = 60;
UPDATE `product` SET `khuyen_mai` = 15 WHERE `id` = 62;
UPDATE `product` SET `khuyen_mai` = 20 WHERE `id` = 63;

-- Ví dụ: Set số lượng kho cho một số product_sizes
UPDATE `product_sizes` SET `warehouse` = 50 WHERE `id` = 66;
UPDATE `product_sizes` SET `warehouse` = 30 WHERE `id` = 67;
UPDATE `product_sizes` SET `warehouse` = 45 WHERE `id` = 68;
UPDATE `product_sizes` SET `warehouse` = 25 WHERE `id` = 69;
UPDATE `product_sizes` SET `warehouse` = 60 WHERE `id` = 70;

-- Kiểm tra kết quả
SELECT p.id, p.name, p.price, p.khuyen_mai, 
       ROUND(p.price * (100 - p.khuyen_mai) / 100, 2) AS gia_sau_khuyen_mai
FROM product p
WHERE p.khuyen_mai > 0;

SELECT ps.id, p.name, s.size, ps.warehouse
FROM product_sizes ps
JOIN product p ON ps.product_id = p.id
JOIN sizes s ON ps.size_id = s.id
WHERE ps.warehouse > 0
LIMIT 10;
