const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const storageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-backend-test-'));
fs.chmodSync(storageDirectory, 0o777);
process.env.STORAGE_DIR = storageDirectory;
process.env.MAX_FILE_SIZE_BYTES = '32';
process.env.MAX_STORAGE_BYTES = '13';

const app = require('../src/app');

async function startServer(t) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));

  return `http://127.0.0.1:${server.address().port}`;
}

function uploadForm(content, filename) {
  const form = new FormData();
  form.append('file', new Blob([content]), filename);
  return form;
}

test('mantém o health check e valida o identificador do proprietário', async (t) => {
  const baseUrl = await startServer(t);
  const healthResponse = await fetch(`${baseUrl}/health`);
  assert.deepStrictEqual(await healthResponse.json(), { status: 'ok' });

  const missingOwnerResponse = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(missingOwnerResponse.status, 400);
  assert.strictEqual((await missingOwnerResponse.json()).error.code, 'INVALID_USER_ID');
});

test('faz upload local, lista por proprietário e bloqueia download de outros usuários', async (t) => {
  const baseUrl = await startServer(t);

  const emptyForm = new FormData();
  const missingFileResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-1' },
    body: emptyForm,
  });
  assert.strictEqual(missingFileResponse.status, 400);
  assert.strictEqual((await missingFileResponse.json()).error.code, 'FILE_REQUIRED');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-1' },
    body: uploadForm('document body', '../../report.txt'),
  });
  assert.strictEqual(uploadResponse.status, 201);

  const document = await uploadResponse.json();
  assert.strictEqual(document.originalName, 'report.txt');
  assert.strictEqual(document.size, 13);
  assert.strictEqual(document.owner, 'user-1');
  assert.ok(!Object.hasOwn(document, 'storageName'));

  const storedFiles = fs.readdirSync(storageDirectory);
  assert.strictEqual(storedFiles.length, 1);
  assert.match(storedFiles[0], /^[0-9a-f-]{36}$/i);
  assert.strictEqual(fs.statSync(storageDirectory).mode & 0o777, 0o700);

  const ownDocumentsResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'user-1' },
  });
  assert.deepStrictEqual((await ownDocumentsResponse.json()).documents, [document]);

  const otherDocumentsResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'user-2' },
  });
  assert.deepStrictEqual((await otherDocumentsResponse.json()).documents, []);

  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': 'user-1' },
  });
  assert.strictEqual(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get('content-disposition'), /attachment/);
  assert.strictEqual(await downloadResponse.text(), 'document body');

  const forbiddenDownloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': 'user-2' },
  });
  assert.strictEqual(forbiddenDownloadResponse.status, 404);

  fs.unlinkSync(path.join(storageDirectory, storedFiles[0]));
  const missingDownloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': 'user-1' },
  });
  assert.strictEqual(missingDownloadResponse.status, 404);
  assert.strictEqual((await missingDownloadResponse.json()).error.code, 'DOCUMENT_NOT_FOUND');
});

test('aplica limites de arquivo e armazenamento com respostas estáveis', async (t) => {
  const baseUrl = await startServer(t);
  const initialUpload = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'quota-user' },
    body: uploadForm('1234567890123', 'quota.txt'),
  });
  assert.strictEqual(initialUpload.status, 201);

  const exceededQuotaResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'quota-user' },
    body: uploadForm('x', 'over-quota.txt'),
  });
  assert.strictEqual(exceededQuotaResponse.status, 507);
  assert.strictEqual(
    (await exceededQuotaResponse.json()).error.code,
    'STORAGE_LIMIT_EXCEEDED',
  );

  const oversizedResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'quota-user' },
    body: uploadForm('x'.repeat(64), 'large.txt'),
  });
  assert.strictEqual(oversizedResponse.status, 413);
  assert.strictEqual((await oversizedResponse.json()).error.code, 'FILE_TOO_LARGE');
});

test('mapeia falha de escrita para UPLOAD_FAILED sem expor detalhes locais', async (t) => {
  const baseUrl = await startServer(t);
  const movedStorageDirectory = `${storageDirectory}-moved`;
  fs.renameSync(storageDirectory, movedStorageDirectory);
  fs.writeFileSync(storageDirectory, 'not a directory');

  let response;
  try {
    response = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': 'user-1' },
      body: uploadForm('content', 'failure.txt'),
    });
  } finally {
    fs.unlinkSync(storageDirectory);
    fs.renameSync(movedStorageDirectory, storageDirectory);
  }

  assert.strictEqual(response.status, 500);
  assert.deepStrictEqual(await response.json(), {
    error: { code: 'UPLOAD_FAILED', message: 'Não foi possível salvar o documento.' },
  });
});

test.after(() => {
  fs.rmSync(storageDirectory, { recursive: true, force: true });
});