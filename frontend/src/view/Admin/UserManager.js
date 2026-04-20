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

  // Tìm kiếm theo email
  useEffect(() => {
    const filtered = accounts.filter((acc) =>
      acc.email?.toLowerCase().includes(searchEmail.toLowerCase())
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
    } catch (err) {
      setError("❌ Lỗi khi cập nhật quyền người dùng.");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa tài khoản này không?")) return;
    try {
      await api.deleteAccount(id);
      setMessage(`🗑️ Đã xóa tài khoản #${id}`);
      setAccounts(accounts.filter((a) => a.id !== id));
      setFilteredAccounts(filteredAccounts.filter((a) => a.id !== id));
    } catch (err) {
      setError("❌ Không thể xóa tài khoản này.");
      console.error(err);
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
    const state = passwordStates[id];
    if (!state.newPassword || !state.confirmPassword) {
      alert("⚠️ Vui lòng nhập đầy đủ mật khẩu mới và xác nhận mật khẩu.");
      return;
    }
    if (state.newPassword !== state.confirmPassword) {
      alert("⚠️ Mật khẩu và xác nhận mật khẩu không khớp.");
      return;
    }
    if (!window.confirm(`Bạn có chắc muốn đổi mật khẩu của #${id}?`)) return;

    try {
      await api.updateAccount(id, { password: state.newPassword });
      setMessage(`✅ Đã đổi mật khẩu của tài khoản #${id} thành công.`);
      setPasswordStates((prev) => ({ ...prev, [id]: { show: false, newPassword: "", confirmPassword: "" } }));
    } catch (err) {
      setError("❌ Lỗi khi đổi mật khẩu.");
      console.error(err);
    }
  };

  const toggleVisible = () => {
    setVisibleCount((prev) => (prev === 6 ? filteredAccounts.length : 6));
  };

  if (!user)
    return <div className="text-red-500 font-bold text-center mt-10">⚠️ Vui lòng đăng nhập</div>;
  if (user.role !== "admin")
    return <div className="text-red-500 font-bold text-center mt-10">🚫 Bạn không có quyền truy cập</div>;

  return (
    <div className="max-w-7xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-xl space-y-6">
      <h2 className="text-2xl font-bold text-center text-blue-600 mb-4">
        👑 Quản lý tài khoản người dùng
      </h2>

      {/* Tìm kiếm theo email */}
      <div className="mb-4 text-center">
        <input
          type="text"
          placeholder="Tìm kiếm theo email..."
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          className="border p-2 rounded w-full sm:w-1/2"
        />
      </div>

      {loading && <AdminPanelSkeleton cardCount={6} />}
      {message && <p className="text-center text-green-600">{message}</p>}
      {error && <p className="text-center text-red-600">{error}</p>}
      {!loading && filteredAccounts.length === 0 && (
        <p className="text-gray-500 text-center">Không tìm thấy tài khoản.</p>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.slice(0, visibleCount).map((acc) => (
          <div key={acc.id} className="border p-4 rounded flex flex-col justify-between">
            <div className="mb-4">
              <p><b>ID:</b> {acc.id}</p>
              <p><b>Username:</b> {acc.username}</p>
              <p><b>Email:</b> {acc.email || "Chưa có email"}</p>
              <p>
                <b>Role hiện tại:</b>{" "}
                <span className={`px-2 py-1 rounded ${acc.role === "admin" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"}`}>
                  {acc.role}
                </span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <select
                value={selectedRoles[acc.id]}
                onChange={(e) => handleRoleSelect(acc.id, e.target.value)}
                className="border rounded p-2 text-sm w-full sm:w-auto"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>

              <button
                onClick={() => handleUpdateRole(acc.id)}
                className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 text-sm w-full sm:w-auto"
              >
                Cập nhật
              </button>

              <button
                onClick={() => handleDelete(acc.id)}
                className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 text-sm w-full sm:w-auto"
              >
                Xóa
              </button>
            </div>

            <button
              onClick={() => togglePasswordForm(acc.id)}
              className="bg-purple-500 text-white px-3 py-2 rounded hover:bg-purple-600 text-sm mb-2"
            >
              Đổi mật khẩu
            </button>

            {passwordStates[acc.id]?.show && (
              <div className="flex flex-col gap-2">
                <input
                  type="password"
                  placeholder="Mật khẩu mới"
                  value={passwordStates[acc.id].newPassword}
                  onChange={(e) => handlePasswordInputChange(acc.id, "newPassword", e.target.value)}
                  className="border rounded p-2 text-sm w-full"
                />
                <input
                  type="password"
                  placeholder="Xác nhận mật khẩu"
                  value={passwordStates[acc.id].confirmPassword}
                  onChange={(e) => handlePasswordInputChange(acc.id, "confirmPassword", e.target.value)}
                  className="border rounded p-2 text-sm w-full"
                />
                <button
                  onClick={() => handleUpdatePassword(acc.id)}
                  className="bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 text-sm w-full"
                >
                  Cập nhật mật khẩu
                </button>
              </div>
            )}
          </div>
          ))}
        </div>
      )}

      {filteredAccounts.length > 6 && (
        <div className="text-center mt-4">
          <button
            onClick={toggleVisible}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto"
          >
            {visibleCount === 6 ? "Xem thêm" : "Thu gọn"}
          </button>
        </div>
      )}
    </div>
  );
}
