import { useRef, useState } from 'react';
import { formatFileSize } from '../services/formatters.js';

export default function UploadComponent({ onUpload, isUploading }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!file || isUploading) {
      return;
    }

    const uploaded = await onUpload(file);

    if (uploaded) {
      setFile(null);
      inputRef.current.value = '';
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label
        className={`drop-zone${file ? ' has-file' : ''}${isDragging ? ' is-dragging' : ''}`}
        htmlFor="document-file"
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          setFile(event.dataTransfer.files?.[0] || null);
        }}
      >
        <span className="upload-symbol" aria-hidden="true">↑</span>
        <span className="drop-zone-title">{file ? 'Arquivo selecionado' : 'Escolha um arquivo'}</span>
        <span className="drop-zone-hint">ou arraste até aqui</span>
        <input
          ref={inputRef}
          id="document-file"
          className="file-input"
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
        />
      </label>

      {file && (
        <div className="selected-file" aria-live="polite">
          <span className="file-type" aria-hidden="true">DOC</span>
          <span className="selected-file-name" title={file.name}>{file.name}</span>
          <span className="selected-file-size">{formatFileSize(file.size)}</span>
          <button
            className="clear-file"
            type="button"
            onClick={() => {
              setFile(null);
              inputRef.current.value = '';
            }}
            aria-label="Remover arquivo selecionado"
            title="Remover arquivo"
          >
            ×
          </button>
        </div>
      )}

      <button className="primary-button upload-submit" type="submit" disabled={!file || isUploading}>
        <span aria-hidden="true">↑</span>
        {isUploading ? 'Enviando…' : 'Enviar documento'}
      </button>
    </form>
  );
}