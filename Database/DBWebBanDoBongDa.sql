-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: my_store
-- ------------------------------------------------------
-- Server version	9.5.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '16ea95b4-b02f-11f0-bb02-201e88f29288:1-781';

--
-- Table structure for table `account`
--

DROP TABLE IF EXISTS `account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expiry` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account`
--

LOCK TABLES `account` WRITE;
/*!40000 ALTER TABLE `account` DISABLE KEYS */;
INSERT INTO `account` VALUES (37,'user@gmail.com','hiepUser','$2y$10$c0o7hyazY0CPSNDmV6hKTO1Xn9sQH37zjvdnHoPBuE2oFcfnmnChu','user','2025-05-09 15:48:32','2025-11-08 02:16:08',NULL,NULL),(39,'hiep542004s@gmail.com','hiep','$2y$10$4QJDo5XYYCXFQVJNB16JLeGX/Q4N6chN3RhVyCBCX4QabRi4xSuzC','user','2025-05-12 11:53:19','2025-05-23 11:41:10',NULL,NULL),(41,'admin@gmail.com','admin','$2y$10$y2TWpCrT9XImGxKUTSdHIO/vcugZ/La.kw8sEPvdEgzZDnourtO3W','admin','2025-05-23 12:47:29','2025-05-23 12:47:47',NULL,NULL),(48,'leducthinh204@gmail.com','lê đức thịnh','123456','user','2025-11-07 22:15:07','2025-11-09 00:19:42',NULL,NULL),(49,'hehe@gmail.com','hehe','$2b$10$gAFOrQ/aulUEcMRisLZlbuYo5YLbno7kq1T/IF8pFCAfaZb2OQ0rC','admin','2025-11-07 22:34:53','2025-11-09 01:17:11',NULL,NULL),(50,'ee@gmail.com','lele','$2b$10$k1y.0Z1k7Km9rrPbmgcEeeMwEWOpwfBAeA/m23dAoNlaVsDLkSMhi','user','2025-11-07 22:40:45','2025-11-13 12:31:11',NULL,NULL),(51,'haha@gmail.com','haha','$2b$10$.hlbCBv0mQMfMe6RLgs9deGCFcUrSbDVVM0ap.6BgOuDy7evIr8Q6','admin','2025-11-07 22:48:56','2025-11-07 22:48:56',NULL,NULL),(52,'leducthinh203@gmail.com','le duc thinh','$2b$10$CTTpGxx9GzCDzQ6yWwd.KeNxqgyCXJ0UgJNIrFP.se6b2E5zylix.','user','2025-11-08 23:15:32','2025-11-09 22:39:22',NULL,NULL),(53,'admnguvc@gmail.com','lee duc think','$2b$10$cauXLDz4IjFbkfbtepJNFu5TIOrCRfIP/PbW39foSk76aIMSdO8Ie','user','2025-11-08 23:36:42','2025-11-08 23:37:58',NULL,NULL);
/*!40000 ALTER TABLE `account` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `address`
--

DROP TABLE IF EXISTS `address`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `address` (
  `id` int NOT NULL AUTO_INCREMENT,
  `account_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `provinceName` varchar(255) NOT NULL,
  `districtName` varchar(255) NOT NULL,
  `wardName` varchar(255) NOT NULL,
  `address_detail` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `address_account_fk` (`account_id`),
  CONSTRAINT `address_account_fk` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `address`
--

