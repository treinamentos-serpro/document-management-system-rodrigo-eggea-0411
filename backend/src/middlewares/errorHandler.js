const multer = require('multer');

function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

function errorHandler(error, req, res, _next) {
  if (res.headersSent) {
    return res.end();
  }

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 413, 'FILE_TOO_LARGE', 'O arquivo excede o limite permitido.');
    }

    return sendError(res, 400, 'INVALID_UPLOAD', 'O envio do arquivo é inválido.');
  }

  if (error.code === 'STORAGE_LIMIT_EXCEEDED') {
    return sendError(res, 507, error.code, error.message);
  }

  if (req.method === 'POST' && req.path === '/upload') {
    console.error('Falha no upload de documento:', error);
    return sendError(res, 500, 'UPLOAD_FAILED', 'Não foi possível salvar o documento.');
  }

  if (req.method === 'GET' && /^\/documents\/[^/]+\/download$/.test(req.path)) {
    console.error('Falha no download de documento:', error);
    return sendError(res, 500, 'DOWNLOAD_FAILED', 'Não foi possível baixar o documento.');
  }

  console.error('Erro inesperado na API do DMS:', error);
  return sendError(res, 500, 'INTERNAL_ERROR', 'Ocorreu um erro interno.');
}

module.exports = errorHandler;