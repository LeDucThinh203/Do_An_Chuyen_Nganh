// src/view/Cart/Checkout.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Session from "../../Session/session";
import * as addressAPI from "../../api";

export default function Checkout() {
  const user = useMemo(() => Session.isLoggedIn() ? JSON.parse(localStorage.getItem("user")) : null, []);
  const navigate = useNavigate();
  const location = useLocation();

  const [checkoutItems, setCheckoutItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [useSavedAddress, setUseSavedAddress] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

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
    payment_method: "",
  });

  // Load checkout form từ localStorage nếu có
  useEffect(() => {
    const savedForm = localStorage.getItem("checkout_form");
    if (savedForm) setForm(JSON.parse(savedForm));
  }, []);

  // Auto fill form nếu được chuyển từ trang chọn địa chỉ
  useEffect(() => {
    if (location.state?.selectedAddress) {
      const addr = location.state.selectedAddress;
      fillFormFromAddress(addr);
      setUseSavedAddress(false);
    }
  }, [location.state, provinces]);

  // Load checkout items
  useEffect(() => {
    const items = JSON.parse(localStorage.getItem("checkout_items")) || [];
    setCheckoutItems(items);
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setTotal(totalAmount);
  }, []);

  // Load provinces
  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/p/")
      .then(res => res.json())
      .then(setProvinces);
  }, []);

  // Load saved addresses khi chọn form "địa chỉ đã lưu"
  useEffect(() => {
    if (useSavedAddress && user) {
      setLoadingAddresses(true);
      addressAPI.getAllAddresses()
        .then(data => {
          const userAddresses = data.filter(addr => addr.account_id === user.id);
          setSavedAddresses(userAddresses);
        })
        .catch(err => console.error("Lỗi tải địa chỉ:", err))
        .finally(() => setLoadingAddresses(false));
    }
  }, [useSavedAddress, user]);

  const handleInputChange = (e) => {
    const newForm = { ...form, [e.target.name]: e.target.value };
    setForm(newForm);
    localStorage.setItem("checkout_form", JSON.stringify(newForm));
  };

  const handleProvinceChange = (e) => {
    const provinceCode = e.target.value;
    const newForm = { ...form, province: provinceCode, district: "", ward: "" };
    setForm(newForm);
    localStorage.setItem("checkout_form", JSON.stringify(newForm));

    setDistricts([]);
    setWards([]);
    if (!provinceCode) return;

    fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`)
      .then(res => res.json())
      .then(data => setDistricts(data.districts || []));
  };

  const handleDistrictChange = (e) => {
    const districtCode = e.target.value;
    const newForm = { ...form, district: districtCode, ward: "" };
    setForm(newForm);
    localStorage.setItem("checkout_form", JSON.stringify(newForm));

    setWards([]);
    if (!districtCode) return;

    fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`)
      .then(res => res.json())
      .then(data => setWards(data.wards || []));
  };

  const handleWardChange = (e) => {
    const newForm = { ...form, ward: e.target.value };
    setForm(newForm);
    localStorage.setItem("checkout_form", JSON.stringify(newForm));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (checkoutItems.length === 0) return alert("Chưa có sản phẩm nào để thanh toán!");

    const orderId = Date.now();
    const orderData = {
      orderId,
      items: checkoutItems,
      total,
      ...form,
    };
    localStorage.setItem("last_order", JSON.stringify(orderData));
    localStorage.removeItem("cart");
    localStorage.removeItem("checkout_items");
    localStorage.removeItem("checkout_form"); // xóa form tạm

    navigate("/order-confirmation");
  };

  // Khi nhấn chọn địa chỉ → confirm
  const handleChooseAddress = (addr) => {
    if (window.confirm("Bạn chắc muốn chọn địa chỉ này?")) {
      fillFormFromAddress(addr);
      setUseSavedAddress(false);
    }
  };

  const fillFormFromAddress = (addr) => {
    const provinceCode = provinces.find(p => p.name === addr.provinceName)?.code || "";
    setForm({
      name: addr.name,
      phone: addr.phone,
      province: provinceCode,
      district: "",
      ward: "",
      address: addr.address_detail,
      payment_method: "",
    });

    if (provinceCode) {
      fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`)
        .then(res => res.json())
        .then(data => {
          setDistricts(data.districts || []);
          const districtCode = data.districts?.find(d => d.name === addr.districtName)?.code || "";
          setForm(prev => ({ ...prev, district: districtCode }));
          if (districtCode) {
            fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`)
              .then(res => res.json())
              .then(wData => {
                setWards(wData.wards || []);
                const wardCode = wData.wards?.find(w => w.name === addr.wardName)?.code || "";
                setForm(prev => ({ ...prev, ward: wardCode }));
              });
          }
        });
    }
  };

  if (!user) return <div className="text-red-500 font-bold">Vui lòng đăng nhập</div>;
  if (checkoutItems.length === 0) return <div className="text-center mt-20 text-gray-500">Không có sản phẩm nào để thanh toán.</div>;

  return (
    <div className="max-w-7xl mx-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Form thanh toán */}
      <div className="card shadow-lg p-6 rounded-xl bg-gradient-to-r from-blue-50 to-white">
        <h2 className="text-2xl font-bold text-center text-green-600 mb-6">Thanh toán</h2>

        {/* Nút chọn form */}
        <div className="flex mb-4">
          <button 
            onClick={() => setUseSavedAddress(false)} 
            className={`flex-1 py-2 rounded-l ${!useSavedAddress ? "bg-green-600 text-white" : "bg-gray-200"}`}
          >
            Thanh toán địa chỉ mới
          </button>
          <button 
            onClick={() => setUseSavedAddress(true)} 
            className={`flex-1 py-2 rounded-r ${useSavedAddress ? "bg-green-600 text-white" : "bg-gray-200"}`}
          >
            Thanh toán địa chỉ đã lưu
          </button>
        </div>

        {/* Form địa chỉ mới */}
        {!useSavedAddress && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input 
              type="text" 
              name="name" 
              placeholder="Họ tên" 
              value={form.name} 
              onChange={handleInputChange} 
              className="form-input w-full border p-2 rounded" 
              required 
            />
            <input 
              type="text" 
              name="phone" 
              placeholder="Số điện thoại" 
              value={form.phone} 
              onChange={handleInputChange} 
              className="form-input w-full border p-2 rounded" 
              required 
            />

            <select 
              value={form.province} 
              onChange={handleProvinceChange} 
              className="form-select w-full border p-2 rounded" 
              required
            >
              <option value="">Chọn Tỉnh/Thành phố</option>
              {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
            </select>

            <select 
              value={form.district} 
              onChange={handleDistrictChange} 
              className="form-select w-full border p-2 rounded" 
              disabled={!districts.length} 
              required
            >
              <option value="">Chọn Quận/Huyện</option>
              {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
            </select>

            <select 
              value={form.ward} 
              onChange={handleWardChange} 
              className="form-select w-full border p-2 rounded" 
              disabled={!wards.length} 
              required
            >
              <option value="">Chọn Phường/Xã</option>
              {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
            </select>

            <textarea 
              name="address" 
              placeholder="Địa chỉ cụ thể" 
              value={form.address} 
              onChange={handleInputChange} 
              className="w-full border p-2 rounded" 
              rows={3} 
              required 
            />

            <select 
              name="payment_method" 
              value={form.payment_method} 
              onChange={handleInputChange} 
              className="form-select w-full border p-2 rounded" 
              required
            >
              <option value="">Chọn phương thức thanh toán</option>
              <option value="cod">Thanh toán khi nhận hàng</option>
              <option value="bank">Thanh toán qua thẻ ngân hàng</option>
            </select>

            {/* Nút xác nhận và quay lại cùng hàng */}
            <div className="flex gap-3">
              <button 
                type="button" 
                className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500 transition" 
                onClick={() => navigate("/cart")}
              >
                ← Quay lại giỏ hàng
              </button>
              <button 
                type="submit" 
                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
              >
                Xác nhận đơn hàng
              </button>
            </div>
          </form>
        )}

        {/* Form địa chỉ đã lưu */}
        {useSavedAddress && (
          <div>
            {loadingAddresses ? (
              <p>Đang tải địa chỉ...</p>
            ) : savedAddresses.length === 0 ? (
              <p className="text-gray-500">Bạn chưa có địa chỉ đã lưu.</p>
            ) : (
              <ul className="space-y-3">
                {savedAddresses.map(addr => (
                  <li key={addr.id} className="border p-3 rounded flex justify-between items-center">
                    <div>
                      <p><strong>{addr.name}</strong> - {addr.phone}</p>
                      <p className="text-gray-500 text-sm">{addr.address_detail}, {addr.wardName}, {addr.districtName}, {addr.provinceName}</p>
                    </div>
                    <button
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                      onClick={() => handleChooseAddress(addr)}
                    >
                      Chọn
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Danh sách sản phẩm */}
      <div className="card shadow-lg p-6 rounded-xl bg-white">
        <h3 className="text-xl font-bold text-blue-600 mb-4">Sản phẩm đã chọn</h3>
        <div className="space-y-4">
          {checkoutItems.map((item, index) => (
            <div key={`${item.id}-${item.size || 'no-size'}-${index}`} className="flex items-center gap-4 border-b pb-4">
              <img 
                src={item.image} 
                alt={item.name} 
                className="w-20 h-20 object-cover rounded-lg border" 
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{item.name}</p>
                
                {/* Hiển thị size nếu có */}
                {item.size && (
                  <div className="mt-1">
                    <span className="text-sm font-medium text-gray-700">Size: </span>
                    <span className="text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded border">
                      {item.size}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-4">
                    <p className="text-gray-500 text-sm">
                      Số lượng: <span className="font-medium">{item.quantity}</span>
                    </p>
                    <p className="text-red-600 font-semibold">
                      {Number(item.price).toLocaleString()} ₫
                    </p>
                  </div>
                  <p className="text-green-600 font-bold">
                    {(item.price * item.quantity).toLocaleString()} ₫
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Tổng tiền */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Tổng tiền:</span>
            <span className="text-2xl font-bold text-green-600">
              {Number(total).toLocaleString()} ₫
            </span>
          </div>
        </div>

        {/* Thông tin đơn hàng */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Thông tin đơn hàng:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Số lượng sản phẩm: {checkoutItems.length}</p>
            <p>• Tổng số lượng: {checkoutItems.reduce((sum, item) => sum + item.quantity, 0)}</p>
            <p>• Phí vận chuyển: Miễn phí</p>
          </div>
        </div>
      </div>
    </div>
  );
}