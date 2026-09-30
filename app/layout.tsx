import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { AppFrame } from '@/components/AppFrame';

export const metadata: Metadata = {
  title: 'Rowan | Casual Wear Pvt Ltd',
  description: 'Rowan internal accounting system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppFrame>{children}</AppFrame>
        </AuthProvider>
      </body>
    </html>
  );
}
