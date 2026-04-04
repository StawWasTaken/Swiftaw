/**
 * Swiftaw Cloud Authentication System
 * Unified identity system for all Swiftaw products
 * Persistent user data stored in Supabase
 */

const SUPABASE_URL = 'https://eujglvqqhrkyhyuqagse.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1amdsdnFxaHJreWh5dXFhZ3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjQ4NjUsImV4cCI6MjA5MDgwMDg2NX0.HjsPbBICvRnM1OTqafdP90grjw9lj1RfR_G_YHicMGY';

class SwiftawCloudAuth {
  constructor() {
    this.user = null;
    this.session = null;
    this.profile = null;
    this.loadSession();
  }

  /**
   * Load session from localStorage and fetch profile from Supabase
   */
  async loadSession() {
    const session = localStorage.getItem('cloud_session');
    const email = localStorage.getItem('cloud_user_email');
    const userId = localStorage.getItem('cloud_user_id');

    if (session && email) {
      this.session = JSON.parse(session);

      // Basic user data
      this.user = {
        id: userId,
        email: email,
        displayName: email.split('@')[0],
        avatar: email.charAt(0).toUpperCase(),
        accessLevel: this.getAccessLevel(email)
      };

      // Try to load full profile from Supabase
      if (userId) {
        await this.loadUserProfile(userId);
      }

      return true;
    }
    return false;
  }

  /**
   * Load user profile from Supabase database
   */
  async loadUserProfile(userId) {
    try {
      if (!this.session || !this.session.access_token) return;

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}&select=*`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${this.session.access_token}`
          }
        }
      );

      if (response.ok) {
        const profiles = await response.json();
        if (profiles && profiles.length > 0) {
          this.profile = profiles[0];
          // Update display name from profile
          if (this.profile.display_name) {
            this.user.displayName = this.profile.display_name;
            this.user.avatar = this.profile.display_name.charAt(0).toUpperCase();
          }
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
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
    localStorage.removeItem('cloud_user_id');
    this.user = null;
    this.session = null;
    this.profile = null;
    window.location.href = '/cloud/login';
  }

  /**
   * Sign up (create new account)
   */
  async signup(email, password, displayName = '') {
    try {
      // Create auth user
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

      const userId = data.user.id;

      // Create user record in database
      await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${data.access_token}`
        },
        body: JSON.stringify({
          id: userId,
          email: email,
          access_level: this.getAccessLevel(email),
          is_active: true
        })
      });

      // Create profile record
      await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${data.access_token}`
        },
        body: JSON.stringify({
          user_id: userId,
          display_name: displayName || email.split('@')[0],
          username: email.split('@')[0]
        })
      });

      // Store session
      this.session = data;
      this.user = {
        id: userId,
        email: email,
        displayName: displayName || email.split('@')[0],
        avatar: (displayName || email.split('@')[0]).charAt(0).toUpperCase(),
        accessLevel: this.getAccessLevel(email)
      };

      localStorage.setItem('cloud_session', JSON.stringify(data));
      localStorage.setItem('cloud_user_email', email);
      localStorage.setItem('cloud_user_id', userId);

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

      const userId = data.user.id;

      // Store session
      this.session = data;
      this.user = {
        id: userId,
        email: email,
        displayName: email.split('@')[0],
        avatar: email.charAt(0).toUpperCase(),
        accessLevel: this.getAccessLevel(email)
      };

      localStorage.setItem('cloud_session', JSON.stringify(data));
      localStorage.setItem('cloud_user_email', email);
      localStorage.setItem('cloud_user_id', userId);

      // Load full profile
      await this.loadUserProfile(userId);

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
document.addEventListener('DOMContentLoaded', async () => {
  if (cloudAuth.isAuthenticated()) {
    const navAuthArea = document.querySelector('.nav-auth-area');
    if (navAuthArea) {
      const widget = cloudAuth.createProfileWidget();
      if (widget) navAuthArea.appendChild(widget);
    }
  }
});
