'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, CheckCircle2 } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/store/auth-store';
import type { ViewType } from '@/app/page';

// Form schemas
const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string().min(6, 'Konfirmasi password minimal 6 karakter'),
  role: z.enum(['USER', 'VENDOR']),
  terms: z.boolean().refine((val) => val === true, {
    message: 'Anda harus menyetujui syarat dan ketentuan',
  }),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Email tidak valid'),
});

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string().min(6, 'Konfirmasi password minimal 6 karakter'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;
type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

type InternalMode = 'login' | 'register' | 'forgot-password' | 'reset-password';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'register';
  onSwitchMode: () => void;
  onNavigate?: (view: ViewType) => void;
}

export function AuthModal({ isOpen, onClose, mode, onSwitchMode, onNavigate }: AuthModalProps) {
  const { login } = useAuthStore();
  const [internalMode, setInternalMode] = useState<InternalMode>(mode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";
  // In development, skip CAPTCHA requirement
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isCaptchaRequired = !isDevelopment;

  // Forms
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'USER', terms: false },
  });

  const forgotForm = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const resetForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  // Sync internal mode with props
  useEffect(() => {
    console.log('[DEBUG] AuthModal mode changed:', mode, 'isOpen:', isOpen);
    setInternalMode(mode);
    setError(null);
    setSuccessMessage(null);
    if (!isOpen) {
        loginForm.reset();
        registerForm.reset();
        setCaptchaToken(null);
    }
  }, [mode, isOpen, loginForm, registerForm]);

  // Handlers
  const onLoginSubmit = async (data: LoginFormValues) => {
    console.log('[DEBUG] Form data submitted:', data);
    setIsLoading(true);
    setError(null);
    try {
      if (isCaptchaRequired && !captchaToken) {
        console.warn('[WARN] Captcha token missing');
        throw new Error('Silakan lengkapi reCAPTCHA');
      }
      
      const payload = {
        email: data?.email || '',
        password: data?.password || '',
        captcha: captchaToken || (isDevelopment ? 'dev-skip' : '')
      };
      
      console.log('[DEBUG] Sending login payload:', payload.email);
      
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const result = await res.json();
      console.log('[DEBUG] Login API result:', result);
      
      if (!res.ok) throw new Error(result.error || 'Login gagal');
      
      if (!result.user || !result.token) {
        console.error('[ERROR] Missing user or token in response', result);
        throw new Error('Data user atau token tidak valid dari server');
      }

      login(result.user, result.token);
      onClose();
      if (onNavigate) onNavigate('dashboard');
    } catch (err: any) {
      console.error('[ERROR] Login handler failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      if (isCaptchaRequired && !captchaToken) throw new Error('Silakan lengkapi reCAPTCHA');
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Registrasi gagal');
      login(result.user, result.token);
      onClose();
      if (onNavigate) onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onForgotSubmit = async (data: ForgotPasswordValues) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal memproses permintaan');
      setSuccessMessage(result.message);
      if (result.debug_token) {
        setResetToken(result.debug_token);
        setTimeout(() => {
            setInternalMode('reset-password');
            setSuccessMessage(null);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onResetSubmit = async (data: ResetPasswordValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: data.password }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal reset password');
      setSuccessMessage(result.message);
      setTimeout(() => setInternalMode('login'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitch = () => {
    setError(null);
    setSuccessMessage(null);
    setCaptchaToken(null);
    onSwitchMode();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border border-gray-200 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-[#2196F3]">
            {internalMode === 'login' && 'Selamat Datang Kembali'}
            {internalMode === 'register' && 'Daftar Akun Trevins'}
            {internalMode === 'forgot-password' && 'Lupa Password?'}
            {internalMode === 'reset-password' && 'Atur Ulang Password'}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-500">
            {internalMode === 'login' && 'Masuk untuk mengelola tiket dan perjalanan Anda'}
            {internalMode === 'register' && 'Bergabunglah dengan komunitas traveler terbesar'}
            {internalMode === 'forgot-password' && 'Kami akan mengirimkan instruksi ke email Anda'}
            {internalMode === 'reset-password' && 'Gunakan password yang kuat dan aman'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="bg-green-50 border-green-200 text-green-700 animate-in fade-in slide-in-from-top-1">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <div className="mt-4">
          {internalMode === 'login' && (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input {...loginForm.register('email')} placeholder="nama@email.com" className="pl-10" />
                </div>
                {loginForm.formState.errors.email && <p className="text-xs text-red-500">{loginForm.formState.errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input {...loginForm.register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && <p className="text-xs text-red-500">{loginForm.formState.errors.password.message}</p>}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id="rem" {...loginForm.register('rememberMe')} />
                  <Label htmlFor="rem" className="text-xs cursor-pointer">Ingat saya</Label>
                </div>
                <button type="button" onClick={() => setInternalMode('forgot-password')} className="text-xs text-[#2196F3] hover:underline">Lupa password?</button>
              </div>
              <div className="flex justify-center py-2">
                <ReCAPTCHA sitekey={recaptchaKey} onChange={setCaptchaToken} />
              </div>
              <Button type="submit" className="w-full bg-[#2196F3] hover:bg-[#1976D2]" disabled={isLoading || (isCaptchaRequired && !captchaToken)}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Masuk'}
              </Button>
              <p className="text-center text-sm">Belum punya akun? <button type="button" onClick={handleSwitch} className="text-[#2196F3] font-bold">Daftar</button></p>
            </form>
          )}

          {internalMode === 'register' && (
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nama</Label>
                  <Input {...registerForm.register('name')} placeholder="Nama Lengkap" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input {...registerForm.register('email')} placeholder="Email" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nomor HP</Label>
                <Input {...registerForm.register('phone')} placeholder="08..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Password</Label>
                  <Input {...registerForm.register('password')} type="password" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Konfirmasi</Label>
                  <Input {...registerForm.register('confirmPassword')} type="password" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Daftar Sebagai</Label>
                <Select onValueChange={(v: any) => registerForm.setValue('role', v)} defaultValue="USER">
                   <SelectTrigger><SelectValue /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="USER">Pengguna</SelectItem>
                     <SelectItem value="VENDOR">Vendor</SelectItem>
                   </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 py-1">
                <Checkbox {...registerForm.register('terms')} id="terms" />
                <Label htmlFor="terms" className="text-[10px] sm:text-xs">Saya setuju dengan syarat & ketentuan</Label>
              </div>
              <div className="flex justify-center scale-75 origin-top">
                <ReCAPTCHA sitekey={recaptchaKey} onChange={setCaptchaToken} />
              </div>
              <Button type="submit" className="w-full bg-[#2196F3]" disabled={isLoading || (isCaptchaRequired && !captchaToken)}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Daftar Sekarang'}
              </Button>
              <p className="text-center text-xs">Sudah ada akun? <button type="button" onClick={handleSwitch} className="text-[#2196F3] font-bold">Masuk</button></p>
            </form>
          )}

          {internalMode === 'forgot-password' && (
            <form onSubmit={forgotForm.handleSubmit(onForgotSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Alamat Email</Label>
                <Input {...forgotForm.register('email')} placeholder="Masukkan email terdaftar" />
              </div>
              <Button type="submit" className="w-full bg-[#2196F3]" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Kirim Link Reset'}
              </Button>
              <Button variant="ghost" type="button" onClick={() => setInternalMode('login')} className="w-full">Kembali</Button>
            </form>
          )}

          {internalMode === 'reset-password' && (
            <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Password Baru</Label>
                <Input {...resetForm.register('password')} type="password" />
              </div>
              <div className="space-y-2">
                <Label>Konfirmasi Password Baru</Label>
                <Input {...resetForm.register('confirmPassword')} type="password" />
              </div>
              <Button type="submit" className="w-full bg-[#2196F3]" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan Password'}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AuthModal;
