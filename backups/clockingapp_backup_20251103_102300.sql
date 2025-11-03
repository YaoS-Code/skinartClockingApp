-- MySQL dump 10.13  Distrib 8.0.44, for Linux (aarch64)
--
-- Host: localhost    Database: clockingapp
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `table_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_id` int DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,1,'CREATE','users',3,NULL,'{\"role\": \"user\", \"email\": \"cathy.chen@mmcwellness.ca\", \"status\": \"active\", \"username\": \"cathy_c\", \"full_name\": \"Cathy Chen\"}','2025-10-31 18:04:24','172.18.0.1'),(2,1,'DELETE','users',3,'{\"role\": \"user\", \"email\": \"cathy.chen@mmcwellness.ca\", \"status\": \"active\", \"username\": \"cathy_c\", \"full_name\": \"Cathy Chen\", \"record_count\": 2}',NULL,'2025-10-31 18:42:33','172.18.0.1'),(3,1,'UPDATE','users',3,'{\"role\": \"user\", \"email\": \"cathy.chen@mmcwellness.ca\", \"status\": \"inactive\", \"username\": \"cathy_c\", \"full_name\": \"Cathy Chen\"}','{\"role\": \"user\", \"email\": \"cathy.chen@mmcwellness.ca\", \"status\": \"active\", \"username\": \"cathy_c\", \"full_name\": \"Cathy Chen\", \"password_updated\": false}','2025-10-31 18:42:43','172.18.0.1'),(7,1,'CREATE','users',31,NULL,'{\"role\": \"user\", \"email\": \"alex@skinartmd.ca\", \"status\": \"active\", \"username\": \"alex\", \"full_name\": \"Alex Lai\"}','2025-11-01 01:18:34','2001:569:7da5:f900:cc3f:4aa:ec89:661e'),(8,1,'CREATE','users',32,NULL,'{\"role\": \"user\", \"email\": \"betty@skinartmd.ca\", \"status\": \"active\", \"username\": \"betty\", \"full_name\": \"Betty Yang\"}','2025-11-01 01:18:59','2001:569:7da5:f900:cc3f:4aa:ec89:661e'),(9,1,'CREATE','users',33,NULL,'{\"role\": \"user\", \"email\": \"romy@skinartmd.ca\", \"status\": \"active\", \"username\": \"romy\", \"full_name\": \"Romy Wang\"}','2025-11-01 01:19:20','2001:569:7da5:f900:cc3f:4aa:ec89:661e');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clock_records`
--

DROP TABLE IF EXISTS `clock_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clock_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `clock_in` datetime NOT NULL,
  `clock_out` datetime DEFAULT NULL,
  `status` enum('in','out') COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `break_minutes` int DEFAULT '30',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `modified_by` int DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_info` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `modified_by` (`modified_by`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_clock_in` (`clock_in`),
  KEY `idx_status` (`status`),
  CONSTRAINT `clock_records_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `clock_records_ibfk_2` FOREIGN KEY (`modified_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clock_records`
--

LOCK TABLES `clock_records` WRITE;
/*!40000 ALTER TABLE `clock_records` DISABLE KEYS */;
INSERT INTO `clock_records` VALUES (1,8,'2025-10-31 18:00:29','2025-10-31 18:03:35','out','\nOut: ',30,'2025-11-01 01:00:29','2025-11-01 01:03:35',NULL,'SkinartMD',NULL,NULL),(2,8,'2025-10-31 18:03:44','2025-10-31 18:03:47','out','多少发多少啊\nOut: 多少发多少啊',30,'2025-11-01 01:03:44','2025-11-01 01:03:47',NULL,'SkinartMD',NULL,NULL),(3,8,'2025-10-31 18:04:37','2025-10-31 18:04:39','out','dsafdsafdsa\nOut: dsafdsafdsaf',30,'2025-11-01 01:04:37','2025-11-01 01:04:39',NULL,'SkinartMD',NULL,NULL),(4,8,'2025-10-31 18:08:39',NULL,'in','',30,'2025-11-01 01:08:39','2025-11-01 01:08:39',NULL,'SkinartMD',NULL,NULL),(5,24,'2025-10-31 18:09:36','2025-10-31 18:09:38','out','\nOut: ',30,'2025-11-01 01:09:36','2025-11-01 01:09:38',NULL,'SkinartMD',NULL,NULL),(6,30,'2025-10-31 18:14:00','2025-10-31 18:14:03','out','\nOut: ',30,'2025-11-01 01:14:00','2025-11-01 01:14:03',NULL,'SkinartMD',NULL,NULL),(7,30,'2025-10-31 18:16:13','2025-11-01 18:13:04','out','\nOut: ',30,'2025-11-01 01:16:13','2025-11-02 01:13:04',NULL,'SkinartMD',NULL,NULL),(8,31,'2025-10-31 18:23:05','2025-10-31 18:23:10','out','\nOut: ',30,'2025-11-01 01:23:05','2025-11-01 01:23:10',NULL,'SkinartMD',NULL,NULL),(9,3,'2025-10-31 18:25:17','2025-10-31 18:25:20','out','\nOut: ',30,'2025-11-01 01:25:17','2025-11-01 01:25:20',NULL,'SkinartMD',NULL,NULL),(10,31,'2025-11-01 09:44:06','2025-11-01 18:13:52','out','\nOut: ',30,'2025-11-01 16:44:06','2025-11-02 01:13:52',NULL,'SkinartMD',NULL,NULL),(11,32,'2025-11-01 09:46:15','2025-11-01 18:00:51','out','\nOut: ',0,'2025-11-01 16:46:15','2025-11-02 01:00:51',NULL,'SkinartMD',NULL,NULL),(12,33,'2025-11-01 09:52:08','2025-11-01 18:10:55','out','\nOut: ',30,'2025-11-01 16:52:08','2025-11-02 01:10:55',NULL,'SkinartMD',NULL,NULL),(13,24,'2025-11-01 10:12:44','2025-11-01 18:17:46','out','\nOut: ',30,'2025-11-01 17:12:44','2025-11-02 01:17:46',NULL,'SkinartMD',NULL,NULL),(14,33,'2025-11-02 09:43:02','2025-11-02 16:56:35','out','\nOut: ',30,'2025-11-02 17:43:02','2025-11-03 00:56:35',NULL,'SkinartMD',NULL,NULL);
/*!40000 ALTER TABLE `clock_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','user') COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'manager','$2a$10$X4mIHPBEn8anR/z1jiM9Be4s4iGadPX7K2Y2mcEJaA6loUldBhdqi','manager@company.com','System Manager','admin','2025-10-31 18:00:45','2025-11-03 18:16:58','2025-11-03 18:16:58','active'),(3,'cathy_c','$2a$10$2JPH0Arx8PMgyZ.50KP99OBdly6it30J/hBiPQImkyD5vwtVuO.OG','cathy.chen@mmcwellness.ca','Cathy Chen','user','2025-10-31 18:04:24','2025-11-03 18:16:24','2025-11-03 18:16:24','active'),(8,'yao','$2a$10$1lAYlOa6oNsczZlNbvPdU.hIZy2b3kJHovN/1dGw.4bcCI90erOF6','it@mmcwellness.ca','Yao Song','user','2025-10-31 22:31:33','2025-11-01 16:34:25','2025-11-01 16:34:25','active'),(24,'nicolelo2025','$2a$10$S.1L0m5xEP6h9Wg43ZuJFeS3fZgYj1vD0IwKF/rdeIfYUZaQnGitO','Nicole.lowai@gmail.com','Wai Lo','user','2025-11-01 00:23:16','2025-11-01 17:12:37','2025-11-01 17:12:37','active'),(30,'jc123','$2a$10$qyRSzP4PCXTeM7VYzFZATO4WY5jTs1zEnS6cAhCrEZxRzEijl9rs6','jesssechk@gmail.com','chan hiu kwan jessica','user','2025-11-01 01:13:16','2025-11-02 01:11:35','2025-11-02 01:11:35','active'),(31,'alex','$2a$10$NMLwKaEcV.g148eNWCeDiePBXlfa1X9PN.kOK.AunHP9r0k7lh3Te','alex@skinartmd.ca','Alex Lai','user','2025-11-01 01:18:34','2025-11-02 01:13:23','2025-11-02 01:13:23','active'),(32,'betty','$2a$10$JiOcZFg6nl8XVNLsOEMy4uB5/hPIh6oui41/2HCpOKJL8n0l9DvKe','betty@skinartmd.ca','Betty Yang','user','2025-11-01 01:18:59','2025-11-02 01:00:13','2025-11-02 01:00:13','active'),(33,'romy','$2a$10$I0EK6ExZR3LdnrxtEjWTsOvup3/i82o.pw63iAEi3dpy2gwRMoRlq','romy@skinartmd.ca','Romy Wang','user','2025-11-01 01:19:20','2025-11-02 17:42:58','2025-11-02 17:42:58','active');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-03 10:23:00
