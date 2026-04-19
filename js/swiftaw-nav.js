// ═══════════════════════════════════════════════════════
// SWIFTAW – SHARED NAV AUTH UI
// Injects login/account button into the nav bar
// ═══════════════════════════════════════════════════════

(function () {
  if (typeof SwiftawAuth === 'undefined') return;

  // ─── Styles ───
  const style = document.createElement('style');
  style.textContent = `
    .nav-auth-area { display: flex; align-items: center; gap: 8px; margin-left: 8px; }
    .nav-auth-btn {
      padding: 8px 18px; border-radius: 100px; font-size: .84rem; font-weight: 600;
      cursor: pointer; transition: all .2s; border: 1px solid rgba(255,255,255,.16);
      background: transparent; color: #f4f4f5; font-family: inherit;
    }
    .nav-auth-btn:hover { border-color: #fff93e; color: #fff93e; }
    .nav-auth-btn.login-btn {
      background: linear-gradient(135deg, #fff93e 0%, #ff9c3c 100%);
      color: #0a0d10; border-color: transparent;
    }
    .nav-auth-btn.login-btn:hover {
      transform: translateY(-1px); color: #0a0d10;
      box-shadow: 0 8px 24px rgba(255,156,60,.3);
    }
    .nav-user-pill {
      display: flex; align-items: center; gap: 8px; padding: 5px 14px 5px 6px;
      border-radius: 100px; background: rgba(255,255,255,.04); cursor: pointer;
      position: relative; transition: background .15s, border-color .15s;
      border: 1px solid rgba(255,255,255,.1);
    }
    .nav-user-pill:hover { background: rgba(255,255,255,.08); border-color: rgba(255,249,62,.3); }
    .nav-user-avatar {
      width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 11px; color: #0a0d10;
    }
    .nav-user-name { font-size: .84rem; font-weight: 600; color: #f4f4f5; }
    .nav-user-role { font-size: .68rem; font-weight: 500; color: #a1a7b3; margin-left: 2px; }
    .nav-user-dropdown {
      position: absolute; top: calc(100% + 8px); right: 0; min-width: 220px;
      background: #11151c; border: 1px solid rgba(255,255,255,.1); border-radius: 14px;
      box-shadow: 0 24px 60px rgba(0,0,0,.5); padding: 6px; z-index: 1000;
      display: none;
    }
    .nav-user-dropdown.open { display: block; }
    .nav-user-dropdown a, .nav-user-dropdown button {
      display: block; width: 100%; text-align: left; padding: 10px 14px; border-radius: 8px;
      font-size: .86rem; font-weight: 500; cursor: pointer; transition: background .12s;
      border: none; background: none; font-family: inherit; color: #f4f4f5; text-decoration: none;
    }
    .nav-user-dropdown a:hover, .nav-user-dropdown button:hover { background: rgba(255,249,62,.08); }
    .nav-user-dropdown .dropdown-divider { height: 1px; background: rgba(255,255,255,.08); margin: 4px 8px; }
    .nav-user-dropdown .dropdown-label { padding: 8px 14px 4px; font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #a1a7b3; }
    .nav-user-dropdown .logout-btn { color: #ff8383; }
    .nav-user-dropdown .logout-btn:hover { background: rgba(255,131,131,.1); }

    /* Auth Modal */
    .swiftaw-auth-modal {
      display: none; position: fixed; inset: 0; z-index: 10000;
      align-items: center; justify-content: center;
      background: rgba(6,8,12,.72); backdrop-filter: blur(8px);
    }
    .swiftaw-auth-modal.open { display: flex; }
    .swiftaw-auth-card {
      background: #11151c; border: 1px solid rgba(255,255,255,.1);
      border-radius: 22px; padding: 40px 36px;
      width: 420px; max-width: 92vw; box-shadow: 0 32px 100px rgba(0,0,0,.7);
      position: relative; color: #f4f4f5;
    }
    .swiftaw-auth-card::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, transparent, #fff93e, #ff9c3c, transparent);
      opacity: .5;
    }
    .swiftaw-auth-card h2 { font-size: 1.5rem; font-weight: 700; margin-bottom: 6px; color: #f4f4f5; }
    .swiftaw-auth-card .auth-subtitle { font-size: .92rem; color: #a1a7b3; margin-bottom: 26px; }
    .swiftaw-auth-card .auth-close {
      position: absolute; top: 14px; right: 16px; background: none; border: none;
      font-size: 1.6rem; cursor: pointer; color: #a1a7b3; padding: 4px; line-height: 1;
    }
    .swiftaw-auth-card .auth-close:hover { color: #fff93e; }
    .auth-form-group { margin-bottom: 16px; }
    .auth-form-group label {
      display: block; font-size: .74rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .1em; color: #a1a7b3; margin-bottom: 8px;
    }
    .auth-form-group input {
      width: 100%; padding: 12px 14px;
      border: 1px solid rgba(255,255,255,.12); border-radius: 10px;
      font-size: .94rem; outline: none; transition: border-color .2s, background .2s;
      font-family: inherit; color: #f4f4f5;
      background: rgba(255,255,255,.03);
    }
    .auth-form-group input:focus { border-color: #fff93e; background: rgba(255,255,255,.06); }
    .auth-form-group input::placeholder { color: #6b7280; }
    .auth-error { color: #ff8383; font-size: .82rem; margin-bottom: 12px; min-height: 20px; }
    .auth-submit {
      width: 100%; padding: 13px; border: none; border-radius: 10px;
      background: linear-gradient(135deg, #fff93e 0%, #ff9c3c 100%);
      color: #0a0d10; font-size: .95rem; font-weight: 700;
      cursor: pointer; transition: transform .15s, box-shadow .15s; font-family: inherit;
    }
    .auth-submit:hover { transform: translateY(-1px); box-shadow: 0 12px 30px rgba(255,156,60,.3); }
    .auth-switch { text-align: center; margin-top: 18px; font-size: .86rem; color: #a1a7b3; }
    .auth-switch a { color: #fff93e; font-weight: 600; cursor: pointer; }
    .auth-switch a:hover { text-decoration: underline; }

    /* Admin link */
    .admin-link { color: #fff93e !important; font-weight: 600; }
    .admin-link::before { content: ''; display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #fff93e; margin-right: 8px; box-shadow: 0 0 8px #fff93e; }
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

    const user = SwiftawAuth.getUser();
    const area = document.createElement('div');
    area.className = 'nav-auth-area';

    if (user) {
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
        <div style="padding:4px 14px 8px;font-size:.82rem;color:#a1a7b3;">Level ${user.accessLevel} &middot; ${esc(user.role)}${user.department ? ' &middot; ' + esc(user.department) : ''}</div>
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
