"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

type AdSlotProps = {
  clientId?: string;
  slotId?: string;
};

export function AdSlot({ clientId, slotId }: AdSlotProps) {
  useEffect(() => {
    if (!clientId || !slotId) {
      return;
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Bloqueadores de anúncio não devem afetar o fluxo eleitoral.
    }
  }, [clientId, slotId]);

  if (!clientId || !slotId) {
    return null;
  }

  return (
    <aside aria-label="Publicidade" className="ad-container">
      <p className="ad-label">Publicidade</p>
      <ins
        className="adsbygoogle block min-h-[90px] w-full overflow-hidden"
        data-ad-client={clientId}
        data-ad-format="auto"
        data-ad-slot={slotId}
        data-full-width-responsive="true"
      />
    </aside>
  );
}
