import React, { useEffect, useState, useMemo } from "react";
import Session from "../../Session/session";
import * as addressAPI from "../../api";

export default function AddressManager() {
  const user = useMemo(() => Session.isLoggedIn() ? JSON.parse(localStorage.getItem("user")) : null, []);

  const [addresses, setAddresses] = useState([]);
  const [visibleCount, setVisibleCount] = useState(2); // Mặc định hiển thị 2 địa chỉ
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

  const fetchAddresses = async () => {
    if (!user) return;
    setLoadingList(true);
    setErrorList("");
    try {
      const data = await addressAPI.getAllAddresses();
      const userAddresses = data.filter(addr => addr.account_id === user.id);
      setAddresses(userAddresses);
    } catch (err) {
      console.error("Lỗi khi lấy địa chỉ:", err);
      setErrorList("Không tải được danh sách địa chỉ.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  const handleProvinceChange = async (e) => {
    const provinceCode = e.target.value;
    setForm(prev => ({ ...prev, province: provinceCode, district: "", ward: "" }));
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
    setForm(prev => ({ ...prev, district: districtCode, ward: "" }));
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

  const handleWardChange = (e) => setForm(prev => ({ ...prev, ward: e.target.value }));
  const handleInputChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleEditAddress = (addr) => {
    setEditingAddressId(addr.id);
    const provinceCode = provinces.find(p => p.name === addr.provinceName)?.code || "";
    setForm({
      name: addr.name,
      phone: addr.phone,
      province: provinceCode,
      district: "",
      ward: "",
      address: addr.address_detail,
    });
    if (provinceCode) handleProvinceChange({ target: { value: provinceCode } });
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa địa chỉ này?")) return;
    try {
      await addressAPI.deleteAddress(id);
      setAddresses(prev => prev.filter(addr => addr.id !== id));
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
    try {
      const addressData = {
        account_id: user.id,
        name: form.name,
        phone: form.phone,
        provinceName: provinces.find(p => p.code == form.province)?.name || "",
        districtName: districts.find(d => d.code == form.district)?.name || "",
        wardName: wards.find(w => w.code == form.ward)?.name || "",
        address_detail: form.address,
      };

      if (editingAddressId) {
        await addressAPI.updateAddress(editingAddressId, addressData);
        setSuccessForm("Địa chỉ đã cập nhật thành công!");
      } else {
        await addressAPI.createAddress(addressData);
        setSuccessForm("Địa chỉ đã lưu thành công!");
      }

      setForm({ name: "", phone: "", province: "", district: "", ward: "", address: "" });
      setEditingAddressId(null);
      fetchAddresses();
    } catch (err) {
      console.error("Lỗi lưu địa chỉ:", err);
      setErrorForm(err.message || "Lưu địa chỉ thất bại");
    }
  };

  const toggleVisible = () => {
    setVisibleCount(prev => (prev === 2 ? addresses.length : 2));
  };

  if (!user) {
    return <div className="text-red-500 font-bold">⚠️ Vui lòng đăng nhập</div>;
  }

  return (
    <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">
        🏠 Quản lý địa chỉ
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cột 1: danh sách địa chỉ */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Danh sách địa chỉ</h3>
          {loadingList && <p>Đang tải...</p>}
          {errorList && <p className="text-red-500">{errorList}</p>}
          {addresses.length === 0 && !loadingList && <p className="text-gray-500">Bạn chưa có địa chỉ nào.</p>}
          <ul className="space-y-4">
            {addresses.slice(0, visibleCount).map(addr => (
              <li key={addr.id} className="border p-4 rounded flex flex-col justify-between">
                <div className="mb-2">
                  <p><b>Họ tên:</b> {addr.name}</p>
                  <p><b>SĐT:</b> {addr.phone}</p>
                  <p><b>Địa chỉ:</b> {`${addr.address_detail}, ${addr.wardName}, ${addr.districtName}, ${addr.provinceName}`}</p>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleEditAddress(addr)}
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
        </div>

        {/* Cột 2: form thêm/sửa */}
        <div>
          <h3 className="text-lg font-semibold mb-2">{editingAddressId ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}</h3>
          {errorForm && <div className="text-red-500 mb-3">{errorForm}</div>}
          {successForm && <div className="text-green-500 mb-3">{successForm}</div>}
          <form onSubmit={handleSubmit} className="space-y-3">
            <input name="name" value={form.name} onChange={handleInputChange} placeholder="Họ tên" className="w-full p-2 border rounded" required />
            <input name="phone" value={form.phone} onChange={handleInputChange} placeholder="Số điện thoại" className="w-full p-2 border rounded" required />
            <select value={form.province} onChange={handleProvinceChange} className="w-full p-2 border rounded" required>
              <option value="">{loadingProvinces ? "Đang tải..." : "Chọn Tỉnh/Thành phố"}</option>
              {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
            </select>
            <select value={form.district} onChange={handleDistrictChange} className="w-full p-2 border rounded" disabled={!districts.length || loadingDistricts} required>
              <option value="">{loadingDistricts ? "Đang tải..." : "Chọn Quận/Huyện"}</option>
              {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
            </select>
            <select value={form.ward} onChange={handleWardChange} className="w-full p-2 border rounded" disabled={!wards.length || loadingWards} required>
              <option value="">{loadingWards ? "Đang tải..." : "Chọn Phường/Xã"}</option>
              {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
            </select>
            <input name="address" value={form.address} onChange={handleInputChange} placeholder="Địa chỉ chi tiết" className="w-full p-2 border rounded" required />
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">{editingAddressId ? "Cập nhật địa chỉ" : "Lưu địa chỉ"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
