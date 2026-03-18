'use client';

import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Compass,
  FileText,
  Bookmark,
  User,
} from 'lucide-react';
import type { ViewType } from '@/app/page';

interface MobileBottomNavProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

const navItems = [
  { id: 'home' as ViewType, label: 'Eksplor', icon: Compass },
  { id: 'bookings' as ViewType, label: 'Pesanan', icon: FileText },
  { id: 'saved' as ViewType, label: 'Simpan', icon: Bookmark },
  { id: 'profile' as ViewType, label: 'Profil', icon: User },
];

export function MobileBottomNav({ currentView, onNavigate }: MobileBottomNavProps) {
  const { isAuthenticated } = useAuthStore();

  const handleNavClick = (view: ViewType) => {
    if (!isAuthenticated && view !== 'home') {
      // Will trigger auth modal from parent
      onNavigate(view);
      return;
    }
    onNavigate(view);
  };

  // Check if a nav item is active
  const isItemActive = (itemId: ViewType) => {
    if (itemId === currentView) return true;
    
    // Handle sub-views
    if (itemId === 'home' && currentView === 'events') return true;
    if (itemId === 'bookings' && currentView === 'tickets') return true;
    if (itemId === 'profile' && currentView === 'settings') return true;
    
    return false;
  };

  return (
    <nav className="md:hidden fixed bottom-6 left-4 right-4 z-50 bg-white border border-gray-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden">
      <div className="flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isItemActive(item.id);

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={cn(
                'relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-300',
                isActive 
                  ? 'text-[#2196F3]' 
                  : 'text-gray-400 hover:text-gray-600 active:scale-90'
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="bubble"
                  className="absolute inset-x-2 inset-y-2 bg-[#2196F3]/10 rounded-2xl z-0"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div className="relative z-10">
                <Icon className={cn('h-5 w-5 mb-0.5', isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]')} />
              </div>
              <span className={cn(
                'relative z-10 text-[10px] tracking-tight transition-all duration-300',
                isActive ? 'font-black scale-105' : 'font-medium opacity-70'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileBottomNav;
