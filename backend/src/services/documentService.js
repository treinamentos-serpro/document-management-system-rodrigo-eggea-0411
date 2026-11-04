const { randomUUID } = require('node:crypto');
const { maxStorageBytes } = require('../config');
const documentRepository = require('../repositories/documentRepository');

async function upload(file, owner) {
  const document = {
    id: randomUUID(),
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    storageName: file.filename,
  };

  try {
    const storageUsage = await documentRepository.getStorageUsageBytes();

    if (storageUsage > maxStorageBytes) {
      const error = new Error('O armazenamento local atingiu o limite configurado.');
      error.code = 'STORAGE_LIMIT_EXCEEDED';
      throw error;
    }

    return await documentRepository.create(document);
  } catch (error) {
    await documentRepository.removeFile(file.filename).catch(() => {});
    throw error;
  }
}

function listByOwner(owner) {
  return documentRepository.findByOwner(owner);
}

async function findDownload(owner, id) {
  const document = documentRepository.findById(id);

  if (!document || document.owner !== owner) {
    return null;
  }

  if (!(await documentRepository.fileExists(document.storageName))) {
    return null;
  }

  return {
    document,
    filePath: documentRepository.getFilePath(document.storageName),
  };
}

module.exports = {
  findDownload,
  listByOwner,
  upload,
};