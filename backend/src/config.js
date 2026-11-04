const path = require('node:path');

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const DEFAULT_MAX_STORAGE_BYTES = 1024 * 1024 * 1024;
const DEFAULT_MAX_QUEUED_UPLOADS = 20;
const configuredMaxFileSize = Number(
  process.env.MAX_FILE_SIZE_BYTES || DEFAULT_MAX_FILE_SIZE_BYTES,
);
const configuredMaxStorage = Number(
  process.env.MAX_STORAGE_BYTES || DEFAULT_MAX_STORAGE_BYTES,
);
const configuredMaxQueuedUploads = Number(
  process.env.MAX_QUEUED_UPLOADS || DEFAULT_MAX_QUEUED_UPLOADS,
);

if (!Number.isSafeInteger(configuredMaxFileSize) || configuredMaxFileSize < 1) {
  throw new Error('MAX_FILE_SIZE_BYTES deve ser um inteiro positivo.');
}

if (!Number.isSafeInteger(configuredMaxStorage) || configuredMaxStorage < 1) {
  throw new Error('MAX_STORAGE_BYTES deve ser um inteiro positivo.');
}

if (!Number.isSafeInteger(configuredMaxQueuedUploads) || configuredMaxQueuedUploads < 0) {
  throw new Error('MAX_QUEUED_UPLOADS deve ser um inteiro não negativo.');
}

module.exports = {
  maxFileSizeBytes: configuredMaxFileSize,
  maxQueuedUploads: configuredMaxQueuedUploads,
  maxStorageBytes: configuredMaxStorage,
  storageDirectory: path.resolve(
    process.env.STORAGE_DIR || path.join(__dirname, '..', 'storage'),
  ),
};