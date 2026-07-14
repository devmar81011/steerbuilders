import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { company } from "@/lib/company-content";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const siteDescription =
  "Steer Builders Corporation — residential and commercial design-build, renovation, fit-outs, and project management for homeowners and developers in Cebu and the region.";

export const metadata: Metadata = {
  metadataBase: new URL("https://steerbuilders-psi.vercel.app"),
  title: {
    default: `${company.name} | Construction in Cebu`,
    template: `%s | ${company.name}`,
  },
  description: siteDescription,
  keywords: [
    "Steer Builders Corporation",
    "construction Cebu",
    "general contractor Cebu",
    "residential renovation",
    "commercial fit-out",
    "project management",
  ],
  openGraph: {
    title: `${company.name} | ${company.mantra}`,
    description: siteDescription,
    type: "website",
    locale: "en_PH",
    siteName: company.name,
    images: [
      {
        url: "/brand/logo-full.png",
        width: 1200,
        height: 630,
        alt: company.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${company.name} | ${company.mantra}`,
    description: siteDescription,
    images: ["/brand/logo-full.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://steerbuilderscorporation.com/#organization",
  name: company.name,
  description: siteDescription,
  slogan: company.mantra,
  telephone: company.phoneHref.replace("tel:", ""),
  email: company.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Space 308 OneTree Plaza Hotel, R. Duterte St., Banawa",
    addressLocality: "Cebu City",
    addressRegion: "Cebu",
    addressCountry: "PH",
  },
  areaServed: ["Cebu", "Central Visayas", "Philippines"],
  foundingDate: String(company.founded),
  url: "https://steerbuilderscorporation.com",
  hasMap: company.mapsHref,
  image: "/brand/logo-full.png",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-sbc-off-white text-sbc-black">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessJsonLd),
          }}
        />
        {children}
      </body>
    </html>
  );
}
