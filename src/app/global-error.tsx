'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { RefreshCcw } from 'lucide-react';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {

  // Attempt to recover automatically for cache issues even at global layout level
  if (
    error.message?.includes('older or newer deployment') || 
    error.message?.includes('Failed to find Server Action')
  ) {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans antialiased bg-gray-50 text-gray-900`}>
        <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 text-center">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-md w-full">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Oops!
            </h2>
            <p className="text-gray-500 mb-8">
              Terjadi kesalahan sistem yang sangat fatal, atau browser gagal mengeksekusi kerangka aplikasi. 
              Sistem akan memuat ulang secara otomatis atau silakan klik tombol di bawah.
            </p>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 flex items-center justify-center gap-2 bg-[#2196F3] text-white rounded-lg font-medium hover:bg-[#1976D2] transition-colors"
            >
              <RefreshCcw className="w-5 h-5" />
              Muat Ulang Aplikasi Seutuhnya
            </button>
            
            <button
              onClick={() => reset()}
              className="w-full py-3 px-4 mt-3 bg-transparent border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Coba Pulihkan
            </button>
            
            {process.env.NODE_ENV === 'development' && (
               <div className="mt-8 p-4 bg-red-50 text-red-800 text-left rounded-md text-xs overflow-auto max-h-[300px]">
                 <p className="font-semibold mb-1">Global Error Message:</p>
                 <code className="block whitespace-pre-wrap">{error.message}</code>
                 <p className="font-semibold mb-1 mt-4">Stack:</p>
                 <code className="block whitespace-pre-wrap text-[10px]">{error.stack}</code>
               </div>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
