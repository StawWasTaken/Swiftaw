/**
 * Tithonia — Conversation State Management
 */

import { genId, truncate, escapeHtml } from './utils.js';

const STORAGE_KEY = 'tithonia_convos';

function isLoggedIn() {
  return typeof SwiftawAuth !== 'undefined' && SwiftawAuth.isLoggedIn();
}

function getUserKey() {
  if (!isLoggedIn()) return null;
  return SwiftawAuth.getUser().username;
}

export class ChatManager {
  constructor() {
    this.conversations = this._load();
    this.activeConvoId = null;
  }

  _storageKey() {
    const user = getUserKey();
    return user ? STORAGE_KEY + '_' + user : STORAGE_KEY;
  }

  _load() {
    if (!isLoggedIn()) return [];
    try { return JSON.parse(localStorage.getItem(this._storageKey()) || '[]'); } catch(e) { return []; }
  }

  reload() {
    this.conversations = this._load();
    this.activeConvoId = null;
  }

  save() {
    if (!isLoggedIn()) return;
    localStorage.setItem(this._storageKey(), JSON.stringify(this.conversations));
  }

  getActiveConvo() {
    return this.conversations.find(c => c.id === this.activeConvoId) || null;
  }

  createConversation(title) {
    const convo = {
      id: genId(),
      title: truncate(title, 40),
      messages: [],
      created: Date.now()
    };
    this.conversations.unshift(convo);
    this.activeConvoId = convo.id;
    this.save();
    return convo;
  }

  addMessage(convo, role, text, extra) {
    const msg = { role, text, ...extra };
    convo.messages.push(msg);
    this.save();
  }

  loadConversation(id) {
    this.activeConvoId = id;
    return this.getActiveConvo();
  }

  newChat() {
    this.activeConvoId = null;
  }

  renderChatList(chatListEl, onSelect) {
    chatListEl.innerHTML = '';
    this.conversations.forEach(convo => {
      const item = document.createElement('div');
      item.className = 'chat-item' + (convo.id === this.activeConvoId ? ' active' : '');
      item.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span>${escapeHtml(convo.title)}</span>`;
      item.addEventListener('click', () => onSelect(convo.id));
      chatListEl.appendChild(item);
    });
  }
}
