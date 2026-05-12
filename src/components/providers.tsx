/**
 * Client-side Providers
 * 
 * Wraps the app with TanStack Query, Auth, Theme, and Toast providers.
 */

'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/lib/auth-context';
import { PWAInstallPrompt } from '@/components/pwa-install-prompt';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <TooltipProvider delay={300}>
            {children}
            <PWAInstallPrompt />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                classNames: {
                  toast: 'font-sans',
                },
              }}
              richColors
              closeButton
            />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
