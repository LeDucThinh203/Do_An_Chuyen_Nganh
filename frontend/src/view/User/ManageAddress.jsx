// src/view/User/ManageAddress.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import Session from "../../Session/session";
import * as addressAPI from "../../api";

export default function AddressManager() {
  const user = useMemo(() => (Session.isLoggedIn() ? Session.getUser() : null), []);

  const [addresses, setAddresses] = useState([]);
  const [visibleCount, setVisibleCount] = useState(3);
  const [loadingList, setLoadingList] = useState(false);
  const [errorList, setErrorList] = useState("");

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
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorForm, setErrorForm] = useState("");
  const [successForm, setSuccessForm] = useState("");
  const [editingAddressId, setEditingAddressId] = useState(null);

  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      setErrorForm("");
      try {
        const res = await fetch("https://provinces.open-api.vn/api/p/");
        if (!res.ok) throw new Error("Lỗi khi tải tỉnh/thành phố");
        const data = await res.json();
        setProvinces(data);
      } catch (err) {
        console.error("Lỗi fetch provinces:", err);
        setErrorForm("Không tải được danh sách tỉnh/thành phố.");
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  const fetchAddresses = useCallback(async () => {
    if (!user) return;
    setLoadingList(true);
    setErrorList("");
    try {
      const data = await addressAPI.getAllAddresses();
      const userAddresses = data.filter((addr) => addr.account_id === user.id);
      setAddresses(userAddresses);
    } catch (err) {
      console.error("Lỗi khi lấy địa chỉ:", err);
      setErrorList("Không tải được danh sách địa chỉ.");
    } finally {
      setLoadingList(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleProvinceChange = async (e) => {
    const provinceCode = e.target.value;
    setForm((prev) => ({ ...prev, province: provinceCode, district: "", ward: "" }));
    setDistricts([]);
    setWards([]);
    if (!provinceCode) return;

    setLoadingDistricts(true);
    setErrorForm("");
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
      if (!res.ok) throw new Error("Lỗi khi tải quận/huyện");
      const data = await res.json();
      setDistricts(data.districts || []);
    } catch (err) {
      console.error("Lỗi fetch districts:", err);
      setErrorForm("Không tải được quận/huyện.");
    } finally {
      setLoadingDistricts(false);
    }
  };

  const handleDistrictChange = async (e) => {
    const districtCode = e.target.value;
    setForm((prev) => ({ ...prev, district: districtCode, ward: "" }));
    setWards([]);
    if (!districtCode) return;

    setLoadingWards(true);
    setErrorForm("");
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
      if (!res.ok) throw new Error("Lỗi khi tải phường/xã");
      const data = await res.json();
      setWards(data.wards || []);
    } catch (err) {
      console.error("Lỗi fetch wards:", err);
      setErrorForm("Không tải được phường/xã.");
    } finally {
      setLoadingWards(false);
    }
  };

  const handleWardChange = (e) => setForm((prev) => ({ ...prev, ward: e.target.value }));
  const handleInputChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleEditAddress = (addr) => {
    setEditingAddressId(addr.id);
    const provinceCode = provinces.find((p) => p.name === addr.provinceName)?.code || "";
    setForm({
      name: addr.name,
      phone: addr.phone,
      province: provinceCode,
      district: "",
      ward: "",
      address: addr.address_detail,
    });
    if (provinceCode) handleProvinceChange({ target: { value: provinceCode } });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingAddressId(null);
    setForm({ name: "", phone: "", province: "", district: "", ward: "", address: "" });
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;
    try {
      await addressAPI.deleteAddress(id);
      setAddresses((prev) => prev.filter((addr) => addr.id !== id));
      if (editingAddressId === id) cancelEdit();
    } catch (err) {
      console.error("Lỗi xóa địa chỉ:", err);
      setErrorList(err.message || "Xóa địa chỉ thất bại");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setErrorForm("Bạn cần đăng nhập để lưu địa chỉ.");
      return;
    }

    setErrorForm("");
    setSuccessForm("");
    setSubmitting(true);

    try {
      const addressData = {
        account_id: user.id,
        name: form.name,
        phone: form.phone,
        provinceName: provinces.find((p) => Number(p.code) === Number(form.province))?.name || "",
        districtName: districts.find((d) => Number(d.code) === Number(form.district))?.name || "",
        wardName: wards.find((w) => Number(w.code) === Number(form.ward))?.name || "",
        address_detail: form.address,
      };

      if (editingAddressId) {
        await addressAPI.updateAddress(editingAddressId, addressData);
        setSuccessForm("Đã cập nhật địa chỉ thành công!");
      } else {
        await addressAPI.createAddress(addressData);
        setSuccessForm("Đã lưu địa chỉ mới thành công!");
      }

      setForm({ name: "", phone: "", province: "", district: "", ward: "", address: "" });
      setEditingAddressId(null);
      fetchAddresses();

      setTimeout(() => setSuccessForm(""), 4000);
    } catch (err) {
      console.error("Lỗi lưu địa chỉ:", err);
      setErrorForm(err.message || "Lưu địa chỉ thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleVisible = () => {
    setVisibleCount((prev) => (prev === 3 ? addresses.length : 3));
  };

  if (!user) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center text-rose-500 font-semibold border border-rose-100 shadow-sm">
        ⚠️ Vui lòng đăng nhập để quản lý địa chỉ.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <span>🏠</span>
          <span>Quản Lý & Thiết Lập Địa Chỉ</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Cập nhật thông tin nhận hàng để các đơn hàng gửi đến bạn nhanh chóng và chuẩn xác nhất.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form thêm/sửa địa chỉ */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm h-fit">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold">
                {editingAddressId ? "✏️" : "➕"}
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {editingAddressId ? "Cập Nhật Địa Chỉ" : "Thêm Địa Chỉ Mới"}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingAddressId ? "Chỉnh sửa thông tin địa chỉ đã chọn" : "Nhập đầy đủ thông tin giao nhận"}
                </p>
              </div>
            </div>

            {editingAddressId && (
              <button
                onClick={cancelEdit}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition"
              >
                Hủy bỏ
              </button>
            )}
          </div>

          {errorForm && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorForm}</span>
            </div>
          )}

          {successForm && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <span>✅</span>
              <span>{successForm}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Họ và tên người nhận *
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Số điện thoại *
                </label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: 0987654321"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tỉnh / Thành phố *
                </label>
                <select
                  value={form.province}
                  onChange={handleProvinceChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                  required
                >
                  <option value="">{loadingProvinces ? "Đang tải tỉnh thành..." : "— Chọn Tỉnh/Thành phố —"}</option>
                  {provinces.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Quận / Huyện *
                  </label>
                  <select
                    value={form.district}
                    onChange={handleDistrictChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition disabled:opacity-50"
                    disabled={!districts.length || loadingDistricts}
                    required
                  >
                    <option value="">{loadingDistricts ? "Đang tải..." : "— Chọn Quận/Huyện —"}</option>
                    {districts.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Phường / Xã *
                  </label>
                  <select
                    value={form.ward}
                    onChange={handleWardChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition disabled:opacity-50"
                    disabled={!wards.length || loadingWards}
                    required
                  >
                    <option value="">{loadingWards ? "Đang tải..." : "— Chọn Phường/Xã —"}</option>
                    {wards.map((w) => (
                      <option key={w.code} value={w.code}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Số nhà, tên đường chi tiết *
                </label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: Số 123 đường Lê Lợi, Chung cư ABC..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <span>Đang lưu địa chỉ...</span>
              ) : (
                <>
                  <span>{editingAddressId ? "Lưu thay đổi địa chỉ" : "Lưu địa chỉ nhận hàng"}</span>
                  <span>🚀</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Danh sách địa chỉ đã lưu */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <span>📍</span>
                <span>Địa chỉ đã lưu ({addresses.length})</span>
              </h3>
              {addresses.length > 3 && (
                <button
                  onClick={toggleVisible}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  {visibleCount === 3 ? "Xem tất cả" : "Thu gọn"}
                </button>
              )}
            </div>

            {loadingList && (
              <div className="p-8 text-center text-slate-400 text-sm animate-pulse">
                Đang tải danh sách địa chỉ...
              </div>
            )}

            {errorList && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {errorList}
              </div>
            )}

            {!loadingList && addresses.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">
                Bạn chưa có địa chỉ nào được lưu. Hãy điền form bên cạnh để tạo địa chỉ đầu tiên.
              </div>
            )}

            <div className="space-y-3.5">
              {addresses.slice(0, visibleCount).map((addr) => (
                <div
                  key={addr.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    editingAddressId === addr.id
                      ? "border-blue-500 bg-blue-50/30 ring-2 ring-blue-500/20"
                      : "border-slate-200/80 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{addr.name}</span>
                        <span className="text-xs text-slate-400">|</span>
                        <span className="text-xs font-semibold text-slate-700">{addr.phone}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        <span className="font-medium text-slate-800">{addr.address_detail}</span>,{" "}
                        {[addr.wardName, addr.districtName, addr.provinceName].filter(Boolean).join(", ")}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleEditAddress(addr)}
                        className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition"
                        title="Sửa địa chỉ này"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                        title="Xóa địa chỉ này"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
