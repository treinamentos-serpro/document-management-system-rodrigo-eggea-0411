const documentService = require('../services/documentService');

function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

function validateUserId(req, res, next) {
  const owner = req.get('X-User-Id')?.trim();

  if (!owner || [...owner].length > 128) {
    return sendError(res, 400, 'INVALID_USER_ID', 'X-User-Id ausente ou inválido.');
  }

  req.owner = owner;
  return next();
}

function toPublicDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
  };
}

async function upload(req, res, next) {
  if (!req.file) {
    return sendError(res, 400, 'FILE_REQUIRED', 'Envie um arquivo no campo "file".');
  }

  try {
    const document = await documentService.upload(req.file, req.owner);
    return res.status(201).json(toPublicDocument(document));
  } catch (error) {
    return next(error);
  }
}

function list(req, res) {
  const documents = documentService.listByOwner(req.owner).map(toPublicDocument);
  return res.status(200).json({ documents });
}

async function download(req, res, next) {
  try {
    const result = await documentService.findDownload(req.owner, req.params.id);

    if (!result) {
      return sendError(res, 404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
    }

    return res.download(result.filePath, result.document.originalName, (error) => {
      if (!error) {
        return;
      }

      if (res.headersSent) {
        res.destroy(error);
        return;
      }

      sendError(res, 500, 'DOWNLOAD_FAILED', 'Não foi possível baixar o documento.');
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  download,
  list,
  upload,
  validateUserId,
};