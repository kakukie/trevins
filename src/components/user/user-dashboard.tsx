'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CreditCard,
  Ticket,
  QrCode,
  Download,
  Share2,
  Settings,
  Bell,
  Lock,
  User,
  Trash2,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  Camera,
  Mail,
  Phone,
  Eye,
  EyeOff,
  LogOut,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/auth-store';
import { formatCurrency, formatDate, formatShortDate, getInitials, cn } from '@/lib/utils';
import { BookingCard, type BookingStatus } from '@/components/shared/booking-card';

// Types
interface UserStats {
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  totalSpent: number;
}

interface BookingItem {
  id: string;
  ticket: {
    id: string;
    name: string;
    type: string;
  };
  quantity: number;
  price: number;
  subtotal: number;
}

interface Booking {
  id: string;
  bookingCode: string;
  status: BookingStatus;
  paymentStatus: string;
  totalAmount: number;
  finalAmount: number;
  qrCode?: string;
  paymentDeadline?: string;
  createdAt: string;
  event?: {
    id: string;
    name: string;
    images: string[];
    category?: string;
    location?: string;
    startDate?: string;
  };
  items: BookingItem[];
}

interface RecentActivity {
  id: string;
  type: 'booking' | 'payment' | 'ticket_used' | 'cancelled';
  message: string;
  date: string;
  amount?: number;
}

interface UserDashboardProps {
  view?: 'dashboard' | 'bookings' | 'tickets' | 'profile';
}

