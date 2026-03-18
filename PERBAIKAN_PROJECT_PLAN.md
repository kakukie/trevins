# 📋 TREVINS - PLAN PERBAIKAN PROJECT
**Last Updated**: March 12, 2026  
**Status**: 🟡 In Progress

---

## 📌 RINGKASAN PERBAIKAN

Dokumen ini merincikan rencana perbaikan untuk **2 issue utama**:
1. **Responsive Design** - Penyesuaian tampilan mobile, tablet, dan desktop
2. **Login & Dummy Data** - Perbaikan sistem autentikasi dan data dummy

---

## ❌ ISSUE #1: RESPONSIVE DESIGN (Multi-Device)

### 🔍 ANALISIS MASALAH

| Aspek | Status | Catatan |
|-------|--------|---------|
| Mobile View | ❌ **Belum Optimal** | Beberapa component belum responsive |
| Tablet View | ❌ **Belum Optimal** | Breakpoint intermediate (768-1024px) kurang optimal |
| Desktop View | ✅ **Baik** | Sudah cukup responsif |
| Hooks Mobile | ✅ Ada | `use-mobile.ts` sudah tersedia (breakpoint 768px) |

### 📝 KOMPONEN YANG PERLU DIPERBAIKI

#### 1. **Navbar Component**
- **File**: [src/components/shared/navbar.tsx](src/components/shared/navbar.tsx)
- **Masalah**:
  - Search bar tidak hilang di mobile
  - Menu items tidak di-collapse dengan benar
  - User avatar positioning kurang tepat
- **Solusi**:
  - Gunakan `useIsMobile()` hook untuk conditional rendering
  - Implementasi hamburger menu dengan Sheet component
  - Responsif padding/margin: `px-2 md:px-4 lg:px-6`

#### 2. **Sidebar Component**
- **File**: [src/components/shared/sidebar.tsx](src/components/shared/sidebar.tsx)
- **Masalah**:
  - Sidebar tampil di mobile (mengganggu)
  - Tidak ada mobile drawer alternative
  - Text labels terlalu lebar di tablet
- **Solusi**:
  - Hide sidebar di mobile: `hidden md:block`
  - Buat Sheet drawer untuk mobile navigation
  - Implementasi collapsible icons untuk tablet

#### 3. **Home Page / Event Cards**
- **File**: [src/components/user/home-page.tsx](src/components/user/home-page.tsx)
- **Masalah**:
  - Card grid tidak optimal di berbagai ukuran
  - Spacing terlalu besar/kecil pada mobile
  - Hero section tidak sesuai mobile
- **Solusi**:
  ```html
  <!-- Grid responsif -->
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
  
  <!-- Hero section responsif -->
  <div class="h-40 sm:h-60 md:h-80 lg:h-96">
  ```

#### 4. **Bottom Navigation (Mobile)**
- **File**: [src/components/shared/mobile-bottom-nav.tsx](src/components/shared/mobile-bottom-nav.tsx)
- **Masalah**:
  - Component ada tetapi belum diintegrasikan
  - Placeholder text masih ada
- **Solusi**:
  - Integrasikan di layout mobile
  - Tambah routing untuk setiap tab
  - Styling icon dan label

#### 5. **Form Components** 
- **Files**: 
  - [src/components/shared/booking-modal.tsx](src/components/shared/booking-modal.tsx)
  - [src/components/shared/event-detail-modal.tsx](src/components/shared/event-detail-modal.tsx)
  - [src/components/shared/authModal.tsx](src/components/shared/authModal.tsx)
- **Masalah**:
  - Modal dialog tidak responsive
  - Input fields terlalu lebar di mobile
- **Solusi**:
  ```html
  <Dialog>
    <DialogContent className="w-full max-w-sm md:max-w-md lg:max-w-lg">
  </Dialog>
  ```

### ✅ CHECKLIST PERBAIKAN RESPONSIVE

- [ ] Update Navbar: responsive search, hamburger menu
- [ ] Update Sidebar: mobile drawer, tablet collapse
- [ ] Update Home/Event cards: grid responsive
- [ ] Integrasikan Mobile Bottom Nav
- [ ] Fix Modal responsiveness
- [ ] Test pada breakpoints:
  - [ ] Mobile (320px - 640px)
  - [ ] Small Mobile (640px - 768px)
  - [ ] Tablet (768px - 1024px)
  - [ ] Desktop (1024px+)

