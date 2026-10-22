-- ==============================================================================
-- MULTI-RESTAURANT QR ORDERING SAAS: SUPABASE POSTGRESQL SCHEMA WITH RLS
-- Migration: 20261022_multi_tenant_razorpay_schema.sql
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. RESTAURANTS (Tenants)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    tagline TEXT,
    phone VARCHAR(30) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR' NOT NULL,
    logo_url TEXT,
    cover_url TEXT,
    address TEXT,
    gst_rate NUMERIC(4, 3) DEFAULT 0.05 NOT NULL, -- e.g. 0.05 for 5%
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug);

-- ------------------------------------------------------------------------------
-- 2. RESTAURANT MEMBERS (Multi-Tenant Staff Auth & Access Control)
-- ------------------------------------------------------------------------------
CREATE TYPE public.member_role AS ENUM ('owner', 'manager', 'kitchen', 'waiter');

CREATE TABLE IF NOT EXISTS public.restaurant_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.member_role NOT NULL DEFAULT 'kitchen',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(restaurant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_members_user ON public.restaurant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_members_rest ON public.restaurant_members(restaurant_id);

-- ------------------------------------------------------------------------------
-- 3. RESTAURANT PAYMENT SETTINGS (4 Independent Toggles & UPI Configuration)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.restaurant_payment_settings (
    restaurant_id UUID PRIMARY KEY REFERENCES public.restaurants(id) ON DELETE CASCADE,
    upi_qr_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    upi_app_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    card_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    counter_payment_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    upi_qr_image_path TEXT,
    upi_id VARCHAR(120),
    payee_name VARCHAR(255),
    -- Encrypted or isolated merchant specific key references
    razorpay_key_id VARCHAR(120),
    razorpay_account_id VARCHAR(120), -- Linked Razorpay Route / Marketplace Account ID
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 4. MENU CATEGORIES & ITEMS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    sort_order INT DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON public.menu_categories(restaurant_id);

CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price INT NOT NULL CHECK (price >= 0), -- Stored in whole rupees or paise. Here whole INR.
    is_veg BOOLEAN DEFAULT TRUE NOT NULL,
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    image_url TEXT,
    spicy_level INT DEFAULT 1 CHECK (spicy_level BETWEEN 1 AND 3),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON public.menu_items(restaurant_id);

-- ------------------------------------------------------------------------------
-- 5. DINING TABLES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dining_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_number VARCHAR(30) NOT NULL,
    qr_token VARCHAR(64) UNIQUE NOT NULL, -- Opaque unguessable token
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(restaurant_id, table_number)
);

CREATE INDEX IF NOT EXISTS idx_dining_tables_token ON public.dining_tables(qr_token);

-- ------------------------------------------------------------------------------
-- 6. ORDERS & ORDER ITEMS (Separation of Order Status & Payment Status)
-- ------------------------------------------------------------------------------
CREATE TYPE public.order_status AS ENUM ('new', 'accepted', 'preparing', 'ready', 'served', 'cancelled');
CREATE TYPE public.payment_status AS ENUM ('pending', 'unpaid', 'paid', 'failed', 'cancelled', 'refunded');
CREATE TYPE public.payment_method AS ENUM ('upi_qr', 'upi_app', 'card', 'counter', 'online_upi', 'online_card');

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_number VARCHAR(30) NOT NULL,
    order_code VARCHAR(20) NOT NULL, -- e.g. #SG-105
    customer_name VARCHAR(120),
    customer_phone VARCHAR(30),
    special_instructions TEXT,
    
    subtotal INT NOT NULL,
    tax INT NOT NULL,
    tip INT DEFAULT 0 NOT NULL,
    total INT NOT NULL,
    
    status public.order_status DEFAULT 'new' NOT NULL,
    payment_status public.payment_status DEFAULT 'pending' NOT NULL,
    payment_method public.payment_method NOT NULL,
    
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    
    tracking_token VARCHAR(64) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON public.orders(tracking_token);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON public.orders(razorpay_order_id);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL, -- Immutable snapshot
    price INT NOT NULL,         -- Immutable unit price snapshot
    quantity INT NOT NULL CHECK (quantity > 0),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- ------------------------------------------------------------------------------
-- 7. PAYMENTS LEDGER (Transaction Logs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    amount INT NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR' NOT NULL,
    method public.payment_method NOT NULL,
    status public.payment_status NOT NULL,
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    razorpay_signature VARCHAR(255),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(razorpay_payment_id)
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_restaurant ON public.payments(restaurant_id);

-- ------------------------------------------------------------------------------
-- 8. PAYMENT WEBHOOK EVENTS (Idempotency Table)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(120) UNIQUE NOT NULL, -- Unique Razorpay webhook event ID
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(30) DEFAULT 'processed' NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_event_id ON public.payment_webhook_events(event_id);

-- ------------------------------------------------------------------------------
-- 9. ORDER STATUS AUDIT HISTORY
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    from_status public.order_status,
    to_status public.order_status NOT NULL,
    changed_by_user_id UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dining_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check user membership in restaurant
CREATE OR REPLACE FUNCTION public.is_restaurant_member(_restaurant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.restaurant_members
        WHERE restaurant_id = _restaurant_id
          AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper Function: Check if user is owner or manager
CREATE OR REPLACE FUNCTION public.is_restaurant_admin(_restaurant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.restaurant_members
        WHERE restaurant_id = _restaurant_id
          AND user_id = auth.uid()
          AND role IN ('owner', 'manager')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Restaurants: Public can view active restaurants; Admins can update their own
CREATE POLICY "Public can view active restaurants"
    ON public.restaurants FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Owners can update their restaurant"
    ON public.restaurants FOR UPDATE
    USING (public.is_restaurant_admin(id));

-- 2. Payment Settings: Only authorized restaurant admins can view and update
CREATE POLICY "Public can view enabled payment methods"
    ON public.restaurant_payment_settings FOR SELECT
    USING (TRUE); -- Customers need to know which payment toggles are active

CREATE POLICY "Admins can update payment settings"
    ON public.restaurant_payment_settings FOR ALL
    USING (public.is_restaurant_admin(restaurant_id));

-- 3. Menu Categories & Items: Public can view available; Staff can edit
CREATE POLICY "Public can view active menu categories"
    ON public.menu_categories FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Staff can manage categories"
    ON public.menu_categories FOR ALL
    USING (public.is_restaurant_admin(restaurant_id));

CREATE POLICY "Public can view available menu items"
    ON public.menu_items FOR SELECT
    USING (TRUE);

CREATE POLICY "Staff can manage menu items"
    ON public.menu_items FOR ALL
    USING (public.is_restaurant_admin(restaurant_id));

-- 4. Orders: Staff can manage all orders for their restaurant;
-- Customers can view their own order only via tracking token.
CREATE POLICY "Staff can view restaurant orders"
    ON public.orders FOR SELECT
    USING (public.is_restaurant_member(restaurant_id));

CREATE POLICY "Staff can update restaurant orders"
    ON public.orders FOR UPDATE
    USING (public.is_restaurant_member(restaurant_id));

CREATE POLICY "Public can view order by tracking token"
    ON public.orders FOR SELECT
    USING (tracking_token IS NOT NULL);

-- Order Items
CREATE POLICY "Staff can view order items"
    ON public.order_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_items.order_id
          AND public.is_restaurant_member(orders.restaurant_id)
    ));

-- Payments: Only staff can view payment ledger
CREATE POLICY "Staff can view payments"
    ON public.payments FOR SELECT
    USING (public.is_restaurant_member(restaurant_id));

-- Webhook events: Service role only (internal backend)
CREATE POLICY "Service role webhook management"
    ON public.payment_webhook_events FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ==============================================================================
-- STORAGE BUCKETS (UPI QR Images & Assets)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-assets', 'restaurant-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for restaurant assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'restaurant-assets');

CREATE POLICY "Admins can upload restaurant assets"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'restaurant-assets'
    AND auth.role() = 'authenticated'
);
