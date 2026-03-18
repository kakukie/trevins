# 🔧 RESPONSIVE DESIGN - DETAILED FIX GUIDE

**File**: RESPONSIVE_DESIGN_FIX.md  
**Created**: March 12, 2026

---

## 📌 OVERVIEW

Panduan lengkap untuk memperbaiki responsive design di Trevins agar tampilan optimal di mobile, tablet, dan desktop.

---

## 1️⃣ NAVBAR - RESPONSIVE HAMBURGER MENU

### Current Issue
- Search bar tidak responsive di mobile
- Menu items tidak ter-collapse
- Logo terlalu besar di mobile

### Solution Implementation

**File to update**: [src/components/shared/navbar.tsx](src/components/shared/navbar.tsx)

```typescript
// PSEUDOCODE - Struktur yang dbutuhkan

import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

export function Navbar() {
  const isMobile = useIsMobile(); // Custom hook for mobile detection
  
  return (
    <nav className="flex items-center justify-between px-2 md:px-6 py-3 bg-white shadow">
      {/* Logo - smaller on mobile */}
      <div className="flex-shrink-0">
        <h1 className="text-lg md:text-2xl font-bold">TREVINS</h1>
      </div>

      {/* Desktop Search - hidden on mobile */}
      {!isMobile && (
        <div className="flex-1 mx-4">
          <input 
            type="search" 
            placeholder="Search..."
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
      )}

      {/* Navigation - Different on mobile vs desktop */}
      {!isMobile ? (
        // Desktop Navigation
        <div className="hidden md:flex gap-4">
          <a href="/home" className="text-sm text-gray-700">Home</a>
          <a href="/bookings" className="text-sm text-gray-700">Bookings</a>
          <a href="/profile" className="text-sm text-gray-700">Profile</a>
        </div>
      ) : (
        // Mobile Navigation - Hamburger Menu
        <Sheet>
          <SheetTrigger asChild>
            <button className="p-2">
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <div className="flex flex-col gap-4 mt-4">
              <a href="/home" className="text-base">Home</a>
              <a href="/bookings" className="text-base">Bookings</a>
              <a href="/profile" className="text-base">Profile</a>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </nav>
  );
}
```

### Tailwind Classes to Add
```css
/* Responsive utilities */
px-2 md:px-6        /* Padding: mobile 8px, tablet+ 24px */
text-lg md:text-2xl /* Font size: mobile lg, tablet+ 2xl */
hidden md:flex      /* Hide on mobile, show on tablet+ */
w-full md:w-auto    /* Full width mobile, auto tablet+ */
```

---

## 2️⃣ SIDEBAR - MOBILE DRAWER + TABLET COLLAPSE

### Current Issue
- Sidebar always visible (takes mobile width)
- No alternative navigation for mobile
- Not suitable for small screens

### Solution Implementation

**File to update**: [src/components/shared/sidebar.tsx](src/components/shared/sidebar.tsx)

```typescript
// PSEUDOCODE - Mobile-first sidebar

import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, ChevronLeft } from 'lucide-react';
import { useState } from 'react';

export function Sidebar() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Mobile: Show as drawer
  if (isMobile) {
    return (
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <button className="fixed bottom-20 left-4 z-40 p-3 bg-blue-600 text-white rounded-full">
            <Menu className="w-5 h-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <nav className="flex flex-col gap-2 pt-4">
            <a href="/dashboard" className="px-4 py-2 hover:bg-gray-100">Dashboard</a>
            <a href="/bookings" className="px-4 py-2 hover:bg-gray-100">My Bookings</a>
            <a href="/settings" className="px-4 py-2 hover:bg-gray-100">Settings</a>
          </nav>
        </SheetContent>
      </Sheet>
    );
  }

  // Tablet+: Collapsible sidebar
  return (
    <aside className={`${
      collapsed ? 'w-20' : 'w-64'
    } transition-all duration-300 border-r border-gray-200 h-screen flex flex-col`}>
      {/* Collapse button */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="p-4"
      >
        <ChevronLeft className={`w-5 h-5 transition ${collapsed ? 'rotate-180' : ''}`} />
      </button>

      {/* Navigation items */}
      <nav className="flex-1 flex flex-col gap-2 p-4">
        <a href="/dashboard" className={`px-4 py-2 ${collapsed ? 'text-center' : ''}`}>
          {!collapsed && 'Dashboard'}
        </a>
        {/* More items */}
      </nav>
    </aside>
  );
}
```

### Responsive Layout Container
```typescript
// In layout.tsx or page.tsx
export default function RootLayout({ children }) {
  const isMobile = useIsMobile();

  return (
    <html>
      <body>
        <Navbar />
        <div className="flex">
          {/* Sidebar hidden on mobile */}
          <div className="hidden md:block">
            <Sidebar />
          </div>
          {/* Main content */}
          <main className="flex-1 overflow-auto">
            {children}
            {/* Mobile bottom nav - visible only on mobile */}
            {isMobile && <MobileBottomNav />}
          </main>
        </div>
      </body>
    </html>
  );
}
```

---

## 3️⃣ EVENT CARDS - RESPONSIVE GRID

### Current Issue
- Same grid layout on all screen sizes
- Not optimal spacing for mobile
- Image sizing issues

