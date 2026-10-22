const AUTH_CHANGED_EVENT = 'coolshop:auth-changed';
let currentUser = null;
let authVersion = 0;

// Remove credentials and cached identity from older localStorage-based builds.
if (typeof window !== 'undefined') {
  try {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('user');
  } catch {
    // Authentication does not depend on browser storage being available.
  }
}

const notifyAuthChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
};

const Session = {
  AUTH_CHANGED_EVENT,

  normalizeRole(role) {
    return String(role || '').trim().toLowerCase();
  },

  setUser(user) {
    if (!user || !user.id) return Session.clearUser();
    currentUser = {
      id: user.id,
      username: user.username || '',
      role: Session.normalizeRole(user.role) || 'user',
      email: user.email || '',
    };
    authVersion += 1;
    notifyAuthChanged();
    return currentUser;
  },

  isLoggedIn() {
    return Boolean(currentUser?.id);
  },

  isAdmin() {
    return Session.normalizeRole(currentUser?.role) === 'admin';
  },

  getRole() {
    return Session.normalizeRole(currentUser?.role) || 'guest';
  },

  hasRole(role) {
    return Session.normalizeRole(currentUser?.role) === Session.normalizeRole(role);
  },

  getAccountId() {
    return currentUser?.id || null;
  },

  getEmail() {
    return currentUser?.email || '';
  },

  getUser() {
    return currentUser || {};
  },

  getUserOrNull() {
    return currentUser;
  },

  getVersion() {
    return authVersion;
  },

  clearUser() {
    currentUser = null;
    authVersion += 1;
    notifyAuthChanged();
  },

  logout() {
    Session.clearUser();
  },
};

export default Session;
