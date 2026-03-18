import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request, { includeVendor: true });
    if (auth.error) return auth.error;
    const user = auth.user!;
    const userId = user.id;

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let dashboardData;

    if (user.role === 'ADMIN') {
      // Admin dashboard
      const [
        totalUsers,
        totalVendors,
        totalEvents,
        totalTickets,
        totalBookings,
        totalRevenue,
        recentBookings,
        recentUsers,
        topEvents,
      ] = await Promise.all([
        db.user.count(),
        db.vendor.count(),
        db.event.count({ where: { isActive: true } }),
        db.ticket.count({ where: { isActive: true } }),
        db.booking.count(),
        db.booking.aggregate({
          where: { paymentStatus: 'PAID' },
          _sum: { finalAmount: true },
        }),
        db.booking.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { name: true, email: true } },
            event: { select: { name: true } },
          },
        }),
        db.user.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, email: true, role: true, createdAt: true },
        }),
        db.event.findMany({
          where: { isActive: true },
          take: 5,
          orderBy: { totalSales: 'desc' },
          select: { id: true, name: true, totalSales: true, rating: true },
        }),
      ]);

      dashboardData = {
        role: 'ADMIN',
        stats: {
          totalUsers,
          totalVendors,
          totalEvents,
          totalTickets,
          totalBookings,
          totalRevenue: totalRevenue._sum.finalAmount || 0,
        },
        recentBookings,
        recentUsers,
        topEvents,
      };
    } else if (user.role === 'VENDOR' && user.vendor) {
      // Vendor dashboard
      const [
        totalEvents,
        totalTickets,
        totalTicketBookings,
        totalStayBookings,
        totalRevenueTickets,
        totalRevenueStays,
        pendingTicketBookings,
        pendingStayBookings,
        recentBookings,
        topTickets,
      ] = await Promise.all([
        db.event.count({ where: { vendorId: user.vendor.id, isActive: true } }),
        db.ticket.count({ where: { vendorId: user.vendor.id, isActive: true } }),
        db.booking.count({
          where: {
            items: { some: { ticket: { vendorId: user.vendor.id } } },
          },
        }),
        db.accommodationBooking.count({
          where: { vendorId: user.vendor.id },
        }),
        db.booking.aggregate({
          where: {
            paymentStatus: 'PAID',
            items: { some: { ticket: { vendorId: user.vendor.id } } },
          },
          _sum: { finalAmount: true },
        }),
        db.accommodationBooking.aggregate({
          where: { vendorId: user.vendor.id, paymentStatus: 'PAID' },
          _sum: { finalAmount: true },
        }),
        db.booking.count({
          where: {
            status: 'PENDING',
            items: { some: { ticket: { vendorId: user.vendor.id } } },
          },
        }),
        db.accommodationBooking.count({
          where: { vendorId: user.vendor.id, status: 'PENDING' },
        }),
        db.booking.findMany({
          where: {
            items: { some: { ticket: { vendorId: user.vendor.id } } },
          },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { name: true, email: true } },
            items: { include: { ticket: { select: { name: true } } } },
          },
        }),
        db.ticket.findMany({
          where: { vendorId: user.vendor.id, isActive: true },
          take: 5,
          orderBy: { sold: 'desc' },
        }),
      ]);

      dashboardData = {
        role: 'VENDOR',
        vendor: user.vendor,
        stats: {
          totalEvents,
          totalTickets,
          totalBookings: totalTicketBookings + totalStayBookings,
          totalRevenue: (totalRevenueTickets._sum.finalAmount || 0) + (totalRevenueStays._sum.finalAmount || 0),
          pendingBookings: pendingTicketBookings + pendingStayBookings,
        },
        recentBookings,
        topTickets,
      };
    } else {
      // User dashboard
      const [
        totalBookings,
        pendingBookings,
        completedBookings,
        totalSpent,
        recentBookings,
        upcomingBookings,
      ] = await Promise.all([
        db.booking.count({ where: { userId } }),
        db.booking.count({ where: { userId, status: 'PENDING' } }),
        db.booking.count({ where: { userId, status: 'PAID' } }),
        db.booking.aggregate({
          where: { userId, paymentStatus: 'PAID' },
          _sum: { finalAmount: true },
        }),
        db.booking.findMany({
          where: { userId },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            event: { select: { name: true, images: true } },
            items: { include: { ticket: { select: { name: true } } } },
          },
        }),
        db.booking.findMany({
          where: {
            userId,
            status: 'PAID',
            items: { some: { ticket: { validUntil: { gte: new Date() } } } },
          },
          take: 5,
          include: {
            event: { select: { name: true, images: true } },
            items: { include: { ticket: { select: { name: true, validUntil: true } } } },
          },
        }),
      ]);

      dashboardData = {
        role: 'USER',
        stats: {
          totalBookings,
          pendingBookings,
          completedBookings,
          totalSpent: totalSpent._sum.finalAmount || 0,
        },
        recentBookings: recentBookings.map(booking => ({
          ...booking,
          event: booking.event ? {
            ...booking.event,
            images: typeof booking.event.images === 'string' ? JSON.parse(booking.event.images) : booking.event.images,
          } : null,
        })),
        upcomingBookings: upcomingBookings.map(booking => ({
          ...booking,
          event: booking.event ? {
            ...booking.event,
            images: typeof booking.event.images === 'string' ? JSON.parse(booking.event.images) : booking.event.images,
          } : null,
        })),
      };
    }

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

