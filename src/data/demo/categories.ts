import { MenuCategory } from '@/types';

export const DEMO_CATEGORIES: MenuCategory[] = [
  // Spice Garden (rest-1)
  { id: 'cat-1', restaurantId: 'rest-1', name: 'Starters & Crisps', sortOrder: 1 },
  { id: 'cat-2', restaurantId: 'rest-1', name: 'Clay Oven Tandoor', sortOrder: 2 },
  { id: 'cat-3', restaurantId: 'rest-1', name: 'Curries & Dal', sortOrder: 3 },
  { id: 'cat-4', restaurantId: 'rest-1', name: 'Biryani & Artisan Breads', sortOrder: 4 },
  { id: 'cat-5', restaurantId: 'rest-1', name: 'Beverages & Coolers', sortOrder: 5 },
  { id: 'cat-6', restaurantId: 'rest-1', name: 'Desserts & Sweets', sortOrder: 6 },

  // Coastal Crust (rest-2)
  { id: 'cat-p-1', restaurantId: 'rest-2', name: 'Antipasti & Small Bites', sortOrder: 1 },
  { id: 'cat-p-2', restaurantId: 'rest-2', name: 'Wood-Fired Pizzas', sortOrder: 2 },
  { id: 'cat-p-3', restaurantId: 'rest-2', name: 'Craft Beverages & Sodas', sortOrder: 3 },
];
