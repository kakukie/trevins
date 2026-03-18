'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { QRCodeCanvas } from 'qrcode.react';
import { AlertCircle, Calendar, CheckCircle2, CreditCard, Loader2, MapPin, Minus, Plus } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

type Room = {
  id: string;
  name: string;
  description?: string | null;
  pricePerNight: number;
  discountPrice?: number | null;
  capacity: number;
};

type Accommodation = {
  id: string;
  name: string;
  images: string;
  address?: string | null;
  city?: string | null;
  vendor: { id: string; businessName: string };
  rooms: Room[];
};

type VendorPaymentMethod = {
  id: string;
  type: string;
  label: string;
  provider?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  qrString?: string | null;
  qrImageUrl?: string | null;
  instructions?: string | null;
};

function parseImages(images: string): string[] {
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateInputValue(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function AccommodationBookingModal({
  isOpen,
  accommodationId,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  accommodationId: string;
  onClose: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [accommodation, setAccommodation] = useState<Accommodation | null>(null);
  const [vendorMethods, setVendorMethods] = useState<VendorPaymentMethod[]>([]);
  const [vendorMethodId, setVendorMethodId] = useState('');

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [roomId, setRoomId] = useState('');

  const today = useMemo(() => new Date(), []);
  const [checkIn, setCheckIn] = useState(toDateInputValue(addDays(today, 1)));
  const [checkOut, setCheckOut] = useState(toDateInputValue(addDays(today, 2)));
  const [guests, setGuests] = useState(1);

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const selectedRoom = useMemo(() => {
    return accommodation?.rooms.find((r) => r.id === roomId) || null;
  }, [accommodation, roomId]);

  const nights = useMemo(() => {
    const a = new Date(checkIn);
    const b = new Date(checkOut);
    const ms = b.getTime() - a.getTime();
    if (!Number.isFinite(ms) || ms <= 0) return 1;
    return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  }, [checkIn, checkOut]);

  const total = useMemo(() => {
    if (!selectedRoom) return 0;
    const nightly = selectedRoom.discountPrice && selectedRoom.discountPrice > 0 ? selectedRoom.discountPrice : selectedRoom.pricePerNight;
    return nightly * nights;
  }, [nights, selectedRoom]);

  useEffect(() => {
    if (!isOpen) return;
    if (!accommodationId) return;

    const run = async () => {
      setLoading(true);
      setError(null);
      setAccommodation(null);
      setVendorMethods([]);
      setVendorMethodId('');
      setStep(1);

      try {
        const res = await fetch(`/api/accommodations/${accommodationId}`);
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setError(data?.error || 'Gagal memuat penginapan');
          setLoading(false);
          return;
        }
        const data = (await res.json()) as Accommodation;
        setAccommodation(data);
        setRoomId(data.rooms?.[0]?.id || '');

        // Fetch vendor payment methods (public endpoint, but subscription-guarded)
        const methodsRes = await fetch(`/api/vendors/${data.vendor.id}/payment-methods`);
        if (methodsRes.ok) {
          const methods = (await methodsRes.json()) as VendorPaymentMethod[];
          setVendorMethods(Array.isArray(methods) ? methods : []);
          setVendorMethodId(methods?.[0]?.id || '');
        }
      } catch (e) {
        console.error(e);
        setError('Terjadi kesalahan saat memuat data');
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [accommodationId, isOpen]);

  const cover = useMemo(() => {
    const imgs = accommodation ? parseImages(accommodation.images) : [];
    return imgs[0] || '/images/placeholder-accommodation.jpg';
  }, [accommodation]);

  const next = () => {
    setError(null);
    if (step === 1) {
      if (!roomId) return setError('Pilih kamar');
      if (!checkIn || !checkOut) return setError('Pilih tanggal');
      if (new Date(checkOut) <= new Date(checkIn)) return setError('Check-out harus setelah check-in');
      return setStep(2);
    }
    if (step === 2) {
      if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim()) return setError('Lengkapi data tamu');
      return setStep(3);
    }
  };

  const back = () => {
    setError(null);
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const submit = async () => {
    if (!token) return;
    if (!accommodation) return;
    if (!selectedRoom) return;
    if (!termsAccepted) return setError('Anda harus menyetujui syarat dan ketentuan');

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/accommodation-bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accommodationId: accommodation.id,
          roomId: selectedRoom.id,
          checkIn,
          checkOut,
          guests,
          guestName,
          guestPhone,
          guestEmail,
          notes: notes || null,
          paymentMethod: vendorMethods.find((m) => m.id === vendorMethodId)?.type || 'TRANSFER',
          vendorPaymentMethodId: vendorMethodId || null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || 'Gagal membuat booking');
        setSubmitting(false);
        return;
      }
      onSuccess();
    } catch (e) {
      console.error(e);
      setError('Terjadi kesalahan saat menyimpan booking');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep1 = () => {
    if (!accommodation) return null;
    return (
      <div className="space-y-4">
        <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="h-16 w-16 rounded-lg overflow-hidden shrink-0 bg-white border border-gray-200">
            <img src={cover} alt={accommodation.name} className="h-full w-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 line-clamp-1">{accommodation.name}</h4>
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{accommodation.address || accommodation.city || 'Indonesia'}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="h-3.5 w-3.5" />
              <span>Vendor: {accommodation.vendor.businessName}</span>
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Check-in</Label>
            <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Check-out</Label>
            <Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Tamu</p>
            <p className="text-xs text-gray-600">Jumlah tamu mengacu kapasitas kamar.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" size="icon" variant="outline" className="h-9 w-9" onClick={() => setGuests((g) => Math.max(1, g - 1))}>
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-10 text-center font-semibold tabular-nums">{guests}</span>
            <Button type="button" size="icon" variant="outline" className="h-9 w-9" onClick={() => setGuests((g) => Math.min(20, g + 1))}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold">Pilih Kamar</Label>
          <RadioGroup value={roomId} onValueChange={setRoomId} className="space-y-2">
            {accommodation.rooms.map((r) => {
              const nightly = r.discountPrice && r.discountPrice > 0 ? r.discountPrice : r.pricePerNight;
              return (
                <Label
                  key={r.id}
                  htmlFor={r.id}
                  className={cn(
                    'flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-all',
                    roomId === r.id ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
                  )}
                >
                  <RadioGroupItem value={r.id} id={r.id} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{r.name}</p>
                    {r.description && <p className="text-sm text-gray-500 line-clamp-2">{r.description}</p>}
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">Kapasitas {r.capacity}</Badge>
                      <span className="text-sm font-semibold text-blue-600">{formatCurrency(nightly)} / malam</span>
                      {r.discountPrice && r.discountPrice > 0 && (
                        <span className="text-xs text-gray-400 line-through">{formatCurrency(r.pricePerNight)}</span>
                      )}
                    </div>
                  </div>
                </Label>
              );
            })}
          </RadioGroup>
        </div>
      </div>
    );
  };

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Nama Tamu *</Label>
          <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Nomor HP *</Label>
          <Input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="08..." />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Email *</Label>
        <Input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="nama@email.com" />
      </div>
      <div className="grid gap-2">
        <Label>Catatan (opsional)</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm font-semibold text-gray-800 mb-2">Ringkasan</p>
        <div className="text-sm text-gray-700 space-y-1">
          <div className="flex justify-between"><span>Check-in</span><span>{formatDate(checkIn)}</span></div>
          <div className="flex justify-between"><span>Check-out</span><span>{formatDate(checkOut)}</span></div>
          <div className="flex justify-between"><span>Malam</span><span>{nights}</span></div>
          <div className="flex justify-between"><span>Total</span><span className="font-bold text-blue-600">{formatCurrency(total)}</span></div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const selected = vendorMethods.find((m) => m.id === vendorMethodId);
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          <Label className="text-base font-semibold">Pilih Metode Pembayaran</Label>
          {vendorMethods.length === 0 ? (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                Vendor belum menambahkan metode pembayaran. Anda tetap bisa membuat booking, tetapi pembayaran perlu dikonfirmasi manual.
              </AlertDescription>
            </Alert>
          ) : (
            <RadioGroup value={vendorMethodId} onValueChange={setVendorMethodId} className="space-y-2">
              {vendorMethods.map((m) => (
                <Label
                  key={m.id}
                  htmlFor={m.id}
                  className={cn(
                    'flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all',
                    vendorMethodId === m.id ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
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
          )}
        </div>

        {selected && (
          <div className="p-4 rounded-lg border border-gray-200 bg-white space-y-2">
            <p className="text-sm font-semibold text-gray-900">Detail Pembayaran</p>
            {selected.accountName && <p className="text-sm text-gray-700">Nama: {selected.accountName}</p>}
            {selected.accountNumber && <p className="text-sm text-gray-700">Nomor: {selected.accountNumber}</p>}
            {selected.instructions && <p className="text-sm text-gray-700 whitespace-pre-line">{selected.instructions}</p>}
          </div>
        )}

        {selected?.qrImageUrl && (
          <div className="p-4 rounded-lg border border-gray-200 bg-white">
            <p className="text-sm font-medium text-gray-900 mb-3">QR Pembayaran</p>
            <div className="flex justify-center">
              <img src={selected.qrImageUrl} alt="QR Pembayaran" className="h-56 w-56 object-contain border border-gray-200 rounded bg-white" />
            </div>
          </div>
        )}
        {!selected?.qrImageUrl && selected?.qrString && (
          <div className="p-4 rounded-lg border border-gray-200 bg-white">
            <p className="text-sm font-medium text-gray-900 mb-3">QR Pembayaran</p>
            <div className="flex justify-center">
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <QRCodeCanvas value={selected.qrString} size={180} includeMargin fgColor="#0f172a" />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-start space-x-2 pt-2">
          <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(v) => setTermsAccepted(v as boolean)} />
          <Label htmlFor="terms" className="text-sm font-normal cursor-pointer leading-tight">
            Saya menyetujui syarat dan ketentuan yang berlaku
          </Label>
        </div>

        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            Pembayaran harus diselesaikan dalam waktu 24 jam setelah booking dibuat.
          </AlertDescription>
        </Alert>
      </div>
    );
  };

  const renderStep = () => {
    if (loading) return <div className="text-sm text-gray-500">Memuat...</div>;
    if (step === 1) return renderStep1();
    if (step === 2) return renderStep2();
    return renderStep3();
  };

  const canSubmit = step === 3 && termsAccepted && !submitting;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Booking Penginapan</DialogTitle>
          <DialogDescription>
            Lengkapi langkah berikut untuk booking.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center flex-1">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold', step >= n ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500')}>
                  {step > n ? <CheckCircle2 className="h-5 w-5" /> : n}
                </div>
                {n < 3 && <div className={cn('flex-1 h-0.5 mx-2', step > n ? 'bg-blue-500' : 'bg-gray-200')} />}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="pb-28">{renderStep()}</div>

        <DialogFooter>
          <div className="sticky bottom-0 -mx-6 px-6 pb-6 pt-4 bg-white border-t w-full">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-600">Total ({nights} malam)</p>
              <p className="text-base font-bold text-blue-600">{formatCurrency(total)}</p>
            </div>
            <div className="flex gap-3">
              {step > 1 && (
                <Button type="button" variant="outline" className="flex-1" onClick={back} disabled={submitting}>
                  Kembali
                </Button>
              )}
              {step < 3 ? (
                <Button type="button" className="flex-1 bg-blue-500 hover:bg-blue-600" onClick={next}>
                  Lanjutkan
                </Button>
              ) : (
                <Button type="button" className="flex-1 bg-blue-500 hover:bg-blue-600" onClick={submit} disabled={!canSubmit}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Memproses...
                    </>
                  ) : (
                    'Buat Booking'
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AccommodationBookingModal;

