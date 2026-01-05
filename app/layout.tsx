import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
