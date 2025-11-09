-- AI Schema for Hybrid RAG + Memory + Tools
-- Use after importing main DB dump (DBWebBanDoBongDa.sql)

USE `my_store`;

-- Chat history per session/user
DROP TABLE IF EXISTS `ai_conversations`;
CREATE TABLE IF NOT EXISTS `ai_conversations` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `session_id` VARCHAR(64) NOT NULL,
  `user_id` BIGINT NULL,
  `role` VARCHAR(32) NOT NULL, -- user | assistant | tool
  `content` LONGTEXT NULL,
  `tool_name` VARCHAR(128) NULL,
  `tool_payload` LONGTEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_user_role` (`user_id`, `role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Long-term user memory summaries with embedding cache
DROP TABLE IF EXISTS `ai_memory`;
CREATE TABLE IF NOT EXISTS `ai_memory` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `summary` TEXT NULL,
  `embedding` LONGTEXT NULL, -- JSON array of floats
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ai_mem_user` (`user_id`),
  KEY `idx_ai_mem_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Product embedding cache for RAG
DROP TABLE IF EXISTS `product_embeddings`;
CREATE TABLE IF NOT EXISTS `product_embeddings` (
  `product_id` INT NOT NULL,
  `embedding` LONGTEXT NULL, -- JSON array of floats
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Optional: add FULLTEXT index to accelerate prefilter; ignore error if it already exists
-- Note: MySQL doesn't support IF NOT EXISTS for indexes on older versions
-- You can comment this out if your MySQL returns an error on re-run
ALTER TABLE `product` ADD FULLTEXT `ft_product_name_desc` (`name`, `description`);