LOCK TABLES `address` WRITE;
/*!40000 ALTER TABLE `address` DISABLE KEYS */;
INSERT INTO `address` VALUES (1,50,'Lê Đức Thịnh','0383190880','Tỉnh Tây Ninh','Thị xã Hòa Thành','Phường Long Thành Trung','Đạ teh, lâm đồng'),(2,50,'321','213','Tỉnh Lạng Sơn','Huyện Đình Lập','Xã Đồng Thắng','VN'),(4,51,'Hồ Nam Hải','03333333','Tỉnh Thái Nguyên','Huyện Phú Bình','Xã Lương Phú','Việt Nam'),(6,51,'321','123123','Tỉnh Bắc Giang','Thị xã Việt Yên','Phường Ninh Sơn','Việt Nam'),(7,51,'12312','321321','Tỉnh Lào Cai','Huyện Văn Bàn','Xã Làng Giàng','123'),(8,50,'eeeee','0383190880','Tỉnh Thái Nguyên','Huyện Đồng Hỷ','Thị trấn Hóa Thượng','Đạ teh, lâm đồng');
/*!40000 ALTER TABLE `address` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category`
--

LOCK TABLES `category` WRITE;
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
INSERT INTO `category` VALUES (11,'Bộ đồ','áo;quần'),(12,'Áo','Áo'),(13,'Quần','Quần'),(14,'Giày','Giày'),(15,'Phụ kiện',NULL),(16,'hahaeee','eeee'),(17,'Găng tay','Găng Tay'),(18,'Quả bóng','Quả bóng');
/*!40000 ALTER TABLE `category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_details`
--

DROP TABLE IF EXISTS `order_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_sizes_id` int DEFAULT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `order_details_ibfk_3` (`product_sizes_id`),
  CONSTRAINT `order_details_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `order_details_ibfk_3` FOREIGN KEY (`product_sizes_id`) REFERENCES `product_sizes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=218 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_details`
--

LOCK TABLES `order_details` WRITE;
/*!40000 ALTER TABLE `order_details` DISABLE KEYS */;
INSERT INTO `order_details` VALUES (151,101,70,1,159000.00),(152,102,69,1,159000.00),(153,103,78,1,120000.00),(154,103,107,1,890000.00),(155,104,NULL,1,120000.00),(156,104,NULL,1,169000.00),(157,105,NULL,1,120000.00),(158,105,NULL,1,169000.00),(159,106,NULL,2,120000.00),(160,107,NULL,1,120000.00),(161,108,NULL,3,169000.00),(162,108,NULL,1,169000.00),(164,110,NULL,3,120000.00),(166,113,NULL,1,120000.00),(176,101,79,3,20000.00),(179,118,77,1,120000.00),(180,118,87,3,139000.00),(189,124,87,1,139000.00),(190,125,165,1,199000.00),(191,126,165,3,199000.00),(192,127,165,1,199000.00),(207,137,88,1,139000.00),(208,138,88,1,139000.00),(209,139,88,1,139000.00),(210,140,88,1,139000.00),(211,140,87,1,139000.00),(212,141,78,1,120000.00),(216,144,89,1,139000.00),(217,145,77,1,120000.00);
/*!40000 ALTER TABLE `order_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address` text NOT NULL,
  `status` enum('pending','confirmed','shipping','delivered','cancelled','received') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `account_id` int DEFAULT NULL,
  `total_amount` decimal(20,2) DEFAULT '0.00',
  `payment_method` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'cod',
  `is_paid` tinyint(1) NOT NULL DEFAULT '0',
  `payment_info` text COMMENT 'Thông tin giao dịch thanh toán (JSON format)',
  PRIMARY KEY (`id`),
  KEY `orders_account_fk` (`account_id`),
  KEY `idx_payment_method` (`payment_method`),
  KEY `idx_is_paid` (`is_paid`),
  CONSTRAINT `orders_account_fk` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_payment_method` CHECK ((`payment_method` in (_utf8mb4'cod',_utf8mb4'bank',_utf8mb4'vnpay')))
) ENGINE=InnoDB AUTO_INCREMENT=146 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (101,'hiep','0977850642','Thành phố Hồ Chí Minh -- Quận 7 -- Phường Phú Mỹ -- yytydyf','pending','2025-05-20 01:31:31',NULL,159000.00,'cod',0,NULL),(102,'hiep','0977850642','Thành phố Hồ Chí Minh -- Huyện Hóc Môn -- Xã Xuân Thới Thượng -- tổ 1 thôn tân bình','pending','2025-05-20 01:40:33',NULL,159000.00,'cod',0,NULL),(103,'hiep','0977850642','Thành phố Hồ Chí Minh -- Thành phố Thủ Đức -- Phường Linh Trung -- 96 Lê Văn Chí','received','2025-05-23 11:53:04',39,1010000.00,'cod',0,NULL),(104,'123','edsa','123','pending','2025-11-07 23:57:38',NULL,289000.00,'cod',0,NULL),(105,'Lê Đức Thịnh','0394202403','59/160/14/6 ','pending','2025-11-07 23:59:03',NULL,289000.00,'cod',0,NULL),(106,'Lê Đức Thịnh','0383190880','12321','pending','2025-11-08 00:06:20',NULL,240000.00,'cod',0,NULL),(107,'Lê Đức Thịnh','0394202403','wae','pending','2025-11-08 01:18:05',NULL,120000.00,'cod',0,NULL),(108,'Lê Đức Thịnh','123','vn','pending','2025-11-08 01:18:39',NULL,676000.00,'cod',0,NULL),(110,'Lê Đức Thịnh','0383190880','Đạ teh, lâm đồng','pending','2025-11-08 02:41:10',NULL,360000.00,'cod',0,NULL),(111,'Hồ Nam Hải','03333333','Việt Nam','pending','2025-11-09 02:43:27',NULL,259000.00,'cod',0,NULL),(112,'Hồ Nam Hải','03333333','Việt Nam','pending','2025-11-09 02:43:32',NULL,259000.00,'cod',0,NULL),(113,'Hồ Nam Hải','03333333','Việt Nam','pending','2025-11-09 02:47:21',NULL,120000.00,'cod',0,NULL),(118,'Lê Đức Thịnh','0383190880','Đạ teh, lâm đồng','pending','2025-11-10 07:37:41',50,537000.00,'cod',0,NULL),(124,'Lê Đức Thịnh','0383190880','Đạ teh, lâm đồng','received','2025-11-10 11:55:22',50,139000.00,'cod',1,NULL),(125,'Lê Đức Thịnh','0383190880','Đạ teh, lâm đồng','received','2025-11-10 12:58:37',50,199000.00,'cod',1,NULL),(126,'Lê Đức Thịnh','0383190880','Đạ teh, lâm đồng','received','2025-11-10 13:21:00',50,597000.00,'cod',1,NULL),(127,'eeeee','0383190880','Đạ teh, lâm đồng','received','2025-11-10 13:24:45',50,199000.00,'cod',1,NULL),(137,'Lê Đức Thịnh','0383190880','Đạ teh, lâm đồng','pending','2025-11-13 10:14:26',50,139000.00,'bank',1,'{\"vnpay_transaction_no\":\"15259335\",\"vnpay_bank_code\":\"NCB\",\"vnpay_pay_date\":\"20251113171427\",\"vnpay_response_code\":\"00\"}'),(138,'321','123123','Việt Nam','pending','2025-11-13 10:17:08',51,139000.00,'bank',1,'{\"vnpay_transaction_no\":\"15259342\",\"vnpay_bank_code\":\"NCB\",\"vnpay_pay_date\":\"20251113171709\",\"vnpay_response_code\":\"00\"}'),(139,'Lê Đức Thịnh','0383190880','Đạ teh, lâm đồng','pending','2025-11-13 10:36:09',50,139000.00,'vnpay',0,NULL),(140,'Lê Đức Thịnh','0383190880','Đạ teh, lâm đồng','pending','2025-11-13 10:38:54',50,278000.00,'vnpay',0,NULL),(141,'Lê Đức Thịnh','0383190880','Đạ teh, lâm đồng','pending','2025-11-13 10:40:20',50,120000.00,'vnpay',0,NULL),(144,'Lê Đức Thịnh','0383190880','Đạ teh, lâm đồng','pending','2025-11-13 12:02:28',50,139000.00,'vnpay',0,NULL),(145,'Hồ Nam Hải','03333333','Việt Nam','pending','2025-11-13 12:32:22',51,120000.00,'vnpay',0,NULL);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product`
--

DROP TABLE IF EXISTS `product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `image` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  `khuyen_mai` int DEFAULT '0' COMMENT 'Phần trăm khuyến mãi (0-100)',
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `product_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`),
  CONSTRAINT `chk_khuyen_mai` CHECK (((`khuyen_mai` >= 0) and (`khuyen_mai` <= 100)))
) ENGINE=InnoDB AUTO_INCREMENT=98 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product`
--

LOCK TABLES `product` WRITE;
/*!40000 ALTER TABLE `product` DISABLE KEYS */;
INSERT INTO `product` VALUES (60,'Mẫu áo quần bóng đá Câu lạc bộ Atlético Nacional sân nhà 2023 màu xanh lá V3499','haha',169000.00,'/images/ao.jpg',NULL,10),(62,'Áo Bóng Đá CLB Arsenal 2022 Màu Hồng Đẹp Mê','Bùng Nổ Cá Tính Với Áo Bóng Đá CLB Arsenal 2022 Màu Hồng – Độc Lạ\r\nSở hữu ngay mẫu áo bóng đá Arsenal 2022 phiên bản màu hồng cực hot – lựa chọn lý tưởng cho các đội nữ hoặc những team muốn tạo dấu ấn riêng trên sân cỏ.\r\n\r\nTông màu hồng rực rỡ, kết hợp họa tiết đen đầy cá tính, tạo nên phong cách nổi bật, không “đụng hàng”.\r\n\r\nThiết kế cổ tim trẻ trung, khỏe khoắn, logo thêu nổi bật cùng các chi tiết in sắc nét, chỉn chu đến từng đường kim mũi chỉ.\r\n\r\nChất liệu thun mịn cao cấp – thấm hút mồ hôi nhanh, thoáng mát, co giãn tốt, mang lại sự thoải mái tối đa khi vận động.',120000.00,'/images/ao.jpg',NULL,15),(63,'Bộ Đá Banh CLB Miami Màu Hồng 2023','Áo thể thao màu hồng thiết kế 2023 là một tác phẩm tinh tế kết hợp giữa phong cách đương đại và sự tôn vinh truyền thống của đội bóng. Được sáng tạo bởi các nhà thiết kế tài năng, mỗi chi tiết được chăm chút tỉ mỉ, tạo nên một bộ trang phục không chỉ thể hiện niềm tự hào của đội bóng mà còn mang đến sự tự tin cho người mặc.\r\nGiới thiệu đồ Quần Áo Thể Thao Clb Miami Hồng Thiết Kế Mới Nhất 2023 \r\nĐồ đá banh áo CLB Arsenal 2023 sân khách là sản phẩm tiếp theo mà Mata Sport muốn giới thiệu đến những người đam mê thời trang thể thao. Mẫu thiết kế này có gì thú vị? Chúng ta sẽ cùng khám phá ngay dưới đây nhé!\r\nMàu hồng là màu đặc trưng của mẫu áo đấu clb Miami với họa tiết vô cùng độc lạ và khác biệt. Sự kết hợp hài hòa giữa tông màu trắng đen và hồng sẽ tạo được sự khác biệt của mẫu áo. \r\nBa đường sọc trên vai kéo dài màu đen. Kết hợp với chi tiết cổ áo tròn và đường bo ống tay áo đơn giản đồng màu áo chủ đạo. Tạo sự cân đối cho chiếc áo và mang đến sự khỏe khoắn mạnh mẽ cho người mặc. \r\nSự nổi bật trong chi tiết logo thương hiệu Mata Sport, nhà tài trợ (nếu có) cùng bộ font số chữ bằng màu đen đã khiến cho chiếc áo trở lên thu hút hơn. \r\nQuần short đen viền trắng là sự kết hợp hoàn hảo cho đồ áo đấu Miami màu hồng thiết kế mới nhất của Mata Sport.\r\nForm dáng hiện đại trẻ trung năng động. Sự tỉ mỉ trong từng đường kim mũi chỉ và các chi tiết in sắc nét. Chất lượng được chú trọng hàng đầu trong sản phẩm. \r\nĐược may bằng chất liệu thể thao cao cấp, thoáng mát, co giãn, thấm hút mồ hôi tốt. Bạn sẽ thật thoải mái và tự tin khi hoạt động cùng niềm đam mê sân cỏ. ',169000.00,'/images/Miami-2.jpg',NULL,20),(64,'Áo quần bóng đá MU đỏ sân nhà 24/25','Chi tiết áo MU đỏ mùa giải 24/25\r\n\r\nChất liệu: 100% Polyester – Thun lạnh co giản và thấm hút / Thoát mồ hôi tốt\r\nKiểu dáng: Regular Form – Form suông  châu Á\r\nSize: S – M – L – XL – 2XL\r\nLogo thêu chỉ chắc chắn, các hoạ tiết in chuyển sắc nét.\r\nÁo bóng đá MU sân nhà mùa giải 24/25 hàng Việt Nam\r\nCác sản phẩm trang phục áo đá banh câu lạc bộ được bán nhiều trên thị trường, từ nhiều xưởng uy tín tại Việt Nam. Sporter tin tưởng và chọn giúp bạn những sản phẩm với chất lượng tốt nhất và giống với áo đấu nhất. Các mẫu áo hàng Việt Nam sẽ không có logo của các nhà sản xuất thể thao ở ngực phải (Vì lý do bản quyền hình ảnh).\r\n\r\nƯu điểm:\r\n\r\nThiết kế Regular Form, form suông mặc thoải mái và phù hợp nhiều vóc dáng. Form size Châu á.\r\nGiá thành rẻ hơn hàng Thái Lan, tiết kiệm chi phí.\r\nĐộ bền tương xứng với giá tiền, có thể sử dụng lên đến 2 năm.\r\nCác logo được thêu vào, tránh được trường hợp bong tróc.\r\nChất liệu thun lạnh co giản 2 chiều, nhưng đã được cải thiện tốt hơn theo thời gian.\r\n\r\nNhược điểm\r\n\r\nSẽ không có độ chính xác 99% như các mẫu hàng Thái Lan hay chính hãng.\r\nChất liệu thun lạnh sẽ không có sự thoát mồ hôi tốt như hàng Thái Lan hay áo không logo.',139000.00,'/images/Vn-mu-do-2024-1.jpg',NULL,20),(65,'Áo Bóng Đá Câu Lạc Bộ Real Madrid Đen Rồng Viền Tím 2024-2025','Áo Bóng Đá Câu Lạc Bộ Real Madrid Đen Rồng Viền Tím 2024-2025\r\n\r\nÁo bóng đá Câu lạc bộ Real Madrid Đen Rồng Viền Tím phiên bản mùa giải 2024-2025 là sản phẩm mới nhất của Câu lạc bộ Real Madrid 2024-2025  dành cho người hâm mộ đội bóng Hoàng gia Tây Ban Nha. Chiếc áo bóng đá được thiết kế với tông màu Đen Rồng Viền Tím tinh tế không chỉ mang đến sự sang trọng mà còn thể hiện tinh thần chiến đấu mạnh mẽ của đội bóng.\r\n\r\n1. THÔNG TIN SẢN PHẨM\r\n\r\n- Chất liệu: nhẹ, thoáng khí, hút ẩm tốt\r\n\r\n+ Hàng Thun Lạnh\r\n\r\n+ Hàng Thun Co Giãn\r\n\r\n+ Hàng Mè Caro\r\n\r\n- Công nghệ: Thấm hút mồ hôi nhanh chóng\r\n\r\n- Thiết kế: Tông màu Đen Rồng Viền Tím chủ đạo mang lại vẻ ngoài hiện đại và mạnh mẽ',120000.00,'/images/z6034406454892_5775fd5a2502c82d34296edf570a5033_11zon_6767_HasThumb_Thumb.jpg',NULL,0),(66,'Áo đội tuyển Tây Ban Nha năm 2016 - 2018','Bộ trang phục này là mẫu áo sân nhà (home kit) của đội tuyển Tây Ban Nha, được thiết kế với tông màu đỏ sẫm đặc trưng của quốc gia này. Áo có cổ tròn và viền tay áo màu vàng, tạo điểm nhấn hài hòa với tổng thể. Ba sọc kẻ đặc trưng của Adidas, màu vàng, chạy dọc hai bên vai áo. Logo của nhà tài trợ Adidas được đặt ở ngực phải, còn logo của Liên đoàn bóng đá Hoàng gia Tây Ban Nha (RFEF) với huy hiệu vương miện được đặt ở ngực trái, thể hiện niềm tự hào dân tộc.\r\n\r\nPhía trước áo, số &quot;10&quot; lớn màu vàng được in nổi bật, tượng trưng cho vị trí của một cầu thủ quan trọng, thường là tiền vệ tấn công hoặc đội trưởng. Phía sau áo, cũng là số &quot;10&quot; lớn màu vàng, nhưng kèm theo dòng chữ &quot;TÊN RIÊNG&quot; ở phía trên, cho thấy đây là một mẫu áo có thể cá nhân hóa tên của người mặc.\r\n\r\nQuần đùi cũng có màu đỏ sẫm tương tự, với các chi tiết màu vàng ở viền túi và hai bên hông. Số &quot;10&quot; cũng được in trên ống quần, đồng bộ với áo. Tất trắng cao cổ hoàn thiện bộ trang phục, mang lại vẻ ngoài chuyên nghiệp và năng động. Tổng thể bộ trang phục toát lên sự mạnh mẽ, truyền thống và tinh thần chiến đấu của đội tuyển Tây Ban Nha.\r\n\r\nChất liệu: Thường thì áo bóng đá của các đội tuyển quốc gia được sản xuất bởi Adidas sẽ sử dụng các công nghệ vải tiên tiến để tối ưu hiệu suất cho cầu thủ. Các chất liệu phổ biến bao gồm:\r\n\r\n· 100% Polyester tái chế: Adidas thường sử dụng chất liệu này để giảm thiểu tác động đến môi trường.\r\n\r\n· Công nghệ AEROREADY hoặc Climacool/Climalite (tùy thuộc vào năm sản xuất): Đây là các công nghệ độc quyền của Adidas giúp thấm hút mồ hôi hiệu quả, giữ cho người mặc luôn khô ráo và thoáng mát, ngay cả khi vận động cường độ cao. Vải thường có kết cấu nhẹ, thoáng khí và có khả năng co giãn tốt để tạo sự thoải mái tối đa cho người mặc.\r\n\r\nNhìn chung, đây là một bộ trang phục chất lượng cao, được thiết kế để mang lại cả tính thẩm mỹ và hiệu suất cho cầu thủ cũng như người hâm mộ.',175000.00,'/images/Screenshot 2025-05-09 233758.png',NULL,0),(67,'Găng Tay Thủ Môn Reusch Attrakt Fusion Carbon® 3D 5570998 7784','Evolution Negative Cut (ESS™): Kiểu cắt ôm sát ngón tay, kết hợp giữa thiết kế Negative Cut và Roll Finger, mang lại cảm giác bóng tốt hơn và diện tích tiếp xúc lớn hơn.\r\nPunch Zone: Lớp cao su được làm bằng Carbon® 3D được thêm trên mu bàn tay, hỗ trợ khi đấm bóng và bảo vệ tay khỏi chấn thương khi tiếp xúc với bóng.Chất liệu lòng bàn tay: Reusch Grip Fusion – loại latex cao cấp của Đức, kết hợp giữa độ bám dính mạnh mẽ và khả năng chống mài mòn, phù hợp với mọi điều kiện sân bãi và thời tiết\r\n',2990000.00,'/images/Găng Tay Thủ Môn Reusch Attrakt Fusion Carbon® 3D 5570998 7784.jpg.png',NULL,0),(68,'Găng tay thủ môn GOLDEN STAR - Màu vàng','Thông số chi tiết:\r\n\r\nMút CONTACT PRO - Cao su Đức  : Lòng bàn tay Dày 4mm với độ ma sát tối đa và khả năng kiểm soát không giới hạn. \r\nBack Hand - LATEX GERMAN làm bằng chất liệu vải co giãn cao cấp, giúp cho đôi tay được thoải mái, linh hoạt mỗi khi sử dụng. Ngoài ra còn giúp đôi găng thoáng mát hơn, thoát mồ hôi tốt hơn khi sử dụng\r\nCông nghệ thoát khí ngón tay latex\r\nDòng găng HYBIRD ROLL : ôm chặt lòng bàn tay.\r\nSponge Lining : Mút xốp lót trong chống trơn, tạo cảm giác êm và bắt bóng tốt hơn.\r\nHand Strap - Dây Đeo Cổ Tay : Hỗ trợ giữ chắc găng và cổ tay.\r\nWrist - Spandex cổ tay co giãn tốt, ôm sát với cổ tay người sử dụng, tạo cảm giác chắc chắn.',890000.00,'/images/pvn3915-17-gang-tay-golden-star-nguyen-manh-do.jpg',NULL,0),(69,'Găng tay thủ môn Wika 01 màu xanh lá','Găng tay thủ môn Wika 01 là sản phẩm nằm trong phân khúc găng tay thủ môn giá rẻ được Wika Sports tung ra thị trường. Với giá thành và chất lượng tương xứng, đây sẽ là mẫu găng tay có độ phủ sóng lớn dành cho những thủ môn không chuyên trên sân bóng phủi.\r\n\r\n\r\nGăng tay thủ môn Wika 01 được làm từ lớp Foam xốp dẻo, dày 3mm tạo lực ma sát để bóng dính tốt không bị trượt, đồng thời bảo vệ da tay của thủ môn khỏi rách, trầy. Mặt trong phủ lớp vải thấm mồ hôi cho tay luôn khô ráo, thoải mái.\r\n\r\nGăng tay thủ môn Wika 01 sử dụng mặt cắt Flat Palm, có lưới thoáng khí giữa các ngón tay cho cảm giác thoải mái hơn khi thi đấu trong thời tiết nóng. Bên cạnh đó, kiểu ngón tay Flat Palm cũng giúp thủ môn bắt dính tốt hơn do đôi găng có nhiều tiết diện tiếp xúc bóng. Đây cũng là kiểu găng tay thủ môn cho người mới chơi luyện được form tay tốt hơn so với các kiểu ngón khác.\r\n\r\n\r\nGăng tay thủ môn Wika 01 là găng tay thủ môn có khung xương giúp thủ môn không bị trật khớp hoặc gãy ngón tay trước những cú sút mạnh của cầu thủ đội bạn, điều này thích hợp cho những người mới chơi, có lực bắt bóng còn hạn chế. Tuy nhiên, khung xương này hoàn toàn có thể tháo rời một cách linh hoạt, đáp ứng nhu cầu khi thủ môn có kinh nghiệm hơn.\r\n\r\nPhần mu bàn tay làm bằng da tổng hợp có độ bền cao, thiết kế đơn giản. Đai quấn một vòng, kết hợp vải mesh và thiết kế thun co giãn, dễ dàng đeo và tháo linh hoạt, điều chỉnh kích cỡ theo mong muốn.\r\n\r\nGăng tay thủ môn Wika 01 cũng ra mắt thêm găng tay thủ môn trẻ em size 6,7 với 3 màu sắc chủ đạo: Xanh lá – Cam – Xanh dương. Đây vẫn được coi là sản phẩm thích hợp sở hữu nhiều ưu điểm trong tầm giá dưới 300k.',199000.00,'/images/gang-tay-thu-mon-wika-xanh-chuoi-1_optimized-768x768.jpg',NULL,0),(70,'Găng tay thủ môn Kaiwin GUNNER - Màu xanh da','Găng Tay Thủ Môn Kaiwin GUNNER – Màu Xanh Da | Thiết Kế Đỉnh Cao – Bắt Dính Chuẩn – Bảo Vệ Tối Ưu\r\n\r\nKhẳng định phong độ nơi khung gỗ với mẫu Kaiwin GUNNER – dòng găng tay thủ môn cao cấp mang đến sự kết hợp hoàn hảo giữa thiết kế ấn tượng và hiệu năng vượt trội. Phiên bản màu xanh da độc đáo không chỉ giúp bạn nổi bật trên sân mà còn thể hiện cá tính mạnh mẽ, chuyên nghiệp.\r\n\r\n- Đặc điểm nổi bật:\r\nMặt găng sử dụng latex cao cấp nhập khẩu, độ bám vượt trội giúp bạn bắt dính bóng chắc chắn trong cả điều kiện khô ráo lẫn ẩm ướt. Đây là loại chất liệu được nhiều thủ môn chuyên nghiệp tin dùng.\r\n\r\nLòng bàn tay cắt dạng Flat Cut truyền thống, tạo cảm giác bóng chân thật, giúp kiểm soát bóng tốt hơn, đặc biệt trong các tình huống đổ người hoặc cản phá cú sút mạnh.\r\n\r\nMu bàn tay được gia cố đệm EVA chắc chắn, hỗ trợ bảo vệ tay tối đa khi đấm bóng hoặc va chạm với cầu thủ đối phương.\r\n\r\nCổ tay co giãn kèm băng quấn Velcro chắc chắn, giúp cố định găng tay tốt hơn, ôm sát cổ tay và hạn chế chấn thương trong thi đấu.\r\n\r\nĐường chỉ may tỉ mỉ, thiết kế vừa vặn, phù hợp với nhiều cỡ tay, đảm bảo sự linh hoạt khi vận động.\r\n\r\n- Ứng dụng:\r\nPhù hợp cho cả sân cỏ tự nhiên lẫn sân cỏ nhân tạo, từ luyện tập đến thi đấu chuyên nghiệp.',425000.00,'/images/Găng tay thủ môn Kaiwin GUNNER - Màu xanh da.jpg',NULL,0),(71,'Găng tay thủ môn Wika Sketon màu đỏ','Găng tay thủ môn Wika Sketon không chỉ giúp bảo vệ tay, nó còn giúp hiệu suất bắt bóng của cầu thủ tăng cao hơn:\r\n\r\n– Găng tay được phối khá bắt mắt: Đỏ – Xanh – Cam\r\n\r\n– Size: 8-9-10\r\n\r\n– Lớp Foarm xốp dẻo, dày 3mm đàn hồi, chống nước.\r\n\r\n– Mặt trong phủ lớp vải thấm mồ hôi cho tay luôn khô ráo\r\n\r\n– Mặt cắt Flat Palm, lưới thoáng khí, ngón tay rộng rãi, thoải mái, phù hợp với thủ thành có lối chơi kiểm soát bóng\r\n\r\n– Ngón tay có thiết kế vải thoáng khí giúp tay không bị bí, bị đổ mồ hôi, nóng\r\n\r\n– Xương găng cố định\r\n\r\n– Mu bàn tay làm bằng da tổng hợp, độ bền cao, các đường sọc nổi đệm mút hỗ trợ đấm bóng chính xác và an toàn\r\n\r\n– Đai quấn một vòng, kết hợp vải mesh và thiết kế thun co giãn, dễ dàng mang tháo và linh hoạt điều chỉnh kích cỡ theo yêu cầu',239000.00,'/images/gang-tay-thu-mon-wika-sketo-do-2-600x600.jpg',NULL,0),(72,'Găng Adidas Predator GL Pro Soccer Goalie Goalkeeper Gloves HH8745 Choosing Size New','Vải: 91% polyester, 8% elastane, 1% nylon (thân), 100% cao su (bên ngoài lòng bàn tay). Lòng bàn tay: mủ cao su URG 2.0. Thiết kế không quai dài giúp vừa vặn và chắc chắn với cẳng tay và không cần dây đeo cổ tay.\r\nQuả bóng dừng lại cùng bạn và đôi găng tay thủ môn adidas Predator GL Pro của bạn, nhờ lòng bàn tay URG 2.0 có độ bám tốt, vùng uốn cong theo giải phẫu và mu bàn tay được dệt kim mang lại cảm giác thoải mái, vừa vặn và linh hoạt.\r\n\r\nLớp bọt lòng bàn tay URG (Unrivaled Grip) 2.0 tăng độ bám, hấp thụ sốc và độ bền\r\nThiết kế không dây đeo mở rộng giúp vừa vặn và chắc chắn với cẳng tay và không cần dùng dây đeo cổ tay\r\nMặt sau đan để vừa vặn và thoải mái\r\nCác vùng uốn cong giải phẫu được định vị chiến lược trên các ngón tay và lòng bàn tay theo các chuyển động tự nhiên của bàn tay\r\nPredator Demonskin có các chi tiết nổi trên các đốt ngón tay để tạo kết cấu và độ bám\r\nLòng bàn tay: Cao su URG 2.0\r\nChất liệu vải: 91% polyester, 8% elastane, 1% nylon (thân), 100% cao su (bên ngoài lòng bàn tay)\r\nChăm sóc: Giặt tay, KHÔNG sấy khô',4199000.00,'/images/Gloves Adidas Predator GL Pro Soccer Goalie Goalkeeper Gloves HH8745 Choosing Size New.jpg',NULL,0),(73,'Quả Bóng Quality Pro UHV 2.07','Đặc điểm Quả Bóng Quality Pro UHV 2.07\r\nSize bóng: Bóng số 5\r\nChất liệu da: PU cao cấp + chống thấm\r\nTrọng lượng: 420 – 440g\r\nChu vi bóng: 685– 695mm\r\nĐộ tròn:',1699000.00,'/images/pvn406-qua-bong-da-uhv2-05-size4-1671527611.jpg',NULL,0),(74,'Quả bóng đá FIFA QUALITY PRO UHV 2.07 số 5','Quả Bóng Đá Số 5 UHV 2.07 – FIFA QUALITY PRO | Đẳng Cấp Thi Đấu – Chuẩn Quốc Tế\r\n\r\nSẵn sàng cho những trận cầu đỉnh cao với quả bóng đá UHV 2.07 số 5 – đạt chứng nhận FIFA QUALITY PRO, tiêu chuẩn cao nhất dành cho bóng thi đấu chuyên nghiệp quốc tế. Thiết kế tối ưu cho tốc độ, độ nảy và sự ổn định trên mọi mặt sân.\r\n\r\n- Ưu điểm nổi bật:\r\nChứng nhận FIFA QUALITY PRO – đảm bảo chất lượng vượt trội về độ chính xác, khả năng bay, độ nảy và độ thấm nước. Đây là loại bóng đạt chuẩn sử dụng trong các giải đấu chuyên nghiệp cấp quốc gia và quốc tế.\r\n\r\nKết cấu 32 miếng ghép truyền thống, được khâu tay tỉ mỉ, giúp bóng có độ tròn đều, bay ổn định và kiểm soát tốt hơn khi thi đấu.\r\n\r\nLớp vỏ ngoài làm từ PU cao cấp – chống mài mòn, mềm mại nhưng vẫn đủ độ cứng cho những cú sút uy lực và chính xác.\r\n\r\nRuột bóng cao su butyl chất lượng cao, giữ hơi lâu, hạn chế xì van và đảm bảo độ nảy tiêu chuẩn trong suốt quá trình sử dụng.\r\n\r\nThiết kế hiện đại, màu sắc nổi bật, dễ nhận diện trên sân trong cả điều kiện ánh sáng mạnh hoặc thiếu sáng.\r\n\r\n-Thông số kỹ thuật:\r\nKích thước: Số 5 – chuẩn thi đấu cho người lớn và giải chuyên nghiệp\r\n\r\nTrọng lượng tiêu chuẩn: Theo quy định của FIFA (410g – 450g)\r\n\r\nMặt sân sử dụng: Phù hợp cả sân cỏ tự nhiên lẫn sân nhân tạo',1780000.00,'/images/pvn406-qua-bong-da-uhv2-05-size4-1671527611.jpg',NULL,0),(75,'Quả bóng đá adidas Vòng Loại UCL League 24/25 Unisex - JH1296','Quả bóng đá tập luyện với họa tiết graphic lấy cảm hứng từ trái bóng thi đấu chính thức của UCL.\r\nMang sắc xanh lá của những mái vòm đồng nhuốm màu thời gian và phông nền đẹp như những tấm bưu thiếp Munich, quả bóng đá adidas League này mượn cảm hứng thiết kế từ trái bóng thi đấu chính thức của UCL. Với kết cấu không đường may cho lối chơi ổn định, vỏ bóng bằng TPU có các chi tiết tinh xảo hình thành phố và logo giải đấu. Hãy sử dụng trái bóng đạt chứng nhận FIFA Quality này khi tập luyện và thi đấu.\r\n\r\nĐẶC ĐIỂM NỔI BẬT\r\n\r\n100% TPU (tái chế)\r\nKết cấu TSBE không đường may\r\nRuột bóng bằng cao su butyl\r\nChứng nhận FIFA Quality\r\nIn logo UEFA Champions League\r\nCần bơm hơi\r\nMàu sản phẩm: White / Shadow Green / Solar Slime\r\nMã sản phẩm: JH1296\r\nTHÔNG TIN THƯƠNG HIỆU adidas\r\n\r\nNgày nay adidas không chỉ là nhãn hiệu thể thao chuyên nghiệp mà còn là một sản phẩm thời trang. adidas đã phân chia các dòng sản phẩm của mình thành 3 phân nhóm:\r\n\r\nThành tích thể thao: tập trung vào tính năng của sản phẩm đáp ứng cho các VĐV chuyên nghiệp\r\nDi sản thể thao: những sản phẩm truyền thống đã mang lại danh tiếng\r\nThời trang thể thao: tập trung vào những khách hàng trẻ thích những sản phẩm trang phục thể thao hợp thời trang và sang trọng.\r\nCó thể nói adidas thành công nhờ:\r\n\r\nLuôn luôn sáng tạo nhằm vào sự nâng cao thành tích cho các VĐV chuyên nghiệp.\r\nLuôn trung thành với KH mục tiêu là các VĐV chuyên nghiệp.\r\nLuôn giữ gìn lịch sử đẹp đẽ và phát triển nó thành 1 phong cách thời trang.\r\nLuôn kiên định với Dassler ngày nào: “phong độ” cho dù có lúc sóng gió nhưng họ không bao giờ bắt sản phẩm mình phải trả giá.\r\nNhững ngôi sao thể hiện đúng phong cách mà adidas truyền đạt.',950000.00,'/images/bongvongloaiuclleague2425trang-07162380-2f9c-4eac-b65b-dc2cee1fa877.jpg',NULL,0),(76,'Quả bóng đá cờ đỏ sao vàng','Thông tin quả bóng đá cờ đỏ sao vàng\r\nThương hiệu: Động Lực\r\nXuất xứ: Sản xuất tại Việt Nam.\r\n Size số 3 có D = 18cm ; Trọng lượng = 340g  phù hợp độ tuổi &lt; 8 tuổi ==&gt; Giá bán: 120.000đ\r\nSize số 4 có D = 19.5 cm ; Trọng lượng = 368g  phù hợp độ tuổi &lt; 9-11 tuổi ==&gt; Giá bán: 140.000 đ\r\nSize số  5 có D = 21.5 cm ; Trọng lượng = 450g  phù hợp độ tuổi &gt; 12 tuổi ==&gt; Giá bán: 160.000đ\r\n Da bóng làm từ chất liệu PVC có độ bền và độ đàn hồi cao.\r\n Bề mặt ngoài có khả năng chống xước và chống nước tốt\r\nBóng có cấu tạo nhiều lớp bên trong được bổ sung lớp vải đệm giúp bóng êm hơn và giữ form tốt\r\nRuột bóng làm từ cao su đặc biệt, giữ hơi tốt. Bóng có độ bay và độ nảy ổn định\r\nBóng phù hợp đá trên sân cỏ nhân tạo, sân cỏ tự nhiên và sân đất\r\nBóng thi đấu được trong mọi điều kiện thời tiết\r\nLưu ý:\r\nHạn chế đá trên sân bê tông, nơi có vật sắc nhọn khiến bóng dễ bị mòn và trầy xước\r\nĐể bóng ở nơi khô ráo, tránh ánh sáng trực tiếp và nhiệt độ caoChất liệu: làm từ da PU nhập khẩu từ Nhật, rất êm tay khi đánh. Với các miếng da vàng và xanh, dán bề mặt ngoài bởi lớp keo tiêu chuẩn, bền chắc chắn.',160000.00,'/images/qua-bong-da-co-do-sao-vang.jpg',NULL,0),(77,'Đội tuyển Argentina (Argentina) - trang phục sân nhà (home kit) 2022-2024','Bộ trang phục này là mẫu áo sân nhà (home kit) của đội tuyển Argentina, nổi bật với các sọc dọc màu xanh da trời nhạt và trắng xen kẽ, một thiết kế truyền thống và mang tính biểu tượng của đội bóng xứ Tango. Áo có cổ tròn và viền tay áo màu đen. Số áo thường được in ở ngực và sau lưng.\r\nLogo của nhà tài trợ (thường là Adidas) được đặt ở ngực phải, trong khi logo của Hiệp hội Bóng đá Argentina (AFA) với hai ngôi sao (tượng trưng cho hai chức vô địch World Cup) được đặt ở ngực trái.\r\nQuần đùi có màu đen, với các chi tiết màu trắng và xanh da trời nhạt. Tất trắng hoặc đen hoàn thiện bộ trang phục, mang lại vẻ ngoài chuyên nghiệp và đầy khí chất cho đội tuyển Argentina.\r\nChất liệu:\r\nÁo bóng đá của các đội tuyển quốc gia thường được sản xuất bởi Adidas và sử dụng các công nghệ vải tiên tiến để tối ưu hiệu suất cho cầu thủ. Các chất liệu phổ biến bao gồm:\r\n•	100% Polyester tái chế: Adidas thường sử dụng chất liệu này để giảm thiểu tác động đến môi trường.\r\n•	Công nghệ AEROREADY: Đây là công nghệ độc quyền của Adidas giúp thấm hút mồ hôi hiệu quả, giữ cho người mặc luôn khô ráo và thoáng mát, ngay cả khi vận động cường độ cao. Vải thường có kết cấu nhẹ, thoáng khí và có khả năng co giãn tốt để tạo sự thoải mái tối đa cho người mặc.\r\n',120000.00,'/images/Đội tuyển Argentina (Argentina) - trang phục sân nhà (home kit) 2022-2024.jpg',NULL,0),(78,'Quả Bóng Đá AKpro AF2000 Số 5','Quả Bóng Đá AKpro AF2000 số 5 được làm từ chất liệu TPU bằng công nghệ Khâu máy có độ nảy ổn định, bóng êm, hướng bay chuẩn, khả năng chống thấm nước tương đối tốt, ít bị mài mòn. Bóng có cấu tạo nhiều lớp nên không bị biến dạng qua quá trình sử dụng và có độ bền cao. Phần ruột bóng Butyl được làm từ chất liệu bền, cho khả năng giữ hơi cực tốt.\r\nSản phẩm có thiết kế đẹp mắt, màu sắc Trắng – Đen – Đỏ truyền thống cùng với đường may sắc nét, tỉ mỉ. Bóng tròn đều, họa tiết khỏe khoắn đem lại cho người sử dụng cảm giác hứng thú mỗi khi tập luyện, thi đấu. Bóng sử dụng cho tập luyện và thi đấu phong trào hiệu quả.\r\n',1200000.00,'/images/Quả Bóng Đá AKpro AF2000 Số 5.jpg',NULL,0),(87,'hahah','hahaha',123.00,'/images/avatarGG.jpg',NULL,0),(90,'Giày ','123',123.00,'/images/ao.jpg',NULL,0),(92,'Áo quần ','123',123.00,'/images/ao.jpg',NULL,0),(96,'Quần Hutech ','Haha',1000000.00,'/images/Hutech.jpg',NULL,0),(97,'haeee','eeee',1000.00,'ao3.jpg',12,0);
/*!40000 ALTER TABLE `product` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_sizes`
--

DROP TABLE IF EXISTS `product_sizes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_sizes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `size_id` int NOT NULL,
  `warehouse` int DEFAULT '0' COMMENT 'Số lượng sản phẩm trong kho',
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `size_id` (`size_id`),
  CONSTRAINT `product_sizes_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_sizes_ibfk_2` FOREIGN KEY (`size_id`) REFERENCES `sizes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_warehouse` CHECK ((`warehouse` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=168 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_sizes`
--

LOCK TABLES `product_sizes` WRITE;
/*!40000 ALTER TABLE `product_sizes` DISABLE KEYS */;
INSERT INTO `product_sizes` VALUES (66,60,14,50),(67,60,15,30),(68,60,16,45),(69,60,17,25),(70,60,18,60),(75,62,15,50),(76,62,16,50),(77,62,17,50),(78,62,18,50),(79,63,14,0),(80,63,15,0),(81,63,16,0),(82,63,17,0),(83,63,18,0),(85,64,14,0),(86,64,15,0),(87,64,16,0),(88,64,17,0),(89,64,18,0),(90,65,14,0),(91,65,15,0),(92,65,16,0),(93,65,17,0),(94,65,18,0),(95,66,14,0),(96,66,15,0),(97,66,16,0),(98,66,17,0),(99,66,18,0),(107,68,31,0),(111,70,27,0),(112,70,28,0),(113,70,29,0),(114,70,30,0),(115,70,31,0),(118,71,29,0),(119,71,30,0),(120,71,31,0),(121,72,29,0),(122,72,30,0),(123,72,31,0),(124,72,32,0),(129,77,14,0),(130,77,15,0),(131,77,16,0),(132,77,17,0),(133,77,18,0),(134,78,34,0),(152,70,33,0),(158,75,34,0),(159,74,34,0),(160,73,34,0),(164,69,33,0),(165,69,18,0),(166,69,24,0);
/*!40000 ALTER TABLE `product_sizes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rating`
--

DROP TABLE IF EXISTS `rating`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rating` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rating_value` tinyint NOT NULL,
  `comment` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `order_detail_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `rating_order_detail_fk` (`order_detail_id`),
  CONSTRAINT `rating_order_detail_fk` FOREIGN KEY (`order_detail_id`) REFERENCES `order_details` (`id`) ON DELETE CASCADE,
  CONSTRAINT `rating_chk_1` CHECK (((`rating_value` >= 1) and (`rating_value` <= 5)))
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rating`
--

LOCK TABLES `rating` WRITE;
/*!40000 ALTER TABLE `rating` DISABLE KEYS */;
INSERT INTO `rating` VALUES (27,5,'tốt','2025-05-23 19:49:29',153),(29,5,'haha','2025-11-10 14:56:44',153),(30,5,'eee','2025-11-10 19:23:49',153),(31,5,'eee','2025-11-10 19:27:06',153),(32,4,'dsa','2025-11-10 19:54:24',179),(33,4,'eee','2025-11-10 19:56:28',180),(34,5,'Rất tốt','2025-11-10 19:58:58',190),(35,5,'Rất hay','2025-11-10 20:16:59',189),(36,5,'haha','2025-11-10 20:21:34',179),(37,5,'được của nó đấy\n','2025-11-10 20:21:43',179),(38,5,'dsa','2025-11-10 20:23:58',191);
/*!40000 ALTER TABLE `rating` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sizes`
--

DROP TABLE IF EXISTS `sizes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sizes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `size` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sizes`
--

LOCK TABLES `sizes` WRITE;
/*!40000 ALTER TABLE `sizes` DISABLE KEYS */;
INSERT INTO `sizes` VALUES (14,'S'),(15,'M'),(16,'L'),(17,'XL'),(18,'XXL'),(20,'39'),(21,'40'),(22,'41'),(23,'42'),(24,'43'),(25,'44'),(26,'45'),(27,'6'),(28,'7'),(29,'8'),(30,'9'),(31,'10'),(32,'11'),(33,'12'),(34,'5'),(36,'XXXXL');
/*!40000 ALTER TABLE `sizes` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-13 21:16:57
