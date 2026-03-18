# 🔐 LOGIN & AUTHENTICATION FIX GUIDE

**File**: LOGIN_AUTH_FIX.md  
**Created**: March 12, 2026

---

## 📌 OVERVIEW

Panduan lengkap untuk memperbaiki sistem login dan dummy data di Trevins.

---

## 🔍 ROOT CAUSE ANALYSIS

### Masalah Utama
```
Dummy data ada di database, tapi login TIDAK BERFUNGSI
↓
Kemungkinan penyebab:
1. Password tidak di-hash dengan benar
2. Auth API tidak compare password dengan benar
3. JWT token tidak di-generate
4. Auth store tidak ter-synchronize
5. Redirect setelah login tidak berfungsi
```

---

## ✅ SOLUTION CHECKLIST

### 1. Verify Database Credentials

**Step**: Buka Prisma Studio untuk melihat data di database

```bash
# Run Prisma Studio
npx prisma studio

# Kemudian:
# 1. Buka tab "User"
# 2. Lihat list users (admin@trevins.id, budi@trevins.id, dll)
# 3. Lihat password field - apakah sudah hashed atau plain text?
# 4. Jika plain text, maka ini masalahnya!
```

### 2. Fix Password Hashing in Seed

**File**: [prisma/seed.ts](prisma/seed.ts)

**Current Issue**: Password likely plain text (or not properly hashed)

**Solution**:

```typescript
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data (optional)
  // await prisma.user.deleteMany({});

  // Hash passwords correctly
  const adminPassword = await bcryptjs.hash('admin123', 10);
  const vendorPassword = await bcryptjs.hash('vendor123', 10);
  const userPassword = await bcryptjs.hash('user123', 10);

  // ADMIN USERS
  const admin1 = await prisma.user.upsert({
    where: { email: 'admin@trevins.id' },
    update: { password: adminPassword }, // Update password with hash
    create: {
      email: 'admin@trevins.id',
      name: 'Admin Super',
      password: adminPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });

  const admin2 = await prisma.user.upsert({
    where: { email: 'admin2@trevins.id' },
    update: { password: adminPassword },
    create: {
      email: 'admin2@trevins.id',
      name: 'Admin Operasional',
      password: adminPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });

  const finance = await prisma.user.upsert({
    where: { email: 'finance@trevins.id' },
    update: { password: adminPassword },
    create: {
      email: 'finance@trevins.id',
      name: 'Finance Admin',
      password: adminPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });

  // VENDOR USERS
  const vendorList = [
    { email: 'jatimpark@trevins.id', name: 'Jatim Park' },
    { email: 'bromo@trevins.id', name: 'Bromo Adventure' },
    { email: 'pantaiparadise@trevins.id', name: 'Pantai Paradise' },
    { email: 'balitours@trevins.id', name: 'Bali Tours' },
    { email: 'rajaampat@trevins.id', name: 'Raja Ampat' },
  ];

  for (const vendor of vendorList) {
    await prisma.user.upsert({
      where: { email: vendor.email },
      update: { password: vendorPassword },
      create: {
        email: vendor.email,
        name: vendor.name,
        password: vendorPassword,
        role: 'VENDOR',
        emailVerified: new Date(),
      },
    });
  }

  // REGULAR USERS
  const userList = [
    { email: 'budi@trevins.id', name: 'Budi Santoso' },
    { email: 'siti@trevins.id', name: 'Siti Nurhaliza' },
    { email: 'ahmad@trevins.id', name: 'Ahmad Rahman' },
    { email: 'dewi@trevins.id', name: 'Dewi Lestari' },
    { email: 'andi@trevins.id', name: 'Andi Wijaya' },
    // ... add more users as needed
  ];

  for (const user of userList) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { password: userPassword },
      create: {
        email: user.email,
        name: user.name,
        password: userPassword,
        role: 'USER',
        emailVerified: new Date(),
      },
    });
  }

  console.log('✅ Seed data created successfully!');
  console.log('Test credentials:');
  console.log('- Admin: admin@trevins.id / admin123');
  console.log('- Vendor: jatimpark@trevins.id / vendor123');
  console.log('- User: budi@trevins.id / user123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Run seed**:
```bash
npm run db:seed
```

### 3. Verify/Fix Auth API

**File**: [src/app/api/auth/route.ts](src/app/api/auth/route.ts)

**Check**: Password comparison logic

```typescript
// EXPECTED IMPLEMENTATION

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Check if user exists
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Compare password with hash ⭐ CRITICAL
    const isPasswordValid = await bcryptjs.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return success response
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
```

### 4. Update Auth Store

**File**: [src/store/auth-store.ts](src/store/auth-store.ts)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'VENDOR' | 'USER';
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Login failed');
          }

          const data = await response.json();

          // Store token and user
          set({
            user: data.user,
            token: data.token,
            isLoading: false,
            error: null,
          });

          // Optional: Store token in localStorage
          localStorage.setItem('authToken', data.token);
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          error: null,
        });
        localStorage.removeItem('authToken');
      },

      setUser: (user: User | null) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);
```

