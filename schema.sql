-- ========================================================
-- SHREERAKSHA SOLUTIONS - GST INVOICING & FINANCIAL SYSTEM
-- COMPLETE DATABASE SCHEMA DEFINITION FOR MYSQL 8.0+
-- ========================================================

CREATE DATABASE IF NOT EXISTS `shreeraksha_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `shreeraksha_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. ORGANIZATION SETTINGS & BANK PROFILE
DROP TABLE IF EXISTS `organization_settings`;
CREATE TABLE `organization_settings` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY DEFAULT 'default',
  `name` VARCHAR(255) NOT NULL,
  `legal_name` VARCHAR(255) DEFAULT NULL,
  `tax_id` VARCHAR(50) DEFAULT NULL,
  `msme_reg_no` VARCHAR(100) DEFAULT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `phone` VARCHAR(100) DEFAULT NULL,
  `website` VARCHAR(255) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `state` VARCHAR(100) DEFAULT NULL,
  `currency` VARCHAR(10) DEFAULT 'INR',
  `currency_symbol` VARCHAR(10) DEFAULT '₹',
  `logo` VARCHAR(255) DEFAULT 'assets/shreeraksha-logo.svg',
  `theme_color` VARCHAR(50) DEFAULT 'zoho',
  `invoice_prefix` VARCHAR(50) DEFAULT 'SHRKS/Inv/26-27/',
  `estimate_prefix` VARCHAR(50) DEFAULT 'SHRKS/Qtn/26-27/',
  `po_prefix` VARCHAR(50) DEFAULT 'SHRKS/PO/26-27/',
  `credit_note_prefix` VARCHAR(50) DEFAULT 'SHRKS/CN/26-27/',
  `debit_note_prefix` VARCHAR(50) DEFAULT 'SHRKS/DN/26-27/',
  `default_payment_terms` VARCHAR(100) DEFAULT '30 Days net',
  `bank_name` VARCHAR(150) DEFAULT NULL,
  `account_name` VARCHAR(150) DEFAULT NULL,
  `account_number` VARCHAR(100) DEFAULT NULL,
  `ifsc_code` VARCHAR(50) DEFAULT NULL,
  `branch` VARCHAR(150) DEFAULT NULL,
  `micr_code` VARCHAR(50) DEFAULT '576002012',
  `bank_details` TEXT DEFAULT NULL,
  `default_notes` TEXT DEFAULT NULL,
  `default_terms` TEXT DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TAX RATES MASTER
