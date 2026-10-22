# Multi-Restaurant QR Ordering SaaS: Razorpay & Supabase Setup Guide

This comprehensive guide details how to configure Supabase, Razorpay, storage buckets, webhook handlers, and environment variables for the multi-tenant QR ordering platform.

---

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Environment Configuration](#2-environment-configuration)
3. [Supabase Database & Storage Setup](#3-supabase-database--storage-setup)
4. [Razorpay API & Webhook Configuration](#4-razorpay-api--webhook-configuration)
5. [Restaurant Owner Onboarding & Payment Settings](#5-restaurant-owner-onboarding--payment-settings)
6. [Testing the Payment & Security Workflows](#6-testing-the-payment--security-workflows)
7. [Production Deployment Checklist & Merchant Approval](#7-production-deployment-checklist--merchant-approval)

---

## 1. Prerequisites

- **Node.js**: v18.18.0 or v20+
- **Supabase Account**: A Supabase project (Free or Pro tier) with PostgreSQL 15+
- **Razorpay Account**: A Razorpay merchant account (Test mode enabled for sandbox testing)
- **Git**

---

## 2. Environment Configuration

1. Copy the provided `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in the values for your local environment:
   ```env
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NEXT_PUBLIC_SUPABASE_URL="https://<your-project-ref>.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="<your-anon-public-key>"
   SUPABASE_SERVICE_ROLE_KEY="<your-service-role-secret-key>"
   NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_<your-test-key-id>"
   RAZORPAY_KEY_SECRET="<your-test-key-secret>"
   RAZORPAY_WEBHOOK_SECRET="<your-chosen-webhook-secret>"
   ```

> **Security Rule**: `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` must **NEVER** be prefixed with `NEXT_PUBLIC_` or bundled into client code.

---

## 3. Supabase Database & Storage Setup

### Step 3.1: Execute Database Migration
1. Log in to your **Supabase Dashboard** (`https://app.supabase.com`).
2. Navigate to your project -> **SQL Editor**.
3. Create a **New Query**.
4. Paste the complete contents of `supabase/migrations/20261022_multi_tenant_razorpay_schema.sql`.
5. Click **Run**.
6. Verify that the following tables are created:
   - `restaurants`
   - `restaurant_members`
   - `restaurant_payment_settings`
   - `menu_categories`
   - `menu_items`
   - `dining_tables`
   - `orders`
   - `order_items`
   - `payments`
   - `payment_webhook_events`
   - `order_status_history`

### Step 3.2: Verify Row Level Security (RLS)
The migration automatically enables RLS on all tables with tenant isolation:
- Restaurant owners can only view and mutate their own restaurant records.
- Anonymous/Public diners can read active menus and tables, create unconfirmed orders, but cannot mutate pricing or read other tenants' data.
- The service-role key bypasses RLS for authoritative server-side pricing recalculation, cryptographic payment verification, and webhook handling.

### Step 3.3: Storage Bucket Setup
1. In the Supabase Dashboard, navigate to **Storage**.
2. Verify that the `restaurant-assets` bucket exists (created by migration, or click **New Bucket** with name `restaurant-assets` and set it to **Public**).
3. The RLS policies allow authenticated restaurant members to upload, replace, and delete images under `qr-codes/{restaurant_id}/*`.

---

## 4. Razorpay API & Webhook Configuration

### Step 4.1: Retrieve Test API Keys
1. Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Switch to **Test Mode** (toggle in the top-left or header).
3. Go to **Settings** -> **API Keys**.
4. Click **Generate Test Key**.
5. Copy the `Key ID` into `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
6. Copy the `Key Secret` into `RAZORPAY_KEY_SECRET`.

### Step 4.2: Configure Webhook Endpoint
1. In Razorpay Dashboard -> **Settings** -> **Webhooks**.
2. Click **Add New Webhook**.
3. Enter the Webhook URL:
   - For local development with a tunnel (ngrok / Localtunnel):
     `https://<your-subdomain>.ngrok-free.app/api/webhooks/razorpay`
   - For production / staging:
     `https://<your-domain>.com/api/webhooks/razorpay`
4. Set the **Secret** to a strong random string (e.g. `whsec_d98f7...`) and set the same value in `RAZORPAY_WEBHOOK_SECRET`.
5. Select the following **Active Events**:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
6. Click **Save Webhook**.

### Step 4.3: How Webhook Idempotency Operates
- Incoming webhooks calculate HMAC-SHA256 across `rawBody` using `RAZORPAY_WEBHOOK_SECRET`.
- The webhook event ID (`event.event_id` or `id`) is checked against the `payment_webhook_events` table.
- If already processed, the endpoint returns `{ received: true, duplicate: true }` with HTTP 200 without re-updating the order or sending duplicate kitchen tickets.
- If new, the event is atomically marked as processed, and order/payment statuses transition safely.

---

## 5. Restaurant Owner Onboarding & Payment Settings

1. Access the restaurant admin portal at `/admin`.
2. Navigate to the **Payment Settings** tab.
3. Configure the **4 independent payment toggles**:
   - **UPI QR Code**: Toggle on/off static table/counter UPI QR.
   - **UPI App Payment**: Toggle on/off gateway UPI intent (Google Pay, PhonePe, Paytm).
   - **Debit/Credit Card**: Toggle on/off card checkout.
   - **Pay at Counter**: Toggle on/off post-paid cash or counter settlement.
4. **Static UPI QR Customization**:
   - Upload the restaurant's printed standee QR image (`.png`, `.jpg`, `.webp`).
   - Enter your **UPI VPA** (e.g., `tandooribites@okhdfcbank`).
   - Enter your **Payee Display Name** (e.g., `Tandoori Bites Restaurant`).
5. Click **Save Payment Settings**.

---

## 6. Testing the Payment & Security Workflows

Run the automated test suite covering all 8 security, pricing, and signature requirements:
```bash
npm test
```

### Manual Verification Checklist
1. **Price Tampering Defense**:
   - Open `/r/tandoori-bites/t/1`.
   - Add items to cart.
   - In DevTools console or curl, attempt to submit `price: 1` instead of `price: 240`.
   - Result: Server discards client prices, recalculates from database, and binds Razorpay order to the real subtotal + tax.
2. **Disabled Method Rejection**:
   - In `/admin`, disable "Pay at Counter".
   - Reload customer checkout: Counter payment button is automatically hidden.
   - Attempting to submit via API returns HTTP 400 with `Payment method 'counter' is currently disabled for this restaurant`.
3. **Static UPI QR Workflow**:
   - Enable "UPI QR Code".
   - At checkout, select "UPI QR Code".
   - A modal displays the restaurant's standee QR, exact order total, UPI ID, and order ID reference.
   - The order enters the KDS in `pending` payment status with a `VERIFY UPI` action button for staff.
4. **Pay at Counter Workflow**:
   - At checkout, select "Pay at Counter".
   - Order enters KDS as `unpaid`.
   - Staff confirms collection via `COLLECT CASH`, transitioning order to `paid` and `accepted`.

---

## 7. Production Deployment Checklist & Merchant Approval

Before switching to Razorpay Live Mode:
1. **KYC & Account Activation**: Complete Razorpay merchant KYC documents on [Razorpay](https://dashboard.razorpay.com).
2. **Payment Method Approval**: Request activation for Credit/Debit Cards, NetBanking, and UPI Autopay in Razorpay Dashboard.
3. **HTTPS Enforcement**: Ensure all traffic runs over TLS/HTTPS (enforced automatically by Vercel or modern PaaS).
4. **Live API Credentials**: Replace `rzp_test_*` with `rzp_live_*` in production environment variables.
5. **Production Webhook**: Set the production webhook URL with high availability and verify SSL certificate trust.
6. **No Production Direct Mutation**: Ensure no client applications have direct write access to `orders.total_amount` or `orders.payment_status` without service-role verification.
