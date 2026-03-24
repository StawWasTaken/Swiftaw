/**
 * Tithonia — File Upload & Processing
 */

import { escapeHtml, formatFileSize } from './utils.js';

export class FileHandler {
  constructor() {
    this.pendingFiles = [];
  }

  getFileIcon(file) {
    if (file.type.startsWith('image/')) return '\u{1F5BC}';
    if (file.type === 'application/pdf') return '\u{1F4C4}';
    return '\u{1F4C3}';
  }

  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  extractPdfText(rawContent) {
    const textChunks = [];
    const parenRegex = /\(([^)]*)\)/g;
    let match;
    while ((match = parenRegex.exec(rawContent)) !== null) {
      const chunk = match[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .replace(/\\t/g, ' ')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\\/g, '\\');
      if (chunk.trim().length > 1 && /[a-zA-Z]/.test(chunk)) {
        textChunks.push(chunk.trim());
      }
    }
    const result = textChunks.join(' ').replace(/\s+/g, ' ').trim();
    return result.length > 50 ? result : null;
  }

  async processFiles(files) {
    for (const file of files) {
      const fileObj = { file, type: 'unknown', content: null, dataUrl: null };

      if (file.type.startsWith('image/')) {
        fileObj.type = 'image';
        fileObj.dataUrl = await this.readFileAsDataUrl(file);
      } else if (file.type === 'application/pdf') {
        fileObj.type = 'pdf';
        try {
          const text = await this.readFileAsText(file);
          const extracted = this.extractPdfText(text);
          fileObj.content = extracted || '[PDF content — could not extract readable text. The file was received.]';
        } catch (e) {
          fileObj.content = '[PDF file received but could not be read.]';
        }
      } else {
        fileObj.type = 'text';
        try {
          fileObj.content = await this.readFileAsText(file);
          if (fileObj.content.length > 10000) {
            fileObj.content = fileObj.content.substring(0, 10000) + '\n\n[...content truncated at 10,000 characters]';
          }
        } catch (e) {
          fileObj.content = '[File could not be read as text.]';
        }
      }

      this.pendingFiles.push(fileObj);
    }
  }

  buildFileContext(files) {
    const parts = [];
    for (const f of files) {
      if (f.type === 'image') {
        parts.push(`[User attached an image: ${f.file.name} (${f.file.type}, ${formatFileSize(f.file.size)}). Describe what you understand about this image based on its filename and context.]`);
      } else if (f.type === 'pdf') {
        parts.push(`[User attached a PDF: ${f.file.name}]\nExtracted content:\n${f.content}`);
      } else {
        parts.push(`[User attached a file: ${f.file.name}]\nFile content:\n${f.content}`);
      }
    }
    return parts.join('\n\n');
  }

  renderFileAttachments(files) {
    let html = '';
    for (const f of files) {
      html += '<div class="file-attachment-preview">';
      if (f.type === 'image' && f.dataUrl) {
        html += `<div class="file-attachment-label">\u{1F5BC} ${escapeHtml(f.file.name)}</div>`;
        html += `<img src="${f.dataUrl}" alt="${escapeHtml(f.file.name)}">`;
      } else if (f.type === 'pdf') {
        html += `<div class="file-attachment-label">\u{1F4C4} ${escapeHtml(f.file.name)} (${formatFileSize(f.file.size)})</div>`;
      } else {
        html += `<div class="file-attachment-label">\u{1F4C3} ${escapeHtml(f.file.name)} (${formatFileSize(f.file.size)})</div>`;
        if (f.content) {
          const preview = f.content.length > 200 ? f.content.substring(0, 200) + '...' : f.content;
          html += `<div class="file-text-preview">${escapeHtml(preview)}</div>`;
        }
      }
      html += '</div>';
    }
    return html;
  }

  renderFilePreview(previewArea, onUpdate) {
    previewArea.innerHTML = '';
    if (this.pendingFiles.length === 0) {
      previewArea.classList.remove('has-files');
      if (onUpdate) onUpdate();
      return;
    }
    previewArea.classList.add('has-files');

    this.pendingFiles.forEach((fileObj, idx) => {
      const item = document.createElement('div');
      item.className = 'file-preview-item';

      let thumbHtml = '';
      if (fileObj.type === 'image' && fileObj.dataUrl) {
        thumbHtml = `<img class="file-preview-thumb" src="${fileObj.dataUrl}" alt="">`;
      } else {
        thumbHtml = `<span class="file-icon">${this.getFileIcon(fileObj.file)}</span>`;
      }

      item.innerHTML = `
        ${thumbHtml}
        <span class="file-name">${escapeHtml(fileObj.file.name)}</span>
        <span class="file-remove" data-idx="${idx}">&times;</span>`;
      previewArea.appendChild(item);
    });

    previewArea.querySelectorAll('.file-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.idx);
        this.pendingFiles.splice(idx, 1);
        this.renderFilePreview(previewArea, onUpdate);
      });
    });
    if (onUpdate) onUpdate();
  }

  clear() {
    this.pendingFiles = [];
  }

  hasPendingFiles() {
    return this.pendingFiles.length > 0;
  }

  getPendingFiles() {
    return [...this.pendingFiles];
  }
}
