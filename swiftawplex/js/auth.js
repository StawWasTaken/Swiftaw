// ═══════════════════════════════════════════
// SWIFTAWPLEX – AUTHENTICATION
// Integrates with shared SwiftawAuth system
// ═══════════════════════════════════════════

// Role class mapping
const ROLE_CLASSES = {
  'CEO': 'role-ceo',
  'CRDO': 'role-crdo',
  'CSO': 'role-cso',
  'CCO': 'role-cco',
  'Employee': 'role-employee',
  'User': 'role-employee'
};

// Session state
let currentUser = null;

/**
 * Attempt login with credentials via SwiftawAuth
 * @returns {object|null} user object or null
 */
function login(username, password) {
  if (typeof SwiftawAuth === 'undefined') return null;
  const result = SwiftawAuth.login(username, password);
  if (!result.success) return null;

  const user = result.user;
  // Require level 1+ to enter swiftawplex
  if (user.accessLevel < 1) {
    SwiftawAuth.logout();
    return null;
  }

  currentUser = {
    id: user.username,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    roleClass: ROLE_CLASSES[user.role] || 'role-employee',
    accessLevel: user.accessLevel,
    permissions: buildPermissions(user.accessLevel),
    color: user.color,
    department: user.department,
    loginTime: Date.now()
  };

  try {
    sessionStorage.setItem('swiftawplex_user', JSON.stringify(currentUser));
  } catch (e) { /* ignore */ }

  return currentUser;
}

/**
 * Build permissions array from access level
 */
function buildPermissions(level) {
  const perms = [];
  if (level >= 1) perms.push('enter');
  if (level >= 1) perms.push('build');
  if (level >= 3) perms.push('moderate');
  if (level >= 4) perms.push('write_docs');
  if (level >= 5) perms.push('admin', 'manage_users', 'all');
  return perms;
}

/**
 * Restore session from SwiftawAuth
 */
function restoreSession() {
  if (typeof SwiftawAuth !== 'undefined') {
    const user = SwiftawAuth.restoreSession();
    if (user && user.accessLevel >= 1) {
      currentUser = {
        id: user.username,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        roleClass: ROLE_CLASSES[user.role] || 'role-employee',
        accessLevel: user.accessLevel,
        permissions: buildPermissions(user.accessLevel),
        color: user.color,
        department: user.department,
        loginTime: Date.now()
      };
      return currentUser;
    }
  }

  // Fallback to session storage
  try {
    const stored = sessionStorage.getItem('swiftawplex_user');
    if (stored) {
      currentUser = JSON.parse(stored);
      return currentUser;
    }
  } catch (e) { /* ignore */ }
  return null;
}

/**
 * Logout current user
 */
function logout() {
  currentUser = null;
  if (typeof SwiftawAuth !== 'undefined') SwiftawAuth.logout();
  try { sessionStorage.removeItem('swiftawplex_user'); } catch (e) { /* ignore */ }
}

/**
 * Get current user
 */
function getUser() {
  return currentUser;
}

/**
 * Check if user has a permission
 */
function hasPermission(perm) {
  if (!currentUser) return false;
  if (currentUser.permissions && currentUser.permissions.includes('all')) return true;
  if (currentUser.permissions && currentUser.permissions.includes(perm)) return true;
  return false;
}

/**
 * Check if user has minimum access level
 */
function hasAccess(level) {
  if (!currentUser) return false;
  return (currentUser.accessLevel || 0) >= level;
}

export { login, logout, getUser, restoreSession, hasPermission, hasAccess, buildPermissions };
