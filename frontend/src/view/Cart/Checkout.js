// src/view/Cart/Checkout.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Session from "../../Session/session";
import * as addressAPI from "../../api";

export default function Checkout() {
  const user = useMemo(() => (Session.isLoggedIn() ? Session.getUser() : null), []);
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
    payment_method: "cod",
  });

  // Load checkout form từ localStorage nếu có
  useEffect(() => {
    const savedForm = localStorage.getItem("checkout_form");
    if (savedForm) {
      try {
        const parsed = JSON.parse(savedForm);
        setForm((prev) => ({ ...prev, ...parsed, payment_method: parsed.payment_method || "cod" }));
      } catch (e) {}
    }
  }, []);

  const fillFormFromAddress = useCallback((addr) => {
    const provinceCode = provinces.find((p) => p.name === addr.provinceName)?.code || "";
    setForm((prev) => ({
      ...prev,
      name: addr.name,
      phone: addr.phone,
      province: provinceCode,
      district: "",
      ward: "",
      address: addr.address_detail,
    }));

    if (provinceCode) {
      fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`)
        .then((res) => res.json())
        .then((data) => {
          setDistricts(data.districts || []);
          const districtCode = data.districts?.find((d) => d.name === addr.districtName)?.code || "";
          setForm((prev) => ({ ...prev, district: districtCode }));
          if (districtCode) {
            fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`)
              .then((res) => res.json())
              .then((wData) => {
                setWards(wData.wards || []);
                const wardCode = wData.wards?.find((w) => w.name === addr.wardName)?.code || "";
                setForm((prev) => ({ ...prev, ward: wardCode }));
              });
          }
        });
    }
  }, [provinces]);

  // Auto fill form nếu được chuyển từ trang chọn địa chỉ
  useEffect(() => {
    if (location.state?.selectedAddress) {
      const addr = location.state.selectedAddress;
      fillFormFromAddress(addr);
      setUseSavedAddress(false);
    }
  }, [location.state, fillFormFromAddress]);

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
      .then((res) => res.json())
      .then(setProvinces);
  }, []);

  // Load saved addresses khi chọn tab "địa chỉ đã lưu"
  useEffect(() => {
    if (useSavedAddress && user) {
      setLoadingAddresses(true);
      addressAPI
        .getAllAddresses()
        .then((data) => {
          const userAddresses = data.filter((addr) => addr.account_id === user.id);
          setSavedAddresses(userAddresses);
        })
        .catch((err) => console.error("Lỗi tải địa chỉ:", err))
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
      .then((res) => res.json())
      .then((data) => setDistricts(data.districts || []));
  };

  const handleDistrictChange = (e) => {
    const districtCode = e.target.value;
    const newForm = { ...form, district: districtCode, ward: "" };
    setForm(newForm);
    localStorage.setItem("checkout_form", JSON.stringify(newForm));

    setWards([]);
    if (!districtCode) return;

    fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`)
      .then((res) => res.json())
      .then((data) => setWards(data.wards || []));
  };

  const handleWardChange = (e) => {
    const newForm = { ...form, ward: e.target.value };
    setForm(newForm);
    localStorage.setItem("checkout_form", JSON.stringify(newForm));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (checkoutItems.length === 0) return alert("Chưa có sản phẩm nào để thanh toán!");

    // Build full human-readable address string
    const provName = provinces.find((p) => String(p.code) === String(form.province))?.name || "";
    const distName = districts.find((d) => String(d.code) === String(form.district))?.name || "";
    const wardName = wards.find((w) => String(w.code) === String(form.ward))?.name || "";
    const fullAddress = [form.address, wardName, distName, provName].filter(Boolean).join(", ");

    const orderId = Date.now();
    const orderData = {
      orderId,
      items: checkoutItems,
      total,
      ...form,
      address: fullAddress,
    };
    localStorage.setItem("last_order", JSON.stringify(orderData));
    localStorage.removeItem("cart");
    localStorage.removeItem("checkout_items");
    localStorage.removeItem("checkout_form");

    navigate("/order-confirmation");
  };

  const handleChooseAddress = (addr) => {
    fillFormFromAddress(addr);
    setUseSavedAddress(false);
  };

  const resolveImage = (img) => {
    if (!img) return "/images/placeholder.png";
    const trimmed = String(img).trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
    if (trimmed.startsWith("/")) return encodeURI(trimmed);
    return `/images/${encodeURI(trimmed)}`;
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 sm:p-10 text-center max-w-md w-full border border-slate-200/80 shadow-xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center text-3xl">
            🔒
          </div>
          <h2 className="text-xl font-bold text-slate-900">Yêu cầu đăng nhập</h2>
          <p className="text-sm text-slate-500">
            Bạn cần đăng nhập tài khoản để tiến hành thanh toán đơn hàng.
          </p>
          <Link
            to="/login"
            className="block w-full py-3 px-6 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-10 text-center max-w-md w-full border border-slate-200/80 shadow-xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center text-3xl">
            🛍️
          </div>
          <h2 className="text-xl font-bold text-slate-900">Không có sản phẩm nào</h2>
          <p className="text-sm text-slate-500">
            Vui lòng quay lại giỏ hàng và chọn sản phẩm để thanh toán.
          </p>
          <Link
            to="/cart"
            className="inline-block py-3 px-6 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition"
          >
            Về giỏ hàng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Stepper Header */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-center gap-2 sm:gap-6 text-xs sm:text-sm font-bold">
            <Link to="/cart" className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition">
              <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs">
                ✓
              </span>
              <span>Giỏ hàng</span>
            </Link>
            <span className="text-slate-300">─────</span>
            <div className="flex items-center gap-2 text-blue-600">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                2
              </span>
              <span>Thông tin đặt hàng</span>
            </div>
            <span className="text-slate-300">─────</span>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs">
                3
              </span>
              <span>Hoàn tất đơn</span>
            </div>
          </div>
        </div>

        {/* Main Grid: Form & Order Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form nhập thông tin */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <span>📍</span>
                <span>Thông Tin Nhận Hàng</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Điền chính xác địa chỉ và số điện thoại để CoolShop giao đồ thể thao tận nơi.
              </p>
            </div>

            {/* Switch tabs: Mới vs Đã lưu */}
            <div className="flex p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setUseSavedAddress(false)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
                  !useSavedAddress
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Nhập địa chỉ mới
              </button>
              <button
                type="button"
                onClick={() => setUseSavedAddress(true)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
                  useSavedAddress
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Chọn địa chỉ đã lưu
              </button>
            </div>

            {/* Form nhập địa chỉ mới */}
            {!useSavedAddress ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Họ và tên người nhận *
                    </label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Nguyễn Văn A"
                      value={form.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Số điện thoại nhận hàng *
                    </label>
                    <input
                      type="text"
                      name="phone"
                      placeholder="0987654321"
                      value={form.phone}
                      onChange={handleInputChange}
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
                      <option value="">-- Chọn Tỉnh / Thành phố --</option>
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
                        disabled={!districts.length}
                        required
                      >
                        <option value="">-- Chọn Quận / Huyện --</option>
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
                        disabled={!wards.length}
                        required
                      >
                        <option value="">-- Chọn Phường / Xã --</option>
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
                    <textarea
                      name="address"
                      placeholder="Ví dụ: Số 123 đường Nguyễn Huệ, Tòa nhà Bitexco..."
                      value={form.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                      rows={2}
                      required
                    />
                  </div>
                </div>

                {/* Phương thức thanh toán */}
                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Chọn phương thức thanh toán *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`p-4 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                        form.payment_method === "cod"
                          ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value="cod"
                        checked={form.payment_method === "cod"}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <p className="font-bold text-slate-900 text-xs sm:text-sm">💵 COD (Tiền mặt)</p>
                        <p className="text-[11px] text-slate-500">Thanh toán khi nhận kiện hàng</p>
                      </div>
                    </label>

                    <label
                      className={`p-4 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                        form.payment_method === "vnpay"
                          ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value="vnpay"
                        checked={form.payment_method === "vnpay"}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <p className="font-bold text-slate-900 text-xs sm:text-sm">💳 Cổng VNPay</p>
                        <p className="text-[11px] text-slate-500">Quét mã QR / Thẻ ATM, Visa</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/cart")}
                    className="flex-1 py-3.5 px-5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition text-center"
                  >
                    ← Quay lại giỏ hàng
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition text-center"
                  >
                    Xác nhận đơn hàng →
                  </button>
                </div>
              </form>
            ) : (
              /* Danh sách địa chỉ đã lưu */
              <div className="space-y-4">
                {loadingAddresses ? (
                  <div className="p-8 text-center text-slate-400 text-xs animate-pulse">
                    Đang tải danh sách địa chỉ của bạn...
                  </div>
                ) : savedAddresses.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm space-y-2">
                    <p>Bạn chưa lưu địa chỉ giao hàng nào trong tài khoản.</p>
                    <button
                      onClick={() => setUseSavedAddress(false)}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Chuyển sang nhập địa chỉ mới
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedAddresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="p-4 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 transition flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1 text-xs">
                          <p className="font-extrabold text-slate-900 text-sm">
                            {addr.name} - <span className="font-semibold text-slate-600">{addr.phone}</span>
                          </p>
                          <p className="text-slate-600">
                            {addr.address_detail}, {addr.wardName}, {addr.districtName}, {addr.provinceName}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleChooseAddress(addr)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex-shrink-0"
                        >
                          Chọn địa chỉ này
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Order Items Summary */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xl space-y-5 sticky top-28">
              <h3 className="text-base font-extrabold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
                <span>Kiểm Tra Đơn Hàng</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                  {checkoutItems.length} món
                </span>
              </h3>

              <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                {checkoutItems.map((item, index) => (
                  <div
                    key={`${item.id}-${item.size || "no-size"}-${index}`}
                    className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-100"
                  >
                    <img
                      src={resolveImage(item.image)}
                      alt={item.name}
                      className="w-14 h-14 object-cover rounded-xl border border-slate-200/60 bg-white flex-shrink-0"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/images/placeholder.png";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-slate-900 truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                        {item.size && <span>Size: {item.size}</span>}
                        <span>x {item.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-black text-xs text-blue-600">
                        {(item.price * item.quantity).toLocaleString("vi-VN")} ₫
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Calculation */}
              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Tạm tính tiền hàng:</span>
                  <span className="font-bold text-slate-900">{Number(total).toLocaleString("vi-VN")} ₫</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển:</span>
                  <span className="font-bold text-emerald-600">
                    {total >= 299000 ? "0 ₫ (Freeship)" : "Miễn phí"}
                  </span>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-900">Tổng thanh toán:</span>
                  <span className="text-xl font-black text-blue-600">
                    {Number(total).toLocaleString("vi-VN")} ₫
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <span>🔒</span>
                  <span>Bảo mật dữ liệu thanh toán 100%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>⚡</span>
                  <span>CoolShop Athletic phục vụ 24/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}