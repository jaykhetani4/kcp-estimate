-- Schema for KCP Quotation System

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  product_type VARCHAR(20) NOT NULL CHECK (product_type IN ('paver_block', 'curb_stone')),
  thickness_dimension VARCHAR(100),
  available_colors TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Estimates Table
CREATE TABLE IF NOT EXISTS estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_number VARCHAR(30) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Estimate Items Table
CREATE TABLE IF NOT EXISTS estimate_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_snapshot JSONB NOT NULL,
  price_per_unit DECIMAL(12, 2) NOT NULL,
  price_unit VARCHAR(20) NOT NULL CHECK (price_unit IN ('per_sqft', 'per_piece')),
  gst_percent DECIMAL(5, 2) DEFAULT 0,
  transportation_cost DECIMAL(12, 2) DEFAULT 0,
  loading_unloading_cost DECIMAL(12, 2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

-- Estimate Notes Table
CREATE TABLE IF NOT EXISTS estimate_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_estimates_date ON estimates(date);
CREATE INDEX IF NOT EXISTS idx_estimates_customer ON estimates(customer_name);
CREATE INDEX IF NOT EXISTS idx_items_estimate ON estimate_items(estimate_id);
CREATE INDEX IF NOT EXISTS idx_notes_estimate ON estimate_notes(estimate_id);
