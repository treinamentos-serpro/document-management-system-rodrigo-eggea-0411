import { useState } from 'react';
import DownloadButton from './DownloadButton.jsx';
import { formatDate, formatFileSize } from '../services/formatters.js';

export default function DocumentList({ documents, isLoading, onRefresh, onError }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function handleRefresh() {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  }

  return (
    <div className="document-list">
      <div className="list-toolbar">
        <span className="list-label">ARQUIVOS RECENTES</span>
        <button
          className="refresh-button"
          type="button"
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing}
          aria-label="Atualizar lista de documentos"
          title="Atualizar lista"
        >
          <span aria-hidden="true">↻</span>
          {isRefreshing ? 'Atualizando…' : 'Atualizar'}
        </button>
      </div>

      {isLoading ? (
        <p className="list-state" role="status">Carregando documentos…</p>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <span className="empty-mark" aria-hidden="true">—</span>
          <p>Nenhum documento por aqui ainda.</p>
        </div>
      ) : (
        <ul className="document-rows">
          {documents.map((document) => (
            <li className="document-row" key={document.id}>
              <span className="file-type" aria-hidden="true">DOC</span>
              <div className="document-info">
                <span className="document-name" title={document.originalName}>
                  {document.originalName}
                </span>
                <span className="document-meta">
                  {formatFileSize(document.size)} <span aria-hidden="true">·</span> {formatDate(document.uploadedAt)}
                </span>
              </div>
              <DownloadButton documentId={document.id} onError={onError} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}