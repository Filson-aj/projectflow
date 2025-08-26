'use client';

import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { PrimeReactProvider } from 'primereact/api';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Toaster } from 'sonner';
import 'primereact/resources/themes/lara-light-cyan/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

export const meta = {
  title: 'Project Management System',
  description: 'A comprehensive project management system for academic projects, including student submissions, supervisor reviews, and administrative oversight.',
};

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