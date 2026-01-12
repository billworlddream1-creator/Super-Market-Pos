
import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p-1',
    name: 'Organic Bananas',
    category: 'Produce',
    price: 0.99,
    stock: 150,
    description: 'Fresh organic bananas from Ecuador.'
  },
  {
    id: 'p-2',
    name: 'Whole Milk',
    category: 'Dairy',
    price: 3.49,
    stock: 40,
    description: '1 Gallon of Vitamin D Whole Milk.'
  },
  {
    id: 'p-3',
    name: 'Sourdough Bread',
    category: 'Bakery',
    price: 5.99,
    stock: 20,
    description: 'Artisanal freshly baked sourdough.'
  }
];

export const CATEGORIES = [
  'Produce',
  'Dairy',
  'Bakery',
  'Meat',
  'Beverages',
  'Snacks',
  'Household',
  'Personal Care'
];

export const THEMES = [
  { name: 'Indigo Dream', primary: '#4f46e5', bg: '#f3f4f6' },
  { name: 'Forest Mint', primary: '#059669', bg: '#ecfdf5' },
  { name: 'Deep Ocean', primary: '#0284c7', bg: '#f0f9ff' },
  { name: 'Rose Wood', primary: '#be123c', bg: '#fff1f2' },
  { name: 'Midnight Violet', primary: '#7c3aed', bg: '#f5f3ff' },
  { name: 'Golden Amber', primary: '#d97706', bg: '#fffbeb' },
  { name: 'Slate Steel', primary: '#475569', bg: '#f8fafc' }
];

export const STAFF_SALUTATIONS = [
  "Hope you have a productive shift today!",
  "Ready to crush those sales targets?",
  "Let's make every customer interaction count!",
  "The shelves are looking great, thanks for your hard work!",
  "Customer satisfaction starts with your smile. Have a great day!",
  "Teamwork makes the dream work. Let's go!",
  "You're an essential part of the SuperMart family.",
  "Stay focused, stay positive, and stay awesome!",
  "Fresh inventory just arrived. Busy day ahead!",
  "Coffee is ready in the breakroom. Let's get to work!"
];
