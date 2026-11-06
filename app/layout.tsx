import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: { default: `${siteConfig.siteName} – print-on-demand books, delivered in the UK`, template: `%s · ${siteConfig.siteName}` },
  description: siteConfig.tagline,
};

// Every page reads the session/cart cookie and the live database.
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
