// src/view/User/Address.jsx
import React, { useEffect, useState, useMemo } from "react";
import Session from "../../Session/session";
import * as addressAPI from "../../api";

export default function Address({ onNavigate }) {
  const user = useMemo(() => (Session.isLoggedIn() ? Session.getUser() : null), []);
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
        const userAddresses = data.filter((addr) => addr.account_id === user.id);
        setAddresses(userAddresses);
      } catch (err) {
        console.error("Lỗi khi lấy địa chỉ:", err);
        setError("Không tải được danh sách địa chỉ nhận hàng.");
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [user]);

  if (!user) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center text-rose-500 font-semibold border border-rose-100 shadow-sm">
        ⚠️ Vui lòng đăng nhập để xem danh sách địa chỉ.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>📍</span>
            <span>Sổ Địa Chỉ Giao Hàng</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quản lý các địa điểm nhận hàng khi đặt đơn trên CoolShop Athletic
          </p>
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate("manageAddress")}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all hover:scale-105 flex-shrink-0"
          >
            <span>+</span>
            <span>Thêm địa chỉ mới</span>
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200/70 animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 rounded-md w-1/3"></div>
              <div className="h-4 bg-slate-100 rounded-md w-1/2"></div>
              <div className="h-10 bg-slate-50 rounded-md w-full"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-3">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && addresses.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-4">
          <div className="w-16 h-16 mx-auto bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-3xl">
            📍
          </div>
          <h3 className="text-lg font-bold text-slate-900">Chưa có địa chỉ giao hàng nào</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Thêm địa chỉ nhận hàng để quá trình mua sắm và thanh toán diễn ra nhanh chóng, tiện lợi hơn.
          </p>
          {onNavigate && (
            <button
              onClick={() => onNavigate("manageAddress")}
              className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm shadow-md hover:bg-blue-700 transition"
            >
              Thêm địa chỉ ngay
            </button>
          )}
        </div>
      )}

      {/* Address Cards Grid */}
      {!loading && addresses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {addresses.map((addr, idx) => (
            <div
              key={addr.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Header card with badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs">
                      #{idx + 1}
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-base">{addr.name}</h4>
                  </div>
                  {idx === 0 && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Mặc định
                    </span>
                  )}
                </div>

                {/* Phone */}
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="text-slate-400">📞</span>
                  <span className="font-semibold text-slate-800">{addr.phone}</span>
                </div>

                {/* Detailed Address */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs sm:text-sm text-slate-700 leading-relaxed flex items-start gap-2.5">
                  <span className="text-blue-500 flex-shrink-0 mt-0.5">📌</span>
                  <div>
                    <span className="font-semibold text-slate-900 block mb-0.5">
                      {addr.address_detail}
                    </span>
                    <span className="text-slate-500">
                      {[addr.wardName, addr.districtName, addr.provinceName].filter(Boolean).join(", ")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              {onNavigate && (
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => onNavigate("manageAddress")}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
                  >
                    Chỉnh sửa trong Quản lý địa chỉ →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