---

## ❌ ISSUE #2: LOGIN & DUMMY DATA

### 🔍 ANALISIS MASALAH

| Aspek | Status | Detail |
|-------|--------|--------|
| Database Seed | ✅ Berhasil | Dummy data sudah di-seed |
| Login Credentials | ❌ **Tidak Berfungsi** | Kredensial yang disediakan tidak bisa login |
| Auth API | ⚠️ Unclear | Perlu verifikasi implementasi |
| User Data | ✅ Ada | Data ada di database |

### 🐛 PENYEBAB MASALAH LOGIN

**Kemungkinan Issue**:
1. **Password Encryption Mismatch** - Password di seed mungkin plain text, tapi auth check hashing
2. **API Route Error** - [src/app/api/auth/](src/app/api/auth/) mungkin ada error handling
3. **Store/Context Issue** - [src/store/auth-store.ts](src/store/auth-store.ts) mungkin tidak ter-initialize
4. **Redirect Masalah** - Setelah login berhasil, redirect tidak bekerja
5. **Session/Token Issue** - JWT token tidak di-generate dengan benar

### 📝 LANGKAH PERBAIKAN

#### Step 1: Verifikasi Database Seed
```bash
# Check apakah data benar-benar tersimpan
npx prisma studio

# Atau query langsung
npx prisma db execute --stdin < query.sql
```

**Task**: 
- [ ] Buka Prisma Studio (`npx prisma studio`)
- [ ] Check table `User`, lihat password yang tersimpan
- [ ] Verify hash menggunakan bcryptjs

#### Step 2: Review Auth API Implementation
- **File**: [src/app/api/auth/route.ts](src/app/api/auth/route.ts)
- **Periksa**:
  - [ ] Password comparison logic (bcrypt.compare)
  - [ ] JWT token generation
  - [ ] Error handling & response format
  - [ ] CORS headers (jika diperlukan)

#### Step 3: Update Seed Script
- **File**: [prisma/seed.ts](prisma/seed.ts)
- **Fix**:
  - [ ] Pastikan password di-hash dengan `bcryptjs`
  - [ ] Gunakan unique email
  - [ ] Tambah error handling
  - [ ] Verifikasi setiap role dibuat

```typescript
// CONTOH PERBAIKAN
import bcryptjs from 'bcryptjs';

const hashedPassword = await bcryptjs.hash('admin123', 10);

const adminUser = await prisma.user.create({
  data: {
    email: 'admin@trevins.id',
    name: 'Admin User',
    password: hashedPassword, // Hash password
    role: 'ADMIN',
    emailVerified: new Date(),
  },
});
```

#### Step 4: Update Auth Store
- **File**: [src/store/auth-store.ts](src/store/auth-store.ts)
- **Tambahkan**:
  - [ ] Error state management
  - [ ] Loading state
  - [ ] Proper token storage
  - [ ] Logout functionality

#### Step 5: Test Login Flow
```bash
# Test credentials (after fixing)
Email: admin@trevins.id
Password: admin123

Email: budi@trevins.id
Password: user123
```

### ✅ CHECKLIST PERBAIKAN LOGIN

- [ ] Verify database seed (Prisma Studio)
- [ ] Baca auth API implementation
- [ ] Fix password hashing di seed.ts
- [ ] Perbaiki auth store (auth-store.ts)
- [ ] Review login modal (authModal.tsx)
- [ ] Test login dengan test credentials
- [ ] Setup error notification (toast/alert)
- [ ] Implementasi remember-me (opsional)

---

## 📊 TESTING PLAN

### Test Cases untuk Responsive Design

