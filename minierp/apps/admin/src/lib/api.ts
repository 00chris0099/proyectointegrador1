const API_URL = 'https://aimachristian-backendintegrador.ajcxjb.easypanel.host';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export function setAccessToken(token: string) {
  localStorage.setItem('accessToken', token);
}

export function clearAccessToken() {
  localStorage.removeItem('accessToken');
}

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = { ...authHeaders(), ...(options.headers as Record<string, string> || {}) };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  return fetch(url.startsWith('http') ? url : `${API_URL}${url}`, { ...options, headers });
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await authFetch(endpoint, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error en la petición');
  return data;
}

export interface UploadResult { url: string; deleteUrl: string; filename: string; mimetype: string; size: number; }
export interface DocumentoInfo { id: number; urlArchivo: string; nombreOriginal: string; tipoMime: string; pesoBytes: number; createdAt: string; }

export async function uploadFile(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await authFetch(`${API_URL}/api/upload`, { method: 'POST', body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al subir archivo');
  return data.data;
}

export async function addDocumentoToTramite(tramiteId: string, file: File): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await authFetch(`${API_URL}/api/tramites/${tramiteId}/documentos`, { method: 'POST', body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al agregar documento');
}

export async function getDocumentos(tramiteId: string): Promise<DocumentoInfo[]> {
  const data = await fetchApi<{ success: boolean; data: DocumentoInfo[] }>(`/api/tramites/${tramiteId}/documentos`);
  return data.data;
}

export async function deleteDocumento(tramiteId: string, docId: number): Promise<void> {
  const res = await authFetch(`${API_URL}/api/tramites/${tramiteId}/documentos/${docId}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al eliminar documento');
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function getFileIcon(mimetype: string): string {
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype.startsWith('image/')) return 'image';
  return 'file';
}
