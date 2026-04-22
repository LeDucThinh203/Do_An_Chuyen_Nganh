/**
 * Session helper cho frontend (React/JS)
 * Sử dụng localStorage để lưu thông tin người dùng và JWT token
 */
const Session = {
  normalizeRole(role) {
    return String(role || "").trim().toLowerCase();
  },

  setUser(id, username, role = "user", email = "", token = "") {
    const user = { id, username, role: Session.normalizeRole(role) || "user", email };
    localStorage.setItem("user", JSON.stringify(user));
    if (token) {
      localStorage.setItem("token", token);
    }
  },

  getToken() {
    return localStorage.getItem("token");
  },

  setToken(token) {
    localStorage.setItem("token", token);
  },

  isLoggedIn() {
    return localStorage.getItem("user") !== null && localStorage.getItem("token") !== null;
  },

  isAdmin() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return Session.normalizeRole(user?.role) === "admin";
  },

  getRole() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return Session.normalizeRole(user?.role) || "guest";
  },

  hasRole(role) {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return Session.normalizeRole(user?.role) === Session.normalizeRole(role);
  },

  getAccountId() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.id || null;
  },

  getEmail() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.email || "";
  },

  getUser() {
    return JSON.parse(localStorage.getItem("user") || "{}");
  },

  logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }
};

export default Session;
