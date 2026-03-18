'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Loader2,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Minus,
  Plus,
  CreditCard,
  Wallet,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Ticket,
  User,
  Mail,
  Phone,
  MessageSquare,
  Tag,
  Copy,
  Calendar,
  MapPin,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

// Types matching database schema
interface TicketType {
  id: string;
  name: string;
  description?: string;
  type: string; // ADULT, CHILD, SENIOR
  price: number;
  discountPrice?: number | null;
  quota: number;
  sold: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

interface EventData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  images: string; // JSON string
  address?: string;
  city?: string;
  validFrom: string;
  validUntil: string;
  vendor?: {
    id: string;
    businessName: string;
  };
  tickets: TicketType[];
}

interface VendorPaymentMethodPublic {
  id: string;
  vendorId: string;
  type: string;
  label: string;
  provider?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  qrString?: string | null;
  qrImageUrl?: string | null;
  instructions?: string | null;
}

// Schema for visitor information
const visitorSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  phone: z.string().min(10, 'Nomor HP tidak valid'),
  notes: z.string().optional(),
});

type VisitorFormValues = z.infer<typeof visitorSchema>;

// Payment methods
const paymentMethods = [
  {
    id: 'TRANSFER',
    label: 'Transfer Bank',
    icon: CreditCard,
    description: 'BCA, Mandiri, BNI, BRI',
  },
  {
    id: 'E_WALLET',
    label: 'E-Wallet',
    icon: Wallet,
    description: 'GoPay, OVO, DANA, ShopeePay',
  },
  {
    id: 'CREDIT_CARD',
    label: 'Kartu Kredit',
    icon: Smartphone,
    description: 'Visa, Mastercard, JCB',
  },
];

// Steps configuration
const steps = [
  { id: 1, title: 'Pilih Tiket', description: 'Pilih jenis dan jumlah tiket' },
  { id: 2, title: 'Data Pengunjung', description: 'Isi informasi pengunjung' },
  { id: 3, title: 'Pembayaran', description: 'Pilih metode pembayaran' },
];

// Ticket type labels
const ticketTypeLabels: Record<string, string> = {
  ADULT: 'Dewasa',
  CHILD: 'Anak-anak',
  SENIOR: 'Lansia',
};

interface BookingModalProps {
  isOpen: boolean;
  eventId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function BookingModal({ isOpen, eventId, onClose, onSuccess }: BookingModalProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<EventData | null>(null);
  const [vendorPaymentMethods, setVendorPaymentMethods] = useState<VendorPaymentMethodPublic[]>([]);
  const [vendorPaymentMethodId, setVendorPaymentMethodId] = useState<string>('');
  
  // Ticket selection state
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<string>('TRANSFER');
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Success state
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingCode, setBookingCode] = useState('');
  const [bookingId, setBookingId] = useState('');

  // Visitor form
  const visitorForm = useForm<VisitorFormValues>({
    resolver: zodResolver(visitorSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      notes: '',
    },
  });

