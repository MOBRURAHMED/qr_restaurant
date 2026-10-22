/**
 * Role-Based Navigation Architecture
 * Defines roles, access scopes, and portal menu items.
 */

export type UserRole = 'customer' | 'restaurant_owner' | 'kitchen_staff' | 'platform_admin';

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  iconName: string;
  badge?: string;
  description?: string;
}

export interface RoleNavigationConfig {
  role: UserRole;
  displayName: string;
  description: string;
  defaultRoute: string;
  items: NavigationItem[];
}

export const ROLE_NAVIGATION: Record<UserRole, RoleNavigationConfig> = {
  customer: {
    role: 'customer',
    displayName: 'Diner / Customer',
    description: 'Table QR code digital ordering and bill payment',
    defaultRoute: '/r/spice-garden/t/4',
    items: [
      { id: 'menu', label: 'Menu & Order', href: '/r/spice-garden/t/4', iconName: 'UtensilsCrossed' },
      { id: 'cart', label: 'Order Cart', href: '#cart', iconName: 'ShoppingBag' },
      { id: 'status', label: 'Order Status', href: '/r/spice-garden/order/demo-order-1', iconName: 'Clock' },
    ],
  },
  restaurant_owner: {
    role: 'restaurant_owner',
    displayName: 'Restaurant Owner',
    description: 'Manage menu, tables, QR generation, staff & payment gateways',
    defaultRoute: '/admin',
    items: [
      { id: 'overview', label: 'Dashboard & Sales', href: '/admin?tab=overview', iconName: 'LayoutDashboard' },
      { id: 'menu', label: 'Menu Catalog', href: '/admin?tab=menu', iconName: 'BookOpen' },
      { id: 'tables', label: 'Tables & QR Codes', href: '/admin?tab=tables', iconName: 'QrCode' },
      { id: 'payments', label: 'Payment Settings', href: '/admin?tab=payments', iconName: 'CreditCard' },
      { id: 'staff', label: 'Staff Accounts', href: '/admin?tab=staff', iconName: 'Users' },
    ],
  },
  kitchen_staff: {
    role: 'kitchen_staff',
    displayName: 'Kitchen Staff (KDS)',
    description: 'Real-time kitchen order tickets, timers and bump bar',
    defaultRoute: '/staff/kds',
    items: [
      { id: 'kds', label: 'Kitchen Display', href: '/staff/kds', iconName: 'ChefHat' },
      { id: 'call_waiter', label: 'Service Alerts', href: '/staff/kds#alerts', iconName: 'Bell' },
    ],
  },
  platform_admin: {
    role: 'platform_admin',
    displayName: 'Platform Super Admin',
    description: 'Multi-tenant SaaS metrics, restaurant onboarding, subscriptions',
    defaultRoute: '/super-admin',
    items: [
      { id: 'tenants', label: 'Restaurant Directory', href: '/super-admin?tab=restaurants', iconName: 'Building2' },
      { id: 'metrics', label: 'Platform Analytics', href: '/super-admin?tab=metrics', iconName: 'TrendingUp' },
      { id: 'plans', label: 'Subscription Plans', href: '/super-admin?tab=plans', iconName: 'Layers' },
      { id: 'audit', label: 'System Audit Logs', href: '/super-admin?tab=audit', iconName: 'ShieldCheck' },
    ],
  },
};
