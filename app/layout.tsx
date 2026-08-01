import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  style: ["normal", "italic"],
  display: "swap",
});

const SITE_TITLE = "Servicialo — El protocolo abierto para coordinar servicios";
const SITE_DESCRIPTION =
  "Servicialo es el protocolo abierto de dominio para coordinar servicios: conecta lo acordado, lo entregado, la evidencia y la liquidación mediante una semántica común para personas, plataformas y agentes. Cada entrega puede acreditarse con una Prueba de Servicio: el expediente verificable que vincula esos elementos.";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "https://servicialo.com",
    siteName: "Servicialo",
    locale: "es_CL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  metadataBase: new URL("https://servicialo.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${ibmPlexMono.variable} ${instrumentSerif.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: "Servicialo — El protocolo abierto para coordinar servicios",
              description:
                "Servicialo es el protocolo abierto de dominio para coordinar servicios: conecta lo acordado, lo entregado, la evidencia y la liquidación mediante una semántica común para personas, plataformas y agentes.",
              url: "https://servicialo.com",
              inLanguage: "es",
            }),
          }}
        />
      </head>
      <body className="bg-bg text-text font-sans antialiased transition-colors duration-300">
        <Navbar />
        <main>{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
