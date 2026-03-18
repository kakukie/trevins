'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock, Tag, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatShortDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export interface TicketCardProps {
  id: string;
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  eventImage: string;
  name: string;
  description?: string;
  price: number;
  discountedPrice?: number;
  validFrom: Date | string;
  validUntil: Date | string;
  quota?: number;
  sold?: number;
  isActive?: boolean;
  className?: string;
}

export function TicketCard({
  id,
  eventId,
  eventSlug,
  eventTitle,
  eventImage,
  name,
  description,
  price,
  discountedPrice,
  validFrom,
  validUntil,
  quota,
  sold,
  isActive = true,
  className,
}: TicketCardProps) {
  const hasDiscount = discountedPrice && discountedPrice < price;
  const discountPercentage = hasDiscount
    ? Math.round(((price - discountedPrice!) / price) * 100)
    : 0;

  const validFromDate = typeof validFrom === 'string' ? new Date(validFrom) : validFrom;
  const validUntilDate = typeof validUntil === 'string' ? new Date(validUntil) : validUntil;
  const isExpired = validUntilDate < new Date();

  const soldPercentage = quota && sold ? Math.round((sold / quota) * 100) : 0;
  const isAlmostSoldOut = soldPercentage >= 80 && soldPercentage < 100;
  const isSoldOut = quota !== undefined && sold !== undefined && sold >= quota;

  return (
    <Card
      className={cn(
        'group overflow-hidden border border-gray-200 hover:border-[#2196F3] hover:shadow-lg transition-all duration-300 bg-white',
        (isExpired || isSoldOut || !isActive) && 'opacity-75',
        className
      )}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="relative sm:w-48 md:w-56 aspect-[4/3] sm:aspect-auto shrink-0 overflow-hidden">
          <Image
            src={eventImage}
            alt={eventTitle}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 224px"
          />

          {/* Discount Badge */}
          {hasDiscount && !isSoldOut && !isExpired && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-red-500 text-white border-0 shadow-sm font-semibold">
                -{discountPercentage}%
              </Badge>
            </div>
          )}

          {/* Status Badges */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {isExpired && (
              <Badge variant="secondary" className="bg-gray-500 text-white border-0">
                Expired
              </Badge>
            )}
            {isSoldOut && !isExpired && (
              <Badge variant="secondary" className="bg-red-500 text-white border-0">
                Habis
              </Badge>
            )}
            {isAlmostSoldOut && !isSoldOut && !isExpired && (
              <Badge variant="secondary" className="bg-orange-500 text-white border-0 animate-pulse">
                Tersisa Sedikit
              </Badge>
            )}
          </div>

          {/* Ticket Icon Overlay */}
          <div className="absolute bottom-2 right-2 bg-white/90 rounded-full p-1.5 shadow-sm backdrop-blur-sm">
            <Tag className="h-4 w-4 text-[#2196F3]" />
          </div>
        </div>

        {/* Content */}
        <CardContent className="flex-1 p-4 flex flex-col">
          {/* Event Title */}
          <Link
            href={`/event/${eventSlug}`}
            className="text-sm text-gray-500 hover:text-[#2196F3] line-clamp-1 mb-1"
          >
            {eventTitle}
          </Link>

          {/* Ticket Name */}
          <h3 className="font-semibold text-gray-900 text-lg mb-1 group-hover:text-[#2196F3] transition-colors">
            {name}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">
              {description}
            </p>
          )}

          {/* Validity Period */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[#FF9800]" />
              <span>
                {formatShortDate(validFromDate)} - {formatShortDate(validUntilDate)}
              </span>
            </div>
          </div>

          {/* Quota Progress */}
          {quota !== undefined && sold !== undefined && !isSoldOut && !isExpired && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Terjual: {sold}</span>
                <span>Tersedia: {quota - sold}</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    isAlmostSoldOut ? 'bg-orange-500' : 'bg-[#2196F3]'
                  )}
                  style={{ width: `${soldPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Price and Action */}
          <div className="mt-auto flex items-end justify-between pt-3 border-t border-gray-100">
            <div>
              {hasDiscount && (
                <p className="text-xs text-gray-400 line-through">
                  {formatCurrency(price)}
                </p>
              )}
              <p className="text-xl font-bold text-[#2196F3]">
                {formatCurrency(hasDiscount ? discountedPrice! : price)}
              </p>
              <p className="text-xs text-gray-500">per tiket</p>
            </div>

            <Button
              asChild
              disabled={isSoldOut || isExpired || !isActive}
              className={cn(
                'gap-1',
                isSoldOut || isExpired || !isActive
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-[#FF9800] hover:bg-[#F57C00] text-white'
              )}
            >
              <Link href={`/event/${eventSlug}?ticket=${id}`}>
                {isSoldOut ? 'Habis' : isExpired ? 'Expired' : 'Pesan Sekarang'}
                {!isSoldOut && !isExpired && <ArrowRight className="h-4 w-4" />}
              </Link>
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

// Compact version for list views
export interface TicketCardCompactProps {
  id: string;
  eventSlug: string;
  eventTitle: string;
  eventImage: string;
  name: string;
  price: number;
  discountedPrice?: number;
  validUntil: Date | string;
  className?: string;
}

export function TicketCardCompact({
  id,
  eventSlug,
  eventTitle,
  eventImage,
  name,
  price,
  discountedPrice,
  validUntil,
  className,
}: TicketCardCompactProps) {
  const hasDiscount = discountedPrice && discountedPrice < price;
  const discountPercentage = hasDiscount
    ? Math.round(((price - discountedPrice!) / price) * 100)
    : 0;
  const validUntilDate = typeof validUntil === 'string' ? new Date(validUntil) : validUntil;
  const isExpired = validUntilDate < new Date();

  return (
    <Link href={`/event/${eventSlug}?ticket=${id}`}>
      <Card
        className={cn(
          'group flex overflow-hidden border border-gray-200 hover:border-[#2196F3] hover:shadow-md transition-all duration-200 bg-white',
          isExpired && 'opacity-60',
          className
        )}
      >
        {/* Image */}
        <div className="relative w-20 h-20 shrink-0 overflow-hidden">
          <Image
            src={eventImage}
            alt={eventTitle}
            fill
            className="object-cover"
            sizes="80px"
          />
          {hasDiscount && !isExpired && (
            <Badge className="absolute top-1 left-1 bg-red-500 text-white border-0 text-[10px] px-1">
              -{discountPercentage}%
            </Badge>
          )}
        </div>

        {/* Content */}
        <CardContent className="flex-1 p-3 flex flex-col justify-center">
          <p className="text-xs text-gray-500 line-clamp-1">{eventTitle}</p>
          <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
            {name}
          </h4>
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm font-bold text-[#2196F3]">
              {formatCurrency(hasDiscount ? discountedPrice! : price)}
            </p>
            {isExpired && (
              <Badge variant="secondary" className="text-[10px] bg-gray-200">
                Expired
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default TicketCard;
