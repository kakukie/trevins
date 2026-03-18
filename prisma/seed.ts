import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function main() {
  console.log('🌱 Seeding database for TREVINS...');

  // Make seed idempotent for local testing.
  // Order matters due to FK constraints.
  await prisma.transaction.deleteMany();
  await prisma.accommodationBooking.deleteMany();
  await prisma.bookingItem.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.review.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.room.deleteMany();
  await prisma.accommodation.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.event.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.vendorPaymentMethod.deleteMany();
  await prisma.category.deleteMany();

  // ========================================
  // ADMIN USERS
  // ========================================
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const admins = [
    {
      email: 'admin@trevins.id',
      name: 'Super Admin',
      phone: '081111111111',
    },
    {
      email: 'admin2@trevins.id',
      name: 'Admin Operasional',
      phone: '081111111112',
    },
    {
      email: 'finance@trevins.id',
      name: 'Admin Finance',
      phone: '081111111113',
    },
  ];


  for (const adminData of admins) {
    await prisma.user.upsert({
      where: { email: adminData.email },
      update: {},
      create: {
        email: adminData.email,
        password: adminPassword,
        name: adminData.name,
        phone: adminData.phone,
        role: 'ADMIN',
        isActive: true,
      },
    });
  }
  console.log('✅ Created 3 admin users');

  // ========================================
  // SUBSCRIPTION PLANS (SaaS)
  // ========================================
  const starterPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'Starter' },
    update: {
      description: 'Paket dasar untuk vendor baru',
      maxEvents: 20,
      maxTickets: 100,
      maxAccommodations: 10,
      maxCategories: 10,
      isActive: true,
    },
    create: {
      name: 'Starter',
      description: 'Paket dasar untuk vendor baru',
      maxEvents: 20,
      maxTickets: 100,
      maxAccommodations: 10,
      maxCategories: 10,
      isActive: true,
    },
  });

  const proPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'Pro' },
    update: {
      description: 'Paket untuk vendor scale-up',
      maxEvents: null,
      maxTickets: null,
      maxAccommodations: null,
      maxCategories: null,
      isActive: true,
    },
    create: {
      name: 'Pro',
      description: 'Paket untuk vendor scale-up',
      maxEvents: null,
      maxTickets: null,
      maxAccommodations: null,
      maxCategories: null,
      isActive: true,
    },
  });

  console.log('✅ Ensured subscription plans (Starter, Pro)');

  // ========================================
  // VENDOR USERS
  // ========================================
  const vendorPassword = await bcrypt.hash('vendor123', 10);
  
  const vendorData = [
    {
      user: {
        email: 'jatimpark@trevins.id',
        name: 'Jatim Park Group',
        phone: '082222222221',
      },
      vendor: {
        businessName: 'Jatim Park Group',
        description: 'Kelompok wisata terbesar di Jawa Timur dengan berbagai destinasi menarik untuk keluarga. Menyediakan pengalaman wisata edukasi dan hiburan yang tak terlupakan.',
        logo: 'https://images.unsplash.com/photo-1533669955142-6a73332af4db?w=200',
        address: 'Jl. Raya Seleksi No.1',
        city: 'Batu',
        phone: '082222222221',
        isVerified: true,
        rating: 4.8,
        totalReviews: 1250,
      },
    },
    {
      user: {
        email: 'bromo@trevins.id',
        name: 'Bromo Adventure',
        phone: '082222222222',
      },
      vendor: {
        businessName: 'Bromo Adventure',
        description: 'Tour operator profesional untuk wisata Gunung Bromo dan sekitarnya. Pengalaman sunrise tour terbaik dengan guide berpengalaman.',
        logo: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200',
        address: 'Jl. Bromo No.88',
        city: 'Probolinggo',
        phone: '082222222222',
        isVerified: true,
        rating: 4.9,
        totalReviews: 890,
      },
    },
    {
      user: {
        email: 'pantaiparadise@trevins.id',
        name: 'Pantai Paradise',
        phone: '082222222223',
      },
      vendor: {
        businessName: 'Pantai Paradise',
        description: 'Resort pantai dengan fasilitas lengkap and pemandangan sunset terbaik. Cocok untuk liburan keluarga and honeymoon.',
        logo: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200',
        address: 'Jl. Pantai Indah No.1',
        city: 'Malang',
        phone: '082222222223',
        isVerified: true,
        rating: 4.7,
        totalReviews: 560,
      },
    },
    {
      user: {
        email: 'balitours@trevins.id',
        name: 'Bali Dream Tours',
        phone: '082222222224',
      },
      vendor: {
        businessName: 'Bali Dream Tours',
        description: 'Paket wisata Bali lengkap dengan private driver and guide. Dari pantai hingga pura, kami siap mengantarkan Anda ke destinasi impian.',
        logo: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=200',
        address: 'Jl. Sunset Road No.99',
        city: 'Bali',
        phone: '082222222224',
        isVerified: true,
        rating: 4.9,
        totalReviews: 2100,
      },
    },
    {
      user: {
        email: 'rajaampat@trevins.id',
        name: 'Raja Ampat Explorer',
        phone: '082222222225',
      },
      vendor: {
        businessName: 'Raja Ampat Explorer',
        description: 'Specialist tour Raja Ampat dengan paket diving and snorkeling terbaik. Jelajahi keindahan bawah laut Papua.',
        logo: 'https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?w=200',
        address: 'Jl. Raja Ampat No.1',
        city: 'Sorong',
        phone: '082222222225',
        isVerified: true,
        rating: 5.0,
        totalReviews: 450,
      },
    },
  ];

  const vendorRecords: any[] = [];

  for (const data of vendorData) {
    const user = await prisma.user.upsert({
      where: { email: data.user.email },
      update: {},
      create: {
        email: data.user.email,
        password: vendorPassword,
        name: data.user.name,
        phone: data.user.phone,
        role: 'VENDOR',
        isActive: true,
      },
    });

    const vendor = await prisma.vendor.upsert({
      where: { userId: user.id },
      update: data.vendor,
      create: {
        userId: user.id,
        subscriptionPlanId: starterPlan.id,
        ...data.vendor,
      },
    });

    vendorRecords.push({ user, vendor });
  }
  console.log(`✅ Created ${vendorRecords.length} vendor users`);

  // ========================================
  // CATEGORIES (GLOBAL + SAMPLE VENDOR)
  // ========================================
  const globalEventCategories = [
    'Pantai',
    'Gunung',
    'Permainan',
    'Budaya',
    'Taman',
    'Museum',
    'Adventure',
    'Keluarga',
    'Kuliner',
  ];

  await prisma.category.createMany({
    data: globalEventCategories.map((name) => ({
      name,
      slug: slugify(name),
      type: 'EVENT',
      ownerKey: 'GLOBAL',
      vendorId: null,
      isActive: true,
    })),
    skipDuplicates: true,
  });

  const globalAccommodationCategories = [
    'Hotel',
    'Villa',
    'Homestay',
    'Kos',
    'Resort',
  ];

  await prisma.category.createMany({
    data: globalAccommodationCategories.map((name) => ({
      name,
      slug: slugify(name),
      type: 'ACCOMMODATION',
      ownerKey: 'GLOBAL',
      vendorId: null,
      isActive: true,
    })),
    skipDuplicates: true,
  });

  // Sample vendor-owned category for first vendor
  if (vendorRecords[0]?.vendor?.id) {
    await prisma.category.createMany({
      data: [
        {
          name: 'Wisata Edukasi',
          slug: slugify('Wisata Edukasi'),
          type: 'EVENT',
          ownerKey: vendorRecords[0].vendor.id,
          vendorId: vendorRecords[0].vendor.id,
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });
  }

  console.log('✅ Ensured categories (global + sample vendor)');

  // ========================================
  // VENDOR PAYMENT METHODS (SaaS)
  // ========================================
  const vendorPaymentDefault: Record<string, { id: string; type: string }> = {};

  for (const vr of vendorRecords) {
    const v = vr.vendor;

    // Ensure idempotent when re-running seed without reset
    await prisma.vendorPaymentMethod.deleteMany({ where: { vendorId: v.id } });

    const bank = await prisma.vendorPaymentMethod.create({
      data: {
        vendorId: v.id,
        type: 'BANK_TRANSFER',
        label: 'Transfer Bank',
        provider: 'BCA',
        accountName: v.businessName,
        accountNumber: `12345${v.id.slice(-5)}`,
        instructions: 'Transfer sesuai nominal, lalu klik Konfirmasi Pembayaran di aplikasi.',
        sortOrder: 1,
        isActive: true,
      },
    });

    const ewallet = await prisma.vendorPaymentMethod.create({
      data: {
        vendorId: v.id,
        type: 'EWALLET',
        label: 'E-Wallet',
        provider: 'DANA',
        accountName: v.businessName,
        accountNumber: vr.user.phone || `08${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        instructions: 'Bayar via e-wallet sesuai nominal, lalu konfirmasi di aplikasi.',
        sortOrder: 2,
        isActive: true,
      },
    });

    const qris = await prisma.vendorPaymentMethod.create({
      data: {
        vendorId: v.id,
        type: 'QR_STATIC',
        label: 'QRIS (Statis)',
        provider: 'QRIS',
        qrString: `trevins://pay?vendorId=${v.id}`,
        instructions: 'Scan QR untuk membayar. Pastikan nominal sesuai total pembayaran.',
        sortOrder: 0,
        isActive: true,
      },
    });

    // Default method used for sample bookings
    vendorPaymentDefault[v.id] = { id: qris.id, type: qris.type };

    void bank;
    void ewallet;
  }

  console.log(`âœ… Created vendor payment methods`);

  // ========================================
  // REGULAR USERS
  // ========================================
  const userPassword = await bcrypt.hash('user123', 10);
  
  const regularUsers = [
    { email: 'budi@trevins.id', name: 'Budi Santoso', phone: '083333333331' },
    { email: 'siti@trevins.id', name: 'Siti Rahayu', phone: '083333333332' },
    { email: 'ahmad@trevins.id', name: 'Ahmad Wijaya', phone: '083333333333' },
    { email: 'dewi@trevins.id', name: 'Dewi Lestari', phone: '083333333334' },
    { email: 'andi@trevins.id', name: 'Andi Pratama', phone: '083333333335' },
    { email: 'rina@trevins.id', name: 'Rina Maharani', phone: '083333333336' },
    { email: 'yoga@trevins.id', name: 'Yoga Permana', phone: '083333333337' },
    { email: 'maya@trevins.id', name: 'Maya Sari', phone: '083333333338' },
    { email: 'agus@trevins.id', name: 'Agus Setiawan', phone: '083333333339' },
    { email: 'lisa@trevins.id', name: 'Lisa Permata', phone: '083333333340' },
  ];

  const userRecords: any[] = [];

  for (const userData of regularUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        password: userPassword,
        name: userData.name,
        phone: userData.phone,
        role: 'USER',
        isActive: true,
      },
    });
    userRecords.push(user);
  }
  console.log(`✅ Created ${userRecords.length} regular users`);

  // ========================================
  // EVENTS
  // ========================================
  const events = [
    // Jatim Park Group Events
    {
      vendorId: vendorRecords[0].vendor.id,
      name: 'Jatim Park 1 + Museum Tubuh',
      slug: 'jatim-park-1-museum-tubuh',
      description: 'Nikmati pengalaman wisata edukasi dan hiburan di Jatim Park 1. Termasuk tiket masuk ke Museum Tubuh yang unik dan menarik. Cocok untuk liburan keluarga! Wahana edukasi interaktif, taman bermain outdoor, dan spot foto Instagramable.',
      category: 'Permainan',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1533669955142-6a73332af4db?w=800',
        'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800',
      ]),
      address: 'Jl. Raya Seleksi No.1, Batu',
      city: 'Batu',
      rating: 4.8,
      totalReviews: 450,
      totalSales: 2500,
      isFeatured: true,
      validFrom: new Date(),
      validUntil: new Date('2025-12-31'),
    },
    {
      vendorId: vendorRecords[0].vendor.id,
      name: 'Batu Night Spectacular',
      slug: 'batu-night-spectacular',
      description: 'Wisata malam yang spektakuler dengan berbagai wahana dan pertunjukan. Nikmati keindahan kota Batu di malam hari! Ada pasar malam, wahana keluarga, dan pertunjukan 3D.',
      category: 'Permainan',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
      ]),
      address: 'Jl. Hayam Wuruk No.1, Batu',
      city: 'Batu',
      rating: 4.6,
      totalReviews: 320,
      totalSales: 1800,
      isFeatured: true,
      validFrom: new Date(),
      validUntil: new Date('2025-12-31'),
    },
    {
      vendorId: vendorRecords[0].vendor.id,
      name: 'Museum Angkut',
      slug: 'museum-angkut',
      description: 'Museum transportasi terbesar di Indonesia dengan berbagai koleksi kendaraan unik dari masa ke masa. Edukasi yang menyenangkan untuk semua usia! Ada lebih dari 300 koleksi kendaraan dari berbagai era.',
      category: 'Budaya',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800',
      ]),
      address: 'Jl. Terusan Rimba Raya No.2, Batu',
      city: 'Batu',
      rating: 4.7,
      totalReviews: 380,
      totalSales: 1600,
      isFeatured: true,
      validFrom: new Date(),
      validUntil: new Date('2025-12-31'),
    },

    // Bromo Adventure Events
    {
      vendorId: vendorRecords[1].vendor.id,
      name: 'Bromo Sunrise Tour',
      slug: 'bromo-sunrise-tour',
      description: 'Jelajahi keindahan matahari terbit di Gunung Bromo. Paket termasuk transportasi, guide berpengalaman, dan tiket masuk kawasan wisata. Pengalaman yang tak terlupakan menikmati sunrise di Penanjakan.',
      category: 'Gunung',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      ]),
      address: 'Gunung Bromo, Probolinggo',
      city: 'Probolinggo',
      rating: 4.9,
      totalReviews: 280,
      totalSales: 1500,
      isFeatured: true,
      validFrom: new Date(),
      validUntil: new Date('2025-12-31'),
    },
    {
      vendorId: vendorRecords[1].vendor.id,
      name: 'Ijen Blue Fire Tour',
      slug: 'ijen-blue-fire-tour',
      description: 'Saksikan fenomena api biru yang langka di Kawah Ijen. Pengalaman trekking malam yang tak terlupakan! Termasuk equipment safety dan guide profesional.',
      category: 'Gunung',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      ]),
      address: 'Kawah Ijen, Banyuwangi',
      city: 'Banyuwangi',
      rating: 4.9,
      totalReviews: 150,
      totalSales: 800,
      isFeatured: false,
      validFrom: new Date(),
      validUntil: new Date('2025-12-31'),
    },

    // Pantai Paradise Events
    {
      vendorId: vendorRecords[2].vendor.id,
      name: 'Pantai Balekambang',
      slug: 'pantai-balekambang',
      description: 'Pantai indah dengan pura di atas batu karang. Spot foto Instagramable dan sunset terbaik di Malang Selatan. Fasilitas lengkap dengan area parkir dan warung makan.',
      category: 'Pantai',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      ]),
      address: 'Kec. Bantur, Malang',
      city: 'Malang',
      rating: 4.5,
      totalReviews: 200,
      totalSales: 1200,
      isFeatured: false,
      validFrom: new Date(),
      validUntil: new Date('2025-12-31'),
    },
    {
      vendorId: vendorRecords[2].vendor.id,
      name: 'Pantai Sendang Biru',
      slug: 'pantai-sendang-biru',
      description: 'Pantai dengan pasir putih dan air jernih. Cocok untuk snorkeling dan diving. Terdapat pulau kecil yang bisa dijelajahi. Surga tersembunyi di Malang Selatan.',
      category: 'Pantai',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800',
      ]),
      address: 'Kec. Sumbermanjing, Malang',
      city: 'Malang',
      rating: 4.6,
      totalReviews: 180,
      totalSales: 950,
      isFeatured: false,
      validFrom: new Date(),
      validUntil: new Date('2025-12-31'),
    },

    // Bali Dream Tours Events
    {
      vendorId: vendorRecords[3].vendor.id,
      name: 'Bali Ubud Day Tour',
      slug: 'bali-ubud-day-tour',
      description: 'Jelajahi keindahan Ubud dalam satu hari! Kunjungi Monkey Forest, Tegalalang Rice Terrace, Tirta Empul, dan pasar seni Ubud. Termasuk makan siang dan transportasi AC.',
      category: 'Budaya',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
      ]),
      address: 'Ubud, Bali',
      city: 'Bali',
      rating: 4.8,
      totalReviews: 520,
      totalSales: 3200,
      isFeatured: true,
      validFrom: new Date(),
      validUntil: new Date('2025-12-31'),
    },
    {
      vendorId: vendorRecords[3].vendor.id,
      name: 'Nusa Penida Island Tour',
      slug: 'nusa-penida-island-tour',
      description: 'Eksplorasi keindahan Nusa Penida! Kunjungi Kelingking Beach, Angel Billabong, Broken Beach, dan Crystal Bay. Termasuk tiket fast boat dan makan siang.',
      category: 'Pantai',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?w=800',
      ]),
      address: 'Nusa Penida, Bali',
      city: 'Bali',
      rating: 4.9,
      totalReviews: 380,
      totalSales: 2100,
      isFeatured: true,
      validFrom: new Date(),
      validUntil: new Date('2025-12-31'),
    },

    // Raja Ampat Explorer Events
    {
      vendorId: vendorRecords[4].vendor.id,
      name: 'Raja Ampat Diving Package',
      slug: 'raja-ampat-diving-package',
      description: 'Paket diving 4 hari 3 malam di Raja Ampat. Jelajahi 10+ spot diving terbaik dengan instructor profesional. Termasuk akomodasi dan full board meals.',
      category: 'Adventure',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
      ]),
      address: 'Raja Ampat, Papua Barat',
      city: 'Sorong',
      rating: 5.0,
      totalReviews: 120,
      totalSales: 450,
      isFeatured: true,
      validFrom: new Date(),
      validUntil: new Date('2025-12-31'),
    },
    {
      vendorId: vendorRecords[4].vendor.id,
      name: 'Wayag Island Tour',
      slug: 'wayag-island-tour',
      description: 'Kunjungi iconic Wayag Island dengan pemandangan karst yang menakjubkan. Trekking ke viewpoint dan snorkeling di perairan jernih. Experience sekali seumur hidup!',
      category: 'Adventure',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=800',
      ]),
      address: 'Wayag Island, Raja Ampat',
      city: 'Sorong',
      rating: 5.0,
      totalReviews: 85,
      totalSales: 280,
      isFeatured: true,
      validFrom: new Date(),
      validUntil: new Date('2025-12-31'),
    },
  ];

  const eventRecords: any[] = [];

  for (const eventData of events) {
    const event = await prisma.event.create({
      data: eventData,
    });
    eventRecords.push(event);

    // Create tickets for each event
    const tickets = [
      {
        eventId: event.id,
        vendorId: event.vendorId,
        name: `Tiket ${event.name.split(' ').slice(0, 2).join(' ')} - Dewasa`,
        sku: `TKT-${event.slug.toUpperCase().replace(/-/g, '').slice(0, 15)}-ADULT`,
        description: 'Tiket masuk untuk usia 12 tahun ke atas',
        type: 'ADULT',
        price: event.category === 'Gunung' ? 350000 : event.category === 'Adventure' ? 500000 : event.category === 'Pantai' ? 25000 : 113000,
        discountPrice: event.category === 'Gunung' ? 315000 : event.category === 'Adventure' ? 450000 : event.category === 'Pantai' ? 20000 : 95000,
        quota: 500,
        sold: Math.floor(Math.random() * 200),
        validFrom: event.validFrom,
        validUntil: event.validUntil,
      },
      {
        eventId: event.id,
        vendorId: event.vendorId,
        name: `Tiket ${event.name.split(' ').slice(0, 2).join(' ')} - Anak`,
        sku: `TKT-${event.slug.toUpperCase().replace(/-/g, '').slice(0, 15)}-CHILD`,
        description: 'Tiket masuk untuk usia 3-11 tahun',
        type: 'CHILD',
        price: event.category === 'Gunung' ? 250000 : event.category === 'Adventure' ? 400000 : event.category === 'Pantai' ? 15000 : 85000,
        discountPrice: event.category === 'Gunung' ? 225000 : event.category === 'Adventure' ? 360000 : event.category === 'Pantai' ? 12000 : 75000,
        quota: 300,
        sold: Math.floor(Math.random() * 100),
        validFrom: event.validFrom,
        validUntil: event.validUntil,
      },
    ];

    for (const ticketData of tickets) {
      await prisma.ticket.create({
        data: ticketData,
      });
    }
  }
  console.log(`✅ Created ${eventRecords.length} events with tickets`);

  // ========================================
  // ACCOMMODATIONS
  // ========================================
  const accommodations = [
    {
      vendorId: vendorRecords[0].vendor.id,
      name: 'Batu Hill Hotel',
      slug: 'batu-hill-hotel',
      description: 'Hotel mewah dengan pemandangan pegunungan dan fasilitas lengkap. Cocok untuk liburan keluarga dengan kids club dan water park.',
      type: 'HOTEL',
      address: 'Jl. Bukit Batu No.10',
      city: 'Batu',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      ]),
      facilities: JSON.stringify(['WiFi', 'Pool', 'Restaurant', 'Spa', 'Parking', 'Kids Club']),
      totalRooms: 50,
      availableRooms: 35,
      pricePerNight: 750000,
      discountPrice: 625000,
      rating: 4.7,
      totalReviews: 120,
      isFeatured: true,
    },
    {
      vendorId: vendorRecords[1].vendor.id,
      name: 'Bromo View Villa',
      slug: 'bromo-view-villa',
      description: 'Villa dengan pemandangan langsung Gunung Bromo. Pengalaman menginap yang tak terlupakan dengan sunrise langsung dari balkon.',
      type: 'VILLA',
      address: 'Jl. Bromo View No.5',
      city: 'Probolinggo',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
      ]),
      facilities: JSON.stringify(['WiFi', 'Kitchen', 'Fireplace', 'Terrace', 'Parking']),
      totalRooms: 10,
      availableRooms: 6,
      pricePerNight: 1200000,
      discountPrice: 999000,
      rating: 4.9,
      totalReviews: 45,
      isFeatured: true,
    },
    {
      vendorId: vendorRecords[2].vendor.id,
      name: 'Beach Side Homestay',
      slug: 'beach-side-homestay',
      description: 'Homestay nyaman dekat pantai dengan suasana tenang dan damai. Hanya 5 menit berjalan kaki ke pantai.',
      type: 'HOMESTAY',
      address: 'Jl. Pantai Indah No.15',
      city: 'Malang',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      ]),
      facilities: JSON.stringify(['WiFi', 'Kitchen', 'AC', 'Parking']),
      totalRooms: 8,
      availableRooms: 5,
      pricePerNight: 350000,
      discountPrice: 280000,
      rating: 4.5,
      totalReviews: 60,
      isFeatured: false,
    },
    {
      vendorId: vendorRecords[3].vendor.id,
      name: 'Ubud Jungle Retreat',
      slug: 'ubud-jungle-retreat',
      description: 'Resort mewah di tengah hutan Ubud. Spa treatment, yoga class, dan infinity pool dengan pemandangan hutan.',
      type: 'HOTEL',
      address: 'Jl. Raya Ubud No.88',
      city: 'Bali',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
      ]),
      facilities: JSON.stringify(['WiFi', 'Pool', 'Spa', 'Restaurant', 'Yoga', 'Parking']),
      totalRooms: 25,
      availableRooms: 15,
      pricePerNight: 1500000,
      discountPrice: 1250000,
      rating: 4.9,
      totalReviews: 200,
      isFeatured: true,
    },
    {
      vendorId: vendorRecords[4].vendor.id,
      name: 'Raja Ampat Dive Resort',
      slug: 'raja-ampat-dive-resort',
      description: 'Resort ekslusif untuk pecinta diving. Akses langsung ke spot diving terbaik Raja Ampat dengan guide profesional.',
      type: 'RESORT',
      address: 'Pulau Mansuar, Raja Ampat',
      city: 'Sorong',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
      ]),
      facilities: JSON.stringify(['WiFi', 'Dive Center', 'Restaurant', 'Equipment Rental', 'Boat Transfer']),
      totalRooms: 12,
      availableRooms: 8,
      pricePerNight: 2500000,
      discountPrice: 2200000,
      rating: 5.0,
      totalReviews: 75,
      isFeatured: true,
    },
  ];

  for (const accoData of accommodations) {
    const accommodation = await prisma.accommodation.create({
      data: accoData,
    });

    // Create rooms
    await prisma.room.create({
      data: {
        accommodationId: accommodation.id,
        name: 'Standard Room',
        description: 'Kamar nyaman dengan fasilitas lengkap',
        pricePerNight: accoData.pricePerNight,
        discountPrice: accoData.discountPrice,
        capacity: 2,
        facilities: accoData.facilities as string,
      },
    });

    await prisma.room.create({
      data: {
        accommodationId: accommodation.id,
        name: 'Deluxe Room',
        description: 'Kamar lebih luas dengan balkon dan pemandangan',
        pricePerNight: accoData.pricePerNight * 1.5,
        discountPrice: accoData.discountPrice ? accoData.discountPrice * 1.4 : null,
        capacity: 3,
        facilities: accoData.facilities as string,
      },
    });
  }
  console.log(`✅ Created ${accommodations.length} accommodations with rooms`);

  // ========================================
  // VOUCHERS
  // ========================================
  const vouchers = [
    {
      code: 'TREVINS20',
      name: 'Trevins Launch Promo',
      description: 'Diskon 20% untuk semua tiket wisata',
      type: 'PERCENTAGE',
      value: 20,
      minValue: 100000,
      maxValue: 50000,
      usageLimit: 500,
      validFrom: new Date(),
      validUntil: new Date('2025-12-31'),
    },
    {
      code: 'WEEKEND15',
      name: 'Weekend Getaway',
      description: 'Diskon 15% untuk booking di akhir pekan',
      type: 'PERCENTAGE',
      value: 15,
      minValue: 50000,
      maxValue: 25000,
      usageLimit: 200,
      validFrom: new Date(),
      validUntil: new Date('2025-12-31'),
    },
    {
      code: 'NEWUSER50K',
      name: 'Selamat Datang di Trevins',
      description: 'Potongan Rp 50.000 untuk pengguna baru',
      type: 'FIXED',
      value: 50000,
      minValue: 100000,
      usageLimit: 1000,
      validFrom: new Date(),
      validUntil: new Date('2025-12-31'),
    },
    {
      code: 'HEMAT100K',
      name: 'Super Hemat',
      description: 'Potongan Rp 100.000 untuk minimal pembelian Rp 500.000',
      type: 'FIXED',
      value: 100000,
      minValue: 500000,
      usageLimit: 100,
      validFrom: new Date(),
      validUntil: new Date('2025-06-30'),
    },
    {
      code: 'BALI25',
      name: 'Bali Special',
      description: 'Diskon 25% untuk semua wisata di Bali',
      type: 'PERCENTAGE',
      value: 25,
      minValue: 200000,
      maxValue: 75000,
      usageLimit: 300,
      validFrom: new Date(),
      validUntil: new Date('2025-08-31'),
    },
  ];

  for (const voucherData of vouchers) {
    await prisma.voucher.create({
      data: voucherData,
    });
  }
  console.log(`✅ Created ${vouchers.length} vouchers`);

  // ========================================
  // SAMPLE BOOKINGS
  // ========================================
  const tickets = await prisma.ticket.findMany({
    take: 5,
  });

  for (let i = 0; i < Math.min(5, userRecords.length); i++) {
    const user = userRecords[i];
    const ticket = tickets[i % tickets.length];
    
    if (!ticket || !ticket.eventId) continue;

    const bookingCode = `TRP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const quantity = Math.floor(Math.random() * 3) + 1;
    const price = ticket.discountPrice || ticket.price;
    const totalAmount = price * quantity;

    const booking = await prisma.booking.create({
      data: {
        bookingCode,
        userId: user.id,
        eventId: ticket.eventId,
        vendorId: ticket.vendorId,
        status: ['PAID', 'CONFIRMED', 'PAID', 'PAID'][i % 4],
        totalAmount,
        discountAmount: 0,
        finalAmount: totalAmount,
        paymentMethod: vendorPaymentDefault[ticket.vendorId]?.type || ['QRIS', 'BANK_TRANSFER', 'E_WALLET'][i % 3],
        vendorPaymentMethodId: vendorPaymentDefault[ticket.vendorId]?.id || null,
        paymentStatus: 'PAID',
        qrCode: `QR-${bookingCode}`,
        createdAt: new Date(Date.now() - i * 86400000),
      },
    });

    await prisma.bookingItem.create({
      data: {
        bookingId: booking.id,
        ticketId: ticket.id,
        quantity,
        price,
        subtotal: totalAmount,
      },
    });

    await prisma.transaction.create({
      data: {
        transactionCode: `TXN-${bookingCode}`,
        userId: user.id,
        bookingId: booking.id,
        amount: totalAmount,
        paymentMethod: booking.paymentMethod!,
        status: 'SUCCESS',
        paidAt: booking.createdAt,
      },
    });
  }
  console.log('✅ Created sample bookings and transactions');

  // ========================================
  // NOTIFICATIONS
  // ========================================
  for (let i = 0; i < Math.min(5, userRecords.length); i++) {
    await prisma.notification.create({
      data: {
        userId: userRecords[i].id,
        title: 'Selamat Datang di Trevins! 🎉',
        message: 'Terima kasih telah bergabung. Nikmati promo spesial untuk transaksi pertama Anda dengan kode: NEWUSER50K',
        type: 'SYSTEM',
        isRead: false,
      },
    });
  }
  console.log('✅ Created sample notifications');

  console.log('\n');
  console.log('══════════════════════════════════════════════════════════════');
  console.log('              ✅ SEEDING COMPLETED SUCCESSFULLY!');
  console.log('══════════════════════════════════════════════════════════════');
  console.log('\n📋 LOGIN CREDENTIALS:');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('👑 ADMIN:');
  console.log('   Email: admin@trevins.id | Password: admin123');
  console.log('   Email: admin2@trevins.id | Password: admin123');
  console.log('   Email: finance@trevins.id | Password: admin123');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('🏪 VENDOR:');
  console.log('   Email: jatimpark@trevins.id | Password: vendor123');
  console.log('   Email: bromo@trevins.id | Password: vendor123');
  console.log('   Email: pantaiparadise@trevins.id | Password: vendor123');
  console.log('   Email: balitours@trevins.id | Password: vendor123');
  console.log('   Email: rajaampat@trevins.id | Password: vendor123');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('👤 USER:');
  console.log('   Email: budi@trevins.id | Password: user123');
  console.log('   Email: siti@trevins.id | Password: user123');
  console.log('   Email: ahmad@trevins.id | Password: user123');
  console.log('   ... dan 7 user lainnya');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('\n🎫 VOUCHER CODES:');
  console.log('   TREVINS20  - Diskon 20% (min. Rp 100.000)');
  console.log('   WEEKEND15  - Diskon 15% weekend');
  console.log('   NEWUSER50K - Potongan Rp 50.000 (user baru)');
  console.log('   HEMAT100K  - Potongan Rp 100.000 (min. Rp 500.000)');
  console.log('   BALI25     - Diskon 25% wisata Bali');

  console.log('══════════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
