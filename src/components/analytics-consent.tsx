"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const CONSENT_KEY = "cola-eleitoral-2026:analytics-consent";
type ConsentValue = "accepted" | "declined" | null;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function initializeAnalytics(measurementId: string) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: unknown[]) => window.dataLayer?.push(args);
  window.gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    allow_ad_personalization_signals: false,
    allow_google_signals: false,
    anonymize_ip: true,
  });
}

export function AnalyticsConsent({ measurementId }: { measurementId?: string }) {
  const [consent, setConsent] = useState<ConsentValue>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const saved = window.localStorage.getItem(CONSENT_KEY);
      setConsent(saved === "accepted" || saved === "declined" ? saved : null);
      setReady(true);
    });
  }, []);

  function chooseConsent(value: Exclude<ConsentValue, null>) {
    window.localStorage.setItem(CONSENT_KEY, value);
    setConsent(value);
  }

  if (!measurementId) return null;

  return (
    <>
      {consent === "accepted" ? (
        <Script
          onLoad={() => initializeAnalytics(measurementId)}
          src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
          strategy="afterInteractive"
        />
      ) : null}

      {ready && consent === null ? (
        <aside aria-label="Preferências de métricas" className="consent-panel">
          <strong className="block text-sm text-slate-950">Métricas sem identificar suas escolhas</strong>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Podemos medir o uso das etapas. Nunca enviamos candidato, partido, número ou UF.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="consent-decline" onClick={() => chooseConsent("declined")} type="button">Agora não</button>
            <button className="consent-accept" onClick={() => chooseConsent("accepted")} type="button">Permitir métricas</button>
          </div>
        </aside>
      ) : null}
    </>
  );
}

export function AnalyticsPreferenceButton() {
  function resetConsent() {
    window.localStorage.removeItem(CONSENT_KEY);
    window.location.reload();
  }

  return <button className="font-bold text-slate-950 underline underline-offset-4" onClick={resetConsent} type="button">Revisar preferência de métricas</button>;
}