  // Fetch event data
  useEffect(() => {
    if (isOpen && eventId) {
      fetchEventData();
    }
  }, [isOpen, eventId]);

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      visitorForm.setValue('name', user.name || '');
      visitorForm.setValue('email', user.email || '');
      visitorForm.setValue('phone', user.phone || '');
    }
  }, [user, visitorForm]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setSelectedTickets({});
      setDiscountCode('');
      setDiscountApplied(false);
      setDiscountAmount(0);
      setTermsAccepted(false);
      setBookingSuccess(false);
      setBookingCode('');
      setBookingId('');
      setError(null);
      setVendorPaymentMethods([]);
      setVendorPaymentMethodId('');
      visitorForm.reset();
    }
  }, [isOpen]);

  const fetchEventData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) {
        throw new Error('Gagal memuat data event');
      }
      const data = await response.json();
      setEvent(data);
      
      // Initialize ticket selection
      const initialTickets: Record<string, number> = {};
      data.tickets?.forEach((ticket: TicketType) => {
        initialTickets[ticket.id] = 0;
      });
      setSelectedTickets(initialTickets);

      // Fetch vendor payment methods (public)
      const vendorId = data?.vendor?.id;
      if (vendorId) {
        const methodsRes = await fetch(`/api/vendors/${vendorId}/payment-methods`);
        if (methodsRes.ok) {
          const methods = await methodsRes.json();
          setVendorPaymentMethods(methods || []);
          if (Array.isArray(methods) && methods.length > 0) {
            setVendorPaymentMethodId(methods[0].id);
          }
        }
      } else {
        setVendorPaymentMethods([]);
        setVendorPaymentMethodId('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  // Parse images from JSON string
  const getEventImage = () => {
    if (!event?.images) return '/images/placeholder-event.jpg';
    try {
      const images = JSON.parse(event.images);
      return images[0] || '/images/placeholder-event.jpg';
    } catch {
      return '/images/placeholder-event.jpg';
    }
  };

  // Ticket quantity handlers
  const incrementTicket = (ticketId: string) => {
    const ticket = event?.tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    
    const availableQuota = ticket.quota - ticket.sold;
    const currentQty = selectedTickets[ticketId] || 0;
    
    if (currentQty < availableQuota) {
      setSelectedTickets(prev => ({
        ...prev,
        [ticketId]: currentQty + 1,
      }));
    }
  };

  const decrementTicket = (ticketId: string) => {
    setSelectedTickets(prev => ({
      ...prev,
      [ticketId]: Math.max(0, (prev[ticketId] || 0) - 1),
    }));
  };

  // Calculate totals
  const calculateSubtotal = () => {
    if (!event) return 0;
    return event.tickets.reduce((total, ticket) => {
      const quantity = selectedTickets[ticket.id] || 0;
      const price = ticket.discountPrice || ticket.price;
      return total + (price * quantity);
    }, 0);
  };

  const calculateTotal = () => {
    return Math.max(0, calculateSubtotal() - discountAmount);
  };

  const getTotalTickets = () => {
    return Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  };

  // Validate discount code
  const handleApplyDiscount = () => {
    if (!discountCode.trim()) return;
    
    // Mock discount validation
    const mockDiscounts: Record<string, number> = {
      'HEMAT20': 20000,
      'DISKON50': 50000,
      'WEEKEND15': 15000,
    };

    if (mockDiscounts[discountCode.toUpperCase()]) {
      setDiscountAmount(mockDiscounts[discountCode.toUpperCase()]);
      setDiscountApplied(true);
      setError(null);
    } else {
      setError('Kode diskon tidak valid');
      setDiscountApplied(false);
      setDiscountAmount(0);
    }
  };

  // Navigation handlers
  const canProceedToStep2 = () => {
    return getTotalTickets() > 0;
  };

  const canProceedToStep3 = () => {
    return visitorForm.formState.isValid;
  };

  const canSubmit = () => {
    return termsAccepted && calculateTotal() > 0;
  };

  const handleNext = async () => {
    setError(null);
    
    if (currentStep === 1) {
      if (!canProceedToStep2()) {
        setError('Pilih minimal 1 tiket untuk melanjutkan');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const isValid = await visitorForm.trigger();
      if (!isValid) {
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Submit booking
  const handleSubmit = async () => {
    if (!canSubmit() || !event || !isAuthenticated) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const visitorData = visitorForm.getValues();
      const token = useAuthStore.getState().token;
      
      // Create booking items
      const items = Object.entries(selectedTickets)
        .filter(([_, qty]) => qty > 0)
        .map(([ticketId, quantity]) => ({ ticketId, quantity }));

      const selectedVendorMethod = vendorPaymentMethods.find((m) => m.id === vendorPaymentMethodId);
      const resolvedPaymentMethod = selectedVendorMethod?.type || paymentMethod;

      // Create booking
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId: event.id,
          items,
          notes: visitorData.notes,
          paymentMethod: resolvedPaymentMethod,
          vendorPaymentMethodId: selectedVendorMethod?.id || null,
          visitorName: visitorData.name,
          visitorEmail: visitorData.email,
          visitorPhone: visitorData.phone,
          discountCode: discountApplied ? discountCode : null,
          totalAmount: calculateTotal(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal membuat booking');
      }

      setBookingCode(result.bookingCode);
      setBookingId(result.id);
      setBookingSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy booking code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(bookingCode);
  };

  // Render step content
  const renderStepContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4 py-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      );
    }

    if (bookingSuccess) {
      return (
        <div className="flex flex-col items-center py-6 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Booking Berhasil!
          </h3>
          <p className="text-gray-500 mb-6">
            Tiket Anda telah berhasil dipesan. Silakan lakukan pembayaran.
          </p>

          {/* QR Code Placeholder */}
          <div className="bg-white p-4 rounded-lg shadow-inner border mb-4">
            <div className="w-40 h-40 bg-white flex items-center justify-center rounded border border-gray-200">
              <QRCodeCanvas value={bookingCode || bookingId || 'TREVINS'} size={140} includeMargin fgColor="#0f172a" />
            </div>
          </div>

          {/* Booking Code */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-gray-500">Kode Booking:</span>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 text-lg font-mono font-bold text-blue-500 hover:text-blue-600"
            >
              {bookingCode}
              <Copy className="h-4 w-4" />
            </button>
          </div>

          {/* Booking Info */}
          <div className="w-full bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-center gap-3 mb-3">
              {event && (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                  <Image
                    src={getEventImage()}
                    alt={event.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">{event?.name}</p>
                <p className="text-sm text-gray-500">{getTotalTickets()} tiket</p>
              </div>
            </div>
            <Separator className="my-3" />
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Pembayaran</span>
              <span className="text-xl font-bold text-blue-500">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
          </div>

          {/* Payment Info */}
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Silakan lakukan pembayaran dalam waktu <strong>24 jam</strong> untuk menghindari pembatalan otomatis.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Tutup
            </Button>
            <Button
              className="flex-1 bg-blue-500 hover:bg-blue-600"
              onClick={() => {
                onSuccess();
                onClose();
              }}
            >
              Lihat Booking Saya
            </Button>
          </div>

          {(() => {
            const selectedVendorMethod = vendorPaymentMethods.find((m) => m.id === vendorPaymentMethodId);
            if (!selectedVendorMethod) return null;
            return (
              <div className="w-full text-left space-y-3">
                <div className="p-4 rounded-lg border border-gray-200 bg-white">
                  <p className="text-sm text-gray-500">Metode Pembayaran</p>
                  <p className="font-semibold text-gray-900">{selectedVendorMethod.label}</p>
                  <p className="text-sm text-gray-600">{selectedVendorMethod.type}</p>
                </div>

                {(selectedVendorMethod.accountNumber || selectedVendorMethod.accountName || selectedVendorMethod.provider) && (
                  <div className="p-4 rounded-lg border border-gray-200 bg-white">
                    <p className="text-sm font-medium text-gray-900 mb-2">Detail Pembayaran</p>
                    {selectedVendorMethod.provider && <p className="text-sm text-gray-700">Provider: {selectedVendorMethod.provider}</p>}
                    {selectedVendorMethod.accountName && <p className="text-sm text-gray-700">Nama: {selectedVendorMethod.accountName}</p>}
                    {selectedVendorMethod.accountNumber && <p className="text-sm text-gray-700">Nomor: {selectedVendorMethod.accountNumber}</p>}
                  </div>
                )}

                {selectedVendorMethod.qrImageUrl && (
                  <div className="p-4 rounded-lg border border-gray-200 bg-white">
                    <p className="text-sm font-medium text-gray-900 mb-3">QR Pembayaran</p>
                    <div className="flex justify-center">
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <Image
                          src={selectedVendorMethod.qrImageUrl}
                          alt="QR Pembayaran"
                          width={220}
                          height={220}
                          className="rounded"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {!selectedVendorMethod.qrImageUrl && selectedVendorMethod.qrString && (
                  <div className="p-4 rounded-lg border border-gray-200 bg-white">
                    <p className="text-sm font-medium text-gray-900 mb-3">QR Pembayaran</p>
                    <div className="flex justify-center">
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <QRCodeCanvas value={selectedVendorMethod.qrString} size={180} includeMargin fgColor="#0f172a" />
                      </div>
                    </div>
                  </div>
                )}

                {selectedVendorMethod.instructions && (
                  <div className="p-4 rounded-lg border border-gray-200 bg-white">
                    <p className="text-sm font-medium text-gray-900 mb-2">Instruksi</p>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{selectedVendorMethod.instructions}</p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return renderTicketSelection();
      case 2:
        return renderVisitorInfo();
      case 3:
        return renderPayment();
      default:
        return null;
    }
  };

  // Step 1: Ticket Selection
  const renderTicketSelection = () => {
    if (!event) return null;

    return (
      <div className="space-y-4">
        {/* Event Info */}
        <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
            <Image
              src={getEventImage()}
              alt={event.name}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 line-clamp-1">{event.name}</h4>
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{event.address || event.city || 'Indonesia'}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(event.validFrom)}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Ticket List (use DialogContent scroll to avoid nested scroll issues on mobile) */}
        <div className="space-y-3">
          {event.tickets.map((ticket) => {
              const hasDiscount = ticket.discountPrice && ticket.discountPrice < ticket.price;
              const discountPercentage = hasDiscount
                ? Math.round(((ticket.price - ticket.discountPrice!) / ticket.price) * 100)
                : 0;
              const availableQuota = ticket.quota - ticket.sold;
              const isSoldOut = availableQuota <= 0;
              const quantity = selectedTickets[ticket.id] || 0;

              return (
                <div
                  key={ticket.id}
                  className={cn(
                    'border rounded-lg p-4 transition-all',
                    isSoldOut ? 'opacity-60 bg-gray-50' : 'hover:border-blue-300'
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-blue-500" />
                        <h5 className="font-semibold text-gray-900">{ticket.name}</h5>
                        <Badge variant="secondary" className="text-xs">
                          {ticketTypeLabels[ticket.type] || ticket.type}
                        </Badge>
                      </div>
                      {ticket.description && (
                        <p className="text-sm text-gray-500 mt-1">{ticket.description}</p>
                      )}
                    </div>
                    {hasDiscount && !isSoldOut && (
                      <Badge className="bg-red-500 text-white border-0">
                        -{discountPercentage}%
                      </Badge>
                    )}
                  </div>

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      {hasDiscount && (
                        <p className="text-xs text-gray-400 line-through">
                          {formatCurrency(ticket.price)}
                        </p>
                      )}
                      <p className="text-lg font-bold text-blue-500">
                        {formatCurrency(hasDiscount ? ticket.discountPrice! : ticket.price)}
                      </p>
                      <p className="text-xs text-gray-500">per tiket</p>
                    </div>

                    {/* Quantity Selector */}
                    {isSoldOut ? (
                      <Badge variant="secondary" className="bg-red-100 text-red-700">
                        Habis
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-9 w-9 shrink-0"
                          onClick={() => decrementTicket(ticket.id)}
                          disabled={quantity === 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-semibold tabular-nums">
                          {quantity}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-9 w-9 shrink-0"
                          onClick={() => incrementTicket(ticket.id)}
                          disabled={quantity >= availableQuota}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Quota Info */}
                  {availableQuota > 0 && !isSoldOut && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Tersedia: {availableQuota}</span>
                        {availableQuota <= 10 && (
                          <span className="text-orange-500 font-medium">
                            Tersisa sedikit!
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
          })}
        </div>

      </div>
    );
  };

  // Step 2: Visitor Information
  const renderVisitorInfo = () => {
    return (
      <div className="space-y-4">
        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="visitor-name">Nama Lengkap</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="visitor-name"
                placeholder="Masukkan nama lengkap"
                className="pl-10"
                {...visitorForm.register('name')}
              />
            </div>
            {visitorForm.formState.errors.name && (
              <p className="text-sm text-red-500">
                {visitorForm.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="visitor-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="visitor-email"
                type="email"
                placeholder="nama@email.com"
                className="pl-10"
                {...visitorForm.register('email')}
              />
            </div>
            {visitorForm.formState.errors.email && (
              <p className="text-sm text-red-500">
                {visitorForm.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="visitor-phone">Nomor HP</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="visitor-phone"
                type="tel"
                placeholder="08xxxxxxxxxx"
                className="pl-10"
                {...visitorForm.register('phone')}
              />
            </div>
            {visitorForm.formState.errors.phone && (
              <p className="text-sm text-red-500">
                {visitorForm.formState.errors.phone.message}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="visitor-notes">
              Catatan <span className="text-gray-400">(opsional)</span>
            </Label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Textarea
                id="visitor-notes"
                placeholder="Catatan tambahan untuk vendor..."
                className="pl-10 min-h-[80px]"
                {...visitorForm.register('notes')}
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mt-4">
          <h5 className="font-medium text-gray-700 mb-3">Ringkasan Pesanan</h5>
          {event?.tickets.map((ticket) => {
            const quantity = selectedTickets[ticket.id] || 0;
            if (quantity === 0) return null;
            const price = ticket.discountPrice || ticket.price;
            return (
              <div key={ticket.id} className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">
                  {ticket.name} x {quantity}
                </span>
                <span className="font-medium">{formatCurrency(price * quantity)}</span>
              </div>
            );
          })}
          <Separator className="my-3" />
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Total</span>
            <span className="text-lg font-bold text-blue-500">
              {formatCurrency(calculateSubtotal())}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Step 3: Payment
  const renderPayment = () => {
    const selectedVendorMethod = vendorPaymentMethods.find((m) => m.id === vendorPaymentMethodId);
    return (
      <div className="space-y-4">
        {/* Payment Method Selection */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Pilih Metode Pembayaran</Label>
          {vendorPaymentMethods.length > 0 ? (
            <RadioGroup
              value={vendorPaymentMethodId}
              onValueChange={setVendorPaymentMethodId}
              className="space-y-2"
            >
              {vendorPaymentMethods.map((m) => (
                <Label
                  key={m.id}
                  htmlFor={m.id}
                  className={cn(
                    'flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all',
                    vendorPaymentMethodId === m.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:border-gray-300'
                  )}
                >
                  <RadioGroupItem value={m.id} id={m.id} />
                  <CreditCard className="h-5 w-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{m.label}</p>
                    <p className="text-sm text-gray-500">{m.type}{m.provider ? ` · ${m.provider}` : ''}</p>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          ) : (
            <RadioGroup
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              className="space-y-2"
            >
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <Label
                    key={method.id}
                    htmlFor={method.id}
                    className={cn(
                      'flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all',
                      paymentMethod === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:border-gray-300'
                    )}
                  >
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Icon className="h-5 w-5 text-gray-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{method.label}</p>
                      <p className="text-sm text-gray-500">{method.description}</p>
                    </div>
                  </Label>
                );
              })}
            </RadioGroup>
          )}
        </div>

        {selectedVendorMethod && (
          <div className="p-4 rounded-lg border border-gray-200 bg-white">
            <p className="text-sm font-medium text-gray-900 mb-2">Detail</p>
            {selectedVendorMethod.provider && <p className="text-sm text-gray-700">Provider: {selectedVendorMethod.provider}</p>}
            {selectedVendorMethod.accountName && <p className="text-sm text-gray-700">Nama: {selectedVendorMethod.accountName}</p>}
            {selectedVendorMethod.accountNumber && <p className="text-sm text-gray-700">Nomor: {selectedVendorMethod.accountNumber}</p>}
            {selectedVendorMethod.instructions && (
              <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{selectedVendorMethod.instructions}</p>
            )}
          </div>
        )}

        <Separator />

        {/* Discount Code */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">Kode Diskon</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Masukkan kode diskon"
                className="pl-10"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                disabled={discountApplied}
              />
            </div>
            <Button
              type="button"
              variant={discountApplied ? 'secondary' : 'outline'}
              onClick={handleApplyDiscount}
              disabled={discountApplied || !discountCode.trim()}
            >
              {discountApplied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Terpakai
                </>
              ) : (
                'Terapkan'
              )}
            </Button>
          </div>
          {discountApplied && (
            <p className="text-sm text-green-600">
              Diskon {formatCurrency(discountAmount)} berhasil diterapkan!
            </p>
          )}
        </div>

        <Separator />

        {/* Price Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatCurrency(calculateSubtotal())}</span>
          </div>
          {discountApplied && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Diskon</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          <Separator className="my-2" />
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Total Pembayaran</span>
            <span className="text-2xl font-bold text-blue-500">
              {formatCurrency(calculateTotal())}
            </span>
          </div>
        </div>

        {/* Terms Agreement */}
        <div className="flex items-start space-x-2 pt-2">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
          />
          <Label htmlFor="terms" className="text-sm font-normal cursor-pointer leading-tight">
            Saya menyetujui{' '}
            <button
              type="button"
              className="text-blue-500 hover:text-blue-600 hover:underline"
              onClick={(e) => {
                e.preventDefault();
                alert('Syarat dan ketentuan akan ditampilkan di sini');
              }}
            >
              syarat dan ketentuan
            </button>{' '}
            yang berlaku
          </Label>
        </div>

        {/* Payment Warning */}
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            Pembayaran harus diselesaikan dalam waktu 24 jam setelah booking dibuat.
          </AlertDescription>
        </Alert>
      </div>
    );
  };

  // Progress indicator
  const renderProgressSteps = () => {
    if (bookingSuccess) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                    currentStep >= step.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  )}
                >
                  {currentStep > step.id ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="hidden sm:block mt-2 text-center">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-400">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2',
                    currentStep > step.id ? 'bg-blue-500' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Footer buttons
  const renderFooter = () => {
    if (bookingSuccess) return null;

    return (
      <div className="sticky bottom-0 -mx-6 px-6 pb-6 pt-4 bg-white border-t">
        {currentStep === 1 && getTotalTickets() > 0 && (
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">
              Total ({getTotalTickets()} tiket)
            </p>
            <p className="text-base font-bold text-blue-600">
              {formatCurrency(calculateSubtotal())}
            </p>
          </div>
        )}

        <div className="flex gap-3">
        {currentStep > 1 && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handleBack}
            disabled={isSubmitting}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Kembali
          </Button>
        )}
        {currentStep < 3 ? (
          <Button
            type="button"
            className="flex-1 bg-blue-500 hover:bg-blue-600"
            onClick={handleNext}
          >
            Lanjutkan
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            type="button"
            className="flex-1 bg-blue-500 hover:bg-blue-600"
            onClick={handleSubmit}
            disabled={!canSubmit() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              'Bayar Sekarang'
            )}
          </Button>
        )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {bookingSuccess ? 'Booking Berhasil' : 'Pesan Tiket'}
          </DialogTitle>
          {!bookingSuccess && (
            <DialogDescription>
              Lengkapi langkah-langkah berikut untuk memesan tiket
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Progress Steps */}
        {renderProgressSteps()}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <div className={bookingSuccess ? '' : 'pb-28'}>
          {renderStepContent()}
        </div>

        {/* Footer */}
        {renderFooter()}
      </DialogContent>
    </Dialog>
  );
}

export default BookingModal;
