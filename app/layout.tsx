import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";
import { Navbar } from "@/components/Navbar";
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

export const metadata: Metadata = {
  title: "Servicialo — El estándar abierto para servicios",
  description:
    "Servicialo es el estándar abierto para crear, entregar y verificar servicios. Aprende a crear un servicio desde lo que ya tienes.",
  openGraph: {
    title: "Servicialo — El estándar abierto para servicios",
    description:
      "Servicialo es el estándar abierto para crear, entregar y verificar servicios. Aprende a crear un servicio desde lo que ya tienes.",
    url: "https://servicialo.com",
    siteName: "Servicialo",
    locale: "es_CL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Servicialo — El estándar abierto para servicios",
    description:
      "El estándar abierto para crear, entregar y verificar servicios — para humanos y para agentes AI.",
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
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: "Servicialo — El estándar abierto para servicios",
              description:
                "Servicialo es el estándar abierto para crear, entregar y verificar servicios.",
              url: "https://servicialo.com",
              inLanguage: "es",
            }),
          }}
        />
      </head>
      <body className="bg-bg text-text font-sans antialiased">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