// Status configuration
const statusConfig: Record<
  BookingStatus,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: 'Menunggu',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
  CONFIRMED: {
    label: 'Terkonfirmasi',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  PAID: {
    label: 'Sudah Dibayar',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    icon: <CreditCard className="h-3.5 w-3.5" />,
  },
  CANCELLED: {
    label: 'Dibatalkan',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  EXPIRED: {
    label: 'Kedaluwarsa',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
  USED: {
    label: 'Digunakan',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    icon: <Ticket className="h-3.5 w-3.5" />,
  },
};

export function UserDashboard({ view = 'dashboard' }: UserDashboardProps) {
  const { user, token, updateUser, logout } = useAuthStore();
  const [activeView, setActiveView] = useState(view);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stayBookings, setStayBookings] = useState<any[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Notification settings
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    marketing: false,
  });

  // Delete account dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // QR Code dialog
  const [selectedQR, setSelectedQR] = useState<{
    code: string;
    title: string;
    description: string;
    lines?: string[];
  } | null>(null);

  // Cancel booking dialog
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();

      if (data.role === 'USER') {
        setStats(data.stats);
        setUpcomingBookings(data.upcomingBookings || []);
        
        // Generate recent activity from bookings
        const activities: RecentActivity[] = (data.recentBookings || []).map((booking: Booking) => ({
          id: booking.id,
          type: booking.status === 'PAID' ? 'payment' : 
                booking.status === 'CANCELLED' ? 'cancelled' : 
                booking.status === 'USED' ? 'ticket_used' : 'booking',
          message: `${booking.event?.name || 'Event'} - ${booking.items?.[0]?.ticket?.name || 'Ticket'}`,
          date: booking.createdAt,
          amount: booking.totalAmount,
        }));
        setRecentActivity(activities);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Gagal memuat data dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Fetch bookings
  const fetchBookings = useCallback(async (status?: string) => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);

      const url = status && status !== 'all' 
        ? `/api/bookings?status=${status}` 
        : '/api/bookings';

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Gagal memuat data booking');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const fetchStayBookings = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/accommodation-bookings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setStayBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching accommodation bookings:', err);
    }
  }, [token]);

  // Cancel booking
  const handleCancelBooking = async () => {
    if (!token || !cancelBookingId) return;

    try {
      setIsCancelling(true);

      const response = await fetch(`/api/bookings/${cancelBookingId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'CANCELLED',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      // Refresh bookings
      await fetchBookings(statusFilter);
      setCancelBookingId(null);
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError('Gagal membatalkan booking');
    } finally {
      setIsCancelling(false);
    }
  };

  // Update profile
  const handleUpdateProfile = async () => {
    if (!token) return;

    try {
      setIsUpdating(true);
      setUpdateSuccess(false);

      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileForm),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      updateUser(data.user);
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Gagal memperbarui profil');
    } finally {
      setIsUpdating(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (!token) return;
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Password baru tidak cocok');
      return;
    }

    try {
      setIsChangingPassword(true);

      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to change password');
      }

      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Password berhasil diubah');
    } catch (err) {
      console.error('Error changing password:', err);
      setError('Gagal mengubah password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (!token) return;

    try {
      setIsDeleting(true);

      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      logout();
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Gagal menghapus akun');
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Effect to fetch data based on view
  useEffect(() => {
    if (activeView === 'dashboard') {
      fetchDashboardData();
    } else if (activeView === 'bookings' || activeView === 'tickets') {
      fetchBookings(statusFilter);
      if (activeView === 'bookings') {
        fetchStayBookings();
      }
    }
  }, [activeView, statusFilter, fetchDashboardData, fetchBookings, fetchStayBookings]);

  // Update profile form when user changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  // Stats card component
  const StatsCard = ({ 
    title, 
    value, 
    icon, 
    color 
  }: { 
    title: string; 
    value: string | number; 
    icon: React.ReactNode; 
    color: string;
  }) => (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className={cn('p-3 rounded-lg', color)}>
            {icon}
          </div>
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );

  // Dashboard Overview
  const DashboardOverview = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#2196F3] to-[#1976D2] rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Selamat Datang, {user?.name?.split(' ')[0] || 'Pengguna'}! 👋
        </h1>
        <p className="text-blue-100">
          Kelola booking dan tiket wisata Anda di sini
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Booking"
          value={stats?.totalBookings || 0}
          icon={<Calendar className="h-6 w-6 text-[#2196F3]" />}
          color="bg-blue-50"
        />
        <StatsCard
          title="Menunggu Pembayaran"
          value={stats?.pendingBookings || 0}
          icon={<Clock className="h-6 w-6 text-amber-600" />}
          color="bg-amber-50"
        />
        <StatsCard
          title="Selesai"
          value={stats?.completedBookings || 0}
          icon={<CheckCircle2 className="h-6 w-6 text-green-600" />}
          color="bg-green-50"
        />
        <StatsCard
          title="Total Pengeluaran"
          value={formatCurrency(stats?.totalSpent || 0)}
          icon={<CreditCard className="h-6 w-6 text-[#FF9800]" />}
          color="bg-orange-50"
        />
      </div>

      {/* Upcoming Bookings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Booking Mendatang</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[#2196F3]"
            onClick={() => setActiveView('tickets')}
          >
            Lihat Semua
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Ticket className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Belum ada booking mendatang</p>
              <Button 
                className="mt-4 bg-[#2196F3] hover:bg-[#1976D2]"
                onClick={() => window.location.href = '/'}
              >
                Jelajahi Event
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                    <Image
                      src={booking.event?.images?.[0] || '/images/placeholder.png'}
                      alt={booking.event?.name || 'Event'}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {booking.event?.name || 'Event'}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {booking.items?.[0]?.ticket?.name} • {booking.items?.reduce((sum, item) => sum + item.quantity, 0)} tiket
                    </p>
                    <p className="text-sm font-medium text-[#2196F3]">
                      {formatCurrency(booking.totalAmount)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setSelectedQR({
                        code: booking.qrCode || booking.bookingCode,
                        title: 'Kode QR Tiket',
                        description: 'Tunjukkan kode QR ini saat check-in',
                        lines: [
                          booking.event?.name || 'Event',
                          booking.items?.[0]?.ticket?.name || 'Tiket',
                          `${booking.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} tiket`,
                        ],
                      })
                    }
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Aktivitas Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Belum ada aktivitas</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50"
                >
                  <div className={cn(
                    'p-2 rounded-full',
                    activity.type === 'payment' ? 'bg-green-100' :
                    activity.type === 'cancelled' ? 'bg-red-100' :
                    activity.type === 'ticket_used' ? 'bg-purple-100' :
                    'bg-blue-100'
                  )}>
                    {activity.type === 'payment' ? (
                      <CreditCard className="h-4 w-4 text-green-600" />
                    ) : activity.type === 'cancelled' ? (
                      <XCircle className="h-4 w-4 text-red-600" />
                    ) : activity.type === 'ticket_used' ? (
                      <Ticket className="h-4 w-4 text-purple-600" />
                    ) : (
                      <Calendar className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{formatShortDate(activity.date)}</p>
                  </div>
                  {activity.amount && (
                    <span className="text-sm font-medium text-[#2196F3]">
                      {formatCurrency(activity.amount)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // My Bookings
  const MyBookings = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Booking Saya</h2>
        
        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {[
            { value: 'all', label: 'Semua' },
            { value: 'PENDING', label: 'Menunggu' },
            { value: 'PAID', label: 'Dibayar' },
            { value: 'CANCELLED', label: 'Dibatalkan' },
          ].map((filter) => (
            <Button
              key={filter.value}
              size="sm"
              variant={statusFilter === filter.value ? 'default' : 'outline'}
              className={cn(
                'whitespace-nowrap',
                statusFilter === filter.value && 'bg-[#2196F3] hover:bg-[#1976D2]'
              )}
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Ticket className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Belum Ada Booking
            </h3>
            <p className="text-gray-500 mb-4">
              {statusFilter !== 'all' 
                ? `Tidak ada booking dengan status "${statusFilter}"`
                : 'Mulai jelajahi destinasi wisata dan buat booking pertama Anda'}
            </p>
            <Button 
              className="bg-[#2196F3] hover:bg-[#1976D2]"
              onClick={() => window.location.href = '/'}
            >
              Jelajahi Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
              <BookingCard
              key={booking.id}
              id={booking.id}
              bookingCode={booking.bookingCode}
              status={booking.status}
              eventId={booking.event?.id || ''}
              eventSlug={booking.event?.id || ''}
              eventTitle={booking.event?.name || 'Event'}
              eventImage={booking.event?.images?.[0] || '/images/placeholder.png'}
              eventLocation={booking.event?.location || ''}
              eventDate={booking.event?.startDate || new Date()}
              ticketName={booking.items?.[0]?.ticket?.name || 'Ticket'}
              quantity={booking.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
              totalAmount={booking.totalAmount}
              createdAt={booking.createdAt}
              paymentDeadline={booking.paymentDeadline}
                qrCode={booking.qrCode}
                onShowQR={() =>
                  setSelectedQR({
                    code: booking.qrCode || booking.bookingCode,
                    title: 'Kode QR Tiket',
                    description: 'Tunjukkan kode QR ini saat check-in',
                    lines: [
                      booking.event?.name || 'Event',
                      booking.items?.[0]?.ticket?.name || 'Tiket',
                      `${booking.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} tiket`,
                    ],
                  })
                }
                onCancel={() => setCancelBookingId(booking.id)}
              />
          ))}
        </div>
      )}

      <Separator className="my-6" />

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Booking Penginapan</h3>
        {stayBookings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">Belum ada booking penginapan</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {stayBookings.map((b: any) => (
              <Card key={b.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{b.accommodation?.name || 'Penginapan'}</p>
                      <p className="text-sm text-gray-600 truncate">{b.room?.name || 'Kamar'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatShortDate(b.checkIn)} - {formatShortDate(b.checkOut)} · {b.nights} malam
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Kode: <span className="font-mono font-semibold text-gray-700">{b.bookingCode}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-[#2196F3]">{formatCurrency(b.finalAmount || b.totalAmount || 0)}</p>
                      <div className="flex flex-col items-end gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">{b.status}</Badge>
                        <Badge variant="secondary" className="text-xs">{b.paymentStatus || 'UNPAID'}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-200"
                      onClick={() =>
                        setSelectedQR({
                          code: b.qrCode || b.bookingCode,
                          title: 'Kode QR Penginapan',
                          description: 'Tunjukkan kode QR ini saat check-in/validasi',
                          lines: [
                            b.accommodation?.name || 'Penginapan',
                            b.room?.name || 'Kamar',
                            `${formatShortDate(b.checkIn)} - ${formatShortDate(b.checkOut)} (${b.nights} malam)`,
                            `${b.guests || 1} tamu`,
                          ],
                        })
                      }
                      disabled={b.paymentStatus !== 'PAID'}
                      title={b.paymentStatus !== 'PAID' ? 'QR tersedia setelah pembayaran dikonfirmasi vendor' : 'Lihat QR'}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Lihat QR
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // My Tickets
  const MyTickets = () => {
    const paidBookings = bookings.filter(b => b.status === 'PAID' || b.status === 'CONFIRMED');

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Tiket Saya</h2>

        {paidBookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <QrCode className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Belum Ada Tiket
              </h3>
              <p className="text-gray-500 mb-4">
                Tiket akan muncul setelah pembayaran berhasil
              </p>
              <Button 
                className="bg-[#2196F3] hover:bg-[#1976D2]"
                onClick={() => window.location.href = '/'}
              >
                Jelajahi Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paidBookings.map((booking) => (
              <Card key={booking.id} className="overflow-hidden">
                {/* Ticket Header */}
                <div className="bg-gradient-to-r from-[#2196F3] to-[#1976D2] p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-white/20 text-white border-0">
                      {booking.status === 'PAID' ? 'Aktif' : 'Terkonfirmasi'}
                    </Badge>
                    <span className="text-xs opacity-80">
                      {formatShortDate(booking.createdAt)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg truncate">
                    {booking.event?.name || 'Event'}
                  </h3>
                  <p className="text-sm opacity-80">
                    {booking.items?.[0]?.ticket?.name}
                  </p>
                </div>

                <CardContent className="p-4">
                  {/* QR Code */}
                  <div className="flex justify-center mb-4">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <QrCode className="h-24 w-24 text-gray-600" />
                    </div>
                  </div>

                  {/* Booking Code */}
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="text-xs text-gray-500">Kode:</span>
                    <button
                      onClick={() => copyToClipboard(booking.bookingCode)}
                      className="flex items-center gap-1 text-sm font-mono font-semibold text-[#2196F3] hover:text-[#1976D2]"
                    >
                      {booking.bookingCode}
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Ticket className="h-4 w-4 text-gray-400" />
                      <span>{booking.items?.reduce((sum, item) => sum + item.quantity, 0)} tiket</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{booking.event?.location || 'Lokasi'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Berlaku hingga: {formatDate(booking.event?.startDate || new Date())}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() =>
                        setSelectedQR({
                          code: booking.qrCode || booking.bookingCode,
                          title: 'Kode QR Tiket',
                          description: 'Tunjukkan kode QR ini saat check-in',
                          lines: [
                            booking.event?.name || 'Event',
                            booking.items?.[0]?.ticket?.name || 'Tiket',
                            `${booking.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} tiket`,
                          ],
                        })
                      }
                    >
                      <QrCode className="h-4 w-4 mr-1" />
                      Lihat QR
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Unduh
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Profile Settings
  const ProfileSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Pengaturan Profil</h2>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm rounded-xl p-1 border border-gray-200">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="notifications">Notifikasi</TabsTrigger>
          <TabsTrigger value="account">Akun</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle>Informasi Profil</CardTitle>
              <CardDescription>
                Perbarui informasi profil Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="bg-[#2196F3] text-white text-xl">
                    {getInitials(user?.name || 'U')}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Ubah Foto
                </Button>
              </div>

              {/* Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="pl-10"
                      placeholder="+62"
                    />
                  </div>
                </div>
              </div>

              {updateSuccess && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    Profil berhasil diperbarui
                  </AlertDescription>
                </Alert>
              )}

              <Button
                className="bg-[#2196F3] hover:bg-[#1976D2]"
                onClick={handleUpdateProfile}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Perubahan'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Password Tab */}
        <TabsContent value="password">
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle>Ubah Password</CardTitle>
              <CardDescription>
                Pastikan password baru Anda aman dan berbeda dari password sebelumnya
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Password Saat Ini</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="current-password"
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Password Baru</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="new-password"
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirm-password"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                className="bg-[#2196F3] hover:bg-[#1976D2]"
                onClick={handleChangePassword}
                disabled={isChangingPassword || !passwordForm.currentPassword || !passwordForm.newPassword}
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mengubah...
                  </>
                ) : (
                  'Ubah Password'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle>Pengaturan Notifikasi</CardTitle>
              <CardDescription>
                Pilih bagaimana Anda ingin menerima notifikasi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Notifikasi Email</Label>
                  <p className="text-sm text-gray-500">
                    Terima notifikasi melalui email
                  </p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Notifikasi SMS</Label>
                  <p className="text-sm text-gray-500">
                    Terima notifikasi melalui SMS
                  </p>
                </div>
                <Switch
                  checked={notifications.sms}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, sms: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Push Notification</Label>
                  <p className="text-sm text-gray-500">
                    Terima push notification di browser
                  </p>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Marketing</Label>
                  <p className="text-sm text-gray-500">
                    Terima promo dan penawaran khusus
                  </p>
                </div>
                <Switch
                  checked={notifications.marketing}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, marketing: checked })}
                />
              </div>

              <Button className="bg-[#2196F3] hover:bg-[#1976D2]">
                Simpan Pengaturan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account">
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle>Pengaturan Akun</CardTitle>
              <CardDescription>
                Kelola pengaturan akun Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <LogOut className="h-5 w-5 text-gray-400" />
                  <div>
                    <h4 className="font-medium">Keluar dari Akun</h4>
                    <p className="text-sm text-gray-500">
                      Keluar dari akun Anda di perangkat ini
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={logout}>
                  Keluar
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50">
                <div className="flex items-center gap-4">
                  <Trash2 className="h-5 w-5 text-red-500" />
                  <div>
                    <h4 className="font-medium text-red-700">Hapus Akun</h4>
                    <p className="text-sm text-red-600">
                      Hapus akun Anda secara permanen. Tindakan ini tidak dapat dibatalkan.
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Hapus Akun
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* User quick actions (profile + logout) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 bg-white shadow-sm border border-gray-200 rounded-xl px-4 py-3 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback className="bg-[#2196F3] text-white font-semibold">
              {getInitials(user?.name || 'U')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs text-gray-500">Masuk sebagai</p>
            <p className="text-base font-semibold text-gray-900">{user?.name || user?.email}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{user?.role || 'USER'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => setActiveView('profile')}>
            Profil
          </Button>
          <Button variant="destructive" size="sm" className="flex-1 sm:flex-none" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>

      {/* View Tabs for Navigation */}
      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { value: 'dashboard', label: 'Dashboard', icon: <User className="h-4 w-4" /> },
            { value: 'bookings', label: 'Booking', icon: <Calendar className="h-4 w-4" /> },
            { value: 'tickets', label: 'Tiket', icon: <Ticket className="h-4 w-4" /> },
            { value: 'profile', label: 'Profil', icon: <Settings className="h-4 w-4" /> },
          ].map((tab) => (
            <Button
              key={tab.value}
              variant={activeView === tab.value ? 'default' : 'outline'}
              className={cn(
                'whitespace-nowrap gap-2',
                activeView === tab.value && 'bg-[#2196F3] hover:bg-[#1976D2]'
              )}
              onClick={() => setActiveView(tab.value as typeof activeView)}
            >
              {tab.icon}
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {activeView === 'dashboard' && <DashboardOverview />}
          {activeView === 'bookings' && <MyBookings />}
          {activeView === 'tickets' && <MyTickets />}
          {activeView === 'profile' && <ProfileSettings />}
        </>
      )}

      {/* QR Code Dialog */}
      <Dialog open={!!selectedQR} onOpenChange={() => setSelectedQR(null)}>
        <DialogContent className="sm:max-w-md bg-white shadow-xl border border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-center">{selectedQR?.title || 'Kode QR'}</DialogTitle>
            <DialogDescription className="text-center">
              {selectedQR?.description || 'Tunjukkan kode QR ini saat validasi'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            <div className="bg-white p-4 rounded-lg shadow-inner border border-gray-200">
              <div className="w-48 h-48 bg-white flex items-center justify-center rounded-lg shadow-sm">
                {selectedQR?.code ? (
                  <QRCodeCanvas value={selectedQR.code} size={176} includeMargin fgColor="#0f172a" />
                ) : (
                  <QrCode className="w-32 h-32 text-gray-400" />
                )}
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">Kode Booking</p>
              <button
                onClick={() => selectedQR && copyToClipboard(selectedQR.code)}
                className="flex items-center gap-1 text-lg font-mono font-semibold text-[#2196F3] hover:text-[#1976D2]"
              >
                {selectedQR?.code}
                <Copy className="h-4 w-4" />
              </button>
            </div>
            {selectedQR?.lines?.length ? (
              <div className="mt-4 w-full text-sm text-gray-600 space-y-0.5">
                {selectedQR.lines.map((l, idx) => (
                  <p key={idx} className={idx === 0 ? 'font-medium text-gray-900' : undefined}>
                    {l}
                  </p>
                ))}
              </div>
            ) : null}
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Unduh
              </Button>
              <Button className="flex-1 bg-[#2196F3] hover:bg-[#1976D2]">
                <Share2 className="h-4 w-4 mr-2" />
                Bagikan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Booking Dialog */}
      <AlertDialog open={!!cancelBookingId} onOpenChange={() => setCancelBookingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Booking?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Booking Anda akan dibatalkan dan Anda perlu melakukan booking ulang jika ingin memesan tiket yang sama.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Tidak, Kembali</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelBooking}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Membatalkan...
                </>
              ) : (
                'Ya, Batalkan'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Akun?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus akun Anda secara permanen beserta semua data yang terkait. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                'Ya, Hapus Akun'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default UserDashboard;
