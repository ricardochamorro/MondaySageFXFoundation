import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import '@mondaysagefx/ui/dist/styles.css';
import { Navbar } from '../components/navbar';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Monday Sage FX',
  description: 'Monday.com augmentation for Sage FX Foundation & Construction',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Navbar />
        <div className="pt-16">{children}</div>
        <Toaster />
      </body>
    </html>
  );
}
