/**
 * Tithonia — Utility Functions
 */

export function genId() {
  return 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

export function truncate(str, len) {
  return str.length > len ? str.slice(0, len) + '...' : str;
}

export function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
