export type AnalyticsEventName =
  | "candidate_select"
  | "cola_complete"
  | "export_receipt"
  | "flow_review"
  | "flow_start"
  | "flow_step_view";

export function trackEvent(name: AnalyticsEventName, parameters?: Record<string, string | number>) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, parameters ?? {});
}
