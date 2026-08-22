import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TapFlow — Google Review NFC & QR Card | InvictusWave',
  description:
    'Platform manajemen Google Review berbasis kartu NFC dan QR Code dengan redirect dinamis berperforma tinggi. Produk dari InvictusWave.',
  keywords: ['Google Review', 'NFC Card', 'QR Code', 'TapFlow', 'InvictusWave'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
