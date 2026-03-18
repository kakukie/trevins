'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  Bookmark,
  QrCode,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Camera,
  RefreshCw,
  ChevronRight,
  MapPin,
  Star,
  MoreVertical,
  Copy,
  Loader2,
  ArrowUpDown,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VendorAccommodationsPanel from '@/components/vendor/vendor-accommodations-panel';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency, formatDate, formatShortDate, cn, EVENT_CATEGORIES } from '@/lib/utils';

// Types
interface VendorStats {
  totalEvents: number;
  totalTickets: number;
  totalBookings: number;
  totalRevenue: number;
  pendingBookings: number;
}

interface Vendor {
  id: string;
  businessName: string;
  description?: string;
  logo?: string;
  address?: string;
  city?: string;
  phone?: string;
  isVerified: boolean;
  rating: number;
  totalReviews: number;
}

interface VendorPaymentMethod {
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
  isActive: boolean;
  sortOrder: number;
}

interface Event {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  images: string;
  address?: string;
  city?: string;
  rating: number;
  totalReviews: number;
  totalSales: number;
  isActive: boolean;
  isFeatured: boolean;
  validFrom: string;
  validUntil: string;
  createdAt: string;
  vendor?: {
    id: string;
    businessName: string;
  };
  _count?: {
    tickets: number;
    reviews: number;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  type: string;
  ownerKey: string;
  vendorId?: string | null;
  isActive: boolean;
}

interface Ticket {
  id: string;
  name: string;
  sku: string;
  description?: string;
  type: string;
  price: number;
  discountPrice?: number;
  quota: number;
  sold: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  eventId?: string;
  event?: {
    id: string;
    name: string;
    category: string;
  };
}

interface BookingItem {
  id: string;
  quantity: number;
  price: number;
  subtotal: number;
  ticket: {
    id: string;
    name: string;
    type: string;
  };
}

interface Booking {
  id: string;
  bookingCode: string;
  status: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod?: string;
  paymentStatus: string;
  paymentDeadline?: string;
  qrCode?: string;
  notes?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  event?: {
    id: string;
    name: string;
  };
  items: BookingItem[];
}

interface StayBooking {
  id: string;
  bookingCode: string;
  status: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod?: string | null;
  paymentStatus: string;
  paymentDeadline?: string | null;
  qrCode?: string | null;
  notes?: string | null;
  guests: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
  accommodation: {
    id: string;
    name: string;
    images: string | string[];
    city?: string | null;
  };
  room: {
    id: string;
    name: string;
    pricePerNight: number;
    discountPrice?: number | null;
    capacity: number;
  };
}

type ViewType = 'dashboard' | 'events' | 'tickets' | 'bookings' | 'accommodations' | 'qr-scanner' | 'settings';

interface VendorDashboardProps {
  view?: ViewType;
  showTabs?: boolean;
}

// Status badge helper
const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string; label: string }> = {
    PENDING: { variant: 'outline', className: 'border-yellow-500 text-yellow-600 bg-yellow-50', label: 'Menunggu' },
    CONFIRMED: { variant: 'outline', className: 'border-blue-500 text-blue-600 bg-blue-50', label: 'Dikonfirmasi' },
    PAID: { variant: 'outline', className: 'border-green-500 text-green-600 bg-green-50', label: 'Dibayar' },
    CANCELLED: { variant: 'outline', className: 'border-red-500 text-red-600 bg-red-50', label: 'Dibatalkan' },
    EXPIRED: { variant: 'outline', className: 'border-gray-500 text-gray-600 bg-gray-50', label: 'Kedaluwarsa' },
    USED: { variant: 'outline', className: 'border-purple-500 text-purple-600 bg-purple-50', label: 'Digunakan' },
    UNPAID: { variant: 'outline', className: 'border-red-500 text-red-600 bg-red-50', label: 'Belum Dibayar' },
    REFUNDED: { variant: 'outline', className: 'border-orange-500 text-orange-600 bg-orange-50', label: 'Dikembalikan' },
  };

  const config = statusConfig[status] || { variant: 'outline', className: '', label: status };
  return (
    <Badge variant={config.variant} className={cn('font-medium', config.className)}>
      {config.label}
    </Badge>
  );
};

// Ticket type helper
const getTicketTypeLabel = (type: string) => {
  const types: Record<string, string> = {
    ADULT: 'Dewasa',
    CHILD: 'Anak-anak',
    SENIOR: 'Lansia',
  };
  return types[type] || type;
};

