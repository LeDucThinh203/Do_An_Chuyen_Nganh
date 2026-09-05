import React, { useEffect, useState, useMemo } from "react";
import Session from "../../Session/session";
import * as api from "../../api";
import { AdminPanelSkeleton } from "../common/Skeletons";

export default function UserManager() {
  const user = useMemo(() => (Session.isLoggedIn() ? Session.getUser() : null), []);

  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedRoles, setSelectedRoles] = useState({});
  const [passwordStates, setPasswordStates] = useState({});
  const [searchEmail, setSearchEmail] = useState("");

  useEffect(() => {
    const fetchAccounts = async () => {
      if (!user || user.role !== "admin") return;
      setLoading(true);
      try {
        const data = await api.getAllAccounts();
        setAccounts(data);
        setFilteredAccounts(data);
        const rolesMap = {};
        data.forEach((a) => (rolesMap[a.id] = a.role));
        setSelectedRoles(rolesMap);
      } catch (err) {
        setError("Không thể tải danh sách tài khoản.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, [user]);

  // Tìm kiếm theo email hoặc tên
  useEffect(() => {
    const query = searchEmail.toLowerCase().trim();
    const filtered = accounts.filter(
      (acc) =>
        acc.email?.toLowerCase().includes(query) ||
        acc.username?.toLowerCase().includes(query)
    );
    setFilteredAccounts(filtered);
    setVisibleCount(6);
  }, [searchEmail, accounts]);

  const handleRoleSelect = (id, newRole) => {
    setSelectedRoles((prev) => ({ ...prev, [id]: newRole }));
  };

  const handleUpdateRole = async (id) => {
    const newRole = selectedRoles[id];
    const account = accounts.find((a) => a.id === id);

    if (account.role === newRole) {
      alert("⚠️ Quyền không thay đổi, không cần cập nhật.");
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn đổi role của #${id} từ "${account.role}" sang "${newRole}"?`))
      return;

    try {
      await api.updateAccount(id, { role: newRole });
      setMessage(`✅ Đã cập nhật quyền của tài khoản #${id} thành "${newRole}".`);
      setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, role: newRole } : a)));
      setFilteredAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, role: newRole } : a)));
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setError("❌ Lỗi khi cập nhật quyền người dùng.");
      console.error(err);
      setTimeout(() => setError(""), 4000);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa tài khoản này không?")) return;
    try {
      await api.deleteAccount(id);
      setMessage(`🗑️ Đã xóa tài khoản #${id}`);
      setAccounts(accounts.filter((a) => a.id !== id));
      setFilteredAccounts(filteredAccounts.filter((a) => a.id !== id));
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setError("❌ Không thể xóa tài khoản này.");
      console.error(err);
      setTimeout(() => setError(""), 4000);
    }
  };

  const togglePasswordForm = (id) => {
    setPasswordStates((prev) => ({
      ...prev,
      [id]: { show: !prev[id]?.show, newPassword: "", confirmPassword: "" },
    }));
  };

  const handlePasswordInputChange = (id, field, value) => {
    setPasswordStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleUpdatePassword = async (id) => {
    const { newPassword, confirmPassword } = passwordStates[id] || {};
    if (!newPassword || newPassword.length < 6) {
      alert("⚠️ Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("⚠️ Mật khẩu xác nhận không khớp!");
      return;
    }

    try {
      await api.updateAccount(id, { password: newPassword });
      setMessage(`🔑 Đã đổi mật khẩu thành công cho tài khoản #${id}`);
      setPasswordStates((prev) => ({ ...prev, [id]: { show: false, newPassword: "", confirmPassword: "" } }));
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setError("❌ Đổi mật khẩu thất bại.");
      console.error(err);
      setTimeout(() => setError(""), 4000);
    }
  };

  const toggleVisible = () => {
    setVisibleCount((prev) => (prev === 6 ? filteredAccounts.length : 6));
  };

  if (!user)
    return <div className="text-rose-500 font-bold text-center mt-10">⚠️ Vui lòng đăng nhập</div>;
  if (user.role !== "admin")
    return <div className="text-rose-500 font-bold text-center mt-10">🚫 Bạn không có quyền truy cập</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <input
            type="text"
            placeholder="Tìm theo email hoặc tên người dùng..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
            Tổng cộng: {accounts.length} tài khoản
          </span>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && <AdminPanelSkeleton cardCount={6} />}

      {/* Empty State */}
      {!loading && filteredAccounts.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8">
          <div className="text-4xl mb-2">👤</div>
          <p className="text-slate-600 font-bold">Không tìm thấy tài khoản người dùng phù hợp.</p>
        </div>
      )}

      {/* Accounts Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAccounts.slice(0, visibleCount).map((acc) => {
            const isAdmin = acc.role === "admin";
            return (
              <div
                key={acc.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-blue-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Avatar, Username, Role */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm uppercase shadow-sm ${
                          isAdmin
                            ? "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-500/25"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {acc.username ? acc.username.charAt(0) : "U"}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{acc.username}</h4>
                        <span className="text-[11px] text-slate-400 font-mono">ID: #{acc.id}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide border ${
                        isAdmin
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {acc.role}
                    </span>
                  </div>

                  {/* Email row */}
                  <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 mb-4 text-xs">
                    <span className="text-slate-400 font-medium block text-[10px] uppercase">Email đăng nhập</span>
                    <span className="font-semibold text-slate-700 truncate block mt-0.5">
                      {acc.email || "Chưa có địa chỉ email"}
                    </span>
                  </div>
                </div>

                {/* Role and Action Controls */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedRoles[acc.id]}
                      onChange={(e) => handleRoleSelect(acc.id, e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="user">Vai trò: User</option>
                      <option value="admin">Vai trò: Admin</option>
                    </select>

                    <button
                      onClick={() => handleUpdateRole(acc.id)}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
                    >
                      Lưu
                    </button>

                    <button
                      onClick={() => handleDelete(acc.id)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                      title="Xóa tài khoản"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Toggle Password Form */}
                  <button
                    onClick={() => togglePasswordForm(acc.id)}
                    className="w-full text-center py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition rounded-lg hover:bg-indigo-50/50"
                  >
                    {passwordStates[acc.id]?.show ? "✕ Hủy đổi mật khẩu" : "🔑 Đổi mật khẩu tài khoản"}
                  </button>

                  {passwordStates[acc.id]?.show && (
                    <div className="space-y-2 pt-2 border-t border-indigo-100/60 bg-indigo-50/30 p-3 rounded-xl animate-in fade-in">
                      <input
                        type="password"
                        placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                        value={passwordStates[acc.id].newPassword}
                        onChange={(e) => handlePasswordInputChange(acc.id, "newPassword", e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                      <input
                        type="password"
                        placeholder="Xác nhận mật khẩu mới"
                        value={passwordStates[acc.id].confirmPassword}
                        onChange={(e) => handlePasswordInputChange(acc.id, "confirmPassword", e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                      <button
                        onClick={() => handleUpdatePassword(acc.id)}
                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs py-2 rounded-lg shadow-sm transition"
                      >
                        Xác nhận đổi mật khẩu
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load more button */}
      {filteredAccounts.length > 6 && (
        <div className="text-center pt-4">
          <button
            onClick={toggleVisible}
            className="px-6 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200 shadow-sm transition"
          >
            {visibleCount === 6 ? `Xem thêm ${filteredAccounts.length - 6} tài khoản` : "Thu gọn ▲"}
          </button>
        </div>
      )}
    </div>
  );
}
