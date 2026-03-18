'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, formatShortDate, getInitials, cn, EVENT_CATEGORIES } from '@/lib/utils';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminCategoriesPanel from '@/components/admin/admin-categories-panel';
import AdminSubscriptionPlansPanel from '@/components/admin/admin-subscription-plans-panel';

// Icons
import {
  Users,
  Store,
  Calendar,
  Ticket,
  Receipt,
  TrendingUp,
  DollarSign,
  MoreHorizontal,
  Search,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Star,
  RefreshCw,
  Loader2,
  AlertCircle,
  BarChart3,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Tags,
  Layers,
} from 'lucide-react';

// Types
type ViewType = 'dashboard' | 'users' | 'vendors' | 'events' | 'tickets' | 'bookings' | 'categories' | 'subscriptions';

interface AdminStats {
  totalUsers: number;
  totalVendors: number;
  totalEvents: number;
  totalTickets: number;
  totalBookings: number;
  totalRevenue: number;
}

interface RecentBooking {
  id: string;
  bookingCode: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  user: { name: string; email: string };
  event: { name: string } | null;
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface TopEvent {
  id: string;
  name: string;
  totalSales: number;
  rating: number;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  vendor?: {
    id: string;
    businessName: string;
    isVerified: boolean;
  } | null;
}

interface VendorData {
  id: string;
  subscriptionPlanId?: string | null;
  subscriptionPlan?: { id: string; name: string } | null;
  businessName: string;
  description?: string;
  logo?: string;
  isVerified: boolean;
  isActive: boolean;
  subscriptionStatus: string;
  subscriptionEndsAt?: string | null;
  rating: number;
  totalReviews: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    isActive: boolean;
  };
  _count?: {
    events: number;
    tickets: number;
  };
}

interface EventData {
  id: string;
  name: string;
  slug: string;
  category: string;
  rating: number;
  totalReviews: number;
  totalSales: number;
  isActive: boolean;
  isFeatured: boolean;
  validFrom: string;
  validUntil: string;
  createdAt: string;
  vendor: {
    id: string;
    businessName: string;
    user: { name: string };
  };
  images: string;
}

interface TicketData {
  id: string;
  name: string;
  sku: string;
  type: string;
  price: number;
  discountPrice?: number;
  quota: number;
  sold: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  createdAt: string;
  event: {
    id: string;
    name: string;
    category: string;
  } | null;
  vendor: {
    id: string;
    businessName: string;
  };
}

interface BookingData {
  id: string;
  bookingCode: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod?: string;
  paymentDeadline?: string;
  notes?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  event: {
    id: string;
    name: string;
    category: string;
  } | null;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    subtotal: number;
    ticket: {
      id: string;
      name: string;
      type: string;
    };
  }>;
}

interface AdminDashboardProps {
  view?: ViewType;
}

