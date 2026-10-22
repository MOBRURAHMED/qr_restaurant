-- ==============================================================================
-- MULTI-RESTAURANT QR ORDERING SAAS: COMPLETE SUPABASE POSTGRESQL SCHEMA WITH RLS
-- Migration: 20261022_multi_tenant_full_schema.sql
-- ==============================================================================

-- Enable UUID and Cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. USER PROFILES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Auto-create profile trigger on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 2. RESTAURANTS (Tenants)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    tagline TEXT,
    phone VARCHAR(30) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR' NOT NULL,
    logo_url TEXT,
    cover_url TEXT,
    address TEXT,
    gst_rate NUMERIC(4, 3) DEFAULT 0.05 NOT NULL, -- 5% GST
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_active ON public.restaurants(is_active);

-- ------------------------------------------------------------------------------
-- 3. RESTAURANT MEMBERSHIPS (Staff Role-Based Access Control)
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE public.member_role AS ENUM ('owner', 'manager', 'kitchen', 'waiter');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.restaurant_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role public.member_role NOT NULL DEFAULT 'waiter',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(restaurant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_members_user ON public.restaurant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_members_rest ON public.restaurant_members(restaurant_id);

-- ------------------------------------------------------------------------------
-- 4. RESTAURANT PAYMENT SETTINGS (4 Independent Toggles & UPI Configuration)
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
    razorpay_key_id VARCHAR(120),
    razorpay_account_id VARCHAR(120),
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 5. MENU CATEGORIES & ITEMS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    sort_order INT DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON public.menu_categories(restaurant_id);

CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price INT NOT NULL CHECK (price >= 0), -- Whole INR rupees
    is_veg BOOLEAN DEFAULT TRUE NOT NULL,
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    image_url TEXT,
    spicy_level INT DEFAULT 1 CHECK (spicy_level BETWEEN 1 AND 3),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON public.menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON public.menu_items(restaurant_id, is_available);

-- ------------------------------------------------------------------------------
-- 6. DINING TABLES & OPAQUE TABLE TOKENS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dining_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_number VARCHAR(30) NOT NULL,
    qr_token VARCHAR(64) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
    capacity INT DEFAULT 4 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(restaurant_id, table_number)
);

CREATE INDEX IF NOT EXISTS idx_dining_tables_token ON public.dining_tables(qr_token);
CREATE INDEX IF NOT EXISTS idx_dining_tables_restaurant ON public.dining_tables(restaurant_id);

-- ------------------------------------------------------------------------------
-- 7. ORDERS & IMMUTABLE ITEM SNAPSHOTS
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE public.order_status AS ENUM ('new', 'accepted', 'preparing', 'ready', 'served', 'cancelled');
    CREATE TYPE public.payment_status AS ENUM ('pending', 'unpaid', 'paid', 'failed', 'cancelled', 'refunded');
    CREATE TYPE public.payment_method AS ENUM ('upi_qr', 'upi_app', 'card', 'counter', 'online_upi', 'online_card');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_number VARCHAR(30) NOT NULL,
    order_code VARCHAR(30) NOT NULL, -- e.g. #SG-105
    tracking_token VARCHAR(64) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    idempotency_key VARCHAR(100) UNIQUE, -- Duplicate submission prevention
    
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
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON public.orders(tracking_token);
CREATE INDEX IF NOT EXISTS idx_orders_idempotency ON public.orders(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(restaurant_id, status);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL, -- Immutable snapshot
    price INT NOT NULL,         -- Immutable unit price snapshot
    quantity INT NOT NULL CHECK (quantity > 0),
    is_veg BOOLEAN DEFAULT TRUE NOT NULL,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- ------------------------------------------------------------------------------
-- 8. PAYMENTS LEDGER
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
-- 9. PAYMENT WEBHOOK EVENTS (Idempotency Tracking)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(120) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(30) DEFAULT 'processed' NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_event_id ON public.payment_webhook_events(event_id);

-- ------------------------------------------------------------------------------
-- 10. ORDER STATUS AUDIT HISTORY & TRANSITIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    from_status public.order_status,
    to_status public.order_status NOT NULL,
    changed_by_user_id UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON public.order_status_history(order_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES & TENANT ISOLATION
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
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

-- Helper Functions
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

-- Profiles: Users can view and edit their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Restaurants: Public can view active restaurants; Admins can update their own
CREATE POLICY "Public can view active restaurants"
    ON public.restaurants FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Owners can update their restaurant"
    ON public.restaurants FOR UPDATE
    USING (public.is_restaurant_admin(id));

CREATE POLICY "Owners can insert new restaurant"
    ON public.restaurants FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Memberships: Members can view team; Admins can manage members
CREATE POLICY "Members can view restaurant staff"
    ON public.restaurant_members FOR SELECT
    USING (public.is_restaurant_member(restaurant_id));

CREATE POLICY "Admins can manage restaurant members"
    ON public.restaurant_members FOR ALL
    USING (public.is_restaurant_admin(restaurant_id));

-- Payment Settings: Public can read active toggles for checkout; Admins can manage
CREATE POLICY "Public can view payment toggles"
    ON public.restaurant_payment_settings FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins can manage payment settings"
    ON public.restaurant_payment_settings FOR ALL
    USING (public.is_restaurant_admin(restaurant_id));

-- Menus: Public read; Admins write
CREATE POLICY "Public can view active categories"
    ON public.menu_categories FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Admins can manage categories"
    ON public.menu_categories FOR ALL
    USING (public.is_restaurant_admin(restaurant_id));

CREATE POLICY "Public can view available menu items"
    ON public.menu_items FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins can manage menu items"
    ON public.menu_items FOR ALL
    USING (public.is_restaurant_admin(restaurant_id));

-- Dining Tables: Public read by table token; Admins manage
CREATE POLICY "Public can view active dining tables"
    ON public.dining_tables FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Admins can manage dining tables"
    ON public.dining_tables FOR ALL
    USING (public.is_restaurant_admin(restaurant_id));

-- Orders: Staff can view and manage their restaurant's orders;
-- Diners can view their specific order using opaque tracking token
CREATE POLICY "Staff can view restaurant orders"
    ON public.orders FOR SELECT
    USING (public.is_restaurant_member(restaurant_id));

CREATE POLICY "Staff can update restaurant orders"
    ON public.orders FOR UPDATE
    USING (public.is_restaurant_member(restaurant_id));

CREATE POLICY "Diner can view order by tracking token"
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

CREATE POLICY "Diner can view items of tracked order"
    ON public.order_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_items.order_id
          AND orders.tracking_token IS NOT NULL
    ));

-- Payments: Staff view only
CREATE POLICY "Staff can view payments"
    ON public.payments FOR SELECT
    USING (public.is_restaurant_member(restaurant_id));

-- Webhooks: Service-role only
CREATE POLICY "Service role webhook operations"
    ON public.payment_webhook_events FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Status History: Staff view only
CREATE POLICY "Staff can view status audit"
    ON public.order_status_history FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_status_history.order_id
          AND public.is_restaurant_member(orders.restaurant_id)
    ));
