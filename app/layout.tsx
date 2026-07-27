import type { Metadata } from 'next'
import './globals.css'
import Navigation from './components/Navigation'
import DailyAnnouncementModal from './components/DailyAnnouncementModal'
export const metadata: Metadata = {
  title: 'Goodwill Store Order System',
  description: 'Internal store supply ordering system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        <DailyAnnouncementModal />
        <main className="min-h-screen bg-[#f8f9fa]">          {children}
        </main>
      </body>
    </html>
  )
}
