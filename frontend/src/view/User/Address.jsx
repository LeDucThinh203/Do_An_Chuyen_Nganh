import React, { useEffect, useState, useMemo } from "react";
import Session from "../../Session/session";
import * as addressAPI from "../../api";

export default function Address() {
  // Memo user để không bị thay đổi liên tục
  const user = useMemo(() => Session.isLoggedIn() ? JSON.parse(localStorage.getItem("user")) : null, []);

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchAddresses = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await addressAPI.getAllAddresses();
        const userAddresses = data.filter(addr => addr.account_id === user.id);
        setAddresses(userAddresses);
      } catch (err) {
        console.error("Lỗi khi lấy địa chỉ:", err);
        setError("Không tải được danh sách địa chỉ.");
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [user]); // sẽ chỉ chạy 1 lần vì user memoized

  if (!user) {
    return <div className="text-red-500 font-bold">Vui lòng đăng nhập</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded">
      <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">Danh sách địa chỉ</h2>

      {loading && <p>Đang tải...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && addresses.length === 0 && (
        <p className="text-gray-500">Bạn chưa có địa chỉ nào.</p>
      )}

      <ul className="space-y-4">
        {addresses.map((addr) => (
          <li key={addr.id} className="border p-4 rounded shadow-sm">
            <p><strong>Họ tên:</strong> {addr.name}</p>
            <p><strong>Số điện thoại:</strong> {addr.phone}</p>
            <p><strong>Địa chỉ:</strong> {`${addr.address_detail}, ${addr.wardName}, ${addr.districtName}, ${addr.provinceName}`}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
