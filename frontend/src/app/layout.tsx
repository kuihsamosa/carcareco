import { type Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
config.autoAddCss = false

import '@/_styles/tailwind.css'
import { ThemeProvider } from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: {
    template: '%s',
    default: 'Repair and maintenance',
  },
  description:
    'Streamline your car repair business with our all-in-one web app. Track work progress, create jobs, manage services and products, generate offers, issue invoices, and organize your cars and clients effortlessly. Designed to help you save time, boost productivity, and grow your business—your workshop deserves more than just tools; it deserves a partner in success.',
}

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-plus-jakarta',
})

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <html className={`h-full ${plusJakartaSans.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light')document.documentElement.classList.remove('dark');else document.documentElement.classList.add('dark')}catch(e){document.documentElement.classList.add('dark')}})()` }} />
      </head>
      <body className="h-full bg-background text-foreground">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
