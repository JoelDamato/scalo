import type React from "react"
import { Manrope } from "next/font/google"
import Script from "next/script"
import "@/styles/globals.css"

const manrope = Manrope({ subsets: ["latin"] })

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
}

export const metadata = {
  title: "Scalo",
  description:
    "Ayudamos a profesionales escalando su facturación digital de forma estable, para que puedan enfocarse solo en su práctica y disfrutar su trabajo.",
  keywords:
    "Ayudamos a profesionales escalando su facturación digital de forma estable, para que puedan enfocarse solo en su práctica y disfrutar su trabajo.",
  authors: [{ name: "Scalo" }],
  openGraph: {
    title: "Scalo | Estas a una desicion de escalar tu negocio.",
    description:
      "Ayudamos a profesionales escalando su facturación digital de forma estable, para que puedan enfocarse solo en su práctica y disfrutar su trabajo.",
    url: "https://scalo.tech",
    siteName: "Scalo",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scalo | Estas a una desicion de escalar tu negocio.",
    description:
      "Ayudamos a profesionales escalando su facturación digital de forma estable, para que puedan enfocarse solo en su práctica y disfrutar su trabajo.",
  },
  icons: {
    icon: [
      {
        url: "/logo.png",
        type: "image/png",
      },
    ],
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-J8S0MGKMH1" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-J8S0MGKMH1');
          `}
        </Script>
      </head>
      <body className={manrope.className}>{children}</body>
    </html>
  )
}
