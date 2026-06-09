// =============================================================================
// app/layout.tsx · root layout. Fontes + Tailwind globals + data-theme/density inicial.
// =============================================================================

import type { Metadata } from 'next';
import './globals.css'; // Tailwind base + tokens (mapear de design/styles.css :root)

export const metadata: Metadata = {
  title: 'LeCode · Performance Review',
  description: 'Plataforma de avaliação de desempenho dos contratados da LeCode.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // data-theme/density default = dark/regular; o cliente reidrata de useUiPrefs.
  return (
    <html lang="pt-BR" data-theme="dark" data-density="regular" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
