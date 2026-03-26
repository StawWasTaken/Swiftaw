// ═══════════════════════════════════════════════════════
// SWIFTAW – SHARED NAV AUTH UI
// Injects login/account button into the nav bar
// ═══════════════════════════════════════════════════════

(function () {
  if (typeof SwiftawAuth === 'undefined') return;

  // ─── Styles ───
  const style = document.createElement('style');
  style.textContent = `
    .nav-auth-area { display: flex; align-items: center; gap: 8px; margin-left: 12px; }
    .nav-auth-btn {
      padding: 7px 18px; border-radius: 100px; font-size: .84rem; font-weight: 600;
      cursor: pointer; transition: all .2s; border: 1.5px solid var(--border, #e5e5e5);
      background: transparent; color: var(--text, #0a0a0a); font-family: inherit;
    }
    .nav-auth-btn:hover { border-color: #999; }
    .nav-auth-btn.login-btn { background: var(--brand-deep, #241f3c); color: #fff; border-color: var(--brand-deep, #241f3c); }
    .nav-auth-btn.login-btn:hover { opacity: .85; }
    .nav-user-pill {
      display: flex; align-items: center; gap: 8px; padding: 5px 14px 5px 8px;
      border-radius: 100px; background: rgba(36,31,60,.06); cursor: pointer;
      position: relative; transition: background .15s; border: 1px solid var(--border, #e5e5e5);
    }
    .nav-user-pill:hover { background: rgba(36,31,60,.1); }
    .nav-user-avatar {
      width: 26px; height: 26px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 11px; color: #fff;
    }
    .nav-user-name { font-size: .84rem; font-weight: 600; color: var(--text, #0a0a0a); }
    .nav-user-role { font-size: .68rem; font-weight: 500; color: var(--text-muted, #888); margin-left: 2px; }
    .nav-user-dropdown {
      position: absolute; top: calc(100% + 8px); right: 0; min-width: 200px;
      background: #fff; border: 1px solid var(--border, #e5e5e5); border-radius: 12px;
      box-shadow: 0 12px 40px rgba(0,0,0,.1); padding: 6px; z-index: 1000;
      display: none;
    }
    .nav-user-dropdown.open { display: block; }
    .nav-user-dropdown a, .nav-user-dropdown button {
      display: block; width: 100%; text-align: left; padding: 10px 14px; border-radius: 8px;
      font-size: .86rem; font-weight: 500; cursor: pointer; transition: background .12s;
      border: none; background: none; font-family: inherit; color: var(--text, #0a0a0a); text-decoration: none;
    }
    .nav-user-dropdown a:hover, .nav-user-dropdown button:hover { background: #f5f5f5; }
    .nav-user-dropdown .dropdown-divider { height: 1px; background: var(--border, #e5e5e5); margin: 4px 8px; }
    .nav-user-dropdown .dropdown-label { padding: 8px 14px 4px; font-size: .72rem; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--text-muted, #888); }
    .nav-user-dropdown .logout-btn { color: #c62828; }
    .nav-swiftawplex-link {
      display: flex; align-items: center; gap: 5px;
      padding: 7px 16px; border-radius: 100px; font-size: .82rem; font-weight: 600;
      background: linear-gradient(135deg, #241f3c, #3a2f6a); color: #fff93e;
      transition: box-shadow .2s, transform .15s; text-decoration: none; white-space: nowrap;
    }
    .nav-swiftawplex-link:hover { box-shadow: 0 0 20px rgba(255,249,62,.3); transform: translateY(-1px); }

    /* Auth Modal */
    .swiftaw-auth-modal {
      display: none; position: fixed; inset: 0; z-index: 10000;
      align-items: center; justify-content: center;
      background: rgba(10,10,10,.5); backdrop-filter: blur(4px);
    }
    .swiftaw-auth-modal.open { display: flex; }
    .swiftaw-auth-card {
      background: #fff; border-radius: 20px; padding: 40px 36px;
      width: 400px; max-width: 92vw; box-shadow: 0 24px 80px rgba(0,0,0,.15);
      position: relative;
    }
    .swiftaw-auth-card h2 { font-size: 1.5rem; font-weight: 700; margin-bottom: 6px; }
    .swiftaw-auth-card .auth-subtitle { font-size: .9rem; color: #888; margin-bottom: 24px; }
    .swiftaw-auth-card .auth-close {
      position: absolute; top: 16px; right: 18px; background: none; border: none;
      font-size: 1.4rem; cursor: pointer; color: #999; padding: 4px;
    }
    .swiftaw-auth-card .auth-close:hover { color: #333; }
    .auth-form-group { margin-bottom: 16px; }
    .auth-form-group label {
      display: block; font-size: .78rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: .06em; color: #888; margin-bottom: 6px;
    }
    .auth-form-group input {
      width: 100%; padding: 11px 14px; border: 1.5px solid #e5e5e5; border-radius: 10px;
      font-size: .94rem; outline: none; transition: border-color .2s; font-family: inherit; color: #0a0a0a;
    }
    .auth-form-group input:focus { border-color: #241f3c; }
    .auth-error { color: #c62828; font-size: .82rem; margin-bottom: 12px; min-height: 20px; }
    .auth-submit {
      width: 100%; padding: 12px; border: none; border-radius: 10px;
      background: #241f3c; color: #fff; font-size: .95rem; font-weight: 600;
      cursor: pointer; transition: opacity .15s; font-family: inherit;
    }
    .auth-submit:hover { opacity: .85; }
    .auth-switch { text-align: center; margin-top: 16px; font-size: .85rem; color: #888; }
    .auth-switch a { color: #241f3c; font-weight: 600; cursor: pointer; text-decoration: underline; }

    /* Admin link */
    .admin-link { color: #241f3c; font-weight: 600; }
    .admin-link::before { content: ''; display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #fff93e; margin-right: 6px; }
  `;
  document.head.appendChild(style);

  // ─── Build Auth Modal ───
  const modal = document.createElement('div');
  modal.className = 'swiftaw-auth-modal';
  modal.id = 'swiftaw-auth-modal';
  modal.innerHTML = `
    <div class="swiftaw-auth-card">
      <button class="auth-close" id="auth-close">&times;</button>
      <div id="auth-login-view">
        <h2>Log In</h2>
        <p class="auth-subtitle">Sign in to your Swiftaw account</p>
        <div class="auth-form-group">
          <label>Username</label>
          <input type="text" id="auth-login-user" placeholder="Username" autocomplete="off">
        </div>
        <div class="auth-form-group">
          <label>Password</label>
          <input type="password" id="auth-login-pass" placeholder="Password">
        </div>
        <div class="auth-error" id="auth-login-error"></div>
        <button class="auth-submit" id="auth-login-btn">Log In</button>
        <div class="auth-switch">Don't have an account? <a id="auth-show-signup">Sign up</a></div>
      </div>
      <div id="auth-signup-view" style="display:none;">
        <h2>Create Account</h2>
        <p class="auth-subtitle">Join Swiftaw</p>
        <div class="auth-form-group">
          <label>Username</label>
          <input type="text" id="auth-signup-user" placeholder="Choose a username" autocomplete="off">
        </div>
        <div class="auth-form-group">
          <label>Display Name</label>
          <input type="text" id="auth-signup-name" placeholder="Your display name" autocomplete="off">
        </div>
        <div class="auth-form-group">
          <label>Password</label>
          <input type="password" id="auth-signup-pass" placeholder="Choose a password">
        </div>
        <div class="auth-error" id="auth-signup-error"></div>
        <button class="auth-submit" id="auth-signup-btn">Create Account</button>
        <div class="auth-switch">Already have an account? <a id="auth-show-login">Log in</a></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // ─── Inject Nav Auth Area ───
  function renderNavAuth() {
    const navInner = document.querySelector('.nav-inner');
    if (!navInner) return;

    // Remove existing auth area
    const existing = navInner.querySelector('.nav-auth-area');
    if (existing) existing.remove();

    // Remove existing swiftawplex link
    const existingPlex = navInner.querySelector('.nav-swiftawplex-link');
    if (existingPlex) existingPlex.remove();

    const user = SwiftawAuth.getUser();
    const area = document.createElement('div');
    area.className = 'nav-auth-area';

    if (user) {
      // Swiftawplex link for employees (level 1+)
      if (user.accessLevel >= 1) {
        const plexLink = document.createElement('a');
        plexLink.href = '/swiftawplex';
        plexLink.className = 'nav-swiftawplex-link';
        plexLink.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg> Swiftawplex';
        // Insert before nav-spacer
        const spacer = navInner.querySelector('.nav-spacer');
        if (spacer) {
          navInner.insertBefore(plexLink, spacer);
        }
      }

      // User pill
      const pill = document.createElement('div');
      pill.className = 'nav-user-pill';
      pill.innerHTML = `
        <div class="nav-user-avatar" style="background:${user.color}">${user.displayName.charAt(0).toUpperCase()}</div>
        <span class="nav-user-name">${esc(user.displayName)}</span>
        <span class="nav-user-role">${esc(user.role)}</span>
      `;

      const dropdown = document.createElement('div');
      dropdown.className = 'nav-user-dropdown';
      dropdown.innerHTML = `
        <div class="dropdown-label">Account</div>
        <div style="padding:4px 14px 8px;font-size:.82rem;color:#555;">Level ${user.accessLevel} &middot; ${esc(user.role)}${user.department ? ' &middot; ' + esc(user.department) : ''}</div>
        <div class="dropdown-divider"></div>
        ${user.accessLevel >= 5 ? '<a href="/admin" class="admin-link">Admin Dashboard</a>' : ''}
        <button class="logout-btn" id="nav-logout-btn">Log Out</button>
      `;
      pill.appendChild(dropdown);

      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
      });
      document.addEventListener('click', () => dropdown.classList.remove('open'));

      area.appendChild(pill);
    } else {
      const loginBtn = document.createElement('button');
      loginBtn.className = 'nav-auth-btn login-btn';
      loginBtn.textContent = 'Log In';
      loginBtn.addEventListener('click', () => openAuthModal('login'));

      const signupBtn = document.createElement('button');
      signupBtn.className = 'nav-auth-btn';
      signupBtn.textContent = 'Sign Up';
      signupBtn.addEventListener('click', () => openAuthModal('signup'));

      area.appendChild(loginBtn);
      area.appendChild(signupBtn);
    }

    navInner.appendChild(area);

    // Bind logout
    const logoutBtn = document.getElementById('nav-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        SwiftawAuth.logout();
        renderNavAuth();
        // Dispatch event for pages to react
        window.dispatchEvent(new CustomEvent('swiftaw-auth-change'));
      });
    }
  }

  // ─── Auth Modal Logic ───
  function openAuthModal(view) {
    modal.classList.add('open');
    if (view === 'signup') {
      document.getElementById('auth-login-view').style.display = 'none';
      document.getElementById('auth-signup-view').style.display = 'block';
    } else {
      document.getElementById('auth-login-view').style.display = 'block';
      document.getElementById('auth-signup-view').style.display = 'none';
    }
    clearErrors();
  }

  function closeAuthModal() {
    modal.classList.remove('open');
    clearErrors();
  }

  function clearErrors() {
    document.getElementById('auth-login-error').textContent = '';
    document.getElementById('auth-signup-error').textContent = '';
  }

  // Close modal
  document.getElementById('auth-close').addEventListener('click', closeAuthModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeAuthModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAuthModal(); });

  // Switch views
  document.getElementById('auth-show-signup').addEventListener('click', () => openAuthModal('signup'));
  document.getElementById('auth-show-login').addEventListener('click', () => openAuthModal('login'));

  // Login
  document.getElementById('auth-login-btn').addEventListener('click', doLogin);
  document.getElementById('auth-login-pass').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('auth-login-user').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });

  function doLogin() {
    const user = document.getElementById('auth-login-user').value;
    const pass = document.getElementById('auth-login-pass').value;
    const result = SwiftawAuth.login(user, pass);
    if (result.success) {
      closeAuthModal();
      renderNavAuth();
      window.dispatchEvent(new CustomEvent('swiftaw-auth-change'));
    } else {
      document.getElementById('auth-login-error').textContent = result.error;
    }
  }

  // Signup
  document.getElementById('auth-signup-btn').addEventListener('click', doSignup);
  document.getElementById('auth-signup-pass').addEventListener('keydown', (e) => { if (e.key === 'Enter') doSignup(); });

  function doSignup() {
    const user = document.getElementById('auth-signup-user').value;
    const name = document.getElementById('auth-signup-name').value;
    const pass = document.getElementById('auth-signup-pass').value;
    const result = SwiftawAuth.signup(user, pass, name);
    if (result.success) {
      closeAuthModal();
      renderNavAuth();
      window.dispatchEvent(new CustomEvent('swiftaw-auth-change'));
    } else {
      document.getElementById('auth-signup-error').textContent = result.error;
    }
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // Expose for pages that need to trigger login
  window.SwiftawNav = {
    openAuthModal,
    closeAuthModal,
    renderNavAuth
  };

  // Initial render
  renderNavAuth();
})();
