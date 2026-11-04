import { useEffect, useState } from 'react';
import { listDocuments, uploadDocument } from '../services/documentApi.js';

export default function useDocuments() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');
  const [notice, setNotice] = useState('');

  async function refreshDocuments() {
    setIsLoading(true);

    try {
      setDocuments(await listDocuments());
      setListError('');
    } catch (requestError) {
      setDocuments([]);
      setListError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refreshDocuments();
  }, []);

  async function handleUpload(file) {
    setError('');
    setNotice('');
    setIsUploading(true);

    try {
      const document = await uploadDocument(file);
      setNotice(`“${document.originalName}” enviado com sucesso.`);
      await refreshDocuments();
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    } finally {
      setIsUploading(false);
    }
  }

  return {
    documents,
    error,
    handleUpload,
    isLoading,
    isUploading,
    listError,
    notice,
    onError: setError,
    refreshDocuments,
  };
}