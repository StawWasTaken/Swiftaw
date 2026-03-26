// ═══════════════════════════════════════════════════════
// SWIFTAW – UNIFIED ACCOUNT SYSTEM
// Shared authentication across all Swiftaw pages
// ═══════════════════════════════════════════════════════

/**
 * Access Levels:
 * 0 - No access (non-employee account)
 * 1 - Basic employee (swiftawplex, confidential docs)
 * 2 - Level 1 + Tithonia training lab
 * 3 - Level 2 + moderation (timeout/ban users)
 * 4 - Level 3 + write documents
 * 5 - CEO (Level 4 + admin dashboard, manage accounts)
 */

const SwiftawAuth = (function () {
  const STORAGE_KEY = 'swiftaw_session';
  const ACCOUNTS_KEY = 'swiftaw_accounts';

  // Built-in accounts (cannot be deleted)
  const BUILTIN_ACCOUNTS = {
    staw: {
      username: 'staw',
      password: 'Elstar1125',
      displayName: 'Staw',
      role: 'CEO',
      accessLevel: 5,
      color: '#fff93e',
      department: 'Executive',
      builtin: true,
      banned: false,
      timedOutUntil: null
    },
    tyrianum: {
      username: 'tyrianum',
      password: '258',
      displayName: 'Tyrianum',
      role: 'CRDO',
      accessLevel: 4,
      color: '#ff9c3c',
      department: 'R&D',
      builtin: true,
      banned: false,
      timedOutUntil: null
    }
  };

  // Role class mapping for styling
  const ROLE_CLASSES = {
    'CEO': 'role-ceo',
    'CRDO': 'role-crdo',
    'CSO': 'role-cso',
    'CCO': 'role-cco',
    'Employee': 'role-employee'
  };

  let currentUser = null;

  // ─── Account Storage ───

  function getAllAccounts() {
    const stored = localStorage.getItem(ACCOUNTS_KEY);
    let accounts = {};
    try {
      accounts = stored ? JSON.parse(stored) : {};
    } catch (e) {
      accounts = {};
    }
    // Merge built-in accounts (they always exist, stored overrides for mutable fields)
    for (const [key, builtin] of Object.entries(BUILTIN_ACCOUNTS)) {
      if (accounts[key]) {
        // Preserve mutable fields from storage but keep password/builtin from source
        accounts[key].password = builtin.password;
        accounts[key].builtin = true;
        // Allow stored accessLevel/role/displayName/color/department changes from admin
      } else {
        accounts[key] = { ...builtin };
      }
    }
    return accounts;
  }

  function saveAccounts(accounts) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  }

  function getAccount(username) {
    const accounts = getAllAccounts();
    return accounts[username.toLowerCase().trim()] || null;
  }

  // ─── Authentication ───

  function login(username, password) {
    const key = username.toLowerCase().trim();
    const account = getAccount(key);
    if (!account) return { success: false, error: 'Account not found.' };
    if (account.password !== password) return { success: false, error: 'Incorrect password.' };
    if (account.banned) return { success: false, error: 'This account has been banned.' };
    if (account.timedOutUntil && Date.now() < account.timedOutUntil) {
      const mins = Math.ceil((account.timedOutUntil - Date.now()) / 60000);
      return { success: false, error: `Account timed out. ${mins} minute(s) remaining.` };
    }
    // Clear expired timeout
    if (account.timedOutUntil && Date.now() >= account.timedOutUntil) {
      account.timedOutUntil = null;
      const accounts = getAllAccounts();
      accounts[key] = account;
      saveAccounts(accounts);
    }

    currentUser = {
      username: key,
      displayName: account.displayName,
      role: account.role,
      roleClass: ROLE_CLASSES[account.role] || 'role-employee',
      accessLevel: account.accessLevel,
      color: account.color,
      department: account.department,
      loginTime: Date.now()
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
    } catch (e) { /* ignore */ }

    return { success: true, user: currentUser };
  }

  function signup(username, password, displayName) {
    const key = username.toLowerCase().trim();
    if (!key || key.length < 2) return { success: false, error: 'Username must be at least 2 characters.' };
    if (!password || password.length < 2) return { success: false, error: 'Password must be at least 2 characters.' };
    if (!displayName || !displayName.trim()) return { success: false, error: 'Display name is required.' };
    if (!/^[a-z0-9_]+$/.test(key)) return { success: false, error: 'Username: letters, numbers, underscores only.' };

    const accounts = getAllAccounts();
    if (accounts[key]) return { success: false, error: 'Username already taken.' };

    accounts[key] = {
      username: key,
      password: password,
      displayName: displayName.trim(),
      role: 'User',
      accessLevel: 0,
      color: '#7bed9f',
      department: '',
      builtin: false,
      banned: false,
      timedOutUntil: null
    };
    saveAccounts(accounts);
    return login(key, password);
  }

  function restoreSession() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        currentUser = JSON.parse(stored);
        // Verify account still exists and isn't banned
        const account = getAccount(currentUser.username);
        if (!account || account.banned) {
          logout();
          return null;
        }
        if (account.timedOutUntil && Date.now() < account.timedOutUntil) {
          logout();
          return null;
        }
        // Refresh user data from stored account (in case admin changed it)
        currentUser.accessLevel = account.accessLevel;
        currentUser.role = account.role;
        currentUser.roleClass = ROLE_CLASSES[account.role] || 'role-employee';
        currentUser.displayName = account.displayName;
        currentUser.color = account.color;
        currentUser.department = account.department;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
        return currentUser;
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  function logout() {
    currentUser = null;
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  }

  function getUser() {
    return currentUser;
  }

  function isLoggedIn() {
    return currentUser !== null;
  }

  function hasAccess(level) {
    if (!currentUser) return level <= 0;
    return currentUser.accessLevel >= level;
  }

  // ─── Admin Functions (Level 5) ───

  function adminGetAllAccounts() {
    if (!currentUser || currentUser.accessLevel < 5) return null;
    const accounts = getAllAccounts();
    // Return without passwords
    const safe = {};
    for (const [key, acc] of Object.entries(accounts)) {
      safe[key] = { ...acc };
      delete safe[key].password;
    }
    return safe;
  }

  function adminUpdateAccount(username, updates) {
    if (!currentUser || currentUser.accessLevel < 5) return { success: false, error: 'No permission.' };
    const key = username.toLowerCase().trim();
    const accounts = getAllAccounts();
    if (!accounts[key]) return { success: false, error: 'Account not found.' };

    // Can't demote yourself
    if (key === currentUser.username && updates.accessLevel !== undefined && updates.accessLevel < 5) {
      return { success: false, error: 'Cannot demote yourself.' };
    }

    const allowed = ['accessLevel', 'role', 'displayName', 'color', 'department', 'banned', 'timedOutUntil'];
    for (const field of allowed) {
      if (updates[field] !== undefined) {
        accounts[key][field] = updates[field];
      }
    }
    saveAccounts(accounts);

    // If we updated ourselves, refresh session
    if (key === currentUser.username) {
      restoreSession();
    }

    return { success: true };
  }

  function adminDeleteAccount(username) {
    if (!currentUser || currentUser.accessLevel < 5) return { success: false, error: 'No permission.' };
    const key = username.toLowerCase().trim();
    const accounts = getAllAccounts();
    if (!accounts[key]) return { success: false, error: 'Account not found.' };
    if (accounts[key].builtin) return { success: false, error: 'Cannot delete built-in accounts.' };
    if (key === currentUser.username) return { success: false, error: 'Cannot delete your own account.' };
    delete accounts[key];
    saveAccounts(accounts);
    return { success: true };
  }

  function adminCreateAccount(username, password, displayName, role, accessLevel, department) {
    if (!currentUser || currentUser.accessLevel < 5) return { success: false, error: 'No permission.' };
    const key = username.toLowerCase().trim();
    if (!key || key.length < 2) return { success: false, error: 'Username must be at least 2 characters.' };
    if (!password || password.length < 2) return { success: false, error: 'Password must be at least 2 characters.' };
    if (!displayName || !displayName.trim()) return { success: false, error: 'Display name is required.' };
    if (!/^[a-z0-9_]+$/.test(key)) return { success: false, error: 'Username: letters, numbers, underscores only.' };

    const accounts = getAllAccounts();
    if (accounts[key]) return { success: false, error: 'Username already taken.' };

    accounts[key] = {
      username: key,
      password: password,
      displayName: displayName.trim(),
      role: role || 'Employee',
      accessLevel: accessLevel || 1,
      color: '#7bed9f',
      department: department || '',
      builtin: false,
      banned: false,
      timedOutUntil: null
    };
    saveAccounts(accounts);
    return { success: true };
  }

  // ─── Moderation Functions (Level 3+) ───

  function moderateTimeout(username, minutes) {
    if (!currentUser || currentUser.accessLevel < 3) return { success: false, error: 'No permission.' };
    const key = username.toLowerCase().trim();
    if (key === currentUser.username) return { success: false, error: 'Cannot timeout yourself.' };
    const accounts = getAllAccounts();
    if (!accounts[key]) return { success: false, error: 'Account not found.' };
    if (accounts[key].accessLevel >= currentUser.accessLevel) return { success: false, error: 'Cannot moderate users of equal or higher access.' };
    accounts[key].timedOutUntil = Date.now() + (minutes * 60000);
    saveAccounts(accounts);
    return { success: true };
  }

  function moderateBan(username) {
    if (!currentUser || currentUser.accessLevel < 3) return { success: false, error: 'No permission.' };
    const key = username.toLowerCase().trim();
    if (key === currentUser.username) return { success: false, error: 'Cannot ban yourself.' };
    const accounts = getAllAccounts();
    if (!accounts[key]) return { success: false, error: 'Account not found.' };
    if (accounts[key].accessLevel >= currentUser.accessLevel) return { success: false, error: 'Cannot moderate users of equal or higher access.' };
    accounts[key].banned = true;
    saveAccounts(accounts);
    return { success: true };
  }

  function moderateUnban(username) {
    if (!currentUser || currentUser.accessLevel < 3) return { success: false, error: 'No permission.' };
    const key = username.toLowerCase().trim();
    const accounts = getAllAccounts();
    if (!accounts[key]) return { success: false, error: 'Account not found.' };
    accounts[key].banned = false;
    accounts[key].timedOutUntil = null;
    saveAccounts(accounts);
    return { success: true };
  }

  // ─── Initialize on load ───
  restoreSession();

  return {
    login,
    signup,
    logout,
    restoreSession,
    getUser,
    isLoggedIn,
    hasAccess,
    getAccount,
    getAllAccounts,
    adminGetAllAccounts,
    adminCreateAccount,
    adminUpdateAccount,
    adminDeleteAccount,
    moderateTimeout,
    moderateBan,
    moderateUnban,
    ROLE_CLASSES
  };
})();
