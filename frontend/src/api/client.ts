import { DiagnoseResponse, SessionTurn } from '../types/diagnostic';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function diagnoseMachinery(
  imageBlob: Blob | File,
  notes: string = '',
  language: string = 'ta'
): Promise<DiagnoseResponse> {
  const formData = new FormData();
  formData.append('image', imageBlob, 'field_capture.jpg');
  if (notes) {
    formData.append('notes', notes);
  }
  formData.append('language', language);

  const response = await fetch(`${API_BASE_URL}/diagnose`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Diagnostic server returned ${response.status}: ${errorText}`);
  }

  const data: DiagnoseResponse = await response.json();
  return data;
}

export async function getSessionHistory(): Promise<{ context_limit: number; count: number; history: SessionTurn[] }> {
  try {
    const response = await fetch(`${API_BASE_URL}/history`);
    if (!response.ok) throw new Error('Failed to fetch history');
    return await response.json();
  } catch (err) {
    return { context_limit: 3, count: 0, history: [] };
  }
}

export async function resetSessionHistory(): Promise<void> {
  await fetch(`${API_BASE_URL}/history`, { method: 'DELETE' });
}

export function resolveAudioUrl(relativeOrAbsoluteUrl: string): string {
  if (!relativeOrAbsoluteUrl) return '';
  if (relativeOrAbsoluteUrl.startsWith('http://') || relativeOrAbsoluteUrl.startsWith('https://')) {
    try {
      const url = new URL(relativeOrAbsoluteUrl);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return url.pathname;
      }
    } catch {
      // ignore parsing error
    }
    return relativeOrAbsoluteUrl;
  }
  return relativeOrAbsoluteUrl.startsWith('/') ? relativeOrAbsoluteUrl : `/${relativeOrAbsoluteUrl}`;
}
