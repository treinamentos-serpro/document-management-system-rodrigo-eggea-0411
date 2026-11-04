const apiPrefix = '/api';
const userId = import.meta.env.VITE_DMS_USER_ID || 'local-user';

async function request(path, options = {}) {
  const response = await fetch(`${apiPrefix}${path}`, {
    ...options,
    headers: {
      'X-User-Id': userId,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message || 'Não foi possível concluir a solicitação.');
  }

  return response;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', {
    method: 'POST',
    body: formData,
  });

  return response.json();
}

export async function listDocuments() {
  const response = await request('/documents');
  const result = await response.json();
  return result.documents;
}

function getFilename(contentDisposition) {
  const encodedName = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];

  if (encodedName) {
    try {
      return decodeURIComponent(encodedName);
    } catch {
      return encodedName;
    }
  }

  return contentDisposition.match(/filename="?([^";]+)"?/i)?.[1] || 'documento';
}

export async function downloadDocument(documentId) {
  const response = await request(`/documents/${encodeURIComponent(documentId)}/download`);

  return {
    blob: await response.blob(),
    filename: getFilename(response.headers.get('Content-Disposition') || ''),
  };
}