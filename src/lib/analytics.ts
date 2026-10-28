/**
 * URBANNOISE Analytics Client
 * Sistema de Analítica Web Privacy-First conforme a:
 * - Colombia: Ley 1581 de 2012 (Habeas Data)
 * - Unión Europea: RGPD / Directiva ePrivacy (consentimiento y no rastreo invasivo)
 * - EE.UU.: CCPA / CPRA
 */

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
}

const STORAGE_CONSENT_KEY = 'urbannoise_cookie_consent_v2';
const STORAGE_EVENTS_KEY = 'urbannoise_analytics_local_v1';

export function getCookieConsent(): { accepted: boolean; analytics: boolean; timestamp?: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCookieConsent(preferences: { accepted: boolean; analytics: boolean }): void {
  try {
    const payload = { ...preferences, timestamp: new Date().toISOString() };
    localStorage.setItem(STORAGE_CONSENT_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('urbannoise_consent_updated', { detail: payload }));
  } catch (e) {
    console.warn('Error guardando consentimiento:', e);
  }
}

export function trackEvent(eventName: string, properties: Record<string, any> = {}): void {
  try {
    const consent = getCookieConsent();
    // Respetar decisión del usuario si declinó analítica
    if (consent && consent.analytics === false) {
      return;
    }

    const eventPayload: AnalyticsEvent = {
      event: eventName,
      properties: {
        ...properties,
        url: window.location.href,
        path: window.location.pathname + window.location.hash,
        referrer: document.referrer || 'direct',
        timestamp: new Date().toISOString(),
      },
    };

    // 1. Google Tag Manager / DataLayer compatible
    if (typeof window !== 'undefined') {
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({
        event: eventName,
        ...eventPayload.properties,
      });
    }

    // 2. Registro en servidor local (solo en entorno de desarrollo local con Node.js)
    const isLocalDev =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.port === '3000' ||
        window.location.port === '5173');

    if (isLocalDev) {
      fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventPayload),
        keepalive: true,
      }).catch(() => {});
    }

    // 3. Respaldo local
    try {
      const raw = localStorage.getItem(STORAGE_EVENTS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      list.unshift({ ...eventPayload, date: new Date().toLocaleTimeString() });
      if (list.length > 50) list.pop();
      localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(list));
    } catch {}
  } catch (err) {
    console.debug('Analytics event dropped:', err);
  }
}
