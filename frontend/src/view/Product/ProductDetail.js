// src/view/Product/ProductDetail.js
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  getProductById, 
  getAllSizes, 
  createProductSize, 
  deleteProductSize, 
  getAllProductSizes,
  getAllRatings,
  createRating,
  getAllAccounts,
  getAllOrderDetails,
  getAllOrders
} from "../../api";
import { ProductDetailSkeleton } from "../common/Skeletons";

// Resolve image URL for products
const resolveImage = (img) => {
  if (!img) return "/images/placeholder.png";
  const trimmed = String(img).trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) {
    const parts = trimmed.split("/");
    return parts.map((part, idx) => (idx === 0 ? part : encodeURIComponent(part))).join("/");
  }
  return `/images/${encodeURIComponent(trimmed)}`;
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [sizes, setSizes] = useState([]);
  const [productSizes, setProductSizes] = useState([]);
  const [selectedSize, setSelectedSize] = useState("");
  const [adminSelectedSizeId, setAdminSelectedSizeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("desc");
  const [addedToast, setAddedToast] = useState(false);

  // Rating state
  const [ratings, setRatings] = useState([]);
  const [userRating, setUserRating] = useState({ rating_value: 5, comment: "" });
  const [eligibleOrderDetailId, setEligibleOrderDetailId] = useState(null);
  const [currentUser] = useState(() => JSON.parse(localStorage.getItem("user")));
  const isUser = currentUser?.role === "user";
  const isAdmin = currentUser?.role === "admin";

  const fetchProductDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [productData, sizesData, productSizesData, ratingsData, orderDetailsData, ordersData] = await Promise.all([
        getProductById(id),
        getAllSizes(),
        getAllProductSizes(),
        getAllRatings(),
        getAllOrderDetails(),
        getAllOrders()
      ]);
      
      if (!productData) {
        setError("Sản phẩm không tồn tại hoặc đã bị gỡ.");
        setLoading(false);
        return;
      }
      
      let accountsData = [];
      try {
        accountsData = await getAllAccounts();
      } catch (err) {
        console.log("Không thể lấy danh sách tài khoản");
      }
      
      setProduct(productData);
      setSizes(sizesData);

      const availableSizes = productSizesData.filter(ps => Number(ps.product_id) === Number(id));
      setProductSizes(availableSizes);
      if (availableSizes.length > 0) {
        const firstAvailable = availableSizes.find(ps => Number(ps.stock) > 0);
        if (firstAvailable) {
          const matchedSize = sizesData.find(s => s.id === firstAvailable.size_id);
          if (matchedSize) setSelectedSize(matchedSize.size);
        }
      }
      
      const detailById = new Map(orderDetailsData.map(d => [String(d.id), d]));
      const productSizeById = new Map(productSizesData.map(ps => [String(ps.id), ps]));
      const ordersById = new Map(ordersData.map(o => [String(o.id), o]));
      const accountsById = new Map(accountsData.map(a => [String(a.id), a]));

      const productRatings = ratingsData
        .map(r => {
          const detail = detailById.get(String(r.order_detail_id));
          if (!detail) return null;
          const ps = productSizeById.get(String(detail.product_sizes_id));
          return { r, detail, ps };
        })
        .filter(x => x && x.ps && Number(x.ps.product_id) === Number(id))
        .map(({ r, detail }) => {
          const order = ordersById.get(String(detail.order_id));
          const account = order ? accountsById.get(String(order.account_id)) : null;
          return {
            id: r.id,
            rating_value: r.rating_value,
            comment: r.comment,
            created_at: r.created_at,
            username: account?.username || "Khách hàng CoolShop",
          };
        });

      setRatings(productRatings);

      // Check eligibility to rate
      if (currentUser) {
        const userOrders = ordersData.filter(o => Number(o.account_id) === Number(currentUser.id));
        const userOrderIds = new Set(userOrders.map(o => String(o.id)));
        const userDetails = orderDetailsData.filter(d => userOrderIds.has(String(d.order_id)));
        
        const eligible = userDetails.find(d => {
          const ps = productSizeById.get(String(d.product_sizes_id));
          if (!ps || Number(ps.product_id) !== Number(id)) return false;
          return !ratingsData.some(r => String(r.order_detail_id) === String(d.id));
        });
        
        setEligibleOrderDetailId(eligible?.id || null);
      }
    } catch (err) {
      console.error(err);
      setError("Không thể tải thông tin sản phẩm");
    } finally {
      setLoading(false);
    }
  }, [id, currentUser]);

  useEffect(() => {
    fetchProductDetail();
  }, [fetchProductDetail]);

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert("⚠️ Vui lòng chọn kích cỡ (Size) trước khi thêm vào giỏ hàng!");
      return;
    }

    const matchedPS = productSizes.find(ps => {
      const s = sizes.find(sz => sz.id === ps.size_id);
      return s?.size === selectedSize;
    });

    if (!matchedPS || Number(matchedPS.stock) <= 0) {
      alert("⚠️ Size này hiện đã hết hàng, vui lòng chọn size khác!");
      return;
    }

    const currentCart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingIndex = currentCart.findIndex(
      item => item.id === product.id && item.size === selectedSize
    );

    const priceAfterDiscount = Number(product.discount_percent || 0) > 0
      ? product.price * (1 - product.discount_percent / 100)
      : product.price;

    if (existingIndex > -1) {
      currentCart[existingIndex].quantity += 1;
    } else {
      currentCart.push({
        id: product.id,
        name: product.name,
        price: priceAfterDiscount,
        original_price: product.price,
        discount_percent: product.discount_percent || 0,
        image: resolveImage(product.image),
        size: selectedSize,
        quantity: 1
      });
    }

    localStorage.setItem("cart", JSON.stringify(currentCart));
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  const handleAddRating = async () => {
    if (!eligibleOrderDetailId) {
      alert("Bạn cần mua sản phẩm này và hoàn thành đơn hàng để viết đánh giá!");
      return;
    }

    try {
      await createRating({
        order_detail_id: eligibleOrderDetailId,
        rating_value: userRating.rating_value,
        comment: userRating.comment,
      });
      alert("✅ Cảm ơn bạn đã gửi đánh giá sản phẩm!");
      setUserRating({ rating_value: 5, comment: "" });
      setEligibleOrderDetailId(null);
      fetchProductDetail();
    } catch (err) {
      alert("Lỗi khi gửi đánh giá: " + (err.message || "Vui lòng thử lại"));
    }
  };

  const handleAddSize = async () => {
    if (!adminSelectedSizeId) {
      alert("Vui lòng chọn size cần thêm!");
      return;
    }
    try {
      await createProductSize({ product_id: id, size_id: adminSelectedSizeId, stock: 50 });
      alert("✅ Thêm size thành công!");
      setAdminSelectedSizeId("");
      fetchProductDetail();
    } catch (err) {
      alert("Lỗi thêm size: " + err.message);
    }
  };

  const handleRemoveSize = async (psId) => {
    if (!window.confirm("Bạn có chắc muốn xóa size này?")) return;
    try {
      await deleteProductSize(psId);
      alert("✅ Đã xóa size khỏi sản phẩm!");
      fetchProductDetail();
    } catch (err) {
      alert("Lỗi xóa size: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <ProductDetailSkeleton containerClassName="max-w-6xl mx-auto" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-10 text-center max-w-md w-full border border-slate-200/80 shadow-xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center text-3xl">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-slate-900">{error || "Không tìm thấy sản phẩm"}</h2>
          <button
            onClick={() => navigate("/")}
            className="inline-block py-3 px-6 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  const finalPrice = Number(product.discount_percent || 0) > 0
    ? product.price * (1 - product.discount_percent / 100)
    : product.price;

  const averageRating = ratings.length > 0
    ? (ratings.reduce((s, r) => s + (r.rating_value || 0), 0) / ratings.length).toFixed(1)
    : "5.0";

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 px-4 sm:px-6 lg:px-8">
      {/* Added to cart toast */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-fadeIn">
          <span className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
            ✓
          </span>
          <div>
            <p className="font-bold text-sm">Đã thêm vào giỏ hàng!</p>
            <p className="text-xs text-slate-400">Size: {selectedSize} • {Number(finalPrice).toLocaleString("vi-VN")} ₫</p>
          </div>
          <Link
            to="/cart"
            className="ml-4 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition"
          >
            Xem giỏ hàng →
          </Link>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between gap-4 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:text-blue-600 transition">Trang chủ</Link>
            <span>/</span>
            <span className="text-slate-900 font-bold truncate max-w-xs sm:max-w-md">{product.name}</span>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-white text-slate-700 transition"
          >
            <span>←</span>
            <span>Quay lại</span>
          </button>
        </div>

        {/* Hero Product Detail Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left: Image Showcase */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative rounded-3xl overflow-hidden bg-slate-100 border border-slate-200/80 aspect-square group shadow-inner">
              <img
                src={resolveImage(product.image)}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/images/placeholder.png";
                }}
              />
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-extrabold uppercase tracking-wider shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Pro Athletic 2026</span>
                </span>
                {Number(product.discount_percent || 0) > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-rose-600 to-amber-500 text-white text-[11px] font-black uppercase tracking-wider shadow-md">
                    -{product.discount_percent}% GIẢM
                  </span>
                )}
              </div>

              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 shadow-md">
                100% Chính Hãng
              </div>
            </div>

            {/* Micro Feature badges */}
            <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-0.5">
                <span className="text-base">🚀</span>
                <p className="font-bold text-slate-800">Giao siêu tốc 2h</p>
                <p className="text-[10px] text-slate-400">Nội thành 2-4h</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-0.5">
                <span className="text-base">🔄</span>
                <p className="font-bold text-slate-800">Đổi trả 60 ngày</p>
                <p className="text-[10px] text-slate-400">Miễn phí tận nơi</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-0.5">
                <span className="text-base">💎</span>
                <p className="font-bold text-slate-800">Chuẩn thi đấu</p>
                <p className="text-[10px] text-slate-400">Kháng khuẩn 4 chiều</p>
              </div>
            </div>
          </div>

          {/* Right: Product Info & Purchase */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Category & Status */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  Thời Trang Thể Thao Cao Cấp
                </span>

                <div className="flex items-center gap-1 text-amber-500 text-xs font-extrabold">
                  <span>★</span>
                  <span>{averageRating}</span>
                  <span className="text-slate-400 font-normal">({ratings.length} đánh giá)</span>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                {product.name}
              </h1>

              {/* Price Row */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-400 font-semibold block">Giá bán chính thức</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl sm:text-3xl font-black text-blue-600">
                      {Number(finalPrice).toLocaleString("vi-VN")} ₫
                    </span>
                    {Number(product.discount_percent || 0) > 0 && (
                      <span className="text-sm text-slate-400 line-through">
                        {Number(product.price).toLocaleString("vi-VN")} ₫
                      </span>
                    )}
                  </div>
                </div>

                {Number(product.discount_percent || 0) > 0 && (
                  <span className="px-3 py-1 rounded-xl bg-rose-50 text-rose-600 font-black text-xs border border-rose-200">
                    Tiết kiệm {Number(product.price - finalPrice).toLocaleString("vi-VN")} ₫
                  </span>
                )}
              </div>

              {/* Size Selector */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Chọn kích cỡ (Size):
                  </span>
                  {selectedSize && (
                    <span className="text-xs text-slate-500">
                      Kho hàng: <span className="font-bold text-slate-900">
                        {(() => {
                          const ps = productSizes.find(p => {
                            const s = sizes.find(sz => sz.id === p.size_id);
                            return s?.size === selectedSize;
                          });
                          return Number(ps?.stock ?? 0) > 0 ? `${ps?.stock} chiếc` : "Tạm hết hàng";
                        })()}
                      </span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {productSizes.map((ps) => {
                    const size = sizes.find((s) => s.id === ps.size_id);
                    const stock = Number(ps?.stock ?? 0);
                    const out = stock <= 0;
                    const isSelected = selectedSize === size?.size;

                    return (
                      <div key={ps.id} className="relative group">
                        <button
                          type="button"
                          disabled={out}
                          onClick={() => setSelectedSize(size?.size)}
                          className={`min-w-12 h-11 px-4 rounded-xl font-black text-xs sm:text-sm transition-all duration-150 flex items-center justify-center gap-1.5 border ${
                            isSelected
                              ? "bg-slate-900 text-white border-slate-900 shadow-md scale-105"
                              : out
                              ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through"
                              : "bg-white text-slate-800 border-slate-200 hover:border-slate-900 hover:bg-slate-50"
                          }`}
                        >
                          <span>{size?.size}</span>
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleRemoveSize(ps.id)}
                            className="absolute -top-2 -right-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full w-5 h-5 text-[10px] font-bold flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition"
                            title="Xóa size này (Admin)"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Admin Add Size Box */}
                {isAdmin && (
                  <div className="flex gap-2 pt-2">
                    <select
                      value={adminSelectedSizeId}
                      onChange={(e) => setAdminSelectedSizeId(e.target.value)}
                      className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none"
                    >
                      <option value="">+ Thêm size kho (Admin)</option>
                      {sizes.map((size) => (
                        <option key={size.id} value={size.id}>
                          {size.size}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddSize}
                      className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                    >
                      Lưu size
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Add to Cart Actions */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <button
                onClick={handleAddToCart}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-[1.01] transition-all flex items-center justify-center gap-3"
              >
                <span>🛒</span>
                <span>Thêm Vào Giỏ Hàng Ngay</span>
              </button>

              <div className="flex items-center justify-center gap-6 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span> Freeship đơn từ 299K
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span> Kiểm tra hàng trước
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span> Hỗ trợ 24/7
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Tabs: Description, Specs, Reviews */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("desc")}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all whitespace-nowrap ${
                activeTab === "desc"
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              📖 Mô Tả Sản Phẩm
            </button>
            <button
              onClick={() => setActiveTab("specs")}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all whitespace-nowrap ${
                activeTab === "specs"
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              ⚙️ Thông Số Kỹ Thuật
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all whitespace-nowrap ${
                activeTab === "reviews"
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              ⭐ Đánh Giá & Nhận Xét ({ratings.length})
            </button>
          </div>

          {/* Tab 1: Description */}
          {activeTab === "desc" && (
            <div className="space-y-4 text-slate-700 leading-relaxed text-sm animate-fadeIn">
              <p className="whitespace-pre-line">
                {product.description || "Sản phẩm đồ thể thao CoolShop được gia công từ sợi vải công nghệ cao, kháng khuẩn và thoáng khí vượt trội, phù hợp cho tập luyện cường độ cao và mặc hàng ngày."}
              </p>
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/60 text-xs text-blue-900 space-y-1">
                <p className="font-bold">✨ Điểm nổi bật của dòng sản phẩm Pro Athletic 2026:</p>
                <p>• Sợi vải dệt tổ ong phân tử giúp thoát mồ hôi siêu tốc chỉ sau 3 giây vận động.</p>
                <p>• Co giãn 4 chiều đa phương, giữ form áo chuẩn kể cả sau 100 lần giặt máy.</p>
                <p>• Logo in decal nhiệt cao cấp không bong tróc, màu sắc sắc nét chuẩn thi đấu.</p>
              </div>
            </div>
          )}

          {/* Tab 2: Specs */}
          {activeTab === "specs" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs animate-fadeIn">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                <h4 className="font-extrabold text-slate-900 text-sm">Chất liệu & Gia công:</h4>
                <ul className="space-y-1.5 text-slate-600">
                  <li>• Thành phần: 92% Polyester Microfiber, 8% Spandex cao cấp</li>
                  <li>• Công nghệ: Dry-Fit thoát nhiệt đa chiều</li>
                  <li>• Đường may: Chần 4 kim 6 chỉ tiêu chuẩn thi đấu quốc tế</li>
                  <li>• Nơi sản xuất: Gia công chính hãng tại Việt Nam</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                <h4 className="font-extrabold text-slate-900 text-sm">Hướng dẫn bảo quản:</h4>
                <ul className="space-y-1.5 text-slate-600">
                  <li>• Giặt ở nhiệt độ bình thường với đồ có màu tương tự</li>
                  <li>• Không dùng hóa chất tẩy rửa mạnh có chứa clo</li>
                  <li>• Phơi ở nơi thoáng mát, tránh ánh nắng gắt trực tiếp</li>
                  <li>• Ủi ở nhiệt độ thấp dưới 110°C (không ủi trực tiếp lên decal)</li>
                </ul>
              </div>
            </div>
          )}

          {/* Tab 3: Reviews */}
          {activeTab === "reviews" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Rating summary */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row items-center gap-6">
                <div className="text-center sm:text-left space-y-1">
                  <span className="text-4xl font-black text-slate-900">{averageRating}</span>
                  <div className="text-amber-400 text-lg">
                    {"★".repeat(Math.round(averageRating))}{"☆".repeat(5 - Math.round(averageRating))}
                  </div>
                  <p className="text-xs text-slate-500">{ratings.length} lượt đánh giá từ người mua</p>
                </div>

                <div className="flex-1 text-xs text-slate-600 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-6 pt-4 sm:pt-0 space-y-1">
                  <p className="font-bold text-slate-800">100% Khách hàng đánh giá tốt về chất liệu & form dáng</p>
                  <p className="text-slate-500">Mọi đánh giá đều được xác minh từ những khách hàng đã đặt hàng thành công tại CoolShop.</p>
                </div>
              </div>

              {/* Write Review Form */}
              {isUser && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <span>✍️</span>
                    <span>Đánh giá trải nghiệm của bạn</span>
                  </h4>
                  {!eligibleOrderDetailId && (
                    <p className="text-xs text-slate-500">
                      Bạn cần mua và nhận thành công sản phẩm này để có thể gửi đánh giá xác thực.
                    </p>
                  )}

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700">Điểm số:</span>
                    <select
                      value={userRating.rating_value}
                      onChange={(e) => setUserRating({ ...userRating, rating_value: parseInt(e.target.value) })}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ (5 sao - Tuyệt vời)</option>
                      <option value={4}>⭐⭐⭐⭐ (4 sao - Rất tốt)</option>
                      <option value={3}>⭐⭐⭐ (3 sao - Bình thường)</option>
                      <option value={2}>⭐⭐ (2 sao - Cần cải thiện)</option>
                      <option value={1}>⭐ (1 sao - Không hài lòng)</option>
                    </select>
                  </div>

                  <textarea
                    value={userRating.comment}
                    onChange={(e) => setUserRating({ ...userRating, comment: e.target.value })}
                    placeholder="Chia sẻ cảm nhận về chất vải, độ co giãn, độ vừa vặn của size..."
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    rows="3"
                  />

                  <button
                    onClick={handleAddRating}
                    disabled={!eligibleOrderDetailId}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition disabled:opacity-40"
                  >
                    Gửi nhận xét ngay
                  </button>
                </div>
              )}

              {/* Reviews List */}
              <div className="space-y-3">
                {ratings.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Chưa có nhận xét nào cho sản phẩm này. Hãy là người đầu tiên trải nghiệm và chia sẻ!
                  </div>
                ) : (
                  ratings.map((r) => (
                    <div key={r.id} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                            {(r.username || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-xs">{r.username}</span>
                            <div className="text-amber-400 text-xs">
                              {"★".repeat(r.rating_value)}{"☆".repeat(5 - r.rating_value)}
                            </div>
                          </div>
                        </div>
                        {r.created_at && (
                          <span className="text-[11px] text-slate-400">
                            {new Date(r.created_at).toLocaleDateString("vi-VN")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed pl-10">{r.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}