-- Nagar Nigam Complaint Tracker (React + Servlet/JSP + MySQL)
-- MySQL 8.x

CREATE DATABASE IF NOT EXISTS nagar_nigam_db;
USE nagar_nigam_db;

-- Users (citizens + admins)
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NULL UNIQUE,
  phone VARCHAR(20) NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  role ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Complaints
CREATE TABLE IF NOT EXISTS complaints (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tracking_code VARCHAR(30) UNIQUE,
  user_id BIGINT NULL,
  category VARCHAR(80) NOT NULL,
  description TEXT NOT NULL,
  address VARCHAR(255) NULL,
  ward VARCHAR(80) NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  status ENUM('PENDING','ASSIGNED','IN_PROGRESS','RESOLVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_complaints_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Status history / admin notes
CREATE TABLE IF NOT EXISTS complaint_updates (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  complaint_id BIGINT NOT NULL,
  status ENUM('PENDING','ASSIGNED','IN_PROGRESS','RESOLVED','REJECTED') NOT NULL,
  comment VARCHAR(500) NULL,
  updated_by BIGINT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_updates_complaint FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  CONSTRAINT fk_updates_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Attachments (file metadata; file stored on server disk)
CREATE TABLE IF NOT EXISTS attachments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  complaint_id BIGINT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  stored_path VARCHAR(500) NOT NULL,
  mime_type VARCHAR(120) NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attachments_complaint FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
);

-- Default admin (password: admin123)
-- BCrypt hash for "admin123" (jBCrypt)
INSERT INTO users (full_name, email, phone, password_hash, role)
SELECT 'Admin', 'admin@nagar-nigam.local', NULL, '$2a$10$vMy8xt0N10aofqKv8xZ2euHbdnB7Zc2dP2PV2VtSmZwpSmok1OkOW', 'ADMIN'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='admin@nagar-nigam.local');

-- NOTE:
-- If you already created the admin but password is not working, run this:
-- UPDATE users SET password_hash='$2a$10$vMy8xt0N10aofqKv8xZ2euHbdnB7Zc2dP2PV2VtSmZwpSmok1OkOW' WHERE email='admin@nagar-nigam.local';
