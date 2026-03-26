/**
 * Tithonia — Conversation State Management with Supabase Sync
 */

import { genId, truncate, escapeHtml } from './utils.js';

const STORAGE_KEY = 'tithonia_convos';

// Table names must match those in supabase-config.js
const TITHONIA_TABLES = {
  CHATS: 'tithonia_chats',
  CHAT_FOLDERS: 'tithonia_chat_folders',
  CHAT_MESSAGES: 'tithonia_chat_messages',
  USER_PREFERENCES: 'tithonia_user_preferences'
};

function isLoggedIn() {
  return typeof SwiftawAuth !== 'undefined' && SwiftawAuth.isLoggedIn();
}

function getUserKey() {
  if (!isLoggedIn()) return null;
  return SwiftawAuth.getUser().username;
}

function getUserId() {
  if (!isLoggedIn()) return null;
  return SwiftawAuth.getUser().id;
}

export class ChatManager {
  constructor(supabaseDb = null) {
    this.db = supabaseDb;
    this.conversations = this._load();
    this.folders = this._loadFolders();
    this.activeConvoId = null;
    this.syncEnabled = isLoggedIn() && this.db !== null;
    this.syncing = false;
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
    if (this.syncEnabled) this._syncToSupabase();
  }

  saveFolders() {
    if (!isLoggedIn()) return;
    localStorage.setItem(this._foldersStorageKey(), JSON.stringify(this.folders));
    if (this.syncEnabled) this._syncFoldersToSupabase();
  }

  async _syncToSupabase() {
    if (!this.db || this.syncing) return;
    this.syncing = true;

    try {
      const userId = getUserId();
      if (!userId) return;

      // Sync each conversation
      for (const convo of this.conversations) {
        const { data: existing } = await this.db
          .from(TITHONIA_TABLES.CHATS)
          .select('id')
          .eq('id', convo.id)
          .single();

        if (existing) {
          // Update existing
          await this.db
            .from(TITHONIA_TABLES.CHATS)
            .update({
              title: convo.title,
              folder_id: convo.folderId || null,
              is_pinned: convo.isPinned,
              is_archived: convo.isArchived,
              updated_at: new Date().toISOString()
            })
            .eq('id', convo.id);
        } else {
          // Insert new
          await this.db
            .from(TITHONIA_TABLES.CHATS)
            .insert({
              id: convo.id,
              user_id: userId,
              title: convo.title,
              folder_id: convo.folderId || null,
              is_pinned: convo.isPinned,
              is_archived: convo.isArchived,
              created_at: new Date(convo.created).toISOString(),
              updated_at: new Date().toISOString()
            });
        }

        // Sync messages
        if (convo.messages && convo.messages.length > 0) {
          for (const msg of convo.messages) {
            const msgId = msg.id || genId();
            const { data: existingMsg } = await this.db
              .from(TITHONIA_TABLES.CHAT_MESSAGES)
              .select('id')
              .eq('id', msgId)
              .single();

            if (!existingMsg) {
              await this.db
                .from(TITHONIA_TABLES.CHAT_MESSAGES)
                .insert({
                  id: msgId,
                  chat_id: convo.id,
                  role: msg.role,
                  text: msg.text,
                  metadata: msg.hasFiles ? { hasFiles: true } : null,
                  created_at: new Date().toISOString()
                });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error syncing chats to Supabase:', error);
    } finally {
      this.syncing = false;
    }
  }

  async _syncFoldersToSupabase() {
    if (!this.db || this.syncing) return;
    this.syncing = true;

    try {
      const userId = getUserId();
      if (!userId) return;

      for (const folder of Object.values(this.folders)) {
        const { data: existing } = await this.db
          .from(TITHONIA_TABLES.CHAT_FOLDERS)
          .select('id')
          .eq('id', folder.id)
          .single();

        if (existing) {
          await this.db
            .from(TITHONIA_TABLES.CHAT_FOLDERS)
            .update({
              name: folder.name,
              icon: folder.icon
            })
            .eq('id', folder.id);
        } else {
          await this.db
            .from(TITHONIA_TABLES.CHAT_FOLDERS)
            .insert({
              id: folder.id,
              user_id: userId,
              name: folder.name,
              icon: folder.icon,
              created_at: new Date(folder.created).toISOString()
            });
        }
      }
    } catch (error) {
      console.error('Error syncing folders to Supabase:', error);
    } finally {
      this.syncing = false;
    }
  }

  async loadFromSupabase() {
    if (!this.db) return;

    try {
      const userId = getUserId();
      if (!userId) return;

      // Load chats
      const { data: chats } = await this.db
        .from(TITHONIA_TABLES.CHATS)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (chats) {
        this.conversations = chats.map(chat => ({
          id: chat.id,
          title: chat.title,
          messages: [],
          created: new Date(chat.created_at).getTime(),
          isPinned: chat.is_pinned,
          isArchived: chat.is_archived,
          folderId: chat.folder_id
        }));

        // Load messages for each chat
        for (const chat of chats) {
          const { data: messages } = await this.db
            .from(TITHONIA_TABLES.CHAT_MESSAGES)
            .select('*')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: true });

          const convo = this.conversations.find(c => c.id === chat.id);
          if (convo && messages) {
            convo.messages = messages.map(msg => ({
              role: msg.role,
              text: msg.text,
              ...msg.metadata
            }));
          }
        }

        this.save();
      }

      // Load folders
      const { data: folders } = await this.db
        .from(TITHONIA_TABLES.CHAT_FOLDERS)
        .select('*')
        .eq('user_id', userId);

      if (folders) {
        this.folders = {};
        folders.forEach(folder => {
          this.folders[folder.id] = {
            id: folder.id,
            name: folder.name,
            icon: folder.icon,
            created: new Date(folder.created_at).getTime()
          };
        });
        this.saveFolders();
      }
    } catch (error) {
      console.error('Error loading from Supabase:', error);
    }
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
