import { useState } from 'react';
import { downloadDocument } from '../services/documentApi.js';

export default function DownloadButton({ documentId, onError }) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);

    try {
      const { blob, filename } = await downloadDocument(documentId);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      onError(error.message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <button
      className="text-button download-button"
      type="button"
      onClick={handleDownload}
      disabled={isDownloading}
      aria-label={isDownloading ? 'Baixando documento' : 'Baixar documento'}
      title="Baixar documento"
    >
      <span aria-hidden="true">↓</span>
      {isDownloading ? 'Baixando…' : 'Baixar'}
    </button>
  );
}