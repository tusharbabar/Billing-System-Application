-- ============================================================
-- Krushi Seva Kendra Billing System - MySQL Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS krushi_seva_kendra;
USE krushi_seva_kendra;

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products / Stock Table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    brand VARCHAR(100),
    unit VARCHAR(50) NOT NULL DEFAULT 'Kg',
    purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    gst_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    hsn_code VARCHAR(50),
    stock_quantity DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    min_stock_alert DECIMAL(10,3) DEFAULT 10.000,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(15),
    email VARCHAR(100),
    address TEXT,
    village VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(100) DEFAULT 'Maharashtra',
    gstin VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bills / Invoices Table
CREATE TABLE IF NOT EXISTS bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT,
    customer_name VARCHAR(200),
    customer_phone VARCHAR(15),
    customer_address TEXT,
    customer_gstin VARCHAR(20),
    bill_date DATE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_discount DECIMAL(10,2) DEFAULT 0.00,
    total_gst DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_method ENUM('cash', 'upi', 'card', 'credit') DEFAULT 'cash',
    payment_status ENUM('paid', 'partial', 'pending') DEFAULT 'paid',
    amount_paid DECIMAL(10,2) DEFAULT 0.00,
    amount_due DECIMAL(10,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Bill Items Table
CREATE TABLE IF NOT EXISTS bill_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    product_id INT,
    product_name VARCHAR(200) NOT NULL,
    hsn_code VARCHAR(50),
    unit VARCHAR(50),
    quantity DECIMAL(10,3) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    gst_rate DECIMAL(5,2) DEFAULT 0.00,
    gst_amount DECIMAL(10,2) DEFAULT 0.00,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Stock Movements Table (for tracking purchases/additions)
CREATE TABLE IF NOT EXISTS stock_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    movement_type ENUM('purchase', 'sale', 'adjustment', 'return') NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit_price DECIMAL(10,2),
    reference_id INT,
    reference_type VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(15),
    email VARCHAR(100),
    address TEXT,
    gstin VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- Seed Data
-- ============================================================

INSERT INTO categories (name, description) VALUES
('Fertilizers', 'Chemical and organic fertilizers'),
('Pesticides', 'Insecticides and pest control products'),
('Seeds', 'Vegetable, fruit, and crop seeds'),
('Farm Tools', 'Agricultural tools and equipment'),
('Irrigation', 'Irrigation pipes and accessories'),
('Agrochemicals', 'Growth promoters and hormones');

INSERT INTO products (category_id, name, brand, unit, purchase_price, selling_price, gst_rate, hsn_code, stock_quantity, min_stock_alert) VALUES
(1, 'DAP Fertilizer', 'IFFCO', 'Bag (50 Kg)', 1100.00, 1300.00, 5.00, '3105', 50.000, 10.000),
(1, 'Urea Fertilizer', 'KRIBHCO', 'Bag (50 Kg)', 300.00, 350.00, 5.00, '3102', 100.000, 20.000),
(1, '10:26:26 NPK', 'Coromandel', 'Bag (50 Kg)', 1450.00, 1650.00, 5.00, '3105', 30.000, 5.000),
(2, 'Chlorpyrifos 20% EC', 'Dhanuka', 'Liter', 350.00, 420.00, 18.00, '3808', 20.000, 5.000),
(2, 'Mancozeb 75% WP', 'UPL', 'Kg', 280.00, 350.00, 18.00, '3808', 15.000, 5.000),
(3, 'Hybrid Tomato Seeds', 'Nunhems', 'Packet (10g)', 180.00, 250.00, 0.00, '1209', 100.000, 20.000),
(3, 'Hybrid Onion Seeds', 'Mahyco', 'Packet (500g)', 850.00, 1100.00, 0.00, '1209', 40.000, 10.000),
(4, 'Hand Sprayer (16L)', 'Neptune', 'Piece', 650.00, 850.00, 18.00, '8424', 10.000, 2.000),
(5, 'Drip Irrigation Pipe (1 inch)', 'Finolex', 'Meter', 25.00, 35.00, 18.00, '3917', 500.000, 100.000),
(6, 'Gibberellic Acid', 'Biolchim', 'Liter', 1200.00, 1500.00, 18.00, '2932', 8.000, 2.000);

INSERT INTO customers (name, phone, address, village, district, state) VALUES
('Ramesh Patil', '9876543210', 'At Post Shirdi', 'Shirdi', 'Ahmednagar', 'Maharashtra'),
('Suresh Jadhav', '9765432109', 'At Post Rahata', 'Rahata', 'Ahmednagar', 'Maharashtra'),
('Mahesh Shinde', '9654321098', 'Kopargaon', 'Kopargaon', 'Ahmednagar', 'Maharashtra'),
('Ganesh Deshmukh', '9543210987', 'At Post Nevasa', 'Nevasa', 'Ahmednagar', 'Maharashtra'),
('Prakash More', '9432109876', 'Sangamner', 'Sangamner', 'Ahmednagar', 'Maharashtra');

-- Users Table (for admin login)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff') DEFAULT 'staff',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default admin user (password: Admin@123)
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@krushiseva.com', '$2b$10$rOvHr8Y.GMz4mLK2HsJqAeA9nPIyT0sQj5bVlWk8XmMJ9TN4pLW0K', 'admin');
