import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import NavbarFooterWrapper, { FooterWrapper } from '../components/NavbarFooterWrapper';
import GoogleOAuthWrapper from '../components/GoogleOAuthWrapper';
import ClientThemeProvider from '../components/ClientThemeProvider';
import ClientNotificationProvider from '../components/ClientNotificationProvider';
import { ClientReviewsProvider } from '../contexts/ReviewsContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'ChargeLoop',
  description: 'Peer-to-peer EV charging platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClientThemeProvider>
          <ClientNotificationProvider>
            <ClientReviewsProvider>
              <GoogleOAuthWrapper>
                <div className="min-h-screen bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors flex flex-col">
                  <NavbarFooterWrapper />
                  <main className="flex-1">{children}</main>
                  <FooterWrapper />
                </div>
              </GoogleOAuthWrapper>
            </ClientReviewsProvider>
          </ClientNotificationProvider>
        </ClientThemeProvider>
      </body>
    </html>
  );
}
