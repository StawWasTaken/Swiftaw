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

  // ── Module instances ──
  const chatManager = new ChatManager();
  const fileHandler = new FileHandler();
  const renderer = new Renderer(messagesEl, messagesWrap);

  // ── State ──
  let isGenerating = false;
  let activeModel = localStorage.getItem('tithonia_model') || 'sprout-1.3';

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
  }

  // Listen for auth changes from other pages/components
  window.addEventListener('swiftaw-auth-change', updateAccountUI);

  // ── Init ──
  updateAccountUI();
  chatInput.focus();
})();
