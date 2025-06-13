import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Boopin Attendance Dashboard - Live Analytics',
  description: 'Real-time employee attendance tracking and analytics. View daily reports, weekly summaries, and attendance trends with interactive charts and insights.',
  keywords: 'attendance tracking, employee analytics, dashboard, attendance reports, HR analytics',
  authors: [{ name: 'Boopin' }],
  openGraph: {
    title: 'Boopin Attendance Dashboard',
    description: 'Real-time employee attendance tracking and analytics dashboard',
    url: 'https://boopin-attendance-dashboard.vercel.app',
    siteName: 'Boopin Attendance Dashboard',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Boopin Attendance Dashboard',
    description: 'Real-time employee attendance tracking and analytics',
  },
  robots: {
    index: false, // Set to true if you want search engines to index
    follow: false,
  },
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}