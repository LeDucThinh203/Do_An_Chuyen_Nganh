import React, { useEffect, useState, useMemo } from "react";
import Session from "../../Session/session";
import * as api from "../../api";

export default function AdminInfo() {
  const user = useMemo(
    () => (Session.isLoggedIn() ? JSON.parse(localStorage.getItem("user")) : null),
    []
  );

  const [accounts, setAccounts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5); // hiện 5 tài khoản/lần
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedRoles, setSelectedRoles] = useState({});

  // Lấy tất cả tài khoản
  useEffect(() => {
    const fetchAccounts = async () => {
      if (!user || user.role !== "admin") return;
      setLoading(true);
      try {
        const data = await api.getAllAccounts();
        setAccounts(data);
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

  // Đổi role tạm
  const handleRoleSelect = (id, newRole) => {
    setSelectedRoles((prev) => ({ ...prev, [id]: newRole }));
  };

  // Cập nhật role
  const handleUpdateRole = async (id) => {
    const newRole = selectedRoles[id];
    const account = accounts.find((a) => a.id === id);

    if (account.role === newRole) {
      alert("⚠️ Quyền không thay đổi, không cần cập nhật.");
      return;
    }

    const confirmChange = window.confirm(
      `Bạn có chắc muốn thay đổi Role của người này từ "${account.role}" thành "${newRole}" không?`
    );

    if (!confirmChange) return;

    try {
      await api.updateAccount(id, { role: newRole });
      setMessage(`✅ Đã cập nhật quyền của tài khoản #${id} thành "${newRole}".`);
      setAccounts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, role: newRole } : a))
      );
    } catch (err) {
      setError("❌ Lỗi khi cập nhật quyền người dùng.");
      console.error(err);
    }
  };

  // Xóa tài khoản
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa tài khoản này không?")) return;
    try {
      await api.deleteAccount(id);
      setMessage(`🗑️ Đã xóa tài khoản #${id}`);
      setAccounts(accounts.filter((a) => a.id !== id));
    } catch (err) {
      setError("❌ Không thể xóa tài khoản này.");
      console.error(err);
    }
  };

  // Load thêm 5 tài khoản
  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 5);
  };

  if (!user)
    return <div className="text-red-500 font-bold text-center mt-10">⚠️ Vui lòng đăng nhập</div>;
  if (user.role !== "admin")
    return <div className="text-red-500 font-bold text-center mt-10">🚫 Bạn không có quyền truy cập trang này</div>;

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-2xl space-y-8">
      {/* Thông tin admin */}
      <div className="border-b pb-6">
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-4">
          👤 Thông tin tài khoản quản trị
        </h2>
        <div className="space-y-2 text-gray-700 text-center">
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Tên đăng nhập:</strong> {user.username}</p>
          <p><strong>Vai trò:</strong> {user.role}</p>
        </div>
      </div>

      {/* Quản lý user */}
      <div>
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-4">
          👑 Quản lý tài khoản người dùng
        </h2>

        {loading && <p className="text-center text-gray-500">Đang tải danh sách...</p>}
        {message && <p className="text-center text-green-600">{message}</p>}
        {error && <p className="text-center text-red-600">{error}</p>}

        {!loading && accounts.length === 0 && (
          <p className="text-gray-500 text-center">Chưa có tài khoản nào.</p>
        )}

        <ul className="divide-y divide-gray-200">
          {accounts.slice(0, visibleCount).map((acc) => (
            <li key={acc.id} className="py-4 flex justify-between items-center">
              <div>
                <p><b>ID:</b> {acc.id}</p>
                <p><b>Username:</b> {acc.username}</p>
                <p>
                  <b>Role hiện tại:</b>{" "}
                  <span
                    className={`px-2 py-1 rounded ${
                      acc.role === "admin"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {acc.role}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedRoles[acc.id]}
                  onChange={(e) => handleRoleSelect(acc.id, e.target.value)}
                  className="border rounded p-1 text-sm"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>

                <button
                  onClick={() => handleUpdateRole(acc.id)}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                >
                  Cập nhật
                </button>

                <button
                  onClick={() => handleDelete(acc.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                >
                  Xóa
                </button>
              </div>
            </li>
          ))}
        </ul>

        {/* Nút load thêm */}
        {visibleCount < accounts.length && (
          <div className="text-center mt-4">
            <button
              onClick={handleLoadMore}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Xem thêm
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
