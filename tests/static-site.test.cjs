'use strict';

/* Keep the site honest when it is opened directly from a file:// URL.
   This intentionally uses only Node's standard library so the check is
   runnable before any package manager or server is installed. */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const errors = [];

function filesWithExtension(extension) {
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(extension))
    .map((entry) => path.join(root, entry.name));
}

function externalReference(value) {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(value.trim());
}

function checkReference(value, sourceFile) {
  const reference = value.trim();
  if (!reference || externalReference(reference)) return;

  const withoutQuery = reference.split('#', 1)[0].split('?', 1)[0];
  if (!withoutQuery) return;
  if (withoutQuery.startsWith('/')) {
    errors.push(`${path.relative(root, sourceFile)} uses a root-relative path: ${reference}`);
    return;
  }

  let decoded;
  try {
    decoded = decodeURIComponent(withoutQuery);
  } catch (_) {
    errors.push(`${path.relative(root, sourceFile)} has an invalid URL: ${reference}`);
    return;
  }

  const target = path.resolve(path.dirname(sourceFile), decoded);
  const insideRoot = target === root || target.startsWith(root + path.sep);
  if (!insideRoot) {
    errors.push(`${path.relative(root, sourceFile)} escapes the repository: ${reference}`);
  } else if (!fs.existsSync(target)) {
    errors.push(`${path.relative(root, sourceFile)} points to a missing file: ${reference}`);
  }
}

for (const sourceFile of filesWithExtension('.html')) {
  const source = fs.readFileSync(sourceFile, 'utf8');
  const references = /\b(?:href|src)\s*=\s*["']([^"']+)["']/gi;
  let match;
  while ((match = references.exec(source))) checkReference(match[1], sourceFile);
}

for (const sourceFile of filesWithExtension('.css')) {
  const source = fs.readFileSync(sourceFile, 'utf8');
  const references = /url\(\s*["']?([^"')]+)["']?\s*\)/gi;
  let match;
  while ((match = references.exec(source))) checkReference(match[1], sourceFile);
}

const runtimeFiles = [
  ...filesWithExtension('.html'),
  ...filesWithExtension('.js'),
  ...filesWithExtension('.css')
];
const serverOnly = /\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bEventSource\b|navigator\.serviceWorker|type\s*=\s*["']module["']/i;
for (const sourceFile of runtimeFiles) {
  const source = fs.readFileSync(sourceFile, 'utf8');
  if (serverOnly.test(source)) {
    errors.push(`${path.relative(root, sourceFile)} contains a server/runtime-only dependency`);
  }
}

if (errors.length) {
  console.error('Static-site audit failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Static-site audit passed: ${filesWithExtension('.html').length} HTML pages, local assets resolved, no server-only runtime APIs.`);
}
