/**
 * Tithonia — Main Application
 * Entry point that wires together all modules
 */

import { MODELS } from './config.js';
import { ChatManager } from './chat-manager.js';
import { FileHandler } from './file-handler.js';
import { Renderer } from './renderer.js';

(function() {
  'use strict';

  // ── Elements ──
  const $ = (s) => document.querySelector(s);
  const landing = $('#landing');
  const messagesWrap = $('#messagesWrap');
  const messagesEl = $('#messages');
  const chatInput = $('#chatInput');
  const btnSend = $('#btnSend');
  const btnNewChat = $('#btnNewChat');
  const chatList = $('#chatList');
  const topbarTitle = $('#topbarTitle');
  const sidebar = $('#sidebar');
  const sidebarToggle = $('#sidebarToggle');
  const sidebarOverlay = $('#sidebarOverlay');
  const suggestionsEl = $('#suggestions');
  const modelSelector = $('#modelSelector');
  const modelSelectorBtn = $('#modelSelectorBtn');
  const modelDropdown = $('#modelDropdown');
  const selectedModelName = $('#selectedModelName');
  const inputDisclaimer = $('#inputDisclaimer');
  const landingDesc = $('#landingDesc');
  const btnAttach = $('#btnAttach');
  const fileInput = $('#fileInput');
  const filePreviewArea = $('#filePreviewArea');
  const toolsSelector = $('#toolsSelector');
  const toolsSelectorBtn = $('#toolsSelectorBtn');
  const toolsDropdown = $('#toolsDropdown');
  const selectedToolName = $('#selectedToolName');
  const pinnedSection = $('#pinnedSection');
  const pinnedList = $('#pinnedList');
  const foldersContainer = $('#foldersContainer');
  const btnNewFolder = $('#btnNewFolder');
  const tithoniaTools = $('#tithoniaTools');
  const archivedSection = $('#archivedSection');
  const archivedList = $('#archivedList');

  // ── Module instances ──
  const chatManager = new ChatManager();
  const fileHandler = new FileHandler();
  const renderer = new Renderer(messagesEl, messagesWrap);

  // ── Helper functions ──
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ── State ──
  let isGenerating = false;
  let activeModel = localStorage.getItem('tithonia_model') || 'sprout-1.3';
  let selectedTool = null;
  let expandedFolderId = null;

  // ── Tithonia 1.3 Engine ──
  const db = createSupabaseClient();
  const sprout = db ? new SproutEngine(db) : null;

  // ── Model Selector ──
  function renderModelDropdown() {
    modelDropdown.innerHTML = '';
    const modelKeys = Object.keys(MODELS);
    modelKeys.forEach((key, i) => {
      const m = MODELS[key];
      const btn = document.createElement('button');
      btn.className = 'model-option' + (key === activeModel ? ' active' : '');
      btn.dataset.model = key;
      btn.innerHTML = `
        <svg class="model-option-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <div class="model-option-info">
          <div class="model-option-name">${m.name}</div>
          <div class="model-option-desc">${m.desc}</div>
        </div>`;
      btn.addEventListener('click', () => selectModel(key));
      modelDropdown.appendChild(btn);

      if (i < modelKeys.length - 1) {
        const divider = document.createElement('div');
        divider.className = 'model-dropdown-divider';
        modelDropdown.appendChild(divider);
      }
    });
  }

  function selectModel(modelKey) {
    if (!MODELS[modelKey]) return;
    activeModel = modelKey;
    localStorage.setItem('tithonia_model', modelKey);
    selectedModelName.textContent = MODELS[modelKey].name;
    inputDisclaimer.textContent = `${MODELS[modelKey].name} can make mistakes. Verify important information.`;
    landingDesc.textContent = `A modern AI assistant powered by ${MODELS[modelKey].name} — built for daily help, smart project planning, quick answers, and specialized insights.`;
    renderModelDropdown();
    closeModelSelector();
  }

  function toggleModelSelector() {
    modelSelector.classList.toggle('open');
  }

  function closeModelSelector() {
    modelSelector.classList.remove('open');
  }

  modelSelectorBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleModelSelector();
  });

  document.addEventListener('click', (e) => {
    if (!modelSelector.contains(e.target)) {
      closeModelSelector();
    }
  });

  // Init model display
  if (MODELS[activeModel]) {
    selectedModelName.textContent = MODELS[activeModel].name;
    inputDisclaimer.textContent = `Tithonia is powered by ${MODELS[activeModel].name}. It can make mistakes. Verify important information.`;
  }
  renderModelDropdown();

  // ── Tools Selector ──
  function toggleToolsSelector() {
    toolsSelector.classList.toggle('open');
  }

  function closeToolsSelector() {
    toolsSelector.classList.remove('open');
  }

  toolsSelectorBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleToolsSelector();
  });

  toolsDropdown.addEventListener('click', (e) => {
    const toolBtn = e.target.closest('.tool-option');
    if (toolBtn) {
      const tool = toolBtn.dataset.tool;
      selectedTool = tool;
      selectedToolName.textContent = toolBtn.textContent.trim();
      closeToolsSelector();
      // Apply tool effect to input
      if (selectedTool && chatInput.value) {
        // This would integrate with the AI engine to apply the tool
        console.log('Applying tool:', selectedTool);
      }
    }
  });

  document.addEventListener('click', (e) => {
    if (!toolsSelector.contains(e.target)) {
      closeToolsSelector();
    }
  });

  // ── Tithonia Tools Buttons ──
  tithoniaTools.addEventListener('click', (e) => {
    const toolBtn = e.target.closest('.tool-btn');
    if (toolBtn) {
      const tool = toolBtn.dataset.tool;
      chatInput.focus();
      // Set up tool-specific prompt
      const prompts = {
        'idea-generator': 'Help me generate creative ideas for: ',
        'name-generator': 'Help me generate creative names for: ',
        'startup-ideas': 'Give me startup ideas about: ',
        'content-ideas': 'Give me content ideas about: ',
        'problem-solver': 'Help me solve this problem: '
      };
      if (prompts[tool]) {
        chatInput.value = (chatInput.value ? chatInput.value + '\n\n' : '') + prompts[tool];
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 150) + 'px';
        updateSendButtonState();
      }
    }
  });

  // ── Pinned Chats and Folders Rendering ──
  function renderPinnedChats() {
    const pinnedChats = chatManager.getPinnedChats();
    pinnedList.innerHTML = '';
    pinnedChats.forEach(convo => {
      const item = createChatItem(convo);
      pinnedList.appendChild(item);
    });

    // Show/hide pinned section
    pinnedSection.style.display = pinnedChats.length > 0 || Object.keys(chatManager.folders).length > 0 ? 'block' : 'none';
  }

  function createChatItem(convo) {
    const item = document.createElement('div');
    item.className = 'chat-item' + (convo.id === chatManager.activeConvoId ? ' active' : '');
    item.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <span>${escapeHtml(convo.title)}</span>`;
    item.addEventListener('click', () => loadConversation(convo.id));
    item.addEventListener('contextmenu', (e) => showChatContextMenu(e, convo));
    return item;
  }

  function renderFolders() {
    foldersContainer.innerHTML = '';
    Object.values(chatManager.folders).forEach(folder => {
      const folderEl = document.createElement('div');
      folderEl.className = 'folder-item' + (expandedFolderId === folder.id ? ' expanded' : '');
      folderEl.innerHTML = `
        <div class="folder-icon">${folder.icon}</div>
        <div class="folder-name">${escapeHtml(folder.name)}</div>
        <div class="folder-menu">
          <button class="folder-menu-btn" data-action="options" title="Folder options">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px;">
              <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
            </svg>
          </button>
        </div>`;

      folderEl.addEventListener('click', () => {
        expandedFolderId = expandedFolderId === folder.id ? null : folder.id;
        renderFolders();
      });

      folderEl.querySelector('.folder-menu-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        showFolderContextMenu(e, folder);
      });

      foldersContainer.appendChild(folderEl);

      // Add chats in folder
      if (expandedFolderId === folder.id) {
        const chatsInFolder = chatManager.getChatsByFolder(folder.id);
        chatsInFolder.forEach(convo => {
          const chatItem = createChatItem(convo);
          chatItem.style.marginLeft = '20px';
          foldersContainer.appendChild(chatItem);
        });
      }
    });
  }

  function showChatContextMenu(e, convo) {
    e.preventDefault();
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.position = 'fixed';
    menu.style.top = e.clientY + 'px';
    menu.style.left = e.clientX + 'px';
    menu.innerHTML = `
      <button data-action="rename">Rename</button>
      <button data-action="pin">${convo.isPinned ? 'Unpin' : 'Pin'}</button>
      <button data-action="move">Move to folder</button>
      <button data-action="archive">${convo.isArchived ? 'Restore' : 'Archive'}</button>
      <button data-action="delete" style="color:#ff6b6b;">Delete</button>`;

    menu.addEventListener('click', (me) => {
      const action = me.target.dataset.action;
      handleChatAction(action, convo);
      menu.remove();
      document.removeEventListener('click', closeContextMenu);
    });

    document.body.appendChild(menu);
    const closeContextMenu = () => {
      if (menu.parentElement) menu.remove();
    };
    document.addEventListener('click', closeContextMenu);
  }

  function showFolderContextMenu(e, folder) {
    e.stopPropagation();
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.position = 'fixed';
    menu.style.top = e.clientY + 'px';
    menu.style.left = e.clientX + 'px';
    menu.innerHTML = `
      <button data-action="rename-folder">Rename</button>
      <button data-action="change-icon">Change icon</button>
      <button data-action="delete-folder" style="color:#ff6b6b;">Delete</button>`;

    menu.addEventListener('click', (me) => {
      const action = me.target.dataset.action;
      handleFolderAction(action, folder);
      menu.remove();
      document.removeEventListener('click', closeContextMenu);
    });

    document.body.appendChild(menu);
    const closeContextMenu = () => {
      if (menu.parentElement) menu.remove();
    };
    document.addEventListener('click', closeContextMenu);
  }

  function handleChatAction(action, convo) {
    switch(action) {
      case 'rename': {
        const newTitle = prompt('New chat name:', convo.title);
        if (newTitle && newTitle.trim()) {
          chatManager.renameConversation(convo.id, newTitle);
          renderPinnedChats();
          chatManager.renderChatList(chatList, loadConversation);
          if (chatManager.activeConvoId === convo.id) {
            topbarTitle.textContent = chatManager.getActiveConvo().title;
          }
        }
        break;
      }
      case 'pin': {
        chatManager.pinConversation(convo.id, !convo.isPinned);
        renderPinnedChats();
        chatManager.renderChatList(chatList, loadConversation);
        break;
      }
      case 'move': {
        const folders = Object.values(chatManager.folders);
        if (folders.length === 0) {
          alert('No folders yet. Create one first!');
          return;
        }
        const folderNames = folders.map(f => f.name).join('\n');
        const selectedFolder = prompt('Move to folder:\n' + folderNames);
        const folder = folders.find(f => f.name === selectedFolder);
        if (folder) {
          chatManager.moveToFolder(convo.id, folder.id);
          renderPinnedChats();
          chatManager.renderChatList(chatList, loadConversation);
        }
        break;
      }
      case 'archive': {
        chatManager.archiveConversation(convo.id, !convo.isArchived);
        if (chatManager.activeConvoId === convo.id) newChat();
        renderPinnedChats();
        chatManager.renderChatList(chatList, loadConversation);
        break;
      }
      case 'delete': {
        if (confirm('Delete this chat permanently?')) {
          chatManager.deleteConversation(convo.id);
          if (chatManager.activeConvoId === convo.id) newChat();
          renderPinnedChats();
          chatManager.renderChatList(chatList, loadConversation);
        }
        break;
      }
    }
  }

  function handleFolderAction(action, folder) {
    switch(action) {
      case 'rename-folder': {
        const newName = prompt('New folder name:', folder.name);
        if (newName && newName.trim()) {
          chatManager.renameFolder(folder.id, newName);
          renderFolders();
        }
        break;
      }
      case 'change-icon': {
        const icons = '📁 📂 🗂️ 📋 📑 🔖 ⭐ 💼 🎯 🚀 ✨ 💡 📝';
        const newIcon = prompt('Choose an icon:', icons);
        if (newIcon) {
          const icon = newIcon.trim().split(' ').find(i => i.length > 0);
          if (icon) chatManager.changeFolderIcon(folder.id, icon);
          renderFolders();
        }
        break;
      }
      case 'delete-folder': {
        if (confirm('Delete this folder? Chats will be moved back to recent.')) {
          chatManager.deleteFolder(folder.id);
          expandedFolderId = null;
          renderFolders();
        }
        break;
      }
    }
  }

  // New folder button
  btnNewFolder.addEventListener('click', () => {
    const name = prompt('Folder name:');
    if (name && name.trim()) {
      chatManager.createFolder(name, '📁');
      renderFolders();
      pinnedSection.style.display = 'block';
    }
  });

  function renderArchivedChats() {
    const archivedChats = chatManager.getArchivedChats();
    archivedList.innerHTML = '';
    archivedChats.forEach(convo => {
      const item = createChatItem(convo);
      archivedList.appendChild(item);
    });
    archivedSection.style.display = archivedChats.length > 0 ? 'block' : 'none';
  }

  function renderSidebar() {
    renderPinnedChats();
    renderFolders();
    renderArchivedChats();
  }

  // Initial render
  renderSidebar();

  // ── Send button state ──
  function updateSendButtonState() {
    const hasContent = chatInput.value.trim().length > 0 || fileHandler.hasPendingFiles();
    btnSend.classList.toggle('active', hasContent);
  }

  // ── File handling ──
  btnAttach.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
      await fileHandler.processFiles(Array.from(e.target.files));
      fileHandler.renderFilePreview(filePreviewArea, updateSendButtonState);
    }
    fileInput.value = '';
  });

  // Drag & drop on input bar
  const inputBar = document.querySelector('.input-bar');
  inputBar.addEventListener('dragover', (e) => {
    e.preventDefault();
    inputBar.style.borderColor = 'rgba(255,156,60,.5)';
  });
  inputBar.addEventListener('dragleave', () => {
    inputBar.style.borderColor = '';
  });
  inputBar.addEventListener('drop', async (e) => {
    e.preventDefault();
    inputBar.style.borderColor = '';
    if (e.dataTransfer.files.length > 0) {
      await fileHandler.processFiles(Array.from(e.dataTransfer.files));
      fileHandler.renderFilePreview(filePreviewArea, updateSendButtonState);
    }
  });

  // ── Auto-resize textarea ──
  chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 150) + 'px';
    updateSendButtonState();
  });

  // ── Send message ──
  async function sendMessage(text) {
    const hasFiles = fileHandler.hasPendingFiles();
    if ((!text.trim() && !hasFiles) || isGenerating) return;

    const filesToSend = hasFiles ? fileHandler.getPendingFiles() : [];
    const fileContext = hasFiles ? fileHandler.buildFileContext(filesToSend) : '';
    const displayText = text.trim();

    const fullMessage = fileContext
      ? (displayText ? displayText + '\n\n' + fileContext : 'Please analyze these files.\n\n' + fileContext)
      : displayText;

    // Create new conversation if none active
    if (!chatManager.activeConvoId) {
      const title = displayText || filesToSend[0].file.name;
      chatManager.createConversation(title);
      chatManager.renderChatList(chatList, loadConversation);
      renderSidebar();
    }

    const convo = chatManager.getActiveConvo();
    if (!convo) return;

    // Switch to messages view
    landing.style.display = 'none';
    messagesWrap.style.display = 'block';
    topbarTitle.textContent = convo.title;

    // Add user message
    chatManager.addMessage(convo, 'user', displayText || 'Attached files', { hasFiles });
    const fileAttachmentsHtml = hasFiles ? fileHandler.renderFileAttachments(filesToSend) : null;
    renderer.renderMessage('user', displayText || 'Attached files', null, null, fileAttachmentsHtml);

    // Clear input & files
    chatInput.value = '';
    chatInput.style.height = 'auto';
    fileHandler.clear();
    fileHandler.renderFilePreview(filePreviewArea, updateSendButtonState);
    updateSendButtonState();

    // Show typing indicator
    isGenerating = true;
    const typingEl = renderer.renderTypingIndicator();
    renderer.scrollToBottom();

    // Get response from Sprout 1.3 engine
    if (sprout) {
      try {
        const result = await sprout.getResponse(fullMessage);
        typingEl.remove();
        chatManager.addMessage(convo, 'assistant', result.answer, { emotion: result.emotion, mode: result.mode });
        renderer.renderMessage('assistant', result.answer, result.emotion, result.mode);
        renderer.scrollToBottom();

        // Save conversation to Supabase for Cortex to learn from
        try {
          await sprout.saveConversation({
            messages: convo.messages,
            session_id: convo.id
          });
        } catch (e) { /* silently skip DB save failures */ }
      } catch (err) {
        typingEl.remove();
        const fallback = "I'm having trouble connecting right now. Please try again in a moment.";
        chatManager.addMessage(convo, 'assistant', fallback);
        renderer.renderMessage('assistant', fallback);
        renderer.scrollToBottom();
      }
    } else {
      const delay = 1000 + Math.random() * 1500;
      setTimeout(() => {
        typingEl.remove();
        const fallback = "Tithonia is still warming up. The AI engine isn't connected yet, but it will be soon!";
        chatManager.addMessage(convo, 'assistant', fallback);
        renderer.renderMessage('assistant', fallback);
        renderer.scrollToBottom();
        isGenerating = false;
      }, delay);
    }

    isGenerating = false;
  }

  // ── Load a conversation ──
  function loadConversation(id) {
    const convo = chatManager.loadConversation(id);
    if (!convo) return;

    // Restore conversation history into the AI engine
    if (sprout && convo.messages) {
      sprout.conversationHistory = [];
      sprout.turnCount = 0;
      sprout.topicMemory = [];
      for (const msg of convo.messages) {
        if (msg.role === 'user' && msg.text) {
          sprout.conversationHistory.push({ role: 'user', content: msg.text });
          sprout.turnCount++;
          const kw = sprout.extractKeywords(sprout.normalize(msg.text));
          if (kw.length > 0) sprout.topicMemory.push({ keywords: kw.slice(0, 3), turn: sprout.turnCount });
        } else if (msg.role === 'assistant' && msg.text) {
          sprout.conversationHistory.push({ role: 'assistant', content: msg.text });
        }
      }
    }

    landing.style.display = 'none';
    messagesWrap.style.display = 'block';
    topbarTitle.textContent = convo.title;
    renderer.renderAllMessages(convo.messages);
    chatManager.renderChatList(chatList, loadConversation);
    renderSidebar();
    closeSidebar();
  }

  // ── New chat ──
  function newChat() {
    chatManager.newChat();
    renderer.clearMessages();
    messagesWrap.style.display = 'none';
    landing.style.display = '';
    topbarTitle.textContent = 'New chat';
    fileHandler.clear();
    fileHandler.renderFilePreview(filePreviewArea, updateSendButtonState);
    chatManager.renderChatList(chatList, loadConversation);
    renderSidebar();
    closeSidebar();
    chatInput.focus();

    // Clear the AI engine's memory for a fresh conversation
    if (sprout) {
      sprout.conversationHistory = [];
      sprout.turnCount = 0;
      sprout.topicMemory = [];
      sprout.usedResponses.clear();
      sprout.feedbackState.awaitingCorrection = false;
    }
  }

  // ── Sidebar mobile ──
  function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('open');
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
  }

  // ── Event listeners ──
  btnSend.addEventListener('click', () => sendMessage(chatInput.value));

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(chatInput.value);
    }
  });

  btnNewChat.addEventListener('click', newChat);
  sidebarToggle.addEventListener('click', openSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);

  // Suggestion cards
  suggestionsEl.addEventListener('click', (e) => {
    const card = e.target.closest('.suggestion-card');
    if (card) {
      const prompt = card.dataset.prompt;
      chatInput.value = prompt;
      sendMessage(prompt);
    }
  });

  // ── Account integration ──
  function updateAccountUI() {
    const trainLink = document.getElementById('trainLink');
    const accountArea = document.getElementById('tithonia-account-area');
    const loggedIn = typeof SwiftawAuth !== 'undefined' && SwiftawAuth.isLoggedIn();
    const user = loggedIn ? SwiftawAuth.getUser() : null;

    // Training lab: level 2+
    if (trainLink) {
      trainLink.style.display = (user && user.accessLevel >= 2) ? 'flex' : 'none';
    }

    // Account area in sidebar
    if (accountArea) {
      if (loggedIn && user) {
        accountArea.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px;padding:4px 0;">
            <div style="width:24px;height:24px;border-radius:50%;background:${user.color};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#0a0a0a;">${user.displayName.charAt(0).toUpperCase()}</div>
            <div>
              <div style="font-size:12px;font-weight:600;color:var(--text-primary);">${user.displayName}</div>
              <div style="font-size:10px;color:var(--text-muted);">Chats are saved</div>
            </div>
          </div>`;
      } else {
        accountArea.innerHTML = `
          <div style="font-size:11px;color:var(--text-muted);line-height:1.4;">
            Chatting as guest &mdash; chats won't be saved.<br>
            <a href="/" style="color:var(--brand-orange);text-decoration:underline;font-weight:500;">Log in</a> to save your conversations.
          </div>`;
      }
    }

    // Reload chat manager data for logged-in user
    chatManager.reload();
    chatManager.renderChatList(chatList, loadConversation);
    renderSidebar();
  }

  // Listen for auth changes from other pages/components
  window.addEventListener('swiftaw-auth-change', updateAccountUI);

  // ── Init ──
  updateAccountUI();
  chatInput.focus();
})();
