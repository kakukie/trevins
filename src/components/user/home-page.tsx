'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  Facebook, 
  Instagram, 
  Twitter,
  Star,
  ArrowRight,
  Percent,
  BedDouble,
  Wifi,
  Car,
  Utensils,
  ChevronRight,
  Heart,
  Sparkles,
  Filter,
  User,
  MapPinned
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CategoryFilter, categories } from '@/components/shared/category-filter';
import { formatCurrency, cn } from '@/lib/utils';
import { useUiStore } from '@/store/ui-store';

interface HomePageProps {
  onEventClick: (eventId: string) => void;
  onBookNow: (eventId: string) => void;
  onAccommodationBookNow: (accommodationId: string) => void;
  onLoginClick: () => void;
}

interface Event {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category: string;
  images: string;
  address?: string;
  city?: string;
  rating: number;
  totalReviews: number;
  isFeatured: boolean;
  validFrom: string;
  validUntil?: string;
  tickets: Array<{
    id: string;
    name: string;
    price: number;
    discountPrice?: number;
  }>;
  _count?: {
    reviews: number;
  };
}

interface Accommodation {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: string;
  images: string;
  city?: string;
  rating: number;
  totalReviews: number;
  pricePerNight: number;
  discountPrice?: number;
  facilities?: string;
  vendor: {
    id: string;
    businessName: string;
  };
  _count?: {
    reviews: number;
  };
}

// Location tags for mobile header
const locationTags = ['Yogyakarta', 'Jakarta', 'Bali', 'Bandung'];

// Mock voucher data
const mockVouchers = [
  {
    id: '1',
    code: 'HEMAT20',
    title: 'Diskon 20% Tiket Pantai',
    description: 'Nikmati diskon 20% untuk semua tiket kategori Pantai',
    discount: 20,
    type: 'PERCENTAGE',
    minPurchase: 100000,
    validUntil: '2025-02-28',
    category: 'Pantai',
  },
  {
    id: '2',
    code: 'WEEKEND15',
    title: 'Special Weekend',
    description: 'Diskon 15% untuk booking di akhir pekan',
    discount: 15,
    type: 'PERCENTAGE',
    minPurchase: 200000,
    validUntil: '2025-03-15',
    category: 'Semua',
  },
  {
    id: '3',
    code: 'ADVENTURE25',
    title: 'Petualangan Seru',
    description: 'Diskon 25% untuk aktivitas Adventure',
    discount: 25,
    type: 'PERCENTAGE',
    minPurchase: 150000,
    validUntil: '2025-02-20',
    category: 'Adventure',
  },
  {
    id: '4',
    code: 'NEWUSER50K',
    title: 'Selamat Datang!',
    description: 'Potongan Rp 50.000 untuk pengguna baru',
    discount: 50000,
    type: 'FIXED',
    minPurchase: 100000,
    validUntil: '2025-12-31',
    category: 'Semua',
  },
];

