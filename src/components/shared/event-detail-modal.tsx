'use client';

import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import Image from 'next/image';
import {
  MapPin,
  Star,
  Calendar,
  Clock,
  Minus,
  Plus,
  Loader2,
  Users,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate, getInitials, cn } from '@/lib/utils';

// Types based on Prisma schema
interface Ticket {
  id: string;
  name: string;
  description?: string;
  type: string; // ADULT, CHILD, SENIOR
  price: number;
  discountPrice?: number;
  quota: number;
  sold: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface Vendor {
  id: string;
  businessName: string;
  description?: string;
  logo?: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface EventDetail {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  images: string; // JSON string of image URLs
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  rating: number;
  totalReviews: number;
  totalSales: number;
  isActive: boolean;
  isFeatured: boolean;
  validFrom: string;
  validUntil: string;
  vendor: Vendor;
  tickets: Ticket[];
  reviews: Review[];
  _count?: {
    reviews: number;
    tickets: number;
  };
}

interface SelectedTicket {
  ticketId: string;
  quantity: number;
}

// Category color mapping
const categoryColors: Record<string, string> = {
  Pantai: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  Gunung: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Permainan: 'bg-purple-100 text-purple-700 border-purple-200',
  Budaya: 'bg-amber-100 text-amber-700 border-amber-200',
  Taman: 'bg-green-100 text-green-700 border-green-200',
  Museum: 'bg-slate-100 text-slate-700 border-slate-200',
  Adventure: 'bg-orange-100 text-orange-700 border-orange-200',
  Lainnya: 'bg-gray-100 text-gray-700 border-gray-200',
};

// Ticket type labels
const ticketTypeLabels: Record<string, string> = {
  ADULT: 'Dewasa',
  CHILD: 'Anak-anak',
  SENIOR: 'Lansia',
};

// Ticket type colors
const ticketTypeColors: Record<string, string> = {
  ADULT: 'bg-blue-100 text-blue-700',
  CHILD: 'bg-green-100 text-green-700',
  SENIOR: 'bg-purple-100 text-purple-700',
};

interface EventDetailModalProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  onBookNow: (eventId: string) => void;
}

export function EventDetailModal({
  eventId,
  isOpen,
  onClose,
  onBookNow,
}: EventDetailModalProps) {
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<SelectedTicket[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch event details
  const fetchEventDetails = useCallback(async () => {
    if (!eventId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) {
        throw new Error('Gagal memuat detail event');
      }
      const data = await response.json();
      setEvent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (isOpen) {
      fetchEventDetails();
      setSelectedTickets([]);
      setCurrentImageIndex(0);
    }
  }, [isOpen, fetchEventDetails]);

  // Parse images from JSON string
  const images = event?.images ? JSON.parse(event.images) : [];
  const hasMultipleImages = images.length > 1;

  // Calculate total price
  const totalPrice = selectedTickets.reduce((total, selected) => {
    const ticket = event?.tickets.find((t) => t.id === selected.ticketId);
    if (!ticket) return total;
    const price = ticket.discountPrice ?? ticket.price;
    return total + price * selected.quantity;
  }, 0);

  // Calculate total quantity
  const totalQuantity = selectedTickets.reduce(
    (total, selected) => total + selected.quantity,
    0
  );

  // Update ticket quantity
  const updateTicketQuantity = (ticketId: string, delta: number) => {
    setSelectedTickets((prev) => {
      const existing = prev.find((t) => t.ticketId === ticketId);
      const ticket = event?.tickets.find((t) => t.id === ticketId);

      if (!ticket) return prev;

      if (existing) {
        const newQuantity = existing.quantity + delta;
        if (newQuantity <= 0) {
          return prev.filter((t) => t.ticketId !== ticketId);
        }
        // Check quota
        const availableQuota = ticket.quota - ticket.sold;
        if (newQuantity > availableQuota) {
          return prev;
        }
        return prev.map((t) =>
          t.ticketId === ticketId ? { ...t, quantity: newQuantity } : t
        );
      } else if (delta > 0) {
        // Check quota
        const availableQuota = ticket.quota - ticket.sold;
        if (availableQuota > 0) {
          return [...prev, { ticketId, quantity: 1 }];
        }
      }
      return prev;
    });
  };

  // Get current quantity for a ticket
  const getTicketQuantity = (ticketId: string) => {
    return selectedTickets.find((t) => t.ticketId === ticketId)?.quantity ?? 0;
  };

  // Handle book now
  const handleBookNow = () => {
    if (totalQuantity > 0) {
      onBookNow(eventId);
    }
  };

  // Image carousel navigation
  const goToPreviousImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const goToNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  // Render star rating
  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const stars: React.ReactElement[] = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={cn(
            size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
            i < fullStars
              ? 'fill-amber-400 text-amber-400'
              : i === fullStars && hasHalfStar
              ? 'fill-amber-400/50 text-amber-400'
              : 'text-gray-300'
          )}
        />
      );
    }
    return stars;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        {isLoading ? (
          // Loading skeleton
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/2">
                <Skeleton className="w-full aspect-[4/3] rounded-lg" />
              </div>
              <div className="md:w-1/2 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          </div>
        ) : error ? (
          // Error state
          <div className="p-6 text-center">
            <p className="text-red-500">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={fetchEventDetails}
            >
              Coba Lagi
            </Button>
          </div>
        ) : event ? (
          <>
            {/* Header - Image Carousel */}
            <div className="relative aspect-[16/9] md:aspect-[2/1] w-full bg-gray-100">
              {images.length > 0 ? (
                <>
                  <Image
                    src={images[currentImageIndex]}
                    alt={event.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 896px"
                    priority
                  />
                  {/* Image navigation overlay */}
                  {hasMultipleImages && (
                    <>
                      <button
                        onClick={goToPreviousImage}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={goToNextImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      {/* Image dots indicator */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((_: string, index: number) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={cn(
                              'w-2 h-2 rounded-full transition-colors',
                              index === currentImageIndex
                                ? 'bg-white'
                                : 'bg-white/50 hover:bg-white/70'
                            )}
                          />
                        ))}
                      </div>
                    </>
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-200">
                  <span className="text-gray-400">Tidak ada gambar</span>
                </div>
              )}

              {/* Category badge */}
              <div className="absolute top-4 left-4">
                <Badge
                  variant="secondary"
                  className={cn(
                    'border font-medium shadow-sm',
                    categoryColors[event.category] || categoryColors.Lainnya
                  )}
                >
                  {event.category}
                </Badge>
              </div>

              {/* Featured badge */}
              {event.isFeatured && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-[#FF9800] text-white border-0 shadow-sm">
                    Populer
                  </Badge>
                </div>
              )}
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 max-h-[calc(90vh-300px)]">
              <div className="p-6">
                {/* Title and Rating */}
                <div className="flex flex-col gap-2 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {event.name}
                  </h2>
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Rating */}
                    <div className="flex items-center gap-1">
                      {renderStars(event.rating, 'md')}
                      <span className="text-sm font-semibold text-gray-700 ml-1">
                        {event.rating.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({event.totalReviews} ulasan)
                      </span>
                    </div>
                    {/* Total sales */}
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>{event.totalSales} terjual</span>
                    </div>
                  </div>
                </div>

                {/* Location and Date */}
                <div className="flex flex-col gap-2 mb-4">
                  {event.address && (
                    <div className="flex items-start gap-2 text-gray-600">
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-[#2196F3]" />
                      <span>
                        {event.address}
                        {event.city && `, ${event.city}`}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4 shrink-0 text-[#2196F3]" />
                    <span>
                      Berlaku: {formatDate(event.validFrom)} -{' '}
                      {formatDate(event.validUntil)}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {event.description && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Deskripsi
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                      {event.description}
                    </p>
                  </div>
                )}

                {/* Vendor Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage
                        src={event.vendor.logo || event.vendor.user.avatar}
                        alt={event.vendor.businessName}
                      />
                      <AvatarFallback className="bg-[#2196F3] text-white">
                        {getInitials(event.vendor.businessName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {event.vendor.businessName}
                      </p>
                      <p className="text-sm text-gray-500">Penyedia Event</p>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Tickets Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Pilih Tiket
                  </h3>
                  {event.tickets.length > 0 ? (
                    <div className="space-y-3">
                      {event.tickets.map((ticket) => {
                        const availableQuota = ticket.quota - ticket.sold;
                        const isSoldOut = availableQuota <= 0;
                        const currentQuantity = getTicketQuantity(ticket.id);
                        const hasDiscount =
                          ticket.discountPrice &&
                          ticket.discountPrice < ticket.price;
                        const displayPrice = hasDiscount
                          ? ticket.discountPrice!
                          : ticket.price;

                        return (
                          <div
                            key={ticket.id}
                            className={cn(
                              'p-4 rounded-lg border transition-colors',
                              isSoldOut
                                ? 'bg-gray-50 border-gray-200 opacity-60'
                                : currentQuantity > 0
                                ? 'bg-blue-50 border-[#2196F3]'
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            )}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-gray-900">
                                    {ticket.name}
                                  </h4>
                                  <Badge
                                    variant="secondary"
                                    className={cn(
                                      'text-xs',
                                      ticketTypeColors[ticket.type] ||
                                        'bg-gray-100 text-gray-700'
                                    )}
                                  >
                                    {ticketTypeLabels[ticket.type] || ticket.type}
                                  </Badge>
                                </div>
                                {ticket.description && (
                                  <p className="text-sm text-gray-500 mb-2">
                                    {ticket.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mb-2">
                                  {hasDiscount && (
                                    <span className="text-sm text-gray-400 line-through">
                                      {formatCurrency(ticket.price)}
                                    </span>
                                  )}
                                  <span className="text-lg font-bold text-[#FF9800]">
                                    {formatCurrency(displayPrice)}
                                  </span>
                                  {hasDiscount && (
                                    <Badge className="bg-red-500 text-white text-xs">
                                      {Math.round(
                                        ((ticket.price - ticket.discountPrice!) /
                                          ticket.price) *
                                          100
                                      )}
                                      % OFF
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>
                                    Berlaku: {formatDate(ticket.validFrom)} -{' '}
                                    {formatDate(ticket.validUntil)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm mt-1">
                                  <span
                                    className={cn(
                                      isSoldOut
                                        ? 'text-red-500'
                                        : availableQuota <= 10
                                        ? 'text-orange-500'
                                        : 'text-green-600'
                                    )}
                                  >
                                    {isSoldOut
                                      ? 'Habis'
                                      : `Tersisa ${availableQuota} tiket`}
                                  </span>
                                </div>
                              </div>

                              {/* Quantity Selector */}
                              {!isSoldOut && (
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-full"
                                    onClick={() =>
                                      updateTicketQuantity(ticket.id, -1)
                                    }
                                    disabled={currentQuantity <= 0}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="w-8 text-center font-semibold">
                                    {currentQuantity}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-full"
                                    onClick={() =>
                                      updateTicketQuantity(ticket.id, 1)
                                    }
                                    disabled={currentQuantity >= availableQuota}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      Tidak ada tiket tersedia
                    </p>
                  )}
                </div>

                <Separator className="my-6" />

                {/* Reviews Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="h-5 w-5 text-[#2196F3]" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Ulasan ({event.reviews.length})
                    </h3>
                  </div>

                  {event.reviews.length > 0 ? (
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                      {event.reviews.map((review) => (
                        <div
                          key={review.id}
                          className="p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={review.user.avatar}
                                alt={review.user.name}
                              />
                              <AvatarFallback className="bg-[#2196F3] text-white text-sm">
                                {getInitials(review.user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-semibold text-gray-900">
                                  {review.user.name}
                                </p>
                                <span className="text-xs text-gray-500">
                                  {formatDate(review.createdAt)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 mb-2">
                                {renderStars(review.rating)}
                              </div>
                              {review.comment && (
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  {review.comment}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      Belum ada ulasan
                    </p>
                  )}
                </div>
              </div>
            </ScrollArea>

            {/* Footer - Book Now Button */}
            <div className="border-t bg-white p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Harga</p>
                  <p className="text-2xl font-bold text-[#FF9800]">
                    {formatCurrency(totalPrice)}
                  </p>
                  {totalQuantity > 0 && (
                    <p className="text-xs text-gray-500">
                      {totalQuantity} tiket
                    </p>
                  )}
                </div>
                <Button
                  size="lg"
                  className="bg-[#2196F3] hover:bg-[#1976D2] text-white px-8"
                  disabled={totalQuantity === 0}
                  onClick={handleBookNow}
                >
                  {totalQuantity === 0 ? 'Pilih Tiket' : 'Pesan Sekarang'}
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export default EventDetailModal;
