CREATE DATABASE  IF NOT EXISTS `food_delivery_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `food_delivery_db`;
-- MySQL dump 10.13  Distrib 8.0.38, for Win64 (x86_64)
--
-- Host: localhost    Database: food_delivery_db
-- ------------------------------------------------------
-- Server version	8.0.39

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

--
-- Table structure for table `admin_activity_logs`
--

DROP TABLE IF EXISTS `admin_activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_activity_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `admin_user_id` bigint unsigned NOT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'order, menu_item, rider, etc.',
  `entity_id` bigint unsigned DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_admin` (`admin_user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_entity` (`entity_type`,`entity_id`),
  KEY `idx_created` (`created_at`),
  CONSTRAINT `admin_activity_logs_ibfk_1` FOREIGN KEY (`admin_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_roles`
--

DROP TABLE IF EXISTS `admin_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_roles` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `permissions` json NOT NULL COMMENT 'JSON array of permission keys',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_name` (`role_name`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `api_rate_limits`
--

DROP TABLE IF EXISTS `api_rate_limits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_rate_limits` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `endpoint` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `request_count` int DEFAULT '1',
  `window_start` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_request_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ip_endpoint` (`ip_address`,`endpoint`),
  KEY `idx_window` (`window_start`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `branch_variation_availability`
--

DROP TABLE IF EXISTS `branch_variation_availability`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `branch_variation_availability` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `branch_id` bigint unsigned NOT NULL,
  `variation_id` bigint unsigned NOT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT '1',
  `branch_price` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_branch_variation` (`branch_id`,`variation_id`),
  KEY `branch_variation_availability_variation_id_foreign` (`variation_id`),
  CONSTRAINT `branch_variation_availability_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `branch_variation_availability_variation_id_foreign` FOREIGN KEY (`variation_id`) REFERENCES `item_variations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `branches`
--

DROP TABLE IF EXISTS `branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `branches` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `branch_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch_slug` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'URL-friendly slug',
  `address` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `district` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `delivery_radius_km` decimal(5,2) NOT NULL DEFAULT '10.00' COMMENT 'Delivery radius in kilometers',
  `contact_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `opening_time` time NOT NULL DEFAULT '08:00:00',
  `closing_time` time NOT NULL DEFAULT '22:00:00',
  `is_open_sunday` tinyint(1) DEFAULT '1',
  `is_open_monday` tinyint(1) DEFAULT '1',
  `is_open_tuesday` tinyint(1) DEFAULT '1',
  `is_open_wednesday` tinyint(1) DEFAULT '1',
  `is_open_thursday` tinyint(1) DEFAULT '1',
  `is_open_friday` tinyint(1) DEFAULT '1',
  `is_open_saturday` tinyint(1) DEFAULT '1',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `branch_code` (`branch_code`),
  UNIQUE KEY `branch_slug` (`branch_slug`),
  KEY `idx_location` (`latitude`,`longitude`),
  KEY `idx_active` (`is_active`),
  KEY `idx_city` (`city`),
  KEY `idx_deleted` (`deleted_at`),
  CONSTRAINT `chk_opening_hours` CHECK ((`opening_time` < `closing_time`))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `cart_id` bigint unsigned NOT NULL,
  `food_item_id` bigint unsigned NOT NULL,
  `variation_id` bigint unsigned DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unit_price` decimal(10,2) NOT NULL,
  `special_instructions` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cart_item` (`cart_id`,`food_item_id`,`variation_id`),
  KEY `food_item_id` (`food_item_id`),
  KEY `variation_id` (`variation_id`),
  KEY `idx_cart` (`cart_id`),
  CONSTRAINT `cart_items_cart_id_foreign` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`food_item_id`) REFERENCES `food_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_items_ibfk_3` FOREIGN KEY (`variation_id`) REFERENCES `item_variations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_quantity` CHECK ((`quantity` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `carts`
--

DROP TABLE IF EXISTS `carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `branch_id` bigint unsigned DEFAULT NULL,
  `session_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  `delivery_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `tax_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `promo_code_id` bigint unsigned DEFAULT NULL,
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `carts_user_id_unique` (`user_id`),
  KEY `carts_branch_id_foreign` (`branch_id`),
  KEY `carts_promo_code_id_foreign` (`promo_code_id`),
  CONSTRAINT `carts_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `carts_promo_code_id_foreign` FOREIGN KEY (`promo_code_id`) REFERENCES `promo_codes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `carts_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customer_addresses`
--

DROP TABLE IF EXISTS `customer_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_addresses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `address_label` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Home, Office, etc.',
  `recipient_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address_line1` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address_line2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `district` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postal_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  `delivery_instructions` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_default` (`user_id`,`is_default`),
  KEY `idx_location` (`latitude`,`longitude`),
  KEY `idx_deleted` (`deleted_at`),
  CONSTRAINT `customer_addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `food_categories`
--

DROP TABLE IF EXISTS `food_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `food_categories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'URL-friendly slug',
  `description` text COLLATE utf8mb4_unicode_ci,
  `image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `category_slug` (`category_slug`),
  KEY `idx_active_order` (`is_active`,`display_order`),
  KEY `idx_slug` (`category_slug`),
  KEY `idx_deleted` (`deleted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `food_items`
--

DROP TABLE IF EXISTS `food_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `food_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `category_id` int unsigned NOT NULL,
  `item_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_slug` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'URL-friendly slug',
  `description` text COLLATE utf8mb4_unicode_ci,
  `ingredients` text COLLATE utf8mb4_unicode_ci COMMENT 'List of ingredients',
  `image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `has_variations` tinyint(1) DEFAULT '0',
  `is_vegetarian` tinyint(1) DEFAULT '0',
  `is_vegan` tinyint(1) DEFAULT '0',
  `is_spicy` tinyint(1) DEFAULT '0',
  `spicy_level` tinyint DEFAULT '0' COMMENT '0-5 spicy scale',
  `preparation_time_minutes` int DEFAULT '20',
  `display_order` int DEFAULT '0',
  `is_available` tinyint(1) DEFAULT '1',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `average_rating` decimal(3,2) DEFAULT '0.00',
  `total_ratings` int DEFAULT '0',
  `total_orders` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `item_slug` (`item_slug`),
  KEY `idx_category` (`category_id`),
  KEY `idx_slug` (`item_slug`),
  KEY `idx_active` (`is_active`,`is_available`),
  KEY `idx_rating` (`average_rating` DESC),
  KEY `idx_popular` (`total_orders` DESC),
  KEY `idx_deleted` (`deleted_at`),
  FULLTEXT KEY `ft_search` (`item_name`,`description`,`ingredients`),
  CONSTRAINT `food_items_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `food_categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_spicy_level` CHECK (((`spicy_level` >= 0) and (`spicy_level` <= 5)))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `food_reviews`
--

DROP TABLE IF EXISTS `food_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `food_reviews` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `order_item_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `food_item_id` bigint unsigned NOT NULL,
  `rating` tinyint NOT NULL,
  `review_text` text COLLATE utf8mb4_unicode_ci,
  `is_approved` tinyint(1) DEFAULT '1',
  `admin_response` text COLLATE utf8mb4_unicode_ci,
  `responded_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_item_review` (`order_item_id`),
  KEY `order_id` (`order_id`),
  KEY `user_id` (`user_id`),
  KEY `idx_food_item` (`food_item_id`),
  KEY `idx_rating` (`rating`),
  KEY `idx_approved` (`is_approved`),
  CONSTRAINT `food_reviews_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `food_reviews_ibfk_2` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `food_reviews_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `food_reviews_ibfk_4` FOREIGN KEY (`food_item_id`) REFERENCES `food_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_food_rating` CHECK (((`rating` >= 1) and (`rating` <= 5)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `item_variations`
--

DROP TABLE IF EXISTS `item_variations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_variations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `food_item_id` bigint unsigned NOT NULL,
  `variation_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Small, Medium, Large, etc.',
  `price` decimal(10,2) NOT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  `is_available` tinyint(1) DEFAULT '1',
  `display_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_item_variation` (`food_item_id`,`variation_name`),
  KEY `idx_item` (`food_item_id`),
  KEY `idx_available` (`is_available`),
  CONSTRAINT `item_variations_ibfk_1` FOREIGN KEY (`food_item_id`) REFERENCES `food_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notification_logs`
--

DROP TABLE IF EXISTS `notification_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `notification_type` enum('sms','email','push','in_app') COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_type` enum('customer','rider','admin') COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_id` bigint unsigned NOT NULL,
  `recipient_contact` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Phone/Email/Device ID',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` json DEFAULT NULL COMMENT 'Additional payload',
  `status` enum('pending','sent','failed','read') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `failure_reason` text COLLATE utf8mb4_unicode_ci,
  `related_order_id` bigint unsigned DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_recipient` (`recipient_type`,`recipient_id`),
  KEY `idx_status` (`status`),
  KEY `idx_order` (`related_order_id`),
  KEY `idx_created` (`created_at`),
  KEY `idx_unread` (`recipient_type`,`recipient_id`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `offer_categories`
--

DROP TABLE IF EXISTS `offer_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `offer_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `offer_id` bigint unsigned NOT NULL,
  `category_id` int unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_offer_category` (`offer_id`,`category_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `offer_categories_ibfk_1` FOREIGN KEY (`offer_id`) REFERENCES `offers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `offer_categories_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `food_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `offer_items`
--

DROP TABLE IF EXISTS `offer_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `offer_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `offer_id` bigint unsigned NOT NULL,
  `food_item_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_offer_item` (`offer_id`,`food_item_id`),
  KEY `food_item_id` (`food_item_id`),
  CONSTRAINT `offer_items_ibfk_1` FOREIGN KEY (`offer_id`) REFERENCES `offers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `offer_items_ibfk_2` FOREIGN KEY (`food_item_id`) REFERENCES `food_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `offers`
--

DROP TABLE IF EXISTS `offers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `offers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `offer_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `offer_slug` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `discount_type` enum('percentage','fixed_amount') COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `minimum_order_amount` decimal(10,2) DEFAULT '0.00',
  `maximum_discount_amount` decimal(10,2) DEFAULT NULL COMMENT 'Cap for percentage discounts',
  `applicable_to` enum('all_items','specific_items','specific_categories') COLLATE utf8mb4_unicode_ci DEFAULT 'all_items',
  `branch_id` bigint unsigned DEFAULT NULL COMMENT 'NULL = all branches',
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `usage_limit` int DEFAULT NULL COMMENT 'Total times offer can be used',
  `times_used` int DEFAULT '0',
  `image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_featured` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `offer_slug` (`offer_slug`),
  KEY `idx_active_dates` (`is_active`,`start_date`,`end_date`),
  KEY `idx_slug` (`offer_slug`),
  KEY `idx_branch` (`branch_id`),
  KEY `idx_featured` (`is_featured`,`is_active`),
  KEY `idx_deleted` (`deleted_at`),
  CONSTRAINT `offers_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_offer_dates` CHECK ((`start_date` < `end_date`)),
  CONSTRAINT `chk_offer_percentage` CHECK (((`discount_type` <> _utf8mb4'percentage') or (`discount_value` <= 100)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `food_item_id` bigint unsigned NOT NULL,
  `variation_id` bigint unsigned DEFAULT NULL,
  `item_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `variation_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `total_price` decimal(10,2) NOT NULL,
  `special_instructions` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `variation_id` (`variation_id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_item` (`food_item_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`food_item_id`) REFERENCES `food_items` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `order_items_ibfk_3` FOREIGN KEY (`variation_id`) REFERENCES `item_variations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_item_quantity` CHECK ((`quantity` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_rider_assignments`
--

DROP TABLE IF EXISTS `order_rider_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_rider_assignments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `rider_id` bigint unsigned NOT NULL,
  `assigned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `assigned_by_type` enum('system','admin') COLLATE utf8mb4_unicode_ci DEFAULT 'system',
  `assigned_by_id` bigint unsigned DEFAULT NULL COMMENT 'Admin ID if manual',
  `unassigned_at` timestamp NULL DEFAULT NULL,
  `unassignment_reason` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_rider` (`rider_id`),
  KEY `idx_assigned` (`assigned_at`),
  CONSTRAINT `order_rider_assignments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_rider_assignments_ibfk_2` FOREIGN KEY (`rider_id`) REFERENCES `riders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_status_history`
--

DROP TABLE IF EXISTS `order_status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_status_history` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `old_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by_type` enum('customer','admin','rider','system') COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by_id` bigint unsigned DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_created` (`created_at`),
  CONSTRAINT `order_status_history_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_number` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `branch_id` bigint unsigned NOT NULL,
  `rider_id` bigint unsigned DEFAULT NULL,
  `delivery_address_id` bigint unsigned DEFAULT NULL,
  `delivery_address_snapshot` json NOT NULL,
  `order_status` enum('pending','confirmed','processing','ready_for_pickup','picked_up','delivering','delivered','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `verification_code` varchar(4) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '4-digit code',
  `is_verified` tinyint(1) DEFAULT '0',
  `verified_at` timestamp NULL DEFAULT NULL,
  `payment_method` enum('online','cash_on_delivery') COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_status` enum('pending','processing','completed','failed','refunded') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `payment_gateway_reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL COMMENT 'Food items total',
  `service_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `service_fee_percentage` decimal(5,2) NOT NULL COMMENT 'Fee % at order time',
  `delivery_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `delivery_distance_km` decimal(5,2) NOT NULL,
  `delivery_rate_per_km` decimal(10,2) NOT NULL COMMENT 'Rate at order time',
  `rider_tip` decimal(10,2) DEFAULT '0.00',
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `offer_id` bigint unsigned DEFAULT NULL,
  `promo_code_id` bigint unsigned DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `confirmed_at` timestamp NULL DEFAULT NULL,
  `processing_started_at` timestamp NULL DEFAULT NULL,
  `ready_at` timestamp NULL DEFAULT NULL,
  `picked_up_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancelled_by_type` enum('customer','admin','rider','system') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cancelled_by_id` bigint unsigned DEFAULT NULL,
  `cancellation_reason` text COLLATE utf8mb4_unicode_ci,
  `customer_notes` text COLLATE utf8mb4_unicode_ci,
  `admin_notes` text COLLATE utf8mb4_unicode_ci,
  `estimated_delivery_time` datetime DEFAULT NULL,
  `actual_delivery_time` datetime DEFAULT NULL,
  `admin_reminder_count` int DEFAULT '0',
  `last_reminder_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `delivery_address_id` (`delivery_address_id`),
  KEY `offer_id` (`offer_id`),
  KEY `promo_code_id` (`promo_code_id`),
  KEY `idx_order_number` (`order_number`),
  KEY `idx_user` (`user_id`),
  KEY `idx_branch` (`branch_id`),
  KEY `idx_rider` (`rider_id`),
  KEY `idx_status` (`order_status`),
  KEY `idx_payment_status` (`payment_status`),
  KEY `idx_created` (`created_at`),
  KEY `idx_status_created` (`order_status`,`created_at`),
  KEY `idx_user_status` (`user_id`,`order_status`),
  KEY `idx_branch_status` (`branch_id`,`order_status`),
  KEY `idx_pending` (`order_status`,`created_at`) COMMENT 'For dashboard pending orders',
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`rider_id`) REFERENCES `riders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_ibfk_4` FOREIGN KEY (`delivery_address_id`) REFERENCES `customer_addresses` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `orders_ibfk_5` FOREIGN KEY (`offer_id`) REFERENCES `offers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_ibfk_6` FOREIGN KEY (`promo_code_id`) REFERENCES `promo_codes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `otp_verifications`
--

DROP TABLE IF EXISTS `otp_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_verifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `otp_code` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purpose` enum('registration','login','password_reset','phone_change') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  `attempts` int DEFAULT '0' COMMENT 'Failed verification attempts',
  `max_attempts` int DEFAULT '3',
  `expires_at` timestamp NOT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_phone_otp` (`phone_number`,`otp_code`),
  KEY `idx_expires` (`expires_at`),
  KEY `idx_purpose` (`purpose`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_transactions`
--

DROP TABLE IF EXISTS `payment_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_transactions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `transaction_type` enum('payment','refund') COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_method` enum('online','cash_on_delivery') COLLATE utf8mb4_unicode_ci NOT NULL,
  `gateway_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'PayHere, Stripe, etc.',
  `gateway_transaction_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gateway_response` json DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT 'LKR',
  `status` enum('pending','processing','completed','failed','refunded') COLLATE utf8mb4_unicode_ci NOT NULL,
  `failure_reason` text COLLATE utf8mb4_unicode_ci,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_gateway_txn` (`gateway_transaction_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `payment_transactions_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_tokenable` (`tokenable_type`,`tokenable_id`),
  KEY `idx_token` (`token`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `promo_code_usage`
--

DROP TABLE IF EXISTS `promo_code_usage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promo_code_usage` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `promo_code_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `order_id` bigint unsigned NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `used_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_promo` (`promo_code_id`),
  KEY `idx_user_promo` (`user_id`,`promo_code_id`),
  KEY `fk_promo_usage_order` (`order_id`),
  CONSTRAINT `fk_promo_usage_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `promo_code_usage_ibfk_1` FOREIGN KEY (`promo_code_id`) REFERENCES `promo_codes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `promo_code_usage_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `promo_codes`
--

DROP TABLE IF EXISTS `promo_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promo_codes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `discount_type` enum('percentage','fixed_amount') COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `min_order_amount` decimal(10,2) DEFAULT NULL COMMENT 'Minimum order amount to apply',
  `max_discount_amount` decimal(10,2) DEFAULT NULL COMMENT 'Cap for percentage discounts',
  `usage_limit` int DEFAULT NULL COMMENT 'Total times code can be used',
  `usage_limit_per_user` int DEFAULT '1' COMMENT 'Per user limit',
  `times_used` int DEFAULT '0',
  `valid_from` datetime NOT NULL,
  `valid_until` datetime NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` bigint unsigned DEFAULT NULL COMMENT 'Admin who created',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `created_by` (`created_by`),
  KEY `idx_code` (`code`),
  KEY `idx_active` (`is_active`),
  KEY `idx_dates` (`valid_from`,`valid_until`,`is_active`),
  KEY `idx_deleted` (`deleted_at`),
  CONSTRAINT `promo_codes_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_promo_dates` CHECK ((`valid_from` < `valid_until`)),
  CONSTRAINT `chk_promo_percentage` CHECK (((`discount_type` <> _utf8mb4'percentage') or (`discount_value` <= 100)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rider_daily_earnings`
--

DROP TABLE IF EXISTS `rider_daily_earnings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rider_daily_earnings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `rider_id` bigint unsigned NOT NULL,
  `earning_date` date NOT NULL,
  `total_deliveries` int DEFAULT '0',
  `total_tips_collected` decimal(10,2) DEFAULT '0.00',
  `total_cash_collected` decimal(10,2) DEFAULT '0.00' COMMENT 'Cash from COD orders',
  `cash_submitted` decimal(10,2) DEFAULT '0.00' COMMENT 'Handed over to company',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_rider_date` (`rider_id`,`earning_date`),
  KEY `idx_date` (`earning_date`),
  CONSTRAINT `rider_daily_earnings_ibfk_1` FOREIGN KEY (`rider_id`) REFERENCES `riders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rider_location_history`
--

DROP TABLE IF EXISTS `rider_location_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rider_location_history` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `rider_id` bigint unsigned NOT NULL,
  `order_id` bigint unsigned DEFAULT NULL COMMENT 'If tracking during delivery',
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `speed` decimal(5,2) DEFAULT NULL COMMENT 'km/h',
  `heading` decimal(5,2) DEFAULT NULL COMMENT 'Direction in degrees',
  `recorded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rider_time` (`rider_id`,`recorded_at`),
  KEY `idx_order` (`order_id`),
  CONSTRAINT `rider_location_history_ibfk_1` FOREIGN KEY (`rider_id`) REFERENCES `riders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `rider_location_history_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rider_order_notifications`
--

DROP TABLE IF EXISTS `rider_order_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rider_order_notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `rider_id` bigint unsigned NOT NULL,
  `notification_sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `response` enum('pending','accepted','declined','expired') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `responded_at` timestamp NULL DEFAULT NULL,
  `decline_reason` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_rider` (`order_id`,`rider_id`),
  KEY `idx_rider_pending` (`rider_id`,`response`),
  CONSTRAINT `rider_order_notifications_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `rider_order_notifications_ibfk_2` FOREIGN KEY (`rider_id`) REFERENCES `riders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rider_reviews`
--

DROP TABLE IF EXISTS `rider_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rider_reviews` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `rider_id` bigint unsigned NOT NULL,
  `rating` tinyint NOT NULL,
  `review_text` text COLLATE utf8mb4_unicode_ci,
  `is_approved` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_rider_review` (`order_id`),
  KEY `user_id` (`user_id`),
  KEY `idx_rider` (`rider_id`),
  KEY `idx_rating` (`rating`),
  CONSTRAINT `rider_reviews_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `rider_reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `rider_reviews_ibfk_3` FOREIGN KEY (`rider_id`) REFERENCES `riders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_rider_rating` CHECK (((`rating` >= 1) and (`rating` <= 5)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `riders`
--

DROP TABLE IF EXISTS `riders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `riders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `rider_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'System generated ID like RDR000001',
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicle_type` enum('bicycle','motorcycle','scooter','car') COLLATE utf8mb4_unicode_ci DEFAULT 'motorcycle',
  `vehicle_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `license_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `is_available` tinyint(1) DEFAULT '0' COMMENT 'Currently available for deliveries',
  `is_online` tinyint(1) DEFAULT '0' COMMENT 'App online status',
  `current_latitude` decimal(10,8) DEFAULT NULL,
  `current_longitude` decimal(11,8) DEFAULT NULL,
  `last_location_update` timestamp NULL DEFAULT NULL,
  `assigned_branch_id` bigint unsigned DEFAULT NULL,
  `average_rating` decimal(3,2) DEFAULT '0.00',
  `total_ratings` int DEFAULT '0',
  `total_deliveries` int DEFAULT '0',
  `last_login_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rider_id` (`rider_id`),
  UNIQUE KEY `phone_number` (`phone_number`),
  KEY `idx_rider_id` (`rider_id`),
  KEY `idx_phone` (`phone_number`),
  KEY `idx_availability` (`is_active`,`is_available`,`is_online`),
  KEY `idx_location` (`current_latitude`,`current_longitude`),
  KEY `idx_branch` (`assigned_branch_id`),
  KEY `idx_deleted` (`deleted_at`),
  CONSTRAINT `fk_rider_branch` FOREIGN KEY (`assigned_branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shopping_carts`
--

DROP TABLE IF EXISTS `shopping_carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shopping_carts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `branch_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_branch` (`user_id`,`branch_id`),
  KEY `branch_id` (`branch_id`),
  CONSTRAINT `shopping_carts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `shopping_carts_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_type` enum('string','number','boolean','json') COLLATE utf8mb4_unicode_ci DEFAULT 'string',
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT '0' COMMENT 'Visible to frontend',
  `is_editable` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`),
  KEY `idx_key` (`setting_key`),
  KEY `idx_public` (`is_public`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_wishlist`
--

DROP TABLE IF EXISTS `user_wishlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_wishlist` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `food_item_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_wishlist` (`user_id`,`food_item_id`),
  KEY `food_item_id` (`food_item_id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `user_wishlist_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_wishlist_ibfk_2` FOREIGN KEY (`food_item_id`) REFERENCES `food_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_type` enum('customer','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'customer',
  `admin_role_id` int unsigned DEFAULT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_phone_verified` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `terms_accepted_at` timestamp NULL DEFAULT NULL,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT 'Soft delete',
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `phone_number` (`phone_number`),
  UNIQUE KEY `email` (`email`),
  KEY `admin_role_id` (`admin_role_id`),
  KEY `idx_user_type` (`user_type`),
  KEY `idx_phone` (`phone_number`),
  KEY `idx_email` (`email`),
  KEY `idx_active` (`is_active`),
  KEY `idx_deleted` (`deleted_at`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`admin_role_id`) REFERENCES `admin_roles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `vw_branch_performance`
--

DROP TABLE IF EXISTS `vw_branch_performance`;
/*!50001 DROP VIEW IF EXISTS `vw_branch_performance`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_branch_performance` AS SELECT 
 1 AS `branch_id`,
 1 AS `branch_name`,
 1 AS `branch_code`,
 1 AS `city`,
 1 AS `is_active`,
 1 AS `total_orders`,
 1 AS `completed_orders`,
 1 AS `cancelled_orders`,
 1 AS `total_revenue`,
 1 AS `avg_delivery_time_mins`,
 1 AS `total_riders`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vw_customer_orders`
--

DROP TABLE IF EXISTS `vw_customer_orders`;
/*!50001 DROP VIEW IF EXISTS `vw_customer_orders`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_customer_orders` AS SELECT 
 1 AS `order_id`,
 1 AS `order_number`,
 1 AS `user_id`,
 1 AS `customer_name`,
 1 AS `phone_number`,
 1 AS `order_status`,
 1 AS `payment_method`,
 1 AS `payment_status`,
 1 AS `subtotal`,
 1 AS `service_fee`,
 1 AS `delivery_fee`,
 1 AS `discount_amount`,
 1 AS `rider_tip`,
 1 AS `total_amount`,
 1 AS `branch_name`,
 1 AS `created_at`,
 1 AS `delivered_at`,
 1 AS `delivery_time_mins`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vw_daily_order_summary`
--

DROP TABLE IF EXISTS `vw_daily_order_summary`;
/*!50001 DROP VIEW IF EXISTS `vw_daily_order_summary`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_daily_order_summary` AS SELECT 
 1 AS `order_date`,
 1 AS `branch_id`,
 1 AS `branch_name`,
 1 AS `total_orders`,
 1 AS `completed_orders`,
 1 AS `cancelled_orders`,
 1 AS `total_food_sales`,
 1 AS `total_service_fees`,
 1 AS `total_delivery_fees`,
 1 AS `total_discounts`,
 1 AS `total_revenue`,
 1 AS `avg_delivery_time_mins`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vw_pending_orders`
--

DROP TABLE IF EXISTS `vw_pending_orders`;
/*!50001 DROP VIEW IF EXISTS `vw_pending_orders`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_pending_orders` AS SELECT 
 1 AS `id`,
 1 AS `order_number`,
 1 AS `order_status`,
 1 AS `payment_method`,
 1 AS `payment_status`,
 1 AS `total_amount`,
 1 AS `created_at`,
 1 AS `admin_reminder_count`,
 1 AS `minutes_since_order`,
 1 AS `customer_id`,
 1 AS `customer_name`,
 1 AS `customer_phone`,
 1 AS `branch_id`,
 1 AS `branch_name`,
 1 AS `rider_id`,
 1 AS `rider_name`,
 1 AS `rider_phone`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vw_rider_performance`
--

DROP TABLE IF EXISTS `vw_rider_performance`;
/*!50001 DROP VIEW IF EXISTS `vw_rider_performance`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_rider_performance` AS SELECT 
 1 AS `rider_id`,
 1 AS `rider_code`,
 1 AS `full_name`,
 1 AS `phone_number`,
 1 AS `assigned_branch_id`,
 1 AS `branch_name`,
 1 AS `is_active`,
 1 AS `is_available`,
 1 AS `average_rating`,
 1 AS `total_ratings`,
 1 AS `total_deliveries`,
 1 AS `successful_deliveries`,
 1 AS `cancelled_deliveries`,
 1 AS `total_tips_earned`,
 1 AS `avg_delivery_time_mins`*/;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `vw_branch_performance`
--

/*!50001 DROP VIEW IF EXISTS `vw_branch_performance`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_branch_performance` AS select `b`.`id` AS `branch_id`,`b`.`branch_name` AS `branch_name`,`b`.`branch_code` AS `branch_code`,`b`.`city` AS `city`,`b`.`is_active` AS `is_active`,count(distinct `o`.`id`) AS `total_orders`,count(distinct (case when (`o`.`order_status` = 'delivered') then `o`.`id` end)) AS `completed_orders`,count(distinct (case when (`o`.`order_status` = 'cancelled') then `o`.`id` end)) AS `cancelled_orders`,coalesce(sum((case when (`o`.`order_status` = 'delivered') then `o`.`total_amount` end)),0) AS `total_revenue`,coalesce(avg((case when (`o`.`order_status` = 'delivered') then timestampdiff(MINUTE,`o`.`created_at`,`o`.`delivered_at`) end)),0) AS `avg_delivery_time_mins`,count(distinct `r`.`id`) AS `total_riders` from ((`branches` `b` left join `orders` `o` on((`b`.`id` = `o`.`branch_id`))) left join `riders` `r` on(((`b`.`id` = `r`.`assigned_branch_id`) and (`r`.`deleted_at` is null)))) where (`b`.`deleted_at` is null) group by `b`.`id`,`b`.`branch_name`,`b`.`branch_code`,`b`.`city`,`b`.`is_active` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vw_customer_orders`
--

/*!50001 DROP VIEW IF EXISTS `vw_customer_orders`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_customer_orders` AS select `o`.`id` AS `order_id`,`o`.`order_number` AS `order_number`,`o`.`user_id` AS `user_id`,concat(`u`.`first_name`,' ',`u`.`last_name`) AS `customer_name`,`u`.`phone_number` AS `phone_number`,`o`.`order_status` AS `order_status`,`o`.`payment_method` AS `payment_method`,`o`.`payment_status` AS `payment_status`,`o`.`subtotal` AS `subtotal`,`o`.`service_fee` AS `service_fee`,`o`.`delivery_fee` AS `delivery_fee`,`o`.`discount_amount` AS `discount_amount`,`o`.`rider_tip` AS `rider_tip`,`o`.`total_amount` AS `total_amount`,`b`.`branch_name` AS `branch_name`,`o`.`created_at` AS `created_at`,`o`.`delivered_at` AS `delivered_at`,timestampdiff(MINUTE,`o`.`created_at`,`o`.`delivered_at`) AS `delivery_time_mins` from ((`orders` `o` join `users` `u` on((`o`.`user_id` = `u`.`id`))) join `branches` `b` on((`o`.`branch_id` = `b`.`id`))) order by `o`.`created_at` desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vw_daily_order_summary`
--

/*!50001 DROP VIEW IF EXISTS `vw_daily_order_summary`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_daily_order_summary` AS select cast(`o`.`created_at` as date) AS `order_date`,`o`.`branch_id` AS `branch_id`,`b`.`branch_name` AS `branch_name`,count(0) AS `total_orders`,sum((case when (`o`.`order_status` = 'delivered') then 1 else 0 end)) AS `completed_orders`,sum((case when (`o`.`order_status` = 'cancelled') then 1 else 0 end)) AS `cancelled_orders`,sum((case when (`o`.`order_status` = 'delivered') then `o`.`subtotal` else 0 end)) AS `total_food_sales`,sum((case when (`o`.`order_status` = 'delivered') then `o`.`service_fee` else 0 end)) AS `total_service_fees`,sum((case when (`o`.`order_status` = 'delivered') then `o`.`delivery_fee` else 0 end)) AS `total_delivery_fees`,sum((case when (`o`.`order_status` = 'delivered') then `o`.`discount_amount` else 0 end)) AS `total_discounts`,sum((case when (`o`.`order_status` = 'delivered') then `o`.`total_amount` else 0 end)) AS `total_revenue`,avg((case when (`o`.`order_status` = 'delivered') then timestampdiff(MINUTE,`o`.`created_at`,`o`.`delivered_at`) end)) AS `avg_delivery_time_mins` from (`orders` `o` join `branches` `b` on((`o`.`branch_id` = `b`.`id`))) group by cast(`o`.`created_at` as date),`o`.`branch_id`,`b`.`branch_name` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vw_pending_orders`
--

/*!50001 DROP VIEW IF EXISTS `vw_pending_orders`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_pending_orders` AS select `o`.`id` AS `id`,`o`.`order_number` AS `order_number`,`o`.`order_status` AS `order_status`,`o`.`payment_method` AS `payment_method`,`o`.`payment_status` AS `payment_status`,`o`.`total_amount` AS `total_amount`,`o`.`created_at` AS `created_at`,`o`.`admin_reminder_count` AS `admin_reminder_count`,timestampdiff(MINUTE,`o`.`created_at`,now()) AS `minutes_since_order`,`u`.`id` AS `customer_id`,concat(`u`.`first_name`,' ',`u`.`last_name`) AS `customer_name`,`u`.`phone_number` AS `customer_phone`,`b`.`id` AS `branch_id`,`b`.`branch_name` AS `branch_name`,`r`.`id` AS `rider_id`,`r`.`full_name` AS `rider_name`,`r`.`phone_number` AS `rider_phone` from (((`orders` `o` join `users` `u` on((`o`.`user_id` = `u`.`id`))) join `branches` `b` on((`o`.`branch_id` = `b`.`id`))) left join `riders` `r` on((`o`.`rider_id` = `r`.`id`))) where (`o`.`order_status` in ('pending','confirmed','processing','ready_for_pickup')) order by (case `o`.`order_status` when 'pending' then 1 when 'confirmed' then 2 when 'processing' then 3 when 'ready_for_pickup' then 4 end),`o`.`created_at` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vw_rider_performance`
--

/*!50001 DROP VIEW IF EXISTS `vw_rider_performance`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_rider_performance` AS select `r`.`id` AS `rider_id`,`r`.`rider_id` AS `rider_code`,`r`.`full_name` AS `full_name`,`r`.`phone_number` AS `phone_number`,`r`.`assigned_branch_id` AS `assigned_branch_id`,`b`.`branch_name` AS `branch_name`,`r`.`is_active` AS `is_active`,`r`.`is_available` AS `is_available`,`r`.`average_rating` AS `average_rating`,`r`.`total_ratings` AS `total_ratings`,`r`.`total_deliveries` AS `total_deliveries`,count(distinct (case when (`o`.`order_status` = 'delivered') then `o`.`id` end)) AS `successful_deliveries`,count(distinct (case when ((`o`.`order_status` = 'cancelled') and (`o`.`rider_id` = `r`.`id`)) then `o`.`id` end)) AS `cancelled_deliveries`,coalesce(sum((case when (`o`.`order_status` = 'delivered') then `o`.`rider_tip` end)),0) AS `total_tips_earned`,avg((case when (`o`.`order_status` = 'delivered') then timestampdiff(MINUTE,`o`.`picked_up_at`,`o`.`delivered_at`) end)) AS `avg_delivery_time_mins` from ((`riders` `r` left join `branches` `b` on((`r`.`assigned_branch_id` = `b`.`id`))) left join `orders` `o` on((`r`.`id` = `o`.`rider_id`))) where (`r`.`deleted_at` is null) group by `r`.`id`,`r`.`rider_id`,`r`.`full_name`,`r`.`phone_number`,`r`.`assigned_branch_id`,`b`.`branch_name`,`r`.`is_active`,`r`.`is_available`,`r`.`average_rating`,`r`.`total_ratings`,`r`.`total_deliveries` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-02 19:28:49
