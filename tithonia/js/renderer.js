/**
 * Tithonia — Message & UI Rendering
 */

import { escapeHtml } from './utils.js';
import { moodLabels, modeLabels } from './config.js';
import { CodeAssistant } from './code-assistant.js';

export class Renderer {
  constructor(messagesEl, messagesWrap) {
    this.messagesEl = messagesEl;
    this.messagesWrap = messagesWrap;
    this.codeAssistant = new CodeAssistant();
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

  /**
   * Process code blocks in a message and add preview/copy functionality
   */
  processCodeBlocks(messageDiv) {
    const codeBlocks = messageDiv.querySelectorAll('pre > code');
    codeBlocks.forEach(codeEl => {
      const preEl = codeEl.parentElement;
      const code = codeEl.textContent || '';
      const language = this.extractLanguageFromClass(codeEl.className) || 'text';

      // Create interactive code block
      const codeBlock = this.codeAssistant.createCodeBlockElement(code, language);

      // Replace the pre element with the interactive code block
      preEl.replaceWith(codeBlock);
    });
  }

  /**
   * Extract language from highlight.js class name
   */
  extractLanguageFromClass(className) {
    const match = className.match(/language-(\w+)/);
    return match ? match[1] : 'text';
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
          <div class="message-actions">
            <button class="msg-action msg-edit" title="Edit message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="msg-action msg-copy" title="Copy message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              </svg>
            </button>
            <button class="msg-action msg-delete" title="Delete message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </button>
          </div>
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
          <div class="message-actions">
            <button class="msg-action msg-copy" title="Copy response">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              </svg>
            </button>
            <button class="msg-action msg-regenerate" title="Regenerate response">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36"/>
              </svg>
            </button>
            <button class="msg-action msg-delete" title="Delete message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </button>
          </div>
        </div>`;
    }

    this.messagesEl.appendChild(div);

    // Process code blocks if this is an AI message with markdown
    if (role === 'assistant') {
      this.processCodeBlocks(div);
    }

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

  /**
   * Create a streaming message element for real-time text rendering
   */
  createStreamingMessage(role, emotion, mode) {
    const div = document.createElement('div');
    div.className = 'message';
    div.id = `msg-${Date.now()}`;

    if (role === 'user') {
      div.innerHTML = `
        <div class="message-avatar user-avatar">Y</div>
        <div class="message-content">
          <div class="message-sender">You</div>
          <div class="message-text"></div>
          <div class="message-actions"></div>
        </div>`;
    } else {
      const moodClass = emotion ? `mood-${emotion}` : 'mood-neutral';
      const moodText = emotion ? (moodLabels[emotion] || 'listening') : 'listening';
      const modeText = mode ? (modeLabels[mode] || '') : '';
      const modeHtml = modeText ? ` <span class="mode-indicator">${modeText}</span>` : '';
      div.innerHTML = `
        <div class="message-avatar ai-avatar">
          <img src="/product-logos/Tithonia icon.png" alt="Tithonia">
        </div>
        <div class="message-content">
          <div class="message-sender">Tithonia <span class="mood-indicator ${moodClass}">${moodText}</span>${modeHtml}</div>
          <div class="message-text"></div>
          <div class="message-actions"></div>
        </div>`;
    }

    this.messagesEl.appendChild(div);
    this.scrollToBottom();
    return div;
  }

  /**
   * Stream text into a message with typing animation
   * Renders markdown as it streams
   */
  async streamText(messageEl, text, role = 'assistant', chunkSize = 2) {
    const textEl = messageEl.querySelector('.message-text');
    let currentText = '';
    let lastRenderTime = Date.now();
    const renderInterval = 50; // Render every 50ms

    for (let i = 0; i < text.length; i += chunkSize) {
      const chunk = text.substring(i, i + chunkSize);
      currentText += chunk;

      // Render every interval or at end
      const now = Date.now();
      if (now - lastRenderTime > renderInterval || i + chunkSize >= text.length) {
        if (role === 'assistant') {
          // Render markdown for AI messages
          textEl.innerHTML = this.renderMarkdown(currentText);
        } else {
          // Simple escape for user messages
          textEl.textContent = currentText;
        }
        lastRenderTime = now;
        this.scrollToBottom();
      }

      // Small delay between chunks for natural typing feel
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Final render and code block processing
    if (role === 'assistant') {
      textEl.innerHTML = this.renderMarkdown(currentText);
      this.processCodeBlocks(messageEl);
      await this.addMessageActions(messageEl, role);
    } else {
      textEl.textContent = currentText;
      await this.addMessageActions(messageEl, role);
    }

    this.scrollToBottom();
  }

  /**
   * Add action buttons to a message after streaming completes
   */
  async addMessageActions(messageEl, role) {
    const actionsEl = messageEl.querySelector('.message-actions');
    if (!actionsEl) return;

    if (role === 'user') {
      actionsEl.innerHTML = `
        <button class="msg-action msg-edit" title="Edit message">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="msg-action msg-copy" title="Copy message">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
          </svg>
        </button>
        <button class="msg-action msg-delete" title="Delete message">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>`;
    } else {
      actionsEl.innerHTML = `
        <button class="msg-action msg-copy" title="Copy response">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
          </svg>
        </button>
        <button class="msg-action msg-regenerate" title="Regenerate response">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36"/>
          </svg>
        </button>
        <button class="msg-action msg-delete" title="Delete message">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>`;
    }
  }
}
