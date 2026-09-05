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
  const [visibleCount, setVisibleCount] = useState(4);
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
  };

  const handleDistrictChange = async (e) => {
    const code = e.target.value;
    setForm((f) => ({ ...f, district: code, ward: "" }));
    if (!code) return;
    const data = await fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`).then((r) => r.json());
    setWards(data.wards || []);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");

    if (!form.name || !form.phone || !form.province || !form.district || !form.ward || !form.address) {
      setErr("⚠️ Vui lòng điền đầy đủ tất cả thông tin địa chỉ!");
      return;
    }

    const provObj = provinces.find((p) => String(p.code) === String(form.province));
    const distObj = districts.find((d) => String(d.code) === String(form.district));
    const wardObj = wards.find((w) => String(w.code) === String(form.ward));

    const payload = {
      name: form.name,
      phone: form.phone,
      address_detail: form.address,
      provinceCode: form.province,
      provinceName: provObj ? provObj.name : "",
      districtCode: form.district,
      districtName: distObj ? distObj.name : "",
      wardCode: form.ward,
      wardName: wardObj ? wardObj.name : "",
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
      setTimeout(() => setMsg(""), 4000);
    } catch {
      setErr("❌ Lưu địa chỉ thất bại!");
      setTimeout(() => setErr(""), 4000);
    }
  };

  const handleEdit = async (addr) => {
    setForm({
      name: addr.name,
      phone: addr.phone,
      province: addr.provinceCode,
      district: addr.districtCode,
      ward: addr.wardCode,
      address: addr.address_detail,
    });

    if (addr.provinceCode) {
      const pData = await fetch(`https://provinces.open-api.vn/api/p/${addr.provinceCode}?depth=2`).then((r) => r.json());
      setDistricts(pData.districts || []);
    }
    if (addr.districtCode) {
      const dData = await fetch(`https://provinces.open-api.vn/api/d/${addr.districtCode}?depth=2`).then((r) => r.json());
      setWards(dData.wards || []);
    }

    setEditingId(addr.id);
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa địa chỉ này không?")) return;
    try {
      await addressAPI.deleteAddress(id);
      setMsg(`🗑️ Đã xóa địa chỉ thành công`);
      setAddresses(addresses.filter((a) => a.id !== id));
      setTimeout(() => setMsg(""), 4000);
    } catch {
      setErr("❌ Xóa địa chỉ thất bại.");
      setTimeout(() => setErr(""), 4000);
    }
  };

  const toggleVisible = () => {
    setVisibleCount((prev) => (prev === 4 ? addresses.length : 4));
  };

  if (!user)
    return <div className="text-rose-500 font-bold p-6 bg-white rounded-2xl">⚠️ Vui lòng đăng nhập</div>;
  if (user.role !== "admin")
    return <div className="text-rose-500 font-bold p-6 bg-white rounded-2xl">🚫 Bạn không có quyền truy cập</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Notifications */}
      {msg && <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">{msg}</div>}
      {err && <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">{err}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Address List */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Sổ Địa Chỉ Quản Trị</h3>
              <p className="text-xs text-slate-500">Các địa chỉ kho gửi và nhận hàng của tài khoản quản trị</p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
              {addresses.length} Địa chỉ
            </span>
          </div>

          {loading ? (
            <AdminPanelSkeleton cardCount={3} />
          ) : addresses.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">Chưa có địa chỉ nào được lưu.</div>
          ) : (
            <div className="space-y-3.5">
              {addresses.slice(0, visibleCount).map((addr) => (
                <div
                  key={addr.id}
                  className="p-4 rounded-2xl border border-slate-200/80 hover:border-blue-300 shadow-sm transition-all flex flex-col sm:flex-row items-start justify-between gap-3 bg-slate-50/40"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{addr.name}</span>
                      <span className="text-xs text-slate-500 font-mono">({addr.phone})</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {addr.address_detail}, {addr.wardName}, {addr.districtName}, {addr.provinceName}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    <button
                      onClick={() => handleEdit(addr)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 text-xs font-bold transition"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 text-xs transition"
                      title="Xóa"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}

              {addresses.length > 4 && (
                <div className="pt-2 text-center">
                  <button
                    onClick={toggleVisible}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                  >
                    {visibleCount === 4 ? `Xem thêm ${addresses.length - 4} địa chỉ ▼` : "Thu gọn ▲"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Address Form */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              {editingId ? "✏️ Chỉnh Sửa Địa Chỉ" : "➕ Thêm Địa Chỉ Mới"}
            </h3>
            {editingId && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setForm({ name: "", phone: "", province: "", district: "", ward: "", address: "" });
                }}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Hủy bỏ
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Họ tên người nhận</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="VD: Nguyễn Văn A"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Số điện thoại</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="VD: 0912345678"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Tỉnh / Thành</label>
                <select
                  value={form.province}
                  onChange={handleProvinceChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Chọn</option>
                  {provinces.map((p) => (
                    <option key={p.code} value={p.code}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Quận / Huyện</label>
                <select
                  value={form.district}
                  onChange={handleDistrictChange}
                  disabled={!districts.length}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                >
                  <option value="">Chọn</option>
                  {districts.map((d) => (
                    <option key={d.code} value={d.code}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Phường / Xã</label>
                <select
                  name="ward"
                  value={form.ward}
                  onChange={handleChange}
                  disabled={!wards.length}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                >
                  <option value="">Chọn</option>
                  {wards.map((w) => (
                    <option key={w.code} value={w.code}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Địa chỉ chi tiết</label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Số nhà, tên đường, tòa nhà..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition mt-2"
            >
              {editingId ? "Cập Nhật Địa Chỉ" : "Thêm Địa Chỉ Mới"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
