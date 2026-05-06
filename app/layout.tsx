import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

function getSiteUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configuredUrl) {
    return "https://confession-app.vercel.app";
  }

  if (configuredUrl.startsWith("http://") || configuredUrl.startsWith("https://")) {
    return configuredUrl;
  }

  return `https://${configuredUrl}`;
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Confissão em Cuiabá | Horários de Missa e Confissão",
    template: "%s | Confissão em Cuiabá",
  },
  description:
    "Consulte horários de confissão e missa em Cuiabá por igreja e paróquia, com filtros por dia e busca por nome.",
  applicationName: "Confissão em Cuiabá",
  keywords: [
    "confissão em Cuiabá",
    "horários de missa Cuiabá",
    "igrejas em Cuiabá",
    "paróquias Cuiabá",
    "arquidiocese de Cuiabá",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Confissão em Cuiabá",
    title: "Confissão em Cuiabá | Horários de Missa e Confissão",
    description:
      "Encontre horários de confissão e missa em Cuiabá com busca por igreja e filtros por dia.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Confissão em Cuiabá | Horários de Missa e Confissão",
    description:
      "Encontre horários de confissão e missa em Cuiabá com busca por igreja e filtros por dia.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
