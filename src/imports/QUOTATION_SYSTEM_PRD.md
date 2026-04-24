# 📋 Quotation Management System — Full Project Documentation

> **Project Name:** QuoteFlow — Paver Block & Curb Stone Quotation Manager
> **Version:** 1.0.0
> **Stack:** React.js · Node.js · Express.js · PostgreSQL (Neon DB)
> **Target Users:** Business Owner (Dad) & Admin (You)
> **Last Updated:** April 2026

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution Overview](#2-solution-overview)
3. [System Architecture](#3-system-architecture)
4. [Database Schema](#4-database-schema)
5. [API Design](#5-api-design)
6. [Frontend Pages & Components](#6-frontend-pages--components)
7. [Module Breakdown](#7-module-breakdown)
8. [Template Engine](#8-template-engine)
9. [Export & Share System](#9-export--share-system)
10. [User Access & Auth](#10-user-access--auth)
11. [Constraints & Business Rules](#11-constraints--business-rules)
12. [Folder Structure](#12-folder-structure)
13. [Environment & Configuration](#13-environment--configuration)
14. [Future Scope](#14-future-scope)

---

## 1. Problem Statement

### Context

A small manufacturing business producing **Paver Blocks** and **Curb Stones** currently creates client quotations manually — likely using Word documents or hand-written sheets. Every time a quotation needs to be sent, the business owner (Dad) must:

- Recall product names, dimensions, colors, and thicknesses from memory
- Manually retype or copy-paste a letterhead into Word
- Format a table of products with pricing, GST, transportation, and loading costs
- Add terms and conditions from scratch every time
- Print, photograph, or email the document manually
- Have no historical record of what was quoted to which client

### Pain Points

| Problem | Impact |
|---|---|
| No centralized product catalog | Wastes time, risk of wrong pricing |
| Manual letterhead formatting | Breaks branding consistency |
| No estimate history | Cannot track past quotations or compare |
| No standard format | Different quotations look different |
| Manual WhatsApp sharing | Multi-step, error-prone process |
| No multi-user access | Dad and son cannot collaborate |

---

## 2. Solution Overview

**QuoteFlow** is a web-based quotation management system tailored for this paver block business. It solves every problem above:

- **Product Master** — Add, edit, delete products with pricing structures once; reuse forever
- **Estimate Builder** — Create professional quotations quickly by selecting from the product master
- **Locked Letterhead Template** — Branding is always consistent; only body content changes
- **Document Export** — One-click DOCX download or WhatsApp share
- **Estimate History** — Full CRUD with filters by month, year, or financial year
- **Multi-User Login** — Dad and son both access the same system

---

## 3. System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────┐
│                  CLIENT (Browser)                │
│         React.js SPA — Tailwind CSS             │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Products │  │Estimates │  │  Auth Pages  │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
└────────────────────────┬────────────────────────┘
                         │ HTTPS / REST API
                         │ Axios
┌────────────────────────▼────────────────────────┐
│              BACKEND (Node.js + Express)         │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Products │  │Estimates │  │    Auth      │  │
│  │  Router  │  │  Router  │  │   Router     │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │         Middleware Layer                 │   │
│  │  Auth (JWT) · Validation · Error Handler │   │
│  └──────────────────────────────────────────┘   │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │         Export Service                  │   │
│  │  docx-js · Template Renderer            │   │
│  └──────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────┘
                         │ SSL
┌────────────────────────▼────────────────────────┐
│          DATABASE (Neon DB — PostgreSQL)          │
│                                                 │
│  users · products · estimates ·                 │
│  estimate_items · estimate_notes                │
└─────────────────────────────────────────────────┘
```

### Architecture Decisions

| Decision | Choice | Reason |
|---|---|---|
| Frontend | React.js (Vite) | Fast dev, component reuse, rich ecosystem |
| Backend | Node.js + Express | Lightweight, JS throughout, easy REST APIs |
| Database | Neon DB (PostgreSQL) | Serverless Postgres, free tier, scales well |
| Auth | JWT (Access Token) | Stateless, simple for 2-user system |
| Export | docx-js (server-side) | Preserves letterhead template fidelity |
| Styling | Tailwind CSS | Rapid UI, consistent design tokens |
| HTTP Client | Axios | Interceptors for auth headers |
| State | React Context + useState | Simple scope; no need for Redux at this scale |

---

## 4. Database Schema

### Entity Relationship Diagram

```
users
  └── id (PK)
  └── name
  └── email
  └── password_hash
  └── role
  └── created_at

products
  └── id (PK)
  └── name
  └── product_type         → ENUM: 'paver_block' | 'curb_stone'
  └── thickness_dimension  → e.g. "60mm", "100x200x60"
  └── available_colors     → TEXT[] (array)
  └── is_active            → BOOLEAN (soft delete)
  └── created_at
  └── updated_at

estimates
  └── id (PK)
  └── estimate_number      → Auto-generated: QF-2026-0001
  └── customer_name
  └── company_name
  └── city
  └── state
  └── date
  └── created_by           → FK → users.id
  └── status               → ENUM: 'draft' | 'sent'
  └── created_at
  └── updated_at

estimate_items
  └── id (PK)
  └── estimate_id          → FK → estimates.id (CASCADE DELETE)
  └── product_id           → FK → products.id
  └── product_snapshot     → JSONB (captures product name/details at time of estimate)
  └── price_per_unit       → DECIMAL(10,2)
  └── price_unit           → ENUM: 'per_sqft' | 'per_piece'
  └── gst_percent          → DECIMAL(5,2)
  └── transportation_cost  → DECIMAL(10,2)
  └── loading_unloading_cost → DECIMAL(10,2)
  └── sort_order           → INTEGER (for display ordering)
  └── created_at

estimate_notes
  └── id (PK)
  └── estimate_id          → FK → estimates.id (CASCADE DELETE)
  └── note_text            → TEXT
  └── sort_order           → INTEGER
  └── created_at
```

### SQL: Create Tables

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  product_type VARCHAR(20) NOT NULL CHECK (product_type IN ('paver_block', 'curb_stone')),
  thickness_dimension VARCHAR(100),
  available_colors TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Estimates
CREATE TABLE estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_number VARCHAR(20) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  created_by UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Estimate Items
CREATE TABLE estimate_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_snapshot JSONB NOT NULL,
  price_per_unit DECIMAL(10,2) NOT NULL,
  price_unit VARCHAR(20) NOT NULL CHECK (price_unit IN ('per_sqft', 'per_piece')),
  gst_percent DECIMAL(5,2) DEFAULT 0,
  transportation_cost DECIMAL(10,2) DEFAULT 0,
  loading_unloading_cost DECIMAL(10,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Estimate Notes
CREATE TABLE estimate_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_estimates_date ON estimates(date);
CREATE INDEX idx_estimates_created_by ON estimates(created_by);
CREATE INDEX idx_estimate_items_estimate ON estimate_items(estimate_id);
CREATE INDEX idx_estimate_notes_estimate ON estimate_notes(estimate_id);
CREATE INDEX idx_products_active ON products(is_active);
```

### Key Design Notes

- **`product_snapshot` (JSONB):** When an estimate is created, a snapshot of the product's name, type, dimensions, and colors is saved. This ensures old estimates remain accurate even if the product is later edited.
- **`is_active` (soft delete):** Products are never hard deleted. Setting `is_active = false` hides them from the product picker but preserves data integrity for old estimates.
- **`estimate_number`:** Auto-generated in format `QF-YYYY-NNNN` (e.g., QF-2026-0001). Sequenced per year.
- **Financial Year filter:** April–March (e.g., FY 2025–26 = April 2025 to March 2026). Calculated in query using `date` field.

---

## 5. API Design

### Base URL
```
Development:  http://localhost:5000/api
Production:   https://your-domain.com/api
```

### Authentication

All routes (except login) require:
```
Authorization: Bearer <JWT_TOKEN>
```

---

### Auth Routes

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Login with email + password |
| POST | `/auth/logout` | Invalidate token (client-side) |
| GET | `/auth/me` | Get current user info |

**POST /auth/login — Request:**
```json
{
  "email": "dad@business.com",
  "password": "securepassword"
}
```

**POST /auth/login — Response:**
```json
{
  "token": "eyJhbGci...",
  "user": { "id": "uuid", "name": "Dad", "email": "dad@business.com" }
}
```

---

### Product Routes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/products` | List all active products |
| GET | `/products/:id` | Get single product |
| POST | `/products` | Create product |
| PUT | `/products/:id` | Update product |
| DELETE | `/products/:id` | Soft delete product |

**POST /products — Request Body:**
```json
{
  "name": "Standard Grey Paver",
  "product_type": "paver_block",
  "thickness_dimension": "60mm",
  "available_colors": ["Grey", "Red", "Yellow"]
}
```

**Validation Rules:**
- `name`: required, max 255 chars
- `product_type`: required, must be `paver_block` or `curb_stone`
- `thickness_dimension`: optional, max 100 chars
- `available_colors`: optional array of strings

---

### Estimate Routes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/estimates` | List estimates (with filters) |
| GET | `/estimates/:id` | Get full estimate with items + notes |
| POST | `/estimates` | Create estimate |
| PUT | `/estimates/:id` | Update estimate |
| DELETE | `/estimates/:id` | Delete estimate |
| GET | `/estimates/:id/export` | Generate and download DOCX |
| GET | `/estimates/:id/preview` | Get preview-ready JSON payload |

**GET /estimates — Query Params:**
```
?month=4&year=2026            → April 2026
?year=2026                    → Full calendar year
?fy=2025                      → Financial Year April 2025 – March 2026
?search=customer_name         → Search by customer name
```

**POST /estimates — Request Body:**
```json
{
  "customer_name": "Ramesh Patel",
  "company_name": "Patel Construction",
  "city": "Ahmedabad",
  "state": "Gujarat",
  "date": "2026-04-24",
  "items": [
    {
      "product_id": "uuid",
      "price_per_unit": 55.00,
      "price_unit": "per_sqft",
      "gst_percent": 18,
      "transportation_cost": 5.00,
      "loading_unloading_cost": 2.00,
      "sort_order": 1
    }
  ],
  "notes": [
    { "note_text": "Payment within 30 days", "sort_order": 1 },
    { "note_text": "GST extra as applicable", "sort_order": 2 }
  ]
}
```

---

### Export Route

```
GET /estimates/:id/export
Response: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Disposition: attachment; filename="QF-2026-0001_RameshPatel.docx"
```

The backend reads the DOCX template, injects the estimate data, and streams the file back.

---

## 6. Frontend Pages & Components

### Page List

| Page | Route | Description |
|---|---|---|
| Login | `/login` | Email + password login |
| Dashboard | `/` | Summary stats + quick actions |
| Products List | `/products` | View all products |
| Add Product | `/products/new` | Add new product form |
| Edit Product | `/products/:id/edit` | Edit product form |
| Estimates List | `/estimates` | All estimates with filters |
| Create Estimate | `/estimates/new` | Full estimate builder |
| Edit Estimate | `/estimates/:id/edit` | Edit existing estimate |
| Preview Estimate | `/estimates/:id/preview` | Print-like preview view |
| Not Found | `*` | 404 page |

---

### Page 1: Login (`/login`)

**Purpose:** Authenticate user before accessing any part of the system.

**UI Elements:**
- Business logo / name at top
- Email input
- Password input (with show/hide toggle)
- Login button
- Error message on invalid credentials

**Behavior:**
- On success → JWT stored in `localStorage` → redirect to Dashboard
- On failure → show "Invalid email or password"
- If already logged in → redirect to Dashboard

**Constraints:**
- No "Remember Me" (sessions last 8 hours)
- No self-registration (users are seeded in DB)

---

### Page 2: Dashboard (`/`)

**Purpose:** Quick overview of the business.

**UI Elements:**
- Top stat cards:
  - Total Estimates This Month
  - Total Estimates This Financial Year
  - Total Products in Catalog
- Recent Estimates table (last 10)
- Quick action buttons: "New Estimate", "Add Product"
- Current date + financial year displayed

**Behavior:**
- Stats fetched on load
- Recent estimates show: Estimate #, Customer, Date, Status
- Clicking an estimate opens Edit/Preview

---

### Page 3: Products List (`/products`)

**Purpose:** View and manage the product master catalog.

**UI Elements:**
- Search bar (by product name)
- Filter by Product Type: All / Paver Block / Curb Stone
- Product cards or table with columns:
  - Product Name
  - Type (badge)
  - Thickness / Dimension
  - Colors (pill tags)
  - Actions: Edit · Delete
- "Add Product" button (top right)
- Empty state if no products

**Behavior:**
- Delete shows confirmation dialog
- Deleted products disappear immediately (soft delete on backend)
- Products with `is_active = false` are hidden

---

### Page 4: Add / Edit Product (`/products/new` or `/products/:id/edit`)

**Purpose:** Create or modify a product in the catalog.

**Form Fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| Product Name | Text input | Yes | Max 255 chars |
| Product Type | Radio / Select | Yes | Paver Block or Curb Stone |
| Thickness / Dimension | Text input | No | e.g. "60mm", "100×200×60mm" |
| Available Colors | Tag input | No | Add multiple colors; removable tags |

**Behavior:**
- "Add Color" button opens a text input; pressing Enter/comma adds tag
- Tags have an X to remove
- Submit validates required fields
- On success → redirect to Products List with success toast
- On edit → form pre-filled with existing data
- Edit mode shows "Last updated: date"

**Validation & Error States:**
- Empty Product Name → inline error "Product name is required"
- Invalid type → "Please select a product type"

---

### Page 5: Estimates List (`/estimates`)

**Purpose:** View, filter, and manage all quotations.

**UI Elements:**
- Filter bar:
  - Month selector (dropdown: Jan–Dec)
  - Year selector (dropdown: 2024–current year)
  - Financial Year toggle (e.g., FY 2025–26)
  - Reset Filters button
- Estimates table:
  - Columns: Estimate #, Customer Name, Company, City, Date, Items Count, Actions
  - Actions per row: View Preview · Edit · Download · Delete
- Pagination (10 per page)
- Empty state message

**Behavior:**
- Filters are mutually exclusive: selecting FY resets Month/Year
- Download button triggers DOCX download directly
- Delete shows confirmation modal
- Clicking Estimate # opens preview

---

### Page 6: Create / Edit Estimate (`/estimates/new` or `/estimates/:id/edit`)

**Purpose:** The core page — build and save a quotation.

This page is divided into **4 sections:**

---

#### Section A: Customer Details

| Field | Type | Required | Notes |
|---|---|---|---|
| Customer Name | Text input | Yes | Individual's name |
| Company Name | Text input | No | Optional company |
| City | Text input | Yes | Free text |
| State | Dropdown | Yes | All 28 states + UTs of India |
| Date | Date picker | Yes | Defaults to today |

---

#### Section B: Items (Products)

**Header row with "Add Item" button**

Each item row contains:

| Field | Type | Required | Notes |
|---|---|---|---|
| Product | Searchable Dropdown | Yes | From product master |
| Price (₹) | Number input | Yes | Positive decimal |
| Price Unit | Toggle / Select | Yes | "Per Sq.Ft" or "Per Piece" |
| GST % | Number input | Yes | 0–28, decimal allowed |
| Transportation Cost (₹) | Number input | No | Per unit, defaults 0 |
| Loading & Unloading (₹) | Number input | No | Per unit, defaults 0 |
| Remove | Icon button | — | Removes this row |

**Behavior:**
- Minimum 1 item required to save
- Clicking "Add Item" appends a new blank row
- Items are reorderable (drag handle, optional)
- Product dropdown shows: Name + Type badge + Dimension
- If product is not in catalog, user is prompted to add it first
- **No quantity field — by design**
- **No automatic calculation — by design**

**Constraints:**
- Price: must be > 0
- GST: 0 to 28 (inclusive), decimals allowed
- Transportation, Loading: must be ≥ 0

---

#### Section C: Notes / Terms & Conditions

- "Add Note" button appends a new text input
- Each note has:
  - Multi-line text area
  - Delete (×) button
- Notes display order preserved
- Notes render as bullet list in output document

**Behavior:**
- No minimum notes required
- Notes can be blank (but blank notes are filtered before save)
- Max 20 notes per estimate

---

#### Section D: Actions Bar (sticky footer)

Buttons:
- **Save Draft** → saves without navigating away
- **Preview** → opens Preview page in new tab
- **Download DOCX** → triggers export
- **Cancel** → confirms unsaved changes before navigating away

---

### Page 7: Preview Estimate (`/estimates/:id/preview`)

**Purpose:** Show a formatted, print-like view of the quotation before exporting.

**UI Layout:**
- Full-width container with white background (simulates A4 paper)
- Top: Letterhead (locked — mirrored from DOCX template as HTML)
- Estimate metadata: Customer, Date, Estimate #
- Items Table:
  - Column 1: Particulars
  - Column 2: Details
- Summary Section: Number of products listed
- Notes Section: Bullet list
- Bottom: Footer from letterhead template

**Actions (floating top bar):**
- Download DOCX
- Share via WhatsApp
- Print (browser print dialog)
- Back to Edit

**Behavior:**
- Page is read-only
- WhatsApp share: opens `https://wa.me/?text=...` with file download link or pre-composed message
- Print uses `@media print` styles to hide action bar

---

## 7. Module Breakdown

### Module 1: Product Management

**Backend:**
- `GET /products` — query `products WHERE is_active = TRUE ORDER BY name`
- `POST /products` — insert, return new product
- `PUT /products/:id` — update fields + `updated_at`
- `DELETE /products/:id` — set `is_active = FALSE`

**Frontend Components:**
- `<ProductCard />` — displays a single product with edit/delete
- `<ProductForm />` — reusable for Add + Edit
- `<ColorTagInput />` — manages array of color tags
- `<ProductTypeSelect />` — radio group or styled select

**Business Rules:**
- Product names must be unique (case-insensitive check on save)
- Deleting a product does NOT affect existing estimates (snapshot preserves data)
- Product cannot be permanently deleted via UI (soft delete only)

---

### Module 2: Estimate Builder

**Backend:**
- `POST /estimates` — transactional insert: estimate → items → notes
- `PUT /estimates/:id` — delete existing items + notes, re-insert updated ones (simpler than diff patching)
- `GET /estimates/:id` — joins estimate + items (with product_snapshot) + notes

**Frontend Components:**
- `<EstimateForm />` — parent form manager
- `<CustomerSection />` — section A fields
- `<ItemsSection />` — manages item rows
- `<ItemRow />` — single item with all fields
- `<ProductDropdown />` — searchable select from product catalog
- `<NotesSection />` — manages notes array
- `<NoteInput />` — single note with delete

**State Management:**
```
estimateState = {
  customer: { name, company, city, state, date },
  items: [{ id, product_id, product_snapshot, price_per_unit, price_unit, gst_percent, transportation_cost, loading_unloading_cost }],
  notes: [{ id, note_text, sort_order }],
  isDirty: boolean,
  isSaving: boolean
}
```

---

### Module 3: Estimate Storage & Filtering

**Filter Logic (SQL):**

```sql
-- Month + Year filter
WHERE EXTRACT(MONTH FROM date) = :month AND EXTRACT(YEAR FROM date) = :year

-- Calendar Year filter
WHERE EXTRACT(YEAR FROM date) = :year

-- Financial Year (April to March)
WHERE date >= DATE(:fy_start_year || '-04-01')
  AND date <  DATE((:fy_start_year + 1) || '-04-01')
```

**Estimate Number Generation:**
```javascript
// Server-side, called on estimate creation
async function generateEstimateNumber(year) {
  const result = await db.query(
    `SELECT COUNT(*) FROM estimates WHERE EXTRACT(YEAR FROM created_at) = $1`,
    [year]
  );
  const seq = parseInt(result.rows[0].count) + 1;
  return `QF-${year}-${String(seq).padStart(4, '0')}`;
}
```

---

### Module 4: User Access

**Users (seeded, not self-registered):**

| Name | Role | Access |
|---|---|---|
| Dad | admin | Full access |
| Son | admin | Full access |

Both users see the same data. No role-based restrictions at this time.

**JWT Flow:**
1. User submits login form
2. Backend verifies bcrypt hash
3. Backend signs JWT (payload: `{ userId, name, email }`, expiry: 8h)
4. Client stores token in `localStorage`
5. Axios interceptor attaches `Authorization: Bearer <token>` to all requests
6. Protected routes check token validity on each request

---

## 8. Template Engine

> ⚠️ **Critical Note:** The DOCX letterhead template file will be placed at:
> `backend/templates/letterhead.docx`
> 
> This file contains the locked header (business name, address, logo, contact) and footer. The export engine injects estimate data into the **body** only. The template file is not yet available and will be added to the project directory separately by the business owner.

### How the Template Engine Works

```
letterhead.docx (template)
         │
         ▼
 Read file as buffer
         │
         ▼
 Extract header + footer XML   ← LOCKED (never modified)
         │
         ▼
 Build body content (dynamic):
   • Estimate metadata table
   • Items table (Particulars + Details)
   • Summary section
   • Notes as bullet list
         │
         ▼
 Assemble final DOCX
   = Header (from template)
   + Body (generated)
   + Footer (from template)
         │
         ▼
 Stream to client as .docx
```

### Template Placeholder Strategy

Since the actual template DOCX is not yet available, the export service is designed to:

1. **If `letterhead.docx` exists:** Use it — extract its header/footer XML and inject dynamic body
2. **If `letterhead.docx` does not exist:** Generate a basic placeholder header so the system still works during development

### Body Content Structure

**Section 1 — Estimate Info Table**

| Field | Value |
|---|---|
| Quotation No. | QF-2026-0001 |
| Date | 24 April 2026 |
| Customer Name | Ramesh Patel |
| Company | Patel Construction |
| City | Ahmedabad |
| State | Gujarat |

**Section 2 — Items Table**

Same table format for ALL items:

| Particulars | Details |
|---|---|
| Product Name | Standard Grey Paver |
| Type | Paver Block |
| Thickness / Dimension | 60mm |
| Available Colors | Grey, Red, Yellow |
| Price | ₹55.00 per sq.ft |
| GST | 18% |
| Transportation | ₹5.00 per unit |
| Loading & Unloading | ₹2.00 per unit |

*(Repeated for each item added to the estimate)*

**Section 3 — Summary**

| Description | Value |
|---|---|
| Total Number of Products | 3 |

**Section 4 — Notes / Terms & Conditions**

- Payment within 30 days of delivery
- GST extra as applicable
- Transportation subject to change based on site distance

---

### Export Service Code Structure

```
backend/
  services/
    exportService.js      ← Main export orchestrator
    templateLoader.js     ← Reads and parses letterhead.docx
    bodyBuilder.js        ← Builds dynamic body using docx-js
  templates/
    letterhead.docx       ← PLACEHOLDER: to be added by business owner
    README.txt            ← Instructions for placing the template
```

**`templates/README.txt` content:**
```
IMPORTANT — LETTERHEAD TEMPLATE
================================
Place your business letterhead DOCX file here as:
  letterhead.docx

Requirements:
- The file must be a valid .docx file
- It should contain your header (logo, business name, address, contact)
- The body should be EMPTY (the system will generate body content)
- It should contain your footer if desired

Until this file is placed here, the system will use a basic placeholder header.
Contact the developer if you need assistance preparing the template.
```

---

## 9. Export & Share System

### DOCX Export Flow

```
User clicks "Download DOCX"
           │
           ▼
Frontend: GET /api/estimates/:id/export
           │
           ▼
Backend: Fetch estimate + items + notes from DB
           │
           ▼
templateLoader: Check if letterhead.docx exists
           │
    ┌──────┴──────┐
  EXISTS       NOT EXISTS
    │               │
Use template    Use placeholder
header/footer   header
    │               │
    └──────┬─────────┘
           ▼
bodyBuilder: Generate Particulars + Details table
           │
           ▼
Assemble full DOCX
           │
           ▼
Set headers:
  Content-Type: application/vnd.openxmlformats...
  Content-Disposition: attachment; filename="QF-2026-0001_RameshPatel.docx"
           │
           ▼
Stream buffer to client → Browser downloads file
```

### WhatsApp Share

WhatsApp does not support direct file sharing via URL. The approach:

**Option A — Simple (MVP):**
- Compose a WhatsApp message with estimate summary text
- Open: `https://wa.me/?text=<encoded_message>`
- The DOCX file is separately downloaded for manual attachment

**Option B — Link Share:**
- Generate a temporary shareable link to the preview page
- Include this link in the WhatsApp message
- Recipient can view and download from the link

MVP will implement **Option A**. Option B can be added later.

**WhatsApp Message Template:**
```
*Quotation from [Business Name]*
Quotation No: QF-2026-0001
Date: 24 April 2026
Customer: Ramesh Patel
Products: 3 items

Please find the attached quotation document.
For queries, contact: [phone number]
```

---

## 10. User Access & Auth

### Users (Pre-seeded)

```sql
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Dad', 'dad@quoteflow.com', '<bcrypt_hash>', 'admin'),
  ('Admin', 'admin@quoteflow.com', '<bcrypt_hash>', 'admin');
```

Password hashing:
```javascript
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('yourpassword', 12);
```

### JWT Configuration

```javascript
// .env
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRY=8h
```

### Protected Route (Backend Middleware)

```javascript
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Protected Route (Frontend)

```jsx
// PrivateRoute.jsx
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('qf_token');
  return token ? children : <Navigate to="/login" replace />;
};
```

---

## 11. Constraints & Business Rules

### Global Constraints

| Rule | Detail |
|---|---|
| No self-registration | Users are only created by seeding the DB |
| No quantity field | Estimates show price structure only, no totals |
| No calculation engine | No automatic subtotals, GST amounts, or grand totals |
| Product soft delete | Products with `is_active = false` are hidden from pickers but preserved in DB |
| Product snapshot | Each estimate_item stores a JSON snapshot of product data at time of creation |
| Estimate immutability | Once exported/sent, estimates should ideally not be edited (status tracking optional) |
| Financial Year | April 1 to March 31 (Indian FY convention) |
| Estimate number format | `QF-YYYY-NNNN` — sequential per calendar year, not financial year |
| DOCX template | Header/footer locked; only body content is dynamic |
| Notes filtering | Empty (whitespace-only) notes are discarded on save |
| Max items per estimate | 20 items (soft limit — UI warns, backend allows) |
| Max notes per estimate | 20 notes |

### Validation Rules (Backend — Express Validator)

**Product:**
```
name: required, string, max:255, unique (case-insensitive)
product_type: required, in:['paver_block','curb_stone']
thickness_dimension: optional, string, max:100
available_colors: optional, array of strings
```

**Estimate:**
```
customer_name: required, string, max:255
company_name: optional, string, max:255
city: required, string, max:100
state: required, string, in:[list of Indian states]
date: required, valid date, not in future (optional enforcement)
items: required, array, minLength:1
items[*].product_id: required, valid UUID, exists in products
items[*].price_per_unit: required, decimal, min:0.01
items[*].price_unit: required, in:['per_sqft','per_piece']
items[*].gst_percent: required, decimal, min:0, max:28
items[*].transportation_cost: optional, decimal, min:0, default:0
items[*].loading_unloading_cost: optional, decimal, min:0, default:0
notes[*].note_text: optional, string, max:500
```

### Indian States Dropdown (All 28 States + 8 UTs)

```
Andhra Pradesh, Arunachal Pradesh, Assam, Bihar, Chhattisgarh,
Goa, Gujarat, Haryana, Himachal Pradesh, Jharkhand, Karnataka,
Kerala, Madhya Pradesh, Maharashtra, Manipur, Meghalaya, Mizoram,
Nagaland, Odisha, Punjab, Rajasthan, Sikkim, Tamil Nadu, Telangana,
Tripura, Uttar Pradesh, Uttarakhand, West Bengal,
Andaman and Nicobar Islands, Chandigarh, Dadra and Nagar Haveli and Daman and Diu,
Delhi, Jammu and Kashmir, Ladakh, Lakshadweep, Puducherry
```

---

## 12. Folder Structure

```
quoteflow/
├── client/                          ← React frontend (Vite)
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js             ← Axios instance with interceptors
│   │   │   ├── authApi.js
│   │   │   ├── productsApi.js
│   │   │   └── estimatesApi.js
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Select.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── Toast.jsx
│   │   │   │   ├── Spinner.jsx
│   │   │   │   ├── Badge.jsx
│   │   │   │   └── EmptyState.jsx
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── Layout.jsx
│   │   │   ├── products/
│   │   │   │   ├── ProductCard.jsx
│   │   │   │   ├── ProductForm.jsx
│   │   │   │   └── ColorTagInput.jsx
│   │   │   └── estimates/
│   │   │       ├── CustomerSection.jsx
│   │   │       ├── ItemsSection.jsx
│   │   │       ├── ItemRow.jsx
│   │   │       ├── ProductDropdown.jsx
│   │   │       ├── NotesSection.jsx
│   │   │       ├── NoteInput.jsx
│   │   │       └── EstimateFilters.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useProducts.js
│   │   │   └── useEstimates.js
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── ProductForm.jsx
│   │   │   ├── Estimates.jsx
│   │   │   ├── EstimateForm.jsx
│   │   │   ├── EstimatePreview.jsx
│   │   │   └── NotFound.jsx
│   │   ├── utils/
│   │   │   ├── formatters.js        ← Date, currency formatting
│   │   │   ├── indianStates.js      ← States array
│   │   │   └── validators.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env
│   ├── package.json
│   └── vite.config.js
│
├── server/                          ← Node.js + Express backend
│   ├── config/
│   │   └── db.js                    ← Neon DB connection (pg pool)
│   ├── middleware/
│   │   ├── auth.js                  ← JWT middleware
│   │   ├── validate.js              ← express-validator wrapper
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   └── estimates.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productsController.js
│   │   └── estimatesController.js
│   ├── services/
│   │   ├── exportService.js         ← DOCX generation orchestrator
│   │   ├── templateLoader.js        ← Reads letterhead.docx
│   │   └── bodyBuilder.js           ← Builds dynamic body content
│   ├── validators/
│   │   ├── productValidators.js
│   │   └── estimateValidators.js
│   ├── templates/
│   │   ├── letterhead.docx          ← ⚠️ TO BE ADDED BY BUSINESS OWNER
│   │   └── README.txt               ← Instructions for placing template
│   ├── utils/
│   │   ├── generateEstimateNumber.js
│   │   └── whatsappHelper.js
│   ├── scripts/
│   │   └── seed.js                  ← Seeds users + sample products
│   ├── .env
│   ├── package.json
│   └── index.js                     ← Express app entry point
│
├── .gitignore
└── README.md
```

---

## 13. Environment & Configuration

### Backend `.env`

```env
# Server
PORT=5000
NODE_ENV=development

# Database (Neon DB)
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRY=8h

# Business Info (used in WhatsApp message template)
BUSINESS_NAME=Your Business Name
BUSINESS_PHONE=+919876543210
```

### Frontend `.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Neon DB Connection

```javascript
// server/config/db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Neon DB
});

module.exports = pool;
```

### Key NPM Packages

**Backend:**
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "pg": "^8.11.0",
    "bcrypt": "^5.1.0",
    "jsonwebtoken": "^9.0.0",
    "express-validator": "^7.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "docx": "^8.0.0",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0"
  }
}
```

**Frontend:**
```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-router-dom": "^6.0.0",
    "axios": "^1.6.0",
    "tailwindcss": "^3.4.0"
  }
}
```

---

## 14. Future Scope

These features are intentionally out of scope for v1.0 but may be added later:

| Feature | Description |
|---|---|
| Calculation Engine | Automatic price breakdowns and totals per item |
| Quantity Field | Add quantity to items for invoice-style output |
| Status Tracking | Track estimate as Draft / Sent / Accepted / Rejected |
| Client Portal | Read-only link for client to view their quotation |
| PDF Export | Alternate export format alongside DOCX |
| Email Integration | Send quotation directly via email from the app |
| Analytics Dashboard | Revenue trends, popular products, city-wise data |
| Mobile App | React Native or PWA wrapper for Dad's phone |
| Role-Based Access | Different permissions for owner vs viewer |
| Revision History | Track changes to an estimate over time |
| Duplicate Estimate | Clone an existing estimate for a new client |
| Favorite Notes | Save frequently used T&C notes as presets |

---

## Appendix: Development Setup

### Step 1: Clone & Install

```bash
# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install
```

### Step 2: Setup Database

```bash
# Run schema SQL against Neon DB
psql $DATABASE_URL -f server/scripts/schema.sql

# Seed initial users
node server/scripts/seed.js
```

### Step 3: Start Development

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

### Step 4: Place Template (When Available)

```bash
# Copy your business letterhead DOCX to:
cp /path/to/your/letterhead.docx server/templates/letterhead.docx
```

---

*End of Documentation — QuoteFlow v1.0*
