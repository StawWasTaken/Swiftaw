// ═══════════════════════════════════════════
// SWIFTAWPLEX – REAL-TIME CHAT (Supabase)
// ═══════════════════════════════════════════

import supabase from './supabase-config.js';
import { getUser } from './auth.js';

let chatChannel = null;
let presenceChannel = null;
let onMessageCallback = null;
let onPresenceCallback = null;
let activeChannel = 'global';
let messageHistory = [];
const MAX_HISTORY = 200;

/**
 * Initialize real-time channels
 */
function initChat(onMessage, onPresence) {
  onMessageCallback = onMessage;
  onPresenceCallback = onPresence;

  if (!supabase) {
    console.warn('Supabase not available, chat will work in local mode');
    return;
  }

  // Chat channel for messages
  chatChannel = supabase.channel('swiftawplex-chat', {
    config: { broadcast: { self: true } }
  });

  chatChannel
    .on('broadcast', { event: 'message' }, (payload) => {
      handleIncomingMessage(payload.payload);
    })
    .subscribe((status) => {
      console.log('Chat channel status:', status);
    });

  // Presence channel for tracking online users and positions
  presenceChannel = supabase.channel('swiftawplex-presence', {
    config: { presence: { key: getUser()?.username || 'anonymous' } }
  });

  presenceChannel
    .on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState();
      if (onPresenceCallback) onPresenceCallback(state);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      if (onMessageCallback) {
        onMessageCallback({
          type: 'system',
          text: `${newPresences[0]?.displayName || key} entered the Swiftawplex`,
          timestamp: Date.now()
        });
      }
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      if (onMessageCallback) {
        onMessageCallback({
          type: 'system',
          text: `${leftPresences[0]?.displayName || key} left the Swiftawplex`,
          timestamp: Date.now()
        });
      }
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const user = getUser();
        await presenceChannel.track({
          username: user?.username,
          displayName: user?.displayName,
          role: user?.role,
          roleClass: user?.roleClass,
          color: user?.color,
          zone: 'Lobby',
          x: 0, y: 3, z: 10,
          online_at: new Date().toISOString()
        });
      }
    });
}

/**
 * Send a chat message
 */
async function sendMessage(text, channel) {
  const user = getUser();
  if (!user || !text.trim()) return;

  const message = {
    id: crypto.randomUUID(),
    userId: user.username,
    displayName: user.displayName,
    role: user.role,
    roleClass: user.roleClass,
    color: user.color,
    text: text.trim(),
    channel: channel || activeChannel,
    timestamp: Date.now()
  };

  if (chatChannel) {
    await chatChannel.send({
      type: 'broadcast',
      event: 'message',
      payload: message
    });
  } else {
    // Local fallback
    handleIncomingMessage(message);
  }
}

/**
 * Handle incoming message
 */
function handleIncomingMessage(msg) {
  if (msg.channel && msg.channel !== activeChannel && msg.channel !== 'system') return;

  messageHistory.push(msg);
  if (messageHistory.length > MAX_HISTORY) {
    messageHistory = messageHistory.slice(-MAX_HISTORY);
  }

  if (onMessageCallback) onMessageCallback(msg);
}

/**
 * Update player presence (position, zone, etc.)
 */
async function updatePresence(data) {
  if (!presenceChannel) return;

  const user = getUser();
  try {
    await presenceChannel.track({
      username: user?.username,
      displayName: user?.displayName,
      role: user?.role,
      roleClass: user?.roleClass,
      color: user?.color,
      ...data,
      online_at: new Date().toISOString()
    });
  } catch (e) {
    // Silently handle presence update failures
  }
}

/**
 * Switch active chat channel
 */
function switchChannel(channel) {
  activeChannel = channel;
}

/**
 * Get current channel
 */
function getActiveChannel() {
  return activeChannel;
}

/**
 * Get message history
 */
function getMessages() {
  return messageHistory;
}

/**
 * Send a system/announcement message
 */
function sendSystemMessage(text) {
  const msg = {
    type: 'system',
    text,
    channel: 'global',
    timestamp: Date.now()
  };
  if (chatChannel) {
    chatChannel.send({ type: 'broadcast', event: 'message', payload: msg });
  } else {
    handleIncomingMessage(msg);
  }
}

/**
 * Cleanup channels
 */
async function destroyChat() {
  if (chatChannel) {
    await supabase.removeChannel(chatChannel);
    chatChannel = null;
  }
  if (presenceChannel) {
    await supabase.removeChannel(presenceChannel);
    presenceChannel = null;
  }
  messageHistory = [];
}

export {
  initChat, sendMessage, updatePresence,
  switchChannel, getActiveChannel, getMessages,
  sendSystemMessage, destroyChat
};