### Solution Implementation

**File to update**: [src/components/user/home-page.tsx](src/components/user/home-page.tsx)

```typescript
// RESPONSIVE CARD GRID

<section className="py-4 md:py-8 lg:py-12">
  <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6 px-2 md:px-0">
    Featured Events
  </h2>
  
  {/* Responsive grid */}
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 px-2 md:px-4 lg:px-6">
    {events.map((event) => (
      <EventCard 
        key={event.id} 
        event={event}
        className="h-auto"
      />
    ))}
  </div>
</section>

// EventCard Component
export function EventCard({ event }) {
  return (
    <div className="rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow">
      {/* Image - responsive height */}
      <div className="relative w-full h-40 sm:h-48 md:h-56 overflow-hidden">
        <img 
          src={event.image} 
          alt={event.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-2 md:p-4">
        <h3 className="text-sm md:text-base font-semibold line-clamp-2">
          {event.name}
        </h3>
        <p className="text-xs md:text-sm text-gray-600 mt-1">
          {event.location}
        </p>
        <div className="mt-3 flex justify-between items-center">
          <span className="text-xs md:text-sm font-bold text-blue-600">
            Rp {event.price.toLocaleString()}
          </span>
          <button className="px-2 md:px-4 py-1 text-xs md:text-sm bg-blue-600 text-white rounded">
            Book
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Responsive Grid Breakdown
```
Mobile (sm < 640px):   1 column
Small Mobile (640px):  2 columns
Tablet (768px):        3 columns
Desktop (1024px+):     4 columns

Spacing:
Mobile:  gap-3, px-2
Tablet:  gap-4, px-4
Desktop: gap-6, px-6
```

---

## 4️⃣ HERO SECTION - RESPONSIVE HEIGHT

### Current Issue
- Static height not suitable for all devices
- Image not responsive
- Text overflow on mobile

### Solution

```typescript
// RESPONSIVE HERO SECTION

<section className="relative w-full h-40 sm:h-60 md:h-80 lg:h-96 overflow-hidden">
  {/* Background image */}
  <div className="absolute inset-0">
    <img 
      src="/hero-bg.jpg"
      alt="Hero"
      className="w-full h-full object-cover"
      priority
    />
    {/* Overlay */}
    <div className="absolute inset-0 bg-black/40" />
  </div>

  {/* Content - centered, responsive text size */}
  <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-4">
      Welcome to TREVINS
    </h1>
    <p className="text-xs sm:text-sm md:text-base text-white/90 max-w-2xl">
      Discover amazing experiences across Indonesia
    </p>
    <button className="mt-4 md:mt-6 px-4 md:px-8 py-2 md:py-3 bg-blue-600 text-white rounded-lg text-sm md:text-base hover:bg-blue-700">
      Explore Now
    </button>
  </div>
</section>
```

---

## 5️⃣ MODALS - RESPONSIVE WIDTH

### Current Issue
- Modal takes full screen on desktop
- Not suitable for small screens
- Overflow issues on mobile

### Solution

```typescript
// RESPONSIVE DIALOG/MODAL

import { Dialog, DialogContent } from '@/components/ui/dialog';

export function BookingModal({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Responsive content width */}
      <DialogContent className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto">
        <div className="space-y-4 p-2 md:p-4">
          {/* Modal content */}
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold">
            Complete Your Booking
          </h2>
          
          {/* Form fields - responsive */}
          <div className="space-y-3">
            <input 
              type="text"
              placeholder="Full Name"
              className="w-full px-3 py-2 text-sm md:text-base border rounded-lg"
            />
            <input 
              type="email"
              placeholder="Email"
              className="w-full px-3 py-2 text-sm md:text-base border rounded-lg"
            />
          </div>

          {/* Buttons - stack on mobile */}
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <button className="flex-1 px-4 py-2 bg-gray-200 rounded-lg">
              Cancel
            </button>
            <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">
              Confirm
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## ✅ TESTING CHECKLIST

### Mobile Testing (390px - iPhone 12)
```
[ ] Navbar: Logo visible, hamburger menu works
[ ] Sidebar: Hidden, not visible
[ ] Hero: Height appropriate, text readable
[ ] Cards: 1-2 column grid, responsive padding
[ ] Modals: Full-width with padding, buttons stack vertically
[ ] Bottom nav: Visible, accessible
[ ] No horizontal overflow
[ ] All touch targets ≥ 44px
```

### Tablet Testing (768px - iPad)
```
[ ] Sidebar: Visible as collapsible drawer or small
[ ] Navbar: All items visible
[ ] Cards: 2-3 column grid
[ ] Hero: Proper height
[ ] Modals: Medium width, buttons side-by-side
[ ] No layout shifts
```

### Desktop Testing (1024px+)
```
[ ] Sidebar: Fully expanded
[ ] Navbar: Complete with search
[ ] Cards: 3-4 column grid
[ ] Hero: Full height
[ ] Modals: Proper max-width
[ ] All features visible
```

---

## 🔗 RELATED RESOURCES

- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Mobile First Approach](https://tailwindcss.com/docs/screens#mobile-first)
- [Shadcn/UI Components](https://ui.shadcn.com/)
- [useIsMobile Hook](src/hooks/use-mobile.ts)

