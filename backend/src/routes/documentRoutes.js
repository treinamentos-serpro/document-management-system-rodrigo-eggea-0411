const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const express = require('express');
const multer = require('multer');
const { maxFileSizeBytes, maxQueuedUploads, storageDirectory } = require('../config');
const documentController = require('../controllers/documentController');

const router = express.Router();
const pendingUploads = [];
let uploadInProgress = false;

function serializeUpload(_req, res, next) {
  const startUpload = () => {
    uploadInProgress = true;
    let released = false;

    const releaseUpload = () => {
      if (released) {
        return;
      }

      released = true;
      uploadInProgress = false;
      pendingUploads.shift()?.();
    };

    res.once('finish', releaseUpload);
    res.once('close', releaseUpload);
    next();
  };

  if (!uploadInProgress) {
    startUpload();
    return;
  }

  if (pendingUploads.length >= maxQueuedUploads) {
    res.set('Retry-After', '1');
    return res.status(429).json({
      error: { code: 'UPLOAD_BUSY', message: 'Muitos envios em andamento. Tente novamente.' },
    });
  }

  pendingUploads.push(startUpload);
}

const storage = multer.diskStorage({
  destination(_req, _file, callback) {
    fs.mkdir(storageDirectory, { recursive: true }, (error) => {
      if (error) {
        callback(error);
        return;
      }

      fs.chmod(storageDirectory, 0o700, (chmodError) => {
        callback(chmodError, storageDirectory);
      });
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
  serializeUpload,
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