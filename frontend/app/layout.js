import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'TaskDigitalCrowd — Multi-tenant SaaS Task Board Manager',
  description:
    'Assign Tasks. Track Progress. Get Work Done. Digital Crowd Technologies SaaS task management platform.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#F8F6FA] text-[#251A2D] antialiased" suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
