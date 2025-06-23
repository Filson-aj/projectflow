'use client';

import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { PrimeReactProvider } from 'primereact/api';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Toaster } from 'sonner';
import 'primereact/resources/themes/lara-light-cyan/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <SessionProvider>
          <PrimeReactProvider>
            {children}
            <Toaster position="top-right" richColors />
            <ConfirmDialog />
          </PrimeReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}