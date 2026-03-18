'use client';

// Trevins - Main Application
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Navbar } from '@/components/shared/navbar';
import { Sidebar } from '@/components/shared/sidebar';
import HomePage from '@/components/user/home-page';
import AdminDashboard from '@/components/admin/admin-dashboard';
import { VendorDashboard } from '@/components/vendor/vendor-dashboard';
import { UserDashboard } from '@/components/user/user-dashboard';
import { AuthModal } from '@/components/shared/authModal';
import { EventDetailModal } from '@/components/shared/event-detail-modal';
import { BookingModal } from '@/components/shared/booking-modal';
import AccommodationBookingModal from '@/components/shared/accommodation-booking-modal';
import { MobileBottomNav } from '@/components/shared/mobile-bottom-nav';

export type ViewType =
  | 'home'
  | 'dashboard'
  | 'events'
  | 'tickets'
  | 'bookings'
  | 'users'
  | 'vendors'
  | 'accommodations'
  | 'categories'
  | 'subscriptions'
  | 'settings'
  | 'profile'
  | 'qr-scanner'
  | 'saved';

export default function MainApp() {
  const { user, isAuthenticated, isLoading, setLoading, logout } = useAuthStore();
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingEventId, setBookingEventId] = useState<string | null>(null);
  const [showAccommodationBookingModal, setShowAccommodationBookingModal] = useState(false);
  const [bookingAccommodationId, setBookingAccommodationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        const token = useAuthStore.getState().token;
        if (token) {
          const response = await fetch('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            useAuthStore.getState().login(data.user, token);
          } else {
            logout();
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [logout, setLoading]);

  // Auto-redirect to dashboard after auth
  useEffect(() => {
    if (isAuthenticated) {
      setCurrentView('dashboard');
      setShowAuthModal(false);
    } else {
      setCurrentView('home');
    }
  }, [isAuthenticated]);

  // Handle navigation
  const handleNavigate = (view: ViewType) => {
    if (!isAuthenticated && (view !== 'home' && view !== 'events')) {
      setShowAuthModal(true);
      return;
    }
    setCurrentView(view);
    setSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  // Handle login click
  const handleLoginClick = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  // Handle register click
  const handleRegisterClick = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  // Handle event click
  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
  };

  // Handle book now click
  const handleBookNow = (eventId: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setBookingEventId(eventId);
    setShowBookingModal(true);
  };

  const handleAccommodationBookNow = (accommodationId: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setBookingAccommodationId(accommodationId);
    setShowAccommodationBookingModal(true);
  };

  // Check if we should show mobile bottom nav
  const showMobileNav = currentView === 'home' || 
    (isAuthenticated && user?.role === 'USER' && ['home', 'events', 'bookings', 'tickets', 'saved', 'profile'].includes(currentView));

  // Render based on view and role
  const renderContent = () => {
    // Show home for non-authenticated users or when explicitly on home
    if (
      !isAuthenticated ||
      currentView === 'home' ||
      (isAuthenticated && user?.role === 'USER' && currentView === 'events')
    ) {
      return (
        <HomePage
          onEventClick={handleEventClick}
          onBookNow={handleBookNow}
          onAccommodationBookNow={handleAccommodationBookNow}
          onLoginClick={handleLoginClick}
        />
      );
    }

    // Dashboard based on role
    if (currentView === 'dashboard') {
      if (user?.role === 'ADMIN') {
        return <AdminDashboard />;
      } else if (user?.role === 'VENDOR') {
        return <VendorDashboard />;
      } else {
        return <UserDashboard />;
      }
    }

    // Other views
    if (user?.role === 'ADMIN') {
      switch (currentView) {
        case 'users':
          return <AdminDashboard view="users" />;
        case 'vendors':
          return <AdminDashboard view="vendors" />;
        case 'events':
          return <AdminDashboard view="events" />;
        case 'tickets':
          return <AdminDashboard view="tickets" />;
        case 'bookings':
          return <AdminDashboard view="bookings" />;
        case 'categories':
          return <AdminDashboard view="categories" />;
        case 'subscriptions':
          return <AdminDashboard view="subscriptions" />;
        default:
          return <AdminDashboard />;
      }
    }

    if (user?.role === 'VENDOR') {
      switch (currentView) {
        case 'events':
          return <VendorDashboard view="events" />;
        case 'tickets':
          return <VendorDashboard view="tickets" />;
        case 'bookings':
          return <VendorDashboard view="bookings" />;
        case 'accommodations':
          return <VendorDashboard view="accommodations" />;
        case 'qr-scanner':
          return <VendorDashboard view="qr-scanner" />;
        case 'settings':
          return <VendorDashboard view="settings" />;
        default:
          return <VendorDashboard />;
      }
    }

    // User views
    switch (currentView) {
      case 'bookings':
        return <UserDashboard view="bookings" />;
      case 'tickets':
        return <UserDashboard view="tickets" />;
      case 'profile':
        return <UserDashboard view="profile" />;
      case 'saved':
        return <UserDashboard view="tickets" />;
      default:
        return <UserDashboard />;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2196F3] mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden max-w-[100vw]">
      {/* Navbar - Hidden on mobile for user role when on home/bookings/tickets/saved/profile */}
      <div className={showMobileNav ? 'md:block hidden' : ''}>
        <Navbar
          onLoginClick={handleLoginClick}
          onRegisterClick={handleRegisterClick}
          onNavigate={handleNavigate}
          currentView={currentView}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>

      {/* Mobile Header - Only for mobile user views */}
      {showMobileNav && (
        <header className="md:hidden sticky top-0 z-50 bg-[#2196F3] text-white">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold">TREVINS</h1>
              </div>
              {isAuthenticated && (
                <div className="flex items-center gap-2">
                  <span className="text-sm opacity-90">Halo, {user?.name?.split(' ')[0]}</span>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      <div className="flex">
        {/* Sidebar - only show when authenticated and not on home */}
        {isAuthenticated && currentView !== 'home' && !showMobileNav && (
          <Sidebar
            currentView={currentView}
            onNavigate={handleNavigate}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
        )}

        {/* Main Content */}
        <main className={cn(
          "flex-1 min-w-0",
          showMobileNav ? "min-h-[calc(100vh-8rem)] pb-20 md:pb-0" : "min-h-[calc(100vh-4rem)]"
        )}>
          {renderContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {showMobileNav && (
        <MobileBottomNav currentView={currentView} onNavigate={handleNavigate} />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onSwitchMode={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
        onNavigate={handleNavigate}
      />

      {/* Event Detail Modal */}
      <EventDetailModal
        eventId={selectedEventId || ''}
        isOpen={!!selectedEventId}
        onClose={() => setSelectedEventId(null)}
        onBookNow={handleBookNow}
      />

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        eventId={bookingEventId || ''}
        onClose={() => {
          setShowBookingModal(false);
          setBookingEventId(null);
        }}
        onSuccess={() => {
          setShowBookingModal(false);
          setBookingEventId(null);
          setCurrentView('bookings');
        }}
      />

      {/* Accommodation Booking Modal */}
      <AccommodationBookingModal
        isOpen={showAccommodationBookingModal}
        accommodationId={bookingAccommodationId || ''}
        onClose={(open) => {
          setShowAccommodationBookingModal(open);
          if (!open) setBookingAccommodationId(null);
        }}
        onSuccess={() => {
          setShowAccommodationBookingModal(false);
          setBookingAccommodationId(null);
          setCurrentView('bookings');
        }}
      />
    </div>
  );
}

// Helper function
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
