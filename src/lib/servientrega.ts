// -------------------------------------------------------------
// CLIENTE SERVIENTREGA API (SISCORE)
// Documentación: https://www.servientregaapi.com/docs/public
// -------------------------------------------------------------

export interface ServientregaTrackingResult {
  success: boolean;
  configured?: boolean;
  guia?: string;
  tracking?: any;
  error?: string;
  details?: string;
  status?: number;
}

export async function fetchServientregaStatus(): Promise<{
  configured: boolean;
  env: string;
  hasClientKey: boolean;
  hasBearerToken: boolean;
  docUrl: string;
}> {
  try {
    const res = await fetch('/api/shipping/servientrega/status');
    return await res.json();
  } catch {
    return {
      configured: false,
      env: 'sandbox',
      hasClientKey: false,
      hasBearerToken: false,
      docUrl: 'https://www.servientregaapi.com/docs/public',
    };
  }
}

export async function trackServientregaGuia(guia: string): Promise<ServientregaTrackingResult> {
  try {
    const res = await fetch(`/api/shipping/servientrega/tracking/${encodeURIComponent(guia.trim())}`);
    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Error de conexión con el servicio de rastreo.',
    };
  }
}
