import { LocalStore, Product, Category, RoadmapPhase, Order } from './types';
import { ALL_LUXURY_PRODUCTS, LUXURY_CATEGORIES, BRANDS_DATA, COLLECTIONS_DATA, EDITORIAL_STORIES, SERVICES_LIST } from './data/luxuryData';
export { ALL_LUXURY_PRODUCTS, ALL_LUXURY_PRODUCTS as PRODUCTS, LUXURY_CATEGORIES, BRANDS_DATA, COLLECTIONS_DATA, EDITORIAL_STORIES, SERVICES_LIST };

export const INITIAL_ORDERS: Order[] = [];

export const LOCAL_STORES: LocalStore[] = [
  {
    id: 'store-1',
    name: 'Al-Madina Beauty Hub',
    neighborhood: 'Downtown / Central Market',
    contactPerson: 'Tariq Al-Mansoor',
    phone: '',
    rating: 4.9,
    isActive: true,
  },
  {
    id: 'store-2',
    name: 'Rawda Fragrance Vault',
    neighborhood: 'North Quarter District',
    contactPerson: 'Sarah Benali',
    phone: '',
    rating: 4.8,
    isActive: true,
  },
  {
    id: 'store-3',
    name: 'Elite Skincare & Cosmetics',
    neighborhood: 'West Boulevard',
    contactPerson: 'Kaled Al-Otaibi',
    phone: '',
    rating: 4.7,
    isActive: true,
  },
  {
    id: 'store-4',
    name: 'Luxor Niche Perfumes',
    neighborhood: 'Old Town Souk',
    contactPerson: 'Youssef Al-Zahrani',
    phone: '',
    rating: 4.9,
    isActive: true,
  }
];

export const PRODUCT_CATEGORIES: Category[] = [...LUXURY_CATEGORIES];



export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    id: 'phase-1',
    number: '01',
    title: 'The Brand Identity',
    subtitle: 'High-Fashion & Luxury Experience',
    description: 'Crafted as an exclusive luxury beauty marketplace. Customers experience a seamless white-labeled brand with high-end editorial visuals.',
    status: 'Complete',
    date: '2025'
  },
  {
    id: 'phase-2',
    number: '02',
    title: 'Dark Store Aggregation',
    subtitle: 'Local Supplier Network & Margin Engine',
    description: 'Real-time aggregation of local partner stores in every city neighborhood. Hidden supplier matching lets the platform fulfill orders with maximum profit margin.',
    status: 'Current',
    date: '2026'
  },
  {
    id: 'phase-3',
    number: '03',
    title: 'Frictionless WhatsApp Checkout',
    subtitle: 'Zero Inventory Risk & Instant Dispatch',
    description: 'Instant WhatsApp order generation with dynamic order tracking IDs, automated local store dispatch alerts, and white-label courier delivery.',
    status: 'Live',
    date: 'Active'
  }
];
