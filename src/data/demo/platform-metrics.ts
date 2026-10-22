export interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonthly: number;
  tablesLimit: number;
  features: string[];
  isPopular?: boolean;
}

export const DEMO_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-starter',
    name: 'Starter Bistro',
    priceMonthly: 1999,
    tablesLimit: 10,
    features: ['Dynamic QR Code Menu', 'Table Self-Ordering', 'Pay at Counter Option', 'Daily Sales Report'],
  },
  {
    id: 'plan-pro',
    name: 'Growth Restaurant',
    priceMonthly: 3999,
    tablesLimit: 30,
    features: [
      'Everything in Starter',
      'Direct Razorpay & UPI Checkout',
      'Real-time Kitchen Display (KDS)',
      'Digital Standee QR Customization',
      'Staff Role Management (5 users)',
    ],
    isPopular: true,
  },
  {
    id: 'plan-enterprise',
    name: 'Multi-Outlet Chain',
    priceMonthly: 8999,
    tablesLimit: 100,
    features: [
      'Everything in Growth',
      'Unlimited Dining Tables & Outlets',
      'Custom Brand Domain & White-labeling',
      'Priority Phone Support & Dedicated Manager',
      'Custom POS & Inventory Webhooks',
    ],
  },
];

export const DEMO_PLATFORM_METRICS = {
  totalTenants: 48,
  activeTenants: 42,
  pendingVerification: 6,
  totalMonthlyOrders: 28450,
  monthlyGrossMerchandiseValue: 14850000, // ₹1.48 Cr
  monthlyRecurringRevenue: 184500,        // ₹1.84 Lakhs
  systemHealth: {
    apiUptime: '99.98%',
    avgLatencyMs: 42,
    webhookSuccessRate: '99.92%',
  },
};