```
TEST SUITE: RESPONSIVE LAYOUT
├─ Mobile (iPhone 12 - 390px)
│  ├─ Navbar visible, menu collapsed ✓
│  ├─ Sidebar hidden ✓
│  ├─ Bottom nav visible ✓
│  ├─ Cards stack vertically ✓
│  └─ Modals full-screen/full-width ✓
│
├─ Tablet (iPad - 768px)
│  ├─ Sidebar in drawer or mini mode ✓
│  ├─ Cards 2-3 column grid ✓
│  ├─ Navbar fully visible ✓
│  └─ Modals medium width ✓
│
└─ Desktop (1920px)
   ├─ Sidebar visible fixed ✓
   ├─ Cards 4-column grid ✓
   ├─ Full navigation bar ✓
   └─ Modals with max-width ✓
```

### Test Cases untuk Login

```
TEST SUITE: AUTHENTICATION
├─ Admin Login
│  ├─ Email: admin@trevins.id ✓
│  ├─ Password: admin123 ✓
│  └─ Redirect ke dashboard ✓
│
├─ Vendor Login
│  ├─ Email: jatimpark@trevins.id ✓
│  ├─ Password: vendor123 ✓
│  └─ Redirect ke vendor dashboard ✓
│
└─ User Login
   ├─ Email: budi@trevins.id ✓
   ├─ Password: user123 ✓
   └─ Redirect ke home ✓
```

---

## 📈 TIMELINE & PRIORITAS

### Priority 1 (URGENT) - Week 1
- [ ] Fix responsive navbar & sidebar
- [ ] Test & verifikasi login
- [ ] Update seed script dengan proper hashing

### Priority 2 (HIGH) - Week 1-2
- [ ] Integrasikan mobile bottom nav
- [ ] Fix event cards grid
- [ ] Fix modal responsiveness

### Priority 3 (MEDIUM) - Week 2
- [ ] Optimasi spacing/padding semua component
- [ ] Browser compatibility testing
- [ ] Performance optimization

### Priority 4 (LOW) - Week 3+
- [ ] Add animations (framer-motion)
- [ ] Implement dark mode responsiveness
- [ ] Progressive Web App (PWA) optimization

---

## 🛠️ TEKNOLOGI & TOOLS

```
Framework:          Next.js 14.2
UI Components:      Shadcn/UI + Radix UI
Styling:            Tailwind CSS 3.4
State Management:   Zustand (auth-store)
Auth:               NextAuth.js 4.24 / JWT
Database:           Prisma + SQLite
Testing:            (To be defined)
```

---

## 📚 RESOURCES & FILE REFERENCES

### Key Files untuk Perbaikan:
- [src/components/shared/navbar.tsx](src/components/shared/navbar.tsx) - Navbar responsiveness
- [src/components/shared/sidebar.tsx](src/components/shared/sidebar.tsx) - Sidebar drawer
- [src/components/shared/mobile-bottom-nav.tsx](src/components/shared/mobile-bottom-nav.tsx) - Mobile nav
- [src/components/user/home-page.tsx](src/components/user/home-page.tsx) - Home layout
- [src/app/api/auth/route.ts](src/app/api/auth/route.ts) - Auth endpoint
- [prisma/seed.ts](prisma/seed.ts) - Dummy data
- [src/store/auth-store.ts](src/store/auth-store.ts) - Auth state
- [src/hooks/use-mobile.ts](src/hooks/use-mobile.ts) - Mobile detection

### Responsive Breakpoints (Tailwind):
```
sm: 640px   (small mobile)
md: 768px   (tablet)
lg: 1024px  (desktop)
xl: 1280px  (large desktop)
2xl: 1536px (extra large)
```

---

## 📝 NOTES

1. **Dummy Data Credentials** (after fixing):
   - Admin: `admin@trevins.id` / `admin123`
   - Vendor: `jatimpark@trevins.id` / `vendor123`
   - User: `budi@trevins.id` / `user123`

2. **Responsive Design Approach**:
   - Mobile-first: Design untuk mobile dulu, kemudian scale up
   - Gunakan Tailwind breakpoints secara konsisten
   - Test di berbagai ukuran viewport

3. **Password Security**:
   - Selalu hash password dengan bcryptjs sebelum menyimpan
   - Jangan pernah hardcode password di kode
   - Gunakan environment variables untuk sensitive data

---

**Next Action**: Mulai dari Responsive Design (Priority 1) - Update navbar & sidebar
