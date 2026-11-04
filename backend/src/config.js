const path = require('node:path');

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const configuredMaxFileSize = Number(
  process.env.MAX_FILE_SIZE_BYTES || DEFAULT_MAX_FILE_SIZE_BYTES,
);

if (!Number.isSafeInteger(configuredMaxFileSize) || configuredMaxFileSize < 1) {
  throw new Error('MAX_FILE_SIZE_BYTES deve ser um inteiro positivo.');
}

module.exports = {
  maxFileSizeBytes: configuredMaxFileSize,
  storageDirectory: path.resolve(
    process.env.STORAGE_DIR || path.join(__dirname, '..', 'storage'),
  ),
};