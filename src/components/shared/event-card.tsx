'use client';

import Image from 'next/image';
import { MapPin, Star, Clock, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export interface EventCardProps {
  id: string;
  slug: string;
  title: string;
  description?: string;
  image: string;
  category: string;
  rating?: number;
  totalReviews?: number;
  price: number;
  discountedPrice?: number;
  location: string;
  city?: string;
  startDate: Date | string;
  endDate?: Date | string;
  availableSlots?: number;
  isFeatured?: boolean;
  isNew?: boolean;
  className?: string;
  onClick?: () => void;
  onBookNow?: () => void;
}

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

export function EventCard({
  id,
  slug,
  title,
  description,
  image,
  category,
  rating,
  totalReviews,
  price,
  discountedPrice,
  location,
  city,
  startDate,
  endDate,
  availableSlots,
  isFeatured,
  isNew,
  className,
  onClick,
  onBookNow,
}: EventCardProps) {
  const hasDiscount = discountedPrice && discountedPrice < price;
  const discountPercentage = hasDiscount
    ? Math.round(((price - discountedPrice!) / price) * 100)
    : 0;

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBookNow) {
      onBookNow();
    }
  };

  return (
    <Card
      className={cn(
        'group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer bg-white',
        className
      )}
      onClick={handleClick}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <Badge
            variant="secondary"
            className={cn(
              'border font-medium shadow-sm',
              categoryColors[category] || categoryColors.Lainnya
            )}
          >
            {category}
          </Badge>
          <div className="flex gap-1">
            {isNew && (
              <Badge className="bg-[#2196F3] text-white border-0 shadow-sm">
                Baru
              </Badge>
            )}
            {isFeatured && (
              <Badge className="bg-[#FF9800] text-white border-0 shadow-sm">
                Populer
              </Badge>
            )}
          </div>
        </div>

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute bottom-3 left-3">
            <Badge className="bg-red-500 text-white border-0 shadow-sm font-semibold">
              -{discountPercentage}%
            </Badge>
          </div>
        )}

        {/* Rating */}
        {rating !== undefined && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 shadow-sm backdrop-blur-sm">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-gray-800">
              {rating.toFixed(1)}
            </span>
            {totalReviews !== undefined && (
              <span className="text-xs text-gray-500">
                ({totalReviews})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-[#2196F3] transition-colors">
          {title}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{location}{city ? `, ${city}` : ''}</span>
        </div>

        {/* Date */}
        <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {formatDate(startDate)}
            {endDate && ` - ${formatDate(endDate)}`}
          </span>
        </div>

        {/* Available Slots */}
        {availableSlots !== undefined && availableSlots <= 10 && (
          <div className="flex items-center gap-1 text-sm text-red-500 mb-3">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium">
              Tersisa {availableSlots} slot!
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-end justify-between mt-auto pt-2 border-t border-gray-100">
          <div>
            {hasDiscount && (
              <p className="text-xs text-gray-400 line-through">
                {formatCurrency(price)}
              </p>
            )}
            <p className="text-lg font-bold text-[#2196F3]">
              {formatCurrency(hasDiscount ? discountedPrice! : price)}
            </p>
            <p className="text-xs text-gray-500">per orang</p>
          </div>
          <Button
            size="sm"
            className="bg-[#FF9800] hover:bg-[#F57C00] text-white"
            onClick={handleBookNow}
          >
            Lihat Detail
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default EventCard;
