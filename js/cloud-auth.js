/**
 * Swiftaw Cloud Authentication System
 * Unified identity system for all Swiftaw products
 */

const SUPABASE_URL = 'https://eujglvqqhrkyhyuqagse.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1amdsdnFxaHJreWh5dXFhZ3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjQ4NjUsImV4cCI6MjA5MDgwMDg2NX0.HjsPbBICvRnM1OTqafdP90grjw9lj1RfR_G_YHicMGY';

class SwiftawCloudAuth {
  constructor() {
    this.user = null;
    this.session = null;
    this.loadSession();
  }

  /**
   * Load session from localStorage
   */
  loadSession() {
    const session = localStorage.getItem('cloud_session');
    const email = localStorage.getItem('cloud_user_email');

    if (session && email) {
      this.session = JSON.parse(session);
      this.user = {
        email: email,
        displayName: email.split('@')[0],
        avatar: email.charAt(0).toUpperCase(),
        accessLevel: this.getAccessLevel(email)
      };
      return true;
    }
    return false;
  }

  /**
   * Get access level for user
   * Special case: "Staw" user gets level 5 (admin)
   */
  getAccessLevel(email) {
    const name = email.split('@')[0].toLowerCase();
    if (name === 'staw' || email.toLowerCase() === 'staw@swiftaw.io') {
      return 5; // Admin access
    }
    return 1; // Regular user
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.session !== null && this.user !== null;
  }

  /**
   * Check if user has admin access (level 5)
   */
  isAdmin() {
    return this.user && this.user.accessLevel >= 5;
  }

  /**
   * Get current user
   */
  getUser() {
    return this.user;
  }

  /**
   * Sign out
   */
  logout() {
    localStorage.removeItem('cloud_session');
    localStorage.removeItem('cloud_user_email');
    this.user = null;
    this.session = null;
    window.location.href = '/cloud/login';
  }

  /**
   * Sign up (create new account)
   */
  async signup(email, password) {
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Signup failed');

      this.session = data;
      this.user = {
        email: email,
        displayName: email.split('@')[0],
        avatar: email.charAt(0).toUpperCase(),
        accessLevel: this.getAccessLevel(email)
      };

      localStorage.setItem('cloud_session', JSON.stringify(data));
      localStorage.setItem('cloud_user_email', email);

      return { success: true, user: this.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Sign in (login)
   */
  async signin(email, password) {
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error_description || 'Login failed');

      this.session = data;
      this.user = {
        email: email,
        displayName: email.split('@')[0],
        avatar: email.charAt(0).toUpperCase(),
        accessLevel: this.getAccessLevel(email)
      };

      localStorage.setItem('cloud_session', JSON.stringify(data));
      localStorage.setItem('cloud_user_email', email);

      return { success: true, user: this.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a profile widget (avatar + user info)
   */
  createProfileWidget() {
    if (!this.isAuthenticated()) return null;

    const div = document.createElement('div');
    div.className = 'cloud-profile-widget';
    div.innerHTML = `
      <div class="profile-avatar">${this.user.avatar}</div>
      <div class="profile-info">
        <div class="profile-name">${this.user.displayName}</div>
        <div class="profile-email">${this.user.email}</div>
        ${this.isAdmin() ? '<div class="profile-badge">Admin</div>' : ''}
      </div>
      <button class="profile-logout" onclick="cloudAuth.logout()">Sign out</button>
    `;
    return div;
  }

  /**
   * Create a login prompt
   */
  createLoginPrompt() {
    const div = document.createElement('div');
    div.className = 'cloud-login-prompt';
    div.innerHTML = `
      <div class="prompt-content">
        <div class="prompt-icon">☁️</div>
        <h3>Sign in with Swiftaw Cloud</h3>
        <p>Manage all your product identities in one place</p>
        <div class="prompt-actions">
          <a href="/cloud/login" class="prompt-btn primary">Sign in</a>
          <a href="/cloud/signup" class="prompt-btn secondary">Create account</a>
        </div>
      </div>
    `;
    return div;
  }
}

// Global instance
const cloudAuth = new SwiftawCloudAuth();

// Auto-inject profile widget to nav if authenticated
document.addEventListener('DOMContentLoaded', () => {
  if (cloudAuth.isAuthenticated()) {
    const navAuthArea = document.querySelector('.nav-auth-area');
    if (navAuthArea) {
      const widget = cloudAuth.createProfileWidget();
      if (widget) navAuthArea.appendChild(widget);
    }
  }
});
