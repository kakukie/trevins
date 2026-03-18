'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Ticket,
  Bookmark,
  Settings,
  QrCode,
  ChevronLeft,
  ChevronRight,
  Shield,
  MapPin,
  User,
  Store,
} from 'lucide-react';
import { useAuthStore, UserRole } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ViewType } from '@/app/page';

interface NavItem {
  title: string;
  view: ViewType;
  icon: React.ReactNode;
  badge?: string | number;
}

const adminNavItems: NavItem[] = [
  { title: 'Dashboard', view: 'dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { title: 'Kelola Pengguna', view: 'users', icon: <Users className="h-5 w-5" /> },
  { title: 'Kelola Vendor', view: 'vendors', icon: <Store className="h-5 w-5" /> },
  { title: 'Kelola Event', view: 'events', icon: <Calendar className="h-5 w-5" /> },
  { title: 'Kelola Tiket', view: 'tickets', icon: <Ticket className="h-5 w-5" /> },
  { title: 'Semua Booking', view: 'bookings', icon: <Bookmark className="h-5 w-5" /> },
  { title: 'Kategori', view: 'categories', icon: <MapPin className="h-5 w-5" /> },
  { title: 'Paket', view: 'subscriptions', icon: <Shield className="h-5 w-5" /> },
  { title: 'Pengaturan', view: 'settings', icon: <Settings className="h-5 w-5" /> },
];

const vendorNavItems: NavItem[] = [
  { title: 'Dashboard', view: 'dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { title: 'Event Saya', view: 'events', icon: <Calendar className="h-5 w-5" /> },
  { title: 'Kelola Tiket', view: 'tickets', icon: <Ticket className="h-5 w-5" /> },
  { title: 'Penginapan', view: 'accommodations', icon: <MapPin className="h-5 w-5" /> },
  { title: 'Booking Masuk', view: 'bookings', icon: <Bookmark className="h-5 w-5" /> },
  { title: 'QR Scanner', view: 'qr-scanner', icon: <QrCode className="h-5 w-5" /> },
  { title: 'Pengaturan', view: 'settings', icon: <Settings className="h-5 w-5" /> },
];

const userNavItems: NavItem[] = [
  { title: 'Dashboard', view: 'dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { title: 'Booking Saya', view: 'bookings', icon: <Bookmark className="h-5 w-5" /> },
  { title: 'Tiket Saya', view: 'tickets', icon: <Ticket className="h-5 w-5" /> },
  { title: 'Profil', view: 'profile', icon: <User className="h-5 w-5" /> },
];

const roleNavItems: Record<UserRole, NavItem[]> = {
  ADMIN: adminNavItems,
  VENDOR: vendorNavItems,
  USER: userNavItems,
};

const roleColors: Record<UserRole, { bg: string; text: string; border: string }> = {
  ADMIN: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  VENDOR: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  USER: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
};

const roleIcons: Record<UserRole, React.ReactNode> = {
  ADMIN: <Shield className="h-4 w-4" />,
  VENDOR: <Store className="h-4 w-4" />,
  USER: <User className="h-4 w-4" />,
};

interface SidebarProps {
  className?: string;
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  isOpen: boolean;
  onToggle: () => void;
}

// Navigation Items Component
function NavItemsList({ 
  navItems, 
  currentView, 
  onItemClick, 
  collapsed = false 
}: { 
  navItems: NavItem[]; 
  currentView: ViewType; 
  onItemClick: (view: ViewType) => void;
  collapsed?: boolean;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const active = currentView === item.view;

        if (collapsed) {
          return (
            <Tooltip key={item.view} delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onItemClick(item.view)}
                  className={cn(
                    'flex h-11 w-full items-center justify-center rounded-lg transition-colors',
                    active
                      ? 'bg-[#2196F3] text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-[#2196F3]'
                  )}
                >
                  {item.icon}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                {item.title}
              </TooltipContent>
            </Tooltip>
          );
        }

        return (
          <button
            key={item.view}
            onClick={() => onItemClick(item.view)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors w-full text-left',
              active
                ? 'bg-[#2196F3] text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-[#2196F3]'
            )}
          >
            {item.icon}
            <span className="truncate">{item.title}</span>
            {item.badge && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF9800] px-1.5 text-xs font-medium text-white">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

// Sidebar Header Component
function SidebarHeader({ userRole, collapsed }: { userRole: UserRole; collapsed: boolean }) {
  const colors = roleColors[userRole];
  
  return (
    <div className={cn('p-4', collapsed && 'px-2')}>
      <div className={cn('flex items-center gap-3 rounded-lg p-2', colors.bg, colors.border, 'border')}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#2196F3] to-[#1976D2]">
          <MapPin className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate">TREVINS</span>
            <span className={cn('flex items-center gap-1 text-xs font-medium', colors.text)}>
              {roleIcons[userRole]}
              {userRole === 'ADMIN' ? 'Admin Panel' : userRole === 'VENDOR' ? 'Vendor Panel' : 'User Panel'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Sidebar Footer Component
function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn('p-4', collapsed && 'px-2')}>
      {!collapsed && (
        <div className="rounded-lg bg-gradient-to-r from-[#2196F3]/10 to-[#FF9800]/10 p-3">
          <p className="text-xs text-gray-600">
            Butuh bantuan?{' '}
            <button
              onClick={() => alert('Hubungi support@tripify.id')}
              className="text-[#2196F3] font-medium hover:underline"
            >
              Hubungi kami
            </button>
          </p>
        </div>
      )}
      {collapsed && (
        <div className="flex justify-center">
          <button
            onClick={() => alert('Hubungi support@tripify.id')}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-[#2196F3] hover:text-white transition-colors"
          >
            ?
          </button>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ className, currentView, onNavigate, isOpen, onToggle }: SidebarProps) {
  const { user, token, isAuthenticated } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [vendorPendingBookings, setVendorPendingBookings] = useState<number>(0);

  const userRole = user?.role || 'USER';

  useEffect(() => {
    const run = async () => {
      if (!isAuthenticated || userRole !== 'VENDOR') {
        setVendorPendingBookings(0);
        return;
      }
      try {
        const res = await fetch('/api/dashboard', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = await res.json().catch(() => null);
        setVendorPendingBookings(Number(data?.stats?.pendingBookings || 0));
      } catch {
        setVendorPendingBookings(0);
      }
    };
    void run();
  }, [isAuthenticated, token, userRole]);

  const navItems = useMemo(() => {
    const base = roleNavItems[userRole] || [];
    if (userRole !== 'VENDOR') return base;
    const badge = vendorPendingBookings > 99 ? '99+' : vendorPendingBookings;
    return base.map((it) => (it.view === 'bookings' && vendorPendingBookings > 0 ? { ...it, badge } : it));
  }, [userRole, vendorPendingBookings]);

  const handleItemClick = (view: ViewType) => {
    onNavigate(view);
  };

  return (
    <>
      {/* Mobile Sidebar using Sheet */}
      <Sheet open={isOpen} onOpenChange={onToggle}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#2196F3] to-[#1976D2]">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-semibold">TREVINS</span>
                <span className={cn('flex items-center gap-1 text-xs font-medium', roleColors[userRole].text)}>
                  {roleIcons[userRole]}
                  {userRole === 'ADMIN' ? 'Admin Panel' : userRole === 'VENDOR' ? 'Vendor Panel' : 'User Panel'}
                </span>
              </div>
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 h-[calc(100vh-120px)]">
            <div className="p-4">
              <NavItemsList 
                navItems={navItems} 
                currentView={currentView} 
                onItemClick={handleItemClick} 
              />
            </div>
          </ScrollArea>
          <div className="p-4 border-t">
            <div className="rounded-lg bg-gradient-to-r from-[#2196F3]/10 to-[#FF9800]/10 p-3">
              <p className="text-xs text-gray-600">
                Butuh bantuan?{' '}
                <button
                  onClick={() => alert('Hubungi support@trevins.id')}
                  className="text-[#2196F3] font-medium hover:underline"
                >
                  Hubungi kami
                </button>
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r bg-white transition-all duration-300 z-40',
          isCollapsed ? 'w-[70px]' : 'w-[260px]',
          className
        )}
      >
        {/* Collapse Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border bg-white shadow-sm hover:bg-gray-50"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>

        <SidebarHeader userRole={userRole} collapsed={isCollapsed} />

        <Separator />

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2 py-4">
          <NavItemsList 
            navItems={navItems} 
            currentView={currentView} 
            onItemClick={handleItemClick} 
            collapsed={isCollapsed} 
          />
        </ScrollArea>

        <Separator />

        <SidebarFooter collapsed={isCollapsed} />
      </aside>
    </>
  );
}

export default Sidebar;