DROP TABLE IF EXISTS `taxes`;
CREATE TABLE `taxes` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `rate` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. PARTIES (CUSTOMERS & VENDORS MASTER)
DROP TABLE IF EXISTS `parties`;
CREATE TABLE `parties` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `category` VARCHAR(20) NOT NULL DEFAULT 'customer',
  `name` VARCHAR(255) NOT NULL,
  `company` VARCHAR(255) DEFAULT NULL,
  `attention` VARCHAR(255) DEFAULT NULL,
  `is_vendor` TINYINT(1) DEFAULT 0,
  `email` VARCHAR(150) DEFAULT NULL,
  `phone` VARCHAR(100) DEFAULT NULL,
  `tax_id` VARCHAR(50) DEFAULT NULL,
  `place_of_supply` VARCHAR(100) DEFAULT 'Karnataka (29)',
  `currency` VARCHAR(10) DEFAULT 'INR',
  `billing_address` TEXT NOT NULL,
  `shipping_address` TEXT DEFAULT NULL,
  `payment_terms` VARCHAR(100) DEFAULT '30 Days net',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_parties_category (`category`),
  INDEX idx_parties_name (`name`),
  INDEX idx_parties_tax (`tax_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. PARTY CONTACT PERSONS DIRECTORY
DROP TABLE IF EXISTS `party_contacts`;
CREATE TABLE `party_contacts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `party_id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `designation` VARCHAR(150) DEFAULT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `phone` VARCHAR(100) DEFAULT NULL,
  `is_primary` TINYINT(1) DEFAULT 0,
  `sort_order` INT DEFAULT 0,
  CONSTRAINT fk_contact_party FOREIGN KEY (`party_id`) REFERENCES `parties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. ITEMS & SERVICES CATALOG (HSN / SAC)
DROP TABLE IF EXISTS `items`;
CREATE TABLE `items` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `item_type` VARCHAR(20) NOT NULL DEFAULT 'product',
  `hsn_code` VARCHAR(50) DEFAULT NULL,
  `sac_code` VARCHAR(50) DEFAULT NULL,
  `sku` VARCHAR(100) DEFAULT NULL,
  `rate` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `unit` VARCHAR(50) DEFAULT 'nos',
  `tax_rate` DECIMAL(5,2) DEFAULT 18.00,
  `tax_rate_id` VARCHAR(50) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_items_sku (`sku`),
  INDEX idx_items_hsn (`hsn_code`),
  INDEX idx_items_sac (`sac_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. ESTIMATES / QUOTATIONS
DROP TABLE IF EXISTS `estimates`;
CREATE TABLE `estimates` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `number` VARCHAR(100) NOT NULL UNIQUE,
  `customer_id` VARCHAR(50) NOT NULL,
  `attention` VARCHAR(255) DEFAULT NULL,
  `date` DATE NOT NULL,
  `expiry_date` DATE DEFAULT NULL,
  `place_of_supply` VARCHAR(100) DEFAULT 'Karnataka (29)',
  `status` VARCHAR(50) DEFAULT 'draft',
  `reference` VARCHAR(100) DEFAULT NULL,
  `payment_terms` VARCHAR(100) DEFAULT '30 Days net',
  `subtotal` DECIMAL(15,2) DEFAULT 0.00,
  `discount_total` DECIMAL(15,2) DEFAULT 0.00,
  `taxable_amount` DECIMAL(15,2) DEFAULT 0.00,
  `cgst_amount` DECIMAL(15,2) DEFAULT 0.00,
  `sgst_amount` DECIMAL(15,2) DEFAULT 0.00,
  `igst_amount` DECIMAL(15,2) DEFAULT 0.00,
  `tax_total` DECIMAL(15,2) DEFAULT 0.00,
  `round_off` DECIMAL(10,2) DEFAULT 0.00,
  `total` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `notes` TEXT DEFAULT NULL,
  `terms` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_est_customer (`customer_id`),
  INDEX idx_est_status (`status`),
  CONSTRAINT fk_est_customer FOREIGN KEY (`customer_id`) REFERENCES `parties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. ESTIMATE LINE ITEMS
DROP TABLE IF EXISTS `estimate_items`;
CREATE TABLE `estimate_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `estimate_id` VARCHAR(50) NOT NULL,
  `item_id` VARCHAR(50) DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `item_type` VARCHAR(20) DEFAULT 'product',
  `hsn_code` VARCHAR(50) DEFAULT NULL,
  `sac_code` VARCHAR(50) DEFAULT NULL,
  `quantity` DECIMAL(12,2) NOT NULL DEFAULT 1.00,
  `unit` VARCHAR(50) DEFAULT 'nos',
  `rate` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `discount_type` VARCHAR(20) DEFAULT 'percent',
  `discount` DECIMAL(12,2) DEFAULT 0.00,
  `tax_rate` DECIMAL(5,2) DEFAULT 18.00,
  `taxable_amount` DECIMAL(15,2) DEFAULT 0.00,
  `tax_amount` DECIMAL(15,2) DEFAULT 0.00,
  `total` DECIMAL(15,2) DEFAULT 0.00,
  `sort_order` INT DEFAULT 0,
  INDEX idx_est_items_est (`estimate_id`),
  CONSTRAINT fk_est_items_parent FOREIGN KEY (`estimate_id`) REFERENCES `estimates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. TAX INVOICES (CORE RECEIVABLES & SALES METRICS)
DROP TABLE IF EXISTS `invoices`;
CREATE TABLE `invoices` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `number` VARCHAR(100) NOT NULL UNIQUE,
  `customer_id` VARCHAR(50) NOT NULL,
  `attention` VARCHAR(255) DEFAULT NULL,
  `date` DATE NOT NULL,
  `due_date` DATE NOT NULL,
  `place_of_supply` VARCHAR(100) DEFAULT 'Karnataka (29)',
  `payment_terms` VARCHAR(100) DEFAULT '30 Days net',
  `status` VARCHAR(50) DEFAULT 'draft',
  `subtotal` DECIMAL(15,2) DEFAULT 0.00,
  `discount_total` DECIMAL(15,2) DEFAULT 0.00,
  `taxable_amount` DECIMAL(15,2) DEFAULT 0.00,
  `cgst_amount` DECIMAL(15,2) DEFAULT 0.00,
  `sgst_amount` DECIMAL(15,2) DEFAULT 0.00,
  `igst_amount` DECIMAL(15,2) DEFAULT 0.00,
  `tax_total` DECIMAL(15,2) DEFAULT 0.00,
  `round_off` DECIMAL(10,2) DEFAULT 0.00,
  `total` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `amount_paid` DECIMAL(15,2) DEFAULT 0.00,
  `balance_due` DECIMAL(15,2) DEFAULT 0.00,
  `notes` TEXT DEFAULT NULL,
  `terms` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_inv_customer (`customer_id`),
  INDEX idx_inv_status (`status`),
  INDEX idx_inv_due_date (`due_date`),
  CONSTRAINT fk_inv_customer FOREIGN KEY (`customer_id`) REFERENCES `parties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. TAX INVOICE LINE ITEMS
DROP TABLE IF EXISTS `invoice_items`;
CREATE TABLE `invoice_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_id` VARCHAR(50) NOT NULL,
  `item_id` VARCHAR(50) DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `item_type` VARCHAR(20) DEFAULT 'product',
  `hsn_code` VARCHAR(50) DEFAULT NULL,
  `sac_code` VARCHAR(50) DEFAULT NULL,
  `quantity` DECIMAL(12,2) NOT NULL DEFAULT 1.00,
  `unit` VARCHAR(50) DEFAULT 'nos',
  `rate` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `discount_type` VARCHAR(20) DEFAULT 'percent',
  `discount` DECIMAL(12,2) DEFAULT 0.00,
  `tax_rate` DECIMAL(5,2) DEFAULT 18.00,
  `taxable_amount` DECIMAL(15,2) DEFAULT 0.00,
  `tax_amount` DECIMAL(15,2) DEFAULT 0.00,
  `total` DECIMAL(15,2) DEFAULT 0.00,
  `sort_order` INT DEFAULT 0,
  INDEX idx_inv_items_inv (`invoice_id`),
  CONSTRAINT fk_inv_items_parent FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. PAYMENTS RECEIVED LEDGER
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `payment_number` VARCHAR(100) NOT NULL UNIQUE,
  `date` DATE NOT NULL,
  `customer_id` VARCHAR(50) NOT NULL,
  `invoice_id` VARCHAR(50) NOT NULL,
  `invoice_number` VARCHAR(100) DEFAULT NULL,
  `amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `mode` VARCHAR(50) DEFAULT 'bank',
  `reference` VARCHAR(100) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pay_customer (`customer_id`),
  INDEX idx_pay_invoice (`invoice_id`),
  INDEX idx_pay_date (`date`),
  CONSTRAINT fk_pay_customer FOREIGN KEY (`customer_id`) REFERENCES `parties` (`id`) ON DELETE CASCADE,
  CONSTRAINT fk_pay_invoice FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. PURCHASE ORDERS (VENDOR PROCUREMENT)
DROP TABLE IF EXISTS `purchase_orders`;
CREATE TABLE `purchase_orders` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `number` VARCHAR(100) NOT NULL UNIQUE,
  `vendor_id` VARCHAR(50) NOT NULL,
  `attention` VARCHAR(255) DEFAULT NULL,
  `date` DATE NOT NULL,
  `due_date` DATE DEFAULT NULL,
  `place_of_supply` VARCHAR(100) DEFAULT 'Karnataka (29)',
  `status` VARCHAR(50) DEFAULT 'draft',
  `reference` VARCHAR(100) DEFAULT NULL,
  `payment_terms` VARCHAR(100) DEFAULT 'Net 30',
  `subtotal` DECIMAL(15,2) DEFAULT 0.00,
  `discount_total` DECIMAL(15,2) DEFAULT 0.00,
  `taxable_amount` DECIMAL(15,2) DEFAULT 0.00,
  `cgst_amount` DECIMAL(15,2) DEFAULT 0.00,
  `sgst_amount` DECIMAL(15,2) DEFAULT 0.00,
  `igst_amount` DECIMAL(15,2) DEFAULT 0.00,
  `tax_total` DECIMAL(15,2) DEFAULT 0.00,
  `round_off` DECIMAL(10,2) DEFAULT 0.00,
  `total` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `notes` TEXT DEFAULT NULL,
  `terms` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_po_vendor (`vendor_id`),
  INDEX idx_po_status (`status`),
  CONSTRAINT fk_po_vendor FOREIGN KEY (`vendor_id`) REFERENCES `parties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. PURCHASE ORDER ITEMS
DROP TABLE IF EXISTS `purchase_order_items`;
CREATE TABLE `purchase_order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `po_id` VARCHAR(50) NOT NULL,
  `item_id` VARCHAR(50) DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `item_type` VARCHAR(20) DEFAULT 'product',
  `hsn_code` VARCHAR(50) DEFAULT NULL,
  `sac_code` VARCHAR(50) DEFAULT NULL,
  `quantity` DECIMAL(12,2) NOT NULL DEFAULT 1.00,
  `unit` VARCHAR(50) DEFAULT 'nos',
  `rate` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `discount_type` VARCHAR(20) DEFAULT 'percent',
  `discount` DECIMAL(12,2) DEFAULT 0.00,
  `tax_rate` DECIMAL(5,2) DEFAULT 18.00,
  `taxable_amount` DECIMAL(15,2) DEFAULT 0.00,
  `tax_amount` DECIMAL(15,2) DEFAULT 0.00,
  `total` DECIMAL(15,2) DEFAULT 0.00,
  `sort_order` INT DEFAULT 0,
  INDEX idx_po_items_po (`po_id`),
  CONSTRAINT fk_po_items_parent FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. CREDIT & DEBIT NOTES
DROP TABLE IF EXISTS `debit_credit_notes`;
CREATE TABLE `debit_credit_notes` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `number` VARCHAR(100) NOT NULL UNIQUE,
  `doc_type` VARCHAR(50) NOT NULL,
  `party_type` VARCHAR(20) NOT NULL,
  `party_id` VARCHAR(50) NOT NULL,
  `attention` VARCHAR(255) DEFAULT NULL,
  `date` DATE NOT NULL,
  `original_invoice_number` VARCHAR(100) NOT NULL,
  `place_of_supply` VARCHAR(100) DEFAULT 'Karnataka (29)',
  `status` VARCHAR(50) DEFAULT 'draft',
  `reason` TEXT NOT NULL,
  `subtotal` DECIMAL(15,2) DEFAULT 0.00,
  `discount_total` DECIMAL(15,2) DEFAULT 0.00,
  `taxable_amount` DECIMAL(15,2) DEFAULT 0.00,
  `cgst_amount` DECIMAL(15,2) DEFAULT 0.00,
  `sgst_amount` DECIMAL(15,2) DEFAULT 0.00,
  `igst_amount` DECIMAL(15,2) DEFAULT 0.00,
  `tax_total` DECIMAL(15,2) DEFAULT 0.00,
  `round_off` DECIMAL(10,2) DEFAULT 0.00,
  `total` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_note_party (`party_id`),
  INDEX idx_note_type (`doc_type`),
  CONSTRAINT fk_note_party FOREIGN KEY (`party_id`) REFERENCES `parties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. CREDIT & DEBIT NOTE ITEMS
DROP TABLE IF EXISTS `note_items`;
CREATE TABLE `note_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `note_id` VARCHAR(50) NOT NULL,
  `item_id` VARCHAR(50) DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `item_type` VARCHAR(20) DEFAULT 'product',
  `hsn_code` VARCHAR(50) DEFAULT NULL,
  `sac_code` VARCHAR(50) DEFAULT NULL,
  `quantity` DECIMAL(12,2) NOT NULL DEFAULT 1.00,
  `unit` VARCHAR(50) DEFAULT 'nos',
  `rate` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `discount_type` VARCHAR(20) DEFAULT 'percent',
  `discount` DECIMAL(12,2) DEFAULT 0.00,
  `tax_rate` DECIMAL(5,2) DEFAULT 18.00,
  `taxable_amount` DECIMAL(15,2) DEFAULT 0.00,
  `tax_amount` DECIMAL(15,2) DEFAULT 0.00,
  `total` DECIMAL(15,2) DEFAULT 0.00,
  `sort_order` INT DEFAULT 0,
  INDEX idx_note_items_note (`note_id`),
  CONSTRAINT fk_note_items_parent FOREIGN KEY (`note_id`) REFERENCES `debit_credit_notes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. EXPENSES (ACCOUNTS & PROFITABILITY TRACKING)
DROP TABLE IF EXISTS `expenses`;
CREATE TABLE `expenses` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `date` DATE NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `vendor` VARCHAR(255) NOT NULL,
  `customer_id` VARCHAR(50) DEFAULT NULL,
  `billable` TINYINT(1) DEFAULT 0,
  `status` VARCHAR(50) DEFAULT 'unbilled',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_exp_date (`date`),
  INDEX idx_exp_category (`category`),
  INDEX idx_exp_customer (`customer_id`),
  CONSTRAINT fk_exp_customer FOREIGN KEY (`customer_id`) REFERENCES `parties` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. RECURRING INVOICE PROFILES
DROP TABLE IF EXISTS `recurring_profiles`;
CREATE TABLE `recurring_profiles` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `profile_name` VARCHAR(255) NOT NULL,
  `customer_id` VARCHAR(50) NOT NULL,
  `repeat_every` VARCHAR(50) NOT NULL,
  `start_date` DATE NOT NULL,
  `next_run_date` DATE NOT NULL,
  `status` VARCHAR(50) DEFAULT 'active',
  `subtotal` DECIMAL(15,2) DEFAULT 0.00,
  `total` DECIMAL(15,2) DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_rec_customer (`customer_id`),
  CONSTRAINT fk_rec_customer FOREIGN KEY (`customer_id`) REFERENCES `parties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. RECURRING PROFILE ITEMS
DROP TABLE IF EXISTS `recurring_profile_items`;
CREATE TABLE `recurring_profile_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `profile_id` VARCHAR(50) NOT NULL,
  `item_id` VARCHAR(50) DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `quantity` DECIMAL(12,2) DEFAULT 1.00,
  `rate` DECIMAL(15,2) DEFAULT 0.00,
  `discount` DECIMAL(12,2) DEFAULT 0.00,
  `tax_rate_id` VARCHAR(50) DEFAULT NULL,
  `amount` DECIMAL(15,2) DEFAULT 0.00,
  INDEX idx_rec_items_prof (`profile_id`),
  CONSTRAINT fk_rec_items_parent FOREIGN KEY (`profile_id`) REFERENCES `recurring_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. PROJECTS
DROP TABLE IF EXISTS `projects`;
CREATE TABLE `projects` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `customer_id` VARCHAR(50) NOT NULL,
  `billing_method` VARCHAR(50) DEFAULT 'hourly',
  `rate_per_hour` DECIMAL(15,2) DEFAULT 0.00,
  `status` VARCHAR(50) DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_proj_customer (`customer_id`),
  CONSTRAINT fk_proj_customer FOREIGN KEY (`customer_id`) REFERENCES `parties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. PROJECT TASKS
DROP TABLE IF EXISTS `project_tasks`;
CREATE TABLE `project_tasks` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `project_id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `budget_hours` DECIMAL(8,2) DEFAULT 0.00,
  INDEX idx_task_proj (`project_id`),
  CONSTRAINT fk_task_proj FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. TIMESHEETS
DROP TABLE IF EXISTS `timesheets`;
CREATE TABLE `timesheets` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `project_id` VARCHAR(50) NOT NULL,
  `task_id` VARCHAR(50) DEFAULT NULL,
  `date` DATE NOT NULL,
  `hours` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_time_proj (`project_id`),
  INDEX idx_time_date (`date`),
  CONSTRAINT fk_time_proj FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. ACTIVITIES / AUDIT LOG (POWERS DASHBOARD RECENT ACTIVITY FEED)
DROP TABLE IF EXISTS `activities`;
CREATE TABLE `activities` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `text` TEXT NOT NULL,
  `time` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
