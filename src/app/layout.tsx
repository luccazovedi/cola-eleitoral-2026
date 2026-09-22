import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { AnalyticsConsent } from "@/components/analytics-consent";
import "./globals.css";

const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const ga4MeasurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

export const metadata: Metadata = {
  title: "Cola Eleitoral 2026",
  description:
    "MVP neutro e privado para montar uma cola eleitoral digital com dados oficiais do TSE.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f3f5f7",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <AnalyticsConsent measurementId={ga4MeasurementId} />
        {adsenseClientId ? (
          <Script
            async
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
