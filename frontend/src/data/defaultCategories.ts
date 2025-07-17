import { Category } from '../types';
import { generateId } from '../utils/calculations';

export const defaultIncomeCategories: Omit<Category, 'id' | 'createdAt'>[] = [
  { name: 'Tour Packages', type: 'income', color: '#3B82F6' },
  { name: 'Flight Bookings', type: 'income', color: '#10B981' },
  { name: 'Hotel Reservations', type: 'income', color: '#F59E0B' },
  { name: 'Car Rentals', type: 'income', color: '#EF4444' },
  { name: 'Travel Insurance', type: 'income', color: '#8B5CF6' },
  { name: 'Visa Services', type: 'income', color: '#06B6D4' },
  { name: 'Travel Accessories', type: 'income', color: '#84CC16' },
  { name: 'Consulting Services', type: 'income', color: '#F97316' }
];

export const defaultExpenseCategories: Omit<Category, 'id' | 'createdAt'>[] = [
  { name: 'Employee Salaries', type: 'expense', color: '#DC2626' },
  { name: 'Office Rent', type: 'expense', color: '#7C2D12' },
  { name: 'Marketing & Advertising', type: 'expense', color: '#B91C1C' },
  { name: 'Transportation', type: 'expense', color: '#991B1B' },
  { name: 'Utilities', type: 'expense', color: '#7F1D1D' },
  { name: 'Insurance', type: 'expense', color: '#450A0A' },
  { name: 'Technology & Software', type: 'expense', color: '#FCA5A5' },
  { name: 'Professional Services', type: 'expense', color: '#FECACA' },
  { name: 'Travel Costs', type: 'expense', color: '#FED7D7' },
  { name: 'Office Supplies', type: 'expense', color: '#FEE2E2' }
];

export const createDefaultCategories = (): Category[] => {
  const now = new Date();
  return [
    ...defaultIncomeCategories.map(cat => ({
      ...cat,
      id: generateId(),
      createdAt: now
    })),
    ...defaultExpenseCategories.map(cat => ({
      ...cat,
      id: generateId(),
      createdAt: now
    }))
  ];
};