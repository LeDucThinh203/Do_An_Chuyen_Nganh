/**
 * Session helper cho frontend (React/JS)
 * Sử dụng localStorage để lưu thông tin người dùng
 */
const Session = {
  setUser(id, username, role = "user") {
    const user = { id, username, role };
    localStorage.setItem("user", JSON.stringify(user));
  },

  isLoggedIn() {
    return localStorage.getItem("user") !== null;
  },

  isAdmin() {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.role === "admin";
  },

  getRole() {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.role || "guest";
  },

  hasRole(role) {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.role === role;
  },

  getAccountId() {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.id || null;
  },

  logout() {
    localStorage.removeItem("user");
  }
};

export default Session;
