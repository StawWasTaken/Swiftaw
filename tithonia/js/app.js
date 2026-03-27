/**
 * Tithonia — Main Application
 * Entry point that wires together all modules
 */

import { MODELS } from './config.js';
import { ChatManager } from './chat-manager.js';
import { FileHandler } from './file-handler.js';
import { Renderer } from './renderer.js';
import { DocumentAnalyzer } from './document-analyzer.js';
import { CodeAssistant } from './code-assistant.js';

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
  const foldersContainer = $('#foldersList');
  const btnNewFolder = $('#btnNewFolder');
  const tithoniaTools = $('#tithoniaTools');
  const archivedSection = $('#archivedSection');
  const archivedList = $('#archivedList');
  const chatSearch = $('#chatSearch');
  const bulkActionsBar = $('#bulkActionsBar');
  const bulkCount = $('#bulkCount');
  const btnBulkArchive = $('#btnBulkArchive');
  const btnBulkDelete = $('#btnBulkDelete');
  const btnBulkCancel = $('#btnBulkCancel');

  // ── Module instances ──
  // Initialize Supabase client for Tithonia
  const tithoniaDb = typeof window.createTithoniaSupabaseClient !== 'undefined' ? window.createTithoniaSupabaseClient() : null;
  const chatManager = new ChatManager(tithoniaDb);
  const fileHandler = new FileHandler();
  const renderer = new Renderer(messagesEl, messagesWrap);
  const docAnalyzer = new DocumentAnalyzer();
  const codeAssistant = new CodeAssistant();

  // ── Helper functions ──
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ── State ──
  let isGenerating = false;
  let activeModel = localStorage.getItem('tithonia_model') || 'sprout-1.4';
  let selectedTool = null;
  let expandedFolderId = null;
  let bulkSelectMode = false;
  let selectedChats = new Set();
  let draggedChat = null;
  let draggedFromFolder = null;
  let searchQuery = '';

  // ── Sprout 1.4 Engine (AI Brain) ──
  const sprout = typeof window.SproutEngine !== 'undefined' && tithoniaDb ? new window.SproutEngine(tithoniaDb) : null;

  // ── Detect programming language from user request ──
  function detectCodeLanguage(message) {
    const lower = message.toLowerCase();
    const languages = {
      'python': /\bpython\b/,
      'javascript': /\bjavascript|js\b/,
      'typescript': /\btypescript|ts\b/,
      'html': /\bhtml\b/,
      'css': /\bcss\b/,
      'java': /\bjava\b/,
      'cpp': /\bc\+\+|cpp\b/,
      'csharp': /\bc#|csharp\b/,
      'go': /\bgo\b/,
      'rust': /\brust\b/,
      'sql': /\bsql\b/,
      'bash': /\bbash|shell|sh\b/,
      'powershell': /\bpowershell\b/,
      'ruby': /\bruby\b/,
      'php': /\bphp\b/
    };

    for (const [lang, pattern] of Object.entries(languages)) {
      if (pattern.test(lower)) {
        return lang;
      }
    }

    // Guess from context
    if (/\bfunction|class|const|let|var|=>/.test(message)) return 'javascript';
    if (/\bdef |import |print\(/.test(message)) return 'python';
    if (/<html|<!doctype/.test(lower)) return 'html';

    return null;
  }

  // ── Generate working code based on user request ──
  function generateWorkingCode(request, language) {
    const templates = {
      'html': () => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
  </style>
</head>
<body>
  <h1>Hello, World!</h1>
  <p>Your content here</p>
</body>
</html>`,

      'css': () => `/* Stylesheet */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1, h2, h3 { margin-bottom: 0.5em; }`,

      'javascript': () => `// JavaScript code
function main() {
  console.log('Hello, World!');

  // Your code here
  const data = {
    message: 'Welcome',
    timestamp: new Date()
  };

  return data;
}

// Run
main();`,

      'python': () => `#!/usr/bin/env python3
"""Python script"""

def main():
    print("Hello, World!")

    # Your code here
    data = {
        'message': 'Welcome',
        'timestamp': str(__import__('datetime').datetime.now())
    }

    return data

if __name__ == "__main__":
    result = main()
    print(result)`,

      'sql': () => `-- SQL Query
SELECT *
FROM users
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 10;

-- INSERT example
INSERT INTO users (name, email, status)
VALUES ('John', 'john@example.com', 'active');

-- UPDATE example
UPDATE users
SET status = 'inactive'
WHERE id = 1;`,

      'bash': () => `#!/bin/bash
# Bash script

echo "Hello, World!"

# Variables
name="User"
echo "Welcome, $name"

# Functions
function greet() {
  echo "Greeting: $1"
}

greet "Everyone"

# Exit successfully
exit 0`,

      'java': () => `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");

        String message = "Welcome";
        int count = 42;

        processData(message, count);
    }

    static void processData(String msg, int num) {
        System.out.println("Message: " + msg);
        System.out.println("Number: " + num);
    }
}`,

      'csharp': () => `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");

        string message = "Welcome";
        int count = 42;

        ProcessData(message, count);
    }

    static void ProcessData(string msg, int num) {
        Console.WriteLine($"Message: {msg}");
        Console.WriteLine($"Number: {num}");
    }
}`,

      'ruby': () => `#!/usr/bin/env ruby