### 5. Update Auth Modal

**File**: [src/components/shared/authModal.tsx](src/components/shared/authModal.tsx)

```typescript
import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState('admin@trevins.id'); // Default for testing
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Login successful!');
      onClose();
      router.push('/dashboard'); // Redirect based on role
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-2xl font-bold">Login to TREVINS</h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg"
            disabled={isLoading}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg"
            disabled={isLoading}
          />

          {/* Test credentials hint */}
          <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
            <p><strong>Test Credentials:</strong></p>
            <p>Admin: admin@trevins.id / admin123</p>
            <p>User: budi@trevins.id / user123</p>
            <p>Vendor: jatimpark@trevins.id / vendor123</p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🔄 STEP-BY-STEP FIX PROCESS

### Phase 1: Database Fix (15 min)

```bash
# Step 1: Open Prisma Studio
npx prisma studio

# Step 2: Check current user passwords (manually verify)
# Are they hashed (long bcrypt strings) or plain text (short)?

# Step 3: Update seed.ts with proper password hashing
# (Copy code from section 2 above)

# Step 4: Reset database and re-seed
npm run db:reset
# OR if you want to keep data:
npm run db:seed
```

### Phase 2: Auth API Fix (10 min)

```
1. Review /src/app/api/auth/route.ts
2. Verify bcryptjs.compare() is used
3. Verify JWT token is generated
4. Check error handling
5. Add console logs for debugging
```

### Phase 3: Store Update (10 min)

```
1. Update /src/store/auth-store.ts
2. Add proper error handling
3. Add localStorage persistence
4. Test store initialization
```

### Phase 4: Modal Update (5 min)

```
1. Update /src/components/shared/authModal.tsx
2. Add test credentials display
3. Add loading and error states
4. Implement redirect after login
```

### Phase 5: Testing (20 min)

```bash
# Test login with various credentials
Login Tests:
✓ Admin: admin@trevins.id / admin123
✓ Vendor: jatimpark@trevins.id / vendor123
✓ User: budi@trevins.id / user123
✓ Invalid email
✓ Invalid password
✓ Redirect after successful login
✓ Error toast on failure
```

---

## 🧪 DEBUGGING TIPS

### If login still fails:

#### 1. Check password hash format
```bash
# See what's actually in database
npx prisma studio
# Look at User table, check password field
# Should look like: $2a$10$... (bcrypt hash)
# If it's short like "admin123", password is not hashed!
```

#### 2. Test password comparison directly
```typescript
// Add this to test api or frontend
import bcryptjs from 'bcryptjs';

async function testPassword() {
  const plainPassword = 'admin123';
  const hash = '$2a$10$...'; // actual hash from DB
  
  const isValid = await bcryptjs.compare(plainPassword, hash);
  console.log('Password match:', isValid);
}
```

#### 3. Add console logs to auth API
```typescript
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    console.log('Login attempt:', email);

    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    console.log('User found:', user?.email);
    console.log('Password in DB:', user?.password.substring(0, 10) + '...');

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);

    // ... rest of code
  }
}
```

#### 4. Check browser console
```javascript
// Open DevTools (F12)
// Switch to Console tab
// Try login and check for errors
// Look for toast notifications
```

---

## 📋 CREDENTIALS AFTER FIX

```
ADMIN USERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email:    admin@trevins.id
Password: admin123
Role:     ADMIN (Super Admin)

Email:    admin2@trevins.id
Password: admin123
Role:     ADMIN

Email:    finance@trevins.id
Password: admin123
Role:     ADMIN (Finance)


VENDOR USERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email:    jatimpark@trevins.id
Password: vendor123
Name:     Jatim Park

Email:    bromo@trevins.id
Password: vendor123
Name:     Bromo Adventure

Email:    pantaiparadise@trevins.id
Password: vendor123
Name:     Pantai Paradise

Email:    balitours@trevins.id
Password: vendor123
Name:     Bali Tours

Email:    rajaampat@trevins.id
Password: vendor123
Name:     Raja Ampat


REGULAR USERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email:    budi@trevins.id
Password: user123

Email:    siti@trevins.id
Password: user123

Email:    ahmad@trevins.id
Password: user123

Email:    dewi@trevins.id
Password: user123

Email:    andi@trevins.id
Password: user123
```

---

## ✅ VALIDATION CHECKLIST

- [ ] Passwords in DB are hashed (bcrypt format)
- [ ] bcryptjs.compare() works correctly
- [ ] JWT token generated on successful login
- [ ] Auth store persists user data
- [ ] Login redirect works
- [ ] Error toast shows on failure
- [ ] Test all 3 role logins
- [ ] Test invalid credentials
- [ ] Token stored in localStorage
- [ ] Token sent in API headers