export function HomePage({ onEventClick, onBookNow, onAccommodationBookNow, onLoginClick }: HomePageProps) {
  const searchQuery = useUiStore((s) => s.searchQuery);
  const setSearchQuery = useUiStore((s) => s.setSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState('semua');
  const [events, setEvents] = useState<Event[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [accommodationsLoading, setAccommodationsLoading] = useState(true);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showAllAccommodations, setShowAllAccommodations] = useState(false);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      setEventsLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory !== 'semua') {
          params.append('category', selectedCategory);
        }
        if (searchQuery) {
          params.append('search', searchQuery);
        }
        params.append('limit', showAllEvents ? '30' : '12');

        const response = await fetch(`/api/events?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setEvents(data.events || []);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchEvents();
  }, [selectedCategory, searchQuery, showAllEvents]);

  // Fetch accommodations
  useEffect(() => {
    const fetchAccommodations = async () => {
      setAccommodationsLoading(true);
      try {
        const response = await fetch('/api/accommodations?limit=4');
        if (response.ok) {
          const data = await response.json();
          setAccommodations(data || []);
        }
      } catch (error) {
        console.error('Error fetching accommodations:', error);
      } finally {
        setAccommodationsLoading(false);
      }
    };

    fetchAccommodations();
  }, []);

  // Get the lowest ticket price
  const getLowestPrice = (tickets: Event['tickets']) => {
    if (!tickets || tickets.length === 0) return 0;
    const prices = tickets.map(t => t.discountPrice || t.price);
    return Math.min(...prices);
  };

  // Parse images from JSON string
  const getEventImage = (images: string) => {
    try {
      const parsed = JSON.parse(images);
      return parsed[0] || '/images/placeholder-event.jpg';
    } catch {
      return images || '/images/placeholder-event.jpg';
    }
  };

  // Parse accommodation images
  const getAccommodationImage = (images: string) => {
    try {
      const parsed = JSON.parse(images);
      return parsed[0] || '/images/placeholder-accommodation.jpg';
    } catch {
      return images || '/images/placeholder-accommodation.jpg';
    }
  };

  // Parse facilities
  const getFacilities = (facilities?: string | null) => {
    if (!facilities) return [];
    try {
      return JSON.parse(facilities);
    } catch {
      return [];
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The search will trigger the useEffect above
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden max-w-[100vw] w-full">
      {/* Mobile Header - Blue Gradient with Location Tags */}
      <div className="md:hidden bg-gradient-to-br from-[#2196F3] via-[#1E88E5] to-[#1565C0] relative overflow-hidden w-full">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#FF9800]/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
        
        <div className="relative px-5 pt-6 pb-12">
          {/* Brand & User Greeting */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                <MapPinned className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-white text-xl font-black tracking-tighter">
                TREVINS
              </h1>
            </div>
            <button onClick={onLoginClick} className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
              <User className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-white text-2xl font-extrabold leading-tight">
              Eksplorasi Seru<br />
              <span className="text-[#FF9800] bg-white/10 px-2 rounded-lg">Tanpa Batas</span>
            </h2>
          </div>
          
          {/* Search Bar - Premium Floating */}
          <form onSubmit={handleSearch} className="relative z-10 shadow-2xl">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-1 shadow-inner border border-white/20">
              <div className="flex items-center px-4 py-3">
                <Search className="h-5 w-5 text-[#2196F3] shrink-0" />
                <Input
                  type="text"
                  placeholder="Cari Tiket Wisata, Hotel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 pl-3 pr-4 py-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent placeholder:text-gray-400 font-medium"
                />
              </div>
            </div>
          </form>

          {/* New: Quick Tags */}
          <div className="flex gap-2 mt-6 overflow-x-auto no-scrollbar pb-2">
            {['Pantai', 'Gunung', 'Kota', 'Budaya'].map((t) => (
              <button key={t} className="px-4 py-1.5 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full text-white text-[10px] font-bold whitespace-nowrap active:bg-[#FF9800] active:border-[#FF9800] transition-all">
                # {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Section - Desktop */}
      <section className="hidden md:block relative h-auto min-h-[60vh] lg:min-h-[70vh] overflow-hidden w-full">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero-bg.png"
            alt="Hero background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#2196F3]/90 via-[#2196F3]/70 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl lg:text-7xl font-black text-white mb-6 drop-shadow-2xl"
            >
              Jelajahi Dunia Bersama{' '}
              <span className="text-[#FF9800] relative">
                TREVINS
                <Sparkles className="absolute -top-6 -right-8 h-8 w-8 text-[#FF9800] animate-pulse" />
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-lg md:text-2xl text-white/95 mb-10 font-medium"
            >
              Temukan pengalaman tak terlupakan di destinasi impian Anda
            </motion.p>


            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
              <div className="flex bg-white rounded-xl shadow-xl overflow-hidden">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Cari wisata, aktivitas, atau destinasi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-0 pl-12 pr-4 py-6 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <Button
                  type="submit"
                  className="bg-[#FF9800] hover:bg-[#F57C00] px-8 rounded-none text-white font-semibold"
                >
                  Cari
                </Button>
              </div>
            </form>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-12 mt-10">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-white">500+</p>
                <p className="text-white/80 text-sm">Destinasi</p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-white">10K+</p>
                <p className="text-white/80 text-sm">Pengguna</p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-white">50+</p>
                <p className="text-white/80 text-sm">Vendor</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter Section - Mobile Icon Grid & Desktop Pills */}
      <section className="md:py-6 px-4 sm:px-6 lg:px-8 bg-white border-b">
        <div className="max-w-7xl mx-auto">
          {/* Mobile: Icon Grid */}
          <div className="md:hidden">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-4 pb-4">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 p-3 min-w-[80px] rounded-2xl transition-all duration-300',
                      selectedCategory === category.value
                        ? 'bg-[#2196F3] text-white shadow-lg scale-105'
                        : 'bg-gray-50 text-gray-600 active:bg-gray-100 hover:bg-gray-100'
                    )}
                  >
                    <div className={cn(
                        "p-2 rounded-xl transition-colors",
                        selectedCategory === category.value ? "bg-white/20" : "bg-white shadow-sm"
                    )}>
                        <span className="[&>svg]:h-6 [&>svg]:w-6">
                            {category.icon}
                        </span>
                    </div>
                    <span className="text-[11px] font-bold tracking-tight">{category.label}</span>
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="hidden" />
            </ScrollArea>
          </div>
          
          {/* Desktop: Pills */}
          <div className="hidden md:block">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Kategori Wisata</h2>
            </div>
            <CategoryFilter
              value={selectedCategory}
              onChange={setSelectedCategory}
              variant="pills"
            />
          </div>
        </div>
      </section>

      {/* Popular Events Section */}
      <section className="py-4 md:py-12 px-4 sm:px-6 lg:px-8" id="popular-events">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <h2 className="text-lg md:text-2xl lg:text-3xl font-bold text-gray-900">
                Wisata Populer
              </h2>
              <p className="hidden md:block text-gray-600 mt-1">
                Destinasi favorit pilihan traveler
              </p>
            </div>
            <Button
              variant="ghost"
              className="text-[#2196F3] hover:text-[#1976D2] gap-1 text-sm"
              onClick={() => setShowAllEvents((v) => !v)}
            >
              {showAllEvents ? 'Tutup' : 'Lihat Semua'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {eventsLoading ? (
            // Loading Skeleton
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <CardContent className="p-3 md:p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-5 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : events.length > 0 ? (
            <div>
              {/* Mobile Horizontal Scroll */}
              <div className="md:hidden">
                {(showAllEvents || !!searchQuery) ? (
                  <div className="grid grid-cols-2 gap-3">
                    {events.map((event) => (
                      <EventCardMobile
                        key={event.id}
                        event={event}
                        getImage={getEventImage}
                        getLowestPrice={getLowestPrice}
                        onClick={() => onEventClick(event.id)}
                        onBookNow={() => onBookNow(event.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <ScrollArea className="w-full whitespace-nowrap -mx-4 px-4">
                    <div className="flex gap-4 pb-6">
                      {events.slice(0, 8).map((event) => (
                        <div
                          key={event.id}
                          className="inline-block w-[240px] shrink-0"
                        >
                          <EventCardMobile
                            event={event}
                            getImage={getEventImage}
                            getLowestPrice={getLowestPrice}
                            onClick={() => onEventClick(event.id)}
                            onBookNow={() => onBookNow(event.id)}
                          />
                        </div>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" className="h-1.5 bg-gray-100" />
                  </ScrollArea>
                )}
              </div>

              {/* Desktop Grid */}
              <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {events.slice(0, showAllEvents ? events.length : 8).map((event) => (
                  <EventCardDesktop
                    key={event.id}
                    event={event}
                    getImage={getEventImage}
                    getLowestPrice={getLowestPrice}
                    onClick={() => onEventClick(event.id)}
                    onBookNow={() => onBookNow(event.id)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 md:py-12">
              <p className="text-gray-500 text-base md:text-lg">
                Tidak ada wisata ditemukan
              </p>
              <p className="text-gray-400 mt-2 text-sm md:text-base">
                Coba ubah filter kategori atau kata kunci pencarian
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Vouchers/Promotions Section */}
      <section className="py-4 md:py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#2196F3]/5 to-[#FF9800]/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <h2 className="text-lg md:text-2xl lg:text-3xl font-bold text-gray-900">
                Promo & Voucher Spesial
              </h2>
              <p className="hidden md:block text-gray-600 mt-1">
                Hemat lebih banyak dengan penawaran terbaik
              </p>
            </div>
          </div>

          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-3 md:gap-4 pb-4">
              {mockVouchers.map((voucher) => (
                <Card
                  key={voucher.id}
                  className="flex-shrink-0 w-[250px] md:w-80 overflow-hidden border-2 border-dashed border-[#FF9800]/30 hover:border-[#FF9800] transition-colors cursor-pointer group"
                >
                  <CardContent className="p-0">
                    <div className="flex">
                      {/* Discount Badge */}
                      <div className="flex flex-col items-center justify-center bg-[#FF9800] text-white p-3 md:p-4 min-w-[70px] md:min-w-[80px]">
                        <Percent className="h-4 w-4 md:h-5 md:w-5 mb-1" />
                        <span className="text-lg md:text-2xl font-bold">
                          {voucher.type === 'PERCENTAGE' ? `${voucher.discount}%` : `${voucher.discount / 1000}K`}
                        </span>
                      </div>

                      {/* Voucher Details */}
                      <div className="flex-1 p-3 md:p-4">
                        <Badge className="bg-[#2196F3]/10 text-[#2196F3] border-0 mb-2 text-xs">
                          {voucher.category}
                        </Badge>
                        <h3 className="font-semibold text-sm md:text-base text-gray-900 group-hover:text-[#2196F3] transition-colors line-clamp-1">
                          {voucher.title}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-500 mt-1 line-clamp-2">
                          {voucher.description}
                        </p>
                        <div className="flex items-center justify-between mt-2 md:mt-3">
                          <span className="text-xs text-gray-400">
                            Min. {formatCurrency(voucher.minPurchase)}
                          </span>
                          <Badge variant="outline" className="text-xs border-[#FF9800] text-[#FF9800]">
                            {voucher.code}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="h-2" />
          </ScrollArea>
        </div>
      </section>

      {/* Featured Accommodations Section */}
      <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8 bg-white" id="recommended-stays">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Penginapan Rekomendasi
              </h2>
              <p className="text-gray-600 mt-1">
                Tempat menginap nyaman untuk perjalanan Anda
              </p>
            </div>
            <Button
              variant="ghost"
              className="text-[#2196F3] hover:text-[#1976D2] gap-1"
              onClick={() => setShowAllAccommodations((v) => !v)}
            >
              {showAllAccommodations ? 'Tutup' : 'Lihat Semua'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {accommodationsLoading ? (
            <div className="flex gap-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 overflow-x-auto pb-4 no-scrollbar">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="flex-shrink-0 w-[280px] md:w-full overflow-hidden">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-6 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : accommodations.length > 0 ? (
            showAllAccommodations ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {accommodations.map((accommodation) => {
                  const facilities = getFacilities(accommodation.facilities);
                  const hasDiscount = accommodation.discountPrice && accommodation.discountPrice < accommodation.pricePerNight;
                  
                  return (
                    <Card
                      key={accommodation.id}
                      className="w-full group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Image
                          src={getAccommodationImage(accommodation.images)}
                          alt={accommodation.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <Badge className="absolute top-3 left-3 bg-white/90 text-gray-800 border-0">
                          {accommodation.type}
                        </Badge>
                        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-semibold text-gray-800">
                            {accommodation.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-[#2196F3] transition-colors">
                          {accommodation.name}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{accommodation.city || 'Indonesia'}</span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          {facilities.includes('wifi') && (
                            <div className="p-1.5 bg-gray-100 rounded">
                              <Wifi className="h-3.5 w-3.5 text-gray-600" />
                            </div>
                          )}
                          {facilities.includes('parkir') && (
                            <div className="p-1.5 bg-gray-100 rounded">
                              <Car className="h-3.5 w-3.5 text-gray-600" />
                            </div>
                          )}
                          {facilities.includes('makan') && (
                            <div className="p-1.5 bg-gray-100 rounded">
                              <Utensils className="h-3.5 w-3.5 text-gray-600" />
                            </div>
                          )}
                          <div className="p-1.5 bg-gray-100 rounded">
                            <BedDouble className="h-3.5 w-3.5 text-gray-600" />
                          </div>
                        </div>
                        <div className="flex items-end justify-between mt-4 pt-3 border-t border-gray-100">
                          <div>
                            {hasDiscount && (
                              <p className="text-xs text-gray-400 line-through">
                                {formatCurrency(accommodation.pricePerNight)}
                              </p>
                            )}
                            <p className="text-lg font-bold text-[#2196F3]">
                              {formatCurrency(hasDiscount ? accommodation.discountPrice! : accommodation.pricePerNight)}
                            </p>
                            <p className="text-xs text-gray-500">per malam</p>
                          </div>
                          <Button
                            size="sm"
                            className="bg-[#FF9800] hover:bg-[#F57C00] text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAccommodationBookNow(accommodation.id);
                            }}
                          >
                            Booking
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <ScrollArea className="w-full whitespace-nowrap md:whitespace-normal">
                <div className="flex gap-4 md:grid md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 md:gap-6 pb-4">
                  {accommodations.slice(0, 4).map((accommodation) => {
                    const facilities = getFacilities(accommodation.facilities);
                    const hasDiscount = accommodation.discountPrice && accommodation.discountPrice < accommodation.pricePerNight;

                    return (
                      <Card
                        key={accommodation.id}
                        className="flex-shrink-0 w-[280px] md:w-full group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <Image
                            src={getAccommodationImage(accommodation.images)}
                            alt={accommodation.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <Badge className="absolute top-3 left-3 bg-white/90 text-gray-800 border-0">
                            {accommodation.type}
                          </Badge>
                          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-semibold text-gray-800">
                              {accommodation.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        <CardContent className="p-4">
                          <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-[#2196F3] transition-colors">
                            {accommodation.name}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{accommodation.city || 'Indonesia'}</span>
                          </div>
                          <div className="flex gap-2 mt-3">
                            {facilities.includes('wifi') && (
                              <div className="p-1.5 bg-gray-100 rounded">
                                <Wifi className="h-3.5 w-3.5 text-gray-600" />
                              </div>
                            )}
                            {facilities.includes('parkir') && (
                              <div className="p-1.5 bg-gray-100 rounded">
                                <Car className="h-3.5 w-3.5 text-gray-600" />
                              </div>
                            )}
                            {facilities.includes('makan') && (
                              <div className="p-1.5 bg-gray-100 rounded">
                                <Utensils className="h-3.5 w-3.5 text-gray-600" />
                              </div>
                            )}
                            <div className="p-1.5 bg-gray-100 rounded">
                              <BedDouble className="h-3.5 w-3.5 text-gray-600" />
                            </div>
                          </div>
                          <div className="flex items-end justify-between mt-4 pt-3 border-t border-gray-100">
                            <div>
                              {hasDiscount && (
                                <p className="text-xs text-gray-400 line-through">
                                  {formatCurrency(accommodation.pricePerNight)}
                                </p>
                              )}
                              <p className="text-lg font-bold text-[#2196F3]">
                                {formatCurrency(hasDiscount ? accommodation.discountPrice! : accommodation.pricePerNight)}
                              </p>
                              <p className="text-xs text-gray-500">per malam</p>
                            </div>
                            <Button
                              size="sm"
                              className="bg-[#FF9800] hover:bg-[#F57C00] text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAccommodationBookNow(accommodation.id);
                              }}
                            >
                              Booking
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                <ScrollBar orientation="horizontal" className="md:hidden" />
              </ScrollArea>
            )
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                Tidak ada penginapan tersedia
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 md:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#2196F3] to-[#1976D2]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-4">
            Siap Memulai Petualangan Anda?
          </h2>
          <p className="text-white/90 text-sm md:text-lg mb-6 md:mb-8">
            Daftar sekarang dan dapatkan penawaran eksklusif untuk perjalanan pertama Anda
          </p>
          <Button
            size="lg"
            onClick={onLoginClick}
            className="bg-[#FF9800] hover:bg-[#F57C00] text-white px-6 md:px-8 text-base md:text-lg"
          >
            Daftar Gratis
          </Button>
        </div>
      </section>

      {/* Mobile Footer */}
      <footer className="md:hidden bg-white border-t py-6 px-4 mb-16">
        <div className="text-center">
          <h3 className="text-lg font-bold mb-2">
            <span className="text-[#2196F3]">TREVINS</span>
          </h3>
          <p className="text-gray-500 text-xs">
            Platform pemesanan tiket wisata terpercaya di Indonesia
          </p>
          <div className="border-t border-gray-100 mt-4 pt-4">
            <p className="text-gray-400 text-xs">
              &copy; {new Date().getFullYear()} Trevins. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Footer - Desktop Only */}
      <footer className="hidden md:block bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* About */}
            <div>
              <h3 className="text-xl font-bold mb-4">
                <span className="text-[#2196F3]">TREVINS</span>
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Platform pemesanan tiket wisata terpercaya di Indonesia. 
                Temukan berbagai destinasi menarik dengan harga terjangkau 
                dan proses booking yang mudah.
              </p>
              <div className="flex gap-4 mt-6">
                <a
                  href="#"
                  className="p-2 bg-gray-800 rounded-lg hover:bg-[#2196F3] transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="p-2 bg-gray-800 rounded-lg hover:bg-[#2196F3] transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="p-2 bg-gray-800 rounded-lg hover:bg-[#2196F3] transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Tautan Cepat</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Tentang Kami
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Cara Booking
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Syarat & Ketentuan
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Kebijakan Privasi
                  </a>
                </li>
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h4 className="font-semibold mb-4">Kategori</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pantai
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Gunung
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Taman Rekreasi
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Museum & Budaya
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Adventure
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4">Hubungi Kami</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-gray-400">
                  <MapPin className="h-5 w-5 shrink-0 text-[#FF9800]" />
                  <span className="text-sm">
                    Jl. Wisata No. 123, Jakarta Selatan, Indonesia 12345
                  </span>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <Phone className="h-5 w-5 shrink-0 text-[#FF9800]" />
                  <span className="text-sm">+62 21 1234 5678</span>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <Mail className="h-5 w-5 shrink-0 text-[#FF9800]" />
                  <span className="text-sm">info@trevins.id</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400 text-sm">
            <p>
              &copy; {new Date().getFullYear()} TREVINS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Mobile Event Card Component
function EventCardMobile({ 
  event, 
  getImage, 
  getLowestPrice, 
  onClick, 
  onBookNow 
}: { 
  event: Event; 
  getImage: (images: string) => string; 
  getLowestPrice: (tickets: Event['tickets']) => number;
  onClick: () => void;
  onBookNow: () => void;
}) {
  return (
    <Card 
      className="overflow-hidden bg-white border-0 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
      onClick={onClick}
    >
      <div className="relative aspect-[4/3]">
        <Image
          src={getImage(event.images)}
          alt={event.name}
          fill
          className="object-cover"
          sizes="170px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-2 left-2">
          <Badge className="bg-white/90 text-gray-800 border-0 text-[10px] px-2 py-0.5">
            {event.category}
          </Badge>
        </div>
        {event.isFeatured && (
          <Badge className="absolute top-2 right-2 bg-[#FF9800] text-white border-0 text-[10px] px-2 py-0.5">
            Populer
          </Badge>
        )}
        <div className="absolute bottom-2 left-2 right-2">
          <h3 className="font-semibold text-white text-sm line-clamp-2 drop-shadow-md">
            {event.name}
          </h3>
        </div>
      </div>
      <CardContent className="p-2">
        <div className="flex items-center gap-1 mb-1">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span className="text-[11px] font-medium text-gray-700">{event.rating.toFixed(1)}</span>
          <span className="text-[10px] text-gray-400">({event._count?.reviews || event.totalReviews})</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] text-gray-400">Mulai dari</p>
            <p className="font-bold text-[#2196F3] text-xs">
              {formatCurrency(getLowestPrice(event.tickets))}
            </p>
          </div>
          <Button
            size="sm"
            className="h-6 px-2 text-[9px] bg-[#2196F3] hover:bg-[#1976D2]"
            onClick={(e) => {
              e.stopPropagation();
              onBookNow();
            }}
          >
            Pesan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Desktop Event Card Component
function EventCardDesktop({ 
  event, 
  getImage, 
  getLowestPrice, 
  onClick, 
  onBookNow 
}: { 
  event: Event; 
  getImage: (images: string) => string; 
  getLowestPrice: (tickets: Event['tickets']) => number;
  onClick: () => void;
  onBookNow: () => void;
}) {
  return (
    <Card 
      className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={getImage(event.images)}
          alt={event.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        <Badge className="absolute top-3 left-3 bg-white/90 text-gray-800 border-0">
          {event.category}
        </Badge>
        
        {event.isFeatured && (
          <Badge className="absolute top-3 right-3 bg-[#FF9800] text-white border-0">
            Populer
          </Badge>
        )}

        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs font-semibold text-gray-800">
            {event.rating.toFixed(1)}
          </span>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-[#2196F3] transition-colors">
          {event.name}
        </h3>
        
        {event.address && (
          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{event.address}</span>
          </div>
        )}

        <div className="flex items-end justify-between mt-4 pt-3 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400">Mulai dari</p>
            <p className="text-lg font-bold text-[#FF9800]">
              {formatCurrency(getLowestPrice(event.tickets))}
            </p>
          </div>
          <Button
            size="sm"
            className="bg-[#2196F3] hover:bg-[#1976D2] text-white"
            onClick={(e) => {
              e.stopPropagation();
              onBookNow();
            }}
          >
            Pesan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default HomePage;
