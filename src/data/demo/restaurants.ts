import { Restaurant } from '@/types';

/**
 * DEMO SEED DATA: Multi-tenant Restaurants
 * Used for initial UI testing and architecture validation.
 * Isolated from production Supabase database persistence.
 */
export const DEMO_RESTAURANTS: Restaurant[] = [
  {
    id: 'rest-1',
    slug: 'spice-garden',
    name: 'Spice Garden Bistro',
    tagline: 'Authentic Coastal & North Indian Flavours',
    phone: '+91 98765 43210',
    currency: '₹',
    logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=160&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    address: 'Indiranagar 100ft Rd, Bengaluru',
    upiId: 'spicegarden@okhdfcbank',
    gstRate: 0.05,
  },
  {
    id: 'rest-2',
    slug: 'coastal-crust',
    name: 'Coastal Crust Pizzeria',
    tagline: 'Wood-Fired Neapolitan Sourdough & Craft Gelato',
    phone: '+91 98765 12345',
    currency: '₹',
    logoUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=160&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
    address: 'Candolim Beach Rd, Goa',
    upiId: 'coastalcrust@icici',
    gstRate: 0.05,
  },
  {
    id: 'rest-3',
    slug: 'tokyo-table',
    name: 'The Tokyo Table',
    tagline: 'Artisanal Nigiri, Tonkotsu Ramen & Robata Grill',
    phone: '+91 98765 99887',
    currency: '₹',
    logoUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=160&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=800&auto=format&fit=crop&q=80',
    address: 'GF-04 Cyber Hub, Gurugram',
    upiId: 'tokyotable@hdfc',
    gstRate: 0.05,
  },
];
