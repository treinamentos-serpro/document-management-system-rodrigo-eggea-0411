const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const express = require('express');
const multer = require('multer');
const { maxFileSizeBytes, storageDirectory } = require('../config');
const documentController = require('../controllers/documentController');

const router = express.Router();
const storage = multer.diskStorage({
  destination(_req, _file, callback) {
    fs.mkdir(storageDirectory, { recursive: true }, (error) => {
      callback(error, storageDirectory);
    });
  },
  filename(_req, _file, callback) {
    callback(null, randomUUID());
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSizeBytes,
    files: 1,
    fields: 0,
    parts: 1,
  },
});

router.post(
  '/upload',
  documentController.validateUserId,
  upload.single('file'),
  documentController.upload,
);
router.get('/documents', documentController.validateUserId, documentController.list);
router.get(
  '/documents/:id/download',
  documentController.validateUserId,
  documentController.download,
);

module.exports = router;