def main
  puts "Hello, World!"

  message = "Welcome"
  count = 42

  process_data(message, count)
end

def process_data(msg, num)
  puts "Message: #{msg}"
  puts "Number: #{num}"
end

main if __FILE__ == $PROGRAM_NAME`,

      'php': () => `<?php
echo "Hello, World!";

$message = "Welcome";
$count = 42;

function processData($msg, $num) {
    echo "Message: " . $msg . "<br>";
    echo "Number: " . $num . "<br>";
}

processData($message, $count);
?>`,

      'typescript': () => `// TypeScript code
interface User {
  name: string;
  email: string;
  age: number;
}

function main(): User {
  const user: User = {
    name: 'John',
    email: 'john@example.com',
    age: 30
  };

  console.log('User:', user);
  return user;
}

main();`
    };

    const generator = templates[language] || templates['javascript'];
    return generator();
  }

  // ── Initialize from Supabase if logged in ──
  async function initializeChats() {
    if (chatManager.syncEnabled) {
      await chatManager.loadFromSupabase();
      renderSidebar();
    }
  }
  initializeChats();

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

  modelSelectorBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleModelSelector();
  });

  if (modelSelector) {
    document.addEventListener('click', (e) => {
      if (!modelSelector.contains(e.target)) {
        closeModelSelector();
      }
    });
  }

  // Init model display
  if (MODELS[activeModel]) {
    selectedModelName.textContent = MODELS[activeModel].name;
    inputDisclaimer.textContent = `${MODELS[activeModel].name} can make mistakes. Verify important information.`;
    landingDesc.textContent = `A modern AI assistant powered by ${MODELS[activeModel].name} — built for daily help, smart project planning, quick answers, and specialized insights.`;
  }
  renderModelDropdown();

  // ── Tools Selector ──
  function toggleToolsSelector() {
    toolsSelector.classList.toggle('open');
  }

  function closeToolsSelector() {
    toolsSelector.classList.remove('open');
  }

  toolsSelectorBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleToolsSelector();
  });

  toolsDropdown?.addEventListener('click', (e) => {
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

  // ── Search Functionality ──
  function filterChats(query) {
    searchQuery = query.toLowerCase();
    renderSidebar();
  }

  chatSearch?.addEventListener('input', (e) => {
    filterChats(e.target.value);
  });

  // ── Bulk Selection Mode ──
  function toggleBulkSelectMode() {
    bulkSelectMode = !bulkSelectMode;
    selectedChats.clear();
    renderSidebar();
  }

  function addToBulkSelection(chatId) {
    if (selectedChats.has(chatId)) {
      selectedChats.delete(chatId);
    } else {
      selectedChats.add(chatId);
    }
    updateBulkActionsBar();
    renderSidebar();
  }

  function updateBulkActionsBar() {
    const count = selectedChats.size;
    if (count > 0) {
      bulkActionsBar.style.display = 'flex';
      bulkCount.textContent = count + ' selected';
    } else {
      bulkActionsBar.style.display = 'none';
      selectedChats.clear();
    }
  }

  btnBulkCancel?.addEventListener('click', () => {
    selectedChats.clear();
    updateBulkActionsBar();
    renderSidebar();
  });

  btnBulkArchive?.addEventListener('click', () => {
    selectedChats.forEach(chatId => {
      chatManager.archiveConversation(chatId, true);
    });
    selectedChats.clear();
    updateBulkActionsBar();
    if (chatManager.activeConvoId && selectedChats.has(chatManager.activeConvoId)) {
      newChat();
    }
    renderSidebar();
  });

  btnBulkDelete?.addEventListener('click', () => {
    if (confirm(`Delete ${selectedChats.size} chat(s) permanently?`)) {
      selectedChats.forEach(chatId => {
        chatManager.deleteConversation(chatId);
      });
      selectedChats.clear();
      updateBulkActionsBar();
      if (chatManager.activeConvoId && selectedChats.has(chatManager.activeConvoId)) {
        newChat();
      }
      renderSidebar();
    }
  });

  // ── Tithonia Tools Buttons ──
  tithoniaTools?.addEventListener('click', (e) => {
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
      if (item) pinnedList.appendChild(item);
    });

    // Show/hide pinned section
    pinnedSection.style.display = pinnedChats.length > 0 || Object.keys(chatManager.folders).length > 0 ? 'block' : 'none';
  }

  function createChatItem(convo) {
    // Skip if doesn't match search
    if (searchQuery && !convo.title.toLowerCase().includes(searchQuery)) {
      return null;
    }

    const item = document.createElement('div');
    item.className = 'chat-item' + (convo.id === chatManager.activeConvoId ? ' active' : '') + (bulkSelectMode ? ' selectable' : '') + (selectedChats.has(convo.id) ? ' selected' : '');
    item.draggable = true;
    item.dataset.chatId = convo.id;

    const checkbox = bulkSelectMode ? `<div class="checkbox"></div>` : '';
    item.innerHTML = `
      ${checkbox}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <span>${escapeHtml(convo.title)}</span>`;

    if (bulkSelectMode) {
      item.addEventListener('click', () => addToBulkSelection(convo.id));
    } else {
      item.addEventListener('click', () => loadConversation(convo.id));
    }

    item.addEventListener('contextmenu', (e) => {
      if (!bulkSelectMode) showChatContextMenu(e, convo);
    });

    // Drag & Drop
    item.addEventListener('dragstart', (e) => {
      draggedChat = convo;
      draggedFromFolder = convo.folderId;
      item.style.opacity = '0.5';
      e.dataTransfer.effectAllowed = 'move';
    });

    item.addEventListener('dragend', () => {
      item.style.opacity = '1';
      draggedChat = null;
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      // This handles dropping a chat onto another chat
      // In practice, we'd move to same folder
    });

    return item;
  }

  function renderFolders() {
    foldersContainer.innerHTML = '';
    Object.values(chatManager.folders).forEach(folder => {
      const folderEl = document.createElement('div');
      folderEl.className = 'folder-item' + (expandedFolderId === folder.id ? ' expanded' : '');
      folderEl.dataset.folderId = folder.id;
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

      // Drag & Drop for folders
      folderEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        folderEl.style.background = 'rgba(255,156,60,.1)';
      });

      folderEl.addEventListener('dragleave', () => {
        folderEl.style.background = '';
      });

      folderEl.addEventListener('drop', (e) => {
        e.preventDefault();
        folderEl.style.background = '';
        if (draggedChat) {
          chatManager.moveToFolder(draggedChat.id, folder.id);
          draggedChat = null;
          draggedFromFolder = null;
          renderSidebar();
        }
      });

      foldersContainer.appendChild(folderEl);

      // Add chats in folder
      if (expandedFolderId === folder.id) {
        const chatsInFolder = chatManager.getChatsByFolder(folder.id);
        chatsInFolder.forEach(convo => {
          const chatItem = createChatItem(convo);
          if (chatItem) {
            chatItem.style.marginLeft = '20px';
            foldersContainer.appendChild(chatItem);
          }
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
          renderSidebar();
          if (chatManager.activeConvoId === convo.id) {
            topbarTitle.textContent = chatManager.getActiveConvo().title;
          }
        }
        break;
      }
      case 'pin': {
        chatManager.pinConversation(convo.id, !convo.isPinned);
        renderPinnedChats();
        renderSidebar();
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
          renderSidebar();
        }
        break;
      }
      case 'archive': {
        chatManager.archiveConversation(convo.id, !convo.isArchived);
        if (chatManager.activeConvoId === convo.id) newChat();
        renderPinnedChats();
        renderSidebar();
        break;
      }
      case 'delete': {
        if (confirm('Delete this chat permanently?')) {
          chatManager.deleteConversation(convo.id);
          if (chatManager.activeConvoId === convo.id) newChat();
          renderPinnedChats();
          renderSidebar();
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
  btnNewFolder?.addEventListener('click', () => {
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
      if (item) archivedList.appendChild(item);
    });
    archivedSection.style.display = archivedChats.length > 0 ? 'block' : 'none';
  }

  function renderRecentChats() {
    const recentChats = chatManager.getRecentChats();
    chatList.innerHTML = '';
    recentChats.forEach(convo => {
      const item = createChatItem(convo);
      if (item) chatList.appendChild(item);
    });
  }

  function renderSidebar() {
    renderPinnedChats();
    renderFolders();
    renderRecentChats();
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
  btnAttach?.addEventListener('click', () => {
    fileInput?.click();
  });

  fileInput?.addEventListener('change', async (e) => {
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
      renderSidebar();
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

    // Get response from active AI engine (Sprout 1.4 or Floret 1.1)
    const engine = getActiveEngine();
    if (engine) {
      try {
        let result;

        // Detect if user is asking for code/script
        const codeLanguage = detectCodeLanguage(fullMessage);
        const lower = fullMessage.toLowerCase().trim();

        // Match explicit code requests OR bare language names like "html", "python", "css"
        const isExplicitCodeRequest = /\b(write|create|generate|make|build|implement|code|script)\b/i.test(lower) && codeLanguage;
        const isBareLanguageRequest = codeLanguage && lower.split(/\s+/).length <= 3;
        const isCodeRequest = isExplicitCodeRequest || isBareLanguageRequest;

        if (isCodeRequest && codeLanguage) {
          // CODE GENERATION PATH - Instant, no database calls
          const code = generateWorkingCode(fullMessage, codeLanguage);

          result = {
            answer: code,
            emotion: 'neutral',
            mode: 'code-generation',
            isCode: true,
            language: codeLanguage
          };
        } else {
          // NORMAL RESPONSE PATH — with timeout protection
          if (activeModel.startsWith('floret')) {
            // Floret: Return quick corporate response
            result = {
              answer: `I can help with that. For code generation, specify the language (e.g. "python", "javascript", "html") and I'll generate working code for you.`,
              emotion: 'neutral',
              mode: 'corporate-task'
            };
          } else if (sprout) {
            // Sprout: Conversational response WITH 6-second timeout
            try {
              result = await Promise.race([
                sprout.getResponse(fullMessage),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000))
              ]);
            } catch (e) {
              // Timeout or error — give a fast fallback instead of hanging
              result = {
                answer: "I understand you're asking about \"" + fullMessage.substring(0, 40) + "\". Could you tell me a bit more so I can help?",
                emotion: 'curious',
                mode: 'fallback'
              };
            }
          } else {
            // No engine available
            result = {
              answer: 'How can I help you today?',
              emotion: 'neutral',
              mode: 'fallback'
            };
          }
        }

        typingEl.remove();

        // Create streaming message element
        const msgEl = renderer.createStreamingMessage('assistant', result.emotion || 'neutral', result.mode);
        msgEl.classList.add('ai-response');

        // If it's code, add code formatting (no streaming for speed)
        if (result.isCode && result.language) {
          msgEl.classList.add('code-response');
          // Add code block with syntax highlighting
          const codeBlock = document.createElement('pre');
          const codeEl = document.createElement('code');
          codeEl.className = `language-${result.language}`;
          codeEl.textContent = result.answer;
          codeBlock.appendChild(codeEl);
          msgEl.appendChild(codeBlock);

          // Syntax highlight if available
          if (typeof hljs !== 'undefined') {
            try {
              hljs.highlightElement(codeEl);
            } catch (e) {
              // Highlight not critical
            }
          }

          messagesEl.appendChild(msgEl);
          renderer.scrollToBottom();
        } else {
          // Stream the text with typing animation (with timeout)
          try {
            await Promise.race([
              renderer.streamText(msgEl, result.answer, 'assistant'),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
            ]);
          } catch (e) {
            // If streaming times out, just display the text
            msgEl.innerHTML = `<p>${escapeHtml(result.answer)}</p>`;
            messagesEl.appendChild(msgEl);
            renderer.scrollToBottom();
          }
        }

        // Save to chat manager
        chatManager.addMessage(convo, 'assistant', result.answer, { emotion: result.emotion, mode: result.mode });

        // Save conversation to Supabase
        try {
          if (activeModel.startsWith('floret') && floret) {
            await floret.logTaskExecution({
              taskType: 'general-corporate',
              requirements: { primaryGoal: fullMessage },
              result: result,
              validation: { syntaxValid: true }
            });
          } else if (sprout) {
            await sprout.saveConversation({
              messages: convo.messages,
              session_id: convo.id
            });
          }
        } catch (e) { /* silently skip DB save failures */ }
      } catch (err) {
        typingEl.remove();
        const fallback = "I'm having trouble processing that. Please try again.";

        // Stream fallback message
        const msgEl = renderer.createStreamingMessage('assistant', 'neutral', null);
        msgEl.classList.add('ai-response');
        await renderer.streamText(msgEl, fallback, 'assistant');

        chatManager.addMessage(convo, 'assistant', fallback);
      }
    } else {
      const delay = 1000 + Math.random() * 1500;
      setTimeout(async () => {
        typingEl.remove();
        const fallback = "Tithonia is still warming up. The AI engine isn't connected yet, but it will be soon!";

        // Stream fallback message
        const msgEl = renderer.createStreamingMessage('assistant', 'neutral', null);
        msgEl.classList.add('ai-response');
        await renderer.streamText(msgEl, fallback, 'assistant');

        chatManager.addMessage(convo, 'assistant', fallback);
        isGenerating = false;
      }, delay);
    }

    isGenerating = false;
  }

  // ── Message Actions (Copy, Edit, Delete, Regenerate) ──
  messagesEl.addEventListener('click', async (e) => {
    const action = e.target.closest('.msg-action');
    if (!action) return;

    const messageDiv = action.closest('.message');
    const messageIndex = Array.from(messagesEl.children).indexOf(messageDiv);
    const convo = chatManager.getActiveConvo();
    if (!convo || messageIndex < 0) return;

    const isUserMessage = messageDiv.querySelector('.message-avatar.user-avatar');
    const messageText = messageDiv.querySelector('.message-text')?.textContent || '';

    if (action.classList.contains('msg-copy')) {
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(messageText);
        action.classList.add('active');
        setTimeout(() => action.classList.remove('active'), 2000);
      } catch (err) {
        alert('Failed to copy: ' + err.message);
      }
    } else if (action.classList.contains('msg-edit') && isUserMessage) {
      // Edit user message
      const newText = prompt('Edit your message:', messageText);
      if (newText && newText.trim()) {
        const msgIndex = convo.messages.findIndex((_, i) => {
          const correspondingDiv = messagesEl.children[i * 2];
          return correspondingDiv === messageDiv;
        });
        if (msgIndex !== -1) {
          convo.messages[msgIndex].text = newText.trim();
          chatManager.save();
          renderer.renderAllMessages(convo.messages);
        }
      }
    } else if (action.classList.contains('msg-delete')) {
      // Delete message
      const msgIndex = convo.messages.findIndex((_, i) => {
        // Count only actual message elements, skip typing indicator
        const msgDivs = Array.from(messagesEl.children).filter(el =>
          el.id !== 'typingMsg' && el.classList.contains('message')
        );
        return msgDivs[i] === messageDiv;
      });

      if (msgIndex !== -1) {
        if (confirm('Delete this message?')) {
          convo.messages.splice(msgIndex, 1);
          chatManager.save();
          renderer.renderAllMessages(convo.messages);
        }
      }
    } else if (action.classList.contains('msg-regenerate') && !isUserMessage) {
      // Regenerate AI response
      if (convo.messages.length > 0) {
        const lastUserMsg = convo.messages.filter(m => m.role === 'user').pop();
        if (lastUserMsg) {
          // Remove the last AI response
          const lastAiIndex = convo.messages.length - 1;
          if (convo.messages[lastAiIndex].role === 'assistant') {
            convo.messages.pop();
            chatManager.save();
            renderer.renderAllMessages(convo.messages);
            // Regenerate
            await sendMessage(lastUserMsg.text);
          }
        }
      }
    }
  });

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
    renderSidebar();
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
    renderSidebar();
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
  btnSend?.addEventListener('click', () => sendMessage(chatInput.value));

  chatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(chatInput.value);
    }
  });

  btnNewChat?.addEventListener('click', newChat);
  sidebarToggle?.addEventListener('click', openSidebar);
  sidebarOverlay?.addEventListener('click', closeSidebar);

  // Suggestion cards
  suggestionsEl?.addEventListener('click', (e) => {
    const card = e.target.closest('.suggestion-card');
    if (card) {
      const prompt = card.dataset.prompt;
      if (chatInput) chatInput.value = prompt;
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
    renderSidebar();
    renderSidebar();
  }

  // Listen for auth changes from other pages/components
  window.addEventListener('swiftaw-auth-change', updateAccountUI);

  // ── Init ──
  updateAccountUI();
  chatInput.focus();
})();
