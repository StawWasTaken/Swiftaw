// ═══════════════════════════════════════════
// SWIFTAWPLEX – AUTHENTICATION
// ═══════════════════════════════════════════

// Employee accounts with roles and permissions
const EMPLOYEES = {
  staw: {
    password: 'Elstar1125',
    displayName: 'Staw',
    role: 'CEO',
    roleClass: 'role-ceo',
    permissions: ['admin', 'build', 'moderate', 'manage_users', 'all'],
    color: '#fff93e',
    department: 'Executive'
  },
  tyrianum: {
    password: 'TyrianumCRDO',
    displayName: 'Tyrianum',
    role: 'CRDO',
    roleClass: 'role-crdo',
    permissions: ['admin', 'build', 'moderate', 'research'],
    color: '#ff9c3c',
    department: 'R&D'
  }
};

// Session state
let currentUser = null;

/**
 * Attempt login with credentials
 * @returns {object|null} user object or null
 */
function login(username, password) {
  const key = username.toLowerCase().trim();
  const employee = EMPLOYEES[key];

  if (!employee) return null;
  if (employee.password !== password) return null;

  currentUser = {
    id: key,
    username: key,
    displayName: employee.displayName,
    role: employee.role,
    roleClass: employee.roleClass,
    permissions: employee.permissions,
    color: employee.color,
    department: employee.department,
    loginTime: Date.now()
  };

  // Persist session
  try {
    sessionStorage.setItem('swiftawplex_user', JSON.stringify(currentUser));
  } catch (e) { /* ignore */ }

  return currentUser;
}

/**
 * Restore session from storage
 */
function restoreSession() {
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
  return currentUser.permissions.includes('all') || currentUser.permissions.includes(perm);
}

export { login, logout, getUser, restoreSession, hasPermission, EMPLOYEES };