// Mobile-friendly stat card
function StatCard({ title, value, icon, color = 'blue' }: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs md:text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-lg md:text-2xl font-bold mt-1 truncate">{value}</p>
          </div>
          <div className={`h-10 w-10 md:h-12 md:w-12 rounded-lg flex items-center justify-center shrink-0 ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Status badge helper
function getStatusBadge(status: string) {
  const statusConfig: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PAID: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-gray-100 text-gray-800',
    USED: 'bg-purple-100 text-purple-800',
  };
  return <Badge className={statusConfig[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
}

// Role badge helper
function getRoleBadge(role: string) {
  const roleConfig: Record<string, string> = {
    ADMIN: 'bg-red-100 text-red-800',
    VENDOR: 'bg-orange-100 text-orange-800',
    USER: 'bg-blue-100 text-blue-800',
  };
  return <Badge className={roleConfig[role] || 'bg-gray-100 text-gray-800'}>{role}</Badge>;
}

// Ticket type badge helper
function getTicketTypeBadge(type: string) {
  const typeConfig: Record<string, { label: string; color: string }> = {
    ADULT: { label: 'Dewasa', color: 'bg-blue-100 text-blue-800' },
    CHILD: { label: 'Anak-anak', color: 'bg-green-100 text-green-800' },
    SENIOR: { label: 'Lansia', color: 'bg-purple-100 text-purple-800' },
  };
  const config = typeConfig[type] || { label: type, color: 'bg-gray-100 text-gray-800' };
  return <Badge className={config.color}>{config.label}</Badge>;
}

export default function AdminDashboard({ view = 'dashboard' }: AdminDashboardProps) {
  const { token } = useAuthStore();
  const [activeView, setActiveView] = useState<ViewType>(view);
  const [error, setError] = useState<string | null>(null);
  
  // Dashboard state
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [topEvents, setTopEvents] = useState<TopEvent[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  
  // Users state
  const [users, setUsers] = useState<UserData[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  
  // Vendors state
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorVerifiedFilter, setVendorVerifiedFilter] = useState<string>('all');

  // Subscription plans (for assigning to vendors)
  const [plans, setPlans] = useState<Array<{ id: string; name: string; isActive: boolean }>>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [planTargetVendor, setPlanTargetVendor] = useState<VendorData | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  
  // Events state
  const [events, setEvents] = useState<EventData[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventCategoryFilter, setEventCategoryFilter] = useState<string>('all');
  const [eventStatusFilter, setEventStatusFilter] = useState<string>('all');
  
  // Tickets state
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketTypeFilter, setTicketTypeFilter] = useState<string>('all');
  
  // Bookings state
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('all');
  
  // Dialog states
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<VendorData | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    setDashboardLoading(true);
    setError(null);
    
    try {
      const response = await api.get<{
        role: string;
        stats: AdminStats;
        recentBookings: RecentBooking[];
        recentUsers: RecentUser[];
        topEvents: TopEvent[];
      }>('/dashboard');
      
      if (response.success && response.data) {
        setStats(response.data.stats);
        setRecentBookings(response.data.recentBookings || []);
        setRecentUsers(response.data.recentUsers || []);
        setTopEvents(response.data.topEvents || []);
      } else {
        setError(response.error || 'Gagal memuat data dashboard');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan');
    }
    setDashboardLoading(false);
  }, [token]);
  
  // Fetch users
  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setUsersLoading(true);
    
    try {
      const params = new URLSearchParams();
      if (userRoleFilter && userRoleFilter !== 'all') params.append('role', userRoleFilter);
      if (userSearch) params.append('search', userSearch);
      
      const response = await api.get<UserData[]>(`/users?${params.toString()}`);
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    }
    setUsersLoading(false);
  }, [token, userRoleFilter, userSearch]);
  
  // Fetch vendors
  const fetchVendors = useCallback(async () => {
    if (!token) return;
    setVendorsLoading(true);
    
    try {
      const params = new URLSearchParams();
      if (vendorVerifiedFilter && vendorVerifiedFilter !== 'all') params.append('isVerified', vendorVerifiedFilter);
      
      const response = await api.get<VendorData[]>(`/vendors?${params.toString()}`);
      if (response.success && response.data) {
        setVendors(response.data);
      }
    } catch (err) {
      console.error('Fetch vendors error:', err);
    }
    setVendorsLoading(false);
  }, [token, vendorVerifiedFilter]);

  const fetchPlans = useCallback(async () => {
    if (!token) return;
    setPlansLoading(true);
    try {
      const response = await api.get<Array<{ id: string; name: string; isActive: boolean }>>('/admin/subscription-plans');
      if (response.success && response.data) {
        setPlans(response.data.filter((p) => p.isActive));
      }
    } catch (err) {
      console.error('Fetch plans error:', err);
    }
    setPlansLoading(false);
  }, [token]);
  
  // Fetch events
  const fetchEvents = useCallback(async () => {
    if (!token) return;
    setEventsLoading(true);
    
    try {
      const params = new URLSearchParams();
      params.append('isActive', 'all');
      params.append('limit', '100');
      if (eventCategoryFilter && eventCategoryFilter !== 'all') {
        params.append('category', eventCategoryFilter);
      }
      
      const response = await api.get<{ events: EventData[] } | EventData[]>(`/events?${params.toString()}`);
      if (response.success && response.data) {
        let data = Array.isArray(response.data) ? response.data : response.data.events || [];
        
        // Client-side filtering for status
        if (eventStatusFilter === 'active') {
          data = data.filter(e => e.isActive);
        } else if (eventStatusFilter === 'inactive') {
          data = data.filter(e => !e.isActive);
        } else if (eventStatusFilter === 'featured') {
          data = data.filter(e => e.isFeatured);
        }
        
        setEvents(data);
      }
    } catch (err) {
      console.error('Fetch events error:', err);
    }
    setEventsLoading(false);
  }, [token, eventCategoryFilter, eventStatusFilter]);
  
  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    if (!token) return;
    setTicketsLoading(true);
    
    try {
      const params = new URLSearchParams();
      params.append('includeInactive', 'true');
      
      const response = await api.get<TicketData[]>(`/tickets?${params.toString()}`);
      if (response.success && response.data) {
        let data = response.data;
        if (ticketTypeFilter && ticketTypeFilter !== 'all') {
          data = data.filter(t => t.type === ticketTypeFilter);
        }
        setTickets(data);
      }
    } catch (err) {
      console.error('Fetch tickets error:', err);
    }
    setTicketsLoading(false);
  }, [token, ticketTypeFilter]);
  
  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    if (!token) return;
    setBookingsLoading(true);
    
    try {
      const params = new URLSearchParams();
      if (bookingStatusFilter && bookingStatusFilter !== 'all') params.append('status', bookingStatusFilter);
      
      const response = await api.get<BookingData[]>(`/bookings?${params.toString()}`);
      if (response.success && response.data) {
        setBookings(response.data);
      }
    } catch (err) {
      console.error('Fetch bookings error:', err);
    }
    setBookingsLoading(false);
  }, [token, bookingStatusFilter]);
  
  // Update user status
  const handleUpdateUserStatus = async (userId: string, isActive: boolean) => {
    if (!token) return;
    setActionLoading(true);
    const response = await api.put(`/users/${userId}`, { isActive });
    if (response.success) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive } : u));
    }
    setActionLoading(false);
  };
  
  // Update vendor verification
  const handleUpdateVendorVerification = async (vendorId: string, isVerified: boolean) => {
    if (!token) return;
    setActionLoading(true);
    const response = await api.put(`/vendors/${vendorId}`, { isVerified });
    if (response.success) {
      setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, isVerified } : v));
    }
    setActionLoading(false);
  };

  const handleUpdateVendorSubscription = async (vendorId: string, isActive: boolean) => {
    if (!token) return;
    setActionLoading(true);
    const response = await api.put(`/admin/vendors/${vendorId}/subscription`, {
      isActive,
      subscriptionStatus: isActive ? 'ACTIVE' : 'INACTIVE',
      subscriptionEndsAt: null,
    });
    if (response.success) {
      setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, isActive, subscriptionStatus: isActive ? 'ACTIVE' : 'INACTIVE', subscriptionEndsAt: null } : v));
    }
    setActionLoading(false);
  };

  const handleUpdateVendorPlan = async (vendorId: string, planId: string | null) => {
    if (!token) return;
    setActionLoading(true);
    const response = await api.put(`/admin/vendors/${vendorId}/subscription`, {
      subscriptionPlanId: planId,
    });
    if (response.success && response.data) {
      setVendors((prev) =>
        prev.map((v) =>
          v.id === vendorId
            ? (() => {
                const plan = planId ? plans.find((p) => p.id === planId) : null;
                return {
                  ...v,
                  subscriptionPlanId: planId,
                  subscriptionPlan: plan ? { id: plan.id, name: plan.name } : null,
                };
              })()
            : v
        )
      );
    }
    setActionLoading(false);
  };
  
  // Confirm payment for booking
  const handleConfirmPayment = async (bookingId: string) => {
    if (!token) return;
    setActionLoading(true);
    const response = await api.post(`/bookings/${bookingId}/payment`, { confirm: 'true' });
    if (response.success) {
      // Refresh bookings
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status: 'PAID', paymentStatus: 'PAID' } : b
      ));
    }
    setActionLoading(false);
  };
  
  // Update event
  const handleUpdateEvent = async (eventId: string, data: Record<string, string | boolean>) => {
    if (!token) return;
    setActionLoading(true);
    const response = await api.put(`/events/${eventId}`, data);
    if (response.success) {
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, ...data } : e));
    }
    setActionLoading(false);
  };
  
  // Delete entity
  const handleDelete = async () => {
    if (!deleteTarget || !token) return;
    setActionLoading(true);
    
    const response = await api.delete(`/${deleteTarget.type}/${deleteTarget.id}`);
    if (response.success) {
      if (deleteTarget.type === 'users') {
        setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
      } else if (deleteTarget.type === 'vendors') {
        setVendors(prev => prev.filter(v => v.id !== deleteTarget.id));
      } else if (deleteTarget.type === 'events') {
        setEvents(prev => prev.filter(e => e.id !== deleteTarget.id));
      } else if (deleteTarget.type === 'tickets') {
        setTickets(prev => prev.filter(t => t.id !== deleteTarget.id));
      }
    }
    setActionLoading(false);
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  // Fetch data when view changes
  useEffect(() => {
    const fetchData = async () => {
      if (activeView === 'dashboard') {
        await fetchDashboardData();
      } else if (activeView === 'users') {
        await fetchUsers();
      } else if (activeView === 'vendors') {
        await Promise.all([fetchVendors(), fetchPlans()]);
      } else if (activeView === 'events') {
        await fetchEvents();
      } else if (activeView === 'tickets') {
        await fetchTickets();
      } else if (activeView === 'bookings') {
        await fetchBookings();
      }
    };
    void fetchData();
  }, [activeView, fetchDashboardData, fetchUsers, fetchVendors, fetchPlans, fetchEvents, fetchTickets, fetchBookings]);

  // Navigation tabs for mobile
  const navItems = [
    { view: 'dashboard' as ViewType, label: 'Dashboard', icon: <BarChart3 className="h-4 w-4" /> },
    { view: 'users' as ViewType, label: 'User', icon: <Users className="h-4 w-4" /> },
    { view: 'vendors' as ViewType, label: 'Vendor', icon: <Store className="h-4 w-4" /> },
    { view: 'events' as ViewType, label: 'Event', icon: <Calendar className="h-4 w-4" /> },
    { view: 'tickets' as ViewType, label: 'Tiket', icon: <Ticket className="h-4 w-4" /> },
    { view: 'bookings' as ViewType, label: 'Booking', icon: <Receipt className="h-4 w-4" /> },
    { view: 'categories' as ViewType, label: 'Kategori', icon: <Tags className="h-4 w-4" /> },
    { view: 'subscriptions' as ViewType, label: 'Paket', icon: <Layers className="h-4 w-4" /> },
  ];

  // Render dashboard view
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {dashboardLoading ? (
          Array(5).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 md:p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={<Users className="h-5 w-5 md:h-6 md:w-6" />} color="blue" />
            <StatCard title="Total Vendors" value={stats?.totalVendors || 0} icon={<Store className="h-5 w-5 md:h-6 md:w-6" />} color="orange" />
            <StatCard title="Total Events" value={stats?.totalEvents || 0} icon={<Calendar className="h-5 w-5 md:h-6 md:w-6" />} color="green" />
            <StatCard title="Total Bookings" value={stats?.totalBookings || 0} icon={<Receipt className="h-5 w-5 md:h-6 md:w-6" />} color="purple" />
            <StatCard title="Total Revenue" value={formatCurrency(stats?.totalRevenue || 0)} icon={<DollarSign className="h-5 w-5 md:h-6 md:w-6" />} color="green" />
          </>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Booking Terbaru</CardTitle>
            <CardDescription>5 booking terakhir</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            {dashboardLoading ? (
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada booking
              </div>
            ) : (
              <ScrollArea className="h-[280px] md:h-[300px]">
                <div className="space-y-3 pr-4">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar className="h-9 w-9 md:h-10 md:w-10 shrink-0">
                          <AvatarFallback className="text-xs md:text-sm">{getInitials(booking.user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm md:text-base truncate">{booking.user.name}</p>
                          <p className="text-xs md:text-sm text-muted-foreground truncate">{booking.event?.name || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="font-medium text-sm">{formatCurrency(booking.totalAmount)}</p>
                        {getStatusBadge(booking.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
        
        {/* Recent Users */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">User Terbaru</CardTitle>
            <CardDescription>5 user terdaftar terakhir</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            {dashboardLoading ? (
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada user
              </div>
            ) : (
              <ScrollArea className="h-[280px] md:h-[300px]">
                <div className="space-y-3 pr-4">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar className="h-9 w-9 md:h-10 md:w-10 shrink-0">
                          <AvatarFallback className="text-xs md:text-sm">{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm md:text-base truncate">{user.name}</p>
                          <p className="text-xs md:text-sm text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {getRoleBadge(user.role)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Top Events */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Event Terpopuler
          </CardTitle>
          <CardDescription>5 event dengan penjualan tertinggi</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          {dashboardLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : topEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada event
            </div>
          ) : (
            <div className="space-y-2">
              {topEvents.map((event, index) => (
                <div key={event.id} className="flex items-center justify-between p-3 rounded border bg-card">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="font-bold text-[#2196F3] text-sm md:text-base shrink-0">#{index + 1}</span>
                    <span className="font-medium text-sm md:text-base truncate">{event.name}</span>
                  </div>
                  <div className="flex items-center gap-2 md:gap-4 shrink-0">
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 md:h-4 md:w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs md:text-sm">{event.rating.toFixed(1)}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{event.totalSales} terjual</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Render users table
  const renderUsersTable = () => (
    <Card>
      <CardHeader className="p-4 md:p-6">
        <div className="flex flex-col gap-4">
          <div>
            <CardTitle className="text-base md:text-lg">Manajemen User</CardTitle>
            <CardDescription>Kelola semua user terdaftar</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari user..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Semua Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Role</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="VENDOR">Vendor</SelectItem>
                <SelectItem value="USER">User</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => fetchUsers()} disabled={usersLoading}>
              {usersLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">
        {usersLoading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Tidak ada user ditemukan
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">User</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Terdaftar</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 md:h-10 md:w-10">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="text-xs md:text-sm">{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground sm:hidden truncate">{user.email}</p>
                          {user.vendor && (
                            <p className="text-xs text-muted-foreground hidden md:block truncate">{user.vendor.businessName}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm truncate max-w-[150px]">{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {user.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{formatShortDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedUser(user); setShowUserDialog(true); }}>
                            <Eye className="h-4 w-4 mr-2" />
                            Lihat Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleUpdateUserStatus(user.id, !user.isActive)}
                            disabled={actionLoading}
                          >
                            {user.isActive ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Nonaktifkan
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Aktifkan
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => { setDeleteTarget({ type: 'users', id: user.id }); setDeleteConfirmOpen(true); }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render vendors table
  const renderVendorsTable = () => (
    <>
    <Card>
      <CardHeader className="p-4 md:p-6">
        <div className="flex flex-col gap-4">
          <div>
            <CardTitle className="text-base md:text-lg">Manajemen Vendor</CardTitle>
            <CardDescription>Kelola semua vendor terdaftar</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={vendorVerifiedFilter} onValueChange={setVendorVerifiedFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="true">Terverifikasi</SelectItem>
                <SelectItem value="false">Belum Verifikasi</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => fetchVendors()} disabled={vendorsLoading}>
              {vendorsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">
        {vendorsLoading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Tidak ada vendor ditemukan
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Vendor</TableHead>
                  <TableHead className="hidden md:table-cell">Pemilik</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Subscription</TableHead>
                  <TableHead className="hidden lg:table-cell">Event/Tiket</TableHead>
                  <TableHead className="hidden sm:table-cell">Rating</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 md:h-10 md:w-10">
                          <AvatarImage src={vendor.logo} />
                          <AvatarFallback className="text-xs md:text-sm">{getInitials(vendor.businessName)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{vendor.businessName}</p>
                          <p className="text-xs text-muted-foreground md:hidden truncate">{vendor.user.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{vendor.user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{vendor.user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge className={vendor.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {vendor.isVerified ? 'Terverifikasi' : 'Belum'}
                        </Badge>
                        <Badge className={vendor.isActive && vendor.subscriptionStatus === 'ACTIVE' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}>
                          {vendor.isActive && vendor.subscriptionStatus === 'ACTIVE' ? 'Subscription Aktif' : 'Subscription Nonaktif'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Paket: {vendor.subscriptionPlan?.name || '-'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center justify-end gap-2">
                        <Switch
                          checked={vendor.isActive && vendor.subscriptionStatus === 'ACTIVE'}
                          onCheckedChange={(checked) => handleUpdateVendorSubscription(vendor.id, checked)}
                          disabled={actionLoading}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">{vendor._count?.events || 0} Event</Badge>
                        <Badge variant="outline" className="text-xs">{vendor._count?.tickets || 0} Tiket</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{vendor.rating.toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedVendor(vendor); setShowVendorDialog(true); }}>
                            <Eye className="h-4 w-4 mr-2" />
                            Lihat Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setPlanTargetVendor(vendor);
                              setSelectedPlanId(vendor.subscriptionPlanId || '');
                              setPlanDialogOpen(true);
                            }}
                            disabled={plansLoading}
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Ubah Paket
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleUpdateVendorVerification(vendor.id, !vendor.isVerified)}
                            disabled={actionLoading}
                          >
                            {vendor.isVerified ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Batalkan Verifikasi
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Verifikasi
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateVendorSubscription(vendor.id, !(vendor.isActive && vendor.subscriptionStatus === 'ACTIVE'))}
                            disabled={actionLoading}
                          >
                            {vendor.isActive && vendor.subscriptionStatus === 'ACTIVE' ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Nonaktifkan Subscription
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Aktifkan Subscription
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => { setDeleteTarget({ type: 'vendors', id: vendor.id }); setDeleteConfirmOpen(true); }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>

    <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ubah Paket Vendor</DialogTitle>
          <DialogDescription>
            {planTargetVendor ? `Vendor: ${planTargetVendor.businessName}` : 'Pilih paket untuk vendor.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 py-2">
          <Label>Paket</Label>
          <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
            <SelectTrigger>
              <SelectValue placeholder={plansLoading ? 'Memuat...' : 'Pilih paket'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tanpa Paket (unlimited)</SelectItem>
              {plans.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setPlanDialogOpen(false)} disabled={actionLoading}>
            Batal
          </Button>
          <Button
            onClick={() => {
              if (!planTargetVendor) return;
              void handleUpdateVendorPlan(planTargetVendor.id, selectedPlanId || null);
              setPlanDialogOpen(false);
            }}
            className="bg-blue-500 hover:bg-blue-600"
            disabled={actionLoading}
          >
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );

  // Render events table
  const renderEventsTable = () => (
    <Card>
      <CardHeader className="p-4 md:p-6">
        <div className="flex flex-col gap-4">
          <div>
            <CardTitle className="text-base md:text-lg">Manajemen Event</CardTitle>
            <CardDescription>Kelola semua event</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={eventCategoryFilter} onValueChange={setEventCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {EVENT_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={eventStatusFilter} onValueChange={setEventStatusFilter}>
              <SelectTrigger className="w-full sm:w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Nonaktif</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => fetchEvents()} disabled={eventsLoading}>
              {eventsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">
        {eventsLoading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Tidak ada event ditemukan
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Event</TableHead>
                  <TableHead className="hidden md:table-cell">Kategori</TableHead>
                  <TableHead className="hidden lg:table-cell">Vendor</TableHead>
                  <TableHead className="hidden sm:table-cell">Penjualan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-muted overflow-hidden shrink-0">
                          {event.images ? (
                            <img 
                              src={JSON.parse(event.images)[0] || '/placeholder.jpg'} 
                              alt={event.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Calendar className="h-5 w-5 m-auto text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{event.name}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{event.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{event.category}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <p className="text-sm truncate max-w-[120px]">{event.vendor.businessName}</p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary">{event.totalSales} terjual</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col sm:flex-row gap-1">
                        {event.isFeatured && <Badge className="bg-[#FF9800] text-white text-xs">Featured</Badge>}
                        <Badge className={event.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {event.isActive ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedEvent(event); setShowEventDialog(true); }}>
                            <Eye className="h-4 w-4 mr-2" />
                            Lihat Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateEvent(event.id, { isFeatured: !event.isFeatured })}>
                            {event.isFeatured ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Unfeature
                              </>
                            ) : (
                              <>
                                <Star className="h-4 w-4 mr-2" />
                                Feature
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateEvent(event.id, { isActive: !event.isActive })}>
                            {event.isActive ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Nonaktifkan
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Aktifkan
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => { setDeleteTarget({ type: 'events', id: event.id }); setDeleteConfirmOpen(true); }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render tickets table
  const renderTicketsTable = () => (
    <Card>
      <CardHeader className="p-4 md:p-6">
        <div className="flex flex-col gap-4">
          <div>
            <CardTitle className="text-base md:text-lg">Manajemen Tiket</CardTitle>
            <CardDescription>Kelola semua tiket</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={ticketTypeFilter} onValueChange={setTicketTypeFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Tipe Tiket" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="ADULT">Dewasa</SelectItem>
                <SelectItem value="CHILD">Anak-anak</SelectItem>
                <SelectItem value="SENIOR">Lansia</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => fetchTickets()} disabled={ticketsLoading}>
              {ticketsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">
        {ticketsLoading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Tidak ada tiket ditemukan
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Tiket</TableHead>
                  <TableHead className="hidden md:table-cell">Event</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead className="hidden sm:table-cell">Kuota</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{ticket.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{ticket.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <p className="text-sm truncate max-w-[120px]">{ticket.event?.name || 'N/A'}</p>
                    </TableCell>
                    <TableCell>{getTicketTypeBadge(ticket.type)}</TableCell>
                    <TableCell>
                      <div>
                        {ticket.discountPrice ? (
                          <>
                            <p className="text-sm font-medium text-[#FF9800]">{formatCurrency(ticket.discountPrice)}</p>
                            <p className="text-xs text-muted-foreground line-through">{formatCurrency(ticket.price)}</p>
                          </>
                        ) : (
                          <p className="text-sm font-medium">{formatCurrency(ticket.price)}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="w-20">
                        <div className="flex justify-between text-xs mb-1">
                          <span>{ticket.sold}</span>
                          <span>{ticket.quota}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              ticket.sold / ticket.quota > 0.8 ? 'bg-red-500' : 
                              ticket.sold / ticket.quota > 0.5 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min((ticket.sold / ticket.quota) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedTicket(ticket); }}>
                            <Eye className="h-4 w-4 mr-2" />
                            Lihat Detail
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => { setDeleteTarget({ type: 'tickets', id: ticket.id }); setDeleteConfirmOpen(true); }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render bookings table
  const renderBookingsTable = () => (
    <Card>
      <CardHeader className="p-4 md:p-6">
        <div className="flex flex-col gap-4">
          <div>
            <CardTitle className="text-base md:text-lg">Manajemen Booking</CardTitle>
            <CardDescription>Kelola semua booking</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={bookingStatusFilter} onValueChange={setBookingStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="USED">Used</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => fetchBookings()} disabled={bookingsLoading}>
              {bookingsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">
        {bookingsLoading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Tidak ada booking ditemukan
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Kode Booking</TableHead>
                  <TableHead className="hidden md:table-cell">User</TableHead>
                  <TableHead className="hidden lg:table-cell">Event</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Payment</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <p className="font-mono text-sm">{booking.bookingCode}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-xs">{getInitials(booking.user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{booking.user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{booking.user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <p className="text-sm truncate max-w-[120px]">{booking.event?.name || 'N/A'}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{formatCurrency(booking.finalAmount)}</p>
                    </TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge className={booking.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {booking.paymentStatus === 'PAID' ? 'Dibayar' : 'Belum Bayar'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {booking.status === 'PENDING' && booking.paymentStatus !== 'PAID' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleConfirmPayment(booking.id)}
                            disabled={actionLoading}
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            Konfirmasi
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10"
                          onClick={() => { setSelectedBooking(booking); setShowBookingDialog(true); }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render content based on active view
  const renderContent = () => {
    switch (activeView) {
      case 'users':
        return renderUsersTable();
      case 'vendors':
        return renderVendorsTable();
      case 'events':
        return renderEventsTable();
      case 'tickets':
        return renderTicketsTable();
      case 'bookings':
        return renderBookingsTable();
      case 'categories':
        return <AdminCategoriesPanel />;
      case 'subscriptions':
        return <AdminSubscriptionPlansPanel />;
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Navigation */}
      <div className="md:hidden sticky top-0 z-20 bg-white border-b px-4 py-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {navItems.map((item) => (
            <Button
              key={item.view}
              variant={activeView === item.view ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'shrink-0 gap-1 text-xs',
                activeView === item.view && 'bg-[#2196F3] hover:bg-[#1976D2]'
              )}
              onClick={() => setActiveView(item.view)}
            >
              {item.icon}
              <span>{item.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:block border-b bg-white">
        <div className="px-6 py-4">
          <div className="flex items-center gap-2">
            {navItems.map((item) => (
              <Button
                key={item.view}
                variant={activeView === item.view ? 'default' : 'ghost'}
                className={cn(
                  'gap-2',
                  activeView === item.view && 'bg-[#2196F3] hover:bg-[#1976D2]'
                )}
                onClick={() => setActiveView(item.view)}
              >
                {item.icon}
                <span>{item.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 md:p-6">
        {renderContent()}
      </div>

      {/* User Detail Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detail User</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar} />
                  <AvatarFallback>{getInitials(selectedUser.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedUser.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex gap-2 mt-1">
                    {getRoleBadge(selectedUser.role)}
                    <Badge className={selectedUser.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {selectedUser.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                </div>
              </div>
              {selectedUser.vendor && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium">Vendor</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.vendor.businessName}</p>
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                <p>Terdaftar: {formatDate(selectedUser.createdAt)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Vendor Detail Dialog */}
      <Dialog open={showVendorDialog} onOpenChange={setShowVendorDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Vendor</DialogTitle>
          </DialogHeader>
          {selectedVendor && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedVendor.logo} />
                  <AvatarFallback>{getInitials(selectedVendor.businessName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedVendor.businessName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedVendor.isVerified ? (
                      <Badge className="bg-green-100 text-green-800">Terverifikasi</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">Belum Verifikasi</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium">Event</p>
                  <p className="text-2xl font-bold">{selectedVendor._count?.events || 0}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium">Tiket</p>
                  <p className="text-2xl font-bold">{selectedVendor._count?.tickets || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{selectedVendor.rating.toFixed(1)}</span>
                <span className="text-muted-foreground">({selectedVendor.totalReviews} ulasan)</span>
              </div>
              <div className="text-sm">
                <p className="font-medium">Pemilik</p>
                <p className="text-muted-foreground">{selectedVendor.user.name}</p>
                <p className="text-muted-foreground">{selectedVendor.user.email}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Event Detail Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Event</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                {selectedEvent.images && (
                  <img 
                    src={JSON.parse(selectedEvent.images)[0]} 
                    alt={selectedEvent.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div>
                <p className="font-semibold">{selectedEvent.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{selectedEvent.category}</Badge>
                  {selectedEvent.isFeatured && <Badge className="bg-[#FF9800] text-white">Featured</Badge>}
                  <Badge className={selectedEvent.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {selectedEvent.isActive ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Vendor</p>
                  <p className="font-medium">{selectedEvent.vendor.businessName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Penjualan</p>
                  <p className="font-medium">{selectedEvent.totalSales} tiket</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Rating</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{selectedEvent.rating.toFixed(1)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Berlaku</p>
                  <p className="font-medium text-xs">{formatShortDate(selectedEvent.validFrom)} - {formatShortDate(selectedEvent.validUntil)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Booking Detail Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-lg bg-white shadow-2xl border border-gray-200">
          <DialogHeader>
            <DialogTitle>Detail Booking</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <p className="font-mono text-lg">{selectedBooking.bookingCode}</p>
                <div className="flex gap-2">
                  {getStatusBadge(selectedBooking.status)}
                  <Badge className={selectedBooking.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {selectedBooking.paymentStatus}
                  </Badge>
                </div>
              </div>
              
              <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                <p className="text-sm font-medium">Customer</p>
                <p className="font-medium">{selectedBooking.user.name}</p>
                <p className="text-sm text-muted-foreground">{selectedBooking.user.email}</p>
              </div>

              <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                <p className="text-sm font-medium">Event</p>
                <p className="font-medium">{selectedBooking.event?.name || 'N/A'}</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
                <p className="text-sm font-medium mb-2">Item</p>
                <div className="space-y-2">
                  {selectedBooking.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-medium">{item.ticket.name}</p>
                        <p className="text-xs text-muted-foreground">{item.quantity}x @ {formatCurrency(item.price)}</p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <p className="font-semibold">Total</p>
                <p className="text-xl font-bold text-[#FF9800]">{formatCurrency(selectedBooking.finalAmount)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus item ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                'Hapus'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Named export for compatibility
export { AdminDashboard };
