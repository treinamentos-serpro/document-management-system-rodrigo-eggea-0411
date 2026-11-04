import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import useDocuments from './hooks/useDocuments.js';
import './styles.css';

export default function App() {
  const {
    documents,
    error,
    handleUpload,
    isLoading,
    isUploading,
    listError,
    notice,
    onError,
    refreshDocuments,
  } = useDocuments();

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span>DMS <span className="brand-divider">/</span> Arquivo local</span>
        </a>
        <span className="storage-status"><span aria-hidden="true" /> Armazenamento local</span>
      </header>

      <section className="workspace" id="inicio">
        <div className="page-heading">
          <div>
            <p className="eyebrow">DOCUMENT MANAGEMENT SYSTEM</p>
            <h1>Seus documentos<span>.</span></h1>
          </div>
          <p className="page-date">Acesse e organize seus arquivos</p>
        </div>

        <div className="workspace-grid">
          <aside className="upload-panel" aria-labelledby="upload-heading">
            <div className="section-heading">
              <span className="section-index">01</span>
              <h2 id="upload-heading">Adicionar arquivo</h2>
            </div>
            <UploadComponent onUpload={handleUpload} isUploading={isUploading} />
          </aside>

          <section className="documents-panel" aria-labelledby="documents-heading">
            <div className="documents-heading">
              <div className="section-heading">
                <span className="section-index">02</span>
                <h2 id="documents-heading">Biblioteca</h2>
              </div>
              <span className="document-count">
                {documents.length} {documents.length === 1 ? 'arquivo' : 'arquivos'}
              </span>
            </div>

            {error && <p className="message message-error" role="alert">{error}</p>}
            {notice && <p className="message message-success" role="status">{notice}</p>}

            <DocumentList
              documents={documents}
              isLoading={isLoading}
              loadError={listError}
              onRefresh={refreshDocuments}
              onError={onError}
            />
          </section>
        </div>
      </section>

      <footer className="page-footer">
        <span>DMS <span aria-hidden="true">·</span> Seus arquivos, em um só lugar</span>
        <span>Os documentos são armazenados neste servidor</span>
      </footer>
    </main>
  );
}
