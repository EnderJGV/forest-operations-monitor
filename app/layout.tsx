import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const _geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: 'Aiko Digital - Web motitor de operação florestal',
  description: 'Centro de Monitoramento Operacional Digital - Gestao de colheita florestal, logistica e monitoramento de maquinas',
}

export const viewport: Viewport = {
  themeColor: '#0B3D2E',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${_inter.variable} ${_geistMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          {children}
          <Toaster
            position="top-right"
            theme="dark"
          />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
