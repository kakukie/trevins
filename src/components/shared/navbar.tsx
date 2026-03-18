'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Menu,
  User,
  LogOut,
  Settings,
  LayoutDashboard,
  Calendar,
  Ticket,
  MapPin,
  Users,
  Shield,
  ChevronDown,
  Sparkles,
  Bell,
  CreditCard,
} from 'lucide-react';
import { motion } from 'framer-motion';

import { useAuthStore, UserRole } from '@/store/auth-store';
import { useUiStore } from '@/store/ui-store';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { cn, getInitials } from '@/lib/utils';
import type { ViewType } from '@/app/page';

const roleColors: Record<UserRole, string> = {
  ADMIN: 'bg-red-500',
  VENDOR: 'bg-orange-500',
  USER: 'bg-blue-500',
};

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  VENDOR: 'Vendor',
  USER: 'Pengguna',
};

interface NavbarProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onNavigate: (view: ViewType) => void;
  currentView: ViewType;
  onMenuClick?: () => void;
}

export function Navbar({
  onLoginClick,
  onRegisterClick,
  onNavigate,
  currentView,
  onMenuClick,
}: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const searchQuery = useUiStore((s) => s.searchQuery);
  const setSearchQuery = useUiStore((s) => s.setSearchQuery);
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [vendorPendingBookings, setVendorPendingBookings] = useState<number>(0);

  useEffect(() => {
    const run = async () => {
      if (!isAuthenticated || user?.role !== 'VENDOR') {
        setVendorPendingBookings(0);
        return;
      }
      try {
        const token = useAuthStore.getState().token;
        const res = await fetch('/api/dashboard', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (res.ok) {
          const data = await res.json();
          setVendorPendingBookings(Number(data?.stats?.pendingBookings || 0));
        }
      } catch {
        // ignore
      }
    };
    run();
  }, [isAuthenticated, user?.role]);

  const handleLogout = () => {
    logout();
    onNavigate('home');
    setIsMobileMenuOpen(false);
  };

  const handleLoginClick = () => {
    onLoginClick();
    setIsMobileMenuOpen(false);
  };

  const handleRegisterClick = () => {
    onRegisterClick();
    setIsMobileMenuOpen(false);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="h-3 w-3" />;
      case 'VENDOR':
        return <Calendar className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const handleNavigate = (view: ViewType) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className={cn("sticky top-0 z-50 w-full border-b bg-white transition-all duration-300 text-gray-900")}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNavigate('home')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#2196F3] to-[#1976D2] shadow-lg group-hover:shadow-[#2196F3]/40 transition-shadow">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-[#2196F3] via-[#ff9800] to-[#2196F3] bg-size-200 animate-gradient-x bg-clip-text text-transparent">
              TREVINS
            </span>
          </motion.button>

          {/* Search Bar */}
          <div className={cn(isMobile ? "flex-1 mx-4" : "hidden md:flex flex-1 max-w-md mx-8")}>
            <div className="relative w-full">
              <Search className={cn("absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", isMobile ? "text-gray-600" : "text-muted-foreground")} />
              <Input
                type="search"
                placeholder="Cari event, destinasi, atau tiket..."
                className={cn("pl-10 pr-4 w-full rounded-full", isMobile ? "bg-white" : "bg-gray-50")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleNavigate('home');
                  }
                }}
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                {/* Role Badge */}
                <Badge
                  variant="secondary"
                  className={cn(
                    'gap-1 text-white border-0',
                    roleColors[user.role]
                  )}
                >
                  {getRoleIcon(user.role)}
                  {roleLabels[user.role]}
                </Badge>

                {user.role === 'VENDOR' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    onClick={() => handleNavigate('bookings')}
                    aria-label="Booking masuk"
                  >
                    <Bell className="h-5 w-5" />
                    {vendorPendingBookings > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {vendorPendingBookings > 99 ? '99+' : vendorPendingBookings}
                      </span>
                    )}
                  </Button>
                )}

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-9 w-9 rounded-full"
                    >
                      <Avatar className="h-9 w-9">
                        {user.avatar ? (
                          <AvatarImage src={user.avatar} alt={user.name} />
                        ) : null}
                        <AvatarFallback className="bg-[#2196F3] text-white text-sm font-medium">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {user.role === 'ADMIN' && (
                      <>
                        <DropdownMenuItem onClick={() => handleNavigate('dashboard')}>
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigate('users')}>
                          <Users className="mr-2 h-4 w-4" />
                          Kelola Pengguna
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigate('vendors')}>
                          <Shield className="mr-2 h-4 w-4" />
                          Kelola Vendor
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigate('categories')}>
                          <MapPin className="mr-2 h-4 w-4" />
                          Kategori
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigate('subscriptions')}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Paket
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigate('events')}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Kelola Event
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigate('tickets')}>
                          <Ticket className="mr-2 h-4 w-4" />
                          Kelola Tiket
                        </DropdownMenuItem>
                      </>
                    )}

                    {user.role === 'VENDOR' && (
                      <>
                        <DropdownMenuItem onClick={() => handleNavigate('dashboard')}>
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard Vendor
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigate('events')}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Event Saya
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigate('tickets')}>
                          <Ticket className="mr-2 h-4 w-4" />
                          Kelola Tiket
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigate('accommodations')}>
                          <MapPin className="mr-2 h-4 w-4" />
                          Penginapan
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigate('qr-scanner')}>
                          <MapPin className="mr-2 h-4 w-4" />
                          Scan QR
                        </DropdownMenuItem>
                      </>
                    )}

                    {user.role === 'USER' && (
                      <>
                        <DropdownMenuItem onClick={() => handleNavigate('dashboard')}>
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigate('bookings')}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Booking Saya
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigate('tickets')}>
                          <Ticket className="mr-2 h-4 w-4" />
                          Tiket Saya
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleNavigate('profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Profil
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleNavigate('settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Pengaturan
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Keluar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="text-gray-600 hover:text-[#2196F3]"
                  onClick={handleLoginClick}
                >
                  Masuk
                </Button>
                <Button
                  className="bg-[#2196F3] hover:bg-[#1976D2] text-white"
                  onClick={handleRegisterClick}
                >
                  Daftar
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px] bg-white shadow-2xl border border-gray-200">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#2196F3] to-[#1976D2]">
                      <MapPin className="h-4 w-4 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-[#2196F3] to-[#FF9800] bg-clip-text text-transparent">
                      TREVINS
                    </span>
                  </SheetTitle>
                </SheetHeader>

                {/* Mobile Search */}
                <div className="mt-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Cari event atau destinasi..."
                      className="pl-10 pr-4"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleNavigate('home');
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-4">
                  {isAuthenticated && user ? (
                    <>
                      {/* User Info */}
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                        <Avatar className="h-10 w-10">
                          {user.avatar ? (
                            <AvatarImage src={user.avatar} alt={user.name} />
                          ) : null}
                          <AvatarFallback className="bg-[#2196F3] text-white">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-white border-0 text-xs',
                            roleColors[user.role]
                          )}
                        >
                          {roleLabels[user.role]}
                        </Badge>
                      </div>

                      {/* Role-based Menu Items */}
                      <nav className="flex flex-col gap-1">
                        {user.role === 'ADMIN' && (
                          <>
                            <MobileNavItem onClick={() => handleNavigate('dashboard')} icon={<LayoutDashboard className="h-4 w-4" />}>
                              Dashboard Admin
                            </MobileNavItem>
                            <MobileNavItem onClick={() => handleNavigate('users')} icon={<Users className="h-4 w-4" />}>
                              Kelola Pengguna
                            </MobileNavItem>
                            <MobileNavItem onClick={() => handleNavigate('vendors')} icon={<Shield className="h-4 w-4" />}>
                              Kelola Vendor
                            </MobileNavItem>
                            <MobileNavItem onClick={() => handleNavigate('categories')} icon={<MapPin className="h-4 w-4" />}>
                              Kategori
                            </MobileNavItem>
                            <MobileNavItem onClick={() => handleNavigate('subscriptions')} icon={<CreditCard className="h-4 w-4" />}>
                              Paket
                            </MobileNavItem>
                            <MobileNavItem onClick={() => handleNavigate('events')} icon={<Calendar className="h-4 w-4" />}>
                              Kelola Event
                            </MobileNavItem>
                            <MobileNavItem onClick={() => handleNavigate('tickets')} icon={<Ticket className="h-4 w-4" />}>
                              Kelola Tiket
                            </MobileNavItem>
                          </>
                        )}

                        {user.role === 'VENDOR' && (
                          <>
                            <MobileNavItem onClick={() => handleNavigate('dashboard')} icon={<LayoutDashboard className="h-4 w-4" />}>
                              Dashboard Vendor
                            </MobileNavItem>
                            <MobileNavItem onClick={() => handleNavigate('events')} icon={<Calendar className="h-4 w-4" />}>
                              Event Saya
                            </MobileNavItem>
                            <MobileNavItem onClick={() => handleNavigate('tickets')} icon={<Ticket className="h-4 w-4" />}>
                              Kelola Tiket
                            </MobileNavItem>
                            <MobileNavItem onClick={() => handleNavigate('accommodations')} icon={<MapPin className="h-4 w-4" />}>
                              Penginapan
                            </MobileNavItem>
                            <MobileNavItem onClick={() => handleNavigate('bookings')} icon={<Calendar className="h-4 w-4" />}>
                              <span className="flex items-center justify-between w-full">
                                <span>Booking Masuk</span>
                                {vendorPendingBookings > 0 && (
                                  <span className="min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                                    {vendorPendingBookings > 99 ? '99+' : vendorPendingBookings}
                                  </span>
                                )}
                              </span>
                            </MobileNavItem>
                            <MobileNavItem onClick={() => handleNavigate('qr-scanner')} icon={<MapPin className="h-4 w-4" />}>
                              Scan QR
                            </MobileNavItem>
                            <MobileNavItem onClick={() => handleNavigate('settings')} icon={<Settings className="h-4 w-4" />}>
                              Pengaturan
                            </MobileNavItem>
                          </>
                        )}

                        {user.role === 'USER' && (
                          <>
                            <MobileNavItem onClick={() => handleNavigate('dashboard')} icon={<LayoutDashboard className="h-4 w-4" />}>
                              Dashboard
                            </MobileNavItem>
                            <MobileNavItem onClick={() => handleNavigate('bookings')} icon={<Calendar className="h-4 w-4" />}>
                              Booking Saya
                            </MobileNavItem>
                            <MobileNavItem onClick={() => handleNavigate('tickets')} icon={<Ticket className="h-4 w-4" />}>
                              Tiket Saya
                            </MobileNavItem>
                          </>
                        )}

                        {user.role === 'USER' && (
                          <MobileNavItem onClick={() => handleNavigate('settings')} icon={<Settings className="h-4 w-4" />}>
                            Pengaturan
                          </MobileNavItem>
                        )}
                      </nav>

                      <Button
                        variant="outline"
                        className="mt-4 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-600"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Keluar
                      </Button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2 mt-4">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleLoginClick}
                      >
                        Masuk
                      </Button>
                      <Button
                        className="w-full bg-[#2196F3] hover:bg-[#1976D2]"
                        onClick={handleRegisterClick}
                      >
                        Daftar
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}

interface MobileNavItemProps {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function MobileNavItem({ onClick, icon, children }: MobileNavItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-50 hover:text-[#2196F3] transition-colors w-full text-left"
    >
      {icon}
      {children}
    </button>
  );
}

export default Navbar;
