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

async function removeFile(storageName) {
  await fs.rm(getFilePath(storageName), { force: true });
}

module.exports = {
  create,
  fileExists,
  findById,
  findByOwner,
  getFilePath,
  removeFile,
};