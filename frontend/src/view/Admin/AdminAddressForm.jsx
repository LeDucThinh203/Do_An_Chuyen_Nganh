// import React, { useEffect, useState } from "react";
// import * as api from "../../api";
// import Session from "../../Session/session";

// export default function AdminAddressForm() {
//   const user = Session.isLoggedIn() ? JSON.parse(localStorage.getItem("user")) : null;
//   const [addresses, setAddresses] = useState([]);
//   const [form, setForm] = useState({
//     name: "",
//     phone: "",
//     provinceName: "",
//     districtName: "",
//     wardName: "",
//     address_detail: "",
//   });
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const fetchAddress = async () => {
//       try {
//         if (!user || user.role !== "admin") return;
//         const data = await api.getAllAddresses();
//         // lọc theo account_id nếu API trả về tất cả
//         const myAddresses = data.filter((a) => a.account_id === user.id);
//         setAddresses(myAddresses);
//       } catch (err) {
//         console.error(err);
//         setError("Không tải được dữ liệu địa chỉ.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchAddress();
//   }, []);

//   const handleChange = (e) => {
//     setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
//   };

//   const handleSave = async () => {
//     if (!form.name || !form.phone || !form.address_detail)
//       return alert("Vui lòng nhập đầy đủ thông tin!");

//     try {
//       setSaving(true);
//       const payload = { ...form, account_id: user.id };
//       if (addresses.length > 0) {
//         // cập nhật
//         await api.updateAddress(addresses[0].id, payload);
//         alert("Cập nhật địa chỉ thành công!");
//       } else {
//         // tạo mới
//         await api.createAddress(payload);
//         alert("Thêm địa chỉ thành công!");
//       }
//       const updated = await api.getAllAddresses();
//       setAddresses(updated.filter((a) => a.account_id === user.id));
//     } catch (err) {
//       console.error(err);
//       alert("Lỗi khi lưu địa chỉ!");
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (!user)
//     return <div className="text-red-500 font-bold">Vui lòng đăng nhập</div>;

//   if (user.role !== "admin")
//     return <div className="text-red-500 font-bold">Bạn không có quyền truy cập</div>;

//   return (
//     <div className="bg-white shadow-md rounded-xl p-6 max-w-xl mx-auto">
//       <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">
//         Địa chỉ của bạn (Admin)
//       </h2>

//       {loading ? (
//         <p className="text-center text-gray-500">Đang tải...</p>
//       ) : (
//         <div className="space-y-3">
//           <input
//             type="text"
//             name="name"
//             value={form.name}
//             onChange={handleChange}
//             placeholder="Họ tên"
//             className="border p-2 rounded w-full"
//           />
//           <input
//             type="text"
//             name="phone"
//             value={form.phone}
//             onChange={handleChange}
//             placeholder="Số điện thoại"
//             className="border p-2 rounded w-full"
//           />
//           <input
//             type="text"
//             name="provinceName"
//             value={form.provinceName}
//             onChange={handleChange}
//             placeholder="Tỉnh/Thành phố"
//             className="border p-2 rounded w-full"
//           />
//           <input
//             type="text"
//             name="districtName"
//             value={form.districtName}
//             onChange={handleChange}
//             placeholder="Quận/Huyện"
//             className="border p-2 rounded w-full"
//           />
//           <input
//             type="text"
//             name="wardName"
//             value={form.wardName}
//             onChange={handleChange}
//             placeholder="Phường/Xã"
//             className="border p-2 rounded w-full"
//           />
//           <textarea
//             name="address_detail"
//             value={form.address_detail}
//             onChange={handleChange}
//             placeholder="Địa chỉ chi tiết"
//             className="border p-2 rounded w-full"
//           />

//           <button
//             disabled={saving}
//             onClick={handleSave}
//             className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
//           >
//             {saving ? "Đang lưu..." : addresses.length > 0 ? "Cập nhật" : "Thêm mới"}
//           </button>
//         </div>
//       )}

//       {addresses.length > 0 && (
//         <div className="mt-6 border-t pt-4">
//           <h3 className="text-lg font-semibold mb-2 text-gray-700">Địa chỉ hiện tại:</h3>
//           {addresses.map((a) => (
//             <div key={a.id} className="border p-3 rounded mb-2 bg-gray-50">
//               <p><strong>Họ tên:</strong> {a.name}</p>
//               <p><strong>SĐT:</strong> {a.phone}</p>
//               <p><strong>Địa chỉ:</strong> {a.address_detail}, {a.wardName}, {a.districtName}, {a.provinceName}</p>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }
