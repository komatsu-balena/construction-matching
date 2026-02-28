import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '建設マッチング',
    template: '%s | 建設マッチング',
  },
  description: '建設業者専門のビジネスマッチングプラットフォーム。元請・下請のマッチングを効率化します。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
