import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rowan | Casual Wear Pvt Ltd',
  description: 'Rowan internal accounting system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
