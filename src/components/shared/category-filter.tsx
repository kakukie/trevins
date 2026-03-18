'use client';

import { useState, useRef, useEffect } from 'react';
import {
  LayoutGrid,
  Waves,
  Mountain,
  Gamepad2,
  Landmark,
  TreePine,
  Building2,
  Compass,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface Category {
  value: string;
  label: string;
  icon: React.ReactNode;
}

export const categories: Category[] = [
  { value: 'semua', label: 'Semua', icon: <LayoutGrid className="h-5 w-5" /> },
  { value: 'pantai', label: 'Pantai', icon: <Waves className="h-5 w-5" /> },
  { value: 'gunung', label: 'Gunung', icon: <Mountain className="h-5 w-5" /> },
  { value: 'permainan', label: 'Permainan', icon: <Gamepad2 className="h-5 w-5" /> },
  { value: 'budaya', label: 'Budaya', icon: <Landmark className="h-5 w-5" /> },
  { value: 'taman', label: 'Taman', icon: <TreePine className="h-5 w-5" /> },
  { value: 'museum', label: 'Museum', icon: <Building2 className="h-5 w-5" /> },
  { value: 'adventure', label: 'Adventure', icon: <Compass className="h-5 w-5" /> },
];

interface CategoryFilterProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  variant?: 'default' | 'pills' | 'cards';
}

export function CategoryFilter({
  value = 'semua',
  onChange,
  className,
  variant = 'pills',
}: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        scrollEl.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (variant === 'cards') {
    return (
      <div className={cn('grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2', className)}>
        {categories.map((category) => (
          <button
            key={category.value}
            onClick={() => onChange?.(category.value)}
            className={cn(
              'flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-200',
              value === category.value
                ? 'border-[#2196F3] bg-[#2196F3]/10 text-[#2196F3]'
                : 'border-gray-200 bg-white text-gray-600 hover:border-[#2196F3] hover:text-[#2196F3]'
            )}
          >
            {category.icon}
            <span className="text-xs font-medium">{category.label}</span>
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'default') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {categories.map((category) => (
          <Button
            key={category.value}
            variant={value === category.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange?.(category.value)}
            className={cn(
              'gap-1.5 transition-all',
              value === category.value
                ? 'bg-[#2196F3] hover:bg-[#1976D2] text-white'
                : 'text-gray-600 hover:text-[#2196F3] hover:border-[#2196F3]'
            )}
          >
            {category.icon}
            {category.label}
          </Button>
        ))}
      </div>
    );
  }

  // Pills variant (default)
  return (
    <div className={cn('relative', className)}>
      {/* Left Scroll Button - Desktop only */}
      {canScrollLeft && (
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white shadow-md border"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Categories */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div ref={scrollRef} className="flex gap-1.5 md:gap-2 pb-2">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => onChange?.(category.value)}
              className={cn(
                'inline-flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full border-2 font-medium text-xs md:text-sm transition-all duration-200 whitespace-nowrap',
                value === category.value
                  ? 'border-[#2196F3] bg-[#2196F3] text-white shadow-md'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-[#2196F3] hover:bg-[#2196F3]/5 hover:text-[#2196F3]'
              )}
            >
              <span className="[&>svg]:h-4 [&>svg]:w-4 md:[&>svg]:h-5 md:[&>svg]:w-5">
                {category.icon}
              </span>
              {category.label}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="h-1" />
      </ScrollArea>

      {/* Right Scroll Button - Desktop only */}
      {canScrollRight && (
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white shadow-md border"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// Export a simpler version for dropdown/select usage
export const categoryOptions = categories.map(({ value, label }) => ({
  value,
  label,
}));

export default CategoryFilter;
