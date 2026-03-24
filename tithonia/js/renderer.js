/**
 * Tithonia — Message & UI Rendering
 */

import { escapeHtml } from './utils.js';
import { moodLabels, modeLabels } from './config.js';

export class Renderer {
  constructor(messagesEl, messagesWrap) {
    this.messagesEl = messagesEl;
    this.messagesWrap = messagesWrap;
  }

  renderMarkdown(text) {
    if (typeof marked === 'undefined') return escapeHtml(text);
    try {
      marked.setOptions({
        breaks: true,
        gfm: true,
        highlight: function(code, lang) {
          if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
          }
          if (typeof hljs !== 'undefined') {
            return hljs.highlightAuto(code).value;
          }
          return code;
        }
      });
      return marked.parse(text);
    } catch (e) {
      return escapeHtml(text);
    }
  }

  scrollToBottom() {
    requestAnimationFrame(() => {
      this.messagesWrap.scrollTop = this.messagesWrap.scrollHeight;
    });
  }

  renderMessage(role, text, emotion, mode, fileAttachmentsHtml) {
    const div = document.createElement('div');
    div.className = 'message';

    const fileHtml = fileAttachmentsHtml || '';

    if (role === 'user') {
      div.innerHTML = `
        <div class="message-avatar user-avatar">Y</div>
        <div class="message-content">
          <div class="message-sender">You</div>
          ${fileHtml}
          <div class="message-text">${escapeHtml(text)}</div>
        </div>`;
    } else {
      const moodClass = emotion ? `mood-${emotion}` : 'mood-neutral';
      const moodText = emotion ? (moodLabels[emotion] || 'listening') : 'listening';
      const modeText = mode ? (modeLabels[mode] || '') : '';
      const modeHtml = modeText ? ` <span class="mode-indicator">${modeText}</span>` : '';
      const renderedText = this.renderMarkdown(text);
      div.innerHTML = `
        <div class="message-avatar ai-avatar">
          <img src="/product-logos/Tithonia icon.png" alt="Tithonia">
        </div>
        <div class="message-content">
          <div class="message-sender">Tithonia <span class="mood-indicator ${moodClass}">${moodText}</span>${modeHtml}</div>
          <div class="message-text">${renderedText}</div>
        </div>`;
    }

    this.messagesEl.appendChild(div);
    this.scrollToBottom();
  }

  renderTypingIndicator() {
    const div = document.createElement('div');
    div.className = 'message';
    div.id = 'typingMsg';
    div.innerHTML = `
      <div class="message-avatar ai-avatar">
        <img src="/product-logos/Tithonia icon.png" alt="Tithonia">
      </div>
      <div class="message-content">
        <div class="message-sender">Tithonia</div>
        <div class="typing-indicator"><span></span><span></span><span></span></div>
      </div>`;
    this.messagesEl.appendChild(div);
    return div;
  }

  renderAllMessages(messages) {
    this.messagesEl.innerHTML = '';
    messages.forEach(m => this.renderMessage(m.role, m.text, m.emotion, m.mode));
    this.scrollToBottom();
  }

  clearMessages() {
    this.messagesEl.innerHTML = '';
  }
}
