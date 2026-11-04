const fs = require('node:fs/promises');
const path = require('node:path');
const { storageDirectory } = require('../config');

const documents = new Map();

async function create(document) {
  documents.set(document.id, document);
  return document;
}

function findById(id) {
  return documents.get(id) || null;
}

function findByOwner(owner) {
  return [...documents.values()]
    .filter((document) => document.owner === owner)
    .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt));
}

function getFilePath(storageName) {
  return path.join(storageDirectory, path.basename(storageName));
}

async function fileExists(storageName) {
  try {
    await fs.access(getFilePath(storageName));
    return true;
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      return false;
    }

    throw error;
  }
}

async function getStorageUsageBytes() {
  let entries;

  try {
    entries = await fs.readdir(storageDirectory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return 0;
    }

    throw error;
  }

  const fileSizes = await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map(async (entry) => (await fs.stat(path.join(storageDirectory, entry.name))).size),
  );

  return fileSizes.reduce((total, size) => total + size, 0);
}

async function removeFile(storageName) {
  await fs.rm(getFilePath(storageName), { force: true });
}

module.exports = {
  create,
  fileExists,
  findById,
  findByOwner,
  getStorageUsageBytes,
  getFilePath,
  removeFile,
};