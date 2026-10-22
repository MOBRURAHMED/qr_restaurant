import { StaffAccount } from '@/types';

export const DEMO_STAFF: StaffAccount[] = [
  { id: 'st-1', restaurantId: 'rest-1', name: 'Rajesh Mehra', email: 'rajesh@spicegarden.in', role: 'owner', status: 'active', joinedAt: '2026-01-15' },
  { id: 'st-2', restaurantId: 'rest-1', name: 'Kavita Nair', email: 'kavita@spicegarden.in', role: 'manager', status: 'active', joinedAt: '2026-01-20' },
  { id: 'st-3', restaurantId: 'rest-1', name: 'Chef Harpal Singh', email: 'harpal@spicegarden.in', role: 'chef', status: 'active', joinedAt: '2026-02-01' },
  { id: 'st-4', restaurantId: 'rest-1', name: 'Sunil Kumar', email: 'sunil@spicegarden.in', role: 'waiter', status: 'active', joinedAt: '2026-02-15' },
  { id: 'st-5', restaurantId: 'rest-1', name: 'Aakash Verma', email: 'aakash@spicegarden.in', role: 'waiter', status: 'offline', joinedAt: '2026-03-01' },
];
