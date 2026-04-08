'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Console error for debugging
    console.error('Trevins Application Error:', error);

    // Auto-reload on server action mismatch (Very common with PWA / Cloudflare behind Next.js)
    if (
      error.message?.includes('Failed to find Server Action') ||
      error.message?.includes('older or newer deployment') ||
      error.digest?.includes('NEXT_')
    ) {
      console.warn('Version mismatch or stale cache detected. Hard-reloading to fetch the latest JS bundle...');
      
      // Wipe session storage where temporary stale state might be located
      sessionStorage.clear();
      
      // Attempt to unregister service workers again just in case
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (let registration of registrations) {
            registration.unregister();
          }
        });
      }

      // Hard reload the browser
      setTimeout(() => {
        window.location.reload();
      }, 500); 
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Sinkronisasi Versi Diperlukan
        </h2>
        <p className="text-gray-500 max-w-[500px]">
          Aplikasi Trevins baru saja diperbarui. Terdapat konfigurasi cache lama di browser Anda yang menyebabkan kesalahan komunikasi dengan server.
        </p>
        
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => window.location.reload()}
            className="bg-[#2196F3] hover:bg-[#1976D2] text-white flex gap-2 w-full sm:w-auto"
          >
            <RefreshCcw className="w-4 h-4" />
            Muat Ulang Halaman (Disarankan)
          </Button>
          <Button 
            variant="outline" 
            onClick={() => reset()}
            className="w-full sm:w-auto"
          >
            Coba Lagi Action Ini
          </Button>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-red-50 text-red-800 text-left rounded-md overflow-auto max-h-[300px] max-w-[600px] text-xs">
            <p className="font-semibold mb-1">Developer Details (Only in Dev Mode):</p>
            <code>{error.message}</code>
            {error.stack && (
              <pre className="mt-2 text-[10px] whitespace-pre-wrap">{error.stack}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