// Main Component
export function VendorDashboard({ view = 'dashboard', showTabs = false }: VendorDashboardProps) {
  const { user, token } = useAuthStore();
  const [activeView, setActiveView] = useState<ViewType>(view);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stayBookings, setStayBookings] = useState<StayBooking[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [topTickets, setTopTickets] = useState<Ticket[]>([]);

  // Vendor payment methods (settings)
  const [paymentMethods, setPaymentMethods] = useState<VendorPaymentMethod[]>([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);
  const [paymentMethodDialogOpen, setPaymentMethodDialogOpen] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<VendorPaymentMethod | null>(null);
  const [paymentMethodSaving, setPaymentMethodSaving] = useState(false);
  const [paymentMethodError, setPaymentMethodError] = useState<string | null>(null);
  const [paymentMethodForm, setPaymentMethodForm] = useState({
    type: 'BANK_TRANSFER',
    label: '',
    provider: '',
    accountName: '',
    accountNumber: '',
    qrString: '',
    qrImageUrl: '',
    instructions: '',
    isActive: true,
    sortOrder: 0,
  });

  // Vendor categories (for event/accommodation selection)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState<{ name: string; type: 'EVENT' | 'ACCOMMODATION' }>({
    name: '',
    type: 'EVENT',
  });

  // Keep internal view in sync with parent navigation
  useEffect(() => {
    setActiveView(view);
  }, [view]);

  // Dialog states
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [bookingDetailOpen, setBookingDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [stayDetailOpen, setStayDetailOpen] = useState(false);
  const [selectedStayBooking, setSelectedStayBooking] = useState<StayBooking | null>(null);
  const [deleteType, setDeleteType] = useState<'event' | 'ticket' | 'paymentMethod' | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form states
  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    category: '',
    images: [] as string[],
    address: '',
    city: '',
    validFrom: '',
    validUntil: '',
    isFeatured: false,
  });
  const [ticketForm, setTicketForm] = useState({
    name: '',
    description: '',
    eventId: '',
    type: 'ADULT',
    price: '',
    discountPrice: '',
    quota: '',
    validFrom: '',
    validUntil: '',
  });

  // Filter states
  const [bookingStatus, setBookingStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingsTab, setBookingsTab] = useState<'tickets' | 'stays'>('tickets');

  // QR Scanner states
  const [qrInput, setQrInput] = useState('');
  const [qrValidation, setQrValidation] = useState<{
    loading: boolean;
    kind: 'ticket' | 'stay' | null;
    result: Booking | StayBooking | null;
    error: string | null;
  }>({ loading: false, kind: null, result: null, error: null });

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch('/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.role === 'VENDOR') {
          setStats(data.stats);
          setVendor(data.vendor);
          setRecentBookings(data.recentBookings || []);
          setTopTickets(data.topTickets || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    if (!token || !vendor) return;

    try {
      const response = await fetch(`/api/events?vendorId=${vendor.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  }, [token, vendor]);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    if (!token || !vendor) return;

    try {
      const response = await fetch(`/api/tickets?vendorId=${vendor.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    }
  }, [token, vendor]);

  // Fetch vendor bookings
  const fetchBookings = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/bookings', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    }
  }, [token]);

  const fetchStayBookings = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/accommodation-bookings', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStayBookings(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch stay bookings:', error);
    }
  }, [token]);

  const fetchCategories = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/categories?type=EVENT', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = (await res.json()) as Category[];
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch categories:', e);
    }
  }, [token]);

  const fetchPaymentMethods = useCallback(async () => {
    if (!token) return;
    setPaymentMethodsLoading(true);
    try {
      const response = await fetch('/api/vendor/payment-methods', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    } finally {
      setPaymentMethodsLoading(false);
    }
  }, [token]);

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Load data when view changes
  useEffect(() => {
    if (vendor) {
      if (activeView === 'events') fetchEvents();
      if (activeView === 'tickets') fetchTickets();
      if (activeView === 'bookings') {
        fetchBookings();
        fetchStayBookings();
      }
    }
    if (activeView === 'settings') fetchPaymentMethods();
    if (activeView === 'events' || activeView === 'settings') fetchCategories();
  }, [activeView, vendor, fetchEvents, fetchTickets, fetchBookings, fetchStayBookings, fetchPaymentMethods, fetchCategories]);

  // Update active view when prop changes
  useEffect(() => {
    setActiveView(view);
  }, [view]);

  // Create/Update Event
  const handleSaveEvent = async () => {
    if (!token) return;

    try {
      const url = selectedEvent
        ? `/api/events/${selectedEvent.id}`
        : '/api/events';
      const method = selectedEvent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventForm),
      });

      if (response.ok) {
        setEventDialogOpen(false);
        fetchEvents();
        fetchDashboardData();
        resetEventForm();
      }
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  // Create/Update Ticket
  const handleSaveTicket = async () => {
    if (!token) return;

    try {
      const url = selectedTicket
        ? `/api/tickets/${selectedTicket.id}`
        : '/api/tickets';
      const method = selectedTicket ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ticketForm),
      });

      if (response.ok) {
        setTicketDialogOpen(false);
        fetchTickets();
        fetchDashboardData();
        resetTicketForm();
      }
    } catch (error) {
      console.error('Failed to save ticket:', error);
    }
  };

  // Delete item
  const handleDelete = async () => {
    if (!token || !deleteId || !deleteType) return;

    try {
      const url = deleteType === 'event'
        ? `/api/events/${deleteId}`
        : deleteType === 'ticket'
          ? `/api/tickets/${deleteId}`
          : `/api/vendor/payment-methods/${deleteId}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        if (deleteType === 'event') {
          setEvents(events.filter(e => e.id !== deleteId));
        } else if (deleteType === 'ticket') {
          setTickets(tickets.filter(t => t.id !== deleteId));
        } else {
          setPaymentMethods(paymentMethods.filter(m => m.id !== deleteId));
        }
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setDeleteDialogOpen(false);
      setDeleteId(null);
      setDeleteType(null);
    }
  };

  const openCreatePaymentMethod = () => {
    setEditingPaymentMethod(null);
    setPaymentMethodError(null);
    setPaymentMethodForm({
      type: 'BANK_TRANSFER',
      label: '',
      provider: '',
      accountName: '',
      accountNumber: '',
      qrString: '',
      qrImageUrl: '',
      instructions: '',
      isActive: true,
      sortOrder: 0,
    });
    setPaymentMethodDialogOpen(true);
  };

  const openEditPaymentMethod = (method: VendorPaymentMethod) => {
    setEditingPaymentMethod(method);
    setPaymentMethodError(null);
    setPaymentMethodForm({
      type: method.type,
      label: method.label,
      provider: method.provider || '',
      accountName: method.accountName || '',
      accountNumber: method.accountNumber || '',
      qrString: method.qrString || '',
      qrImageUrl: method.qrImageUrl || '',
      instructions: method.instructions || '',
      isActive: method.isActive,
      sortOrder: method.sortOrder || 0,
    });
    setPaymentMethodDialogOpen(true);
  };

  const handleSavePaymentMethod = async () => {
    if (!token) return;
    setPaymentMethodSaving(true);
    setPaymentMethodError(null);

    try {
      const isEdit = !!editingPaymentMethod;
      const url = isEdit
        ? `/api/vendor/payment-methods/${editingPaymentMethod!.id}`
        : '/api/vendor/payment-methods';
      const method = isEdit ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: paymentMethodForm.type,
          label: paymentMethodForm.label,
          provider: paymentMethodForm.provider || null,
          accountName: paymentMethodForm.accountName || null,
          accountNumber: paymentMethodForm.accountNumber || null,
          qrString: paymentMethodForm.qrString || null,
          qrImageUrl: paymentMethodForm.qrImageUrl || null,
          instructions: paymentMethodForm.instructions || null,
          isActive: paymentMethodForm.isActive,
          sortOrder: paymentMethodForm.sortOrder,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setPaymentMethodError(data?.error || 'Gagal menyimpan metode pembayaran');
        return;
      }

      setPaymentMethodDialogOpen(false);
      setEditingPaymentMethod(null);
      await fetchPaymentMethods();
    } catch (error) {
      console.error('Failed to save payment method:', error);
      setPaymentMethodError('Terjadi kesalahan saat menyimpan');
    } finally {
      setPaymentMethodSaving(false);
    }
  };

  const handleQrImageUpload = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPaymentMethodError('File QR harus berupa gambar (PNG/JPG/WebP).');
      return;
    }
    // Keep it small for local storage (data URL). For production use object storage.
    if (file.size > 2 * 1024 * 1024) {
      setPaymentMethodError('Ukuran file QR terlalu besar (maks 2MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setPaymentMethodForm((prev) => ({ ...prev, qrImageUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const togglePaymentMethodStatus = async (methodId: string, currentStatus: boolean) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/vendor/payment-methods/${methodId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (response.ok) {
        setPaymentMethods(paymentMethods.map((m) =>
          m.id === methodId ? { ...m, isActive: !currentStatus } : m
        ));
      }
    } catch (error) {
      console.error('Failed to toggle payment method status:', error);
    }
  };

  const openCreateCategory = (type: 'EVENT' | 'ACCOMMODATION' = 'EVENT') => {
    setEditingCategory(null);
    setCategoryError(null);
    setCategoryForm({ name: '', type });
    setCategoryDialogOpen(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryError(null);
    setCategoryForm({ name: cat.name, type: (cat.type as any) || 'EVENT' });
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!token) return;
    setCategorySaving(true);
    setCategoryError(null);
    try {
      const isEdit = !!editingCategory;
      const url = isEdit ? `/api/categories/${editingCategory!.id}` : '/api/categories';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: categoryForm.name,
          type: categoryForm.type,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setCategoryError(data?.error || 'Gagal menyimpan kategori');
        return;
      }

      setCategoryDialogOpen(false);
      setEditingCategory(null);
      await fetchCategories();
    } catch (e) {
      console.error('Failed to save category:', e);
      setCategoryError('Terjadi kesalahan saat menyimpan kategori');
    } finally {
      setCategorySaving(false);
    }
  };

  const toggleCategoryActive = async (cat: Category) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
      if (res.ok) {
        await fetchCategories();
      }
    } catch (e) {
      console.error('Failed to toggle category:', e);
    }
  };

  // Toggle event status
  const toggleEventStatus = async (eventId: string, currentStatus: boolean) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        setEvents(events.map(e =>
          e.id === eventId ? { ...e, isActive: !currentStatus } : e
        ));
      }
    } catch (error) {
      console.error('Failed to toggle event status:', error);
    }
  };

  // Toggle ticket status
  const toggleTicketStatus = async (ticketId: string, currentStatus: boolean) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        setTickets(tickets.map(t =>
          t.id === ticketId ? { ...t, isActive: !currentStatus } : t
        ));
      }
    } catch (error) {
      console.error('Failed to toggle ticket status:', error);
    }
  };

  // Update booking status
  const updateBookingStatus = async (bookingId: string, status: string, paymentStatus?: string) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, paymentStatus }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        console.error('Update booking failed:', data);
        return;
      }

      fetchBookings();
      fetchDashboardData();
      setBookingDetailOpen(false);
    } catch (error) {
      console.error('Failed to update booking:', error);
    }
  };

  const updateStayBookingStatus = async (bookingId: string, status: string, paymentStatus?: string) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/accommodation-bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, paymentStatus }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        console.error('Update stay booking failed:', data);
        return;
      }

      fetchStayBookings();
      fetchDashboardData();
      setStayDetailOpen(false);
    } catch (error) {
      console.error('Failed to update stay booking:', error);
    }
  };

  // Validate QR Code
  const validateQRCode = async () => {
    if (!token || !qrInput.trim()) return;

    setQrValidation({ loading: true, kind: null, result: null, error: null });

    try {
      // 1) Try ticket bookings first
      const response = await fetch(`/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const bookings: Booking[] = await response.json();
        const booking = bookings.find(b => b.bookingCode === qrInput.trim() || b.qrCode === qrInput.trim());

        if (booking) {
          if (booking.status === 'USED') {
            setQrValidation({ loading: false, kind: null, result: null, error: 'Tiket sudah pernah digunakan!' });
          } else if (booking.status === 'CANCELLED') {
            setQrValidation({ loading: false, kind: null, result: null, error: 'Booking sudah dibatalkan!' });
          } else if (booking.paymentStatus !== 'PAID') {
            setQrValidation({ loading: false, kind: null, result: null, error: 'Booking belum dibayar!' });
          } else {
            setQrValidation({ loading: false, kind: 'ticket', result: booking, error: null });
          }
          return;
        }
      }

      // 2) Try stay bookings
      const resStay = await fetch(`/api/accommodation-bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resStay.ok) {
        setQrValidation({ loading: false, kind: null, result: null, error: 'Kode booking tidak ditemukan!' });
        return;
      }
      const stays: StayBooking[] = await resStay.json();
      const stay = stays.find((b) => b.bookingCode === qrInput.trim() || b.qrCode === qrInput.trim());
      if (!stay) {
        setQrValidation({ loading: false, kind: null, result: null, error: 'Kode booking tidak ditemukan!' });
        return;
      }
      if (stay.status === 'USED') {
        setQrValidation({ loading: false, kind: null, result: null, error: 'Booking sudah pernah divalidasi!' });
        return;
      }
      if (stay.status === 'CANCELLED') {
        setQrValidation({ loading: false, kind: null, result: null, error: 'Booking sudah dibatalkan!' });
        return;
      }
      if (stay.paymentStatus !== 'PAID') {
        setQrValidation({ loading: false, kind: null, result: null, error: 'Booking belum dibayar!' });
        return;
      }
      setQrValidation({ loading: false, kind: 'stay', result: stay, error: null });
    } catch (error) {
      console.error('Failed to validate QR:', error);
      setQrValidation({ loading: false, kind: null, result: null, error: 'Terjadi kesalahan saat validasi' });
    }
  };

  // Mark booking as used
  const markAsUsed = async () => {
    if (qrValidation.result && qrValidation.kind) {
      if (qrValidation.kind === 'ticket') {
        await updateBookingStatus(qrValidation.result.id, 'USED');
      } else {
        await updateStayBookingStatus(qrValidation.result.id, 'USED');
      }
      setQrValidation({ loading: false, kind: null, result: null, error: null });
      setQrInput('');
    }
  };

  // Reset forms
  const resetEventForm = () => {
    setEventForm({
      name: '',
      description: '',
      category: '',
      images: [],
      address: '',
      city: '',
      validFrom: '',
      validUntil: '',
      isFeatured: false,
    });
    setSelectedEvent(null);
  };

  const resetTicketForm = () => {
    setTicketForm({
      name: '',
      description: '',
      eventId: '',
      type: 'ADULT',
      price: '',
      discountPrice: '',
      quota: '',
      validFrom: '',
      validUntil: '',
    });
    setSelectedTicket(null);
  };

  const handleEventImagesUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const maxFiles = 5;
    const maxBytes = 2 * 1024 * 1024; // keep local DB reasonable; production should use object storage
    const toRead = Array.from(files).slice(0, maxFiles);

    toRead.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > maxBytes) return;

      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        if (!result) return;
        setEventForm((prev) => ({
          ...prev,
          images: [...prev.images, result].slice(0, maxFiles),
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeEventImageAt = (index: number) => {
    setEventForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Open edit event dialog
  const openEditEvent = (event: Event) => {
    setSelectedEvent(event);
    let parsedImages: string[] = [];
    try {
      parsedImages = event.images ? JSON.parse(event.images as any) : [];
    } catch {
      parsedImages = [];
    }
    setEventForm({
      name: event.name,
      description: event.description || '',
      category: event.category,
      images: parsedImages,
      address: event.address || '',
      city: event.city || '',
      validFrom: event.validFrom.split('T')[0],
      validUntil: event.validUntil.split('T')[0],
      isFeatured: event.isFeatured,
    });
    setEventDialogOpen(true);
  };

  // Open edit ticket dialog
  const openEditTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setTicketForm({
      name: ticket.name,
      description: ticket.description || '',
      eventId: ticket.eventId || '',
      type: ticket.type,
      price: ticket.price.toString(),
      discountPrice: ticket.discountPrice?.toString() || '',
      quota: ticket.quota.toString(),
      validFrom: ticket.validFrom.split('T')[0],
      validUntil: ticket.validUntil.split('T')[0],
    });
    setTicketDialogOpen(true);
  };

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = bookingStatus === 'all' || booking.status === bookingStatus;
    const matchesSearch = !searchQuery ||
      booking.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.user.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredStayBookings = stayBookings.filter((b) => {
    const matchesStatus = bookingStatus === 'all' || b.status === bookingStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      b.bookingCode.toLowerCase().includes(q) ||
      b.guestName.toLowerCase().includes(q) ||
      b.user.name.toLowerCase().includes(q) ||
      b.accommodation.name.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  // Revenue chart data (mock)
  const revenueData = [
    { month: 'Jan', revenue: 4500000 },
    { month: 'Feb', revenue: 5200000 },
    { month: 'Mar', revenue: 4800000 },
    { month: 'Apr', revenue: 6100000 },
    { month: 'Mei', revenue: 7200000 },
    { month: 'Jun', revenue: 8500000 },
  ];

  // Render loading skeleton
  const renderSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Dashboard View
  const renderDashboard = () => {
    if (loading) return renderSkeleton();

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Event</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalEvents || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Tiket</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalTickets || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Ticket className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Booking</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalBookings || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Bookmark className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Pendapatan</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats?.totalRevenue || 0)}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats?.pendingBookings || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Booking Terbaru</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveView('bookings')}>
                  Lihat Semua <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentBookings.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Belum ada booking</p>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {recentBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{booking.user.name}</p>
                            <p className="text-xs text-gray-500">{booking.bookingCode}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-orange-600">{formatCurrency(booking.finalAmount)}</p>
                          {getStatusBadge(booking.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Top Selling Tickets */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tiket Terlaris</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveView('tickets')}>
                  Lihat Semua <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {topTickets.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Belum ada tiket</p>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {topTickets.map((ticket, index) => (
                      <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{ticket.name}</p>
                            <p className="text-xs text-gray-500">{getTicketTypeLabel(ticket.type)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-blue-600">{ticket.sold} terjual</p>
                          <p className="text-xs text-gray-500">{formatCurrency(ticket.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Grafik Pendapatan</CardTitle>
            <CardDescription>Pendapatan 6 bulan terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ revenue: { label: 'Pendapatan', color: '#2196F3' } }} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`} className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="#2196F3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Events Management View
  const renderEvents = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kelola Event</h2>
          <p className="text-gray-500">Kelola semua event wisata Anda</p>
        </div>
        <Button onClick={() => { resetEventForm(); setEventDialogOpen(true); }} className="bg-blue-500 hover:bg-blue-600">
          <Plus className="mr-2 h-4 w-4" /> Tambah Event
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-visible">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">Belum ada event</p>
              <Button onClick={() => { resetEventForm(); setEventDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" /> Buat Event Pertama
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Penjualan</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{event.name}</p>
                        <p className="text-xs text-gray-500">{formatShortDate(event.validFrom)} - {formatShortDate(event.validUntil)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{event.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <MapPin className="h-3 w-3" />
                        {event.city || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span>{event.totalSales}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span>{event.rating.toFixed(1)}</span>
                        <span className="text-xs text-gray-400">({event.totalReviews})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={event.isActive}
                          onCheckedChange={() => toggleEventStatus(event.id, event.isActive)}
                        />
                        {event.isFeatured && (
                          <Badge className="bg-orange-500">Featured</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="z-50">
                          <DropdownMenuItem onClick={() => openEditEvent(event)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setDeleteId(event.id);
                              setDeleteType('event');
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Tickets Management View
  const renderTickets = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kelola Tiket</h2>
          <p className="text-gray-500">Kelola semua tiket untuk event Anda</p>
        </div>
        <Button onClick={() => { resetTicketForm(); setTicketDialogOpen(true); }} className="bg-blue-500 hover:bg-blue-600">
          <Plus className="mr-2 h-4 w-4" /> Tambah Tiket
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">Belum ada tiket</p>
              <Button onClick={() => { resetTicketForm(); setTicketDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" /> Buat Tiket Pertama
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiket</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Quota</TableHead>
                  <TableHead>Terjual</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ticket.name}</p>
                        <p className="text-xs text-gray-500">{ticket.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ticket.event?.name || 'Tanpa Event'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getTicketTypeLabel(ticket.type)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        {ticket.discountPrice ? (
                          <>
                            <p className="font-medium text-orange-600">{formatCurrency(ticket.discountPrice)}</p>
                            <p className="text-xs text-gray-400 line-through">{formatCurrency(ticket.price)}</p>
                          </>
                        ) : (
                          <p className="font-medium">{formatCurrency(ticket.price)}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-24">
                        <div className="flex justify-between text-xs mb-1">
                          <span>{ticket.sold}</span>
                          <span>{ticket.quota}</span>
                        </div>
                        <Progress value={(ticket.sold / ticket.quota) * 100} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        'font-medium',
                        ticket.sold >= ticket.quota ? 'text-red-600' : 'text-green-600'
                      )}>
                        {ticket.sold}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={ticket.isActive}
                        onCheckedChange={() => toggleTicketStatus(ticket.id, ticket.isActive)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditTicket(ticket)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setDeleteId(ticket.id);
                              setDeleteType('ticket');
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Bookings Management View
  const renderBookings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Booking Masuk</h2>
          <p className="text-gray-500">Kelola semua booking pelanggan Anda</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari kode booking atau nama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={bookingStatus} onValueChange={setBookingStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="PENDING">Menunggu</SelectItem>
                <SelectItem value="CONFIRMED">Dikonfirmasi</SelectItem>
                <SelectItem value="PAID">Dibayar</SelectItem>
                <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                <SelectItem value="USED">Digunakan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs value={bookingsTab} onValueChange={(v) => setBookingsTab(v as any)}>
        <TabsList className="grid w-full sm:w-[420px] grid-cols-2">
          <TabsTrigger value="tickets">Tiket ({filteredBookings.length})</TabsTrigger>
          <TabsTrigger value="stays">Penginapan ({filteredStayBookings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
          <Card>
            <CardContent className="p-0">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Bookmark className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Tidak ada booking tiket ditemukan</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode Booking</TableHead>
                      <TableHead>Pelanggan</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pembayaran</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">{booking.bookingCode}</code>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{booking.user.name}</p>
                            <p className="text-xs text-gray-500">{booking.user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{booking.event?.name || '-'}</p>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-orange-600">{formatCurrency(booking.finalAmount)}</p>
                        </TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell>{getStatusBadge(booking.paymentStatus)}</TableCell>
                        <TableCell>
                          <p className="text-sm">{formatShortDate(booking.createdAt)}</p>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setBookingDetailOpen(true);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" /> Detail
                              </DropdownMenuItem>
                              {booking.status === 'PENDING' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Konfirmasi
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600" onClick={() => updateBookingStatus(booking.id, 'CANCELLED')}>
                                    <XCircle className="mr-2 h-4 w-4" /> Batalkan
                                  </DropdownMenuItem>
                                </>
                              )}
                              {booking.status === 'CONFIRMED' && booking.paymentStatus === 'UNPAID' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, 'PAID', 'PAID')}>
                                    <DollarSign className="mr-2 h-4 w-4" /> Tandai Dibayar
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stays">
          <Card>
            <CardContent className="p-0">
              {filteredStayBookings.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Tidak ada booking penginapan ditemukan</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Tamu</TableHead>
                      <TableHead>Penginapan</TableHead>
                      <TableHead>Kamar</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pembayaran</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStayBookings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">{b.bookingCode}</code>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{b.guestName}</p>
                            <p className="text-xs text-gray-500">{b.guestEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{b.accommodation.name}</p>
                            <p className="text-xs text-gray-500">{b.accommodation.city || '-'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{b.room?.name || '-'}</p>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-orange-600">{formatCurrency(b.finalAmount)}</p>
                        </TableCell>
                        <TableCell>{getStatusBadge(b.status)}</TableCell>
                        <TableCell>{getStatusBadge(b.paymentStatus)}</TableCell>
                        <TableCell>
                          <p className="text-sm">{formatShortDate(b.checkIn)}</p>
                          <p className="text-xs text-gray-500">{b.nights} malam</p>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedStayBooking(b);
                                  setStayDetailOpen(true);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" /> Detail
                              </DropdownMenuItem>
                              {b.status === 'PENDING' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => updateStayBookingStatus(b.id, 'CONFIRMED')}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Konfirmasi
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600" onClick={() => updateStayBookingStatus(b.id, 'CANCELLED')}>
                                    <XCircle className="mr-2 h-4 w-4" /> Batalkan
                                  </DropdownMenuItem>
                                </>
                              )}
                              {b.status === 'CONFIRMED' && b.paymentStatus === 'UNPAID' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => updateStayBookingStatus(b.id, 'PAID', 'PAID')}>
                                    <DollarSign className="mr-2 h-4 w-4" /> Tandai Dibayar
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  // QR Scanner View
  const renderQRScanner = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">QR Scanner</h2>
          <p className="text-gray-500">Validasi tiket pelanggan dengan scan QR</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Scanner Area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Scanner Kamera
            </CardTitle>
            <CardDescription>
              Arahkan kamera ke QR code tiket
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-gray-400">Fitur kamera akan segera tersedia</p>
                <p className="text-sm text-gray-500 mt-2">Gunakan input manual di bawah</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Input Manual
            </CardTitle>
            <CardDescription>
              Masukkan kode booking atau QR code secara manual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="qr-input">Kode Booking / QR Code</Label>
              <div className="flex gap-2">
                <Input
                  id="qr-input"
                  placeholder="Contoh: AP123ABC"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value.toUpperCase())}
                  className="font-mono"
                />
                <Button onClick={validateQRCode} disabled={!qrInput.trim() || qrValidation.loading}>
                  {qrValidation.loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Validation Result */}
            {qrValidation.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Gagal</AlertTitle>
                <AlertDescription>{qrValidation.error}</AlertDescription>
              </Alert>
            )}

            {qrValidation.result && (
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-600">
                  {qrValidation.kind === 'stay' ? 'Booking Penginapan Valid!' : 'Tiket Valid!'}
                </AlertTitle>
                <AlertDescription>
                  {qrValidation.kind === 'stay' ? (
                    (() => {
                      const b = qrValidation.result as StayBooking;
                      return (
                        <div className="mt-3 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Kode:</span>
                            <span className="font-mono font-medium">{b.bookingCode}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tamu:</span>
                            <span className="font-medium">{b.guestName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Penginapan:</span>
                            <span>{b.accommodation?.name || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Kamar:</span>
                            <span>{b.room?.name || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Check-in:</span>
                            <span>{formatShortDate(b.checkIn)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-semibold text-orange-600">{formatCurrency(b.finalAmount)}</span>
                          </div>
                          <Button className="w-full mt-4 bg-green-500 hover:bg-green-600" onClick={markAsUsed}>
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Tandai Check-in
                          </Button>
                        </div>
                      );
                    })()
                  ) : (
                    (() => {
                      const b = qrValidation.result as Booking;
                      return (
                        <div className="mt-3 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Kode:</span>
                            <span className="font-mono font-medium">{b.bookingCode}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Nama:</span>
                            <span className="font-medium">{b.user.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Event:</span>
                            <span>{b.event?.name || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-semibold text-orange-600">{formatCurrency(b.finalAmount)}</span>
                          </div>
                          <div className="pt-3">
                            <p className="text-sm text-gray-600 mb-2">Item Tiket:</p>
                            <div className="space-y-1">
                              {b.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm bg-white p-2 rounded">
                                  <span>{item.ticket.name} x{item.quantity}</span>
                                  <span>{formatCurrency(item.subtotal)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <Button className="w-full mt-4 bg-green-500 hover:bg-green-600" onClick={markAsUsed}>
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Tandai Sudah Digunakan
                          </Button>
                        </div>
                      );
                    })()
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Panduan Penggunaan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                1
              </div>
              <div>
                <p className="font-medium">Scan atau Input Kode</p>
                <p className="text-sm text-gray-500">Arahkan kamera ke QR atau ketik kode manual</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                2
              </div>
              <div>
                <p className="font-medium">Validasi Tiket</p>
                <p className="text-sm text-gray-500">Sistem akan memvalidasi kode booking</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                3
              </div>
              <div>
                <p className="font-medium">Konfirmasi Penggunaan</p>
                <p className="text-sm text-gray-500">Tandai tiket sebagai sudah digunakan</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Settings View (will be expanded for payment methods)
  const renderSettings = () => (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pengaturan Vendor</h2>
          <p className="text-gray-500">Kelola pengaturan bisnis dan pembayaran</p>
        </div>
        <Button onClick={openCreatePaymentMethod} className="bg-blue-500 hover:bg-blue-600 shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Tambah Metode
        </Button>
      </div>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>Metode Pembayaran</CardTitle>
          <CardDescription>
            Atur metode pembayaran yang dapat dipilih pelanggan saat booking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentMethodError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{paymentMethodError}</AlertDescription>
            </Alert>
          )}

          {paymentMethodsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-600 font-medium">Belum ada metode pembayaran</p>
              <p className="text-gray-500 text-sm mt-1">Tambahkan rekening/QRIS/ewallet untuk menerima pembayaran</p>
              <Button onClick={openCreatePaymentMethod} className="mt-4 bg-blue-500 hover:bg-blue-600">
                <Plus className="mr-2 h-4 w-4" /> Tambah Metode
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((m) => (
                <div key={m.id} className="flex items-start justify-between gap-4 p-4 rounded-lg border border-gray-200 bg-white">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 truncate">{m.label}</p>
                      <Badge variant="outline" className="text-xs">
                        {m.type}
                      </Badge>
                      {!m.isActive && (
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                          Nonaktif
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-600 space-y-0.5">
                      {m.provider && <p>Provider: {m.provider}</p>}
                      {(m.accountName || m.accountNumber) && (
                        <p>
                          {m.accountName ? `${m.accountName} ` : ''}
                          {m.accountNumber ? `(${m.accountNumber})` : ''}
                        </p>
                      )}
                      {(m.qrString || m.qrImageUrl) && <p>QR: tersedia</p>}
                      {m.instructions && <p className="line-clamp-2">{m.instructions}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Aktif</span>
                      <Switch checked={m.isActive} onCheckedChange={() => togglePaymentMethodStatus(m.id, m.isActive)} />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openEditPaymentMethod(m)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => {
                        setDeleteId(m.id);
                        setDeleteType('paymentMethod');
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Kategori</CardTitle>
              <CardDescription>
                Admin dapat menambah kategori global. Anda juga bisa membuat kategori sendiri (tergantung paket).
              </CardDescription>
            </div>
            <Button onClick={() => openCreateCategory('EVENT')} className="bg-blue-500 hover:bg-blue-600 shrink-0">
              <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {categoryError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{categoryError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">Kategori Global</p>
              <div className="flex flex-wrap gap-2">
                {categories.filter((c) => c.ownerKey === 'GLOBAL' && c.type === 'EVENT' && c.isActive).length === 0 ? (
                  <span className="text-sm text-gray-500">Belum ada</span>
                ) : (
                  categories
                    .filter((c) => c.ownerKey === 'GLOBAL' && c.type === 'EVENT' && c.isActive)
                    .map((c) => (
                      <Badge key={c.id} variant="outline" className="text-xs">
                        {c.name}
                      </Badge>
                    ))
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">Kategori Vendor</p>
              <div className="space-y-2">
                {categories.filter((c) => c.ownerKey !== 'GLOBAL' && c.type === 'EVENT').length === 0 ? (
                  <span className="text-sm text-gray-500">Belum ada kategori vendor</span>
                ) : (
                  categories
                    .filter((c) => c.ownerKey !== 'GLOBAL' && c.type === 'EVENT')
                    .map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                          <p className="text-xs text-gray-500 truncate">{c.isActive ? 'Aktif' : 'Nonaktif'}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Switch checked={c.isActive} onCheckedChange={() => toggleCategoryActive(c)} />
                          <Button variant="outline" size="sm" onClick={() => openEditCategory(c)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle>
            <DialogDescription>
              Kategori ini akan muncul di form buat event/penginapan.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Tipe</Label>
              <Select value={categoryForm.type} onValueChange={(v) => setCategoryForm((p) => ({ ...p, type: v as any }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EVENT">Event</SelectItem>
                  <SelectItem value="ACCOMMODATION">Penginapan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Nama</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Contoh: Budaya / Pantai / Adventure"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)} disabled={categorySaving}>
              Batal
            </Button>
            <Button onClick={handleSaveCategory} className="bg-blue-500 hover:bg-blue-600" disabled={categorySaving || !categoryForm.name.trim()}>
              {categorySaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentMethodDialogOpen} onOpenChange={setPaymentMethodDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPaymentMethod ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'}</DialogTitle>
            <DialogDescription>
              Data ini akan ditampilkan ke pelanggan saat memilih pembayaran.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Jenis</Label>
              <Select value={paymentMethodForm.type} onValueChange={(v) => setPaymentMethodForm({ ...paymentMethodForm, type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK_TRANSFER">Transfer Bank</SelectItem>
                  <SelectItem value="EWALLET">E-Wallet</SelectItem>
                  <SelectItem value="QR_STATIC">QR Statis (QRIS)</SelectItem>
                  <SelectItem value="VA">Virtual Account</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Nama Metode</Label>
              <Input
                value={paymentMethodForm.label}
                onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, label: e.target.value })}
                placeholder="Contoh: BCA - Rekening Utama"
              />
            </div>

            {paymentMethodForm.type !== 'QR_STATIC' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Provider</Label>
                  <Input
                    value={paymentMethodForm.provider}
                    onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, provider: e.target.value })}
                    placeholder="Contoh: BCA / DANA"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Nomor</Label>
                  <Input
                    value={paymentMethodForm.accountNumber}
                    onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, accountNumber: e.target.value })}
                    placeholder="No rekening / no HP / no VA"
                  />
                </div>
              </div>
            )}

            {paymentMethodForm.type !== 'QR_STATIC' && (
              <div className="grid gap-2">
                <Label>Nama Pemilik</Label>
                <Input
                  value={paymentMethodForm.accountName}
                  onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, accountName: e.target.value })}
                  placeholder="Nama pemilik rekening/akun"
                />
              </div>
            )}

            {paymentMethodForm.type === 'QR_STATIC' && (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Upload Gambar QR (opsional)</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleQrImageUpload(e.target.files?.[0] || null)}
                  />
                  {paymentMethodForm.qrImageUrl && (
                    <div className="rounded-lg border border-gray-200 bg-white p-3 flex items-center justify-between gap-3">
                      <img
                        src={paymentMethodForm.qrImageUrl}
                        alt="Preview QR"
                        className="h-24 w-24 rounded object-contain border border-gray-200 bg-white"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-600"
                        onClick={() => setPaymentMethodForm({ ...paymentMethodForm, qrImageUrl: '' })}
                      >
                        Hapus QR
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Disimpan sebagai data URL untuk local testing. Produksi sebaiknya pakai storage.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label>QR String (opsional)</Label>
                  <Textarea
                    value={paymentMethodForm.qrString}
                    onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, qrString: e.target.value })}
                    placeholder="Tempel string QRIS (jika ada). Jika kosong, pelanggan tetap bisa lihat instruksi manual."
                    rows={4}
                  />
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Instruksi Pembayaran (opsional)</Label>
              <Textarea
                value={paymentMethodForm.instructions}
                onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, instructions: e.target.value })}
                placeholder="Contoh: Transfer sesuai nominal, lalu konfirmasi pembayaran."
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Urutan</Label>
                <Input
                  type="number"
                  value={paymentMethodForm.sortOrder}
                  onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, sortOrder: Number(e.target.value || 0) })}
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  checked={paymentMethodForm.isActive}
                  onCheckedChange={(v) => setPaymentMethodForm({ ...paymentMethodForm, isActive: v })}
                />
                <span className="text-sm text-gray-700">Aktif</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentMethodDialogOpen(false)} disabled={paymentMethodSaving}>
              Batal
            </Button>
            <Button onClick={handleSavePaymentMethod} className="bg-blue-500 hover:bg-blue-600" disabled={paymentMethodSaving}>
              {paymentMethodSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Render content based on active view
  const renderContent = () => {
    switch (activeView) {
      case 'events':
        return renderEvents();
      case 'tickets':
        return renderTickets();
      case 'bookings':
        return renderBookings();
      case 'accommodations':
        return <VendorAccommodationsPanel />;
      case 'qr-scanner':
        return renderQRScanner();
      case 'settings':
        return renderSettings();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showTabs && (
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="px-6">
            <Tabs value={activeView} onValueChange={(v) => setActiveView(v as ViewType)}>
              <TabsList className="bg-transparent h-14">
                <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
                  <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                </TabsTrigger>
                <TabsTrigger value="events" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
                  <Calendar className="h-4 w-4 mr-2" /> Event
                </TabsTrigger>
                <TabsTrigger value="tickets" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
                  <Ticket className="h-4 w-4 mr-2" /> Tiket
                </TabsTrigger>
                <TabsTrigger value="accommodations" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
                  <Package className="h-4 w-4 mr-2" /> Penginapan
                </TabsTrigger>
                <TabsTrigger value="bookings" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
                  <Bookmark className="h-4 w-4 mr-2" /> Booking
                </TabsTrigger>
                <TabsTrigger value="qr-scanner" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
                  <QrCode className="h-4 w-4 mr-2" /> QR Scanner
                </TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
                  <Settings className="h-4 w-4 mr-2" /> Pengaturan
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6">
        {renderContent()}
      </div>

      {/* Event Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedEvent ? 'Edit Event' : 'Buat Event Baru'}</DialogTitle>
            <DialogDescription>
              Isi informasi event wisata Anda
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nama Event *</Label>
              <Input
                id="name"
                value={eventForm.name}
                onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                placeholder="Nama event wisata"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="Deskripsi event"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label>Gambar / Flyer (opsional)</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleEventImagesUpload(e.target.files)}
              />
              {eventForm.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {eventForm.images.map((src, idx) => (
                    <div key={idx} className="relative rounded-lg border border-gray-200 bg-white overflow-hidden">
                      <img src={src} alt={`Event ${idx + 1}`} className="h-24 w-full object-cover" />
                      <button
                        type="button"
                        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center hover:bg-white"
                        onClick={() => removeEventImageAt(idx)}
                        aria-label="Hapus gambar"
                      >
                        <X className="h-4 w-4 text-gray-700" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500">
                Local testing: gambar disimpan sebagai data URL (tidak direkomendasikan untuk produksi).
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="category">Kategori *</Label>
                <Select
                  value={eventForm.category}
                  onValueChange={(v) => setEventForm({ ...eventForm, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      categories.filter((c) => c.type === 'EVENT' && c.isActive).map((c) => c.name)
                        .concat(EVENT_CATEGORIES)
                        // de-dupe while keeping order (DB first)
                        .filter((v, i, a) => a.indexOf(v) === i)
                    ).map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">Kota</Label>
                <Input
                  id="city"
                  value={eventForm.city}
                  onChange={(e) => setEventForm({ ...eventForm, city: e.target.value })}
                  placeholder="Nama kota"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Alamat</Label>
              <Input
                id="address"
                value={eventForm.address}
                onChange={(e) => setEventForm({ ...eventForm, address: e.target.value })}
                placeholder="Alamat lengkap"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="validFrom">Tanggal Mulai *</Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={eventForm.validFrom}
                  onChange={(e) => setEventForm({ ...eventForm, validFrom: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="validUntil">Tanggal Selesai *</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={eventForm.validUntil}
                  onChange={(e) => setEventForm({ ...eventForm, validUntil: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="min-w-0">
                <Label htmlFor="isFeatured" className="font-semibold text-gray-900">
                  Featured
                </Label>
                <p className="text-xs text-gray-600 mt-0.5">
                  Jika aktif, event akan muncul di bagian rekomendasi/populer.
                </p>
              </div>
              <Switch
                id="isFeatured"
                checked={eventForm.isFeatured}
                onCheckedChange={(v) => setEventForm({ ...eventForm, isFeatured: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSaveEvent} className="bg-blue-500 hover:bg-blue-600">
              {selectedEvent ? 'Simpan Perubahan' : 'Buat Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket Dialog */}
      <Dialog open={ticketDialogOpen} onOpenChange={setTicketDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTicket ? 'Edit Tiket' : 'Buat Tiket Baru'}</DialogTitle>
            <DialogDescription>
              Isi informasi tiket untuk event Anda
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="ticket-name">Nama Tiket *</Label>
              <Input
                id="ticket-name"
                value={ticketForm.name}
                onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                placeholder="Nama tiket"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ticket-description">Deskripsi</Label>
              <Textarea
                id="ticket-description"
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                placeholder="Deskripsi tiket"
                rows={2}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="ticket-event">Event</Label>
                <Select
                  value={ticketForm.eventId}
                  onValueChange={(v) => setTicketForm({ ...ticketForm, eventId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih event (opsional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ticket-type">Tipe Tiket *</Label>
                <Select
                  value={ticketForm.type}
                  onValueChange={(v) => setTicketForm({ ...ticketForm, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADULT">Dewasa</SelectItem>
                    <SelectItem value="CHILD">Anak-anak</SelectItem>
                    <SelectItem value="SENIOR">Lansia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="price">Harga (Rp) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={ticketForm.price}
                  onChange={(e) => setTicketForm({ ...ticketForm, price: e.target.value })}
                  placeholder="50000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="discountPrice">Harga Diskon (Rp)</Label>
                <Input
                  id="discountPrice"
                  type="number"
                  value={ticketForm.discountPrice}
                  onChange={(e) => setTicketForm({ ...ticketForm, discountPrice: e.target.value })}
                  placeholder="40000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quota">Quota *</Label>
                <Input
                  id="quota"
                  type="number"
                  value={ticketForm.quota}
                  onChange={(e) => setTicketForm({ ...ticketForm, quota: e.target.value })}
                  placeholder="100"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="ticket-validFrom">Berlaku Dari *</Label>
                <Input
                  id="ticket-validFrom"
                  type="date"
                  value={ticketForm.validFrom}
                  onChange={(e) => setTicketForm({ ...ticketForm, validFrom: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ticket-validUntil">Berlaku Sampai *</Label>
                <Input
                  id="ticket-validUntil"
                  type="date"
                  value={ticketForm.validUntil}
                  onChange={(e) => setTicketForm({ ...ticketForm, validUntil: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTicketDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSaveTicket} className="bg-blue-500 hover:bg-blue-600">
              {selectedTicket ? 'Simpan Perubahan' : 'Buat Tiket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Detail Dialog */}
      <Dialog open={bookingDetailOpen} onOpenChange={setBookingDetailOpen}>
        <DialogContent className="max-w-2xl bg-white shadow-2xl border border-gray-200">
          <DialogHeader>
            <DialogTitle>Detail Booking</DialogTitle>
            <DialogDescription>
              Informasi lengkap booking pelanggan
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div>
                  <p className="text-sm text-gray-500">Kode Booking</p>
                  <p className="font-mono font-bold text-lg">{selectedBooking.bookingCode}</p>
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(selectedBooking.status)}
                  {getStatusBadge(selectedBooking.paymentStatus)}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div>
                  <p className="text-sm text-gray-500">Nama Pelanggan</p>
                  <p className="font-medium">{selectedBooking.user.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedBooking.user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Telepon</p>
                  <p className="font-medium">{selectedBooking.user.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Event</p>
                  <p className="font-medium">{selectedBooking.event?.name || '-'}</p>
                </div>
              </div>

              <Separator />

              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <p className="text-sm text-gray-500 mb-2">Item Tiket</p>
                <div className="space-y-2">
                  {selectedBooking.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.ticket.name}</p>
                        <p className="text-sm text-gray-500">{getTicketTypeLabel(item.ticket.type)} x {item.quantity}</p>
                      </div>
                      <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(selectedBooking.totalAmount)}</span>
                </div>
                {selectedBooking.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Diskon</span>
                    <span>-{formatCurrency(selectedBooking.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-orange-600">{formatCurrency(selectedBooking.finalAmount)}</span>
                </div>
              </div>

              {selectedBooking.notes && (
                <div>
                  <p className="text-sm text-gray-500">Catatan</p>
                  <p className="text-sm bg-gray-50 p-2 rounded">{selectedBooking.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              {selectedBooking.status === 'PENDING' && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => updateBookingStatus(selectedBooking.id, 'CANCELLED')}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Batalkan
                  </Button>
                  <Button
                    className="flex-1 bg-blue-500 hover:bg-blue-600"
                    onClick={() => updateBookingStatus(selectedBooking.id, 'CONFIRMED')}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Konfirmasi
                  </Button>
                </div>
              )}

              {selectedBooking.status === 'CONFIRMED' && selectedBooking.paymentStatus === 'UNPAID' && (
                <Button
                  className="w-full bg-green-500 hover:bg-green-600"
                  onClick={() => updateBookingStatus(selectedBooking.id, 'PAID', 'PAID')}
                >
                  <DollarSign className="mr-2 h-4 w-4" /> Tandai Sudah Dibayar
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stay Booking Detail Dialog */}
      <Dialog open={stayDetailOpen} onOpenChange={setStayDetailOpen}>
        <DialogContent className="max-w-2xl bg-white shadow-2xl border border-gray-200">
          <DialogHeader>
            <DialogTitle>Detail Booking Penginapan</DialogTitle>
            <DialogDescription>Informasi lengkap booking penginapan pelanggan</DialogDescription>
          </DialogHeader>
          {selectedStayBooking && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div>
                  <p className="text-sm text-gray-500">Kode Booking</p>
                  <p className="font-mono font-bold text-lg">{selectedStayBooking.bookingCode}</p>
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(selectedStayBooking.status)}
                  {getStatusBadge(selectedStayBooking.paymentStatus)}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div>
                  <p className="text-sm text-gray-500">Nama Tamu</p>
                  <p className="font-medium">{selectedStayBooking.guestName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedStayBooking.guestEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Telepon</p>
                  <p className="font-medium">{selectedStayBooking.guestPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tamu</p>
                  <p className="font-medium">{selectedStayBooking.guests} orang</p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div>
                  <p className="text-sm text-gray-500">Penginapan</p>
                  <p className="font-medium">{selectedStayBooking.accommodation.name}</p>
                  <p className="text-xs text-gray-500">{selectedStayBooking.accommodation.city || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Kamar</p>
                  <p className="font-medium">{selectedStayBooking.room?.name || '-'}</p>
                  <p className="text-xs text-gray-500">Kapasitas {selectedStayBooking.room?.capacity || '-'} orang</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Check-in</p>
                  <p className="font-medium">{formatDate(selectedStayBooking.checkIn)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Check-out</p>
                  <p className="font-medium">{formatDate(selectedStayBooking.checkOut)}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Durasi</span>
                  <span>{selectedStayBooking.nights} malam</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(selectedStayBooking.totalAmount)}</span>
                </div>
                {selectedStayBooking.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Diskon</span>
                    <span>-{formatCurrency(selectedStayBooking.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-orange-600">{formatCurrency(selectedStayBooking.finalAmount)}</span>
                </div>
              </div>

              {selectedStayBooking.notes && (
                <div>
                  <p className="text-sm text-gray-500">Catatan</p>
                  <p className="text-sm bg-gray-50 p-2 rounded">{selectedStayBooking.notes}</p>
                </div>
              )}

              {/* Action Buttons (manual validation by vendor) */}
              {selectedStayBooking.status === 'PENDING' && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => updateStayBookingStatus(selectedStayBooking.id, 'CANCELLED')}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Batalkan
                  </Button>
                  <Button
                    className="flex-1 bg-blue-500 hover:bg-blue-600"
                    onClick={() => updateStayBookingStatus(selectedStayBooking.id, 'CONFIRMED')}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Konfirmasi
                  </Button>
                </div>
              )}

              {selectedStayBooking.status === 'CONFIRMED' && selectedStayBooking.paymentStatus === 'UNPAID' && (
                <Button
                  className="w-full bg-green-500 hover:bg-green-600"
                  onClick={() => updateStayBookingStatus(selectedStayBooking.id, 'PAID', 'PAID')}
                >
                  <DollarSign className="mr-2 h-4 w-4" /> Tandai Sudah Dibayar
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus {deleteType === 'event' ? 'event' : 'tiket'} ini?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default VendorDashboard;
