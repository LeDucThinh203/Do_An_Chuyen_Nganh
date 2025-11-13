// src/view/Product/ProductDetail.js
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [sizes, setSizes] = useState([]);
  const [productSizes, setProductSizes] = useState([]);
  const [selectedSize, setSelectedSize] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Rating state
  const [ratings, setRatings] = useState([]);
  const [userRating, setUserRating] = useState({ rating_value: 5, comment: "" });
  const [eligibleOrderDetailId, setEligibleOrderDetailId] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const isUser = currentUser?.role === "user";

  const fetchProductDetail = useCallback(async () => {
    try {
      setLoading(true);
      const [productData, sizesData, productSizesData, ratingsData, accountsData, orderDetailsData, ordersData] = await Promise.all([
        getProductById(id),
        getAllSizes(),
        getAllProductSizes(),
        getAllRatings(),
        getAllAccounts(),
        getAllOrderDetails(),
        getAllOrders()
      ]);
      
      setProduct(productData);
      setSizes(sizesData);
      
      // Lọc các size có sẵn cho sản phẩm này
      const availableSizes = productSizesData.filter(ps => ps.product_id === parseInt(id));
      setProductSizes(availableSizes);
      
      // -------- Rating: build list for this product --------
      const detailById = new Map(orderDetailsData.map(d => [d.id, d]));
      const productSizeById = new Map(productSizesData.map(ps => [ps.id, ps]));
      const ordersById = new Map(ordersData.map(o => [o.id, o]));
      const accountsById = new Map(accountsData.map(a => [a.id, a]));

      const productRatings = ratingsData
        .map(r => {
          const detail = detailById.get(r.order_detail_id);
          if (!detail) return null;
          const ps = productSizeById.get(detail.product_sizes_id);
          return { r, detail, ps };
        })
        .filter(x => x && x.ps && x.ps.product_id === parseInt(id))
        .map(({ r, detail }) => {
          const order = ordersById.get(detail.order_id);
          const account = order ? accountsById.get(order.account_id) : null;
          return {
            ...r,
            username: account?.username || "Người dùng"
          };
        });
      setRatings(productRatings);

      // Determine if current user can rate: must have a purchase (order_detail) for this product not yet rated
      if (currentUser?.id) {
        const myOrderIds = new Set(
          ordersData.filter(o => o.account_id === currentUser.id).map(o => o.id)
        );
        const myDetailsForProduct = orderDetailsData.filter(d => {
          if (!myOrderIds.has(d.order_id)) return false;
          const ps = productSizeById.get(d.product_sizes_id);
          return ps && ps.product_id === parseInt(id);
        });
        const ratedDetailIds = new Set(ratingsData.map(r => r.order_detail_id));
        const available = myDetailsForProduct.find(d => !ratedDetailIds.has(d.id));
        setEligibleOrderDetailId(available?.id || null);
      } else {
        setEligibleOrderDetailId(null);
      }
      
    } catch (err) {
      setError("Không thể tải thông tin sản phẩm");
      console.error("Lỗi:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProductDetail();
  }, [fetchProductDetail]);

  // Gửi đánh giá
  const handleAddRating = async () => {
    if (!isUser) {
      alert("Chỉ người dùng mới có thể đánh giá sản phẩm!");
      return;
    }
    if (!eligibleOrderDetailId) {
      alert("Bạn cần mua sản phẩm này trước khi đánh giá.");
      return;
    }
    if (!userRating.comment.trim()) {
      alert("Vui lòng nhập nội dung đánh giá!");
      return;
    }
    try {
      await createRating({
        rating_value: userRating.rating_value,
        comment: userRating.comment,
        order_detail_id: eligibleOrderDetailId
      });
      alert("✅ Đã gửi đánh giá thành công!");
      setUserRating({ rating_value: 5, comment: "" });
      fetchProductDetail();
    } catch (e) {
      console.error(e);
      alert("❌ Gửi đánh giá thất bại!");
    }
  };

  // ... phần còn lại của code giữ nguyên
  const handleAddToCart = () => {
    if (!selectedSize) {
      alert("Vui lòng chọn size!");
      return;
    }

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingItem = cart.find(item => 
      item.id === product.id && item.size === selectedSize
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        ...product,
        size: selectedSize,
        quantity: 1
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`🛒 Đã thêm "${product.name}" (Size: ${selectedSize}) vào giỏ hàng!`);
  };

  const handleAddSize = async () => {
    if (!selectedSize) {
      alert("Vui lòng chọn size!");
      return;
    }

    try {
      await createProductSize({
        product_id: parseInt(id),
        size_id: parseInt(selectedSize)
      });
      
      // Cập nhật lại danh sách size
      const productSizesData = await getAllProductSizes();
      const availableSizes = productSizesData.filter(ps => ps.product_id === parseInt(id));
      setProductSizes(availableSizes);
      
      alert("✅ Đã thêm size thành công!");
    } catch (err) {
      alert("❌ Thêm size thất bại!");
      console.error("Lỗi:", err);
    }
  };

  const handleRemoveSize = async (productSizeId) => {
    if (window.confirm("Bạn có chắc muốn xóa size này?")) {
      try {
        await deleteProductSize(productSizeId);
        
        // Cập nhật lại danh sách size
        const updatedSizes = productSizes.filter(ps => ps.id !== productSizeId);
        setProductSizes(updatedSizes);
        
        alert("✅ Đã xóa size thành công!");
      } catch (err) {
        alert("❌ Xóa size thất bại!");
        console.error("Lỗi:", err);
      }
    }
  };

  const isAdmin = JSON.parse(localStorage.getItem("user"))?.role === "admin";

  if (loading) return <div className="text-center py-10">Đang tải...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;
  if (!product) return <div className="text-center py-10">Sản phẩm không tồn tại</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Nút quay lại */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition"
      >
        ← Quay lại
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hình ảnh sản phẩm */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-96 object-cover"
          />
        </div>

        {/* Thông tin sản phẩm */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

          <div className="mb-6">
            <span className="text-2xl font-bold text-red-600">
              {Number(product.price).toLocaleString()} ₫
            </span>
          </div>

          {/* Chọn size */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Chọn size:</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {productSizes.map((ps) => {
                const size = sizes.find((s) => s.id === ps.size_id);
                return (
                  <div key={ps.id} className="relative">
                    <button
                      className={`px-4 py-2 border rounded-lg transition ${
                        selectedSize === size?.size
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-700 border-gray-300 hover:border-black"
                      }`}
                      onClick={() => setSelectedSize(size?.size)}
                    >
                      {size?.size}
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleRemoveSize(ps.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Thêm size mới (chỉ admin) */}
            {isAdmin && (
              <div className="flex gap-2 mb-4">
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 flex-1"
                >
                  <option value="">Chọn size</option>
                  {sizes.map((size) => (
                    <option key={size.id} value={size.id}>
                      {size.size}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddSize}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                >
                  Thêm size
                </button>
              </div>
            )}
          </div>

          {/* Nút thêm vào giỏ hàng */}
          <button
            onClick={handleAddToCart}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition mb-4"
          >
            🛒 Thêm vào giỏ hàng
          </button>

          {/* Mô tả sản phẩm */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-2">Mô tả sản phẩm</h3>
            <p className="text-gray-600 leading-relaxed">
              {product.description || "Không có mô tả cho sản phẩm này."}
            </p>
          </div>
        </div>
      </div>

      {/* Thông tin chi tiết */}
      <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Thông tin chi tiết</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Nhà sản xuất:</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Đặt may công theo tiêu chuẩn áo đấu chính hãng</li>
              <li>Xuất xứ: Việt Nam</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Chất liệu:</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Vải lưới kinh cao cấp (polyester co giãn 4 chiều)</li>
              <li>Mềm mịn, thấm hút mồ hôi tốt</li>
              <li>Thoáng mát - phù hợp sử dụng hàng ngày</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Đánh giá sản phẩm */}
      <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-2">Đánh giá sản phẩm</h2>
        <div className="mb-6 flex items-center gap-3">
          <span className="text-yellow-500 text-xl">
            {ratings.length > 0
              ? '★'.repeat(
                  Math.max(
                    1,
                    Math.round(
                      ratings.reduce((s, r) => s + (r.rating_value || 0), 0) /
                        ratings.length
                    )
                  )
                ).padEnd(5, '☆')
              : '☆☆☆☆☆'}
          </span>
          <span className="text-gray-600 text-sm">{ratings.length} đánh giá</span>
        </div>

        {isUser && (
          <div className="mb-8 p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Viết đánh giá của bạn</h3>
            {!eligibleOrderDetailId && (
              <p className="text-sm text-gray-500 mb-3">Bạn cần mua sản phẩm này để có thể đánh giá .</p>
            )}
            <div className="mb-4">
              <label className="block mb-2 font-medium">Điểm đánh giá:</label>
              <select
                value={userRating.rating_value}
                onChange={(e) =>
                  setUserRating({
                    ...userRating,
                    rating_value: parseInt(e.target.value),
                  })
                }
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value={5}>5 ★ - Rất tốt</option>
                <option value={4}>4 ★ - Tốt</option>
                <option value={3}>3 ★ - Bình thường</option>
                <option value={2}>2 ★ - Không hài lòng</option>
                <option value={1}>1 ★ - Rất tệ</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium">Nhận xét:</label>
              <textarea
                value={userRating.comment}
                onChange={(e) =>
                  setUserRating({ ...userRating, comment: e.target.value })
                }
                placeholder="Chia sẻ cảm nhận của bạn..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24"
              />
            </div>
            <button
              onClick={handleAddRating}
              disabled={!eligibleOrderDetailId}
              className={`px-6 py-2 rounded-lg text-white transition ${
                eligibleOrderDetailId
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Gửi đánh giá
            </button>
          </div>
        )}

        {/* Danh sách đánh giá */}
        <div className="space-y-6">
          {ratings.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Chưa có đánh giá nào cho sản phẩm này.
            </p>
          ) : (
            ratings.map((rating) => (
              <div
                key={rating.id}
                className="border-b border-gray-200 pb-6 last:border-b-0"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">
                        {rating.username || 'Người dùng'}
                      </span>
                      <span className="text-yellow-500">
                        {'★'.repeat(rating.rating_value)}
                        {'☆'.repeat(5 - rating.rating_value)}
                      </span>
                    </div>
                    {rating.created_at && (
                      <p className="text-gray-600 text-sm">
                        {new Date(rating.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-gray-800 mb-3">{rating.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}