'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  QrCode,
  Calendar,
  Clock,
  MapPin,
  Users,
  Copy,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CreditCard,
  Ticket,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate, formatShortDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'PAID' | 'CANCELLED' | 'EXPIRED' | 'USED';

export interface BookingCardProps {
  id: string;
  bookingCode: string;
  status: BookingStatus;
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  eventImage: string;
  eventLocation: string;
  eventDate: Date | string;
  ticketName: string;
  quantity: number;
  totalAmount: number;
  createdAt: Date | string;
  paymentDeadline?: Date | string;
  qrCode?: string;
  className?: string;
  onShowQR?: () => void;
  onCancel?: () => void;
}

const statusConfig: Record<
  BookingStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ReactNode;
  }
> = {
  PENDING: {
    label: 'Menunggu Pembayaran',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
  CONFIRMED: {
    label: 'Terkonfirmasi',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  PAID: {
    label: 'Sudah Dibayar',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: <CreditCard className="h-3.5 w-3.5" />,
  },
  CANCELLED: {
    label: 'Dibatalkan',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  EXPIRED: {
    label: 'Kedaluwarsa',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
  USED: {
    label: 'Sudah Digunakan',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: <Ticket className="h-3.5 w-3.5" />,
  },
};

export function BookingCard({
  id,
  bookingCode,
  status,
  eventSlug,
  eventTitle,
  eventImage,
  eventLocation,
  eventDate,
  ticketName,
  quantity,
  totalAmount,
  createdAt,
  paymentDeadline,
  qrCode,
  className,
  onShowQR,
  onCancel,
}: BookingCardProps) {
  const [copied, setCopied] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);

  const statusInfo = statusConfig[status];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(bookingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const eventDateObj = typeof eventDate === 'string' ? new Date(eventDate) : eventDate;
  const isEventPassed = eventDateObj < new Date();

  const canShowQR = (status === 'PAID' || status === 'CONFIRMED') && qrCode;
  const canCancel = status === 'PENDING' || status === 'CONFIRMED';

  return (
    <Card
      className={cn(
        'overflow-hidden border transition-all duration-200 hover:shadow-md',
        statusInfo.borderColor,
        statusInfo.bgColor,
        className
      )}
    >
      {/* Status Header */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-2 border-b',
          statusInfo.borderColor,
          statusInfo.bgColor
        )}
      >
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={cn(
              'gap-1 font-medium border-0',
              statusInfo.color,
              statusInfo.bgColor
            )}
          >
            {statusInfo.icon}
            {statusInfo.label}
          </Badge>
          {isEventPassed && status === 'PAID' && (
            <Badge variant="outline" className="text-xs">
              Event Selesai
            </Badge>
          )}
        </div>
        <span className="text-xs text-gray-500">
          {formatShortDate(createdAt)}
        </span>
      </div>

      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Event Image */}
          <div className="relative w-full sm:w-32 aspect-[4/3] sm:aspect-square shrink-0 overflow-hidden rounded-lg">
            <Image
              src={eventImage}
              alt={eventTitle}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 128px"
            />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            {/* Booking Code */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-500">Kode Booking:</span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-sm font-mono font-semibold text-[#2196F3] hover:text-[#1976D2]"
              >
                {bookingCode}
                {copied ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {/* Event Title */}
            <h3 
              className="font-semibold text-gray-900 text-lg mb-2 hover:text-[#2196F3] line-clamp-1 cursor-pointer"
              onClick={onShowQR}
            >
              {eventTitle}
            </h3>

            {/* Ticket Info */}
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <Ticket className="h-3.5 w-3.5 text-gray-400" />
                <span>{ticketName}</span>
                <span className="text-gray-400">•</span>
                <span>{quantity} tiket</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                <span>{formatDate(eventDate)}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                <span className="truncate">{eventLocation}</span>
              </div>
            </div>
          </div>

          {/* Price & Actions */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-200">
            <div className="text-right">
              <p className="text-xs text-gray-500">Total Pembayaran</p>
              <p className="text-xl font-bold text-[#2196F3]">
                {formatCurrency(totalAmount)}
              </p>
            </div>

            <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
              {canShowQR && (
                <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="bg-[#2196F3] hover:bg-[#1976D2] text-white gap-1 w-full sm:w-auto"
                    >
                      <QrCode className="h-4 w-4" />
                      Lihat QR
                    </Button>
                  </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-white shadow-xl border border-gray-200">
                  <DialogHeader>
                    <DialogTitle className="text-center">Kode QR Tiket</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col items-center py-4">
                    <div className="bg-white p-4 rounded-lg shadow-inner border border-gray-200">
                      <div className="w-48 h-48 bg-white flex items-center justify-center rounded-lg shadow-sm">
                        {qrCode ? (
                          <QRCodeCanvas value={qrCode} size={176} includeMargin fgColor="#0f172a" />
                        ) : (
                          <QrCode className="w-32 h-32 text-gray-400" />
                        )}
                      </div>
                    </div>
                      <p className="mt-4 text-sm text-gray-500 text-center">
                        Tunjukkan kode QR ini saat check-in
                      </p>
                      <p className="text-sm font-mono font-semibold text-[#2196F3] mt-2">
                        {bookingCode}
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {status === 'PENDING' && onShowQR && (
                <Button
                  size="sm"
                  className="bg-[#FF9800] hover:bg-[#F57C00] text-white w-full sm:w-auto"
                  onClick={onShowQR}
                >
                  Bayar Sekarang
                </Button>
              )}

              {canCancel && onCancel && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 w-full sm:w-auto"
                  onClick={onCancel}
                >
                  Batalkan
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Payment Deadline Warning */}
        {status === 'PENDING' && paymentDeadline && (
          <div className="mt-4 p-3 bg-amber-100 border border-amber-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-700">
              Batas pembayaran:{' '}
              <span className="font-semibold">
                {formatDate(paymentDeadline)}
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for list views
export interface BookingCardCompactProps {
  bookingCode: string;
  status: BookingStatus;
  eventTitle: string;
  eventImage: string;
  ticketName: string;
  quantity: number;
  totalAmount: number;
  eventDate: Date | string;
  className?: string;
}

export function BookingCardCompact({
  bookingCode,
  status,
  eventTitle,
  eventImage,
  ticketName,
  quantity,
  totalAmount,
  eventDate,
  className,
}: BookingCardCompactProps) {
  const statusInfo = statusConfig[status];

  return (
    <Card className={cn('overflow-hidden border hover:shadow-sm transition-shadow', className)}>
      <div className="flex gap-3 p-3">
        <div className="relative w-16 h-16 shrink-0 overflow-hidden rounded-lg">
          <Image
            src={eventImage}
            alt={eventTitle}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-mono text-[#2196F3]">{bookingCode}</span>
            <Badge
              variant="secondary"
              className={cn(
                'text-[10px] px-1.5 border-0',
                statusInfo.color,
                statusInfo.bgColor
              )}
            >
              {statusInfo.label}
            </Badge>
          </div>
          <h4 className="font-medium text-sm text-gray-900 line-clamp-1">
            {eventTitle}
          </h4>
          <p className="text-xs text-gray-500 line-clamp-1">
            {ticketName} • {quantity} tiket
          </p>
          <p className="text-sm font-semibold text-[#2196F3] mt-1">
            {formatCurrency(totalAmount)}
          </p>
        </div>
      </div>
    </Card>
  );
}

export default BookingCard;
