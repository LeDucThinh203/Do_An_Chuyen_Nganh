import React, { useEffect, useState, useMemo, useCallback } from "react";
import Session from "../../Session/session";
import * as addressAPI from "../../api";
import { AdminPanelSkeleton } from "../common/Skeletons";

export default function AdminAddressManager() {
  const user = useMemo(
    () => (Session.isLoggedIn() ? JSON.parse(localStorage.getItem("user")) : null),
    []
  );

  const [addresses, setAddresses] = useState([]);
  const [visibleCount, setVisibleCount] = useState(2); // mặc định hiển thị 2 địa chỉ
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    province: "",
    district: "",
    ward: "",
    address: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/p/")
      .then((res) => res.json())
      .then(setProvinces)
      .catch(() => setErr("Không thể tải danh sách tỉnh"));
  }, []);

  const fetchAddresses = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    setLoading(true);
    try {
      const data = await addressAPI.getAllAddresses();
      const myAddresses = data.filter((a) => a.account_id === user.id);
      setAddresses(myAddresses);
    } catch {
      setErr("Không tải được danh sách địa chỉ");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleProvinceChange = async (e) => {
    const code = e.target.value;
    setForm((f) => ({ ...f, province: code, district: "", ward: "" }));
    if (!code) return;
    const data = await fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`).then((r) => r.json());
    setDistricts(data.districts || []);
    setWards([]);
  };

  const handleDistrictChange = async (e) => {
    const code = e.target.value;
    setForm((f) => ({ ...f, district: code, ward: "" }));
    if (!code) return;
    const data = await fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`).then((r) => r.json());
    setWards(data.wards || []);
  };

  const handleWardChange = (e) => setForm((f) => ({ ...f, ward: e.target.value }));
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!form.name || !form.phone || !form.address || !form.province || !form.district || !form.ward) {
      setErr("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    const payload = {
      account_id: user.id,
      name: form.name,
      phone: form.phone,
      address_detail: form.address,
      provinceName: provinces.find((p) => Number(p.code) === Number(form.province))?.name,
      districtName: districts.find((d) => Number(d.code) === Number(form.district))?.name,
      wardName: wards.find((w) => Number(w.code) === Number(form.ward))?.name,
    };

    try {
      if (editingId) {
        await addressAPI.updateAddress(editingId, payload);
        setMsg("✅ Cập nhật địa chỉ thành công!");
      } else {
        await addressAPI.createAddress(payload);
        setMsg("✅ Thêm địa chỉ mới thành công!");
      }
      setEditingId(null);
      setForm({ name: "", phone: "", province: "", district: "", ward: "", address: "" });
      fetchAddresses();
    } catch {
      setErr("❌ Lưu địa chỉ thất bại.");
    }
  };

  const handleEdit = (addr) => {
    setForm({
      name: addr.name,
      phone: addr.phone,
      address: addr.address_detail,
      province: provinces.find((p) => p.name === addr.provinceName)?.code || "",
      district: "",
      ward: "",
    });
    setEditingId(addr.id);
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa địa chỉ này không?")) return;
    try {
      await addressAPI.deleteAddress(id);
      setMsg(`🗑️ Đã xóa địa chỉ #${id}`);
      setAddresses(addresses.filter((a) => a.id !== id));
    } catch {
      setErr("❌ Xóa địa chỉ thất bại.");
    }
  };

  const toggleVisible = () => {
    setVisibleCount((prev) => (prev === 2 ? addresses.length : 2));
  };

  if (!user)
    return <div className="text-red-500 font-bold">⚠️ Vui lòng đăng nhập</div>;
  if (user.role !== "admin")
    return <div className="text-red-500 font-bold">🚫 Bạn không có quyền truy cập trang này</div>;

  return (
    <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">
        🏠 Quản lý địa chỉ (Admin)
      </h2>

      {msg && <p className="text-green-600">{msg}</p>}
      {err && <p className="text-red-600">{err}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cột 1: danh sách địa chỉ */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Danh sách địa chỉ</h3>
          {loading ? (
            <AdminPanelSkeleton cardCount={3} />
          ) : addresses.length === 0 ? (
            <p className="text-gray-500">Chưa có địa chỉ nào.</p>
          ) : (
            <>
              <ul className="space-y-4">
                {addresses.slice(0, visibleCount).map((addr) => (
                  <li key={addr.id} className="border p-4 rounded flex flex-col justify-between">
                    <div className="mb-2">
                      <p><b>Họ tên:</b> {addr.name}</p>
                      <p><b>SĐT:</b> {addr.phone}</p>
                      <p><b>Địa chỉ:</b> {addr.address_detail}, {addr.wardName}, {addr.districtName}, {addr.provinceName}</p>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleEdit(addr)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Xóa
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {addresses.length > 2 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={toggleVisible}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    {visibleCount === 2 ? "Xem thêm" : "Thu gọn"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Cột 2: form thêm/sửa địa chỉ */}
        <div>
          <h3 className="text-lg font-semibold mb-2">{editingId ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input name="name" value={form.name} onChange={handleChange} placeholder="Họ tên" className="w-full p-2 border rounded" />
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="Số điện thoại" className="w-full p-2 border rounded" />

            <select value={form.province} onChange={handleProvinceChange} className="w-full p-2 border rounded">
              <option value="">Chọn tỉnh/thành phố</option>
              {provinces.map((p) => (
                <option key={p.code} value={p.code}>{p.name}</option>
              ))}
            </select>

            <select value={form.district} onChange={handleDistrictChange} className="w-full p-2 border rounded" disabled={!districts.length}>
              <option value="">Chọn quận/huyện</option>
              {districts.map((d) => (
                <option key={d.code} value={d.code}>{d.name}</option>
              ))}
            </select>

            <select value={form.ward} onChange={handleWardChange} className="w-full p-2 border rounded" disabled={!wards.length}>
              <option value="">Chọn phường/xã</option>
              {wards.map((w) => (
                <option key={w.code} value={w.code}>{w.name}</option>
              ))}
            </select>

            <input name="address" value={form.address} onChange={handleChange} placeholder="Địa chỉ chi tiết" className="w-full p-2 border rounded" />

            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
              {editingId ? "Cập nhật địa chỉ" : "Lưu địa chỉ"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
