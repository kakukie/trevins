import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function generateBookingCode(): string {
  const prefix = 'AP';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

export function generateSKU(prefix: string = 'TKT'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}${random}`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function calculateNights(checkIn: Date, checkOut: Date): number {
  const diff = checkOut.getTime() - checkIn.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export const CATEGORIES = [
  { value: 'semua', label: 'Semua', icon: 'LayoutGrid' },
  { value: 'pantai', label: 'Pantai', icon: 'Waves' },
  { value: 'gunung', label: 'Gunung', icon: 'Mountain' },
  { value: 'permainan', label: 'Permainan', icon: 'Gamepad2' },
  { value: 'budaya', label: 'Budaya', icon: 'Landmark' },
  { value: 'taman', label: 'Taman', icon: 'Trees' },
  { value: 'museum', label: 'Museum', icon: 'Building2' },
  { value: 'adventure', label: 'Adventure', icon: 'Compass' },
] as const;

export const EVENT_CATEGORIES = [
  'Pantai',
  'Gunung', 
  'Permainan',
  'Budaya',
  'Taman',
  'Museum',
  'Adventure',
  'Lainnya'
] as const;

export const ACCOMMODATION_TYPES = [
  { value: 'KOS', label: 'Kos' },
  { value: 'HOTEL', label: 'Hotel' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'HOMESTAY', label: 'Homestay' },
  { value: 'APARTEMEN', label: 'Apartemen' },
] as const;
