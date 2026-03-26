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
    this.folders = this._loadFolders();
    this.activeConvoId = null;
  }

  _storageKey() {
    const user = getUserKey();
    return user ? STORAGE_KEY + '_' + user : STORAGE_KEY;
  }

  _foldersStorageKey() {
    const user = getUserKey();
    return user ? STORAGE_KEY + '_folders_' + user : STORAGE_KEY + '_folders';
  }

  _load() {
    if (!isLoggedIn()) return [];
    try { return JSON.parse(localStorage.getItem(this._storageKey()) || '[]'); } catch(e) { return []; }
  }

  _loadFolders() {
    if (!isLoggedIn()) return {};
    try { return JSON.parse(localStorage.getItem(this._foldersStorageKey()) || '{}'); } catch(e) { return {}; }
  }

  reload() {
    this.conversations = this._load();
    this.folders = this._loadFolders();
    this.activeConvoId = null;
  }

  save() {
    if (!isLoggedIn()) return;
    localStorage.setItem(this._storageKey(), JSON.stringify(this.conversations));
  }

  saveFolders() {
    if (!isLoggedIn()) return;
    localStorage.setItem(this._foldersStorageKey(), JSON.stringify(this.folders));
  }

  getActiveConvo() {
    return this.conversations.find(c => c.id === this.activeConvoId) || null;
  }

  createConversation(title) {
    const convo = {
      id: genId(),
      title: truncate(title, 40),
      messages: [],
      created: Date.now(),
      isPinned: false,
      isArchived: false,
      folderId: null
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

  renameConversation(id, newTitle) {
    const convo = this.conversations.find(c => c.id === id);
    if (convo) {
      convo.title = truncate(newTitle, 40);
      this.save();
      return convo;
    }
    return null;
  }

  deleteConversation(id) {
    const idx = this.conversations.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.conversations.splice(idx, 1);
      if (this.activeConvoId === id) this.activeConvoId = null;
      this.save();
      return true;
    }
    return false;
  }

  archiveConversation(id, archive = true) {
    const convo = this.conversations.find(c => c.id === id);
    if (convo) {
      convo.isArchived = archive;
      this.save();
      return convo;
    }
    return null;
  }

  pinConversation(id, pin = true) {
    const convo = this.conversations.find(c => c.id === id);
    if (convo) {
      convo.isPinned = pin;
      this.save();
      return convo;
    }
    return null;
  }

  moveToFolder(convoId, folderId) {
    const convo = this.conversations.find(c => c.id === convoId);
    if (convo) {
      convo.folderId = folderId;
      this.save();
      return convo;
    }
    return null;
  }

  createFolder(name, icon = '📁') {
    const folderId = genId();
    this.folders[folderId] = {
      id: folderId,
      name: truncate(name, 30),
      icon: icon,
      created: Date.now()
    };
    this.saveFolders();
    return this.folders[folderId];
  }

  deleteFolder(folderId) {
    delete this.folders[folderId];
    // Move chats back to no folder
    this.conversations.forEach(c => {
      if (c.folderId === folderId) c.folderId = null;
    });
    this.saveFolders();
    this.save();
  }

  renameFolder(folderId, newName) {
    if (this.folders[folderId]) {
      this.folders[folderId].name = truncate(newName, 30);
      this.saveFolders();
      return this.folders[folderId];
    }
    return null;
  }

  changeFolderIcon(folderId, newIcon) {
    if (this.folders[folderId]) {
      this.folders[folderId].icon = newIcon;
      this.saveFolders();
      return this.folders[folderId];
    }
    return null;
  }

  getPinnedChats() {
    return this.conversations.filter(c => c.isPinned && !c.isArchived);
  }

  getArchivedChats() {
    return this.conversations.filter(c => c.isArchived);
  }

  getRecentChats() {
    return this.conversations.filter(c => !c.isPinned && !c.isArchived);
  }

  getChatsByFolder(folderId) {
    return this.conversations.filter(c => c.folderId === folderId && !c.isArchived);
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
